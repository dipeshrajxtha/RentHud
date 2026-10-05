import type {
  RentalRequestStatus,
  TenancyStatus,
} from '../../server/src/types/database.js';

export type { TenancyStatus, RentalRequestStatus };

export interface CreateRentalRequestBody {
  unitId: string;
  proposedMoveIn: string;
  message?: string;
}

export interface PublicRentalRequestSummary {
  id: string;
  unitId: string;
  tenantId: string;
  landlordId: string;
  status: RentalRequestStatus;
  message: string | null;
  proposedMoveIn: string;
  createdAt: Date;
  updatedAt: Date;
  unit?: {
    id: string;
    unitIdentifier: string;
    floorNumber: number;
    bedrooms: number;
    bathrooms: number;
    monthlyRent: number;
    securityDeposit: number;
    availabilityStatus: string;
    areaSqft?: number | null;
  };
  property?: {
    id: string;
    title: string;
    address: string;
    city: string;
    postalCode?: string | null;
  };
  tenant?: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    phone: string | null;
    createdAt?: Date | string;
    isVerified?: boolean;
    verificationStatus?: string;
  };
  landlord?: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    phone: string | null;
  };
}

export interface PublicTenancySummary {
  id: string;
  unitId: string;
  tenantId: string;
  landlordId: string;
  rentalRequestId: string | null;
  status: TenancyStatus;
  startDate: string;
  endDate: string;
  agreedMonthlyRent: number;
  agreedDeposit: number;
  tenantSignedAt: Date | null;
  landlordSignedAt: Date | null;
  signedAt: Date | null;
  terminatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Extended lease party & unit properties
  unitIdentifier?: string;
  propertyId?: string;
  propertyTitle?: string;
  propertyAddress?: string;
  propertyCity?: string;
  tenantName?: string;
  tenantEmail?: string;
  tenantPhone?: string | null;
  landlordName?: string;
  landlordEmail?: string;
  landlordPhone?: string | null;
}

