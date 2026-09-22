import type { Request, Response, NextFunction } from 'express';
import type { Kysely } from 'kysely';
import type { Database } from '../../types/database.js';
import { db as defaultDb } from '../../../config/database.js';
import { searchProperties, getPropertyById } from './properties.service.js';
import { sendSuccess } from '../../common/utils/response.js';
import type { PropertySearchQuery, PropertyIdParam } from './properties.schemas.js';

export function getDb(req: Request): Kysely<Database> {
  return (req.app?.locals?.db as Kysely<Database>) ?? defaultDb;
}

/**
 * GET /api/properties
 * Public browsing and spatial discovery of rental listings.
 */
export async function browseProperties(
  req: Request<{}, {}, {}, PropertySearchQuery>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const result = await searchProperties(db, req.query);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/properties/:id
 * Public rental listing details. Safe public fields only.
 */
export async function getListingDetails(
  req: Request<PropertyIdParam>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const property = await getPropertyById(db, req.params.id);
    sendSuccess(res, property, 200);
  } catch (err) {
    next(err);
  }
}
