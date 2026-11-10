import { sql } from 'kysely';
import { db, pool } from '../config/database.js';

async function main() {
  const grants = await sql<{
    grantee: string;
    table_name: string;
    privilege_type: string;
  }>`
    SELECT grantee, table_name, string_agg(privilege_type, ', ') as privileges
    FROM information_schema.role_table_grants 
    WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated', 'service_role')
    GROUP BY grantee, table_name
    ORDER BY table_name, grantee;
  `.execute(db);
  console.log('=== Role Table Grants for Supabase API Roles ===');
  console.table(grants.rows);

  await pool.end();
}

main().catch((err) => {
  console.error('Audit Error:', err);
  process.exit(1);
});
