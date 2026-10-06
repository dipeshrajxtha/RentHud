import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Check, Camera } from 'lucide-react';
import type { LandlordProperty, UpdatePropertyDto } from '@/types/landlord';

interface EditPropertyModalProps {
  property: LandlordProperty;
  onClose: () => void;
  onSubmit: (propertyId: string, dto: UpdatePropertyDto) => Promise<void>;
  onOpenManagePhotos?: (property: LandlordProperty) => void;
}

export function EditPropertyModal({
  property,
  onClose,
  onSubmit,
  onOpenManagePhotos,
}: EditPropertyModalProps) {
  const [title, setTitle] = useState(property.title);
  const [address, setAddress] = useState(property.address);
  const [city, setCity] = useState(property.city);
  const [postalCode, setPostalCode] = useState(property.postalCode ?? '');
  const [totalFloors, setTotalFloors] = useState<number>(property.totalFloors);
  const [description, setDescription] = useState(property.description ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onSubmit(property.id, {
        title: title.trim(),
        address: address.trim(),
        city: city.trim(),
        postalCode: postalCode.trim() || undefined,
        totalFloors: Number(totalFloors),
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update property');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Edit Property Details</h2>
            <p className="text-xs text-slate-500">Update building specifications and address</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Building Name *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">City *</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="Kathmandu">Kathmandu</option>
                <option value="Lalitpur">Lalitpur</option>
                <option value="Bhaktapur">Bhaktapur</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Total Floors</label>
              <input
                type="number"
                min="1"
                value={totalFloors}
                onChange={(e) => setTotalFloors(parseInt(e.target.value) || 1)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Address *</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Postal Code</label>
            <input
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="e.g. 44600"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {onOpenManagePhotos && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-700 block">Property Photos</span>
                <span className="text-[11px] text-slate-400">
                  {property.photos?.length || 0} photo(s) currently attached
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenManagePhotos(property);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 rounded-xl font-semibold flex items-center gap-1.5 text-xs transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Manage Photos</span>
              </button>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving…' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
