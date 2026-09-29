/**
 * DashboardRouter
 *
 * Selects the correct dashboard based on the authenticated user's roles:
 *   - landlord only → LandlordDashboard
 *   - tenant only   → TenantDashboard
 *   - both roles    → LandlordDashboard (with tenant switcher, future)
 *   - no roles      → should not reach here (ProtectedRoute redirects to /onboarding/role)
 */

import { useAuth } from '@/features/auth/AuthContext';
import { TenantDashboard } from './TenantDashboard';
import { LandlordDashboard } from './LandlordDashboard';
import { AppLoadingScreen } from '@/components/feedback/AppLoadingScreen';

export function DashboardPage() {
  const { user, status } = useAuth();

  if (status === 'initializing') return <AppLoadingScreen />;

  const roles = user?.roles ?? [];
  const isLandlord = roles.includes('landlord');
  const isTenant = roles.includes('tenant');

  // Both roles: landlord view by default (most complex role)
  if (isLandlord) return <LandlordDashboard />;
  if (isTenant) return <TenantDashboard />;

  // Fallback (shouldn't reach — ProtectedRoute handles needs-role)
  return <AppLoadingScreen />;
}
