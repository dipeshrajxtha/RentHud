/**
 * RentHub Landlord Domain Type Definitions
 * Complete alignment with Kysely DB schema & backend API responses.
 */

export type UnitAvailabilityStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'PENDING_SIGNATURE'
  | 'ON_RENT'
  | 'UNAVAILABLE';

export type TenancyStatus =
  | 'rental_requested'
  | 'application_rejected'
  | 'application_cancelled'
  | 'pending_signature'
  | 'active'
  | 'completed'
  | 'terminated_early';

export type RentalRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type TenancyDisputeStatus =
  | 'OPEN'
  | 'IN_MEDIATION'
  | 'RESOLVED_MUTUAL'
  | 'RESOLVED_ARBITRATED'
  | 'ESCALATED';

export interface LandlordPhoto {
  id: string;
  url: string;
  caption?: string | null;
  isCover: boolean;
  displayOrder?: number;
}

export interface LandlordAmenity {
  id: string;
  name: string;
  slug: string;
  category: string;
  icon?: string | null;
}

export interface LandlordUnit {
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
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface LandlordProperty {
  id: string;
  landlordId: string;
  title: string;
  description: string | null;
  address: string;
  city: string;
  postalCode: string | null;
  location: {
    latitude: number;
    longitude: number;
  };
  totalFloors: number;
  isActive: boolean;
  unitsCount: number;
  availableUnitsCount: number;
  units: LandlordUnit[];
  coverPhotoUrl: string | null;
  photos: LandlordPhoto[];
  amenities?: LandlordAmenity[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface LandlordApplication {
  id: string;
  unitId: string;
  tenantId: string;
  landlordId: string;
  status: RentalRequestStatus;
  message: string | null;
  proposedMoveIn: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  unit: {
    id: string;
    unitIdentifier: string;
    floorNumber: number;
    bedrooms: number;
    bathrooms: number;
    monthlyRent: number;
    securityDeposit: number;
    availabilityStatus: string;
  };
  property: {
    id: string;
    title: string;
    address: string;
    city: string;
  };
  tenant: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    phone: string | null;
  };
}

export interface LandlordLease {
  id: string;
  unitId: string;
  tenantId: string;
  landlordId: string;
  rentalRequestId: string | null;
  status: TenancyStatus;
  startDate: string | Date;
  endDate: string | Date;
  agreedMonthlyRent: number;
  agreedDeposit: number;
  tenantSignedAt: string | Date | null;
  landlordSignedAt: string | Date | null;
  signedAt: string | Date | null;
  terminatedAt: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  // Extended fields resolved via join / lookups
  unitIdentifier?: string;
  propertyTitle?: string;
  propertyAddress?: string;
  tenantName?: string;
  tenantEmail?: string;
  tenantPhone?: string | null;
}

export interface LandlordDispute {
  id: string;
  tenancyId: string;
  raisedById: string;
  category: string;
  title: string;
  description: string;
  claimAmount: number;
  evidenceUrls: string[];
  status: TenancyDisputeStatus;
  resolutionSummary?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  propertyTitle?: string;
  unitIdentifier?: string;
}

export interface LandlordMaintenanceTicket {
  id: string;
  tenancyId: string;
  propertyTitle: string;
  unitIdentifier: string;
  category: 'Plumbing' | 'Electrical' | 'HVAC' | 'Appliances' | 'Carpentry & Locks' | 'Structural';
  urgency: 'Emergency' | 'High' | 'Normal' | 'Low';
  title: string;
  description: string;
  status: 'Reported' | 'Scheduled' | 'In Progress' | 'Resolved';
  reportedBy: string;
  assignedContractor?: string;
  scheduledDate?: string;
  landlordNotes?: string;
  photos?: string[];
  createdAt: string;
}

export interface LandlordProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  phone: string | null;
  roles: string[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreatePropertyDto {
  title: string;
  description?: string;
  address: string;
  city: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
  totalFloors?: number;
}

export interface UpdatePropertyDto {
  title?: string;
  description?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  totalFloors?: number;
  isActive?: boolean;
}

export interface CreateUnitDto {
  unitIdentifier: string;
  floorNumber?: number;
  bedrooms?: number;
  bathrooms?: number;
  areaSqft?: number;
  monthlyRent: number;
  securityDeposit?: number;
  availabilityStatus?: UnitAvailabilityStatus;
}

export interface UpdateUnitDto {
  unitIdentifier?: string;
  floorNumber?: number;
  bedrooms?: number;
  bathrooms?: number;
  areaSqft?: number;
  monthlyRent?: number;
  securityDeposit?: number;
  availabilityStatus?: UnitAvailabilityStatus;
}
