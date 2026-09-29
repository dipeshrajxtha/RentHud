/**
 * PropertySearchBar Component
 */

import React from 'react';
import { Search, MapPin, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import type { SearchFilters } from '@/types/tenant';

interface PropertySearchBarProps {
  filters: SearchFilters;
  onChange: (updated: Partial<SearchFilters>) => void;
  onOpenFilters: () => void;
  activeFilterCount: number;
}

export function PropertySearchBar({
  filters,
  onChange,
  onOpenFilters,
  activeFilterCount,
}: PropertySearchBarProps) {
  const cities = ['All', 'Kathmandu', 'Lalitpur', 'Bhaktapur'];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-3 sm:p-4 space-y-3">
      {/* Top row: search input + city selector + filter button */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        {/* Search Query Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onChange({ searchQuery: e.target.value })}
            placeholder="Search by neighborhood, street, or property name (e.g. Sanepa, Lazimpat)..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
        </div>

        {/* City Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {cities.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => onChange({ city })}
              className={`px-3 py-2 text-xs font-medium rounded-xl whitespace-nowrap transition-all ${
                filters.city === city
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              {city !== 'All' && <MapPin className="inline w-3 h-3 mr-1 -mt-0.5 opacity-70" />}
              {city}
            </button>
          ))}
        </div>

        {/* Filters drawer trigger */}
        <button
          type="button"
          onClick={onOpenFilters}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl border transition-all ${
            activeFilterCount > 0
              ? 'bg-brand-50 border-brand-300 text-brand-700'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-brand-600 text-white text-[10px] flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Quick filter pills row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400 font-medium mr-1">Bedrooms:</span>
          {(['all', 1, 2, 3, 4] as const).map((b) => (
            <button
              key={String(b)}
              type="button"
              onClick={() => onChange({ bedrooms: b })}
              className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                filters.bedrooms === b
                  ? 'border-brand-500 bg-brand-50 text-brand-700 font-semibold'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {b === 'all' ? 'Any' : `${b} BHK`}
            </button>
          ))}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filters.sortBy}
            onChange={(e) => onChange({ sortBy: e.target.value as any })}
            className="bg-transparent border-none text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="recommended">Sort: Recommended</option>
            <option value="rent_asc">Rent: Low to High</option>
            <option value="rent_desc">Rent: High to Low</option>
            <option value="newest">Newest Listed</option>
          </select>
        </div>
      </div>
    </div>
  );
}
