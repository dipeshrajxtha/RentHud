import { Router } from 'express';
import type { Kysely } from 'kysely';
import type { Database } from '../../types/database.js';
import * as landlordsController from './landlords.controller.js';
import { authenticate } from '../../common/middleware/authenticate.js';
import { requireLandlord } from '../../common/middleware/requireRole.js';
import { validate } from '../../common/middleware/validate.js';
import {
  createLandlordProfileSchema,
  updateLandlordProfileSchema,
  landlordIdParamSchema,
} from './landlords.schemas.js';

/**
 * Creates the single canonical /api/landlords router.
 *
 * Rules enforced:
 * - Authentication is required for all endpoints.
 * - The upgrade / initialization endpoint (POST /profile and POST /) DOES NOT require
 *   the landlord role beforehand, allowing a tenant to acquire landlord capability.
 * - Profile retrieval (GET /me, GET /profile), updates (PATCH /me, PATCH /profile),
 *   and lookup by ID (GET /:id) require the authenticated user to possess the landlord role.
 */
export function createLandlordsRouter(dbInstance?: Kysely<Database>): Router {
  const router = Router();

  if (dbInstance) {
    router.use((req, _res, next) => {
      if (!req.app.locals.db) {
        req.app.locals.db = dbInstance;
      }
      next();
    });
  }

  // All landlord routes require a valid access token
  router.use(authenticate);

  // 1. Upgrade / Create landlord capability — does NOT require landlord role beforehand
  router.post(
    '/profile',
    validate(createLandlordProfileSchema),
    landlordsController.createOrUpgradeProfile
  );
  router.post(
    '/',
    validate(createLandlordProfileSchema),
    landlordsController.createOrUpgradeProfile
  );

  // 2. Profile retrieval & updates — requires landlord role
  router.get('/me', requireLandlord, landlordsController.getMyProfile);
  router.get('/profile', requireLandlord, landlordsController.getMyProfile);
  router.patch(
    '/me',
    requireLandlord,
    validate(updateLandlordProfileSchema),
    landlordsController.updateMyProfile
  );
  router.patch(
    '/profile',
    requireLandlord,
    validate(updateLandlordProfileSchema),
    landlordsController.updateMyProfile
  );

  // 3. Retrieval by ID — requires landlord role, validates UUID param
  router.get(
    '/:id',
    requireLandlord,
    validate(landlordIdParamSchema, 'params'),
    landlordsController.getProfileById
  );

  return router;
}
