import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../helpers/test-app.js';
import { signAccessToken } from '../../src/common/utils/jwt.js';

import express from 'express';
import { authenticate } from '../../src/common/middleware/authenticate.js';
import { requireRole } from '../../src/common/middleware/requireRole.js';
import { errorHandler } from '../../src/common/middleware/errorHandler.js';

function createRbacTestApp() {
  const app = express();
  app.use(express.json());
  app.get('/test/landlord-only', authenticate, requireRole('landlord'), (_req, res) => {
    res.json({ success: true, message: 'Welcome landlord' });
  });
  app.use(errorHandler);
  return app;
}

describe('RBAC — requireRole middleware', () => {
  const app = createRbacTestApp();

  it('returns 401 when Authorization header is missing', async () => {
    const res = await request(app).get('/test/landlord-only');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 when Bearer token is malformed', async () => {
    const res = await request(app)
      .get('/test/landlord-only')
      .set('Authorization', 'NotBearer token');
    expect(res.status).toBe(401);
  });

  it('returns 401 when token is expired or tampered', async () => {
    const res = await request(app)
      .get('/test/landlord-only')
      .set('Authorization', 'Bearer invalid.jwt.token');
    expect(res.status).toBe(401);
  });

  it('returns 403 Forbidden for tenant-only user accessing landlord route', async () => {
    const userId = '00000000-0000-0000-0000-000000000001';
    const tenantToken = signAccessToken(userId, ['tenant']);
    const res = await request(app)
      .get('/test/landlord-only')
      .set('Authorization', `Bearer ${tenantToken}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('landlord');
  });

  it('returns 403 Forbidden for admin-only user (no admin bypass)', async () => {
    const userId = '00000000-0000-0000-0000-000000000002';
    const adminToken = signAccessToken(userId, ['admin']);
    const res = await request(app)
      .get('/test/landlord-only')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('allows access for user with landlord role', async () => {
    const userId = '00000000-0000-0000-0000-000000000003';
    const landlordToken = signAccessToken(userId, ['landlord']);
    const res = await request(app)
      .get('/test/landlord-only')
      .set('Authorization', `Bearer ${landlordToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('allows access for multi-role user with both tenant and landlord roles', async () => {
    const userId = '00000000-0000-0000-0000-000000000004';
    const multiRoleToken = signAccessToken(userId, ['tenant', 'landlord']);
    const res = await request(app)
      .get('/test/landlord-only')
      .set('Authorization', `Bearer ${multiRoleToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
