/**
 * AdminDashboard - Real-Time Governance Deck for RentHub
 *
 * Fetches all data from real API endpoints:
 *   GET /api/admin/stats           → Overview metrics
 *   GET /api/admin/users           → User directory
 *   GET /api/admin/disputes        → Dispute arbitration
 *   GET /api/admin/verifications   → KYC/Verification desk
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { RentHubLogo } from '@/components/common/RentHubLogo';
import {
  BentoGrid,
  BentoCard,
  StatusPill,
  ShimmerButton,
  FormInput,
  FormTextarea,
  ModernModal,
} from '@/components/ui';
import { AdminKycReviewView } from '@/features/kyc/components/AdminKycReviewView';
import {
  Users,
  Building,
  Scale,
  FileCheck2,
  DollarSign,
  Activity,
  Search,
  CheckCircle2,
  Clock,
  RefreshCw,
  LogOut,
  Server,
  AlertTriangle,
  LayoutDashboard,
  TrendingUp,
} from 'lucide-react';

/* ── Types for API responses ── */
interface PlatformStats {
  users: { total: number; active: number; tenants: number; landlords: number; admins: number };
  properties: { total: number };
  tenancies: { total: number; active: number };
  disputes: { total: number; open: number };
  payments: { totalPaid: number; totalPending: number; totalOverdue: number };
  maintenance: { total: number; open: number };
  verifications: { pending: number };
  kyc?: { pending: number };
}

interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  roles: string[];
  status: 'active' | 'suspended';
  verified: boolean;
  joinedAt: string;
  propertiesCount: number;
  tenanciesCount: number;
}

interface AdminDisputeCase {
  id: string;
  tenancy_id: string;
  tenant_name: string;
  landlord_name: string;
  property_title: string;
  grounds: string;
  claim_amount: number;
  status: string;
  created_at: string;
  category: string;
  resolution_summary: string | null;
}

interface AdminVerification {
  id: string;
  user_id: string | null;
  property_id: string | null;
  status: string;
  document_url: string | null;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
  badge_name: string | null;
  badge_code: string | null;
}

/* ── Authenticated fetch helper ── */
async function adminFetch<T>(path: string, accessToken: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(options?.headers ?? {}),
    },
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error?.message || 'Request failed');
  return json.data as T;
}

/* ── Abstract background blobs (SVG) ── */
function AbstractBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden="true">
      {/* Large soft gradient blob top-right */}
      <svg
        className="absolute -top-24 -right-32 w-[600px] h-[600px] opacity-[0.08]"
        viewBox="0 0 600 600"
        fill="none"
      >
        <circle cx="300" cy="300" r="300" fill="url(#blob1)" />
        <defs>
          <radialGradient id="blob1" cx="0.3" cy="0.3" r="0.7">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#c4b5fd" />
          </radialGradient>
        </defs>
      </svg>

      {/* Bottom-left decorative shape */}
      <svg
        className="absolute -bottom-20 -left-20 w-[500px] h-[500px] opacity-[0.06]"
        viewBox="0 0 500 500"
        fill="none"
      >
        <ellipse cx="250" cy="250" rx="250" ry="200" fill="url(#blob2)" />
        <defs>
          <radialGradient id="blob2" cx="0.5" cy="0.5" r="0.6">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a78bfa" />
          </radialGradient>
        </defs>
      </svg>

      {/* Floating ring accent */}
      <svg
        className="absolute top-1/2 left-1/3 w-64 h-64 opacity-[0.04]"
        viewBox="0 0 256 256"
        fill="none"
      >
        <circle cx="128" cy="128" r="110" stroke="#818cf8" strokeWidth="36" />
      </svg>

      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
    </div>
  );
}

