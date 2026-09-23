/**
 * RentHub Core Database Type Definitions
 * Kysely Schema Contract — Day 3 Core Schema
 *
 * Covers all 15 core domain tables:
 *   users, properties, property_units, rental_requests, tenancies,
 *   tenancy_disputes, early_termination_records, tenancy_reviews,
 *   listing_disputes, amenities, property_amenities, unit_amenities,
 *   photos, verification_badges, verifications
 *
 * GIS NOTE: The `properties.location` column is stored as PostGIS
 * GEOGRAPHY(Point, 4326). The PostgreSQL driver returns raw WKB hex
 * strings on read. Never consume the raw WKB value directly.
 * Use the helpers in src/common/gis.ts for spatial queries:
 *   - stMakePointGeography(lng, lat)  → INSERT / WHERE expressions
 *   - sql`ST_AsGeoJSON(location)`     → JSON {type,coordinates} output
 *   - sql`ST_X(location::geometry)`   → longitude extract
 *   - sql`ST_Y(location::geometry)`   → latitude extract
 *
 * ROLE NOTE: Users.roles is a TEXT[] constrained at the DB level to
 * ('tenant', 'landlord', 'admin'). Admin status is derived from
 * the presence of 'admin' in the roles array, never a separate flag.
 *
 * REVIEW AUTHORSHIP NOTE: tenancy_reviews.author_id must equal
 * tenancies.tenant_id for the referenced tenancy — enforced at the
 * application service layer, not at the DB constraint level.
 */

import type { ColumnType, Generated, Insertable, Selectable, Updateable } from 'kysely';

// ─────────────────────────────────────────────────────────────────────────────
// Enum literals (mirroring DB CHECK constraints)
// ─────────────────────────────────────────────────────────────────────────────
export type UserRole = 'tenant' | 'landlord' | 'admin';

export type UnitAvailabilityStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'PENDING_SIGNATURE'
  | 'ON_RENT'
  | 'UNAVAILABLE';

export type RentalRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type TenancyStatus =
  | 'rental_requested'
  | 'application_rejected'
  | 'application_cancelled'
  | 'pending_signature'
  | 'active'
  | 'completed'
  | 'terminated_early';

export type TenancyDisputeStatus =
  | 'OPEN'
  | 'IN_MEDIATION'
  | 'RESOLVED_MUTUAL'
  | 'RESOLVED_ARBITRATED'
  | 'ESCALATED';

export type ListingDisputeStatus =
  | 'OPEN'
  | 'UNDER_INVESTIGATION'
  | 'RESOLVED_DELISTED'
  | 'RESOLVED_DISMISSED';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type AmenityCategory = 'building' | 'unit' | 'general';

