/**
 * PropertyFiltersDrawer Component — Manus / Aceternity Dark Filter Drawer
 *
 * Advanced filter drawer for Kathmandu Valley property discovery:
 * - Min/Max monthly rent numeric sliders / inputs
 * - Bedroom & bathroom selectors with glowing active states
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
          className="fixed inset-0 modal-overlay"
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="relative w-full max-w-md h-full flex flex-col z-10"
          style={{
            background: 'linear-gradient(180deg, rgba(13,21,32,0.98) 0%, rgba(8,13,20,0.99) 100%)',
            borderLeft: '1px solid rgba(46, 139, 255, 0.25)',
            boxShadow: '-20px 0 60px rgba(0,0,0,0.8)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-5"
            style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}
          >
            <div>
              <h2 className="text-lg font-display font-bold text-white">Filter Properties</h2>
              <p className="text-xs" style={{ color: '#5a7299' }}>
                Tune specific requirements for Kathmandu Valley
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl transition-colors hover:text-white"
              style={{ color: '#7187a5', background: 'rgba(255,255,255,0.03)' }}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs" style={{ color: '#c8d8f0' }}>
            {/* Rent Range (NPR) */}
            <div>
              <label
                className="text-xs font-bold uppercase tracking-wider block mb-2.5 font-display"
                style={{ color: '#5a7299' }}
              >
                Monthly Rent (NPR)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] block mb-1 font-display" style={{ color: '#7187a5' }}>
                    Min Rent
                  </span>
                  <input
                    type="number"
                    step="5000"
                    value={filters.minRent || ''}
                    onChange={(e) => onChange({ minRent: Number(e.target.value) || 0 })}
                    placeholder="Min (e.g. 15000)"
                    className="form-input text-xs"
                  />
                </div>
                <div>
                  <span className="text-[11px] block mb-1 font-display" style={{ color: '#7187a5' }}>
                    Max Rent
                  </span>
                  <input
                    type="number"
                    step="5000"
                    value={filters.maxRent || ''}
                    onChange={(e) => onChange({ maxRent: Number(e.target.value) || 0 })}
                    placeholder="Max (e.g. 60000)"
                    className="form-input text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Bedrooms */}
            <div>
              <label
                className="text-xs font-bold uppercase tracking-wider block mb-2.5 font-display"
                style={{ color: '#5a7299' }}
              >
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
                      className={`py-2 text-xs font-bold rounded-xl transition-all font-display ${
                        isSelected ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                      style={{
                        background: isSelected ? 'rgba(46, 139, 255, 0.25)' : 'rgba(255, 255, 255, 0.02)',
                        border: isSelected ? '1px solid rgba(46, 139, 255, 0.45)' : '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      {b === 'all' ? 'Any' : `${b} BHK`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bathrooms */}
            <div>
              <label
                className="text-xs font-bold uppercase tracking-wider block mb-2.5 font-display"
                style={{ color: '#5a7299' }}
              >
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
                      className={`py-2 text-xs font-bold rounded-xl transition-all font-display ${
                        isSelected ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                      style={{
                        background: isSelected ? 'rgba(46, 139, 255, 0.25)' : 'rgba(255, 255, 255, 0.02)',
                        border: isSelected ? '1px solid rgba(46, 139, 255, 0.45)' : '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      {b === 'all' ? 'Any' : `${b}+ Bath`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority Amenities */}
            <div>
              <label
                className="text-xs font-bold uppercase tracking-wider block mb-2.5 font-display"
                style={{ color: '#5a7299' }}
              >
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
                      className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all"
                      style={{
                        background: isChecked ? 'rgba(46, 139, 255, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                        border: isChecked ? '1px solid rgba(46, 139, 255, 0.35)' : '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-brand-400" />
                        <span className="text-xs font-medium text-white font-display">{am.label}</span>
                      </div>
                      <div
                        className="w-4 h-4 rounded border flex items-center justify-center transition-all"
                        style={{
                          borderColor: isChecked ? '#2e8bff' : 'rgba(255, 255, 255, 0.2)',
                          background: isChecked ? '#2e8bff' : 'transparent',
                        }}
                      >
                        {isChecked && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Verified Listings Only Toggle */}
            <div className="pt-3" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <label className="flex items-center justify-between cursor-pointer py-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-emerald-400"
                    style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block font-display">Verified Listings Only</span>
                    <span className="text-[11px]" style={{ color: '#7187a5' }}>
                      Filter for title-deed verified landlords
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={filters.verifiedOnly}
                  onChange={(e) => onChange({ verifiedOnly: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
              </label>
            </div>
          </div>

          {/* Footer */}
          <div
            className="p-4 flex items-center justify-between gap-3"
            style={{
              background: 'rgba(8, 13, 20, 0.95)',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <button
              type="button"
              onClick={onReset}
              className="btn-ghost btn-sm font-display flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="btn-primary btn-md font-display shine-hover"
            >
              Show Results
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
