/**
 * PropertyMapView Component
 *
 * Interactive Leaflet Map for Kathmandu Valley Rental Discovery:
 * - Custom price tag markers (रू 45K) with selection highlights
 * - Real-time PostGIS-compatible radius distance ring (1km - 25km)
 * - Rich popups with photo, key specifications, and instant Apply/Details actions
 * - Auto-fit bounds and recenter controls
 */

import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Bed, Bath, ArrowUpRight, Compass, Crosshair } from 'lucide-react';
import type { PropertyListing } from '@/types/tenant';
import { calculateDistanceKm } from '../tenant.service';
import locationPlaceholderPin from '@/assets/Location/placeholder(2).png';

interface PropertyMapViewProps {
  properties: PropertyListing[];
  selectedPropertyId?: string | null;
  onSelectProperty: (property: PropertyListing) => void;
  onApplyProperty: (property: PropertyListing) => void;
  radiusKm?: number;
  onRadiusChange?: (km: number) => void;
  centerCoords?: { latitude: number; longitude: number };
  onCenterChange?: (coords: { latitude: number; longitude: number }) => void;
}

// Center of Kathmandu Valley (Durbar Marg / Ratnapark hub)
const KTM_VALLEY_CENTER: [number, number] = [27.7080, 85.3200];

// Custom Leaflet DivIcon for Red House Location Pins (User's red pin with white center cutout)
function createRedPropertyPinIcon(
  price: number,
  isSelected: boolean,
  distKm?: number | null
) {
  const formatted = price >= 1000 ? `रू ${(price / 1000).toFixed(0)}k` : `रू ${price}`;
  const distText = distKm !== null && distKm !== undefined ? `${distKm} km` : null;

  return L.divIcon({
    className: 'custom-leaflet-red-pin-marker',
    html: `
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        transform: ${isSelected ? 'scale(1.18) translateY(-6px)' : 'scale(1)'};
        transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        z-index: ${isSelected ? 999 : 60};
      ">
        <!-- Floating Price Badge -->
        <div style="
          background: ${isSelected ? '#e50914' : '#ffffff'};
          color: ${isSelected ? '#ffffff' : '#111827'};
          border: 1.5px solid #e50914;
          box-shadow: 0 4px 14px rgba(229, 9, 20, 0.3);
          padding: 2.5px 8px;
          border-radius: 9999px;
          font-weight: 800;
          font-size: 11px;
          line-height: 1.2;
          letter-spacing: -0.01em;
          white-space: nowrap;
          margin-bottom: 2px;
          display: flex;
          align-items: center;
          gap: 4px;
        ">
          <span>${formatted}</span>
          ${distText ? `<span style="font-size: 9px; opacity: 0.75; font-weight: 600;">• ${distText}</span>` : ''}
        </div>

        <!-- Red Pin Graphic (web/src/assets/Location/placeholder(2).png) -->
        <div style="position: relative; width: 34px; height: 44px; display: flex; align-items: center; justify-content: center;">
          <img 
            src="${locationPlaceholderPin}" 
            alt="House Location" 
            style="
              width: 34px; 
              height: 44px; 
              object-fit: contain; 
              filter: drop-shadow(0 3px 5px rgba(0,0,0,0.35));
              pointer-events: none;
            " 
          />
        </div>

        <!-- Ground Pin Shadow -->
        <div style="
          width: 12px;
          height: 3px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 50%;
          margin-top: -3px;
          filter: blur(1px);
        "></div>
      </div>
    `,
    iconSize: [72, 70],
    iconAnchor: [36, 68],
    popupAnchor: [0, -66],
  });
}

