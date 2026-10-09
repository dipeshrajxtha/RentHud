/**
 * RoleSelectionPage — Ultra-Premium Dark Multi-Step Onboarding
 * 
 * Inspired by: AnimMaster Lib, Skiper UI, Vengeance UI, Manus.im, Aceternity
 * Features:
 *   - Glassmorphism role cards with gradient icons & 3D tilt hover
 *   - Animated step indicator with shimmer progress bar
 *   - Slide transitions between questionnaire steps (forward/backward)
 *   - Staggered option entry animations (AnimMaster stagger)
 *   - Border beam and glow effects on selected states (Skiper / Aceternity)
 *   - Ambient floating orb background
 *   - Full integration with AuthContext and tenantService
 */

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useAuth } from '@/features/auth/AuthContext';
import { RentHubLogo } from '@/components/common/RentHubLogo';
import { tenantService } from '@/features/tenant/tenant.service';
import type { TenantPreferences } from '@/types/tenant';
import {
  Home,
  Building,
  Check,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  DollarSign,
  Calendar,
  Users,
  Compass,
  Droplet,
  Car,
  Wifi,
  Zap,
  Heart,
  Sun,
} from 'lucide-react';

type RoleOption = 'tenant' | 'landlord';

const ROLE_META = {
  tenant: {
    label: 'Tenant',
    subtitle: 'Looking for a home to rent',
    description: 'Discover verified rental listings, submit digital applications, sign legal leases, and manage rent & maintenance.',
    icon: Home,
    gradient: 'linear-gradient(135deg, #1567f5 0%, #2e8bff 50%, #06b6d4 100%)',
    glowColor: 'rgba(46, 139, 255, 0.28)',
    accentColor: '#2e8bff',
    accentBg: 'rgba(46, 139, 255, 0.12)',
    accentBorder: 'rgba(46, 139, 255, 0.25)',
    perks: [
      'Verified title-deed properties in Kathmandu Valley',
      'Electronic digital lease agreements',
      'eSewa / Khalti / ConnectIPS rent payments',
      'Maintenance ticketing & dispute protection',
    ],
  },
  landlord: {
    label: 'Landlord',
    subtitle: 'Listing & managing properties',
    description: 'List properties and individual units, screen tenant applications, issue digital leases, and collect rent.',
    icon: Building,
    gradient: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
    glowColor: 'rgba(16, 185, 129, 0.28)',
    accentColor: '#10b981',
    accentBg: 'rgba(16, 185, 129, 0.12)',
    accentBorder: 'rgba(16, 185, 129, 0.25)',
    perks: [
      'Post building & multi-unit listings',
      'Review verified tenant applications',
      'Automated digital lease generation',
      'Rent collection tracking & financial ledger',
    ],
  },
} as const;

const MCQ_QUESTIONS = [
  {
    id: 'housingType',
    title: 'What type of home are you looking for?',
    subtitle: 'We will calibrate your discovery feed to match your preferred layout.',
    icon: Home,
    options: [
      { id: 'apartment',         label: 'Apartment / Flat',   desc: 'Self-contained residential unit in an apartment building' },
      { id: 'independent_house', label: 'Independent Floor',  desc: 'Separate floor in a private residential house' },
      { id: 'studio',            label: 'Studio / 1-BHK',     desc: 'Compact, cost-effective space for a solo professional' },
      { id: 'shared',            label: 'Co-Living / Shared', desc: 'Private bedroom with shared living & kitchen areas' },
    ],
  },
  {
    id: 'budgetBracket',
    title: 'What is your target monthly rent budget?',
    subtitle: 'All listings are priced in Nepali Rupees (NPR). Security deposit is typically 1–2 months.',
    icon: DollarSign,
    options: [
      { id: 'economy',  label: 'Under NPR 15,000 / mo',    desc: 'Budget-conscious flats & studio spaces' },
      { id: 'standard', label: 'NPR 15,000 – 30,000 / mo', desc: 'Popular range for 1–2 BHK modern flats' },
      { id: 'mid',      label: 'NPR 30,000 – 50,000 / mo', desc: 'Spacious 2–3 BHK in prime residential areas' },
      { id: 'premium',  label: 'NPR 50,000+ / mo',          desc: 'Diplomatic & executive residences with full amenities' },
    ],
  },
  {
    id: 'moveInTimeline',
    title: 'When do you plan to move in?',
    subtitle: 'Helps us prioritize units with immediate or upcoming availability.',
    icon: Calendar,
    options: [
      { id: 'immediate',  label: 'Immediately (within 14 days)', desc: 'Ready to inspect and sign agreement now' },
      { id: 'next_month', label: 'Next Month (within 30 days)',  desc: 'Planning ahead for upcoming month turnover' },
      { id: 'flexible',   label: 'Flexible / Just Exploring',    desc: 'Evaluating market options before committing' },
    ],
  },
  {
    id: 'householdSize',
    title: 'Who will be residing in the home?',
    subtitle: 'Landlords appreciate knowing household composition beforehand.',
    icon: Users,
    options: [
      { id: 'solo',      label: 'Just me (Individual)',  desc: 'Working professional or university student' },
      { id: 'couple',    label: 'Couple (2 Persons)',    desc: 'Partners or married couple' },
      { id: 'family',    label: 'Family with Children',  desc: 'Multi-member family household' },
      { id: 'roommates', label: 'Group of Roommates',    desc: 'Colleagues or friends co-renting' },
    ],
  },
];

