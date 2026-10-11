import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Check, Building, Hash, Bed, Bath, Maximize2, DollarSign, Shield } from 'lucide-react';
import { FormInput, FormSelect, ShimmerButton } from '@/components/ui';
import type {
  LandlordProperty,
  LandlordUnit,
  CreateUnitDto,
  UpdateUnitDto,
  UnitAvailabilityStatus,
} from '@/types/landlord';

interface AddOrEditUnitModalProps {
  property: LandlordProperty;
  unit?: LandlordUnit | null;
  onClose: () => void;
  onSubmit: (dto: CreateUnitDto | UpdateUnitDto) => Promise<void>;
}

export function AddOrEditUnitModal({
  property,
  unit,
  onClose,
  onSubmit,
}: AddOrEditUnitModalProps) {
  const isEditing = Boolean(unit);

  const [unitIdentifier, setUnitIdentifier] = useState(unit?.unitIdentifier ?? 'Unit 101');
  const [floorNumber, setFloorNumber] = useState<number>(unit?.floorNumber ?? 1);
  const [bedrooms, setBedrooms] = useState<number>(unit?.bedrooms ?? 2);
  const [bathrooms, setBathrooms] = useState<number>(unit?.bathrooms ?? 1);
  const [areaSqft, setAreaSqft] = useState<number | ''>(unit?.areaSqft ?? 650);
  const [monthlyRent, setMonthlyRent] = useState<number>(unit?.monthlyRent ?? 22000);
  const [securityDeposit, setSecurityDeposit] = useState<number>(unit?.securityDeposit ?? 44000);
  const [availabilityStatus, setAvailabilityStatus] = useState<UnitAvailabilityStatus>(
    unit?.availabilityStatus ?? 'AVAILABLE'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onSubmit({
        unitIdentifier: unitIdentifier.trim(),
        floorNumber: Number(floorNumber) || 1,
        bedrooms: Number(bedrooms) || 1,
        bathrooms: Number(bathrooms) || 1,
        areaSqft: areaSqft ? Number(areaSqft) : undefined,
        monthlyRent: Number(monthlyRent) || 1000,
        securityDeposit: Number(securityDeposit) || 0,
        availabilityStatus,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save unit');
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
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {isEditing ? `Edit Unit: ${unit?.unitIdentifier}` : 'Add Rentable Unit'}
            </h2>
            <p className="text-xs text-slate-500">Property: {property.title}</p>
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

          <div className="grid grid-cols-2 gap-3">
            <FormInput
              label="Unit Number / Code"
              required
              value={unitIdentifier}
              onChange={(e) => setUnitIdentifier(e.target.value)}
              placeholder="e.g. Unit 101"
              leftIcon={<Building className="w-4 h-4 text-slate-400" />}
            />
            <FormInput
              label="Floor Level"
              type="number"
              min="0"
              max="50"
              value={floorNumber}
              onChange={(e) => setFloorNumber(parseInt(e.target.value) || 1)}
              leftIcon={<Hash className="w-4 h-4 text-slate-400" />}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <FormInput
              label="Bedrooms (BHK)"
              type="number"
              min="1"
              max="10"
              value={bedrooms}
              onChange={(e) => setBedrooms(parseInt(e.target.value) || 1)}
              leftIcon={<Bed className="w-4 h-4 text-slate-400" />}
            />
            <FormInput
              label="Bathrooms"
              type="number"
              min="1"
              max="10"
              value={bathrooms}
              onChange={(e) => setBathrooms(parseInt(e.target.value) || 1)}
              leftIcon={<Bath className="w-4 h-4 text-slate-400" />}
            />
            <FormInput
              label="Area (sqft)"
              type="number"
              min="100"
              value={areaSqft}
              onChange={(e) => setAreaSqft(parseInt(e.target.value) || '')}
              leftIcon={<Maximize2 className="w-4 h-4 text-slate-400" />}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormInput
              label="Monthly Rent (NPR)"
              type="number"
              required
              min="1000"
              step="500"
              value={monthlyRent}
              onChange={(e) => setMonthlyRent(parseInt(e.target.value) || 0)}
              leftIcon={<DollarSign className="w-4 h-4 text-slate-400" />}
            />
            <FormInput
              label="Security Deposit (NPR)"
              type="number"
              min="0"
              step="500"
              value={securityDeposit}
              onChange={(e) => setSecurityDeposit(parseInt(e.target.value) || 0)}
              leftIcon={<Shield className="w-4 h-4 text-slate-400" />}
            />
          </div>

          {/* Availability Status Lifecycle */}
          <FormSelect
            label="Availability Status"
            value={availabilityStatus}
            onChange={(e) => setAvailabilityStatus(e.target.value as UnitAvailabilityStatus)}
            options={[
              { value: 'AVAILABLE', label: 'AVAILABLE (Listed for rent)' },
              { value: 'RESERVED', label: 'RESERVED (Application approved)' },
              { value: 'PENDING_SIGNATURE', label: 'PENDING_SIGNATURE (Awaiting lease signature)' },
              { value: 'ON_RENT', label: 'ON_RENT (Active tenancy)' },
              { value: 'UNAVAILABLE', label: 'UNAVAILABLE (Maintenance/Private)' },
            ]}
          />

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <ShimmerButton
              type="submit"
              size="md"
              variant="primary"
              isLoading={isSubmitting}
              leftIcon={<Check className="w-4 h-4" />}
            >
              {isEditing ? 'Save Unit' : 'Create Unit'}
            </ShimmerButton>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
