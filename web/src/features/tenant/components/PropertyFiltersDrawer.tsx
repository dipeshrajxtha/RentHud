/**
 * PropertyFiltersDrawer Component
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RotateCcw, Check, Droplet, Car, Wifi, Zap, Heart, Sun, ShieldCheck } from 'lucide-react';
import type { SearchFilters } from '@/types/tenant';

interface PropertyFiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onChange: (updated: Partial<SearchFilters>) => void;
  onReset: () => void;
}

const AMENITIES_LIST = [
  { id: 'water', label: '24/7 Treated Water', icon: Droplet },
  { id: 'parking', label: 'Dedicated Parking', icon: Car },
  { id: 'wifi', label: 'High-Speed Wi-Fi', icon: Wifi },
  { id: 'backup', label: 'Power Backup (Solar/Generator)', icon: Zap },
  { id: 'pet', label: 'Pet-Friendly', icon: Heart },
  { id: 'balcony', label: 'Balcony / Terrace', icon: Sun },
];

export function PropertyFiltersDrawer({
  isOpen,
  onClose,
  filters,
  onChange,
  onReset,
}: PropertyFiltersDrawerProps) {
  if (!isOpen) return null;

  const toggleAmenity = (slug: string) => {
    const current = filters.amenities;
    const next = current.includes(slug)
      ? current.filter((s) => s !== slug)
      : [...current, slug];
    onChange({ amenities: next });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-display font-semibold text-slate-900">Filter Properties</h2>
              <p className="text-xs text-slate-500">Tune specific requirements for Kathmandu Valley</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Rent Range (NPR) */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                Monthly Rent (NPR)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Min Rent</span>
                  <input
                    type="number"
                    step="5000"
                    value={filters.minRent || ''}
                    onChange={(e) => onChange({ minRent: Number(e.target.value) || 0 })}
                    placeholder="Min (e.g. 15000)"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Max Rent</span>
                  <input
                    type="number"
                    step="5000"
                    value={filters.maxRent || ''}
                    onChange={(e) => onChange({ maxRent: Number(e.target.value) || 0 })}
                    placeholder="Max (e.g. 60000)"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Bedrooms */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                Bedrooms
              </label>
              <div className="grid grid-cols-5 gap-2">
                {(['all', 1, 2, 3, 4] as const).map((b) => (
                  <button
                    key={String(b)}
                    type="button"
                    onClick={() => onChange({ bedrooms: b })}
                    className={`py-2 text-xs font-semibold rounded-xl border text-center transition-all ${
                      filters.bedrooms === b
                        ? 'bg-brand-600 border-brand-600 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {b === 'all' ? 'Any' : `${b} BHK`}
                  </button>
                ))}
              </div>
            </div>

            {/* Bathrooms */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                Bathrooms
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['all', 1, 2, 3] as const).map((b) => (
                  <button
                    key={String(b)}
                    type="button"
                    onClick={() => onChange({ bathrooms: b })}
                    className={`py-2 text-xs font-semibold rounded-xl border text-center transition-all ${
                      filters.bathrooms === b
                        ? 'bg-brand-600 border-brand-600 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {b === 'all' ? 'Any' : `${b}+ Bath`}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Amenities */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                Must-Have Amenities
              </label>
              <div className="space-y-2">
                {AMENITIES_LIST.map((am) => {
                  const Icon = am.icon;
                  const isChecked = filters.amenities.includes(am.id);

                  return (
                    <div
                      key={am.id}
                      onClick={() => toggleAmenity(am.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-brand-300 bg-brand-50/70 text-brand-900'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-brand-600" />
                        <span className="text-xs font-medium">{am.label}</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isChecked ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Verified Listings Only Toggle */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center justify-between cursor-pointer py-2">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Verified Listings Only</span>
                    <span className="text-[11px] text-slate-400">Filter for title-deed verified landlords</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={filters.verifiedOnly}
                  onChange={(e) => onChange({ verifiedOnly: e.target.checked })}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              Show Results
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
