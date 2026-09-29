/**
 * RoleSelectionPage
 *
 * RentHub Onboarding Experience:
 *   Step 1: Role Selection (Tenant vs Landlord)
 *   Step 2: Tenant Housing Preferences & Requirements Questionnaire (MCQs)
 *   Step 3: Personalization confirmation → /dashboard
 *
 * Preserves Google auth session via completeOnboarding from AuthContext.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
    gradient: 'from-brand-600 to-brand-400',
    ring: 'ring-brand-500/30',
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
    gradient: 'from-emerald-600 to-teal-500',
    ring: 'ring-emerald-500/30',
    perks: [
      'Post building & multi-unit listings',
      'Review verified tenant applications',
      'Automated digital lease generation',
      'Rent collection tracking & financial ledger',
    ],
  },
} as const;

// ── Onboarding MCQ Definitions ─────────────────────────────────────────────
const MCQ_QUESTIONS = [
  {
    id: 'housingType',
    title: 'What type of home are you looking for?',
    subtitle: 'We will calibrate your discovery feed to match your preferred layout.',
    icon: Home,
    options: [
      { id: 'apartment', label: 'Apartment / Flat', desc: 'Self-contained residential unit in an apartment building' },
      { id: 'independent_house', label: 'Independent Floor', desc: 'Separate floor in a private residential house' },
      { id: 'studio', label: 'Studio / 1-BHK', desc: 'Compact, cost-effective space for a solo professional' },
      { id: 'shared', label: 'Co-Living / Shared', desc: 'Private bedroom with shared living & kitchen areas' },
    ],
  },
  {
    id: 'budgetBracket',
    title: 'What is your target monthly rent budget?',
    subtitle: 'All listings are priced in Nepali Rupees (NPR). Security deposit is typically 1–2 months.',
    icon: DollarSign,
    options: [
      { id: 'economy', label: 'Under NPR 15,000 / mo', desc: 'Budget-conscious flats & studio spaces' },
      { id: 'standard', label: 'NPR 15,000 – 30,000 / mo', desc: 'Popular range for 1–2 BHK modern flats' },
      { id: 'mid', label: 'NPR 30,000 – 50,000 / mo', desc: 'Spacious 2–3 BHK in prime residential areas' },
      { id: 'premium', label: 'NPR 50,000+ / mo', desc: 'Diplomatic & executive residences with full amenities' },
    ],
  },
  {
    id: 'moveInTimeline',
    title: 'When do you plan to move in?',
    subtitle: 'Helps us prioritize units with immediate or upcoming availability.',
    icon: Calendar,
    options: [
      { id: 'immediate', label: 'Immediately (within 14 days)', desc: 'Ready to inspect and sign agreement now' },
      { id: 'next_month', label: 'Next Month (within 30 days)', desc: 'Planning ahead for upcoming month turnover' },
      { id: 'flexible', label: 'Flexible / Just Exploring', desc: 'Evaluating market options before committing' },
    ],
  },
  {
    id: 'householdSize',
    title: 'Who will be residing in the home?',
    subtitle: 'Landlords appreciate knowing household composition beforehand.',
    icon: Users,
    options: [
      { id: 'solo', label: 'Just me (Individual)', desc: 'Working professional or university student' },
      { id: 'couple', label: 'Couple (2 Persons)', desc: 'Partners or married couple' },
      { id: 'family', label: 'Family with Children', desc: 'Multi-member family household' },
      { id: 'roommates', label: 'Group of Roommates', desc: 'Colleagues or friends co-renting' },
    ],
  },
];

const AMENITY_OPTIONS = [
  { id: 'water', label: '24/7 Treated Water', icon: Droplet, desc: 'Deep boring or tanker filtration' },
  { id: 'parking', label: 'Dedicated Parking', icon: Car, desc: 'Motorbike or covered car slot' },
  { id: 'wifi', label: 'High-Speed Wi-Fi', icon: Wifi, desc: 'Fiber optic internet pre-installed' },
  { id: 'backup', label: 'Backup Power', icon: Zap, desc: 'Solar inverter or generator support' },
  { id: 'pet', label: 'Pet-Friendly', icon: Heart, desc: 'Pets officially allowed by landlord' },
  { id: 'balcony', label: 'Balcony / Rooftop', icon: Sun, desc: 'Open outdoor ventilation' },
];

export function RoleSelectionPage() {
  const { user, completeOnboarding, error, clearError } = useAuth();
  const [selectedRoles, setSelectedRoles] = useState<RoleOption[]>([]);
  const [currentStep, setCurrentStep] = useState<'role' | 'mcq' | 'summary'>('role');
  const [mcqIndex, setMcqIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tenant MCQ answers state
  const [preferences, setPreferences] = useState<TenantPreferences>({
    housingType: 'apartment',
    budgetBracket: 'standard',
    moveInTimeline: 'immediate',
    householdSize: 'solo',
    priorityAmenities: ['water', 'parking', 'wifi'],
    preferredCity: 'Kathmandu',
  });

  const toggleRole = useCallback((role: RoleOption) => {
    clearError();
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  }, [clearError]);

  const handleRoleContinue = () => {
    if (selectedRoles.length === 0) return;
    if (selectedRoles.includes('tenant')) {
      setCurrentStep('mcq');
    } else {
      // Landlord only
      void handleFinishOnboarding();
    }
  };

  const handleFinishOnboarding = async () => {
    if (selectedRoles.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (selectedRoles.includes('tenant')) {
        tenantService.savePreferences({
          ...preferences,
          completedAt: new Date().toISOString(),
        });
      }
      await completeOnboarding(selectedRoles);
      // Navigation is triggered automatically when AuthContext status switches to 'authenticated'
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Subtle architectural background texture */}
      <div
        className="fixed inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-4 flex items-center justify-between">
        <RentHubLogo variant="white" className="h-7" />
        <div className="flex items-center gap-3">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full ring-1 ring-white/20" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-xs font-semibold">
              {user?.name?.[0] ?? 'U'}
            </div>
          )}
          <span className="text-sm font-medium text-slate-300 hidden sm:inline">{user?.name}</span>
        </div>
      </header>

      {/* Main Flow Container */}
      <main className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 flex-1 flex flex-col justify-center">
        {/* Step Indicator when in MCQ */}
        {currentStep === 'mcq' && (
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              <span>Tenant Onboarding Questionnaire</span>
              <span>Question {mcqIndex + 1} of {MCQ_QUESTIONS.length + 1}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-brand-500 rounded-full"
                animate={{ width: `${((mcqIndex + 1) / (MCQ_QUESTIONS.length + 1)) * 100}%` }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 1: ROLE SELECTION */}
          {currentStep === 'role' && (
            <motion.div
              key="step-role"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              className="space-y-6"
            >
              <div className="text-center max-w-xl mx-auto">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-brand-950 text-brand-300 border border-brand-800/60 mb-3">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-400" /> Google Verified Account
                </span>
                <h1 className="text-2xl sm:text-3xl font-display font-semibold text-white tracking-tight">
                  Welcome, {user?.name?.split(' ')[0] ?? 'Friend'}!
                </h1>
                <p className="mt-2 text-slate-400 text-sm sm:text-base">
                  Choose how you want to begin on RentHub. You can add more roles anytime from your profile settings.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {(['tenant', 'landlord'] as const).map(role => {
                  const meta = ROLE_META[role];
                  const Icon = meta.icon;
                  const isSelected = selectedRoles.includes(role);

                  return (
                    <motion.div
                      key={role}
                      onClick={() => toggleRole(role)}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className={`cursor-pointer rounded-2xl p-6 border transition-all duration-200 relative flex flex-col justify-between ${
                        isSelected
                          ? `bg-slate-900 border-brand-400 ring-2 ${meta.ring}`
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center shadow-md`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div
                            className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-brand-500 border-brand-500 text-white' : 'border-slate-700 bg-slate-800'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>

                        <h3 className="text-lg font-display font-semibold text-white">{meta.label}</h3>
                        <p className="text-xs text-brand-400 font-medium mb-2">{meta.subtitle}</p>
                        <p className="text-xs text-slate-400 leading-relaxed mb-4">{meta.description}</p>
                      </div>

                      <div className="pt-4 border-t border-slate-800/80 space-y-1.5">
                        {meta.perks.map((perk, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                            <span>{perk}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {error && (
                <div className="rounded-xl bg-red-950/60 border border-red-800/60 p-3 text-xs text-red-300 text-center">
                  {error}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleRoleContinue}
                  disabled={selectedRoles.length === 0 || isSubmitting}
                  className={`w-full py-3.5 px-6 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    selectedRoles.length === 0
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/30'
                  }`}
                >
                  {isSubmitting ? (
                    'Finalizing account…'
                  ) : (
                    <>
                      <span>Continue {selectedRoles.includes('tenant') ? 'to Personalization' : 'as Landlord'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: TENANT HOUSING MCQS */}
          {currentStep === 'mcq' && mcqIndex < MCQ_QUESTIONS.length && (
            <motion.div
              key={`mcq-${mcqIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {(() => {
                const question = MCQ_QUESTIONS[mcqIndex];
                const currentVal = preferences[question.id as keyof TenantPreferences] as string;

                return (
                  <>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-display font-semibold text-white tracking-tight">
                        {question.title}
                      </h2>
                      <p className="mt-1 text-slate-400 text-sm">{question.subtitle}</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {question.options.map(opt => {
                        const isChosen = currentVal === opt.id;
                        return (
                          <div
                            key={opt.id}
                            onClick={() =>
                              setPreferences(prev => ({ ...prev, [question.id]: opt.id }))
                            }
                            className={`cursor-pointer rounded-xl p-4.5 border transition-all duration-150 flex items-start gap-3.5 ${
                              isChosen
                                ? 'bg-brand-950/60 border-brand-400 ring-1 ring-brand-400'
                                : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full border shrink-0 mt-0.5 flex items-center justify-center ${
                                isChosen ? 'bg-brand-500 border-brand-500 text-white' : 'border-slate-700 bg-slate-800'
                              }`}
                            >
                              {isChosen && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">{opt.label}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          if (mcqIndex === 0) setCurrentStep('role');
                          else setMcqIndex(i => i - 1);
                        }}
                        className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-900 transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                      </button>

                      <button
                        type="button"
                        onClick={() => setMcqIndex(i => i + 1)}
                        className="inline-flex items-center gap-2 text-xs font-medium bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 rounded-lg shadow-sm transition-colors"
                      >
                        <span>Next</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          )}

          {/* STEP 2B: AMENITIES MULTI-SELECT QUESTION */}
          {currentStep === 'mcq' && mcqIndex === MCQ_QUESTIONS.length && (
            <motion.div
              key="mcq-amenities"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl sm:text-2xl font-display font-semibold text-white tracking-tight">
                  What amenities are essential for your tenancy?
                </h2>
                <p className="mt-1 text-slate-400 text-sm">
                  Select all that apply. In Kathmandu, 24/7 water and parking are highly recommended.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {AMENITY_OPTIONS.map(opt => {
                  const Icon = opt.icon;
                  const isChecked = preferences.priorityAmenities.includes(opt.id);

                  return (
                    <div
                      key={opt.id}
                      onClick={() => toggleAmenity(opt.id)}
                      className={`cursor-pointer rounded-xl p-4 border transition-all duration-150 flex items-start gap-3.5 ${
                        isChecked
                          ? 'bg-brand-950/60 border-brand-400 ring-1 ring-brand-400'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${isChecked ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-white">{opt.label}</p>
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center ${
                              isChecked ? 'bg-brand-500 border-brand-500 text-white' : 'border-slate-700 bg-slate-800'
                            }`}
                          >
                            {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setMcqIndex(i => i - 1)}
                  className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-900 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep('summary')}
                  className="inline-flex items-center gap-2 text-xs font-medium bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 rounded-lg shadow-sm transition-colors"
                >
                  <span>Review Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: SUMMARY & CONFIRMATION */}
          {currentStep === 'summary' && (
            <motion.div
              key="step-summary"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              className="space-y-6"
            >
              <div className="text-center">
                <div className="inline-flex p-3 rounded-2xl bg-brand-500/20 text-brand-400 border border-brand-500/30 mb-3">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-display font-semibold text-white">Your Renter Profile is Ready!</h2>
                <p className="text-slate-400 text-sm mt-1">
                  We’ve personalized your rental discovery feed based on your answers.
                </p>
              </div>

              {/* Preference Digest Card */}
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Preference Summary</span>
                  <button
                    type="button"
                    onClick={() => {
                      setMcqIndex(0);
                      setCurrentStep('mcq');
                    }}
                    className="text-xs text-brand-400 hover:underline"
                  >
                    Edit Answers
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Home Layout</span>
                    <span className="font-semibold text-white capitalize text-sm">
                      {preferences.housingType.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Target Budget</span>
                    <span className="font-semibold text-white capitalize text-sm">
                      {preferences.budgetBracket === 'economy' && 'Under NPR 15,000'}
                      {preferences.budgetBracket === 'standard' && 'NPR 15,000 – 30,000'}
                      {preferences.budgetBracket === 'mid' && 'NPR 30,000 – 50,000'}
                      {preferences.budgetBracket === 'premium' && 'NPR 50,000+'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Move-in Date</span>
                    <span className="font-semibold text-white capitalize text-sm">
                      {preferences.moveInTimeline.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Household</span>
                    <span className="font-semibold text-white capitalize text-sm">
                      {preferences.householdSize}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-slate-500 block text-xs mb-1.5">Priority Amenities</span>
                  <div className="flex flex-wrap gap-1.5">
                    {preferences.priorityAmenities.map(id => {
                      const item = AMENITY_OPTIONS.find(a => a.id === id);
                      return (
                        <span
                          key={id}
                          className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium"
                        >
                          {item?.label ?? id}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-950/60 border border-red-800/60 p-3 text-xs text-red-300 text-center">
                  {error}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleFinishOnboarding}
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-xl font-medium text-sm bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    'Saving and Launching Discovery Feed…'
                  ) : (
                    <>
                      <span>Complete & Launch RentHub Feed</span>
                      <Compass className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-slate-600">
        RentHub Nepal · Secure digital tenancy agreements compliant with the National Civil Code.
      </footer>
    </div>
  );
}
