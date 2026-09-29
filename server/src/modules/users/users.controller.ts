import type { Request, Response, NextFunction } from 'express';
import type { Kysely } from 'kysely';
import type { Database } from '../../types/database.js';
import { db as defaultDb } from '../../../config/database.js';
import {
  findActiveUserById,
  updateUserProfile,
  addLandlordRole,
  setInitialRoles,
  addRole,
} from './users.service.js';
import { signAccessToken } from '../../common/utils/jwt.js';
import { sendSuccess } from '../../common/utils/response.js';
import { NotFoundError } from '../../common/errors/index.js';
import type { UpdateProfileBody, SetRolesBody, AddRoleParam } from './users.schemas.js';
import type { UserRole } from '../../../../shared/enums/roles.js';

function getDb(req: Request): Kysely<Database> {
  return (req.app?.locals?.db as Kysely<Database>) ?? defaultDb;
}

function userPayload(user: Awaited<ReturnType<typeof findActiveUserById>>) {
  if (!user) throw new NotFoundError('User not found');
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatar_url,
    phone: user.phone,
    roles: user.roles as UserRole[],
    isNewUser: ((user.roles as string[]) ?? []).length === 0,
    createdAt: user.created_at,
  };
}

/**
 * GET /api/users/me
 */
export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const db = getDb(req);
    const user = await findActiveUserById(db, req.user!.id);
    if (!user) throw new NotFoundError('User not found or deactivated');
    sendSuccess(res, userPayload(user));
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/users/me
 */
export async function updateMe(
  req: Request<{}, {}, UpdateProfileBody>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const user = await updateUserProfile(db, req.user!.id, req.body);
    sendSuccess(res, userPayload(user));
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/users/me/roles
 * Sets the initial roles for a brand-new user (onboarding).
 * Returns a fresh access token with the new roles.
 */
export async function setMyRoles(
  req: Request<{}, {}, SetRolesBody>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const user = await setInitialRoles(db, req.user!.id, req.body.roles);
    const roles = user.roles as UserRole[];
    const accessToken = signAccessToken(user.id, roles);

    sendSuccess(res, {
      accessToken,
      user: userPayload(user),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/users/me/roles/:role
 * Adds a second role to an existing user (e.g. tenant adding landlord).
 * Returns a fresh access token with the updated roles.
 */
export async function addMyRole(
  req: Request<AddRoleParam>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const user = await addRole(db, req.user!.id, req.params.role as UserRole);
    const roles = user.roles as UserRole[];
    const accessToken = signAccessToken(user.id, roles);

    sendSuccess(res, {
      accessToken,
      user: userPayload(user),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/users/me/roles/landlord
 * @deprecated Use POST /api/users/me/roles/landlord (same endpoint now via addMyRole)
 */
export async function becomeLandlord(req: Request, res: Response, next: NextFunction): Promise<void> {
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
