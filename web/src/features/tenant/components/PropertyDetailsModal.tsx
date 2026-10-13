/**
 * PropertyDetailsModal Component — Ultra-Premium Light Mode Property Viewer
 *
 * Features:
 * - Dynamic photo gallery with keyboard navigation, caption overlay, and interactive thumbnail strip
 * - Survey recommendation match breakdown banner
 * - Title deed & marketplace verification badges
 * - Landlord responsiveness & verified trust indicators
 * - Unit matrix with floor, area, availability, and instant apply trigger
 * - Full amenities grid with clean chips
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  MapPin,
  Bed,
  Bath,
  ShieldCheck,
  Phone,
  CheckCircle,
  Heart,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Camera,
} from 'lucide-react';
import { ShimmerButton, StatusPill } from '@/components/ui';
import type { PropertyListing, UnitDetail } from '@/types/tenant';
import { tenantService } from '../tenant.service';
import type { SurveyMatchResult } from '../utils/surveyMatcher';

interface PropertyDetailsModalProps {
  property: PropertyListing | null;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  onSelectUnitToApply: (property: PropertyListing, unit: UnitDetail) => void;
  surveyMatch?: SurveyMatchResult;
}

export function PropertyDetailsModal({
  property,
  onClose,
  isSaved,
  onToggleSave,
  onSelectUnitToApply,
  surveyMatch,
}: PropertyDetailsModalProps) {
  if (!property) return null;

  const [currentProperty, setCurrentProperty] = useState<PropertyListing>(property);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Sync state and fetch fresh details from API if available
  useEffect(() => {
    setCurrentProperty(property);
    setActivePhotoIndex(0);

    if (property?.id) {
      tenantService.getPropertyById(property.id).then((full) => {
        if (full) {
          setCurrentProperty(full);
        }
      });
    }
  }, [property?.id]);

  const photos =
    currentProperty.photos && currentProperty.photos.length > 0
      ? currentProperty.photos
      : currentProperty.coverPhotoUrl
      ? [{ id: '0', url: currentProperty.coverPhotoUrl, isCover: true }]
      : [
          {
            id: 'fallback',
            url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
            isCover: true,
          },
        ];

  // Keyboard navigation for photo gallery
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setActivePhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
      } else if (e.key === 'ArrowRight') {
        setActivePhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photos.length, onClose]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Top Bar with Close & Save */}
          <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleSave(currentProperty.id)}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 bg-white/90 backdrop-blur-md border border-slate-200 shadow-md text-slate-600 hover:text-slate-900"
              aria-label="Save"
            >
              <Heart
                className={`w-4 h-4 ${isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-600'}`}
              />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 bg-white/90 backdrop-blur-md border border-slate-200 shadow-md text-slate-600 hover:text-slate-900"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Container */}
          <div className="flex-1 overflow-y-auto">
            {/* Photo Gallery Header */}
            <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full shrink-0 bg-slate-900">
              <img
                src={photos[activePhotoIndex]?.url}
                alt={currentProperty.title}
                className="w-full h-full object-cover transition-opacity duration-300"
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/30 pointer-events-none" />

              {/* Gallery Controls */}
              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActivePhotoIndex((i) => (i === 0 ? photos.length - 1 : i - 1))
                    }
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full text-slate-800 bg-white/85 backdrop-blur-md border border-slate-200 shadow-lg hover:bg-white transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActivePhotoIndex((i) => (i === photos.length - 1 ? 0 : i + 1))
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full text-slate-800 bg-white/85 backdrop-blur-md border border-slate-200 shadow-lg hover:bg-white transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-xl text-xs font-semibold font-display bg-black/75 backdrop-blur-md text-white border border-white/20 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-brand-300" />
                    <span>
                      {activePhotoIndex + 1} / {photos.length}
                    </span>
                  </div>
                </>
              )}

              {/* Caption */}
              {photos[activePhotoIndex]?.caption && (
                <div className="absolute bottom-4 left-4 max-w-md px-3.5 py-1.5 rounded-xl text-xs font-medium bg-black/75 backdrop-blur-md text-white border border-white/10 truncate">
                  {photos[activePhotoIndex].caption}
                </div>
              )}
            </div>

            {/* Thumbnail Strip (if multiple photos) */}
            {photos.length > 1 && (
              <div className="bg-slate-900 px-4 py-2.5 flex items-center gap-2.5 overflow-x-auto border-b border-slate-800 scrollbar-thin">
                <span className="text-[11px] font-semibold text-slate-400 shrink-0 uppercase tracking-wider mr-1">
                  Photos ({photos.length}):
                </span>
                {photos.map((ph, idx) => (
                  <button
                    key={ph.id || idx}
                    type="button"
                    onClick={() => setActivePhotoIndex(idx)}
                    className={`relative rounded-lg overflow-hidden shrink-0 w-16 h-11 sm:w-20 sm:h-13 transition-all duration-200 border-2 ${
                      activePhotoIndex === idx
                        ? 'border-brand-400 ring-2 ring-brand-400/40 opacity-100 scale-102'
                        : 'border-transparent opacity-60 hover:opacity-90'
                    }`}
                  >
                    <img src={ph.url} alt="" className="w-full h-full object-cover" />
                    {ph.isCover && (
                      <span className="absolute bottom-0.5 left-0.5 px-1 py-0.2 rounded text-[8px] bg-black/75 text-white font-bold uppercase">
                        Cover
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Content Body */}
            <div className="p-6 sm:p-8 space-y-7">
              {/* Survey Match Breakdown Card (if 100% matched) */}
              {surveyMatch?.isPerfectMatch && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-5 bg-gradient-to-r from-amber-50 to-orange-50/80 border border-amber-300 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-amber-950 font-display flex items-center gap-2">
                        <span>100% Survey Match — Recommended For You</span>
                        <StatusPill variant="warning" size="sm">
                          Top Choice
                        </StatusPill>
                      </h3>
                      <p className="text-xs text-amber-800 mt-0.5">
                        This property fulfills every requirement from your onboarding preference survey.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4 pt-3.5 border-t border-amber-200/80">
                    {surveyMatch.criteria.map((c) => (
                      <div
                        key={c.key}
                        className="flex items-center gap-2 text-xs text-amber-900 bg-white/60 px-3 py-1.5 rounded-lg border border-amber-200/60"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">
                          <strong className="font-semibold text-slate-900">{c.label}:</strong>{' '}
                          {c.detail}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Title & Location Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2.5">
                    {currentProperty.verificationBadges.map((badge) => (
                      <StatusPill
                        key={badge.code}
                        variant="success"
                        icon={<ShieldCheck className="w-3.5 h-3.5" />}
                      >
                        {badge.name}
                      </StatusPill>
                    ))}
                    <StatusPill variant="neutral">{currentProperty.city}</StatusPill>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
                    {currentProperty.title}
                  </h1>

                  <p className="text-sm flex items-center gap-1.5 mt-2 text-slate-600">
                    <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
                    <span>
                      {currentProperty.address}, {currentProperty.city}
                    </span>
                    {currentProperty.postalCode && (
                      <span className="text-slate-400">· {currentProperty.postalCode}</span>
                    )}
                  </p>
                </div>

                {/* Price Display */}
                <div className="sm:text-right shrink-0 p-4 rounded-2xl bg-brand-50/70 border border-brand-100">
                  <span className="text-xs uppercase tracking-wider font-semibold block font-display text-slate-500">
                    Monthly Rent
                  </span>
                  <div className="text-2xl sm:text-3xl font-display font-black text-slate-900 mt-0.5">
                    NPR {currentProperty.minMonthlyRent.toLocaleString()}
                    {currentProperty.minMonthlyRent !== currentProperty.maxMonthlyRent && (
                      <span className="text-sm font-normal text-slate-600">
                        {' '}
                        – {currentProperty.maxMonthlyRent.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">
                    Security Deposit: ~1–2 months rent
                  </span>
                </div>
              </div>

              {/* Landlord Trust Signal Card */}
              <div className="rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3.5">
                  {currentProperty.landlord.avatarUrl ? (
                    <img
                      src={currentProperty.landlord.avatarUrl}
                      alt={currentProperty.landlord.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-brand-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full font-bold flex items-center justify-center text-white bg-brand-600">
                      {currentProperty.landlord.name[0]}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 font-display">
                        {currentProperty.landlord.name}
                      </span>
                      {currentProperty.landlord.isVerified && (
                        <StatusPill
                          variant="success"
                          size="sm"
                          icon={<CheckCircle className="w-3 h-3" />}
                        >
                          Landlord Verified
                        </StatusPill>
                      )}
                    </div>
                    <p className="text-xs mt-0.5 text-slate-500">
                      Response time:{' '}
                      <strong className="text-slate-700">
                        {currentProperty.landlord.responseTime ?? 'Fast'}
                      </strong>
                    </p>
                  </div>
                </div>

                {currentProperty.landlord.phone && (
                  <div className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-brand-50 border border-brand-200 text-brand-700">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{currentProperty.landlord.phone}</span>
                  </div>
                )}
              </div>

              {/* Available Units Table */}
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div>
                    <h2 className="text-lg font-display font-bold text-slate-900">
                      Available Units in Building
                    </h2>
                    <p className="text-xs text-slate-500">
                      Select an available unit to begin your digital application
                    </p>
                  </div>
                  <StatusPill variant="info">
                    {currentProperty.units.filter((u) => u.availabilityStatus === 'AVAILABLE').length}{' '}
                    Available
                  </StatusPill>
                </div>

                <div className="grid gap-3">
                  {currentProperty.units.map((unit) => {
                    const isAvail = unit.availabilityStatus === 'AVAILABLE';

                    return (
                      <div
                        key={unit.id}
                        className={`p-4 rounded-2xl transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border ${
                          isAvail
                            ? 'bg-white border-slate-200 hover:border-brand-500 shadow-xs'
                            : 'bg-slate-50 border-slate-200 opacity-60'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-slate-900 font-display">
                              {unit.unitIdentifier}
                            </span>
                            <StatusPill variant={isAvail ? 'success' : 'neutral'} size="sm">
                              {isAvail ? 'Available Now' : unit.availabilityStatus.replace('_', ' ')}
                            </StatusPill>
                          </div>

                          <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                            <span>Floor {unit.floorNumber}</span>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1">
                              <Bed className="w-3.5 h-3.5 text-brand-600" /> {unit.bedrooms} BHK
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1">
                              <Bath className="w-3.5 h-3.5 text-brand-600" /> {unit.bathrooms} Bath
                            </span>
                            {unit.areaSqft && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span>{unit.areaSqft} sq.ft</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                          <div className="text-right">
                            <div className="text-base font-display font-bold text-slate-900">
                              NPR {unit.monthlyRent.toLocaleString()}
                              <span className="text-xs font-normal text-slate-500"> / mo</span>
                            </div>
                            <span className="text-[11px] text-slate-500">
                              Deposit: NPR {unit.securityDeposit.toLocaleString()}
                            </span>
                          </div>

                          <ShimmerButton
                            variant="primary"
                            size="sm"
                            disabled={!isAvail}
                            onClick={() => onSelectUnitToApply(currentProperty, unit)}
                            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                          >
                            Apply
                          </ShimmerButton>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="text-lg font-display font-bold text-slate-900 mb-2">
                  About this Property
                </h2>
                <p className="text-sm leading-relaxed whitespace-pre-line text-slate-600">
                  {currentProperty.description}
                </p>
              </div>

              {/* Amenities Breakdown */}
              <div>
                <h2 className="text-lg font-display font-bold text-slate-900 mb-3">
                  Amenities & Features
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {currentProperty.amenities.map((am) => (
                    <div
                      key={am.id}
                      className="flex items-center gap-2.5 p-3 rounded-xl text-xs font-medium bg-slate-50 border border-slate-200 text-slate-700"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{am.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verification Badges Explained */}
              {currentProperty.verificationBadges.length > 0 && (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <h3 className="text-sm font-bold text-emerald-900 mb-2 flex items-center gap-2 font-display">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Marketplace Integrity &
                    Verification
                  </h3>
                  <div className="space-y-2">
                    {currentProperty.verificationBadges.map((b) => (
                      <div key={b.code} className="text-xs text-emerald-800">
                        <strong className="font-semibold text-emerald-950">{b.name}:</strong>{' '}
                        {b.description}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-4 sm:p-5 flex items-center justify-between bg-white border-t border-slate-200">
            <div>
              <span className="text-xs text-slate-500">Starting from</span>
              <div className="text-xl font-display font-bold text-slate-900">
                NPR {currentProperty.minMonthlyRent.toLocaleString()}
                <span className="text-xs font-normal text-slate-500"> / mo</span>
              </div>
            </div>

            <ShimmerButton
              variant="primary"
              size="md"
              onClick={() => {
                const avail =
                  currentProperty.units.find((u) => u.availabilityStatus === 'AVAILABLE') ||
                  currentProperty.units[0];
                if (avail) onSelectUnitToApply(currentProperty, avail);
              }}
            >
              Apply for Unit
            </ShimmerButton>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
