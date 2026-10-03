import type {
  PropertyListing,
  RentalApplication,
  LeaseAgreement,
  PaymentRecord,
  MaintenanceRequest,
  TenancyDispute,
  SearchFilters,
  TenantPreferences,
} from '@/types/tenant';
import {
  INITIAL_PROPERTIES,
  INITIAL_SAVED_PROPERTY_IDS,
  INITIAL_APPLICATIONS,
  INITIAL_ACTIVE_LEASE,
  INITIAL_PAYMENTS,
  INITIAL_MAINTENANCE,
  INITIAL_DISPUTES,
} from './tenantMockData';
import { matchesLocationSynonym } from './utils/locationResolver';

const STORAGE_KEYS = {
  PREFERENCES: 'rh_tenant_preferences',
  SAVED_IDS: 'rh_saved_property_ids',
  APPLICATIONS: 'rh_rental_applications',
  LEASES: 'rh_leases',
  PAYMENTS: 'rh_payments',
  MAINTENANCE: 'rh_maintenance_tickets',
  DISPUTES: 'rh_disputes',
};

function getStoredJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setStoredJson<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const tenantService = {
  // ── Preferences ────────────────────────────────────────────────────────
  getPreferences(): TenantPreferences | null {
    return getStoredJson<TenantPreferences | null>(STORAGE_KEYS.PREFERENCES, null);
  },

  savePreferences(prefs: TenantPreferences): void {
    setStoredJson(STORAGE_KEYS.PREFERENCES, prefs);
  },

  // ── Properties Discovery ───────────────────────────────────────────────
  async getProperties(filters?: Partial<SearchFilters>): Promise<PropertyListing[]> {
    let list = [...INITIAL_PROPERTIES];

    try {
      const params = new URLSearchParams();
      if (filters?.city && filters.city !== 'All') params.append('city', filters.city);
      if (filters?.minRent) params.append('minRent', String(filters.minRent));
      if (filters?.maxRent) params.append('maxRent', String(filters.maxRent));
      if (filters?.bedrooms && filters.bedrooms !== 'all') params.append('bedrooms', String(filters.bedrooms));
      if (filters?.bathrooms && filters.bathrooms !== 'all') params.append('bathrooms', String(filters.bathrooms));

      const res = await fetch(`/api/properties?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data?.properties) && json.data.properties.length > 0) {
          const apiProps = json.data.properties.map((p: any) => ({
            id: p.id,
            title: p.title,
            description: p.description ?? '',
            address: p.address,
            city: p.city,
            postalCode: p.postalCode,
            location: p.location ?? { latitude: 27.7042, longitude: 85.3075 },
            totalFloors: p.totalFloors ?? 3,
            landlord: {
              id: p.landlord?.id ?? 'landlord-generic',
              name: p.landlord?.name ?? 'Property Manager',
              avatarUrl: p.landlord?.avatarUrl ?? null,
              isVerified: true,
              rating: 4.8,
              responseTime: 'Within 2 hours',
            },
            availableUnitsCount: p.availableUnitsCount ?? p.units?.length ?? 1,
            minMonthlyRent: p.minMonthlyRent ?? 25000,
            maxMonthlyRent: p.maxMonthlyRent ?? 45000,
            coverPhotoUrl: p.coverPhotoUrl ?? 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
            photos: p.photos ?? [],
            amenities: p.amenities ?? [],
            units: (p.units ?? []).map((u: any) => ({
              id: u.id,
              propertyId: p.id,
              unitIdentifier: u.unitIdentifier ?? 'Unit',
              floorNumber: u.floorNumber ?? 1,
              bedrooms: u.bedrooms ?? 2,
              bathrooms: u.bathrooms ?? 1,
              areaSqft: u.areaSqft ?? 700,
              monthlyRent: u.monthlyRent ?? 25000,
              securityDeposit: u.securityDeposit ?? 50000,
              availabilityStatus: u.availabilityStatus ?? 'AVAILABLE',
              amenities: u.amenities ?? [],
              photos: u.photos ?? [],
            })),
            verificationBadges: p.verificationBadges ?? [{ code: 'VERIFIED', name: 'Verified Listing', description: 'Platform verified' }],
            reviewsSummary: p.reviewsSummary ?? { averageRating: 4.8, totalReviews: 5 },
          }));
          list = apiProps;
        }
      }
    } catch {}

    // Apply local client-side filters
    if (filters) {
      if (filters.searchQuery?.trim()) {
        const q = filters.searchQuery.toLowerCase();
        list = list.filter(
          p =>
            p.title.toLowerCase().includes(q) ||
            p.address.toLowerCase().includes(q) ||
            p.city.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            matchesLocationSynonym(q, `${p.title} ${p.address} ${p.city} ${p.description}`)
        );
      }
      if (filters.city && filters.city !== 'All') {
        const c = filters.city.toLowerCase();
        list = list.filter(p => {
          const pc = p.city.toLowerCase();
          if (c === 'lalitpur' || c === 'patan') {
            return pc === 'lalitpur' || pc === 'patan' || p.address.toLowerCase().includes('patan');
          }
          return pc === c;
        });
      }
      if (filters.minRent) {
        list = list.filter(p => p.maxMonthlyRent >= filters.minRent!);
      }
      if (filters.maxRent) {
        list = list.filter(p => p.minMonthlyRent <= filters.maxRent!);
      }
      if (filters.bedrooms && filters.bedrooms !== 'all') {
        list = list.filter(p => p.units.some(u => u.bedrooms === filters.bedrooms));
      }
      if (filters.bathrooms && filters.bathrooms !== 'all') {
        list = list.filter(p => p.units.some(u => u.bathrooms === filters.bathrooms));
      }
      if (filters.amenities && filters.amenities.length > 0) {
        list = list.filter(p =>
          filters.amenities!.every(reqAm =>
            p.amenities.some(a => a.slug.toLowerCase().includes(reqAm.toLowerCase()))
          )
        );
      }
      if (filters.verifiedOnly) {
        list = list.filter(p => p.landlord.isVerified || p.verificationBadges.length > 0);
      }
      if (filters.radiusKm && filters.centerCoords) {
        const { latitude: cLat, longitude: cLng } = filters.centerCoords;
        list = list.filter(p => {
          if (!p.location?.latitude || !p.location?.longitude) return true;
          const dist = calculateDistanceKm(cLat, cLng, p.location.latitude, p.location.longitude);
          return dist <= (filters.radiusKm ?? 25);
        });
      }
      if (filters.sortBy === 'rent_asc') {
        list.sort((a, b) => a.minMonthlyRent - b.minMonthlyRent);
      } else if (filters.sortBy === 'rent_desc') {
        list.sort((a, b) => b.minMonthlyRent - a.minMonthlyRent);
      }
    }

    return list;
  },

  async getPropertyById(id: string): Promise<PropertyListing | null> {
    try {
      const res = await fetch(`/api/properties/${id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch {}

    const found = INITIAL_PROPERTIES.find(p => p.id === id);
    return found ?? null;
  },

  // ── Saved / Bookmarked Properties ─────────────────────────────────────
  getSavedPropertyIds(): string[] {
    return getStoredJson<string[]>(STORAGE_KEYS.SAVED_IDS, INITIAL_SAVED_PROPERTY_IDS);
  },

  toggleSaveProperty(propertyId: string): boolean {
    const current = this.getSavedPropertyIds();
    let updated: string[];
    let isSaved: boolean;
    if (current.includes(propertyId)) {
      updated = current.filter(id => id !== propertyId);
      isSaved = false;
    } else {
      updated = [propertyId, ...current];
      isSaved = true;
    }
    setStoredJson(STORAGE_KEYS.SAVED_IDS, updated);
    return isSaved;
  },

  // ── Rental Applications ────────────────────────────────────────────────
  async getApplications(accessToken?: string | null): Promise<RentalApplication[]> {
    // Try real API first
    if (accessToken) {
      try {
        const res = await fetch('/api/tenancy/requests', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: 'include',
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data?.requests)) {
            return (json.data.requests as any[]).map((req) => ({
              id: req.id,
              unitId: req.unitId,
              propertyId: req.property?.id || req.propertyId || '',
              tenantId: req.tenantId,
              landlordId: req.landlordId,
              status: req.status,
              message: req.message || '',
              proposedMoveIn: req.proposedMoveIn,
              createdAt: req.createdAt,
              updatedAt: req.updatedAt,
              unit: {
                id: req.unit?.id || req.unitId,
                unitIdentifier: req.unit?.unitIdentifier || 'Unit',
                floorNumber: req.unit?.floorNumber ?? 1,
                bedrooms: req.unit?.bedrooms ?? 1,
                bathrooms: req.unit?.bathrooms ?? 1,
                monthlyRent: req.unit?.monthlyRent ?? 0,
                securityDeposit: req.unit?.securityDeposit ?? 0,
              },
              property: {
                id: req.property?.id || '',
                title: req.property?.title || 'Rental Property',
                address: req.property?.address || '',
                city: req.property?.city || 'Kathmandu',
                coverPhotoUrl: req.property?.coverPhotoUrl,
              },
              landlord: {
                id: req.landlord?.id || req.landlordId || '',
                name: req.landlord?.name || 'Property Owner',
                avatarUrl: req.landlord?.avatarUrl || null,
                phone: req.landlord?.phone,
              },
            }));
          }
        }
      } catch {}
    }
    // Fallback to local mock data for demo
    return getStoredJson<RentalApplication[]>(STORAGE_KEYS.APPLICATIONS, INITIAL_APPLICATIONS);
  },

  async submitApplication(data: {
    unitId: string;
    propertyId: string;
    proposedMoveIn: string;
    message: string;
    propertyTitle: string;
    propertyAddress: string;
    propertyCity: string;
    unitIdentifier: string;
    monthlyRent: number;
    securityDeposit: number;
    landlordName: string;
  }, accessToken?: string | null): Promise<RentalApplication> {
    // Try real API with proper authorization
    if (accessToken) {
      try {
        const res = await fetch('/api/tenancy/requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: 'include',
          body: JSON.stringify({
            unitId: data.unitId,
            proposedMoveIn: data.proposedMoveIn,
            message: data.message,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const raw = json.data;
            return {
              id: raw.id,
              unitId: raw.unitId || data.unitId,
              propertyId: raw.property?.id || data.propertyId,
              tenantId: raw.tenantId || '',
              landlordId: raw.landlordId || '',
              status: raw.status || 'pending',
              message: raw.message || data.message,
              proposedMoveIn: raw.proposedMoveIn || data.proposedMoveIn,
              createdAt: raw.createdAt || new Date().toISOString(),
              updatedAt: raw.updatedAt || new Date().toISOString(),
              unit: {
                id: raw.unit?.id || data.unitId,
                unitIdentifier: raw.unit?.unitIdentifier || data.unitIdentifier,
                floorNumber: raw.unit?.floorNumber ?? 1,
                bedrooms: raw.unit?.bedrooms ?? 1,
                bathrooms: raw.unit?.bathrooms ?? 1,
                monthlyRent: raw.unit?.monthlyRent ?? data.monthlyRent,
                securityDeposit: raw.unit?.securityDeposit ?? data.securityDeposit,
              },
              property: {
                id: raw.property?.id || data.propertyId,
                title: raw.property?.title || data.propertyTitle,
                address: raw.property?.address || data.propertyAddress,
                city: raw.property?.city || data.propertyCity,
                coverPhotoUrl: raw.property?.coverPhotoUrl,
              },
              landlord: {
                id: raw.landlord?.id || raw.landlordId || '',
                name: raw.landlord?.name || data.landlordName || 'Property Owner',
                avatarUrl: raw.landlord?.avatarUrl || null,
                phone: raw.landlord?.phone,
              },
            };
          }
        }
        // If API returned an error, parse and throw it
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error?.message || `Application failed (${res.status})`);
      } catch (err) {
        // Re-throw API errors so the UI can display them
        if (err instanceof Error && err.message !== 'Failed to fetch') {
          throw err;
        }
      }
    }

    // Fallback to local mock if no token or network fails
    const newApp: RentalApplication = {
      id: `app-rh-${Date.now()}`,
      unitId: data.unitId,
      propertyId: data.propertyId,
      tenantId: 'current-tenant-id',
      landlordId: 'landlord-assigned',
      status: 'pending',
      message: data.message,
      proposedMoveIn: data.proposedMoveIn,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      unit: {
        id: data.unitId,
        unitIdentifier: data.unitIdentifier,
        floorNumber: 1,
        bedrooms: 2,
        bathrooms: 2,
        monthlyRent: data.monthlyRent,
        securityDeposit: data.securityDeposit,
      },
      property: {
        id: data.propertyId,
        title: data.propertyTitle,
        address: data.propertyAddress,
        city: data.propertyCity,
      },
      landlord: {
        id: 'landlord-assigned',
        name: data.landlordName,
        avatarUrl: null,
      },
    };

    const existing = getStoredJson<RentalApplication[]>(STORAGE_KEYS.APPLICATIONS, INITIAL_APPLICATIONS);
    const updated = [newApp, ...existing.filter(a => a.unitId !== data.unitId)];
    setStoredJson(STORAGE_KEYS.APPLICATIONS, updated);
    return newApp;
  },

  async cancelApplication(applicationId: string, accessToken?: string | null): Promise<void> {
    try {
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }
      await fetch(`/api/tenancy/requests/${applicationId}/cancel`, {
        method: 'POST',
        headers,
        credentials: 'include',
      });
    } catch {}

    const existing = getStoredJson<RentalApplication[]>(STORAGE_KEYS.APPLICATIONS, INITIAL_APPLICATIONS);
    const updated = existing.map(a =>
      a.id === applicationId ? { ...a, status: 'cancelled' as const, updatedAt: new Date().toISOString() } : a
    );
    setStoredJson(STORAGE_KEYS.APPLICATIONS, updated);
  },

  // ── Leases & Agreements ────────────────────────────────────────────────
  async getLeases(): Promise<LeaseAgreement[]> {
    return getStoredJson<LeaseAgreement[]>(STORAGE_KEYS.LEASES, [INITIAL_ACTIVE_LEASE]);
  },

  async signLease(leaseId: string): Promise<LeaseAgreement> {
    try {
      await fetch(`/api/tenancy/leases/${leaseId}/sign`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {}

    const leases = await this.getLeases();
    const updated = leases.map(l => {
      if (l.id === leaseId) {
        const now = new Date().toISOString();
        return {
          ...l,
          tenantSignedAt: now,
          signedAt: l.landlordSignedAt ? now : l.signedAt,
          status: 'active' as const,
          updatedAt: now,
        };
      }
      return l;
    });
    setStoredJson(STORAGE_KEYS.LEASES, updated);
    return updated.find(l => l.id === leaseId)!;
  },

  async terminateLease(leaseId: string, reasonCode: string, narrative: string): Promise<LeaseAgreement> {
    try {
      await fetch(`/api/tenancy/leases/${leaseId}/terminate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reasonCode, narrative }),
      });
    } catch {}

    const leases = await this.getLeases();
    const updated = leases.map(l => {
      if (l.id === leaseId) {
        const now = new Date().toISOString();
        return {
          ...l,
          status: 'terminated_early' as const,
          terminatedAt: now,
          updatedAt: now,
        };
      }
      return l;
    });
    setStoredJson(STORAGE_KEYS.LEASES, updated);
    return updated.find(l => l.id === leaseId)!;
  },

  // ── Payments & Invoicing ───────────────────────────────────────────────
  async getPayments(): Promise<PaymentRecord[]> {
    return getStoredJson<PaymentRecord[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
  },

  async payRent(paymentId: string, method: PaymentRecord['paymentMethod']): Promise<PaymentRecord> {
    const list = await this.getPayments();
    const now = new Date().toISOString().split('T')[0];
    const txId = `${method?.toUpperCase() ?? 'PAY'}-${Math.floor(100000000 + Math.random() * 900000000)}`;

    const updated = list.map(p => {
      if (p.id === paymentId) {
        return {
          ...p,
          status: 'PAID' as const,
          paidDate: now,
          paymentMethod: method,
          transactionId: txId,
        };
      }
      return p;
    });

    setStoredJson(STORAGE_KEYS.PAYMENTS, updated);
    return updated.find(p => p.id === paymentId)!;
  },

  // ── Maintenance ────────────────────────────────────────────────────────
  async getMaintenanceRequests(): Promise<MaintenanceRequest[]> {
    return getStoredJson<MaintenanceRequest[]>(STORAGE_KEYS.MAINTENANCE, INITIAL_MAINTENANCE);
  },

  async createMaintenanceRequest(data: {
    tenancyId: string;
    unitIdentifier: string;
    propertyTitle: string;
    category: MaintenanceRequest['category'];
    urgency: MaintenanceRequest['urgency'];
    title: string;
    description: string;
    preferredTimeWindow?: string;
  }): Promise<MaintenanceRequest> {
    const newReq: MaintenanceRequest = {
      id: `maint-${Date.now()}`,
      tenancyId: data.tenancyId,
      unitIdentifier: data.unitIdentifier,
      propertyTitle: data.propertyTitle,
      category: data.category,
      urgency: data.urgency,
      title: data.title,
      description: data.description,
      status: 'REPORTED',
      preferredTimeWindow: data.preferredTimeWindow ?? 'Flexible (9:00 AM – 5:00 PM)',
      createdAt: new Date().toISOString(),
    };

    const existing = await this.getMaintenanceRequests();
    const updated = [newReq, ...existing];
    setStoredJson(STORAGE_KEYS.MAINTENANCE, updated);
    return newReq;
  },

  // ── Tenancy Disputes ───────────────────────────────────────────────────
  async getDisputes(): Promise<TenancyDispute[]> {
    return getStoredJson<TenancyDispute[]>(STORAGE_KEYS.DISPUTES, INITIAL_DISPUTES);
  },

  async createDispute(data: {
    tenancyId: string;
    category: string;
    title: string;
    description: string;
    claimAmount: number;
    evidenceUrls?: string[];
  }): Promise<TenancyDispute> {
    const newDispute: TenancyDispute = {
      id: `disp-${Date.now()}`,
      tenancyId: data.tenancyId,
      raisedById: 'current-tenant-id',
      category: data.category,
      title: data.title,
      description: data.description,
      claimAmount: data.claimAmount,
      evidenceUrls: data.evidenceUrls ?? [],
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      propertyTitle: 'Sanepa Heights Executive Residence',
      unitIdentifier: 'Unit 201',
    };

    try {
      await fetch('/api/tenancy/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
    } catch {}

    const existing = await this.getDisputes();
    const updated = [newDispute, ...existing];
    setStoredJson(STORAGE_KEYS.DISPUTES, updated);
    return newDispute;
  },

  // ── User Profile ───────────────────────────────────────────────────────
  async updateProfile(data: { name?: string; phone?: string; avatar_url?: string }): Promise<void> {
    try {
      await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
    } catch {}
  },
};
