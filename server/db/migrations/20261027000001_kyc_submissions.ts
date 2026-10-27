import { Kysely, sql } from 'kysely';

/**
 * Migration 00007: Add KYC Submissions Table
 *
 * Stores citizenship card, police report (tenant), ownership document (landlord),
 * and business registration documents with admin review status.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS kyc_submissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_role TEXT NOT NULL CHECK (user_role IN ('tenant', 'landlord')),
      citizenship_front_url TEXT NOT NULL,
      citizenship_back_url TEXT NOT NULL,
      police_report_url TEXT,
      ownership_document_url TEXT,
      business_registration_url TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
      reviewed_at TIMESTAMPTZ,
      rejection_reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_kyc_submissions_user_id ON kyc_submissions(user_id);
    CREATE INDEX IF NOT EXISTS idx_kyc_submissions_status ON kyc_submissions(status);
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    DROP TABLE IF EXISTS kyc_submissions CASCADE;
  `.execute(db);
}
