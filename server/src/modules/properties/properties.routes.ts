import { Router } from 'express';
import type { Kysely } from 'kysely';
import type { Database } from '../../types/database.js';
import * as propertiesController from './properties.controller.js';
import { validate } from '../../common/middleware/validate.js';
import {
  propertySearchQuerySchema,
  propertyIdParamSchema,
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

  // Public browsing with multi-parameter filtering & PostGIS spatial search
  router.get(
    '/',
    validate(propertySearchQuerySchema, 'query'),
    propertiesController.browseProperties
  );

  // Public rental listing details by property ID
  router.get(
    '/:id',
    validate(propertyIdParamSchema, 'params'),
    propertiesController.getListingDetails
  );

  return router;
}
