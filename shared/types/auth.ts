import type { UserRole } from '../enums/roles.js';

/**
 * Minimal JWT access token payload.
 * Contains only sub (UUID) and roles for authorization.
 * PII is intentionally excluded — fetch via GET /api/users/me.
 */
export interface JwtAccessPayload {
  sub: string;      // users.id (UUID)
  roles: UserRole[];
  iat?: number;
  exp?: number;
}

/**
 * Stateless signed refresh token payload.
 * NOTE: Cannot be individually revoked before expiry.
 * Deactivating the user account (is_active = false) is the authoritative kill-switch.
 * Refresh token rotation is NOT implemented in Day 4.
 */
export interface JwtRefreshPayload {
  sub: string;      // users.id (UUID)
  type: 'refresh';
  iat?: number;
  exp?: number;
}

/** Shape of the authenticated user attached to req.user */
export interface AuthenticatedUser {
  id: string;
  roles: UserRole[];
}

/** Response shape returned after a successful Google sign-in */
export interface AuthTokensResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    roles: UserRole[];
  };
}

/** Request body for Google ID token auth */
export interface GoogleAuthRequest {
  idToken: string;
}

/** Request body for token refresh (mobile clients; web uses cookie) */
export interface RefreshRequest {
  refreshToken?: string;
}
