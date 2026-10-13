import { Kysely, sql } from 'kysely';

/**
 * Migration 00005: Lease Agreement Signature & Biometric Media
 *
 * Adds media columns to `tenancies` to support storing uploaded
 * digital signature PNGs and biometric thumbprint/scan PNGs
 * for both tenant and landlord parties.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE tenancies
      ADD COLUMN IF NOT EXISTS tenant_signature_url   TEXT,
      ADD COLUMN IF NOT EXISTS tenant_biometric_url   TEXT,
      ADD COLUMN IF NOT EXISTS landlord_signature_url TEXT,
      ADD COLUMN IF NOT EXISTS landlord_biometric_url TEXT;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE tenancies
      DROP COLUMN IF EXISTS tenant_signature_url,
      DROP COLUMN IF EXISTS tenant_biometric_url,
      DROP COLUMN IF EXISTS landlord_signature_url,
      DROP COLUMN IF EXISTS landlord_biometric_url;
  `.execute(db);
}
