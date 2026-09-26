/**
 * RentHub App Root
 *
 * Provides:
 *   - GoogleOAuthProvider (Google credential flow)
 *   - AuthProvider (single source of truth for auth state)
 *   - BrowserRouter with protected and public-only route guards
 *
 * Route structure:
 *   /login            → PublicOnlyRoute → LoginPage
 *   /dashboard        → ProtectedRoute  → DashboardPage (placeholder)
 *   /                 → redirects to /dashboard (when auth) or /login (when not)
 *   *                 → 404 (future)
 *
 * GOOGLE_CLIENT_ID must be set in web/.env as VITE_GOOGLE_CLIENT_ID.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from '@/features/auth/AuthContext';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { PublicOnlyRoute } from '@/features/auth/PublicOnlyRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined ?? '';

export function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public-only routes (redirect authenticated users away) */}
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>

            {/* Protected routes (redirect unauthenticated users to /login) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              {/* Future protected routes go here */}
            </Route>

            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Catch-all — redirect to root for now */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
