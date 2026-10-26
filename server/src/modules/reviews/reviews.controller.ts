import type { Request, Response, NextFunction } from 'express';
import type { Kysely } from 'kysely';
import type { Database } from '../../types/database.js';
import { db as defaultDb } from '../../../config/database.js';
import {
  createPropertyReview,
  getPropertyReviews,
  checkTenancyReviewEligibility,
} from './reviews.service.js';
import { sendSuccess } from '../../common/utils/response.js';
import type { CreateReviewBody, GetReviewsQuery } from './reviews.schemas.js';

function getDb(req: Request): Kysely<Database> {
  return (req.app?.locals?.db as Kysely<Database>) ?? defaultDb;
}

/**
 * POST /api/properties/:id/reviews
 * Creates a verified review for a property.
 */
export async function createReview(
  req: Request<{ id: string }, {}, CreateReviewBody>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const propertyId = req.params.id;
    const userId = req.user!.id;
    const review = await createPropertyReview(db, propertyId, userId, req.body);
    sendSuccess(res, review, 201);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/properties/:id/reviews
 * Public retrieval of property reviews and rating metrics.
 */
export async function getReviews(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const propertyId = req.params.id as string;
    const limit = Number(req.query.limit) || 10;
    const offset = Number(req.query.offset) || 0;
    const result = await getPropertyReviews(db, propertyId, limit, offset);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/tenancy/leases/:id/review-eligibility
 * Checks whether the authenticated tenant can submit a review for this lease.
 */
export async function getReviewEligibility(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const tenancyId = req.params.id;
    const userId = req.user!.id;
    const eligibility = await checkTenancyReviewEligibility(db, tenancyId, userId);
    sendSuccess(res, eligibility);
  } catch (err) {
    next(err);
  }
}
