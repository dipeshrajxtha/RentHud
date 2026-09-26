/**
 * auth feature — barrel exports
 *
 * Import from '@/features/auth' rather than deep paths.
 */
export { AuthProvider, useAuth } from './AuthContext';
export { ProtectedRoute } from './ProtectedRoute';
export { PublicOnlyRoute } from './PublicOnlyRoute';
export type { AuthUser, AuthState, AuthStatus } from './auth.types';
