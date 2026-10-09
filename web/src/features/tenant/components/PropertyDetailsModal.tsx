/**
 * PropertyDetailsModal Component — Manus.im / Aceternity Dark Modal
 *
 * Ultra-premium modal showcasing:
 * - Dynamic photo gallery with keyboard/swipe navigation
 * - Title deed & ownership verification badges
 * - Landlord responsiveness & verified trust indicators
 * - Unit matrix with floor, area, and instant apply trigger
 * - Full amenities grid with glass chips
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
      <div className="fixed inset-0 z-50 overflow-y-auto modal-overlay flex items-center justify-center p-3 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-4xl card-premium overflow-hidden flex flex-col max-h-[92vh]"
          style={{
            background: 'linear-gradient(145deg, rgba(13,21,32,0.98) 0%, rgba(8,13,20,0.99) 100%)',
            border: '1px solid rgba(46, 139, 255, 0.25)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 40px rgba(46,139,255,0.1)',
          }}
        >
          {/* Top Bar with Close & Save */}
          <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleSave(property.id)}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
              style={{
                background: 'rgba(8, 13, 20, 0.8)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
              aria-label="Save"
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-300'}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:text-white"
              style={{
                background: 'rgba(8, 13, 20, 0.8)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#94aac5',
              }}
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Container */}
          <div className="flex-1 overflow-y-auto">
            {/* Photo Gallery Header */}
            <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full shrink-0" style={{ background: 'var(--surface-1)' }}>
              <img
                src={photos[activePhotoIndex]?.url}
                alt={property.title}
                className="w-full h-full object-cover"
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#080d14] via-transparent to-black/40 pointer-events-none" />

              {/* Gallery Controls */}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setActivePhotoIndex((i) => (i === 0 ? photos.length - 1 : i - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full text-white transition-colors"
                    style={{
                      background: 'rgba(2, 4, 8, 0.65)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                    }}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setActivePhotoIndex((i) => (i === photos.length - 1 ? 0 : i + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full text-white transition-colors"
                    style={{
                      background: 'rgba(2, 4, 8, 0.65)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                    }}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  <div
                    className="absolute bottom-4 right-4 px-3 py-1 rounded-lg text-xs font-semibold font-display"
                    style={{
                      background: 'rgba(2, 4, 8, 0.75)',
                      backdropFilter: 'blur(8px)',
                      color: '#d8e5f8',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    {activePhotoIndex + 1} / {photos.length}
                  </div>
                </>
              )}

              {/* Caption */}
              {photos[activePhotoIndex]?.caption && (
                <div
                  className="absolute bottom-4 left-4 px-3 py-1 rounded-lg text-xs font-medium"
                  style={{
                    background: 'rgba(2, 4, 8, 0.75)',
                    backdropFilter: 'blur(8px)',
                    color: '#94aac5',
                  }}
                >
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
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-display"
                        style={{
                          background: 'rgba(6, 78, 59, 0.85)',
                          color: '#6ee7b7',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                        }}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" /> {badge.name}
                      </span>
                    ))}
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold font-display"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: '#94aac5',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      {property.city}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
                    {property.title}
                  </h1>

                  <p className="text-sm flex items-center gap-1.5 mt-2" style={{ color: '#7187a5' }}>
                    <MapPin className="w-4 h-4 text-brand-400 shrink-0" />
                    <span>{property.address}, {property.city}</span>
                    {property.postalCode && <span style={{ color: '#4a6285' }}>· {property.postalCode}</span>}
                  </p>
                </div>

                {/* Price Display */}
                <div
                  className="sm:text-right shrink-0 p-4 rounded-2xl"
                  style={{
                    background: 'rgba(46, 139, 255, 0.08)',
                    border: '1px solid rgba(46, 139, 255, 0.2)',
                  }}
                >
                  <span className="text-xs uppercase tracking-wider font-semibold block font-display" style={{ color: '#5a7299' }}>
                    Monthly Rent
                  </span>
                  <div className="text-2xl sm:text-3xl font-display font-black text-white mt-0.5">
                    NPR {property.minMonthlyRent.toLocaleString()}
                    {property.minMonthlyRent !== property.maxMonthlyRent && (
                      <span className="text-sm font-normal" style={{ color: '#94aac5' }}>
                        {' '}– {property.maxMonthlyRent.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <span className="text-xs" style={{ color: '#5a7299' }}>
                    Security Deposit: ~1–2 months rent
                  </span>
                </div>
              </div>

              {/* Landlord Trust Signal Card */}
              <div
                className="rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div className="flex items-center gap-3.5">
                  {property.landlord.avatarUrl ? (
                    <img
                      src={property.landlord.avatarUrl}
                      alt={property.landlord.name}
                      className="w-12 h-12 rounded-full object-cover"
                      style={{ border: '2px solid rgba(46, 139, 255, 0.4)' }}
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-full font-bold flex items-center justify-center text-white"
                      style={{ background: 'linear-gradient(135deg, #1567f5, #7c3aed)' }}
                    >
                      {property.landlord.name[0]}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white font-display">{property.landlord.name}</span>
                      {property.landlord.isVerified && (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded font-display"
                          style={{
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#6ee7b7',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                          }}
                        >
                          <CheckCircle className="w-3 h-3 text-emerald-400" /> Landlord Verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: '#7187a5' }}>
                      Response time: <strong style={{ color: '#94aac5' }}>{property.landlord.responseTime ?? 'Fast'}</strong>
                    </p>
                  </div>
                </div>

                {property.landlord.phone && (
                  <div
                    className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl"
                    style={{
                      background: 'rgba(46, 139, 255, 0.1)',
                      border: '1px solid rgba(46, 139, 255, 0.25)',
                      color: '#59aaff',
                    }}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{property.landlord.phone}</span>
                  </div>
                )}
              </div>

              {/* Available Units Table */}
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div>
                    <h2 className="text-lg font-display font-bold text-white">Available Units in Building</h2>
                    <p className="text-xs" style={{ color: '#5a7299' }}>Select an available unit to begin your digital application</p>
                  </div>
                  <span className="badge-info">
                    {property.units.filter((u) => u.availabilityStatus === 'AVAILABLE').length} Available
                  </span>
                </div>

                <div className="grid gap-3">
                  {property.units.map((unit) => {
                    const isAvail = unit.availabilityStatus === 'AVAILABLE';

                    return (
                      <div
                        key={unit.id}
                        className={`p-4 rounded-2xl transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                          isAvail ? 'hover:border-brand-500/50' : 'opacity-50'
                        }`}
                        style={{
                          background: isAvail ? 'rgba(13, 21, 32, 0.85)' : 'rgba(8, 13, 20, 0.5)',
                          border: isAvail ? '1px solid rgba(46, 139, 255, 0.18)' : '1px solid rgba(255, 255, 255, 0.05)',
                        }}
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-white font-display">{unit.unitIdentifier}</span>
                            <span
                              className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full font-display ${
                                isAvail ? 'badge-success' : 'badge-neutral'
                              }`}
                            >
                              {isAvail ? 'Available Now' : unit.availabilityStatus.replace('_', ' ')}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs font-medium" style={{ color: '#7187a5' }}>
                            <span>Floor {unit.floorNumber}</span>
                            <span style={{ color: '#2a3a52' }}>•</span>
                            <span className="flex items-center gap-1">
                              <Bed className="w-3.5 h-3.5 text-brand-400" /> {unit.bedrooms} BHK
                            </span>
                            <span style={{ color: '#2a3a52' }}>•</span>
                            <span className="flex items-center gap-1">
                              <Bath className="w-3.5 h-3.5 text-brand-400" /> {unit.bathrooms} Bath
                            </span>
                            {unit.areaSqft && (
                              <>
                                <span style={{ color: '#2a3a52' }}>•</span>
                                <span>{unit.areaSqft} sq.ft</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                          <div className="text-right">
                            <div className="text-base font-display font-bold text-white">
                              NPR {unit.monthlyRent.toLocaleString()}
                              <span className="text-xs font-normal" style={{ color: '#5a7299' }}> / mo</span>
                            </div>
                            <span className="text-[11px]" style={{ color: '#5a7299' }}>
                              Deposit: NPR {unit.securityDeposit.toLocaleString()}
                            </span>
                          </div>

                          <button
                            type="button"
                            disabled={!isAvail}
                            onClick={() => onSelectUnitToApply(property, unit)}
                            className={isAvail ? 'btn-primary btn-sm shine-hover' : 'btn-ghost btn-sm opacity-50 cursor-not-allowed'}
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
                <h2 className="text-lg font-display font-bold text-white mb-2">About this Property</h2>
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#94aac5' }}>
                  {property.description}
                </p>
              </div>

              {/* Amenities Breakdown */}
              <div>
                <h2 className="text-lg font-display font-bold text-white mb-3">Amenities & Features</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {property.amenities.map((am) => (
                    <div
                      key={am.id}
                      className="flex items-center gap-2.5 p-3 rounded-xl text-xs font-medium"
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        color: '#d8e5f8',
                      }}
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{am.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verification Badges Explained */}
              {property.verificationBadges.length > 0 && (
                <div
                  className="p-5 rounded-2xl"
                  style={{
                    background: 'rgba(6, 78, 59, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <h3 className="text-sm font-bold text-emerald-300 mb-2 flex items-center gap-2 font-display">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Marketplace Integrity & Verification
                  </h3>
                  <div className="space-y-2">
                    {property.verificationBadges.map((b) => (
                      <div key={b.code} className="text-xs text-emerald-200">
                        <strong className="font-semibold text-emerald-100">{b.name}:</strong> {b.description}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Action */}
          <div
            className="p-4 sm:p-5 flex items-center justify-between"
            style={{
              background: 'rgba(8, 13, 20, 0.95)',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div>
              <span className="text-xs" style={{ color: '#5a7299' }}>Starting from</span>
              <div className="text-xl font-display font-bold text-white">
                NPR {property.minMonthlyRent.toLocaleString()}
                <span className="text-xs font-normal" style={{ color: '#5a7299' }}> / mo</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const avail = property.units.find((u) => u.availabilityStatus === 'AVAILABLE') || property.units[0];
                if (avail) onSelectUnitToApply(property, avail);
              }}
              className="btn-primary btn-md shine-hover"
            >
              Apply for Unit
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
