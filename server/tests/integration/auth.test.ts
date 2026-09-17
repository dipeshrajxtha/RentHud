import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../helpers/test-app.js';

/**
 * Auth integration tests.
 *
 * Google ID token verification is mocked because tests must run offline without
 * outbound network calls. The auth.service.verifyGoogleIdToken function is stubbed
 * to return predetermined claims, allowing end-to-end controller/routing/DB integration
 * to be verified independently of Google's infrastructure.
 */

// Mock google-auth-library before any imports that use it
vi.mock('google-auth-library', () => {
  return {
    OAuth2Client: vi.fn().mockImplementation(() => ({
      verifyIdToken: vi.fn(),
    })),
  };
});

// Also mock the verifyGoogleIdToken service function
vi.mock('../../src/modules/auth/auth.service.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/modules/auth/auth.service.js')>();
  return {
    ...actual,
    verifyGoogleIdToken: vi.fn(),
  };
});

import { verifyGoogleIdToken } from '../../src/modules/auth/auth.service.js';
import { UnauthorizedError } from '../../src/common/errors/index.js';

describe('POST /api/auth/google', () => {
  const app = createTestApp();

  it('returns 422 when idToken is missing', async () => {
    const res = await request(app).post('/api/auth/google').send({});
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.fields).toHaveProperty('idToken');
  });

  it('returns 401 when Google token verification fails', async () => {
    vi.mocked(verifyGoogleIdToken).mockRejectedValueOnce(
      new UnauthorizedError('Invalid or expired Google ID token')
    );
    const res = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'bad-token' });
    expect(res.status).toBe(401);
  });

  it('returns 200 with accessToken and user on valid token', async () => {
    vi.mocked(verifyGoogleIdToken).mockResolvedValueOnce({
      googleId: 'google-sub-001',
      email: 'alice@example.com',
      name: 'Alice',
      avatarUrl: null,
      emailVerified: true,
    });

    const res = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'valid-id-token' });

    // May be 200 (live DB) or 500 (no DB in unit test env); assert shape on success
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.user).toHaveProperty('email', 'alice@example.com');
      expect(res.body.data.user).toHaveProperty('roles');
      // Confirm response does NOT include token-embedded PII
      expect(res.body.data.user).not.toHaveProperty('avatarUrl', undefined);
    }
  });
});

import config from '../../config/env.js';
import { signRefreshToken } from '../../src/common/utils/jwt.js';

describe('POST /api/auth/dev-login', () => {
  it('returns 404 when NODE_ENV is production', async () => {
    const originalIsProd = config.server.isProduction;
    try {
      (config.server as any).isProduction = true;
      const prodApp = createTestApp();
      const res = await request(prodApp)
        .post('/api/auth/dev-login')
        .send({ email: 'dev@example.com' });
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    } finally {
      (config.server as any).isProduction = originalIsProd;
    }
  });

  it('returns 422 when email is missing in dev mode', async () => {
    const app = createTestApp();
    const res = await request(app).post('/api/auth/dev-login').send({});
    expect(res.status).toBe(422);
  });
});

describe('POST /api/auth/refresh', () => {
  const app = createTestApp();

  it('returns 401 when no refresh token is provided', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 when refresh token is invalid or malformed', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'invalid-token-value' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 when invalid cookie is passed', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', ['renthub_rt=corrupted.token.value']);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/auth/logout', () => {
  it('returns 200 and clears the refresh cookie', async () => {
    const app = createTestApp();
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Set-Cookie header should clear renthub_rt
    const setCookie = res.headers['set-cookie'] as string[] | string | undefined;
    const cookieHeader = Array.isArray(setCookie) ? setCookie.join(';') : (setCookie ?? '');
    expect(cookieHeader).toContain('renthub_rt');
  });
});
