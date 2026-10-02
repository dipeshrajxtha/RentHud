/**
 * PublicOnlyRoute
 *
 * Wraps routes that should NOT be accessible when authenticated
 * (e.g. /login). Authenticated users are redirected to their intended
 * destination or the dashboard.
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { AppLoadingScreen } from '@/components/feedback/AppLoadingScreen';

export function PublicOnlyRoute() {
  const { status } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard';

  if (status === 'initializing') {
    return <AppLoadingScreen />;
  }

  // Authenticated user with roles → go to dashboard (or original destination)
  if (status === 'authenticated') {
    return <Navigate to={from} replace />;
  }

  // New user: logged in via Google but no roles assigned yet → onboarding
  if (status === 'needs-role') {
    return <Navigate to="/onboarding/role" replace />;
  }

  return <Outlet />;
}
