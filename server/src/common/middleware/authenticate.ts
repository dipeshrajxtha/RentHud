import type { Request, Response, NextFunction } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { verifyAccessToken } from '../utils/jwt.js';
import { UnauthorizedError } from '../errors/index.js';
import { USER_ROLES, type UserRole } from '../../../../shared/enums/roles.js';

const VALID_ROLES = new Set<string>(Object.values(USER_ROLES));

function isValidUserRole(role: unknown): role is UserRole {
  return typeof role === 'string' && VALID_ROLES.has(role);
}

/**
 * Extracts, verifies, and validates the JWT Bearer access token from the Authorization header.
 * Attaches validated { id, roles } to req.user.
 *
 * Requirements:
 * - Missing Authorization header returns 401.
 * - Non-Bearer schemes return 401.
 * - Empty or whitespace-only Bearer token returns 401.
 * - Invalid, expired, or tampered JWT returns 401.
 * - Validates payload shape: sub must be non-empty string, roles must be array of supported roles.
 * - JWT errors never leak or produce a 500 response.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or malformed Authorization header'));
  }

  const token = authHeader.slice(7).trim();

  if (token.length === 0) {
    return next(new UnauthorizedError('Missing or malformed Authorization header'));
  }

  try {
    const payload = verifyAccessToken(token);

    if (!payload || typeof payload !== 'object' || typeof payload.sub !== 'string' || payload.sub.trim().length === 0) {
      return next(new UnauthorizedError('Invalid token payload'));
    }

    if (!Array.isArray(payload.roles) || !payload.roles.every(isValidUserRole)) {
      return next(new UnauthorizedError('Invalid token payload'));
    }

    req.user = { id: payload.sub, roles: payload.roles };
    next();
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      return next(new UnauthorizedError('Access token expired'));
    }
    if (err instanceof JsonWebTokenError || err instanceof Error) {
      return next(new UnauthorizedError('Invalid access token'));
    }
    return next(new UnauthorizedError('Invalid access token'));
  }
}
