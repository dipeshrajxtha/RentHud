import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Plus,
  Trash2,
  Check,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
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

export function AddPropertyModal({ onClose, onSubmit }: AddPropertyModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
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
            <p className="text-xs text-slate-500">Step {step} of 4 — {
              step === 1 ? 'Building Details' :
              step === 2 ? 'PostGIS Location Pin' :
              step === 3 ? 'Rentable Units Configuration' : 'Review & Confirm'
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
        <div className="px-6 pt-3 pb-1 grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((s) => (
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
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                <span className="font-bold block">Pin Your Exact Building Location</span>
                Click anywhere on the map to place the green pin. This stores accurate PostGIS coordinates (<code className="text-[10px] font-mono">GEOGRAPHY(Point, 4326)</code>) for geospatial tenant discovery.
              </div>

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

          {/* STEP 4: REVIEW & CONFIRM */}
          {step === 4 && (
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

          {step < 4 ? (
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
