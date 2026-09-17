import jwt from 'jsonwebtoken';
import config from '../../../config/env.js';
import type { JwtAccessPayload, JwtRefreshPayload } from '../../../../shared/types/auth.js';
import type { UserRole } from '../../../../shared/enums/roles.js';

/**
 * Signs a minimal access token.
 * Payload contains only sub (UUID) and roles — no PII.
 * Lifespan: config.auth.jwt.expiresIn (default: 15m)
 */
export function signAccessToken(userId: string, roles: UserRole[]): string {
  const payload: Omit<JwtAccessPayload, 'iat' | 'exp'> = { sub: userId, roles };
  return jwt.sign(payload, config.auth.jwt.secret, {
    expiresIn: config.auth.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });
}

/**
 * Signs a stateless refresh token.
 * Lifespan: config.auth.jwt.refreshExpiresIn (default: 30d)
 *
 * LIMITATION: Stateless tokens cannot be individually revoked before expiry.
 * Deactivating the user account (is_active = false) is the authoritative kill-switch.
 * Refresh token rotation is NOT implemented in Day 4.
 */
export function signRefreshToken(userId: string): string {
  const payload: Omit<JwtRefreshPayload, 'iat' | 'exp'> = { sub: userId, type: 'refresh' };
  return jwt.sign(payload, config.auth.jwt.refreshSecret, {
    expiresIn: config.auth.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

/**
 * Verifies and decodes an access token.
 * Throws JsonWebTokenError / TokenExpiredError on failure.
 */
export function verifyAccessToken(token: string): JwtAccessPayload {
  return jwt.verify(token, config.auth.jwt.secret) as JwtAccessPayload;
}

/**
 * Verifies and decodes a stateless refresh token.
 * Throws JsonWebTokenError / TokenExpiredError on failure.
 */
export function verifyRefreshToken(token: string): JwtRefreshPayload {
  const payload = jwt.verify(token, config.auth.jwt.refreshSecret) as JwtRefreshPayload;
  if (payload.type !== 'refresh') {
    throw new Error('Invalid refresh token type');
  }
  return payload;
}
