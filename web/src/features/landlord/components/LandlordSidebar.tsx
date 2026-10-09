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
      badgeColor: 'bg-blue-100 text-blue-700',
    },
    {
      id: 'leases',
      label: 'Tenancies & Leases',
      icon: FileCheck2,
      badge: unsignedLeasesCount,
      badgeColor: 'bg-amber-100 text-amber-700',
    },
    { id: 'financials', label: 'Financials & Rent', icon: DollarSign },
    {
      id: 'maintenance',
      label: 'Maintenance',
      icon: Wrench,
      badge: openMaintenanceCount,
      badgeColor: 'bg-rose-100 text-rose-700',
    },
    { id: 'disputes', label: 'Legal Disputes', icon: Scale },
    { id: 'settings', label: 'Settings & KYC', icon: Settings },
  ];

  return (
    <aside
      className={`relative hidden md:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 z-30 select-none shadow-xs ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-18 flex items-center justify-between px-4.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <RentHubLogo variant="original" size="sm" className="shrink-0" />
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider font-display px-2 py-0.5 rounded-full inline-block w-fit bg-emerald-50 border border-emerald-200 text-emerald-800">
                Landlord Portal
              </span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-none">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all relative font-display ${
                isActive
                  ? 'bg-brand-50 text-brand-600 border border-brand-200 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-brand-600' : 'text-slate-400'
                }`}
              />

              {!collapsed && (
                <span className="flex-1 text-left truncate">{item.label}</span>
              )}

              {Boolean(item.badge && item.badge > 0) && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                    item.badgeColor || 'bg-slate-100 text-slate-600'
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
      <div className="p-3.5 space-y-3 bg-slate-50 border-t border-slate-200">
        <div className="flex items-center gap-3">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover shrink-0 border border-emerald-300"
            />
          ) : (
            <div className="w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 font-display bg-emerald-600 shadow-xs">
              {user?.name?.[0] ?? 'L'}
            </div>
          )}

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate font-display">{user?.name}</p>
              <p className="text-[10px] truncate flex items-center gap-1 text-emerald-700 font-medium">
                <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
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
            className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors font-display flex items-center justify-center gap-2"
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
            className="w-full p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"
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
