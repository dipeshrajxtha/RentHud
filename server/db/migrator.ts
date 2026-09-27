import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  FileMigrationProvider,
  Kysely,
  MigrationResultSet,
  Migrator,
} from 'kysely';
import { db as defaultDb } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const MIGRATIONS_DIR = path.resolve(__dirname, 'migrations');

import { pathToFileURL } from 'url';
import type { Migration, MigrationProvider } from 'kysely';

export class EsmFileMigrationProvider implements MigrationProvider {
  constructor(private migrationFolder: string) {}

  async getMigrations(): Promise<Record<string, Migration>> {
    const files = await fs.readdir(this.migrationFolder);
    const migrations: Record<string, Migration> = {};

    for (const file of files.sort()) {
      if (
        (file.endsWith('.ts') && !file.endsWith('.d.ts')) ||
        file.endsWith('.js') ||
        file.endsWith('.mjs')
      ) {
        const migrationKey = file.substring(0, file.lastIndexOf('.'));
        const filePath = path.join(this.migrationFolder, file);
        const fileUrl = pathToFileURL(filePath).href;
        const migration = await import(fileUrl);
        migrations[migrationKey] = migration;
      }
    }

    return migrations;
  }
}

/**
 * Creates a Kysely Migrator instance with EsmFileMigrationProvider
 */
export function createMigrator(database: Kysely<any> = defaultDb): Migrator {
  return new Migrator({
    db: database,
    provider: new EsmFileMigrationProvider(MIGRATIONS_DIR),
  });
}

/**
 * Run pending migrations up to the latest version
 */
export async function migrateToLatest(database: Kysely<any> = defaultDb): Promise<MigrationResultSet> {
  const migrator = createMigrator(database);
  const result = await migrator.migrateToLatest();
  return result;
}

/**
 * Rollback the most recently executed migration step
 */
export async function migrateDown(database: Kysely<any> = defaultDb): Promise<MigrationResultSet> {
  const migrator = createMigrator(database);
  const result = await migrator.migrateDown();
  return result;
}

/**
 * Get the list of all migrations and their execution status
 */
export async function getMigrationStatus(database: Kysely<any> = defaultDb) {
  const migrator = createMigrator(database);
  const migrations = await migrator.getMigrations();
  return migrations;
}
