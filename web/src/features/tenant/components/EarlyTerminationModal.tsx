/**
 * EarlyTerminationModal Component — Manus / Aceternity Dark Notice Modal
 *
 * Early Lease Termination workflow:
 * - Legal 35-day notice period calculation
 * - Reason categorization & narrative handover statement
 * - Deposit reconciliation warning
 * - Confirmation & status transition
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, Calendar, CheckCircle2, ShieldAlert } from 'lucide-react';
import type { LeaseAgreement } from '@/types/tenant';
import { useAuth } from '@/features/auth/AuthContext';
import { tenantService } from '@/features/tenant/tenant.service';

interface EarlyTerminationModalProps {
  lease: LeaseAgreement | null;
  onClose: () => void;
  onTerminated: (updated: LeaseAgreement) => void;
}

const REASON_CODES = [
  { code: 'JOB_RELOCATION', label: 'Job Relocation / City Transfer' },
  { code: 'FINANCIAL_HARDSHIP', label: 'Financial Hardship / Budget Constraints' },
  { code: 'HEALTH_EMERGENCY', label: 'Medical or Family Emergency' },
  { code: 'LANDLORD_DEFAULT', label: 'Unresolved Maintenance / Quiet Enjoyment Breach' },
  { code: 'MUTUAL_AGREEMENT', label: 'Mutual Agreement with Landlord' },
  { code: 'OTHER', label: 'Other Personal Reasons' },
];

export function EarlyTerminationModal({
  lease,
  onClose,
  onTerminated,
}: EarlyTerminationModalProps) {
  const { accessToken } = useAuth();
  const [reasonCode, setReasonCode] = useState('JOB_RELOCATION');
  const [narrative, setNarrative] = useState(
    'Due to an unforeseen personal relocation, I am providing formal early termination notice in accordance with the tenancy agreement covenants.'
  );
  const [targetMoveOut, setTargetMoveOut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 35);
    return d.toISOString().split('T')[0];
  });
  const [acknowledged, setAcknowledged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!lease) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !acknowledged) return;
    setIsSubmitting(true);

    try {
      const updated = await tenantService.terminateLease(lease.id, reasonCode, narrative, accessToken);
      setSuccess(true);
      onTerminated(updated);
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
            border: '1px solid rgba(244, 63, 94, 0.3)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 35px rgba(244,63,94,0.1)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-5"
            style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-rose-400"
                style={{
                  background: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                }}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-display font-bold text-white">
                  Request Early Lease Termination
                </h2>
                <p className="text-xs font-mono" style={{ color: '#5a7299' }}>Lease #{lease.id}</p>
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

          {success ? (
            <div className="p-8 text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                <CheckCircle2 className="w-9 h-9 text-emerald-400" />
              </motion.div>
              <h3 className="text-xl font-display font-bold text-white">Termination Recorded</h3>
              <p className="text-xs leading-relaxed max-w-sm mx-auto" style={{ color: '#94aac5' }}>
                Your formal early termination request has been registered in the platform audit log.
                Your landlord ({lease.landlordName}) has been formally notified for key handover and
                security deposit settlement.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="btn-primary btn-md w-full mt-4 font-display shine-hover"
              >
                Return to Tenancy Dashboard
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs" style={{ color: '#c8d8f0' }}>
              {/* Summary Card */}
              <div
                className="p-4 rounded-2xl space-y-2"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div className="flex justify-between">
                  <span style={{ color: '#5a7299' }}>Premises:</span>
                  <strong className="text-white font-semibold font-display">
                    {lease.unitIdentifier}, {lease.propertyTitle}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#5a7299' }}>Monthly Rent:</span>
                  <span className="text-white font-display">
                    NPR {lease.agreedMonthlyRent.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#5a7299' }}>Deposit on Hold:</span>
                  <span className="text-white font-display">
                    NPR {lease.agreedDeposit.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Reason Selector */}
              <div>
                <label className="text-xs font-semibold block mb-1.5 font-display" style={{ color: '#94aac5' }}>
                  Primary Reason for Early Termination
                </label>
                <select
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  className="form-select text-xs"
                >
                  {REASON_CODES.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Move Out */}
              <div>
                <label className="text-xs font-semibold block mb-1.5 flex items-center gap-1.5 font-display" style={{ color: '#94aac5' }}>
                  <Calendar className="w-3.5 h-3.5 text-brand-400" /> Proposed Vacancy / Handover Date
                </label>
                <input
                  type="date"
                  required
                  value={targetMoveOut}
                  onChange={(e) => setTargetMoveOut(e.target.value)}
                  className="form-input text-xs"
                />
              </div>

              {/* Narrative */}
              <div>
                <label className="text-xs font-semibold block mb-1.5 font-display" style={{ color: '#94aac5' }}>
                  Narrative & Handover Statement
                </label>
                <textarea
                  rows={3}
                  value={narrative}
                  onChange={(e) => setNarrative(e.target.value)}
                  placeholder="Explain any details regarding premises handover and outstanding utilities..."
                  className="form-input text-xs resize-none"
                />
              </div>

              {/* Warning Notice */}
              <div
                className="p-3.5 rounded-xl space-y-1 text-[11px]"
                style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  color: '#fde68a',
                }}
              >
                <div className="flex items-center gap-1.5 font-bold font-display">
                  <ShieldAlert className="w-4 h-4 text-amber-400" /> Notice Period & Deposit Handover
                </div>
                <p>
                  Per the Tenancy Agreement, standard notice is 35 days. Outstanding electricity, water,
                  and waste bills will be reconciled against the security deposit during the move-out inspection.
                </p>
              </div>

              {/* Confirmation checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-900 text-rose-600 focus:ring-rose-500"
                />
                <span className="leading-normal" style={{ color: '#94aac5' }}>
                  I understand that submitting this request updates my tenancy status to{' '}
                  <strong className="text-rose-400">terminated early</strong> and begins the legal handover procedure.
                </span>
              </label>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-ghost btn-md flex-1 font-display"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!acknowledged || isSubmitting}
                  className="btn-danger btn-md flex-1 font-display disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording…' : 'Confirm Early Termination'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
