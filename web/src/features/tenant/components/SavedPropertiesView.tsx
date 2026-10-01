/**
 * SavedPropertiesView Component
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { Heart, Scale, Check, X } from 'lucide-react';
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
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
          <Heart className="w-6 h-6" />
        </div>
        <h3 className="text-base font-display font-semibold text-slate-900">No Saved Properties</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Tap the heart icon on any rental listing to bookmark homes and compare rates, deposits, and amenities side-by-side.
        </p>
        <button
          onClick={onBrowseMore}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
        >
          Explore Properties
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold text-slate-900">Saved Properties & Wishlist</h2>
          <p className="text-xs text-slate-500">
            {savedProperties.length} bookmarked {savedProperties.length === 1 ? 'home' : 'homes'} in Kathmandu Valley
          </p>
        </div>

        {savedProperties.length > 1 && (
          <button
            type="button"
            onClick={() => setShowComparison((v) => !v)}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-2 ${
              showComparison
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>{showComparison ? 'Hide Comparison Matrix' : 'Compare Side-by-Side'}</span>
          </button>
        )}
      </div>

      {/* Comparison Table if toggled */}
      {showComparison && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs overflow-x-auto"
        >
          <h3 className="text-sm font-display font-semibold text-slate-900 mb-3">Side-by-Side Comparison</h3>
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Metric</th>
                {savedProperties.map((p) => (
                  <th key={p.id} className="py-2.5 px-3 font-semibold text-slate-900 max-w-[200px] truncate">
                    {p.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-400">Monthly Rent</td>
                {savedProperties.map((p) => (
                  <td key={p.id} className="py-2.5 px-3 font-bold text-brand-950 font-display">
                    NPR {p.minMonthlyRent.toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-400">Location</td>
                {savedProperties.map((p) => (
                  <td key={p.id} className="py-2.5 px-3">
                    {p.city} ({p.address})
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-400">Units Available</td>
                {savedProperties.map((p) => (
                  <td key={p.id} className="py-2.5 px-3">
                    {p.availableUnitsCount} available
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-400">24/7 Treated Water</td>
                {savedProperties.map((p) => (
                  <td key={p.id} className="py-2.5 px-3">
                    {p.amenities.some((a) => a.slug === 'water') ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300" />
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-400">Dedicated Parking</td>
                {savedProperties.map((p) => (
                  <td key={p.id} className="py-2.5 px-3">
                    {p.amenities.some((a) => a.slug === 'parking') ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300" />
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-400">Solar Backup Power</td>
                {savedProperties.map((p) => (
                  <td key={p.id} className="py-2.5 px-3">
                    {p.amenities.some((a) => a.slug === 'backup') ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300" />
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-400">Actions</td>
                {savedProperties.map((p) => (
                  <td key={p.id} className="py-2.5 px-3">
                    <button
                      type="button"
                      onClick={() => onApplyProperty(p)}
                      className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-[11px] font-semibold transition-colors"
                    >
                      Apply Now
                    </button>
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
