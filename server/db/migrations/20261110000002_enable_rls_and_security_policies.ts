import { Kysely, sql } from 'kysely';

/**
 * Migration 00009: Supabase Row Level Security (RLS) Remediation
 *
 * Implements defense-in-depth security on all public tables:
 * 1. Enables Row Level Security (RLS) on all 23 public tables.
 * 2. Defines explicit, least-privilege security policies for:
 *    - Public property discovery (properties, property_units, photos, amenities, verification_badges, reviews).
 *    - Authenticated user profile ownership (users table self-access only).
 *    - Landlord property & unit asset lifecycle management.
 *    - Tenant rental requests & application privacy.
 *    - Tenancy agreements, digital signatures & biometric media safeguards.
 *    - Maintenance tickets and financial rent payment ledger records.
 *    - Identity documents & KYC submissions.
 *    - Chatbot conversations & messages privacy.
 *    - Dispute & early termination records.
 * 3. Restricts system tables (kysely_migration, kysely_migration_lock) to administrative execution only.
 * 4. PostGIS reference table (spatial_ref_sys) read-only public access.
 *
 * NOTE: The backend Node.js / Express connection pool operates as the `postgres` role,
 * which possesses the `BYPASSRLS` attribute. All backend services continue to function
 * with zero operational regression, while any external or Supabase Data API (PostgREST)
 * access is strictly governed by these row-level security policies.
 */
