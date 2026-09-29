import { Router } from 'express';
import * as usersController from './users.controller.js';
import { authenticate } from '../../common/middleware/authenticate.js';
import { validate } from '../../common/middleware/validate.js';
import { updateProfileSchema, setRolesSchema, addRoleParamSchema } from './users.schemas.js';

export function createUsersRouter(): Router {
  const router = Router();

  // All /api/users routes require a valid access token
  router.use(authenticate);

  router.get('/me', usersController.getMe);
  router.patch('/me', validate(updateProfileSchema), usersController.updateMe);

  // Role management
  // POST /api/users/me/roles       — set initial roles (onboarding, roles must be empty)
  // POST /api/users/me/roles/:role — add a second role (tenant ↔ landlord)
  router.post('/me/roles', validate(setRolesSchema), usersController.setMyRoles);
  router.post('/me/roles/:role', validate(addRoleParamSchema, 'params'), usersController.addMyRole);

  // Legacy alias kept for back compat
  // POST /api/users/me/roles/landlord is now handled by addMyRole above

  return router;
}
