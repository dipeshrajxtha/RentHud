import { Kysely, PostgresDialect, sql } from 'kysely';
import pg from 'pg';
import config from './env.js';
import type { Database } from '../src/types/database.js';

const { Pool } = pg;

export interface DatabasePoolConfig {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  min?: number;
  max?: number;
  ssl?: boolean | { rejectUnauthorized: boolean };
}

/**
 * Creates a configured PostgreSQL connection pool.
 */
export function createPgPool(customConfig?: Partial<DatabasePoolConfig>): pg.Pool {
  return new Pool({
    host: customConfig?.host ?? config.database.host,
    port: customConfig?.port ?? config.database.port,
    database: customConfig?.database ?? config.database.database,
    user: customConfig?.user ?? config.database.user,
    password: customConfig?.password ?? config.database.password,
    min: customConfig?.min ?? config.database.pool.min,
    max: customConfig?.max ?? config.database.pool.max,
    ssl: customConfig?.ssl ?? config.database.ssl,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

/**
 * Singleton database pool instance
 */
export const pool = createPgPool();

/**
 * Factory to build a Kysely instance with PostgresDialect
 */
export function createKyselyInstance<T = Database>(dbPool: pg.Pool): Kysely<T> {
  const dialect = new PostgresDialect({ pool: dbPool });
  return new Kysely<T>({
    dialect,
    log: (event) => {
      if (config.server.isDevelopment && event.level === 'query') {
        // Query logging in dev mode can be enabled if desired
      }
    },
  });
}

/**
 * Global Kysely query builder instance
 */
export const db = createKyselyInstance<Database>(pool);

/**
 * Health check helper to test database connectivity and PostGIS status
 */
export async function pingDatabase(targetDb: Kysely<any> = db): Promise<{
  connected: boolean;
  postgresVersion?: string;
  postgisVersion?: string;
  error?: string;
}> {
  try {
    const pgVersionRes = await sql<{ version: string }>`SELECT version()`.execute(targetDb);
    const postgresVersion = pgVersionRes.rows[0]?.version;

    let postgisVersion: string | undefined;
    try {
      const postgisVersionRes = await sql<{ postgis_full_version: string }>`SELECT PostGIS_Full_Version()`.execute(targetDb);
      postgisVersion = postgisVersionRes.rows[0]?.postgis_full_version;
    } catch {
      // PostGIS might not be installed yet before migrations
      postgisVersion = undefined;
    }

    return {
      connected: true,
      postgresVersion,
      postgisVersion,
    };
  } catch (err: any) {
    return {
      connected: false,
      error: err.message,
    };
  }
}

/**
 * Gracefully close connection pool
 */
export async function closeDatabase(): Promise<void> {
  await db.destroy();
  await pool.end();
}
