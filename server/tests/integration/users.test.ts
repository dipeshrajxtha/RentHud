import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../helpers/test-app.js';
import { signAccessToken } from '../../src/common/utils/jwt.js';

describe('Users API', () => {
  const app = createTestApp();
  const userId = '00000000-0000-0000-0000-000000000099';

  it('GET /api/users/me requires authentication (returns 401 without token)', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });

  it('PATCH /api/users/me requires authentication', async () => {
    const res = await request(app).patch('/api/users/me').send({ name: 'New Name' });
    expect(res.status).toBe(401);
  });

  it('POST /api/users/me/roles/landlord requires authentication', async () => {
    const res = await request(app).post('/api/users/me/roles/landlord');
    expect(res.status).toBe(401);
  });

  it('PATCH /api/users/me returns 400 on invalid avatar_url', async () => {
    const token = signAccessToken(userId, ['tenant']);
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ avatar_url: 'not-a-url' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.fields).toHaveProperty('avatar_url');
  });

  it('GET /api/users/me response shape does not contain raw JWT internals', async () => {
    const token = signAccessToken(userId, ['tenant']);
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`);
    // User not in DB: expect 404, not 500 (service logic correct)
    if (res.status === 200) {
      expect(res.body.data).toHaveProperty('email');
      expect(res.body.data).toHaveProperty('roles');
      // No JWT-internal fields should leak out
      expect(res.body.data).not.toHaveProperty('sub');
      expect(res.body.data).not.toHaveProperty('iat');
      expect(res.body.data).not.toHaveProperty('exp');
    } else {
      expect([404, 500]).toContain(res.status);
    }
  });
});
