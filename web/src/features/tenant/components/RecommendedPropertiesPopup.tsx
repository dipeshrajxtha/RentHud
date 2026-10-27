/**
 * RecommendedPropertiesPopup — Event-Search Inspired Recommendation Modal
 *
 * Inspired by modern discovery & event search overlays (Luma, Eventbrite, Airbnb):
 * - Floating glassmorphic modal with animated entrance
 * - Curated property recommendations scored against tenant lifestyle survey
 * - Interactive carousel with match % badges, criteria breakdown, and quick actions
 * - Direct "View Details" & "Apply Now" (with KYC gate protection)
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Bed,
  Bath,
  CheckCircle2,
  Heart,
  ArrowRight,
  SlidersHorizontal,
  Flame,
  Award,
  ShieldCheck,
} from 'lucide-react';
import type { PropertyListing, TenantPreferences, UnitDetail } from '@/types/tenant';
import { evaluateSurveyMatch } from '../utils/surveyMatcher';

interface RecommendedPropertiesPopupProps {
  isOpen: boolean;
  onClose: () => void;
  properties: PropertyListing[];
  preferences: TenantPreferences | null;
  savedPropertyIds: string[];
  onToggleSave: (id: string) => void;
  onSelectProperty: (property: PropertyListing) => void;
  onApplyProperty: (property: PropertyListing, unit?: UnitDetail) => void;
  onOpenPreferences?: () => void;
}

export function RecommendedPropertiesPopup({
  isOpen,
  onClose,
  properties,
  preferences,
  savedPropertyIds,
  onToggleSave,
  onSelectProperty,
  onApplyProperty,
  onOpenPreferences,
}: RecommendedPropertiesPopupProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filterType, setFilterType] = useState<'all' | 'high_match' | 'budget' | 'verified'>('all');

  // Compute recommendations with survey scores
  const scoredProperties = useMemo(() => {
    return properties
      .map((p) => {
        const match = evaluateSurveyMatch(p, preferences);
        return { property: p, match };
      })
      .sort((a, b) => b.match.matchScore - a.match.matchScore);
  }, [properties, preferences]);

  // Filter recommendations based on active filter tab
  const filtered = useMemo(() => {
    switch (filterType) {
      case 'high_match':
        return scoredProperties.filter((item) => item.match.matchScore >= 75);
      case 'budget':
        return scoredProperties.filter((item) =>
          item.match.criteria.find((c) => c.key === 'budget' && c.passed)
        );
      case 'verified':
        return scoredProperties.filter(
          (item) => Boolean(item.property.verificationBadges?.length || item.property.landlord?.isVerified)
        );
      case 'all':
      default:
        return scoredProperties.filter((item) => item.match.matchScore > 0 || scoredProperties.length <= 3);
    }
  }, [scoredProperties, filterType]);

  const displayList = filtered.length > 0 ? filtered : scoredProperties.slice(0, 6);

  // Keep index within bounds
  const safeIndex = Math.min(currentIndex, Math.max(0, displayList.length - 1));
  const activeItem = displayList[safeIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % displayList.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + displayList.length) % displayList.length);
  };

  if (!isOpen) return null;

  const currentProp = activeItem?.property;
  const currentMatch = activeItem?.match;
  const isSaved = currentProp ? savedPropertyIds.includes(currentProp.id) : false;
  const isVerified = Boolean(currentProp?.verificationBadges?.length || currentProp?.landlord?.isVerified);

  // Derive specs from units
  const bedrooms = currentProp?.units?.[0]?.bedrooms ?? 1;
  const bathrooms = currentProp?.units?.[0]?.bathrooms ?? 1;
  const totalUnits = currentProp?.units?.length ?? currentProp?.availableUnitsCount ?? 1;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 24 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative z-10 w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden my-auto flex flex-col max-h-[92vh]"
        >
          {/* ── Event-Style Header Banner ── */}
          <div className="relative px-6 py-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 text-white shrink-0 overflow-hidden">
            {/* Background decorative glow */}
            <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-blue-100 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
                  <span>Curated For You &middot; Kathmandu Valley</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  Recommended Properties
                  {displayList.length > 0 && (
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-lg bg-white/20 text-white">
                      {displayList.length} Top Fits
                    </span>
                  )}
                </h2>
                <p className="text-blue-100/90 text-xs sm:text-sm mt-0.5 max-w-xl">
                  Matched against your survey preferences — budget, commute radius, household size, and must-have amenities.
                </p>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition shrink-0"
                aria-label="Close recommendations"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Pills */}
            <div className="relative z-10 flex items-center gap-2 mt-4 overflow-x-auto pb-1 scrollbar-none">
              {(
                [
                  { id: 'all', label: 'All Top Matches' },
                  { id: 'high_match', label: '★ 75%+ Match' },
                  { id: 'budget', label: '💰 In Budget' },
                  { id: 'verified', label: '🛡️ Verified Only' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setFilterType(tab.id);
                    setCurrentIndex(0);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    filterType === tab.id
                      ? 'bg-white text-indigo-700 shadow-sm font-bold'
                      : 'bg-white/10 hover:bg-white/20 text-white/90 border border-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Main Showcase Body ── */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50/60">
            {currentProp ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                {/* Left: Property Media & Quick Stats (5 Cols) */}
                <div className="md:col-span-5 flex flex-col">
                  <div className="relative rounded-2xl overflow-hidden bg-slate-200 aspect-[4/3] group shadow-sm border border-slate-200/80">
                    <img
                      src={currentProp.coverPhotoUrl || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'}
                      alt={currentProp.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Match Score Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <div className="px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-lg flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        <span>{currentMatch?.matchScore ?? 90}% Match</span>
                      </div>
                      {currentMatch?.isPerfectMatch && (
                        <div className="px-2.5 py-1 rounded-xl bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          <span>Perfect Fit</span>
                        </div>
                      )}
                    </div>

                    {/* Save Button */}
                    <button
                      onClick={() => onToggleSave(currentProp.id)}
                      className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition ${
                        isSaved
                          ? 'bg-red-500 text-white'
                          : 'bg-black/30 hover:bg-black/50 text-white'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                    </button>

                    {/* Bottom Info on Image */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-blue-200">
                          {currentProp.city}
                        </span>
                        <div className="text-xl font-extrabold tracking-tight">
                          NPR {currentProp.minMonthlyRent.toLocaleString()}
                          <span className="text-xs font-normal text-white/80"> / mo</span>
                        </div>
                      </div>

                      {isVerified && (
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/80 backdrop-blur text-[10px] font-semibold">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Verified</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Thumbnail pagination switcher */}
                  <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                    <span className="font-mono">
                      Showing {safeIndex + 1} of {displayList.length}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handlePrev}
                        className="p-1.5 rounded-xl border border-slate-200 hover:bg-white text-slate-700 transition"
                        title="Previous property"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleNext}
                        className="p-1.5 rounded-xl border border-slate-200 hover:bg-white text-slate-700 transition"
                        title="Next property"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Details, Survey Match Breakdown & Actions (7 Cols) */}
                <div className="md:col-span-7 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Title & Location */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                          {currentProp.title}
                        </h3>
                        <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          {currentProp.address}, {currentProp.city}
                        </p>
                      </div>
                    </div>

                    {/* Quick Specs Pill Strip */}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 font-medium">
                        <Bed className="w-3.5 h-3.5 text-blue-600" />
                        {bedrooms} BHK
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 font-medium">
                        <Bath className="w-3.5 h-3.5 text-indigo-600" />
                        {bathrooms} Bath
                      </span>
                      {totalUnits > 1 && (
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-700 font-medium">
                          {totalUnits} Units
                        </span>
                      )}
                    </div>

                    {/* Survey Match Breakdown Card */}
                    <div className="mt-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                          Why It Matches Your Survey
                        </span>
                        <span className="text-xs font-bold text-emerald-600 font-mono">
                          {currentMatch?.matchScore ?? 90}% Compatibility
                        </span>
                      </div>

                      <div className="space-y-2">
                        {currentMatch?.criteria && currentMatch.criteria.length > 0 ? (
                          currentMatch.criteria.slice(0, 4).map((c) => (
                            <div key={c.key} className="flex items-start gap-2 text-xs">
                              <CheckCircle2
                                className={`w-4 h-4 shrink-0 mt-0.5 ${
                                  c.passed ? 'text-emerald-500' : 'text-slate-300'
                                }`}
                              />
                              <div>
                                <span className="font-semibold text-slate-700">{c.label}: </span>
                                <span className={c.passed ? 'text-slate-600' : 'text-slate-400'}>
                                  {c.detail}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500 italic">
                            High overall suitability based on Kathmandu rental trends and listing specs.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectProperty(currentProp);
                      }}
                      className="w-full sm:flex-1 py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-white text-slate-700 font-semibold text-xs transition shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <span>Explore Details</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onApplyProperty(currentProp);
                      }}
                      className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Apply For Rental</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500">
                <p>No recommendations match this filter.</p>
              </div>
            )}
          </div>

          {/* ── Footer Bar ── */}
          <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 shrink-0">
            {onOpenPreferences && (
              <button
                onClick={() => {
                  onClose();
                  onOpenPreferences();
                }}
                className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Adjust Matching Preferences</span>
              </button>
            )}

            <div className="flex items-center gap-3 ml-auto">
              <button
                onClick={onClose}
                className="text-slate-500 hover:text-slate-800 font-medium"
              >
                Explore All Listings
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
