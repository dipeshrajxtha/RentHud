import type { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ValidationError } from '../errors/index.js';

type ValidateTarget = 'body' | 'query' | 'params';

/**
 * Returns middleware that validates req[target] against the provided Zod schema.
 * On failure, passes a ValidationError with field-level details to the error handler.
 */
export function validate(schema: ZodSchema, target: ValidateTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const dataToValidate = req[target] !== undefined ? req[target] : {};
    const result = schema.safeParse(dataToValidate);

    if (!result.success) {
      const fields: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.') || '_root';
        if (!fields[key]) fields[key] = [];
        fields[key].push(issue.message);
      }
      return next(new ValidationError('Validation failed', fields));
    }

    // Replace with parsed (coerced & stripped) data
    req[target] = result.data;
    next();
  };
}
