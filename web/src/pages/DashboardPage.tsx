/**
 * DashboardRouter
 *
 * Selects the correct dashboard based on the authenticated user's roles:
 *   - landlord only → LandlordDashboard
 *   - tenant only   → TenantDashboard
 *   - dual-role     → Bidirectional switcher via query param (?view=landlord|tenant)
 *                     persisted in localStorage + URL for reliable reloads
 */

import { useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { TenantDashboard } from './TenantDashboard';
import { LandlordDashboard } from './LandlordDashboard';
import { AppLoadingScreen } from '@/components/feedback/AppLoadingScreen';

export function DashboardPage() {
  const { user, status } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const roles = user?.roles ?? [];
  const isLandlord = roles.includes('landlord');
  const isTenant = roles.includes('tenant');
  const isDualRole = isLandlord && isTenant;

  const viewQuery = searchParams.get('view');

  // Determine active view mode
  let activeView: 'landlord' | 'tenant';
  if (isDualRole) {
    if (viewQuery === 'tenant' || viewQuery === 'landlord') {
      activeView = viewQuery;
      try {
        localStorage.setItem('rh_active_view', viewQuery);
        sessionStorage.setItem('rh_active_view', viewQuery);
      } catch {}
    } else {
      let stored: string | null = null;
      try {
        stored = localStorage.getItem('rh_active_view') || sessionStorage.getItem('rh_active_view');
      } catch {}

      if (stored === 'tenant' || stored === 'landlord') {
        activeView = stored;
      } else {
        activeView = 'landlord'; // default for dual-role users
      }
    }
  } else if (isLandlord) {
    activeView = 'landlord';
  } else if (isTenant) {
    activeView = 'tenant';
  } else {
    // Fallback while initializing or redirecting
    activeView = 'tenant';
  }

  // Keep URL query in sync so page reloads always preserve active dual-role view
  useEffect(() => {
    if (isDualRole && viewQuery !== activeView) {
      setSearchParams({ view: activeView }, { replace: true });
    }
  }, [isDualRole, viewQuery, activeView, setSearchParams]);

  const handleSwitchView = useCallback((view: 'landlord' | 'tenant') => {
    try {
      localStorage.setItem('rh_active_view', view);
      sessionStorage.setItem('rh_active_view', view);
    } catch {}
    setSearchParams({ view });
  }, [setSearchParams]);

  if (status === 'initializing') return <AppLoadingScreen />;

  if (roles.length === 0) {
    return <AppLoadingScreen />;
  }

  if (activeView === 'landlord') {
    return <LandlordDashboard onSwitchView={handleSwitchView} />;
  }

  return <TenantDashboard onSwitchView={handleSwitchView} />;
}
