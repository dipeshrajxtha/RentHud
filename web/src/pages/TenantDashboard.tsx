/**
 * TenantDashboard — Modern Airbnb & Zillow Inspired Light Portal
 *
 * Design Language: Clean White + Soft Slate + Vibrant RentHub Blue
 *   - Intuitive top navigation tabs (Airbnb category-style navigation)
 *   - Quick status bar showing resident or house-hunting state
 *   - Live real-time stats overview
 *   - Responsive mobile navigation with bottom thumb bar
 *   - Zero dark mode: bright, airy, clean typography with high contrast
 *
 * Real-time data: Live from PostgreSQL via tenantService / API
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
  Bell,
  Building2,
} from 'lucide-react';

export type TenantTab =
  | 'discover'
  | 'saved'
  | 'applications'
  | 'tenancy'
  | 'payments'
  | 'maintenance'
  | 'disputes'
  | 'settings';

interface StatCardProps {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  onClick?: () => void;
}

function StatCard({ label, value, sub, icon: Icon, iconBg, iconColor, onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg} ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
        {value}
      </div>
      <div className="text-xs text-slate-500 mt-1">
        {sub}
      </div>
    </div>
  );
}

export function TenantDashboard() {
  const { user, accessToken, signOut } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TenantTab>('discover');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Real-time Data
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [applications, setApplications] = useState<RentalApplication[]>([]);
  const [activeLease, setActiveLease] = useState<LeaseAgreement | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [maintenanceTickets, setMaintenanceTickets] = useState<MaintenanceRequest[]>([]);
  const [disputes, setDisputes] = useState<TenancyDispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
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
    centerCoords: { latitude: 27.708, longitude: 85.32 },
  });
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Modals
  const [selectedPropertyDetails, setSelectedPropertyDetails] = useState<PropertyListing | null>(null);
  const [applyModalData, setApplyModalData] = useState<{ property: PropertyListing; unit: UnitDetail } | null>(null);
  const [isLeaseModalOpen, setIsLeaseModalOpen] = useState(false);
  const [isEarlyTerminationModalOpen, setIsEarlyTerminationModalOpen] = useState(false);
  const [selectedPaymentForPay, setSelectedPaymentForPay] = useState<PaymentRecord | null>(null);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<PaymentRecord | null>(null);
  const [isNewMaintenanceModalOpen, setIsNewMaintenanceModalOpen] = useState(false);
  const [isNewDisputeModalOpen, setIsNewDisputeModalOpen] = useState(false);

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

  const handleToggleSave = (id: string) => {
    const isNowSaved = tenantService.toggleSaveProperty(id);
    setSavedIds((prev) => (isNowSaved ? [id, ...prev] : prev.filter((p) => p !== id)));
  };

  const savedProperties = useMemo(
    () => properties.filter((p) => savedIds.includes(p.id)),
    [properties, savedIds]
  );

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

  const handleResetFilters = () =>
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
      centerCoords: { latitude: 27.708, longitude: 85.32 },
    });

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      navigate('/login', { replace: true });
    }
  }

  const userPreferences = tenantService.getPreferences();
  const pendingPayments = payments.filter((p) => p.status === 'PENDING').length;
  const pendingApps = applications.filter((a) => a.status === 'pending').length;
  const openMaintenance = maintenanceTickets.filter((m) => m.status !== 'RESOLVED').length;
  const totalAlerts = pendingPayments + pendingApps + openMaintenance;

  const NAV_TABS: {
    id: TenantTab;
    label: string;
    icon: React.ElementType;
    badge?: number;
    badgeVariant?: 'blue' | 'rose' | 'amber' | 'emerald';
  }[] = [
    { id: 'discover', label: 'Explore Rentals', icon: Compass },
    { id: 'saved', label: 'Saved Homes', icon: Heart, badge: savedIds.length, badgeVariant: 'rose' },
    { id: 'applications', label: 'Applications', icon: FileText, badge: pendingApps, badgeVariant: 'amber' },
    { id: 'tenancy', label: 'Resident Hub', icon: Home },
    { id: 'payments', label: 'Rent & Payments', icon: CreditCard, badge: pendingPayments, badgeVariant: 'blue' },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, badge: openMaintenance, badgeVariant: 'amber' },
    { id: 'disputes', label: 'Legal Disputes', icon: Scale },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* ── TOP GLOBAL HEADER BAR (Airbnb-grade) ────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 h-16">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Left: Brand logo & portal badge */}
          <div className="flex items-center gap-3">
            <RentHubLogo variant="original" className="h-7" />
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
              Tenant Portal
            </span>
          </div>

          {/* Center: Live status indicator pill */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200/70 text-xs text-slate-700 font-medium">
            {activeLease ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>
                  Resident at <strong className="text-slate-900">{activeLease.propertyTitle}</strong> ({activeLease.unitIdentifier})
                </span>
              </>
            ) : (
              <>
                <Compass className="w-3.5 h-3.5 text-blue-600" />
                <span>Exploring Rentals in Kathmandu Valley</span>
              </>
            )}
          </div>

          {/* Right: Quick actions, notifications, user avatar, logout */}
          <div className="flex items-center gap-3">
            {/* Pending notifications badge button */}
            {totalAlerts > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (pendingPayments > 0) setActiveTab('payments');
                  else if (openMaintenance > 0) setActiveTab('maintenance');
                  else if (pendingApps > 0) setActiveTab('applications');
                }}
                className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title={`${totalAlerts} pending actions`}
              >
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow-xs">
                  {totalAlerts}
                </span>
              </button>
            )}

            {/* User profile pill */}
            <div
              onClick={() => setActiveTab('settings')}
              className="flex items-center gap-2.5 pl-2 py-1 pr-3 rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/20"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                  {user?.name?.[0] ?? 'T'}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <span className="text-xs font-bold text-slate-900 block leading-tight truncate max-w-[120px]">
                  {user?.name}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Tenant</span>
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-all cursor-pointer shadow-xs"
              title="Sign out of RentHub"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500 hover:text-rose-600 transition-colors" />
              <span className="hidden sm:inline">{signingOut ? 'Signing out…' : 'Sign Out'}</span>
            </button>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── AIRBNB-INSPIRED HORIZONTAL CATEGORY NAVIGATION BAR ────────── */}
      <nav className="sticky top-16 z-20 bg-white border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-2 overflow-x-auto scrollbar-none">
            {NAV_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>

                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-white text-blue-700'
                          : tab.badgeVariant === 'rose'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : tab.badgeVariant === 'amber'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ── MOBILE SLIDE-DOWN DRAWER ─────────────────────────────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-slate-200 z-20 px-4 py-3 space-y-1"
          >
            {NAV_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-800">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LOADING PROGRESS SHIMMER ────────────────────────────────────── */}
      {isLoading && (
        <div className="h-0.5 bg-slate-200 overflow-hidden">
          <motion.div
            className="h-full bg-blue-600"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          />
        </div>
      )}

      {/* ── MAIN CONTENT WORKSPACE ───────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* STATS OVERVIEW CARDS (Visible on Explore & Resident Hub) */}
        {(activeTab === 'discover' || activeTab === 'tenancy') && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Available Listings"
              value={properties.length}
              sub="Across Kathmandu Valley"
              icon={Building2}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              onClick={() => setActiveTab('discover')}
            />
            <StatCard
              label="Saved Wishlist"
              value={savedIds.length}
              sub="Saved for instant apply"
              icon={Heart}
              iconBg="bg-rose-50"
              iconColor="text-rose-600"
              onClick={() => setActiveTab('saved')}
            />
            <StatCard
              label="My Applications"
              value={applications.length}
              sub={`${pendingApps} pending landlord review`}
              icon={FileText}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
              onClick={() => setActiveTab('applications')}
            />
            <StatCard
              label="Resident Tenancy"
              value={activeLease ? 'Active' : 'No Lease'}
              sub={activeLease ? `${activeLease.propertyTitle} (#${activeLease.unitIdentifier})` : 'Explore available units'}
              icon={Home}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
              onClick={() => setActiveTab('tenancy')}
            />
          </div>
        )}

        {/* PERSONALIZATION BANNER (If questionnaire completed) */}
        {activeTab === 'discover' && userPreferences && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Customized feed for {userPreferences.householdSize} · {userPreferences.budgetBracket}
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Prioritizing {userPreferences.priorityAmenities.length} chosen amenities in Kathmandu Valley
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 self-start sm:self-center"
            >
              Adjust Preferences →
            </button>
          </div>
        )}

        {/* ── TAB VIEWS SWITCHER ─────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {/* 1. DISCOVER / EXPLORE TAB */}
            {activeTab === 'discover' && (
              <div className="space-y-6">
                <PropertySearchBar
                  filters={filters}
                  onChange={(updated) => setFilters((prev) => ({ ...prev, ...updated }))}
                  onOpenFilters={() => setIsFiltersOpen(true)}
                  activeFilterCount={activeFilterCount}
                  viewMode={viewMode}
                  onViewModeChange={(mode) => setViewMode(mode)}
                />

                {/* Results count header */}
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>
                    Showing <strong className="text-slate-900 font-bold">{properties.length}</strong> rental homes
                    {filters.city && filters.city !== 'All' ? ` in ${filters.city}` : ' in Kathmandu Valley'}
                  </span>
                  <span>All prices listed in NPR</span>
                </div>

                {/* View Mode: Map / Split / Grid */}
                {viewMode === 'map' ? (
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
                        centerCoords: prev.centerCoords ?? { latitude: 27.708, longitude: 85.32 },
                      }))
                    }
                    centerCoords={filters.centerCoords}
                    onCenterChange={(coords) => setFilters((prev) => ({ ...prev, centerCoords: coords }))}
                  />
                ) : viewMode === 'split' ? (
                  <div className="grid lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-6 space-y-4 max-h-[800px] overflow-y-auto pr-1">
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
                    <div className="lg:col-span-6 sticky top-28">
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
                            centerCoords: prev.centerCoords ?? { latitude: 27.708, longitude: 85.32 },
                          }))
                        }
                        centerCoords={filters.centerCoords}
                        onCenterChange={(coords) => setFilters((prev) => ({ ...prev, centerCoords: coords }))}
                      />
                    </div>
                  </div>
                ) : properties.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-16 text-center max-w-md mx-auto space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
                      <Compass className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">No Listings Match Filters</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Try broadening your budget range, changing the selected city, or resetting filters.
                    </p>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
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
                          if (avail) setApplyModalData({ property: p, unit: avail });
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 2. SAVED HOMES / WISHLIST */}
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

            {/* 3. APPLICATIONS TRACKING */}
            {activeTab === 'applications' && (
              <ApplicationTrackingView
                applications={applications}
                onRefresh={loadData}
                onOpenLeaseModal={() => setIsLeaseModalOpen(true)}
                onBrowseMore={() => setActiveTab('discover')}
              />
            )}

            {/* 4. RESIDENT HUB (ACTIVE LEASE) */}
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

            {/* 5. RENT & PAYMENTS */}
            {activeTab === 'payments' && (
              <PaymentsView
                payments={payments}
                onOpenPayModal={(pmt) => setSelectedPaymentForPay(pmt)}
                onViewReceipt={(pmt) => setSelectedPaymentForReceipt(pmt)}
              />
            )}

            {/* 6. MAINTENANCE REQUESTS */}
            {activeTab === 'maintenance' && (
              <MaintenanceView
                tickets={maintenanceTickets}
                lease={activeLease}
                onOpenNewTicketModal={() => setIsNewMaintenanceModalOpen(true)}
              />
            )}

            {/* 7. DISPUTES & RESOLUTION */}
            {activeTab === 'disputes' && (
              <DisputesView
                disputes={disputes}
                lease={activeLease}
                onOpenNewDisputeModal={() => setIsNewDisputeModalOpen(true)}
              />
            )}

            {/* 8. SETTINGS & PROFILE */}
            {activeTab === 'settings' && (
              <ProfileSettingsView
                onRetakeOnboarding={() => {
                  window.location.href = '/onboarding/role';
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── MOBILE BOTTOM THUMB NAVIGATION (Fixed at bottom on phones) ─── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-2 px-3 flex items-center justify-around shadow-md">
        {[
          { id: 'discover' as TenantTab, label: 'Explore', icon: Compass },
          { id: 'saved' as TenantTab, label: 'Saved', icon: Heart, badge: savedIds.length },
          { id: 'tenancy' as TenantTab, label: 'Resident', icon: Home },
          { id: 'payments' as TenantTab, label: 'Pay Rent', icon: CreditCard, badge: pendingPayments },
          { id: 'maintenance' as TenantTab, label: 'Repairs', icon: Wrench, badge: openMaintenance },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl relative transition-colors ${
                isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute top-0 right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center">
                  {item.badge}
                </span>
              )}
              <Icon className="w-5 h-5" />
              <span className="text-[10px] leading-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── ALL MODALS ──────────────────────────────────────────────────── */}
      <PropertyFiltersDrawer
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        filters={filters}
        onChange={(updated) => setFilters((prev) => ({ ...prev, ...updated }))}
        onReset={handleResetFilters}
      />
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
      {isLeaseModalOpen && (
        <LeaseAgreementModal
          lease={activeLease}
          onClose={() => setIsLeaseModalOpen(false)}
          onSigned={(updated) => {
            setActiveLease(updated);
          }}
        />
      )}
      {isEarlyTerminationModalOpen && (
        <EarlyTerminationModal
          lease={activeLease}
          onClose={() => setIsEarlyTerminationModalOpen(false)}
          onTerminated={(updated) => {
            setActiveLease(updated);
          }}
        />
      )}
      {selectedPaymentForPay && (
        <PayRentModal
          payment={selectedPaymentForPay}
          onClose={() => setSelectedPaymentForPay(null)}
          onPaymentSuccess={(paid) => {
            setPayments((prev) => prev.map((p) => (p.id === paid.id ? paid : p)));
          }}
        />
      )}
      {selectedPaymentForReceipt && (
        <ReceiptModal
          payment={selectedPaymentForReceipt}
          lease={activeLease}
          onClose={() => setSelectedPaymentForReceipt(null)}
        />
      )}
      {isNewMaintenanceModalOpen && (
        <NewMaintenanceModal
          lease={activeLease}
          onClose={() => setIsNewMaintenanceModalOpen(false)}
          onCreated={(ticket) => {
            setMaintenanceTickets((prev) => [ticket, ...prev]);
          }}
        />
      )}
      {isNewDisputeModalOpen && (
        <NewDisputeModal
          lease={activeLease}
          onClose={() => setIsNewDisputeModalOpen(false)}
          onCreated={(dispute) => {
            setDisputes((prev) => [dispute, ...prev]);
          }}
        />
      )}
    </div>
  );
}
