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
      gradient: 'from-emerald-600 to-teal-500',
      glow: 'rgba(16, 185, 129, 0.25)',
      onClick: () => onNavigateTab('properties'),
    },
    {
      label: 'Monthly Gross Rent',
      value: `NPR ${monthlyGrossRent.toLocaleString()}`,
      sub: `From ${activeLeases.length} active binding leases`,
      icon: TrendingUp,
      gradient: 'from-blue-600 to-cyan-500',
      glow: 'rgba(46, 139, 255, 0.25)',
      onClick: () => onNavigateTab('financials'),
    },
    {
      label: 'Occupancy Rate',
      value: `${occupancyRate}%`,
      sub: `${availableUnits} units currently listed as available`,
      icon: Home,
      gradient: 'from-violet-600 to-indigo-500',
      glow: 'rgba(124, 58, 237, 0.25)',
      onClick: () => onNavigateTab('properties'),
    },
    {
      label: 'Action Queue',
      value: `${pendingApps.length} Applications`,
      sub: `${unsignedLeases.length} unsigned leases · ${openMaintenance.length} work orders`,
      icon: FileText,
      gradient: 'from-amber-600 to-orange-500',
      glow: 'rgba(245, 158, 11, 0.25)',
      onClick: () => onNavigateTab('applications'),
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 card-premium p-7 sm:p-9 text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(6,78,59,0.7) 0%, rgba(8,13,20,0.95) 50%, rgba(13,21,32,0.95) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
        }}
      >
        <div className="relative z-10 max-w-2xl">
          <div className="badge-success mb-3 font-display">
            <ShieldCheck className="w-3.5 h-3.5" />
            Kathmandu Valley Verified Property Portfolio
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight">
            Portfolio Command Center
          </h1>
          <p className="text-xs sm:text-sm mt-1.5 leading-relaxed" style={{ color: '#94aac5' }}>
            Monitor occupancy, review tenant applications under Muluki Civil Code 2074, track rent ledger, and manage maintenance.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenAddProperty}
            className="btn-primary btn-md flex items-center gap-2 shine-hover font-display"
          >
            <Plus className="w-4 h-4" />
            <span>List New Property</span>
          </button>
        </div>

        {/* Ambient Decorative Glow */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      </div>

      {/* Primary Metrics Grid (Bento style) */}
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
              className="card-premium p-5 cursor-pointer relative overflow-hidden flex flex-col justify-between select-none hover:border-brand-500/40 transition-all"
            >
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-xs font-bold uppercase tracking-wider font-display" style={{ color: '#5a7299' }}>
                  {stat.label}
                </span>
                <div
                  className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.gradient} text-white flex items-center justify-center shadow-md`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-black text-white font-display tracking-tight">
                  {stat.value}
                </p>
                <p className="text-[11px] mt-1" style={{ color: '#7187a5' }}>{stat.sub}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Urgent Actions Section */}
      {(pendingApps.length > 0 || unsignedLeases.length > 0 || emergencyMaintenance.length > 0) && (
        <div
          className="rounded-3xl p-6 sm:p-7 space-y-4"
          style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
          }}
        >
          <div className="flex items-center gap-2 font-bold text-sm text-amber-300 font-display">
            <AlertTriangle className="w-4.5 h-4.5 text-amber-400" />
            <span>
              Items Requiring Your Immediate Attention ({pendingApps.length + unsignedLeases.length + emergencyMaintenance.length})
            </span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* Unsigned Leases Alert */}
            {unsignedLeases.map((lease) => (
              <div
                key={lease.id}
                className="card-premium p-4.5 flex flex-col justify-between"
                style={{
                  background: 'rgba(13, 21, 32, 0.85)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                }}
              >
                <div>
                  <span className="badge-warning mb-2 font-display">
                    Lease Needs Signature
                  </span>
                  <p className="text-xs font-bold text-white font-display">
                    {lease.propertyTitle || 'Property Unit'} ({lease.unitIdentifier || 'Unit'})
                  </p>
                  <p className="text-[11px] mt-1" style={{ color: '#7187a5' }}>
                    Tenant: {lease.tenantName || 'Applicant'} · Rent: NPR {lease.agreedMonthlyRent?.toLocaleString()}/mo
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenLeaseModal(lease)}
                  className="btn-primary btn-sm mt-3 w-full flex items-center justify-center gap-1.5 font-display shine-hover"
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
                className="card-premium p-4.5 flex flex-col justify-between"
                style={{
                  background: 'rgba(13, 21, 32, 0.85)',
                  border: '1px solid rgba(46, 139, 255, 0.25)',
                }}
              >
                <div>
                  <span className="badge-info mb-2 font-display">
                    New Rental Application
                  </span>
                  <p className="text-xs font-bold text-white font-display">
                    {app.tenant?.name || 'Applicant'} → {app.property?.title} ({app.unit?.unitIdentifier})
                  </p>
                  <p className="text-[11px] mt-1" style={{ color: '#7187a5' }}>
                    Proposed Move-in: {app.proposedMoveIn || 'Immediate'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onReviewApplication(app)}
                  className="btn-primary btn-sm mt-3 w-full flex items-center justify-center gap-1.5 font-display shine-hover"
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
        <div className="lg:col-span-2 card-premium p-6 space-y-4">
          <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div>
              <h2 className="text-base font-bold text-white font-display">Property Portfolio</h2>
              <p className="text-xs" style={{ color: '#5a7299' }}>Occupancy status across your Kathmandu valley assets</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('properties')}
              className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors font-display"
            >
              <span>View All ({properties.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {properties.length === 0 ? (
            <div
              className="py-12 text-center rounded-2xl"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px dashed rgba(255, 255, 255, 0.1)',
              }}
            >
              <Building className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
              <p className="text-sm font-bold text-white font-display">No properties listed yet</p>
              <p className="text-xs mt-0.5 max-w-sm mx-auto" style={{ color: '#7187a5' }}>
                Add your first residential building or apartment complex in Kathmandu to start receiving tenant applications.
              </p>
              <button
                type="button"
                onClick={onOpenAddProperty}
                className="mt-4 btn-primary btn-sm inline-flex items-center gap-1.5 font-display"
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
                    className="p-3.5 rounded-2xl cursor-pointer transition-all duration-200 flex items-center justify-between gap-4"
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {prop.coverPhotoUrl ? (
                        <img
                          src={prop.coverPhotoUrl}
                          alt={prop.title}
                          className="w-12 h-12 rounded-xl object-cover shrink-0"
                          style={{ border: '1px solid rgba(255, 255, 255, 0.1)' }}
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-brand-400"
                          style={{ background: 'rgba(46, 139, 255, 0.1)' }}
                        >
                          <Building className="w-6 h-6" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate font-display">{prop.title}</p>
                        <p className="text-[11px] truncate" style={{ color: '#7187a5' }}>{prop.address}, {prop.city}</p>
                        <span className="text-[10px] mt-0.5 block" style={{ color: '#5a7299' }}>
                          {totalU} Units · {occU} Occupied · {availU} Vacant
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full font-display ${
                          rate === 100
                            ? 'badge-success'
                            : rate > 0
                            ? 'badge-info'
                            : 'badge-warning'
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
          <div className="card-premium p-6 space-y-4">
            <h3 className="text-sm font-bold text-white font-display">Quick Shortcuts</h3>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={onOpenAddProperty}
                className="w-full text-left p-3.5 rounded-2xl transition-all duration-200 flex items-center justify-between"
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                }}
              >
                <div>
                  <span className="text-xs font-bold text-emerald-300 block font-display">+ Add New Property</span>
                  <span className="text-[11px]" style={{ color: '#6ee7b7' }}>Configure building, map pin & units</span>
                </div>
                <Plus className="w-4 h-4 text-emerald-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('applications')}
                className="w-full text-left p-3.5 rounded-2xl transition-all duration-200 flex items-center justify-between"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div>
                  <span className="text-xs font-bold text-white block font-display">Review Applications</span>
                  <span className="text-[11px]" style={{ color: '#5a7299' }}>{pendingApps.length} pending review</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('leases')}
                className="w-full text-left p-3.5 rounded-2xl transition-all duration-200 flex items-center justify-between"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div>
                  <span className="text-xs font-bold text-white block font-display">Digital Leases Hub</span>
                  <span className="text-[11px]" style={{ color: '#5a7299' }}>{activeLeases.length} active leases</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('financials')}
                className="w-full text-left p-3.5 rounded-2xl transition-all duration-200 flex items-center justify-between"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div>
                  <span className="text-xs font-bold text-white block font-display">Rent Roll & Invoices</span>
                  <span className="text-[11px]" style={{ color: '#5a7299' }}>Record cash/wire payments</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Legal Compliance Banner */}
          <div
            className="rounded-3xl p-5 space-y-2"
            style={{
              background: 'rgba(6, 78, 59, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs font-display">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Muluki Civil Code 2074</span>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: '#94aac5' }}>
              All digital lease agreements generated on RentHub adhere to statutory provisions of Nepal's Tenancy Chapter (§§ 379–403).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
