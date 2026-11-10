import { useState } from 'react';
import { MapPin, Bed, ArrowUpRight, Sparkles, Home } from 'lucide-react';
import type { PropertyRecommendation } from '../chatbot.types';

interface ChatPropertyCardProps {
  property: PropertyRecommendation;
  onSelectProperty: (propertyId: string) => void;
}

export function ChatPropertyCard({ property, onSelectProperty }: ChatPropertyCardProps) {
  const [imageError, setImageError] = useState(false);
  const fallbackImage =
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80';

  const bedrooms = property.units?.[0]?.bedrooms ?? 1;
  const rentPrice = property.minMonthlyRent || property.units?.[0]?.monthlyRent || 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col w-[260px] shrink-0 text-left">
      {/* Cover Image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        <img
          src={imageError ? fallbackImage : property.coverPhotoUrl || fallbackImage}
          alt={property.title}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-2 left-2 flex items-center gap-1">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/95 text-blue-700 shadow-xs backdrop-blur-xs">
            <Sparkles className="w-2.5 h-2.5 text-blue-600" />
            <span>Available</span>
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 line-clamp-1 mb-1">
            {property.title}
          </h4>
          <div className="flex items-center gap-1 text-slate-500 text-xs mb-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{property.address || property.city}</span>
          </div>

          {/* Badges / Specs */}
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
              <Bed className="w-3 h-3 text-slate-500" />
              <span>{bedrooms} BHK</span>
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
              <Home className="w-3 h-3 text-slate-500" />
              <span>{property.availableUnitsCount} Unit{property.availableUnitsCount > 1 ? 's' : ''}</span>
            </span>
          </div>
        </div>

        {/* Footer: Price & Action */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between mt-1">
          <div>
            <span className="text-xs text-slate-400 block leading-none">Monthly Rent</span>
            <span className="text-sm font-bold text-slate-900">
              NPR {rentPrice.toLocaleString()}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onSelectProperty(property.id)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <span>View</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
