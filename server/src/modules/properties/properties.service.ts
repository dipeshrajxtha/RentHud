import { sql, type Kysely } from 'kysely';
import type { Database, PropertyUnit, UnitAvailabilityStatus } from '../../types/database.js';
import {
  getRadiusStepInfo,
  getNextRadiusStep,
  stDistanceMeters,
  stDWithin,
  stMakePointGeography,
  validateCoordinates,
  RADIUS_PROGRESSION_KM,
} from '../../common/gis.js';
import config from '../../../config/env.js';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  ConflictError,
} from '../../common/errors/index.js';
import type {
  PropertySearchQuery,
  CreatePropertyInput,
  UpdatePropertyInput,
  CreateUnitInput,
  UpdateUnitInput,
} from './properties.schemas.js';
import type {
  PublicPropertySummary,
  PublicPropertyDetail,
  PublicUnitSummary,
  PublicAmenity,
  PublicPhoto,
  PublicVerificationBadge,
  PropertySearchResponse,
  SpatialSearchMetadata,
} from '../../../../shared/types/properties.js';

export async function searchProperties(
  db: Kysely<Database>,
  query: PropertySearchQuery
): Promise<PropertySearchResponse> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const offset = (page - 1) * limit;

  const hasCoords = query.latitude !== undefined && query.longitude !== undefined;
  if (hasCoords) {
    const validCheck = validateCoordinates({
      latitude: query.latitude!,
      longitude: query.longitude!,
    });
    if (!validCheck.valid) {
      throw new BadRequestError(validCheck.reason ?? 'Invalid coordinates');
    }
  }

  let effectiveRadiusMeters: number | undefined;
  let currentStepLevel = query.stepLevel ?? 1;
  let maxRadiusReached = false;

  // Spatial search with exponential radius progression if coordinates are supplied
  if (hasCoords) {
    if (query.radiusKm !== undefined) {
      effectiveRadiusMeters = query.radiusKm * 1000;
      maxRadiusReached = query.radiusKm >= config.spatial.maxRadiusKm;
    } else {
      let stepInfo = getRadiusStepInfo(currentStepLevel);
      effectiveRadiusMeters = stepInfo.radiusMeters;
      maxRadiusReached = stepInfo.maxRadiusReached;

      if (query.expandRadius) {
        // Probe result counts and expand radius until MIN_RESULTS_THRESHOLD is satisfied
        while (!stepInfo.maxRadiusReached) {
          const probeCount = await countMatchingProperties(
            db,
            query,
            stepInfo.radiusMeters
          );
          if (probeCount >= config.spatial.minResultsThreshold) {
            break;
          }
          stepInfo = getNextRadiusStep(stepInfo.stepLevel);
          currentStepLevel = stepInfo.stepLevel;
          effectiveRadiusMeters = stepInfo.radiusMeters;
          maxRadiusReached = stepInfo.maxRadiusReached;
        }
      }
    }
  }

  // Fetch properties matching criteria and within current radius
  const properties = await fetchMatchingProperties(
    db,
    query,
    effectiveRadiusMeters,
    limit,
    offset
  );

  const totalCount = await countMatchingProperties(db, query, effectiveRadiusMeters);

  let spatialMetadata: SpatialSearchMetadata | undefined;
  if (hasCoords && effectiveRadiusMeters !== undefined) {
    let totalUnits = 0;
    for (const p of properties) {
      totalUnits += p.availableUnitsCount;
    }
    spatialMetadata = {
      queryRadiusMeters: effectiveRadiusMeters,
      stepLevel: currentStepLevel,
      maxRadiusReached,
      totalAvailableUnits: totalUnits,
    };
  }

  return {
    properties,
    totalProperties: totalCount,
    spatial: spatialMetadata,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
    },
  };
}

