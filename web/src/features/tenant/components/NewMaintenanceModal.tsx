/**
 * NewMaintenanceModal Component — Modernized with Watermelon UI & Aceternity Primitives
 *
 * Maintenance Ticket Dispatch with:
 * - Category selection grid (Plumbing, Electrical, HVAC, Structural)
 * - Urgency selection with SLA definitions (Emergency, High, Medium, Low)
 * - FormInput & FormSelect components
 * - Tactile ShimmerButton submit action
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wrench, Clock } from 'lucide-react';
import type { LeaseAgreement, MaintenanceRequest } from '@/types/tenant';
import { useAuth } from '@/features/auth/AuthContext';
import { tenantService } from '@/features/tenant/tenant.service';
import { FormInput, FormSelect, FormTextarea, ShimmerButton, StatusPill } from '@/components/ui';

interface NewMaintenanceModalProps {
  lease: LeaseAgreement | null;
  onClose: () => void;
  onCreated: (ticket: MaintenanceRequest) => void;
}

const CATEGORIES: MaintenanceRequest['category'][] = [
  'Plumbing',
  'Electrical',
  'HVAC',
  'Appliances',
  'Carpentry & Locks',
  'Structural',
];

const URGENCIES: { id: MaintenanceRequest['urgency']; label: string; desc: string; variant: 'danger' | 'warning' | 'info' | 'neutral' }[] = [
  { id: 'Emergency', label: 'Emergency (within 4h)', desc: 'Active water leak, exposed wire, gas smell', variant: 'danger' },
  { id: 'High', label: 'High (within 24h)', desc: 'Inverter failure, main toilet clogged, water pump', variant: 'warning' },
  { id: 'Medium', label: 'Medium (within 48h)', desc: 'Dripping tap, door latch loose, geyser heat', variant: 'info' },
  { id: 'Low', label: 'Low / Routine', desc: 'Cosmetic touchup, window mesh, minor adjustment', variant: 'neutral' },
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!lease) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const ticket = await tenantService.createMaintenanceRequest(
        {
          tenancyId: lease.id,
          unitIdentifier: lease.unitIdentifier,
          propertyTitle: lease.propertyTitle,
          category,
          urgency,
          title,
          description,
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
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 14 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 bg-slate-50/70 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-sm">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-display font-bold text-slate-900 tracking-tight">
                  New Maintenance Ticket
                </h2>
                <p className="text-xs text-slate-500">
                  {lease.unitIdentifier}, {lease.propertyTitle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-700">
            {/* Category Segmented Buttons */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 tracking-tight">
                Issue Category <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {CATEGORIES.map((c) => {
                  const isSelected = category === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={`py-2 px-2 rounded-xl text-center transition-all text-xs font-semibold border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Urgency SLA Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 tracking-tight">
                Urgency & Response SLA <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {URGENCIES.map((u) => {
                  const isChosen = urgency === u.id;
                  return (
                    <div
                      key={u.id}
                      onClick={() => setUrgency(u.id)}
                      className={`p-3 rounded-2xl cursor-pointer transition-all border flex flex-col justify-between ${
                        isChosen
                          ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/10 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <StatusPill variant={u.variant} size="sm">
                          {u.label}
                        </StatusPill>
                        <div
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            isChosen ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                          }`}
                        >
                          {isChosen && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 leading-tight">{u.desc}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <FormInput
              label="Issue Summary"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Master bathroom tap dripping, solar inverter tripped"
            />

            {/* Description */}
            <FormTextarea
              label="Detailed Description & Location in Unit"
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe when the issue started, whether water/power is affected..."
            />

            {/* Preferred Time Window */}
            <FormSelect
              label="Preferred Access Time Window"
              leftIcon={<Clock className="w-4 h-4 text-slate-400" />}
              options={TIME_OPTIONS}
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
            />

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
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
                Submit Ticket
              </ShimmerButton>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
