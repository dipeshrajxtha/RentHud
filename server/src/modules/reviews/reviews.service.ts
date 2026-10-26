import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { Database, TenancyReview } from '../../types/database.js';
import type { CreateReviewBody } from './reviews.schemas.js';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
} from '../../common/errors/index.js';

export interface FormattedReview {
  id: string;
  tenancyId: string;
  propertyId: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  rating: number;
  cleanlinessRating: number | null;
  communicationRating: number | null;
  reviewText: string | null;
  amenitiesFeedback: string | null;
  createdAt: Date;
}

export interface PropertyReviewsResult {
  reviews: FormattedReview[];
  summary: {
    averageRating: number | null;
    cleanlinessAverage: number | null;
    communicationAverage: number | null;
    totalReviews: number;
    distribution: Record<number, number>;
  };
}

/**
 * Creates a verified tenancy review.
 * Enforces:
 * 1. User must be the tenant of the referenced tenancy.
 * 2. Referenced tenancy must belong to the specified property.
 * 3. Tenancy status must be 'active' or 'completed'.
 * 4. Only one review allowed per tenancy (unique constraint + check).
 */
export async function createPropertyReview(
  db: Kysely<Database>,
  propertyId: string,
  userId: string,
  data: CreateReviewBody
): Promise<FormattedReview> {
  // 1. Verify property exists
  const property = await db
    .selectFrom('properties')
    .select('id')
    .where('id', '=', propertyId)
    .executeTakeFirst();

  if (!property) {
    throw new NotFoundError('Property not found');
  }

  // 2. Fetch tenancy and verify rights
  const tenancy = await db
    .selectFrom('tenancies as t')
    .innerJoin('property_units as pu', 'pu.id', 't.unit_id')
    .select([
      't.id',
      't.tenant_id',
      't.status',
      'pu.property_id as property_id',
    ])
    .where('t.id', '=', data.tenancy_id)
    .executeTakeFirst();

  if (!tenancy) {
    throw new NotFoundError('Referenced tenancy agreement not found');
  }

  if (tenancy.property_id !== propertyId) {
    throw new BadRequestError('Tenancy agreement does not belong to this property');
  }

  if (tenancy.tenant_id !== userId) {
    throw new ForbiddenError('Only the tenant of this tenancy agreement may submit a review');
  }

  const validStatuses = ['active', 'completed'];
  if (!validStatuses.includes(tenancy.status)) {
    throw new BadRequestError(
      `Reviews can only be submitted for active or completed tenancies (current status: ${tenancy.status})`
    );
  }

  // 3. Check for existing review
  const existingReview = await db
    .selectFrom('tenancy_reviews')
    .select('id')
    .where('tenancy_id', '=', data.tenancy_id)
    .executeTakeFirst();

  if (existingReview) {
    throw new ConflictError('A review has already been submitted for this tenancy agreement');
  }

  // 4. Insert review
  const inserted = await db
    .insertInto('tenancy_reviews')
    .values({
      tenancy_id: data.tenancy_id,
      property_id: propertyId,
      author_id: userId,
      rating: data.rating,
      cleanliness_rating: data.cleanliness_rating ?? null,
      communication_rating: data.communication_rating ?? null,
      review_text: data.review_text?.trim() || null,
      amenities_feedback: data.amenities_feedback?.trim() || null,
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  // 5. Fetch author profile to format response
  const author = await db
    .selectFrom('users')
    .select(['id', 'name', 'avatar_url'])
    .where('id', '=', userId)
    .executeTakeFirst();

  return {
    id: inserted.id,
    tenancyId: inserted.tenancy_id,
    propertyId: inserted.property_id,
    authorId: inserted.author_id,
    authorName: author?.name ?? 'Verified Tenant',
    authorAvatarUrl: author?.avatar_url ?? null,
    rating: inserted.rating,
    cleanlinessRating: inserted.cleanliness_rating,
    communicationRating: inserted.communication_rating,
    reviewText: inserted.review_text,
    amenitiesFeedback: inserted.amenities_feedback,
    createdAt: inserted.created_at,
  };
}

/**
 * Retrieves paginated reviews and summary metrics for a property.
 */
export async function getPropertyReviews(
  db: Kysely<Database>,
  propertyId: string,
  limit: number = 10,
  offset: number = 0
): Promise<PropertyReviewsResult> {
  const property = await db
    .selectFrom('properties')
    .select('id')
    .where('id', '=', propertyId)
    .executeTakeFirst();

  if (!property) {
    throw new NotFoundError('Property not found');
  }

  // Fetch paginated reviews with author info
  const rawReviews = await db
    .selectFrom('tenancy_reviews as tr')
    .innerJoin('users as u', 'u.id', 'tr.author_id')
    .select([
      'tr.id',
      'tr.tenancy_id',
      'tr.property_id',
      'tr.author_id',
      'tr.rating',
      'tr.cleanliness_rating',
      'tr.communication_rating',
      'tr.review_text',
      'tr.amenities_feedback',
      'tr.created_at',
      'u.name as author_name',
      'u.avatar_url as author_avatar_url',
    ])
    .where('tr.property_id', '=', propertyId)
    .orderBy('tr.created_at', 'desc')
    .limit(limit)
    .offset(offset)
    .execute();

  // Aggregate stats
  const stats = await db
    .selectFrom('tenancy_reviews')
    .select([
      sql<number>`ROUND(AVG(rating)::numeric, 1)`.as('avg_rating'),
      sql<number>`ROUND(AVG(cleanliness_rating)::numeric, 1)`.as('avg_cleanliness'),
      sql<number>`ROUND(AVG(communication_rating)::numeric, 1)`.as('avg_communication'),
      sql<number>`COUNT(id)`.as('total_count'),
    ])
    .where('property_id', '=', propertyId)
    .executeTakeFirst();

  // Rating distribution counts
  const distributionRows = await db
    .selectFrom('tenancy_reviews')
    .select([
      'rating',
      sql<number>`COUNT(id)`.as('count'),
    ])
    .where('property_id', '=', propertyId)
    .groupBy('rating')
    .execute();

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of distributionRows) {
    distribution[row.rating] = Number(row.count);
  }

  const reviews: FormattedReview[] = rawReviews.map((r) => ({
    id: r.id,
    tenancyId: r.tenancy_id,
    propertyId: r.property_id,
    authorId: r.author_id,
    authorName: r.author_name,
    authorAvatarUrl: r.author_avatar_url,
    rating: r.rating,
    cleanlinessRating: r.cleanliness_rating,
    communicationRating: r.communication_rating,
    reviewText: r.review_text,
    amenitiesFeedback: r.amenities_feedback,
    createdAt: r.created_at,
  }));

  return {
    reviews,
    summary: {
      averageRating: stats?.avg_rating ? Number(stats.avg_rating) : null,
      cleanlinessAverage: stats?.avg_cleanliness ? Number(stats.avg_cleanliness) : null,
      communicationAverage: stats?.avg_communication ? Number(stats.avg_communication) : null,
      totalReviews: Number(stats?.total_count ?? 0),
      distribution,
    },
  };
}

/**
 * Checks if a tenant is eligible to review a specific tenancy.
 */
export async function checkTenancyReviewEligibility(
  db: Kysely<Database>,
  tenancyId: string,
  userId: string
): Promise<{ canReview: boolean; alreadyReviewed: boolean; review?: FormattedReview }> {
  const tenancy = await db
    .selectFrom('tenancies')
    .selectAll()
    .where('id', '=', tenancyId)
    .executeTakeFirst();

  if (!tenancy) {
    throw new NotFoundError('Tenancy not found');
  }

  if (tenancy.tenant_id !== userId) {
    return { canReview: false, alreadyReviewed: false };
  }

  const existing = await db
    .selectFrom('tenancy_reviews as tr')
    .innerJoin('users as u', 'u.id', 'tr.author_id')
    .select([
      'tr.id',
      'tr.tenancy_id',
      'tr.property_id',
      'tr.author_id',
      'tr.rating',
      'tr.cleanliness_rating',
      'tr.communication_rating',
      'tr.review_text',
      'tr.amenities_feedback',
      'tr.created_at',
      'u.name as author_name',
      'u.avatar_url as author_avatar_url',
    ])
    .where('tr.tenancy_id', '=', tenancyId)
    .executeTakeFirst();

  if (existing) {
    return {
      canReview: false,
      alreadyReviewed: true,
      review: {
        id: existing.id,
        tenancyId: existing.tenancy_id,
        propertyId: existing.property_id,
        authorId: existing.author_id,
        authorName: existing.author_name,
        authorAvatarUrl: existing.author_avatar_url,
        rating: existing.rating,
        cleanlinessRating: existing.cleanliness_rating,
        communicationRating: existing.communication_rating,
        reviewText: existing.review_text,
        amenitiesFeedback: existing.amenities_feedback,
        createdAt: existing.created_at,
      },
    };
  }

  const isEligibleStatus = ['active', 'completed'].includes(tenancy.status);
  return {
    canReview: isEligibleStatus,
    alreadyReviewed: false,
  };
}
