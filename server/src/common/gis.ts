import { sql, RawBuilder } from 'kysely';
import config from '../../config/env.js';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Validates whether latitude and longitude are within standard geographical bounds.
 */
export function validateCoordinates(coords: Coordinates): { valid: boolean; reason?: string } {
  const { latitude, longitude } = coords;

  if (typeof latitude !== 'number' || Number.isNaN(latitude)) {
    return { valid: false, reason: 'Latitude must be a valid number' };
  }
  if (typeof longitude !== 'number' || Number.isNaN(longitude)) {
    return { valid: false, reason: 'Longitude must be a valid number' };
  }
  if (latitude < -90 || latitude > 90) {
    return { valid: false, reason: `Latitude must be between -90 and 90. Received: ${latitude}` };
  }
  if (longitude < -180 || longitude > 180) {
    return { valid: false, reason: `Longitude must be between -180 and 180. Received: ${longitude}` };
  }

  return { valid: true };
}

/**
 * PostGIS SQL Fragment: Constructs a GEOGRAPHY(Point, 4326) from longitude and latitude.
 * Note: PostGIS ST_MakePoint takes (longitude, latitude) order.
 */
export function stMakePointGeography(longitude: number, latitude: number): RawBuilder<any> {
  return sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography`;
}

/**
 * PostGIS SQL Fragment: Calculates distance in meters between a geography column and coordinates.
 */
export function stDistanceMeters(
  geographyColumn: RawBuilder<any> | string,
  longitude: number,
  latitude: number
): RawBuilder<number> {
  const col = typeof geographyColumn === 'string' ? sql.ref(geographyColumn) : geographyColumn;
  return sql`ST_Distance(${col}, ${stMakePointGeography(longitude, latitude)})`;
}

/**
 * PostGIS SQL Fragment: Checks whether a geography column is within radiusMeters of coordinates.
 */
export function stDWithin(
  geographyColumn: RawBuilder<any> | string,
  longitude: number,
  latitude: number,
  radiusMeters: number
): RawBuilder<boolean> {
  const col = typeof geographyColumn === 'string' ? sql.ref(geographyColumn) : geographyColumn;
  return sql`ST_DWithin(${col}, ${stMakePointGeography(longitude, latitude)}, ${radiusMeters})`;
}

/**
 * Spatial Radius Progression Engine (Architecture Spec Section 6.2)
 * Progresses through steps: [1, 2, 4, 8, 16, 32] km
 */
export const RADIUS_PROGRESSION_KM = config.spatial.radiusProgressionKm;

export interface RadiusStepInfo {
  stepLevel: number;
  radiusKm: number;
  radiusMeters: number;
  maxRadiusReached: boolean;
}

export function getRadiusStepInfo(stepLevel: number): RadiusStepInfo {
  const clampedStep = Math.max(1, Math.min(stepLevel, RADIUS_PROGRESSION_KM.length));
  const radiusKm = RADIUS_PROGRESSION_KM[clampedStep - 1];
  const maxRadiusReached = clampedStep >= RADIUS_PROGRESSION_KM.length;

  return {
    stepLevel: clampedStep,
    radiusKm,
    radiusMeters: radiusKm * 1000,
    maxRadiusReached,
  };
}

export function getNextRadiusStep(currentStep: number): RadiusStepInfo {
  return getRadiusStepInfo(currentStep + 1);
}
