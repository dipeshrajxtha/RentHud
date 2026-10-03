/**
 * DashboardPage
 *
 * Authoritative single-role redirection hub:
 * - Directs Landlords to /landlord/dashboard
 * - Directs Tenants to /tenant/dashboard
 * - Completely eliminates dual-role switching, query parameters (?view=), and localStorage view state.
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { AppLoadingScreen } from '@/components/feedback/AppLoadingScreen';

export function DashboardPage() {
  const { user, status } = useAuth();

  if (status === 'initializing') {
    return <AppLoadingScreen />;
  }

  if (status === 'needs-role') {
    return <Navigate to="/onboarding/role" replace />;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  const roles = user?.roles ?? [];
  if (roles.includes('landlord')) {
    return <Navigate to="/landlord/dashboard" replace />;
  }

  return <Navigate to="/tenant/dashboard" replace />;
}
