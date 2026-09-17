import { Router } from 'express';
import * as authController from './auth.controller.js';
import { validate } from '../../common/middleware/validate.js';
import { googleAuthSchema, refreshSchema, devLoginSchema } from './auth.schemas.js';
import config from '../../../config/env.js';

/**
 * Builds and returns the /api/auth router.
 *
 * PRODUCTION SAFETY: /api/auth/dev-login is NOT registered when NODE_ENV === 'production'.
 * Any POST to that path in production will return 404 Not Found from the base Express router.
 * This is a hard server-side disable — the route does not exist at runtime in production.
 */
export function createAuthRouter(): Router {
  const router = Router();

  router.post('/google', validate(googleAuthSchema), authController.googleLogin);
  router.post('/refresh', validate(refreshSchema), authController.refreshToken);
  router.post('/logout', authController.logout);

  // Hard server-side disable in production — route is never registered
  if (!config.server.isProduction) {
    router.post('/dev-login', validate(devLoginSchema), authController.devLogin);
  }

  return router;
}
