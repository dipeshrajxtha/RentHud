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

    // ── 4e. Exact & boundary filter conditions ─────────────────────────────
    it('filters properties on exact rent boundary (minRent === maxRent)', async () => {
      // Thamel Unit 101 has monthly_rent = 25000
      const res = await request(app).get('/api/properties?minRent=25000&maxRent=25000');
      expect(res.status).toBe(200);
      expect(res.body.data.properties).toHaveLength(1);
      expect(res.body.data.properties[0].id).toBe(propertyKtmId);
    });

    it('returns empty result set when rent filter is below minimum available rent', async () => {
      // Lowest available rent is 12000 (Bhaktapur); searching maxRent=5000 yields 0
      const res = await request(app).get('/api/properties?maxRent=5000');
      expect(res.status).toBe(200);
      expect(res.body.data.properties).toHaveLength(0);
      expect(res.body.data.totalProperties).toBe(0);
      expect(res.body.data.pagination.totalPages).toBe(1);
    });

    it('returns empty result set when rent filter is above maximum available rent', async () => {
      // Highest available rent is 40000 (Patan); searching minRent=60000 yields 0
      const res = await request(app).get('/api/properties?minRent=60000');
      expect(res.status).toBe(200);
      expect(res.body.data.properties).toHaveLength(0);
      expect(res.body.data.totalProperties).toBe(0);
    });

    it('filters properties on exact area boundary (minArea === maxArea)', async () => {
      // Thamel Unit 101 has area_sqft = 800
      const res = await request(app).get('/api/properties?minArea=800&maxArea=800');
      expect(res.status).toBe(200);
      expect(res.body.data.properties).toHaveLength(1);
      expect(res.body.data.properties[0].id).toBe(propertyKtmId);
    });

    it('returns empty result set when area filter exceeds maximum available area', async () => {
      // Largest unit is 1200 sqft (Patan)
      const res = await request(app).get('/api/properties?minArea=3000');
      expect(res.status).toBe(200);
      expect(res.body.data.properties).toHaveLength(0);
    });

    it('returns 400 when minArea > maxArea', async () => {
      const res = await request(app).get('/api/properties?minArea=1200&maxArea=500');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/validation failed/i);
    });

    it('handles rooms=0 boundary condition without error', async () => {
      const res = await request(app).get('/api/properties?rooms=0');
      expect(res.status).toBe(200);
      expect(res.body.data.properties).toHaveLength(3);
    });

    it('returns empty result set when rooms filter exceeds maximum available rooms', async () => {
      const res = await request(app).get('/api/properties?rooms=10');
      expect(res.status).toBe(200);
      expect(res.body.data.properties).toHaveLength(0);
    });

    it('filters properties by bathrooms boundary', async () => {
      // Thamel (2 baths) and Patan (2 baths) have >= 2 bathrooms; Bhaktapur has 1
      const res = await request(app).get('/api/properties?bathrooms=2');
      expect(res.status).toBe(200);
      expect(res.body.data.properties).toHaveLength(2);
      const ids = res.body.data.properties.map((p: any) => p.id);
      expect(ids).toContain(propertyKtmId);
      expect(ids).toContain(propertyPatanId);
      expect(ids).not.toContain(propertyBhaktapurId);
    });

    it('returns empty result set when bathrooms filter exceeds available bathrooms', async () => {
      const res = await request(app).get('/api/properties?bathrooms=5');
      expect(res.status).toBe(200);
      expect(res.body.data.properties).toHaveLength(0);
    });

    // ── 4f. Amenities filtering edge cases ─────────────────────────────────
    it('filters properties by multiple comma-separated amenities', async () => {
      // Only Patan has both high-speed-wifi AND dedicated-parking
      const res = await request(app).get('/api/properties?amenities=high-speed-wifi,dedicated-parking');
      expect(res.status).toBe(200);
      expect(res.body.data.properties).toHaveLength(1);
      expect(res.body.data.properties[0].id).toBe(propertyPatanId);
    });

    it('filters properties by multiple query-array amenities', async () => {
      const res = await request(app).get(
        '/api/properties?amenities=high-speed-wifi&amenities=dedicated-parking'
      );
      expect(res.status).toBe(200);
      expect(res.body.data.properties).toHaveLength(1);
      expect(res.body.data.properties[0].id).toBe(propertyPatanId);
    });

    it('returns empty result set for nonexistent amenity', async () => {
      const res = await request(app).get('/api/properties?amenities=private-helipad');
      expect(res.status).toBe(200);
      expect(res.body.data.properties).toHaveLength(0);
      expect(res.body.data.totalProperties).toBe(0);
    });

    it('returns empty result set when one of multiple requested amenities is nonexistent', async () => {
      const res = await request(app).get('/api/properties?amenities=high-speed-wifi,private-helipad');
      expect(res.status).toBe(200);
      expect(res.body.data.properties).toHaveLength(0);
    });

    // ── 4g. Coordinate validation rejections ───────────────────────────────
    it('rejects radius without latitude (longitude only)', async () => {
      const res = await request(app).get('/api/properties?radiusKm=5&longitude=85.3');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects radius without longitude (latitude only)', async () => {
      const res = await request(app).get('/api/properties?radiusKm=5&latitude=27.7');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects radius alias without latitude', async () => {
      const res = await request(app).get('/api/properties?radius=5&longitude=85.3');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects radius alias without longitude', async () => {
      const res = await request(app).get('/api/properties?radius=5&latitude=27.7');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects stepLevel without latitude', async () => {
      const res = await request(app).get('/api/properties?stepLevel=2&longitude=85.3');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects stepLevel without longitude', async () => {
      const res = await request(app).get('/api/properties?stepLevel=2&latitude=27.7');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects longitude without latitude', async () => {
      const res = await request(app).get('/api/properties?longitude=85.3');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects lat alias without lng alias', async () => {
      const res = await request(app).get('/api/properties?lat=27.7');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects lng alias without lat alias', async () => {
      const res = await request(app).get('/api/properties?lng=85.3');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects invalid stepLevel values (0, 7, negative)', async () => {
      const resZero = await request(app).get(
        `/api/properties?latitude=${ktmCenter.latitude}&longitude=${ktmCenter.longitude}&stepLevel=0`
      );
      expect(resZero.status).toBe(400);

      const resSeven = await request(app).get(
        `/api/properties?latitude=${ktmCenter.latitude}&longitude=${ktmCenter.longitude}&stepLevel=7`
      );
      expect(resSeven.status).toBe(400);

      const resNeg = await request(app).get(
        `/api/properties?latitude=${ktmCenter.latitude}&longitude=${ktmCenter.longitude}&stepLevel=-1`
      );
      expect(resNeg.status).toBe(400);
    });

    it('rejects invalid radius values (0 and negative)', async () => {
      const resZero = await request(app).get(
        `/api/properties?latitude=${ktmCenter.latitude}&longitude=${ktmCenter.longitude}&radius=0`
      );
      expect(resZero.status).toBe(400);

      const resNeg = await request(app).get(
        `/api/properties?latitude=${ktmCenter.latitude}&longitude=${ktmCenter.longitude}&radius=-2`
      );
      expect(resNeg.status).toBe(400);
    });

    it('rejects invalid pagination parameters (page=0, page=-1, limit=0, limit=101)', async () => {
      const resPageZero = await request(app).get('/api/properties?page=0');
      expect(resPageZero.status).toBe(400);

      const resPageNeg = await request(app).get('/api/properties?page=-1');
      expect(resPageNeg.status).toBe(400);

      const resLimitZero = await request(app).get('/api/properties?limit=0');
      expect(resLimitZero.status).toBe(400);

      const resLimitMax = await request(app).get('/api/properties?limit=101');
      expect(resLimitMax.status).toBe(400);
    });

    // ── 4h. Pagination & Empty Result Sets ──────────────────────────────────
    it('supports paginating properties across pages with stable ordering', async () => {
      const resPage1 = await request(app).get('/api/properties?page=1&limit=1&sortBy=rent_asc');
      expect(resPage1.status).toBe(200);
      expect(resPage1.body.data.properties).toHaveLength(1);
      expect(resPage1.body.data.pagination.page).toBe(1);
      expect(resPage1.body.data.pagination.limit).toBe(1);
      expect(resPage1.body.data.pagination.totalPages).toBe(3);
      expect(resPage1.body.data.totalProperties).toBe(3);

      const resPage2 = await request(app).get('/api/properties?page=2&limit=1&sortBy=rent_asc');
      expect(resPage2.status).toBe(200);
      expect(resPage2.body.data.properties).toHaveLength(1);
      expect(resPage2.body.data.pagination.page).toBe(2);

      // Page 1 and Page 2 must not have duplicate properties
      expect(resPage1.body.data.properties[0].id).not.toBe(resPage2.body.data.properties[0].id);
    });

    it('returns empty array and totalPages=1 when requesting a page beyond available results', async () => {
      const res = await request(app).get('/api/properties?page=99&limit=10');
      expect(res.status).toBe(200);
      expect(res.body.data.properties).toHaveLength(0);
      expect(res.body.data.totalProperties).toBe(3);
      expect(res.body.data.pagination.page).toBe(99);
      expect(res.body.data.pagination.totalPages).toBe(1);
    });

    it('accepts maximum allowed limit of 100', async () => {
      const res = await request(app).get('/api/properties?limit=100');
      expect(res.status).toBe(200);
      expect(res.body.data.properties).toHaveLength(3);
    });

    // ── 4i. Exponential Radius Expansion Boundary (No Results within 32 km) ─
    it('expands through all 6 steps and stops at 32 km when no properties are nearby', async () => {
      // Pokhara coordinates (~150 km from Kathmandu)
      const pokhara = { longitude: 83.9856, latitude: 28.2096 };
      const res = await request(app).get(
        `/api/properties?latitude=${pokhara.latitude}&longitude=${pokhara.longitude}&expandRadius=true`
      );

      expect(res.status).toBe(200);
      expect(res.body.data.properties).toHaveLength(0);
      expect(res.body.data.totalProperties).toBe(0);

      const spatial = res.body.data.spatial;
      expect(spatial).toBeDefined();
      expect(spatial.stepLevel).toBe(6);
      expect(spatial.queryRadiusMeters).toBe(32000);
      expect(spatial.maxRadiusReached).toBe(true);
      expect(spatial.totalAvailableUnits).toBe(0);
    });

    it('finds property at initial 1 km radius without expansion when center is right on target', async () => {
      // Query right at Patan Durbar with radiusKm=1
      const res = await request(app).get(
        `/api/properties?latitude=${patan.latitude}&longitude=${patan.longitude}&radiusKm=1&expandRadius=false`
      );
      expect(res.status).toBe(200);
      expect(res.body.data.properties).toHaveLength(1);
      expect(res.body.data.properties[0].id).toBe(propertyPatanId);
      expect(res.body.data.properties[0].distanceMeters).toBeLessThan(1000);
    });

    // ── 4j. Security & Sensitive Landlord Credential Scrubbing in Detail ─────
    it('ensures GET /api/properties/:id landlord object never leaks private credentials', async () => {
      const res = await request(app).get(`/api/properties/${propertyKtmId}`);
      expect(res.status).toBe(200);
      const landlord = res.body.data.landlord;
      expect(landlord).toBeDefined();
      expect(landlord.id).toBe(landlordId);
      expect(landlord.name).toBe('Ram Shrestha');
      expect(landlord.avatarUrl).toBe('https://cdn.example.com/avatar.jpg');

      // Strict private field absence check
      expect((landlord as any).email).toBeUndefined();
      expect((landlord as any).phone).toBeUndefined();
      expect((landlord as any).password_hash).toBeUndefined();
      expect((landlord as any).google_id).toBeUndefined();
      expect((landlord as any).roles).toBeUndefined();
      expect((landlord as any).password).toBeUndefined();

      // Ensure units do not leak internal tenancy or application foreign keys
      for (const unit of res.body.data.units) {
        expect((unit as any).tenancies).toBeUndefined();
        expect((unit as any).rentalRequests).toBeUndefined();
        expect((unit as any).tenantId).toBeUndefined();
      }
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. DEDICATED HARDENING: UNIT EXPOSURE, TENANCY ISOLATION & MULTI-UNIT STATES
// ─────────────────────────────────────────────────────────────────────────────
describe('Property Discovery - Unit Exposure, Availability & Tenancy Isolation', () => {
  let edgeDb: TestDbInstance;
  let edgeApp: ReturnType<typeof createTestApp>;

  let edgeLandlordId: string;
  let edgeTenantId: string;
  let multiUnitPropId: string;
  let unitAId: string;
  let unitBId: string;
  let unitCId: string;
  let unitDId: string;
  let unitEId: string;

  let onlyOnRentPropId: string;
  let onlyUnavailablePropId: string;
  let onlyActiveTenancyPropId: string;
  let onlyPendingSigPropId: string;
  let cleanPropFId: string;

  // Center reference: New Baneshwor, Kathmandu (85.3420, 27.6915)
  const baneshwor = { longitude: 85.3420, latitude: 27.6915 };

  beforeAll(async () => {
    edgeDb = await createTestDatabase();
    await coreSchema.up(edgeDb.db);
    edgeApp = createTestApp(edgeDb.db);

    // 1. Seed Landlord and Tenants (each active/pending lease needs a distinct tenant)
    edgeLandlordId = crypto.randomUUID();
    const tenant1Id = crypto.randomUUID();
    const tenant2Id = crypto.randomUUID();
    const tenant3Id = crypto.randomUUID();
    const tenant4Id = crypto.randomUUID();

    await sql`
      INSERT INTO users (id, email, name, roles, avatar_url)
      VALUES
        (${edgeLandlordId}, ${'landlord_edge@test.com'}, ${'Hari Bahadur'}, ${['landlord'] as any}, ${'https://cdn.example.com/hari.jpg'}),
        (${tenant1Id}, ${'tenant1_edge@test.com'}, ${'Sita Sharma'}, ${['tenant'] as any}, ${'https://cdn.example.com/sita.jpg'}),
        (${tenant2Id}, ${'tenant2_edge@test.com'}, ${'Gita Rai'}, ${['tenant'] as any}, ${'https://cdn.example.com/gita.jpg'}),
        (${tenant3Id}, ${'tenant3_edge@test.com'}, ${'Binod Thapa'}, ${['tenant'] as any}, ${'https://cdn.example.com/binod.jpg'}),
        (${tenant4Id}, ${'tenant4_edge@test.com'}, ${'Kamal KC'}, ${['tenant'] as any}, ${'https://cdn.example.com/kamal.jpg'})
    `.execute(edgeDb.db);

    // 2. Multi-Unit Property with 5 units in different availability / tenancy states:
    //    Unit A: AVAILABLE (monthlyRent 22000, 2 bed, 1 bath, 600 sqft)
    //    Unit B: ON_RENT (monthlyRent 11000, 1 bed, 1 bath, 400 sqft)
    //    Unit C: UNAVAILABLE (monthlyRent 12000, 1 bed, 1 bath, 350 sqft)
    //    Unit D: AVAILABLE status in property_units, but has active tenancy in tenancies table (monthlyRent 14000)
    //    Unit E: AVAILABLE status in property_units, but has pending_signature tenancy (monthlyRent 16000)
    multiUnitPropId = crypto.randomUUID();
    await sql`
      INSERT INTO properties (id, landlord_id, title, description, address, city, location, total_floors, is_active)
      VALUES (
        ${multiUnitPropId}, ${edgeLandlordId}, ${'Baneshwor Complex'},
        ${'Mixed units property'}, ${'Baneshwor Marg 5'}, ${'Kathmandu'},
        ${stMakePointGeography(baneshwor.longitude, baneshwor.latitude)}, 4, TRUE
      )
    `.execute(edgeDb.db);

    unitAId = crypto.randomUUID();
    unitBId = crypto.randomUUID();
    unitCId = crypto.randomUUID();
    unitDId = crypto.randomUUID();
    unitEId = crypto.randomUUID();

    await sql`
      INSERT INTO property_units (id, property_id, unit_identifier, floor_number, bedrooms, bathrooms, area_sqft, monthly_rent, security_deposit, availability_status)
      VALUES
        (${unitAId}, ${multiUnitPropId}, ${'Unit A'}, 1, 2, 1, 600, 22000.00, 44000.00, 'AVAILABLE'),
        (${unitBId}, ${multiUnitPropId}, ${'Unit B'}, 1, 1, 1, 400, 11000.00, 22000.00, 'ON_RENT'),
        (${unitCId}, ${multiUnitPropId}, ${'Unit C'}, 2, 1, 1, 350, 12000.00, 24000.00, 'UNAVAILABLE'),
        (${unitDId}, ${multiUnitPropId}, ${'Unit D'}, 2, 1, 1, 450, 14000.00, 28000.00, 'AVAILABLE'),
        (${unitEId}, ${multiUnitPropId}, ${'Unit E'}, 3, 2, 1, 550, 16000.00, 32000.00, 'AVAILABLE')
    `.execute(edgeDb.db);

    // Bind Unit D to active tenancy (tenant 1)
    await sql`
      INSERT INTO tenancies (id, unit_id, tenant_id, landlord_id, status, start_date, end_date, agreed_monthly_rent)
      VALUES (${crypto.randomUUID()}, ${unitDId}, ${tenant1Id}, ${edgeLandlordId}, 'active', '2026-01-01', '2027-01-01', 14000.00)
    `.execute(edgeDb.db);

    // Bind Unit E to pending_signature tenancy (tenant 2)
    await sql`
      INSERT INTO tenancies (id, unit_id, tenant_id, landlord_id, status, start_date, end_date, agreed_monthly_rent)
      VALUES (${crypto.randomUUID()}, ${unitEId}, ${tenant2Id}, ${edgeLandlordId}, 'pending_signature', '2026-02-01', '2027-02-01', 16000.00)
    `.execute(edgeDb.db);

    // 3. Property with ONLY ON_RENT unit
    onlyOnRentPropId = crypto.randomUUID();
    await sql`
      INSERT INTO properties (id, landlord_id, title, description, address, city, location, total_floors, is_active)
      VALUES (${onlyOnRentPropId}, ${edgeLandlordId}, ${'Fully Rented House'}, ${'All rented'}, ${'Road 1'}, ${'Kathmandu'}, ${stMakePointGeography(85.3400, 27.6900)}, 2, TRUE)
    `.execute(edgeDb.db);
    await sql`
      INSERT INTO property_units (id, property_id, unit_identifier, floor_number, bedrooms, bathrooms, area_sqft, monthly_rent, security_deposit, availability_status)
      VALUES (${crypto.randomUUID()}, ${onlyOnRentPropId}, ${'Unit R1'}, 1, 1, 1, 500, 15000.00, 30000.00, 'ON_RENT')
    `.execute(edgeDb.db);

    // 4. Property with ONLY UNAVAILABLE unit
    onlyUnavailablePropId = crypto.randomUUID();
    await sql`
      INSERT INTO properties (id, landlord_id, title, description, address, city, location, total_floors, is_active)
      VALUES (${onlyUnavailablePropId}, ${edgeLandlordId}, ${'Under Renovation House'}, ${'Renovation'}, ${'Road 2'}, ${'Kathmandu'}, ${stMakePointGeography(85.3410, 27.6910)}, 2, TRUE)
    `.execute(edgeDb.db);
    await sql`
      INSERT INTO property_units (id, property_id, unit_identifier, floor_number, bedrooms, bathrooms, area_sqft, monthly_rent, security_deposit, availability_status)
      VALUES (${crypto.randomUUID()}, ${onlyUnavailablePropId}, ${'Unit U1'}, 1, 1, 1, 500, 15000.00, 30000.00, 'UNAVAILABLE')
    `.execute(edgeDb.db);

    // 5. Property with AVAILABLE status unit but active tenancy (tenant 3) (no other units)
    onlyActiveTenancyPropId = crypto.randomUUID();
    const unitActiveOnlyId = crypto.randomUUID();
    await sql`
      INSERT INTO properties (id, landlord_id, title, description, address, city, location, total_floors, is_active)
      VALUES (${onlyActiveTenancyPropId}, ${edgeLandlordId}, ${'Active Lease House'}, ${'Leased'}, ${'Road 3'}, ${'Kathmandu'}, ${stMakePointGeography(85.3430, 27.6920)}, 2, TRUE)
    `.execute(edgeDb.db);
    await sql`
      INSERT INTO property_units (id, property_id, unit_identifier, floor_number, bedrooms, bathrooms, area_sqft, monthly_rent, security_deposit, availability_status)
      VALUES (${unitActiveOnlyId}, ${onlyActiveTenancyPropId}, ${'Unit AL1'}, 1, 1, 1, 500, 17000.00, 34000.00, 'AVAILABLE')
    `.execute(edgeDb.db);
    await sql`
      INSERT INTO tenancies (id, unit_id, tenant_id, landlord_id, status, start_date, end_date, agreed_monthly_rent)
      VALUES (${crypto.randomUUID()}, ${unitActiveOnlyId}, ${tenant3Id}, ${edgeLandlordId}, 'active', '2026-01-01', '2027-01-01', 17000.00)
    `.execute(edgeDb.db);

    // 6. Property with AVAILABLE status unit but pending_signature tenancy (tenant 4) (no other units)
    onlyPendingSigPropId = crypto.randomUUID();
    const unitPendingSigOnlyId = crypto.randomUUID();
    await sql`
      INSERT INTO properties (id, landlord_id, title, description, address, city, location, total_floors, is_active)
      VALUES (${onlyPendingSigPropId}, ${edgeLandlordId}, ${'Pending Signature House'}, ${'Pending lease'}, ${'Road 4'}, ${'Kathmandu'}, ${stMakePointGeography(85.3440, 27.6930)}, 2, TRUE)
    `.execute(edgeDb.db);
    await sql`
      INSERT INTO property_units (id, property_id, unit_identifier, floor_number, bedrooms, bathrooms, area_sqft, monthly_rent, security_deposit, availability_status)
      VALUES (${unitPendingSigOnlyId}, ${onlyPendingSigPropId}, ${'Unit PS1'}, 1, 1, 1, 500, 18000.00, 36000.00, 'AVAILABLE')
    `.execute(edgeDb.db);
    await sql`
      INSERT INTO tenancies (id, unit_id, tenant_id, landlord_id, status, start_date, end_date, agreed_monthly_rent)
      VALUES (${crypto.randomUUID()}, ${unitPendingSigOnlyId}, ${tenant4Id}, ${edgeLandlordId}, 'pending_signature', '2026-03-01', '2027-03-01', 18000.00)
    `.execute(edgeDb.db);

    // 7. Property F: Clean property with 1 legitimately AVAILABLE unit
    cleanPropFId = crypto.randomUUID();
    await sql`
      INSERT INTO properties (id, landlord_id, title, description, address, city, location, total_floors, is_active)
      VALUES (${cleanPropFId}, ${edgeLandlordId}, ${'Clean Modern Residence'}, ${'Ready to move'}, ${'Road 5'}, ${'Kathmandu'}, ${stMakePointGeography(85.3450, 27.6940)}, 3, TRUE)
    `.execute(edgeDb.db);
    await sql`
      INSERT INTO property_units (id, property_id, unit_identifier, floor_number, bedrooms, bathrooms, area_sqft, monthly_rent, security_deposit, availability_status)
      VALUES (${crypto.randomUUID()}, ${cleanPropFId}, ${'Unit F1'}, 1, 2, 1, 700, 35000.00, 70000.00, 'AVAILABLE')
    `.execute(edgeDb.db);
  }, 240000);

  afterAll(async () => {
    await edgeDb.destroy();
  });

  it('excludes properties from public discovery that have no eligible available units', async () => {
    const res = await request(edgeApp).get('/api/properties');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const returnedIds = res.body.data.properties.map((p: any) => p.id);

    // Only multiUnitPropId (has Unit A) and cleanPropFId (has Unit F1) must be returned
    expect(returnedIds).toHaveLength(2);
    expect(returnedIds).toContain(multiUnitPropId);
    expect(returnedIds).toContain(cleanPropFId);

    // Properties with only ON_RENT, UNAVAILABLE, active tenancy, or pending_signature tenancy must NOT appear
    expect(returnedIds).not.toContain(onlyOnRentPropId);
    expect(returnedIds).not.toContain(onlyUnavailablePropId);
    expect(returnedIds).not.toContain(onlyActiveTenancyPropId);
    expect(returnedIds).not.toContain(onlyPendingSigPropId);
  });

  it('exposes ONLY eligible available units in public discovery results for multi-unit property', async () => {
    const res = await request(edgeApp).get('/api/properties');
    expect(res.status).toBe(200);

    const multiProp = res.body.data.properties.find((p: any) => p.id === multiUnitPropId);
    expect(multiProp).toBeDefined();

    // availableUnitsCount must be 1 (only Unit A)
    expect(multiProp.availableUnitsCount).toBe(1);

    // units array must contain ONLY Unit A
    expect(multiProp.units).toHaveLength(1);
    expect(multiProp.units[0].id).toBe(unitAId);
    expect(multiProp.units[0].unitIdentifier).toBe('Unit A');
    expect(multiProp.units[0].availabilityStatus).toBe('AVAILABLE');

    // Units B, C, D, E must NOT be exposed
    const exposedUnitIds = multiProp.units.map((u: any) => u.id);
    expect(exposedUnitIds).not.toContain(unitBId);
    expect(exposedUnitIds).not.toContain(unitCId);
    expect(exposedUnitIds).not.toContain(unitDId);
    expect(exposedUnitIds).not.toContain(unitEId);
  });

  it('calculates minMonthlyRent and maxMonthlyRent ONLY from eligible available units', async () => {
    const res = await request(edgeApp).get('/api/properties');
    expect(res.status).toBe(200);

    const multiProp = res.body.data.properties.find((p: any) => p.id === multiUnitPropId);
    expect(multiProp).toBeDefined();

    // Unit A rent is 22000.
    // Ineligible units have rents 11000 (ON_RENT), 12000 (UNAVAILABLE), 14000 (active), 16000 (pending_sig).
    // minMonthlyRent and maxMonthlyRent must strictly be 22000!
    expect(multiProp.minMonthlyRent).toBe(22000);
    expect(multiProp.maxMonthlyRent).toBe(22000);
  });

  it('calculates availableUnitsCount, minMonthlyRent, and maxMonthlyRent from eligible units in GET /api/properties/:id', async () => {
    const res = await request(edgeApp).get(`/api/properties/${multiUnitPropId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const prop = res.body.data;
    expect(prop.id).toBe(multiUnitPropId);

    // availableUnitsCount must strictly be 1 (excluding Unit D and Unit E occupied units)
    expect(prop.availableUnitsCount).toBe(1);

    // minMonthlyRent and maxMonthlyRent must reflect only eligible units
    expect(prop.minMonthlyRent).toBe(22000);
    expect(prop.maxMonthlyRent).toBe(22000);

    // Detail view still lists all units with their respective availability status
    expect(prop.units).toHaveLength(5);
  });

  it('ensures rent filtering operates against eligible available units, ignoring occupied unit rents', async () => {
    // Ineligible units in multiUnitPropId have rents 11000, 12000, 14000, 16000.
    // Searching maxRent=18000 must NOT match multiUnitPropId because its only available unit is 22000!
    const resUnder = await request(edgeApp).get('/api/properties?maxRent=18000');
    expect(resUnder.status).toBe(200);
    expect(resUnder.body.data.properties).toHaveLength(0);

    // Searching minRent=20000 and maxRent=25000 matches Unit A (22000)
    const resMatch = await request(edgeApp).get('/api/properties?minRent=20000&maxRent=25000');
    expect(resMatch.status).toBe(200);
    expect(resMatch.body.data.properties).toHaveLength(1);
    expect(resMatch.body.data.properties[0].id).toBe(multiUnitPropId);
  });

  it('sorts properties by database-level rent_asc based on eligible units without contamination from occupied units', async () => {
    // MultiUnit Property has min eligible rent = 22000.
    // Clean Property F has min eligible rent = 35000.
    // Occupied Unit D has rent = 14000 (must NOT be used).
    const resAsc = await request(edgeApp).get('/api/properties?sortBy=rent_asc');
    expect(resAsc.status).toBe(200);
    const props = resAsc.body.data.properties;
    expect(props).toHaveLength(2);
    expect(props[0].id).toBe(multiUnitPropId);
    expect(props[0].minMonthlyRent).toBe(22000);
    expect(props[1].id).toBe(cleanPropFId);
    expect(props[1].minMonthlyRent).toBe(35000);

    // rent_desc: Property F (35000) first, MultiUnit (22000) second
    const resDesc = await request(edgeApp).get('/api/properties?sortBy=rent_desc');
    expect(resDesc.status).toBe(200);
    const propsDesc = resDesc.body.data.properties;
    expect(propsDesc[0].id).toBe(cleanPropFId);
    expect(propsDesc[1].id).toBe(multiUnitPropId);
  });

  it('spatial metadata totalAvailableUnits counts only eligible available units', async () => {
    const res = await request(edgeApp).get(
      `/api/properties?latitude=${baneshwor.latitude}&longitude=${baneshwor.longitude}&radiusKm=5&expandRadius=false`
    );
    expect(res.status).toBe(200);
    expect(res.body.data.properties).toHaveLength(2);

    const spatial = res.body.data.spatial;
    expect(spatial).toBeDefined();
    // 1 available unit from multiUnitPropId + 1 available unit from cleanPropFId = 2 total
    expect(spatial.totalAvailableUnits).toBe(2);
  });

  it('combines rooms, rent, area, and geospatial radius in a multi-filter discovery query', async () => {
    // MultiUnit Property: Unit A has 2 beds, 1 bath, 600 sqft, 22000 rent. Within 2km of Baneshwor.
    const res = await request(edgeApp).get(
      `/api/properties?latitude=${baneshwor.latitude}&longitude=${baneshwor.longitude}&radiusKm=2&expandRadius=false&rooms=2&minRent=20000&maxRent=25000&minArea=500`
    );
    expect(res.status).toBe(200);
    expect(res.body.data.properties).toHaveLength(1);
    expect(res.body.data.properties[0].id).toBe(multiUnitPropId);
  });
});
