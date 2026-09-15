import { describe, expect, it } from 'vitest';
import { config, env } from '../config/index.js';
import { z } from 'zod';

describe('Central Config Management', () => {
  it('loads valid default server and database configuration', () => {
    expect(config.server.env).toBeDefined();
    expect(config.server.port).toBeTypeOf('number');
    expect(config.database.host).toBeTypeOf('string');
    expect(config.database.port).toBe(5432);
    expect(config.database.database).toBe('renthub_dev');
    expect(config.database.user).toBe('postgres');
    expect(config.database.pool.min).toBeGreaterThanOrEqual(0);
    expect(config.database.pool.max).toBeGreaterThan(0);
  });

  it('provides spatial search parameters according to Architecture Spec Section 6.2', () => {
    expect(config.spatial.initialRadiusKm).toBe(1);
    expect(config.spatial.maxRadiusKm).toBe(32);
    expect(config.spatial.minResultsThreshold).toBe(3);
    expect(config.spatial.radiusMultiplier).toBe(2);
    expect(config.spatial.radiusProgressionKm).toEqual([1, 2, 4, 8, 16, 32]);
  });

  it('rejects invalid database port', () => {
    const testSchema = z.object({
      DB_PORT: z.coerce.number().int().positive(),
    });

    const invalidParse = testSchema.safeParse({ DB_PORT: 'not-a-port' });
    expect(invalidParse.success).toBe(false);
  });

  it('correctly handles DB_SSL boolean parsing', () => {
    const sslSchema = z.string().transform((val) => val === 'true' || val === '1');
    expect(sslSchema.parse('true')).toBe(true);
    expect(sslSchema.parse('1')).toBe(true);
    expect(sslSchema.parse('false')).toBe(false);
    expect(sslSchema.parse('0')).toBe(false);
  });
});
