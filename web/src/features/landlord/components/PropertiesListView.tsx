import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building,
  Plus,
  MapPin,
  Layers,
  ChevronDown,
  ChevronUp,
  Bed,
  Bath,
  Search,
  Trash2,
  Edit2,
  Camera,
} from 'lucide-react';
import type { LandlordProperty, LandlordUnit } from '@/types/landlord';

type OccupancyFilter = 'ALL' | 'OCCUPIED' | 'PARTIAL' | 'VACANT';

interface PropertiesListViewProps {
  properties: LandlordProperty[];
  onOpenAddProperty: () => void;
  onOpenEditProperty: (property: LandlordProperty) => void;
  onOpenManagePhotos: (property: LandlordProperty) => void;
  onOpenAddUnit: (property: LandlordProperty) => void;
  onOpenEditUnit: (property: LandlordProperty, unit: LandlordUnit) => void;
  onDeleteProperty: (propertyId: string) => Promise<void>;
  onDeleteUnit: (propertyId: string, unitId: string) => Promise<void>;
}

export function PropertiesListView({
  properties,
  onOpenAddProperty,
  onOpenEditProperty,
  onOpenManagePhotos,
  onOpenAddUnit,
  onOpenEditUnit,
  onDeleteProperty,
  onDeleteUnit,
}: PropertiesListViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<OccupancyFilter>('ALL');
  const [expandedPropertyId, setExpandedPropertyId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      const totalU = p.unitsCount || p.units?.length || 0;
      const availU =
        p.availableUnitsCount ??
        p.units?.filter((u) => u.availabilityStatus === 'AVAILABLE').length ??
        0;
      const occU = Math.max(0, totalU - availU);

      if (filter === 'OCCUPIED') return totalU > 0 && availU === 0;
      if (filter === 'VACANT') return totalU > 0 && occU === 0;
      if (filter === 'PARTIAL') return totalU > 0 && occU > 0 && availU > 0;
      return true;
    });
  }, [properties, searchQuery, filter]);

  const toggleExpand = (id: string) => {
    setExpandedPropertyId((prev) => (prev === id ? null : id));
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(Are you sure you want to deactivate and remove property "?)) {
 return;
 }
 setDeletingId(id);
 try {
 await onDeleteProperty(id);
 } finally {
 setDeletingId(null);
 }
 };

 return (
 <div className=space-y-6 max-w-7xl mx-auto>
 {/* Header & Controls */}
 <div className=flex flex-col sm:flex-row sm:items-center justify-between gap-4>
 <div>
 <h1 className=text-xl sm:text-2xl font-display font-extrabold text-slate-900 tracking-tight>
 My Property Assets
 </h1>
 <p className=text-xs text-slate-500 mt-1>
 Manage your physical residential buildings, floor layouts, and individual rentable units.
 </p>
 </div>

 <button
 type=button
 onClick={onOpenAddProperty}
 className=btn-primary btn-md flex items-center justify-center gap-2 shrink-0 font-display
 >
 <Plus className=w-4 h-4 />
 <span>Add New Property</span>
 </button>
 </div>

 {/* Search and Filters Bar */}
 <div className=bg-white rounded-3xl border border-slate-200/90 p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs>
 <div className=relative w-full md:w-80>
 <Search className=w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 />
 <input
 type=text
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder=Search by building name, address, or city…
 className=form-input text-xs pl-9
 />
 </div>

 <div className=flex items-center gap-1.5 w-full md:w-auto overflow-x-auto scrollbar-none pb-1 md:pb-0 font-display>
 {[
 { id: 'ALL', label: 'All Properties' },
 { id: 'OCCUPIED', label: '100% Occupied' },
 { id: 'PARTIAL', label: 'Partially Vacant' },
 { id: 'VACANT', label: 'Fully Vacant' },
 ].map((tab) => {
 const isSelected = filter === tab.id;
 return (
 <button
 key={tab.id}
 type=button
 onClick={() => setFilter(tab.id as OccupancyFilter)}
 className={px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border }
 >
 {tab.label}
 </button>
 );
 })}
 </div>
 </div>

 {/* Property Cards List */}
 {filteredProperties.length === 0 ? (
 <div className=bg-white rounded-3xl border border-slate-200/90 p-12 text-center shadow-xs>
 <Building className=w-12 h-12 text-slate-300 mx-auto mb-3 />
 <h3 className=text-base font-bold text-slate-900 font-display>No matching properties found</h3>
 <p className=text-xs max-w-sm mx-auto mt-1 text-slate-500>
 {searchQuery
 ? 'Try clearing your search query or switching filters to see your properties.'
 : 'You have not listed any properties yet. Add your first building to start managing rent.'}
 </p>
 <button
 type=button
 onClick={onOpenAddProperty}
 className=mt-4 btn-primary btn-sm inline-flex items-center gap-2 font-display
 >
 <Plus className=w-4 h-4 />
 <span>List Property</span>
 </button>
 </div>
 ) : (
 <div className=space-y-4>
 {filteredProperties.map((prop) => {
 const isExpanded = expandedPropertyId === prop.id;
 const units = prop.units ?? [];
 const totalU = prop.unitsCount || units.length;
 const availU =
 prop.availableUnitsCount ??
 units.filter((u) => u.availabilityStatus === 'AVAILABLE').length;
 const occU = Math.max(0, totalU - availU);
 const rate = totalU > 0 ? Math.round((occU / totalU) * 100) : 0;

 const minRent = units.length > 0 ? Math.min(...units.map((u) => u.monthlyRent)) : null;
 const maxRent = units.length > 0 ? Math.max(...units.map((u) => u.monthlyRent)) : null;

 return (
 <div
 key={prop.id}
 className=bg-white rounded-3xl border border-slate-200/90 overflow-hidden transition-all duration-200 shadow-xs hover:border-slate-300
 >
 {/* Main Property Card Summary Bar */}
 <div className=p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5>
 <div className=flex items-start sm:items-center gap-4 min-w-0>
 {prop.coverPhotoUrl ? (
 <div
 onClick={() => onOpenManagePhotos(prop)}
 className=relative group/cover cursor-pointer shrink-0
 title=Click to manage property photos
 >
 <img
 src={prop.coverPhotoUrl}
 alt={prop.title}
 className=w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-200
 onError={(e) => {
 (e.target as HTMLImageElement).src =
 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80';
 }}
 />
 <div className=absolute inset-0 bg-slate-900/40 rounded-2xl opacity-0 group-hover/cover:opacity-100 flex items-center justify-center text-white transition-opacity>
 <Camera className=w-5 h-5 text-white />
 </div>
 </div>
 ) : (
 <div
 onClick={() => onOpenManagePhotos(prop)}
 className=w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center shrink-0 cursor-pointer transition-colors bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100
 title=Click to upload photos for this property
 >
 <Camera className=w-5 h-5 mb-0.5 />
 <span className=text-[9px] font-bold font-display>Add Photo</span>
 </div>
 )}

 <div className=min-w-0>
 <div className=flex items-center gap-2 flex-wrap mb-1>
 <h2 className=text-base font-bold text-slate-900 font-display truncate>{prop.title}</h2>
 <span
 className={ ext-[10px] font-bold px-2.5 py-0.5 rounded-full font-display }
 >
 {rate}% Occupied ({occU}/{totalU} Units)
 </span>
 </div>

 <p className=text-xs flex items-center gap-1.5 truncate text-slate-500>
 <MapPin className=w-3.5 h-3.5 text-blue-600 shrink-0 />
 <span>{prop.address}, {prop.city}</span>
 </p>

 <div className=flex items-center gap-3 text-xs mt-2 text-slate-600>
 <span className=flex items-center gap-1>
 <Layers className=w-3.5 h-3.5 text-slate-400 />
 {prop.totalFloors} Floors
 </span>
 {minRent !== null && (
 <span className=font-bold text-slate-900 font-display>
 NPR {minRent.toLocaleString()}{minRent !== maxRent ? – : ''} /mo
 </span>
 )}
 </div>
 </div>
 </div>

 {/* Actions & Expansion Toggle */}
 <div className=flex items-center gap-2 self-end md:self-center shrink-0>
 <button
 type=button
 onClick={() => onOpenManagePhotos(prop)}
 className=btn-secondary btn-sm flex items-center gap-1.5 font-display
 title=Manage property photos
 >
 <Camera className=w-3.5 h-3.5 text-slate-600 />
 <span>Photos ({prop.photos?.length || 0})</span>
 </button>

 <button
 type=button
 onClick={() => onOpenAddUnit(prop)}
 className=btn-secondary btn-sm flex items-center gap-1.5 font-display
 >
 <Plus className=w-3.5 h-3.5 text-slate-600 />
 <span>Add Unit</span>
 </button>

 <button
 type=button
 onClick={() => onOpenEditProperty(prop)}
 className=p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors
 title=Edit property details
 >
 <Edit2 className=w-4 h-4 />
 </button>

 <button
 type=button
 onClick={() => handleDelete(prop.id, prop.title)}
 disabled={deletingId === prop.id}
 className=p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50
 title=Deactivate property
 >
 <Trash2 className=w-4 h-4 />
 </button>

 <button
 type=button
 onClick={() => toggleExpand(prop.id)}
 className=btn-ghost btn-sm flex items-center gap-1.5 font-display text-slate-700 hover:bg-slate-100
 >
 <span>Units ({units.length})</span>
 {isExpanded ? <ChevronUp className=w-3.5 h-3.5 /> : <ChevronDown className=w-3.5 h-3.5 />}
 </button>
 </div>
 </div>

 {/* Expanded Units Accordion Drawer */}
 <AnimatePresence>
 {isExpanded && (
 <motion.div
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: 'auto' }}
 exit={{ opacity: 0, height: 0 }}
 className=p-5 sm:p-6 space-y-3 bg-slate-50/70 border-t border-slate-200/80
 >
 <div className=flex items-center justify-between pb-2>
 <span className=text-xs font-bold uppercase tracking-wider font-display text-slate-800>
 Rentable Units in this Property
 </span>
 <button
 type=button
 onClick={() => onOpenAddUnit(prop)}
 className=text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 font-display
 >
 <Plus className=w-3.5 h-3.5 />
 <span>Add another unit</span>
 </button>
 </div>

 {units.length === 0 ? (
 <p className=text-xs py-3 text-center text-slate-500>
 No units configured yet. Click Add Unit to set up apartments/rooms.
 </p>
 ) : (
 <div className=grid sm:grid-cols-2 lg:grid-cols-3 gap-3>
 {units.map((unit) => {
 const isAvailable = unit.availabilityStatus === 'AVAILABLE';
 const isOnRent = unit.availabilityStatus === 'ON_RENT';
 const isPending = unit.availabilityStatus === 'PENDING_SIGNATURE' || unit.availabilityStatus === 'RESERVED';

 return (
 <div
 key={unit.id}
 className=bg-white p-4 rounded-2xl space-y-2.5 flex flex-col justify-between border border-slate-200 shadow-xs
 >
 <div>
 <div className=flex items-start justify-between gap-2>
 <div>
 <h4 className=text-xs font-bold text-slate-900 font-display>{unit.unitIdentifier}</h4>
 <p className=text-[11px] text-slate-500>Floor {unit.floorNumber}</p>
 </div>
 <span
 className={ ext-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-display }
 >
 {unit.availabilityStatus}
 </span>
 </div>

 <div className=flex items-center gap-3 text-[11px] mt-2 text-slate-500>
 <span className=flex items-center gap-1>
 <Bed className=w-3.5 h-3.5 text-blue-600 />
 {unit.bedrooms} BHK
 </span>
 <span className=flex items-center gap-1>
 <Bath className=w-3.5 h-3.5 text-blue-600 />
 {unit.bathrooms} Bath
 </span>
 {unit.areaSqft && (
 <span>{unit.areaSqft} sqft</span>
 )}
 </div>

 <div className=mt-2 text-xs>
 <span className=font-bold text-slate-900 font-display>
 NPR {unit.monthlyRent?.toLocaleString()}
 </span>
 <span className=text-[11px] text-slate-500> / month</span>
 {unit.securityDeposit > 0 && (
 <span className=text-[10px] block text-slate-400>
 Deposit: NPR {unit.securityDeposit?.toLocaleString()}
 </span>
 )}
 </div>
 </div>

 <div className=pt-2 flex items-center justify-end gap-1.5 border-t border-slate-100>
 <button
 type=button
 onClick={() => onOpenEditUnit(prop, unit)}
 className=p-1.5 text-slate-500 hover:text-slate-800 rounded-lg transition-colors text-xs font-medium flex items-center gap-1 hover:bg-slate-100
 >
 <Edit2 className=w-3.5 h-3.5 />
 <span>Edit</span>
 </button>
 <button
 type=button
 onClick={() => {
 if (window.confirm(Delete unit ?)) {
 onDeleteUnit(prop.id, unit.id);
 }
 }}
 className=p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors
 >
 <Trash2 className=w-3.5 h-3.5 />
 </button>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
 })}
 </div>
 )}
 </div>
 );
}
