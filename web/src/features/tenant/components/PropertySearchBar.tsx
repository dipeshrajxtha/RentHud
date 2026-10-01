/**
 * PropertySearchBar Component
 *
 * Search & Discovery Bar with:
 * - Fulltext search across Kathmandu neighborhoods
 * - City selector pills (Kathmandu, Lalitpur, Bhaktapur)
 * - View mode switcher (Grid, Split Map + List, Full Map)
 * - Quick radius filter pills & bedroom selectors
 */

import { Search, MapPin, SlidersHorizontal, ArrowUpDown, LayoutGrid, Map, Columns, Compass } from 'lucide-react';
import type { SearchFilters } from '@/types/tenant';

export type ViewMode = 'grid' | 'split' | 'map';

interface PropertySearchBarProps {
  filters: SearchFilters;
  onChange: (updated: Partial<SearchFilters>) => void;
  onOpenFilters: () => void;
  activeFilterCount: number;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
}

export function PropertySearchBar({
  filters,
  onChange,
  onOpenFilters,
  activeFilterCount,
  viewMode = 'grid',
  onViewModeChange,
}: PropertySearchBarProps) {
  const cities = ['All', 'Kathmandu', 'Lalitpur', 'Bhaktapur'];
  const radiusList = [5, 10, 15, 20];

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-3.5 sm:p-5 space-y-3.5">
      {/* Top row: search input + city selector + filter button + view mode */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search Query Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onChange({ searchQuery: e.target.value })}
            placeholder="Search neighborhood, street, or property name (e.g. Sanepa, Jhamsikhel, Lazimpat)..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
        </div>

        {/* City Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {cities.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => onChange({ city })}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                filters.city === city
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              {city !== 'All' && <MapPin className="inline w-3 h-3 mr-1 -mt-0.5 opacity-70" />}
              {city}
            </button>
          ))}
        </div>

        {/* View Mode Switcher (Grid / Split / Map) */}
        {onViewModeChange && (
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/70 self-start lg:self-center">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              title="Grid View"
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-brand-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>

            <button
              type="button"
              onClick={() => onViewModeChange('split')}
              title="Split Map & Grid"
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'split'
                  ? 'bg-white text-brand-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Split</span>
            </button>

            <button
              type="button"
              onClick={() => onViewModeChange('map')}
              title="Full Map View"
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'map'
                  ? 'bg-white text-brand-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Map</span>
            </button>
          </div>
        )}

        {/* Filters drawer trigger */}
        <button
          type="button"
          onClick={onOpenFilters}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-2xl border transition-all ${
            activeFilterCount > 0
              ? 'bg-brand-50 border-brand-300 text-brand-700 shadow-xs'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-brand-600 text-white text-[10px] flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Quick filter pills row (Bedrooms + Radius + Sort) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-2 flex-wrap">
          {/* BHK Pill Selector */}
          <span className="text-slate-400 font-semibold mr-0.5">Bedrooms:</span>
          {(['all', 1, 2, 3, 4] as const).map((b) => (
            <button
              key={String(b)}
              type="button"
              onClick={() => onChange({ bedrooms: b })}
              className={`px-3 py-1 rounded-xl border text-xs font-semibold transition-colors ${
                filters.bedrooms === b
                  ? 'border-brand-500 bg-brand-50 text-brand-700 font-bold'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {b === 'all' ? 'Any' : `${b} BHK`}
            </button>
          ))}

          {/* Radius Quick Pills */}
          <div className="hidden sm:flex items-center gap-1.5 ml-2 pl-3 border-l border-slate-200">
            <Compass className="w-3.5 h-3.5 text-brand-600" />
            <span className="text-slate-400 font-semibold">Radius:</span>
            {radiusList.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() =>
                  onChange({
                    radiusKm: filters.radiusKm === r ? undefined : r,
                    centerCoords: { latitude: 27.7080, longitude: 85.3200 },
                  })
                }
                className={`px-2.5 py-0.5 rounded-lg border text-[11px] font-semibold transition-all ${
                  filters.radiusKm === r
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 ml-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filters.sortBy}
            onChange={(e) => onChange({ sortBy: e.target.value as any })}
            className="bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer hover:bg-slate-100"
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
