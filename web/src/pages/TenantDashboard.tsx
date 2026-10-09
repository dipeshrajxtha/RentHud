/**
 * TenantDashboard — Ultra-Premium Dark 3D Design
 *
 * Design Language: Deep navy + electric blue + glassmorphism
 *   - Dark sidebar with glowing active indicator
 *   - Floating 3D stat cards with depth shadows
 *   - Animated gradient mesh background
 *   - Glassmorphism panels with blur layers
 *   - Micro-animations on every interaction
 *   - Floating notification badges
 *
 * All data: real-time from PostgreSQL via tenantService / API
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Bell,
  TrendingUp,
  Building2,
  Star,
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

// ── Floating orb background decoration ──────────────────────────────────────
function GradientOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '-5%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'floatOrb1 18s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '40%',
          right: '-8%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)',
          filter: 'blur(50px)',
          animation: 'floatOrb2 22s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-5%',
          left: '30%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'floatOrb3 26s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes floatOrb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 30px) scale(0.97); }
        }
        @keyframes floatOrb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40% { transform: translate(-40px, 20px) scale(1.08); }
          70% { transform: translate(25px, -35px) scale(0.95); }
        }
        @keyframes floatOrb3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-30px, -25px) scale(1.06); }
        }
      `}</style>
    </div>
  );
}

// ── Quick Stat card (top area) ───────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  delay = 0,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: '20px',
        padding: '20px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
        cursor: 'default',
        transition: 'transform 0.25s cubic-bezier(0.2,0.8,0.2,1), box-shadow 0.25s ease',
      }}
      whileHover={{
        y: -4,
        boxShadow: '0 12px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.10)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(148,163,184,0.9)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {label}
        </span>
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 4px 14px ${color}55`,
          }}
        >
          <Icon style={{ width: '16px', height: '16px', color: 'white' }} />
        </div>
      </div>
      <div style={{ fontSize: '28px', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em', lineHeight: 1 }}>
        {value}
      </div>
    </motion.div>
  );
}

export function TenantDashboard() {
  const { user, accessToken, signOut } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TenantTab>('discover');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Data
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
    centerCoords: { latitude: 27.7080, longitude: 85.3200 },
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

  useEffect(() => { void loadData(); }, [loadData]);

  const handleToggleSave = (id: string) => {
    const isNowSaved = tenantService.toggleSaveProperty(id);
    setSavedIds((prev) => (isNowSaved ? [id, ...prev] : prev.filter((p) => p !== id)));
  };

  const savedProperties = useMemo(() => properties.filter((p) => savedIds.includes(p.id)), [properties, savedIds]);

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

  const handleResetFilters = () => setFilters({
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

  async function handleSignOut() {
    setSigningOut(true);
    try { await signOut(); } finally { navigate('/login', { replace: true }); }
  }

  const userPreferences = tenantService.getPreferences();
  const pendingPayments = payments.filter((p) => p.status === 'PENDING').length;
  const pendingApps = applications.filter((a) => a.status === 'pending').length;
  const openMaintenance = maintenanceTickets.filter((m) => m.status !== 'RESOLVED').length;

  const NAV_ITEMS: { id: TenantTab; label: string; icon: React.ElementType; badge?: number; color: string }[] = [
    { id: 'discover', label: 'Explore Homes', icon: Compass, color: '#3b82f6' },
    { id: 'saved', label: 'Saved Wishlist', icon: Heart, badge: savedIds.length, color: '#ec4899' },
    { id: 'applications', label: 'Applications', icon: FileText, badge: pendingApps, color: '#f59e0b' },
    { id: 'tenancy', label: 'Resident Hub', icon: Home, color: '#10b981' },
    { id: 'payments', label: 'Rent Payments', icon: CreditCard, badge: pendingPayments, color: '#6366f1' },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, badge: openMaintenance, color: '#f97316' },
    { id: 'disputes', label: 'Legal Disputes', icon: Scale, color: '#ef4444' },
    { id: 'settings', label: 'Settings', icon: Settings, color: '#94a3b8' },
  ];

  const SIDEBAR_W = sidebarCollapsed ? '72px' : '240px';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #020617 0%, #0f172a 40%, #0d1b2e 70%, #020917 100%)',
        color: '#e2e8f0',
        fontFamily: "'Inter', sans-serif",
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <GradientOrbs />

      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
      <motion.aside
        animate={{ width: SIDEBAR_W }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(2,6,23,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '4px 0 40px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}
        className="hidden lg:flex"
      >
        {/* Logo area */}
        <div
          style={{
            padding: sidebarCollapsed ? '20px 16px' : '24px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'space-between',
            minHeight: '72px',
          }}
        >
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <RentHubLogo variant="original" className="h-7" style={{ filter: 'brightness(0) invert(1)' }} />
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  background: 'linear-gradient(135deg, #60a5fa, #818cf8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  paddingTop: '2px',
                }}
              >
                Tenant
              </span>
            </motion.div>
          )}
          {sidebarCollapsed && (
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(59,130,246,0.35)',
              }}
            >
              <Building2 style={{ width: '16px', height: '16px', color: 'white' }} />
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed((v) => !v)}
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.10)',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
          >
            {sidebarCollapsed ? <ChevronRight style={{ width: '13px', height: '13px' }} /> : <ChevronLeft style={{ width: '13px', height: '13px' }} />}
          </button>
        </div>

        {/* User card */}
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              margin: '16px 14px',
              padding: '14px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.10))',
              border: '1px solid rgba(59,130,246,0.20)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
            }}
            onClick={() => setActiveTab('settings')}
          >
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(59,130,246,0.4)' }} />
              ) : (
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(59,130,246,0.4)',
                  }}
                >
                  {user?.name?.[0] ?? 'T'}
                </div>
              )}
              <span style={{ position: 'absolute', bottom: '0', right: '0', width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', border: '2px solid #020617' }} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: '10px', color: 'rgba(148,163,184,0.7)', fontWeight: 500 }}>Kathmandu, NP</div>
            </div>
            <div style={{ flexShrink: 0 }}>
              <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em', padding: '3px 7px', borderRadius: '20px', background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.35)', color: '#93c5fd' }}>
                TENANT
              </span>
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <nav style={{ flex: 1, padding: sidebarCollapsed ? '8px 10px' : '8px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {NAV_ITEMS.map((item, i) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: sidebarCollapsed ? '11px' : '11px 14px',
                  borderRadius: '14px',
                  border: '1px solid transparent',
                  cursor: 'pointer',
                  background: isActive
                    ? `linear-gradient(135deg, ${item.color}22, ${item.color}11)`
                    : 'transparent',
                  borderColor: isActive ? `${item.color}35` : 'transparent',
                  boxShadow: isActive ? `0 4px 16px ${item.color}22, inset 0 1px 0 ${item.color}18` : 'none',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  position: 'relative',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  overflow: 'visible',
                }}
                whileHover={!isActive ? {
                  background: 'rgba(255,255,255,0.05)',
                  borderColor: 'rgba(255,255,255,0.08)',
                } : {}}
              >
                {/* Active left accent line */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    style={{
                      position: 'absolute',
                      left: '-12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '4px',
                      height: '22px',
                      borderRadius: '2px',
                      background: item.color,
                      boxShadow: `0 0 8px ${item.color}`,
                    }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                  />
                )}
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: isActive ? item.color : 'rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: isActive ? `0 4px 12px ${item.color}55` : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  <Icon style={{ width: '15px', height: '15px', color: isActive ? 'white' : 'rgba(148,163,184,0.7)' }} />
                </div>
                {!sidebarCollapsed && (
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#f1f5f9' : 'rgba(148,163,184,0.8)',
                      whiteSpace: 'nowrap',
                      flex: 1,
                      textAlign: 'left',
                    }}
                  >
                    {item.label}
                  </span>
                )}
                {!sidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{
                      minWidth: '20px',
                      height: '20px',
                      borderRadius: '10px',
                      background: item.color,
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 5px',
                      boxShadow: `0 0 8px ${item.color}80`,
                    }}
                  >
                    {item.badge}
                  </motion.span>
                )}
                {sidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: item.color,
                      fontSize: '9px',
                      fontWeight: 800,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 0 6px ${item.color}`,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Sign out */}
        <div style={{ padding: sidebarCollapsed ? '12px 10px' : '12px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: sidebarCollapsed ? '10px' : '10px 14px',
              borderRadius: '12px',
              border: '1px solid rgba(239,68,68,0.20)',
              background: 'rgba(239,68,68,0.08)',
              color: 'rgba(252,165,165,0.85)',
              cursor: 'pointer',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              transition: 'all 0.2s',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <LogOut style={{ width: '15px', height: '15px', flexShrink: 0 }} />
            {!sidebarCollapsed && <span>{signingOut ? 'Signing out…' : 'Sign Out'}</span>}
          </button>
        </div>
      </motion.aside>

      {/* ── MAIN CONTENT AREA ───────────────────────────────────────────── */}
      <motion.div
        animate={{ marginLeft: SIDEBAR_W }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative', zIndex: 1 }}
        className="hidden lg:flex"
      >
        {/* Top bar */}
        <header
          style={{
            height: '72px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
            background: 'rgba(2,6,23,0.70)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}
        >
          {/* Page title */}
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
              {NAV_ITEMS.find((n) => n.id === activeTab)?.label ?? 'Dashboard'}
            </h1>
            <p style={{ fontSize: '11px', color: 'rgba(148,163,184,0.6)', marginTop: '2px' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Loading pulse */}
            {isLoading && (
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 8px #3b82f6', animation: 'pulse 1s infinite' }} />
            )}

            {/* Bell with pending count */}
            {(pendingPayments + pendingApps + openMaintenance) > 0 && (
              <button
                style={{
                  position: 'relative',
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <Bell style={{ width: '17px', height: '17px' }} />
                <span style={{ position: 'absolute', top: '6px', right: '6px', width: '16px', height: '16px', borderRadius: '50%', background: '#ef4444', fontSize: '9px', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 6px #ef4444' }}>
                  {pendingPayments + pendingApps + openMaintenance}
                </span>
              </button>
            )}

            {/* Avatar */}
            <button
              onClick={() => setActiveTab('settings')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '6px 12px 6px 6px',
                borderRadius: '40px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.10)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: 'white', fontWeight: 800, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {user?.name?.[0] ?? 'T'}
                </div>
              )}
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>{user?.name?.split(' ')[0]}</span>
            </button>
          </div>
        </header>

        {/* Loading bar */}
        {isLoading && (
          <div style={{ height: '2px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden', flexShrink: 0 }}>
            <motion.div
              style={{ height: '100%', background: 'linear-gradient(90deg, transparent, #3b82f6, #6366f1, transparent)' }}
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
            />
          </div>
        )}

        {/* Stats row — shown only on discover/tenancy */}
        <AnimatePresence>
          {(activeTab === 'discover' || activeTab === 'tenancy') && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', padding: '24px 32px 0' }}
            >
              <StatCard label="Properties" value={properties.length} icon={Building2} color="linear-gradient(135deg,#3b82f6,#6366f1)" delay={0} />
              <StatCard label="Saved Homes" value={savedIds.length} icon={Heart} color="linear-gradient(135deg,#ec4899,#f43f5e)" delay={0.06} />
              <StatCard label="Active Lease" value={activeLease ? '1' : '—'} icon={Home} color="linear-gradient(135deg,#10b981,#059669)" delay={0.12} />
              <StatCard label="Pending Payments" value={pendingPayments} icon={CreditCard} color="linear-gradient(135deg,#f59e0b,#f97316)" delay={0.18} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content scroll area */}
        <main style={{ flex: 1, padding: '24px 32px 40px', overflowY: 'auto' }}>
          {/* Preferences banner */}
          {activeTab === 'discover' && userPreferences && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginBottom: '20px',
                padding: '14px 18px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(99,102,241,0.08))',
                border: '1px solid rgba(59,130,246,0.20)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(59,130,246,0.35)', flexShrink: 0 }}>
                  <Sparkles style={{ width: '16px', height: '16px', color: 'white' }} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0' }}>
                    Personalized for {userPreferences.householdSize} · {userPreferences.budgetBracket}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(148,163,184,0.7)', marginTop: '1px' }}>
                    Prioritizing {userPreferences.priorityAmenities.length} selected amenities in Kathmandu Valley
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('settings')}
                style={{ fontSize: '12px', fontWeight: 700, color: '#60a5fa', whiteSpace: 'nowrap', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Adjust →
              </button>
            </motion.div>
          )}

          {/* Results count for discover */}
          {activeTab === 'discover' && (
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: 'rgba(148,163,184,0.7)' }}>
                Showing <strong style={{ color: '#e2e8f0', fontWeight: 700 }}>{properties.length}</strong> rental properties
                {filters.city && filters.city !== 'All' ? ` in ${filters.city}` : ' in Kathmandu Valley'}
                {filters.radiusKm && <span style={{ color: '#60a5fa', fontWeight: 600 }}> · within {filters.radiusKm} km</span>}
              </span>
              <span style={{ fontSize: '11px', color: 'rgba(148,163,184,0.5)' }}>All prices in NPR</span>
            </div>
          )}

          {/* ── TAB CONTENT ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* DISCOVER */}
              {activeTab === 'discover' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <PropertySearchBar
                    filters={filters}
                    onChange={(updated) => setFilters((prev) => ({ ...prev, ...updated }))}
                    onOpenFilters={() => setIsFiltersOpen(true)}
                    activeFilterCount={activeFilterCount}
                    viewMode={viewMode}
                    onViewModeChange={(mode) => setViewMode(mode)}
                  />
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
                      onRadiusChange={(km) => setFilters((prev) => ({ ...prev, radiusKm: km, centerCoords: prev.centerCoords ?? { latitude: 27.7080, longitude: 85.3200 } }))}
                      centerCoords={filters.centerCoords}
                      onCenterChange={(coords) => setFilters((prev) => ({ ...prev, centerCoords: coords }))}
                    />
                  ) : viewMode === 'split' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: '20px', alignItems: 'start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '750px', overflowY: 'auto', paddingRight: '4px' }}>
                        {properties.map((property) => (
                          <PropertyCard key={property.id} property={property} isSaved={savedIds.includes(property.id)} onToggleSave={handleToggleSave} onSelect={(p) => setSelectedPropertyDetails(p)} onApply={(p) => { const avail = p.units.find((u) => u.availabilityStatus === 'AVAILABLE') || p.units[0]; if (avail) setApplyModalData({ property: p, unit: avail }); }} />
                        ))}
                      </div>
                      <div style={{ position: 'sticky', top: '20px' }}>
                        <PropertyMapView
                          properties={properties}
                          selectedPropertyId={selectedPropertyDetails?.id}
                          onSelectProperty={(p) => setSelectedPropertyDetails(p)}
                          onApplyProperty={(p) => { const avail = p.units.find((u) => u.availabilityStatus === 'AVAILABLE') || p.units[0]; if (avail) setApplyModalData({ property: p, unit: avail }); }}
                          radiusKm={filters.radiusKm ?? 10}
                          onRadiusChange={(km) => setFilters((prev) => ({ ...prev, radiusKm: km, centerCoords: prev.centerCoords ?? { latitude: 27.7080, longitude: 85.3200 } }))}
                          centerCoords={filters.centerCoords}
                          onCenterChange={(coords) => setFilters((prev) => ({ ...prev, centerCoords: coords }))}
                        />
                      </div>
                    </div>
                  ) : properties.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <Compass style={{ width: '24px', height: '24px', color: '#60a5fa' }} />
                      </div>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px' }}>No Listings Match Filters</h3>
                      <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.7)', marginBottom: '20px' }}>Try broadening your budget range or resetting filters.</p>
                      <button onClick={handleResetFilters} style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(59,130,246,0.35)' }}>
                        Reset Filters
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                      {properties.map((property) => (
                        <PropertyCard key={property.id} property={property} isSaved={savedIds.includes(property.id)} onToggleSave={handleToggleSave} onSelect={(p) => setSelectedPropertyDetails(p)} onApply={(p) => { const avail = p.units.find((u) => u.availabilityStatus === 'AVAILABLE') || p.units[0]; if (avail) setApplyModalData({ property: p, unit: avail }); }} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'saved' && (
                <SavedPropertiesView savedProperties={savedProperties} onToggleSave={handleToggleSave} onSelectProperty={(p) => setSelectedPropertyDetails(p)} onApplyProperty={(p) => { const avail = p.units.find((u) => u.availabilityStatus === 'AVAILABLE') || p.units[0]; if (avail) setApplyModalData({ property: p, unit: avail }); }} onBrowseMore={() => setActiveTab('discover')} />
              )}

              {activeTab === 'applications' && (
                <ApplicationTrackingView applications={applications} onRefresh={loadData} onOpenLeaseModal={() => setIsLeaseModalOpen(true)} onBrowseMore={() => setActiveTab('discover')} />
              )}

              {activeTab === 'tenancy' && (
                <TenancyDashboardView lease={activeLease} payments={payments} maintenanceTickets={maintenanceTickets} onOpenLeaseModal={() => setIsLeaseModalOpen(true)} onOpenPayRentModal={() => { const pending = payments.find((p) => p.status === 'PENDING') || payments[0]; if (pending) setSelectedPaymentForPay(pending); }} onOpenMaintenanceModal={() => setIsNewMaintenanceModalOpen(true)} onOpenDisputeModal={() => setIsNewDisputeModalOpen(true)} onOpenEarlyTerminationModal={() => setIsEarlyTerminationModalOpen(true)} onBrowseListings={() => setActiveTab('discover')} />
              )}

              {activeTab === 'payments' && (
                <PaymentsView payments={payments} onOpenPayModal={(pmt) => setSelectedPaymentForPay(pmt)} onViewReceipt={(pmt) => setSelectedPaymentForReceipt(pmt)} />
              )}

              {activeTab === 'maintenance' && (
                <MaintenanceView tickets={maintenanceTickets} lease={activeLease} onOpenNewTicketModal={() => setIsNewMaintenanceModalOpen(true)} />
              )}

              {activeTab === 'disputes' && (
                <DisputesView disputes={disputes} lease={activeLease} onOpenNewDisputeModal={() => setIsNewDisputeModalOpen(true)} />
              )}

              {activeTab === 'settings' && (
                <ProfileSettingsView onRetakeOnboarding={() => { window.location.href = '/onboarding/role'; }} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </motion.div>

      {/* ── MOBILE LAYOUT ───────────────────────────────────────────────── */}
      <div className="lg:hidden" style={{ width: '100%', display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
        {/* Mobile header */}
        <header
          style={{
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            background: 'rgba(2,6,23,0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}
        >
          <RentHubLogo variant="original" className="h-6" style={{ filter: 'brightness(0) invert(1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isLoading && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 6px #3b82f6', animation: 'pulse 1s infinite' }} />}
            <button onClick={() => setMobileMenuOpen((v) => !v)} style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.10)', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              {mobileMenuOpen ? <X style={{ width: '17px', height: '17px' }} /> : <Menu style={{ width: '17px', height: '17px' }} />}
            </button>
          </div>
        </header>

        {/* Mobile slide-down nav */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ background: 'rgba(2,6,23,0.97)', borderBottom: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', zIndex: 25, position: 'sticky', top: '60px' }}
            >
              <div style={{ padding: '12px' }}>
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderRadius: '12px', marginBottom: '4px', background: isActive ? `${item.color}18` : 'transparent', border: `1px solid ${isActive ? item.color + '30' : 'transparent'}`, cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: isActive ? item.color : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon style={{ width: '14px', height: '14px', color: isActive ? 'white' : 'rgba(148,163,184,0.7)' }} />
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: isActive ? 700 : 500, color: isActive ? '#f1f5f9' : 'rgba(148,163,184,0.8)' }}>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span style={{ minWidth: '20px', height: '20px', borderRadius: '10px', background: item.color, color: 'white', fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>{item.badge}</span>
                      )}
                    </button>
                  );
                })}
                <button
                  onClick={() => { setMobileMenuOpen(false); void handleSignOut(); }}
                  disabled={signingOut}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', borderRadius: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', color: 'rgba(252,165,165,0.85)', cursor: 'pointer', marginTop: '8px', fontSize: '13px', fontWeight: 600 }}
                >
                  <LogOut style={{ width: '14px', height: '14px' }} />
                  <span>{signingOut ? 'Signing out…' : 'Sign Out'}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile main */}
        <main style={{ flex: 1, padding: '16px 16px 80px' }}>
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {activeTab === 'discover' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <PropertySearchBar filters={filters} onChange={(u) => setFilters((prev) => ({ ...prev, ...u }))} onOpenFilters={() => setIsFiltersOpen(true)} activeFilterCount={activeFilterCount} viewMode={viewMode} onViewModeChange={setViewMode} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {properties.map((p) => (
                      <PropertyCard key={p.id} property={p} isSaved={savedIds.includes(p.id)} onToggleSave={handleToggleSave} onSelect={(prop) => setSelectedPropertyDetails(prop)} onApply={(prop) => { const avail = prop.units.find((u) => u.availabilityStatus === 'AVAILABLE') || prop.units[0]; if (avail) setApplyModalData({ property: prop, unit: avail }); }} />
                    ))}
                  </div>
                </div>
              )}
              {activeTab === 'saved' && <SavedPropertiesView savedProperties={savedProperties} onToggleSave={handleToggleSave} onSelectProperty={(p) => setSelectedPropertyDetails(p)} onApplyProperty={(p) => { const avail = p.units.find((u) => u.availabilityStatus === 'AVAILABLE') || p.units[0]; if (avail) setApplyModalData({ property: p, unit: avail }); }} onBrowseMore={() => setActiveTab('discover')} />}
              {activeTab === 'applications' && <ApplicationTrackingView applications={applications} onRefresh={loadData} onOpenLeaseModal={() => setIsLeaseModalOpen(true)} onBrowseMore={() => setActiveTab('discover')} />}
              {activeTab === 'tenancy' && <TenancyDashboardView lease={activeLease} payments={payments} maintenanceTickets={maintenanceTickets} onOpenLeaseModal={() => setIsLeaseModalOpen(true)} onOpenPayRentModal={() => { const pending = payments.find((p) => p.status === 'PENDING') || payments[0]; if (pending) setSelectedPaymentForPay(pending); }} onOpenMaintenanceModal={() => setIsNewMaintenanceModalOpen(true)} onOpenDisputeModal={() => setIsNewDisputeModalOpen(true)} onOpenEarlyTerminationModal={() => setIsEarlyTerminationModalOpen(true)} onBrowseListings={() => setActiveTab('discover')} />}
              {activeTab === 'payments' && <PaymentsView payments={payments} onOpenPayModal={setSelectedPaymentForPay} onViewReceipt={setSelectedPaymentForReceipt} />}
              {activeTab === 'maintenance' && <MaintenanceView tickets={maintenanceTickets} lease={activeLease} onOpenNewTicketModal={() => setIsNewMaintenanceModalOpen(true)} />}
              {activeTab === 'disputes' && <DisputesView disputes={disputes} lease={activeLease} onOpenNewDisputeModal={() => setIsNewDisputeModalOpen(true)} />}
              {activeTab === 'settings' && <ProfileSettingsView onRetakeOnboarding={() => { window.location.href = '/onboarding/role'; }} />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mobile bottom nav */}
        <nav
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 30,
            background: 'rgba(2,6,23,0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            padding: '8px 4px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
          }}
        >
          {[
            { id: 'discover' as TenantTab, label: 'Explore', icon: Compass, color: '#3b82f6' },
            { id: 'saved' as TenantTab, label: 'Saved', icon: Heart, color: '#ec4899', badge: savedIds.length },
            { id: 'tenancy' as TenantTab, label: 'Tenancy', icon: Home, color: '#10b981' },
            { id: 'payments' as TenantTab, label: 'Pay Rent', icon: CreditCard, color: '#6366f1', badge: pendingPayments },
            { id: 'maintenance' as TenantTab, label: 'Repairs', icon: Wrench, color: '#f97316', badge: openMaintenance },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '12px', background: isActive ? `${item.color}20` : 'transparent', border: 'none', cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}
              >
                {item.badge !== undefined && item.badge > 0 && (
                  <span style={{ position: 'absolute', top: '2px', right: '8px', width: '14px', height: '14px', borderRadius: '50%', background: item.color, fontSize: '8px', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.badge}</span>
                )}
                <Icon style={{ width: '18px', height: '18px', color: isActive ? item.color : 'rgba(100,116,139,0.7)' }} />
                <span style={{ fontSize: '9px', fontWeight: isActive ? 700 : 500, color: isActive ? item.color : 'rgba(100,116,139,0.7)' }}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── ALL MODALS ──────────────────────────────────────────────────── */}
      <PropertyFiltersDrawer isOpen={isFiltersOpen} onClose={() => setIsFiltersOpen(false)} filters={filters} onChange={(updated) => setFilters((prev) => ({ ...prev, ...updated }))} onReset={handleResetFilters} />
      <PropertyDetailsModal property={selectedPropertyDetails} onClose={() => setSelectedPropertyDetails(null)} isSaved={selectedPropertyDetails ? savedIds.includes(selectedPropertyDetails.id) : false} onToggleSave={handleToggleSave} onSelectUnitToApply={(property, unit) => { setSelectedPropertyDetails(null); setApplyModalData({ property, unit }); }} />
      {applyModalData && <RentalApplicationModal property={applyModalData.property} selectedUnit={applyModalData.unit} accessToken={accessToken} onClose={() => setApplyModalData(null)} onApplicationSubmitted={(newApp) => { setApplications((prev) => [newApp, ...prev.filter((a) => a.id !== newApp.id)]); }} />}
      {isLeaseModalOpen && <LeaseAgreementModal lease={activeLease} onClose={() => setIsLeaseModalOpen(false)} onSigned={(updated) => { setActiveLease(updated); }} />}
      {isEarlyTerminationModalOpen && <EarlyTerminationModal lease={activeLease} onClose={() => setIsEarlyTerminationModalOpen(false)} onTerminated={(updated) => { setActiveLease(updated); }} />}
      {selectedPaymentForPay && <PayRentModal payment={selectedPaymentForPay} onClose={() => setSelectedPaymentForPay(null)} onPaymentSuccess={(paid) => { setPayments((prev) => prev.map((p) => (p.id === paid.id ? paid : p))); }} />}
      {selectedPaymentForReceipt && <ReceiptModal payment={selectedPaymentForReceipt} lease={activeLease} onClose={() => setSelectedPaymentForReceipt(null)} />}
      {isNewMaintenanceModalOpen && <NewMaintenanceModal lease={activeLease} onClose={() => setIsNewMaintenanceModalOpen(false)} onCreated={(ticket) => { setMaintenanceTickets((prev) => [ticket, ...prev]); }} />}
      {isNewDisputeModalOpen && <NewDisputeModal lease={activeLease} onClose={() => setIsNewDisputeModalOpen(false)} onCreated={(dispute) => { setDisputes((prev) => [dispute, ...prev]); }} />}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