export async function up(db: Kysely<any>): Promise<void> {
  // ── 0. Compatibility Layer (Ensure auth schema & stub functions exist in non-Supabase environments like PGlite)
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON n.oid = p.pronamespace 
        WHERE n.nspname = 'auth' AND p.proname = 'uid'
      ) THEN
        CREATE SCHEMA IF NOT EXISTS auth;
        CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS 'SELECT NULL::uuid;' LANGUAGE sql STABLE;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role;
      END IF;
    END $$;
  `.execute(db);

  // ── 1. System & Migration Tables (Strict Default Deny) ─────────────────────
  await sql`ALTER TABLE IF EXISTS kysely_migration ENABLE ROW LEVEL SECURITY;`.execute(db);
  await sql`ALTER TABLE IF EXISTS kysely_migration_lock ENABLE ROW LEVEL SECURITY;`.execute(db);
  await sql`REVOKE ALL ON TABLE kysely_migration FROM anon, authenticated, public;`.execute(db);
  await sql`REVOKE ALL ON TABLE kysely_migration_lock FROM anon, authenticated, public;`.execute(db);

  // ── 2. Spatial Reference Systems (PostGIS - system extension table) ───────
  // Owned by supabase_admin in Supabase managed environments. Only alter if owned by current user.
  await sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename = 'spatial_ref_sys' 
          AND tableowner = current_user
      ) THEN
        EXECUTE 'ALTER TABLE spatial_ref_sys ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "spatial_ref_sys_public_read" ON spatial_ref_sys';
        EXECUTE 'CREATE POLICY "spatial_ref_sys_public_read" ON spatial_ref_sys FOR SELECT TO public USING (true)';
      END IF;
    END $$;
  `.execute(db);

  // ── 3. Taxonomy & Catalog Tables (Public Read) ─────────────────────────────
  await sql`ALTER TABLE IF EXISTS amenities ENABLE ROW LEVEL SECURITY;`.execute(db);
  await sql`DROP POLICY IF EXISTS "amenities_public_select" ON amenities;`.execute(db);
  await sql`
    CREATE POLICY "amenities_public_select" 
    ON amenities FOR SELECT TO public 
    USING (true);
  `.execute(db);

  await sql`ALTER TABLE IF EXISTS verification_badges ENABLE ROW LEVEL SECURITY;`.execute(db);
  await sql`DROP POLICY IF EXISTS "verification_badges_public_select" ON verification_badges;`.execute(db);
  await sql`
    CREATE POLICY "verification_badges_public_select" 
    ON verification_badges FOR SELECT TO public 
    USING (true);
  `.execute(db);

  // ── 4. Core User Profiles ──────────────────────────────────────────────────
  await sql`ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;`.execute(db);
  await sql`DROP POLICY IF EXISTS "users_self_select" ON users;`.execute(db);
  await sql`
    CREATE POLICY "users_self_select" 
    ON users FOR SELECT TO authenticated 
    USING (id = auth.uid());
  `.execute(db);

  await sql`DROP POLICY IF EXISTS "users_self_update" ON users;`.execute(db);
  await sql`
    CREATE POLICY "users_self_update" 
    ON users FOR UPDATE TO authenticated 
    USING (id = auth.uid()) 
    WITH CHECK (id = auth.uid());
  `.execute(db);

  // ── 5. Property Listings & Spatial Assets ──────────────────────────────────
  await sql`ALTER TABLE IF EXISTS properties ENABLE ROW LEVEL SECURITY;`.execute(db);
  await sql`DROP POLICY IF EXISTS "properties_public_select" ON properties;`.execute(db);
  await sql`
    CREATE POLICY "properties_public_select" 
    ON properties FOR SELECT TO public 
    USING (is_active = true OR landlord_id = auth.uid());
  `.execute(db);

  await sql`DROP POLICY IF EXISTS "properties_landlord_insert" ON properties;`.execute(db);
  await sql`
    CREATE POLICY "properties_landlord_insert" 
    ON properties FOR INSERT TO authenticated 
    WITH CHECK (landlord_id = auth.uid());
  `.execute(db);

  await sql`DROP POLICY IF EXISTS "properties_landlord_update" ON properties;`.execute(db);
  await sql`
    CREATE POLICY "properties_landlord_update" 
    ON properties FOR UPDATE TO authenticated 
    USING (landlord_id = auth.uid()) 
    WITH CHECK (landlord_id = auth.uid());
  `.execute(db);

  await sql`DROP POLICY IF EXISTS "properties_landlord_delete" ON properties;`.execute(db);
  await sql`
    CREATE POLICY "properties_landlord_delete" 
    ON properties FOR DELETE TO authenticated 
    USING (landlord_id = auth.uid());
  `.execute(db);

  // ── 6. Property Units ──────────────────────────────────────────────────────
  await sql`ALTER TABLE IF EXISTS property_units ENABLE ROW LEVEL SECURITY;`.execute(db);
  await sql`DROP POLICY IF EXISTS "property_units_public_select" ON property_units;`.execute(db);
  await sql`
    CREATE POLICY "property_units_public_select" 
    ON property_units FOR SELECT TO public 
    USING (EXISTS (
      SELECT 1 FROM properties p 
      WHERE p.id = property_units.property_id 
        AND (p.is_active = true OR p.landlord_id = auth.uid())
    ));
  `.execute(db);

  await sql`DROP POLICY IF EXISTS "property_units_landlord_insert" ON property_units;`.execute(db);
  await sql`
    CREATE POLICY "property_units_landlord_insert" 
    ON property_units FOR INSERT TO authenticated 
    WITH CHECK (EXISTS (
      SELECT 1 FROM properties p 
      WHERE p.id = property_units.property_id 
        AND p.landlord_id = auth.uid()
    ));
  `.execute(db);

  await sql`DROP POLICY IF EXISTS "property_units_landlord_update" ON property_units;`.execute(db);
  await sql`
    CREATE POLICY "property_units_landlord_update" 
    ON property_units FOR UPDATE TO authenticated 
    USING (EXISTS (
      SELECT 1 FROM properties p 
      WHERE p.id = property_units.property_id 
        AND p.landlord_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
      SELECT 1 FROM properties p 
      WHERE p.id = property_units.property_id 
        AND p.landlord_id = auth.uid()
    ));
  `.execute(db);

  await sql`DROP POLICY IF EXISTS "property_units_landlord_delete" ON property_units;`.execute(db);
  await sql`
    CREATE POLICY "property_units_landlord_delete" 
    ON property_units FOR DELETE TO authenticated 
    USING (EXISTS (
      SELECT 1 FROM properties p 
      WHERE p.id = property_units.property_id 
        AND p.landlord_id = auth.uid()
    ));
  `.execute(db);

  // ── 7. Photos ──────────────────────────────────────────────────────────────
  await sql`ALTER TABLE IF EXISTS photos ENABLE ROW LEVEL SECURITY;`.execute(db);
  await sql`DROP POLICY IF EXISTS "photos_public_select" ON photos;`.execute(db);
  await sql`
    CREATE POLICY "photos_public_select" 
    ON photos FOR SELECT TO public 
    USING (true);
  `.execute(db);

  await sql`DROP POLICY IF EXISTS "photos_landlord_manage" ON photos;`.execute(db);
  await sql`
    CREATE POLICY "photos_landlord_manage" 
    ON photos FOR ALL TO authenticated 
    USING (EXISTS (
      SELECT 1 FROM properties p 
      WHERE p.id = photos.property_id 
        AND p.landlord_id = auth.uid()
    ));
  `.execute(db);

  // ── 8. Property & Unit Amenities Junctions ─────────────────────────────────
  await sql`ALTER TABLE IF EXISTS property_amenities ENABLE ROW LEVEL SECURITY;`.execute(db);
  await sql`DROP POLICY IF EXISTS "property_amenities_public_select" ON property_amenities;`.execute(db);
  await sql`
    CREATE POLICY "property_amenities_public_select" 
    ON property_amenities FOR SELECT TO public 
    USING (true);
  `.execute(db);

  await sql`DROP POLICY IF EXISTS "property_amenities_landlord_manage" ON property_amenities;`.execute(db);
  await sql`
    CREATE POLICY "property_amenities_landlord_manage" 
    ON property_amenities FOR ALL TO authenticated 
    USING (EXISTS (
      SELECT 1 FROM properties p 
      WHERE p.id = property_amenities.property_id 
        AND p.landlord_id = auth.uid()
    ));
  `.execute(db);

  await sql`ALTER TABLE IF EXISTS unit_amenities ENABLE ROW LEVEL SECURITY;`.execute(db);
  await sql`DROP POLICY IF EXISTS "unit_amenities_public_select" ON unit_amenities;`.execute(db);
  await sql`
    CREATE POLICY "unit_amenities_public_select" 
    ON unit_amenities FOR SELECT TO public 
    USING (true);
  `.execute(db);

  await sql`DROP POLICY IF EXISTS "unit_amenities_landlord_manage" ON unit_amenities;`.execute(db);
  await sql`
    CREATE POLICY "unit_amenities_landlord_manage" 
    ON unit_amenities FOR ALL TO authenticated 
    USING (EXISTS (
      SELECT 1 FROM property_units pu 
      JOIN properties p ON p.id = pu.property_id 
      WHERE pu.id = unit_amenities.unit_id 
        AND p.landlord_id = auth.uid()
    ));
  `.execute(db);

  // ── 9. Verifications ───────────────────────────────────────────────────────
  await sql`ALTER TABLE IF EXISTS verifications ENABLE ROW LEVEL SECURITY;`.execute(db);
  await sql`DROP POLICY IF EXISTS "verifications_public_select" ON verifications;`.execute(db);
  await sql`
    CREATE POLICY "verifications_public_select" 
    ON verifications FOR SELECT TO public 
    USING (true);
  `.execute(db);

  // ── 10. Rental Requests ────────────────────────────────────────────────────
  await sql`ALTER TABLE IF EXISTS rental_requests ENABLE ROW LEVEL SECURITY;`.execute(db);
  await sql`DROP POLICY IF EXISTS "rental_requests_party_select" ON rental_requests;`.execute(db);
  await sql`
    CREATE POLICY "rental_requests_party_select" 
    ON rental_requests FOR SELECT TO authenticated 
    USING (tenant_id = auth.uid() OR landlord_id = auth.uid());
  `.execute(db);

  await sql`DROP POLICY IF EXISTS "rental_requests_tenant_insert" ON rental_requests;`.execute(db);
  await sql`
    CREATE POLICY "rental_requests_tenant_insert" 
    ON rental_requests FOR INSERT TO authenticated 
    WITH CHECK (tenant_id = auth.uid());
  `.execute(db);

  await sql`DROP POLICY IF EXISTS "rental_requests_party_update" ON rental_requests;`.execute(db);
  await sql`
    CREATE POLICY "rental_requests_party_update" 
    ON rental_requests FOR UPDATE TO authenticated 
    USING (tenant_id = auth.uid() OR landlord_id = auth.uid()) 
    WITH CHECK (tenant_id = auth.uid() OR landlord_id = auth.uid());
  `.execute(db);

  await sql`DROP POLICY IF EXISTS "rental_requests_tenant_delete" ON rental_requests;`.execute(db);
  await sql`
    CREATE POLICY "rental_requests_tenant_delete" 
    ON rental_requests FOR DELETE TO authenticated 
    USING (tenant_id = auth.uid());
  `.execute(db);

  // ── 11. Tenancies (Lease Agreements, Signatures & Biometrics) ──────────────
  await sql`ALTER TABLE IF EXISTS tenancies ENABLE ROW LEVEL SECURITY;`.execute(db);
  await sql`DROP POLICY IF EXISTS "tenancies_party_select" ON tenancies;`.execute(db);
  await sql`
    CREATE POLICY "tenancies_party_select" 
    ON tenancies FOR SELECT TO authenticated 
    USING (tenant_id = auth.uid() OR landlord_id = auth.uid());
  `.execute(db);

  await sql`DROP POLICY IF EXISTS "tenancies_party_update" ON tenancies;`.execute(db);
  await sql`
    CREATE POLICY "tenancies_party_update" 
    ON tenancies FOR UPDATE TO authenticated 
    USING (tenant_id = auth.uid() OR landlord_id = auth.uid()) 
    WITH CHECK (tenant_id = auth.uid() OR landlord_id = auth.uid());
  `.execute(db);

  // ── 12. Maintenance Requests ───────────────────────────────────────────────
  await sql`ALTER TABLE IF EXISTS maintenance_requests ENABLE ROW LEVEL SECURITY;`.execute(db);
  await sql`DROP POLICY IF EXISTS "maintenance_requests_party_select" ON maintenance_requests;`.execute(db);
  await sql`
    CREATE POLICY "maintenance_requests_party_select" 
    ON maintenance_requests FOR SELECT TO authenticated 
    USING (
      reported_by_id = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM properties p 
        WHERE p.id = maintenance_requests.property_id 
          AND p.landlord_id = auth.uid()
      )
    );
  `.execute(db);

  await sql`DROP POLICY IF EXISTS "maintenance_requests_tenant_insert" ON maintenance_requests;`.execute(db);
  await sql`
    CREATE POLICY "maintenance_requests_tenant_insert" 
    ON maintenance_requests FOR INSERT TO authenticated 
    WITH CHECK (reported_by_id = auth.uid());
  `.execute(db);

  await sql`DROP POLICY IF EXISTS "maintenance_requests_party_update" ON maintenance_requests;`.execute(db);
  await sql`
    CREATE POLICY "maintenance_requests_party_update" 
    ON maintenance_requests FOR UPDATE TO authenticated 
    USING (
      reported_by_id = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM properties p 
        WHERE p.id = maintenance_requests.property_id 
          AND p.landlord_id = auth.uid()
      )
    );
  `.execute(db);

  // ── 13. Rent Payments Ledger ───────────────────────────────────────────────
  await sql`ALTER TABLE IF EXISTS rent_payments ENABLE ROW LEVEL SECURITY;`.execute(db);
  await sql`DROP POLICY IF EXISTS "rent_payments_party_select" ON rent_payments;`.execute(db);
  await sql`
    CREATE POLICY "rent_payments_party_select" 
    ON rent_payments FOR SELECT TO authenticated 
    USING (
      tenant_id = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM properties p 
        WHERE p.id = rent_payments.property_id 
          AND p.landlord_id = auth.uid()
      )
    );
  `.execute(db);

  await sql`DROP POLICY IF EXISTS "rent_payments_landlord_manage" ON rent_payments;`.execute(db);
  await sql`
    CREATE POLICY "rent_payments_landlord_manage" 
    ON rent_payments FOR ALL TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM properties p 
        WHERE p.id = rent_payments.property_id 
          AND p.landlord_id = auth.uid()
      )
    );
  `.execute(db);

  await sql`DROP POLICY IF EXISTS "rent_payments_tenant_update" ON rent_payments;`.execute(db);
  await sql`
    CREATE POLICY "rent_payments_tenant_update" 
    ON rent_payments FOR UPDATE TO authenticated 
    USING (tenant_id = auth.uid()) 
    WITH CHECK (tenant_id = auth.uid());
  `.execute(db);

  // ── 14. KYC Submissions (Government IDs & Verification Documents) ──────────
  await sql`ALTER TABLE IF EXISTS kyc_submissions ENABLE ROW LEVEL SECURITY;`.execute(db);
  await sql`DROP POLICY IF EXISTS "kyc_submissions_self_select" ON kyc_submissions;`.execute(db);
  await sql`
    CREATE POLICY "kyc_submissions_self_select" 
    ON kyc_submissions FOR SELECT TO authenticated 
    USING (user_id = auth.uid());
  `.execute(db);

  await sql`DROP POLICY IF EXISTS "kyc_submissions_self_insert" ON kyc_submissions;`.execute(db);
  await sql`
    CREATE POLICY "kyc_submissions_self_insert" 
    ON kyc_submissions FOR INSERT TO authenticated 
    WITH CHECK (user_id = auth.uid());
  `.execute(db);

  await sql`DROP POLICY IF EXISTS "kyc_submissions_self_update" ON kyc_submissions;`.execute(db);
  await sql`
    CREATE POLICY "kyc_submissions_self_update" 
    ON kyc_submissions FOR UPDATE TO authenticated 
    USING (user_id = auth.uid() AND status = 'pending') 
    WITH CHECK (user_id = auth.uid());
  `.execute(db);

  // ── 15. Chatbot Conversations & Messages ───────────────────────────────────
  await sql`ALTER TABLE IF EXISTS chatbot_conversations ENABLE ROW LEVEL SECURITY;`.execute(db);
  await sql`DROP POLICY IF EXISTS "chatbot_conversations_self_select" ON chatbot_conversations;`.execute(db);
  await sql`
    CREATE POLICY "chatbot_conversations_self_select" 
    ON chatbot_conversations FOR SELECT TO authenticated 
    USING (user_id = auth.uid());
  `.execute(db);

  await sql`DROP POLICY IF EXISTS "chatbot_conversations_self_insert" ON chatbot_conversations;`.execute(db);
  await sql`
    CREATE POLICY "chatbot_conversations_self_insert" 
    ON chatbot_conversations FOR INSERT TO authenticated 
    WITH CHECK (user_id = auth.uid());
  `.execute(db);

  await sql`DROP POLICY IF EXISTS "chatbot_conversations_self_update" ON chatbot_conversations;`.execute(db);
  await sql`
    CREATE POLICY "chatbot_conversations_self_update" 
    ON chatbot_conversations FOR UPDATE TO authenticated 
    USING (user_id = auth.uid()) 
    WITH CHECK (user_id = auth.uid());
  `.execute(db);

  await sql`DROP POLICY IF EXISTS "chatbot_conversations_self_delete" ON chatbot_conversations;`.execute(db);
  await sql`
    CREATE POLICY "chatbot_conversations_self_delete" 
    ON chatbot_conversations FOR DELETE TO authenticated 
    USING (user_id = auth.uid());
  `.execute(db);

  await sql`ALTER TABLE IF EXISTS chatbot_messages ENABLE ROW LEVEL SECURITY;`.execute(db);
  await sql`DROP POLICY IF EXISTS "chatbot_messages_self_select" ON chatbot_messages;`.execute(db);
  await sql`
    CREATE POLICY "chatbot_messages_self_select" 
    ON chatbot_messages FOR SELECT TO authenticated 
    USING (EXISTS (
      SELECT 1 FROM chatbot_conversations c 
      WHERE c.id = chatbot_messages.conversation_id 
        AND c.user_id = auth.uid()
    ));
  `.execute(db);

  await sql`DROP POLICY IF EXISTS "chatbot_messages_self_insert" ON chatbot_messages;`.execute(db);
  await sql`
    CREATE POLICY "chatbot_messages_self_insert" 
    ON chatbot_messages FOR INSERT TO authenticated 
    WITH CHECK (EXISTS (
      SELECT 1 FROM chatbot_conversations c 
      WHERE c.id = chatbot_messages.conversation_id 
        AND c.user_id = auth.uid()
    ));
  `.execute(db);

  // ── 16. Tenancy Reviews (Public Read, Author Write) ────────────────────────
  await sql`ALTER TABLE IF EXISTS tenancy_reviews ENABLE ROW LEVEL SECURITY;`.execute(db);
  await sql`DROP POLICY IF EXISTS "tenancy_reviews_public_select" ON tenancy_reviews;`.execute(db);
  await sql`
    CREATE POLICY "tenancy_reviews_public_select" 
    ON tenancy_reviews FOR SELECT TO public 
    USING (true);
  `.execute(db);

  await sql`DROP POLICY IF EXISTS "tenancy_reviews_author_insert" ON tenancy_reviews;`.execute(db);
  await sql`
    CREATE POLICY "tenancy_reviews_author_insert" 
    ON tenancy_reviews FOR INSERT TO authenticated 
    WITH CHECK (author_id = auth.uid());
  `.execute(db);

  await sql`DROP POLICY IF EXISTS "tenancy_reviews_author_update" ON tenancy_reviews;`.execute(db);
  await sql`
    CREATE POLICY "tenancy_reviews_author_update" 
    ON tenancy_reviews FOR UPDATE TO authenticated 
    USING (author_id = auth.uid()) 
    WITH CHECK (author_id = auth.uid());
  `.execute(db);

  await sql`DROP POLICY IF EXISTS "tenancy_reviews_author_delete" ON tenancy_reviews;`.execute(db);
  await sql`
    CREATE POLICY "tenancy_reviews_author_delete" 
    ON tenancy_reviews FOR DELETE TO authenticated 
    USING (author_id = auth.uid());
  `.execute(db);

  // ── 17. Tenancy Disputes ───────────────────────────────────────────────────
  await sql`ALTER TABLE IF EXISTS tenancy_disputes ENABLE ROW LEVEL SECURITY;`.execute(db);
  await sql`DROP POLICY IF EXISTS "tenancy_disputes_party_select" ON tenancy_disputes;`.execute(db);
  await sql`
    CREATE POLICY "tenancy_disputes_party_select" 
    ON tenancy_disputes FOR SELECT TO authenticated 
    USING (
      raised_by_id = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM tenancies t 
        WHERE t.id = tenancy_disputes.tenancy_id 
          AND (t.tenant_id = auth.uid() OR t.landlord_id = auth.uid())
      )
    );
  `.execute(db);

  await sql`DROP POLICY IF EXISTS "tenancy_disputes_party_insert" ON tenancy_disputes;`.execute(db);
  await sql`
    CREATE POLICY "tenancy_disputes_party_insert" 
    ON tenancy_disputes FOR INSERT TO authenticated 
    WITH CHECK (raised_by_id = auth.uid());
  `.execute(db);

  await sql`DROP POLICY IF EXISTS "tenancy_disputes_party_update" ON tenancy_disputes;`.execute(db);
  await sql`
    CREATE POLICY "tenancy_disputes_party_update" 
    ON tenancy_disputes FOR UPDATE TO authenticated 
    USING (raised_by_id = auth.uid());
  `.execute(db);

  // ── 18. Early Termination Records ──────────────────────────────────────────
  await sql`ALTER TABLE IF EXISTS early_termination_records ENABLE ROW LEVEL SECURITY;`.execute(db);
  await sql`DROP POLICY IF EXISTS "early_termination_party_select" ON early_termination_records;`.execute(db);
  await sql`
    CREATE POLICY "early_termination_party_select" 
    ON early_termination_records FOR SELECT TO authenticated 
    USING (
      initiator_id = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM tenancies t 
        WHERE t.id = early_termination_records.tenancy_id 
          AND (t.tenant_id = auth.uid() OR t.landlord_id = auth.uid())
      )
    );
  `.execute(db);

  await sql`DROP POLICY IF EXISTS "early_termination_party_insert" ON early_termination_records;`.execute(db);
  await sql`
    CREATE POLICY "early_termination_party_insert" 
    ON early_termination_records FOR INSERT TO authenticated 
    WITH CHECK (initiator_id = auth.uid());
  `.execute(db);

  // ── 19. Listing Disputes ───────────────────────────────────────────────────
  await sql`ALTER TABLE IF EXISTS listing_disputes ENABLE ROW LEVEL SECURITY;`.execute(db);
  await sql`DROP POLICY IF EXISTS "listing_disputes_party_select" ON listing_disputes;`.execute(db);
  await sql`
    CREATE POLICY "listing_disputes_party_select" 
    ON listing_disputes FOR SELECT TO authenticated 
    USING (
      reporter_id = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM properties p 
        WHERE p.id = listing_disputes.property_id 
          AND p.landlord_id = auth.uid()
      )
    );
  `.execute(db);

  await sql`DROP POLICY IF EXISTS "listing_disputes_reporter_insert" ON listing_disputes;`.execute(db);
  await sql`
    CREATE POLICY "listing_disputes_reporter_insert" 
    ON listing_disputes FOR INSERT TO authenticated 
    WITH CHECK (reporter_id = auth.uid());
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  const tables = [
    'listing_disputes',
    'early_termination_records',
    'tenancy_disputes',
    'tenancy_reviews',
    'chatbot_messages',
    'chatbot_conversations',
    'kyc_submissions',
    'rent_payments',
    'maintenance_requests',
    'tenancies',
    'rental_requests',
    'verifications',
    'unit_amenities',
    'property_amenities',
    'photos',
    'property_units',
    'properties',
    'users',
    'verification_badges',
    'amenities',
    'spatial_ref_sys',
    'kysely_migration_lock',
    'kysely_migration',
  ];

  for (const table of tables) {
    if (table === 'spatial_ref_sys') {
      await sql`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
              AND tablename = 'spatial_ref_sys' 
              AND tableowner = current_user
          ) THEN
            EXECUTE 'ALTER TABLE spatial_ref_sys DISABLE ROW LEVEL SECURITY';
          END IF;
        END $$;
      `.execute(db);
    } else {
      await sql`ALTER TABLE IF EXISTS ${sql.raw(table)} DISABLE ROW LEVEL SECURITY;`.execute(db);
    }
  }
}
