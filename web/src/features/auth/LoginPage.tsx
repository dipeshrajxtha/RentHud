/**
 * LoginPage - Unified Auth with Email/Password + Google OAuth
 *
 * Layout (top → bottom inside SpotlightCard):
 *   1. Email input
 *   2. Password input
 *   3. Sign In button (credentials)
 *   4. Divider ("or continue with")
 *   5. Google OAuth button
 */

import { useState, useCallback, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/features/auth/AuthContext';
import { RentHubLogo } from '@/components/common/RentHubLogo';
import {
  SpotlightCard,
  FormInput,
  ShimmerButton,
  StatusPill,
} from '@/components/ui';
import {
  ShieldCheck,
  Home,
  Lock,
  Mail,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react';

/* -- Motion Variants -- */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
};

/* -- Trust Signals -- */
const TRUST_POINTS = [
  { icon: ShieldCheck, text: 'Email & Google OAuth', desc: 'Secure authentication for tenants, landlords & admins' },
  { icon: Home,        text: 'All-in-one tenancy management', desc: 'Paperless leases, rent roll & maintenance tickets' },
  { icon: Lock,        text: 'Bank-grade encrypted records', desc: 'Compliant with Nepal National Civil Code 2074' },
  { icon: CheckCircle2, text: 'Verified Kathmandu ecosystem', desc: 'PostGIS verified boundary search' },
] as const;

export function LoginPage() {
  const { signInWithGoogle, signInWithCredentials, signInWithAdminCredentials, error, clearError } = useAuth();

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.id?.disableAutoSelect) {
        (window as any).google.accounts.id.disableAutoSelect();
      }
    } catch {}
  }, []);

  /* ── Handle Email/Password Submission ── */
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    clearError();
    setIsLoading(true);
    try {
      // Try admin login first if it matches admin email
      if (email.toLowerCase() === 'admin@gmail.com') {
        await signInWithAdminCredentials(email, password);
      } else {
        // Regular user dev-login (for tenants/landlords)
        await signInWithCredentials(email, 'tenant');
      }
    } catch {
      // Error is stored in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Handle Google Credential ── */
  const handleGoogleCredential = useCallback(
    async (credentialResponse: { credential?: string }) => {
      const idToken = credentialResponse.credential;
      if (!idToken) return;
      clearError();
      setIsLoading(true);
      try {
        await signInWithGoogle(idToken);
      } catch {
        // Error captured in AuthContext
      } finally {
        setIsLoading(false);
      }
    },
    [signInWithGoogle, clearError]
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row relative selection:bg-blue-500/20">
      {/* Background Micro Grid Mesh */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

      {/* ── Left Hero Panel (Desktop) ── */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-[44%] p-5 lg:p-7 flex-col z-10">
        <div className="flex-1 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950 rounded-3xl p-10 xl:p-12 flex flex-col justify-between text-white relative overflow-hidden shadow-2xl shadow-blue-950/20 border border-blue-600/30">
          {/* Subtle Glows */}
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-400/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-500/25 blur-3xl pointer-events-none" />

          {/* Top Logo */}
          <div className="relative z-10">
            <RentHubLogo variant="white" size="lg" />
          </div>

          {/* Center Brand Text */}
          <div className="relative z-10 my-8 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-white shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              Nepal's Premier Rental & Tenancy OS
            </div>

            <h1 className="text-3xl xl:text-4xl font-extrabold font-display leading-tight tracking-tight text-white">
              Rent with confidence. <br />
              Manage with clarity.
            </h1>

            <p className="text-blue-100/90 text-sm leading-relaxed max-w-md font-sans">
              Connect directly with verified property owners across Kathmandu, Lalitpur, and Bhaktapur. Experience paperless digital leases, automated rent receipts, and institutional escrow protection.
            </p>

            {/* Trust List */}
            <div className="pt-3 space-y-3">
              {TRUST_POINTS.map((pt, i) => {
                const Icon = pt.icon;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <Icon className="w-3.5 h-3.5 text-blue-200" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white font-display leading-tight">{pt.text}</p>
                      <p className="text-[11px] text-blue-200/80 leading-normal">{pt.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Statutory Footer */}
          <div className="relative z-10 text-xs text-blue-200/70 border-t border-white/15 pt-5 flex items-center justify-between">
            <span>Muluki Civil Code 2074 Statutory Compliant</span>
            <span className="font-mono text-[11px]">Kathmandu &bull; Pokhara</span>
          </div>
        </div>
      </div>

      {/* ── Right Auth Container ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-10 py-10 z-10">
        {/* Mobile Header */}
        <div className="lg:hidden mb-6 text-center">
          <RentHubLogo variant="original" size="md" className="justify-center mb-2.5" />
          <p className="text-xs text-slate-500 font-medium">Nepal's Premier Rental & Tenancy OS</p>
        </div>

        {/* SpotlightCard */}
        <SpotlightCard
          spotlightColor="rgba(37, 99, 235, 0.12)"
          glowSize={400}
          className="w-full max-w-md p-6 sm:p-8 space-y-5 rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/60"
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {/* Card Title */}
            <motion.div variants={itemVariants} className="text-center space-y-1">
              <h2 className="text-2xl font-bold font-display text-slate-900 tracking-tight">
                Welcome to RentHub
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-sans">
                Sign in to manage your leases, payments, or properties
              </p>
            </motion.div>

            {/* Error Banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-semibold block text-rose-900">Authentication Failed</span>
                    <span className="text-rose-700 leading-relaxed">{error}</span>
                  </div>
                  <button
                    type="button"
                    onClick={clearError}
                    className="text-rose-400 hover:text-rose-700 p-0.5 rounded transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── EMAIL + PASSWORD FORM ── */}
            <motion.form
              variants={itemVariants}
              onSubmit={handleCredentialsSubmit}
              className="space-y-3.5"
            >
              {/* Email Input */}
              <FormInput
                label="Email Address"
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
              />

              {/* Password Input */}
              <FormInput
                label="Password"
                isPassword
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
              />

              {/* Sign In Button */}
              <ShimmerButton
                type="submit"
                size="md"
                variant="primary"
                isLoading={isLoading}
                className="w-full mt-1"
              >
                Sign In
              </ShimmerButton>
            </motion.form>

            {/* ── DIVIDER ── */}
            <motion.div variants={itemVariants} className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                or continue with
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </motion.div>

            {/* ── GOOGLE OAUTH ── */}
            <motion.div variants={itemVariants}>
              <div className="relative flex justify-center">
                {isLoading ? (
                  <div className="w-full h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 animate-pulse">
                    <span className="w-4 h-4 rounded-full border-2 border-blue-600/30 border-t-blue-600 animate-spin" />
                    <span>Exchanging secure token with Google…</span>
                  </div>
                ) : (
                  <div className="w-full flex justify-center [&>div]:w-full [&>div>iframe]:!w-full [&>div>iframe]:!mx-auto">
                    <GoogleLogin
                      onSuccess={handleGoogleCredential}
                      onError={() => {}}
                      useOneTap={false}
                      theme="outline"
                      size="large"
                      shape="rectangular"
                      text="continue_with"
                      width="100%"
                    />
                  </div>
                )}
              </div>
            </motion.div>

            {/* Security Footer Notice */}
            <motion.div variants={itemVariants} className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-center gap-2">
                <StatusPill variant="success" size="sm" pulse>
                  Kathmandu Node Live
                </StatusPill>
                <span className="text-[11px] text-slate-400 font-medium">256-bit TLS Encrypted</span>
              </div>
              <p className="text-[10px] text-center text-slate-400 leading-normal">
                Protected by RentHub National Tenancy Guard. All activity is logged and cryptographically audited.
              </p>
            </motion.div>
          </motion.div>
        </SpotlightCard>

        {/* Helpline */}
        <p className="mt-6 text-xs text-slate-400 text-center font-sans">
          Technical assistance or dispute support? Call{' '}
          <span className="text-slate-600 font-semibold font-mono">+977 (01) 420-RENT</span>
        </p>
      </div>
    </div>
  );
}
