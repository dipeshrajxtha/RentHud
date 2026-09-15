import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { sql } from 'kysely';
import { createTestDatabase, type TestDbInstance } from './helpers/test-db.js';
import * as postgisMigration from '../db/migrations/20260915000001_enable_postgis.js';

describe('Database Migrations: Foundation', () => {
  let testDb: TestDbInstance;

  beforeAll(async () => {
    testDb = await createTestDatabase();
  });

  afterAll(async () => {
    await testDb.destroy();
  });

  it('successfully executes up() migration to enable PostGIS extension', async () => {
    await postgisMigration.up(testDb.db);

    const versionResult = await sql<{ postgis_version: string }>`
      SELECT PostGIS_Version();
    `.execute(testDb.db);

    expect(versionResult.rows).toHaveLength(1);
    expect(versionResult.rows[0].postgis_version).toBeDefined();
    expect(versionResult.rows[0].postgis_version).toContain('3.');
  });

  it('can roll down migration cleanly without syntax errors', async () => {
    // Should execute down cleanly
    await expect(postgisMigration.down(testDb.db)).resolves.not.toThrow();

    // Re-enable for subsequent tests
    await postgisMigration.up(testDb.db);
  });
});
