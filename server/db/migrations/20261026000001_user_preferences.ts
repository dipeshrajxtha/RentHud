import { Kysely, sql } from 'kysely';

/**
 * Migration 00006: Add User Preferences
 *
 * Adds a `preferences` JSONB column to the `users` table to persist
 * tenant survey results, onboarding answers, and matching criteria
 * across sessions and devices.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS preferences JSONB;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE users
      DROP COLUMN IF EXISTS preferences;
  `.execute(db);
}