export function AdminDashboard() {
  const { user, accessToken, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'kyc' | 'disputes' | 'escrow'>('overview');

  // Data states
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [disputes, setDisputes] = useState<AdminDisputeCase[]>([]);
  const [verifications, setVerifications] = useState<AdminVerification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [pendingKycCount, setPendingKycCount] = useState<number>(0);

  // Filters & Modals
  const [userSearch, setUserSearch] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'all' | 'tenant' | 'landlord' | 'admin'>('all');
  const [selectedDispute, setSelectedDispute] = useState<AdminDisputeCase | null>(null);
  const [arbitrationDecision, setArbitrationDecision] = useState<'tenant' | 'landlord' | 'split'>('tenant');
  const [arbitrationNotes, setArbitrationNotes] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  /* ── Fetch all data from real API ── */
  const fetchAllData = useCallback(async () => {
    if (!accessToken) return;
    setIsRefreshing(true);
    setLoadError(null);
    try {
      const [statsData, usersData, disputesData, verificationsData] = await Promise.all([
        adminFetch<PlatformStats>('/api/admin/stats', accessToken),
        adminFetch<AdminUserRecord[]>('/api/admin/users', accessToken),
        adminFetch<AdminDisputeCase[]>('/api/admin/disputes', accessToken),
        adminFetch<AdminVerification[]>('/api/admin/verifications', accessToken),
      ]);
      setStats(statsData);
      setUsers(usersData);
      setDisputes(disputesData);
      setVerifications(verificationsData);
      setPendingKycCount(statsData.kyc?.pending ?? verificationsData.filter(v => v.status === 'PENDING').length);
    } catch (err: any) {
      setLoadError(err.message || 'Failed to load admin data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  /* ── Action Handlers (real API calls) ── */
  const handleToggleUserStatus = async (userId: string) => {
    if (!accessToken) return;
    try {
      await adminFetch(`/api/admin/users/${userId}/toggle-status`, accessToken, { method: 'PATCH' });
      const usersData = await adminFetch<AdminUserRecord[]>('/api/admin/users', accessToken);
      setUsers(usersData);
    } catch {}
  };

  const handleResolveDispute = async () => {
    if (!selectedDispute || !accessToken) return;
    try {
      await adminFetch(`/api/admin/disputes/${selectedDispute.id}/resolve`, accessToken, {
        method: 'PATCH',
        body: JSON.stringify({ decision: arbitrationDecision, notes: arbitrationNotes }),
      });
      const disputesData = await adminFetch<AdminDisputeCase[]>('/api/admin/disputes', accessToken);
      setDisputes(disputesData);
      const statsData = await adminFetch<PlatformStats>('/api/admin/stats', accessToken);
      setStats(statsData);
      setSelectedDispute(null);
      setArbitrationNotes('');
    } catch {}
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole =
      selectedRoleFilter === 'all' || u.roles.includes(selectedRoleFilter);
    return matchesSearch && matchesRole;
  });

  // Pending verifications
  const pendingVerifications = verifications.filter(v => v.status === 'PENDING');

  /* ── Navigation items ── */
  const navItems = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard, count: null },
    { id: 'users' as const, label: 'Users', icon: Users, count: users.length },
    { id: 'kyc' as const, label: 'Identity KYC', icon: FileCheck2, count: pendingKycCount },
    { id: 'disputes' as const, label: 'Disputes', icon: Scale, count: stats?.disputes.open ?? 0 },
    { id: 'escrow' as const, label: 'Financials', icon: DollarSign, count: null },
  ];

  /* ── Loading state ── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <AbstractBackground />
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <span className="absolute inset-0 rounded-full bg-indigo-100 animate-ping" />
            <span className="relative block w-10 h-10 rounded-full border-[3px] border-indigo-200 border-t-indigo-500 animate-spin" />
          </div>
          <span className="text-sm text-slate-500 font-medium tracking-wide">Loading Dashboard…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 text-slate-800 flex flex-col font-sans selection:bg-indigo-200/60">
      <AbstractBackground />

      {/* ── Top Header ── */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-8 py-3 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-4">
          <RentHubLogo variant="original" size="md" />
          <div className="h-5 w-px bg-slate-200 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Admin Console
            </span>
            <span className="text-[11px] text-slate-400 font-mono tracking-tight">Real-time</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchAllData}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 transition-all text-xs font-medium shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Refresh</span>
          </button>

          <div className="h-5 w-px bg-slate-200" />

          <div className="flex items-center gap-2.5 pl-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-indigo-200/50">
              {(user?.name || 'A')[0].toUpperCase()}
            </div>
            <div className="hidden lg:block text-left">
              <span className="block text-xs font-semibold text-slate-700 truncate max-w-[130px]">
                {user?.name || 'Platform Admin'}
              </span>
              <span className="text-[10px] text-indigo-500 font-mono">{user?.email}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => signOut()}
            className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 border border-slate-200 hover:border-rose-200 transition-all ml-1 shadow-sm"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Main Body ── */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar Navigation */}
        <aside className="w-full lg:w-60 bg-white/60 backdrop-blur-md border-r border-slate-200/60 p-4 space-y-6 lg:min-h-[calc(100vh-57px)]">
          <nav className="space-y-1">
            <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Navigation
            </span>
            <div className="space-y-0.5 pt-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm shadow-indigo-100/40'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-500' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.count !== null && item.count > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                        isActive ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* System Status */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/40 border border-slate-200/80 space-y-2.5 text-xs shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-emerald-500" />
                System
              </span>
              <span className={`text-[10px] font-mono font-semibold ${loadError ? 'text-rose-500' : 'text-emerald-500'}`}>
                {loadError ? 'Error' : 'Healthy'}
              </span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-500 font-mono">
              <div className="flex justify-between">
                <span>Database</span>
                <span className="text-slate-600 font-semibold">{loadError ? 'Error' : 'Connected'}</span>
              </div>
              <div className="flex justify-between">
                <span>Records</span>
                <span className="text-slate-600 font-semibold">{users.length} users</span>
              </div>
              <div className="flex justify-between">
                <span>Source</span>
                <span className="text-emerald-600 font-semibold">Live API</span>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Content Area ── */}
        <main className="flex-1 p-5 sm:p-8 overflow-y-auto max-h-[calc(100vh-57px)]">
          {/* Error Banner */}
          {loadError && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-sm font-semibold text-rose-700 block">Data Load Error</span>
                <span className="text-xs text-rose-500">{loadError}</span>
              </div>
              <ShimmerButton size="sm" variant="primary" onClick={fetchAllData} className="ml-auto">
                Retry
              </ShimmerButton>
            </div>
          )}

          {/* ── VIEW 1: OVERVIEW ── */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                  Platform Overview
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Real-time metrics from Kathmandu Valley rental platform.
                </p>
              </div>

              <BentoGrid className="grid-cols-1 md:grid-cols-3 gap-5">
                {/* Total Users */}
                <BentoCard
                  colSpan={2}
                  gradient
                  icon={<Users className="w-5 h-5 text-indigo-500" />}
                  badge={<StatusPill variant="success" size="sm" pulse>Live</StatusPill>}
                  title="Platform Users"
                  description="Registered tenants, landlords, and administrators."
                  className="bg-white border-slate-200 text-slate-700 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="pt-2 flex items-baseline gap-4 flex-wrap">
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
                      {stats.users.total}
                    </span>
                    <div className="flex gap-3 text-xs font-semibold">
                      <span className="text-blue-600">{stats.users.tenants} Tenants</span>
                      <span className="text-emerald-600">{stats.users.landlords} Landlords</span>
                      <span className="text-violet-600">{stats.users.admins} Admins</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1">
                    {stats.users.active} active &bull; {stats.users.total - stats.users.active} suspended
                  </p>
                </BentoCard>

                {/* Open Disputes */}
                <BentoCard
                  gradient
                  icon={<Scale className="w-5 h-5 text-rose-500" />}
                  badge={stats.disputes.open > 0 ? <StatusPill variant="danger" size="sm">Action Needed</StatusPill> : <StatusPill variant="success" size="sm">Clear</StatusPill>}
                  title="Dispute Court"
                  description="Tenancy disputes pending resolution."
                  className="bg-white border-slate-200 text-slate-700 shadow-sm hover:shadow-md transition-shadow"
                  onClick={() => setActiveTab('disputes')}
                >
                  <div className="pt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-rose-500">
                      {stats.disputes.open}
                    </span>
                    <span className="text-xs text-slate-400">of {stats.disputes.total} total</span>
                  </div>
                </BentoCard>

                {/* Active Tenancies */}
                <BentoCard
                  icon={<Building className="w-5 h-5 text-blue-500" />}
                  title="Active Tenancies"
                  description="Currently active lease agreements."
                  className="bg-white border-slate-200 text-slate-700 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="pt-2">
                    <span className="text-3xl font-extrabold text-slate-800">
                      {stats.tenancies.active}
                    </span>
                    <span className="text-xs text-blue-500 ml-2 font-medium">of {stats.tenancies.total} total</span>
                  </div>
                </BentoCard>

                {/* Verifications */}
                <BentoCard
                  icon={<FileCheck2 className="w-5 h-5 text-amber-500" />}
                  badge={pendingVerifications.length > 0 ? <StatusPill variant="warning" size="sm">{pendingVerifications.length} Pending</StatusPill> : null}
                  title="Verification Queue"
                  description="KYC and property ownership verifications."
                  className="bg-white border-slate-200 text-slate-700 shadow-sm hover:shadow-md transition-shadow"
                  onClick={() => setActiveTab('kyc')}
                >
                  <div className="pt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-amber-500">
                      {pendingVerifications.length}
                    </span>
                    <span className="text-xs text-slate-400">awaiting review</span>
                  </div>
                </BentoCard>

                {/* Properties + Maintenance */}
                <BentoCard
                  icon={<Activity className="w-5 h-5 text-violet-500" />}
                  title="Properties & Maintenance"
                  description="Platform asset and maintenance overview."
                  className="bg-white border-slate-200 text-slate-700 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="pt-2 space-y-1.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-slate-800">{stats.properties.total}</span>
                      <span className="text-xs text-slate-400">properties</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-orange-500">{stats.maintenance.open}</span>
                      <span className="text-xs text-slate-400">open maintenance tickets</span>
                    </div>
                  </div>
                </BentoCard>
              </BentoGrid>
            </div>
          )}

          {/* ── VIEW 2: USER DIRECTORY ── */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                    User Directory
                  </h1>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {users.length} registered users — live data from database.
                  </p>
                </div>

                <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                  {(['all', 'tenant', 'landlord', 'admin'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRoleFilter(r)}
                      className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-all ${
                        selectedRoleFilter === r
                          ? 'bg-indigo-500 text-white font-semibold shadow-sm shadow-indigo-200'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-white'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="max-w-md">
                <FormInput
                  placeholder="Search user by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                />
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-mono text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">User Details</th>
                      <th className="px-5 py-3.5">Roles</th>
                      <th className="px-5 py-3.5">Verification</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                          No users found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-800">{u.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex gap-1.5">
                              {u.roles.map((r) => (
                                <span
                                  key={r}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                    r === 'admin'
                                      ? 'bg-violet-100 text-violet-700 border border-violet-200'
                                      : r === 'landlord'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                                  }`}
                                >
                                  {r}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            {u.verified ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-slate-400">
                                <Clock className="w-3.5 h-3.5" /> Unverified
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <StatusPill
                              variant={u.status === 'active' ? 'success' : 'danger'}
                              size="sm"
                            >
                              {u.status}
                            </StatusPill>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleToggleUserStatus(u.id)}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all shadow-sm ${
                                u.status === 'active'
                                  ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                                  : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                              }`}
                            >
                              {u.status === 'active' ? 'Suspend' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── VIEW 3: VERIFICATION DESK (KYC) ── */}
          {activeTab === 'kyc' && (
            <AdminKycReviewView
              accessToken={accessToken!}
              onKycCountChange={setPendingKycCount}
            />
          )}

          {/* ── VIEW 4: DISPUTE ARBITRATION ── */}
          {activeTab === 'disputes' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                  Dispute Arbitration
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  {disputes.length} total disputes — {disputes.filter(d => d.status !== 'RESOLVED_MUTUAL' && d.status !== 'RESOLVED_ARBITRATED').length} active.
                </p>
              </div>

              {disputes.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <Scale className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">No disputes filed yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {disputes.map((d) => (
                    <div
                      key={d.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3.5 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono text-rose-500 font-bold uppercase tracking-wide">
                            {d.category} &bull; {d.property_title}
                          </span>
                          <h3 className="text-sm font-bold text-slate-800 mt-0.5">
                            {d.tenant_name} (Tenant) <span className="text-slate-400 font-normal">vs</span> {d.landlord_name} (Landlord)
                          </h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-mono font-bold text-emerald-600">
                            NPR {Number(d.claim_amount).toLocaleString()}
                          </span>
                          <StatusPill
                            variant={d.status === 'RESOLVED_ARBITRATED' || d.status === 'RESOLVED_MUTUAL' ? 'success' : 'danger'}
                            size="sm"
                          >
                            {d.status}
                          </StatusPill>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                        <span className="font-semibold text-slate-500 block mb-0.5">Grounds:</span>
                        {d.grounds}
                      </p>

                      {d.resolution_summary && (
                        <p className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200 leading-relaxed">
                          <span className="font-semibold block mb-0.5">Resolution:</span>
                          {d.resolution_summary}
                        </p>
                      )}

                      {d.status !== 'RESOLVED_ARBITRATED' && d.status !== 'RESOLVED_MUTUAL' && (
                        <div className="flex justify-end pt-2">
                          <ShimmerButton
                            size="sm"
                            variant="primary"
                            onClick={() => setSelectedDispute(d)}
                            leftIcon={<Scale className="w-3.5 h-3.5" />}
                          >
                            Issue Arbitration
                          </ShimmerButton>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── VIEW 5: FINANCIALS ── */}
          {activeTab === 'escrow' && stats && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                  Financial Overview
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Real-time payment data from the platform.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-2 shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                    Rent Collected
                  </span>
                  <div className="text-2xl font-bold text-emerald-600">
                    NPR {stats.payments.totalPaid.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-slate-400">Successfully processed payments</p>
                </div>
                <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-2 shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    Pending Payments
                  </span>
                  <div className="text-2xl font-bold text-amber-600">
                    NPR {stats.payments.totalPending.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-slate-400">Awaiting tenant action</p>
                </div>
                <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-2 shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                    Overdue Amount
                  </span>
                  <div className="text-2xl font-bold text-rose-500">
                    NPR {stats.payments.totalOverdue.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-slate-400">Past due — requires follow-up</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-2 shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-indigo-500" />
                    Properties Registered
                  </span>
                  <div className="text-2xl font-bold text-indigo-600">{stats.properties.total}</div>
                </div>
                <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-2 shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-orange-500" />
                    Maintenance Tickets
                  </span>
                  <div className="text-2xl font-bold text-orange-500">
                    {stats.maintenance.open} <span className="text-sm text-slate-400 font-normal">open</span> / {stats.maintenance.total} <span className="text-sm text-slate-400 font-normal">total</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Arbitration Modal ── */}
      <ModernModal
        isOpen={Boolean(selectedDispute)}
        onClose={() => setSelectedDispute(null)}
        title="Issue Binding Arbitration"
        subtitle={`${selectedDispute?.tenant_name} vs ${selectedDispute?.landlord_name} — ${selectedDispute?.property_title}`}
        footer={
          <>
            <ShimmerButton size="md" variant="outline" onClick={() => setSelectedDispute(null)}>
              Cancel
            </ShimmerButton>
            <ShimmerButton size="md" variant="primary" onClick={handleResolveDispute}>
              Execute Arbitration
            </ShimmerButton>
          </>
        }
      >
        <div className="space-y-4 text-xs text-slate-800">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="font-semibold text-slate-700">Claim Summary:</span>
            <p className="text-slate-600">{selectedDispute?.grounds}</p>
            <div className="font-bold text-slate-900 pt-1">
              Claim Amount: NPR {Number(selectedDispute?.claim_amount ?? 0).toLocaleString()}
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-semibold text-slate-700 block">
              Arbitration Verdict
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'tenant' as const, label: 'Full Refund to Tenant' },
                { id: 'landlord' as const, label: 'Release to Landlord' },
                { id: 'split' as const, label: '50/50 Equitable Split' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setArbitrationDecision(opt.id)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                    arbitrationDecision === opt.id
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-300 ring-2 ring-indigo-500/20'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <FormTextarea
            label="Notes & Rationale"
            rows={3}
            placeholder="Cite evidence or inspection reports..."
            value={arbitrationNotes}
            onChange={(e) => setArbitrationNotes(e.target.value)}
          />
        </div>
      </ModernModal>
    </div>
  );
}
