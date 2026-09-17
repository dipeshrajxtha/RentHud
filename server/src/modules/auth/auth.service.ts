import { OAuth2Client } from 'google-auth-library';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import config from '../../../config/env.js';
import type { Database, User } from '../../types/database.js';
import { UnauthorizedError, ForbiddenError, ConflictError } from '../../common/errors/index.js';
import { signAccessToken, signRefreshToken } from '../../common/utils/jwt.js';
import type { UserRole } from '../../../../shared/enums/roles.js';

const googleClient = new OAuth2Client(config.auth.google.clientId);

export interface GoogleClaims {
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  emailVerified: boolean;
}

/**
 * Verifies a Google ID token.
 *
 * The audience is explicitly checked against config.auth.google.clientId
 * (GOOGLE_CLIENT_ID env var), which must be the intended RentHub OAuth Client ID.
 * Any audience mismatch causes google-auth-library to throw, returning 401.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleClaims> {
  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken,
      audience: config.auth.google.clientId,
    });
  } catch {
    throw new UnauthorizedError('Invalid or expired Google ID token');
  }

  const payload = ticket.getPayload();
  if (!payload) {
    throw new UnauthorizedError('Google token payload missing');
  }

  if (!payload.email_verified) {
    throw new UnauthorizedError('Google account email is not verified');
  }

  return {
    googleId: payload.sub,
    email: payload.email!.toLowerCase(),
    name: payload.name ?? '',
    avatarUrl: payload.picture ?? null,
    emailVerified: !!payload.email_verified,
  };
}

/**
 * Resolves the RentHub user record from verified Google claims.
 *
 * 3-stage resolution:
 *   1. Lookup by google_id → if found:
 *        - is_active === false → 403 Forbidden (NOT reactivated)
 *        - is_active === true  → return user (update name/avatar)
 *   2. Lookup by email → if found:
 *        - google_id IS NOT NULL (different google account) → 409 Conflict
 *        - google_id IS NULL (invited/pre-seeded user) → link google_id
 *            - is_active === false → 403 Forbidden (NOT reactivated; preserve existing state)
 *            - is_active === true  → return user
 *   3. No match → create new user with default roles ['tenant']
 */
export async function resolveUserFromGoogle(
  db: Kysely<Database>,
  claims: GoogleClaims
): Promise<User> {
  // Stage 1: Lookup by google_id
  const byGoogleId = await db
    .selectFrom('users')
    .selectAll()
    .where('google_id', '=', claims.googleId)
    .executeTakeFirst();

  if (byGoogleId) {
    if (!byGoogleId.is_active) {
      throw new ForbiddenError('Account is deactivated');
    }
    // Update profile fields that may have changed in Google
    return await db
      .updateTable('users')
      .set({ name: claims.name, avatar_url: claims.avatarUrl, updated_at: new Date() })
      .where('id', '=', byGoogleId.id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  // Stage 2: Lookup by email
  const byEmail = await db
    .selectFrom('users')
    .selectAll()
    .where('email', '=', claims.email)
    .executeTakeFirst();

  if (byEmail) {
    if (byEmail.google_id !== null) {
      // Email is already bound to a different Google account → reject
      throw new ConflictError('Email is already linked to a different Google account');
    }

    // Invited / pre-seeded user — link google_id; preserve is_active state exactly as-is
    if (!byEmail.is_active) {
      throw new ForbiddenError('Account is deactivated');
    }

    return await db
      .updateTable('users')
      .set({
        google_id: claims.googleId,
        name: claims.name,
        avatar_url: claims.avatarUrl,
        updated_at: new Date(),
        // is_active is intentionally NOT modified
      })
      .where('id', '=', byEmail.id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  // Stage 3: New user
  return await db
    .insertInto('users')
    .values({
      google_id: claims.googleId,
      email: claims.email,
      name: claims.name,
      avatar_url: claims.avatarUrl,
      roles: ['tenant'],
      is_active: true,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
}

/** Issues an access token and a stateless refresh token for the given user. */
export function issueTokens(user: User): IssuedTokens {
  const roles = user.roles as UserRole[];
  return {
    accessToken: signAccessToken(user.id, roles),
    refreshToken: signRefreshToken(user.id),
  };
}
