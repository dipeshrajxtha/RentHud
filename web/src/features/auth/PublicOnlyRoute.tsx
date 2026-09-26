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

  if (status === 'authenticated') {
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
}
