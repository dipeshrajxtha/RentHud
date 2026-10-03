/**
 * RoleProtectedRoute
 *
 * Strict single-role guard for tenant and landlord product routes.
 *
 * Enforces:
 * - initializing   → AppLoadingScreen (no UI flash)
 * - unauthenticated → /login
 * - needs-role     → /onboarding/role
 * - authenticated  → Checks if user possesses the required application role:
 *     - If matched: renders Outlet
 *     - If mismatched: blocks access and redirects to user's authorized dashboard
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { AppLoadingScreen } from '@/components/feedback/AppLoadingScreen';

interface RoleProtectedRouteProps {
  allowedRole: 'tenant' | 'landlord' | 'admin';
}

export function RoleProtectedRoute({ allowedRole }: RoleProtectedRouteProps) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'initializing') {
    return <AppLoadingScreen />;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (status === 'needs-role') {
    return <Navigate to="/onboarding/role" replace />;
  }

  const userRoles = user?.roles ?? [];

  if (!userRoles.includes(allowedRole)) {
    // Block unauthorized access and redirect to the user's authoritative dashboard
    if (userRoles.includes('landlord')) {
      return <Navigate to="/landlord/dashboard" replace />;
    }
    if (userRoles.includes('tenant')) {
      return <Navigate to="/tenant/dashboard" replace />;
    }
    return <Navigate to="/onboarding/role" replace />;
  }

  return <Outlet />;
}
