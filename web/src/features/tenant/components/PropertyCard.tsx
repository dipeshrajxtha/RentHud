/**
 * PropertyCard Component
 *
 * Modern 3D interactive card with realistic perspective tilt,
 * ambient light reflection, verified ownership badge, and balanced layout.
 */

import { useRef, useState } from 'react';
import { Heart, MapPin, Bed, Bath, ShieldCheck, Star, ArrowUpRight, Sparkles } from 'lucide-react';
import type { PropertyListing } from '@/types/tenant';

interface PropertyCardProps {
  property: PropertyListing;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  onSelect: (property: PropertyListing) => void;
  onApply: (property: PropertyListing) => void;
}

export function PropertyCard({
  property,
  isSaved,
  onToggleSave,
  onSelect,
  onApply,
}: PropertyCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const minBedrooms = Math.min(...property.units.map((u) => u.bedrooms));
  const maxBedrooms = Math.max(...property.units.map((u) => u.bedrooms));
  const bedroomsLabel = minBedrooms === maxBedrooms ? `${minBedrooms} BHK` : `${minBedrooms}–${maxBedrooms} BHK`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rX = ((y - centerY) / centerY) * -5;
    const rY = ((x - centerX) / centerX) * 5;

    setRotateX(rX);
    setRotateY(rY);
    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.18,
    });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(${
          rotateX !== 0 ? -6 : 0
        }px)`,
        transition: 'transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.2s ease',
      }}
      className="group relative bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-brand-300 transition-all flex flex-col overflow-hidden h-full select-none"
    >
      {/* 3D Dynamic Ambient Glare Overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-300 rounded-3xl"
        style={{
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(12, 142, 233, 0.22) 0%, transparent 65%)`,
          opacity: glare.opacity,
        }}
      />

      {/* Photo Header */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900 shrink-0">
        <img
          src={property.coverPhotoUrl}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
        />

        {/* Ambient Gradient Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

        {/* Top Overlay Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
          {/* Verification Badge */}
          {property.verificationBadges.length > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-200 backdrop-blur-md border border-emerald-400/30 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Title Verified</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-brand-950/70 text-brand-200 backdrop-blur-xs">
              <Sparkles className="w-3 h-3 text-brand-400" /> Standard
            </span>
          )}

          {/* Save / Favorite Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(property.id);
            }}
            className="pointer-events-auto w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-700 flex items-center justify-center shadow-md transition-transform active:scale-85 hover:scale-110"
            aria-label={isSaved ? 'Remove from saved' : 'Save property'}
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-600'
              }`}
            />
          </button>
        </div>

        {/* Bottom image overlay: Available units count & city tag */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-[11px] font-semibold z-10">
          <span className="px-2.5 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10">
            {property.availableUnitsCount} {property.availableUnitsCount === 1 ? 'unit' : 'units'} left
          </span>
          <span className="text-slate-200 text-xs drop-shadow-sm font-medium">
            {property.city}
          </span>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Rent & Rating */}
          <div className="flex items-center justify-between gap-2 mb-2 min-h-[1.75rem]">
            <div className="truncate">
              <span className="text-xl font-display font-extrabold text-brand-950 tracking-tight">
                NPR {property.minMonthlyRent.toLocaleString()}
              </span>
              {property.minMonthlyRent !== property.maxMonthlyRent && (
                <span className="text-xs text-slate-500 font-normal"> – {property.maxMonthlyRent.toLocaleString()}</span>
              )}
              <span className="text-xs text-slate-400 font-normal"> / mo</span>
            </div>

            {property.reviewsSummary.totalReviews > 0 ? (
              <div className="flex items-center gap-1 text-xs font-bold text-slate-800 shrink-0 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span>{property.reviewsSummary.averageRating.toFixed(1)}</span>
                <span className="text-slate-400 font-normal text-[11px]">({property.reviewsSummary.totalReviews})</span>
              </div>
            ) : (
              <div className="h-4" />
            )}
          </div>

          {/* Title */}
          <h3
            onClick={() => onSelect(property)}
            title={property.title}
            className="text-base font-display font-bold text-slate-900 hover:text-brand-600 cursor-pointer line-clamp-1 transition-colors h-6"
          >
            {property.title}
          </h3>

          {/* Address */}
          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 mb-3 line-clamp-1 h-5">
            <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0" />
            <span className="truncate">{property.address}, {property.city}</span>
          </p>

          {/* Key Unit Attributes */}
          <div className="flex items-center gap-3 py-2.5 border-y border-slate-100 text-xs text-slate-700 font-semibold bg-slate-50/50 rounded-xl px-3 my-2">
            <div className="flex items-center gap-1.5">
              <Bed className="w-3.5 h-3.5 text-brand-600" />
              <span>{bedroomsLabel}</span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1.5">
              <Bath className="w-3.5 h-3.5 text-brand-600" />
              <span>{property.units[0]?.bathrooms ?? 1} Bath</span>
            </div>
            {property.units[0]?.areaSqft && (
              <>
                <span className="text-slate-300">•</span>
                <span>{property.units[0].areaSqft} sq.ft</span>
              </>
            )}
          </div>

          {/* Amenities Chips */}
          <div className="flex flex-wrap gap-1 mt-3 h-11 overflow-hidden content-start">
            {property.amenities.slice(0, 3).map((am) => (
              <span
                key={am.id}
                className="px-2.5 py-0.5 rounded-lg bg-slate-100/90 text-slate-600 text-[11px] font-semibold whitespace-nowrap border border-slate-200/50"
              >
                {am.name}
              </span>
            ))}
            {property.amenities.length > 3 && (
              <span className="px-2 py-0.5 rounded-lg bg-slate-50 text-slate-400 text-[11px] font-medium whitespace-nowrap">
                +{property.amenities.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSelect(property)}
            className="flex-1 py-2 px-3 rounded-xl border border-slate-200 hover:border-brand-300 bg-white text-xs font-bold text-slate-700 hover:bg-brand-50/50 hover:text-brand-700 transition-all text-center shadow-xs"
          >
            View Units
          </button>
          <button
            type="button"
            onClick={() => onApply(property)}
            className="py-2 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white text-xs font-bold shadow-sm hover:shadow-brand-sm transition-all flex items-center justify-center gap-1.5 group/btn"
          >
            <span>Apply</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
