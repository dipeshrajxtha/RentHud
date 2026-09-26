/**
 * DashboardPage — placeholder for the authenticated app shell.
 *
 * This is a skeleton that will be replaced when the full
 * Application Shell / Role-Based Navigation is implemented.
 * It demonstrates that auth → protected route → dashboard works.
 */

import { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { motion } from 'motion/react';
import { InView } from '@/components/core';

export function DashboardPage() {
  const { user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    await signOut();
    // Navigation handled by ProtectedRoute after status → 'unauthenticated'
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-brand-600" aria-hidden="true">
              <path d="M24 4L6 18V44H20V32H28V44H42V18L24 4Z" fill="currentColor" fillOpacity="0.15"/>
              <path d="M24 4L6 18V44H20V32H28V44H42V18L24 4Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
              <circle cx="24" cy="22" r="3" fill="currentColor"/>
              <path d="M22 25V29H26V25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="font-display text-lg font-semibold text-slate-900 tracking-tight">RentHub</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Role badges */}
            <div className="hidden sm:flex items-center gap-1.5">
              {user?.roles.map(role => (
                <span key={role} className="badge-info capitalize">{role}</span>
              ))}
            </div>

            {/* User avatar */}
            <div className="flex items-center gap-3">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-100"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-semibold">
                  {user?.name?.[0]?.toUpperCase() ?? 'U'}
                </div>
              )}
              <span className="hidden sm:block text-sm font-medium text-slate-700">{user?.name}</span>
            </div>

            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="btn-outline btn-sm text-slate-600 border-slate-200 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
            >
              {isSigningOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <InView
          variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          once
        >
          <div className="mb-8">
            <h1 className="font-display text-display-sm font-semibold text-slate-900 tracking-tight">
              Welcome back, {user?.name?.split(' ')[0] ?? 'there'} 👋
            </h1>
            <p className="mt-2 text-slate-500 text-base">
              Your RentHub dashboard is being set up. The full application shell is coming next.
            </p>
          </div>

          {/* Authenticated user info card */}
          <div className="card p-6 max-w-lg">
            <h2 className="font-display text-heading-md font-semibold text-slate-900 mb-4">
              Authentication Status
            </h2>
            <dl className="space-y-3">
              <InfoRow label="Name" value={user?.name ?? '—'} />
              <InfoRow label="Email" value={user?.email ?? '—'} />
              <InfoRow label="User ID" value={user?.id ? `${user.id.slice(0, 8)}…` : '—'} />
              <InfoRow
                label="Roles"
                value={user?.roles.join(', ') ?? '—'}
                mono
              />
              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <dt className="text-sm text-slate-500">Auth status</dt>
                <dd><span className="badge-success">Authenticated ✓</span></dd>
              </div>
            </dl>
          </div>

          {/* Next steps */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="mt-8 p-5 rounded-xl border border-brand-100 bg-brand-50 max-w-lg"
          >
            <p className="text-sm font-medium text-brand-800 mb-1">Next implementation step</p>
            <p className="text-sm text-brand-700">
              Authentication → Protected Application Shell → Role-Based Navigation →
              Tenant Rental Browsing / Property Discovery UI
            </p>
          </motion.div>
        </InView>
      </main>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <dt className="text-sm text-slate-500 shrink-0">{label}</dt>
      <dd className={`text-sm text-slate-900 text-right ${mono ? 'font-mono text-xs' : 'font-medium'}`}>
        {value}
      </dd>
    </div>
  );
}
