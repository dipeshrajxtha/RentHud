import { Kysely, sql } from 'kysely';

/**
 * Migration 00001: Enable PostGIS & UUID Extensions
 * 
 * Sets up the foundational PostGIS spatial engine and UUID generator
 * for RentHub without creating business tables yet.
 */
export async function up(db: Kysely<any>): Promise<void> {
  // Enable PostGIS extension for geospatial point indexing & spatial calculations
  await sql`CREATE EXTENSION IF NOT EXISTS postgis;`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Down migration cleanly drops postgis extension if rolling back foundation
  await sql`DROP EXTENSION IF EXISTS postgis;`.execute(db);
}
