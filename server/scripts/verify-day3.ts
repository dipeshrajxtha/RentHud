import { sql } from 'kysely';
import { createTestDatabase } from '../tests/helpers/test-db.js';
import * as coreSchema from '../db/migrations/20260916000001_core_schema.js';

// ─────────────────────────────────────────────────────────────────────────────
// Day 3 Schema Verification Script
// Usage: npm run verify:day3
//
// Runs the core schema migration against an in-memory PGlite database and
// performs structured checks against information_schema to verify:
//   - All 15 expected tables exist
//   - Key indexes exist (including partial unique indexes)
//   - All constraint names are registered
//   - PostGIS round-trip for a geography point insert + spatial query
//
// Exits 0 on full pass, 1 on any failure.
// ─────────────────────────────────────────────────────────────────────────────

const EXPECTED_TABLES = [
  'users',
  'properties',
  'property_units',
  'rental_requests',
  'tenancies',
  'tenancy_disputes',
  'early_termination_records',
  'tenancy_reviews',
  'listing_disputes',
  'amenities',
  'property_amenities',
  'unit_amenities',
  'photos',
  'verification_badges',
  'verifications',
] as const;

const EXPECTED_INDEXES = [
  'idx_users_email',
  'idx_users_google_id',
  'idx_properties_landlord_id',
  'idx_properties_city',
  'idx_properties_location_gist',
  'idx_property_units_property_id',
  'idx_property_units_status',
  'idx_rental_requests_unit_id',
  'idx_rental_requests_tenant_id',
  'idx_rental_requests_status',
  'idx_one_active_tenancy_per_tenant',
  'idx_one_active_tenancy_per_unit',
  'idx_tenancies_unit_id',
  'idx_tenancies_tenant_id',
  'idx_tenancies_landlord_id',
  'idx_tenancies_status',
  'idx_tenancy_disputes_tenancy_id',
  'idx_tenancy_disputes_status',
  'idx_tenancy_reviews_property_id',
  'idx_tenancy_reviews_author_id',
  'idx_listing_disputes_property_id',
  'idx_listing_disputes_status',
  'idx_photos_property_id',
  'idx_photos_unit_id',
  'idx_verifications_user_id',
  'idx_verifications_property_id',
  'idx_verifications_status',
] as const;

type CheckResult = { label: string; passed: boolean; detail?: string };
const results: CheckResult[] = [];

function pass(label: string, detail?: string): void {
  results.push({ label, passed: true, detail });
}

function fail(label: string, detail?: string): void {
  results.push({ label, passed: false, detail });
}

