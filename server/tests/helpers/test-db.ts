import { PGlite } from '@electric-sql/pglite';
import { postgis } from '@electric-sql/pglite-postgis';
import { KyselyPGlite } from 'kysely-pglite';
import { Kysely, sql } from 'kysely';
import type { Database } from '../../src/types/database.js';

export interface TestDbInstance {
  db: Kysely<Database>;
  client: PGlite;
  destroy: () => Promise<void>;
}

/**
 * Creates an isolated in-memory PostgreSQL instance with PostGIS extension preloaded
 * for testing and verification.
 */
export async function createTestDatabase(): Promise<TestDbInstance> {
  const client = new PGlite({
    extensions: {
      postgis,
    },
  });

  const pgliteWrapper = new KyselyPGlite(client);
  const db = new Kysely<Database>({
    dialect: pgliteWrapper.dialect,
  });

  // Enable postgis and uuid-ossp extensions
  await sql`CREATE EXTENSION IF NOT EXISTS postgis;`.execute(db);

  return {
    db,
    client,
    destroy: async () => {
      try {
        await db.destroy();
      } catch {}
      try {
        if (!client.closed) {
          await client.close();
        }
      } catch {}
    },
  };
}
