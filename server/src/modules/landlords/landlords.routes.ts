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
 * - All endpoints require the authenticated user to possess the landlord role
 *   (single-role enforcement — no cross-role acquisition).
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

  // 1. Landlord profile setup — requires landlord role
  router.post(
    '/profile',
    requireLandlord,
    validate(createLandlordProfileSchema),
    landlordsController.createOrUpgradeProfile
  );
  router.post(
    '/',
    requireLandlord,
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