/** Helper to build where clauses for search */
function applyPropertyFilters(
  baseQuery: any,
  query: PropertySearchQuery,
  radiusMeters?: number
) {
  let q = baseQuery.where('p.is_active', '=', true);

  if (query.city) {
    q = q.where(sql`LOWER(p.city)`, 'like', `%${query.city.toLowerCase()}%`);
  }

  if (
    query.latitude !== undefined &&
    query.longitude !== undefined &&
    radiusMeters !== undefined
  ) {
    q = q.where(
      stDWithin('p.location', query.longitude, query.latitude, radiusMeters)
    );
  }

  // Filter properties that have at least one unit matching specifications
  q = q.where((eb: any) => {
    let uq = eb
      .selectFrom('property_units as u')
      .select('u.id')
      .whereRef('u.property_id', '=', 'p.id');

    if (query.availability) {
      uq = uq.where('u.availability_status', '=', query.availability);
    }
    if (query.minRent !== undefined) {
      uq = uq.where('u.monthly_rent', '>=', query.minRent);
    }
    if (query.maxRent !== undefined) {
      uq = uq.where('u.monthly_rent', '<=', query.maxRent);
    }
    if (query.minArea !== undefined) {
      uq = uq.where('u.area_sqft', '>=', query.minArea);
    }
    if (query.maxArea !== undefined) {
      uq = uq.where('u.area_sqft', '<=', query.maxArea);
    }
    if (query.bedrooms !== undefined) {
      uq = uq.where('u.bedrooms', '>=', query.bedrooms);
    }
    if (query.bathrooms !== undefined) {
      uq = uq.where('u.bathrooms', '>=', query.bathrooms);
    }

    // When searching for AVAILABLE units, exclude any that have an active or
    // pending_signature tenancy – these are occupied even if status hasn't
    // been updated yet (belt-and-suspenders guard).
    if (!query.availability || query.availability === 'AVAILABLE') {
      uq = uq.where((subEb: any) =>
        subEb.not(
          subEb.exists(
            subEb
              .selectFrom('tenancies as t')
              .select('t.id')
              .whereRef('t.unit_id', '=', 'u.id')
              .where('t.status', 'in', ['active', 'pending_signature'])
          )
        )
      );
    }

    return eb.exists(uq);
  });

  // Filter amenities if requested
  if (query.amenities && query.amenities.length > 0) {
    for (const amenity of query.amenities) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(amenity);
      q = q.where((eb: any) =>
        eb.or([
          // Property-level amenity
          eb.exists(
            eb
              .selectFrom('property_amenities as pa')
              .innerJoin('amenities as a', 'a.id', 'pa.amenity_id')
              .whereRef('pa.property_id', '=', 'p.id')
              .where((sub: any) => {
                const conditions = [
                  sub('a.slug', '=', amenity),
                  sub(sql`LOWER(a.name)`, '=', amenity.toLowerCase()),
                ];
                if (isUuid) {
                  conditions.push(sub('a.id', '=', amenity));
                }
                return sub.or(conditions);
              })
          ),
          // Unit-level amenity
          eb.exists(
            eb
              .selectFrom('property_units as u')
              .innerJoin('unit_amenities as ua', 'ua.unit_id', 'u.id')
              .innerJoin('amenities as a', 'a.id', 'ua.amenity_id')
              .whereRef('u.property_id', '=', 'p.id')
              .where((sub: any) => {
                const conditions = [
                  sub('a.slug', '=', amenity),
                  sub(sql`LOWER(a.name)`, '=', amenity.toLowerCase()),
                ];
                if (isUuid) {
                  conditions.push(sub('a.id', '=', amenity));
                }
                return sub.or(conditions);
              })
          ),
        ])
      );
    }
  }

  return q;
}

async function countMatchingProperties(
  db: Kysely<Database>,
  query: PropertySearchQuery,
  radiusMeters?: number
): Promise<number> {
  let countQuery = db.selectFrom('properties as p');
  countQuery = applyPropertyFilters(countQuery, query, radiusMeters);

  const result = await countQuery
    .select(sql<number>`COUNT(DISTINCT p.id)`.as('count'))
    .executeTakeFirst();

  return Number(result?.count ?? 0);
}

