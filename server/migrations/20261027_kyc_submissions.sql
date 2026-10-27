-- KYC Submissions table for identity verification
-- Run this SQL against your PostgreSQL database to create the kyc_submissions table.

CREATE TABLE IF NOT EXISTS kyc_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_role       TEXT NOT NULL CHECK (user_role IN ('tenant', 'landlord')),

  -- Citizenship documents (required for all roles)
  citizenship_front_url   TEXT NOT NULL,
  citizenship_back_url    TEXT NOT NULL,

  -- Tenant-specific: Police report
  police_report_url       TEXT,

  -- Landlord-specific: Ownership & business docs
  ownership_document_url      TEXT,
  business_registration_url   TEXT,

  -- Review workflow
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at       TIMESTAMPTZ,
  rejection_reason  TEXT,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick user lookup
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_user_id ON kyc_submissions(user_id);
-- Index for admin filtering by status
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_status ON kyc_submissions(status);
