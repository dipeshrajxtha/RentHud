import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { sql } from 'kysely';
import { createTestDatabase, type TestDbInstance } from '../helpers/test-db.js';
import { createTestApp } from '../helpers/test-app.js';
import * as coreSchema from '../../db/migrations/20260916000001_core_schema.js';
import { signAccessToken } from '../../src/common/utils/jwt.js';
import type { UserRole } from '../../../shared/enums/roles.js';

describe('Landlord Profile API (/api/landlords)', () => {
  let testDb: TestDbInstance;
  let app: ReturnType<typeof createTestApp>;

  async function seedTestUser(overrides: Record<string, unknown> = {}): Promise<string> {
    const id = crypto.randomUUID();
    await sql`
      INSERT INTO users (id, email, name, roles)
      VALUES (${id}, ${`user_${id.slice(0, 8)}@test.com`}, ${'Test User'}, ${['tenant'] as any})
    `.execute(testDb.db);

    if (Object.keys(overrides).length > 0) {
      const sets = Object.entries(overrides)
        .map(([k, v]) => sql`${sql.ref(k)} = ${v as any}`)
        .reduce((a, b) => sql`${a}, ${b}`);
      await sql`UPDATE users SET ${sets} WHERE id = ${id}`.execute(testDb.db);
    }
    return id;
  }

  beforeAll(async () => {
    testDb = await createTestDatabase();
    await coreSchema.up(testDb.db);
    app = createTestApp(testDb.db);
  }, 240000);

  afterAll(async () => {
    await testDb.destroy();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. AUTHENTICATION (401)
  // ──────────────────────────────────────────────────────────────────────────
  describe('Authentication requirements (401)', () => {
    it('GET /api/landlords/me returns 401 when Authorization header is missing', async () => {
      const res = await request(app).get('/api/landlords/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/missing or malformed/i);
    });

    it('POST /api/landlords/profile returns 401 when Authorization header is missing', async () => {
      const res = await request(app)
        .post('/api/landlords/profile')
        .send({ phone: '+977-9800000000' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('PATCH /api/landlords/me returns 401 with invalid token', async () => {
      const res = await request(app)
        .patch('/api/landlords/me')
        .set('Authorization', 'Bearer invalid.token.value')
        .send({ phone: '+977-9800000000' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/landlords/:id returns 401 without token', async () => {
      const fakeId = crypto.randomUUID();
      const res = await request(app).get(`/api/landlords/${fakeId}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. RBAC AUTHORIZATION (403)
  // ──────────────────────────────────────────────────────────────────────────
  describe('RBAC Authorization (403)', () => {
    it('returns 403 when a tenant-only user accesses GET /api/landlords/me', async () => {
      const tenantId = await seedTestUser({ roles: ['tenant'] });
      const token = signAccessToken(tenantId, ['tenant']);

      const res = await request(app)
        .get('/api/landlords/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/access denied.*landlord/i);
    });

    it('returns 403 when a tenant-only user accesses PATCH /api/landlords/me', async () => {
      const tenantId = await seedTestUser({ roles: ['tenant'] });
      const token = signAccessToken(tenantId, ['tenant']);

      const res = await request(app)
        .patch('/api/landlords/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ phone: '+977-9811111111' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/access denied.*landlord/i);
    });

    it('returns 403 when a tenant-only user accesses GET /api/landlords/:id', async () => {
      const tenantId = await seedTestUser({ roles: ['tenant'] });
      const landlordId = await seedTestUser({ roles: ['landlord'] });
      const token = signAccessToken(tenantId, ['tenant']);

      const res = await request(app)
        .get(`/api/landlords/${landlordId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/access denied.*landlord/i);
    });

    it('returns 403 when an admin-only user accesses GET /api/landlords/me (no admin bypass)', async () => {
      const adminId = await seedTestUser({ roles: ['admin'] });
      const token = signAccessToken(adminId, ['admin']);

      const res = await request(app)
        .get('/api/landlords/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/access denied.*landlord/i);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. SINGLE-ROLE ENFORCEMENT ON PROFILE INITIALIZATION (POST /api/landlords/profile)
  // ──────────────────────────────────────────────────────────────────────────
  describe('Single-Role Enforcement on Landlord Profile Initialization', () => {
    it('returns 403 when a tenant-only user tries to create a landlord profile', async () => {
      const tenantId = await seedTestUser({ name: 'Aspiring Landlord', roles: ['tenant'] });
      const tenantToken = signAccessToken(tenantId, ['tenant']);

      const res = await request(app)
        .post('/api/landlords/profile')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          phone: '+977-9841234567',
          name: 'Verified Landlord Name',
          avatar_url: 'https://cdn.example.com/avatar.png',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/access denied.*landlord/i);
    });

    it('allows a landlord user to create/update their profile', async () => {
      const landlordId = await seedTestUser({ name: 'Landlord User', roles: ['landlord'] });
      const landlordToken = signAccessToken(landlordId, ['landlord']);

      const res = await request(app)
        .post('/api/landlords/profile')
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({
          phone: '+977-9841234567',
          name: 'Verified Landlord Name',
          avatar_url: 'https://cdn.example.com/avatar.png',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.id).toBe(landlordId);
      expect(res.body.data.user.name).toBe('Verified Landlord Name');
      expect(res.body.data.user.phone).toBe('+977-9841234567');
      expect(res.body.data.user.avatarUrl).toBe('https://cdn.example.com/avatar.png');
    });

    it('profile update is idempotent — does not duplicate roles if user is already a landlord', async () => {
      const landlordId = await seedTestUser({ roles: ['landlord'] });
      const token = signAccessToken(landlordId, ['landlord']);

      const res = await request(app)
        .post('/api/landlords/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          phone: '+977-9849999999',
        });

      expect(res.status).toBe(201);
      const roles: UserRole[] = res.body.data.user.roles;
      const landlordCount = roles.filter((r) => r === 'landlord').length;
      expect(landlordCount).toBe(1);
    });

    it('returns 403 when a tenant tries POST /api/landlords alias', async () => {
      const tenantId = await seedTestUser({ roles: ['tenant'] });
      const token = signAccessToken(tenantId, ['tenant']);

      const res = await request(app)
        .post('/api/landlords')
        .set('Authorization', `Bearer ${token}`)
        .send({ phone: '+977-9851000000' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('allows a landlord via POST /api/landlords alias', async () => {
      const landlordId = await seedTestUser({ roles: ['landlord'] });
      const token = signAccessToken(landlordId, ['landlord']);

      const res = await request(app)
        .post('/api/landlords')
        .set('Authorization', `Bearer ${token}`)
        .send({ phone: '+977-9851000000' });

      expect(res.status).toBe(201);
      expect(res.body.data.user.phone).toBe('+977-9851000000');
      expect(res.body.data.user.roles).toContain('landlord');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. VALIDATION (400)
  // ──────────────────────────────────────────────────────────────────────────
  describe('Input Validation (400)', () => {
    it('POST /api/landlords/profile returns 400 when phone is missing', async () => {
      const landlordId = await seedTestUser({ roles: ['landlord'] });
      const token = signAccessToken(landlordId, ['landlord']);

      const res = await request(app)
        .post('/api/landlords/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Missing Phone' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.fields).toHaveProperty('phone');
    });

    it('POST /api/landlords/profile returns 400 when phone is empty string', async () => {
      const landlordId = await seedTestUser({ roles: ['landlord'] });
      const token = signAccessToken(landlordId, ['landlord']);

      const res = await request(app)
        .post('/api/landlords/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ phone: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.fields).toHaveProperty('phone');
    });

    it('POST /api/landlords/profile returns 400 when avatar_url is not a valid URL', async () => {
      const landlordId = await seedTestUser({ roles: ['landlord'] });
      const token = signAccessToken(landlordId, ['landlord']);

      const res = await request(app)
        .post('/api/landlords/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ phone: '+977-9841111111', avatar_url: 'not-a-valid-url' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.fields).toHaveProperty('avatar_url');
    });

    it('PATCH /api/landlords/me returns 400 when body is empty', async () => {
      const landlordId = await seedTestUser({ roles: ['landlord'] });
      const token = signAccessToken(landlordId, ['landlord']);

      const res = await request(app)
        .patch('/api/landlords/me')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('PATCH /api/landlords/me returns 400 when avatarUrl is malformed', async () => {
      const landlordId = await seedTestUser({ roles: ['landlord'] });
      const token = signAccessToken(landlordId, ['landlord']);

      const res = await request(app)
        .patch('/api/landlords/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ avatarUrl: 'invalid://url without proper format' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/landlords/:id returns 400 when :id is not a valid UUID', async () => {
      const landlordId = await seedTestUser({ roles: ['landlord'] });
      const token = signAccessToken(landlordId, ['landlord']);

      const res = await request(app)
        .get('/api/landlords/not-a-valid-uuid-123')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.fields).toHaveProperty('id');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. PROFILE OPERATIONS (GET, PATCH, GET :id)
  // ──────────────────────────────────────────────────────────────────────────
  describe('Profile Operations (200 / 404)', () => {
    it('GET /api/landlords/me returns landlord profile for multi-role user', async () => {
      const userId = await seedTestUser({
        name: 'Dual Role User',
        phone: '+977-9841000001',
        avatar_url: 'https://cdn.example.com/dual.jpg',
        roles: ['tenant', 'landlord'],
      });
      const token = signAccessToken(userId, ['tenant', 'landlord']);

      const res = await request(app)
        .get('/api/landlords/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        id: userId,
        name: 'Dual Role User',
        phone: '+977-9841000001',
        avatarUrl: 'https://cdn.example.com/dual.jpg',
        roles: expect.arrayContaining(['tenant', 'landlord']),
      });
      expect(res.body.data).toHaveProperty('createdAt');
      expect(res.body.data).toHaveProperty('updatedAt');

      // PII / internal leak protection
      expect(res.body.data).not.toHaveProperty('google_id');
      expect(res.body.data).not.toHaveProperty('sub');
      expect(res.body.data).not.toHaveProperty('iat');
    });

    it('PATCH /api/landlords/me updates mutable profile fields and updates updatedAt', async () => {
      const userId = await seedTestUser({
        name: 'Original Name',
        phone: '+977-9841000000',
        roles: ['landlord'],
      });
      const token = signAccessToken(userId, ['landlord']);

      const res = await request(app)
        .patch('/api/landlords/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Name',
          phone: '+977-9842222222',
          avatarUrl: 'https://cdn.example.com/new.png',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Name');
      expect(res.body.data.phone).toBe('+977-9842222222');
      expect(res.body.data.avatarUrl).toBe('https://cdn.example.com/new.png');

      // Verify in DB
      const dbUser = await testDb.db
        .selectFrom('users')
        .selectAll()
        .where('id', '=', userId)
        .executeTakeFirstOrThrow();
      expect(dbUser.name).toBe('Updated Name');
      expect(dbUser.phone).toBe('+977-9842222222');
      expect(dbUser.avatar_url).toBe('https://cdn.example.com/new.png');
    });

    it('GET /api/landlords/:id returns landlord profile by ID', async () => {
      const landlordId = await seedTestUser({
        name: 'Public Landlord',
        phone: '+977-9843333333',
        roles: ['landlord'],
      });
      const requesterId = await seedTestUser({ roles: ['landlord'] });
      const token = signAccessToken(requesterId, ['landlord']);

      const res = await request(app)
        .get(`/api/landlords/${landlordId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(landlordId);
      expect(res.body.data.name).toBe('Public Landlord');
      expect(res.body.data.phone).toBe('+977-9843333333');
    });

    it('GET /api/landlords/:id returns 404 when landlord ID does not exist', async () => {
      const requesterId = await seedTestUser({ roles: ['landlord'] });
      const token = signAccessToken(requesterId, ['landlord']);
      const nonExistentId = crypto.randomUUID();

      const res = await request(app)
        .get(`/api/landlords/${nonExistentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/not found/i);
    });

    it('GET /api/landlords/:id returns 404 when user exists but is NOT a landlord', async () => {
      const tenantOnlyId = await seedTestUser({ name: 'Just a Tenant', roles: ['tenant'] });
      const requesterId = await seedTestUser({ roles: ['landlord'] });
      const token = signAccessToken(requesterId, ['landlord']);

      const res = await request(app)
        .get(`/api/landlords/${tenantOnlyId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/not found/i);
    });

    it('GET /api/landlords/:id returns 404 when landlord is deactivated (is_active = false)', async () => {
      const inactiveLandlordId = await seedTestUser({
        roles: ['landlord'],
        is_active: false,
      });
      const requesterId = await seedTestUser({ roles: ['landlord'] });
      const token = signAccessToken(requesterId, ['landlord']);

      const res = await request(app)
        .get(`/api/landlords/${inactiveLandlordId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 6. SINGLE-ROLE ACCOUNT ENFORCEMENT
  // ──────────────────────────────────────────────────────────────────────────
  describe('Single-Role Account Enforcement', () => {
    it('tenant cannot upgrade to landlord via POST /api/landlords/profile', async () => {
      const userId = await seedTestUser({ name: 'Tenant Only', roles: ['tenant'] });
      const tenantToken = signAccessToken(userId, ['tenant']);

      const upgradeRes = await request(app)
        .post('/api/landlords/profile')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ phone: '+977-9844444444' });

      // Single-role enforcement: tenants are blocked from landlord endpoints
      expect(upgradeRes.status).toBe(403);
      expect(upgradeRes.body.success).toBe(false);

      // Verify database roles were NOT modified
      const dbUser = await testDb.db
        .selectFrom('users')
        .selectAll()
        .where('id', '=', userId)
        .executeTakeFirstOrThrow();
      expect(dbUser.roles).toEqual(['tenant']);
    });

    it('landlord can access their own profile but not tenant-restricted endpoints', async () => {
      const userId = await seedTestUser({ name: 'Landlord Only', roles: ['landlord'], phone: '+977-9844444444' });
      const landlordToken = signAccessToken(userId, ['landlord']);

      // Landlord can access /api/landlords/me
      const landlordMeRes = await request(app)
        .get('/api/landlords/me')
        .set('Authorization', `Bearer ${landlordToken}`);

      expect(landlordMeRes.status).toBe(200);
      expect(landlordMeRes.body.data.roles).toContain('landlord');
      expect(landlordMeRes.body.data.roles).not.toContain('tenant');

      // Landlord can access /api/users/me (general user profile)
      const userMeRes = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${landlordToken}`);

      expect(userMeRes.status).toBe(200);
      expect(userMeRes.body.data.phone).toBe('+977-9844444444');
      expect(userMeRes.body.data.roles).toContain('landlord');
      expect(userMeRes.body.data.roles).not.toContain('tenant');
    });
  });
});
