import type {
  RentalRequestStatus,
  TenancyStatus,
} from '../../server/src/types/database.js';

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
  };
  property?: {
    id: string;
    title: string;
    address: string;
    city: string;
  };
  tenant?: {
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
  signedAt: Date | null;
  terminatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
