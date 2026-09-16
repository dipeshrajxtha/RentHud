import { Kysely, sql } from 'kysely';

/**
 * Migration 00002: Day 3 Core Database Schema
 *
 * Creates all 15 core domain tables in dependency order:
 *   users → properties → property_units → rental_requests → tenancies
 *   → tenancy_disputes → early_termination_records → tenancy_reviews
 *   → listing_disputes → amenities → property_amenities → unit_amenities
 *   → photos → verification_badges → verifications
 *
 * Key architectural decisions enforced at the database level:
 *  - One-active-tenancy per tenant (partial unique index, §5.1)
 *  - One-active-tenancy per unit (partial unique index)
 *  - Roles array domain-constrained to ('tenant','landlord','admin')
 *  - Photo mutual-exclusion: belongs to property XOR unit (never both)
 *  - Verification mutual-exclusion: targets user XOR property (never both)
 *  - All delete behaviors are RESTRICT on legal/financial records
 *  - Cascade only on pure junction tables (amenity/photo tags)
 *  - early_termination_records.dispute_id → tenancy_disputes with ON DELETE SET NULL
 */
export async function up(db: Kysely<any>): Promise<void> {
  // ───────────────────────────────────────────────────────────────
  // TABLE 1: users
  // Central identity table. Roles constrained to a closed set.
  // is_active supports soft-deactivation (never hard-delete a user
  // with financial or tenancy history).
  // ───────────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
      google_id     VARCHAR(255)  UNIQUE,
      email         VARCHAR(255)  NOT NULL UNIQUE,
      name          VARCHAR(255)  NOT NULL,
      avatar_url    VARCHAR(1024),
      phone         VARCHAR(50),
      roles         TEXT[]        NOT NULL DEFAULT '{tenant}',
      is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
      created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
      CONSTRAINT chk_users_roles CHECK (roles <@ ARRAY['tenant','landlord','admin']::text[])
    );
  `.execute(db);

  await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS idx_users_google_id ON users (google_id) WHERE google_id IS NOT NULL`.execute(db);

  // ───────────────────────────────────────────────────────────────
  // TABLE 2: properties
  // Physical building asset. landlord_id ON DELETE RESTRICT —
  // a landlord account cannot be deleted while they own properties.
  // Use users.is_active=false for soft-deactivation.
  // ───────────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS properties (
      id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
      landlord_id   UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      title         VARCHAR(255)  NOT NULL,
      description   TEXT,
      address       VARCHAR(500)  NOT NULL,
      city          VARCHAR(100)  NOT NULL,
      postal_code   VARCHAR(20),
      location      GEOGRAPHY(Point, 4326) NOT NULL,
      total_floors  INTEGER       NOT NULL DEFAULT 1,
      is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
      created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
      CONSTRAINT chk_properties_total_floors CHECK (total_floors >= 1)
    );
  `.execute(db);

  await sql`CREATE INDEX IF NOT EXISTS idx_properties_landlord_id ON properties (landlord_id)`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS idx_properties_city ON properties (city)`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS idx_properties_is_active ON properties (is_active)`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS idx_properties_location_gist ON properties USING GIST (location)`.execute(db);

  // ───────────────────────────────────────────────────────────────
  // TABLE 3: property_units
  // Rentable entity within a property. property_id ON DELETE RESTRICT —
  // a property cannot be deleted while it has units (preserves
  // tenancy audit history). Use availability_status='UNAVAILABLE'
  // for deactivation.
  // ───────────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS property_units (
      id                    UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
      property_id           UUID            NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
      unit_identifier       VARCHAR(100)    NOT NULL,
      floor_number          INTEGER         NOT NULL DEFAULT 1,
      bedrooms              INTEGER         NOT NULL DEFAULT 1,
      bathrooms             INTEGER         NOT NULL DEFAULT 1,
      area_sqft             INTEGER,
      monthly_rent          NUMERIC(12, 2)  NOT NULL,
      security_deposit      NUMERIC(12, 2)  NOT NULL DEFAULT 0.00,
      availability_status   VARCHAR(50)     NOT NULL DEFAULT 'AVAILABLE',
      created_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
      updated_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
      CONSTRAINT uq_property_unit_identifier UNIQUE (property_id, unit_identifier),
      CONSTRAINT chk_unit_floor_number       CHECK (floor_number >= 0),
      CONSTRAINT chk_unit_bedrooms           CHECK (bedrooms >= 0),
      CONSTRAINT chk_unit_bathrooms          CHECK (bathrooms >= 0),
      CONSTRAINT chk_unit_area_sqft          CHECK (area_sqft IS NULL OR area_sqft > 0),
      CONSTRAINT chk_unit_monthly_rent       CHECK (monthly_rent > 0),
      CONSTRAINT chk_unit_security_deposit   CHECK (security_deposit >= 0),
      CONSTRAINT chk_unit_availability_status CHECK (
        availability_status IN ('AVAILABLE', 'RESERVED', 'PENDING_SIGNATURE', 'ON_RENT', 'UNAVAILABLE')
      )
    );
  `.execute(db);

  await sql`CREATE INDEX IF NOT EXISTS idx_property_units_property_id ON property_units (property_id)`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS idx_property_units_status ON property_units (availability_status)`.execute(db);

  // ───────────────────────────────────────────────────────────────
  // TABLE 4: rental_requests
  // Pre-tenancy application pipeline (Architecture §2, domain #10).
  // Separates the application state machine from the contractual
  // tenancy lifecycle. A tenancy is only created after approval.
  // ───────────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS rental_requests (
      id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
      unit_id           UUID          NOT NULL REFERENCES property_units(id) ON DELETE RESTRICT,
      tenant_id         UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      landlord_id       UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      status            VARCHAR(50)   NOT NULL DEFAULT 'pending',
      message           TEXT,
      proposed_move_in  DATE          NOT NULL,
      created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
      updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
      CONSTRAINT uq_rental_request_unit_tenant UNIQUE (unit_id, tenant_id),
      CONSTRAINT chk_rental_request_status CHECK (
        status IN ('pending', 'approved', 'rejected', 'cancelled')
      )
    );
  `.execute(db);

  await sql`CREATE INDEX IF NOT EXISTS idx_rental_requests_unit_id ON rental_requests (unit_id)`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS idx_rental_requests_tenant_id ON rental_requests (tenant_id)`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS idx_rental_requests_status ON rental_requests (status)`.execute(db);

  // ───────────────────────────────────────────────────────────────
  // TABLE 5: tenancies
  // Contractual lease binding. All delete behaviors are RESTRICT to
  // preserve financial and audit history indefinitely.
  //
  // Partial Unique Index 1 (Architecture §5.1):
  //   One active/pending_signature tenancy per tenant at a time.
  //
  // Partial Unique Index 2:
  //   One active/pending_signature tenancy per unit at a time.
  //   Prevents two tenants holding the same unit simultaneously.
  // ───────────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS tenancies (
      id                    UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
      unit_id               UUID            NOT NULL REFERENCES property_units(id) ON DELETE RESTRICT,
      tenant_id             UUID            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      landlord_id           UUID            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      rental_request_id     UUID            REFERENCES rental_requests(id) ON DELETE SET NULL,
      status                VARCHAR(50)     NOT NULL DEFAULT 'rental_requested',
      start_date            DATE            NOT NULL,
      end_date              DATE            NOT NULL,
      agreed_monthly_rent   NUMERIC(12, 2)  NOT NULL,
      agreed_deposit        NUMERIC(12, 2)  NOT NULL DEFAULT 0.00,
      signed_at             TIMESTAMPTZ,
      terminated_at         TIMESTAMPTZ,
      created_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
      updated_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
      CONSTRAINT chk_tenancy_status CHECK (
        status IN (
          'rental_requested',
          'application_rejected',
          'application_cancelled',
          'pending_signature',
          'active',
          'completed',
          'terminated_early'
        )
      ),
      CONSTRAINT chk_tenancy_dates         CHECK (start_date < end_date),
      CONSTRAINT chk_tenancy_monthly_rent  CHECK (agreed_monthly_rent > 0),
      CONSTRAINT chk_tenancy_deposit       CHECK (agreed_deposit >= 0)
    );
  `.execute(db);

  // Partial unique index — one active/pending tenancy per tenant (Architecture §5.1)
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_tenancy_per_tenant
    ON tenancies (tenant_id)
    WHERE status IN ('active', 'pending_signature');
  `.execute(db);

  // Partial unique index — one active/pending tenancy per unit
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_tenancy_per_unit
    ON tenancies (unit_id)
    WHERE status IN ('active', 'pending_signature');
  `.execute(db);

  await sql`CREATE INDEX IF NOT EXISTS idx_tenancies_unit_id ON tenancies (unit_id)`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS idx_tenancies_tenant_id ON tenancies (tenant_id)`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS idx_tenancies_landlord_id ON tenancies (landlord_id)`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS idx_tenancies_status ON tenancies (status)`.execute(db);

  // ───────────────────────────────────────────────────────────────
  // TABLE 6: tenancy_disputes
  // Must be created before early_termination_records which FK-references it.
  // ON DELETE RESTRICT — tenancy disputes are legal records that must
  // outlive individual user accounts.
  // ───────────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS tenancy_disputes (
      id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
      tenancy_id          UUID            NOT NULL REFERENCES tenancies(id) ON DELETE RESTRICT,
      raised_by_id        UUID            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      category            VARCHAR(100)    NOT NULL,
      title               VARCHAR(255)    NOT NULL,
      description         TEXT            NOT NULL,
      claim_amount        NUMERIC(12, 2)  NOT NULL DEFAULT 0.00,
      evidence_urls       TEXT[]          NOT NULL DEFAULT '{}',
      status              VARCHAR(50)     NOT NULL DEFAULT 'OPEN',
      resolution_summary  TEXT,
      resolved_by         UUID            REFERENCES users(id) ON DELETE SET NULL,
      resolved_at         TIMESTAMPTZ,
      created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
      updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
      CONSTRAINT chk_tenancy_dispute_status CHECK (
        status IN ('OPEN', 'IN_MEDIATION', 'RESOLVED_MUTUAL', 'RESOLVED_ARBITRATED', 'ESCALATED')
      ),
      CONSTRAINT chk_tenancy_dispute_claim CHECK (claim_amount >= 0)
    );
  `.execute(db);

  await sql`CREATE INDEX IF NOT EXISTS idx_tenancy_disputes_tenancy_id ON tenancy_disputes (tenancy_id)`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS idx_tenancy_disputes_status ON tenancy_disputes (status)`.execute(db);

  // ───────────────────────────────────────────────────────────────
  // TABLE 7: early_termination_records
  // One per tenancy (UNIQUE tenancy_id). dispute_id is optional FK
  // to tenancy_disputes — ON DELETE SET NULL so the exit survey
  // survives even if the dispute record is later expunged.
  // ───────────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS early_termination_records (
      id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      tenancy_id    UUID        NOT NULL UNIQUE REFERENCES tenancies(id) ON DELETE RESTRICT,
      initiator_id  UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      reason_code   VARCHAR(100) NOT NULL,
      narrative     TEXT        NOT NULL,
      dispute_id    UUID        REFERENCES tenancy_disputes(id) ON DELETE SET NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `.execute(db);

  await sql`CREATE INDEX IF NOT EXISTS idx_early_termination_tenancy_id ON early_termination_records (tenancy_id)`.execute(db);

  // ───────────────────────────────────────────────────────────────
  // TABLE 8: tenancy_reviews
  // Only tenants who completed a tenancy write a review (enforced at
  // application layer: author_id must equal tenancy.tenant_id).
  // ON DELETE RESTRICT — cannot delete a tenancy that has a review;
  // this prevents reputation gaming via historical record deletion.
  // ───────────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS tenancy_reviews (
      id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      tenancy_id            UUID        NOT NULL UNIQUE REFERENCES tenancies(id) ON DELETE RESTRICT,
      property_id           UUID        NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
      author_id             UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      rating                INTEGER     NOT NULL,
      cleanliness_rating    INTEGER,
      communication_rating  INTEGER,
      review_text           TEXT,
      amenities_feedback    TEXT,
      created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT chk_review_rating               CHECK (rating >= 1 AND rating <= 5),
      CONSTRAINT chk_review_cleanliness_rating   CHECK (cleanliness_rating IS NULL OR (cleanliness_rating >= 1 AND cleanliness_rating <= 5)),
      CONSTRAINT chk_review_communication_rating CHECK (communication_rating IS NULL OR (communication_rating >= 1 AND communication_rating <= 5))
    );
  `.execute(db);

  await sql`CREATE INDEX IF NOT EXISTS idx_tenancy_reviews_property_id ON tenancy_reviews (property_id)`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS idx_tenancy_reviews_author_id ON tenancy_reviews (author_id)`.execute(db);

  // ───────────────────────────────────────────────────────────────
  // TABLE 9: listing_disputes
  // Anti-fraud, marketplace integrity records targeting properties.
  // property_id ON DELETE RESTRICT — a fraudulent property cannot be
  // physically deleted while disputes are open; use is_active=false.
  // ───────────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS listing_disputes (
      id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      property_id   UUID        NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
      reporter_id   UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      reason        VARCHAR(100) NOT NULL,
      description   TEXT        NOT NULL,
      evidence_urls TEXT[]      NOT NULL DEFAULT '{}',
      status        VARCHAR(50) NOT NULL DEFAULT 'OPEN',
      admin_notes   TEXT,
      resolved_by   UUID        REFERENCES users(id) ON DELETE SET NULL,
      resolved_at   TIMESTAMPTZ,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT chk_listing_dispute_status CHECK (
        status IN ('OPEN', 'UNDER_INVESTIGATION', 'RESOLVED_DELISTED', 'RESOLVED_DISMISSED')
      )
    );
  `.execute(db);

  await sql`CREATE INDEX IF NOT EXISTS idx_listing_disputes_property_id ON listing_disputes (property_id)`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS idx_listing_disputes_status ON listing_disputes (status)`.execute(db);

  // ───────────────────────────────────────────────────────────────
  // TABLE 10: amenities
  // Normalized catalog. Category constrained to ('building','unit','general').
  // ───────────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS amenities (
      id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      name        VARCHAR(100) NOT NULL UNIQUE,
      slug        VARCHAR(100) NOT NULL UNIQUE,
      category    VARCHAR(50) NOT NULL DEFAULT 'general',
      icon        VARCHAR(100),
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT chk_amenity_category CHECK (category IN ('building', 'unit', 'general'))
    );
  `.execute(db);

  // ───────────────────────────────────────────────────────────────
  // TABLE 11: property_amenities (junction)
  // Both FKs CASCADE — removing a property or amenity type removes
  // the assignment tag (not the underlying entity).
  // ───────────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS property_amenities (
      property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      amenity_id  UUID NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
      PRIMARY KEY (property_id, amenity_id)
    );
  `.execute(db);

  // ───────────────────────────────────────────────────────────────
  // TABLE 12: unit_amenities (junction)
  // ───────────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS unit_amenities (
      unit_id     UUID NOT NULL REFERENCES property_units(id) ON DELETE CASCADE,
      amenity_id  UUID NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
      PRIMARY KEY (unit_id, amenity_id)
    );
  `.execute(db);

  // ───────────────────────────────────────────────────────────────
  // TABLE 13: photos
  // A photo belongs to EXACTLY ONE entity: either a property (building-
  // level) or a property unit — enforced via mutual-exclusion CHECK.
  // uploaded_by is RESTRICT — we never want to lose who uploaded media.
  // ───────────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS photos (
      id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      property_id   UUID        REFERENCES properties(id) ON DELETE CASCADE,
      unit_id       UUID        REFERENCES property_units(id) ON DELETE CASCADE,
      uploaded_by   UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      url           VARCHAR(1024) NOT NULL,
      caption       VARCHAR(255),
      is_cover      BOOLEAN     NOT NULL DEFAULT FALSE,
      display_order INTEGER     NOT NULL DEFAULT 0,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT chk_photo_entity CHECK (
        (property_id IS NOT NULL AND unit_id IS NULL) OR
        (unit_id IS NOT NULL AND property_id IS NULL)
      )
    );
  `.execute(db);

  await sql`CREATE INDEX IF NOT EXISTS idx_photos_property_id ON photos (property_id) WHERE property_id IS NOT NULL`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS idx_photos_unit_id ON photos (unit_id) WHERE unit_id IS NOT NULL`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS idx_photos_uploaded_by ON photos (uploaded_by)`.execute(db);

  // ───────────────────────────────────────────────────────────────
  // TABLE 14: verification_badges
  // Static catalog of badge types. ON DELETE RESTRICT prevents
  // removing a badge type that has active verifications attached.
  // ───────────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS verification_badges (
      id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      code        VARCHAR(100) NOT NULL UNIQUE,
      name        VARCHAR(255) NOT NULL,
      description TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `.execute(db);

  // ───────────────────────────────────────────────────────────────
  // TABLE 15: verifications
  // Targets either a user (KYC/landlord identity) or a property
  // (ownership/inspection), never both — mutual-exclusion CHECK.
  // All FKs are RESTRICT — verification records are KYC/legal
  // documents that must outlive individual entity lifecycles.
  // badge_id ON DELETE RESTRICT — cannot delete a badge type in use.
  // verified_by ON DELETE SET NULL — admin who verified may be
  // removed but the verification record must survive.
  // ───────────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS verifications (
      id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id           UUID        REFERENCES users(id) ON DELETE RESTRICT,
      property_id       UUID        REFERENCES properties(id) ON DELETE RESTRICT,
      badge_id          UUID        NOT NULL REFERENCES verification_badges(id) ON DELETE RESTRICT,
      status            VARCHAR(50) NOT NULL DEFAULT 'PENDING',
      document_url      VARCHAR(1024),
      verified_by       UUID        REFERENCES users(id) ON DELETE SET NULL,
      verified_at       TIMESTAMPTZ,
      rejection_reason  TEXT,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT chk_verification_target CHECK (
        (user_id IS NOT NULL AND property_id IS NULL) OR
        (property_id IS NOT NULL AND user_id IS NULL)
      ),
      CONSTRAINT chk_verification_status CHECK (
        status IN ('PENDING', 'VERIFIED', 'REJECTED')
      )
    );
  `.execute(db);

  await sql`CREATE INDEX IF NOT EXISTS idx_verifications_user_id ON verifications (user_id) WHERE user_id IS NOT NULL`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS idx_verifications_property_id ON verifications (property_id) WHERE property_id IS NOT NULL`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS idx_verifications_status ON verifications (status)`.execute(db);
}

