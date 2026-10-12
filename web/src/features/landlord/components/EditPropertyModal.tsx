import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Check, Camera, Building2, MapPin } from 'lucide-react';
import type { LandlordProperty, UpdatePropertyDto } from '@/types/landlord';
import { FormInput, FormSelect, FormTextarea, ShimmerButton, StatusPill } from '@/components/ui';

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
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Edit Property</h2>
                <StatusPill variant="info" size="sm">Editing</StatusPill>
              </div>
              <p className="text-xs text-slate-500">Update building specifications and address</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
              {errorMsg}
            </div>
          )}

          <FormInput
            label="Building Name"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            leftIcon={<Building2 className="w-4 h-4 text-slate-400" />}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormSelect
              label="City"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              options={[
                { value: 'Kathmandu', label: 'Kathmandu' },
                { value: 'Lalitpur', label: 'Lalitpur' },
                { value: 'Bhaktapur', label: 'Bhaktapur' },
              ]}
            />

            <FormInput
              label="Total Floors"
              type="number"
              min={1}
              value={totalFloors}
              onChange={(e) => setTotalFloors(parseInt(e.target.value) || 1)}
            />
          </div>

          <FormInput
            label="Address"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            leftIcon={<MapPin className="w-4 h-4 text-slate-400" />}
          />

          <FormInput
            label="Postal Code"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder="e.g. 44600"
          />

          <FormTextarea
            label="Description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxChars={500}
          />

          {onOpenManagePhotos && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-700 block text-xs">Property Photos</span>
                <span className="text-[11px] text-slate-400">
                  {property.photos?.length || 0} photo(s) currently attached
                </span>
              </div>
              <ShimmerButton
                size="sm"
                variant="secondary"
                onClick={() => {
                  onClose();
                  onOpenManagePhotos(property);
                }}
                leftIcon={<Camera className="w-3.5 h-3.5" />}
              >
                Manage Photos
              </ShimmerButton>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors"
            >
              Cancel
            </button>
            <ShimmerButton
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              leftIcon={<Check className="w-4 h-4" />}
            >
              Save Changes
            </ShimmerButton>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
