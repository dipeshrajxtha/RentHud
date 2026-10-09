/**
 * NewDisputeModal Component — Manus / Aceternity Dark Legal Modal
 *
 * Tenancy Dispute Filing Modal:
 * - Category selection under Nepal Muluki Civil Code
 * - Disputed claim monetary quantification
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
                className="w-10 h-10 rounded-xl flex items-center justify-center text-brand-400"
                style={{
                  background: 'rgba(46, 139, 255, 0.15)',
                  border: '1px solid rgba(46, 139, 255, 0.3)',
                }}
              >
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-display font-bold text-white">
                  File Tenancy Dispute
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
              <label className="text-xs font-semibold block mb-1.5 font-display" style={{ color: '#94aac5' }}>
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
              <label className="text-xs font-semibold block mb-1.5 font-display" style={{ color: '#94aac5' }}>
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
              <label className="text-xs font-semibold block mb-1.5 font-display" style={{ color: '#94aac5' }}>
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
              <label className="text-xs font-semibold block mb-1.5 font-display" style={{ color: '#94aac5' }}>
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
            <div
              className="p-3.5 rounded-xl space-y-1.5 text-[11px]"
              style={{
                background: 'rgba(46, 139, 255, 0.08)',
                border: '1px solid rgba(46, 139, 255, 0.2)',
                color: '#94aac5',
              }}
            >
              <div className="flex items-center gap-1.5 font-bold text-white font-display">
                <ShieldCheck className="w-4 h-4 text-brand-400" /> RentHub Legal Mediation Process
              </div>
              <p>
                Filing records this claim in the immutable platform registry. A platform mediator reviews
                the record and schedules a mutual resolution conference within 5 business days.
              </p>
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
                {isSubmitting ? 'Registering…' : 'File Formal Dispute'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
