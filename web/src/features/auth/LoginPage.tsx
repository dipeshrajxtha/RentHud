/**
 * LoginPage
 *
 * RentHub authentication entry point.
 *
 * Layout:
 *   Desktop (≥1024px): Split — brand panel (left) + auth panel (right)
 *   Mobile / Tablet:   Single column — auth panel centered, brand context above
 *
 * Auth flow:
 *   1. User clicks "Continue with Google"
 *   2. @react-oauth/google Google One Tap / popup fires
 *   3. Google returns credential (ID token)
 *   4. We call AuthContext.signInWithGoogle(idToken)
 *   5. AuthContext calls POST /api/auth/google
 *   6. On success → React Router redirects (via PublicOnlyRoute)
 *   7. On error → AuthAlertBanner shows the mapped error message
 */

import { useState, useCallback } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/features/auth/AuthContext';
import { AnimatedGroup } from '@/components/core';
import { RentHubLogo, RentHubIcon } from '@/components/common/RentHubLogo';
import authBg from '@/assets/svg/haikei/auth-background.svg';

/* ── Motion variants ───────────────────────────────────────────────────── */
const panelVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const errorVariants = {
  hidden:  { opacity: 0, height: 0, marginBottom: 0 },
  visible: { opacity: 1, height: 'auto', marginBottom: 16,
             transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, height: 0, marginBottom: 0,
             transition: { duration: 0.2 } },
};

/* ── Trust signals shown on the brand panel ────────────────────────────── */
const TRUST_POINTS = [
  { icon: ShieldCheckIcon,  text: 'Secure Google-verified sign-in' },
  { icon: HomeIcon,         text: 'Manage your tenancy in one place' },
  { icon: LockIcon,         text: 'Bank-grade data protection' },
  { icon: CheckCircleIcon,  text: 'Trusted by landlords & tenants' },
] as const;

