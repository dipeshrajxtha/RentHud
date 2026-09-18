import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { ValidationError } from '../errors/HttpErrors.js';
import { sendError } from '../utils/response.js';

/**
 * Centralized Express error handler.
 *
 * Rules:
 * - ValidationError -> 400 with field-level details.
 * - Operational AppError subclasses -> their defined status code.
 * - JWT errors (JsonWebTokenError, TokenExpiredError) -> 401.
 * - Unhandled / programmer errors -> 500 with a safe generic message.
 * - Never leaks stack traces, database credentials, SQL statements, filesystem paths, or secrets.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    return next(err as any);
  }

  // 1. Validation errors -> HTTP 400
  if (err instanceof ValidationError) {
    sendError(res, err.message, err.statusCode, err.fields);
    return;
  }

  // 2. Operational application errors (UnauthorizedError, ForbiddenError, NotFoundError, ConflictError, etc.)
  if (err instanceof AppError && err.isOperational) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  // 3. JWT library errors -> HTTP 401
  if (err instanceof Error && (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError')) {
    const message = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    sendError(res, message, 401);
    return;
  }

  // 4. Any operational error with an explicit status code
  if (err && typeof (err as Record<string, unknown>).statusCode === 'number' && (err as Record<string, unknown>).isOperational === true) {
    sendError(res, ((err as Record<string, unknown>).message as string) ?? 'An error occurred', (err as Record<string, unknown>).statusCode as number);
    return;
  }

  // 5. Unknown / programmer error -> HTTP 500 safe generic response
  console.error('[RentHub] Unhandled error:', err);

  sendError(res, 'Internal server error', 500);
}
