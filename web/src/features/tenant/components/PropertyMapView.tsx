/**
 * PropertyMapView Component
 *
 * Interactive Leaflet Map for Kathmandu Valley Rental Discovery:
 * - Custom price tag markers (रू 45K) with selection highlights
 * - Real-time PostGIS-compatible radius distance ring (1km - 25km)
 * - Rich popups with photo, key specifications, and instant Apply/Details actions
 * - Auto-fit bounds and recenter controls
 */

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Bed, Bath, ArrowUpRight, Compass } from 'lucide-react';
import type { PropertyListing } from '@/types/tenant';

interface PropertyMapViewProps {
  properties: PropertyListing[];
  selectedPropertyId?: string | null;
  onSelectProperty: (property: PropertyListing) => void;
  onApplyProperty: (property: PropertyListing) => void;
  radiusKm?: number;
  onRadiusChange?: (km: number) => void;
  centerCoords?: { latitude: number; longitude: number };
}

// Center of Kathmandu Valley (Durbar Marg / Ratnapark hub)
const KTM_VALLEY_CENTER: [number, number] = [27.7080, 85.3200];

// Custom Leaflet DivIcon for Price Pins
function createPriceIcon(price: number, isSelected: boolean) {
  const formatted = price >= 1000 ? `रू ${(price / 1000).toFixed(0)}k` : `रू ${price}`;
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: ${
        isSelected ? 'scale(1.15) translateY(-3px)' : 'scale(1)'
      }; transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1); z-index: ${isSelected ? 999 : 50};">
        <div style="
          background: ${isSelected ? '#0170c7' : '#ffffff'};
          color: ${isSelected ? '#ffffff' : '#0b406e'};
          border: 1.5px solid ${isSelected ? '#ffffff' : '#bae0fd'};
          box-shadow: 0 4px 14px rgba(7, 40, 73, ${isSelected ? '0.35' : '0.12'});
          padding: 3px 8px;
          border-radius: 9999px;
          font-weight: 700;
          font-size: 11px;
          letter-spacing: -0.01em;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 3px;
        ">
          <span>${formatted}</span>
        </div>
        <div style="
          width: 6px;
          height: 6px;
          background: ${isSelected ? '#0170c7' : '#064c84'};
          border-radius: 9999px;
          margin-top: -2px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        "></div>
      </div>
    `,
    iconSize: [60, 32],
    iconAnchor: [30, 30],
    popupAnchor: [0, -28],
  });
}

// Map Controller for Dynamic Pan/Zoom and Bounds
function MapController({
  properties,
  center,
}: {
  properties: PropertyListing[];
  center: [number, number];
}) {
  const map = useMap();

  useEffect(() => {
    if (properties.length > 0) {
      const validCoords = properties
        .filter((p) => p.location?.latitude && p.location?.longitude)
        .map((p) => [p.location.latitude, p.location.longitude] as [number, number]);

      if (validCoords.length > 0) {
        const bounds = L.latLngBounds(validCoords);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }
    } else {
      map.setView(center, 13);
    }
  }, [properties, map, center]);

  return null;
}

export function PropertyMapView({
  properties,
  selectedPropertyId,
  onSelectProperty,
  onApplyProperty,
  radiusKm = 10,
  onRadiusChange,
  centerCoords,
}: PropertyMapViewProps) {
  const mapCenter = useMemo<[number, number]>(() => {
    if (centerCoords?.latitude && centerCoords?.longitude) {
      return [centerCoords.latitude, centerCoords.longitude];
    }
    return KTM_VALLEY_CENTER;
  }, [centerCoords]);

  const RADIUS_OPTIONS = [2, 5, 10, 15, 25];

  return (
    <div className="relative w-full h-[540px] sm:h-[620px] rounded-3xl overflow-hidden border border-slate-200/90 shadow-md bg-slate-100 flex flex-col">
      {/* ── Top Floating Overlay: Radius & Filter Controls ──────────────── */}
      <div className="absolute top-3 left-3 right-3 sm:right-auto z-20 flex flex-wrap items-center gap-2 pointer-events-auto">
        {/* Radius Quick Selector */}
        <div className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1 text-slate-500 font-semibold">
            <Compass className="w-3.5 h-3.5 text-brand-600" />
            <span className="hidden sm:inline">Search Radius:</span>
          </div>

          <div className="flex items-center gap-1">
            {RADIUS_OPTIONS.map((km) => (
              <button
                key={km}
                type="button"
                onClick={() => onRadiusChange?.(km)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  radiusKm === km
                    ? 'bg-brand-600 text-white shadow-xs scale-105'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {km} km
              </button>
            ))}
          </div>
        </div>

        {/* Counter Pill */}
        <div className="bg-brand-950/85 backdrop-blur-md text-white px-3 py-2 rounded-2xl text-xs font-semibold shadow-sm flex items-center gap-1.5 border border-brand-800">
          <MapPin className="w-3.5 h-3.5 text-brand-400" />
          <span>
            {properties.length} {properties.length === 1 ? 'home' : 'homes'} in Valley
          </span>
        </div>
      </div>

      {/* ── Leaflet Map Container ────────────────────────────────────────── */}
      <div className="flex-1 w-full h-full">
        <MapContainer
          center={mapCenter}
          zoom={13}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          {/* Tile Layer: OpenStreetMap Standard */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Interactive Radius Circle Overlay */}
          {radiusKm > 0 && (
            <Circle
              center={mapCenter}
              radius={radiusKm * 1000}
              pathOptions={{
                color: '#0c8ee9',
                fillColor: '#0c8ee9',
                fillOpacity: 0.08,
                weight: 1.5,
                dashArray: '4, 6',
              }}
            />
          )}

          {/* Dynamic Map Bounds Controller */}
          <MapController properties={properties} center={mapCenter} />

          {/* Property Markers */}
          {properties.map((property) => {
            if (!property.location?.latitude || !property.location?.longitude) {
              return null;
            }

            const isSelected = selectedPropertyId === property.id;
            const position: [number, number] = [
              property.location.latitude,
              property.location.longitude,
            ];

            return (
              <Marker
                key={property.id}
                position={position}
                icon={createPriceIcon(property.minMonthlyRent, isSelected)}
                eventHandlers={{
                  click: () => onSelectProperty(property),
                }}
              >
                {/* Rich Interactive Popup */}
                <Popup>
                  <div className="w-64 p-3 bg-white text-slate-800 space-y-2">
                    {/* Thumbnail Image */}
                    <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-slate-100">
                      <img
                        src={property.coverPhotoUrl}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-[10px] font-bold text-white">
                        {property.availableUnitsCount} available
                      </span>
                    </div>

                    {/* Title & Location */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                        {property.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{property.address}, {property.city}</span>
                      </p>
                    </div>

                    {/* Key Specs */}
                    <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-0.5">
                        <Bed className="w-3 h-3 text-brand-600" />
                        <span>{property.units[0]?.bedrooms ?? 1} BHK</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-0.5">
                        <Bath className="w-3 h-3 text-brand-600" />
                        <span>{property.units[0]?.bathrooms ?? 1} Bath</span>
                      </div>
                      <div className="ml-auto font-bold text-brand-700">
                        NPR {property.minMonthlyRent.toLocaleString()}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSelectProperty(property)}
                        className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold rounded-lg transition-colors text-center"
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        onClick={() => onApplyProperty(property)}
                        className="flex-1 py-1.5 px-2 bg-brand-600 hover:bg-brand-500 text-white text-[11px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-xs"
                      >
                        <span>Apply</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
