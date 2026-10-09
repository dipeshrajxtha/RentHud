/**
 * NewMaintenanceModal Component — Clean Light Mode
 *
 * Maintenance Ticket Dispatch with:
 * - Category selection grid (Plumbing, Electrical, HVAC, Structural)
 * - Urgency selection with SLA definitions (Emergency, High, Medium, Low)
 * - Access time preferences
 * - Direct landlord notification
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wrench } from 'lucide-react';
import type { LeaseAgreement, MaintenanceRequest } from '@/types/tenant';
import { useAuth } from '@/features/auth/AuthContext';
import { tenantService } from '@/features/tenant/tenant.service';

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

const URGENCIES: { id: MaintenanceRequest['urgency']; label: string; desc: string; color: string }[] = [
  { id: 'Emergency', label: 'Emergency (within 4 hours)', desc: 'Active water leak, exposed wire, gas smell', color: '#e11d48' },
  { id: 'High', label: 'High (within 24 hours)', desc: 'Inverter failure, main toilet clogged, water pump issue', color: '#d97706' },
  { id: 'Medium', label: 'Medium (within 48 hours)', desc: 'Dripping tap, door latch loose, geyser temperature', color: '#2563eb' },
  { id: 'Low', label: 'Low / Routine', desc: 'Cosmetic touchup, window mesh, minor adjustment', color: '#64748b' },
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
      <div className="fixed inset-0 z-50 overflow-y-auto modal-overlay flex items-center justify-center p-3 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 bg-slate-50 border-b border-slate-200/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-display font-bold text-slate-900">
                  New Maintenance Request
                </h2>
                <p className="text-xs text-slate-500">
                  {lease.unitIdentifier}, {lease.propertyTitle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-700">
            {/* Category */}
            <div>
              <label className="text-xs font-bold block mb-2 font-display text-slate-700">
                Issue Category
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((c) => {
                  const isSelected = category === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={`py-2 px-2.5 rounded-xl text-center transition-all font-display text-xs font-semibold border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700 border-slate-200/80'
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Urgency */}
            <div>
              <label className="text-xs font-bold block mb-2 font-display text-slate-700">
                Urgency Level
              </label>
              <div className="space-y-1.5">
                {URGENCIES.map((u) => {
                  const isChosen = urgency === u.id;
                  return (
                    <div
                      key={u.id}
                      onClick={() => setUrgency(u.id)}
                      className={`p-3 rounded-2xl cursor-pointer transition-all flex items-center justify-between border-2 ${
                        isChosen
                          ? 'border-blue-600 bg-blue-50/40'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <span className="font-bold block text-slate-900 font-display">{u.label}</span>
                        <span className="text-[10px] text-slate-500">{u.desc}</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                          isChosen ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                        }`}
                      >
                        {isChosen && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-xs font-bold block mb-1.5 font-display text-slate-700">
                Issue Summary
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Master bathroom tap dripping, solar inverter tripped"
                className="form-input text-xs"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold block mb-1.5 font-display text-slate-700">
                Detailed Description & Location in Unit
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe when the issue started, whether water/electricity is affected..."
                className="form-input text-xs resize-none"
              />
            </div>

            {/* Preferred Time */}
            <div>
              <label className="text-xs font-bold block mb-1.5 font-display text-slate-700">
                Preferred Access Time Window
              </label>
              <select
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="form-select text-xs"
              >
                <option value="Morning (9:00 AM – 12:00 PM)">Morning (9:00 AM – 12:00 PM)</option>
                <option value="Afternoon (1:00 PM – 4:00 PM)">Afternoon (1:00 PM – 4:00 PM)</option>
                <option value="Evening (5:00 PM – 7:00 PM)">Evening (5:00 PM – 7:00 PM)</option>
                <option value="Weekend (Saturday)">Weekend (Saturday)</option>
                <option value="Flexible / Anytime with advance call">Flexible / Anytime with advance call</option>
              </select>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary btn-md flex-1 font-display"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary btn-md flex-1 font-display"
              >
                {isSubmitting ? 'Submitting…' : 'Submit Ticket'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