const AMENITY_OPTIONS = [
  { id: 'water',   label: '24/7 Treated Water', icon: Droplet, desc: 'Deep boring or tanker filtration' },
  { id: 'parking', label: 'Dedicated Parking',  icon: Car,     desc: 'Motorbike or covered car slot' },
  { id: 'wifi',    label: 'High-Speed Wi-Fi',   icon: Wifi,    desc: 'Fiber optic internet pre-installed' },
  { id: 'backup',  label: 'Backup Power',       icon: Zap,     desc: 'Solar inverter or generator support' },
  { id: 'pet',     label: 'Pet-Friendly',       icon: Heart,   desc: 'Pets officially allowed by landlord' },
  { id: 'balcony', label: 'Balcony / Rooftop',  icon: Sun,     desc: 'Open outdoor ventilation' },
];

/* ── Floating Background Orbs ────────────────────────────────────────────── */
function AnimatedBg() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: '700px',
          height: '700px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(46,139,255,0.08) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'floatOrb1 22s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-15%',
          right: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)',
          filter: 'blur(70px)',
          animation: 'floatOrb2 18s ease-in-out infinite',
        }}
      />
      <div className="absolute inset-0 bg-grid-lines opacity-30" />
    </div>
  );
}

/* ── Interactive 3D Role Card (Vengeance UI / Aceternity) ─────────────────── */
function InteractiveRoleCard({
  meta,
  isSelected,
  onClick,
}: {
  role: RoleOption;
  meta: (typeof ROLE_META)[RoleOption];
  isSelected: boolean;
  onClick: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), { stiffness: 220, damping: 25 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), { stiffness: 220, damping: 25 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const Icon = meta.icon;

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      className="cursor-pointer rounded-2xl p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden transition-all duration-300"
    >
      {/* Background card styling */}
      <div
        className="absolute inset-0 rounded-2xl transition-all duration-300"
        style={{
          background: isSelected
            ? 'linear-gradient(135deg, rgba(14,24,38,0.96) 0%, rgba(8,13,20,0.98) 100%)'
            : 'linear-gradient(135deg, rgba(13,21,32,0.65) 0%, rgba(8,13,20,0.75) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: isSelected
            ? `1.5px solid ${meta.accentColor}`
            : '1px solid rgba(255,255,255,0.08)',
          boxShadow: isSelected
            ? `0 0 35px ${meta.glowColor}, 0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)`
            : '0 4px 24px rgba(0,0,0,0.3)',
        }}
      />

      {/* Border beam on top */}
      {isSelected && (
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent, ${meta.accentColor}, transparent)`,
          }}
        />
      )}

      {/* Card Content */}
      <div className="relative z-10 space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div
            className="w-13 h-13 rounded-2xl flex items-center justify-center shadow-lg"
            style={{
              background: meta.gradient,
              boxShadow: isSelected ? `0 0 24px ${meta.glowColor}` : 'none',
            }}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>

          {/* Radio indicator */}
          <div
            className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200"
            style={{
              borderColor: isSelected ? meta.accentColor : 'rgba(255,255,255,0.25)',
              background: isSelected ? meta.accentColor : 'rgba(255,255,255,0.04)',
            }}
          >
            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white shadow-xs" />}
          </div>
        </div>

        <div>
          <h3
            className="text-xl font-bold tracking-tight text-white font-display"
          >
            {meta.label}
          </h3>
          <p className="text-xs font-semibold mt-0.5" style={{ color: meta.accentColor }}>
            {meta.subtitle}
          </p>
          <p className="text-xs leading-relaxed mt-2" style={{ color: '#94aac5' }}>
            {meta.description}
          </p>
        </div>
      </div>

      {/* Perks List */}
      <div
        className="relative z-10 pt-5 mt-5 space-y-2.5"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        {meta.perks.map((perk, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 text-xs transition-colors duration-200"
            style={{ color: isSelected ? '#d8e5f8' : '#7187a5' }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: isSelected ? meta.accentColor : '#5a7299' }}
            />
            <span className="font-medium">{perk}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── MCQ Option ───────────────────────────────────────────────────────────── */
function MCQOption({
  option,
  isSelected,
  onClick,
}: {
  option: { id: string; label: string; desc: string };
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -2, scale: 1.008 }}
      whileTap={{ scale: 0.985 }}
      className="cursor-pointer rounded-2xl p-4 sm:p-5 flex items-start gap-4 relative overflow-hidden transition-all duration-200"
      style={{
        background: isSelected
          ? 'linear-gradient(135deg, rgba(46,139,255,0.12) 0%, rgba(13,21,32,0.9) 100%)'
          : 'rgba(13, 21, 32, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: isSelected
          ? '1px solid rgba(46, 139, 255, 0.45)'
          : '1px solid rgba(255, 255, 255, 0.07)',
        boxShadow: isSelected
          ? '0 0 20px rgba(46,139,255,0.18), 0 4px 16px rgba(0,0,0,0.3)'
          : '0 2px 10px rgba(0,0,0,0.2)',
      }}
    >
      <div
        className="w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all duration-200"
        style={{
          borderColor: isSelected ? '#2e8bff' : 'rgba(255,255,255,0.25)',
          background: isSelected ? '#2e8bff' : 'transparent',
        }}
      >
        {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
      </div>
      <div>
        <p
          className="text-sm font-semibold tracking-tight font-display"
          style={{ color: isSelected ? '#f0f6ff' : '#94aac5' }}
        >
          {option.label}
        </p>
        <p className="text-xs mt-1 leading-relaxed" style={{ color: '#5a7299' }}>
          {option.desc}
        </p>
      </div>
    </motion.div>
  );
}

/* ── Amenity Option ───────────────────────────────────────────────────────── */
function AmenityOption({
  option,
  isChecked,
  onClick,
}: {
  option: typeof AMENITY_OPTIONS[0];
  isChecked: boolean;
  onClick: () => void;
}) {
  const Icon = option.icon;
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="cursor-pointer rounded-2xl p-4 flex items-center gap-3.5 relative overflow-hidden transition-all duration-200"
      style={{
        background: isChecked
          ? 'linear-gradient(135deg, rgba(46,139,255,0.12) 0%, rgba(13,21,32,0.9) 100%)'
          : 'rgba(13, 21, 32, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: isChecked
          ? '1px solid rgba(46, 139, 255, 0.45)'
          : '1px solid rgba(255, 255, 255, 0.07)',
        boxShadow: isChecked
          ? '0 0 20px rgba(46,139,255,0.18)'
          : 'none',
      }}
    >
      <div
        className="p-2.5 rounded-xl shrink-0 transition-colors"
        style={{
          background: isChecked ? 'rgba(46,139,255,0.18)' : 'rgba(255,255,255,0.04)',
          border: isChecked ? '1px solid rgba(46,139,255,0.3)' : '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Icon className="w-4 h-4" style={{ color: isChecked ? '#59aaff' : '#7187a5' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold tracking-tight font-display truncate"
          style={{ color: isChecked ? '#f0f6ff' : '#94aac5' }}
        >
          {option.label}
        </p>
        <p className="text-xs truncate" style={{ color: '#5a7299' }}>
          {option.desc}
        </p>
      </div>
      <div
        className="w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-all"
        style={{
          borderColor: isChecked ? '#2e8bff' : 'rgba(255,255,255,0.25)',
          background: isChecked ? '#2e8bff' : 'transparent',
        }}
      >
        {isChecked && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
      </div>
    </motion.div>
  );
}

/* ── Main Component ──────────────────────────────────────────────────────── */
export function RoleSelectionPage() {
  const { user, completeOnboarding, error, clearError } = useAuth();
  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
  const [currentStep, setCurrentStep] = useState<'role' | 'mcq' | 'summary'>('role');
  const [mcqIndex, setMcqIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'forward' | 'backward'>('forward');

  const [preferences, setPreferences] = useState<TenantPreferences>({
    housingType: 'apartment',
    budgetBracket: 'standard',
    moveInTimeline: 'immediate',
    householdSize: 'solo',
    priorityAmenities: ['water', 'parking', 'wifi'],
    preferredCity: 'Kathmandu',
  });

  const selectRole = useCallback((role: RoleOption) => {
    clearError();
    setSelectedRole(role);
  }, [clearError]);

  const handleRoleContinue = () => {
    if (!selectedRole) return;
    if (selectedRole === 'tenant') {
      setSlideDirection('forward');
      setCurrentStep('mcq');
    } else {
      void handleFinishOnboarding();
    }
  };

  const handleFinishOnboarding = async () => {
    if (!selectedRole || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (selectedRole === 'tenant') {
        tenantService.savePreferences({
          ...preferences,
          completedAt: new Date().toISOString(),
        });
      }
      await completeOnboarding(selectedRole);
    } catch {
      // Error managed in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAmenity = (id: string) => {
    setPreferences(prev => ({
      ...prev,
      priorityAmenities: prev.priorityAmenities.includes(id)
        ? prev.priorityAmenities.filter(a => a !== id)
        : [...prev.priorityAmenities, id],
    }));
  };

  const totalMCQSteps = MCQ_QUESTIONS.length + 1; // +1 for amenities step
  const progressPercent = currentStep === 'mcq'
    ? ((mcqIndex + 1) / totalMCQSteps) * 100
    : currentStep === 'summary' ? 100 : 0;

  const slideVariants = {
    enterForward:  { opacity: 0, x: 40, filter: 'blur(4px)' },
    enterBackward: { opacity: 0, x: -40, filter: 'blur(4px)' },
    center:        { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
    exitForward:   { opacity: 0, x: -40, filter: 'blur(4px)', transition: { duration: 0.25 } },
    exitBackward:  { opacity: 0, x: 40, filter: 'blur(4px)', transition: { duration: 0.25 } },
  };

  const getEnterVariant = () => (slideDirection === 'forward' ? 'enterForward' : 'enterBackward');
  const getExitVariant  = () => (slideDirection === 'forward' ? 'exitForward'  : 'exitBackward');

  return (
    <div
      className="min-h-screen flex flex-col justify-between relative overflow-hidden"
      style={{ background: 'var(--surface-0)' }}
    >
      <AnimatedBg />

      {/* Header */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-8 pt-6 pb-4 flex items-center justify-between">
        <RentHubLogo variant="white" className="h-8" />
        <div className="flex items-center gap-3">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-8 h-8 rounded-full"
              style={{ border: '2px solid rgba(46,139,255,0.3)' }}
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #1567f5, #7c3aed)' }}
            >
              {user?.name?.[0] ?? 'U'}
            </div>
          )}
          <span
            className="text-sm font-medium hidden sm:inline font-display"
            style={{ color: '#94aac5' }}
          >
            {user?.name}
          </span>
        </div>
      </header>

      {/* Progress Bar (MCQ only) */}
      <AnimatePresence>
        {currentStep !== 'role' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-8 mb-2"
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-xs font-semibold uppercase tracking-wider font-display"
                style={{ color: '#5a7299' }}
              >
                Tenant Onboarding Questionnaire
              </span>
              <span
                className="text-xs font-semibold font-display"
                style={{ color: '#59aaff' }}
              >
                {currentStep === 'summary' ? 'Complete' : `Step ${mcqIndex + 1} of ${totalMCQSteps}`}
              </span>
            </div>
            <div className="progress-bar">
              <motion.div
                className="progress-fill"
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Flow */}
      <main className="relative z-10 flex-1 flex flex-col justify-center w-full max-w-3xl mx-auto px-4 sm:px-8 py-6">
        <AnimatePresence mode="wait" custom={slideDirection}>
          {/* STEP 1: ROLE SELECTION */}
          {currentStep === 'role' && (
            <motion.div
              key="step-role"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              {/* Hero text */}
              <div className="text-center max-w-2xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 font-display"
                  style={{
                    background: 'rgba(46,139,255,0.1)',
                    border: '1px solid rgba(46,139,255,0.25)',
                    color: '#59aaff',
                  }}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Google Verified Account
                </motion.div>
                <h1
                  className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-display text-balance"
                >
                  Choose your RentHub role
                </h1>
                <p className="mt-3 text-sm sm:text-base" style={{ color: '#94aac5' }}>
                  RentHub enforces a single dedicated role per account. Choose whether you
                  will use RentHub as a Tenant or Landlord.
                </p>
              </div>

              {/* Role Cards */}
              <div className="grid sm:grid-cols-2 gap-5">
                {(['tenant', 'landlord'] as const).map(role => (
                  <InteractiveRoleCard
                    key={role}
                    role={role}
                    meta={ROLE_META[role]}
                    isSelected={selectedRole === role}
                    onClick={() => selectRole(role)}
                  />
                ))}
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="auth-alert-error"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Continue CTA */}
              <button
                type="button"
                onClick={handleRoleContinue}
                disabled={!selectedRole || isSubmitting}
                className="btn-primary btn-lg w-full shine-hover"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Finalizing account…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Continue {selectedRole === 'tenant' ? 'to Personalization' : 'as Landlord'}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </motion.div>
          )}

          {/* STEP 2: TENANT MCQs */}
          {currentStep === 'mcq' && mcqIndex < MCQ_QUESTIONS.length && (() => {
            const question = MCQ_QUESTIONS[mcqIndex];
            const currentVal = preferences[question.id as keyof TenantPreferences] as string;
            const Icon = question.icon;
            return (
              <motion.div
                key={`mcq-${mcqIndex}`}
                custom={slideDirection}
                initial={getEnterVariant()}
                animate="center"
                exit={getExitVariant()}
                variants={slideVariants}
                className="space-y-6"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                    style={{
                      background: 'rgba(46,139,255,0.12)',
                      border: '1px solid rgba(46,139,255,0.25)',
                    }}
                  >
                    <Icon className="w-6 h-6" style={{ color: '#59aaff' }} />
                  </div>
                  <div>
                    <h2
                      className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display"
                    >
                      {question.title}
                    </h2>
                    <p className="mt-1 text-sm" style={{ color: '#94aac5' }}>
                      {question.subtitle}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3.5 sm:grid-cols-2">
                  {question.options.map(opt => (
                    <MCQOption
                      key={opt.id}
                      option={opt}
                      isSelected={currentVal === opt.id}
                      onClick={() => setPreferences(prev => ({ ...prev, [question.id]: opt.id }))}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSlideDirection('backward');
                      if (mcqIndex === 0) setCurrentStep('role');
                      else setMcqIndex(i => i - 1);
                    }}
                    className="btn-ghost btn-sm inline-flex items-center gap-2"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSlideDirection('forward');
                      setMcqIndex(i => i + 1);
                    }}
                    className="btn-primary btn-sm inline-flex items-center gap-2"
                  >
                    Next <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })()}

          {/* STEP 2B: AMENITIES */}
          {currentStep === 'mcq' && mcqIndex === MCQ_QUESTIONS.length && (
            <motion.div
              key="mcq-amenities"
              custom={slideDirection}
              initial={getEnterVariant()}
              animate="center"
              exit={getExitVariant()}
              variants={slideVariants}
              className="space-y-6"
            >
              <div>
                <h2
                  className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display"
                >
                  What amenities are essential?
                </h2>
                <p className="mt-1 text-sm" style={{ color: '#94aac5' }}>
                  Select all that apply. In Kathmandu Valley, 24/7 treated water and parking are highly recommended.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {AMENITY_OPTIONS.map(opt => (
                  <AmenityOption
                    key={opt.id}
                    option={opt}
                    isChecked={preferences.priorityAmenities.includes(opt.id)}
                    onClick={() => toggleAmenity(opt.id)}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setSlideDirection('backward');
                    setMcqIndex(i => i - 1);
                  }}
                  className="btn-ghost btn-sm inline-flex items-center gap-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSlideDirection('forward');
                    setCurrentStep('summary');
                  }}
                  className="btn-primary btn-sm inline-flex items-center gap-2"
                >
                  Review Profile <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: SUMMARY */}
          {currentStep === 'summary' && (
            <motion.div
              key="step-summary"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              {/* Success header */}
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.1 }}
                  className="inline-flex p-3.5 rounded-2xl mb-4"
                  style={{
                    background: 'rgba(46,139,255,0.12)',
                    border: '1px solid rgba(46,139,255,0.25)',
                    boxShadow: '0 0 24px rgba(46,139,255,0.2)',
                  }}
                >
                  <Sparkles className="w-7 h-7" style={{ color: '#59aaff' }} />
                </motion.div>
                <h2
                  className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display"
                >
                  Your Renter Profile is Calibrated!
                </h2>
                <p className="mt-2 text-sm" style={{ color: '#94aac5' }}>
                  We've personalized your rental discovery feed based on your preferences.
                </p>
              </div>

              {/* Summary Card */}
              <div className="card-premium p-6 sm:p-7 space-y-5">
                <div
                  className="flex items-center justify-between pb-4"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <span
                    className="text-xs uppercase tracking-widest font-bold font-display"
                    style={{ color: '#5a7299' }}
                  >
                    Preference Summary
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSlideDirection('backward');
                      setMcqIndex(0);
                      setCurrentStep('mcq');
                    }}
                    className="text-xs font-semibold transition-colors font-display"
                    style={{ color: '#59aaff' }}
                  >
                    Edit Answers
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-3.5">
                  {[
                    { label: 'Home Layout', value: preferences.housingType.replace('_', ' ') },
                    {
                      label: 'Target Budget',
                      value:
                        preferences.budgetBracket === 'economy'
                          ? 'Under NPR 15,000'
                          : preferences.budgetBracket === 'standard'
                          ? 'NPR 15,000 – 30,000'
                          : preferences.budgetBracket === 'mid'
                          ? 'NPR 30,000 – 50,000'
                          : 'NPR 50,000+',
                    },
                    { label: 'Move-in Timeline', value: preferences.moveInTimeline.replace('_', ' ') },
                    { label: 'Household Composition', value: preferences.householdSize },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="p-3.5 rounded-xl"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      <span className="block text-xs" style={{ color: '#5a7299' }}>
                        {label}
                      </span>
                      <span
                        className="font-bold capitalize text-sm text-white font-display mt-0.5 block"
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                {preferences.priorityAmenities.length > 0 && (
                  <div className="pt-2">
                    <span className="block text-xs mb-2.5" style={{ color: '#5a7299' }}>
                      Priority Amenities
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {preferences.priorityAmenities.map(id => {
                        const item = AMENITY_OPTIONS.find(a => a.id === id);
                        return (
                          <span key={id} className="badge-info">
                            {item?.label ?? id}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="auth-alert-error"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="button"
                onClick={handleFinishOnboarding}
                disabled={isSubmitting}
                className="btn-primary btn-lg w-full shine-hover"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving and Launching Feed…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Complete & Launch RentHub Feed
                    <Compass className="w-4 h-4" />
                  </span>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer
        className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-8 py-6 text-center text-xs"
        style={{ color: '#4a6285' }}
      >
        RentHub Nepal · Secure digital tenancy agreements compliant with the National Civil Code.
      </footer>
    </div>
  );
}
