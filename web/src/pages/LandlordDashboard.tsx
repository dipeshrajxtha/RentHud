/**
 * LandlordDashboard
 *
 * Full-fidelity Landlord Portal:
 *   - Portfolio overview with live stats (Properties, Income, Applications, Maintenance)
 *   - My Properties list with occupancy status
 *   - Review Pending Applications modal with Approve / Reject actions
 *   - Add New Property modal with form
 *   - Financial Overview drawer with per-property income breakdown
 *   - Multi-role switcher for users with both Tenant & Landlord roles
 *   - Sign out
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/features/auth/AuthContext';
import { RentHubLogo } from '@/components/common/RentHubLogo';

/* ── Types ──────────────────────────────────────────────────────────────── */
interface Application {
  id: string;
  applicant: string;
  property: string;
  unit: string;
  moveIn: string;
  rent: number;
  status: 'pending' | 'approved' | 'rejected';
  appliedOn: string;
  message: string;
}

interface Property {
  id: string;
  name: string;
  address: string;
  tenant: string | null;
  rent: number;
  status: 'Occupied' | 'Vacant';
  units: number;
  availableUnits: number;
}

/* ── Mock Data ───────────────────────────────────────────────────────────── */
const INITIAL_PROPERTIES: Property[] = [
  { id: 'p1', name: 'Sunrise Apartments 3B', address: 'Sanepa, Lalitpur', tenant: 'Aarav Sharma', rent: 18000, status: 'Occupied', units: 4, availableUnits: 1 },
  { id: 'p2', name: 'Lakeside Flat 2F', address: 'Boudha, Kathmandu', tenant: 'Priya Thapa', rent: 22000, status: 'Occupied', units: 2, availableUnits: 0 },
  { id: 'p3', name: 'City View Studio', address: 'Thamel, Kathmandu', tenant: null, rent: 14000, status: 'Vacant', units: 1, availableUnits: 1 },
];

const INITIAL_APPLICATIONS: Application[] = [
  { id: 'a1', applicant: 'Rohan Gurung', property: 'City View Studio', unit: 'Unit 101', moveIn: '2026-11-01', rent: 14000, status: 'pending', appliedOn: '2026-09-28', message: 'I am a software engineer at a reputed IT firm in Thamel. Looking for a quiet studio for 1 year.' },
  { id: 'a2', applicant: 'Sunita Karki', property: 'Sunrise Apartments 3B', unit: 'Unit 302', moveIn: '2026-10-15', rent: 18000, status: 'pending', appliedOn: '2026-09-27', message: 'Family of 3 (couple + 1 child). Working as a nurse at Norvic hospital. Stable income, excellent references.' },
  { id: 'a3', applicant: 'Bikram Shrestha', property: 'Sunrise Apartments 3B', unit: 'Unit 302', moveIn: '2026-11-01', rent: 18000, status: 'pending', appliedOn: '2026-09-25', message: 'Recent graduate working at Nepal Telecom. First-time renter, eager and responsible.' },
  { id: 'a4', applicant: 'Meera Basnet', property: 'Lakeside Flat 2F', unit: 'Unit F1', moveIn: '2026-10-01', rent: 22000, status: 'rejected', appliedOn: '2026-09-20', message: 'Artist and freelancer, looking for a creative space near Boudha.' },
];

const FINANCIAL_BREAKDOWN = [
  { property: 'Sunrise Apartments 3B', collected: 18000, pending: 0, deposit: 36000 },
  { property: 'Lakeside Flat 2F', collected: 22000, pending: 0, deposit: 44000 },
  { property: 'City View Studio', collected: 0, pending: 14000, deposit: 0 },
];

