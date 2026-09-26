/**
 * ProtectedRoute
 *
 * Wraps any route that requires authentication.
 * - initializing: Shows a full-screen loading state (no flash)
 * - unauthenticated: Redirects to /login (preserving intended path)
 * - authenticated: Renders children
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { AppLoadingScreen } from '@/components/feedback/AppLoadingScreen';

export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'initializing') {
    return <AppLoadingScreen />;
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
