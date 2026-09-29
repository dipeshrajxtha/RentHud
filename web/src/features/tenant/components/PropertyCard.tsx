/**
 * PropertyCard Component
 */

import React from 'react';
import { motion } from 'motion/react';
import { Heart, MapPin, Bed, Bath, ShieldCheck, Star, ArrowUpRight } from 'lucide-react';
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
  const minBedrooms = Math.min(...property.units.map((u) => u.bedrooms));
  const maxBedrooms = Math.max(...property.units.map((u) => u.bedrooms));
  const bedroomsLabel = minBedrooms === maxBedrooms ? `${minBedrooms} BHK` : `${minBedrooms}–${maxBedrooms} BHK`;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="group bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden"
    >
      {/* Photo Header */}
      <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-100">
        <img
          src={property.coverPhotoUrl}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Top Overlay Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {/* Verification Badge */}
          {property.verificationBadges.length > 0 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950/85 text-emerald-200 backdrop-blur-xs border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Title Verified
            </span>
          ) : (
            <span />
          )}

          {/* Save / Favorite Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(property.id);
            }}
            className="pointer-events-auto w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-700 flex items-center justify-center shadow-sm transition-transform active:scale-90"
            aria-label={isSaved ? 'Remove from saved' : 'Save property'}
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isSaved ? 'fill-red-500 text-red-500' : 'text-slate-600'
              }`}
            />
          </button>
        </div>

        {/* Bottom image overlay: Available units count */}
        <div className="absolute bottom-2.5 left-3">
          <span className="px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-[11px] font-medium text-white">
            {property.availableUnitsCount} {property.availableUnitsCount === 1 ? 'unit' : 'units'} available
          </span>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Rent & Rating */}
          <div className="flex items-baseline justify-between gap-2 mb-1.5">
            <div>
              <span className="text-lg font-display font-bold text-brand-950">
                NPR {property.minMonthlyRent.toLocaleString()}
              </span>
              {property.minMonthlyRent !== property.maxMonthlyRent && (
                <span className="text-xs text-slate-500 font-normal"> – {property.maxMonthlyRent.toLocaleString()}</span>
              )}
              <span className="text-xs text-slate-400 font-normal"> / mo</span>
            </div>

            {property.reviewsSummary.totalReviews > 0 && (
              <div className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{property.reviewsSummary.averageRating.toFixed(1)}</span>
                <span className="text-slate-400 font-normal text-[11px]">({property.reviewsSummary.totalReviews})</span>
              </div>
            )}
          </div>

          {/* Title */}
          <h3
            onClick={() => onSelect(property)}
            className="text-base font-display font-semibold text-slate-900 hover:text-brand-600 cursor-pointer line-clamp-1 transition-colors"
          >
            {property.title}
          </h3>

          {/* Address */}
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 mb-3 line-clamp-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{property.address}, {property.city}</span>
          </p>

          {/* Key Unit Attributes */}
          <div className="flex items-center gap-3 py-2.5 border-y border-slate-100 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-1">
              <Bed className="w-3.5 h-3.5 text-brand-600" />
              <span>{bedroomsLabel}</span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1">
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
          <div className="flex flex-wrap gap-1 mt-3">
            {property.amenities.slice(0, 3).map((am) => (
              <span
                key={am.id}
                className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium"
              >
                {am.name}
              </span>
            ))}
            {property.amenities.length > 3 && (
              <span className="px-1.5 py-0.5 text-slate-400 text-[11px]">
                +{property.amenities.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSelect(property)}
            className="flex-1 py-2 px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-center"
          >
            View Units
          </button>
          <button
            type="button"
            onClick={() => onApply(property)}
            className="py-2 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1"
          >
            <span>Apply</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