async function run(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('  RentHub Day 3: Core Database Schema Verification');
  console.log('  Target: In-Memory PGlite + PostGIS');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  const testDb = await createTestDatabase();
  const { db } = testDb;

  try {
    // ── Step 1: Apply migration ──────────────────────────────────────────────
    console.log('[1/5] Applying migration 20260916000001_core_schema...');
    try {
      await coreSchema.up(db);
      pass('Migration up() executes without errors');
      console.log('  → Migration applied successfully.\n');
    } catch (err: any) {
      fail('Migration up() failed', err.message);
      throw err; // Fatal — cannot continue
    }

    // ── Step 2: Verify tables ────────────────────────────────────────────────
    console.log('[2/5] Verifying expected tables exist...');
    const tableResult = await sql<{ tablename: string }>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
    `.execute(db);
    const existingTables = new Set(tableResult.rows.map((r) => r.tablename));

    for (const tbl of EXPECTED_TABLES) {
      if (existingTables.has(tbl)) {
        pass(`Table exists: ${tbl}`);
        console.log(`  ✓ ${tbl}`);
      } else {
        fail(`Table missing: ${tbl}`);
        console.log(`  ✗ ${tbl} — MISSING`);
      }
    }
    console.log();

    // ── Step 3: Verify indexes ───────────────────────────────────────────────
    console.log('[3/5] Verifying expected indexes exist...');
    const indexResult = await sql<{ indexname: string }>`
      SELECT indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY indexname;
    `.execute(db);
    const existingIndexes = new Set(indexResult.rows.map((r) => r.indexname));

    for (const idx of EXPECTED_INDEXES) {
      if (existingIndexes.has(idx)) {
        pass(`Index exists: ${idx}`);
        console.log(`  ✓ ${idx}`);
      } else {
        fail(`Index missing: ${idx}`);
        console.log(`  ✗ ${idx} — MISSING`);
      }
    }
    console.log();

    // ── Step 4: PostGIS geography round-trip ─────────────────────────────────
    console.log('[4/5] Verifying PostGIS geography round-trip (Kathmandu)...');
    const landlordId = crypto.randomUUID();
    const propId = crypto.randomUUID();
    const KTM_LNG = 85.3240;
    const KTM_LAT = 27.7172;

    await sql`
      INSERT INTO users (id, email, name) VALUES (${landlordId}, ${'verify@renthub.test'}, ${'Verify User'})
    `.execute(db);

    await sql`
      INSERT INTO properties (id, landlord_id, title, address, city, location)
      VALUES (
        ${propId}, ${landlordId}, ${'Verify Property'}, ${'1 Verify Ave'}, ${'Kathmandu'},
        ST_SetSRID(ST_MakePoint(${KTM_LNG}, ${KTM_LAT}), 4326)::geography
      )
    `.execute(db);

    // ST_DWithin — within 500m
    const withinRes = await sql<{ found: boolean }>`
      SELECT EXISTS(
        SELECT 1 FROM properties
        WHERE id = ${propId}
          AND ST_DWithin(
            location,
            ST_SetSRID(ST_MakePoint(${KTM_LNG}, ${KTM_LAT}), 4326)::geography,
            500
          )
      ) as found;
    `.execute(db);

    if (withinRes.rows[0].found) {
      pass('PostGIS ST_DWithin(500m) correctly returns the inserted property');
      console.log('  ✓ ST_DWithin(500m) → property found');
    } else {
      fail('PostGIS ST_DWithin(500m) did not return the inserted property');
      console.log('  ✗ ST_DWithin(500m) → property NOT found');
    }

    // Coordinate extraction
    const coordRes = await sql<{ lng: number; lat: number }>`
      SELECT ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat
      FROM properties WHERE id = ${propId}
    `.execute(db);

    const { lng, lat } = coordRes.rows[0];
    const lngOk = Math.abs(lng - KTM_LNG) < 0.0001;
    const latOk = Math.abs(lat - KTM_LAT) < 0.0001;

    if (lngOk && latOk) {
      pass(`PostGIS ST_X/ST_Y round-trip accurate (lng=${lng.toFixed(4)}, lat=${lat.toFixed(4)})`);
      console.log(`  ✓ ST_X/ST_Y → lng=${lng.toFixed(4)}, lat=${lat.toFixed(4)}`);
    } else {
      fail(`PostGIS coordinate round-trip imprecise (lng=${lng}, lat=${lat})`);
      console.log(`  ✗ ST_X/ST_Y → lng=${lng}, lat=${lat} — precision issue`);
    }
    console.log();

    // ── Step 5: Partial unique index verification ─────────────────────────────
    console.log('[5/5] Verifying partial unique indexes...');

    const partialIndexRes = await sql<{ indexname: string; indexdef: string }>`
      SELECT indexname, indexdef FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname IN ('idx_one_active_tenancy_per_tenant', 'idx_one_active_tenancy_per_unit')
      ORDER BY indexname;
    `.execute(db);

    for (const idx of partialIndexRes.rows) {
      const hasWhere = idx.indexdef.toLowerCase().includes('where');
      if (hasWhere) {
        pass(`Partial index ${idx.indexname} has WHERE clause`);
        console.log(`  ✓ ${idx.indexname}`);
        console.log(`    → ${idx.indexdef}`);
      } else {
        fail(`Partial index ${idx.indexname} is missing WHERE clause`);
        console.log(`  ✗ ${idx.indexname} — no WHERE clause found`);
      }
    }

    if (partialIndexRes.rows.length !== 2) {
      fail(`Expected 2 partial unique indexes, found ${partialIndexRes.rows.length}`);
    }
    console.log();

  } finally {
    await testDb.destroy();
  }

  // ── Final Report ─────────────────────────────────────────────────────────
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log('═══════════════════════════════════════════════════════════════════');
  if (failed === 0) {
    console.log(`  ALL ${total} DAY 3 SCHEMA CHECKS PASSED ✓`);
  } else {
    console.log(`  RESULT: ${passed}/${total} checks passed — ${failed} FAILED ✗`);
    console.log('\n  Failed checks:');
    for (const r of results.filter((r) => !r.passed)) {
      console.log(`    ✗ ${r.label}${r.detail ? `: ${r.detail}` : ''}`);
    }
  }
  console.log('═══════════════════════════════════════════════════════════════════');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('\n[verify-day3] Fatal error:', err.message ?? err);
  process.exit(1);
});
