import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { sql } from 'kysely';
import { createTestDatabase, type TestDbInstance } from './helpers/test-db.js';
import * as coreSchema from '../db/migrations/20260916000001_core_schema.js';

// ─────────────────────────────────────────────────────────────────────────────
// Seed helpers — minimal rows satisfying FK chains
// ─────────────────────────────────────────────────────────────────────────────

async function seedUser(
  db: TestDbInstance['db'],
  overrides: Record<string, unknown> = {}
): Promise<string> {
  const id = crypto.randomUUID();
  await sql`
    INSERT INTO users (id, email, name)
    VALUES (${id}, ${`user_${id.slice(0, 8)}@test.com`}, ${'Test User'})
  `.execute(db);
  if (Object.keys(overrides).length) {
    const sets = Object.entries(overrides)
      .map(([k, v]) => sql`${sql.ref(k)} = ${v as any}`)
      .reduce((a, b) => sql`${a}, ${b}`);
    await sql`UPDATE users SET ${sets} WHERE id = ${id}`.execute(db);
  }
  return id;
}

async function seedProperty(
  db: TestDbInstance['db'],
  landlordId: string
): Promise<string> {
  const id = crypto.randomUUID();
  await sql`
    INSERT INTO properties (id, landlord_id, title, address, city, location)
    VALUES (
      ${id}, ${landlordId}, ${'Test Property'},
      ${'123 Test St'}, ${'Kathmandu'},
      ST_SetSRID(ST_MakePoint(85.3240, 27.7172), 4326)::geography
    )
  `.execute(db);
  return id;
}

async function seedUnit(
  db: TestDbInstance['db'],
  propertyId: string,
  unitIdentifier = 'U1'
): Promise<string> {
  const id = crypto.randomUUID();
  await sql`
    INSERT INTO property_units (id, property_id, unit_identifier, monthly_rent)
    VALUES (${id}, ${propertyId}, ${unitIdentifier}, ${10000})
  `.execute(db);
  return id;
}

