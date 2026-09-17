import type { Request, Response, NextFunction } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { verifyAccessToken } from '../utils/jwt.js';
import { UnauthorizedError } from '../errors/index.js';

/**
 * Extracts and verifies the JWT Bearer access token from the Authorization header.
 * Attaches the minimal { id, roles } payload to req.user.
 *
 * Authorization: Bearer <accessToken>
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or malformed Authorization header'));
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, roles: payload.roles };
    next();
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      return next(new UnauthorizedError('Access token expired'));
    }
    if (err instanceof JsonWebTokenError) {
      return next(new UnauthorizedError('Invalid access token'));
    }
    next(err);
  }
}
