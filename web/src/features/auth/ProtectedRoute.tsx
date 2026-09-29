/**
 * ProtectedRoute
 *
 * - initializing:   Shows a full-screen loading state (no flash)
 * - unauthenticated: Redirects to /login
 * - needs-role:     Redirects to /onboarding/role (new user)
 * - authenticated:  Renders children
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { AppLoadingScreen } from '@/components/feedback/AppLoadingScreen';

export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'initializing') return <AppLoadingScreen />;

  if (status === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // New user without roles — send to onboarding, skip if already there
  if (status === 'needs-role' && location.pathname !== '/onboarding/role') {
    return <Navigate to="/onboarding/role" replace />;
  }

  return <Outlet />;
}
