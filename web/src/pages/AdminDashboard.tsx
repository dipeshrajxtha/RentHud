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
  ModernModal,
} from '@/components/ui';
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
  ArrowUpRight,
  RefreshCw,
  LogOut,
  Server,
  AlertTriangle,
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
      // Re-fetch users
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
      // Re-fetch disputes
      const disputesData = await adminFetch<AdminDisputeCase[]>('/api/admin/disputes', accessToken);
      setDisputes(disputesData);
      // Re-fetch stats
      const statsData = await adminFetch<PlatformStats>('/api/admin/stats', accessToken);
      setStats(statsData);
      setSelectedDispute(null);
      setArbitrationNotes('');
    } catch {}
  };

  const handleApproveVerification = async (id: string) => {
    if (!accessToken) return;
    try {
      await adminFetch(`/api/admin/verifications/${id}/approve`, accessToken, { method: 'PATCH' });
      const data = await adminFetch<AdminVerification[]>('/api/admin/verifications', accessToken);
      setVerifications(data);
    } catch {}
  };

  const handleRejectVerification = async (id: string) => {
    if (!accessToken) return;
    try {
      await adminFetch(`/api/admin/verifications/${id}/reject`, accessToken, {
        method: 'PATCH',
        body: JSON.stringify({ reason: 'Rejected by admin' }),
      });
      const data = await adminFetch<AdminVerification[]>('/api/admin/verifications', accessToken);
      setVerifications(data);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 rounded-full border-2 border-purple-400/30 border-t-purple-400 animate-spin" />
          <span className="text-xs text-slate-400 font-medium">Loading Admin Dashboard…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-purple-500/30">
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <RentHubLogo variant="white" size="md" />
          <div className="h-5 w-px bg-slate-800 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-2">
            <StatusPill variant="purple" size="sm" pulse>
              Admin Dashboard
            </StatusPill>
            <span className="text-xs text-slate-400 font-mono">Live Data</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchAllData}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Refresh</span>
          </button>

          <div className="h-5 w-px bg-slate-800" />

          <div className="flex items-center gap-2.5 pl-1">
            <div className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-200 text-xs font-bold">
              ADM
            </div>
            <div className="hidden lg:block text-left">
              <span className="block text-xs font-semibold text-slate-200 truncate max-w-[130px]">
                {user?.name || 'Platform Admin'}
              </span>
              <span className="text-[10px] text-purple-400 font-mono">{user?.email}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => signOut()}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-transparent hover:border-rose-900/40 transition-colors ml-1"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Main Body ── */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar Navigation */}
        <aside className="w-full lg:w-64 bg-slate-900/50 border-r border-slate-800/80 p-4 space-y-6">
          <div className="space-y-1">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Modules
            </span>
            <nav className="space-y-1 pt-1.5">
              {[
                { id: 'overview' as const, label: 'Platform Overview', icon: Activity, count: null },
                { id: 'users' as const, label: 'User Directory', icon: Users, count: users.length },
                { id: 'kyc' as const, label: 'Verification Desk', icon: FileCheck2, count: pendingVerifications.length },
                { id: 'disputes' as const, label: 'Dispute Arbitration', icon: Scale, count: stats?.disputes.open ?? 0 },
                { id: 'escrow' as const, label: 'Financials', icon: DollarSign, count: null },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.count !== null && item.count > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isActive ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Node Health Box */}
          <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                System Status
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">
                {loadError ? 'Error' : '100% OK'}
              </span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-400 font-mono">
              <div className="flex justify-between">
                <span>Database:</span>
                <span className="text-slate-300">{loadError ? 'Error' : 'Connected'}</span>
              </div>
              <div className="flex justify-between">
                <span>Users Loaded:</span>
                <span className="text-slate-300">{users.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Data Source:</span>
                <span className="text-emerald-400">Real-time API</span>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Content Area ── */}
        <main className="flex-1 p-5 sm:p-8 bg-slate-950/60 overflow-y-auto max-h-[calc(100vh-65px)]">
          {/* Error Banner */}
          {loadError && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-950/30 border border-rose-800/50 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-sm font-semibold text-rose-300 block">Data Load Error</span>
                <span className="text-xs text-rose-400">{loadError}</span>
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
                <h1 className="text-2xl font-bold font-display text-white tracking-tight">
                  Platform Overview
                </h1>
                <p className="text-xs text-slate-400 font-sans mt-1">
                  Real-time data from Kathmandu Valley rental platform.
                </p>
              </div>

              <BentoGrid className="grid-cols-1 md:grid-cols-3 gap-5">
                {/* Total Users */}
                <BentoCard
                  colSpan={2}
                  gradient
                  icon={<Users className="w-5 h-5 text-blue-400" />}
                  badge={<StatusPill variant="success" size="sm" pulse>Live</StatusPill>}
                  title="Platform Users"
                  description="Registered tenants, landlords, and administrators."
                  className="bg-slate-900/90 border-slate-800 text-slate-200"
                >
                  <div className="pt-2 flex items-baseline gap-4 flex-wrap">
                    <span className="text-3xl sm:text-4xl font-extrabold font-display text-white tracking-tight">
                      {stats.users.total}
                    </span>
                    <div className="flex gap-3 text-xs">
                      <span className="text-blue-400 font-semibold">{stats.users.tenants} Tenants</span>
                      <span className="text-emerald-400 font-semibold">{stats.users.landlords} Landlords</span>
                      <span className="text-purple-400 font-semibold">{stats.users.admins} Admins</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1">
                    {stats.users.active} active users &bull; {stats.users.total - stats.users.active} suspended
                  </p>
                </BentoCard>

                {/* Open Disputes */}
                <BentoCard
                  gradient
                  icon={<Scale className="w-5 h-5 text-rose-400" />}
                  badge={stats.disputes.open > 0 ? <StatusPill variant="danger" size="sm">Action Needed</StatusPill> : <StatusPill variant="success" size="sm">Clear</StatusPill>}
                  title="Dispute Court"
                  description="Tenancy disputes pending resolution."
                  className="bg-slate-900/90 border-slate-800 text-slate-200"
                  onClick={() => setActiveTab('disputes')}
                >
                  <div className="pt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold font-display text-rose-400">
                      {stats.disputes.open}
                    </span>
                    <span className="text-xs text-slate-400">of {stats.disputes.total} total</span>
                  </div>
                </BentoCard>

                {/* Active Tenancies */}
                <BentoCard
                  icon={<Building className="w-5 h-5 text-blue-400" />}
                  title="Active Tenancies"
                  description="Currently active lease agreements."
                  className="bg-slate-900/90 border-slate-800 text-slate-200"
                >
                  <div className="pt-2">
                    <span className="text-3xl font-extrabold font-display text-white">
                      {stats.tenancies.active}
                    </span>
                    <span className="text-xs text-blue-400 ml-2 font-medium">of {stats.tenancies.total} total</span>
                  </div>
                </BentoCard>

                {/* Verifications */}
                <BentoCard
                  icon={<FileCheck2 className="w-5 h-5 text-amber-400" />}
                  badge={pendingVerifications.length > 0 ? <StatusPill variant="warning" size="sm">{pendingVerifications.length} Pending</StatusPill> : null}
                  title="Verification Queue"
                  description="KYC and property ownership verifications."
                  className="bg-slate-900/90 border-slate-800 text-slate-200"
                  onClick={() => setActiveTab('kyc')}
                >
                  <div className="pt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold font-display text-amber-400">
                      {pendingVerifications.length}
                    </span>
                    <span className="text-xs text-slate-400">awaiting review</span>
                  </div>
                </BentoCard>

                {/* Properties + Maintenance */}
                <BentoCard
                  icon={<Activity className="w-5 h-5 text-purple-400" />}
                  title="Properties & Maintenance"
                  description="Platform asset and maintenance overview."
                  className="bg-slate-900/90 border-slate-800 text-slate-200"
                >
                  <div className="pt-2 space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-white">{stats.properties.total}</span>
                      <span className="text-xs text-slate-400">properties</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-orange-400">{stats.maintenance.open}</span>
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
                  <h1 className="text-2xl font-bold font-display text-white tracking-tight">
                    User Directory
                  </h1>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">
                    {users.length} registered users — live data from database.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  {(['all', 'tenant', 'landlord', 'admin'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRoleFilter(r)}
                      className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-all ${
                        selectedRoleFilter === r
                          ? 'bg-purple-600 text-white font-semibold shadow-sm'
                          : 'text-slate-400 hover:text-white'
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
                  containerClassName="text-slate-900"
                />
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 bg-slate-800/50 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">User Details</th>
                      <th className="px-5 py-3.5">Roles</th>
                      <th className="px-5 py-3.5">Verification</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                          No users found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-semibold text-white">{u.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex gap-1.5">
                              {u.roles.map((r) => (
                                <span
                                  key={r}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                    r === 'admin'
                                      ? 'bg-purple-950 text-purple-300 border border-purple-800/50'
                                      : r === 'landlord'
                                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                                      : 'bg-blue-950 text-blue-300 border border-blue-800/50'
                                  }`}
                                >
                                  {r}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            {u.verified ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-slate-500">
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
                              className={`px-3 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                                u.status === 'active'
                                  ? 'bg-rose-950/40 text-rose-300 border-rose-800/50 hover:bg-rose-900/50'
                                  : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50 hover:bg-emerald-900/50'
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

          {/* ── VIEW 3: VERIFICATION DESK ── */}
          {activeTab === 'kyc' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold font-display text-white tracking-tight">
                  Verification Desk
                </h1>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  {verifications.length} total verifications — {pendingVerifications.length} pending review.
                </p>
              </div>

              {verifications.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-slate-800 bg-slate-900/90">
                  <FileCheck2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">No verifications submitted yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {verifications.map((item) => (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-purple-400 font-bold uppercase">
                            {item.badge_name || item.badge_code || 'Verification'}
                          </span>
                          <h3 className="text-base font-bold text-white">{item.user_name || 'Unknown User'}</h3>
                          <p className="text-xs text-slate-400">{item.user_email}</p>
                        </div>
                        <StatusPill
                          variant={
                            item.status === 'VERIFIED'
                              ? 'success'
                              : item.status === 'REJECTED'
                              ? 'danger'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {item.status}
                        </StatusPill>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-xs font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-400">ID:</span>
                          <span className="text-slate-200 font-bold truncate max-w-[200px]">{item.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Submitted:</span>
                          <span className="text-slate-300">{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                        {item.document_url && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Document:</span>
                            <a href={item.document_url} className="text-blue-400 hover:underline truncate max-w-[200px]" target="_blank" rel="noreferrer">View</a>
                          </div>
                        )}
                      </div>

                      {item.status === 'PENDING' && (
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                          <button
                            type="button"
                            onClick={() => handleRejectVerification(item.id)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-950/40 text-rose-300 border border-rose-800/50 hover:bg-rose-900/50 transition-colors"
                          >
                            Reject
                          </button>
                          <ShimmerButton
                            size="sm"
                            variant="primary"
                            onClick={() => handleApproveVerification(item.id)}
                          >
                            Approve
                          </ShimmerButton>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── VIEW 4: DISPUTE ARBITRATION ── */}
          {activeTab === 'disputes' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold font-display text-white tracking-tight">
                  Dispute Arbitration
                </h1>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  {disputes.length} total disputes — {disputes.filter(d => d.status !== 'RESOLVED_MUTUAL' && d.status !== 'RESOLVED_ARBITRATED').length} active.
                </p>
              </div>

              {disputes.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-slate-800 bg-slate-900/90">
                  <Scale className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">No disputes filed yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {disputes.map((d) => (
                    <div
                      key={d.id}
                      className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-3.5 shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono text-rose-400 font-bold uppercase">
                            {d.category} &bull; {d.property_title}
                          </span>
                          <h3 className="text-sm font-bold text-white mt-0.5">
                            {d.tenant_name} (Tenant) <span className="text-slate-400 font-normal">vs</span> {d.landlord_name} (Landlord)
                          </h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-mono font-bold text-emerald-400">
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

                      <p className="text-xs text-slate-300 bg-slate-950/50 p-3 rounded-xl border border-slate-800 leading-relaxed font-sans">
                        <span className="font-semibold text-slate-400 block mb-0.5">Grounds:</span>
                        {d.grounds}
                      </p>

                      {d.resolution_summary && (
                        <p className="text-xs text-emerald-300 bg-emerald-950/30 p-3 rounded-xl border border-emerald-800/40 leading-relaxed font-sans">
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
                <h1 className="text-2xl font-bold font-display text-white tracking-tight">
                  Financial Overview
                </h1>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  Real-time payment data from the platform.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-2">
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                    Rent Collected
                  </span>
                  <div className="text-2xl font-bold text-emerald-400 font-display">
                    NPR {stats.payments.totalPaid.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-slate-400">Successfully processed payments</p>
                </div>
                <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-2">
                  <span className="text-xs text-slate-400 font-medium">Pending Payments</span>
                  <div className="text-2xl font-bold text-amber-400 font-display">
                    NPR {stats.payments.totalPending.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-slate-400">Awaiting tenant action</p>
                </div>
                <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-2">
                  <span className="text-xs text-slate-400 font-medium">Overdue Amount</span>
                  <div className="text-2xl font-bold text-rose-400 font-display">
                    NPR {stats.payments.totalOverdue.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-slate-400">Past due date — requires follow-up</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-2">
                  <span className="text-xs text-slate-400 font-medium">Properties Registered</span>
                  <div className="text-2xl font-bold text-blue-400 font-display">{stats.properties.total}</div>
                </div>
                <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-2">
                  <span className="text-xs text-slate-400 font-medium">Maintenance Tickets</span>
                  <div className="text-2xl font-bold text-orange-400 font-display">
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
            <button
              type="button"
              onClick={() => setSelectedDispute(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <ShimmerButton size="md" variant="primary" onClick={handleResolveDispute}>
              Execute Arbitration
            </ShimmerButton>
          </>
        }
      >
        <div className="space-y-4 text-xs text-slate-800">
          <div className="p-3 rounded-xl bg-slate-100 space-y-1">
            <span className="font-semibold text-slate-700">Claim Summary:</span>
            <p className="text-slate-600">{selectedDispute?.grounds}</p>
            <div className="font-bold text-slate-900 pt-1">
              Claim Amount: NPR {Number(selectedDispute?.claim_amount ?? 0).toLocaleString()}
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-semibold text-slate-800 block">
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
                      ? 'bg-purple-50 text-purple-700 border-purple-300 ring-2 ring-purple-500/20'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 block">
              Notes & Rationale
            </label>
            <textarea
              rows={3}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              placeholder="Cite evidence or inspection reports..."
              value={arbitrationNotes}
              onChange={(e) => setArbitrationNotes(e.target.value)}
            />
          </div>
        </div>
      </ModernModal>
    </div>
  );
}
