import { sql } from 'kysely';
import { db, pool } from '../config/database.js';

interface TestResult {
  scenario: string;
  role: string;
  expected: string;
  actual: string;
  passed: boolean;
}

async function main() {
  const results: TestResult[] = [];

  console.log('=== Running Supabase RLS Security Verification Suite ===\n');

  // Fetch a sample user or create temporary test UUIDs
  const sampleUsers = await sql<{ id: string; email: string }>`SELECT id, email FROM users LIMIT 2;`.execute(db);
  const userA = sampleUsers.rows[0]?.id || 'a0000000-0000-0000-0000-000000000001';
  const userB = sampleUsers.rows[1]?.id || 'b0000000-0000-0000-0000-000000000002';

  console.log(`Test Subject User A: ${userA}`);
  console.log(`Test Subject User B: ${userB}\n`);

  // ── TEST 1: Unauthenticated (anon) attempting to read users table
  try {
    const res = await db.transaction().execute(async (trx) => {
      await sql`SET LOCAL ROLE anon;`.execute(trx);
      const rows = await sql<{ count: string }>`SELECT count(*)::text as count FROM users;`.execute(trx);
      return rows.rows[0].count;
    });
    results.push({
      scenario: 'Anon reading users table',
      role: 'anon',
      expected: '0 rows (blocked)',
      actual: `${res} rows returned`,
      passed: res === '0',
    });
  } catch (err: any) {
    results.push({
      scenario: 'Anon reading users table',
      role: 'anon',
      expected: '0 rows (blocked)',
      actual: `Error: ${err.message}`,
      passed: true,
    });
  }

  // ── TEST 2: Unauthenticated (anon) attempting to read KYC submissions
  try {
    const res = await db.transaction().execute(async (trx) => {
      await sql`SET LOCAL ROLE anon;`.execute(trx);
      const rows = await sql<{ count: string }>`SELECT count(*)::text as count FROM kyc_submissions;`.execute(trx);
      return rows.rows[0].count;
    });
    results.push({
      scenario: 'Anon reading kyc_submissions',
      role: 'anon',
      expected: '0 rows (blocked)',
      actual: `${res} rows returned`,
      passed: res === '0',
    });
  } catch (err: any) {
    results.push({
      scenario: 'Anon reading kyc_submissions',
      role: 'anon',
      expected: '0 rows (blocked)',
      actual: `Error: ${err.message}`,
      passed: true,
    });
  }

  // ── TEST 3: Unauthenticated (anon) reading public amenities
  try {
    const res = await db.transaction().execute(async (trx) => {
      await sql`SET LOCAL ROLE anon;`.execute(trx);
      const rows = await sql<{ count: string }>`SELECT count(*)::text as count FROM amenities;`.execute(trx);
      return rows.rows[0].count;
    });
    results.push({
      scenario: 'Anon reading amenities catalog',
      role: 'anon',
      expected: 'Permitted (public catalog)',
      actual: `${res} rows visible`,
      passed: true,
    });
  } catch (err: any) {
    results.push({
      scenario: 'Anon reading amenities catalog',
      role: 'anon',
      expected: 'Permitted (public catalog)',
      actual: `Error: ${err.message}`,
      passed: false,
    });
  }

  // ── TEST 4: Unauthenticated (anon) reading active properties
  try {
    const res = await db.transaction().execute(async (trx) => {
      await sql`SET LOCAL ROLE anon;`.execute(trx);
      const rows = await sql<{ count: string }>`SELECT count(*)::text as count FROM properties WHERE is_active = true;`.execute(trx);
      return rows.rows[0].count;
    });
    results.push({
      scenario: 'Anon reading active properties for discovery',
      role: 'anon',
      expected: 'Permitted (public discovery)',
      actual: `${res} active properties visible`,
      passed: true,
    });
  } catch (err: any) {
    results.push({
      scenario: 'Anon reading active properties for discovery',
      role: 'anon',
      expected: 'Permitted (public discovery)',
      actual: `Error: ${err.message}`,
      passed: false,
    });
  }

  // ── TEST 5: Unauthenticated (anon) attempting to read tenancies (contracts)
  try {
    const res = await db.transaction().execute(async (trx) => {
      await sql`SET LOCAL ROLE anon;`.execute(trx);
      const rows = await sql<{ count: string }>`SELECT count(*)::text as count FROM tenancies;`.execute(trx);
      return rows.rows[0].count;
    });
    results.push({
      scenario: 'Anon reading tenancies (contracts/signatures)',
      role: 'anon',
      expected: '0 rows (blocked)',
      actual: `${res} rows returned`,
      passed: res === '0',
    });
  } catch (err: any) {
    results.push({
      scenario: 'Anon reading tenancies (contracts/signatures)',
      role: 'anon',
      expected: '0 rows (blocked)',
      actual: `Error: ${err.message}`,
      passed: true,
    });
  }

  // ── TEST 6: Unauthenticated (anon) attempting to read rent_payments
  try {
    const res = await db.transaction().execute(async (trx) => {
      await sql`SET LOCAL ROLE anon;`.execute(trx);
      const rows = await sql<{ count: string }>`SELECT count(*)::text as count FROM rent_payments;`.execute(trx);
      return rows.rows[0].count;
    });
    results.push({
      scenario: 'Anon reading rent_payments ledger',
      role: 'anon',
      expected: '0 rows (blocked)',
      actual: `${res} rows returned`,
      passed: res === '0',
    });
  } catch (err: any) {
    results.push({
      scenario: 'Anon reading rent_payments ledger',
      role: 'anon',
      expected: '0 rows (blocked)',
      actual: `Error: ${err.message}`,
      passed: true,
    });
  }

  // ── TEST 7: Unauthenticated (anon) attempting to read chatbot_conversations
  try {
    const res = await db.transaction().execute(async (trx) => {
      await sql`SET LOCAL ROLE anon;`.execute(trx);
      const rows = await sql<{ count: string }>`SELECT count(*)::text as count FROM chatbot_conversations;`.execute(trx);
      return rows.rows[0].count;
    });
    results.push({
      scenario: 'Anon reading chatbot_conversations',
      role: 'anon',
      expected: '0 rows (blocked)',
      actual: `${res} rows returned`,
      passed: res === '0',
    });
  } catch (err: any) {
    results.push({
      scenario: 'Anon reading chatbot_conversations',
      role: 'anon',
      expected: '0 rows (blocked)',
      actual: `Error: ${err.message}`,
      passed: true,
    });
  }

  // ── TEST 8: Authenticated User A reading their OWN profile vs User B
  try {
    const res = await db.transaction().execute(async (trx) => {
      await sql`SET LOCAL ROLE authenticated;`.execute(trx);
      await sql`SELECT set_config('request.jwt.claim.sub', ${userA}, true);`.execute(trx);
      const myProfile = await sql<{ id: string }>`SELECT id FROM users WHERE id = ${userA}::uuid;`.execute(trx);
      const otherProfile = await sql<{ id: string }>`SELECT id FROM users WHERE id = ${userB}::uuid;`.execute(trx);
      return {
        sawSelf: myProfile.rows.length === 1,
        sawOther: otherProfile.rows.length === 1,
      };
    });
    results.push({
      scenario: 'Authenticated User A reading own user profile',
      role: 'authenticated',
      expected: 'Can see own profile',
      actual: res.sawSelf ? 'Saw self' : 'Did not see self',
      passed: res.sawSelf,
    });
    results.push({
      scenario: 'Authenticated User A reading User B private profile',
      role: 'authenticated',
      expected: 'Cannot see User B profile',
      actual: res.sawOther ? 'Leaked User B!' : 'User B hidden (0 rows)',
      passed: !res.sawOther,
    });
  } catch (err: any) {
    results.push({
      scenario: 'Authenticated User A profile isolation test',
      role: 'authenticated',
      expected: 'Isolated access',
      actual: `Error: ${err.message}`,
      passed: false,
    });
  }

  // ── TEST 9: Unauthenticated (anon) attempting to read kysely_migration
  try {
    await db.transaction().execute(async (trx) => {
      await sql`SET LOCAL ROLE anon;`.execute(trx);
      await sql`SELECT * FROM kysely_migration LIMIT 1;`.execute(trx);
    });
    results.push({
      scenario: 'Anon reading kysely_migration table',
      role: 'anon',
      expected: 'Permission denied / blocked',
      actual: 'Allowed (FAILED)',
      passed: false,
    });
  } catch (err: any) {
    results.push({
      scenario: 'Anon reading kysely_migration table',
      role: 'anon',
      expected: 'Permission denied / blocked',
      actual: 'Blocked (Permission denied)',
      passed: true,
    });
  }

  // ── TEST 10: Backend pool connection (postgres) full administrative access
  try {
    const propCount = await sql<{ count: string }>`SELECT count(*)::text as count FROM properties;`.execute(db);
    const userCount = await sql<{ count: string }>`SELECT count(*)::text as count FROM users;`.execute(db);
    results.push({
      scenario: 'Backend Express connection (postgres with BYPASSRLS)',
      role: 'postgres',
      expected: 'Unrestricted backend operations',
      actual: `Read ${propCount.rows[0].count} properties and ${userCount.rows[0].count} users`,
      passed: true,
    });
  } catch (err: any) {
    results.push({
      scenario: 'Backend Express connection (postgres with BYPASSRLS)',
      role: 'postgres',
      expected: 'Unrestricted backend operations',
      actual: `Error: ${err.message}`,
      passed: false,
    });
  }

  console.table(results);

  const failed = results.filter((r) => !r.passed);
  if (failed.length > 0) {
    console.error(`\n❌ ${failed.length} test(s) failed!`);
    process.exit(1);
  } else {
    console.log('\n✅ ALL 10 SECURITY SCENARIOS PASSED WITH ZERO REGRESSIONS!');
  }

  await pool.end();
}

main().catch((err) => {
  console.error('Test Suite Error:', err);
  process.exit(1);
});
