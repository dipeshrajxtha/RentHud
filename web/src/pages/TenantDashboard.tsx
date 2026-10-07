/**
 * TenantDashboard
 *
 * Full-fidelity Tenant Journey & Resident Portal:
 *   - Property Discovery (Search, Filters, 3D Property Cards, Interactive Leaflet Map & Radius Search)
 *   - View modes: 3D Grid, Split Map & List, and Full-screen Interactive Map
 *   - Saved Homes & Wishlist comparison
 *   - Rental Applications & Visual Tracking Stepper
 *   - Tenancy Hub & Digital Lease Agreement Signing (Muluki Civil Code 2074)
 *   - Rent Payments & Invoicing (eSewa / Khalti / ConnectIPS / Card simulation & receipts)
 *   - Maintenance Ticketing & Updates
 *   - Formal Tenancy Dispute Resolution (Muluki Civil Code 2074 § 398)
 *   - Early Lease Termination Workflow
 *   - Profile Settings & Multi-role Management
 *   - Full Mobile / Tablet Responsive States & Animated Transitions
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/features/auth/AuthContext';
import { RentHubLogo } from '@/components/common/RentHubLogo';
import { tenantService } from '@/features/tenant/tenant.service';
import type {
  PropertyListing,
  UnitDetail,
  RentalApplication,
  LeaseAgreement,
  PaymentRecord,
  MaintenanceRequest,
  TenancyDispute,
  SearchFilters,
} from '@/types/tenant';

// Child components
import { PropertySearchBar, type ViewMode } from '@/features/tenant/components/PropertySearchBar';
import { PropertyMapView } from '@/features/tenant/components/PropertyMapView';
import { PropertyFiltersDrawer } from '@/features/tenant/components/PropertyFiltersDrawer';
import { PropertyCard } from '@/features/tenant/components/PropertyCard';
import { PropertyDetailsModal } from '@/features/tenant/components/PropertyDetailsModal';
import { RentalApplicationModal } from '@/features/tenant/components/RentalApplicationModal';
import { ApplicationTrackingView } from '@/features/tenant/components/ApplicationTrackingView';
import { TenancyDashboardView } from '@/features/tenant/components/TenancyDashboardView';
import { LeaseAgreementModal } from '@/features/tenant/components/LeaseAgreementModal';
import { EarlyTerminationModal } from '@/features/tenant/components/EarlyTerminationModal';
import { PaymentsView } from '@/features/tenant/components/PaymentsView';
import { PayRentModal } from '@/features/tenant/components/PayRentModal';
import { ReceiptModal } from '@/features/tenant/components/ReceiptModal';
import { MaintenanceView } from '@/features/tenant/components/MaintenanceView';
import { NewMaintenanceModal } from '@/features/tenant/components/NewMaintenanceModal';
import { DisputesView } from '@/features/tenant/components/DisputesView';
import { NewDisputeModal } from '@/features/tenant/components/NewDisputeModal';
import { SavedPropertiesView } from '@/features/tenant/components/SavedPropertiesView';
import { ProfileSettingsView } from '@/features/tenant/components/ProfileSettingsView';

import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Heart,
  FileText,
  Home,
  CreditCard,
  Wrench,
  Scale,
  Settings,
  Menu,
  X,
  Sparkles,
  LogOut,
} from 'lucide-react';

type TenantTab =
  | 'discover'
  | 'saved'
  | 'applications'
  | 'tenancy'
  | 'payments'
  | 'maintenance'
  | 'disputes'
  | 'settings';

export function TenantDashboard() {
  const { user, accessToken, signOut } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      navigate('/login', { replace: true });
    }
  }

  // Navigation State
  const [activeTab, setActiveTab] = useState<TenantTab>('discover');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Data States
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [applications, setApplications] = useState<RentalApplication[]>([]);
  const [activeLease, setActiveLease] = useState<LeaseAgreement | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [maintenanceTickets, setMaintenanceTickets] = useState<MaintenanceRequest[]>([]);
  const [disputes, setDisputes] = useState<TenancyDispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [filters, setFilters] = useState<SearchFilters>({
    searchQuery: '',
    city: 'All',
    minRent: 0,
    maxRent: 0,
    bedrooms: 'all',
    bathrooms: 'all',
    amenities: [],
    sortBy: 'recommended',
    verifiedOnly: false,
    radiusKm: undefined,
    centerCoords: { latitude: 27.7080, longitude: 85.3200 },
  });
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Modals State
  const [selectedPropertyDetails, setSelectedPropertyDetails] = useState<PropertyListing | null>(null);
  const [applyModalData, setApplyModalData] = useState<{
    property: PropertyListing;
    unit: UnitDetail;
  } | null>(null);
  const [isLeaseModalOpen, setIsLeaseModalOpen] = useState(false);
  const [isEarlyTerminationModalOpen, setIsEarlyTerminationModalOpen] = useState(false);
  const [selectedPaymentForPay, setSelectedPaymentForPay] = useState<PaymentRecord | null>(null);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<PaymentRecord | null>(null);
  const [isNewMaintenanceModalOpen, setIsNewMaintenanceModalOpen] = useState(false);
  const [isNewDisputeModalOpen, setIsNewDisputeModalOpen] = useState(false);

  // Initial Load & Refresh
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [props, saved, apps, leases, pmts, maint, disps] = await Promise.all([
        tenantService.getProperties(filters),
        Promise.resolve(tenantService.getSavedPropertyIds()),
        tenantService.getApplications(accessToken),
        tenantService.getLeases(accessToken),
        tenantService.getPayments(accessToken),
        tenantService.getMaintenanceRequests(accessToken),
        tenantService.getDisputes(accessToken),
      ]);

      setProperties(props);
      setSavedIds(saved);
      setApplications(apps);
      setActiveLease(leases[0] ?? null);
      setPayments(pmts);
      setMaintenanceTickets(maint);
      setDisputes(disps);
    } finally {
      setIsLoading(false);
    }
  }, [filters, accessToken]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Handle save toggle
  const handleToggleSave = (id: string) => {
    const isNowSaved = tenantService.toggleSaveProperty(id);
    setSavedIds((prev) => (isNowSaved ? [id, ...prev] : prev.filter((p) => p !== id)));
  };

  // Saved properties list
  const savedProperties = useMemo(() => {
    return properties.filter((p) => savedIds.includes(p.id));
  }, [properties, savedIds]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.city !== 'All') count++;
    if (filters.minRent > 0) count++;
    if (filters.maxRent > 0) count++;
    if (filters.bedrooms !== 'all') count++;
    if (filters.bathrooms !== 'all') count++;
    if (filters.amenities.length > 0) count += filters.amenities.length;
    if (filters.verifiedOnly) count++;
    if (filters.radiusKm) count++;
    return count;
  }, [filters]);

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      city: 'All',
      minRent: 0,
      maxRent: 0,
      bedrooms: 'all',
      bathrooms: 'all',
      amenities: [],
      sortBy: 'recommended',
      verifiedOnly: false,
      radiusKm: undefined,
      centerCoords: { latitude: 27.7080, longitude: 85.3200 },
    });
  };

  // Preference matching indicator
  const userPreferences = tenantService.getPreferences();

  // Navigation Items
  const NAV_ITEMS: { id: TenantTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'discover', label: 'Explore Homes', icon: Compass },
    { id: 'saved', label: 'Saved Wishlist', icon: Heart, badge: savedIds.length },
    { id: 'applications', label: 'Applications', icon: FileText, badge: applications.filter((a) => a.status === 'pending').length },
    { id: 'tenancy', label: 'Resident Hub', icon: Home },
    { id: 'payments', label: 'Rent Payments', icon: CreditCard, badge: payments.filter((p) => p.status === 'PENDING').length },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, badge: maintenanceTickets.filter((m) => m.status !== 'RESOLVED').length },
    { id: 'disputes', label: 'Legal Disputes', icon: Scale },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col selection:bg-brand-500 selection:text-white">
      {/* ── TOP NAVIGATION BAR ────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Role Badge */}
          <div className="flex items-center gap-3">
            <RentHubLogo variant="original" className="h-7" />
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-50 text-brand-700 border border-brand-200">
              Tenant Portal
            </span>
          </div>

          {/* Desktop Navigation Tabs with Sliding Animated Pill */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto scrollbar-none relative">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap z-10 ${
                    isActive
                      ? 'text-brand-700 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-tenant-tab"
                      className="absolute inset-0 bg-brand-50 rounded-xl border border-brand-200/80 -z-10 shadow-xs"
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                    />
                  )}
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {Boolean(item.badge && item.badge > 0) && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Profile / Mobile Toggle */}
          <div className="flex items-center gap-2.5">

            <button
              onClick={() => setActiveTab('settings')}
              className="flex items-center gap-2 text-left p-1.5 px-2 rounded-xl hover:bg-slate-100/80 border border-transparent hover:border-slate-200 transition-all"
            >
              <div className="relative">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-8 h-8 rounded-full ring-2 ring-brand-100 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center">
                    {user?.name?.[0] ?? 'T'}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div className="hidden sm:block text-xs">
                <span className="font-semibold text-slate-900 block leading-tight">{user?.name}</span>
                <span className="text-[10px] text-slate-400">Kathmandu, NP</span>
              </div>
            </button>

            {/* Clear Sign Out Button */}
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-all cursor-pointer shadow-2xs"
              title="Sign out of RentHub"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500 hover:text-rose-600 transition-colors" />
              <span>{signingOut ? 'Signing out…' : 'Sign Out'}</span>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 shadow-lg"
            >
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                      isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {Boolean(item.badge && item.badge > 0) && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-600 text-white">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    void handleSignOut();
                  }}
                  disabled={signingOut}
                  className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{signingOut ? 'Signing out…' : 'Sign Out'}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── MAIN CONTENT AREA ─────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Loading indicator */}
        {isLoading && (
          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mb-4">
            <motion.div
              className="w-1/3 h-full bg-gradient-to-r from-brand-400 via-brand-600 to-brand-400 rounded-full"
              initial={{ x: '-100%' }}
              animate={{ x: '300%' }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
            />
          </div>
        )}

        {/* TAB 1: DISCOVER HOMES */}
        {activeTab === 'discover' && (
          <div className="space-y-6">
            {/* Search, Filter Bar & View Mode Switcher */}
            <PropertySearchBar
              filters={filters}
              onChange={(updated) => setFilters((prev) => ({ ...prev, ...updated }))}
              onOpenFilters={() => setIsFiltersOpen(true)}
              activeFilterCount={activeFilterCount}
              viewMode={viewMode}
              onViewModeChange={(mode) => setViewMode(mode)}
            />

            {/* Personalized Recommendations banner if MCQ preferences completed */}
            {userPreferences && (
              <div className="rounded-3xl bg-gradient-to-r from-brand-50 via-white to-brand-50/60 border border-brand-200/90 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block text-xs sm:text-sm">
                      Personalized feed for {userPreferences.householdSize} renter · {userPreferences.budgetBracket}
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Prioritizing {userPreferences.priorityAmenities.length} selected amenities in Kathmandu Valley
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline self-start sm:self-center"
                >
                  Adjust Preferences →
                </button>
              </div>
            )}

            {/* Results Count & Meta */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>
                Showing <strong className="text-slate-900 font-bold">{properties.length}</strong> rental properties{' '}
                {filters.searchQuery?.trim()
                  ? `matching "${filters.searchQuery}"`
                  : filters.city && filters.city !== 'All'
                  ? `in ${filters.city}`
                  : 'in Kathmandu Valley'}
                {filters.radiusKm && (
                  <span className="text-brand-600 font-bold ml-1">
                    (within {filters.radiusKm} km radius)
                  </span>
                )}
              </span>
              <span className="text-slate-400">All prices in Nepali Rupees (NPR)</span>
            </div>

            {/* Dynamic Content by View Mode (Grid / Split / Full Map) */}
            {viewMode === 'map' ? (
              /* Full Map View */
              <PropertyMapView
                properties={properties}
                selectedPropertyId={selectedPropertyDetails?.id}
                onSelectProperty={(p) => setSelectedPropertyDetails(p)}
                onApplyProperty={(p) => {
                  const avail = p.units.find((u) => u.availabilityStatus === 'AVAILABLE') || p.units[0];
                  if (avail) setApplyModalData({ property: p, unit: avail });
                }}
                radiusKm={filters.radiusKm ?? 10}
                onRadiusChange={(km) =>
                  setFilters((prev) => ({
                    ...prev,
                    radiusKm: km,
                    centerCoords: prev.centerCoords ?? { latitude: 27.7080, longitude: 85.3200 },
                  }))
                }
                centerCoords={filters.centerCoords}
                onCenterChange={(coords) =>
                  setFilters((prev) => ({
                    ...prev,
                    centerCoords: coords,
                  }))
                }
              />
            ) : viewMode === 'split' ? (
              /* Split View: 3D List on left, Sticky Map on right */
              <div className="grid lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-5 space-y-5 max-h-[750px] overflow-y-auto pr-1">
                  {properties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      isSaved={savedIds.includes(property.id)}
                      onToggleSave={handleToggleSave}
                      onSelect={(p) => setSelectedPropertyDetails(p)}
                      onApply={(p) => {
                        const avail = p.units.find((u) => u.availabilityStatus === 'AVAILABLE') || p.units[0];
                        if (avail) setApplyModalData({ property: p, unit: avail });
                      }}
                    />
                  ))}
                </div>
                <div className="lg:col-span-7 sticky top-20">
                  <PropertyMapView
                    properties={properties}
                    selectedPropertyId={selectedPropertyDetails?.id}
                    onSelectProperty={(p) => setSelectedPropertyDetails(p)}
                    onApplyProperty={(p) => {
                      const avail = p.units.find((u) => u.availabilityStatus === 'AVAILABLE') || p.units[0];
                      if (avail) setApplyModalData({ property: p, unit: avail });
                    }}
                    radiusKm={filters.radiusKm ?? 10}
                    onRadiusChange={(km) =>
                      setFilters((prev) => ({
                        ...prev,
                        radiusKm: km,
                        centerCoords: prev.centerCoords ?? { latitude: 27.7080, longitude: 85.3200 },
                      }))
                    }
                    centerCoords={filters.centerCoords}
                    onCenterChange={(coords) =>
                      setFilters((prev) => ({
                        ...prev,
                        centerCoords: coords,
                      }))
                    }
                  />
                </div>
              </div>
            ) : (
              /* Grid View: 3D Cards */
              properties.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Compass className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-display font-semibold text-slate-900">No Listings Match Filters</h3>
                  <p className="text-xs text-slate-500">
                    Try broadening your budget range, bedroom requirements, or resetting amenity filters.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      isSaved={savedIds.includes(property.id)}
                      onToggleSave={handleToggleSave}
                      onSelect={(p) => setSelectedPropertyDetails(p)}
                      onApply={(p) => {
                        const avail = p.units.find((u) => u.availabilityStatus === 'AVAILABLE') || p.units[0];
                        if (avail) {
                          setApplyModalData({ property: p, unit: avail });
                        }
                      }}
                    />
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {/* TAB 2: SAVED WISHLIST */}
        {activeTab === 'saved' && (
          <SavedPropertiesView
            savedProperties={savedProperties}
            onToggleSave={handleToggleSave}
            onSelectProperty={(p) => setSelectedPropertyDetails(p)}
            onApplyProperty={(p) => {
              const avail = p.units.find((u) => u.availabilityStatus === 'AVAILABLE') || p.units[0];
              if (avail) setApplyModalData({ property: p, unit: avail });
            }}
            onBrowseMore={() => setActiveTab('discover')}
          />
        )}

        {/* TAB 3: APPLICATIONS TRACKING */}
        {activeTab === 'applications' && (
          <ApplicationTrackingView
            applications={applications}
            onRefresh={loadData}
            onOpenLeaseModal={() => setIsLeaseModalOpen(true)}
            onBrowseMore={() => setActiveTab('discover')}
          />
        )}

        {/* TAB 4: TENANCY RESIDENT HUB */}
        {activeTab === 'tenancy' && (
          <TenancyDashboardView
            lease={activeLease}
            payments={payments}
            maintenanceTickets={maintenanceTickets}
            onOpenLeaseModal={() => setIsLeaseModalOpen(true)}
            onOpenPayRentModal={() => {
              const pending = payments.find((p) => p.status === 'PENDING') || payments[0];
              if (pending) setSelectedPaymentForPay(pending);
            }}
            onOpenMaintenanceModal={() => setIsNewMaintenanceModalOpen(true)}
            onOpenDisputeModal={() => setIsNewDisputeModalOpen(true)}
            onOpenEarlyTerminationModal={() => setIsEarlyTerminationModalOpen(true)}
            onBrowseListings={() => setActiveTab('discover')}
          />
        )}

        {/* TAB 5: PAYMENTS */}
        {activeTab === 'payments' && (
          <PaymentsView
            payments={payments}
            onOpenPayModal={(pmt) => setSelectedPaymentForPay(pmt)}
            onViewReceipt={(pmt) => setSelectedPaymentForReceipt(pmt)}
          />
        )}

        {/* TAB 6: MAINTENANCE */}
        {activeTab === 'maintenance' && (
          <MaintenanceView
            tickets={maintenanceTickets}
            lease={activeLease}
            onOpenNewTicketModal={() => setIsNewMaintenanceModalOpen(true)}
          />
        )}

        {/* TAB 7: DISPUTES */}
        {activeTab === 'disputes' && (
          <DisputesView
            disputes={disputes}
            lease={activeLease}
            onOpenNewDisputeModal={() => setIsNewDisputeModalOpen(true)}
          />
        )}

        {/* TAB 8: PROFILE & SETTINGS */}
        {activeTab === 'settings' && (
          <ProfileSettingsView
            onRetakeOnboarding={() => {
              window.location.href = '/onboarding/role';
            }}
          />
        )}
      </main>

      {/* ── MODALS & DRAWERS ─────────────────────────────────────────── */}

      {/* Filters Drawer */}
      <PropertyFiltersDrawer
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        filters={filters}
        onChange={(updated) => setFilters((prev) => ({ ...prev, ...updated }))}
        onReset={handleResetFilters}
      />

      {/* Property Details Modal */}
      <PropertyDetailsModal
        property={selectedPropertyDetails}
        onClose={() => setSelectedPropertyDetails(null)}
        isSaved={selectedPropertyDetails ? savedIds.includes(selectedPropertyDetails.id) : false}
        onToggleSave={handleToggleSave}
        onSelectUnitToApply={(property, unit) => {
          setSelectedPropertyDetails(null);
          setApplyModalData({ property, unit });
        }}
      />

      {/* Rental Application Modal */}
      {applyModalData && (
        <RentalApplicationModal
          property={applyModalData.property}
          selectedUnit={applyModalData.unit}
          accessToken={accessToken}
          onClose={() => setApplyModalData(null)}
          onApplicationSubmitted={(newApp) => {
            setApplications((prev) => [newApp, ...prev.filter((a) => a.id !== newApp.id)]);
          }}
        />
      )}

      {/* Lease Agreement Modal */}
      {isLeaseModalOpen && (
        <LeaseAgreementModal
          lease={activeLease}
          onClose={() => setIsLeaseModalOpen(false)}
          onSigned={(updated) => {
            setActiveLease(updated);
          }}
        />
      )}

      {/* Early Termination Modal */}
      {isEarlyTerminationModalOpen && (
        <EarlyTerminationModal
          lease={activeLease}
          onClose={() => setIsEarlyTerminationModalOpen(false)}
          onTerminated={(updated) => {
            setActiveLease(updated);
          }}
        />
      )}

      {/* Pay Rent Modal */}
      {selectedPaymentForPay && (
        <PayRentModal
          payment={selectedPaymentForPay}
          onClose={() => setSelectedPaymentForPay(null)}
          onPaymentSuccess={(paid) => {
            setPayments((prev) => prev.map((p) => (p.id === paid.id ? paid : p)));
          }}
        />
      )}

      {/* Payment Receipt Modal */}
      {selectedPaymentForReceipt && (
        <ReceiptModal
          payment={selectedPaymentForReceipt}
          lease={activeLease}
          onClose={() => setSelectedPaymentForReceipt(null)}
        />
      )}

      {/* New Maintenance Request Modal */}
      {isNewMaintenanceModalOpen && (
        <NewMaintenanceModal
          lease={activeLease}
          onClose={() => setIsNewMaintenanceModalOpen(false)}
          onCreated={(ticket) => {
            setMaintenanceTickets((prev) => [ticket, ...prev]);
          }}
        />
      )}

      {/* New Dispute Modal */}
      {isNewDisputeModalOpen && (
        <NewDisputeModal
          lease={activeLease}
          onClose={() => setIsNewDisputeModalOpen(false)}
          onCreated={(dispute) => {
            setDisputes((prev) => [dispute, ...prev]);
          }}
        />
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden sticky bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-3 py-2 flex items-center justify-around text-[10px] font-medium text-slate-600">
        {[
          { id: 'discover', label: 'Explore', icon: Compass },
          { id: 'saved', label: 'Saved', icon: Heart },
          { id: 'applications', label: 'Applications', icon: FileText },
          { id: 'tenancy', label: 'Tenancy', icon: Home },
          { id: 'payments', label: 'Pay Rent', icon: CreditCard },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TenantTab)}
              className={`flex flex-col items-center gap-1 p-1 transition-colors ${
                isActive ? 'text-brand-600 font-semibold' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
