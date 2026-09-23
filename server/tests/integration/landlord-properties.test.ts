import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { sql } from 'kysely';
import { createTestDatabase, type TestDbInstance } from '../helpers/test-db.js';
import { createTestApp } from '../helpers/test-app.js';
import * as coreSchema from '../../db/migrations/20260916000001_core_schema.js';
import * as leaseSignaturesMigration from '../../db/migrations/20260922000002_lease_signatures.js';
import { signAccessToken } from '../../src/common/utils/jwt.js';

describe('Landlord Property & Unit Management (/api/properties)', () => {
  let testDb: TestDbInstance;
  let app: ReturnType<typeof createTestApp>;

  let landlord1Id: string;
  let landlord1Token: string;
  let landlord2Id: string;
  let landlord2Token: string;
  let tenantId: string;
  let tenantToken: string;

  beforeAll(async () => {
    testDb = await createTestDatabase();
    await coreSchema.up(testDb.db);
    await leaseSignaturesMigration.up(testDb.db);
    app = createTestApp(testDb.db);

    // Landlord 1
    landlord1Id = crypto.randomUUID();
    await sql`
      INSERT INTO users (id, email, name, roles)
      VALUES (${landlord1Id}, ${'landlord1@test.com'}, ${'Landlord One'}, ${['landlord'] as any})
    `.execute(testDb.db);
    landlord1Token = signAccessToken(landlord1Id, ['landlord']);

    // Landlord 2 (for cross-ownership tests)
    landlord2Id = crypto.randomUUID();
    await sql`
      INSERT INTO users (id, email, name, roles)
      VALUES (${landlord2Id}, ${'landlord2@test.com'}, ${'Landlord Two'}, ${['landlord'] as any})
    `.execute(testDb.db);
    landlord2Token = signAccessToken(landlord2Id, ['landlord']);

    // Tenant (non-landlord)
    tenantId = crypto.randomUUID();
    await sql`
      INSERT INTO users (id, email, name, roles)
      VALUES (${tenantId}, ${'tenant_mgmt@test.com'}, ${'Tenant Tim'}, ${['tenant'] as any})
    `.execute(testDb.db);
    tenantToken = signAccessToken(tenantId, ['tenant']);
  }, 240_000);

  afterAll(async () => {
    await testDb.destroy();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Property Management (CRUD & Ownership Checks)
  // ──────────────────────────────────────────────────────────────────────────
  describe('Property CRUD & Ownership', () => {
    let createdPropertyId: string;

    it('requires authentication to create a property (401)', async () => {
      const res = await request(app).post('/api/properties').send({
        title: 'Unauthorized House',
        address: '123 Street',
        city: 'Kathmandu',
        latitude: 27.71,
        longitude: 85.32,
      });
      expect(res.status).toBe(401);
    });

    it('requires landlord role to create a property (403 for tenants)', async () => {
      const res = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          title: 'Tenant House',
          address: '123 Street',
          city: 'Kathmandu',
          latitude: 27.71,
          longitude: 85.32,
        });
      expect(res.status).toBe(403);
    });

    it('rejects invalid coordinates on property creation (400)', async () => {
      const res = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${landlord1Token}`)
        .send({
          title: 'Invalid Coords Property',
          address: '123 Street',
          city: 'Kathmandu',
          latitude: 150, // invalid lat (> 90)
          longitude: 85.32,
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('landlord creates a property successfully (201)', async () => {
      const res = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${landlord1Token}`)
        .send({
          title: 'Apex Heights',
          description: 'Modern luxury apartments with valley views',
          address: 'Jhamsikhel Rd',
          city: 'Lalitpur',
          postalCode: '44700',
          latitude: 27.67,
          longitude: 85.31,
          totalFloors: 5,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Apex Heights');
      expect(res.body.data.landlordId).toBe(landlord1Id);
      expect(res.body.data.location.latitude).toBe(27.67);
      expect(res.body.data.location.longitude).toBe(85.31);
      expect(res.body.data.isActive).toBe(true);

      createdPropertyId = res.body.data.id;
    });

    it('landlord can list their own properties via GET /api/properties/mine (200)', async () => {
      const res = await request(app)
        .get('/api/properties/mine')
        .set('Authorization', `Bearer ${landlord1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      const prop = res.body.data.find((p: any) => p.id === createdPropertyId);
      expect(prop).toBeDefined();
      expect(prop.title).toBe('Apex Heights');
      expect(prop.landlordId).toBe(landlord1Id);
    });

    it('prevents Landlord 2 from updating Landlord 1 property (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/properties/${createdPropertyId}`)
        .set('Authorization', `Bearer ${landlord2Token}`)
        .send({
          title: 'Stolen Heights',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/do not have permission/i);
    });

    it('owner landlord updates property successfully (200)', async () => {
      const res = await request(app)
        .patch(`/api/properties/${createdPropertyId}`)
        .set('Authorization', `Bearer ${landlord1Token}`)
        .send({
          title: 'Apex Heights Renovated',
          description: 'Newly renovated luxury suites',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Apex Heights Renovated');
      expect(res.body.data.description).toBe('Newly renovated luxury suites');
    });

    it('returns 404 when updating non-existent property', async () => {
      const fakeId = crypto.randomUUID();
      const res = await request(app)
        .patch(`/api/properties/${fakeId}`)
        .set('Authorization', `Bearer ${landlord1Token}`)
        .send({ title: 'Non Existent' });

      expect(res.status).toBe(404);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Unit Management (CRUD & Ownership Checks)
  // ──────────────────────────────────────────────────────────────────────────
  describe('Unit Management & Constraints', () => {
    let propId: string;
    let unitId: string;

    beforeAll(async () => {
      // Create a property owned by landlord1
      const propRes = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${landlord1Token}`)
        .send({
          title: 'Unit Test Tower',
          address: 'Baneshwor 10',
          city: 'Kathmandu',
          latitude: 27.69,
          longitude: 85.34,
          totalFloors: 3,
        });
      propId = propRes.body.data.id;
    });

    it('prevents Landlord 2 from adding units to Landlord 1 property (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/properties/${propId}/units`)
        .set('Authorization', `Bearer ${landlord2Token}`)
        .send({
          unitIdentifier: 'Flat 101',
          monthlyRent: 30000,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('rejects unit creation with negative or zero rent (400)', async () => {
      const res = await request(app)
        .post(`/api/properties/${propId}/units`)
        .set('Authorization', `Bearer ${landlord1Token}`)
        .send({
          unitIdentifier: 'Flat 101',
          monthlyRent: -500,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('owner landlord adds a unit successfully (201)', async () => {
      const res = await request(app)
        .post(`/api/properties/${propId}/units`)
        .set('Authorization', `Bearer ${landlord1Token}`)
        .send({
          unitIdentifier: 'Unit 101',
          floorNumber: 1,
          bedrooms: 2,
          bathrooms: 1,
          areaSqft: 750,
          monthlyRent: 22000,
          securityDeposit: 44000,
          availabilityStatus: 'AVAILABLE',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.unitIdentifier).toBe('Unit 101');
      expect(res.body.data.monthlyRent).toBe(22000);
      expect(res.body.data.availabilityStatus).toBe('AVAILABLE');

      unitId = res.body.data.id;
    });

    it('prevents duplicate unit identifier within the same property (409 Conflict)', async () => {
      const res = await request(app)
        .post(`/api/properties/${propId}/units`)
        .set('Authorization', `Bearer ${landlord1Token}`)
        .send({
          unitIdentifier: 'Unit 101', // duplicate
          monthlyRent: 25000,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/already exists/i);
    });

    it('can retrieve units for a property (200)', async () => {
      const res = await request(app).get(`/api/properties/${propId}/units`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].unitIdentifier).toBe('Unit 101');
    });

    it('prevents Landlord 2 from updating unit of Landlord 1 (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/properties/${propId}/units/${unitId}`)
        .set('Authorization', `Bearer ${landlord2Token}`)
        .send({
          monthlyRent: 35000,
        });

      expect(res.status).toBe(403);
    });

    it('owner landlord updates unit rent and details successfully (200)', async () => {
      const res = await request(app)
        .patch(`/api/properties/${propId}/units/${unitId}`)
        .set('Authorization', `Bearer ${landlord1Token}`)
        .send({
          monthlyRent: 24000,
          bedrooms: 3,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.monthlyRent).toBe(24000);
      expect(res.body.data.bedrooms).toBe(3);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Full End-to-End Lifecycle Flow
  //    Property → Unit → Request → Approval → Dual Sign → Active → Early Termination Audit
  // ──────────────────────────────────────────────────────────────────────────
  describe('Full End-to-End Tenancy Lifecycle Flow & Early Termination Audit', () => {
    let lifecyclePropId: string;
    let lifecycleUnitId: string;
    let lifecycleRequestId: string;
    let lifecycleLeaseId: string;

    it('step 1: landlord creates property and unit', async () => {
      const propRes = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${landlord1Token}`)
        .send({
          title: 'Lifecycle Residency',
          address: 'Sanepa 2',
          city: 'Lalitpur',
          latitude: 27.68,
          longitude: 85.30,
          totalFloors: 4,
        });
      expect(propRes.status).toBe(201);
      lifecyclePropId = propRes.body.data.id;

      const unitRes = await request(app)
        .post(`/api/properties/${lifecyclePropId}/units`)
        .set('Authorization', `Bearer ${landlord1Token}`)
        .send({
          unitIdentifier: 'Suite A',
          floorNumber: 2,
          bedrooms: 1,
          bathrooms: 1,
          monthlyRent: 18000,
          securityDeposit: 36000,
          availabilityStatus: 'AVAILABLE',
        });
      expect(unitRes.status).toBe(201);
      lifecycleUnitId = unitRes.body.data.id;
    });

    it('step 2: tenant browses property and sees unit', async () => {
      const res = await request(app).get(`/api/properties/${lifecyclePropId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Lifecycle Residency');
      expect(res.body.data.units).toHaveLength(1);
      expect(res.body.data.units[0].availabilityStatus).toBe('AVAILABLE');
    });

    it('step 3: tenant submits rental application (201)', async () => {
      const res = await request(app)
        .post('/api/tenancy/requests')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          unitId: lifecycleUnitId,
          proposedMoveIn: '2026-12-01',
          message: 'Looking forward to moving in soon.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('pending');
      lifecycleRequestId = res.body.data.id;
    });

    it('step 4: landlord approves application → lease created in pending_signature, unit PENDING_SIGNATURE', async () => {
      const res = await request(app)
        .post(`/api/tenancy/requests/${lifecycleRequestId}/approve`)
        .set('Authorization', `Bearer ${landlord1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.application.status).toBe('approved');
      expect(res.body.data.tenancy.status).toBe('pending_signature');

      lifecycleLeaseId = res.body.data.tenancy.id;

      // Verify unit status in DB
      const unit = await sql<{ availability_status: string }>`
        SELECT availability_status FROM property_units WHERE id = ${lifecycleUnitId}
      `.execute(testDb.db);
      expect(unit.rows[0].availability_status).toBe('PENDING_SIGNATURE');
    });

    it('step 5: tenant signs lease digitally', async () => {
      const res = await request(app)
        .post(`/api/tenancy/leases/${lifecycleLeaseId}/sign`)
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('pending_signature');
      expect(res.body.data.tenantSignedAt).not.toBeNull();
      expect(res.body.data.landlordSignedAt).toBeNull();
    });

    it('step 6: landlord signs lease digitally → atomically activates lease and sets unit to ON_RENT', async () => {
      const res = await request(app)
        .post(`/api/tenancy/leases/${lifecycleLeaseId}/sign`)
        .set('Authorization', `Bearer ${landlord1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('active');
      expect(res.body.data.signedAt).not.toBeNull();
      expect(res.body.data.tenantSignedAt).not.toBeNull();
      expect(res.body.data.landlordSignedAt).not.toBeNull();

      // Verify unit status updated to ON_RENT
      const unit = await sql<{ availability_status: string }>`
        SELECT availability_status FROM property_units WHERE id = ${lifecycleUnitId}
      `.execute(testDb.db);
      expect(unit.rows[0].availability_status).toBe('ON_RENT');
    });

    it('step 7: landlord cannot delete unit while lease is active (409 Conflict)', async () => {
      const res = await request(app)
        .delete(`/api/properties/${lifecyclePropId}/units/${lifecycleUnitId}`)
        .set('Authorization', `Bearer ${landlord1Token}`);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/active or pending/i);
    });

    it('step 8: early termination with reasonCode & narrative creates audit record and resets unit to AVAILABLE', async () => {
      const res = await request(app)
        .post(`/api/tenancy/leases/${lifecycleLeaseId}/terminate`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          reasonCode: 'RELOCATION_OVERSEAS',
          narrative: 'Tenant relocated abroad for studies.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('terminated_early');
      expect(res.body.data.terminatedAt).not.toBeNull();

      // Unit returned to AVAILABLE
      const unit = await sql<{ availability_status: string }>`
        SELECT availability_status FROM property_units WHERE id = ${lifecycleUnitId}
      `.execute(testDb.db);
      expect(unit.rows[0].availability_status).toBe('AVAILABLE');

      // Verify early_termination_records audit row
      const auditRecord = await sql<{
        id: string;
        tenancy_id: string;
        initiator_id: string;
        reason_code: string;
        narrative: string;
        created_at: Date;
      }>`
        SELECT * FROM early_termination_records WHERE tenancy_id = ${lifecycleLeaseId}
      `.execute(testDb.db);

      expect(auditRecord.rows).toHaveLength(1);
      expect(auditRecord.rows[0].initiator_id).toBe(tenantId);
      expect(auditRecord.rows[0].reason_code).toBe('RELOCATION_OVERSEAS');
      expect(auditRecord.rows[0].narrative).toBe('Tenant relocated abroad for studies.');
      expect(auditRecord.rows[0].created_at).toBeDefined();
    });

    it('step 9: landlord can safely soft-deactivate property after all tenancies are resolved (200)', async () => {
      const res = await request(app)
        .delete(`/api/properties/${lifecyclePropId}`)
        .set('Authorization', `Bearer ${landlord1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const prop = await sql<{ is_active: boolean }>`
        SELECT is_active FROM properties WHERE id = ${lifecyclePropId}
      `.execute(testDb.db);
      expect(prop.rows[0].is_active).toBe(false);
    });
  });
});
