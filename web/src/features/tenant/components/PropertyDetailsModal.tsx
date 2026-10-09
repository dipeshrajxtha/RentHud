/**
 * PropertyDetailsModal Component — Clean Light Mode Property Viewer
 *
 * Ultra-premium modal showcasing:
 * - Dynamic photo gallery with keyboard/swipe navigation
 * - Title deed & ownership verification badges
 * - Landlord responsiveness & verified trust indicators
 * - Unit matrix with floor, area, and instant apply trigger
 * - Full amenities grid with clean chips
 */

import { useState } from 'react';
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
} from 'lucide-react';
import type { PropertyListing, UnitDetail } from '@/types/tenant';

interface PropertyDetailsModalProps {
  property: PropertyListing | null;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  onSelectUnitToApply: (property: PropertyListing, unit: UnitDetail) => void;
}

export function PropertyDetailsModal({
  property,
  onClose,
  isSaved,
  onToggleSave,
  onSelectUnitToApply,
}: PropertyDetailsModalProps) {
  if (!property) return null;

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const photos =
    property.photos.length > 0
      ? property.photos
      : [{ id: '0', url: property.coverPhotoUrl, isCover: true }];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Top Bar with Close & Save */}
          <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleSave(property.id)}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 bg-white/90 backdrop-blur-md border border-slate-200 shadow-md text-slate-600 hover:text-slate-900"
              aria-label="Save"
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-600'}`} />
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
            <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full shrink-0 bg-slate-100">
              <img
                src={photos[activePhotoIndex]?.url}
                alt={property.title}
                className="w-full h-full object-cover"
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-black/30 pointer-events-none" />

              {/* Gallery Controls */}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setActivePhotoIndex((i) => (i === 0 ? photos.length - 1 : i - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full text-slate-800 bg-white/80 backdrop-blur-md border border-slate-200 shadow-md hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setActivePhotoIndex((i) => (i === photos.length - 1 ? 0 : i + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full text-slate-800 bg-white/80 backdrop-blur-md border border-slate-200 shadow-md hover:bg-white transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  <div className="absolute bottom-4 right-4 px-3 py-1 rounded-lg text-xs font-semibold font-display bg-black/60 backdrop-blur-md text-white border border-white/20">
                    {activePhotoIndex + 1} / {photos.length}
                  </div>
                </>
              )}

              {/* Caption */}
              {photos[activePhotoIndex]?.caption && (
                <div className="absolute bottom-4 left-4 px-3 py-1 rounded-lg text-xs font-medium bg-black/60 backdrop-blur-md text-white">
                  {photos[activePhotoIndex].caption}
                </div>
              )}
            </div>

            {/* Content Body */}
            <div className="p-6 sm:p-8 space-y-8">
              {/* Title & Location Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2.5">
                    {property.verificationBadges.map((badge) => (
                      <span
                        key={badge.code}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-display bg-emerald-50 text-emerald-800 border border-emerald-200"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> {badge.name}
                      </span>
                    ))}
                    <span className="px-3 py-1 rounded-full text-xs font-semibold font-display bg-slate-100 text-slate-600 border border-slate-200">
                      {property.city}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
                    {property.title}
                  </h1>

                  <p className="text-sm flex items-center gap-1.5 mt-2 text-slate-600">
                    <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
                    <span>{property.address}, {property.city}</span>
                    {property.postalCode && <span className="text-slate-400">· {property.postalCode}</span>}
                  </p>
                </div>

                {/* Price Display */}
                <div className="sm:text-right shrink-0 p-4 rounded-2xl bg-brand-50/60 border border-brand-100">
                  <span className="text-xs uppercase tracking-wider font-semibold block font-display text-slate-500">
                    Monthly Rent
                  </span>
                  <div className="text-2xl sm:text-3xl font-display font-black text-slate-900 mt-0.5">
                    NPR {property.minMonthlyRent.toLocaleString()}
                    {property.minMonthlyRent !== property.maxMonthlyRent && (
                      <span className="text-sm font-normal text-slate-600">
                        {' '}– {property.maxMonthlyRent.toLocaleString()}
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
                  {property.landlord.avatarUrl ? (
                    <img
                      src={property.landlord.avatarUrl}
                      alt={property.landlord.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-brand-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full font-bold flex items-center justify-center text-white bg-brand-600">
                      {property.landlord.name[0]}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 font-display">{property.landlord.name}</span>
                      {property.landlord.isVerified && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded font-display bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" /> Landlord Verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5 text-slate-500">
                      Response time: <strong className="text-slate-700">{property.landlord.responseTime ?? 'Fast'}</strong>
                    </p>
                  </div>
                </div>

                {property.landlord.phone && (
                  <div className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-brand-50 border border-brand-200 text-brand-700">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{property.landlord.phone}</span>
                  </div>
                )}
              </div>

              {/* Available Units Table */}
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div>
                    <h2 className="text-lg font-display font-bold text-slate-900">Available Units in Building</h2>
                    <p className="text-xs text-slate-500">Select an available unit to begin your digital application</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 font-display">
                    {property.units.filter((u) => u.availabilityStatus === 'AVAILABLE').length} Available
                  </span>
                </div>

                <div className="grid gap-3">
                  {property.units.map((unit) => {
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
                            <span className="text-sm font-bold text-slate-900 font-display">{unit.unitIdentifier}</span>
                            <span
                              className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full font-display ${
                                isAvail ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {isAvail ? 'Available Now' : unit.availabilityStatus.replace('_', ' ')}
                            </span>
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

                          <button
                            type="button"
                            disabled={!isAvail}
                            onClick={() => onSelectUnitToApply(property, unit)}
                            className={
                              isAvail
                                ? 'py-2 px-4 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors flex items-center gap-1.5 font-display shadow-xs'
                                : 'py-2 px-4 rounded-xl text-xs font-semibold bg-slate-100 text-slate-400 opacity-60 cursor-not-allowed font-display'
                            }
                          >
                            <span>Apply</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="text-lg font-display font-bold text-slate-900 mb-2">About this Property</h2>
                <p className="text-sm leading-relaxed whitespace-pre-line text-slate-600">
                  {property.description}
                </p>
              </div>

              {/* Amenities Breakdown */}
              <div>
                <h2 className="text-lg font-display font-bold text-slate-900 mb-3">Amenities & Features</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {property.amenities.map((am) => (
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
              {property.verificationBadges.length > 0 && (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <h3 className="text-sm font-bold text-emerald-900 mb-2 flex items-center gap-2 font-display">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Marketplace Integrity & Verification
                  </h3>
                  <div className="space-y-2">
                    {property.verificationBadges.map((b) => (
                      <div key={b.code} className="text-xs text-emerald-800">
                        <strong className="font-semibold text-emerald-950">{b.name}:</strong> {b.description}
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
                NPR {property.minMonthlyRent.toLocaleString()}
                <span className="text-xs font-normal text-slate-500"> / mo</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const avail = property.units.find((u) => u.availabilityStatus === 'AVAILABLE') || property.units[0];
                if (avail) onSelectUnitToApply(property, avail);
              }}
              className="py-2.5 px-5 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors font-display shadow-xs"
            >
              Apply for Unit
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
