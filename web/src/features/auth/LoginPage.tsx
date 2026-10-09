/**
 * LoginPage - Clean, Modern, User-Friendly Light Mode Design
 * 
 * Features:
 *   - Clean Slate & Royal Blue layout
 *   - Left brand showcase panel with high-contrast trust signals
 *   - Google OAuth with clean light styling (theme="outline")
 *   - Clear error notifications and seamless loading states
 *   - 100% accessible typography and contrast
 */

import { useState, useCallback, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/features/auth/AuthContext';
import { RentHubLogo } from '@/components/common/RentHubLogo';
import {
  ShieldCheck,
  Home,
  Lock,
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
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};

/* -- Trust Signals -- */
const TRUST_POINTS = [
  { icon: ShieldCheck, text: 'Secure Google-verified sign-in', desc: 'No separate passwords to memorize' },
  { icon: Home,        text: 'All-in-one tenancy management', desc: 'Leases, rent roll & maintenance tickets' },
  { icon: Lock,        text: 'Bank-grade encrypted records', desc: 'Compliant with Nepal National Civil Code' },
  { icon: CheckCircle2, text: 'Trusted across Kathmandu Valley', desc: 'Zero unverified ghost listings' },
] as const;

export function LoginPage() {
  const { signInWithGoogle, error, clearError } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.id?.disableAutoSelect) {
        (window as any).google.accounts.id.disableAutoSelect();
      }
    } catch {}
  }, []);

  const handleCredential = useCallback(
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

  const handleGoogleError = useCallback(() => {}, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* ── Left Brand Hero Panel (Desktop) ── */}
      <div className="hidden lg:flex lg:w-[48%] xl:w-[45%] p-4 lg:p-6 flex-col">
        <div className="flex-1 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-10 xl:p-14 flex flex-col justify-between text-white relative overflow-hidden shadow-xl shadow-blue-900/10">
          {/* Subtle background glow */}
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

          {/* Top Logo */}
          <div className="relative z-10">
            <RentHubLogo variant="white" size="lg" />
          </div>

          {/* Center Content */}
          <div className="relative z-10 my-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-white">
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              Nepal's #1 Verified Rental Platform
            </div>

            <h1 className="text-3xl xl:text-4xl font-extrabold font-display leading-tight tracking-tight text-white">
              Rent with confidence. <br />
              Manage with clarity.
            </h1>

            <p className="text-blue-100/90 text-sm xl:text-base leading-relaxed max-w-md font-sans">
              Connect directly with verified property owners across Lalitpur, Kathmandu, and Bhaktapur. Experience paperless leases, automated rent receipts, and fair escrow deposit custody.
            </p>

            {/* Feature Points */}
            <div className="pt-4 space-y-3.5">
              {TRUST_POINTS.map((pt, i) => {
                const Icon = pt.icon;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-white" />
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

          {/* Bottom Footer Note */}
          <div className="relative z-10 text-xs text-blue-200/70 border-t border-white/15 pt-6 flex items-center justify-between">
            <span>Muluki Civil Code 2074 Statutory Compliant</span>
            <span>Kathmandu &bull; Pokhara</span>
          </div>
        </div>
      </div>

      {/* ── Right Auth Form Container ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-12 py-10">
        {/* Mobile Header */}
        <div className="lg:hidden mb-8 text-center">
          <RentHubLogo variant="original" size="md" className="justify-center mb-3" />
          <p className="text-xs text-slate-500 font-medium">Nepal's Premier Rental & Tenancy Ecosystem</p>
        </div>

        {/* Auth Card */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-7 sm:p-9 space-y-6"
        >
          {/* Card Title */}
          <motion.div variants={itemVariants} className="text-center space-y-1.5">
            <h2 className="text-2xl font-bold font-display text-slate-900 tracking-tight">
              Welcome to RentHub
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-sans">
              Sign in or create your verified account to continue
            </p>
          </motion.div>

          {/* Error Alert */}
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
                  <span className="font-semibold block text-rose-900">Sign In Failed</span>
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

          {/* Google Sign-in Action */}
          <motion.div variants={itemVariants} className="space-y-4 pt-1">
            <div className="relative flex justify-center">
              {isLoading ? (
                <div className="w-full h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 animate-pulse">
                  <span className="w-4 h-4 rounded-full border-2 border-blue-600/30 border-t-blue-600 animate-spin" />
                  <span>Connecting securely to Google…</span>
                </div>
              ) : (
                <div className="w-full flex justify-center [&>div]:w-full [&>div>iframe]:!w-full [&>div>iframe]:!mx-auto">
                  <GoogleLogin
                    onSuccess={handleCredential}
                    onError={handleGoogleError}
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

            <p className="text-[11px] text-center text-slate-400 leading-relaxed">
              Google authentication instantly verifies your email identity. New users are guided to select their Tenant or Landlord role right after.
            </p>
          </motion.div>

          {/* Security & Statutory Notice */}
          <motion.div variants={itemVariants} className="pt-4 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>256-bit SSL Encrypted &bull; ISO/IEC 27001 Aligned</span>
            </div>
            <p className="text-[10px] text-center text-slate-400 leading-normal">
              By proceeding, you agree to RentHub's{' '}
              <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>{' '}
              and{' '}
              <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>.
            </p>
          </motion.div>
        </motion.div>

        {/* Floating Quick Switch hint for returning users */}
        <p className="mt-8 text-xs text-slate-400 text-center font-sans">
          Need assistance? Contact our Kathmandu helpline at{' '}
          <span className="text-slate-600 font-semibold font-mono">+977 (01) 420-RENT</span>
        </p>
      </div>
    </div>
  );
}