async function fetchMatchingProperties(
  db: Kysely<Database>,
  query: PropertySearchQuery,
  radiusMeters: number | undefined,
  limit: number,
  offset: number
): Promise<PublicPropertySummary[]> {
  let q = db
    .selectFrom('properties as p')
    .innerJoin('users as u', 'u.id', 'p.landlord_id');

  q = applyPropertyFilters(q, query, radiusMeters);

  // Safe columns selection: ST_X, ST_Y for clean coordinates, no raw WKB hex leaks
  let selectQuery: any = q.select([
    'p.id as id',
    'p.title as title',
    'p.description as description',
    'p.address as address',
    'p.city as city',
    'p.postal_code as postal_code',
    'p.total_floors as total_floors',
    'p.created_at as created_at',
    sql<number>`ST_Y(p.location::geometry)`.as('latitude'),
    sql<number>`ST_X(p.location::geometry)`.as('longitude'),
    'u.id as landlord_id',
    'u.name as landlord_name',
    'u.avatar_url as landlord_avatar_url',
  ]);

  if (query.latitude !== undefined && query.longitude !== undefined) {
    selectQuery = selectQuery.select(
      stDistanceMeters('p.location', query.longitude, query.latitude).as(
        'distance_meters'
      )
    );
  }

  // Sorting — rent sorts use a SQL subquery for database-level ordering so
  // pagination is correct across large result sets.
  if (query.sortBy === 'rent_asc') {
    selectQuery = selectQuery.orderBy(
      sql`(SELECT MIN(pu2.monthly_rent) FROM property_units pu2 WHERE pu2.property_id = p.id AND pu2.availability_status = 'AVAILABLE') ASC NULLS LAST`
    );
  } else if (query.sortBy === 'rent_desc') {
    selectQuery = selectQuery.orderBy(
      sql`(SELECT MAX(pu2.monthly_rent) FROM property_units pu2 WHERE pu2.property_id = p.id AND pu2.availability_status = 'AVAILABLE') DESC NULLS LAST`
    );
  } else if (query.sortBy === 'distance' && query.latitude !== undefined && query.longitude !== undefined) {
    selectQuery = selectQuery.orderBy(sql`distance_meters`, 'asc');
  } else if (query.sortBy === 'newest') {
    selectQuery = selectQuery.orderBy('p.created_at', 'desc');
  } else if (query.latitude !== undefined && query.longitude !== undefined) {
    // Default spatial order: nearest first
    selectQuery = selectQuery.orderBy(sql`distance_meters`, 'asc');
  } else {
    selectQuery = selectQuery.orderBy('p.created_at', 'desc');
  }

  const rawProperties = await selectQuery
    .limit(limit)
    .offset(offset)
    .execute();

  if (rawProperties.length === 0) {
    return [];
  }

  const propertyIds = rawProperties.map((p: any) => p.id as string);

  // Fetch units for these properties — exclude units with active/pending
  // tenancies when the search is for AVAILABLE units (safe public exposure).
  const requestedAvailability = query.availability ?? 'AVAILABLE';
  let unitsQ: any = db
    .selectFrom('property_units as pu')
    .selectAll('pu')
    .where('pu.property_id', 'in', propertyIds)
    .where('pu.availability_status', '=', requestedAvailability);

  if (requestedAvailability === 'AVAILABLE') {
    unitsQ = unitsQ.where((eb: any) =>
      eb.not(
        eb.exists(
          eb
            .selectFrom('tenancies as t')
            .select('t.id')
            .whereRef('t.unit_id', '=', 'pu.id')
            .where('t.status', 'in', ['active', 'pending_signature'])
        )
      )
    );
  }

  const units: PropertyUnit[] = await unitsQ.orderBy('pu.monthly_rent', 'asc').execute();

  // Fetch cover photos
  const photos = await db
    .selectFrom('photos')
    .selectAll()
    .where('property_id', 'in', propertyIds)
    .where('is_cover', '=', true)
    .execute();

  // Fetch building amenities
  const buildingAmenities = await db
    .selectFrom('property_amenities as pa')
    .innerJoin('amenities as a', 'a.id', 'pa.amenity_id')
    .select([
      'pa.property_id as property_id',
      'a.id as id',
      'a.name as name',
      'a.slug as slug',
      'a.category as category',
      'a.icon as icon',
    ])
    .where('pa.property_id', 'in', propertyIds)
    .execute();

  const results: PublicPropertySummary[] = [];

  for (const raw of rawProperties) {
    // propUnits already filtered to requestedAvailability (and no active tenancies for AVAILABLE)
    const propUnits: PropertyUnit[] = units.filter((u: PropertyUnit) => u.property_id === raw.id);
    // availableUnitsCount always reflects truly AVAILABLE units (may differ from propUnits
    // when caller requested a different availability filter)
    const availableUnitsCount = requestedAvailability === 'AVAILABLE'
      ? propUnits.length
      : propUnits.filter((u: PropertyUnit) => u.availability_status === 'AVAILABLE').length;

    const coverPhoto = photos.find((ph) => ph.property_id === raw.id);
    const amenities = buildingAmenities
      .filter((ba) => ba.property_id === raw.id)
      .map((ba) => ({
        id: ba.id,
        name: ba.name,
        slug: ba.slug,
        category: ba.category as 'building' | 'unit' | 'general',
        icon: ba.icon,
      }));

    // Rent bounds derived from eligible (returned) units only, not all property units
    const rents = propUnits.map((u: PropertyUnit) => Number(u.monthly_rent));
    const minRent = rents.length > 0 ? Math.min(...rents) : null;
    const maxRent = rents.length > 0 ? Math.max(...rents) : null;

    results.push({
      id: raw.id,
      title: raw.title,
      description: raw.description,
      address: raw.address,
      city: raw.city,
      postalCode: raw.postal_code,
      location: {
        latitude: Number(raw.latitude),
        longitude: Number(raw.longitude),
      },
      totalFloors: raw.total_floors,
      distanceMeters:
        (raw as any).distance_meters !== undefined && (raw as any).distance_meters !== null
          ? Math.round(Number((raw as any).distance_meters) * 10) / 10
          : undefined,
      landlord: {
        id: raw.landlord_id,
        name: raw.landlord_name,
        avatarUrl: raw.landlord_avatar_url,
      },
      availableUnitsCount,
      minMonthlyRent: minRent,
      maxMonthlyRent: maxRent,
      coverPhotoUrl: coverPhoto?.url ?? null,
      amenities,
      units: propUnits.map((u: PropertyUnit) => ({
        id: u.id,
        propertyId: u.property_id,
        unitIdentifier: u.unit_identifier,
        floorNumber: u.floor_number,
        bedrooms: u.bedrooms,
        bathrooms: u.bathrooms,
        areaSqft: u.area_sqft,
        monthlyRent: Number(u.monthly_rent),
        securityDeposit: Number(u.security_deposit),
        availabilityStatus: u.availability_status,
        amenities: [],
        photos: [],
      })),
    });
  }

  return results;
}

