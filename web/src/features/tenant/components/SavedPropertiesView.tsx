/**
 * SavedPropertiesView Component — Clean Light Wishlist
 *
 * Tenant Wishlist featuring:
 * - Side-by-side comparison matrix across rent, amenities, and water/parking
 * - Clean light card layout using redesigned PropertyCard
 * - Clean empty state
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { Heart, Scale, Check, X } from 'lucide-react';
import { ShimmerButton, StatusPill } from '@/components/ui';
import type { PropertyListing } from '@/types/tenant';
import { PropertyCard } from './PropertyCard';

interface SavedPropertiesViewProps {
  savedProperties: PropertyListing[];
  onToggleSave: (id: string) => void;
  onSelectProperty: (property: PropertyListing) => void;
  onApplyProperty: (property: PropertyListing) => void;
  onBrowseMore: () => void;
}

export function SavedPropertiesView({
  savedProperties,
  onToggleSave,
  onSelectProperty,
  onApplyProperty,
  onBrowseMore,
}: SavedPropertiesViewProps) {
  const [showComparison, setShowComparison] = useState(false);

  if (savedProperties.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-12 text-center max-w-md mx-auto space-y-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto bg-rose-50 text-rose-500 border border-rose-100">
          <Heart className="w-7 h-7 fill-rose-500/20" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">No Saved Properties</h3>
        <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
          Tap the heart icon on any rental listing to bookmark homes and compare rates, deposits,
          and amenities side-by-side.
        </p>
        <ShimmerButton
          variant="primary"
          onClick={onBrowseMore}
          className="mx-auto"
        >
          Explore Properties
        </ShimmerButton>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Saved Properties & Wishlist</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {savedProperties.length} bookmarked {savedProperties.length === 1 ? 'home' : 'homes'} in Kathmandu Valley
          </p>
        </div>

        {savedProperties.length > 1 && (
          <ShimmerButton
            variant="outline"
            size="md"
            onClick={() => setShowComparison((v) => !v)}
            leftIcon={<Scale className="w-4 h-4 text-slate-600" />}
          >
            {showComparison ? 'Hide Comparison Matrix' : 'Compare Side-by-Side'}
          </ShimmerButton>
        )}
      </div>

      {/* Comparison Table if toggled */}
      {showComparison && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 overflow-x-auto"
        >
          <h3 className="text-sm font-bold text-slate-900 mb-3">Side-by-Side Comparison</h3>
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="uppercase text-[10px] font-semibold text-slate-500 bg-slate-50 border-b border-slate-200/80">
              <tr>
                <th className="py-2.5 px-3">Metric</th>
                {savedProperties.map((p) => (
                  <th key={p.id} className="py-2.5 px-3 font-bold text-slate-900 max-w-[200px] truncate">
                    {p.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-500">Monthly Rent</td>
                {savedProperties.map((p) => (
                  <td key={p.id} className="py-2.5 px-3 font-extrabold text-slate-900">
                    NPR {p.minMonthlyRent.toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-500">Location</td>
                {savedProperties.map((p) => (
                  <td key={p.id} className="py-2.5 px-3 text-slate-700">
                    {p.city} ({p.address})
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-500">Units Available</td>
                {savedProperties.map((p) => (
                  <td key={p.id} className="py-2.5 px-3">
                    <StatusPill variant="info" size="sm">
                      {p.availableUnitsCount} available
                    </StatusPill>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-500">24/7 Treated Water</td>
                {savedProperties.map((p) => (
                  <td key={p.id} className="py-2.5 px-3">
                    {p.amenities.some((a) => a.slug === 'water') ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <X className="w-4 h-4 text-slate-400" />
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-500">Dedicated Parking</td>
                {savedProperties.map((p) => (
                  <td key={p.id} className="py-2.5 px-3">
                    {p.amenities.some((a) => a.slug === 'parking') ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <X className="w-4 h-4 text-slate-400" />
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-500">Solar Backup Power</td>
                {savedProperties.map((p) => (
                  <td key={p.id} className="py-2.5 px-3">
                    {p.amenities.some((a) => a.slug === 'backup') ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <X className="w-4 h-4 text-slate-400" />
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-500">Actions</td>
                {savedProperties.map((p) => (
                  <td key={p.id} className="py-2.5 px-3">
                    <ShimmerButton
                      variant="primary"
                      size="sm"
                      onClick={() => onApplyProperty(p)}
                    >
                      Apply Now
                    </ShimmerButton>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Property Cards Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {savedProperties.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            isSaved={true}
            onToggleSave={onToggleSave}
            onSelect={onSelectProperty}
            onApply={onApplyProperty}
          />
        ))}
      </div>
    </div>
  );
}
