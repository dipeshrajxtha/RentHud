/**
 * NewMaintenanceModal Component
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wrench, AlertTriangle, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import type { LeaseAgreement, MaintenanceRequest } from '@/types/tenant';
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

const URGENCIES: { id: MaintenanceRequest['urgency']; label: string; desc: string }[] = [
  { id: 'Emergency', label: 'Emergency (within 4 hours)', desc: 'Active water leak, exposed wire, gas smell' },
  { id: 'High', label: 'High (within 24 hours)', desc: 'Inverter failure, main toilet clogged, water pump issue' },
  { id: 'Medium', label: 'Medium (within 48 hours)', desc: 'Dripping tap, door latch loose, geyser temperature' },
  { id: 'Low', label: 'Low / Routine', desc: 'Cosmetic touchup, window mesh, minor adjustment' },
];

export function NewMaintenanceModal({
  lease,
  onClose,
  onCreated,
}: NewMaintenanceModalProps) {
  if (!lease) return null;

  const [category, setCategory] = useState<MaintenanceRequest['category']>('Plumbing');
  const [urgency, setUrgency] = useState<MaintenanceRequest['urgency']>('Medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [preferredTime, setPreferredTime] = useState('Morning (9:00 AM – 12:00 PM)');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const ticket = await tenantService.createMaintenanceRequest({
        tenancyId: lease.id,
        unitIdentifier: lease.unitIdentifier,
        propertyTitle: lease.propertyTitle,
        category,
        urgency,
        title,
        description,
        preferredTimeWindow: preferredTime,
      });

      onCreated(ticket);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-display font-semibold text-slate-900">
                  New Maintenance Request
                </h2>
                <p className="text-xs text-slate-500">{lease.unitIdentifier}, {lease.propertyTitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-700">
            {/* Category */}
            <div>
              <label className="text-xs font-semibold text-slate-800 block mb-1.5">Issue Category</label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`py-2 px-2.5 rounded-xl border text-center transition-all ${
                      category === c
                        ? 'bg-brand-50 border-brand-400 text-brand-900 font-semibold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Urgency */}
            <div>
              <label className="text-xs font-semibold text-slate-800 block mb-1.5">Urgency Level</label>
              <div className="space-y-1.5">
                {URGENCIES.map((u) => {
                  const isChosen = urgency === u.id;
                  return (
                    <div
                      key={u.id}
                      onClick={() => setUrgency(u.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-colors flex items-center justify-between ${
                        isChosen
                          ? 'border-brand-400 bg-brand-50/60 text-brand-950 font-medium'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <span className="font-semibold block">{u.label}</span>
                        <span className="text-[10px] text-slate-400">{u.desc}</span>
                      </div>
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          isChosen ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300'
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
              <label className="text-xs font-semibold text-slate-800 block mb-1.5">Issue Summary</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Master bathroom tap dripping, solar inverter tripped"
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                Detailed Description & Location in Unit
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe when the issue started, whether water/electricity is affected..."
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
              />
            </div>

            {/* Preferred Time */}
            <div>
              <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                Preferred Access Time Window
              </label>
              <select
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
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
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
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
