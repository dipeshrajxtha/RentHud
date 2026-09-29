/**
 * LandlordDashboard
 *
 * Dashboard for users with the 'landlord' role.
 * Shows property portfolio, pending applications, rental income, and maintenance overview.
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/features/auth/AuthContext';

const QUICK_STATS = [
  { label: 'Properties', value: '3', sub: '2 occupied · 1 vacant', icon: BuildingIcon, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  { label: 'Monthly Income', value: 'NPR 54,000', sub: '↑ 8% vs last month', icon: TrendingUpIcon, color: 'text-brand-600', bg: 'bg-brand-50', border: 'border-brand-100' },
  { label: 'Applications', value: '4 Pending', sub: '2 new today', icon: UsersIcon, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
  { label: 'Maintenance', value: '2 Open', sub: '1 critical', icon: WrenchIcon, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
];

const PROPERTIES = [
  { name: 'Sunrise Apartments 3B', tenant: 'Aarav Sharma', rent: '18,000', status: 'Occupied', statusColor: 'text-emerald-600 bg-emerald-50' },
  { name: 'Lakeside Flat 2F', tenant: 'Priya Thapa', rent: '22,000', status: 'Occupied', statusColor: 'text-emerald-600 bg-emerald-50' },
  { name: 'City View Studio', tenant: '—', rent: '14,000', status: 'Vacant', statusColor: 'text-amber-600 bg-amber-50' },
];

export function LandlordDashboard() {
  const { user, signOut, addRole } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [addingTenantRole, setAddingTenantRole] = useState(false);
  const hasTenantRole = user?.roles.includes('tenant') ?? false;

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
  }

  async function handleAddTenantRole() {
    setAddingTenantRole(true);
    try {
      await addRole('tenant');
    } catch {}
    setAddingTenantRole(false);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <BuildingIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900">Landlord Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5">
              {user?.roles.map(role => (
                <span key={role} className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize bg-emerald-100 text-emerald-700">
                  {role}
                </span>
              ))}
            </div>
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full ring-2 ring-emerald-100" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm font-semibold">
                {user?.name?.[0]?.toUpperCase() ?? 'L'}
              </div>
            )}
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="text-sm text-slate-500 hover:text-red-600 transition-colors font-medium"
            >
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
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
          <p className="mt-1 text-slate-500">Here's your property portfolio overview.</p>
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
                  <Icon className={`w-4.5 h-4.5 ${stat.color}`} />
                </div>
                <p className="text-xs text-slate-500 font-medium mb-0.5">{stat.label}</p>
                <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{stat.sub}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Property list */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">My Properties</h2>
              <button className="text-xs text-brand-600 font-medium hover:text-brand-700">+ Add Property</button>
            </div>
            <div className="space-y-3">
              {PROPERTIES.map((prop) => (
                <div key={prop.name} className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <BuildingIcon className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{prop.name}</p>
                    <p className="text-xs text-slate-400">{prop.tenant !== '—' ? `Tenant: ${prop.tenant}` : 'No tenant'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-slate-900">NPR {prop.rent}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${prop.statusColor}`}>{prop.status}</span>
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
              <h2 className="font-semibold text-slate-900 mb-3">Quick Actions</h2>
              <div className="space-y-2">
                {[
                  { label: 'Review Applications', sub: '4 pending', color: 'bg-brand-600 text-white hover:bg-brand-700' },
                  { label: 'List New Property', sub: 'Add a unit', color: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50' },
                  { label: 'View Financials', sub: 'Income report', color: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50' },
                ].map(a => (
                  <button key={a.label} className={`w-full text-left rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${a.color}`}>
                    <span className="block">{a.label}</span>
                    <span className="text-xs opacity-60 font-normal">{a.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Add tenant role */}
            {!hasTenantRole && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-900 mb-1">Also renting a place?</p>
                <p className="text-xs text-blue-700 mb-3">Add the Tenant role to access tenant features without creating a new account.</p>
                <button
                  onClick={handleAddTenantRole}
                  disabled={addingTenantRole}
                  className="w-full rounded-xl bg-blue-600 text-white text-sm font-medium py-2 hover:bg-blue-700 transition-colors disabled:opacity-60"
                >
                  {addingTenantRole ? 'Adding…' : 'Add Tenant Role'}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

/* ── Icons ─────────────────────────────────────────────────────────────── */
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