/**
 * Drops all 15 tables in strict reverse dependency order to avoid FK violations.
 */
export async function down(db: Kysely<any>): Promise<void> {
  // Drop dependents first, then their parents
  await sql`DROP TABLE IF EXISTS verifications`.execute(db);
  await sql`DROP TABLE IF EXISTS verification_badges`.execute(db);
  await sql`DROP TABLE IF EXISTS photos`.execute(db);
  await sql`DROP TABLE IF EXISTS unit_amenities`.execute(db);
  await sql`DROP TABLE IF EXISTS property_amenities`.execute(db);
  await sql`DROP TABLE IF EXISTS amenities`.execute(db);
  await sql`DROP TABLE IF EXISTS listing_disputes`.execute(db);
  await sql`DROP TABLE IF EXISTS tenancy_reviews`.execute(db);
  await sql`DROP TABLE IF EXISTS early_termination_records`.execute(db);
  await sql`DROP TABLE IF EXISTS tenancy_disputes`.execute(db);
  await sql`DROP TABLE IF EXISTS tenancies`.execute(db);
  await sql`DROP TABLE IF EXISTS rental_requests`.execute(db);
  await sql`DROP TABLE IF EXISTS property_units`.execute(db);
  await sql`DROP TABLE IF EXISTS properties`.execute(db);
  await sql`DROP TABLE IF EXISTS users`.execute(db);
}
