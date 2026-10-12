/**
 * EarlyTerminationModal Component — Clean Light Mode Notice Modal
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
import { FormInput, FormSelect, FormTextarea, ShimmerButton, StatusPill } from '@/components/ui';

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
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-rose-600 bg-rose-50 border border-rose-200 shadow-sm">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-display font-bold text-slate-900 tracking-tight">
                    Early Lease Termination
                  </h2>
                  <StatusPill variant="danger" size="sm">Critical</StatusPill>
                </div>
                <p className="text-xs text-slate-500">{lease.unitIdentifier}, {lease.propertyTitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full transition-colors text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {success ? (
            <div className="p-8 text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto bg-emerald-50 border border-emerald-200"
              >
                <CheckCircle2 className="w-9 h-9 text-emerald-600" />
              </motion.div>
              <h3 className="text-xl font-display font-bold text-slate-900">Termination Recorded</h3>
              <p className="text-xs leading-relaxed max-w-sm mx-auto text-slate-600">
                Your formal early termination request has been registered in the platform audit log.
                Your landlord ({lease.landlordName}) has been formally notified for key handover and
                security deposit settlement.
              </p>
              <div className="pt-2">
                <ShimmerButton
                  variant="primary"
                  size="md"
                  onClick={onClose}
                  className="w-full"
                >
                  Return to Tenancy Dashboard
                </ShimmerButton>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-700">
              {/* Summary Card */}
              <div className="p-4 rounded-2xl space-y-2 bg-slate-50 border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Premises:</span>
                  <strong className="text-slate-900 font-semibold font-display">
                    {lease.unitIdentifier}, {lease.propertyTitle}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Monthly Rent:</span>
                  <span className="text-slate-900 font-display">
                    NPR {lease.agreedMonthlyRent.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Deposit on Hold:</span>
                  <span className="text-slate-900 font-display">
                    NPR {lease.agreedDeposit.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Reason Selector */}
              <FormSelect
                label="Primary Reason for Early Termination"
                required
                value={reasonCode}
                onChange={(e) => setReasonCode(e.target.value)}
                options={REASON_CODES.map((r) => ({ value: r.code, label: r.label }))}
              />

              {/* Target Move Out */}
              <FormInput
                label="Proposed Vacancy / Handover Date"
                type="date"
                required
                leftIcon={<Calendar className="w-4 h-4 text-blue-600" />}
                value={targetMoveOut}
                onChange={(e) => setTargetMoveOut(e.target.value)}
              />

              {/* Narrative */}
              <FormTextarea
                label="Narrative & Handover Statement"
                rows={3}
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                placeholder="Explain any details regarding premises handover and outstanding utilities..."
                maxChars={400}
              />

              {/* Warning Notice */}
              <div className="p-3.5 rounded-xl space-y-1 text-[11px] bg-amber-50 border border-amber-200 text-amber-800">
                <div className="flex items-center gap-1.5 font-bold font-display">
                  <ShieldAlert className="w-4 h-4 text-amber-600" /> Notice Period & Deposit Handover
                </div>
                <p>
                  Per the Tenancy Agreement, standard notice is 35 days. Outstanding electricity, water,
                  and waste bills will be reconciled against the security deposit during the move-out inspection.
                </p>
              </div>

              {/* Confirmation checkbox */}
              <label className="flex items-start gap-3 cursor-pointer pt-1 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 rounded-md border-2 border-slate-300 peer-checked:border-rose-500 peer-checked:bg-rose-500 transition-all flex items-center justify-center">
                    {acknowledged && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-xs leading-normal text-slate-600">
                  I understand that submitting this request updates my tenancy status to{' '}
                  <strong className="text-rose-600">terminated early</strong> and begins the legal handover procedure.
                </span>
              </label>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <ShimmerButton
                  type="submit"
                  variant="danger"
                  size="md"
                  disabled={!acknowledged}
                  isLoading={isSubmitting}
                  className="flex-1"
                >
                  Confirm Early Termination
                </ShimmerButton>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
