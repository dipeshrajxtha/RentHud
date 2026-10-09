/**
 * PropertyDetailsModal — Clean Light Mode
 * 
 * Comprehensive modal presenting property verified attributes,
 * photo carousel, unit availability matrix, and one-click application initiation.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { TenantProperty, TenantUnit } from '@/types/tenant';
import {
  X,
  Heart,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
  MapPin,
  Bed,
  Bath,
  ArrowRight,
  Phone,
} from 'lucide-react';

interface PropertyDetailsModalProps {
  property: TenantProperty | null;
  isSaved: boolean;
  onClose: () => void;
  onToggleSave: (id: string) => void;
  onSelectUnitToApply: (property: TenantProperty, unit: TenantUnit) => void;
}

export function PropertyDetailsModal({
  property,
  isSaved,
  onClose,
  onToggleSave,
  onSelectUnitToApply,
}: PropertyDetailsModalProps) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  if (!property) return null;

  const photos = property.photos.length > 0 ? property.photos : [
    { id: 'def-1', url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80', caption: 'Living Area' }
  ];

  return (
    <AnimatePresence>
      <div className=fixed inset-0 z-50 overflow-y-auto modal-overlay flex items-center justify-center p-3 sm:p-6>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className=relative w-full max-w-4xl bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]
        >
          {/* Top Bar with Close & Save */}
          <div className=absolute top-4 right-4 z-30 flex items-center gap-2>
            <button
              type=button
              onClick={() => onToggleSave(property.id)}
              className=w-10 h-10 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 flex items-center justify-center shadow-md hover:scale-105 transition-all
              aria-label=Save
            >
              <Heart className={w-4 h-4 } />
            </button>
            <button
              type=button
              onClick={onClose}
              className=w-10 h-10 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 flex items-center justify-center shadow-md hover:scale-105 text-slate-600 hover:text-slate-900 transition-all
              aria-label=Close modal
            >
              <X className=w-5 h-5 />
            </button>
          </div>

          {/* Scrollable Container */}
          <div className=flex-1 overflow-y-auto>
            {/* Photo Gallery Header */}
            <div className=relative aspect-[16/9] sm:aspect-[21/9] w-full shrink-0 bg-slate-100>
              <img
                src={photos[activePhotoIndex]?.url}
                alt={property.title}
                className=w-full h-full object-cover
              />

              {/* Gradient overlay */}
              <div className=absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-black/10 pointer-events-none />

              {/* Gallery Controls */}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setActivePhotoIndex((i) => (i === 0 ? photos.length - 1 : i - 1))}
                    className=absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/80 hover:bg-white text-slate-800 shadow-md backdrop-blur-sm transition-all
                    aria-label=Previous photo
                  >
                    <ChevronLeft className=w-5 h-5 />
                  </button>
                  <button
                    onClick={() => setActivePhotoIndex((i) => (i === photos.length - 1 ? 0 : i + 1))}
                    className=absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/80 hover:bg-white text-slate-800 shadow-md backdrop-blur-sm transition-all
                    aria-label=Next photo
                  >
                    <ChevronRight className=w-5 h-5 />
                  </button>

                  <div className=absolute bottom-4 right-4 px-3 py-1 rounded-full text-xs font-bold font-display bg-white/90 backdrop-blur-md text-slate-800 border border-slate-200 shadow-sm>
                    {activePhotoIndex + 1} / {photos.length}
                  </div>
                </>
              )}

              {/* Caption */}
              {photos[activePhotoIndex]?.caption && (
                <div className=absolute bottom-4 left-4 px-3 py-1 rounded-xl text-xs font-semibold bg-white/90 backdrop-blur-md text-slate-800 border border-slate-200 shadow-sm>
                  {photos[activePhotoIndex].caption}
                </div>
              )}
            </div>

            {/* Content Body */}
            <div className=p-6 sm:p-8 space-y-8>
              {/* Title & Location Header */}
              <div className=flex flex-col sm:flex-row sm:items-start justify-between gap-4>
                <div>
                  <div className=flex flex-wrap items-center gap-2 mb-2.5>
                    {property.verificationBadges.map((badge) => (
                      <span
                        key={badge.code}
                        className=inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-display bg-emerald-50 border border-emerald-200 text-emerald-800
                      >
                        <ShieldCheck className=w-3.5 h-3.5 text-emerald-600 /> {badge.name}
                      </span>
                    ))}
                    <span className=px-3 py-1 rounded-full text-xs font-semibold font-display bg-slate-100 text-slate-700 border border-slate-200>
                      {property.city}
                    </span>
                  </div>

                  <h1 className=text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight>
                    {property.title}
                  </h1>

                  <p className=text-sm flex items-center gap-1.5 mt-2 text-slate-600>
                    <MapPin className=w-4 h-4 text-blue-600 shrink-0 />
                    <span>{property.address}, {property.city}</span>
                    {property.postalCode && <span className=text-slate-400>&middot; {property.postalCode}</span>}
                  </p>
                </div>

                {/* Price Display */}
                <div className=sm:text-right shrink-0 p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80>
                  <span className=text-xs uppercase tracking-wider font-bold block font-display text-blue-800>
                    Monthly Rent
                  </span>
                  <div className=text-2xl sm:text-3xl font-display font-black text-slate-900 mt-0.5>
                    NPR {property.minMonthlyRent.toLocaleString()}
                    {property.minMonthlyRent !== property.maxMonthlyRent && (
                      <span className=text-sm font-normal text-slate-600>
                        {' '}– {property.maxMonthlyRent.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <span className=text-xs text-slate-500>
                    Security Deposit: ~1–2 months
                  </span>
                </div>
              </div>

              {/* Landlord Trust Signal Card */}
              <div className=rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 border border-slate-200/80>
                <div className=flex items-center gap-3.5>
                  {property.landlord.avatarUrl ? (
                    <img
                      src={property.landlord.avatarUrl}
                      alt={property.landlord.name}
                      className=w-12 h-12 rounded-full object-cover border-2 border-blue-200
                    />
                  ) : (
                    <div className=w-12 h-12 rounded-full font-bold flex items-center justify-center text-white bg-blue-600 shadow-sm>
                      {property.landlord.name[0]}
                    </div>
                  )}
                  <div>
                    <div className=flex items-center gap-2>
                      <span className=text-sm font-bold text-slate-900 font-display>{property.landlord.name}</span>
                      {property.landlord.isVerified && (
                        <span className=inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-display>
                          <CheckCircle className=w-3 h-3 text-emerald-600 /> Verified Host
                        </span>
                      )}
                    </div>
                    <p className=text-xs mt-0.5 text-slate-500>
                      Response time: <strong className=text-slate-800>{property.landlord.responseTime ?? 'Fast'}</strong>
                    </p>
                  </div>
                </div>

                {property.landlord.phone && (
                  <div className=flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700>
                    <Phone className=w-3.5 h-3.5 />
                    <span>{property.landlord.phone}</span>
                  </div>
                )}
              </div>

              {/* Available Units Table */}
              <div>
                <div className=flex items-center justify-between mb-3.5>
                  <div>
                    <h2 className=text-lg font-display font-bold text-slate-900>Available Units in Building</h2>
                    <p className=text-xs text-slate-500>Select an available unit to begin your digital application</p>
                  </div>
                  <span className=badge-info>
                    {property.units.filter((u) => u.availabilityStatus === 'AVAILABLE').length} Available
                  </span>
                </div>

                <div className=grid gap-3>
                  {property.units.map((unit) => {
                    const isAvail = unit.availabilityStatus === 'AVAILABLE';

                    return (
                      <div
                        key={unit.id}
                        className={p-4 rounded-2xl transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border }
                      >
                        <div>
                          <div className=flex items-center gap-2 mb-1>
                            <span className=text-sm font-bold text-slate-900 font-display>{unit.unitIdentifier}</span>
                            <span
                              className={	ext-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full font-display }
                            >
                              {isAvail ? 'Available Now' : unit.availabilityStatus.replace('_', ' ')}
                            </span>
                          </div>

                          <div className=flex items-center gap-3 text-xs font-medium text-slate-500>
                            <span>Floor {unit.floorNumber}</span>
                            <span>&middot;</span>
                            <span className=flex items-center gap-1>
                              <Bed className=w-3.5 h-3.5 text-blue-600 /> {unit.bedrooms} BHK
                            </span>
                            <span>&middot;</span>
                            <span className=flex items-center gap-1>
                              <Bath className=w-3.5 h-3.5 text-blue-600 /> {unit.bathrooms} Bath
                            </span>
                            {unit.areaSqft && (
                              <>
                                <span>&middot;</span>
                                <span>{unit.areaSqft} sq.ft</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className=flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end>
                          <div className=text-right>
                            <div className=text-base font-display font-bold text-slate-900>
                              NPR {unit.monthlyRent.toLocaleString()}
                              <span className=text-xs font-normal text-slate-500> / mo</span>
                            </div>
                            <span className=text-[11px] text-slate-500>
                              Deposit: NPR {unit.securityDeposit.toLocaleString()}
                            </span>
                          </div>

                          <button
                            type=button
                            disabled={!isAvail}
                            onClick={() => onSelectUnitToApply(property, unit)}
                            className={isAvail ? 'btn-primary btn-sm' : 'btn-secondary btn-sm opacity-50 cursor-not-allowed'}
                          >
                            <span>Apply</span>
                            <ArrowRight className=w-3.5 h-3.5 />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className=text-lg font-display font-bold text-slate-900 mb-2>About this Property</h2>
                <p className=text-sm leading-relaxed whitespace-pre-line text-slate-600>
                  {property.description}
                </p>
              </div>

              {/* Amenities Breakdown */}
              <div>
                <h2 className=text-lg font-display font-bold text-slate-900 mb-3>Amenities & Features</h2>
                <div className=grid grid-cols-2 sm:grid-cols-3 gap-2.5>
                  {property.amenities.map((am) => (
                    <div
                      key={am.id}
                      className=flex items-center gap-2.5 p-3 rounded-2xl text-xs font-semibold bg-slate-50 border border-slate-200/80 text-slate-800
                    >
                      <CheckCircle className=w-4 h-4 text-emerald-600 shrink-0 />
                      <span>{am.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verification Badges Explained */}
              {property.verificationBadges.length > 0 && (
                <div className=p-5 rounded-2xl bg-emerald-50 border border-emerald-200>
                  <h3 className=text-sm font-bold text-emerald-900 mb-2 flex items-center gap-2 font-display>
                    <ShieldCheck className=w-4 h-4 text-emerald-600 /> Marketplace Integrity & Verification
                  </h3>
                  <div className=space-y-2>
                    {property.verificationBadges.map((b) => (
                      <div key={b.code} className=text-xs text-emerald-800>
                        <strong className=font-bold text-emerald-950>{b.name}:</strong> {b.description}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Action */}
          <div className=p-4 sm:p-5 flex items-center justify-between bg-slate-50 border-t border-slate-200/80>
            <div>
              <span className=text-xs text-slate-500>Starting from</span>
              <div className=text-xl font-display font-bold text-slate-900>
                NPR {property.minMonthlyRent.toLocaleString()}
                <span className=text-xs font-normal text-slate-500> / mo</span>
              </div>
            </div>

            <button
              type=button
              onClick={() => {
                const avail = property.units.find((u) => u.availabilityStatus === 'AVAILABLE') || property.units[0];
                if (avail) onSelectUnitToApply(property, avail);
              }}
              className=btn-primary btn-md font-display
            >
              Apply for Unit
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
