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
  DollarSign,
  Calendar,
  Users,
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
    badgeText: 'Owner Portal',
    perks: [
      'Multi-unit building listing management',
      'Screen verified prospective tenants',
      'Automated statutory lease agreements (§ 379)',
      'Real-time rent roll ledger & escrow custody',
    ],
  },
} as const;

const MCQ_QUESTIONS = [
  {
    id: 'housingType' as const,
    title: 'What type of home are you looking for?',
    subtitle: 'We will calibrate your search feed to match your preferred layout.',
    icon: Home,
    options: [
      { id: 'apartment', label: 'Apartment / Flat', desc: 'Self-contained residential unit in an apartment building' },
      { id: 'independent_house', label: 'Independent Floor', desc: 'Separate floor in a private residential house' },
      { id: 'studio', label: 'Studio / 1-BHK', desc: 'Compact, cost-effective space for a solo professional' },
      { id: 'shared', label: 'Co-Living / Shared', desc: 'Private bedroom with shared living & kitchen areas' },
    ],
  },
  {
    id: 'budgetBracket' as const,
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
    id: 'moveInTimeline' as const,
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
    id: 'householdSize' as const,
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

  const totalMCQSteps = MCQ_QUESTIONS.length + 1; // +1 for amenities step
  const progressPercent = currentStep === 'mcq'
    ? ((mcqIndex + 1) / totalMCQSteps) * 100
    : currentStep === 'summary' ? 100 : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Header */}
      <header className="w-full max-w-5xl mx-auto px-4 sm:px-8 pt-6 pb-4 flex items-center justify-between">
        <RentHubLogo variant="original" size="md" />

        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-2xs">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-7 h-7 rounded-full border border-blue-200"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
              {user?.name?.[0] ?? 'U'}
            </div>
          )}
          <span className="text-xs font-semibold text-slate-800 font-display">
            {user?.name ?? 'My Account'}
          </span>
        </div>
      </header>

      {/* Progress Bar (Questionnaire only) */}
      <AnimatePresence>
        {currentStep !== 'role' && (
          <div className="w-full max-w-3xl mx-auto px-4 sm:px-8 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-display">
                Renter Preference Setup
              </span>
              <span className="text-xs font-bold text-blue-600 font-display">
                {currentStep === 'summary' ? 'Ready to launch' : `Step ${mcqIndex + 1} of ${totalMCQSteps}`}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <main className="flex-1 flex flex-col justify-center w-full max-w-3xl mx-auto px-4 sm:px-8 py-6">
        <AnimatePresence mode="wait">
          {/* STEP 1: ROLE SELECTION */}
          {currentStep === 'role' && (
            <motion.div
              key="step-role"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="space-y-8"
            >
              <div className="text-center max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 mb-4 font-display">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Account Verified via Google
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-display">
                  How will you use RentHub?
                </h1>
                <p className="mt-2 text-sm sm:text-base text-slate-600">
                  Select your primary role. Each account is calibrated with tailored tools and workflows.
                </p>
              </div>

              {/* Role Cards Grid */}
              <div className="grid sm:grid-cols-2 gap-5">
                {(['tenant', 'landlord'] as const).map(role => {
                  const meta = ROLE_META[role];
                  const isSelected = selectedRole === role;
                  const Icon = meta.icon;

                  return (
                    <div
                      key={role}
                      onClick={() => selectRole(role)}
                      className={`cursor-pointer rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 border-2 bg-white ${
                        isSelected
                          ? 'border-blue-600 shadow-lg shadow-blue-500/10 ring-4 ring-blue-50'
                          : 'border-slate-200/90 hover:border-slate-300 shadow-xs'
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xs ${
                              role === 'tenant' ? 'bg-blue-600' : 'bg-emerald-600'
                            }`}
                          >
                            <Icon className="w-6 h-6" />
                          </div>

                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full font-display uppercase tracking-wider ${
                              role === 'tenant'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {meta.badgeText}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-xl font-bold text-slate-900 font-display">
                            {meta.label}
                          </h3>
                          <p className="text-xs font-semibold text-blue-600 mt-0.5">
                            {meta.subtitle}
                          </p>
                          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                            {meta.description}
                          </p>
                        </div>
                      </div>

                      <div className="pt-5 mt-5 border-t border-slate-100 space-y-2">
                        {meta.perks.map((perk, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[3]" />
                            <span>{perk}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Button */}
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  disabled={!selectedRole || isSubmitting}
                  onClick={handleRoleContinue}
                  className="btn-primary btn-lg w-full sm:w-auto px-10 flex items-center justify-center gap-2 font-display text-sm"
                >
                  <span>
                    {selectedRole === 'tenant'
                      ? 'Continue to Personalize Feed'
                      : isSubmitting
                      ? 'Launching Portal…'
                      : 'Launch Landlord Portal'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: MCQ PREFERENCE QUESTIONNAIRE */}
          {currentStep === 'mcq' && (
            <motion.div
              key={`step-mcq-${mcqIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/40 p-6 sm:p-9 space-y-6"
            >
              {/* Question 0-3: General MCQs */}
              {mcqIndex < MCQ_QUESTIONS.length ? (
                <>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display tracking-tight">
                      {MCQ_QUESTIONS[mcqIndex].title}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      {MCQ_QUESTIONS[mcqIndex].subtitle}
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 pt-2">
                    {MCQ_QUESTIONS[mcqIndex].options.map((opt) => {
                      const questionId = MCQ_QUESTIONS[mcqIndex].id;
                      const isChosen = preferences[questionId] === opt.id;

                      return (
                        <div
                          key={opt.id}
                          onClick={() => {
                            setPreferences((p) => ({ ...p, [questionId]: opt.id }));
                          }}
                          className={`p-4 rounded-2xl cursor-pointer transition-all border-2 ${
                            isChosen
                              ? 'border-blue-600 bg-blue-50/30'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-sm text-slate-900 font-display">
                              {opt.label}
                            </span>
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                isChosen ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                              }`}
                            >
                              {isChosen && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            {opt.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                /* Question 4: Multi-select Amenities */
                <>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display tracking-tight">
                      Which amenities are non-negotiable for you?
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Select all features that you require in your new home.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 pt-2">
                    {AMENITY_OPTIONS.map((amenity) => {
                      const Icon = amenity.icon;
                      const isChecked = preferences.priorityAmenities.includes(amenity.id);

                      return (
                        <div
                          key={amenity.id}
                          onClick={() => toggleAmenity(amenity.id)}
                          className={`p-4 rounded-2xl cursor-pointer transition-all border-2 flex items-center gap-3.5 ${
                            isChecked
                              ? 'border-blue-600 bg-blue-50/30'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              isChecked
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 font-display truncate">
                              {amenity.label}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {amenity.desc}
                            </p>
                          </div>

                          <div
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                              isChecked ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 text-white stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Navigation Bar */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    if (mcqIndex === 0) {
                      setCurrentStep('role');
                    } else {
                      setMcqIndex((i) => i - 1);
                    }
                  }}
                  className="btn-secondary btn-md flex items-center gap-2 font-display"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (mcqIndex < totalMCQSteps - 1) {
                      setMcqIndex((i) => i + 1);
                    } else {
                      setCurrentStep('summary');
                    }
                  }}
                  className="btn-primary btn-md flex items-center gap-2 font-display"
                >
                  <span>{mcqIndex < totalMCQSteps - 1 ? 'Next Step' : 'Review & Finish'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: SUMMARY & CONFIRMATION */}
          {currentStep === 'summary' && (
            <motion.div
              key="step-summary"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/40 p-6 sm:p-9 space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 font-display">
                  Preferences Calibrated
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  Your tenant profile has been personalized. We will highlight properties in Kathmandu Valley that best match your parameters.
                </p>
              </div>

              {/* Summary Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 divide-y divide-slate-200 text-xs">
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">Target Layout:</span>
                  <span className="font-bold text-slate-900 capitalize font-display">
                    {preferences.housingType.replace('_', ' ')}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">Rent Budget:</span>
                  <span className="font-bold text-slate-900 capitalize font-display">
                    {preferences.budgetBracket}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">Timeline:</span>
                  <span className="font-bold text-slate-900 capitalize font-display">
                    {preferences.moveInTimeline}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">Household:</span>
                  <span className="font-bold text-slate-900 capitalize font-display">
                    {preferences.householdSize}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">Priority Amenities:</span>
                  <span className="font-bold text-slate-900 font-display">
                    {preferences.priorityAmenities.length} selected
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep('mcq')}
                  className="btn-secondary btn-md flex-1 font-display"
                >
                  Adjust Preferences
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinishOnboarding}
                  className="btn-primary btn-md flex-1 flex items-center justify-center gap-2 font-display"
                >
                  <span>{isSubmitting ? 'Entering RentHub…' : 'Launch Dashboard'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto px-4 sm:px-8 py-5 text-center text-xs text-slate-400">
        RentHub &bull; Digital Rental Contracts under Muluki Civil Code 2074 &bull; Kathmandu, Nepal
      </footer>
    </div>
  );
}
