/**
 * RentHub Landlord Service
 *
 * Communicates with the RentHub Express backend API.
 * Rules:
 *  - Real application data lives in PostgreSQL, not localStorage (Rule 5).
 *  - All endpoints use the active JWT access token.
 *  - Standardized error handling and typed responses.
 */

import type {
  LandlordProperty,
  LandlordUnit,
  LandlordApplication,
  LandlordLease,
  LandlordDispute,
  LandlordProfile,
  CreatePropertyDto,
  UpdatePropertyDto,
  CreateUnitDto,
  UpdateUnitDto,
} from '@/types/landlord';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code?: string;
    message: string;
    details?: unknown;
  };
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(path, {
    ...options,
    headers,
    credentials: 'include',
  });

  const json: ApiResponse<T> = await response.json().catch(() => ({
    success: false,
    data: null as any,
    error: { message: `Request failed with HTTP status ${response.status}` },
  }));

  if (!response.ok || !json.success) {
    const errorMsg = json.error?.message || `Request failed (${response.status})`;
    throw new Error(errorMsg);
  }

  return json.data;
}

export const landlordService = {
  // ── Properties ─────────────────────────────────────────────────────────────
  async getMyProperties(token: string): Promise<LandlordProperty[]> {
    return request<LandlordProperty[]>('/api/properties/mine', { method: 'GET' }, token);
  },

  async createProperty(dto: CreatePropertyDto, token: string): Promise<LandlordProperty> {
    return request<LandlordProperty>(
      '/api/properties',
      {
        method: 'POST',
        body: JSON.stringify(dto),
      },
      token
    );
  },

  async updateProperty(
    propertyId: string,
    dto: UpdatePropertyDto,
    token: string
  ): Promise<LandlordProperty> {
    return request<LandlordProperty>(
      `/api/properties/${propertyId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(dto),
      },
      token
    );
  },

  async deleteProperty(propertyId: string, token: string): Promise<{ id: string }> {
    return request<{ id: string }>(
      `/api/properties/${propertyId}`,
      { method: 'DELETE' },
      token
    );
  },

  // ── Units ──────────────────────────────────────────────────────────────────
  async createUnit(
    propertyId: string,
    dto: CreateUnitDto,
    token: string
  ): Promise<LandlordUnit> {
    return request<LandlordUnit>(
      `/api/properties/${propertyId}/units`,
      {
        method: 'POST',
        body: JSON.stringify(dto),
      },
      token
    );
  },

  async updateUnit(
    propertyId: string,
    unitId: string,
    dto: UpdateUnitDto,
    token: string
  ): Promise<LandlordUnit> {
    return request<LandlordUnit>(
      `/api/properties/${propertyId}/units/${unitId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(dto),
      },
      token
    );
  },

  async deleteUnit(
    propertyId: string,
    unitId: string,
    token: string
  ): Promise<{ id: string }> {
    return request<{ id: string }>(
      `/api/properties/${propertyId}/units/${unitId}`,
      { method: 'DELETE' },
      token
    );
  },

  // ── Applications (Rental Requests) ─────────────────────────────────────────
  async getApplications(token: string): Promise<LandlordApplication[]> {
    const res = await request<{ requests: LandlordApplication[]; total: number }>(
      '/api/tenancy/requests',
      { method: 'GET' },
      token
    );
    return res.requests ?? [];
  },

  async getApplicationById(id: string, token: string): Promise<LandlordApplication> {
    return request<LandlordApplication>(`/api/tenancy/requests/${id}`, { method: 'GET' }, token);
  },

  async approveApplication(
    id: string,
    token: string
  ): Promise<{ application: LandlordApplication; tenancy: LandlordLease }> {
    return request<{ application: LandlordApplication; tenancy: LandlordLease }>(
      `/api/tenancy/requests/${id}/approve`,
      { method: 'POST' },
      token
    );
  },

  async rejectApplication(
    id: string,
    token: string
  ): Promise<LandlordApplication> {
    return request<LandlordApplication>(
      `/api/tenancy/requests/${id}/reject`,
      { method: 'POST' },
      token
    );
  },

  // ── Leases & Agreements ───────────────────────────────────────────────────
  async getLeases(token: string): Promise<LandlordLease[]> {
    const res = await request<{ leases: LandlordLease[]; total: number }>(
      '/api/tenancy/leases',
      { method: 'GET' },
      token
    );
    return res.leases ?? [];
  },

  async getLeaseById(id: string, token: string): Promise<LandlordLease> {
    return request<LandlordLease>(`/api/tenancy/leases/${id}`, { method: 'GET' }, token);
  },

  async signLease(id: string, token: string): Promise<LandlordLease> {
    return request<LandlordLease>(
      `/api/tenancy/leases/${id}/sign`,
      { method: 'POST' },
      token
    );
  },

  async terminateLease(
    id: string,
    reasonCode: string,
    narrative: string,
    token: string
  ): Promise<LandlordLease> {
    return request<LandlordLease>(
      `/api/tenancy/leases/${id}/terminate`,
      {
        method: 'POST',
        body: JSON.stringify({ reasonCode, narrative }),
      },
      token
    );
  },

  // ── Disputes ───────────────────────────────────────────────────────────────
  async getDisputes(token: string): Promise<LandlordDispute[]> {
    const res = await request<{ disputes: LandlordDispute[]; total: number }>(
      '/api/tenancy/disputes',
      { method: 'GET' },
      token
    );
    return res.disputes ?? [];
  },

  async createDispute(
    data: {
      tenancyId: string;
      category: string;
      title: string;
      description: string;
      claimAmount?: number;
      evidenceUrls?: string[];
    },
    token: string
  ): Promise<LandlordDispute> {
    return request<LandlordDispute>(
      '/api/tenancy/disputes',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      token
    );
  },

  // ── Landlord Profile & KYC ─────────────────────────────────────────────────
  async getProfile(token: string): Promise<LandlordProfile> {
    return request<LandlordProfile>('/api/landlords/me', { method: 'GET' }, token);
  },

  async updateProfile(
    data: { name?: string; phone?: string; avatarUrl?: string },
    token: string
  ): Promise<LandlordProfile> {
    return request<LandlordProfile>(
      '/api/landlords/me',
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
      token
    );
  },
};