export async function getPropertyById(
  db: Kysely<Database>,
  propertyId: string
): Promise<PublicPropertyDetail> {
  const property = await db
    .selectFrom('properties as p')
    .innerJoin('users as u', 'u.id', 'p.landlord_id')
    .select([
      'p.id as id',
      'p.title as title',
      'p.description as description',
      'p.address as address',
      'p.city as city',
      'p.postal_code as postal_code',
      'p.total_floors as total_floors',
      'p.is_active as is_active',
      'p.created_at as created_at',
      sql<number>`ST_Y(p.location::geometry)`.as('latitude'),
      sql<number>`ST_X(p.location::geometry)`.as('longitude'),
      // Landlord public information ONLY (scrub email, roles, google_id)
      'u.id as landlord_id',
      'u.name as landlord_name',
      'u.avatar_url as landlord_avatar_url',
    ])
    .where('p.id', '=', propertyId)
    .where('p.is_active', '=', true)
    .executeTakeFirst();

  if (!property) {
    throw new NotFoundError('Property not found');
  }

  // Fetch all units for this property
  const rawUnits = await db
    .selectFrom('property_units')
    .selectAll()
    .where('property_id', '=', propertyId)
    .orderBy('floor_number', 'asc')
    .orderBy('unit_identifier', 'asc')
    .execute();

  const unitIds = rawUnits.map((u) => u.id);

  // Fetch unit amenities
  const unitAmenities = unitIds.length > 0
    ? await db
        .selectFrom('unit_amenities as ua')
        .innerJoin('amenities as a', 'a.id', 'ua.amenity_id')
        .select([
          'ua.unit_id as unit_id',
          'a.id as id',
          'a.name as name',
          'a.slug as slug',
          'a.category as category',
          'a.icon as icon',
        ])
        .where('ua.unit_id', 'in', unitIds)
        .execute()
    : [];

  // Fetch photos for property and units
  const photos = await db
    .selectFrom('photos')
    .selectAll()
    .where((eb) =>
      eb.or([
        eb('property_id', '=', propertyId),
        ...(unitIds.length > 0 ? [eb('unit_id', 'in', unitIds)] : []),
      ])
    )
    .orderBy('display_order', 'asc')
    .execute();

  // Fetch building amenities
  const buildingAmenities = await db
    .selectFrom('property_amenities as pa')
    .innerJoin('amenities as a', 'a.id', 'pa.amenity_id')
    .select([
      'a.id as id',
      'a.name as name',
      'a.slug as slug',
      'a.category as category',
      'a.icon as icon',
    ])
    .where('pa.property_id', '=', propertyId)
    .execute();

  // Fetch verification badges
  const verificationBadges = await db
    .selectFrom('verifications as v')
    .innerJoin('verification_badges as vb', 'vb.id', 'v.badge_id')
    .select(['vb.code as code', 'vb.name as name', 'vb.description as description'])
    .where((eb) =>
      eb.or([
        eb.and([
          eb('v.property_id', '=', propertyId),
          eb('v.status', '=', 'VERIFIED'),
        ]),
        eb.and([
          eb('v.user_id', '=', property.landlord_id),
          eb('v.status', '=', 'VERIFIED'),
        ]),
      ])
    )
    .execute();

  // Fetch review summary
  const reviewStats = await db
    .selectFrom('tenancy_reviews')
    .select([
      sql<number>`ROUND(AVG(rating)::numeric, 1)`.as('avg_rating'),
      sql<number>`COUNT(id)`.as('review_count'),
    ])
    .where('property_id', '=', propertyId)
    .executeTakeFirst();

  const formattedUnits: PublicUnitSummary[] = rawUnits.map((u) => {
    const uAmenities = unitAmenities
      .filter((ua) => ua.unit_id === u.id)
      .map((ua) => ({
        id: ua.id,
        name: ua.name,
        slug: ua.slug,
        category: ua.category as 'building' | 'unit' | 'general',
        icon: ua.icon,
      }));

    const uPhotos: PublicPhoto[] = photos
      .filter((ph) => ph.unit_id === u.id)
      .map((ph) => ({
        id: ph.id,
        url: ph.url,
        caption: ph.caption,
        isCover: ph.is_cover,
        displayOrder: ph.display_order,
        unitId: ph.unit_id,
      }));

    return {
      id: u.id,
      propertyId: u.property_id,
      unitIdentifier: u.unit_identifier,
      floorNumber: u.floor_number,
      bedrooms: u.bedrooms,
      bathrooms: u.bathrooms,
      areaSqft: u.area_sqft,
      monthlyRent: Number(u.monthly_rent),
      securityDeposit: Number(u.security_deposit),
      availabilityStatus: u.availability_status,
      amenities: uAmenities,
      photos: uPhotos,
    };
  });

  const propertyPhotos: PublicPhoto[] = photos
    .filter((ph) => ph.property_id === propertyId)
    .map((ph) => ({
      id: ph.id,
      url: ph.url,
      caption: ph.caption,
      isCover: ph.is_cover,
      displayOrder: ph.display_order,
      propertyId: ph.property_id,
    }));

  const coverPhoto = propertyPhotos.find((ph) => ph.isCover) ?? propertyPhotos[0] ?? null;
  const rents = rawUnits.map((u) => Number(u.monthly_rent));
  const availableUnits = rawUnits.filter((u) => u.availability_status === 'AVAILABLE');

  return {
    id: property.id,
    title: property.title,
    description: property.description,
    address: property.address,
    city: property.city,
    postalCode: property.postal_code,
    location: {
      latitude: Number(property.latitude),
      longitude: Number(property.longitude),
    },
    totalFloors: property.total_floors,
    landlord: {
      id: property.landlord_id,
      name: property.landlord_name,
      avatarUrl: property.landlord_avatar_url,
    },
    availableUnitsCount: availableUnits.length,
    minMonthlyRent: rents.length > 0 ? Math.min(...rents) : null,
    maxMonthlyRent: rents.length > 0 ? Math.max(...rents) : null,
    coverPhotoUrl: coverPhoto?.url ?? null,
    amenities: buildingAmenities.map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      category: a.category as 'building' | 'unit' | 'general',
      icon: a.icon,
    })),
    units: formattedUnits,
    photos: propertyPhotos,
    verificationBadges: verificationBadges.map((vb) => ({
      code: vb.code,
      name: vb.name,
      description: vb.description,
    })),
    reviewsSummary: {
      averageRating: reviewStats?.avg_rating ? Number(reviewStats.avg_rating) : null,
      totalReviews: Number(reviewStats?.review_count ?? 0),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Landlord Property & Unit Management Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a new property owned by the authenticated landlord.
 */
export async function createProperty(
  db: Kysely<Database>,
  landlordId: string,
  input: CreatePropertyInput
) {
  const validCheck = validateCoordinates({
    latitude: input.latitude,
    longitude: input.longitude,
  });
  if (!validCheck.valid) {
    throw new BadRequestError(validCheck.reason ?? 'Invalid coordinates');
  }

  const [row] = await db
    .insertInto('properties')
    .values({
      landlord_id: landlordId,
      title: input.title,
      description: input.description ?? null,
      address: input.address,
      city: input.city,
      postal_code: input.postalCode ?? null,
      location: stMakePointGeography(input.longitude, input.latitude),
      total_floors: input.totalFloors ?? 1,
      is_active: true,
    })
    .returningAll()
    .execute();

  return {
    id: row.id,
    landlordId: row.landlord_id,
    title: row.title,
    description: row.description,
    address: row.address,
    city: row.city,
    postalCode: row.postal_code,
    location: {
      latitude: input.latitude,
      longitude: input.longitude,
    },
    totalFloors: row.total_floors,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Lists all properties owned by the authenticated landlord, including unit counts.
 */
export async function getLandlordProperties(
  db: Kysely<Database>,
  landlordId: string
) {
  const rows = await db
    .selectFrom('properties as p')
    .select([
      'p.id',
      'p.landlord_id',
      'p.title',
      'p.description',
      'p.address',
      'p.city',
      'p.postal_code',
      'p.total_floors',
      'p.is_active',
      'p.created_at',
      'p.updated_at',
      sql<number>`ST_Y(p.location::geometry)`.as('latitude'),
      sql<number>`ST_X(p.location::geometry)`.as('longitude'),
    ])
    .where('p.landlord_id', '=', landlordId)
    .orderBy('p.created_at', 'desc')
    .execute();

  const propertyIds = rows.map((r) => r.id);

  const unitsByProperty: Record<string, any[]> = {};
  if (propertyIds.length > 0) {
    const units = await db
      .selectFrom('property_units')
      .selectAll()
      .where('property_id', 'in', propertyIds)
      .execute();
    for (const u of units) {
      if (!unitsByProperty[u.property_id]) {
        unitsByProperty[u.property_id] = [];
      }
      unitsByProperty[u.property_id].push({
        id: u.id,
        propertyId: u.property_id,
        unitIdentifier: u.unit_identifier,
        floorNumber: u.floor_number,
        bedrooms: u.bedrooms,
        bathrooms: u.bathrooms,
        areaSqft: u.area_sqft ? Number(u.area_sqft) : null,
        monthlyRent: Number(u.monthly_rent),
        securityDeposit: Number(u.security_deposit),
        availabilityStatus: u.availability_status,
        createdAt: u.created_at,
        updatedAt: u.updated_at,
      });
    }
  }

  return rows.map((r) => {
    const propUnits = unitsByProperty[r.id] ?? [];
    return {
      id: r.id,
      landlordId: r.landlord_id,
      title: r.title,
      description: r.description,
      address: r.address,
      city: r.city,
      postalCode: r.postal_code,
      location: {
        latitude: Number(r.latitude),
        longitude: Number(r.longitude),
      },
      totalFloors: r.total_floors,
      isActive: r.is_active,
      unitsCount: propUnits.length,
      availableUnitsCount: propUnits.filter((u) => u.availabilityStatus === 'AVAILABLE').length,
      units: propUnits,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  });
}

/**
 * Updates a property owned by the authenticated landlord with ownership check.
 */
export async function updateProperty(
  db: Kysely<Database>,
  propertyId: string,
  landlordId: string,
  input: UpdatePropertyInput
) {
  const property = await db
    .selectFrom('properties')
    .selectAll()
    .where('id', '=', propertyId)
    .executeTakeFirst();

  if (!property) {
    throw new NotFoundError('Property not found');
  }

  if (property.landlord_id !== landlordId) {
    throw new ForbiddenError('You do not have permission to manage this property');
  }

  const updates: Record<string, any> = {
    updated_at: sql`NOW()`,
  };

  if (input.title !== undefined) updates.title = input.title;
  if (input.description !== undefined) updates.description = input.description;
  if (input.address !== undefined) updates.address = input.address;
  if (input.city !== undefined) updates.city = input.city;
  if (input.postalCode !== undefined) updates.postal_code = input.postalCode;
  if (input.totalFloors !== undefined) updates.total_floors = input.totalFloors;
  if (input.isActive !== undefined) updates.is_active = input.isActive;

  if (input.latitude !== undefined && input.longitude !== undefined) {
    const validCheck = validateCoordinates({
      latitude: input.latitude,
      longitude: input.longitude,
    });
    if (!validCheck.valid) {
      throw new BadRequestError(validCheck.reason ?? 'Invalid coordinates');
    }
    updates.location = stMakePointGeography(input.longitude, input.latitude);
  }

  await db
    .updateTable('properties')
    .set(updates)
    .where('id', '=', propertyId)
    .execute();

  const refreshed = await db
    .selectFrom('properties as p')
    .select([
      'p.id',
      'p.landlord_id',
      'p.title',
      'p.description',
      'p.address',
      'p.city',
      'p.postal_code',
      'p.total_floors',
      'p.is_active',
      'p.created_at',
      'p.updated_at',
      sql<number>`ST_Y(p.location::geometry)`.as('latitude'),
      sql<number>`ST_X(p.location::geometry)`.as('longitude'),
    ])
    .where('p.id', '=', propertyId)
    .executeTakeFirstOrThrow();

  return {
    id: refreshed.id,
    landlordId: refreshed.landlord_id,
    title: refreshed.title,
    description: refreshed.description,
    address: refreshed.address,
    city: refreshed.city,
    postalCode: refreshed.postal_code,
    location: {
      latitude: Number(refreshed.latitude),
      longitude: Number(refreshed.longitude),
    },
    totalFloors: refreshed.total_floors,
    isActive: refreshed.is_active,
    createdAt: refreshed.created_at,
    updatedAt: refreshed.updated_at,
  };
}

/**
 * Soft deactivates a property owned by the landlord. Ensures no active/pending tenancies exist.
 */
export async function deleteProperty(
  db: Kysely<Database>,
  propertyId: string,
  landlordId: string
) {
  const property = await db
    .selectFrom('properties')
    .selectAll()
    .where('id', '=', propertyId)
    .executeTakeFirst();

  if (!property) {
    throw new NotFoundError('Property not found');
  }

  if (property.landlord_id !== landlordId) {
    throw new ForbiddenError('You do not have permission to manage this property');
  }

  // Check if any unit in the property has active or pending tenancies
  const activeTenancy = await db
    .selectFrom('tenancies as t')
    .innerJoin('property_units as u', 'u.id', 't.unit_id')
    .select('t.id')
    .where('u.property_id', '=', propertyId)
    .where('t.status', 'in', ['active', 'pending_signature'])
    .executeTakeFirst();

  if (activeTenancy) {
    throw new ConflictError('Cannot deactivate property with active or pending tenancies');
  }

  // Soft-deactivate property
  await db
    .updateTable('properties')
    .set({
      is_active: false,
      updated_at: sql`NOW()`,
    })
    .where('id', '=', propertyId)
    .execute();

  return { message: 'Property successfully deactivated' };
}

/**
 * Adds a new unit to a landlord's property.
 */
export async function createUnit(
  db: Kysely<Database>,
  propertyId: string,
  landlordId: string,
  input: CreateUnitInput
) {
  const property = await db
    .selectFrom('properties')
    .selectAll()
    .where('id', '=', propertyId)
    .executeTakeFirst();

  if (!property) {
    throw new NotFoundError('Property not found');
  }

  if (property.landlord_id !== landlordId) {
    throw new ForbiddenError('You do not have permission to manage this property');
  }

  if (!property.is_active) {
    throw new BadRequestError('Cannot add units to an inactive property');
  }

  const existing = await db
    .selectFrom('property_units')
    .select('id')
    .where('property_id', '=', propertyId)
    .where('unit_identifier', '=', input.unitIdentifier)
    .executeTakeFirst();

  if (existing) {
    throw new ConflictError(
      `Unit identifier "${input.unitIdentifier}" already exists in this property`
    );
  }

  const [unit] = await db
    .insertInto('property_units')
    .values({
      property_id: propertyId,
      unit_identifier: input.unitIdentifier,
      floor_number: input.floorNumber ?? 1,
      bedrooms: input.bedrooms ?? 1,
      bathrooms: input.bathrooms ?? 1,
      area_sqft: input.areaSqft ?? null,
      monthly_rent: input.monthlyRent,
      security_deposit: input.securityDeposit ?? 0,
      availability_status: input.availabilityStatus ?? 'AVAILABLE',
    })
    .returningAll()
    .execute();

  return {
    id: unit.id,
    propertyId: unit.property_id,
    unitIdentifier: unit.unit_identifier,
    floorNumber: unit.floor_number,
    bedrooms: unit.bedrooms,
    bathrooms: unit.bathrooms,
    areaSqft: unit.area_sqft ? Number(unit.area_sqft) : null,
    monthlyRent: Number(unit.monthly_rent),
    securityDeposit: Number(unit.security_deposit),
    availabilityStatus: unit.availability_status,
    createdAt: unit.created_at,
    updatedAt: unit.updated_at,
  };
}

/**
 * Retrieves all units for a given property.
 */
export async function getUnitsByProperty(
  db: Kysely<Database>,
  propertyId: string,
  landlordId?: string
) {
  const property = await db
    .selectFrom('properties')
    .selectAll()
    .where('id', '=', propertyId)
    .executeTakeFirst();

  if (!property) {
    throw new NotFoundError('Property not found');
  }

  if (landlordId && property.landlord_id !== landlordId) {
    throw new ForbiddenError('You do not have permission to view units for this property');
  }

  const units = await db
    .selectFrom('property_units')
    .selectAll()
    .where('property_id', '=', propertyId)
    .orderBy('floor_number', 'asc')
    .orderBy('unit_identifier', 'asc')
    .execute();

  return units.map((u) => ({
    id: u.id,
    propertyId: u.property_id,
    unitIdentifier: u.unit_identifier,
    floorNumber: u.floor_number,
    bedrooms: u.bedrooms,
    bathrooms: u.bathrooms,
    areaSqft: u.area_sqft ? Number(u.area_sqft) : null,
    monthlyRent: Number(u.monthly_rent),
    securityDeposit: Number(u.security_deposit),
    availabilityStatus: u.availability_status,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
  }));
}

/**
 * Updates a unit in a landlord's property with state transition verification.
 */
export async function updateUnit(
  db: Kysely<Database>,
  propertyId: string,
  unitId: string,
  landlordId: string,
  input: UpdateUnitInput
) {
  const property = await db
    .selectFrom('properties')
    .selectAll()
    .where('id', '=', propertyId)
    .executeTakeFirst();

  if (!property) {
    throw new NotFoundError('Property not found');
  }

  if (property.landlord_id !== landlordId) {
    throw new ForbiddenError('You do not have permission to manage this property');
  }

  const unit = await db
    .selectFrom('property_units')
    .selectAll()
    .where('id', '=', unitId)
    .where('property_id', '=', propertyId)
    .executeTakeFirst();

  if (!unit) {
    throw new NotFoundError('Unit not found in this property');
  }

  // Check unique identifier if changed
  if (input.unitIdentifier && input.unitIdentifier !== unit.unit_identifier) {
    const existing = await db
      .selectFrom('property_units')
      .select('id')
      .where('property_id', '=', propertyId)
      .where('unit_identifier', '=', input.unitIdentifier)
      .where('id', '!=', unitId)
      .executeTakeFirst();

    if (existing) {
      throw new ConflictError(
        `Unit identifier "${input.unitIdentifier}" already exists in this property`
      );
    }
  }

  // State transition guards
  if (input.availabilityStatus && input.availabilityStatus !== unit.availability_status) {
    if (unit.availability_status === 'ON_RENT' && input.availabilityStatus !== 'ON_RENT') {
      const activeLease = await db
        .selectFrom('tenancies')
        .select('id')
        .where('unit_id', '=', unitId)
        .where('status', '=', 'active')
        .executeTakeFirst();
      if (activeLease) {
        throw new ConflictError(
          'Cannot change status of a unit with an active lease. Terminate the lease first.'
        );
      }
    }
    if (
      unit.availability_status === 'PENDING_SIGNATURE' &&
      input.availabilityStatus !== 'PENDING_SIGNATURE'
    ) {
      const pendingLease = await db
        .selectFrom('tenancies')
        .select('id')
        .where('unit_id', '=', unitId)
        .where('status', '=', 'pending_signature')
        .executeTakeFirst();
      if (pendingLease) {
        throw new ConflictError(
          'Cannot change status of a unit with a pending lease agreement.'
        );
      }
    }
  }

  const updates: Record<string, any> = {
    updated_at: sql`NOW()`,
  };

  if (input.unitIdentifier !== undefined) updates.unit_identifier = input.unitIdentifier;
  if (input.floorNumber !== undefined) updates.floor_number = input.floorNumber;
  if (input.bedrooms !== undefined) updates.bedrooms = input.bedrooms;
  if (input.bathrooms !== undefined) updates.bathrooms = input.bathrooms;
  if (input.areaSqft !== undefined) updates.area_sqft = input.areaSqft;
  if (input.monthlyRent !== undefined) updates.monthly_rent = input.monthlyRent;
  if (input.securityDeposit !== undefined) updates.security_deposit = input.securityDeposit;
  if (input.availabilityStatus !== undefined) updates.availability_status = input.availabilityStatus;

  const [updated] = await db
    .updateTable('property_units')
    .set(updates)
    .where('id', '=', unitId)
    .returningAll()
    .execute();

  return {
    id: updated.id,
    propertyId: updated.property_id,
    unitIdentifier: updated.unit_identifier,
    floorNumber: updated.floor_number,
    bedrooms: updated.bedrooms,
    bathrooms: updated.bathrooms,
    areaSqft: updated.area_sqft ? Number(updated.area_sqft) : null,
    monthlyRent: Number(updated.monthly_rent),
    securityDeposit: Number(updated.security_deposit),
    availabilityStatus: updated.availability_status,
    createdAt: updated.created_at,
    updatedAt: updated.updated_at,
  };
}

/**
 * Deletes or sets unit to UNAVAILABLE with ownership and active tenancy checks.
 */
export async function deleteUnit(
  db: Kysely<Database>,
  propertyId: string,
  unitId: string,
  landlordId: string
) {
  const property = await db
    .selectFrom('properties')
    .selectAll()
    .where('id', '=', propertyId)
    .executeTakeFirst();

  if (!property) {
    throw new NotFoundError('Property not found');
  }

  if (property.landlord_id !== landlordId) {
    throw new ForbiddenError('You do not have permission to manage this property');
  }

  const unit = await db
    .selectFrom('property_units')
    .selectAll()
    .where('id', '=', unitId)
    .where('property_id', '=', propertyId)
    .executeTakeFirst();

  if (!unit) {
    throw new NotFoundError('Unit not found in this property');
  }

  // Active or pending tenancies check
  const activeTenancy = await db
    .selectFrom('tenancies')
    .select('id')
    .where('unit_id', '=', unitId)
    .where('status', 'in', ['active', 'pending_signature'])
    .executeTakeFirst();

  if (activeTenancy) {
    throw new ConflictError('Cannot delete unit with an active or pending lease binding');
  }

  // Check if historical requests or tenancies exist
  const hasHistory = await db
    .selectFrom('rental_requests')
    .select('id')
    .where('unit_id', '=', unitId)
    .executeTakeFirst();

  if (hasHistory) {
    await db
      .updateTable('property_units')
      .set({
        availability_status: 'UNAVAILABLE',
        updated_at: sql`NOW()`,
      })
      .where('id', '=', unitId)
      .execute();
    return { message: 'Unit has existing history and was set to UNAVAILABLE' };
  }

  await db
    .deleteFrom('property_units')
    .where('id', '=', unitId)
    .execute();

  return { message: 'Unit successfully deleted' };
}

