import React from 'react';
import {
  LayoutDashboard,
  Building,
  FileText,
  FileCheck2,
  DollarSign,
  Wrench,
  Scale,
  Settings,
  LogOut,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { RentHubLogo } from '@/components/common/RentHubLogo';
import { useAuth } from '@/features/auth/AuthContext';

export type LandlordTab =
  | 'overview'
  | 'properties'
  | 'applications'
  | 'leases'
  | 'financials'
  | 'maintenance'
  | 'disputes'
  | 'settings';

interface LandlordSidebarProps {
  activeTab: LandlordTab;
  onSelectTab: (tab: LandlordTab) => void;
  pendingAppsCount: number;
  openMaintenanceCount: number;
  unsignedLeasesCount: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSignOut: () => void;
  isSigningOut: boolean;
}

export function LandlordSidebar({
  activeTab,
  onSelectTab,
  pendingAppsCount,
  openMaintenanceCount,
  unsignedLeasesCount,
  collapsed,
  onToggleCollapse,
  onSignOut,
  isSigningOut,
}: LandlordSidebarProps) {
  const { user } = useAuth();

  const NAV_ITEMS: {
    id: LandlordTab;
    label: string;
    icon: React.ElementType;
    badge?: number;
    badgeColor?: string;
  }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'properties', label: 'My Properties', icon: Building },
    {
      id: 'applications',
      label: 'Applications',
      icon: FileText,
      badge: pendingAppsCount,
      badgeColor: 'badge-info',
    },
    {
      id: 'leases',
      label: 'Tenancies & Leases',
      icon: FileCheck2,
      badge: unsignedLeasesCount,
      badgeColor: 'badge-warning',
    },
    { id: 'financials', label: 'Financials & Rent', icon: DollarSign },
    {
      id: 'maintenance',
      label: 'Maintenance',
      icon: Wrench,
      badge: openMaintenanceCount,
      badgeColor: 'badge-error',
    },
    { id: 'disputes', label: 'Legal Disputes', icon: Scale },
    { id: 'settings', label: 'Settings & KYC', icon: Settings },
  ];

  return (
    <aside
      className={`relative hidden md:flex flex-col sidebar-premium transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div
        className="h-18 flex items-center justify-between px-4.5"
        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <RentHubLogo variant="white" className="h-7 shrink-0" />
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span
                className="text-[10px] font-bold uppercase tracking-wider font-display px-2 py-0.5 rounded-full inline-block w-fit"
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#6ee7b7',
                }}
              >
                Landlord Portal
              </span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white transition-colors shrink-0"
          style={{ background: 'rgba(255, 255, 255, 0.03)' }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto scrollbar-none">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all relative font-display ${
                isActive ? 'active' : ''
              }`}
              style={{
                color: isActive ? '#59aaff' : '#7187a5',
                background: isActive ? 'rgba(46, 139, 255, 0.12)' : 'transparent',
                border: isActive ? '1px solid rgba(46, 139, 255, 0.25)' : '1px solid transparent',
              }}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-brand-400' : 'text-slate-400'
                }`}
              />

              {!collapsed && (
                <span className="flex-1 text-left truncate">{item.label}</span>
              )}

              {Boolean(item.badge && item.badge > 0) && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                    item.badgeColor || 'badge-neutral'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div
        className="p-3.5 space-y-3"
        style={{
          background: 'rgba(8, 13, 20, 0.95)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div className="flex items-center gap-3">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover shrink-0"
              style={{ border: '2px solid rgba(16, 185, 129, 0.4)' }}
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 font-display"
              style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
            >
              {user?.name?.[0] ?? 'L'}
            </div>
          )}

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate font-display">{user?.name}</p>
              <p className="text-[10px] truncate flex items-center gap-1" style={{ color: '#6ee7b7' }}>
                <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                Verified Landlord
              </p>
            </div>
          )}
        </div>

        {!collapsed ? (
          <button
            type="button"
            onClick={onSignOut}
            disabled={isSigningOut}
            className="w-full btn-ghost btn-sm text-slate-300 hover:text-rose-400 font-display flex items-center justify-center gap-2"
            title="Sign out of RentHub"
            aria-label="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isSigningOut ? 'Signing out…' : 'Sign Out'}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onSignOut}
            disabled={isSigningOut}
            className="w-full p-2 rounded-xl text-slate-400 hover:text-rose-400 transition-colors flex items-center justify-center"
            style={{ background: 'rgba(255, 255, 255, 0.03)' }}
            title="Sign out of RentHub"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
