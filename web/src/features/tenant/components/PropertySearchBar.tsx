/**
 * PropertySearchBar Component — Clean Light Airbnb Discovery Bar
 *
 * Search & Discovery Bar with:
 * - Real-time full-text search with location resolver for Kathmandu Valley
 * - Clean city selector pills (Kathmandu, Lalitpur, Bhaktapur)
 * - Segmented view switcher (Grid, Split Map + List, Full Map)
 * - Quick bedroom pills, radius filter, and sorting
 * - Clean white card design with subtle slate accents
 */

import { useMemo } from 'react';
import {
  Search,
  MapPin,
  SlidersHorizontal,
  ArrowUpDown,
  LayoutGrid,
  Map,
  Columns,
  CheckCircle2,
  X,
  ShieldCheck,
} from 'lucide-react';
import type { SearchFilters } from '@/types/tenant';
import { resolveLocationFromQuery, CITY_COORDINATES } from '../utils/locationResolver';

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
  const radiusList = [2, 5, 10, 15, 20];

  const matchedLocation = useMemo(
    () => resolveLocationFromQuery(filters.searchQuery),
    [filters.searchQuery]
  );

  const handleSearchChange = (query: string) => {
    const matched = resolveLocationFromQuery(query);
    if (matched) {
      onChange({
        searchQuery: query,
        centerCoords: { latitude: matched.latitude, longitude: matched.longitude },
      });
    } else {
      onChange({ searchQuery: query });
    }
  };

  const handleCitySelect = (city: string) => {
    const coords = CITY_COORDINATES[city as keyof typeof CITY_COORDINATES] ?? CITY_COORDINATES.All;
    onChange({
      city,
      centerCoords: coords,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-4">
      {/* Top row: search input + city selector + filter button + view mode */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search Query Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search neighborhood, street, or building (e.g. Sanepa, Jhamsikhel, Lazimpat, Baneshwor)..."
            className="w-full pl-10 pr-24 py-2.5 text-sm rounded-xl text-slate-900 bg-slate-50 border border-slate-200 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all duration-200"
          />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {matchedLocation && !filters.searchQuery.includes(matchedLocation.name) && (
            <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <CheckCircle2 className="w-3 h-3 text-blue-600" />
              <span>Map: {matchedLocation.name}</span>
            </div>
          )}
        </div>

        {/* City Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {cities.map((city) => {
            const isSelected = filters.city === city;
            return (
              <button
                key={city}
                type="button"
                onClick={() => handleCitySelect(city)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all duration-150 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {city !== 'All' && <MapPin className="inline w-3 h-3 mr-1 -mt-0.5 opacity-80" />}
                {city}
              </button>
            );
          })}
        </div>

        {/* View Mode Switcher (Grid / Split / Map) */}
        {onViewModeChange && (
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/80 self-start lg:self-center">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              title="Grid View"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Grid</span>
            </button>

            <button
              type="button"
              onClick={() => onViewModeChange('split')}
              title="Split Map & Grid"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'split'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Split</span>
            </button>

            <button
              type="button"
              onClick={() => onViewModeChange('map')}
              title="Full Map View"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'map'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Map className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Map</span>
            </button>
          </div>
        )}

        {/* Filters drawer trigger */}
        <button
          type="button"
          onClick={onOpenFilters}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
            activeFilterCount > 0
              ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/80'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Quick filter pills row (Bedrooms + Radius + Sort + Verified) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* BHK Pill Selector */}
          <span className="font-semibold text-slate-500 mr-0.5">Bedrooms:</span>
          {(['all', 1, 2, 3, 4] as const).map((b) => {
            const isSelected = filters.bedrooms === b;
            return (
              <button
                key={String(b)}
                type="button"
                onClick={() => onChange({ bedrooms: b })}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {b === 'all' ? 'Any' : `${b} BHK`}
              </button>
            );
          })}

          {/* Radius selector */}
          <span className="font-semibold text-slate-500 ml-2 mr-0.5">Radius:</span>
          {radiusList.map((km) => {
            const isSelected = filters.radiusKm === km;
            return (
              <button
                key={km}
                type="button"
                onClick={() =>
                  onChange({
                    radiusKm: isSelected ? undefined : km,
                  })
                }
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {km} km
              </button>
            );
          })}
        </div>

        {/* Sort & Verified toggles */}
        <div className="flex items-center gap-2">
          {/* Verified Only Toggle */}
          <button
            type="button"
            onClick={() => onChange({ verifiedOnly: !filters.verifiedOnly })}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg font-medium border transition-all ${
              filters.verifiedOnly
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified Title</span>
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg px-2.5 py-1 border border-slate-200/80">
            <ArrowUpDown className="w-3 h-3 text-slate-500" />
            <select
              value={filters.sortBy}
              onChange={(e) =>
                onChange({
                  sortBy: e.target.value as SearchFilters['sortBy'],
                })
              }
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer text-xs"
            >
              <option value="recommended">Recommended</option>
              <option value="price_asc">Rent: Low to High</option>
              <option value="price_desc">Rent: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="verified">Verified First</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
