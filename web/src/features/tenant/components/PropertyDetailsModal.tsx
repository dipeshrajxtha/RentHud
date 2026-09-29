/**
 * PropertyDetailsModal Component
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  MapPin,
  Bed,
  Bath,
  ShieldCheck,
  Star,
  Phone,
  CheckCircle,
  Building,
  Heart,
  ArrowRight,
  Layers,
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
  const photos = property.photos.length > 0 ? property.photos : [{ id: '0', url: property.coverPhotoUrl, isCover: true }];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Top Bar with Close & Save */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleSave(property.id)}
              className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-xs text-slate-700 hover:text-red-500 shadow-md flex items-center justify-center transition-all"
              aria-label="Save"
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-xs text-slate-700 hover:text-slate-900 shadow-md flex items-center justify-center transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Container */}
          <div className="flex-1 overflow-y-auto">
            {/* Photo Gallery Header */}
            <div className="relative aspect-16/9 sm:aspect-21/9 w-full bg-slate-900">
              <img
                src={photos[activePhotoIndex]?.url}
                alt={property.title}
                className="w-full h-full object-cover"
              />

              {/* Gallery Controls */}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setActivePhotoIndex((i) => (i === 0 ? photos.length - 1 : i - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-xs"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setActivePhotoIndex((i) => (i === photos.length - 1 ? 0 : i + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-xs"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  <div className="absolute bottom-3 right-4 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-xs text-white text-xs font-medium">
                    {activePhotoIndex + 1} / {photos.length}
                  </div>
                </>
              )}

              {/* Caption */}
              {photos[activePhotoIndex]?.caption && (
                <div className="absolute bottom-3 left-4 px-3 py-1 rounded-md bg-black/60 backdrop-blur-xs text-white text-xs font-medium">
                  {photos[activePhotoIndex].caption}
                </div>
              )}
            </div>

            {/* Content Body */}
            <div className="p-6 sm:p-8 space-y-8">
              {/* Title & Location Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {property.verificationBadges.map((badge) => (
                      <span
                        key={badge.code}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" /> {badge.name}
                      </span>
                    ))}
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                      {property.city}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-display font-semibold text-slate-900 tracking-tight">
                    {property.title}
                  </h1>

                  <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1.5">
                    <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
                    <span>{property.address}, {property.city}</span>
                    {property.postalCode && <span className="text-slate-400">· {property.postalCode}</span>}
                  </p>
                </div>

                {/* Price Display */}
                <div className="sm:text-right shrink-0 bg-brand-50/60 p-4 rounded-2xl border border-brand-100 sm:bg-transparent sm:p-0 sm:border-none">
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">Monthly Rent</span>
                  <div className="text-2xl sm:text-3xl font-display font-bold text-brand-950">
                    NPR {property.minMonthlyRent.toLocaleString()}
                    {property.minMonthlyRent !== property.maxMonthlyRent && (
                      <span className="text-sm font-normal text-slate-500"> – {property.maxMonthlyRent.toLocaleString()}</span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">Security Deposit: ~1–2 months rent</span>
                </div>
              </div>

              {/* Landlord Trust Signal Card */}
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {property.landlord.avatarUrl ? (
                    <img
                      src={property.landlord.avatarUrl}
                      alt={property.landlord.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-xs"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center">
                      {property.landlord.name[0]}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{property.landlord.name}</span>
                      {property.landlord.isVerified && (
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                          <CheckCircle className="w-3 h-3 text-emerald-600" /> Landlord Verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Response time: <strong className="font-medium text-slate-700">{property.landlord.responseTime ?? 'Fast'}</strong>
                    </p>
                  </div>
                </div>

                {property.landlord.phone && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs">
                    <Phone className="w-3.5 h-3.5 text-brand-600" />
                    <span>{property.landlord.phone}</span>
                  </div>
                )}
              </div>

              {/* Available Units Table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-display font-semibold text-slate-900">Available Units in Building</h2>
                    <p className="text-xs text-slate-500">Select an available unit to begin your digital application</p>
                  </div>
                  <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200">
                    {property.units.filter((u) => u.availabilityStatus === 'AVAILABLE').length} Available
                  </span>
                </div>

                <div className="grid gap-3">
                  {property.units.map((unit) => {
                    const isAvail = unit.availabilityStatus === 'AVAILABLE';

                    return (
                      <div
                        key={unit.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                          isAvail
                            ? 'bg-white border-slate-200 hover:border-brand-300 shadow-xs'
                            : 'bg-slate-50 border-slate-200 opacity-60'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-slate-900">{unit.unitIdentifier}</span>
                            <span
                              className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                isAvail ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {isAvail ? 'Available Now' : unit.availabilityStatus.replace('_', ' ')}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                            <span>Floor {unit.floorNumber}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Bed className="w-3.5 h-3.5 text-brand-600" /> {unit.bedrooms} BHK
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Bath className="w-3.5 h-3.5 text-brand-600" /> {unit.bathrooms} Bath
                            </span>
                            {unit.areaSqft && (
                              <>
                                <span>•</span>
                                <span>{unit.areaSqft} sq.ft</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                          <div className="text-right">
                            <div className="text-base font-display font-bold text-brand-950">
                              NPR {unit.monthlyRent.toLocaleString()}
                              <span className="text-xs font-normal text-slate-400"> / mo</span>
                            </div>
                            <span className="text-[11px] text-slate-400">Deposit: NPR {unit.securityDeposit.toLocaleString()}</span>
                          </div>

                          <button
                            type="button"
                            disabled={!isAvail}
                            onClick={() => onSelectUnitToApply(property, unit)}
                            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
                              isAvail
                                ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-xs'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
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
                <h2 className="text-lg font-display font-semibold text-slate-900 mb-2">About this Property</h2>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{property.description}</p>
              </div>

              {/* Amenities Breakdown */}
              <div>
                <h2 className="text-lg font-display font-semibold text-slate-900 mb-3">Amenities & Features</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {property.amenities.map((am) => (
                    <div
                      key={am.id}
                      className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 bg-slate-50 text-xs font-medium text-slate-800"
                    >
                      <CheckCircle className="w-4 h-4 text-brand-600 shrink-0" />
                      <span>{am.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verification Badges Explained */}
              {property.verificationBadges.length > 0 && (
                <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
                  <h3 className="text-sm font-semibold text-emerald-950 mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Marketplace Integrity & Verification
                  </h3>
                  <div className="space-y-2">
                    {property.verificationBadges.map((b) => (
                      <div key={b.code} className="text-xs text-emerald-900">
                        <strong className="font-semibold">{b.name}:</strong> {b.description}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
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
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
            >
              Apply for Unit
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
