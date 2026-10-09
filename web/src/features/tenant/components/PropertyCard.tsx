/**
 * PropertyCard Component — Modern Airbnb & Zillow Inspired Light Design
 *
 * Clean, bright, highly legible rental card featuring:
 * - Crisp white card with subtle slate borders and soft hover elevation
 * - High-definition property image with smooth zoom transition
 * - Verified Title Deed badge in soft emerald
 * - Heart favorite toggle button with spring animation
 * - Clear pricing in NPR with monthly interval
 * - Bedroom, bathroom, and area specs in refined pills
 * - Direct "View Units" and "Apply" action buttons
 */

import { useState } from 'react';
import { motion } from 'motion/react';
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
  const [imageError, setImageError] = useState(false);
  const fallbackImage =
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80';

  const minBedrooms = Math.min(...property.units.map((u) => u.bedrooms));
  const maxBedrooms = Math.max(...property.units.map((u) => u.bedrooms));
  const bedroomsLabel =
    minBedrooms === maxBedrooms ? `${minBedrooms} BHK` : `${minBedrooms}–${maxBedrooms} BHK`;

  return (
    <div
      onClick={() => onSelect(property)}
      className="group relative bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden h-full select-none cursor-pointer"
    >
      {/* Photo Header */}
      <div className="relative aspect-[16/10] w-full overflow-hidden shrink-0 bg-slate-100">
        <img
          src={imageError ? fallbackImage : property.coverPhotoUrl || fallbackImage}
          alt={property.title}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
          {/* Verification Badge */}
          {property.verificationBadges.length > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/90 shadow-xs backdrop-blur-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Title</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs backdrop-blur-xs">
              <Sparkles className="w-3 h-3 text-blue-500" />
              <span>Standard</span>
            </span>
          )}

          {/* Heart Save Button */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.85 }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(property.id);
            }}
            className="pointer-events-auto w-9 h-9 rounded-full flex items-center justify-center bg-white/90 hover:bg-white text-slate-400 hover:text-rose-500 border border-slate-200/80 shadow-xs transition-colors"
            aria-label={isSaved ? 'Remove from saved' : 'Save property'}
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-400 hover:text-slate-600'
              }`}
            />
          </motion.button>
        </div>

        {/* Bottom image overlay pills */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] font-semibold z-10 pointer-events-none">
          <span className="px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-xs text-slate-800 border border-slate-200/80 shadow-xs">
            {property.availableUnitsCount} {property.availableUnitsCount === 1 ? 'unit' : 'units'} left
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-900/75 backdrop-blur-xs text-white">
            {property.city}
          </span>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Rent & Rating Row */}
          <div className="flex items-center justify-between gap-2 mb-1.5 min-h-[1.75rem]">
            <div className="truncate">
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                NPR {property.minMonthlyRent.toLocaleString()}
              </span>
              {property.minMonthlyRent !== property.maxMonthlyRent && (
                <span className="text-xs text-slate-500">
                  {' '}– {property.maxMonthlyRent.toLocaleString()}
                </span>
              )}
              <span className="text-xs font-normal text-slate-500"> / mo</span>
            </div>

            {property.reviewsSummary.totalReviews > 0 ? (
              <div className="flex items-center gap-1 text-xs font-bold shrink-0 px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/80">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{property.reviewsSummary.averageRating.toFixed(1)}</span>
                <span className="font-normal text-[11px] text-amber-700">
                  ({property.reviewsSummary.totalReviews})
                </span>
              </div>
            ) : (
              <div className="h-4" />
            )}
          </div>

          {/* Title */}
          <h3
            title={property.title}
            className="text-base font-bold text-slate-900 group-hover:text-blue-600 line-clamp-1 transition-colors"
          >
            {property.title}
          </h3>

          {/* Address */}
          <p className="text-xs flex items-center gap-1.5 mt-1 mb-2.5 text-slate-500 line-clamp-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              {property.address}, {property.city}
            </span>
          </p>

          {/* Key Unit Attributes */}
          <div className="flex items-center gap-3 py-2 text-xs font-medium rounded-xl px-3 my-2 bg-slate-50 border border-slate-200/70 text-slate-700">
            <div className="flex items-center gap-1.5">
              <Bed className="w-3.5 h-3.5 text-blue-600" />
              <span>{bedroomsLabel}</span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1.5">
              <Bath className="w-3.5 h-3.5 text-blue-600" />
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
          <div className="flex flex-wrap gap-1.5 mt-2.5 h-8 overflow-hidden content-start">
            {property.amenities.slice(0, 3).map((am) => (
              <span
                key={am.id}
                className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200/60 whitespace-nowrap"
              >
                {am.name}
              </span>
            ))}
            {property.amenities.length > 3 && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-500 whitespace-nowrap">
                +{property.amenities.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3.5 mt-3 flex items-center gap-2 border-t border-slate-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(property);
            }}
            className="flex-1 text-center py-2 px-3 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
          >
            View Units
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onApply(property);
            }}
            className="flex items-center justify-center gap-1.5 py-2 px-4 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
          >
            <span>Apply</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
