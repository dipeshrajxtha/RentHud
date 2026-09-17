import type { Kysely } from 'kysely';
import type { Application } from 'express';
import { createApp } from '../../src/app.js';
import type { Database } from '../../src/types/database.js';

/**
 * Creates an Express test application.
 * All tests use this factory to get a clean app instance.
 */
export function createTestApp(): Application {
  return createApp();
}
