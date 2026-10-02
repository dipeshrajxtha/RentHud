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
  Home,
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
  onSwitchView?: (view: 'landlord' | 'tenant') => void;
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
  onSwitchView,
  onSignOut,
  isSigningOut,
}: LandlordSidebarProps) {
  const { user } = useAuth();
  const hasTenantRole = user?.roles.includes('tenant') ?? false;

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
      badgeColor: 'bg-brand-600 text-white',
    },
    {
      id: 'leases',
      label: 'Tenancies & Leases',
      icon: FileCheck2,
      badge: unsignedLeasesCount,
      badgeColor: 'bg-amber-600 text-white',
    },
    { id: 'financials', label: 'Financials & Rent', icon: DollarSign },
    {
      id: 'maintenance',
      label: 'Maintenance',
      icon: Wrench,
      badge: openMaintenanceCount,
      badgeColor: 'bg-rose-600 text-white',
    },
    { id: 'disputes', label: 'Legal Disputes', icon: Scale },
    { id: 'settings', label: 'Settings & KYC', icon: Settings },
  ];

  return (
    <aside
      className={`relative hidden md:flex flex-col bg-slate-900 text-slate-200 border-r border-slate-800 transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3 overflow-hidden">
          <RentHubLogo variant="white" className="h-7 shrink-0" />
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full inline-block w-fit">
                Landlord Portal
              </span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Multi-role Fast Switcher Banner */}
      {hasTenantRole && !collapsed && (
        <div className="p-3 m-3 bg-gradient-to-r from-brand-950/60 to-slate-800/70 rounded-2xl border border-brand-800/40 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-slate-300 font-medium">Dual-Role Account</span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.2 rounded-md">
              Landlord Active
            </span>
          </div>
          <button
            type="button"
            onClick={() => onSwitchView?.('tenant')}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-semibold transition-colors shadow-2xs text-[11px] cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Switch to Tenant View</span>
          </button>
        </div>
      )}

      {/* Collapsed Fast Switcher Button */}
      {hasTenantRole && collapsed && (
        <div className="px-3 py-2 flex justify-center border-b border-slate-800/60">
          <button
            type="button"
            onClick={() => onSwitchView?.('tenant')}
            className="w-10 h-10 rounded-xl bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
            title="Switch to Tenant View"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>
      )}

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
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all relative group ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/30 font-bold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />

              {!collapsed && (
                <span className="flex-1 text-left truncate">{item.label}</span>
              )}

              {Boolean(item.badge && item.badge > 0) && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold shrink-0 ${
                    item.badgeColor || 'bg-slate-700 text-white'
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
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-8 h-8 rounded-full ring-2 ring-emerald-500/30 object-cover shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {user?.name?.[0] ?? 'L'}
            </div>
          )}

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                Verified Landlord
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={onSignOut}
            disabled={isSigningOut}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors shrink-0"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
