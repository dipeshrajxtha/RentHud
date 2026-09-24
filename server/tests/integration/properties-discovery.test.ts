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

    it('returns 400 when latitude is out of bounds (>90 or <-90)', async () => {
      const res = await request(app).get(
        `/api/properties?latitude=95&longitude=${ktmCenter.longitude}`
      );
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/validation failed/i);
    });

    it('returns 400 when longitude is out of bounds (>180 or <-180)', async () => {
      const res = await request(app).get(
        `/api/properties?latitude=${ktmCenter.latitude}&longitude=195`
      );
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/validation failed/i);
    });

    it('returns 400 when radiusKm is zero or negative', async () => {
      const res = await request(app).get(
        `/api/properties?latitude=${ktmCenter.latitude}&longitude=${ktmCenter.longitude}&radiusKm=-5`
      );
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/validation failed/i);
    });

    it('returns 400 when sortBy=distance is requested without coordinates', async () => {
      const res = await request(app).get('/api/properties?sortBy=distance');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/validation failed/i);
    });

    it('accepts lat, lng, and radius aliases and executes spatial search accurately', async () => {
      // Using lat, lng, and radius aliases
      const res = await request(app).get(
        `/api/properties?lat=${ktmCenter.latitude}&lng=${ktmCenter.longitude}&radius=2&expandRadius=false`
      );
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.properties).toHaveLength(1);
      expect(res.body.data.properties[0].id).toBe(propertyKtmId);
      expect(res.body.data.properties[0].distanceMeters).toBeGreaterThan(1000);
    });

    it('excludes properties outside the explicit search radius', async () => {
      // Thamel is ~1.5km from KTM center. Searching with explicit radius 1km should return 0
      const res = await request(app).get(
        `/api/properties?latitude=${ktmCenter.latitude}&longitude=${ktmCenter.longitude}&radiusKm=1&expandRadius=false`
      );
      expect(res.status).toBe(200);
      expect(res.body.data.properties).toHaveLength(0);
      expect(res.body.data.totalProperties).toBe(0);
    });

    it('respects spatial radius boundary (1.2km excludes, 1.8km includes Thamel property)', async () => {
      // 1.2km: Thamel (~1.5km) is outside
      const resOutside = await request(app).get(
        `/api/properties?latitude=${ktmCenter.latitude}&longitude=${ktmCenter.longitude}&radiusKm=1.2&expandRadius=false`
      );
      expect(resOutside.status).toBe(200);
      expect(resOutside.body.data.properties).toHaveLength(0);

      // 1.8km: Thamel (~1.5km) is inside
      const resInside = await request(app).get(
        `/api/properties?latitude=${ktmCenter.latitude}&longitude=${ktmCenter.longitude}&radiusKm=1.8&expandRadius=false`
      );
      expect(resInside.status).toBe(200);
      expect(resInside.body.data.properties).toHaveLength(1);
      expect(resInside.body.data.properties[0].id).toBe(propertyKtmId);
    });

    it('combines location search with rent budget filter', async () => {
      // Both Thamel (~1.5km, rent 25000) and Patan (~3.8km, rent 40000) are within 5km
      // Filter with maxRent=30000: only Thamel should be returned
      const res = await request(app).get(
        `/api/properties?latitude=${ktmCenter.latitude}&longitude=${ktmCenter.longitude}&radiusKm=5&expandRadius=false&maxRent=30000`
      );
      expect(res.status).toBe(200);
      expect(res.body.data.properties).toHaveLength(1);
      expect(res.body.data.properties[0].id).toBe(propertyKtmId);
    });

    it('combines location search with area filter', async () => {
      // Within 5km: Thamel has 800 sqft, Patan has 1200 sqft
      // Filter with minArea=1000: only Patan should be returned
      const res = await request(app).get(
        `/api/properties?latitude=${ktmCenter.latitude}&longitude=${ktmCenter.longitude}&radiusKm=5&expandRadius=false&minArea=1000`
      );
      expect(res.status).toBe(200);
      expect(res.body.data.properties).toHaveLength(1);
      expect(res.body.data.properties[0].id).toBe(propertyPatanId);
    });

    it('combines location search with bedrooms and bathrooms filter', async () => {
      // Within 5km: Patan has 3 beds, 2 baths; Thamel has 2 beds, 2 baths
      const res = await request(app).get(
        `/api/properties?latitude=${ktmCenter.latitude}&longitude=${ktmCenter.longitude}&radiusKm=5&expandRadius=false&bedrooms=3&bathrooms=2`
      );
      expect(res.status).toBe(200);
      expect(res.body.data.properties).toHaveLength(1);
      expect(res.body.data.properties[0].id).toBe(propertyPatanId);
    });

    it('combines location search with amenity filter', async () => {
      // Within 5km: only Patan has dedicated-parking
      const res = await request(app).get(
        `/api/properties?latitude=${ktmCenter.latitude}&longitude=${ktmCenter.longitude}&radiusKm=5&expandRadius=false&amenities=dedicated-parking`
      );
      expect(res.status).toBe(200);
      expect(res.body.data.properties).toHaveLength(1);
      expect(res.body.data.properties[0].id).toBe(propertyPatanId);
    });

    it('combines location search with specific availability filter', async () => {
      // Within 2km: Thamel has Unit 101 (AVAILABLE) and Unit 102 (ON_RENT)
      const res = await request(app).get(
        `/api/properties?latitude=${ktmCenter.latitude}&longitude=${ktmCenter.longitude}&radiusKm=2&expandRadius=false&availability=ON_RENT`
      );
      expect(res.status).toBe(200);
      expect(res.body.data.properties).toHaveLength(1);
      expect(res.body.data.properties[0].id).toBe(propertyKtmId);
    });

    it('combines location search with multiple filters simultaneously', async () => {
      // Location within 5km + minRent=30000 + bedrooms=3 + amenity=dedicated-parking
      const res = await request(app).get(
        `/api/properties?latitude=${ktmCenter.latitude}&longitude=${ktmCenter.longitude}&radiusKm=5&expandRadius=false&minRent=30000&bedrooms=3&amenities=dedicated-parking`
      );
      expect(res.status).toBe(200);
      expect(res.body.data.properties).toHaveLength(1);
      expect(res.body.data.properties[0].id).toBe(propertyPatanId);
    });

    it('never returns inactive or delisted properties in spatial search even if physically closer', async () => {
      // Inactive property is in Thamel (very close to center)
      const res = await request(app).get(
        `/api/properties?latitude=${ktmCenter.latitude}&longitude=${ktmCenter.longitude}&radiusKm=15&expandRadius=false`
      );
      expect(res.status).toBe(200);
      const returnedIds = res.body.data.properties.map((p: any) => p.id);
      expect(returnedIds).not.toContain(inactivePropertyId);
    });

    it('ensures public listing search results never leak sensitive landlord credentials or internal fields', async () => {
      const res = await request(app).get(
        `/api/properties?latitude=${ktmCenter.latitude}&longitude=${ktmCenter.longitude}&radiusKm=5`
      );
      expect(res.status).toBe(200);
      for (const p of res.body.data.properties) {
        expect(p.landlord).toBeDefined();
        expect(p.landlord.id).toBeDefined();
        expect(p.landlord.name).toBeDefined();
        expect((p.landlord as any).email).toBeUndefined();
        expect((p.landlord as any).google_id).toBeUndefined();
        expect((p.landlord as any).roles).toBeUndefined();
        expect((p.landlord as any).phone).toBeUndefined();
        expect((p.landlord as any).password_hash).toBeUndefined();
      }
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

  // ──────────────────────────────────────────────────────────────────────────
  // 4. NEW STRENGTHENING TESTS
  // ──────────────────────────────────────────────────────────────────────────
  describe('GET /api/properties - Strengthening & New Coverage', () => {
    // ── 4a. rooms alias ────────────────────────────────────────────────────
    it('accepts rooms as an alias for bedrooms filter', async () => {
      // Patan has 3 bedrooms; rooms=3 should return only Patan
      const res = await request(app).get('/api/properties?rooms=3');
      expect(res.status).toBe(200);
      expect(res.body.data.properties).toHaveLength(1);
      expect(res.body.data.properties[0].id).toBe(propertyPatanId);
    });

    it('accepts sort as an alias for sortBy', async () => {
      // sort=newest should return properties in created_at desc order without error
      const res = await request(app).get('/api/properties?sort=newest');
      expect(res.status).toBe(200);
      expect(res.body.data.properties.length).toBeGreaterThan(0);
    });

    // ── 4b. Unit exposure strict safety ────────────────────────────────────
    it('excludes ON_RENT units from the public units list in discovery results', async () => {
      // Thamel property has Unit 101 (AVAILABLE) and Unit 102 (ON_RENT)
      const res = await request(app).get('/api/properties?city=Kathmandu');
      expect(res.status).toBe(200);
      expect(res.body.data.properties).toHaveLength(1);
      const thamel = res.body.data.properties[0];

      // availableUnitsCount must only count AVAILABLE units
      expect(thamel.availableUnitsCount).toBe(1);

      // units array in public response must NOT contain the ON_RENT unit
      const unitStatuses: string[] = thamel.units.map((u: any) => u.availabilityStatus);
      expect(unitStatuses).not.toContain('ON_RENT');
      expect(unitStatuses.every((s: string) => s === 'AVAILABLE')).toBe(true);
    });

    it('minMonthlyRent reflects only AVAILABLE unit rents, not ON_RENT units', async () => {
      // Thamel has Unit 101 (AVAILABLE, rent 25000) and Unit 102 (ON_RENT, rent 15000)
      // minMonthlyRent must be 25000 (AVAILABLE unit), not 15000 (rented unit)
      const res = await request(app).get('/api/properties?city=Kathmandu');
      expect(res.status).toBe(200);
      const thamel = res.body.data.properties[0];
      expect(thamel.minMonthlyRent).toBe(25000);
    });

    // ── 4c. Validation: spatial params require coordinates ─────────────────
    it('returns 400 when radiusKm is supplied without latitude/longitude', async () => {
      const res = await request(app).get('/api/properties?radiusKm=5');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/validation failed/i);
    });

    it('returns 400 when radius alias is supplied without latitude/longitude', async () => {
      const res = await request(app).get('/api/properties?radius=10');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/validation failed/i);
    });

    it('returns 400 when stepLevel is supplied without latitude/longitude', async () => {
      const res = await request(app).get('/api/properties?stepLevel=2');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/validation failed/i);
    });

    // ── 4d. SQL-level rent sorting ─────────────────────────────────────────
    it('sorts results rent_asc by lowest AVAILABLE unit rent across properties', async () => {
      // Bhaktapur: 12000, Thamel: 25000, Patan: 40000
      const res = await request(app).get('/api/properties?sortBy=rent_asc');
      expect(res.status).toBe(200);
      const props = res.body.data.properties;
      expect(props.length).toBe(3);
      const minRents: number[] = props.map((p: any) => p.minMonthlyRent);
      // Verify ascending order
      expect(minRents[0]).toBeLessThanOrEqual(minRents[1]);
      expect(minRents[1]).toBeLessThanOrEqual(minRents[2]);
      // First result should be Bhaktapur (cheapest at 12000)
      expect(props[0].id).toBe(propertyBhaktapurId);
    });

    it('sorts results rent_desc by highest AVAILABLE unit rent across properties', async () => {
      // Patan: 40000, Thamel: 25000, Bhaktapur: 12000
      const res = await request(app).get('/api/properties?sortBy=rent_desc');
      expect(res.status).toBe(200);
      const props = res.body.data.properties;
      expect(props.length).toBe(3);
      const maxRents: number[] = props.map((p: any) => p.maxMonthlyRent);
      // Verify descending order
      expect(maxRents[0]).toBeGreaterThanOrEqual(maxRents[1]);
      expect(maxRents[1]).toBeGreaterThanOrEqual(maxRents[2]);
      // First result should be Patan (most expensive at 40000)
      expect(props[0].id).toBe(propertyPatanId);
    });

    it('combines rooms filter with spatial search', async () => {
      // Within 5km: Patan has 3 rooms, Thamel has 2 rooms
      const res = await request(app).get(
        `/api/properties?latitude=${ktmCenter.latitude}&longitude=${ktmCenter.longitude}&radiusKm=5&expandRadius=false&rooms=3`
      );
      expect(res.status).toBe(200);
      expect(res.body.data.properties).toHaveLength(1);
      expect(res.body.data.properties[0].id).toBe(propertyPatanId);
    });

    it('spatial metadata totalAvailableUnits reflects only AVAILABLE units, not rented ones', async () => {
      // 3 properties: Thamel(1 AVAILABLE), Patan(1 AVAILABLE), Bhaktapur(1 AVAILABLE) = 3 total
      const res = await request(app).get(
        `/api/properties?latitude=${ktmCenter.latitude}&longitude=${ktmCenter.longitude}&expandRadius=true`
      );
      expect(res.status).toBe(200);
      const spatial = res.body.data.spatial;
      expect(spatial).toBeDefined();
      // totalAvailableUnits must NOT include the ON_RENT Unit 102 in Thamel
      expect(spatial.totalAvailableUnits).toBe(3);
    });
  });
});
