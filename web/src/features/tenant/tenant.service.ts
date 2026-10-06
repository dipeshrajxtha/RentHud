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
import { matchesLocationSynonym } from './utils/locationResolver';

const STORAGE_KEYS = {
  PREFERENCES: 'rh_tenant_preferences',
  SAVED_IDS: 'rh_saved_property_ids',
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

// Stable, human-readable invoice number derived from the payment record id
function invoiceNumberFor(id: string): string {
  return `INV-${String(id).slice(0, 8).toUpperCase()}`;
}

// Maps a /api/payments row (camelCase, from operations.service) to the UI PaymentRecord shape
function toPaymentRecord(p: any): PaymentRecord {
  return {
    id: p.id,
    tenancyId: p.tenancyId,
    invoiceNumber: invoiceNumberFor(p.id),
    billingMonth: p.monthFor,
    dueDate: String(p.dueDate).split('T')[0],
    paidDate: p.paidDate ? String(p.paidDate) : null,
    amount: Number(p.amount) || 0,
    type: 'RENT',
    status: (String(p.status || 'PENDING').toUpperCase() as PaymentRecord['status']),
    paymentMethod: p.paymentMethod ?? undefined,
    transactionId: p.transactionId ?? undefined,
  };
}

export const tenantService = {
  // ── Preferences ────────────────────────────────────────────────────────
  getPreferences(): TenantPreferences | null {
    return getStoredJson<TenantPreferences | null>(STORAGE_KEYS.PREFERENCES, null);
  },

  savePreferences(prefs: TenantPreferences): void {
    setStoredJson(STORAGE_KEYS.PREFERENCES, prefs);
  },

  // ── Properties Discovery (Real PostgreSQL Database) ───────────────────
  async getProperties(filters?: Partial<SearchFilters>): Promise<PropertyListing[]> {
    let list: PropertyListing[] = [];

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
        if (json.success && Array.isArray(json.data?.properties)) {
          list = json.data.properties.map((p: any) => ({
            id: p.id,
            title: p.title,
            description: p.description ?? '',
            address: p.address,
            city: p.city,
            postalCode: p.postalCode,
            location: p.location ?? { latitude: 27.7042, longitude: 85.3075 },
            totalFloors: p.totalFloors ?? 1,
            landlord: {
              id: p.landlord?.id ?? 'landlord-owner',
              name: p.landlord?.name ?? 'Property Owner',
              avatarUrl: p.landlord?.avatarUrl ?? null,
              isVerified: true,
              rating: 4.9,
              responseTime: 'Within 2 hours',
            },
            availableUnitsCount: p.availableUnitsCount ?? p.units?.length ?? 1,
            minMonthlyRent: p.minMonthlyRent ?? (p.units?.[0]?.monthlyRent || 0),
            maxMonthlyRent: p.maxMonthlyRent ?? (p.units?.[0]?.monthlyRent || 0),
            coverPhotoUrl: p.coverPhotoUrl ?? (p.photos?.[0]?.url || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'),
            photos: p.photos ?? [],
            amenities: p.amenities ?? [],
            units: (p.units ?? []).map((u: any) => ({
              id: u.id,
              propertyId: p.id,
              unitIdentifier: u.unitIdentifier ?? 'Unit',
              floorNumber: u.floorNumber ?? 1,
              bedrooms: u.bedrooms ?? 1,
              bathrooms: u.bathrooms ?? 1,
              areaSqft: u.areaSqft ?? 600,
              monthlyRent: Number(u.monthlyRent) || 0,
              securityDeposit: Number(u.securityDeposit) || 0,
              availabilityStatus: u.availabilityStatus ?? 'AVAILABLE',
              amenities: u.amenities ?? [],
              photos: u.photos ?? [],
            })),
            verificationBadges: p.verificationBadges ?? [],
            reviewsSummary: p.reviewsSummary ?? { averageRating: null, totalReviews: 0 },
          }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch properties from server:', err);
    }

    // Apply client-side search query and radius filtering if applicable
    if (filters) {
      if (filters.searchQuery?.trim()) {
        const q = filters.searchQuery.toLowerCase();
        list = list.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.address.toLowerCase().includes(q) ||
            p.city.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            matchesLocationSynonym(q, `${p.title} ${p.address} ${p.city} ${p.description}`)
        );
      }
      if (filters.city && filters.city !== 'All') {
        const c = filters.city.toLowerCase();
        list = list.filter((p) => {
          const pc = p.city.toLowerCase();
          if (c === 'lalitpur' || c === 'patan') {
            return pc === 'lalitpur' || pc === 'patan' || p.address.toLowerCase().includes('patan');
          }
          return pc === c;
        });
      }
      if (filters.minRent) {
        list = list.filter((p) => p.maxMonthlyRent >= filters.minRent!);
      }
      if (filters.maxRent) {
        list = list.filter((p) => p.minMonthlyRent <= filters.maxRent!);
      }
      if (filters.bedrooms && filters.bedrooms !== 'all') {
        list = list.filter((p) => p.units.some((u) => u.bedrooms === filters.bedrooms));
      }
      if (filters.bathrooms && filters.bathrooms !== 'all') {
        list = list.filter((p) => p.units.some((u) => u.bathrooms === filters.bathrooms));
      }
      if (filters.amenities && filters.amenities.length > 0) {
        list = list.filter((p) =>
          filters.amenities!.every((reqAm) =>
            p.amenities.some((a) => a.slug.toLowerCase().includes(reqAm.toLowerCase()))
          )
        );
      }
      if (filters.radiusKm && filters.centerCoords) {
        const { latitude: cLat, longitude: cLng } = filters.centerCoords;
        list = list.filter((p) => {
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
          const p = json.data;
          return {
            id: p.id,
            title: p.title,
            description: p.description ?? '',
            address: p.address,
            city: p.city,
            postalCode: p.postalCode,
            location: p.location ?? { latitude: 27.7042, longitude: 85.3075 },
            totalFloors: p.totalFloors ?? 1,
            landlord: {
              id: p.landlord?.id ?? 'landlord-owner',
              name: p.landlord?.name ?? 'Property Owner',
              avatarUrl: p.landlord?.avatarUrl ?? null,
              phone: p.landlord?.phone,
              isVerified: true,
              rating: 4.9,
              responseTime: 'Within 2 hours',
            },
            availableUnitsCount: p.availableUnitsCount ?? p.units?.length ?? 1,
            minMonthlyRent: p.minMonthlyRent ?? 0,
            maxMonthlyRent: p.maxMonthlyRent ?? 0,
            coverPhotoUrl: p.coverPhotoUrl ?? (p.photos?.[0]?.url || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'),
            photos: p.photos ?? [],
            amenities: p.amenities ?? [],
            units: (p.units ?? []).map((u: any) => ({
              id: u.id,
              propertyId: p.id,
              unitIdentifier: u.unitIdentifier ?? 'Unit',
              floorNumber: u.floorNumber ?? 1,
              bedrooms: u.bedrooms ?? 1,
              bathrooms: u.bathrooms ?? 1,
              areaSqft: u.areaSqft ?? 600,
              monthlyRent: Number(u.monthlyRent) || 0,
              securityDeposit: Number(u.securityDeposit) || 0,
              availabilityStatus: u.availabilityStatus ?? 'AVAILABLE',
              amenities: u.amenities ?? [],
              photos: u.photos ?? [],
            })),
            verificationBadges: p.verificationBadges ?? [],
            reviewsSummary: p.reviewsSummary ?? { averageRating: null, totalReviews: 0 },
          };
        }
      }
    } catch (err) {
      console.error('Failed to fetch property details:', err);
    }
    return null;
  },

  // ── Saved / Bookmarked Properties ─────────────────────────────────────
  getSavedPropertyIds(): string[] {
    return getStoredJson<string[]>(STORAGE_KEYS.SAVED_IDS, []);
  },

  toggleSaveProperty(propertyId: string): boolean {
    const current = this.getSavedPropertyIds();
    let updated: string[];
    let isSaved: boolean;
    if (current.includes(propertyId)) {
      updated = current.filter((id) => id !== propertyId);
      isSaved = false;
    } else {
      updated = [propertyId, ...current];
      isSaved = true;
    }
    setStoredJson(STORAGE_KEYS.SAVED_IDS, updated);
    return isSaved;
  },

  // ── Applications (Rental Requests) ────────────────────────────────────
  async getApplications(accessToken?: string | null): Promise<RentalApplication[]> {
    if (!accessToken) return [];

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
              monthlyRent: Number(req.unit?.monthlyRent) || 0,
              securityDeposit: Number(req.unit?.securityDeposit) || 0,
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
    } catch (err) {
      console.error('Failed to load applications from API:', err);
    }

    return [];
  },

  async submitApplication(
    data: {
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
    },
    accessToken?: string | null
  ): Promise<RentalApplication> {
    if (!accessToken) {
      throw new Error('Please sign in to submit a rental application');
    }

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

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to submit application');
    }

    const raw = json.data;
    return {
      id: raw.id,
      unitId: raw.unitId,
      propertyId: data.propertyId,
      tenantId: raw.tenantId,
      landlordId: raw.landlordId,
      status: raw.status || 'pending',
      message: raw.message || data.message,
      proposedMoveIn: raw.proposedMoveIn || data.proposedMoveIn,
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: raw.updatedAt || new Date().toISOString(),
      unit: {
        id: data.unitId,
        unitIdentifier: data.unitIdentifier,
        floorNumber: 1,
        bedrooms: 1,
        bathrooms: 1,
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
        id: raw.landlordId || '',
        name: data.landlordName,
        avatarUrl: null,
      },
    };
  },

  async cancelApplication(applicationId: string, accessToken?: string | null): Promise<void> {
    if (!accessToken) return;

    const res = await fetch(`/api/tenancy/requests/${applicationId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: 'include',
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error?.message || 'Failed to cancel application');
    }
  },

  // ── Leases & Agreements ───────────────────────────────────────────────────
  async getLeases(accessToken?: string | null): Promise<LeaseAgreement[]> {
    if (!accessToken) return [];

    try {
      const res = await fetch('/api/tenancy/leases', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data?.leases)) {
          return (json.data.leases as any[]).map((raw) => ({
            id: raw.id,
            unitId: raw.unitId,
            propertyId: raw.propertyId || '',
            tenantId: raw.tenantId,
            landlordId: raw.landlordId,
            rentalRequestId: raw.rentalRequestId,
            status: raw.status,
            startDate: raw.startDate ? String(raw.startDate).split('T')[0] : '',
            endDate: raw.endDate ? String(raw.endDate).split('T')[0] : '',
            agreedMonthlyRent: Number(raw.agreedMonthlyRent),
            agreedDeposit: Number(raw.agreedDeposit),
            tenantSignedAt: raw.tenantSignedAt ? String(raw.tenantSignedAt) : null,
            landlordSignedAt: raw.landlordSignedAt ? String(raw.landlordSignedAt) : null,
            signedAt: raw.signedAt ? String(raw.signedAt) : null,
            terminatedAt: raw.terminatedAt ? String(raw.terminatedAt) : null,
            createdAt: String(raw.createdAt),
            updatedAt: String(raw.updatedAt),
            propertyTitle: raw.propertyTitle || 'Residential Property',
            propertyAddress: raw.propertyAddress || 'Kathmandu, Nepal',
            propertyCity: raw.propertyCity || 'Kathmandu',
            unitIdentifier: raw.unitIdentifier || 'Unit',
            landlordName: raw.landlordName || 'Landlord',
            landlordPhone: raw.landlordPhone || undefined,
            tenantName: raw.tenantName || 'Tenant',
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load leases from API:', err);
    }
    return [];
  },

  async signLease(leaseId: string, accessToken?: string | null): Promise<LeaseAgreement> {
    if (!accessToken) {
      throw new Error('Authentication required to sign lease');
    }

    const res = await fetch(`/api/tenancy/leases/${leaseId}/sign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: 'include',
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to sign lease agreement');
    }

    const raw = json.data;
    return {
      id: raw.id,
      unitId: raw.unitId,
      propertyId: raw.propertyId || '',
      tenantId: raw.tenantId,
      landlordId: raw.landlordId,
      rentalRequestId: raw.rentalRequestId,
      status: raw.status,
      startDate: raw.startDate ? String(raw.startDate).split('T')[0] : '',
      endDate: raw.endDate ? String(raw.endDate).split('T')[0] : '',
      agreedMonthlyRent: Number(raw.agreedMonthlyRent),
      agreedDeposit: Number(raw.agreedDeposit),
      tenantSignedAt: raw.tenantSignedAt ? String(raw.tenantSignedAt) : null,
      landlordSignedAt: raw.landlordSignedAt ? String(raw.landlordSignedAt) : null,
      signedAt: raw.signedAt ? String(raw.signedAt) : null,
      terminatedAt: raw.terminatedAt ? String(raw.terminatedAt) : null,
      createdAt: String(raw.createdAt),
      updatedAt: String(raw.updatedAt),
      propertyTitle: raw.propertyTitle || 'Residential Property',
      propertyAddress: raw.propertyAddress || 'Kathmandu, Nepal',
      propertyCity: raw.propertyCity || 'Kathmandu',
      unitIdentifier: raw.unitIdentifier || 'Unit',
      landlordName: raw.landlordName || 'Landlord',
      landlordPhone: raw.landlordPhone || undefined,
      tenantName: raw.tenantName || 'Tenant',
    };
  },

  async terminateLease(
    leaseId: string,
    reasonCode: string,
    narrative: string,
    accessToken?: string | null
  ): Promise<LeaseAgreement> {
    if (!accessToken) {
      throw new Error('Authentication required');
    }

    const res = await fetch(`/api/tenancy/leases/${leaseId}/terminate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: 'include',
      body: JSON.stringify({ reasonCode, narrative }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to terminate lease');
    }

    // Backend returns the updated lease (status: terminated_early, terminatedAt set)
    const raw = json.data;
    return {
      id: raw.id,
      unitId: raw.unitId,
      propertyId: raw.propertyId || '',
      tenantId: raw.tenantId,
      landlordId: raw.landlordId,
      rentalRequestId: raw.rentalRequestId,
      status: raw.status,
      startDate: raw.startDate ? String(raw.startDate).split('T')[0] : '',
      endDate: raw.endDate ? String(raw.endDate).split('T')[0] : '',
      agreedMonthlyRent: Number(raw.agreedMonthlyRent),
      agreedDeposit: Number(raw.agreedDeposit),
      tenantSignedAt: raw.tenantSignedAt ? String(raw.tenantSignedAt) : null,
      landlordSignedAt: raw.landlordSignedAt ? String(raw.landlordSignedAt) : null,
      signedAt: raw.signedAt ? String(raw.signedAt) : null,
      terminatedAt: raw.terminatedAt ? String(raw.terminatedAt) : null,
      createdAt: String(raw.createdAt),
      updatedAt: String(raw.updatedAt),
      propertyTitle: raw.propertyTitle || 'Residential Property',
      propertyAddress: raw.propertyAddress || 'Kathmandu, Nepal',
      propertyCity: raw.propertyCity || 'Kathmandu',
      unitIdentifier: raw.unitIdentifier || 'Unit',
      landlordName: raw.landlordName || 'Landlord',
      landlordPhone: raw.landlordPhone || undefined,
      tenantName: raw.tenantName || 'Tenant',
    };
  },

  // ── Rent Payments & Ledger ────────────────────────────────────────────────
  async getPayments(accessToken?: string | null): Promise<PaymentRecord[]> {
    if (!accessToken) return [];

    try {
      const res = await fetch('/api/payments', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          return json.data.map(toPaymentRecord);
        }
      }
    } catch (err) {
      console.error('Failed to load payments from server:', err);
    }
    return [];
  },

  async payRent(
    paymentId: string,
    method: PaymentRecord['paymentMethod'],
    txId: string,
    accessToken?: string | null
  ): Promise<PaymentRecord> {
    if (!accessToken) {
      throw new Error('Authentication required to record payment');
    }

    const res = await fetch(`/api/payments/${paymentId}/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: 'include',
      body: JSON.stringify({ paymentMethod: method, transactionId: txId }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Payment processing failed');
    }

    // pay endpoint returns the raw rent_payments row (snake_case)
    const p = json.data;
    return {
      id: p.id,
      tenancyId: p.tenancy_id,
      invoiceNumber: invoiceNumberFor(p.id),
      billingMonth: p.month_for,
      dueDate: String(p.due_date).split('T')[0],
      paidDate: p.paid_date ? String(p.paid_date) : new Date().toISOString(),
      amount: Number(p.amount) || 0,
      type: 'RENT',
      status: 'PAID',
      paymentMethod: method,
      transactionId: p.transaction_id || txId,
    };
  },

  // ── Maintenance Ticketing ────────────────────────────────────────────────
  async getMaintenanceRequests(accessToken?: string | null): Promise<MaintenanceRequest[]> {
    if (!accessToken) return [];

    try {
      const res = await fetch('/api/maintenance', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          return json.data.map((m: any) => ({
            id: m.id,
            tenancyId: m.tenancyId ?? '',
            unitIdentifier: m.unitIdentifier ?? 'Unit',
            propertyTitle: m.propertyTitle,
            category: m.category,
            urgency: m.urgency,
            title: m.title,
            description: m.description,
            status: m.status?.toUpperCase() || 'REPORTED',
            preferredTimeWindow: m.preferredTimeWindow ?? 'Flexible (9:00 AM – 5:00 PM)',
            createdAt: m.createdAt,
            scheduledDate: m.scheduledDate ?? undefined,
            assignedContractor: m.assignedContractor ?? undefined,
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load maintenance requests:', err);
    }
    return [];
  },

  async createMaintenanceRequest(
    data: {
      tenancyId: string;
      propertyId?: string;
      unitId?: string;
      unitIdentifier: string;
      propertyTitle: string;
      category: MaintenanceRequest['category'];
      urgency: MaintenanceRequest['urgency'];
      title: string;
      description: string;
      preferredTimeWindow?: string;
    },
    accessToken?: string | null
  ): Promise<MaintenanceRequest> {
    if (!accessToken) {
      throw new Error('Authentication required to submit maintenance ticket');
    }

    const res = await fetch('/api/maintenance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: 'include',
      body: JSON.stringify({
        tenancyId: data.tenancyId,
        propertyId: data.propertyId,
        unitId: data.unitId,
        category: data.category,
        urgency: data.urgency,
        title: data.title,
        description: data.description,
        preferredTimeWindow: data.preferredTimeWindow,
      }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to submit maintenance request');
    }

    const t = json.data;
    return {
      id: t.id,
      tenancyId: t.tenancyId,
      unitIdentifier: data.unitIdentifier,
      propertyTitle: data.propertyTitle,
      category: data.category,
      urgency: data.urgency,
      title: data.title,
      description: data.description,
      status: 'REPORTED',
      preferredTimeWindow: data.preferredTimeWindow ?? 'Flexible (9:00 AM – 5:00 PM)',
      createdAt: t.createdAt || new Date().toISOString(),
    };
  },

  // ── Tenancy Disputes ─────────────────────────────────────────────────────
  async getDisputes(accessToken?: string | null): Promise<TenancyDispute[]> {
    if (!accessToken) return [];

    try {
      const res = await fetch('/api/tenancy/disputes', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data?.disputes)) {
          return (json.data.disputes as any[]).map((d) => ({
            id: d.id,
            tenancyId: d.tenancyId,
            raisedById: d.raisedById,
            category: d.category,
            title: d.title,
            description: d.description,
            claimAmount: Number(d.claimAmount) || 0,
            evidenceUrls: d.evidenceUrls ?? [],
            status: d.status,
            createdAt: d.createdAt,
            propertyTitle: d.propertyTitle || 'Tenancy Property',
            unitIdentifier: d.unitIdentifier || 'Unit',
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load disputes from server:', err);
    }
    return [];
  },

  async createDispute(
    data: {
      tenancyId: string;
      category: string;
      title: string;
      description: string;
      claimAmount: number;
      evidenceUrls?: string[];
      propertyTitle?: string;
      unitIdentifier?: string;
    },
    accessToken?: string | null
  ): Promise<TenancyDispute> {
    if (!accessToken) {
      throw new Error('Authentication required to file dispute');
    }

    const res = await fetch('/api/tenancy/disputes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to lodge dispute');
    }

    const d = json.data;
    return {
      id: d.id,
      tenancyId: d.tenancyId || data.tenancyId,
      raisedById: d.raisedById || '',
      category: data.category,
      title: data.title,
      description: data.description,
      claimAmount: data.claimAmount,
      evidenceUrls: data.evidenceUrls ?? [],
      status: d.status || 'OPEN',
      createdAt: d.createdAt || new Date().toISOString(),
      propertyTitle: data.propertyTitle || 'Tenancy Property',
      unitIdentifier: data.unitIdentifier || 'Unit',
    };
  },

  // ── User Profile ─────────────────────────────────────────────────────────
  async updateProfile(
    data: { name?: string; phone?: string; avatar_url?: string },
    accessToken?: string | null
  ): Promise<void> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

    await fetch('/api/users/me', {
      method: 'PATCH',
      headers,
      credentials: 'include',
      body: JSON.stringify(data),
    });
  },
};
