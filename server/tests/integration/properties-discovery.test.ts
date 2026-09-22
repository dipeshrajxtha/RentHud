import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { sql } from 'kysely';
import { createTestDatabase, type TestDbInstance } from '../helpers/test-db.js';
import { createTestApp } from '../helpers/test-app.js';
import * as coreSchema from '../../db/migrations/20260916000001_core_schema.js';
import { stMakePointGeography } from '../../src/common/gis.js';

describe('Rental Listing Details & Property Discovery Backend (/api/properties)', () => {
  let testDb: TestDbInstance;
  let app: ReturnType<typeof createTestApp>;

  // Real-world coordinates (Kathmandu Valley)
  // Center point: Kathmandu Durbar Square (85.3075, 27.7042)
  const ktmCenter = { longitude: 85.3075, latitude: 27.7042 };
  // ~1.5 km away: Thamel
  const thamel = { longitude: 85.3115, latitude: 27.7154 };
  // ~3.8 km away: Patan Durbar Square
  const patan = { longitude: 85.3250, latitude: 27.6734 };
  // ~12.5 km away: Bhaktapur
  const bhaktapur = { longitude: 85.4280, latitude: 27.6722 };

  let landlordId: string;
  let wifiAmenityId: string;
  let parkingAmenityId: string;
  let propertyKtmId: string;
  let propertyPatanId: string;
  let propertyBhaktapurId: string;
  let inactivePropertyId: string;

  beforeAll(async () => {
    testDb = await createTestDatabase();
    await coreSchema.up(testDb.db);
    app = createTestApp(testDb.db);

    // 1. Seed landlord
    landlordId = crypto.randomUUID();
    await sql`
      INSERT INTO users (id, email, name, roles, avatar_url)
      VALUES (${landlordId}, ${'landlord_prop@test.com'}, ${'Ram Shrestha'}, ${['landlord'] as any}, ${'https://cdn.example.com/avatar.jpg'})
    `.execute(testDb.db);

    // 2. Seed amenities
    wifiAmenityId = crypto.randomUUID();
    parkingAmenityId = crypto.randomUUID();
    await sql`
      INSERT INTO amenities (id, name, slug, category, icon)
      VALUES
        (${wifiAmenityId}, ${'High-Speed Wi-Fi'}, ${'high-speed-wifi'}, ${'building'}, ${'wifi'}),
        (${parkingAmenityId}, ${'Dedicated Parking'}, ${'dedicated-parking'}, ${'building'}, ${'car'})
    `.execute(testDb.db);

    // 3. Seed Property 1 in Thamel (~1.5 km from Ktm Center)
    propertyKtmId = crypto.randomUUID();
    await sql`
      INSERT INTO properties (id, landlord_id, title, description, address, city, location, total_floors, is_active)
      VALUES (
        ${propertyKtmId}, ${landlordId}, ${'Thamel Comfort Apartment'},
        ${'Peaceful apartment in northern Thamel'}, ${'Chaksibari Marg 12'}, ${'Kathmandu'},
        ${stMakePointGeography(thamel.longitude, thamel.latitude)}, 4, TRUE
      )
    `.execute(testDb.db);

    // Assign wifi to Thamel property
    await sql`
      INSERT INTO property_amenities (property_id, amenity_id)
      VALUES (${propertyKtmId}, ${wifiAmenityId})
    `.execute(testDb.db);

    // Add cover photo to Thamel property
    await sql`
      INSERT INTO photos (id, property_id, uploaded_by, url, caption, is_cover, display_order)
      VALUES (${crypto.randomUUID()}, ${propertyKtmId}, ${landlordId}, ${'https://cdn.example.com/thamel-cover.jpg'}, ${'Building exterior'}, TRUE, 0)
    `.execute(testDb.db);

    // Add units to Property 1 (Thamel)
    // Unit A: 2 bed, 2 bath, 800 sqft, 25000 rent, AVAILABLE
    await sql`
      INSERT INTO property_units (id, property_id, unit_identifier, floor_number, bedrooms, bathrooms, area_sqft, monthly_rent, security_deposit, availability_status)
      VALUES (${crypto.randomUUID()}, ${propertyKtmId}, ${'Unit 101'}, 1, 2, 2, 800, 25000.00, 50000.00, 'AVAILABLE')
    `.execute(testDb.db);

    // Unit B: 1 bed, 1 bath, 450 sqft, 15000 rent, ON_RENT (should be excluded from public search by default)
    await sql`
      INSERT INTO property_units (id, property_id, unit_identifier, floor_number, bedrooms, bathrooms, area_sqft, monthly_rent, security_deposit, availability_status)
      VALUES (${crypto.randomUUID()}, ${propertyKtmId}, ${'Unit 102'}, 1, 1, 1, 450, 15000.00, 30000.00, 'ON_RENT')
    `.execute(testDb.db);

    // 4. Seed Property 2 in Patan (~3.8 km from Ktm Center)
    propertyPatanId = crypto.randomUUID();
    await sql`
      INSERT INTO properties (id, landlord_id, title, description, address, city, location, total_floors, is_active)
      VALUES (
        ${propertyPatanId}, ${landlordId}, ${'Patan Heritage Flat'},
        ${'Traditional brick finish near Durbar Square'}, ${'Mangalbazar Road'}, ${'Lalitpur'},
        ${stMakePointGeography(patan.longitude, patan.latitude)}, 3, TRUE
      )
    `.execute(testDb.db);

    // Assign both wifi and parking
    await sql`
      INSERT INTO property_amenities (property_id, amenity_id)
      VALUES (${propertyPatanId}, ${wifiAmenityId}), (${propertyPatanId}, ${parkingAmenityId})
    `.execute(testDb.db);

    // Add unit to Property 2: 3 bed, 2 bath, 1200 sqft, 40000 rent, AVAILABLE
    await sql`
      INSERT INTO property_units (id, property_id, unit_identifier, floor_number, bedrooms, bathrooms, area_sqft, monthly_rent, security_deposit, availability_status)
      VALUES (${crypto.randomUUID()}, ${propertyPatanId}, ${'Flat 2A'}, 2, 3, 2, 1200, 40000.00, 80000.00, 'AVAILABLE')
    `.execute(testDb.db);

    // 5. Seed Property 3 in Bhaktapur (~12.5 km from Ktm Center)
    propertyBhaktapurId = crypto.randomUUID();
    await sql`
      INSERT INTO properties (id, landlord_id, title, description, address, city, location, total_floors, is_active)
      VALUES (
        ${propertyBhaktapurId}, ${landlordId}, ${'Bhaktapur City View Studio'},
        ${'Cozy studio in pottery square'}, ${'Taumadhi Square'}, ${'Bhaktapur'},
        ${stMakePointGeography(bhaktapur.longitude, bhaktapur.latitude)}, 2, TRUE
      )
    `.execute(testDb.db);

    await sql`
      INSERT INTO property_units (id, property_id, unit_identifier, floor_number, bedrooms, bathrooms, area_sqft, monthly_rent, security_deposit, availability_status)
      VALUES (${crypto.randomUUID()}, ${propertyBhaktapurId}, ${'Studio 1'}, 1, 1, 1, 350, 12000.00, 24000.00, 'AVAILABLE')
    `.execute(testDb.db);

    // 6. Seed Inactive Property (should never be returned in discovery or details)
    inactivePropertyId = crypto.randomUUID();
    await sql`
      INSERT INTO properties (id, landlord_id, title, description, address, city, location, total_floors, is_active)
      VALUES (
        ${inactivePropertyId}, ${landlordId}, ${'Delisted Property'},
        ${'Inactive property'}, ${'Ghost St'}, ${'Kathmandu'},
        ${stMakePointGeography(thamel.longitude, thamel.latitude)}, 1, FALSE
      )
    `.execute(testDb.db);

    await sql`
      INSERT INTO property_units (id, property_id, unit_identifier, floor_number, bedrooms, bathrooms, area_sqft, monthly_rent, security_deposit, availability_status)
      VALUES (${crypto.randomUUID()}, ${inactivePropertyId}, ${'Ghost Unit'}, 1, 1, 1, 500, 20000.00, 20000.00, 'AVAILABLE')
    `.execute(testDb.db);

    // 7. Seed Verification Badge
    const badgeId = crypto.randomUUID();
    await sql`
      INSERT INTO verification_badges (id, code, name, description)
      VALUES (${badgeId}, ${'VERIFIED_OWNER'}, ${'Ownership Verified'}, ${'Landlord deed verified'})
    `.execute(testDb.db);

    await sql`
      INSERT INTO verifications (id, property_id, badge_id, status)
      VALUES (${crypto.randomUUID()}, ${propertyKtmId}, ${badgeId}, 'VERIFIED')
    `.execute(testDb.db);
  }, 240000);

  afterAll(async () => {
    await testDb.destroy();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. BROWSING & FILTERING
  // ──────────────────────────────────────────────────────────────────────────
  describe('GET /api/properties - Browsing & Attribute Filters', () => {
    it('returns all active properties when no filters are applied', async () => {
      const res = await request(app).get('/api/properties');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.properties.length).toBe(3);

      // Verify inactive property is excluded
      const ids = res.body.data.properties.map((p: any) => p.id);
      expect(ids).not.toContain(inactivePropertyId);
    });

    it('filters properties by minRent and maxRent', async () => {
      // Units: 12000 (Bhaktapur), 25000 (Thamel Unit 101), 40000 (Patan)
      const res = await request(app).get('/api/properties?minRent=20000&maxRent=30000');
      expect(res.status).toBe(200);
      expect(res.body.data.properties).toHaveLength(1);
      expect(res.body.data.properties[0].id).toBe(propertyKtmId);
    });

    it('filters properties by area (minArea & maxArea)', async () => {
      // Patan has area_sqft = 1200
      const res = await request(app).get('/api/properties?minArea=1000');
      expect(res.status).toBe(200);
      expect(res.body.data.properties).toHaveLength(1);
      expect(res.body.data.properties[0].id).toBe(propertyPatanId);
    });

    it('filters properties by minimum bedrooms and bathrooms', async () => {
      // Patan has 3 bedrooms, 2 bathrooms
      const res = await request(app).get('/api/properties?bedrooms=3&bathrooms=2');
      expect(res.status).toBe(200);
      expect(res.body.data.properties).toHaveLength(1);
      expect(res.body.data.properties[0].id).toBe(propertyPatanId);
    });

    it('filters properties by amenity slug', async () => {
      // Only Patan has parking amenity
      const res = await request(app).get('/api/properties?amenities=dedicated-parking');
      expect(res.status).toBe(200);
      expect(res.body.data.properties).toHaveLength(1);
      expect(res.body.data.properties[0].id).toBe(propertyPatanId);
    });

    it('excludes ON_RENT units by default from public search count', async () => {
      const res = await request(app).get(`/api/properties?city=Kathmandu`);
      expect(res.status).toBe(200);
      expect(res.body.data.properties).toHaveLength(1);
      const thamelProp = res.body.data.properties[0];
      // Has 2 units total, but only 1 AVAILABLE unit
      expect(thamelProp.availableUnitsCount).toBe(1);
    });

    it('returns validation error 400 when minRent > maxRent', async () => {
      const res = await request(app).get('/api/properties?minRent=50000&maxRent=20000');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/validation failed/i);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. POSTGIS SPATIAL SEARCH & EXPONENTIAL RADIUS EXPANSION
  // ──────────────────────────────────────────────────────────────────────────
  describe('GET /api/properties - PostGIS Location & Radius Strategy', () => {
    it('returns 400 when only one coordinate is provided', async () => {
      const res = await request(app).get(`/api/properties?latitude=${ktmCenter.latitude}`);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('finds nearby property within explicit radius and calculates distanceMeters', async () => {
      // Thamel is ~1.5km from Ktm center; query with 2km radius
      const res = await request(app).get(
        `/api/properties?latitude=${ktmCenter.latitude}&longitude=${ktmCenter.longitude}&radiusKm=2&expandRadius=false`
      );

      expect(res.status).toBe(200);
      expect(res.body.data.properties).toHaveLength(1);
      expect(res.body.data.properties[0].id).toBe(propertyKtmId);

      // Verify distance is calculated and sorted
      const dist = res.body.data.properties[0].distanceMeters;
      expect(dist).toBeGreaterThan(1000);
      expect(dist).toBeLessThan(2000);
    });

    it('automatically expands radius exponentially until threshold is met', async () => {
      // At step 1 (1 km), 0 properties are found
      // At step 2 (2 km), Thamel (~1.5 km) is found (1 property)
      // At step 3 (4 km), Patan (~3.8 km) is found (2 properties)
      // At step 4 (8 km), Patan and Thamel (2 properties)
      // At step 5 (16 km), Bhaktapur (~12.5 km) is reached -> Total 3 properties -> Threshold 3 met!
      const res = await request(app).get(
        `/api/properties?latitude=${ktmCenter.latitude}&longitude=${ktmCenter.longitude}&expandRadius=true`
      );

      expect(res.status).toBe(200);
      expect(res.body.data.properties.length).toBe(3);

      // Verify spatial metadata
      const spatial = res.body.data.spatial;
      expect(spatial).toBeDefined();
      expect(spatial.stepLevel).toBeGreaterThanOrEqual(3);
      expect(spatial.queryRadiusMeters).toBeGreaterThanOrEqual(4000);
      expect(spatial.totalAvailableUnits).toBe(3);

      // Verify results are ordered by distance ascending
      const distances = res.body.data.properties.map((p: any) => p.distanceMeters);
      expect(distances[0]).toBeLessThan(distances[1]);
      expect(distances[1]).toBeLessThan(distances[2]);
    });

    it('extracts coordinates safely as numbers without raw WKB hex string leaks', async () => {
      const res = await request(app).get('/api/properties');
      expect(res.status).toBe(200);

      const prop = res.body.data.properties[0];
      expect(typeof prop.location.latitude).toBe('number');
      expect(typeof prop.location.longitude).toBe('number');
      expect(prop.location.latitude).toBeGreaterThan(25);
      expect(prop.location.longitude).toBeGreaterThan(80);
      expect(typeof (prop as any).location).not.toBe('string');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. LISTING DETAILS
  // ──────────────────────────────────────────────────────────────────────────
  describe('GET /api/properties/:id - Public Listing Details', () => {
    it('returns full safe public listing details', async () => {
      const res = await request(app).get(`/api/properties/${propertyKtmId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data.id).toBe(propertyKtmId);
      expect(data.title).toBe('Thamel Comfort Apartment');
      expect(data.units.length).toBe(2);

      // Safe landlord exposure
      expect(data.landlord.name).toBe('Ram Shrestha');
      expect(data.landlord.avatarUrl).toBe('https://cdn.example.com/avatar.jpg');
      // Crucial security check: sensitive landlord fields must NOT be exposed
      expect((data.landlord as any).email).toBeUndefined();
      expect((data.landlord as any).google_id).toBeUndefined();
      expect((data.landlord as any).roles).toBeUndefined();

      // Photos & Badges
      expect(data.photos).toHaveLength(1);
      expect(data.photos[0].url).toBe('https://cdn.example.com/thamel-cover.jpg');
      expect(data.verificationBadges).toHaveLength(1);
      expect(data.verificationBadges[0].code).toBe('VERIFIED_OWNER');

      // Amenities
      expect(data.amenities.length).toBeGreaterThanOrEqual(1);
      expect(data.amenities[0].slug).toBe('high-speed-wifi');
    });

    it('returns 404 for an inactive property', async () => {
      const res = await request(app).get(`/api/properties/${inactivePropertyId}`);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/not found/i);
    });

    it('returns 404 for a non-existent UUID', async () => {
      const fakeId = crypto.randomUUID();
      const res = await request(app).get(`/api/properties/${fakeId}`);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 for a malformed UUID parameter', async () => {
      const res = await request(app).get('/api/properties/not-a-uuid');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
