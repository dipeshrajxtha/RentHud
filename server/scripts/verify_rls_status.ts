import { sql } from 'kysely';
import { db, pool } from '../config/database.js';

async function main() {
  const tables = await sql<{
    table_name: string;
    rls_enabled: boolean;
    policy_count: number;
  }>`
    SELECT 
      c.relname as table_name,
      c.relrowsecurity as rls_enabled,
      COUNT(p.policyname)::int as policy_count
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN pg_policies p ON p.schemaname = n.nspname AND p.tablename = c.relname
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    GROUP BY c.relname, c.relrowsecurity
    ORDER BY c.relname;
  `.execute(db);

  console.log('=== Post-Remediation Public Tables RLS Status & Policy Counts ===');
  console.table(tables.rows);

  await pool.end();
}

main().catch((err) => {
  console.error('Check Error:', err);
  process.exit(1);
});