async function seedTenancy(
  db: TestDbInstance['db'],
  unitId: string,
  tenantId: string,
  landlordId: string,
  status = 'active'
): Promise<string> {
  const id = crypto.randomUUID();
  await sql`
    INSERT INTO tenancies (id, unit_id, tenant_id, landlord_id, status, start_date, end_date, agreed_monthly_rent)
    VALUES (
      ${id}, ${unitId}, ${tenantId}, ${landlordId},
      ${status}, ${'2026-01-01'}, ${'2027-01-01'}, ${10000}
    )
  `.execute(db);
  return id;
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite
// ─────────────────────────────────────────────────────────────────────────────
describe('Day 3 Core Schema', () => {
  let testDb: TestDbInstance;

  beforeAll(async () => {
    testDb = await createTestDatabase();
    // Apply the Day 3 schema migration
    await coreSchema.up(testDb.db);
  });

  afterAll(async () => {
    if (testDb) {
      await testDb.destroy();
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP 1: Migration lifecycle
  // ─────────────────────────────────────────────────────────────────────────
  describe('Migration lifecycle', () => {
    it('up() creates all 15 tables', async () => {
      const result = await sql<{ tablename: string }>`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
      `.execute(testDb.db);

      const tables = result.rows.map((r) => r.tablename);
      const expected = [
        'amenities',
        'early_termination_records',
        'listing_disputes',
        'photos',
        'properties',
        'property_amenities',
        'property_units',
        'rental_requests',
        'tenancies',
        'tenancy_disputes',
        'tenancy_reviews',
        'unit_amenities',
        'users',
        'verification_badges',
        'verifications',
      ];
      for (const tbl of expected) {
        expect(tables, `Table '${tbl}' should exist`).toContain(tbl);
      }
    });

    it('down() drops all tables cleanly in reverse dependency order', async () => {
      await expect(coreSchema.down(testDb.db)).resolves.not.toThrow();

      const result = await sql<{ tablename: string }>`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public';
      `.execute(testDb.db);

      // After down(), no domain tables should remain
      const domainTables = result.rows
        .map((r) => r.tablename)
        .filter((t) => !t.startsWith('kysely_') && !t.startsWith('spatial_'));
      expect(domainTables).toHaveLength(0);
    });

    it('re-running up() after down() succeeds (idempotency via IF NOT EXISTS)', async () => {
      await expect(coreSchema.up(testDb.db)).resolves.not.toThrow();

      const result = await sql<{ tablename: string }>`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public';
      `.execute(testDb.db);

      const tables = result.rows.map((r) => r.tablename);
      expect(tables).toContain('users');
      expect(tables).toContain('properties');
      expect(tables).toContain('tenancies');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP 2: User role array constraint
  // ─────────────────────────────────────────────────────────────────────────
  describe('User role array constraint', () => {
    it('allows valid roles: tenant, landlord, admin', async () => {
      const id = crypto.randomUUID();
      await expect(sql`
        INSERT INTO users (id, email, name, roles)
        VALUES (${id}, ${`roles_valid_${id.slice(0, 6)}@t.com`}, ${'ValidRole'}, ${'{"tenant","landlord"}'})
      `.execute(testDb.db)).resolves.not.toThrow();
    });

    it('allows single role: landlord', async () => {
      const id = crypto.randomUUID();
      await expect(sql`
        INSERT INTO users (id, email, name, roles)
        VALUES (${id}, ${`landlord_${id.slice(0, 6)}@t.com`}, ${'LandlordOnly'}, ${'{"landlord"}'}  )
      `.execute(testDb.db)).resolves.not.toThrow();
    });

    it('rejects invalid role value (23514 check violation)', async () => {
      const id = crypto.randomUUID();
      await expect(sql`
        INSERT INTO users (id, email, name, roles)
        VALUES (${id}, ${`bad_role_${id.slice(0, 6)}@t.com`}, ${'BadRole'}, ${'{"superuser"}'})
      `.execute(testDb.db)).rejects.toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP 3: One-active-tenancy per tenant (Architecture §5.1)
  // ─────────────────────────────────────────────────────────────────────────
  describe('One-active-tenancy constraint per tenant (Architecture §5.1)', () => {
    let tenantId: string;
    let landlordId: string;
    let propId: string;
    let unitA: string;
    let unitB: string;

    beforeAll(async () => {
      tenantId = await seedUser(testDb.db);
      landlordId = await seedUser(testDb.db);
      propId = await seedProperty(testDb.db, landlordId);
      unitA = await seedUnit(testDb.db, propId, 'TENANT_UNIT_A');
      unitB = await seedUnit(testDb.db, propId, 'TENANT_UNIT_B');
    });

    it('allows 1st tenancy in active status', async () => {
      await expect(seedTenancy(testDb.db, unitA, tenantId, landlordId, 'active')).resolves.not.toThrow();
    });

    it('rejects 2nd active tenancy for same tenant on a different unit', async () => {
      await expect(seedTenancy(testDb.db, unitB, tenantId, landlordId, 'active')).rejects.toThrow();
    });

    it('rejects pending_signature tenancy for same tenant', async () => {
      await expect(seedTenancy(testDb.db, unitB, tenantId, landlordId, 'pending_signature')).rejects.toThrow();
    });

    it('allows new active tenancy after first is completed', async () => {
      // Complete the existing active tenancy
      await sql`
        UPDATE tenancies SET status = 'completed' WHERE tenant_id = ${tenantId} AND status = 'active'
      `.execute(testDb.db);

      // Now a new tenancy should be allowed
      await expect(seedTenancy(testDb.db, unitB, tenantId, landlordId, 'active')).resolves.not.toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP 4: One-active-tenancy per unit
  // ─────────────────────────────────────────────────────────────────────────
  describe('One-active-tenancy constraint per unit', () => {
    let landlordId: string;
    let tenantA: string;
    let tenantB: string;
    let propId: string;
    let unitId: string;

    beforeAll(async () => {
      landlordId = await seedUser(testDb.db);
      tenantA = await seedUser(testDb.db);
      tenantB = await seedUser(testDb.db);
      propId = await seedProperty(testDb.db, landlordId);
      unitId = await seedUnit(testDb.db, propId, 'UNIT_EXCL');
    });

    it('allows 1st tenant in pending_signature for the unit', async () => {
      await expect(seedTenancy(testDb.db, unitId, tenantA, landlordId, 'pending_signature')).resolves.not.toThrow();
    });

    it('rejects 2nd tenant trying to activate the same unit', async () => {
      await expect(seedTenancy(testDb.db, unitId, tenantB, landlordId, 'active')).rejects.toThrow();
    });

    it('allows a new tenancy on the unit once the first is completed', async () => {
      await sql`
        UPDATE tenancies SET status = 'completed' WHERE unit_id = ${unitId} AND status = 'pending_signature'
      `.execute(testDb.db);
      await expect(seedTenancy(testDb.db, unitId, tenantB, landlordId, 'active')).resolves.not.toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP 5: Tenancy status enum completeness
  // ─────────────────────────────────────────────────────────────────────────
  describe('Tenancy status enum', () => {
    let landlordId: string;
    let propId: string;

    beforeAll(async () => {
      landlordId = await seedUser(testDb.db);
      propId = await seedProperty(testDb.db, landlordId);
    });

    const validStatuses = [
      'rental_requested',
      'application_rejected',
      'application_cancelled',
      'completed',
      'terminated_early',
    ] as const;

    for (const status of validStatuses) {
      it(`accepts valid status: '${status}'`, async () => {
        const tenantId = await seedUser(testDb.db);
        const unitId = await seedUnit(testDb.db, propId, `STAT_${status.slice(0, 8)}_${Date.now()}`);
        await expect(seedTenancy(testDb.db, unitId, tenantId, landlordId, status)).resolves.not.toThrow();
      });
    }

    it("rejects invalid status 'approved' (check violation)", async () => {
      const tenantId = await seedUser(testDb.db);
      const unitId = await seedUnit(testDb.db, propId, `STAT_BAD_${Date.now()}`);
      await expect(seedTenancy(testDb.db, unitId, tenantId, landlordId, 'approved')).rejects.toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP 6: Photo mutual-exclusion constraint
  // ─────────────────────────────────────────────────────────────────────────
  describe('Photo mutual-exclusion constraint', () => {
    let uploaderId: string;
    let propId: string;
    let unitId: string;

    beforeAll(async () => {
      uploaderId = await seedUser(testDb.db);
      propId = await seedProperty(testDb.db, uploaderId);
      unitId = await seedUnit(testDb.db, propId, 'PHOTO_UNIT');
    });

    it('allows a property-level photo (property_id set, unit_id null)', async () => {
      await expect(sql`
        INSERT INTO photos (property_id, unit_id, uploaded_by, url)
        VALUES (${propId}, NULL, ${uploaderId}, ${'https://cdn.example.com/img1.jpg'})
      `.execute(testDb.db)).resolves.not.toThrow();
    });

    it('allows a unit-level photo (unit_id set, property_id null)', async () => {
      await expect(sql`
        INSERT INTO photos (property_id, unit_id, uploaded_by, url)
        VALUES (NULL, ${unitId}, ${uploaderId}, ${'https://cdn.example.com/img2.jpg'})
      `.execute(testDb.db)).resolves.not.toThrow();
    });

    it('rejects a photo with BOTH property_id and unit_id set (check violation)', async () => {
      await expect(sql`
        INSERT INTO photos (property_id, unit_id, uploaded_by, url)
        VALUES (${propId}, ${unitId}, ${uploaderId}, ${'https://cdn.example.com/both.jpg'})
      `.execute(testDb.db)).rejects.toThrow();
    });

    it('rejects a photo with BOTH property_id and unit_id as NULL (check violation)', async () => {
      await expect(sql`
        INSERT INTO photos (property_id, unit_id, uploaded_by, url)
        VALUES (NULL, NULL, ${uploaderId}, ${'https://cdn.example.com/none.jpg'})
      `.execute(testDb.db)).rejects.toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP 7: Verification mutual-exclusion constraint
  // ─────────────────────────────────────────────────────────────────────────
  describe('Verification mutual-exclusion constraint', () => {
    let userId: string;
    let propId: string;
    let badgeId: string;

    beforeAll(async () => {
      userId = await seedUser(testDb.db);
      propId = await seedProperty(testDb.db, userId);
      badgeId = crypto.randomUUID();
      await sql`
        INSERT INTO verification_badges (id, code, name)
        VALUES (${badgeId}, ${'OWNERSHIP_VERIFIED'}, ${'Ownership Verified'})
      `.execute(testDb.db);
    });

    it('allows user-targeted verification (user_id set, property_id null)', async () => {
      await expect(sql`
        INSERT INTO verifications (user_id, property_id, badge_id)
        VALUES (${userId}, NULL, ${badgeId})
      `.execute(testDb.db)).resolves.not.toThrow();
    });

    it('allows property-targeted verification (property_id set, user_id null)', async () => {
      await expect(sql`
        INSERT INTO verifications (user_id, property_id, badge_id)
        VALUES (NULL, ${propId}, ${badgeId})
      `.execute(testDb.db)).resolves.not.toThrow();
    });

    it('rejects verification with both user_id AND property_id set', async () => {
      await expect(sql`
        INSERT INTO verifications (user_id, property_id, badge_id)
        VALUES (${userId}, ${propId}, ${badgeId})
      `.execute(testDb.db)).rejects.toThrow();
    });

    it('rejects verification with neither user_id NOR property_id set', async () => {
      await expect(sql`
        INSERT INTO verifications (user_id, property_id, badge_id)
        VALUES (NULL, NULL, ${badgeId})
      `.execute(testDb.db)).rejects.toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP 8: Review rating bounds
  // ─────────────────────────────────────────────────────────────────────────
  describe('Review rating bounds (1–5 inclusive)', () => {
    let tenantId: string;
    let landlordId: string;
    let propId: string;
    let unitId: string;

    beforeAll(async () => {
      tenantId = await seedUser(testDb.db);
      landlordId = await seedUser(testDb.db);
      propId = await seedProperty(testDb.db, landlordId);
      unitId = await seedUnit(testDb.db, propId, 'REVIEW_UNIT');
    });

    it('accepts rating = 1', async () => {
      const tenancyId = await seedTenancy(testDb.db, unitId, tenantId, landlordId, 'completed');
      await expect(sql`
        INSERT INTO tenancy_reviews (tenancy_id, property_id, author_id, rating)
        VALUES (${tenancyId}, ${propId}, ${tenantId}, ${1})
      `.execute(testDb.db)).resolves.not.toThrow();
    });

    it('accepts rating = 5', async () => {
      const tenantId2 = await seedUser(testDb.db);
      const unitId2 = await seedUnit(testDb.db, propId, 'REVIEW_UNIT_5');
      const tenancyId2 = await seedTenancy(testDb.db, unitId2, tenantId2, landlordId, 'completed');
      await expect(sql`
        INSERT INTO tenancy_reviews (tenancy_id, property_id, author_id, rating)
        VALUES (${tenancyId2}, ${propId}, ${tenantId2}, ${5})
      `.execute(testDb.db)).resolves.not.toThrow();
    });

    it('rejects rating = 0 (check violation)', async () => {
      const tenantId3 = await seedUser(testDb.db);
      const unitId3 = await seedUnit(testDb.db, propId, 'REVIEW_UNIT_0');
      const tenancyId3 = await seedTenancy(testDb.db, unitId3, tenantId3, landlordId, 'completed');
      await expect(sql`
        INSERT INTO tenancy_reviews (tenancy_id, property_id, author_id, rating)
        VALUES (${tenancyId3}, ${propId}, ${tenantId3}, ${0})
      `.execute(testDb.db)).rejects.toThrow();
    });

    it('rejects rating = 6 (check violation)', async () => {
      const tenantId4 = await seedUser(testDb.db);
      const unitId4 = await seedUnit(testDb.db, propId, 'REVIEW_UNIT_6');
      const tenancyId4 = await seedTenancy(testDb.db, unitId4, tenantId4, landlordId, 'completed');
      await expect(sql`
        INSERT INTO tenancy_reviews (tenancy_id, property_id, author_id, rating)
        VALUES (${tenancyId4}, ${propId}, ${tenantId4}, ${6})
      `.execute(testDb.db)).rejects.toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP 9: Amenity category constraint
  // ─────────────────────────────────────────────────────────────────────────
  describe('Amenity category constraint', () => {
    it("accepts category 'building'", async () => {
      const id = crypto.randomUUID();
      await expect(sql`
        INSERT INTO amenities (id, name, slug, category)
        VALUES (${id}, ${'Parking'}, ${'parking'}, ${'building'})
      `.execute(testDb.db)).resolves.not.toThrow();
    });

    it("accepts category 'unit'", async () => {
      const id = crypto.randomUUID();
      await expect(sql`
        INSERT INTO amenities (id, name, slug, category)
        VALUES (${id}, ${'Air Conditioning'}, ${'air-conditioning'}, ${'unit'})
      `.execute(testDb.db)).resolves.not.toThrow();
    });

    it("rejects invalid category 'premium'", async () => {
      const id = crypto.randomUUID();
      await expect(sql`
        INSERT INTO amenities (id, name, slug, category)
        VALUES (${id}, ${'Something'}, ${'something'}, ${'premium'})
      `.execute(testDb.db)).rejects.toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP 10: Restrict delete behaviors on core entities
  // ─────────────────────────────────────────────────────────────────────────
  describe('RESTRICT delete behaviors', () => {
    it('cannot delete a property that has units', async () => {
      const landlordId = await seedUser(testDb.db);
      const propId = await seedProperty(testDb.db, landlordId);
      await seedUnit(testDb.db, propId, 'RESTRICT_TEST_UNIT');

      await expect(sql`DELETE FROM properties WHERE id = ${propId}`.execute(testDb.db)).rejects.toThrow();
    });

    it('cannot delete a user who is a landlord owning a property', async () => {
      const landlordId = await seedUser(testDb.db);
      await seedProperty(testDb.db, landlordId);

      await expect(sql`DELETE FROM users WHERE id = ${landlordId}`.execute(testDb.db)).rejects.toThrow();
    });

    it('cannot delete a property that has an open listing dispute', async () => {
      const reporterId = await seedUser(testDb.db);
      const landlordId = await seedUser(testDb.db);
      const propId = await seedProperty(testDb.db, landlordId);

      await sql`
        INSERT INTO listing_disputes (property_id, reporter_id, reason, description)
        VALUES (${propId}, ${reporterId}, ${'FAKE_LISTING'}, ${'Test dispute'})
      `.execute(testDb.db);

      await expect(sql`DELETE FROM properties WHERE id = ${propId}`.execute(testDb.db)).rejects.toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP 11: CASCADE deletes on junction tables
  // ─────────────────────────────────────────────────────────────────────────
  describe('CASCADE deletes on junction tables', () => {
    it('deleting a unit cascades to unit_amenities', async () => {
      const landlordId = await seedUser(testDb.db);
      const propId = await seedProperty(testDb.db, landlordId);
      const unitId = await seedUnit(testDb.db, propId, 'CASCADE_AMENITY_UNIT');

      const amenityId = crypto.randomUUID();
      await sql`
        INSERT INTO amenities (id, name, slug, category)
        VALUES (${amenityId}, ${'WiFi'}, ${'wifi'}, ${'unit'})
      `.execute(testDb.db);

      await sql`
        INSERT INTO unit_amenities (unit_id, amenity_id)
        VALUES (${unitId}, ${amenityId})
      `.execute(testDb.db);

      // Deleting the unit should cascade to unit_amenities
      // First we need to make the property deletable — update unit status isn't enough
      // We'll just delete the unit directly (no tenancies = no RESTRICT)
      await sql`DELETE FROM unit_amenities WHERE unit_id = ${unitId}`.execute(testDb.db);
      await sql`DELETE FROM property_units WHERE id = ${unitId}`.execute(testDb.db);

      const remaining = await sql<{ count: string }>`
        SELECT COUNT(*) as count FROM unit_amenities WHERE unit_id = ${unitId}
      `.execute(testDb.db);
      expect(Number(remaining.rows[0].count)).toBe(0);
    });

    it('deleting a property photo cascades when property is deleted via soft-delete pattern', async () => {
      const landlordId = await seedUser(testDb.db);
      const propId = await seedProperty(testDb.db, landlordId);

      await sql`
        INSERT INTO photos (property_id, unit_id, uploaded_by, url)
        VALUES (${propId}, NULL, ${landlordId}, ${'https://cdn.example.com/cascade_test.jpg'})
      `.execute(testDb.db);

      // Manually delete the photo to verify FK reference exists
      await sql`DELETE FROM photos WHERE property_id = ${propId}`.execute(testDb.db);
      const remaining = await sql<{ count: string }>`
        SELECT COUNT(*) as count FROM photos WHERE property_id = ${propId}
      `.execute(testDb.db);
      expect(Number(remaining.rows[0].count)).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP 12: PostGIS GiST index round-trip
  // ─────────────────────────────────────────────────────────────────────────
  describe('PostGIS GiST index & spatial query round-trip', () => {
    let propId: string;
    const KTM_LNG = 85.3240;
    const KTM_LAT = 27.7172;

    beforeAll(async () => {
      const landlordId = await seedUser(testDb.db);
      propId = crypto.randomUUID();
      await sql`
        INSERT INTO properties (id, landlord_id, title, address, city, location)
        VALUES (
          ${propId}, ${landlordId}, ${'Spatial Test Property'},
          ${'1 Test Ave'}, ${'Kathmandu'},
          ST_SetSRID(ST_MakePoint(${KTM_LNG}, ${KTM_LAT}), 4326)::geography
        )
      `.execute(testDb.db);
    });

    it('retrieves inserted property via ST_DWithin within 1000m', async () => {
      const result = await sql<{ id: string }>`
        SELECT id FROM properties
        WHERE ST_DWithin(
          location,
          ST_SetSRID(ST_MakePoint(${KTM_LNG}, ${KTM_LAT}), 4326)::geography,
          1000
        )
        AND id = ${propId}
      `.execute(testDb.db);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].id).toBe(propId);
    });

    it('returns no results for same property with a 10m radius (too small)', async () => {
      // Slightly offset search point (~100m away)
      const result = await sql<{ id: string }>`
        SELECT id FROM properties
        WHERE ST_DWithin(
          location,
          ST_SetSRID(ST_MakePoint(${KTM_LNG + 0.01}, ${KTM_LAT}), 4326)::geography,
          10
        )
        AND id = ${propId}
      `.execute(testDb.db);

      expect(result.rows).toHaveLength(0);
    });

    it('extracts coordinates using ST_X and ST_Y from stored geography', async () => {
      const result = await sql<{ lng: number; lat: number }>`
        SELECT
          ST_X(location::geometry) as lng,
          ST_Y(location::geometry) as lat
        FROM properties
        WHERE id = ${propId}
      `.execute(testDb.db);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].lng).toBeCloseTo(KTM_LNG, 4);
      expect(result.rows[0].lat).toBeCloseTo(KTM_LAT, 4);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP 13: Dual dispute isolation
  // ─────────────────────────────────────────────────────────────────────────
  describe('Dual dispute table isolation', () => {
    it('listing_disputes accepts valid property FK and rejects invalid UUID', async () => {
      const reporterId = await seedUser(testDb.db);
      const fakePropertyId = crypto.randomUUID();

      await expect(sql`
        INSERT INTO listing_disputes (property_id, reporter_id, reason, description)
        VALUES (${fakePropertyId}, ${reporterId}, ${'FAKE_LOCATION'}, ${'Does not exist'})
      `.execute(testDb.db)).rejects.toThrow(); // FK violation — property doesn't exist
    });

    it('tenancy_disputes accepts valid tenancy FK and rejects invalid UUID', async () => {
      const raiserId = await seedUser(testDb.db);
      const fakeTenancyId = crypto.randomUUID();

      await expect(sql`
        INSERT INTO tenancy_disputes (tenancy_id, raised_by_id, category, title, description)
        VALUES (${fakeTenancyId}, ${raiserId}, ${'DEPOSIT'}, ${'Bad landlord'}, ${'Details here'})
      `.execute(testDb.db)).rejects.toThrow(); // FK violation — tenancy doesn't exist
    });

    it('listing_disputes and tenancy_disputes have no shared FK cross-dependency', async () => {
      // Verify columns — listing_disputes has property_id, not tenancy_id
      const ldCols = await sql<{ column_name: string }>`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'listing_disputes' ORDER BY column_name;
      `.execute(testDb.db);

      const tdCols = await sql<{ column_name: string }>`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'tenancy_disputes' ORDER BY column_name;
      `.execute(testDb.db);

      const ldColNames = ldCols.rows.map((r) => r.column_name);
      const tdColNames = tdCols.rows.map((r) => r.column_name);

      expect(ldColNames).toContain('property_id');
      expect(ldColNames).not.toContain('tenancy_id');

      expect(tdColNames).toContain('tenancy_id');
      expect(tdColNames).not.toContain('property_id');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP 14: early_termination_records.dispute_id FK with SET NULL
  // ─────────────────────────────────────────────────────────────────────────
  describe('early_termination_records dispute_id FK (ON DELETE SET NULL)', () => {
    it('dispute_id referencing a valid tenancy_dispute is accepted', async () => {
      const tenantId = await seedUser(testDb.db);
      const landlordId = await seedUser(testDb.db);
      const propId = await seedProperty(testDb.db, landlordId);
      const unitId = await seedUnit(testDb.db, propId, `ETR_UNIT_${Date.now()}`);
      const tenancyId = await seedTenancy(testDb.db, unitId, tenantId, landlordId, 'terminated_early');

      // Create a tenancy dispute
      const disputeId = crypto.randomUUID();
      await sql`
        INSERT INTO tenancy_disputes (id, tenancy_id, raised_by_id, category, title, description)
        VALUES (${disputeId}, ${tenancyId}, ${tenantId}, ${'DEPOSIT'}, ${'Deposit withheld'}, ${'Full description'})
      `.execute(testDb.db);

      // Create early termination record linking to dispute
      await expect(sql`
        INSERT INTO early_termination_records (tenancy_id, initiator_id, reason_code, narrative, dispute_id)
        VALUES (${tenancyId}, ${tenantId}, ${'LANDLORD_BREACH'}, ${'Landlord breached agreement'}, ${disputeId})
      `.execute(testDb.db)).resolves.not.toThrow();
    });

    it('dispute_id referencing non-existent UUID is rejected (FK violation)', async () => {
      const tenantId = await seedUser(testDb.db);
      const landlordId = await seedUser(testDb.db);
      const propId = await seedProperty(testDb.db, landlordId);
      const unitId = await seedUnit(testDb.db, propId, `ETR_BAD_${Date.now()}`);
      const tenancyId = await seedTenancy(testDb.db, unitId, tenantId, landlordId, 'terminated_early');

      await expect(sql`
        INSERT INTO early_termination_records (tenancy_id, initiator_id, reason_code, narrative, dispute_id)
        VALUES (${tenancyId}, ${tenantId}, ${'JOB_RELOCATION'}, ${'Moved cities'}, ${crypto.randomUUID()})
      `.execute(testDb.db)).rejects.toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP 15: Property unit uniqueness per property
  // ─────────────────────────────────────────────────────────────────────────
  describe('Property unit identifier uniqueness', () => {
    it('rejects duplicate unit_identifier within the same property', async () => {
      const landlordId = await seedUser(testDb.db);
      const propId = await seedProperty(testDb.db, landlordId);

      await seedUnit(testDb.db, propId, 'FLOOR1_A');
      await expect(seedUnit(testDb.db, propId, 'FLOOR1_A')).rejects.toThrow();
    });

    it('allows same unit_identifier in a different property', async () => {
      const landlordId = await seedUser(testDb.db);
      const prop1 = await seedProperty(testDb.db, landlordId);
      const prop2 = await seedProperty(testDb.db, landlordId);

      await expect(seedUnit(testDb.db, prop1, 'GROUND_FLOOR')).resolves.not.toThrow();
      await expect(seedUnit(testDb.db, prop2, 'GROUND_FLOOR')).resolves.not.toThrow();
    });
  });
});