/* ── Component ─────────────────────────────────────────────────────────── */
export function LoginPage() {
  const { signInWithGoogle, error, clearError } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleCredential = useCallback(
    async (credentialResponse: { credential?: string }) => {
      const idToken = credentialResponse.credential;
      if (!idToken) return;

      clearError();
      setIsLoading(true);
      try {
        await signInWithGoogle(idToken);
        // Navigation handled by PublicOnlyRoute after status → 'authenticated'
      } catch {
        // Error already stored in AuthContext.error
      } finally {
        setIsLoading(false);
      }
    },
    [signInWithGoogle, clearError]
  );

  return (
    <div className="min-h-screen flex bg-slate-50 relative overflow-hidden">
      {/* Haikei architectural background */}
      <img
        src={authBg}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        loading="eager"
      />

      {/* ── Brand Panel (left — desktop only) ── */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:flex lg:flex-col lg:justify-between lg:w-1/2 xl:w-[55%]
                   relative bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800
                   px-12 xl:px-16 py-16"
        aria-hidden="true"
      >
        {/* Inner gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-950/80 via-transparent to-brand-700/20 pointer-events-none" />

        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />

        {/* Top — Logo */}
        <div className="relative">
          <RentHubLogo variant="white" className="h-9" />
        </div>

        {/* Center — Headline & trust points */}
        <div className="relative space-y-8">
          <div className="space-y-4">
            <h1 className="font-display text-4xl xl:text-5xl font-semibold text-white leading-tight tracking-tight">
              Your tenancy,<br />
              <span className="text-brand-300">managed with care.</span>
            </h1>
            <p className="text-brand-200 text-lg leading-relaxed max-w-sm">
              RentHub connects landlords and tenants through a secure, modern platform
              built for how people actually rent today.
            </p>
          </div>

          {/* Trust points */}
          <AnimatedGroup
            preset="slide"
            as="ul"
            className="space-y-3"
          >
            {TRUST_POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 shrink-0">
                  <Icon className="w-4 h-4 text-brand-300" />
                </span>
                <span className="text-brand-100 text-sm font-medium">{text}</span>
              </li>
            ))}
          </AnimatedGroup>
        </div>

        {/* Bottom — Social proof */}
        <div className="relative flex items-center gap-4 pt-8 border-t border-white/10">
          <div className="flex -space-x-2">
            {['T', 'L', 'A'].map((l) => (
              <div
                key={l}
                className="w-8 h-8 rounded-full bg-white/20 border-2 border-brand-900
                           flex items-center justify-center text-xs font-semibold text-white"
              >
                {l}
              </div>
            ))}
          </div>
          <p className="text-brand-300 text-sm">
            Trusted by tenants, landlords, and property managers
          </p>
        </div>
      </motion.div>

      {/* ── Auth Panel (right) ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-8 relative">
        {/* Mobile logo (shown < lg) */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="lg:hidden mb-8"
        >
          <RentHubLogo variant="original" className="h-9" />
        </motion.div>

        {/* Auth card */}
        <motion.div
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          className="card-auth w-full max-w-md p-8 sm:p-10"
        >
          {/* Card header */}
          <div className="mb-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 border border-brand-100 shadow-xs">
              <RentHubIcon variant="original" className="w-7 h-7" />
            </div>

            <h2 className="font-display text-2xl font-semibold text-slate-900 tracking-tight">
              Welcome to RentHub
            </h2>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              Sign in with your Google account to access your tenancy dashboard.
              New users are welcomed automatically.
            </p>
          </div>

          {/* Error banner */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                variants={errorVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div
                  className="auth-alert-error"
                  role="alert"
                  aria-live="assertive"
                  aria-atomic="true"
                >
                  <AlertIcon className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-800 text-xs mb-0.5">Sign-in failed</p>
                    <p className="text-red-700 text-xs">{error}</p>
                  </div>
                  <button
                    onClick={clearError}
                    className="ml-auto shrink-0 text-red-500 hover:text-red-700
                               transition-colors focus-visible:outline-none
                               focus-visible:ring-2 focus-visible:ring-red-400 rounded"
                    aria-label="Dismiss error"
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Google Sign-In */}
          <div className="space-y-4">
            {isLoading ? (
              <GoogleLoadingState />
            ) : (
              <div
                className="relative"
                aria-label="Sign in with Google"
              >
                {/* @react-oauth/google GoogleLogin renders its own button */}
                {/* We wrap it and override styling via the theme prop */}
                <GoogleLogin
                  onSuccess={handleCredential}
                  onError={() => {
                    // Google popup was closed or failed — not a hard error
                  }}
                  useOneTap={false}
                  theme="outline"
                  size="large"
                  width="100%"
                  text="continue_with"
                  shape="rectangular"
                  logo_alignment="left"
                />
              </div>
            )}

            {/* Divider */}
            <div className="relative flex items-center gap-3 py-1" aria-hidden="true">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-xs text-slate-400 font-medium">Secure authentication</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            {/* Security note */}
            <div className="flex items-start gap-2.5 rounded-lg bg-slate-50 border border-slate-100 p-3.5">
              <ShieldCheckIcon className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-500 leading-relaxed">
                RentHub never stores your Google password. Authentication is handled
                securely through Google's OAuth 2.0 protocol.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-center text-xs text-slate-400 leading-relaxed">
              By continuing, you agree to RentHub's{' '}
              <a
                href="/terms"
                className="text-brand-600 hover:text-brand-700 underline underline-offset-2 transition-colors"
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a
                href="/privacy"
                className="text-brand-600 hover:text-brand-700 underline underline-offset-2 transition-colors"
              >
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </motion.div>

        {/* Desktop footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="mt-8 text-xs text-slate-400 text-center"
        >
          © {new Date().getFullYear()} RentHub. All rights reserved.
        </motion.p>
      </div>
    </div>
  );
}

/* ── Loading state (while awaiting API response) ── */
function GoogleLoadingState() {
  return (
    <div
      className="flex h-12 items-center justify-center gap-3 rounded-xl
                 border border-slate-200 bg-white px-4"
      role="status"
      aria-label="Signing in"
    >
      <svg
        className="animate-spin w-5 h-5 text-brand-600"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span className="text-sm text-slate-600 font-medium">Signing you in…</span>
    </div>
  );
}


/* ── Icon components (Lucide-style inline SVGs) ── */
function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
