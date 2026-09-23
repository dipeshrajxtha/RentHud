import { Router } from 'express';
import type { Kysely } from 'kysely';
import type { Database } from '../../types/database.js';
import * as propertiesController from './properties.controller.js';
import { authenticate } from '../../common/middleware/authenticate.js';
import { requireLandlord } from '../../common/middleware/requireRole.js';
import { validate } from '../../common/middleware/validate.js';
import {
  propertySearchQuerySchema,
  propertyIdParamSchema,
  createPropertySchema,
  updatePropertySchema,
  createUnitSchema,
  updateUnitSchema,
  propertyAndUnitIdParamSchema,
} from './properties.schemas.js';

export function createPropertiesRouter(dbInstance?: Kysely<Database>): Router {
  const router = Router();

  if (dbInstance) {
    router.use((req, _res, next) => {
      if (!req.app.locals.db) {
        req.app.locals.db = dbInstance;
      }
      next();
    });
  }

  // ── Public Endpoints ────────────────────────────────────────────────────────

  // Public browsing with multi-parameter filtering & PostGIS spatial search
  router.get(
    '/',
    validate(propertySearchQuerySchema, 'query'),
    propertiesController.browseProperties
  );

  // ── Landlord Property Management Endpoints ─────────────────────────────────

  // Landlord creates a new property asset
  router.post(
    '/',
    authenticate,
    requireLandlord,
    validate(createPropertySchema, 'body'),
    propertiesController.createPropertyHandler
  );

  // Landlord lists their own properties (MUST be registered before /:id)
  router.get(
    '/mine',
    authenticate,
    requireLandlord,
    propertiesController.getMyPropertiesHandler
  );

  // Public rental listing details by property ID
  router.get(
    '/:id',
    validate(propertyIdParamSchema, 'params'),
    propertiesController.getListingDetails
  );

  // Landlord updates an existing property with ownership check
  router.patch(
    '/:id',
    authenticate,
    requireLandlord,
    validate(propertyIdParamSchema, 'params'),
    validate(updatePropertySchema, 'body'),
    propertiesController.updatePropertyHandler
  );

  // Landlord soft-deactivates an existing property
  router.delete(
    '/:id',
    authenticate,
    requireLandlord,
    validate(propertyIdParamSchema, 'params'),
    propertiesController.deletePropertyHandler
  );

  // ── Property Units Management Endpoints ────────────────────────────────────

  // Landlord adds a unit to their property
  router.post(
    '/:id/units',
    authenticate,
    requireLandlord,
    validate(propertyIdParamSchema, 'params'),
    validate(createUnitSchema, 'body'),
    propertiesController.createUnitHandler
  );

  // List units for a property
  router.get(
    '/:id/units',
    validate(propertyIdParamSchema, 'params'),
    propertiesController.getPropertyUnitsHandler
  );

  // Landlord updates a unit under their property
  router.patch(
    '/:propertyId/units/:unitId',
    authenticate,
    requireLandlord,
    validate(propertyAndUnitIdParamSchema, 'params'),
    validate(updateUnitSchema, 'body'),
    propertiesController.updateUnitHandler
  );

  // Landlord deletes or sets unit UNAVAILABLE
  router.delete(
    '/:propertyId/units/:unitId',
    authenticate,
    requireLandlord,
    validate(propertyAndUnitIdParamSchema, 'params'),
    propertiesController.deleteUnitHandler
  );

  return router;
}