// Custom Center Target Icon for search center
function createCenterTargetIcon() {
  return L.divIcon({
    className: 'custom-leaflet-center-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
        <div style="position: absolute; width: 32px; height: 32px; border-radius: 9999px; background: rgba(1, 112, 199, 0.25); animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
        <div style="width: 14px; height: 14px; border-radius: 9999px; background: #0170c7; border: 2.5px solid #ffffff; box-shadow: 0 2px 8px rgba(1, 112, 199, 0.6); z-index: 10;"></div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
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
  const prevCenterRef = useRef<[number, number]>(center);

  // When center coordinates change, fly map to new center immediately
  useEffect(() => {
    if (
      prevCenterRef.current[0] !== center[0] ||
      prevCenterRef.current[1] !== center[1]
    ) {
      prevCenterRef.current = center;
      map.flyTo(center, Math.max(map.getZoom(), 13), { duration: 0.8 });
    }
  }, [center, map]);

  // When properties list changes
  useEffect(() => {
    if (properties.length > 0) {
      const validCoords = properties
        .filter((p) => p.location?.latitude && p.location?.longitude)
        .map((p) => [p.location.latitude, p.location.longitude] as [number, number]);

      if (validCoords.length > 0) {
        // Include center so both center radius and properties are framed nicely
        const allPoints: [number, number][] = [...validCoords, center];
        const bounds = L.latLngBounds(allPoints);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }
    } else {
      map.setView(center, 13);
    }
  }, [properties, map, center]);

  return null;
}

// Map Click Listener to re-center search radius
function MapClickHandler({
  onCenterChange,
}: {
  onCenterChange?: (coords: { latitude: number; longitude: number }) => void;
}) {
  useMapEvents({
    click(e) {
      if (onCenterChange) {
        onCenterChange({ latitude: e.latlng.lat, longitude: e.latlng.lng });
      }
    },
  });
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
  onCenterChange,
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

        {/* Counter Pill with Red Pin Icon */}
        <div className="bg-white/95 backdrop-blur-md text-slate-800 px-3 py-2 rounded-2xl text-xs font-semibold shadow-sm flex items-center gap-1.5 border border-slate-200">
          <img src={locationPlaceholderPin} alt="House Pin" className="w-3.5 h-4.5 object-contain inline-block" />
          <span>
            <strong className="text-blue-600 font-bold">{properties.length}</strong> {properties.length === 1 ? 'house' : 'houses'} found {radiusKm > 0 ? `in ${radiusKm}km radius` : 'in Valley'}
          </span>
        </div>

        {/* Click-to-Move Map Center Hint Pill */}
        <div className="hidden md:flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-200/80 text-xs font-semibold text-slate-600 shadow-sm">
          <Crosshair className="w-3.5 h-3.5 text-brand-600" />
          <span>Click map to center</span>
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

          {/* Map click listener to re-center radius */}
          <MapClickHandler onCenterChange={onCenterChange} />

          {/* Interactive Radius Circle Overlay */}
          {radiusKm > 0 && (
            <Circle
              center={mapCenter}
              radius={radiusKm * 1000}
              pathOptions={{
                color: '#e50914',
                fillColor: '#e50914',
                fillOpacity: 0.07,
                weight: 1.5,
                dashArray: '4, 6',
              }}
            />
          )}

          {/* Active Search Center Target Marker */}
          {radiusKm > 0 && (
            <Marker
              position={mapCenter}
              icon={createCenterTargetIcon()}
              interactive={true}
            >
              <Tooltip direction="top" offset={[0, -18]} permanent={false}>
                <span className="text-xs font-semibold text-slate-900">
                  Search Center ({radiusKm} km radius) &bull; Click anywhere on map to move
                </span>
              </Tooltip>
            </Marker>
          )}

          {/* Dynamic Map Bounds Controller */}
          <MapController properties={properties} center={mapCenter} />

          {/* Property Markers: Displayed with the User's Red Location Pin */}
          {properties.map((property) => {
            if (!property.location?.latitude || !property.location?.longitude) {
              return null;
            }

            const isSelected = selectedPropertyId === property.id;
            const position: [number, number] = [
              property.location.latitude,
              property.location.longitude,
            ];

            const distKm =
              centerCoords?.latitude && centerCoords?.longitude
                ? calculateDistanceKm(
                    centerCoords.latitude,
                    centerCoords.longitude,
                    property.location.latitude,
                    property.location.longitude
                  )
                : null;

            return (
              <Marker
                key={property.id}
                position={position}
                icon={createRedPropertyPinIcon(property.minMonthlyRent, isSelected, distKm)}
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
                      {distKm !== null && radiusKm > 0 && distKm <= radiusKm && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-rose-600/90 backdrop-blur-xs text-[10px] font-bold text-white flex items-center gap-1 shadow-xs">
                          <img src={locationPlaceholderPin} alt="pin" className="w-2.5 h-3 object-contain invert brightness-200" />
                          <span>Within {radiusKm} km ({distKm} km away)</span>
                        </span>
                      )}
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
