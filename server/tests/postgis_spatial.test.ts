import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { sql } from 'kysely';
import { createTestDatabase, type TestDbInstance } from './helpers/test-db.js';
import {
  getNextRadiusStep,
  getRadiusStepInfo,
  RADIUS_PROGRESSION_KM,
  stDistanceMeters,
  stDWithin,
  stMakePointGeography,
  validateCoordinates,
} from '../src/common/gis.js';

describe('PostGIS Spatial Functions & Geographic Indexing Verification', () => {
  let testDb: TestDbInstance;

  // Real-world reference locations in Kathmandu Valley (EPSG:4326)
  // Kathmandu Durbar Square
  const ktmDurbar = { longitude: 85.3075, latitude: 27.7042 };
  // Patan Durbar Square (~3.8 km away)
  const patanDurbar = { longitude: 85.3250, latitude: 27.6734 };
  // Bhaktapur Durbar Square (~12.5 km away)
  const bhaktapurDurbar = { longitude: 85.4280, latitude: 27.6722 };

  beforeAll(async () => {
    testDb = await createTestDatabase();
  }, 240_000);

  afterAll(async () => {
    if (testDb) {
      await testDb.destroy();
    }
  });

  describe('PostGIS Engine Verification', () => {
    it('verifies PostGIS extension is loaded and reports valid version', async () => {
      const result = await sql<{ version: string }>`
        SELECT PostGIS_Version() as version;
      `.execute(testDb.db);

      expect(result.rows).toHaveLength(1);
      const version = result.rows[0].version;
      expect(version).toBeDefined();
      expect(version).toMatch(/3\./);
    });

    it('creates valid geography point using ST_MakePoint and ST_SetSRID (4326)', async () => {
      const pointSql = stMakePointGeography(ktmDurbar.longitude, ktmDurbar.latitude);
      const result = await sql<{ as_text: string }>`
        SELECT ST_AsText(${pointSql}) as as_text;
      `.execute(testDb.db);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].as_text).toBe('POINT(85.3075 27.7042)');
    });
  });

  describe('Geodesic Distance Verification (ST_Distance)', () => {
    it('accurately computes distance in meters between Kathmandu and Patan (~3.8 km)', async () => {
      const p1 = stMakePointGeography(ktmDurbar.longitude, ktmDurbar.latitude);
      const p2 = stMakePointGeography(patanDurbar.longitude, patanDurbar.latitude);

      const result = await sql<{ distance_meters: number }>`
        SELECT ST_Distance(${p1}, ${p2}) as distance_meters;
      `.execute(testDb.db);

      expect(result.rows).toHaveLength(1);
      const distance = result.rows[0].distance_meters;

      // Real geodesic distance between these two coordinates is ~3800m - 4100m
      expect(distance).toBeGreaterThan(3500);
      expect(distance).toBeLessThan(4500);
    });

    it('accurately computes distance between Kathmandu and Bhaktapur (~12.5 km)', async () => {
      const p1 = stMakePointGeography(ktmDurbar.longitude, ktmDurbar.latitude);
      const p3 = stMakePointGeography(bhaktapurDurbar.longitude, bhaktapurDurbar.latitude);

      const result = await sql<{ distance_meters: number }>`
        SELECT ST_Distance(${p1}, ${p3}) as distance_meters;
      `.execute(testDb.db);

      const distance = result.rows[0].distance_meters;
      expect(distance).toBeGreaterThan(11000);
      expect(distance).toBeLessThan(14000);
    });
  });

  describe('Spatial Radius Evaluation (ST_DWithin)', () => {
    it('correctly evaluates ST_DWithin: Kathmandu to Patan within 5,000m radius is true', async () => {
      const p1 = stMakePointGeography(ktmDurbar.longitude, ktmDurbar.latitude);
      const p2 = stMakePointGeography(patanDurbar.longitude, patanDurbar.latitude);

      const result = await sql<{ is_within: boolean }>`
        SELECT ST_DWithin(${p1}, ${p2}, 5000) as is_within;
      `.execute(testDb.db);

      expect(result.rows[0].is_within).toBe(true);
    });

    it('correctly evaluates ST_DWithin: Kathmandu to Patan within 2,000m radius is false', async () => {
      const p1 = stMakePointGeography(ktmDurbar.longitude, ktmDurbar.latitude);
      const p2 = stMakePointGeography(patanDurbar.longitude, patanDurbar.latitude);

      const result = await sql<{ is_within: boolean }>`
        SELECT ST_DWithin(${p1}, ${p2}, 2000) as is_within;
      `.execute(testDb.db);

      expect(result.rows[0].is_within).toBe(false);
    });
  });

  describe('Coordinate Validation & Exponential Radius Progression Engine', () => {
    it('validates coordinate boundaries accurately', () => {
      expect(validateCoordinates({ latitude: 27.7172, longitude: 85.3240 }).valid).toBe(true);
      expect(validateCoordinates({ latitude: 91, longitude: 85.3240 }).valid).toBe(false);
      expect(validateCoordinates({ latitude: -95, longitude: 85.3240 }).valid).toBe(false);
      expect(validateCoordinates({ latitude: 27.7172, longitude: 185 }).valid).toBe(false);
      expect(validateCoordinates({ latitude: NaN, longitude: 85.3240 }).valid).toBe(false);
    });

    it('validates extreme coordinate boundaries accurately', () => {
      expect(validateCoordinates({ latitude: 90, longitude: 180 }).valid).toBe(true);
      expect(validateCoordinates({ latitude: -90, longitude: -180 }).valid).toBe(true);
      expect(validateCoordinates({ latitude: 0, longitude: 0 }).valid).toBe(true);
      expect(validateCoordinates({ latitude: 90.0001, longitude: 0 }).valid).toBe(false);
      expect(validateCoordinates({ latitude: 0, longitude: 180.0001 }).valid).toBe(false);
      expect(validateCoordinates({ latitude: 0, longitude: -180.0001 }).valid).toBe(false);
      expect(validateCoordinates({ latitude: -90.0001, longitude: 0 }).valid).toBe(false);
    });

    it('progresses through exponential radius stages [1, 2, 4, 8, 16, 32] km', () => {
      expect(RADIUS_PROGRESSION_KM).toEqual([1, 2, 4, 8, 16, 32]);

      const step1 = getRadiusStepInfo(1);
      expect(step1.radiusKm).toBe(1);
      expect(step1.radiusMeters).toBe(1000);
      expect(step1.maxRadiusReached).toBe(false);

      const step2 = getNextRadiusStep(1);
      expect(step2.radiusKm).toBe(2);
      expect(step2.radiusMeters).toBe(2000);

      const step3 = getNextRadiusStep(2);
      expect(step3.radiusKm).toBe(4);
      expect(step3.radiusMeters).toBe(4000);

      const step6 = getRadiusStepInfo(6);
      expect(step6.radiusKm).toBe(32);
      expect(step6.radiusMeters).toBe(32000);
      expect(step6.maxRadiusReached).toBe(true);
    });

    it('handles out-of-range step levels by safely clamping to boundaries', () => {
      // Step <= 0 clamped to step 1 (1 km)
      const stepLow = getRadiusStepInfo(0);
      expect(stepLow.stepLevel).toBe(1);
      expect(stepLow.radiusKm).toBe(1);
      expect(stepLow.maxRadiusReached).toBe(false);

      // Step > 6 clamped to step 6 (32 km)
      const stepHigh = getRadiusStepInfo(10);
      expect(stepHigh.stepLevel).toBe(6);
      expect(stepHigh.radiusKm).toBe(32);
      expect(stepHigh.maxRadiusReached).toBe(true);

      // getNextRadiusStep from max step level remains clamped at step 6
      const nextFromMax = getNextRadiusStep(6);
      expect(nextFromMax.stepLevel).toBe(6);
      expect(nextFromMax.radiusKm).toBe(32);
      expect(nextFromMax.maxRadiusReached).toBe(true);
    });

    it('accurately evaluates ST_DWithin at exact boundary threshold', async () => {
      const p1 = stMakePointGeography(ktmDurbar.longitude, ktmDurbar.latitude);
      const p2 = stMakePointGeography(patanDurbar.longitude, patanDurbar.latitude);

      // Distance between Ktm Durbar and Patan is ~3850m
      // Exactly 3800m is too small (false)
      const res3800 = await sql<{ is_within: boolean }>`
        SELECT ST_DWithin(${p1}, ${p2}, 3800) as is_within;
      `.execute(testDb.db);
      expect(res3800.rows[0].is_within).toBe(false);

      // 4000m includes Patan (true)
      const res4000 = await sql<{ is_within: boolean }>`
        SELECT ST_DWithin(${p1}, ${p2}, 4000) as is_within;
      `.execute(testDb.db);
      expect(res4000.rows[0].is_within).toBe(true);
    });
  });
});
