import { Kysely, sql } from 'kysely';

/**
 * Migration 00004: Maintenance Requests & Rent Payments
 *
 * Adds persistent relational tables for:
 *   - maintenance_requests: Tenancy-scoped or unit-scoped repair and maintenance ticketing
 *   - rent_payments: Digital rent tracking with invoicing, receipts, and eSewa/Khalti simulation
 */
export async function up(db: Kysely<any>): Promise<void> {
  // ── TABLE 1: maintenance_requests ──────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS maintenance_requests (
      id                    UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
      tenancy_id           UUID            REFERENCES tenancies(id) ON DELETE CASCADE,
      property_id          UUID            NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      unit_id              UUID            REFERENCES property_units(id) ON DELETE SET NULL,
      reported_by_id       UUID            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      category             VARCHAR(100)    NOT NULL,
      urgency              VARCHAR(50)     NOT NULL DEFAULT 'Normal',
      title                VARCHAR(255)    NOT NULL,
      description          TEXT            NOT NULL,
      preferred_time_window VARCHAR(100),
      assigned_contractor  VARCHAR(255),
      scheduled_date       DATE,
      status               VARCHAR(50)     NOT NULL DEFAULT 'Reported',
      created_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
      updated_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
      CONSTRAINT chk_maint_urgency CHECK (urgency IN ('Emergency', 'High', 'Normal', 'Low')),
      CONSTRAINT chk_maint_status  CHECK (status IN ('Reported', 'Scheduled', 'In Progress', 'Resolved'))
    );
  `.execute(db);

  await sql`CREATE INDEX IF NOT EXISTS idx_maint_property_id ON maintenance_requests (property_id)`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS idx_maint_reported_by ON maintenance_requests (reported_by_id)`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS idx_maint_status ON maintenance_requests (status)`.execute(db);

  // ── TABLE 2: rent_payments ─────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS rent_payments (
      id                    UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
      tenancy_id           UUID            NOT NULL REFERENCES tenancies(id) ON DELETE CASCADE,
      property_id          UUID            NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      tenant_id            UUID            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      amount               NUMERIC(12, 2)  NOT NULL,
      month_for            VARCHAR(50)     NOT NULL,
      due_date             DATE            NOT NULL,
      paid_date            TIMESTAMPTZ,
      payment_method       VARCHAR(50),
      transaction_id       VARCHAR(100),
      status               VARCHAR(50)     NOT NULL DEFAULT 'PENDING',
      receipt_number       VARCHAR(100),
      created_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
      updated_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
      CONSTRAINT chk_payment_status CHECK (status IN ('PENDING', 'PAID', 'OVERDUE'))
    );
  `.execute(db);

  await sql`CREATE INDEX IF NOT EXISTS idx_payments_tenancy_id ON rent_payments (tenancy_id)`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON rent_payments (tenant_id)`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS idx_payments_property_id ON rent_payments (property_id)`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE IF EXISTS rent_payments CASCADE;`.execute(db);
  await sql`DROP TABLE IF EXISTS maintenance_requests CASCADE;`.execute(db);
}
