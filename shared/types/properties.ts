import type { UnitAvailabilityStatus } from '../../server/src/types/database.js';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface PublicLandlordSummary {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface PublicAmenity {
  id: string;
  name: string;
  slug: string;
  category: 'building' | 'unit' | 'general';
  icon: string | null;
}

export interface PublicPhoto {
  id: string;
  url: string;
  caption: string | null;
  isCover: boolean;
  displayOrder: number;
  unitId?: string | null;
  propertyId?: string | null;
}

export interface PublicVerificationBadge {
  code: string;
  name: string;
  description: string | null;
}

export interface PublicUnitSummary {
  id: string;
  propertyId: string;
  unitIdentifier: string;
  floorNumber: number;
  bedrooms: number;
  bathrooms: number;
  areaSqft: number | null;
  monthlyRent: number;
  securityDeposit: number;
  availabilityStatus: UnitAvailabilityStatus;
  amenities: PublicAmenity[];
  photos: PublicPhoto[];
}

export interface PublicPropertySummary {
  id: string;
  title: string;
  description: string | null;
  address: string;
  city: string;
  postalCode: string | null;
  location: LocationCoordinates;
  totalFloors: number;
  distanceMeters?: number;
  landlord: PublicLandlordSummary;
  availableUnitsCount: number;
  minMonthlyRent: number | null;
  maxMonthlyRent: number | null;
  coverPhotoUrl: string | null;
  amenities: PublicAmenity[];
  units: PublicUnitSummary[];
}

export interface PublicPropertyDetail extends PublicPropertySummary {
  photos: PublicPhoto[];
  verificationBadges: PublicVerificationBadge[];
  reviewsSummary: {
    averageRating: number | null;
    totalReviews: number;
  };
}

export interface SpatialSearchMetadata {
  queryRadiusMeters?: number;
  stepLevel?: number;
  maxRadiusReached?: boolean;
  totalAvailableUnits?: number;
}

export interface PropertySearchResponse {
  properties: PublicPropertySummary[];
  totalProperties: number;
  spatial?: SpatialSearchMetadata;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
}
