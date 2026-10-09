/**
 * LoginPage — Ultra-Premium Dark Design
 * 
 * Inspired by: AnimMaster Lib, Skiper UI, Vengeance UI
 * Features:
 *   - Animated mesh gradient background with floating orbs
 *   - Border beam effect on auth card (Skiper UI)
 *   - Shine hover effect on buttons (Vengeance UI)
 *   - Staggered AnimatePresence entry animations (AnimMaster)
 *   - Premium glassmorphism card
 *   - Electric blue gradient brand panel
 *   - Smooth slide-in transitions
 *   - Motion-driven trust indicators
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useAuth } from '@/features/auth/AuthContext';
import { AnimatedGroup } from '@/components/core';
import { RentHubLogo, RentHubIcon } from '@/components/common/RentHubLogo';

/* -- Motion Variants (AnimMaster stagger style) ---------------------------- */
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
};

const itemVariants = {
  hidden:  { opacity: 0, y: 20, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0,  filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const panelVariants = {
  hidden:  { opacity: 0, x: -32 },
  visible: { opacity: 1, x: 0,  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

const cardVariants = {
  hidden:  { opacity: 0, y: 32, scale: 0.96 },
  visible: { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const errorVariants = {
  hidden:  { opacity: 0, height: 0, marginBottom: 0, scale: 0.96 },
  visible: { opacity: 1, height: 'auto', marginBottom: 16, scale: 1,
             transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, height: 0, marginBottom: 0, scale: 0.96,
             transition: { duration: 0.2 } },
};

/* -- Trust signals -------------------------------------------------------- */
const TRUST_POINTS = [
  { icon: ShieldCheckIcon, text: 'Secure Google-verified sign-in', accent: '#2e8bff' },
  { icon: HomeIcon,        text: 'Manage your tenancy in one place', accent: '#7c3aed' },
  { icon: LockIcon,        text: 'Bank-grade data protection', accent: '#06b6d4' },
  { icon: CheckCircleIcon, text: 'Trusted by landlords & tenants', accent: '#10b981' },
] as const;

/* -- Floating Orbs Background (AnimMaster style) --------------------------- */
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Orb 1 */}
      <div style={{
        position: 'absolute', top: '-15%', left: '-10%',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(46,139,255,0.12) 0%, transparent 70%)',
        filter: 'blur(60px)',
        animation: 'floatOrb1 20s ease-in-out infinite',
      }} />
      {/* Orb 2 */}
      <div style={{
        position: 'absolute', bottom: '-10%', right: '-5%',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 70%)',
        filter: 'blur(50px)',
        animation: 'floatOrb2 16s ease-in-out infinite',
      }} />
      {/* Orb 3 */}
      <div style={{
        position: 'absolute', top: '40%', right: '20%',
        width: '350px', height: '350px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)',
        filter: 'blur(40px)',
        animation: 'floatOrb3 24s ease-in-out infinite',
      }} />
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-grid-lines opacity-40" />
    </div>
  );
}

/* -- Magnetic cursor-following card tilt (Vengeance UI) ------------------- */
function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [4, -4]), { stiffness: 200, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-4, 4]), { stiffness: 200, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top)  / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* -- Main Component -------------------------------------------------------- */
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
        // Error stored in AuthContext
      } finally {
        setIsLoading(false);
      }
    },
    [signInWithGoogle, clearError]
  );

  const handleGoogleError = useCallback(() => {}, []);

  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{ background: 'var(--surface-0)' }}>
      <AnimatedBackground />

      {/* -- Left Brand Panel -- */}
      <motion.div
        variants={panelVariants}
        initial="hidden"
        animate="visible"
        className="hidden lg:flex lg:flex-col lg:justify-between lg:w-[52%] xl:w-[55%] relative px-12 xl:px-16 py-14"
        style={{ zIndex: 1 }}
        aria-hidden="true"
      >
        {/* Panel background with gradient */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, rgba(15,36,84,0.95) 0%, rgba(8,13,20,0.98) 60%, rgba(14,17,35,0.99) 100%)',
          borderRight: '1px solid rgba(46,139,255,0.1)',
        }} />

        {/* Animated border beam on top edge */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(46,139,255,0.8) 40%, rgba(124,58,237,0.8) 70%, transparent 100%)',
        }} />

        {/* Inner orb decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div style={{
            position: 'absolute', top: '10%', right: '5%',
            width: '300px', height: '300px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(46,139,255,0.08) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }} />
          <div style={{
            position: 'absolute', bottom: '20%', left: '-5%',
            width: '250px', height: '250px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)',
            filter: 'blur(35px)',
          }} />
        </div>

        {/* Top — Logo */}
        <div className="relative z-10">
          <RentHubLogo variant="white" className="h-8" />
        </div>

        {/* Center — Hero Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 space-y-10"
        >
          {/* Badge */}
          <motion.div variants={itemVariants}>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: 'rgba(46,139,255,0.12)',
                border: '1px solid rgba(46,139,255,0.25)',
                color: '#59aaff',
                fontFamily: 'Space Grotesk, sans-serif',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2e8bff', animation: 'pulseRingAnim 2s ease-in-out infinite', display: 'inline-block' }} />
              Nepal's Premier Rental Platform
            </span>
          </motion.div>

          {/* Headline */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h1 className="font-display text-5xl xl:text-6xl font-bold leading-[1.05] tracking-tight">
              <span style={{ color: '#f0f6ff' }}>Your tenancy,</span>
              <br />
              <span className="text-gradient-blue">managed with</span>
              <br />
              <span className="text-gradient-violet">precision.</span>
            </h1>
            <p style={{ color: '#94aac5', fontSize: '1rem', lineHeight: '1.7', maxWidth: '400px' }}>
              RentHub connects landlords and tenants through a secure, modern platform
              built for how people actually rent in Nepal today.
            </p>
          </motion.div>

          {/* Trust Points */}
          <AnimatedGroup preset="slide" as="ul" className="space-y-3">
            {TRUST_POINTS.map(({ icon: Icon, text, accent }) => (
              <motion.li
                key={text}
                variants={itemVariants}
                className="flex items-center gap-3 group"
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0 shine-hover"
                  style={{
                    background: `rgba(${accent === '#2e8bff' ? '46,139,255' : accent === '#7c3aed' ? '124,58,237' : accent === '#06b6d4' ? '6,182,212' : '16,185,129'},0.12)`,
                    border: `1px solid ${accent}33`,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: accent }} />
                </span>
                <span style={{ color: '#c8d8f0', fontSize: '0.875rem', fontWeight: 500 }}>{text}</span>
              </motion.li>
            ))}
          </AnimatedGroup>
        </motion.div>

        {/* Bottom — Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="relative z-10 flex items-center gap-4 pt-6"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex -space-x-2">
            {[
              { l: 'R', color: 'from-blue-500 to-cyan-500' },
              { l: 'T', color: 'from-violet-500 to-purple-500' },
              { l: 'A', color: 'from-emerald-500 to-teal-500' },
            ].map(({ l, color }) => (
              <div
                key={l}
                className={`w-8 h-8 rounded-full bg-gradient-to-br ${color} border-2 flex items-center justify-center text-xs font-bold text-white`}
                style={{ borderColor: 'rgba(8,13,20,0.95)' }}
              >
                {l}
              </div>
            ))}
          </div>
          <p style={{ color: '#5a7299', fontSize: '0.8125rem', fontFamily: 'Inter, sans-serif' }}>
            Trusted by <span style={{ color: '#94aac5', fontWeight: 600 }}>landlords, tenants</span> & property managers
          </p>
        </motion.div>
      </motion.div>

      {/* -- Auth Panel (right) -- */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-8 relative" style={{ zIndex: 1 }}>
        {/* Mobile logo */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="lg:hidden mb-8"
        >
          <RentHubLogo variant="white" className="h-8" />
        </motion.div>

        {/* Card with 3D tilt effect (Vengeance UI) */}
        <TiltCard className="w-full max-w-md perspective-800">
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="card-auth w-full p-8 sm:p-10"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Card Header */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="mb-8 space-y-4"
            >
              {/* Icon */}
              <motion.div variants={itemVariants} className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl shine-hover"
                  style={{
                    background: 'linear-gradient(135deg, rgba(21,103,245,0.2) 0%, rgba(46,139,255,0.15) 100%)',
                    border: '1px solid rgba(46,139,255,0.3)',
                    boxShadow: '0 0 20px rgba(46,139,255,0.15)',
                  }}
                >
                  <RentHubIcon variant="white" className="w-7 h-7" />
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <h2 className="font-display text-2xl font-bold tracking-tight" style={{ color: '#f0f6ff' }}>
                  Welcome to RentHub
                </h2>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: '#5a7299' }}>
                  Sign in with Google to access your dashboard.
                  New users are welcomed automatically.
                </p>
              </motion.div>
            </motion.div>

            {/* Error Banner (AnimatePresence) */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error"
                  variants={errorVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <div className="auth-alert-error" role="alert" aria-live="assertive" aria-atomic="true">
                    <AlertIcon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#f87171' }} />
                    <div className="flex-1">
                      <p className="font-semibold text-xs mb-0.5" style={{ color: '#fca5a5' }}>Sign-in failed</p>
                      <p className="text-xs" style={{ color: '#fca5a5', opacity: 0.8 }}>{error}</p>
                    </div>
                    <button
                      onClick={clearError}
                      className="ml-auto shrink-0 rounded-lg p-1 transition-colors"
                      style={{ color: '#f87171' }}
                      aria-label="Dismiss error"
                    >
                      <XIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Google Sign-In Area */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {/* Google Button Wrapper */}
              <motion.div variants={itemVariants} className="relative flex justify-center w-full min-h-[44px]">
                {isLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl"
                    style={{ background: 'rgba(13,21,32,0.95)' }}>
                    <GoogleLoadingState />
                  </div>
                )}
                <div
                  className={`relative flex justify-center w-full transition-opacity ${
                    isLoading ? 'opacity-0 pointer-events-none invisible' : 'opacity-100'
                  }`}
                  aria-label="Sign in with Google"
                  aria-hidden={isLoading ? true : undefined}
                  {...(isLoading ? { inert: '' } : {})}
                >
                  <GoogleLogin
                    onSuccess={handleCredential}
                    onError={handleGoogleError}
                    useOneTap={false}
                    auto_select={false}
                    theme="filled_black"
                    size="large"
                    width="380"
                    text="continue_with"
                    shape="rectangular"
                    logo_alignment="left"
                  />
                </div>
              </motion.div>

              {/* Divider */}
              <motion.div variants={itemVariants}>
                <div className="divider" aria-hidden="true">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)', fontFamily: 'Space Grotesk, sans-serif' }}>
                    Secure authentication
                  </span>
                </div>
              </motion.div>

              {/* Security note */}
              <motion.div
                variants={itemVariants}
                className="flex items-start gap-3 rounded-xl p-3.5"
                style={{
                  background: 'rgba(46,139,255,0.06)',
                  border: '1px solid rgba(46,139,255,0.12)',
                }}
              >
                <ShieldCheckIcon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#59aaff' }} />
                <p className="text-xs leading-relaxed" style={{ color: '#5a7299' }}>
                  RentHub never stores your Google password. Authentication is handled
                  securely through Google's OAuth 2.0 protocol.
                </p>
              </motion.div>
            </motion.div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              className="mt-8 pt-6"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              <p className="text-center text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                By continuing, you agree to RentHub's{' '}
                <a href="/terms" className="hover:underline underline-offset-2 transition-colors" style={{ color: '#59aaff' }}>
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="hover:underline underline-offset-2 transition-colors" style={{ color: '#59aaff' }}>
                  Privacy Policy
                </a>
                .
              </p>
            </motion.div>
          </motion.div>
        </TiltCard>

        {/* Desktop footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.4 }}
          className="mt-8 text-xs text-center"
          style={{ color: 'var(--text-muted)' }}
        >
          © {new Date().getFullYear()} RentHub Nepal. All rights reserved.
        </motion.p>
      </div>
    </div>
  );
}

/* -- Loading State -------------------------------------------------------- */
function GoogleLoadingState() {
  return (
    <div
      className="flex h-12 items-center justify-center gap-3 rounded-xl px-4"
      style={{ border: '1px solid rgba(46,139,255,0.2)', background: 'rgba(13,21,32,0.95)' }}
      role="status"
      aria-label="Signing in"
    >
      <svg
        className="w-5 h-5 animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="url(#spinGrad)" strokeWidth="3" />
        <path className="opacity-75" fill="#2e8bff" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        <defs>
          <linearGradient id="spinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2e8bff" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
      </svg>
      <span className="text-sm font-medium" style={{ color: '#94aac5', fontFamily: 'Space Grotesk, sans-serif' }}>
        Signing you in…
      </span>
    </div>
  );
}

/* -- Inline SVG Icons ------------------------------------------------------ */
function ShieldCheckIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>
  );
}
function HomeIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}
function LockIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  );
}
function CheckCircleIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>
  );
}
function AlertIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}
function XIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
