/**
 * PropertyFiltersDrawer Component — Clean Light Mode
 *
 * Advanced filter drawer for Kathmandu Valley property discovery:
 * - Min/Max monthly rent numeric sliders / inputs
 * - Bedroom & bathroom selectors with clean active states
 * - Priority amenities toggles with icon cards
 * - Title-deed verified listings toggle
 */

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
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="relative w-full max-w-md h-full bg-white flex flex-col z-10 border-l border-slate-200 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/60">
            <div>
              <h2 className="text-base font-display font-bold text-slate-900">
                Search & Filter
              </h2>
              <p className="text-xs text-slate-500">Fine-tune your Kathmandu rental search</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700">
            {/* Rent Range */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider block mb-2 font-display text-slate-700">
                Monthly Rent (NPR)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] block mb-1 font-display text-slate-500">
                    Min Rent
                  </span>
                  <input
                    type="number"
                    step="5000"
                    value={filters.minRent || ''}
                    onChange={(e) => onChange({ minRent: Number(e.target.value) || 0 })}
                    placeholder="Min (e.g. 15000)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div>
                  <span className="text-[11px] block mb-1 font-display text-slate-500">
                    Max Rent
                  </span>
                  <input
                    type="number"
                    step="5000"
                    value={filters.maxRent || ''}
                    onChange={(e) => onChange({ maxRent: Number(e.target.value) || 0 })}
                    placeholder="Max (e.g. 60000)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* Bedrooms */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider block mb-2 font-display text-slate-700">
                Bedrooms
              </label>
              <div className="grid grid-cols-5 gap-2">
                {(['all', 1, 2, 3, 4] as const).map((b) => {
                  const isSelected = filters.bedrooms === b;
                  return (
                    <button
                      key={String(b)}
                      type="button"
                      onClick={() => onChange({ bedrooms: b })}
                      className={`py-2 text-xs font-bold rounded-xl transition-all font-display border ${
                        isSelected
                          ? 'bg-brand-50 text-brand-700 border-brand-500 shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      {b === 'all' ? 'Any' : `${b} BHK`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bathrooms */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider block mb-2 font-display text-slate-700">
                Bathrooms
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['all', 1, 2, 3] as const).map((b) => {
                  const isSelected = filters.bathrooms === b;
                  return (
                    <button
                      key={String(b)}
                      type="button"
                      onClick={() => onChange({ bathrooms: b })}
                      className={`py-2 text-xs font-bold rounded-xl transition-all font-display border ${
                        isSelected
                          ? 'bg-brand-50 text-brand-700 border-brand-500 shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      {b === 'all' ? 'Any' : `${b}+ Bath`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority Amenities */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider block mb-2 font-display text-slate-700">
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
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                        isChecked
                          ? 'bg-brand-50/70 border-brand-400 text-brand-900 shadow-xs'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isChecked ? 'text-brand-600' : 'text-slate-500'}`} />
                        <span className="text-xs font-medium font-display">{am.label}</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                          isChecked ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white'
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
            <div className="pt-2">
              <label className="flex items-center justify-between cursor-pointer p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-emerald-600 bg-emerald-50 border border-emerald-200">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block font-display">Verified Listings Only</span>
                    <span className="text-[11px] text-slate-500">
                      Filter for title-deed verified landlords
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={filters.verifiedOnly}
                  onChange={(e) => onChange({ verifiedOnly: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 flex items-center justify-between gap-3 bg-slate-50 border-t border-slate-200/80">
            <button
              type="button"
              onClick={onReset}
              className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 transition-colors font-display flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-6 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors font-display shadow-xs"
            >
              Show Results
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
