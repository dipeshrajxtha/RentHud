/**
 * RentHub App Root
 *
 * Route structure:
 *   /login              → PublicOnlyRoute  → LoginPage
 *   /onboarding/role    → ProtectedRoute   → RoleSelectionPage  (new users, status=needs-role)
 *   /dashboard          → ProtectedRoute   → DashboardPage (role-aware router)
 *   /                   → redirects to /dashboard
 *   *                   → redirects to /
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from '@/features/auth/AuthContext';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { PublicOnlyRoute } from '@/features/auth/PublicOnlyRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { RoleSelectionPage } from '@/pages/RoleSelectionPage';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined ?? '';

export function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public-only: redirect authenticated (+ roles) users away */}
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>

            {/* Protected: requires auth (needs-role OR authenticated) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/onboarding/role" element={<RoleSelectionPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
            </Route>

            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
