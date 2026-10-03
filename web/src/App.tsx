/**
 * RentHub App Root
 *
 * Route architecture:
 *   /login              → PublicOnlyRoute     → LoginPage
 *   /onboarding/role    → ProtectedRoute      → RoleSelectionPage  (new users, single role selection)
 *   /dashboard          → ProtectedRoute      → DashboardPage (authoritative role redirector)
 *   /tenant/*           → RoleProtectedRoute  → TenantDashboard (tenant role required)
 *   /landlord/*         → RoleProtectedRoute  → LandlordDashboard (landlord role required)
 *   /                   → redirects to /dashboard
 *   *                   → redirects to /
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from '@/features/auth/AuthContext';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { PublicOnlyRoute } from '@/features/auth/PublicOnlyRoute';
import { RoleProtectedRoute } from '@/features/auth/RoleProtectedRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { RoleSelectionPage } from '@/pages/RoleSelectionPage';
import { TenantDashboard } from '@/pages/TenantDashboard';
import { LandlordDashboard } from '@/pages/LandlordDashboard';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined ?? '';

export function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public-only: redirect authenticated users away to their authorized dashboard */}
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>

            {/* General Protected: requires active session */}
            <Route element={<ProtectedRoute />}>
              <Route path="/onboarding/role" element={<RoleSelectionPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
            </Route>

            {/* Tenant protected routes */}
            <Route element={<RoleProtectedRoute allowedRole="tenant" />}>
              <Route path="/tenant/*" element={<TenantDashboard />} />
            </Route>

            {/* Landlord protected routes */}
            <Route element={<RoleProtectedRoute allowedRole="landlord" />}>
              <Route path="/landlord/*" element={<LandlordDashboard />} />
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
