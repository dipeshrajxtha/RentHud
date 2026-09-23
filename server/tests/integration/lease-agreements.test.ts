import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { sql } from 'kysely';
import { createTestDatabase, type TestDbInstance } from '../helpers/test-db.js';
import { createTestApp } from '../helpers/test-app.js';
import * as coreSchema from '../../db/migrations/20260916000001_core_schema.js';
import * as leaseSignaturesMigration from '../../db/migrations/20260922000002_lease_signatures.js';
import { signAccessToken } from '../../src/common/utils/jwt.js';
import { stMakePointGeography } from '../../src/common/gis.js';

describe('Lease & Digital Agreement Management (/api/tenancy/leases)', () => {
  let testDb: TestDbInstance;
  let app: ReturnType<typeof createTestApp>;

  let landlordId: string;
  let landlordToken: string;
  let tenantId: string;
  let tenantToken: string;
  let unrelatedTenantId: string;
  let unrelatedTenantToken: string;

  let unitId: string;
  let leaseId: string; // the tenancy created via approve flow

  // ────────────────────────────────────────────────────────────────────────────
  // Seed: run both migrations, create users + property + unit + approved request
  // ────────────────────────────────────────────────────────────────────────────
  beforeAll(async () => {
    testDb = await createTestDatabase();
    await coreSchema.up(testDb.db);
    await leaseSignaturesMigration.up(testDb.db);
    app = createTestApp(testDb.db);

    // Landlord
    landlordId = crypto.randomUUID();
    await sql`
      INSERT INTO users (id, email, name, roles)
      VALUES (${landlordId}, ${'lease_landlord@test.com'}, ${'Ram Bahadur'}, ${['landlord'] as any})
    `.execute(testDb.db);
    landlordToken = signAccessToken(landlordId, ['landlord']);

    // Tenant
    tenantId = crypto.randomUUID();
    await sql`
      INSERT INTO users (id, email, name, roles)
      VALUES (${tenantId}, ${'lease_tenant@test.com'}, ${'Gita Rai'}, ${['tenant'] as any})
    `.execute(testDb.db);
    tenantToken = signAccessToken(tenantId, ['tenant']);

    // Unrelated tenant (must not access the lease)
    unrelatedTenantId = crypto.randomUUID();
    await sql`
      INSERT INTO users (id, email, name, roles)
      VALUES (${unrelatedTenantId}, ${'unrelated@test.com'}, ${'Stranger'}, ${['tenant'] as any})
    `.execute(testDb.db);
    unrelatedTenantToken = signAccessToken(unrelatedTenantId, ['tenant']);

    // Property + unit
    const propertyId = crypto.randomUUID();
    await sql`
      INSERT INTO properties (id, landlord_id, title, description, address, city, location, total_floors, is_active)
      VALUES (
        ${propertyId}, ${landlordId}, ${'Test Tower'},
        ${'Lease test property'}, ${'Baneshwor 8'}, ${'Kathmandu'},
        ${stMakePointGeography(85.34, 27.71)}, 6, TRUE
      )
    `.execute(testDb.db);

    unitId = crypto.randomUUID();
    await sql`
      INSERT INTO property_units (id, property_id, unit_identifier, floor_number, bedrooms, bathrooms, monthly_rent, security_deposit, availability_status)
      VALUES (${unitId}, ${propertyId}, ${'Unit 501'}, 5, 2, 1, 25000.00, 50000.00, 'AVAILABLE')
    `.execute(testDb.db);

    // Tenant submits an application
    const applyRes = await request(app)
      .post('/api/tenancy/requests')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({
        unitId,
        proposedMoveIn: '2026-11-01',
        message: 'Ready to move in.',
      });
    expect(applyRes.status).toBe(201);
    const requestId = applyRes.body.data.id;

    // Landlord approves → creates the tenancy in pending_signature
    const approveRes = await request(app)
      .post(`/api/tenancy/requests/${requestId}/approve`)
      .set('Authorization', `Bearer ${landlordToken}`);
    expect(approveRes.status).toBe(200);
    leaseId = approveRes.body.data.tenancy.id;
  }, 240_000);

  afterAll(async () => {
    await testDb.destroy();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Authentication guard
  // ──────────────────────────────────────────────────────────────────────────
  describe('Authentication guard (401)', () => {
    it('GET /api/tenancy/leases returns 401 without a token', async () => {
      const res = await request(app).get('/api/tenancy/leases');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/tenancy/leases/:id returns 401 without a token', async () => {
      const res = await request(app).get(`/api/tenancy/leases/${leaseId}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/tenancy/leases/:id/sign returns 401 without a token', async () => {
      const res = await request(app).post(`/api/tenancy/leases/${leaseId}/sign`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/tenancy/leases/:id/terminate returns 401 without a token', async () => {
      const res = await request(app).post(`/api/tenancy/leases/${leaseId}/terminate`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. List leases — RBAC scoping
  // ──────────────────────────────────────────────────────────────────────────
  describe('GET /api/tenancy/leases — RBAC-scoped listing', () => {
    it('tenant sees their own lease in the list', async () => {
      const res = await request(app)
        .get('/api/tenancy/leases')
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.leases.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.leases.some((l: any) => l.id === leaseId)).toBe(true);
      expect(res.body.data.total).toBeGreaterThanOrEqual(1);
    });

    it('landlord sees their own lease in the list', async () => {
      const res = await request(app)
        .get('/api/tenancy/leases')
        .set('Authorization', `Bearer ${landlordToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.leases.some((l: any) => l.id === leaseId)).toBe(true);
    });

    it('unrelated tenant gets an empty list (zero leases of their own)', async () => {
      const res = await request(app)
        .get('/api/tenancy/leases')
        .set('Authorization', `Bearer ${unrelatedTenantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.leases).toHaveLength(0);
    });

    it('supports status filter: pending_signature returns the new lease', async () => {
      const res = await request(app)
        .get('/api/tenancy/leases?status=pending_signature')
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.leases.some((l: any) => l.id === leaseId)).toBe(true);
    });

    it('returns 400 for an invalid status value', async () => {
      const res = await request(app)
        .get('/api/tenancy/leases?status=invalid_status')
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Get lease by ID — access control
  // ──────────────────────────────────────────────────────────────────────────
  describe('GET /api/tenancy/leases/:id — access control', () => {
    it('tenant retrieves their own lease by ID', async () => {
      const res = await request(app)
        .get(`/api/tenancy/leases/${leaseId}`)
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(leaseId);
      expect(res.body.data.status).toBe('pending_signature');
      expect(res.body.data.tenantId).toBe(tenantId);
      expect(res.body.data.landlordId).toBe(landlordId);
      expect(res.body.data.tenantSignedAt).toBeNull();
      expect(res.body.data.landlordSignedAt).toBeNull();
    });

    it('landlord retrieves the lease by ID', async () => {
      const res = await request(app)
        .get(`/api/tenancy/leases/${leaseId}`)
        .set('Authorization', `Bearer ${landlordToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(leaseId);
    });

    it('unrelated user is forbidden from viewing the lease (403)', async () => {
      const res = await request(app)
        .get(`/api/tenancy/leases/${leaseId}`)
        .set('Authorization', `Bearer ${unrelatedTenantToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/do not have permission/i);
    });

    it('returns 404 for a non-existent lease ID', async () => {
      const fakeId = crypto.randomUUID();
      const res = await request(app)
        .get(`/api/tenancy/leases/${fakeId}`)
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 for a non-UUID lease ID', async () => {
      const res = await request(app)
        .get('/api/tenancy/leases/not-a-uuid')
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Signing flow — partial → full activation
  // ──────────────────────────────────────────────────────────────────────────
  describe('POST /api/tenancy/leases/:id/sign — digital signature flow', () => {
    it('unrelated user cannot sign a lease they are not party to (403)', async () => {
      const res = await request(app)
        .post(`/api/tenancy/leases/${leaseId}/sign`)
        .set('Authorization', `Bearer ${unrelatedTenantToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/not a party/i);
    });

    it('tenant signs first: status remains pending_signature, tenantSignedAt is set', async () => {
      const res = await request(app)
        .post(`/api/tenancy/leases/${leaseId}/sign`)
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('pending_signature');
      expect(res.body.data.tenantSignedAt).not.toBeNull();
      expect(res.body.data.landlordSignedAt).toBeNull();
      expect(res.body.data.signedAt).toBeNull();
    });

    it('tenant signing a second time returns 409 Conflict (idempotency guard)', async () => {
      const res = await request(app)
        .post(`/api/tenancy/leases/${leaseId}/sign`)
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/already signed/i);
    });

    it('landlord signs second: atomically activates lease, sets signedAt, unit transitions to ON_RENT', async () => {
      const res = await request(app)
        .post(`/api/tenancy/leases/${leaseId}/sign`)
        .set('Authorization', `Bearer ${landlordToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const lease = res.body.data;
      expect(lease.status).toBe('active');
      expect(lease.tenantSignedAt).not.toBeNull();
      expect(lease.landlordSignedAt).not.toBeNull();
      expect(lease.signedAt).not.toBeNull();

      // Verify unit status in DB
      const unitCheck = await sql<{ availability_status: string }>`
        SELECT availability_status FROM property_units WHERE id = ${unitId}
      `.execute(testDb.db);
      expect(unitCheck.rows[0].availability_status).toBe('ON_RENT');
    });

    it('cannot sign an already active lease (400)', async () => {
      const res = await request(app)
        .post(`/api/tenancy/leases/${leaseId}/sign`)
        .set('Authorization', `Bearer ${landlordToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/cannot sign a lease with status "active"/i);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Early termination
  // ──────────────────────────────────────────────────────────────────────────
  describe('POST /api/tenancy/leases/:id/terminate — early termination', () => {
    it('unrelated user cannot terminate a lease (403)', async () => {
      const res = await request(app)
        .post(`/api/tenancy/leases/${leaseId}/terminate`)
        .set('Authorization', `Bearer ${unrelatedTenantToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/not a party/i);
    });

    it('tenant can terminate an active lease: status → terminated_early, unit → AVAILABLE', async () => {
      const res = await request(app)
        .post(`/api/tenancy/leases/${leaseId}/terminate`)
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('terminated_early');
      expect(res.body.data.terminatedAt).not.toBeNull();

      // Verify unit returned to AVAILABLE
      const unitCheck = await sql<{ availability_status: string }>`
        SELECT availability_status FROM property_units WHERE id = ${unitId}
      `.execute(testDb.db);
      expect(unitCheck.rows[0].availability_status).toBe('AVAILABLE');

      // Verify early_termination_records entry created
      const recordCheck = await sql<{
        id: string;
        tenancy_id: string;
        initiator_id: string;
        reason_code: string;
        narrative: string;
      }>`
        SELECT * FROM early_termination_records WHERE tenancy_id = ${leaseId}
      `.execute(testDb.db);
      expect(recordCheck.rows).toHaveLength(1);
      expect(recordCheck.rows[0].initiator_id).toBe(tenantId);
      expect(recordCheck.rows[0].reason_code).toBe('EARLY_TERMINATION');
    });

    it('cannot terminate an already terminated lease (400)', async () => {
      const res = await request(app)
        .post(`/api/tenancy/leases/${leaseId}/terminate`)
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/only active leases can be terminated early/i);
    });
  });
});
