/**
 * LandlordLeasesView — Ultra-Premium Dark Portal
 *
 * Tenancies & Digital Lease Signing Hub:
 *  - Filter leases by status with glowing counter pills
 *  - Interactive lease cards with glowing borders on pending signatures
 *  - Muluki Civil Code 2074 digital lease agreement signing modal
 *  - Review active/completed tenancies with financial breakdown
 *  - Early termination dialog with § 390 statutory 35-day notice calculation
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileCheck2, Clock, CheckCircle2, XCircle, AlertTriangle,
  User, Calendar, DollarSign, Home, Pen, ChevronDown, ChevronUp,
  ShieldAlert, Sparkles, Building2,
} from 'lucide-react';
import type { LandlordLease, TenancyStatus } from '@/types/landlord';

type LeaseFilter = 'ALL' | 'pending_signature' | 'active' | 'completed' | 'terminated_early';

interface LandlordLeasesViewProps {
  leases: LandlordLease[];
  loading: boolean;
  onSignLease: (leaseId: string) => Promise<void>;
  onTerminateLease: (leaseId: string, reasonCode: string, narrative: string) => Promise<void>;
}

/* ── Status config ─────────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<
  TenancyStatus,
  { label: string; badgeClass: string; icon: React.ElementType }
> = {
  rental_requested: { label: 'Requested', badgeClass: 'badge-info', icon: Clock },
  application_rejected: { label: 'Rejected', badgeClass: 'badge-neutral', icon: XCircle },
  application_cancelled: { label: 'Cancelled', badgeClass: 'badge-neutral', icon: XCircle },
  pending_signature: { label: 'Awaiting Signature', badgeClass: 'badge-warning', icon: Pen },
  active: { label: 'Active Tenancy', badgeClass: 'badge-success', icon: CheckCircle2 },
  completed: { label: 'Completed', badgeClass: 'badge-neutral', icon: CheckCircle2 },
  terminated_early: { label: 'Terminated Early', badgeClass: 'badge-error', icon: XCircle },
};

/* ── Muluki Civil Code 2074 lease agreement text ───────────────────────── */
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
          <div key={i} className="h-32 rounded-2xl card-premium animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-2"
            style={{
              background: 'rgba(245,158,11,0.12)',
              border: '1px solid rgba(245,158,11,0.25)',
              color: '#fbbf24',
              fontFamily: 'Space Grotesk, sans-serif',
            }}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Muluki Civil Code 2074 (§§ 379–403)
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient-blue" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Tenancies & Legal Leases
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Digitally countersign rental contracts and monitor active tenancy lifecycles.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap pb-1">
        {filterOptions.map((f) => {
          const count = f.key === 'ALL' ? leases.length : leases.filter((l) => l.status === f.key).length;
          const isActive = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'btn-primary shadow-brand-sm'
                  : 'btn-ghost'
              }`}
            >
              <span>{f.label}</span>
              {count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-surface-4 text-text-muted'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Lease list */}
      {filtered.length === 0 ? (
        <div className="card-premium text-center py-20 px-6 border-dashed">
          <FileCheck2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="font-semibold text-base" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk, sans-serif' }}>
            No leases found
          </p>
          <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
            {filter === 'pending_signature'
              ? 'Approve an incoming tenant application to generate a draft contract awaiting your signature.'
              : 'No tenancy contracts match the selected status filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((lease) => {
            const cfg = STATUS_CONFIG[lease.status] ?? STATUS_CONFIG['completed'];
            const Icon = cfg.icon;
            const isExpanded = expandedId === lease.id;
            const needsLandlordSign = lease.status === 'pending_signature' && !lease.landlordSignedAt;
            const awaitingTenantSign = lease.status === 'pending_signature' && lease.landlordSignedAt && !lease.tenantSignedAt;

            return (
              <motion.div
                key={lease.id}
                layout
                className={`card-premium overflow-hidden transition-all duration-300 ${
                  needsLandlordSign ? 'border-amber-500/40 shadow-glow-amber' : ''
                }`}
              >
                {/* Urgent alert bar for unsigned leases */}
                {needsLandlordSign && (
                  <div className="bg-amber-500/10 border-b border-amber-500/20 px-5 py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                      <span className="text-xs font-semibold text-amber-300">
                        Countersignature Required — Sign below to ratify this legal tenancy contract
                      </span>
                    </div>
                    <button
                      onClick={() => { setSigningLease(lease); setSignConfirmed(false); }}
                      className="btn-primary btn-sm text-xs font-bold shrink-0"
                    >
                      <Pen className="w-3.5 h-3.5" />
                      Sign Now
                    </button>
                  </div>
                )}
                {awaitingTenantSign && (
                  <div className="bg-cyan-500/10 border-b border-cyan-500/20 px-5 py-2 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="text-xs font-semibold text-cyan-300">
                      Contract executed by Landlord — awaiting tenant's countersignature to activate
                    </span>
                  </div>
                )}

                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={cfg.badgeClass}>
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                        {lease.tenantSignedAt && (
                          <span className="badge-success text-[10px]">
                            Tenant Signed ✓
                          </span>
                        )}
                        {lease.landlordSignedAt && (
                          <span className="badge-success text-[10px]">
                            Landlord Signed ✓
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        <Building2 className="w-4 h-4 text-brand-400 shrink-0" />
                        {lease.propertyTitle ?? 'Property'} — <span className="text-brand-300 font-semibold">{lease.unitIdentifier ?? 'Unit'}</span>
                      </h3>
                      <div className="flex items-center gap-4 sm:gap-6 mt-3 flex-wrap">
                        <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <User className="w-3.5 h-3.5 text-brand-400" />
                          {lease.tenantName ?? 'Tenant'}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                          <DollarSign className="w-3.5 h-3.5" />
                          NPR {lease.agreedMonthlyRent.toLocaleString()} / mo
                        </span>
                        <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                          <Calendar className="w-3.5 h-3.5 text-violet-400" />
                          {new Date(lease.startDate).toLocaleDateString()} – {new Date(lease.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                      {needsLandlordSign && (
                        <button
                          onClick={() => { setSigningLease(lease); setSignConfirmed(false); }}
                          className="btn-primary btn-sm flex items-center gap-1.5 text-xs font-bold"
                        >
                          <Pen className="w-3.5 h-3.5" />
                          Sign Lease
                        </button>
                      )}
                      {lease.status === 'active' && (
                        <button
                          onClick={() => setTerminatingLease(lease)}
                          className="btn-danger btn-sm text-xs font-semibold"
                        >
                          Notice (§ 390)
                        </button>
                      )}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : lease.id)}
                        className="btn-ghost btn-sm p-2"
                        title={isExpanded ? 'Collapse lease details' : 'Expand lease details'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="mt-5 pt-4 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="card-premium p-3">
                            <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Monthly Rent</p>
                            <p className="text-sm font-bold text-slate-100 mt-1 font-display">NPR {lease.agreedMonthlyRent.toLocaleString()}</p>
                          </div>
                          <div className="card-premium p-3">
                            <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Security Deposit</p>
                            <p className="text-sm font-bold text-slate-100 mt-1 font-display">NPR {lease.agreedDeposit.toLocaleString()}</p>
                          </div>
                          <div className="card-premium p-3">
                            <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Start Date</p>
                            <p className="text-sm font-bold text-slate-100 mt-1 font-display">{new Date(lease.startDate).toLocaleDateString()}</p>
                          </div>
                          <div className="card-premium p-3">
                            <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">End Date</p>
                            <p className="text-sm font-bold text-slate-100 mt-1 font-display">{new Date(lease.endDate).toLocaleDateString()}</p>
                          </div>
                        </div>

                        {lease.tenantEmail && (
                          <div className="mt-3 flex items-center justify-between flex-wrap gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                            <span className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-brand-400" />
                              Contact: <strong className="text-slate-200">{lease.tenantEmail}</strong> {lease.tenantPhone && ` · ${lease.tenantPhone}`}
                            </span>
                            <span className="text-[11px] text-text-muted">
                              Contract Hash: {lease.id.slice(0, 12)}…
                            </span>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Digital Lease Signing Modal ──────────────────────────────────── */}
      <AnimatePresence>
        {signingLease && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 modal-overlay"
              onClick={() => { if (!isProcessing) setSigningLease(null); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="fixed inset-x-4 top-[5%] bottom-[5%] z-50 max-w-2xl mx-auto card-auth flex flex-col overflow-hidden"
            >
              {/* Modal header */}
              <div className="px-6 py-5 border-b border-white/10 bg-brand-950/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                    <Pen className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-100 flex items-center gap-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      Digital Lease Countersigning
                      <Sparkles className="w-4 h-4 text-amber-400" />
                    </h2>
                    <p className="text-xs text-text-muted">Muluki Civil Code 2074 (§§ 379–403) • Electronic Transactions Act 2063</p>
                  </div>
                </div>
              </div>

              {/* Agreement text */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                <div className="card-premium p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="w-4 h-4 text-brand-400" />
                    <span className="text-sm font-semibold text-slate-100">
                      {signingLease.propertyTitle} — {signingLease.unitIdentifier}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <div><span className="text-text-muted">Tenant:</span> <strong className="text-slate-200">{signingLease.tenantName ?? '—'}</strong></div>
                    <div><span className="text-text-muted">Monthly Rent:</span> <strong className="text-emerald-400">NPR {signingLease.agreedMonthlyRent.toLocaleString()}</strong></div>
                    <div><span className="text-text-muted">Security Deposit:</span> <strong className="text-slate-200">NPR {signingLease.agreedDeposit.toLocaleString()}</strong></div>
                    <div><span className="text-text-muted">Effective Date:</span> <strong className="text-slate-200">{new Date(signingLease.startDate).toLocaleDateString()}</strong></div>
                  </div>
                </div>

                <div className="card-premium p-4">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Statutory Tenancy Agreement Terms
                  </h3>
                  <div className="bg-surface-1 rounded-xl p-4 border border-white/5 max-h-56 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-slate-300 font-sans">
                      {LEASE_AGREEMENT_TEXT.trim()}
                    </pre>
                  </div>
                </div>

                {/* Tenant signed indicator */}
                {signingLease.tenantSignedAt && (
                  <div className="flex items-center gap-2 p-3 badge-success rounded-xl w-full">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-semibold">
                      Tenant recorded digital signature on {new Date(signingLease.tenantSignedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* Confirmation checkbox */}
                <label className="flex items-start gap-3 cursor-pointer p-3.5 rounded-xl border border-brand-500/20 bg-brand-500/5">
                  <input
                    type="checkbox"
                    checked={signConfirmed}
                    onChange={(e) => setSignConfirmed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded accent-brand-500"
                  />
                  <span className="text-xs leading-relaxed text-slate-300">
                    I, the Landlord, have reviewed and hereby countersign this rental agreement under the <strong className="text-white">Muluki Civil Code 2074</strong>. I acknowledge this digital signature is legally binding under the <strong className="text-white">Electronic Transactions Act 2063</strong> of Nepal.
                  </span>
                </label>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-white/10 bg-surface-1 flex gap-3">
                <button
                  onClick={() => setSigningLease(null)}
                  disabled={isProcessing}
                  className="btn-ghost flex-1 py-2.5 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSign}
                  disabled={!signConfirmed || isProcessing}
                  className="btn-primary flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Executing Contract…
                    </>
                  ) : (
                    <>
                      <Pen className="w-3.5 h-3.5" />
                      Countersign & Activate Lease
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Termination Dialog ───────────────────────────────────────────── */}
      <AnimatePresence>
        {terminatingLease && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 modal-overlay"
              onClick={() => { if (!isProcessing) setTerminatingLease(null); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-lg mx-auto card-auth overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-rose-500/20 bg-rose-950/40">
                <h2 className="text-base font-bold text-rose-300 flex items-center gap-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                  Statutory Tenancy Termination Notice (§ 390)
                </h2>
                <p className="text-xs text-rose-300/80 mt-1">
                  Nepal law requires a 35-day advance written notice period.
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div className="card-premium p-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <strong className="text-slate-100">{terminatingLease.propertyTitle}</strong> — {terminatingLease.unitIdentifier}
                  {' '} · Tenant: <strong className="text-slate-100">{terminatingLease.tenantName}</strong>
                </div>
                <div>
                  <label className="form-label text-xs">Statutory Reason</label>
                  <select
                    value={terminationReason}
                    onChange={(e) => setTerminationReason(e.target.value)}
                    className="form-select text-xs"
                  >
                    {TERMINATION_REASONS.map((r) => <option key={r} value={r} className="bg-surface-2 text-white">{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label text-xs">
                    Narrative & Observations <span className="text-text-muted font-normal">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={terminationNarrative}
                    onChange={(e) => setTerminationNarrative(e.target.value)}
                    placeholder="Document circumstances requiring lease termination for legal records…"
                    className="form-input text-xs resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setTerminatingLease(null)}
                    disabled={isProcessing}
                    className="btn-ghost flex-1 py-2.5 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmTerminate}
                    disabled={isProcessing}
                    className="btn-danger flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : 'Issue 35-Day Notice'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
