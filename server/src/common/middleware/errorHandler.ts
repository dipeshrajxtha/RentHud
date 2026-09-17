import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { ValidationError } from '../errors/HttpErrors.js';
import config from '../../../config/env.js';

/**
 * Centralized Express error handler.
 *
 * - Operational errors (AppError subclasses): surfaced to client with their status code.
 * - Programmer/unexpected errors: always return 500. Stack is only logged server-side.
 *   In production, the error message is hidden behind a generic "Internal server error".
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ValidationError) {
    res.status(422).json({
      success: false,
      error: {
        message: err.message,
        fields: err.fields,
      },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: { message: err.message },
    });
    return;
  }

  // Any error with an explicit HTTP status code
  if (err && typeof (err as any).statusCode === 'number') {
    const status = (err as any).statusCode;
    res.status(status).json({
      success: false,
      error: { message: (err as any).message ?? 'An error occurred' },
    });
    return;
  }

  // Handle JWT library errors
  if (err instanceof Error && (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError')) {
    res.status(401).json({
      success: false,
      error: { message: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token' },
    });
    return;
  }

  // Unknown / programmer error
  const isProduction = config.server.isProduction;
  console.error('[RentHub] Unhandled error:', err);

  res.status(500).json({
    success: false,
    error: {
      message: isProduction ? 'Internal server error' : (err as Error)?.message ?? 'Internal server error',
    },
  });
}
