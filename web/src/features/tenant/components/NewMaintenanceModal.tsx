/**
 * NewMaintenanceModal Component — Manus / Aceternity Dark Modal
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
  { id: 'Emergency', label: 'Emergency (within 4 hours)', desc: 'Active water leak, exposed wire, gas smell', color: '#f43f5e' },
  { id: 'High', label: 'High (within 24 hours)', desc: 'Inverter failure, main toilet clogged, water pump issue', color: '#f59e0b' },
  { id: 'Medium', label: 'Medium (within 48 hours)', desc: 'Dripping tap, door latch loose, geyser temperature', color: '#2e8bff' },
  { id: 'Low', label: 'Low / Routine', desc: 'Cosmetic touchup, window mesh, minor adjustment', color: '#94aac5' },
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
          propertyId: lease.propertyId,
          unitId: lease.unitId,
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
          className="relative w-full max-w-lg card-premium overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, rgba(13,21,32,0.98) 0%, rgba(8,13,20,0.99) 100%)',
            border: '1px solid rgba(46, 139, 255, 0.25)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 35px rgba(46,139,255,0.1)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-5"
            style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-amber-400"
                style={{
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                }}
              >
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-display font-bold text-white">
                  New Maintenance Request
                </h2>
                <p className="text-xs" style={{ color: '#5a7299' }}>
                  {lease.unitIdentifier}, {lease.propertyTitle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl transition-colors hover:text-white"
              style={{ color: '#7187a5', background: 'rgba(255,255,255,0.03)' }}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs" style={{ color: '#c8d8f0' }}>
            {/* Category */}
            <div>
              <label className="text-xs font-semibold block mb-2 font-display" style={{ color: '#94aac5' }}>
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
                      className={`py-2 px-2.5 rounded-xl text-center transition-all font-display text-xs ${
                        isSelected ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                      style={{
                        background: isSelected ? 'rgba(46, 139, 255, 0.25)' : 'rgba(255, 255, 255, 0.02)',
                        border: isSelected ? '1px solid rgba(46, 139, 255, 0.45)' : '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Urgency */}
            <div>
              <label className="text-xs font-semibold block mb-2 font-display" style={{ color: '#94aac5' }}>
                Urgency Level
              </label>
              <div className="space-y-1.5">
                {URGENCIES.map((u) => {
                  const isChosen = urgency === u.id;
                  return (
                    <div
                      key={u.id}
                      onClick={() => setUrgency(u.id)}
                      className="p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                      style={{
                        background: isChosen ? 'rgba(46, 139, 255, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                        border: isChosen ? '1px solid rgba(46, 139, 255, 0.35)' : '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      <div>
                        <span className="font-bold block text-white font-display">{u.label}</span>
                        <span className="text-[10px]" style={{ color: '#7187a5' }}>{u.desc}</span>
                      </div>
                      <div
                        className="w-4 h-4 rounded-full border flex items-center justify-center transition-all"
                        style={{
                          borderColor: isChosen ? '#2e8bff' : 'rgba(255, 255, 255, 0.2)',
                          background: isChosen ? '#2e8bff' : 'transparent',
                        }}
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
              <label className="text-xs font-semibold block mb-1.5 font-display" style={{ color: '#94aac5' }}>
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
              <label className="text-xs font-semibold block mb-1.5 font-display" style={{ color: '#94aac5' }}>
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
              <label className="text-xs font-semibold block mb-1.5 font-display" style={{ color: '#94aac5' }}>
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
                className="btn-ghost btn-md flex-1 font-display"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary btn-md flex-1 shine-hover font-display"
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