// ─────────────────────────────────────────────────────────────────────────────
// TABLE: users
// ─────────────────────────────────────────────────────────────────────────────
export interface UsersTable {
  id: Generated<string>;
  google_id: string | null;
  email: string;
  name: string;
  avatar_url: string | null;
  phone: string | null;
  /** TEXT[] — CHECK (roles <@ ARRAY['tenant','landlord','admin']) */
  roles: string[];
  is_active: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type UserUpdate = Updateable<UsersTable>;

// ─────────────────────────────────────────────────────────────────────────────
// TABLE: properties
// ─────────────────────────────────────────────────────────────────────────────
export interface PropertiesTable {
  id: Generated<string>;
  landlord_id: string;
  title: string;
  description: string | null;
  address: string;
  city: string;
  postal_code: string | null;
  /**
   * GEOGRAPHY(Point, 4326) — PostGIS spatial column.
   * SELECT returns raw WKB hex string from the PG driver.
   * INSERT accepts WKT string. Use sql template helpers from gis.ts.
   * ColumnType<Select, Insert, Update>
   */
  location: ColumnType<string, string, string>;
  total_floors: Generated<number>;
  is_active: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type Property = Selectable<PropertiesTable>;
export type NewProperty = Insertable<PropertiesTable>;
export type PropertyUpdate = Updateable<PropertiesTable>;

// ─────────────────────────────────────────────────────────────────────────────
// TABLE: property_units
// ─────────────────────────────────────────────────────────────────────────────
export interface PropertyUnitsTable {
  id: Generated<string>;
  property_id: string;
  unit_identifier: string;
  floor_number: Generated<number>;
  bedrooms: Generated<number>;
  bathrooms: Generated<number>;
  area_sqft: number | null;
  monthly_rent: number;
  security_deposit: Generated<number>;
  availability_status: Generated<UnitAvailabilityStatus>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type PropertyUnit = Selectable<PropertyUnitsTable>;
export type NewPropertyUnit = Insertable<PropertyUnitsTable>;
export type PropertyUnitUpdate = Updateable<PropertyUnitsTable>;

// ─────────────────────────────────────────────────────────────────────────────
// TABLE: rental_requests
// ─────────────────────────────────────────────────────────────────────────────
export interface RentalRequestsTable {
  id: Generated<string>;
  unit_id: string;
  tenant_id: string;
  landlord_id: string;
  status: Generated<RentalRequestStatus>;
  message: string | null;
  proposed_move_in: Date;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type RentalRequest = Selectable<RentalRequestsTable>;
export type NewRentalRequest = Insertable<RentalRequestsTable>;
export type RentalRequestUpdate = Updateable<RentalRequestsTable>;

// ─────────────────────────────────────────────────────────────────────────────
// TABLE: tenancies
// ─────────────────────────────────────────────────────────────────────────────
export interface TenanciesTable {
  id: Generated<string>;
  unit_id: string;
  tenant_id: string;
  landlord_id: string;
  rental_request_id: string | null;
  status: Generated<TenancyStatus>;
  start_date: Date;
  end_date: Date;
  agreed_monthly_rent: number;
  agreed_deposit: Generated<number>;
  /** Set when the tenant calls POST /leases/:id/sign. */
  tenant_signed_at: Date | null;
  /** Set when the landlord calls POST /leases/:id/sign. */
  landlord_signed_at: Date | null;
  /** Sealed timestamp — written only when both parties have signed. */
  signed_at: Date | null;
  terminated_at: Date | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type Tenancy = Selectable<TenanciesTable>;
export type NewTenancy = Insertable<TenanciesTable>;
export type TenancyUpdate = Updateable<TenanciesTable>;

// ─────────────────────────────────────────────────────────────────────────────
// TABLE: tenancy_disputes
// ─────────────────────────────────────────────────────────────────────────────
export interface TenancyDisputesTable {
  id: Generated<string>;
  tenancy_id: string;
  raised_by_id: string;
  category: string;
  title: string;
  description: string;
  claim_amount: Generated<number>;
  /** TEXT[] */
  evidence_urls: Generated<string[]>;
  status: Generated<TenancyDisputeStatus>;
  resolution_summary: string | null;
  resolved_by: string | null;
  resolved_at: Date | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type TenancyDispute = Selectable<TenancyDisputesTable>;
export type NewTenancyDispute = Insertable<TenancyDisputesTable>;
export type TenancyDisputeUpdate = Updateable<TenancyDisputesTable>;

// ─────────────────────────────────────────────────────────────────────────────
// TABLE: early_termination_records
// ─────────────────────────────────────────────────────────────────────────────
export interface EarlyTerminationRecordsTable {
  id: Generated<string>;
  tenancy_id: string;
  initiator_id: string;
  reason_code: string;
  narrative: string;
  /** FK → tenancy_disputes(id) ON DELETE SET NULL */
  dispute_id: string | null;
  created_at: Generated<Date>;
}

export type EarlyTerminationRecord = Selectable<EarlyTerminationRecordsTable>;
export type NewEarlyTerminationRecord = Insertable<EarlyTerminationRecordsTable>;

// ─────────────────────────────────────────────────────────────────────────────
// TABLE: tenancy_reviews
// ─────────────────────────────────────────────────────────────────────────────
export interface TenancyReviewsTable {
  id: Generated<string>;
  tenancy_id: string;
  property_id: string;
  /**
   * author_id MUST equal the tenant_id of the referenced tenancy.
   * Enforced at the application service layer.
   */
  author_id: string;
  rating: number;
  cleanliness_rating: number | null;
  communication_rating: number | null;
  review_text: string | null;
  amenities_feedback: string | null;
  created_at: Generated<Date>;
}

export type TenancyReview = Selectable<TenancyReviewsTable>;
export type NewTenancyReview = Insertable<TenancyReviewsTable>;

// ─────────────────────────────────────────────────────────────────────────────
// TABLE: listing_disputes
// ─────────────────────────────────────────────────────────────────────────────
export interface ListingDisputesTable {
  id: Generated<string>;
  property_id: string;
  reporter_id: string;
  reason: string;
  description: string;
  /** TEXT[] */
  evidence_urls: Generated<string[]>;
  status: Generated<ListingDisputeStatus>;
  admin_notes: string | null;
  resolved_by: string | null;
  resolved_at: Date | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type ListingDispute = Selectable<ListingDisputesTable>;
export type NewListingDispute = Insertable<ListingDisputesTable>;
export type ListingDisputeUpdate = Updateable<ListingDisputesTable>;

// ─────────────────────────────────────────────────────────────────────────────
// TABLE: amenities
// ─────────────────────────────────────────────────────────────────────────────
export interface AmenitiesTable {
  id: Generated<string>;
  name: string;
  slug: string;
  category: Generated<AmenityCategory>;
  icon: string | null;
  created_at: Generated<Date>;
}

export type Amenity = Selectable<AmenitiesTable>;
export type NewAmenity = Insertable<AmenitiesTable>;

// ─────────────────────────────────────────────────────────────────────────────
// TABLE: property_amenities (junction)
// ─────────────────────────────────────────────────────────────────────────────
export interface PropertyAmenitiesTable {
  property_id: string;
  amenity_id: string;
}

export type PropertyAmenity = Selectable<PropertyAmenitiesTable>;
export type NewPropertyAmenity = Insertable<PropertyAmenitiesTable>;

// ─────────────────────────────────────────────────────────────────────────────
// TABLE: unit_amenities (junction)
// ─────────────────────────────────────────────────────────────────────────────
export interface UnitAmenitiesTable {
  unit_id: string;
  amenity_id: string;
}

export type UnitAmenity = Selectable<UnitAmenitiesTable>;
export type NewUnitAmenity = Insertable<UnitAmenitiesTable>;

// ─────────────────────────────────────────────────────────────────────────────
// TABLE: photos
// ─────────────────────────────────────────────────────────────────────────────
export interface PhotosTable {
  id: Generated<string>;
  /**
   * Exactly one of property_id / unit_id is NOT NULL (mutual-exclusion CHECK).
   * Property-level: property_id IS NOT NULL, unit_id IS NULL
   * Unit-level:     unit_id IS NOT NULL, property_id IS NULL
   */
  property_id: string | null;
  unit_id: string | null;
  uploaded_by: string;
  url: string;
  caption: string | null;
  is_cover: Generated<boolean>;
  display_order: Generated<number>;
  created_at: Generated<Date>;
}

export type Photo = Selectable<PhotosTable>;
export type NewPhoto = Insertable<PhotosTable>;
export type PhotoUpdate = Updateable<PhotosTable>;

// ─────────────────────────────────────────────────────────────────────────────
// TABLE: verification_badges
// ─────────────────────────────────────────────────────────────────────────────
export interface VerificationBadgesTable {
  id: Generated<string>;
  code: string;
  name: string;
  description: string | null;
  created_at: Generated<Date>;
}

export type VerificationBadge = Selectable<VerificationBadgesTable>;
export type NewVerificationBadge = Insertable<VerificationBadgesTable>;

// ─────────────────────────────────────────────────────────────────────────────
// TABLE: verifications
// ─────────────────────────────────────────────────────────────────────────────
export interface VerificationsTable {
  id: Generated<string>;
  /**
   * Exactly one of user_id / property_id is NOT NULL (mutual-exclusion CHECK).
   * User verification (KYC/landlord identity):  user_id IS NOT NULL, property_id IS NULL
   * Property verification (ownership/inspection): property_id IS NOT NULL, user_id IS NULL
   */
  user_id: string | null;
  property_id: string | null;
  badge_id: string;
  status: Generated<VerificationStatus>;
  document_url: string | null;
  /** Admin who performed the verification — SET NULL on admin account removal */
  verified_by: string | null;
  verified_at: Date | null;
  rejection_reason: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type Verification = Selectable<VerificationsTable>;
export type NewVerification = Insertable<VerificationsTable>;
export type VerificationUpdate = Updateable<VerificationsTable>;

// ─────────────────────────────────────────────────────────────────────────────
// Composite Database interface — maps table names to Kysely table types
// ─────────────────────────────────────────────────────────────────────────────
export interface Database {
  users: UsersTable;
  properties: PropertiesTable;
  property_units: PropertyUnitsTable;
  rental_requests: RentalRequestsTable;
  tenancies: TenanciesTable;
  tenancy_disputes: TenancyDisputesTable;
  early_termination_records: EarlyTerminationRecordsTable;
  tenancy_reviews: TenancyReviewsTable;
  listing_disputes: ListingDisputesTable;
  amenities: AmenitiesTable;
  property_amenities: PropertyAmenitiesTable;
  unit_amenities: UnitAmenitiesTable;
  photos: PhotosTable;
  verification_badges: VerificationBadgesTable;
  verifications: VerificationsTable;
}
