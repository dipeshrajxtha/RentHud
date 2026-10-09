/**
 * NewDisputeModal Component — Clean Light Mode
 *
 * Tenancy Dispute Resolution filing modal:
 * - Category classification
 * - Claim amount specification
 * - Detailed statement of facts & evidence
 * - Platform legal mediation notice
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Scale, ShieldCheck } from 'lucide-react';
import type { LeaseAgreement, TenancyDispute } from '@/types/tenant';
import { useAuth } from '@/features/auth/AuthContext';
import { tenantService } from '@/features/tenant/tenant.service';

interface NewDisputeModalProps {
  lease: LeaseAgreement | null;
  onClose: () => void;
  onCreated: (dispute: TenancyDispute) => void;
}

const CATEGORIES = [
  { id: 'DEPOSIT_WITHHOLDING', label: 'Security Deposit Withholding / Deduction' },
  { id: 'RENT_OVERCHARGE', label: 'Arbitrary Rent Surcharge / Electricity Multiplier' },
  { id: 'MAINTENANCE_NEGLECT', label: 'Landlord Neglect of Habitability / Essential Repairs' },
  { id: 'PREMISES_ACCESS', label: 'Privacy Violation / Unauthorized Entry Without Notice' },
  { id: 'OTHER', label: 'Other Contractual Breach' },
];

export function NewDisputeModal({
  lease,
  onClose,
  onCreated,
}: NewDisputeModalProps) {
  const { accessToken } = useAuth();
  const [category, setCategory] = useState('DEPOSIT_WITHHOLDING');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [claimAmount, setClaimAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!lease) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const dispute = await tenantService.createDispute(
        {
          tenancyId: lease.id,
          category,
          title,
          description,
          claimAmount,
          propertyTitle: lease.propertyTitle,
          unitIdentifier: lease.unitIdentifier,
        },
        accessToken
      );

      onCreated(dispute);
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
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-display font-bold text-slate-900">
                  File Tenancy Dispute
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
              <label className="text-xs font-bold block mb-1.5 font-display text-slate-700">
                Dispute Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="form-select text-xs"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="text-xs font-bold block mb-1.5 font-display text-slate-700">
                Dispute Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Unwarranted security deposit deduction for normal wear"
                className="form-input text-xs"
              />
            </div>

            {/* Disputed Claim Amount */}
            <div>
              <label className="text-xs font-bold block mb-1.5 font-display text-slate-700">
                Disputed Claim Amount (NPR) — Optional
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={claimAmount || ''}
                onChange={(e) => setClaimAmount(Number(e.target.value) || 0)}
                placeholder="Enter disputed NPR amount if monetary claim (e.g. 42000)"
                className="form-input text-xs font-mono"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold block mb-1.5 font-display text-slate-700">
                Statement of Facts & Evidence Summary
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="State the facts clearly, citing lease clauses, dates, communication attempts, and requested remedy..."
                className="form-input text-xs resize-none"
              />
            </div>

            {/* Platform Mediation Notice */}
            <div className="p-4 rounded-2xl space-y-1.5 text-[11px] bg-blue-50 border border-blue-200 text-blue-900">
              <div className="flex items-center gap-1.5 font-bold font-display text-blue-950">
                <ShieldCheck className="w-4 h-4 text-blue-600" /> RentHub Legal Mediation Process
              </div>
              <p className="leading-relaxed">
                Filing records this claim in the immutable platform registry. A platform mediator reviews
                the record and schedules a mutual resolution conference within 5 business days.
              </p>
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
                {isSubmitting ? 'Registering…' : 'File Formal Dispute'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
