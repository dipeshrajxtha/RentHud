import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

import config from '../../config/env.js';
import { signAccessToken } from '../../src/common/utils/jwt.js';
import {
  authenticate,
  requireRole,
  requireTenant,
  requireLandlord,
  requireAdmin,
  errorHandler,
} from '../../src/common/middleware/index.js';

function createRbacTestApp() {
  const app = express();
  app.use(express.json());

  app.get('/test/tenant-only', authenticate, requireTenant, (_req, res) => {
    res.json({ success: true, message: 'Welcome tenant' });
  });

  app.get('/test/landlord-only', authenticate, requireLandlord, (_req, res) => {
    res.json({ success: true, message: 'Welcome landlord' });
  });

  app.get('/test/admin-only', authenticate, requireAdmin, (_req, res) => {
    res.json({ success: true, message: 'Welcome admin' });
  });

  app.get('/test/tenant-or-landlord', authenticate, requireRole('tenant', 'landlord'), (_req, res) => {
    res.json({ success: true, message: 'Welcome tenant or landlord' });
  });

  app.use(errorHandler);
  return app;
}

describe('Authentication & RBAC Middleware', () => {
  const app = createRbacTestApp();
  const userId = '00000000-0000-0000-0000-000000000001';

  // ──────────────────────────────────────────────────────────────────────────
  // AUTHENTICATION — 401
  // ──────────────────────────────────────────────────────────────────────────
  describe('Authentication failures (401)', () => {
    it('returns 401 when Authorization header is missing', async () => {
      const res = await request(app).get('/test/tenant-only');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/missing or malformed/i);
    });

    it('returns 401 when Authorization scheme is not Bearer', async () => {
      const res = await request(app)
        .get('/test/tenant-only')
        .set('Authorization', 'Basic dXNlcjpwYXNz');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/missing or malformed/i);
    });

    it('returns 401 when Bearer token is empty', async () => {
      const res = await request(app)
        .get('/test/tenant-only')
        .set('Authorization', 'Bearer ');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/missing or malformed/i);
    });

    it('returns 401 when Bearer token is whitespace only', async () => {
      const res = await request(app)
        .get('/test/tenant-only')
        .set('Authorization', 'Bearer    ');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/missing or malformed/i);
    });

    it('returns 401 when token is invalid or malformed', async () => {
      const res = await request(app)
        .get('/test/tenant-only')
        .set('Authorization', 'Bearer not-a-valid-token');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/invalid access token/i);
    });

    it('returns 401 when token is tampered', async () => {
      const validToken = signAccessToken(userId, ['tenant']);
      const tamperedToken = validToken.slice(0, -5) + 'xxxxx';
      const res = await request(app)
        .get('/test/tenant-only')
        .set('Authorization', `Bearer ${tamperedToken}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/invalid access token/i);
    });

    it('returns 401 when token is expired', async () => {
      const expiredToken = jwt.sign(
        { sub: userId, roles: ['tenant'] },
        config.auth.jwt.secret,
        { expiresIn: -10 }
      );
      const res = await request(app)
        .get('/test/tenant-only')
        .set('Authorization', `Bearer ${expiredToken}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/access token expired/i);
    });

    it('returns 401 when token payload subject is missing or invalid', async () => {
      const missingSubToken = jwt.sign(
        { roles: ['tenant'] },
        config.auth.jwt.secret,
        { expiresIn: '15m' }
      );
      const res = await request(app)
        .get('/test/tenant-only')
        .set('Authorization', `Bearer ${missingSubToken}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/invalid token payload/i);
    });

    it('returns 401 when token payload roles is not an array', async () => {
      const invalidRolesToken = jwt.sign(
        { sub: userId, roles: 'tenant' },
        config.auth.jwt.secret,
        { expiresIn: '15m' }
      );
      const res = await request(app)
        .get('/test/tenant-only')
        .set('Authorization', `Bearer ${invalidRolesToken}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/invalid token payload/i);
    });

    it('returns 401 when token payload roles contains unsupported role values', async () => {
      const malformedRoleToken = jwt.sign(
        { sub: userId, roles: ['tenant', 'superuser'] },
        config.auth.jwt.secret,
        { expiresIn: '15m' }
      );
      const res = await request(app)
        .get('/test/tenant-only')
        .set('Authorization', `Bearer ${malformedRoleToken}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/invalid token payload/i);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // AUTHORIZATION — 403
  // ──────────────────────────────────────────────────────────────────────────
  describe('Role-based access restrictions (403)', () => {
    const tenantToken = signAccessToken(userId, ['tenant']);
    const landlordToken = signAccessToken(userId, ['landlord']);
    const adminToken = signAccessToken(userId, ['admin']);
    const emptyRolesToken = jwt.sign(
      { sub: userId, roles: [] },
      config.auth.jwt.secret,
      { expiresIn: '15m' }
    );

    it('returns 403 Forbidden for tenant accessing landlord-only endpoint', async () => {
      const res = await request(app)
        .get('/test/landlord-only')
        .set('Authorization', `Bearer ${tenantToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('landlord');
    });

    it('returns 403 Forbidden for tenant accessing admin-only endpoint', async () => {
      const res = await request(app)
        .get('/test/admin-only')
        .set('Authorization', `Bearer ${tenantToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('admin');
    });

    it('returns 403 Forbidden for landlord accessing admin-only endpoint', async () => {
      const res = await request(app)
        .get('/test/admin-only')
        .set('Authorization', `Bearer ${landlordToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('admin');
    });

    it('returns 403 Forbidden for admin accessing landlord-only endpoint (no admin bypass)', async () => {
      const res = await request(app)
        .get('/test/landlord-only')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('landlord');
    });

    it('returns 403 Forbidden for admin accessing tenant-only endpoint without tenant role', async () => {
      const res = await request(app)
        .get('/test/tenant-only')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('tenant');
    });

    it('returns 403 Forbidden for user with empty roles accessing protected endpoint', async () => {
      const res = await request(app)
        .get('/test/tenant-only')
        .set('Authorization', `Bearer ${emptyRolesToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('tenant');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // AUTHORIZED REQUESTS — 200
  // ──────────────────────────────────────────────────────────────────────────
  describe('Successful authorized requests (200)', () => {
    it('allows access for user with tenant role to tenant endpoint', async () => {
      const token = signAccessToken(userId, ['tenant']);
      const res = await request(app)
        .get('/test/tenant-only')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Welcome tenant');
    });

    it('allows access for user with landlord role to landlord endpoint', async () => {
      const token = signAccessToken(userId, ['landlord']);
      const res = await request(app)
        .get('/test/landlord-only')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Welcome landlord');
    });

    it('allows access for user with admin role to admin endpoint', async () => {
      const token = signAccessToken(userId, ['admin']);
      const res = await request(app)
        .get('/test/admin-only')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Welcome admin');
    });

    it('allows access for multi-role user (tenant + landlord) to landlord endpoint', async () => {
      const token = signAccessToken(userId, ['tenant', 'landlord']);
      const res = await request(app)
        .get('/test/landlord-only')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Welcome landlord');
    });

    it('allows access for multi-role user matching either role on multi-role endpoint', async () => {
      const tenantToken = signAccessToken(userId, ['tenant']);
      const res1 = await request(app)
        .get('/test/tenant-or-landlord')
        .set('Authorization', `Bearer ${tenantToken}`);
      expect(res1.status).toBe(200);
      expect(res1.body.success).toBe(true);

      const landlordToken = signAccessToken(userId, ['landlord']);
      const res2 = await request(app)
        .get('/test/tenant-or-landlord')
        .set('Authorization', `Bearer ${landlordToken}`);
      expect(res2.status).toBe(200);
      expect(res2.body.success).toBe(true);
    });
  });
});
