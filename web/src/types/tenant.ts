import type { UnitAvailabilityStatus, TenancyStatus, RentalRequestStatus, TenancyDisputeStatus } from '../../../server/src/types/database.js';

export interface TenantPreferences {
  housingType: string;
  budgetBracket: string;
  moveInTimeline: string;
  householdSize: string;
  priorityAmenities: string[];
  preferredCity?: string;
  completedAt?: string;
}

export interface UnitDetail {
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
  amenities: { id: string; name: string; slug: string; category: string; icon?: string }[];
  photos: { id: string; url: string; caption?: string; isCover: boolean }[];
}

export interface PropertyListing {
  id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  postalCode?: string;
  location: { latitude: number; longitude: number };
  totalFloors: number;
  landlord: {
    id: string;
    name: string;
    avatarUrl: string | null;
    phone?: string;
    isVerified?: boolean;
    rating?: number;
    responseTime?: string;
  };
  availableUnitsCount: number;
  minMonthlyRent: number;
  maxMonthlyRent: number;
  coverPhotoUrl: string;
  photos: { id: string; url: string; caption?: string; isCover: boolean }[];
  amenities: { id: string; name: string; slug: string; category: string; icon?: string }[];
  units: UnitDetail[];
  verificationBadges: { code: string; name: string; description: string }[];
  reviewsSummary: { averageRating: number; totalReviews: number };
}

export interface RentalApplication {
  id: string;
  unitId: string;
  propertyId: string;
  tenantId: string;
  landlordId: string;
  status: RentalRequestStatus;
  message: string;
  proposedMoveIn: string;
  createdAt: string;
  updatedAt: string;
  unit: {
    id: string;
    unitIdentifier: string;
    floorNumber: number;
    bedrooms: number;
    bathrooms: number;
    monthlyRent: number;
    securityDeposit: number;
  };
  property: {
    id: string;
    title: string;
    address: string;
    city: string;
    coverPhotoUrl?: string;
  };
  landlord: {
    id: string;
    name: string;
    avatarUrl: string | null;
    phone?: string;
  };
}

export interface LeaseAgreement {
  id: string;
  unitId: string;
  propertyId: string;
  tenantId: string;
  landlordId: string;
  rentalRequestId?: string;
  status: TenancyStatus;
  startDate: string;
  endDate: string;
  agreedMonthlyRent: number;
  agreedDeposit: number;
  tenantSignedAt: string | null;
  landlordSignedAt: string | null;
  signedAt: string | null;
  terminatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  propertyTitle: string;
  propertyAddress: string;
  propertyCity: string;
  unitIdentifier: string;
  landlordName: string;
  landlordPhone?: string;
  tenantName: string;
}

export interface PaymentRecord {
  id: string;
  tenancyId: string;
  invoiceNumber: string;
  billingMonth: string;
  dueDate: string;
  paidDate: string | null;
  amount: number;
  type: 'RENT' | 'SECURITY_DEPOSIT' | 'UTILITY';
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  paymentMethod?: 'eSewa' | 'Khalti' | 'ConnectIPS' | 'Card' | 'Bank Transfer';
  transactionId?: string;
}

export interface MaintenanceRequest {
  id: string;
  tenancyId: string;
  unitIdentifier: string;
  propertyTitle: string;
  category: 'Plumbing' | 'Electrical' | 'HVAC' | 'Appliances' | 'Carpentry & Locks' | 'Structural';
  urgency: 'Emergency' | 'High' | 'Medium' | 'Low';
  title: string;
  description: string;
  status: 'REPORTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';
  preferredTimeWindow?: string;
  createdAt: string;
  scheduledDate?: string;
  resolvedAt?: string;
  technicianNotes?: string;
  images?: string[];
}

export interface TenancyDispute {
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
  resolvedAt?: string | null;
  createdAt: string;
  propertyTitle?: string;
  unitIdentifier?: string;
}

export interface SearchFilters {
  searchQuery: string;
  city: string;
  minRent: number;
  maxRent: number;
  bedrooms: number | 'all';
  bathrooms: number | 'all';
  amenities: string[];
  sortBy: 'recommended' | 'rent_asc' | 'rent_desc' | 'newest';
  verifiedOnly: boolean;
}