/* ── Main Component ──────────────────────────────────────────────────────── */
export function LandlordDashboard() {
  const { user, signOut, addRole } = useAuth();

  const [properties, setProperties] = useState<Property[]>(INITIAL_PROPERTIES);
  const [applications, setApplications] = useState<Application[]>(INITIAL_APPLICATIONS);
  const [signingOut, setSigningOut] = useState(false);
  const [addingTenantRole, setAddingTenantRole] = useState(false);

  // Modals
  const [applicationsOpen, setApplicationsOpen] = useState(false);
  const [addPropertyOpen, setAddPropertyOpen] = useState(false);
  const [financialsOpen, setFinancialsOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const hasTenantRole = user?.roles.includes('tenant') ?? false;

  const pendingApps = applications.filter(a => a.status === 'pending');
  const totalMonthlyRent = properties.filter(p => p.status === 'Occupied').reduce((s, p) => s + p.rent, 0);
  const openMaintenance = 2; // mock

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
  }

  async function handleAddTenantRole() {
    setAddingTenantRole(true);
    try { await addRole('tenant'); } catch {}
    setAddingTenantRole(false);
  }

  function handleApprove(appId: string) {
    const app = applications.find(a => a.id === appId)!;
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: 'approved' } : a));
    setProperties(prev => prev.map(p =>
      p.name === app.property ? { ...p, status: 'Occupied', tenant: app.applicant, availableUnits: Math.max(0, p.availableUnits - 1) } : p
    ));
    showToast(`✓ Application approved for ${app.applicant}`);
  }

  function handleReject(appId: string) {
    const app = applications.find(a => a.id === appId)!;
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: 'rejected' } : a));
    showToast(`Application from ${app.applicant} rejected`);
  }

  const QUICK_STATS = [
    { label: 'Properties', value: String(properties.length), sub: `${properties.filter(p => p.status === 'Occupied').length} occupied · ${properties.filter(p => p.status === 'Vacant').length} vacant`, icon: BuildingIcon, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Monthly Income', value: `NPR ${totalMonthlyRent.toLocaleString()}`, sub: 'From occupied units', icon: TrendingUpIcon, color: 'text-brand-600', bg: 'bg-brand-50', border: 'border-brand-100' },
    { label: 'Applications', value: `${pendingApps.length} Pending`, sub: 'Awaiting your review', icon: UsersIcon, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
    { label: 'Maintenance', value: `${openMaintenance} Open`, sub: '1 critical', icon: WrenchIcon, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <RentHubLogo variant="original" className="h-7" />
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Landlord Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Role badges */}
            <div className="hidden sm:flex items-center gap-1.5">
              {user?.roles.map(role => (
                <span key={role} className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize bg-slate-100 text-slate-700">
                  {role}
                </span>
              ))}
            </div>

            {/* Switch to Tenant Portal */}
            {hasTenantRole && (
              <button
                onClick={() => { window.location.href = '/dashboard'; }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200 rounded-xl hover:bg-brand-100 transition-colors"
              >
                <HouseIcon className="w-3.5 h-3.5" />
                Tenant View
              </button>
            )}

            {/* Avatar */}
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full ring-2 ring-emerald-100 object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm font-semibold">
                {user?.name?.[0]?.toUpperCase() ?? 'L'}
              </div>
            )}

            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="text-sm text-slate-500 hover:text-rose-600 transition-colors font-medium"
            >
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] ?? 'Landlord'} 🏢
          </h1>
          <p className="mt-1 text-slate-500 text-sm">Here's your property portfolio at a glance.</p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {QUICK_STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                className={`rounded-2xl border ${stat.border} ${stat.bg} p-5`}
              >
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className="text-xs text-slate-500 font-medium mb-0.5">{stat.label}</p>
                <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{stat.sub}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Properties list */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-slate-900">My Properties</h2>
              <button
                onClick={() => setAddPropertyOpen(true)}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                + Add Property
              </button>
            </div>
            <div className="space-y-1">
              {properties.map((prop) => (
                <div key={prop.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <BuildingIcon className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{prop.name}</p>
                    <p className="text-xs text-slate-400 truncate">{prop.address}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {prop.tenant ? `Tenant: ${prop.tenant}` : 'No active tenant'}
                    </p>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <p className="text-sm font-bold text-slate-900">NPR {prop.rent.toLocaleString()}/mo</p>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${
                      prop.status === 'Occupied'
                        ? 'text-emerald-700 bg-emerald-100'
                        : 'text-amber-700 bg-amber-100'
                    }`}>
                      {prop.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Side panel */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            {/* Quick actions */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-900 mb-3 text-sm">Quick Actions</h2>
              <div className="space-y-2">
                <button
                  onClick={() => setApplicationsOpen(true)}
                  className="w-full text-left rounded-xl px-3.5 py-3 text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 transition-colors relative"
                >
                  <span className="block">Review Applications</span>
                  <span className="text-xs font-normal opacity-75">{pendingApps.length} pending review</span>
                  {pendingApps.length > 0 && (
                    <span className="absolute top-2 right-3 w-5 h-5 rounded-full bg-white text-brand-700 text-[10px] font-bold flex items-center justify-center">
                      {pendingApps.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setAddPropertyOpen(true)}
                  className="w-full text-left rounded-xl px-3.5 py-3 text-sm font-medium bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <span className="block font-semibold">List New Property</span>
                  <span className="text-xs opacity-60">Add a property or unit</span>
                </button>

                <button
                  onClick={() => setFinancialsOpen(true)}
                  className="w-full text-left rounded-xl px-3.5 py-3 text-sm font-medium bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <span className="block font-semibold">View Financials</span>
                  <span className="text-xs opacity-60">NPR {totalMonthlyRent.toLocaleString()} collected</span>
                </button>
              </div>
            </div>

            {/* Multi-role: add Tenant role if not already present */}
            {!hasTenantRole && (
              <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-4">
                <p className="text-sm font-semibold text-brand-900 mb-1">Also renting a place?</p>
                <p className="text-xs text-brand-700 mb-3">Add the Tenant role to access tenant features without a new account.</p>
                <button
                  onClick={handleAddTenantRole}
                  disabled={addingTenantRole}
                  className="w-full rounded-xl bg-brand-600 text-white text-xs font-semibold py-2.5 hover:bg-brand-700 transition-colors disabled:opacity-60"
                >
                  {addingTenantRole ? 'Adding…' : 'Add Tenant Role'}
                </button>
              </div>
            )}

            {/* Switch to tenant view if already has both roles */}
            {hasTenantRole && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900 mb-1">Multi-role Account</p>
                <p className="text-xs text-slate-500 mb-3">You have both Landlord and Tenant roles on this account.</p>
                <button
                  onClick={() => { window.location.href = '/dashboard'; }}
                  className="w-full rounded-xl bg-slate-900 text-white text-xs font-semibold py-2.5 hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  <HouseIcon className="w-3.5 h-3.5" />
                  Switch to Tenant View
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      {/* ── Applications Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {applicationsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setApplicationsOpen(false)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 400 }}
              className="fixed inset-x-4 top-[5%] bottom-[5%] z-50 max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Rental Applications</h2>
                  <p className="text-xs text-slate-500">{pendingApps.length} pending · {applications.filter(a => a.status === 'approved').length} approved</p>
                </div>
                <button
                  onClick={() => setApplicationsOpen(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {applications.map(app => (
                  <div
                    key={app.id}
                    className={`rounded-2xl border p-5 space-y-3 ${
                      app.status === 'approved' ? 'border-emerald-200 bg-emerald-50/50' :
                      app.status === 'rejected' ? 'border-slate-200 bg-slate-50 opacity-60' :
                      'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{app.applicant}</p>
                        <p className="text-xs text-slate-500">{app.property} · {app.unit}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Applied {app.appliedOn} · Move-in {app.moveIn}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-slate-900">NPR {app.rent.toLocaleString()}/mo</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          app.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                          app.status === 'rejected' ? 'bg-slate-200 text-slate-500' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100 leading-relaxed">
                      "{app.message}"
                    </p>

                    {app.status === 'pending' && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleApprove(app.id)}
                          className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                        >
                          ✓ Approve Application
                        </button>
                        <button
                          onClick={() => handleReject(app.id)}
                          className="flex-1 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Add Property Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {addPropertyOpen && (
          <AddPropertyModal
            onClose={() => setAddPropertyOpen(false)}
            onAdded={(p) => {
              setProperties(prev => [p, ...prev]);
              setAddPropertyOpen(false);
              showToast(`✓ Property "${p.name}" listed successfully`);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Financials Drawer ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {financialsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFinancialsOpen(false)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Financial Overview</h2>
                  <p className="text-xs text-slate-500">Current month income breakdown</p>
                </div>
                <button
                  onClick={() => setFinancialsOpen(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Summary banner */}
                <div className="rounded-2xl bg-gradient-to-br from-emerald-900 to-teal-800 text-white p-5 space-y-1">
                  <p className="text-xs text-emerald-300 uppercase tracking-wider font-semibold">Total Collected · October 2026</p>
                  <p className="text-3xl font-bold">NPR {totalMonthlyRent.toLocaleString()}</p>
                  <p className="text-xs text-emerald-200">From {properties.filter(p => p.status === 'Occupied').length} occupied properties</p>
                </div>

                {/* Per-property breakdown */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Per Property</h3>
                  <div className="space-y-3">
                    {FINANCIAL_BREAKDOWN.map(item => (
                      <div key={item.property} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                        <p className="text-sm font-semibold text-slate-900">{item.property}</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="bg-emerald-50 rounded-xl p-2 text-center">
                            <span className="text-emerald-600 font-bold block">NPR {item.collected.toLocaleString()}</span>
                            <span className="text-slate-400">Collected</span>
                          </div>
                          <div className={`rounded-xl p-2 text-center ${item.pending > 0 ? 'bg-amber-50' : 'bg-slate-50'}`}>
                            <span className={`font-bold block ${item.pending > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                              NPR {item.pending.toLocaleString()}
                            </span>
                            <span className="text-slate-400">Pending</span>
                          </div>
                          <div className="bg-brand-50 rounded-xl p-2 text-center">
                            <span className="text-brand-600 font-bold block">NPR {item.deposit.toLocaleString()}</span>
                            <span className="text-slate-400">Deposit</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Add Property Modal ──────────────────────────────────────────────────── */
function AddPropertyModal({ onClose, onAdded }: { onClose: () => void; onAdded: (p: Property) => void }) {
  const [form, setForm] = useState({ name: '', address: '', city: 'Kathmandu', rent: '', deposit: '', units: '1' });
  const [submitting, setSubmitting] = useState(false);

  function set(k: keyof typeof form, v: string) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 600)); // simulate network
    const newProp: Property = {
      id: `p-${Date.now()}`,
      name: form.name,
      address: `${form.address}, ${form.city}`,
      tenant: null,
      rent: parseInt(form.rent, 10) || 0,
      status: 'Vacant',
      units: parseInt(form.units, 10) || 1,
      availableUnits: parseInt(form.units, 10) || 1,
    };
    setSubmitting(false);
    onAdded(newProp);
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
        className="fixed inset-x-4 top-[10%] z-50 max-w-lg mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">List New Property</h2>
            <p className="text-xs text-slate-500">Fill in the property details to publish your listing</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors">
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Property / Building Name</label>
            <input
              required
              type="text"
              placeholder="e.g. Sunrise Apartments 3B"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Street / Area</label>
              <input
                required
                type="text"
                placeholder="e.g. Sanepa"
                value={form.address}
                onChange={e => set('address', e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
              <select
                value={form.city}
                onChange={e => set('city', e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-white"
              >
                {['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Biratnagar'].map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Rent (NPR)</label>
              <input
                required
                type="number"
                min="1000"
                placeholder="18000"
                value={form.rent}
                onChange={e => set('rent', e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Security Deposit</label>
              <input
                type="number"
                min="0"
                placeholder="36000"
                value={form.deposit}
                onChange={e => set('deposit', e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">No. of Units</label>
              <input
                type="number"
                min="1"
                max="100"
                value={form.units}
                onChange={e => set('units', e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-white"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? 'Publishing…' : 'Publish Listing'}
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}

/* ── Icons ──────────────────────────────────────────────────────────────── */
function BuildingIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
}
function TrendingUpIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
}
function UsersIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
}
function WrenchIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
function XIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
}
function HouseIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
}
