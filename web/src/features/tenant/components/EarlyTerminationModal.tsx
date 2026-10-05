/**
 * EarlyTerminationModal Component
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
  if (!lease) return null;

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
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-rose-50/50">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-display font-semibold text-slate-900">
                  Request Early Lease Termination
                </h2>
                <p className="text-xs text-slate-500 font-mono">Lease #{lease.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {success ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-display font-semibold text-slate-900">Termination Recorded</h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                Your formal early termination request has been registered in the platform audit log. Your landlord ({lease.landlordName}) has been formally notified for key handover and security deposit settlement.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors mt-4"
              >
                Return to Tenancy Dashboard
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs text-slate-700">
              {/* Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Premises:</span>
                  <strong className="text-slate-900 font-semibold">{lease.unitIdentifier}, {lease.propertyTitle}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Monthly Rent:</span>
                  <span className="text-slate-800">NPR {lease.agreedMonthlyRent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Deposit on Hold:</span>
                  <span className="text-slate-800">NPR {lease.agreedDeposit.toLocaleString()}</span>
                </div>
              </div>

              {/* Reason Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                  Primary Reason for Early Termination
                </label>
                <select
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
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
                <label className="text-xs font-semibold text-slate-800 block mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-600" /> Proposed Vacancy / Handover Date
                </label>
                <input
                  type="date"
                  required
                  value={targetMoveOut}
                  onChange={(e) => setTargetMoveOut(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              {/* Narrative */}
              <div>
                <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                  Narrative & Handover Statement
                </label>
                <textarea
                  rows={3}
                  value={narrative}
                  onChange={(e) => setNarrative(e.target.value)}
                  placeholder="Explain any details regarding premises handover and outstanding utilities..."
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
                />
              </div>

              {/* Warning Notice */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1 text-[11px]">
                <div className="flex items-center gap-1.5 font-semibold text-amber-950">
                  <ShieldAlert className="w-4 h-4 text-amber-600" /> Notice Period & Deposit Handover
                </div>
                <p>
                  Per the Tenancy Agreement, standard notice is 35 days. Outstanding electricity, water, and waste bills will be reconciled against the security deposit during the move-out inspection.
                </p>
              </div>

              {/* Confirmation checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <span className="text-slate-600 leading-normal">
                  I understand that submitting this request updates my tenancy status to <strong>terminated early</strong> and begins the legal handover procedure.
                </span>
              </label>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!acknowledged || isSubmitting}
                  className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
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
