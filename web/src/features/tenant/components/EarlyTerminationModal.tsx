/**
 * EarlyTerminationModal Component — Clean Light Mode
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
      <div className=fixed inset-0 z-50 overflow-y-auto modal-overlay flex items-center justify-center p-3 sm:p-6>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className=relative w-full max-w-lg bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden
        >
          {/* Header */}
          <div className=flex items-center justify-between px-6 py-5 bg-slate-50 border-b border-slate-200/80>
            <div className=flex items-center gap-3>
              <div className=w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600>
                <AlertTriangle className=w-5 h-5 />
              </div>
              <div>
                <h2 className=text-base font-display font-bold text-slate-900>
                  Request Early Lease Termination
                </h2>
                <p className=text-xs font-mono text-slate-500>Lease #{lease.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className=p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors
              aria-label=Close
            >
              <X className=w-5 h-5 />
            </button>
          </div>

          {success ? (
            <div className=p-8 text-center space-y-4>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                className=w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-sm
              >
                <CheckCircle2 className=w-9 h-9 />
              </motion.div>
              <h3 className=text-xl font-display font-bold text-slate-900>Termination Recorded</h3>
              <p className=text-xs leading-relaxed max-w-sm mx-auto text-slate-600>
                Your formal early termination request has been registered in the platform audit log.
                Your landlord ({lease.landlordName}) has been formally notified for key handover and
                security deposit settlement.
              </p>
              <button
                type=button
                onClick={onClose}
                className=btn-primary btn-md w-full mt-4 font-display
              >
                Return to Tenancy Dashboard
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className=p-6 space-y-4 text-xs text-slate-700>
              {/* Summary Card */}
              <div className=p-4 rounded-2xl space-y-2 bg-slate-50 border border-slate-200/80>
                <div className=flex justify-between>
                  <span className=text-slate-500>Premises:</span>
                  <strong className=text-slate-900 font-bold font-display>
                    {lease.unitIdentifier}, {lease.propertyTitle}
                  </strong>
                </div>
                <div className=flex justify-between>
                  <span className=text-slate-500>Monthly Rent:</span>
                  <span className=text-slate-900 font-bold font-display>
                    NPR {lease.agreedMonthlyRent.toLocaleString()}
                  </span>
                </div>
                <div className=flex justify-between>
                  <span className=text-slate-500>Deposit on Hold:</span>
                  <span className=text-slate-900 font-bold font-display>
                    NPR {lease.agreedDeposit.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Reason Selector */}
              <div>
                <label className=text-xs font-bold block mb-1.5 font-display text-slate-700>
                  Primary Reason for Early Termination
                </label>
                <select
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  className=form-select text-xs
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
                <label className=text-xs font-bold block mb-1.5 flex items-center gap-1.5 font-display text-slate-700>
                  <Calendar className=w-3.5 h-3.5 text-blue-600 /> Proposed Vacancy / Handover Date
                </label>
                <input
                  type=date
                  required
                  value={targetMoveOut}
                  onChange={(e) => setTargetMoveOut(e.target.value)}
                  className=form-input text-xs
                />
              </div>

              {/* Narrative */}
              <div>
                <label className=text-xs font-bold block mb-1.5 font-display text-slate-700>
                  Narrative & Handover Statement
                </label>
                <textarea
                  rows={3}
                  value={narrative}
                  onChange={(e) => setNarrative(e.target.value)}
                  placeholder=Explain any details regarding premises handover and outstanding utilities...
                  className=form-input text-xs resize-none
                />
              </div>

              {/* Warning Notice */}
              <div className=p-4 rounded-2xl space-y-1 text-[11px] bg-amber-50 border border-amber-200 text-amber-900>
                <div className=flex items-center gap-1.5 font-bold font-display text-amber-950>
                  <ShieldAlert className=w-4 h-4 text-amber-600 /> Notice Period & Deposit Handover
                </div>
                <p className=leading-relaxed>
                  Per the Tenancy Agreement, standard notice is 35 days. Outstanding electricity, water,
                  and waste bills will be reconciled against the security deposit during the move-out inspection.
                </p>
              </div>

              {/* Confirmation checkbox */}
              <label className=flex items-start gap-2.5 cursor-pointer pt-1>
                <input
                  type=checkbox
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className=mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500
                />
                <span className=leading-normal text-slate-600 text-xs>
                  I understand that submitting this request updates my tenancy status to{' '}
                  <strong className=text-rose-700 font-bold>terminated early</strong> and begins the legal handover procedure.
                </span>
              </label>

              {/* Actions */}
              <div className=flex items-center gap-3 pt-2>
                <button
                  type=button
                  onClick={onClose}
                  className=btn-secondary btn-md flex-1 font-display
                >
                  Cancel
                </button>
                <button
                  type=submit
                  disabled={!acknowledged || isSubmitting}
                  className=btn-danger btn-md flex-1 font-display disabled:opacity-50
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
