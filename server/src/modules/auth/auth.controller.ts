import type { Request, Response, NextFunction } from 'express';
import { db } from '../../../config/database.js';
import { verifyGoogleIdToken, resolveUserFromGoogle, issueTokens } from './auth.service.js';
import { verifyRefreshToken } from '../../common/utils/jwt.js';
import { setRefreshCookie, clearRefreshCookie, REFRESH_COOKIE_NAME } from '../../common/utils/cookies.js';
import { sendSuccess } from '../../common/utils/response.js';
import { UnauthorizedError, ForbiddenError } from '../../common/errors/index.js';
import { findActiveUserById } from '../users/index.js';
import type { GoogleAuthBody, RefreshBody, DevLoginBody } from './auth.schemas.js';
import type { UserRole } from '../../../../shared/enums/roles.js';
import { signAccessToken, signRefreshToken } from '../../common/utils/jwt.js';

/**
 * POST /api/auth/google
 * Verifies a Google ID token, resolves the RentHub user, and issues session tokens.
 */
export async function googleLogin(
  req: Request<{}, {}, GoogleAuthBody>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const claims = await verifyGoogleIdToken(req.body.idToken);
    const user = await resolveUserFromGoogle(db, claims);
    const tokens = issueTokens(user);

    setRefreshCookie(res, tokens.refreshToken);

    sendSuccess(res, {
      accessToken: tokens.accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url,
        roles: user.roles,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/refresh
 * Verifies the stateless refresh token (from HttpOnly cookie or request body for mobile).
 * Issues a new 15m access token.
 *
 * NOTE: No rotation — the refresh token is not replaced.
 * The token remains valid until its 30d expiry unless the account is deactivated.
 */
export async function refreshToken(
  req: Request<{}, {}, RefreshBody>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Accept from cookie (web) or body (mobile)
    const rawToken = (req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined) ?? req.body?.refreshToken;

    if (!rawToken) {
      throw new UnauthorizedError('No refresh token provided');
    }

    let payload;
    try {
      payload = verifyRefreshToken(rawToken);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Verify user still exists and is active in DB
    const user = await findActiveUserById(db, payload.sub);
    if (!user) {
      throw new ForbiddenError('Account not found or deactivated');
    }

    const roles = user.roles as UserRole[];
    const newAccessToken = signAccessToken(user.id, roles);

    sendSuccess(res, { accessToken: newAccessToken });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 * Clears the refresh token cookie.
 * Note: The stateless refresh token remains cryptographically valid until expiry.
 * Deactivate the user account (is_active = false) to force an immediate session kill.
 */
export async function logout(
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  clearRefreshCookie(res);
  sendSuccess(res, { message: 'Logged out successfully' });
}

/**
 * POST /api/auth/dev-login
 *
 * PERMANENTLY DISABLED IN PRODUCTION.
 * This function is only reachable in development/test environments.
 * The route is not registered in the Express router when NODE_ENV === 'production',
 * so in production this handler is never called and the endpoint returns 404.
 */
export async function devLogin(
  req: Request<{}, {}, DevLoginBody>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, roles, name } = req.body;

    // Find or create a test user
    let user = await db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', email.toLowerCase())
      .executeTakeFirst();

    if (!user) {
      user = await db
        .insertInto('users')
        .values({
          email: email.toLowerCase(),
          name,
          google_id: null,
          avatar_url: null,
          roles,
          is_active: true,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    }

    if (!user.is_active) {
      throw new ForbiddenError('Account is deactivated');
    }

    const userRoles = (user.roles as UserRole[]);
    const accessToken = signAccessToken(user.id, userRoles);
    const refreshToken = signRefreshToken(user.id);

    setRefreshCookie(res, refreshToken);
    sendSuccess(res, {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url,
        roles: user.roles,
      },
    });
  } catch (err) {
    next(err);
  }
}
