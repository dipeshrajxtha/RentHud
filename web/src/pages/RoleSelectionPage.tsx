/**
 * RoleSelectionPage — Clean, Modern, User-Friendly Light Mode Onboarding
 * 
 * Features:
 *   - Clean Slate & White cards with accessible high-contrast typography
 *   - Interactive Tenant & Landlord role selector with clear visual affordances
 *   - Step-by-step preference questionnaire for tenants
 *   - Real-time save to tenantService and AuthContext
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/features/auth/AuthContext';
import { RentHubLogo } from '@/components/common/RentHubLogo';
import { tenantService } from '@/features/tenant/tenant.service';
import type { TenantPreferences } from '@/types/tenant';
import {
  Home,
  Building2,
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
  AlertCircle,
} from 'lucide-react';

type RoleOption = 'tenant' | 'landlord';

const ROLE_META = {
  tenant: {
    label: 'Tenant',
    subtitle: 'Looking for a verified home to rent',
    description: 'Discover verified rental listings, submit digital applications, sign electronic leases, and pay rent online.',
    icon: Home,
    accentColor: '#2563eb',
    badgeText: 'Renter Portal',
    perks: [
      'Verified title-deed listings in Kathmandu Valley',
      'Electronic digital lease agreements',
      'eSewa / Khalti / ConnectIPS rent receipts',
      'Direct maintenance ticketing & dispute resolution',
    ],
  },
  landlord: {
    label: 'Landlord',
    subtitle: 'Listing & managing rental properties',
    description: 'Post buildings and individual units, screen tenant applications, issue digital leases, and collect rent.',
    icon: Building2,
    accentColor: '#059669',
    badgeText: 'Property Manager',
    perks: [
      'Post building & multi-unit listings',
      'Review verified tenant background applications',
      'Automated digital lease contract generation',
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
      { id: 'studio',            label: 'Studio / 1-BHK',     desc: 'Compact, cost-effective space for an individual' },
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
      { id: 'premium',  label: 'NPR 50,000+ / mo',          desc: 'Executive residences with full amenities' },
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
      { id: 'solo',      label: 'Just me (Individual)',  desc: 'Working professional or student' },
      { id: 'couple',    label: 'Couple (2 Persons)',    desc: 'Partners or married couple' },
      { id: 'family',    label: 'Family with Children',  desc: 'Multi-member family household' },
      { id: 'roommates', label: 'Group of Roommates',    desc: 'Colleagues or friends co-renting' },
    ],
  },
];

const AMENITY_OPTIONS = [
  { id: 'water',   label: '24/7 Treated Water', icon: Droplet, desc: 'Deep boring or filtration' },
  { id: 'parking', label: 'Dedicated Parking',  icon: Car,     desc: 'Motorbike or covered car slot' },
  { id: 'wifi',    label: 'High-Speed Wi-Fi',   icon: Wifi,    desc: 'Fiber optic internet pre-installed' },
  { id: 'backup',  label: 'Backup Power',       icon: Zap,     desc: 'Solar inverter or generator support' },
  { id: 'pet',     label: 'Pet-Friendly',       icon: Heart,   desc: 'Pets officially allowed by landlord' },
  { id: 'balcony', label: 'Balcony / Rooftop',  icon: Sun,     desc: 'Open outdoor ventilation' },
];

export function RoleSelectionPage() {
  const { user, completeOnboarding, error, clearError } = useAuth();
  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
  const [currentStep, setCurrentStep] = useState<'role' | 'mcq' | 'summary'>('role');
  const [mcqIndex, setMcqIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const totalMCQSteps = MCQ_QUESTIONS.length + 1;
  const progressPercent = currentStep === 'mcq'
    ? ((mcqIndex + 1) / totalMCQSteps) * 100
    : currentStep === 'summary' ? 100 : 0;

  return (
    <div className=min-h-screen bg-slate-50 flex flex-col justify-between>
      {/* Header */}
      <header className=w-full max-w-5xl mx-auto px-4 sm:px-8 pt-6 pb-4 flex items-center justify-between>
        <RentHubLogo variant=original size=md />
        <div className=flex items-center gap-3 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-xs>
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className=w-7 h-7 rounded-full border border-blue-200
            />
          ) : (
            <div className=w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white>
              {user?.name?.[0] ?? 'U'}
            </div>
          )}
          <span className=text-xs font-semibold text-slate-800 font-display>
            {user?.name ?? 'My Account'}
          </span>
        </div>
      </header>

      {/* Progress Bar (Questionnaire only) */}
      <AnimatePresence>
        {currentStep !== 'role' && (
          <div className=w-full max-w-3xl mx-auto px-4 sm:px-8 mb-4>
            <div className=flex items-center justify-between mb-2>
              <span className=text-xs font-bold uppercase tracking-wider text-slate-500 font-display>
                Renter Preference Setup
              </span>
              <span className=text-xs font-bold text-blue-600 font-display>
                {currentStep === 'summary' ? 'Ready to launch' : Step  of }
              </span>
            </div>
            <div className=w-full h-2 rounded-full bg-slate-200 overflow-hidden>
              <div
                className=h-full bg-blue-600 rounded-full transition-all duration-300 ease-out
                style={{ width: ${progressPercent}% }}
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <main className=flex-1 flex flex-col justify-center w-full max-w-3xl mx-auto px-4 sm:px-8 py-6>
        <AnimatePresence mode=wait>
          {/* STEP 1: ROLE SELECTION */}
          {currentStep === 'role' && (
            <motion.div
              key=step-role
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className=space-y-8
            >
              <div className=text-center max-w-2xl mx-auto>
                <div className=inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 mb-4 font-display>
                  <ShieldCheck className=w-4 h-4 text-blue-600 />
                  Account Verified via Google
                </div>
                <h1 className=text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-display>
                  How will you use RentHub?
                </h1>
                <p className=mt-2 text-sm sm:text-base text-slate-600>
                  Select your primary role. Each account is calibrated with tailored tools and workflows.
                </p>
              </div>

              {/* Role Cards Grid */}
              <div className=grid sm:grid-cols-2 gap-5>
                {(['tenant', 'landlord'] as const).map(role => {
                  const meta = ROLE_META[role];
                  const isSelected = selectedRole === role;
                  const Icon = meta.icon;

                  return (
                    <div
                      key={role}
                      onClick={() => selectRole(role)}
                      className={cursor-pointer rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 border-2 }
                    >
                      <div className=space-y-4>
                        <div className=flex items-center justify-between>
                          <div
                            className={w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm }
                          >
                            <Icon className=w-6 h-6 />
                          </div>
                          <div
                            className={w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors }
                          >
                            {isSelected && <div className=w-2.5 h-2.5 rounded-full bg-white />}
                          </div>
                        </div>

                        <div>
                          <h3 className=text-xl font-bold text-slate-900 font-display>
                            {meta.label}
                          </h3>
                          <p className={	ext-xs font-bold mt-0.5 }>
                            {meta.subtitle}
                          </p>
                          <p className=text-xs text-slate-600 leading-relaxed mt-2>
                            {meta.description}
                          </p>
                        </div>
                      </div>

                      <div className=pt-5 mt-5 border-t border-slate-100 space-y-2>
                        {meta.perks.map((perk, i) => (
                          <div key={i} className=flex items-center gap-2 text-xs text-slate-700 font-medium>
                            <span
                              className={w-1.5 h-1.5 rounded-full shrink-0 }
                            />
                            <span>{perk}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Error */}
              {error && (
                <div className=p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2>
                  <AlertCircle className=w-4 h-4 text-rose-600 shrink-0 />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type=button
                onClick={handleRoleContinue}
                disabled={!selectedRole || isSubmitting}
                className=w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed
              >
                {isSubmitting ? (
                  <span className=flex items-center gap-2>
                    <div className=w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin />
                    Finalizing account...
                  </span>
                ) : (
                  <span className=flex items-center gap-2>
                    Continue {selectedRole === 'tenant' ? 'to Renter Setup' : 'as Landlord'}
                    <ArrowRight className=w-4 h-4 />
                  </span>
                )}
              </button>
            </motion.div>
          )}

          {/* STEP 2: TENANT MCQ QUESTIONS */}
          {currentStep === 'mcq' && mcqIndex < MCQ_QUESTIONS.length && (() => {
            const question = MCQ_QUESTIONS[mcqIndex];
            const currentVal = preferences[question.id as keyof TenantPreferences] as string;
            const Icon = question.icon;

            return (
              <motion.div
                key={mcq-}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className=space-y-6
              >
                <div className=flex items-start gap-3.5>
                  <div className=w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-blue-600 shadow-xs>
                    <Icon className=w-6 h-6 />
                  </div>
                  <div>
                    <h2 className=text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-display>
                      {question.title}
                    </h2>
                    <p className=text-xs sm:text-sm text-slate-500 mt-1>
                      {question.subtitle}
                    </p>
                  </div>
                </div>

                <div className=space-y-3>
                  {question.options.map(opt => {
                    const isSelected = currentVal === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() =>
                          setPreferences(prev => ({
                            ...prev,
                            [question.id]: opt.id,
                          }))
                        }
                        className={cursor-pointer rounded-2xl p-4 sm:p-5 flex items-start gap-4 transition-all border-2 }
                      >
                        <div
                          className={w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors }
                        >
                          {isSelected && <Check className=w-3 h-3 stroke-[3] />}
                        </div>
                        <div>
                          <p className={	ext-sm font-bold font-display }>
                            {opt.label}
                          </p>
                          <p className=text-xs text-slate-500 mt-0.5 leading-relaxed>
                            {opt.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className=flex items-center justify-between pt-4>
                  <button
                    type=button
                    onClick={() => {
                      if (mcqIndex === 0) setCurrentStep('role');
                      else setMcqIndex(i => i - 1);
                    }}
                    className=px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-colors flex items-center gap-1.5
                  >
                    <ArrowLeft className=w-3.5 h-3.5 />
                    Back
                  </button>
                  <button
                    type=button
                    onClick={() => setMcqIndex(i => i + 1)}
                    className=px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-colors
                  >
                    Continue <ArrowRight className=w-3.5 h-3.5 />
                  </button>
                </div>
              </motion.div>
            );
          })()}

          {/* STEP 2B: AMENITIES SELECTION */}
          {currentStep === 'mcq' && mcqIndex === MCQ_QUESTIONS.length && (
            <motion.div
              key=mcq-amenities
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className=space-y-6
            >
              <div className=flex items-start gap-3.5>
                <div className=w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-blue-600 shadow-xs>
                  <Sparkles className=w-6 h-6 />
                </div>
                <div>
                  <h2 className=text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-display>
                    Which amenities are essential for you?
                  </h2>
                  <p className=text-xs sm:text-sm text-slate-500 mt-1>
                    Select all that apply. We will flag listings that fulfill your priorities.
                  </p>
                </div>
              </div>

              <div className=grid sm:grid-cols-2 gap-3>
                {AMENITY_OPTIONS.map(opt => {
                  const isChecked = preferences.priorityAmenities.includes(opt.id);
                  const Icon = opt.icon;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => toggleAmenity(opt.id)}
                      className={cursor-pointer rounded-2xl p-4 flex items-center gap-3.5 transition-all border-2 }
                    >
                      <div className={p-2.5 rounded-xl shrink-0 }>
                        <Icon className=w-4 h-4 />
                      </div>
                      <div className=flex-1 min-w-0>
                        <p className={	ext-sm font-bold truncate font-display }>
                          {opt.label}
                        </p>
                        <p className=text-xs text-slate-500 truncate>{opt.desc}</p>
                      </div>
                      <div
                        className={w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-colors }
                      >
                        {isChecked && <Check className=w-3.5 h-3.5 stroke-[3] />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className=flex items-center justify-between pt-4>
                <button
                  type=button
                  onClick={() => setMcqIndex(i => i - 1)}
                  className=px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-colors flex items-center gap-1.5
                >
                  <ArrowLeft className=w-3.5 h-3.5 />
                  Back
                </button>
                <button
                  type=button
                  onClick={() => setCurrentStep('summary')}
                  className=px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-colors
                >
                  Review Profile <ArrowRight className=w-3.5 h-3.5 />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: SUMMARY */}
          {currentStep === 'summary' && (
            <motion.div
              key=step-summary
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className=space-y-6
            >
              <div className=text-center>
                <div className=w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-sm>
                  <Sparkles className=w-7 h-7 />
                </div>
                <h2 className=text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display>
                  Your Renter Profile is Ready!
                </h2>
                <p className=mt-1 text-sm text-slate-500>
                  We've tailored your Kathmandu property feed according to your selections.
                </p>
              </div>

              {/* Summary Card */}
              <div className=bg-white rounded-3xl border border-slate-200/90 shadow-md p-6 sm:p-7 space-y-5>
                <div className=flex items-center justify-between pb-4 border-b border-slate-100>
                  <span className=text-xs uppercase tracking-wider font-bold text-slate-500 font-display>
                    Preferences Overview
                  </span>
                  <button
                    type=button
                    onClick={() => {
                      setMcqIndex(0);
                      setCurrentStep('mcq');
                    }}
                    className=text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors
                  >
                    Edit Selections
                  </button>
                </div>

                <div className=grid sm:grid-cols-2 gap-3.5>
                  {[
                    { label: 'Layout Preference', value: preferences.housingType.replace('_', ' ') },
                    {
                      label: 'Target Budget',
                      value:
                        preferences.budgetBracket === 'economy'
                          ? 'Under NPR 15,000 / mo'
                          : preferences.budgetBracket === 'standard'
                          ? 'NPR 15,000 – 30,000 / mo'
                          : preferences.budgetBracket === 'mid'
                          ? 'NPR 30,000 – 50,000 / mo'
                          : 'NPR 50,000+ / mo',
                    },
                    { label: 'Move-in Timeline', value: preferences.moveInTimeline.replace('_', ' ') },
                    { label: 'Household Group', value: preferences.householdSize },
                  ].map(({ label, value }) => (
                    <div key={label} className=p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80>
                      <span className=block text-[11px] font-semibold text-slate-500 uppercase tracking-wide>
                        {label}
                      </span>
                      <span className=font-bold capitalize text-sm text-slate-900 font-display mt-0.5 block>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                {preferences.priorityAmenities.length > 0 && (
                  <div className=pt-2>
                    <span className=block text-xs font-semibold text-slate-500 mb-2>
                      Priority Amenities
                    </span>
                    <div className=flex flex-wrap gap-2>
                      {preferences.priorityAmenities.map(id => {
                        const item = AMENITY_OPTIONS.find(a => a.id === id);
                        return (
                          <span
                            key={id}
                            className=px-3 py-1 rounded-full text-xs font-bold bg-blue-50 border border-blue-200 text-blue-700
                          >
                            {item?.label ?? id}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className=p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2>
                  <AlertCircle className=w-4 h-4 text-rose-600 shrink-0 />
                  <span>{error}</span>
                </div>
              )}

              <button
                type=button
                onClick={handleFinishOnboarding}
                disabled={isSubmitting}
                className=w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50
              >
                {isSubmitting ? (
                  <span className=flex items-center gap-2>
                    <div className=w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin />
                    Launching Feed...
                  </span>
                ) : (
                  <span className=flex items-center gap-2>
                    Launch RentHub Discovery
                    <Compass className=w-4 h-4 />
                  </span>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className=w-full max-w-5xl mx-auto px-4 sm:px-8 py-6 text-center text-xs text-slate-400>
        RentHub Nepal &middot; Secure digital tenancy agreements compliant with the National Civil Code.
      </footer>
    </div>
  );
}
