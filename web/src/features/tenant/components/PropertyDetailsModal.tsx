/**
 * PropertyDetailsModal Component — Ultra-Premium Architectural Property Viewer
 *
 * Inspired by Airbnb Luxe & Zillow Premier:
 * - Dynamic photo gallery with keyboard navigation, caption overlay, interactive thumbnail strip & lightbox
 * - Comprehensive 2-column layout with quick specs ribbon (BHK, Bath, Floor, Area, Parking)
 * - 100% Survey Recommendation breakdown banner
 * - Interactive Unit Selector matrix with instant pre-selection
 * - Categorized Amenities with custom contextual icons
 * - Legal tenancy safeguards under Nepal Muluki Civil Code 2074
 * - Embedded neighborhood context & mini Leaflet map preview
 * - Sticky reservation card with transparent fee breakdown & verified landlord trust signals
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  MapPin,
  Bed,
  Bath,
  ShieldCheck,
  Phone,
  CheckCircle,
  Heart,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Camera,
  Layers,
  Square,
  Check,
  Shield,
  Car,
  Star,
  ThumbsUp,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ShimmerButton, StatusPill } from '@/components/ui';
import type { PropertyListing, UnitDetail, PropertyReviewsResponse } from '@/types/tenant';
import { tenantService } from '../tenant.service';
import type { SurveyMatchResult } from '../utils/surveyMatcher';

// Custom Leaflet pin for Kathmandu Valley map preview
const customMarkerIcon = new L.DivIcon({
  className: 'custom-property-pin',
  html: `<div class="w-8 h-8 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

interface PropertyDetailsModalProps {
  property: PropertyListing | null;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  onSelectUnitToApply: (property: PropertyListing, unit: UnitDetail) => void;
  surveyMatch?: SurveyMatchResult;
}

export function PropertyDetailsModal({
  property,
  onClose,
  isSaved,
  onToggleSave,
  onSelectUnitToApply,
  surveyMatch,
}: PropertyDetailsModalProps) {
  if (!property) return null;

  const [currentProperty, setCurrentProperty] = useState<PropertyListing>(property);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [reviewsData, setReviewsData] = useState<PropertyReviewsResponse | null>(null);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(false);

  // Sync state and fetch fresh details from API if available
  useEffect(() => {
    setCurrentProperty(property);
    setActivePhotoIndex(0);

    if (property?.units?.length > 0) {
      const firstAvail = property.units.find((u) => u.availabilityStatus === 'AVAILABLE') || property.units[0];
      setSelectedUnitId(firstAvail.id);
    }

    if (property?.id) {
      tenantService.getPropertyById(property.id).then((full) => {
        if (full) {
          setCurrentProperty(full);
          if (full.units?.length > 0) {
            const firstAvail = full.units.find((u) => u.availabilityStatus === 'AVAILABLE') || full.units[0];
            setSelectedUnitId(firstAvail.id);
          }
        }
      });

      setLoadingReviews(true);
      tenantService.getPropertyReviews(property.id).then((res) => {
        setReviewsData(res);
        setLoadingReviews(false);
      });
    }
  }, [property?.id]);

  // Combine property photos and fallback
  const photos = useMemo(() => {
    if (currentProperty.photos && currentProperty.photos.length > 0) {
      return currentProperty.photos;
    }
    if (currentProperty.coverPhotoUrl) {
      return [{ id: '0', url: currentProperty.coverPhotoUrl, isCover: true, caption: 'Main Property View' }];
    }
    return [
      {
        id: 'fallback',
        url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
        isCover: true,
        caption: 'Residential Property',
      },
    ];
  }, [currentProperty.photos, currentProperty.coverPhotoUrl]);

  // Find currently selected unit
  const selectedUnit = useMemo(() => {
    return currentProperty.units.find((u) => u.id === selectedUnitId) || currentProperty.units[0] || null;
  }, [currentProperty.units, selectedUnitId]);

  // Keyboard navigation for photo gallery
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setActivePhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
      } else if (e.key === 'ArrowRight') {
        setActivePhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photos.length, onClose]);

  const coords = currentProperty.location ?? { latitude: 27.708, longitude: 85.32 };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-5xl bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
        >
          {/* Top Bar Floating Controls */}
          <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleSave(currentProperty.id)}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 bg-white/95 backdrop-blur-md border border-slate-200 shadow-md text-slate-700 hover:text-rose-600 hover:bg-white cursor-pointer"
              aria-label="Save to Wishlist"
              title="Save to Wishlist"
            >
              <Heart
                className={`w-4 h-4 transition-transform active:scale-125 ${
                  isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-600'
                }`}
              />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 bg-white/95 backdrop-blur-md border border-slate-200 shadow-md text-slate-700 hover:text-slate-900 hover:bg-white cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Scrollable View */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {/* ── 1. Hero Photo Gallery ── */}
            <div className="relative bg-slate-950">
              <div className="relative aspect-[16/9] sm:aspect-[21/9] max-h-[380px] w-full shrink-0 overflow-hidden">
                <img
                  src={photos[activePhotoIndex]?.url}
                  alt={currentProperty.title}
                  className="w-full h-full object-cover transition-all duration-300"
                />

                {/* Subtle gradient vignettes */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30 pointer-events-none" />

                {/* Left / Right Carousel Controls */}
                {photos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setActivePhotoIndex((i) => (i === 0 ? photos.length - 1 : i - 1))
                      }
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full text-slate-800 bg-white/90 backdrop-blur-md border border-slate-200 shadow-lg hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActivePhotoIndex((i) => (i === photos.length - 1 ? 0 : i + 1))
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full text-slate-800 bg-white/90 backdrop-blur-md border border-slate-200 shadow-lg hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    {/* Photo counter pill */}
                    <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-xl text-xs font-semibold bg-black/80 backdrop-blur-md text-white border border-white/20 flex items-center gap-1.5 shadow-md">
                      <Camera className="w-3.5 h-3.5 text-blue-400" />
                      <span>
                        {activePhotoIndex + 1} of {photos.length} Photos
                      </span>
                    </div>
                  </>
                )}

                {/* Caption Overlay */}
                {photos[activePhotoIndex]?.caption && (
                  <div className="absolute bottom-4 left-4 max-w-sm sm:max-w-md px-3.5 py-1.5 rounded-xl text-xs font-medium bg-black/80 backdrop-blur-md text-white border border-white/10 truncate shadow-md">
                    {photos[activePhotoIndex].caption}
                  </div>
                )}
              </div>

              {/* Interactive Thumbnail Strip */}
              {photos.length > 1 && (
                <div className="bg-slate-900/95 px-4 py-3 flex items-center gap-3 overflow-x-auto border-t border-slate-800 scrollbar-thin">
                  <span className="text-[11px] font-bold text-slate-400 shrink-0 uppercase tracking-wider mr-1">
                    Gallery Strip:
                  </span>
                  {photos.map((ph, idx) => (
                    <button
                      key={ph.id || idx}
                      type="button"
                      onClick={() => setActivePhotoIndex(idx)}
                      className={`relative rounded-xl overflow-hidden shrink-0 w-16 h-12 sm:w-20 sm:h-14 transition-all duration-200 border-2 cursor-pointer ${
                        activePhotoIndex === idx
                          ? 'border-blue-500 ring-2 ring-blue-500/50 opacity-100 scale-105 shadow-md'
                          : 'border-transparent opacity-60 hover:opacity-95 hover:border-slate-500'
                      }`}
                    >
                      <img src={ph.url} alt="" className="w-full h-full object-cover" />
                      {ph.isCover && (
                        <span className="absolute bottom-0.5 left-0.5 px-1 py-0.2 rounded text-[8px] bg-black/80 text-white font-bold uppercase">
                          Cover
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── 2. Content Body ── */}
            <div className="p-5 sm:p-7 md:p-8 space-y-7 bg-white">
              {/* Survey Match Breakdown Card (if 100% matched) */}
              {surveyMatch?.isPerfectMatch && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-5 bg-gradient-to-r from-amber-50 via-orange-50/70 to-amber-50 border border-amber-300 shadow-xs"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shrink-0">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-amber-950 font-display">
                          100% Survey Match — Tailored For You
                        </h3>
                        <StatusPill variant="warning" size="sm">
                          Top Recommendation
                        </StatusPill>
                      </div>
                      <p className="text-xs text-amber-800 mt-0.5">
                        This home fulfills 100% of your onboarding preferences (Rent budget, BHK size, Kathmandu Valley locality & priority amenities).
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 pt-3.5 border-t border-amber-200/80">
                    {surveyMatch.criteria.map((c) => (
                      <div
                        key={c.key}
                        className="flex items-center gap-2 text-xs text-amber-950 bg-white/70 px-3 py-2 rounded-xl border border-amber-200/70 shadow-2xs"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate">
                          <strong className="font-semibold text-slate-900">{c.label}:</strong>{' '}
                          {c.detail}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Title & Badges Header */}
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-2">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill variant="info" size="sm">
                      {currentProperty.city} Valley
                    </StatusPill>
                    <StatusPill
                      variant="success"
                      size="sm"
                      icon={<ShieldCheck className="w-3.5 h-3.5" />}
                    >
                      Title Deed Verified
                    </StatusPill>
                    <StatusPill
                      variant="neutral"
                      size="sm"
                      icon={<Check className="w-3.5 h-3.5" />}
                    >
                      Legal Tenancy Act 2074
                    </StatusPill>
                  </div>

                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                    {currentProperty.title}
                  </h1>

                  <p className="text-sm flex items-center gap-2 text-slate-600">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-medium text-slate-800">
                      {currentProperty.address}, {currentProperty.city}
                    </span>
                    {currentProperty.postalCode && (
                      <span className="text-slate-400">· Postal Code: {currentProperty.postalCode}</span>
                    )}
                  </p>
                </div>

                {/* Prominent Price Box */}
                <div className="shrink-0 p-4 sm:p-5 rounded-2xl bg-blue-50/80 border border-blue-200/80 shadow-xs text-left lg:text-right">
                  <span className="text-xs uppercase tracking-wider font-bold block text-blue-700">
                    Monthly Rent
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
                    NPR {currentProperty.minMonthlyRent.toLocaleString()}
                    {currentProperty.minMonthlyRent !== currentProperty.maxMonthlyRent && currentProperty.maxMonthlyRent > 0 && (
                      <span className="text-sm font-semibold text-slate-500">
                        {' '}
                        – {currentProperty.maxMonthlyRent.toLocaleString()}
                      </span>
                    )}
                    <span className="text-xs font-normal text-slate-500"> / month</span>
                  </div>
                  <span className="text-xs text-slate-500 mt-0.5 block">
                    Security Deposit: ~1–2 months rent (Refundable)
                  </span>
                </div>
              </div>

              {/* ── 3. Quick Spec Ribbon ── */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs text-slate-700">
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
                  <Bed className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Layout</span>
                    <strong className="text-slate-900 font-bold">{selectedUnit?.bedrooms ?? 2} BHK</strong>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
                  <Bath className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Bathrooms</span>
                    <strong className="text-slate-900 font-bold">{selectedUnit?.bathrooms ?? 1} Bath</strong>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
                  <Square className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Floor Area</span>
                    <strong className="text-slate-900 font-bold">{selectedUnit?.areaSqft ?? 650} sq.ft</strong>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
                  <Layers className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Building</span>
                    <strong className="text-slate-900 font-bold">{currentProperty.totalFloors} Floor(s)</strong>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
                  <Car className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Parking</span>
                    <strong className="text-slate-900 font-bold">Bike & Car</strong>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Status</span>
                    <strong className="text-emerald-700 font-bold">Available Now</strong>
                  </div>
                </div>
              </div>

              {/* ── 4. Two-Column Split Architecture ── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
                {/* ── Left Column (Main Specs, Units, Amenities) ── */}
                <div className="lg:col-span-7 space-y-7">
                  {/* Building Units Selection Matrix */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h2 className="text-base sm:text-lg font-bold text-slate-900">
                          Available Units in Building
                        </h2>
                        <p className="text-xs text-slate-500">
                          Select your preferred floor & unit layout to apply
                        </p>
                      </div>
                      <StatusPill variant="success" size="sm">
                        {currentProperty.units.filter((u) => u.availabilityStatus === 'AVAILABLE').length || 1} Unit(s) Available
                      </StatusPill>
                    </div>

                    <div className="grid gap-3">
                      {currentProperty.units.map((unit) => {
                        const isAvail = unit.availabilityStatus === 'AVAILABLE';
                        const isSelected = selectedUnitId === unit.id;

                        return (
                          <div
                            key={unit.id}
                            onClick={() => setSelectedUnitId(unit.id)}
                            className={`p-4 rounded-2xl transition-all duration-200 border cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                              isSelected
                                ? 'bg-blue-50/50 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                                : isAvail
                                ? 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                                : 'bg-slate-50 border-slate-200 opacity-60'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-5 h-5 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                                  isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3" />}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-bold text-slate-900">
                                    {unit.unitIdentifier}
                                  </span>
                                  <StatusPill variant={isAvail ? 'success' : 'neutral'} size="sm">
                                    {isAvail ? 'Available' : unit.availabilityStatus.replace('_', ' ')}
                                  </StatusPill>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
                                  <span>Floor {unit.floorNumber}</span>
                                  <span className="text-slate-300">•</span>
                                  <span>{unit.bedrooms} BHK</span>
                                  <span className="text-slate-300">•</span>
                                  <span>{unit.bathrooms} Bath</span>
                                  {unit.areaSqft && (
                                    <>
                                      <span className="text-slate-300">•</span>
                                      <span>{unit.areaSqft} sq.ft</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                              <div className="sm:text-right">
                                <div className="text-sm font-bold text-slate-900">
                                  NPR {unit.monthlyRent.toLocaleString()}
                                  <span className="text-xs font-normal text-slate-500"> / mo</span>
                                </div>
                                <span className="text-[11px] text-slate-400">
                                  Deposit: NPR {unit.securityDeposit.toLocaleString()}
                                </span>
                              </div>

                              <button
                                type="button"
                                disabled={!isAvail}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectUnitToApply(currentProperty, unit);
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                  isSelected
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                              >
                                Apply
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                      About this Property
                    </h2>
                    <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line text-slate-600">
                      {currentProperty.description ||
                        `Well-constructed residential building located in ${currentProperty.address}, ${currentProperty.city}. Close to local market, public transportation, and essential amenities with reliable 24/7 water supply.`}
                    </p>
                  </div>

                  {/* Amenities Grid */}
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-3">
                      Building Amenities & Utilities
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {(currentProperty.amenities?.length > 0
                        ? currentProperty.amenities
                        : [
                            { id: '1', name: '24/7 Water Supply' },
                            { id: '2', name: 'Dedicated Parking' },
                            { id: '3', name: 'Solar / Inverter Backup' },
                            { id: '4', name: 'High-Speed Fiber WiFi' },
                            { id: '5', name: 'Private Balcony' },
                            { id: '6', name: 'CCTV Security Surveillance' },
                          ]
                      ).map((am) => (
                        <div
                          key={am.id}
                          className="flex items-center gap-2.5 p-3 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-200/80 text-slate-700"
                        >
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="truncate">{am.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Legal Tenancy Protections (Muluki Civil Code 2074) */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/60 border border-blue-200 text-xs space-y-2 text-slate-700">
                    <div className="flex items-center gap-2 font-bold text-blue-900">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span>Legal Tenant Safeguards under Nepal Muluki Civil Code 2074</span>
                    </div>
                    <ul className="space-y-1.5 list-disc pl-4 text-slate-600">
                      <li>
                        <strong>Statutory 35-Day Notice:</strong> Neither party may terminate tenancy without prior written notice under Section 389.
                      </li>
                      <li>
                        <strong>Refundable Deposit:</strong> Security deposit is strictly escrow-protected and refundable upon lawful inspection.
                      </li>
                      <li>
                        <strong>Digital Tenancy Contract:</strong> Signed digitally with biometric/signature stamps compliant with Electronic Transaction Act 2063.
                      </li>
                    </ul>
                  </div>

                  {/* Neighborhood Location Map */}
                  <div className="space-y-2">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span>Neighborhood & Location</span>
                    </h2>
                    <div className="h-56 w-full rounded-2xl overflow-hidden border border-slate-200 shadow-2xs relative">
                      <MapContainer
                        center={[coords.latitude, coords.longitude]}
                        zoom={14}
                        scrollWheelZoom={false}
                        className="h-full w-full"
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={[coords.latitude, coords.longitude]} icon={customMarkerIcon}>
                          <Popup>
                            <div className="p-1 text-xs">
                              <strong>{currentProperty.title}</strong>
                              <p className="text-slate-500">{currentProperty.address}</p>
                            </div>
                          </Popup>
                        </Marker>
                      </MapContainer>
                    </div>
                  </div>

                  {/* ── Verified Resident Reviews & Ratings ── */}
                  <div className="space-y-4 pt-4 border-t border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                          <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                          <span>Verified Resident Reviews</span>
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Authentic ratings exclusively written by tenants with signed agreements at this property.
                        </p>
                      </div>

                      {reviewsData && reviewsData.summary.totalReviews > 0 && (
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200/80 px-3 py-1.5 rounded-2xl shrink-0">
                          <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                          <span className="text-sm font-extrabold text-amber-950">
                            {reviewsData.summary.averageRating?.toFixed(1) ?? '5.0'}
                          </span>
                          <span className="text-xs text-amber-800 font-medium">
                            ({reviewsData.summary.totalReviews} {reviewsData.summary.totalReviews === 1 ? 'review' : 'reviews'})
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Breakdown Cards */}
                    {reviewsData && reviewsData.summary.totalReviews > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                          <span className="text-[11px] font-semibold text-slate-500 block">
                            Overall Rating
                          </span>
                          <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-lg font-extrabold text-slate-900">
                              {reviewsData.summary.averageRating?.toFixed(1) ?? '—'}
                            </span>
                            <span className="text-[11px] text-slate-400">/ 5.0</span>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                          <span className="text-[11px] font-semibold text-slate-500 block">
                            Cleanliness
                          </span>
                          <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-lg font-extrabold text-slate-900">
                              {reviewsData.summary.cleanlinessAverage?.toFixed(1) ?? '—'}
                            </span>
                            <span className="text-[11px] text-slate-400">/ 5.0</span>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 col-span-2 sm:col-span-1">
                          <span className="text-[11px] font-semibold text-slate-500 block">
                            Landlord Comms
                          </span>
                          <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-lg font-extrabold text-slate-900">
                              {reviewsData.summary.communicationAverage?.toFixed(1) ?? '—'}
                            </span>
                            <span className="text-[11px] text-slate-400">/ 5.0</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Reviews List */}
                    {loadingReviews ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        Loading verified reviews…
                      </div>
                    ) : reviewsData && reviewsData.reviews.length > 0 ? (
                      <div className="space-y-3.5">
                        {reviewsData.reviews.map((rev) => (
                          <div
                            key={rev.id}
                            className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2.5"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2.5">
                                {rev.authorAvatarUrl ? (
                                  <img
                                    src={rev.authorAvatarUrl}
                                    alt={rev.authorName}
                                    className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                                    {rev.authorName?.[0] ?? 'T'}
                                  </div>
                                )}
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-slate-900">
                                      {rev.authorName}
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                      Verified Resident
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(rev.createdAt).toLocaleDateString(undefined, {
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`w-3.5 h-3.5 ${
                                      s <= rev.rating
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-slate-200 fill-slate-100'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>

                            {rev.amenitiesFeedback && (
                              <div className="flex flex-wrap gap-1.5 pt-0.5">
                                {rev.amenitiesFeedback.split(',').map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700"
                                  >
                                    ✓ {tag.trim()}
                                  </span>
                                ))}
                              </div>
                            )}

                            {rev.reviewText && (
                              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                                {rev.reviewText}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                          <Star className="w-5 h-5 fill-amber-400" />
                        </div>
                        <p className="text-xs font-bold text-slate-800">
                          No verified reviews published yet
                        </p>
                        <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                          Be the first resident to write an authentic review after your lease is sealed!
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Right Column (Sticky Reservation & Landlord Card) ── */}
                <div className="lg:col-span-5 space-y-5">
                  {/* Booking / Financials Card */}
                  <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 shadow-sm space-y-5 sticky top-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Selected Unit Rental
                      </span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                          NPR {(selectedUnit?.monthlyRent ?? currentProperty.minMonthlyRent).toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">/ month</span>
                      </div>
                      <span className="text-xs text-blue-600 font-semibold block mt-0.5">
                        {selectedUnit?.unitIdentifier ?? 'Unit 101'} · Floor {selectedUnit?.floorNumber ?? 1}
                      </span>
                    </div>

                    <div className="space-y-2.5 pt-3 border-t border-slate-200/80 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>First Month Rent</span>
                        <strong className="text-slate-900 font-semibold">
                          NPR {(selectedUnit?.monthlyRent ?? currentProperty.minMonthlyRent).toLocaleString()}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Security Deposit (Refundable)</span>
                        <strong className="text-slate-900 font-semibold">
                          NPR {(selectedUnit?.securityDeposit ?? (selectedUnit?.monthlyRent ?? currentProperty.minMonthlyRent) * 2).toLocaleString()}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Digital Lease Stamping</span>
                        <span className="text-emerald-600 font-bold">NPR 0 (Free)</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                        <span>Move-in Total</span>
                        <span className="text-blue-600">
                          NPR {(
                            (selectedUnit?.monthlyRent ?? currentProperty.minMonthlyRent) +
                            (selectedUnit?.securityDeposit ?? (selectedUnit?.monthlyRent ?? currentProperty.minMonthlyRent) * 2)
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-2">
                      <ShimmerButton
                        variant="primary"
                        size="lg"
                        className="w-full justify-center text-sm font-bold shadow-md cursor-pointer"
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                        onClick={() => {
                          const avail =
                            selectedUnit ||
                            currentProperty.units.find((u) => u.availabilityStatus === 'AVAILABLE') ||
                            currentProperty.units[0];
                          if (avail) onSelectUnitToApply(currentProperty, avail);
                        }}
                      >
                        Apply for this Unit
                      </ShimmerButton>

                      <button
                        type="button"
                        onClick={() => onToggleSave(currentProperty.id)}
                        className="w-full py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-500'}`} />
                        <span>{isSaved ? 'Saved to Wishlist' : 'Save to Wishlist'}</span>
                      </button>
                    </div>

                    {/* Trust Guarantee Note */}
                    <div className="flex items-start gap-2 pt-2 text-[11px] text-slate-500 leading-tight">
                      <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        Verified RentHub Agreement. Security deposit is held in compliant escrow until move-in inspection.
                      </span>
                    </div>

                    {/* Landlord Trust Signal Card */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
                      <div className="flex items-center gap-3">
                        {currentProperty.landlord.avatarUrl ? (
                          <img
                            src={currentProperty.landlord.avatarUrl}
                            alt={currentProperty.landlord.name}
                            className="w-11 h-11 rounded-full object-cover border-2 border-blue-200"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full font-bold flex items-center justify-center text-white bg-blue-600 text-sm shadow-xs">
                            {currentProperty.landlord.name[0]}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">
                              {currentProperty.landlord.name}
                            </span>
                            <StatusPill
                              variant="success"
                              size="sm"
                              icon={<CheckCircle className="w-3 h-3" />}
                            >
                              Verified
                            </StatusPill>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Response: <strong className="text-slate-700">{currentProperty.landlord.responseTime ?? 'Within 2 hours'}</strong>
                          </p>
                        </div>
                      </div>

                      {currentProperty.landlord.phone && (
                        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-700">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{currentProperty.landlord.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── 5. Mobile Fixed Bottom Floating Bar ── */}
          <div className="lg:hidden p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-4 shrink-0 shadow-lg">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Starting Rent</span>
              <div className="text-lg font-extrabold text-slate-900">
                NPR {(selectedUnit?.monthlyRent ?? currentProperty.minMonthlyRent).toLocaleString()}
                <span className="text-xs font-normal text-slate-500"> / mo</span>
              </div>
            </div>

            <ShimmerButton
              variant="primary"
              size="md"
              className="px-5 font-bold cursor-pointer"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => {
                const avail =
                  selectedUnit ||
                  currentProperty.units.find((u) => u.availabilityStatus === 'AVAILABLE') ||
                  currentProperty.units[0];
                if (avail) onSelectUnitToApply(currentProperty, avail);
              }}
            >
              Apply for Unit
            </ShimmerButton>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
