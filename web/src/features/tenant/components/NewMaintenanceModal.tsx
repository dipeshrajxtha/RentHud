/**
 * NewMaintenanceModal Component — Modern Facility Work Order Dispatch
 *
 * Resident Maintenance Portal with:
 * - Category selection grid with contextual icons (Plumbing, Electrical, HVAC, Appliances, Locks, Structural)
 * - Urgency SLA definition cards (Emergency 4h, High 24h, Medium 48h, Low Routine)
 * - Local photo attachment upload with instant image preview & removal
 * - Access time-window selection
 * - Safe payload dispatch linking tenancyId, propertyId, and unitId
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Wrench,
  Clock,
  Droplets,
  Zap,
  Wind,
  Lock,
  Building,
  Upload,
  Image as ImageIcon,
  Trash2,
  AlertTriangle,
  Sparkles,
  Check,
} from 'lucide-react';
import type { LeaseAgreement, MaintenanceRequest } from '@/types/tenant';
import { useAuth } from '@/features/auth/AuthContext';
import { tenantService } from '@/features/tenant/tenant.service';
import { FormInput, FormSelect, FormTextarea, ShimmerButton, StatusPill } from '@/components/ui';

interface NewMaintenanceModalProps {
  lease: LeaseAgreement | null;
  onClose: () => void;
  onCreated: (ticket: MaintenanceRequest) => void;
}

const CATEGORY_ITEMS: {
  id: MaintenanceRequest['category'];
  label: string;
  icon: React.ElementType;
}[] = [
  { id: 'Plumbing', label: 'Plumbing & Water', icon: Droplets },
  { id: 'Electrical', label: 'Electrical & Power', icon: Zap },
  { id: 'HVAC', label: 'HVAC & Heating', icon: Wind },
  { id: 'Appliances', label: 'Appliances & Fixtures', icon: Wrench },
  { id: 'Carpentry & Locks', label: 'Doors & Locks', icon: Lock },
  { id: 'Structural', label: 'Walls & Structural', icon: Building },
];

const URGENCIES: {
  id: MaintenanceRequest['urgency'];
  label: string;
  desc: string;
  sla: string;
  variant: 'danger' | 'warning' | 'info' | 'neutral';
}[] = [
  {
    id: 'Emergency',
    label: 'Emergency',
    sla: 'Within 4 Hours',
    desc: 'Active pipe burst, exposed live wires, gas smell',
    variant: 'danger',
  },
  {
    id: 'High',
    label: 'High Urgency',
    sla: 'Within 24 Hours',
    desc: 'Main toilet blocked, solar inverter failed, water pump down',
    variant: 'warning',
  },
  {
    id: 'Medium',
    label: 'Medium Priority',
    sla: 'Within 48 Hours',
    desc: 'Dripping tap, loose door latch, geyser temperature issue',
    variant: 'info',
  },
  {
    id: 'Low',
    label: 'Routine / Low',
    sla: 'Within 3–5 Days',
    desc: 'Cosmetic touchups, window wire mesh, non-urgent hardware',
    variant: 'neutral',
  },
];

const TIME_OPTIONS = [
  { value: 'Morning (9:00 AM – 12:00 PM)', label: 'Morning (9:00 AM – 12:00 PM)' },
  { value: 'Afternoon (1:00 PM – 4:00 PM)', label: 'Afternoon (1:00 PM – 4:00 PM)' },
  { value: 'Evening (5:00 PM – 7:00 PM)', label: 'Evening (5:00 PM – 7:00 PM)' },
  { value: 'Weekend (Saturday)', label: 'Weekend (Saturday)' },
  { value: 'Flexible / Anytime with advance call', label: 'Flexible / Anytime with advance call' },
];

export function NewMaintenanceModal({
  lease,
  onClose,
  onCreated,
}: NewMaintenanceModalProps) {
  const { accessToken } = useAuth();
  const [category, setCategory] = useState<MaintenanceRequest['category']>('Plumbing');
  const [urgency, setUrgency] = useState<MaintenanceRequest['urgency']>('Medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [preferredTime, setPreferredTime] = useState('Morning (9:00 AM – 12:00 PM)');
  const [attachedPhotos, setAttachedPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!lease) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAttachedPhotos((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (index: number) => {
    setAttachedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Include photos in the description if attached
      let finalDescription = description.trim();
      if (attachedPhotos.length > 0) {
        finalDescription += `\n[${attachedPhotos.length} photo(s) attached by tenant for reference]`;
      }

      const ticket = await tenantService.createMaintenanceRequest(
        {
          tenancyId: lease.id,
          propertyId: lease.propertyId,
          unitId: lease.unitId,
          unitIdentifier: lease.unitIdentifier,
          propertyTitle: lease.propertyTitle,
          category,
          urgency,
          title: title.trim(),
          description: finalDescription,
          preferredTimeWindow: preferredTime,
        },
        accessToken
      );

      onCreated(ticket);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-xl bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-blue-50/70 to-slate-50 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  New Maintenance Request
                </h2>
                <p className="text-xs text-slate-500">
                  {lease.unitIdentifier} · {lease.propertyTitle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Scrollable Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto text-xs text-slate-700 flex-1">
            {/* Category Selector with Icons */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Issue Category <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORY_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isSelected = category === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCategory(item.id)}
                      className={`p-3 rounded-2xl text-left transition-all border flex items-center gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 border-blue-600 text-blue-700 ring-2 ring-blue-500/20 shadow-xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Urgency SLA Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Urgency & Response SLA <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {URGENCIES.map((u) => {
                  const isChosen = urgency === u.id;
                  return (
                    <div
                      key={u.id}
                      onClick={() => setUrgency(u.id)}
                      className={`p-3.5 rounded-2xl cursor-pointer transition-all border flex flex-col justify-between ${
                        isChosen
                          ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <StatusPill variant={u.variant} size="sm">
                            {u.label}
                          </StatusPill>
                          <span className="text-[10px] font-bold text-slate-500">· {u.sla}</span>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isChosen ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                          }`}
                        >
                          {isChosen && <Check className="w-2.5 h-2.5" />}
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-500 leading-tight">{u.desc}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary Title */}
            <FormInput
              label="Issue Summary"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Master bathroom tap leaking continuously, power trip in kitchen"
            />

            {/* Description */}
            <FormTextarea
              label="Detailed Description & Location in Unit"
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain where the issue is located, when it started, and whether water or power is affected..."
            />

            {/* Photo Attachment Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Attach Photos / Video Stills (Optional)
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold cursor-pointer transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>Upload Photos from Device</span>
                </button>
                <span className="text-[11px] text-slate-400">
                  Attach close-up images of damage or leak
                </span>
              </div>

              {attachedPhotos.length > 0 && (
                <div className="flex items-center gap-2.5 overflow-x-auto py-2">
                  {attachedPhotos.map((dataUrl, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0 shadow-2xs group">
                      <img src={dataUrl} alt="attachment" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 text-rose-300" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Access Time Window */}
            <FormSelect
              label="Preferred Inspection / Access Window"
              leftIcon={<Clock className="w-4 h-4 text-slate-400" />}
              options={TIME_OPTIONS}
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
            />

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
              <ShimmerButton
                type="button"
                variant="outline"
                size="md"
                onClick={onClose}
              >
                Cancel
              </ShimmerButton>
              <ShimmerButton
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
              >
                Submit Maintenance Request
              </ShimmerButton>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
