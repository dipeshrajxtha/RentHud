import { sql, type Kysely } from 'kysely';
import type { Database, UnitAvailabilityStatus } from '../../types/database.js';
import {
  getRadiusStepInfo,
  getNextRadiusStep,
  stDistanceMeters,
  stDWithin,
  validateCoordinates,
  RADIUS_PROGRESSION_KM,
} from '../../common/gis.js';
import config from '../../../config/env.js';
import { NotFoundError, BadRequestError } from '../../common/errors/index.js';
import type { PropertySearchQuery } from './properties.schemas.js';
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
  let selectQuery = q.select([
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

  // Sorting
  if (query.sortBy === 'distance' && query.latitude !== undefined && query.longitude !== undefined) {
    selectQuery = selectQuery.orderBy('distance_meters', 'asc');
  } else if (query.sortBy === 'newest') {
    selectQuery = selectQuery.orderBy('p.created_at', 'desc');
  } else if (query.latitude !== undefined && query.longitude !== undefined) {
    selectQuery = selectQuery.orderBy('distance_meters', 'asc');
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

  const propertyIds = rawProperties.map((p) => p.id);

  // Fetch units for these properties
  const units = await db
    .selectFrom('property_units as pu')
    .selectAll('pu')
    .where('pu.property_id', 'in', propertyIds)
    .orderBy('pu.monthly_rent', 'asc')
    .execute();

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
    const propUnits = units.filter((u) => u.property_id === raw.id);
    const availableUnits = propUnits.filter(
      (u) => u.availability_status === 'AVAILABLE'
    );
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

    const rents = propUnits.map((u) => Number(u.monthly_rent));
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
        raw.distance_meters !== undefined ? Math.round(Number(raw.distance_meters)) : undefined,
      landlord: {
        id: raw.landlord_id,
        name: raw.landlord_name,
        avatarUrl: raw.landlord_avatar_url,
      },
      availableUnitsCount: availableUnits.length,
      minMonthlyRent: minRent,
      maxMonthlyRent: maxRent,
      coverPhotoUrl: coverPhoto?.url ?? null,
      amenities,
      units: propUnits.map((u) => ({
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

  // Handle client-requested sort by rent if requested
  if (query.sortBy === 'rent_asc') {
    results.sort((a, b) => (a.minMonthlyRent ?? 0) - (b.minMonthlyRent ?? 0));
  } else if (query.sortBy === 'rent_desc') {
    results.sort((a, b) => (b.maxMonthlyRent ?? 0) - (a.maxMonthlyRent ?? 0));
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
