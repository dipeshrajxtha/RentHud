import { Kysely, sql } from 'kysely';

/**
 * Migration 00003: Lease Digital Signature Columns
 *
 * Adds two nullable timestamp columns to `tenancies` to track individual
 * party signatures independently:
 *
 *   - tenant_signed_at   — set when the tenant calls POST /leases/:id/sign
 *   - landlord_signed_at — set when the landlord calls POST /leases/:id/sign
 *
 * The existing `signed_at` column is retained as the agreement seal timestamp:
 * it is written atomically (in the same transaction) only when BOTH parties
 * have signed, transitioning the tenancy to `active`.
 *
 * Both columns are nullable and default to NULL — unsigned on creation.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE tenancies
      ADD COLUMN IF NOT EXISTS tenant_signed_at   TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS landlord_signed_at TIMESTAMPTZ;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE tenancies
      DROP COLUMN IF EXISTS tenant_signed_at,
      DROP COLUMN IF EXISTS landlord_signed_at;
  `.execute(db);
}
