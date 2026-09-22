import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { sql } from 'kysely';
import { createTestDatabase, type TestDbInstance } from '../helpers/test-db.js';
import { createTestApp } from '../helpers/test-app.js';
import * as coreSchema from '../../db/migrations/20260916000001_core_schema.js';
import { signAccessToken } from '../../src/common/utils/jwt.js';
import { stMakePointGeography } from '../../src/common/gis.js';

describe('Tenant Rental Application Flow & One Active Tenancy Enforcement (/api/tenancy)', () => {
  let testDb: TestDbInstance;
  let app: ReturnType<typeof createTestApp>;

  let landlordId: string;
  let landlordToken: string;
  let tenantAId: string;
  let tenantAToken: string;
  let tenantBId: string;
  let tenantBToken: string;
  let otherTenantId: string;
  let otherTenantToken: string;

  let propertyId: string;
  let availableUnitId: string;
  let onRentUnitId: string;
  let secondAvailableUnitId: string;

  beforeAll(async () => {
    testDb = await createTestDatabase();
    await coreSchema.up(testDb.db);
    app = createTestApp(testDb.db);

    // 1. Seed Landlord
    landlordId = crypto.randomUUID();
    await sql`
      INSERT INTO users (id, email, name, roles)
      VALUES (${landlordId}, ${'landlord_app@test.com'}, ${'Landlord Kumar'}, ${['landlord'] as any})
    `.execute(testDb.db);
    landlordToken = signAccessToken(landlordId, ['landlord']);

    // 2. Seed Tenant A
    tenantAId = crypto.randomUUID();
    await sql`
      INSERT INTO users (id, email, name, roles)
      VALUES (${tenantAId}, ${'tenant_a@test.com'}, ${'Sita Sharma'}, ${['tenant'] as any})
    `.execute(testDb.db);
    tenantAToken = signAccessToken(tenantAId, ['tenant']);

    // 3. Seed Tenant B
    tenantBId = crypto.randomUUID();
    await sql`
      INSERT INTO users (id, email, name, roles)
      VALUES (${tenantBId}, ${'tenant_b@test.com'}, ${'Hari Thapa'}, ${['tenant'] as any})
    `.execute(testDb.db);
    tenantBToken = signAccessToken(tenantBId, ['tenant']);

    // 4. Seed Other Tenant (unrelated)
    otherTenantId = crypto.randomUUID();
    await sql`
      INSERT INTO users (id, email, name, roles)
      VALUES (${otherTenantId}, ${'tenant_other@test.com'}, ${'Other User'}, ${['tenant'] as any})
    `.execute(testDb.db);
    otherTenantToken = signAccessToken(otherTenantId, ['tenant']);

    // 5. Seed Property
    propertyId = crypto.randomUUID();
    await sql`
      INSERT INTO properties (id, landlord_id, title, description, address, city, location, total_floors, is_active)
      VALUES (
        ${propertyId}, ${landlordId}, ${'Sunrise Heights'},
        ${'Modern residential complex'}, ${'Baluwatar 4'}, ${'Kathmandu'},
        ${stMakePointGeography(85.33, 27.72)}, 5, TRUE
      )
    `.execute(testDb.db);

    // 6. Seed Units
    availableUnitId = crypto.randomUUID();
    await sql`
      INSERT INTO property_units (id, property_id, unit_identifier, floor_number, bedrooms, bathrooms, monthly_rent, security_deposit, availability_status)
      VALUES (${availableUnitId}, ${propertyId}, ${'Unit 301'}, 3, 2, 2, 30000.00, 60000.00, 'AVAILABLE')
    `.execute(testDb.db);

    onRentUnitId = crypto.randomUUID();
    await sql`
      INSERT INTO property_units (id, property_id, unit_identifier, floor_number, bedrooms, bathrooms, monthly_rent, security_deposit, availability_status)
      VALUES (${onRentUnitId}, ${propertyId}, ${'Unit 302'}, 3, 1, 1, 20000.00, 40000.00, 'ON_RENT')
    `.execute(testDb.db);

    secondAvailableUnitId = crypto.randomUUID();
    await sql`
      INSERT INTO property_units (id, property_id, unit_identifier, floor_number, bedrooms, bathrooms, monthly_rent, security_deposit, availability_status)
      VALUES (${secondAvailableUnitId}, ${propertyId}, ${'Unit 401'}, 4, 3, 2, 45000.00, 90000.00, 'AVAILABLE')
    `.execute(testDb.db);
  }, 240000);

  afterAll(async () => {
    await testDb.destroy();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. AUTHENTICATION & RBAC (401 / 403)
  // ──────────────────────────────────────────────────────────────────────────
  describe('Authentication and RBAC requirements', () => {
    it('POST /api/tenancy/requests returns 401 without Bearer token', async () => {
      const res = await request(app)
        .post('/api/tenancy/requests')
        .send({
          unitId: availableUnitId,
          proposedMoveIn: '2026-10-01',
        });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/tenancy/requests returns 403 when landlord-only user attempts to apply', async () => {
      const res = await request(app)
        .post('/api/tenancy/requests')
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({
          unitId: availableUnitId,
          proposedMoveIn: '2026-10-01',
        });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/access denied.*tenant/i);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. UNIT ELIGIBILITY & VALIDATION
  // ──────────────────────────────────────────────────────────────────────────
  describe('Unit eligibility validation', () => {
    it('returns 404 when unit does not exist', async () => {
      const fakeUnitId = crypto.randomUUID();
      const res = await request(app)
        .post('/api/tenancy/requests')
        .set('Authorization', `Bearer ${tenantAToken}`)
        .send({
          unitId: fakeUnitId,
          proposedMoveIn: '2026-10-01',
        });
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/not found/i);
    });

    it('returns 409 Conflict when unit is not in AVAILABLE status', async () => {
      const res = await request(app)
        .post('/api/tenancy/requests')
        .set('Authorization', `Bearer ${tenantAToken}`)
        .send({
          unitId: onRentUnitId,
          proposedMoveIn: '2026-10-01',
        });
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/not available for rental/i);
    });

    it('returns 400 when proposedMoveIn date is invalid', async () => {
      const res = await request(app)
        .post('/api/tenancy/requests')
        .set('Authorization', `Bearer ${tenantAToken}`)
        .send({
          unitId: availableUnitId,
          proposedMoveIn: 'not-a-valid-date',
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. APPLICATION SUBMISSION & DUPLICATE PREVENTION
  // ──────────────────────────────────────────────────────────────────────────
  describe('Application submission & duplicate prevention', () => {
    let createdRequestId: string;

    it('successfully submits rental application for available unit', async () => {
      const res = await request(app)
        .post('/api/tenancy/requests')
        .set('Authorization', `Bearer ${tenantAToken}`)
        .send({
          unitId: availableUnitId,
          proposedMoveIn: '2026-10-01',
          message: 'Looking for a clean 2BHK flat.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.unit.unitIdentifier).toBe('Unit 301');
      expect(res.body.data.property.title).toBe('Sunrise Heights');
      expect(res.body.data.tenant.name).toBe('Sita Sharma');

      createdRequestId = res.body.data.id;
    });

    it('prevents duplicate applications for the same unit (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/tenancy/requests')
        .set('Authorization', `Bearer ${tenantAToken}`)
        .send({
          unitId: availableUnitId,
          proposedMoveIn: '2026-10-05',
          message: 'Attempting duplicate application',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/already submitted an application/i);
    });

    it('allows a different tenant (Tenant B) to apply for the same available unit', async () => {
      const res = await request(app)
        .post('/api/tenancy/requests')
        .set('Authorization', `Bearer ${tenantBToken}`)
        .send({
          unitId: availableUnitId,
          proposedMoveIn: '2026-10-15',
          message: 'Also interested in Unit 301',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tenantId).toBe(tenantBId);
    });

    it('allows Tenant A to retrieve their own application by ID', async () => {
      const res = await request(app)
        .get(`/api/tenancy/requests/${createdRequestId}`)
        .set('Authorization', `Bearer ${tenantAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdRequestId);
    });

    it('allows Landlord to retrieve the application by ID', async () => {
      const res = await request(app)
        .get(`/api/tenancy/requests/${createdRequestId}`)
        .set('Authorization', `Bearer ${landlordToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdRequestId);
    });

    it('forbids an unrelated tenant from viewing someone else application (403)', async () => {
      const res = await request(app)
        .get(`/api/tenancy/requests/${createdRequestId}`)
        .set('Authorization', `Bearer ${otherTenantToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/do not have permission/i);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. APPLICATION CANCELLATION & REJECTION
  // ──────────────────────────────────────────────────────────────────────────
  describe('Application cancellation & rejection flows', () => {
    let cancelableRequestId: string;

    beforeAll(async () => {
      // Create separate application for cancel testing
      const res = await request(app)
        .post('/api/tenancy/requests')
        .set('Authorization', `Bearer ${tenantBToken}`)
        .send({
          unitId: secondAvailableUnitId,
          proposedMoveIn: '2026-11-01',
          message: 'Will test cancellation on this one',
        });
      cancelableRequestId = res.body.data.id;
    });

    it('tenant cancels their own pending application', async () => {
      const res = await request(app)
        .post(`/api/tenancy/requests/${cancelableRequestId}/cancel`)
        .set('Authorization', `Bearer ${tenantBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('cancelled');
    });

    it('cannot cancel an already cancelled application', async () => {
      const res = await request(app)
        .post(`/api/tenancy/requests/${cancelableRequestId}/cancel`)
        .set('Authorization', `Bearer ${tenantBToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/cannot cancel/i);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. TRANSACTIONAL APPROVAL & ONE ACTIVE TENANCY ENFORCEMENT
  // ──────────────────────────────────────────────────────────────────────────
  describe('Transactional approval & One Active Tenancy rule', () => {
    let targetRequestId: string;

    beforeAll(async () => {
      // Fetch Sita's (Tenant A) application on availableUnitId
      const listRes = await request(app)
        .get(`/api/tenancy/requests?status=pending`)
        .set('Authorization', `Bearer ${tenantAToken}`);

      const matching = listRes.body.data.requests.find(
        (r: any) => r.unitId === availableUnitId && r.tenantId === tenantAId
      );
      targetRequestId = matching.id;
    });

    it('landlord approves application: atomically locks, updates unit, and creates tenancy', async () => {
      const res = await request(app)
        .post(`/api/tenancy/requests/${targetRequestId}/approve`)
        .set('Authorization', `Bearer ${landlordToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify application updated
      expect(res.body.data.application.status).toBe('approved');

      // Verify new contractual tenancy created
      const tenancy = res.body.data.tenancy;
      expect(tenancy.id).toBeDefined();
      expect(tenancy.tenantId).toBe(tenantAId);
      expect(tenancy.status).toBe('pending_signature');
      expect(tenancy.agreedMonthlyRent).toBe(30000);
      expect(tenancy.agreedDeposit).toBe(60000);

      // Verify unit transitioned to PENDING_SIGNATURE in DB
      const unitCheck = await sql<{ availability_status: string }>`
        SELECT availability_status FROM property_units WHERE id = ${availableUnitId}
      `.execute(testDb.db);
      expect(unitCheck.rows[0].availability_status).toBe('PENDING_SIGNATURE');
    });

    it('strictly prevents Tenant A from applying to another unit while holding a pending lease (One Active Tenancy rule)', async () => {
      // Tenant A now has a tenancy in 'pending_signature'.
      // They attempt to apply for secondAvailableUnitId.
      const res = await request(app)
        .post('/api/tenancy/requests')
        .set('Authorization', `Bearer ${tenantAToken}`)
        .send({
          unitId: secondAvailableUnitId,
          proposedMoveIn: '2026-11-01',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/already have an active tenancy or pending lease/i);
    });

    it('strictly prevents approving another application for a unit that is already in PENDING_SIGNATURE', async () => {
      // Tenant B had also applied for availableUnitId (Unit 301).
      // Find Tenant B's application ID:
      const listRes = await request(app)
        .get(`/api/tenancy/requests?status=pending`)
        .set('Authorization', `Bearer ${landlordToken}`);

      const tenantBReq = listRes.body.data.requests.find(
        (r: any) => r.unitId === availableUnitId && r.tenantId === tenantBId
      );

      // Landlord attempts to approve Tenant B for the same unit:
      const res = await request(app)
        .post(`/api/tenancy/requests/${tenantBReq.id}/approve`)
        .set('Authorization', `Bearer ${landlordToken}`);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/no longer available for leasing/i);
    });
  });
});
