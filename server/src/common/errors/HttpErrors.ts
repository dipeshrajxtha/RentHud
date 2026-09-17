import { AppError } from './AppError.js';

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

/** 409 Conflict — e.g. email already linked to a different Google account */
export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409);
  }
}

/** 422 Validation error with optional field-level details */
export class ValidationError extends AppError {
  public readonly fields?: Record<string, string[]>;

  constructor(message = 'Validation failed', fields?: Record<string, string[]>) {
    super(message, 422);
    this.fields = fields;
  }
}
