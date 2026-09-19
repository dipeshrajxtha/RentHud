import type { Request, Response, NextFunction } from 'express';
import type { Kysely } from 'kysely';
import type { Database } from '../../types/database.js';
import { db as defaultDb } from '../../../config/database.js';
import {
  findActiveLandlordById,
  createOrUpgradeLandlordProfile,
  updateLandlordProfile,
} from './landlords.service.js';
import { signAccessToken } from '../../common/utils/jwt.js';
import { sendSuccess } from '../../common/utils/response.js';
import { NotFoundError } from '../../common/errors/index.js';
import type { UserRole } from '../../../../shared/enums/roles.js';
import type {
  CreateLandlordProfileBody,
  UpdateLandlordProfileBody,
  LandlordIdParam,
} from './landlords.schemas.js';

export function getDb(req: Request): Kysely<Database> {
  return (req.app?.locals?.db as Kysely<Database>) ?? defaultDb;
}

/**
 * POST /api/landlords/profile & POST /api/landlords
 * Upgrades or creates landlord capability for the authenticated user.
 * Idempotently appends 'landlord' to roles while preserving existing roles (e.g. tenant).
 * Returns fresh access token and landlord profile.
 * DOES NOT require landlord role beforehand.
 */
export async function createOrUpgradeProfile(
  req: Request<{}, {}, CreateLandlordProfileBody>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const user = await createOrUpgradeLandlordProfile(db, req.user!.id, req.body);
    const roles = user.roles as UserRole[];
    const accessToken = signAccessToken(user.id, roles);

    sendSuccess(
      res,
      {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatar_url,
          phone: user.phone,
          roles,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
      },
      201
    );
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/landlords/me & GET /api/landlords/profile
 * Retrieves the landlord profile of the authenticated user.
 * Requires authentication and landlord role.
 */
export async function getMyProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const landlord = await findActiveLandlordById(db, req.user!.id);
    if (!landlord) {
      throw new NotFoundError('Landlord profile not found or deactivated');
    }

    sendSuccess(res, {
      id: landlord.id,
      email: landlord.email,
      name: landlord.name,
      avatarUrl: landlord.avatar_url,
      phone: landlord.phone,
      roles: landlord.roles,
      createdAt: landlord.created_at,
      updatedAt: landlord.updated_at,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/landlords/me & PATCH /api/landlords/profile
 * Updates mutable profile fields for the authenticated landlord.
 * Requires authentication and landlord role.
 */
export async function updateMyProfile(
  req: Request<{}, {}, UpdateLandlordProfileBody>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const landlord = await updateLandlordProfile(db, req.user!.id, req.body);

    sendSuccess(res, {
      id: landlord.id,
      email: landlord.email,
      name: landlord.name,
      avatarUrl: landlord.avatar_url,
      phone: landlord.phone,
      roles: landlord.roles,
      createdAt: landlord.created_at,
      updatedAt: landlord.updated_at,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/landlords/:id
 * Retrieves landlord profile by ID.
 * Validates params.id as UUID.
 * Returns 404 if not found or not a landlord.
 */
export async function getProfileById(
  req: Request<LandlordIdParam>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const landlord = await findActiveLandlordById(db, req.params.id);
    if (!landlord) {
      throw new NotFoundError('Landlord profile not found or deactivated');
    }

    sendSuccess(res, {
      id: landlord.id,
      email: landlord.email,
      name: landlord.name,
      avatarUrl: landlord.avatar_url,
      phone: landlord.phone,
      roles: landlord.roles,
      createdAt: landlord.created_at,
    });
  } catch (err) {
    next(err);
  }
}
