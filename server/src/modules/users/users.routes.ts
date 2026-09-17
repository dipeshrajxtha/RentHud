import { Router } from 'express';
import * as usersController from './users.controller.js';
import { authenticate } from '../../common/middleware/authenticate.js';
import { validate } from '../../common/middleware/validate.js';
import { updateProfileSchema } from './users.schemas.js';

export function createUsersRouter(): Router {
  const router = Router();

  // All /api/users routes require a valid access token
  router.use(authenticate);

  router.get('/me', usersController.getMe);
  router.patch('/me', validate(updateProfileSchema), usersController.updateMe);
  router.post('/me/roles/landlord', usersController.becomeLandlord);

  return router;
}
