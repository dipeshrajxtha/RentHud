import { motion } from 'motion/react';
import {
  Building,
  TrendingUp,
  FileText,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Home,
  CheckCircle2,
} from 'lucide-react';
import { BentoGrid, BentoCard, ShimmerButton, StatusPill } from '@/components/ui';
import type {
  LandlordProperty,
  LandlordApplication,
  LandlordLease,
  LandlordMaintenanceTicket,
} from '@/types/landlord';

interface LandlordOverviewViewProps {
  properties: LandlordProperty[];
  applications: LandlordApplication[];
  leases: LandlordLease[];
  maintenanceTickets: LandlordMaintenanceTicket[];
  onNavigateTab: (tab: any) => void;
  onOpenAddProperty: () => void;
  onReviewApplication: (app: LandlordApplication) => void;
  onOpenLeaseModal: (lease: LandlordLease) => void;
}

export function LandlordOverviewView({
  properties,
  applications,
  leases,
  maintenanceTickets,
  onNavigateTab,
  onOpenAddProperty,
  onReviewApplication,
  onOpenLeaseModal,
}: LandlordOverviewViewProps) {
  const pendingApps = applications.filter((a) => a.status === 'pending');
  const activeLeases = leases.filter((l) => l.status === 'active');
  const unsignedLeases = leases.filter(
    (l) => l.status === 'pending_signature' && !l.landlordSignedAt
  );
  const openMaintenance = maintenanceTickets.filter((m) => m.status !== 'Resolved');
  const emergencyMaintenance = openMaintenance.filter(
    (m) => m.urgency === 'Emergency' || m.urgency === 'High'
  );

  // Compute real metrics
  const totalUnits = properties.reduce((acc, p) => acc + (p.unitsCount || p.units?.length || 0), 0);
  const availableUnits = properties.reduce(
    (acc, p) =>
      acc + (p.availableUnitsCount ?? p.units?.filter((u) => u.availabilityStatus === 'AVAILABLE').length ?? 0),
    0
  );
  const occupiedUnits = Math.max(0, totalUnits - availableUnits);
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  // Monthly income from active leases
  const monthlyGrossRent = activeLeases.reduce((acc, l) => acc + Number(l.agreedMonthlyRent || 0), 0);

  const METRIC_CARDS = [
    {
      label: 'Portfolio Asset Value',
      value: `${properties.length} Properties`,
      sub: `${totalUnits} Total Units (${occupiedUnits} Occupied · ${availableUnits} Vacant)`,
      icon: Building,
      iconColor: 'bg-emerald-50 text-emerald-600',
      onClick: () => onNavigateTab('properties'),
    },
    {
      label: 'Monthly Gross Rent',
      value: `NPR ${monthlyGrossRent.toLocaleString()}`,
      sub: `From ${activeLeases.length} active binding leases`,
      icon: TrendingUp,
      iconColor: 'bg-brand-50 text-brand-600',
      onClick: () => onNavigateTab('financials'),
    },
    {
      label: 'Occupancy Rate',
      value: `${occupancyRate}%`,
      sub: `${availableUnits} units currently listed as available`,
      icon: Home,
      iconColor: 'bg-purple-50 text-purple-600',
      onClick: () => onNavigateTab('properties'),
    },
    {
      label: 'Action Queue',
      value: `${pendingApps.length} Applications`,
      sub: `${unsignedLeases.length} unsigned leases · ${openMaintenance.length} work orders`,
      icon: FileText,
      iconColor: 'bg-amber-50 text-amber-600',
      onClick: () => onNavigateTab('applications'),
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-7 sm:p-9 text-white relative overflow-hidden shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 border border-emerald-400/30 text-emerald-100 mb-3 font-display">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            Kathmandu Valley Verified Property Portfolio
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight">
            Portfolio Command Center
          </h1>
          <p className="text-xs sm:text-sm mt-1.5 leading-relaxed text-emerald-100/90">
            Monitor occupancy, review tenant applications under Muluki Civil Code 2074, track rent ledger, and manage maintenance.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 shrink-0">
          <ShimmerButton
            variant="outline"
            size="lg"
            onClick={onOpenAddProperty}
            leftIcon={<Plus className="w-4 h-4 text-emerald-700" />}
            className="rounded-2xl font-bold"
          >
            List New Property
          </ShimmerButton>
        </div>

        {/* Ambient Decorative Glow */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      </div>

      {/* Primary Metrics Grid */}
      <BentoGrid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {METRIC_CARDS.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="h-full"
            >
              <BentoCard
                className="h-full"
                icon={<Icon className="w-5 h-5" />}
                title={stat.label}
                description={stat.sub}
                onClick={stat.onClick}
              >
                <p className="text-2xl font-black text-slate-900 font-display tracking-tight">
                  {stat.value}
                </p>
              </BentoCard>
            </motion.div>
          );
        })}
      </BentoGrid>

      {/* Urgent Actions Section */}
      {(pendingApps.length > 0 || unsignedLeases.length > 0 || emergencyMaintenance.length > 0) && (
        <div className="rounded-3xl p-6 sm:p-7 space-y-4 bg-amber-50/60 border border-amber-200">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-900 font-display">
            <AlertTriangle className="w-4.5 h-4.5 text-amber-600" />
            <span>
              Items Requiring Your Immediate Attention ({pendingApps.length + unsignedLeases.length + emergencyMaintenance.length})
            </span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* Unsigned Leases Alert */}
            {unsignedLeases.map((lease) => (
              <div
                key={lease.id}
                className="bg-white rounded-2xl border border-amber-200 shadow-xs p-4.5 flex flex-col justify-between"
              >
                <div>
                  <div className="mb-2">
                    <StatusPill variant="warning" size="sm">
                      Lease Needs Signature
                    </StatusPill>
                  </div>
                  <p className="text-xs font-bold text-slate-900 font-display">
                    {lease.propertyTitle || 'Property Unit'} ({lease.unitIdentifier || 'Unit'})
                  </p>
                  <p className="text-[11px] mt-1 text-slate-500">
                    Tenant: {lease.tenantName || 'Applicant'} · Rent: NPR {lease.agreedMonthlyRent?.toLocaleString()}/mo
                  </p>
                </div>
                <ShimmerButton
                  variant="primary"
                  size="md"
                  onClick={() => onOpenLeaseModal(lease)}
                  leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
                  className="mt-3 w-full"
                >
                  Review & Sign Agreement
                </ShimmerButton>
              </div>
            ))}

            {/* Pending Applications Alert */}
            {pendingApps.slice(0, 3).map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-blue-200 shadow-xs p-4.5 flex flex-col justify-between"
              >
                <div>
                  <div className="mb-2">
                    <StatusPill variant="info" size="sm">
                      New Rental Application
                    </StatusPill>
                  </div>
                  <p className="text-xs font-bold text-slate-900 font-display">
                    {app.tenant?.name || 'Applicant'} → {app.property?.title} ({app.unit?.unitIdentifier})
                  </p>
                  <p className="text-[11px] mt-1 text-slate-500">
                    Proposed Move-in: {app.proposedMoveIn || 'Immediate'}
                  </p>
                </div>
                <ShimmerButton
                  variant="primary"
                  size="md"
                  onClick={() => onReviewApplication(app)}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="mt-3 w-full"
                >
                  Review Application
                </ShimmerButton>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Tenancies & Current Residents */}
      {activeLeases.length > 0 && (
        <div className="bg-white rounded-3xl border border-emerald-200/90 shadow-xs p-6 sm:p-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-base font-bold text-slate-900 font-display">
                  Active Tenancies & Current Residents ({activeLeases.length})
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                Ratified residential agreements currently active under Muluki Civil Code 2074
              </p>
            </div>
            <ShimmerButton
              variant="outline"
              size="sm"
              onClick={() => onNavigateTab('leases')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              All Leases Hub
            </ShimmerButton>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {activeLeases.map((lease) => (
              <div
                key={lease.id}
                className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 flex flex-col justify-between space-y-3 hover:bg-emerald-50/70 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <StatusPill variant="success" size="sm" icon={<CheckCircle2 className="w-3 h-3" />}>
                      Active Tenant
                    </StatusPill>
                    <span className="font-mono text-[10px] text-slate-400">#{lease.id.slice(0, 8)}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {lease.tenantName?.[0] ?? 'T'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 font-display">{lease.tenantName}</p>
                      <p className="text-[10px] text-slate-500">Resident</p>
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-slate-800">
                    {lease.propertyTitle} &middot; <span className="text-blue-700">{lease.unitIdentifier}</span>
                  </p>
                  <p className="text-[11px] text-emerald-800 font-bold mt-1">
                    NPR {lease.agreedMonthlyRent.toLocaleString()} / mo
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenLeaseModal(lease)}
                  className="w-full py-2 px-3 rounded-xl bg-white hover:bg-emerald-100/50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Legal Lease</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Section: Properties Overview & Quick Operations */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Properties Snapshot */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-display">Property Portfolio</h2>
              <p className="text-xs text-slate-500">Occupancy status across your Kathmandu valley assets</p>
            </div>
            <ShimmerButton
              variant="ghost"
              size="sm"
              onClick={() => onNavigateTab('properties')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              View All ({properties.length})
            </ShimmerButton>
          </div>

          {properties.length === 0 ? (
            <div className="py-12 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
              <Building className="w-10 h-10 mx-auto mb-2 text-slate-400" />
              <p className="text-sm font-bold text-slate-900 font-display">No properties listed yet</p>
              <p className="text-xs mt-0.5 max-w-sm mx-auto text-slate-500">
                Add your first residential building or apartment complex in Kathmandu to start receiving tenant applications.
              </p>
              <ShimmerButton
                variant="primary"
                size="md"
                onClick={onOpenAddProperty}
                leftIcon={<Plus className="w-4 h-4" />}
                className="mt-4"
              >
                Add Property
              </ShimmerButton>
            </div>
          ) : (
            <div className="space-y-3">
              {properties.slice(0, 4).map((prop) => {
                const totalU = prop.unitsCount || prop.units?.length || 0;
                const availU =
                  prop.availableUnitsCount ??
                  prop.units?.filter((u) => u.availabilityStatus === 'AVAILABLE').length ??
                  0;
                const occU = Math.max(0, totalU - availU);
                const rate = totalU > 0 ? Math.round((occU / totalU) * 100) : 0;

                return (
                  <div
                    key={prop.id}
                    onClick={() => onNavigateTab('properties')}
                    className="p-3.5 rounded-2xl cursor-pointer transition-all duration-200 flex items-center justify-between gap-4 bg-slate-50 hover:bg-slate-100/70 border border-slate-200"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {prop.coverPhotoUrl ? (
                        <img
                          src={prop.coverPhotoUrl}
                          alt={prop.title}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-brand-50 text-brand-600">
                          <Building className="w-6 h-6" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate font-display">{prop.title}</p>
                        <p className="text-[11px] truncate text-slate-500">{prop.address}, {prop.city}</p>
                        <span className="text-[10px] mt-0.5 block text-slate-400">
                          {totalU} Units · {occU} Occupied · {availU} Vacant
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <StatusPill
                        size="sm"
                        variant={rate === 100 ? 'success' : rate > 0 ? 'info' : 'warning'}
                      >
                        {rate}% Occupied
                      </StatusPill>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Operations Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 font-display">Quick Shortcuts</h3>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={onOpenAddProperty}
                className="w-full text-left p-3.5 rounded-2xl transition-all duration-200 flex items-center justify-between bg-emerald-50 border border-emerald-200 hover:bg-emerald-100/60"
              >
                <div>
                  <span className="text-xs font-bold text-emerald-900 block font-display">+ Add New Property</span>
                  <span className="text-[11px] text-emerald-700">Configure building, map pin & units</span>
                </div>
                <Plus className="w-4 h-4 text-emerald-700" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('applications')}
                className="w-full text-left p-3.5 rounded-2xl transition-all duration-200 flex items-center justify-between bg-slate-50 border border-slate-200 hover:bg-slate-100"
              >
                <div>
                  <span className="text-xs font-bold text-slate-900 block font-display">Review Applications</span>
                  <span className="text-[11px] text-slate-500">{pendingApps.length} pending review</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('leases')}
                className="w-full text-left p-3.5 rounded-2xl transition-all duration-200 flex items-center justify-between bg-slate-50 border border-slate-200 hover:bg-slate-100"
              >
                <div>
                  <span className="text-xs font-bold text-slate-900 block font-display">Digital Leases Hub</span>
                  <span className="text-[11px] text-slate-500">{activeLeases.length} active leases</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('financials')}
                className="w-full text-left p-3.5 rounded-2xl transition-all duration-200 flex items-center justify-between bg-slate-50 border border-slate-200 hover:bg-slate-100"
              >
                <div>
                  <span className="text-xs font-bold text-slate-900 block font-display">Rent Roll & Invoices</span>
                  <span className="text-[11px] text-slate-500">Record cash/wire payments</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Legal Compliance Banner */}
          <div className="rounded-3xl p-5 space-y-2 bg-emerald-50 border border-emerald-200">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs font-display">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Muluki Civil Code 2074</span>
            </div>
            <p className="text-[11px] leading-relaxed text-emerald-700">
              All digital lease agreements generated on RentHub adhere to statutory provisions of Nepal's Tenancy Chapter (§§ 379–403).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
