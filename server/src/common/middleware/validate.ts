import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { z, type ZodSchema } from 'zod';
import { ValidationError } from '../errors/index.js';

export type ValidateTarget = 'body' | 'query' | 'params';

export interface ValidationSchemaMap {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

function setRequestData(req: Request, target: ValidateTarget, data: unknown): void {
  try {
    if (target === 'body') {
      req.body = data;
    } else if (target === 'query') {
      req.query = data as Request['query'];
    } else if (target === 'params') {
      req.params = data as Request['params'];
    }
  } catch {
    Object.defineProperty(req, target, {
      value: data,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }
}

/**
 * Returns Express middleware that validates request data against Zod schemas.
 *
 * Supports:
 * - validate(schema)                                              // validates req.body
 * - validate(schema, 'body' | 'query' | 'params')                 // validates specified target
 * - validate({ body?: schema, query?: schema, params?: schema })   // validates multiple targets
 *
 * Coerced and stripped data replaces the original req property.
 * Fails deterministically with an HTTP 400 ValidationError containing field-level issues.
 */
export function validate(schema: ZodSchema, target?: ValidateTarget): RequestHandler;
export function validate(schemas: ValidationSchemaMap): RequestHandler;
export function validate(
  schemaOrMap: ZodSchema | ValidationSchemaMap,
  target: ValidateTarget = 'body'
): RequestHandler {
  const isSingleSchema = 'safeParse' in schemaOrMap && typeof schemaOrMap.safeParse === 'function';
  const schemas: ValidationSchemaMap = isSingleSchema
    ? { [target]: schemaOrMap as ZodSchema }
    : (schemaOrMap as ValidationSchemaMap);

  const targetKeys = (Object.keys(schemas) as ValidateTarget[]).filter(
    (t) => schemas[t] !== undefined
  );
  const isMultiTarget = targetKeys.length > 1;

  return (req: Request, _res: Response, next: NextFunction): void => {
    const fields: Record<string, string[]> = {};
    let hasErrors = false;

    for (const t of targetKeys) {
      const schema = schemas[t];
      if (!schema) continue;

      const rawData = req[t] !== undefined ? req[t] : {};
      const result = schema.safeParse(rawData);

      if (!result.success) {
        hasErrors = true;
        for (const issue of result.error.issues) {
          const fieldPath = issue.path.join('.') || '_root';
          const key = isMultiTarget ? `${t}.${fieldPath}` : fieldPath;
          if (!fields[key]) fields[key] = [];
          fields[key].push(issue.message);
        }
      } else {
        setRequestData(req, t, result.data);
      }
    }

    if (hasErrors) {
      return next(new ValidationError('Validation failed', fields));
    }

    next();
  };
}
