/**
 * NewDisputeModal Component — Upgraded with Watermelon UI & Aceternity Primitives
 *
 * Tenancy Dispute Resolution filing modal:
 * - Category classification with FormSelect
 * - Claim amount specification with FormInput
 * - Detailed statement of facts & evidence
 * - Platform legal mediation notice with StatusPill
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Scale, ShieldCheck, DollarSign } from 'lucide-react';
import type { LeaseAgreement, TenancyDispute } from '@/types/tenant';
import { useAuth } from '@/features/auth/AuthContext';
import { tenantService } from '@/features/tenant/tenant.service';
import { FormInput, FormSelect, ShimmerButton, StatusPill } from '@/components/ui';

interface NewDisputeModalProps {
  lease: LeaseAgreement | null;
  onClose: () => void;
  onCreated: (dispute: TenancyDispute) => void;
}

const CATEGORY_OPTIONS = [
  { value: 'DEPOSIT_WITHHOLDING', label: 'Security Deposit Withholding / Deduction' },
  { value: 'RENT_OVERCHARGE', label: 'Arbitrary Rent Surcharge / Electricity Multiplier' },
  { value: 'MAINTENANCE_NEGLECT', label: 'Landlord Neglect of Habitability / Essential Repairs' },
  { value: 'PREMISES_ACCESS', label: 'Privacy Violation / Unauthorized Entry Without Notice' },
  { value: 'OTHER', label: 'Other Contractual Breach' },
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
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-sm">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-display font-bold text-slate-900 tracking-tight">
                    File Tenancy Dispute
                  </h2>
                  <StatusPill variant="danger" size="sm">
                    Arbitration
                  </StatusPill>
                </div>
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
            {/* Category */}
            <FormSelect
              label="Dispute Category"
              required
              options={CATEGORY_OPTIONS}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />

            {/* Title */}
            <FormInput
              label="Dispute Title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Unwarranted security deposit deduction"
            />

            {/* Disputed Claim Amount */}
            <FormInput
              label="Disputed Claim Amount (NPR)"
              type="number"
              min="0"
              step="1000"
              leftIcon={<DollarSign className="w-4 h-4 text-slate-400" />}
              value={claimAmount || ''}
              onChange={(e) => setClaimAmount(Number(e.target.value) || 0)}
              placeholder="e.g. 42000"
            />

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 tracking-tight">
                Statement of Facts & Evidence Summary <span className="text-rose-500 font-bold">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="State the facts clearly, citing lease clauses, dates, communication attempts, and requested remedy..."
                className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none shadow-sm"
              />
            </div>

            {/* Platform Mediation Notice */}
            <div className="p-3.5 rounded-2xl space-y-1 text-[11px] bg-blue-50/70 border border-blue-200 text-blue-900">
              <div className="flex items-center gap-1.5 font-bold font-display text-blue-950">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Statutory Mediation Under Section 389</span>
              </div>
              <p className="leading-relaxed text-blue-800">
                Filing records this claim in the platform arbitration docket. Escrow funds will remain locked until mutual resolution or an arbitrated decision is issued.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <ShimmerButton
                type="submit"
                variant="danger"
                size="md"
                isLoading={isSubmitting}
              >
                File Formal Dispute
              </ShimmerButton>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
