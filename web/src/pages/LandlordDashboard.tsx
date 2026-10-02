/**
 * LandlordDashboard (Shell)
 *
 * Full-fidelity Landlord Portal shell:
 *  - Sidebar navigation with notification badges (pending apps, unsigned leases, open maintenance)
 *  - Routes between: Overview, Properties, Applications, Leases, Financials, Maintenance, Disputes, Settings
 *  - All data fetched from the real backend via landlordService
 *  - Dual-role view switcher passed in from DashboardPage
 *  - Orchestrates property/unit modals at top level so PropertiesListView stays decoupled
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from '@/features/auth/AuthContext';
import { landlordService } from '@/features/landlord/landlord.service';
import type { LandlordTab } from '@/features/landlord/components/LandlordSidebar';
import { LandlordSidebar } from '@/features/landlord/components/LandlordSidebar';
import { LandlordOverviewView } from '@/features/landlord/components/LandlordOverviewView';
import { PropertiesListView } from '@/features/landlord/components/PropertiesListView';
import { ApplicationReviewView } from '@/features/landlord/components/ApplicationReviewView';
import { LandlordLeasesView } from '@/features/landlord/components/LandlordLeasesView';
import { FinancialsLedgerView } from '@/features/landlord/components/FinancialsLedgerView';
import { MaintenanceBoardView } from '@/features/landlord/components/MaintenanceBoardView';
import { LandlordDisputesView } from '@/features/landlord/components/LandlordDisputesView';
import { LandlordSettingsView } from '@/features/landlord/components/LandlordSettingsView';
import { AddPropertyModal } from '@/features/landlord/components/AddPropertyModal';
import { EditPropertyModal } from '@/features/landlord/components/EditPropertyModal';
import { AddOrEditUnitModal } from '@/features/landlord/components/AddOrEditUnitModal';
import type {
  LandlordProperty,
  LandlordApplication,
  LandlordLease,
  LandlordMaintenanceTicket,
  LandlordDispute,
  LandlordUnit,
  CreatePropertyDto,
  CreateUnitDto,
  UpdatePropertyDto,
  UpdateUnitDto,
} from '@/types/landlord';
import { Menu, X, Home } from 'lucide-react';

interface LandlordDashboardProps {
  onSwitchView?: (view: 'landlord' | 'tenant') => void;
}

// ── Mock maintenance data (no backend table yet — plan §Module 7) ──────────
const MOCK_MAINTENANCE: LandlordMaintenanceTicket[] = [
  {
    id: 'm1', tenancyId: 't1', propertyTitle: 'Sunrise Apartments 3B',
    unitIdentifier: 'Unit 302', category: 'Plumbing', urgency: 'Emergency',
    title: 'Burst water pipe in bathroom', description: 'Water leaking heavily from the pipe under the bathroom sink. Needs immediate attention.',
    status: 'Reported', reportedBy: 'Aarav Sharma', createdAt: '2026-09-30T08:22:00Z',
  },
  {
    id: 'm2', tenancyId: 't2', propertyTitle: 'Lakeside Flat 2F',
    unitIdentifier: 'Unit F1', category: 'Electrical', urgency: 'High',
    title: 'Power outage in kitchen', description: 'All kitchen outlets stopped working. Circuit breaker trips when microwave is used.',
    status: 'Scheduled', reportedBy: 'Priya Thapa', assignedContractor: 'Bijay Electricals',
    scheduledDate: '2026-10-04', createdAt: '2026-09-29T14:00:00Z',
  },
  {
    id: 'm3', tenancyId: 't1', propertyTitle: 'Sunrise Apartments 3B',
    unitIdentifier: 'Unit 201', category: 'Carpentry & Locks', urgency: 'Normal',
    title: 'Main door lock broken', description: 'Door lock is stiff and sometimes does not open with the key.',
    status: 'In Progress', reportedBy: 'Sunita Karki', assignedContractor: 'Ram Carpenter',
    createdAt: '2026-09-28T10:00:00Z',
  },
];

export function LandlordDashboard({ onSwitchView }: LandlordDashboardProps = {}) {
  const { user, accessToken, signOut } = useAuth();
  const hasTenantRole = user?.roles.includes('tenant') ?? false;

  // ── Navigation state ────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<LandlordTab>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // ── Data state ──────────────────────────────────────────────────────────
  const [properties, setProperties] = useState<LandlordProperty[]>([]);
  const [applications, setApplications] = useState<LandlordApplication[]>([]);
  const [leases, setLeases] = useState<LandlordLease[]>([]);
  const [maintenance] = useState<LandlordMaintenanceTicket[]>(MOCK_MAINTENANCE);
  const [disputes, setDisputes] = useState<LandlordDispute[]>([]);
  const [loadingProps, setLoadingProps] = useState(true);
  const [loadingLeases, setLoadingLeases] = useState(true);
  const [loadingDisputes, setLoadingDisputes] = useState(true);

  // ── Modal state (orchestrated here, delegated to child modals) ──────────
  const [addPropertyOpen, setAddPropertyOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<LandlordProperty | null>(null);
  const [addUnitForProperty, setAddUnitForProperty] = useState<LandlordProperty | null>(null);
  const [editUnitCtx, setEditUnitCtx] = useState<{ property: LandlordProperty; unit: LandlordUnit } | null>(null);

  // ── Toast ──────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ msg, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 3500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // ── Sign out ───────────────────────────────────────────────────────────
  const [signingOut, setSigningOut] = useState(false);
  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
  }

  // ── Data loaders ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) return;
    setLoadingProps(true);
    landlordService.getMyProperties(accessToken)
      .then(setProperties)
      .catch(() => {})
      .finally(() => setLoadingProps(false));
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    landlordService.getApplications(accessToken)
      .then(setApplications)
      .catch(() => {});
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    setLoadingLeases(true);
    landlordService.getLeases(accessToken)
      .then(setLeases)
      .catch(() => {})
      .finally(() => setLoadingLeases(false));
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    setLoadingDisputes(true);
    landlordService.getDisputes(accessToken)
      .then(setDisputes)
      .catch(() => {})
      .finally(() => setLoadingDisputes(false));
  }, [accessToken]);

  // ── Derived badge counts ────────────────────────────────────────────────
  const pendingAppsCount = applications.filter((a) => a.status === 'pending').length;
  const unsignedLeasesCount = leases.filter(
    (l) => l.status === 'pending_signature' && !l.landlordSignedAt
  ).length;
  const openMaintenanceCount = maintenance.filter((m) => m.status !== 'Resolved').length;

  // ── Application handlers ────────────────────────────────────────────────
  const handleApproveApp = useCallback(async (appId: string) => {
    if (!accessToken) return;
    const targetApp = applications.find((a) => a.id === appId);
    if (!targetApp) return;

    // Guard against overbooking a unit or property without capacity
    const prop = properties.find((p) => p.id === targetApp.property?.id);
    if (prop) {
      const targetUnit = prop.units?.find((u) => u.id === targetApp.unitId);
      if (targetUnit && targetUnit.availabilityStatus !== 'AVAILABLE') {
        showToast(
          `Unit ${targetUnit.unitIdentifier} is already ${targetUnit.availabilityStatus.toLowerCase().replace('_', ' ')}`,
          'error'
        );
        return;
      }
      if (prop.availableUnitsCount <= 0 && (!targetUnit || targetUnit.availabilityStatus !== 'AVAILABLE')) {
        showToast('Cannot approve: this property has no remaining available unit capacity', 'error');
        return;
      }
    }

    await landlordService.approveApplication(appId, accessToken);
    setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, status: 'approved' } : a)));

    // Refresh properties and leases so occupancy counts and unit reserved badges update immediately
    const [updatedProps, updatedLeases] = await Promise.all([
      landlordService.getMyProperties(accessToken).catch(() => null),
      landlordService.getLeases(accessToken).catch(() => null),
    ]);
    if (updatedProps) setProperties(updatedProps);
    if (updatedLeases) setLeases(updatedLeases);

    showToast('✓ Application approved — draft lease created');
  }, [accessToken, applications, properties, showToast]);

  const handleRejectApp = useCallback(async (appId: string) => {
    if (!accessToken) return;
    await landlordService.rejectApplication(appId, accessToken);
    setApplications((prev) => prev.map((a) => a.id === appId ? { ...a, status: 'rejected' } : a));
    showToast('Application rejected');
  }, [accessToken, showToast]);

  // ── Lease handlers ─────────────────────────────────────────────────────
  const handleSignLease = useCallback(async (leaseId: string) => {
    if (!accessToken) return;
    const updated = await landlordService.signLease(leaseId, accessToken);
    setLeases((prev) => prev.map((l) => l.id === leaseId ? { ...l, ...updated } : l));
    showToast('✓ Lease signed — tenancy is now active');
  }, [accessToken, showToast]);

  const handleTerminateLease = useCallback(async (leaseId: string, reasonCode: string, narrative: string) => {
    if (!accessToken) return;
    const updated = await landlordService.terminateLease(leaseId, reasonCode, narrative, accessToken);
    setLeases((prev) => prev.map((l) => l.id === leaseId ? { ...l, ...updated } : l));
    showToast('Lease terminated');
  }, [accessToken, showToast]);

  // ── Property handlers ──────────────────────────────────────────────────
  const handleAddPropertySubmit = useCallback(async (dto: CreatePropertyDto, unitDtos: CreateUnitDto[]) => {
    if (!accessToken) return;
    const created = await landlordService.createProperty(dto, accessToken);
    // Create units sequentially
    for (const u of unitDtos) {
      await landlordService.createUnit(created.id, u, accessToken);
    }
    // Refresh full property list to get all unit data
    const updated = await landlordService.getMyProperties(accessToken);
    setProperties(updated);
    setAddPropertyOpen(false);
    showToast(`✓ "${created.title}" listed successfully`);
  }, [accessToken, showToast]);

  const handleEditPropertySubmit = useCallback(async (propertyId: string, dto: UpdatePropertyDto) => {
    if (!accessToken) return;
    const updated = await landlordService.updateProperty(propertyId, dto, accessToken);
    setProperties((prev) => prev.map((p) => p.id === propertyId ? { ...p, ...updated } : p));
    setEditingProperty(null);
    showToast('✓ Property updated');
  }, [accessToken, showToast]);

  const handleDeleteProperty = useCallback(async (propertyId: string) => {
    if (!accessToken) return;
    await landlordService.deleteProperty(propertyId, accessToken);
    setProperties((prev) => prev.filter((p) => p.id !== propertyId));
    showToast('Property removed');
  }, [accessToken, showToast]);

  // ── Unit handlers ──────────────────────────────────────────────────────
  const handleAddUnitSubmit = useCallback(async (dto: CreateUnitDto | UpdateUnitDto) => {
    if (!accessToken || !addUnitForProperty) return;
    await landlordService.createUnit(addUnitForProperty.id, dto as CreateUnitDto, accessToken);
    const updated = await landlordService.getMyProperties(accessToken);
    setProperties(updated);
    setAddUnitForProperty(null);
    showToast('✓ Unit added');
  }, [accessToken, addUnitForProperty, showToast]);

  const handleEditUnitSubmit = useCallback(async (dto: CreateUnitDto | UpdateUnitDto) => {
    if (!accessToken || !editUnitCtx) return;
    await landlordService.updateUnit(editUnitCtx.property.id, editUnitCtx.unit.id, dto as UpdateUnitDto, accessToken);
    const updated = await landlordService.getMyProperties(accessToken);
    setProperties(updated);
    setEditUnitCtx(null);
    showToast('✓ Unit updated');
  }, [accessToken, editUnitCtx, showToast]);

  const handleDeleteUnit = useCallback(async (propertyId: string, unitId: string) => {
    if (!accessToken) return;
    await landlordService.deleteUnit(propertyId, unitId, accessToken);
    const updated = await landlordService.getMyProperties(accessToken);
    setProperties(updated);
    showToast('Unit removed');
  }, [accessToken, showToast]);

  // ── Render active view ─────────────────────────────────────────────────
  function renderView() {
    switch (activeTab) {
      case 'overview':
        return (
          <LandlordOverviewView
            properties={properties}
            applications={applications}
            leases={leases}
            maintenanceTickets={maintenance}
            onNavigateTab={setActiveTab}
            onOpenAddProperty={() => setAddPropertyOpen(true)}
            onReviewApplication={() => setActiveTab('applications')}
            onOpenLeaseModal={() => setActiveTab('leases')}
          />
        );
      case 'properties':
        return (
          <PropertiesListView
            properties={properties}
            onOpenAddProperty={() => setAddPropertyOpen(true)}
            onOpenEditProperty={(p) => setEditingProperty(p)}
            onOpenAddUnit={(p) => setAddUnitForProperty(p)}
            onOpenEditUnit={(p, u) => setEditUnitCtx({ property: p, unit: u })}
            onDeleteProperty={handleDeleteProperty}
            onDeleteUnit={handleDeleteUnit}
          />
        );
      case 'applications':
        return (
          <ApplicationReviewView
            applications={applications}
            onApprove={handleApproveApp}
            onReject={handleRejectApp}
            onViewLeases={() => setActiveTab('leases')}
          />
        );
      case 'leases':
        return (
          <LandlordLeasesView
            leases={leases}
            loading={loadingLeases}
            onSignLease={handleSignLease}
            onTerminateLease={handleTerminateLease}
          />
        );
      case 'financials':
        return (
          <FinancialsLedgerView
            properties={properties}
            leases={leases}
            loading={loadingProps || loadingLeases}
          />
        );
      case 'maintenance':
        return (
          <MaintenanceBoardView
            tickets={maintenance}
            showToast={showToast}
          />
        );
      case 'disputes':
        return (
          <LandlordDisputesView
            disputes={disputes}
            loading={loadingDisputes}
          />
        );
      case 'settings':
        return (
          <LandlordSettingsView
            accessToken={accessToken ?? ''}
            showToast={showToast}
            onSwitchView={onSwitchView}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ── Desktop Sidebar ──────────────────────────────────────────────── */}
      <LandlordSidebar
        activeTab={activeTab}
        onSelectTab={(tab) => { setActiveTab(tab); setMobileSidebarOpen(false); }}
        pendingAppsCount={pendingAppsCount}
        openMaintenanceCount={openMaintenanceCount}
        unsignedLeasesCount={unsignedLeasesCount}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        onSwitchView={onSwitchView}
        onSignOut={handleSignOut}
        isSigningOut={signingOut}
      />

      {/* ── Mobile Sidebar Drawer ────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed left-0 top-0 bottom-0 z-50 md:hidden"
            >
              <LandlordSidebar
                activeTab={activeTab}
                onSelectTab={(tab) => { setActiveTab(tab); setMobileSidebarOpen(false); }}
                pendingAppsCount={pendingAppsCount}
                openMaintenanceCount={openMaintenanceCount}
                unsignedLeasesCount={unsignedLeasesCount}
                collapsed={false}
                onToggleCollapse={() => setMobileSidebarOpen(false)}
                onSwitchView={onSwitchView}
                onSignOut={handleSignOut}
                isSigningOut={signingOut}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content Area ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-slate-900 capitalize tracking-tight">
                {activeTab === 'overview' ? 'Landlord Overview' :
                 activeTab === 'properties' ? 'Property Portfolio' :
                 activeTab === 'applications' ? 'Rental Applications' :
                 activeTab === 'leases' ? 'Tenancies & Leases' :
                 activeTab === 'financials' ? 'Financials & Rent Roll' :
                 activeTab === 'maintenance' ? 'Maintenance Board' :
                 activeTab === 'disputes' ? 'Legal Dispute Mediation' : 'Account & Verification Settings'}
              </span>
              <span className="hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Landlord Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasTenantRole && (
              <button
                type="button"
                onClick={() => onSwitchView?.('tenant')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200 rounded-xl hover:bg-brand-100 transition-colors shadow-2xs cursor-pointer"
                title="Switch to Tenant Portal"
              >
                <Home className="w-3.5 h-3.5 text-brand-600" />
                <span>Tenant Portal</span>
              </button>
            )}

            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-8 h-8 rounded-full ring-2 ring-emerald-500/20 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                  {user?.name?.[0] ?? 'L'}
                </div>
              )}
              <div className="text-xs">
                <span className="font-semibold text-slate-900 block leading-tight">{user?.name}</span>
                <span className="text-[10px] text-emerald-600 font-medium">Landlord</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="h-full"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ── Property Modals (orchestrated at shell level) ─────────────────── */}
      <AnimatePresence>
        {addPropertyOpen && (
          <AddPropertyModal
            onClose={() => setAddPropertyOpen(false)}
            onSubmit={handleAddPropertySubmit}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingProperty && (
          <EditPropertyModal
            property={editingProperty}
            onClose={() => setEditingProperty(null)}
            onSubmit={handleEditPropertySubmit}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {addUnitForProperty && (
          <AddOrEditUnitModal
            property={addUnitForProperty}
            unit={null}
            onClose={() => setAddUnitForProperty(null)}
            onSubmit={handleAddUnitSubmit}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editUnitCtx && (
          <AddOrEditUnitModal
            property={editUnitCtx.property}
            unit={editUnitCtx.unit}
            onClose={() => setEditUnitCtx(null)}
            onSubmit={handleEditUnitSubmit}
          />
        )}
      </AnimatePresence>

      {/* ── Global Toast ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-4 left-1/2 z-[100] px-5 py-3 text-white text-xs font-semibold rounded-xl shadow-xl flex items-center gap-2 ${
              toast.type === 'error' ? 'bg-rose-700' : 'bg-slate-900'
            }`}
          >
            {toast.msg}
            <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
