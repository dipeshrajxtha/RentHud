/**
 * LoginPage - Clean, Modern, User-Friendly Light Mode Design
 * 
 * Features:
 *   - Clean Slate & Royal Blue layout
 *   - Left brand showcase panel with high-contrast trust signals
 *   - Google OAuth with clean light styling (theme=outline)
 *   - Clear error notifications and seamless loading states
 *   - 100% accessible typography and contrast
 */

import { useState, useCallback, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/features/auth/AuthContext';
import { RentHubLogo, RentHubIcon } from '@/components/common/RentHubLogo';
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
    <div className=min-h-screen bg-slate-50 flex flex-col lg:flex-row>
      {/* ── Left Brand Hero Panel (Desktop) ── */}
      <div className=hidden lg:flex lg:w-[48%] xl:w-[45%] p-4 lg:p-6 flex-col>
        <div className=flex-1 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-10 xl:p-14 flex flex-col justify-between text-white relative overflow-hidden shadow-xl shadow-blue-900/10>
          {/* Subtle background glow */}
          <div className=absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none />
          <div className=absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none />

          {/* Top Logo */}
          <div className=relative z-10>
            <RentHubLogo variant=white size=lg />
          </div>

          {/* Center Content */}
          <div className=relative z-10 my-10 space-y-6>
            <div className=inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-white>
              <Sparkles className=w-3.5 h-3.5 text-blue-200 />
              Nepal's Modern Rental Platform
            </div>

            <h1 className=text-4xl xl:text-5xl font-extrabold tracking-tight font-display leading-[1.15]>
              Rent with confidence. <br />
              Manage with ease.
            </h1>

            <p className=text-blue-100 text-sm xl:text-base leading-relaxed max-w-md>
              Experience hassle-free renting in Kathmandu. Verified property listings,
              electronic lease contracts, and digital rent payments all in one place.
            </p>

            {/* Trust Points */}
            <div className=pt-4 space-y-3>
              {TRUST_POINTS.map((tp, idx) => {
                const Icon = tp.icon;
                return (
                  <div key={idx} className=flex items-start gap-3.5 p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-colors>
                    <div className=p-2 rounded-xl bg-white/20 text-white shrink-0 mt-0.5>
                      <Icon className=w-4 h-4 />
                    </div>
                    <div>
                      <p className=text-sm font-bold text-white font-display>{tp.text}</p>
                      <p className=text-xs text-blue-100 mt-0.5>{tp.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Footer Note */}
          <div className=relative z-10 pt-6 border-t border-white/15 flex items-center justify-between text-xs text-blue-100>
            <span>Compliant with Nepal Tenancy Law</span>
            <span>&copy; {new Date().getFullYear()} RentHub</span>
          </div>
        </div>
      </div>

      {/* ── Right Auth Panel ── */}
      <div className=flex-1 flex flex-col justify-center items-center px-4 sm:px-8 py-12 relative>
        {/* Mobile Header Logo */}
        <div className=lg:hidden mb-8>
          <RentHubLogo variant=original size=lg />
        </div>

        <motion.div
          variants={containerVariants}
          initial=hidden
          animate=visible
          className=w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-8 sm:p-10
        >
          {/* Header */}
          <motion.div variants={itemVariants} className=text-center mb-8>
            <div className=w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-4 shadow-sm>
              <RentHubIcon variant=original size=lg />
            </div>
            <h2 className=text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display>
              Welcome to RentHub
            </h2>
            <p className=text-sm text-slate-500 mt-2>
              Sign in with your Google account to access your rental dashboard or get started.
            </p>
          </motion.div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className=mb-6
              >
                <div className=p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5>
                  <AlertCircle className=w-4 h-4 text-rose-600 shrink-0 mt-0.5 />
                  <div className=flex-1 leading-relaxed font-medium>{error}</div>
                  <button
                    type=button
                    onClick={clearError}
                    className=p-1 text-rose-500 hover:text-rose-700 rounded-lg
                    aria-label=Dismiss
                  >
                    <X className=w-3.5 h-3.5 />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Google Button */}
          <motion.div variants={itemVariants} className=space-y-5>
            <div className=relative flex justify-center w-full min-h-[48px]>
              {isLoading && (
                <div className=absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/95 border border-slate-200>
                  <div className=flex items-center gap-2.5 text-xs font-semibold text-slate-700 font-display>
                    <div className=w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin />
                    Signing you in securely...
                  </div>
                </div>
              )}
              <div
                className=flex justify-center w-full transition-opacity
              >
                <GoogleLogin
                  onSuccess={handleCredential}
                  onError={handleGoogleError}
                  useOneTap={false}
                  auto_select={false}
                  theme=outline
                  size=large
                  width=360
                  text=continue_with
                  shape=rectangular
                  logo_alignment=left
                />
              </div>
            </div>

            {/* Divider */}
            <div className=flex items-center gap-3 my-4>
              <div className=flex-1 h-px bg-slate-200 />
              <span className=text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-display>
                Fast & Secure
              </span>
              <div className=flex-1 h-px bg-slate-200 />
            </div>

            {/* Trust badge */}
            <div className=flex items-start gap-3 p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100>
              <ShieldCheck className=w-4 h-4 text-blue-600 shrink-0 mt-0.5 />
              <p className=text-xs text-slate-600 leading-relaxed>
                RentHub never stores your Google password. Sign-in is handled securely via
                Google OAuth 2.0 with instant role matching.
              </p>
            </div>
          </motion.div>

          {/* Footer Terms */}
          <motion.div variants={itemVariants} className=mt-8 pt-6 border-t border-slate-100 text-center>
            <p className=text-xs text-slate-400 leading-relaxed>
              By signing in, you agree to our{' '}
              <a href=/terms className=text-blue-600 hover:text-blue-700 font-medium underline-offset-2 hover:underline>
                Terms of Service
              </a>{' '}
              and{' '}
              <a href=/privacy className=text-blue-600 hover:text-blue-700 font-medium underline-offset-2 hover:underline>
                Privacy Policy
              </a>
              .
            </p>
          </motion.div>
        </motion.div>

        {/* Bottom copyright */}
        <p className=mt-8 text-xs text-slate-400 text-center>
          &copy; {new Date().getFullYear()} RentHub Nepal. All rights reserved.
        </p>
      </div>
    </div>
  );
}
