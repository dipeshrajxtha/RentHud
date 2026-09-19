import type { Request, Response, NextFunction } from 'express';
import type { Kysely } from 'kysely';
import type { Database } from '../../types/database.js';
import { db as defaultDb } from '../../../config/database.js';
import { findActiveUserById, updateUserProfile, addLandlordRole } from './users.service.js';
import { signAccessToken } from '../../common/utils/jwt.js';
import { sendSuccess } from '../../common/utils/response.js';
import { NotFoundError } from '../../common/errors/index.js';
import type { UpdateProfileBody } from './users.schemas.js';
import type { UserRole } from '../../../../shared/enums/roles.js';

function getDb(req: Request): Kysely<Database> {
  return (req.app?.locals?.db as Kysely<Database>) ?? defaultDb;
}

/**
 * GET /api/users/me
 * Returns the full profile of the authenticated user.
 * Full PII is only available here — not in the JWT access token.
 */
export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const user = await findActiveUserById(db, req.user!.id);
    if (!user) {
      throw new NotFoundError('User not found or deactivated');
    }

    sendSuccess(res, {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatar_url,
      phone: user.phone,
      roles: user.roles,
      createdAt: user.created_at,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/users/me
 * Updates mutable profile fields: name, phone, avatar_url.
 */
export async function updateMe(
  req: Request<{}, {}, UpdateProfileBody>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const user = await updateUserProfile(db, req.user!.id, req.body);
    sendSuccess(res, {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatar_url,
      phone: user.phone,
      roles: user.roles,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/users/me/roles/landlord
 * Upgrades the current tenant to a landlord by appending 'landlord' to users.roles.
 * Returns a fresh access token reflecting the updated roles.
 */
export async function becomeLandlord(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const user = await addLandlordRole(db, req.user!.id);
    const roles = user.roles as UserRole[];
    const accessToken = signAccessToken(user.id, roles);

    sendSuccess(res, {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url,
        roles,
      },
    });
  } catch (err) {
    next(err);
  }
}
