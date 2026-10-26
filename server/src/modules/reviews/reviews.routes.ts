import { Router } from 'express';
import * as reviewsController from './reviews.controller.js';
import { authenticate } from '../../common/middleware/authenticate.js';
import { validate } from '../../common/middleware/validate.js';
import { createReviewSchema, getReviewsQuerySchema } from './reviews.schemas.js';

/**
 * Reviews router mounted on /api/properties/:id/reviews
 * MergeParams allows access to :id from parent router if mounted that way,
 * or routes can specify :id explicitly.
 */
export function createReviewsRouter(): Router {
  const router = Router({ mergeParams: true });

  // GET /api/properties/:id/reviews (Public)
  router.get(
    '/',
    validate(getReviewsQuerySchema, 'query'),
    reviewsController.getReviews
  );

  // POST /api/properties/:id/reviews (Authenticated Tenant)
  router.post(
    '/',
    authenticate,
    validate(createReviewSchema),
    reviewsController.createReview
  );

  return router;
}
