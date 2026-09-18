import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express, { type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';

import { createTestApp } from '../helpers/test-app.js';
import { validate } from '../../src/common/middleware/validate.js';
import { errorHandler } from '../../src/common/middleware/errorHandler.js';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  InternalServerError,
} from '../../src/common/errors/index.js';

function createValidationTestApp() {
  const app = express();
  app.use(express.json());

  // Single target: body validation
  const bodySchema = z.object({
    title: z.string().min(3),
    price: z.number().positive(),
  });
  app.post('/test/validation/body', validate(bodySchema), (req: Request, res: Response) => {
    res.json({ success: true, data: req.body });
  });

  // Single target: query validation with coercion
  const querySchema = z.object({
    page: z.coerce.number().int().min(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  });
  app.get('/test/validation/query', validate(querySchema, 'query'), (req: Request, res: Response) => {
    res.json({ success: true, query: req.query });
  });

  // Single target: params validation
  const paramsSchema = z.object({
    id: z.string().uuid(),
  });
  app.get('/test/validation/params/:id', validate(paramsSchema, 'params'), (req: Request, res: Response) => {
    res.json({ success: true, params: req.params });
  });

  // Multi-target validation: params + query + body
  const multiTargetSchemas = {
    params: z.object({
      unitId: z.string().uuid(),
    }),
    query: z.object({
      source: z.enum(['web', 'mobile']),
    }),
    body: z.object({
      amount: z.coerce.number().positive(),
      note: z.string().optional(),
    }),
  };
  app.post(
    '/test/validation/multi/:unitId',
    validate(multiTargetSchemas),
    (req: Request, res: Response) => {
      res.json({
        success: true,
        unitId: req.params.unitId,
        source: req.query.source,
        body: req.body,
      });
    }
  );

  // Operational Conflict error
  app.get('/test/errors/conflict', () => {
    throw new ConflictError('Active tenancy already exists for this unit');
  });

  // Operational BadRequest error
  app.get('/test/errors/bad-request', () => {
    throw new BadRequestError('Invalid filter combination');
  });

  // Operational NotFound error
  app.get('/test/errors/not-found', () => {
    throw new NotFoundError('Property listing not found');
  });

  // Operational InternalServerError
  app.get('/test/errors/internal-app-error', () => {
    throw new InternalServerError();
  });

  // Programmer / unexpected error containing sensitive details
  app.get('/test/errors/crash', () => {
    throw new Error('FATAL: Failed connecting to postgresql://postgres:super_secret_pw@db.internal:5432/renthub_prod');
  });

  app.use(errorHandler);
  return app;
}

describe('Backend API Foundation — Request Validation & Error Handling', () => {
  const app = createValidationTestApp();

  // ──────────────────────────────────────────────────────────────────────────
  // VALIDATION — 400
  // ──────────────────────────────────────────────────────────────────────────
  describe('Request validation failures (400)', () => {
    it('returns 400 when required body field is missing', async () => {
      const res = await request(app)
        .post('/test/validation/body')
        .send({ price: 1000 }); // title missing
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Validation failed');
      expect(res.body.error.fields).toHaveProperty('title');
      expect(Array.isArray(res.body.error.fields.title)).toBe(true);
    });

    it('returns 400 when body field has invalid type or constraint violation', async () => {
      const res = await request(app)
        .post('/test/validation/body')
        .send({ title: 'ab', price: -50 }); // title too short, price not positive
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.fields).toHaveProperty('title');
      expect(res.body.error.fields).toHaveProperty('price');
    });

    it('returns 400 when query parameter is invalid', async () => {
      const res = await request(app)
        .get('/test/validation/query')
        .query({ page: 'not-a-number' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.fields).toHaveProperty('page');
    });

    it('returns 400 when route parameter is invalid', async () => {
      const res = await request(app).get('/test/validation/params/not-a-valid-uuid');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.fields).toHaveProperty('id');
    });

    it('returns 400 with multi-target validation failure and prefixed field paths', async () => {
      const res = await request(app)
        .post('/test/validation/multi/invalid-uuid')
        .query({ source: 'desktop-unsupported' })
        .send({ amount: -500 });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.fields).toHaveProperty('params.unitId');
      expect(res.body.error.fields).toHaveProperty('query.source');
      expect(res.body.error.fields).toHaveProperty('body.amount');
    });
  });

  describe('Successful validation & coercion (200)', () => {
    it('successfully parses, coerces, and passes data to controller', async () => {
      const res = await request(app)
        .get('/test/validation/query')
        .query({ page: '3', limit: '25' }); // strings coerced to numbers
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.query.page).toBe(3);
      expect(res.body.query.limit).toBe(25);
    });

    it('applies default values from schema during validation', async () => {
      const res = await request(app)
        .get('/test/validation/query')
        .query({ page: '1' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.query.page).toBe(1);
      expect(res.body.query.limit).toBe(10); // default applied
    });

    it('strips unknown body fields according to Zod schema behavior', async () => {
      const res = await request(app)
        .post('/test/validation/body')
        .send({
          title: 'Sunny Studio Apartment',
          price: 1500,
          maliciousField: 'exploit',
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Sunny Studio Apartment');
      expect(res.body.data.price).toBe(1500);
      expect(res.body.data).not.toHaveProperty('maliciousField');
    });

    it('successfully validates multi-target request', async () => {
      const validUuid = '11111111-1111-1111-1111-111111111111';
      const res = await request(app)
        .post(`/test/validation/multi/${validUuid}`)
        .query({ source: 'mobile' })
        .send({ amount: '500', note: 'Monthly deposit' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.unitId).toBe(validUuid);
      expect(res.body.source).toBe('mobile');
      expect(res.body.body.amount).toBe(500); // coerced to number
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ERROR HANDLING & RESPONSE SANITIZATION
  // ──────────────────────────────────────────────────────────────────────────
  describe('Centralized error responses', () => {
    it('returns 409 Conflict with standard error response envelope', async () => {
      const res = await request(app).get('/test/errors/conflict');
      expect(res.status).toBe(409);
      expect(res.body).toEqual({
        success: false,
        error: {
          message: 'Active tenancy already exists for this unit',
        },
      });
    });

    it('returns 400 Bad Request with standard error response envelope', async () => {
      const res = await request(app).get('/test/errors/bad-request');
      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        success: false,
        error: {
          message: 'Invalid filter combination',
        },
      });
    });

    it('returns 404 Not Found with standard error response envelope', async () => {
      const res = await request(app).get('/test/errors/not-found');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        success: false,
        error: {
          message: 'Property listing not found',
        },
      });
    });

    it('returns 500 on unhandled error without leaking sensitive internals or stack traces', async () => {
      // Suppress expected console.error during test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const res = await request(app).get('/test/errors/crash');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Internal server error');

      // Crucial security checks: ensure sensitive details are NEVER leaked in response
      const rawResponse = JSON.stringify(res.body);
      expect(rawResponse).not.toContain('super_secret_pw');
      expect(rawResponse).not.toContain('postgresql://');
      expect(rawResponse).not.toContain('renthub_prod');
      expect(rawResponse).not.toContain('stack');
      expect(rawResponse).not.toContain('FATAL');

      consoleErrorSpy.mockRestore();
    });

    it('returns 404 with "Resource not found" for unmatched routes on main app', async () => {
      const mainApp = createTestApp();
      const res = await request(mainApp).get('/api/unmatched-non-existent-endpoint');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        success: false,
        error: {
          message: 'Resource not found',
        },
      });
    });
  });
});
