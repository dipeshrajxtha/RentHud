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
} from 'lucide-react';
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
      accent: 'border-emerald-200 bg-emerald-50/60 text-emerald-700',
      iconBg: 'bg-emerald-600 text-white',
      onClick: () => onNavigateTab('properties'),
    },
    {
      label: 'Monthly Gross Rent',
      value: `NPR ${monthlyGrossRent.toLocaleString()}`,
      sub: `From ${activeLeases.length} active binding leases`,
      icon: TrendingUp,
      accent: 'border-brand-200 bg-brand-50/60 text-brand-700',
      iconBg: 'bg-brand-600 text-white',
      onClick: () => onNavigateTab('financials'),
    },
    {
      label: 'Occupancy Rate',
      value: `${occupancyRate}%`,
      sub: `${availableUnits} units currently listed as available`,
      icon: Home,
      accent: 'border-indigo-200 bg-indigo-50/60 text-indigo-700',
      iconBg: 'bg-indigo-600 text-white',
      onClick: () => onNavigateTab('properties'),
    },
    {
      label: 'Action Queue',
      value: `${pendingApps.length} Applications`,
      sub: `${unsignedLeases.length} unsigned leases · ${openMaintenance.length} work orders`,
      icon: FileText,
      accent: 'border-amber-200 bg-amber-50/60 text-amber-700',
      iconBg: 'bg-amber-600 text-white',
      onClick: () => onNavigateTab('applications'),
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-3 backdrop-blur-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            Kathmandu Valley Verified Property Portfolio
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
            Portfolio Command Center
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 leading-relaxed">
            Monitor occupancy, review tenant applications under Muluki Civil Code 2074, track rent ledger, and manage maintenance.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenAddProperty}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>List New Property</span>
          </button>
        </div>

        {/* Ambient Decorative Haikei-style Glow */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {METRIC_CARDS.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              onClick={stat.onClick}
              className={`p-5 rounded-2xl border ${stat.accent} cursor-pointer hover:shadow-md transition-all flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-600">{stat.label}</span>
                <div className={`p-2 rounded-xl ${stat.iconBg} shadow-xs`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
                <p className="text-[11px] text-slate-500 mt-1">{stat.sub}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Urgent Actions Section */}
      {(pendingApps.length > 0 || unsignedLeases.length > 0 || emergencyMaintenance.length > 0) && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Items Requiring Your Immediate Attention ({pendingApps.length + unsignedLeases.length + emergencyMaintenance.length})</span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Unsigned Leases Alert */}
            {unsignedLeases.map((lease) => (
              <div
                key={lease.id}
                className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full inline-block mb-1.5">
                    Lease Needs Signature
                  </span>
                  <p className="text-xs font-semibold text-slate-900">
                    {lease.propertyTitle || 'Property Unit'} ({lease.unitIdentifier || 'Unit'})
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tenant: {lease.tenantName || 'Applicant'} · Agreed Rent: NPR {lease.agreedMonthlyRent?.toLocaleString()}/mo
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenLeaseModal(lease)}
                  className="mt-3 w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Review & Sign Agreement</span>
                </button>
              </div>
            ))}

            {/* Pending Applications Alert */}
            {pendingApps.slice(0, 3).map((app) => (
              <div
                key={app.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full inline-block mb-1.5">
                    New Rental Application
                  </span>
                  <p className="text-xs font-semibold text-slate-900">
                    {app.tenant?.name || 'Applicant'} → {app.property?.title} ({app.unit?.unitIdentifier})
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Proposed Move-in: {app.proposedMoveIn || 'Immediate'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onReviewApplication(app)}
                  className="mt-3 w-full py-1.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                >
                  <span>Review Application</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Section: Properties Overview & Recent Activity */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Properties Snapshot */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Property Portfolio</h2>
              <p className="text-xs text-slate-500">Occupancy status across your Kathmandu valley assets</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('properties')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 hover:underline"
            >
              <span>View All ({properties.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {properties.length === 0 ? (
            <div className="py-12 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
              <Building className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-slate-700">No properties listed yet</p>
              <p className="text-xs text-slate-400 mt-0.5 max-w-sm mx-auto">
                Add your first residential building or apartment complex in Kathmandu to start receiving tenant applications.
              </p>
              <button
                type="button"
                onClick={onOpenAddProperty}
                className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Property</span>
              </button>
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
                    className="p-3.5 rounded-2xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50/80 transition-all flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {prop.coverPhotoUrl ? (
                        <img
                          src={prop.coverPhotoUrl}
                          alt={prop.title}
                          className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                          <Building className="w-6 h-6" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{prop.title}</p>
                        <p className="text-[11px] text-slate-500 truncate">{prop.address}, {prop.city}</p>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          {totalU} Units · {occU} Occupied · {availU} Vacant
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          rate === 100
                            ? 'bg-emerald-100 text-emerald-800'
                            : rate > 0
                            ? 'bg-brand-100 text-brand-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {rate}% Occupied
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Operations Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900">Quick Shortcuts</h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={onOpenAddProperty}
                className="w-full text-left p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 transition-colors flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-emerald-900 block">+ Add New Property</span>
                  <span className="text-[11px] text-emerald-700">Configure building, map pin & units</span>
                </div>
                <Plus className="w-4 h-4 text-emerald-600" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('applications')}
                className="w-full text-left p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Review Applications</span>
                  <span className="text-[11px] text-slate-500">{pendingApps.length} pending review</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('leases')}
                className="w-full text-left p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Digital Leases Hub</span>
                  <span className="text-[11px] text-slate-500">{activeLeases.length} active leases</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('financials')}
                className="w-full text-left p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Rent Roll & Invoices</span>
                  <span className="text-[11px] text-slate-500">Record cash/wire payments</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Legal Compliance Banner */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Muluki Civil Code 2074</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              All digital lease agreements generated on RentHub adhere to statutory provisions of Nepal's Tenancy Chapter (§§ 379–403).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
