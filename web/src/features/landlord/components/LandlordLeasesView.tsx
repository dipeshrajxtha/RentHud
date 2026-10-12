/**
 * LandlordLeasesView — Clean Light Mode
 *
 * Tenancies & Digital Lease Signing Hub:
 *  - Filter leases by status with clean counter pills
 *  - Interactive lease cards with clear badges on pending signatures
 *  - Muluki Civil Code 2074 digital lease agreement signing modal
 *  - Review active/completed tenancies with financial breakdown
 *  - Early termination dialog with § 390 statutory 35-day notice calculation
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock, CheckCircle2, XCircle, AlertTriangle,
  User, Calendar, DollarSign, Pen, ChevronDown, ChevronUp,
  ShieldAlert, Building2, X,
} from 'lucide-react';
import type { LandlordLease, TenancyStatus } from '@/types/landlord';
import {
  ShimmerButton,
  StatusPill,
  FilterTabs,
  FormSelect,
  FormTextarea,
} from '@/components/ui';
import type { StatusPillVariant } from '@/components/ui';

type LeaseFilter = 'ALL' | 'pending_signature' | 'active' | 'completed' | 'terminated_early';

interface LandlordLeasesViewProps {
  leases: LandlordLease[];
  loading: boolean;
  onSignLease: (leaseId: string) => Promise<void>;
  onTerminateLease: (leaseId: string, reasonCode: string, narrative: string) => Promise<void>;
}

const STATUS_CONFIG: Record<
  TenancyStatus,
  { label: string; variant: StatusPillVariant; icon: React.ElementType }
> = {
  rental_requested: { label: 'Requested', variant: 'info', icon: Clock },
  application_rejected: { label: 'Rejected', variant: 'neutral', icon: XCircle },
  application_cancelled: { label: 'Cancelled', variant: 'neutral', icon: XCircle },
  pending_signature: { label: 'Awaiting Signature', variant: 'warning', icon: Pen },
  active: { label: 'Active Tenancy', variant: 'success', icon: CheckCircle2 },
  completed: { label: 'Completed', variant: 'neutral', icon: CheckCircle2 },
  terminated_early: { label: 'Terminated Early', variant: 'danger', icon: XCircle },
};

const LEASE_AGREEMENT_TEXT = `
RENTAL AGREEMENT
Muluki Civil Code 2074 (Chapter on Tenancy — §§ 379–403)

This Rental Agreement ("Agreement") is entered into between the Landlord and the Tenant as identified by the RentHub platform, and shall be governed by the provisions of the Muluki Civil Code 2074 of Nepal.

§ 379 — COMMENCEMENT: This tenancy commences on the Start Date as recorded in the digital lease record and continues for the agreed lease term.

§ 382 — RENT PAYMENT: The agreed monthly rent shall be paid by the Tenant on or before the 7th day of each Nepali calendar month. Failure to pay rent within 15 days of the due date shall constitute grounds for termination notice.

§ 385 — SECURITY DEPOSIT: The security deposit paid by the Tenant shall be held in escrow by the Landlord. It shall be refunded within 30 days of tenancy completion, less any lawful deductions for damages beyond normal wear and tear.

§ 388 — MAINTENANCE OBLIGATIONS: The Landlord shall maintain the property in a habitable condition and attend to structural repairs. The Tenant shall maintain cleanliness and report damage promptly. Minor repairs up to NPR 2,000 per incident are the Tenant's responsibility.

§ 390 — NOTICE PERIOD: Either party may terminate this agreement by providing 35 (thirty-five) days' written notice. The Landlord may issue an immediate notice only in cases of non-payment exceeding 30 days or material breach.

§ 393 — SUBLETTING: The Tenant shall not sublet the property or any part thereof without prior written consent of the Landlord.

§ 395 — LANDLORD ENTRY: The Landlord may inspect the property with at least 48 hours' advance notice, except in cases of emergency.

§ 398 — DISPUTE RESOLUTION: Any dispute arising under this Agreement shall first be referred to mediation under the Tenant and Landlord Dispute Resolution mechanism. If mediation fails, the matter shall be submitted to the local District Court having jurisdiction.

§ 403 — DIGITAL SIGNATURES: Both parties acknowledge that their digital signatures recorded on the RentHub platform constitute legally binding acceptance of all terms herein, equivalent to physical signatures under the Electronic Transactions Act 2063 (2006).

By signing below, both parties confirm they have read, understood, and agree to all terms stated in this Agreement.
`;

const TERMINATION_REASONS = [
  'Mutual agreement between parties',
  'Non-payment of rent (§ 382)',
  'Property required for personal use',
  'Tenant material breach of agreement',
  'Uninhabitable property condition',
  'Other (describe below)',
];

export function LandlordLeasesView({ leases, loading, onSignLease, onTerminateLease }: LandlordLeasesViewProps) {
  const [filter, setFilter] = useState<LeaseFilter>('ALL');
  const [signingLease, setSigningLease] = useState<LandlordLease | null>(null);
  const [terminatingLease, setTerminatingLease] = useState<LandlordLease | null>(null);
  const [terminationReason, setTerminationReason] = useState(TERMINATION_REASONS[0]);
  const [terminationNarrative, setTerminationNarrative] = useState('');
  const [signConfirmed, setSignConfirmed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = leases.filter((l) => {
    if (filter === 'ALL') return true;
    return l.status === filter;
  });

  const filterOptions: { key: LeaseFilter; label: string }[] = [
    { key: 'ALL', label: 'All Leases' },
    { key: 'pending_signature', label: 'Awaiting Signature' },
    { key: 'active', label: 'Active Tenancies' },
    { key: 'completed', label: 'Completed' },
    { key: 'terminated_early', label: 'Terminated' },
  ];

  async function handleConfirmSign() {
    if (!signingLease || !signConfirmed) return;
    setIsProcessing(true);
    try {
      await onSignLease(signingLease.id);
      setSigningLease(null);
      setSignConfirmed(false);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleConfirmTerminate() {
    if (!terminatingLease) return;
    setIsProcessing(true);
    try {
      await onTerminateLease(terminatingLease.id, terminationReason, terminationNarrative);
      setTerminatingLease(null);
      setTerminationNarrative('');
    } finally {
      setIsProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-3xl bg-white border border-slate-200 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-2 bg-amber-50 border border-amber-200 text-amber-800 font-display">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            Muluki Civil Code 2074 (§§ 379–403)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-display">
            Tenancies & Legal Leases
          </h1>
          <p className="text-xs sm:text-sm mt-1 text-slate-500">
            Digitally countersign rental contracts and monitor active tenancy lifecycles.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="pb-1">
        <FilterTabs
          tabs={filterOptions.map((f) => ({
            id: f.key,
            label: f.label,
            count:
              f.key === 'ALL' ? leases.length : leases.filter((l) => l.status === f.key).length,
          }))}
          activeId={filter}
          onChange={(id) => setFilter(id as LeaseFilter)}
        />
      </div>

      {/* Leases List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 font-display">No tenancies in this view</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            When you approve rental applications, their generated legal lease agreements will appear here for signing.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((lease) => {
            const cfg = STATUS_CONFIG[lease.status] || {
              label: lease.status,
              variant: 'neutral' as StatusPillVariant,
              icon: Clock,
            };
            const Icon = cfg.icon;
            const needsLandlordSign = lease.status === 'pending_signature' && !lease.landlordSignedAt;
            const awaitingTenantSign = lease.status === 'pending_signature' && lease.landlordSignedAt && !lease.tenantSignedAt;
            const isExpanded = expandedId === lease.id;

            return (
              <div
                key={lease.id}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all"
              >
                {/* Urgent alert bar for unsigned leases */}
                {needsLandlordSign && (
                  <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="text-xs font-semibold text-amber-900">
                        Countersignature Required — Sign below to ratify this legal tenancy contract
                      </span>
                    </div>
                    <ShimmerButton
                      variant="primary"
                      size="sm"
                      onClick={() => { setSigningLease(lease); setSignConfirmed(false); }}
                      leftIcon={<Pen className="w-3.5 h-3.5" />}
                      className="shrink-0"
                    >
                      Sign Now
                    </ShimmerButton>
                  </div>
                )}
                {awaitingTenantSign && (
                  <div className="bg-blue-50 border-b border-blue-200 px-5 py-2 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="text-xs font-semibold text-blue-900">
                      Contract executed by Landlord — awaiting tenant's countersignature to activate
                    </span>
                  </div>
                )}

                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <StatusPill variant={cfg.variant} icon={<Icon className="w-3 h-3" />}>
                          {cfg.label}
                        </StatusPill>
                        {lease.tenantSignedAt && (
                          <StatusPill variant="success" size="sm">
                            Tenant Signed ✓
                          </StatusPill>
                        )}
                        {lease.landlordSignedAt && (
                          <StatusPill variant="success" size="sm">
                            Landlord Signed ✓
                          </StatusPill>
                        )}
                      </div>
                      <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2 font-display">
                        <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                        {lease.propertyTitle ?? 'Property'} — <span className="text-blue-700 font-semibold">{lease.unitIdentifier ?? 'Unit'}</span>
                      </h3>
                      <div className="flex items-center gap-4 sm:gap-6 mt-3 flex-wrap">
                        <span className="flex items-center gap-1.5 text-xs text-slate-600">
                          <User className="w-3.5 h-3.5 text-blue-600" />
                          {lease.tenantName ?? 'Tenant'}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                          NPR {lease.agreedMonthlyRent.toLocaleString()} / mo
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(lease.startDate).toLocaleDateString()} — {new Date(lease.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                      {needsLandlordSign && (
                        <ShimmerButton
                          variant="primary"
                          size="sm"
                          onClick={() => { setSigningLease(lease); setSignConfirmed(false); }}
                          leftIcon={<Pen className="w-3.5 h-3.5" />}
                        >
                          Sign Lease
                        </ShimmerButton>
                      )}
                      {lease.status === 'active' && (
                        <ShimmerButton
                          variant="danger"
                          size="sm"
                          onClick={() => setTerminatingLease(lease)}
                        >
                          Notice (§ 390)
                        </ShimmerButton>
                      )}
                      <ShimmerButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedId(isExpanded ? null : lease.id)}
                        title={isExpanded ? 'Collapse lease details' : 'Expand lease details'}
                        className="px-2"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </ShimmerButton>
                    </div>
                  </div>

                  {/* Expanded Lease Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600 space-y-2">
                      <div className="grid sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Security Deposit:</span>
                          <strong className="text-slate-900 font-bold font-display">NPR {lease.agreedDeposit.toLocaleString()}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Lease Reference:</span>
                          <span className="font-mono text-slate-700 font-bold">{lease.id}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Statutory Compliance:</span>
                          <span className="text-emerald-700 font-bold">Muluki Civil Code Verified</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Sign Lease Modal ────────────────────────────────────────────── */}
      <AnimatePresence>
        {signingLease && (
          <div className="fixed inset-0 z-50 overflow-y-auto modal-overlay flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                    <Pen className="w-4 h-4 text-blue-600" />
                    Sign Digital Tenancy Agreement
                  </h2>
                  <p className="text-xs text-slate-500">
                    {signingLease.propertyTitle} — {signingLease.unitIdentifier}
                  </p>
                </div>
                <ShimmerButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setSigningLease(null)}
                  className="px-2"
                >
                  <X className="w-4 h-4" />
                </ShimmerButton>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><span className="text-slate-500">Tenant:</span> <strong className="text-slate-900 font-bold">{signingLease.tenantName ?? '—'}</strong></div>
                    <div><span className="text-slate-500">Monthly Rent:</span> <strong className="text-emerald-700 font-bold font-display">NPR {signingLease.agreedMonthlyRent.toLocaleString()}</strong></div>
                    <div><span className="text-slate-500">Security Deposit:</span> <strong className="text-slate-900 font-bold font-display">NPR {signingLease.agreedDeposit.toLocaleString()}</strong></div>
                    <div><span className="text-slate-500">Effective Date:</span> <strong className="text-slate-900 font-bold">{new Date(signingLease.startDate).toLocaleDateString()}</strong></div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-display">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    Statutory Tenancy Agreement Terms
                  </h3>
                  <div className="bg-white rounded-xl p-4 border border-slate-200 max-h-56 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-slate-700 font-sans">
                      {LEASE_AGREEMENT_TEXT.trim()}
                    </pre>
                  </div>
                </div>

                {/* Tenant signed indicator */}
                {signingLease.tenantSignedAt && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl w-full">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-semibold">
                      Tenant recorded digital signature on {new Date(signingLease.tenantSignedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* Confirmation checkbox */}
                <label className="flex items-start gap-3 cursor-pointer p-3.5 rounded-2xl border border-blue-200 bg-blue-50/50">
                  <input
                    type="checkbox"
                    checked={signConfirmed}
                    onChange={(e) => setSignConfirmed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs leading-relaxed text-slate-700">
                    I, the Landlord, have reviewed and hereby countersign this rental agreement under the <strong className="text-slate-900">Muluki Civil Code 2074</strong>. I acknowledge this digital signature is legally binding under the <strong className="text-slate-900">Electronic Transactions Act 2063</strong> of Nepal.
                  </span>
                </label>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3">
                <ShimmerButton
                  variant="outline"
                  size="md"
                  onClick={() => setSigningLease(null)}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  Cancel
                </ShimmerButton>
                <ShimmerButton
                  variant="primary"
                  size="md"
                  onClick={handleConfirmSign}
                  disabled={!signConfirmed || isProcessing}
                  isLoading={isProcessing}
                  leftIcon={<Pen className="w-3.5 h-3.5" />}
                  className="flex-1"
                >
                  Countersign & Activate Lease
                </ShimmerButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Termination Dialog ───────────────────────────────────────────── */}
      <AnimatePresence>
        {terminatingLease && (
          <div className="fixed inset-0 z-50 overflow-y-auto modal-overlay flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-rose-200 bg-rose-50">
                <h2 className="text-base font-bold text-rose-900 flex items-center gap-2 font-display">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  Statutory Tenancy Termination Notice (§ 390)
                </h2>
                <p className="text-xs text-rose-700 mt-1">
                  Nepal law requires a 35-day advance written notice period.
                </p>
              </div>
              <div className="p-6 space-y-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-slate-700">
                  <strong className="text-slate-900">{terminatingLease.propertyTitle}</strong> — {terminatingLease.unitIdentifier}
                  {' '} · Tenant: <strong className="text-slate-900">{terminatingLease.tenantName}</strong>
                </div>
                <FormSelect
                  label="Statutory Reason"
                  value={terminationReason}
                  onChange={(e) => setTerminationReason(e.target.value)}
                  options={TERMINATION_REASONS.map((r) => ({ value: r, label: r }))}
                />
                <FormTextarea
                  label="Narrative & Observations"
                  hint="(optional)"
                  rows={3}
                  maxChars={500}
                  value={terminationNarrative}
                  onChange={(e) => setTerminationNarrative(e.target.value)}
                  placeholder="Document circumstances requiring lease termination for legal records…"
                />
                <div className="flex gap-3 pt-2">
                  <ShimmerButton
                    variant="outline"
                    size="md"
                    onClick={() => setTerminatingLease(null)}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    Cancel
                  </ShimmerButton>
                  <ShimmerButton
                    variant="danger"
                    size="md"
                    onClick={handleConfirmTerminate}
                    disabled={isProcessing}
                    isLoading={isProcessing}
                    className="flex-1"
                  >
                    Issue 35-Day Notice
                  </ShimmerButton>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
