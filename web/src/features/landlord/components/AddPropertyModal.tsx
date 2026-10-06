import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Plus,
  Trash2,
  Check,
  ChevronRight,
  ChevronLeft,
  Upload,
  Star,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { CreatePropertyDto, CreateUnitDto } from '@/types/landlord';

interface AddPropertyModalProps {
  onClose: () => void;
  onSubmit: (propertyDto: CreatePropertyDto, unitsDto: CreateUnitDto[]) => Promise<void>;
}

// Leaflet default pin icon fix
const customPin = L.divIcon({
  className: 'custom-landlord-pin',
  html: `<div style="background-color: #059669; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function FlyToLocation({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(position, map.getZoom(), { animate: true, duration: 1 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position[0], position[1]]);
  return null;
}

function MapPinPicker({
  position,
  onChange,
}: {
  position: [number, number];
  onChange: (pos: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      onChange([e.latlng.lat, e.latlng.lng]);
    },
  });

  return <Marker position={position} icon={customPin} />;
}

interface LocalPhoto {
  id: string;
  data?: string;
  url?: string;
  caption?: string;
  isCover: boolean;
}

export function AddPropertyModal({ onClose, onSubmit }: AddPropertyModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Step 1: Specs
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Kathmandu');
  const [postalCode, setPostalCode] = useState('44600');
  const [totalFloors, setTotalFloors] = useState<number>(3);
  const [description, setDescription] = useState('');

  // Step 2: Location (Default centered on Kathmandu Durbar Marg: 27.7080, 85.3200)
  const [coords, setCoords] = useState<[number, number]>([27.7080, 85.3200]);
  const [geoState, setGeoState] = useState<'idle' | 'locating' | 'done' | 'denied'>('idle');

  // Step 3: Units
  const [units, setUnits] = useState<CreateUnitDto[]>([
    {
      unitIdentifier: 'Unit 101',
      floorNumber: 1,
      bedrooms: 2,
      bathrooms: 1,
      areaSqft: 650,
      monthlyRent: 22000,
      securityDeposit: 44000,
      availabilityStatus: 'AVAILABLE',
    },
  ]);

  // Step 4: Photos
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [urlPhotoInput, setUrlPhotoInput] = useState('');
  const [captionPhotoInput, setCaptionPhotoInput] = useState('');
  const [isPhotoDragOver, setIsPhotoDragOver] = useState(false);
  const photoFileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoFilesSelected = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    files.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        setPhotos((prev) => {
          const isCover = prev.length === 0;
          return [
            ...prev,
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              data: reader.result as string,
              caption: file.name.replace(/\.[^/.]+$/, ''),
              isCover,
            },
          ];
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddUrlPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlPhotoInput.trim()) return;
    setPhotos((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        url: urlPhotoInput.trim(),
        caption: captionPhotoInput.trim() || undefined,
        isCover: prev.length === 0,
      },
    ]);
    setUrlPhotoInput('');
    setCaptionPhotoInput('');
  };

  const handleSetCoverPhoto = (id: string) => {
    setPhotos((prev) =>
      prev.map((p) => ({
        ...p,
        isCover: p.id === id,
      }))
    );
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => {
      const remaining = prev.filter((p) => p.id !== id);
      const wasCover = prev.find((p) => p.id === id)?.isCover;
      if (wasCover && remaining.length > 0 && !remaining.some((p) => p.isCover)) {
        remaining[0].isCover = true;
      }
      return remaining;
    });
  };

  // Unit form helper
  const addUnitField = () => {
    const nextIdx = units.length + 1;
    setUnits((prev) => [
      ...prev,
      {
        unitIdentifier: `Unit ${nextIdx}01`,
        floorNumber: Math.min(totalFloors, nextIdx),
        bedrooms: 2,
        bathrooms: 1,
        areaSqft: 750,
        monthlyRent: 25000,
        securityDeposit: 50000,
        availabilityStatus: 'AVAILABLE',
      },
    ]);
  };

  const removeUnitField = (idx: number) => {
    if (units.length <= 1) return;
    setUnits((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateUnitField = (idx: number, field: keyof CreateUnitDto, val: any) => {
    setUnits((prev) =>
      prev.map((u, i) => (i === idx ? { ...u, [field]: val } : u))
    );
  };

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Auto-locate landlord when they enter Step 2
  useEffect(() => {
    if (step !== 2 || geoState !== 'idle') return;
    if (!navigator.geolocation) {
      setGeoState('denied');
      return;
    }
    setGeoState('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!isMountedRef.current) return;
        setCoords([pos.coords.latitude, pos.coords.longitude]);
        setGeoState('done');
      },
      () => {
        if (!isMountedRef.current) return;
        setGeoState('denied'); // Falls back to Kathmandu default
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  }, [step, geoState]);

  const handleFinalSubmit = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const propertyDto: CreatePropertyDto = {
        title: title.trim(),
        description: description.trim() || undefined,
        address: address.trim(),
        city: city.trim(),
        postalCode: postalCode.trim() || undefined,
        latitude: coords[0],
        longitude: coords[1],
        totalFloors: Number(totalFloors) || 1,
        photos: photos.map((p) => ({
          data: p.data,
          url: p.url,
          caption: p.caption,
          isCover: p.isCover,
        })),
      };

      await onSubmit(propertyDto, units);
      if (isMountedRef.current) {
        onClose();
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setErrorMsg(err.message || 'Failed to list property');
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">List New Property</h2>
            <p className="text-xs text-slate-500">Step {step} of 5 — {
              step === 1 ? 'Building Details' :
              step === 2 ? 'PostGIS Location Pin' :
              step === 3 ? 'Rentable Units Configuration' :
              step === 4 ? 'Property Photos & Media' :
              'Review & Confirm'
            }</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Pills */}
        <div className="px-6 pt-3 pb-1 grid grid-cols-5 gap-1.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s <= step ? 'bg-emerald-600' : 'bg-slate-100'
              }`}
            />
          ))}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* STEP 1: GENERAL SPECS */}
          {step === 1 && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Building / Property Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sanepa Residency or Lalitpur Garden Villa"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">City *</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="Kathmandu">Kathmandu</option>
                    <option value="Lalitpur">Lalitpur</option>
                    <option value="Bhaktapur">Bhaktapur</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Postal Code</label>
                  <input
                    type="text"
                    placeholder="44600"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Street Address & Landmark *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ward 2, Sanepa Chowk (near British School)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Total Floors
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={totalFloors}
                    onChange={(e) => setTotalFloors(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Property Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe your residential building, neighborhood amenities, solar backup, water facilities, and security..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
          )}

          {/* STEP 2: LOCATION MAP */}
          {step === 2 && (
            <div className="space-y-3 text-xs">
              {geoState === 'locating' && (
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 flex items-center gap-2">
                  <svg className="animate-spin w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  <span>Locating your current position…</span>
                </div>
              )}
              {geoState === 'denied' && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                  Location access denied — map defaulted to Kathmandu. Click the map to pin your building.
                </div>
              )}
              {(geoState === 'idle' || geoState === 'done') && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                  <span className="font-bold block">Pin Your Exact Building Location</span>
                  {geoState === 'done' ? 'Map centered on your current location. ' : ''}
                  Click anywhere on the map to place the green pin. This stores accurate PostGIS coordinates (<code className="text-[10px] font-mono">GEOGRAPHY(Point, 4326)</code>) for geospatial tenant discovery.
                </div>
              )}

              <div className="h-64 sm:h-72 w-full rounded-2xl overflow-hidden border border-slate-200 relative z-0">
                <MapContainer
                  center={coords}
                  zoom={14}
                  scrollWheelZoom={false}
                  className="h-full w-full"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <FlyToLocation position={coords} />
                  <MapPinPicker position={coords} onChange={setCoords} />
                </MapContainer>
              </div>

              <div className="grid grid-cols-2 gap-3 text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">Latitude</span>
                  <span className="font-mono font-bold text-slate-800">{coords[0].toFixed(5)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Longitude</span>
                  <span className="font-mono font-bold text-slate-800">{coords[1].toFixed(5)}</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: RENTABLE UNITS */}
          {step === 3 && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Configure Rentable Units</span>
                  <span className="text-slate-500 text-[11px]">
                    Define individual apartments or floors available for rent
                  </span>
                </div>
                <button
                  type="button"
                  onClick={addUnitField}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Unit</span>
                </button>
              </div>

              <div className="space-y-3">
                {units.map((u, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-xs">Unit #{idx + 1}</span>
                      {units.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeUnitField(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                          Unit Name/No.
                        </label>
                        <input
                          type="text"
                          required
                          value={u.unitIdentifier}
                          onChange={(e) => updateUnitField(idx, 'unitIdentifier', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                          Floor
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={u.floorNumber}
                          onChange={(e) => updateUnitField(idx, 'floorNumber', parseInt(e.target.value) || 1)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                          BHK (Beds)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={u.bedrooms}
                          onChange={(e) => updateUnitField(idx, 'bedrooms', parseInt(e.target.value) || 1)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                          Bathrooms
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={u.bathrooms}
                          onChange={(e) => updateUnitField(idx, 'bathrooms', parseInt(e.target.value) || 1)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                          Monthly Rent (NPR) *
                        </label>
                        <input
                          type="number"
                          required
                          min="1000"
                          step="500"
                          value={u.monthlyRent}
                          onChange={(e) => updateUnitField(idx, 'monthlyRent', parseInt(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                          Security Deposit (NPR)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="500"
                          value={u.securityDeposit}
                          onChange={(e) => updateUnitField(idx, 'securityDeposit', parseInt(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                          Area (sq.ft)
                        </label>
                        <input
                          type="number"
                          min="100"
                          value={u.areaSqft || ''}
                          onChange={(e) => updateUnitField(idx, 'areaSqft', parseInt(e.target.value) || null)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: PROPERTY PHOTOS & MEDIA */}
          {step === 4 && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Property Photos & Media</span>
                  <span className="text-slate-500 text-[11px]">
                    Upload building exterior, lobby, room interiors, or floor layouts
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  {photos.length} {photos.length === 1 ? 'photo' : 'photos'} added
                </span>
              </div>

              {/* Upload Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsPhotoDragOver(true);
                }}
                onDragLeave={() => setIsPhotoDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsPhotoDragOver(false);
                  handlePhotoFilesSelected(e.dataTransfer.files);
                }}
                onClick={() => photoFileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                  isPhotoDragOver
                    ? 'border-emerald-500 bg-emerald-50/60'
                    : 'border-slate-200 hover:border-emerald-400 bg-slate-50/50'
                }`}
              >
                <input
                  ref={photoFileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => handlePhotoFilesSelected(e.target.files)}
                />

                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-emerald-600 mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-slate-800 text-xs">
                    Click or drag & drop property photos from your device
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    Supports JPG, PNG, WEBP, and GIF up to 10MB each.
                  </span>
                  <button
                    type="button"
                    className="mt-2.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1 shadow-2xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      photoFileInputRef.current?.click();
                    }}
                  >
                    <Plus className="w-3 h-3" />
                    <span>Choose Images</span>
                  </button>
                </div>
              </div>

              {/* Add by URL */}
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlPhotoInput}
                  onChange={(e) => setUrlPhotoInput(e.target.value)}
                  placeholder="Or paste an image URL (e.g. Unsplash or CDN)..."
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="button"
                  disabled={!urlPhotoInput.trim()}
                  onClick={handleAddUrlPhoto}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs disabled:opacity-50 transition-colors"
                >
                  Add URL
                </button>
              </div>

              {/* Gallery preview */}
              {photos.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                    <span>Uploaded Gallery ({photos.length})</span>
                    <span>Click the star to set Primary Cover</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 max-h-52 overflow-y-auto p-1">
                    {photos.map((p) => (
                      <div
                        key={p.id}
                        className={`group relative rounded-xl overflow-hidden border ${
                          p.isCover
                            ? 'ring-2 ring-emerald-500 border-emerald-500 shadow-xs'
                            : 'border-slate-200'
                        }`}
                      >
                        <div className="aspect-4/3 w-full bg-slate-100 relative">
                          <img
                            src={p.data || p.url}
                            alt={p.caption || 'Property'}
                            className="w-full h-full object-cover"
                          />
                          {p.isCover && (
                            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-bold flex items-center gap-0.5 shadow-xs">
                              <Star className="w-2.5 h-2.5 fill-white" />
                              <span>Cover</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                            {!p.isCover && (
                              <button
                                type="button"
                                onClick={() => handleSetCoverPhoto(p.id)}
                                className="p-1 bg-white hover:bg-emerald-50 text-slate-800 rounded-lg text-[10px] font-bold"
                                title="Set as cover"
                              >
                                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(p.id)}
                              className="p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
                              title="Remove"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        {p.caption && (
                          <div className="p-1 bg-white border-t border-slate-100">
                            <p className="text-[10px] text-slate-600 truncate font-medium">
                              {p.caption}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                  💡 <strong>Tip:</strong> While photos are optional, properties with high-quality photos receive up to 5x more tenant inquiries! You can also upload photos later from your property dashboard.
                </div>
              )}
            </div>
          )}

          {/* STEP 5: REVIEW & CONFIRM */}
          {step === 5 && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2">
                <span className="font-bold text-emerald-900 text-sm block">Property Summary</span>
                <div className="grid sm:grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Title</span>
                    <strong>{title}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Location</span>
                    <strong>{address}, {city}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Total Floors</span>
                    <strong>{totalFloors} Floors</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">PostGIS Coords</span>
                    <span className="font-mono text-[11px]">{coords[0].toFixed(4)}, {coords[1].toFixed(4)}</span>
                  </div>
                </div>
              </div>

              {/* Photos in Review */}
              {photos.length > 0 && (
                <div className="p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 block">
                      Uploaded Media ({photos.length} photos)
                    </span>
                    <span className="text-[11px] text-emerald-700 font-semibold">
                      Cover: {photos.find((p) => p.isCover)?.caption || 'Cover Selected'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {photos.map((p) => (
                      <div
                        key={p.id}
                        className={`relative shrink-0 w-20 h-16 rounded-xl overflow-hidden border ${
                          p.isCover ? 'ring-2 ring-emerald-500' : 'border-slate-200'
                        }`}
                      >
                        <img
                          src={p.data || p.url}
                          alt="Thumbnail"
                          className="w-full h-full object-cover"
                        />
                        {p.isCover && (
                          <div className="absolute bottom-0 inset-x-0 bg-emerald-600 text-white text-[9px] text-center font-bold py-0.5">
                            Cover
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block">Configured Units ({units.length})</span>
                <div className="space-y-1.5">
                  {units.map((u, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                    >
                      <div>
                        <strong className="text-slate-900">{u.unitIdentifier}</strong>
                        <span className="text-slate-500 text-[11px] ml-2">
                          {u.bedrooms} BHK · Floor {u.floorNumber}
                        </span>
                      </div>
                      <span className="font-bold text-emerald-700">
                        NPR {u.monthlyRent?.toLocaleString()} / mo
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              type="button"
              disabled={step === 1 && (!title.trim() || !address.trim())}
              onClick={() => setStep((s) => (s + 1) as any)}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinalSubmit}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating Property…' : 'Confirm & Publish Listing'}</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
