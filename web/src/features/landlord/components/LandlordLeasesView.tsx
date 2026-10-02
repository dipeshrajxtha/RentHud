/**
 * LandlordLeasesView — Phase 4
 *
 * Tenancies & Digital Lease Signing hub:
 *  - Filter leases by status
 *  - Sign pending leases (Muluki Civil Code 2074 agreement)
 *  - Review active/completed tenancies
 *  - Early termination review dialog
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileCheck2, Clock, CheckCircle2, XCircle, AlertTriangle,
  User, Calendar, DollarSign, Home, Pen, ChevronDown, ChevronUp,
  ShieldAlert,
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
const STATUS_CONFIG: Record<TenancyStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  rental_requested: { label: 'Requested', color: 'text-sky-700', bg: 'bg-sky-50', icon: Clock },
  application_rejected: { label: 'Rejected', color: 'text-slate-500', bg: 'bg-slate-100', icon: XCircle },
  application_cancelled: { label: 'Cancelled', color: 'text-slate-500', bg: 'bg-slate-100', icon: XCircle },
  pending_signature: { label: 'Pending Signature', color: 'text-amber-700', bg: 'bg-amber-50', icon: Pen },
  active: { label: 'Active', color: 'text-emerald-700', bg: 'bg-emerald-50', icon: CheckCircle2 },
  completed: { label: 'Completed', color: 'text-slate-600', bg: 'bg-slate-100', icon: CheckCircle2 },
  terminated_early: { label: 'Terminated Early', color: 'text-rose-700', bg: 'bg-rose-50', icon: XCircle },
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
    { key: 'active', label: 'Active' },
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
      <div className="p-8 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-200 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileCheck2 className="w-6 h-6 text-amber-600" />
          Tenancies & Leases
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage lease agreements under Nepal's Muluki Civil Code 2074 (§§ 379–403)
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-6">
        {filterOptions.map((f) => {
          const count = f.key === 'ALL' ? leases.length : leases.filter((l) => l.status === f.key).length;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filter === f.key
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f.label}
              {count > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                  filter === f.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
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
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <FileCheck2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No leases found</p>
          <p className="text-xs text-slate-400 mt-1">
            {filter === 'pending_signature' ? 'Approve an application to generate a draft lease.' : 'No leases match this filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((lease) => {
            const cfg = STATUS_CONFIG[lease.status] ?? STATUS_CONFIG['completed'];
            const Icon = cfg.icon;
            const isExpanded = expandedId === lease.id;
            const needsLandlordSign = lease.status === 'pending_signature' && !lease.landlordSignedAt;

            return (
              <motion.div
                key={lease.id}
                layout
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-sm transition-shadow"
              >
                {/* Urgent alert bar for unsigned leases */}
                {needsLandlordSign && (
                  <div className="bg-amber-50 border-b border-amber-100 px-5 py-2 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="text-xs font-semibold text-amber-700">
                      Your signature is required to activate this lease
                    </span>
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold ${cfg.bg} ${cfg.color}`}>
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                        {lease.tenantSignedAt && (
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                            Tenant signed ✓
                          </span>
                        )}
                        {lease.landlordSignedAt && (
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                            Landlord signed ✓
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-slate-900">
                        {lease.propertyTitle ?? 'Property'} — {lease.unitIdentifier ?? 'Unit'}
                      </p>
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <User className="w-3 h-3" />
                          {lease.tenantName ?? 'Tenant'}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <DollarSign className="w-3 h-3" />
                          NPR {lease.agreedMonthlyRent.toLocaleString()}/mo
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Calendar className="w-3 h-3" />
                          {new Date(lease.startDate).toLocaleDateString()} –{' '}
                          {new Date(lease.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {needsLandlordSign && (
                        <button
                          onClick={() => { setSigningLease(lease); setSignConfirmed(false); }}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                        >
                          <Pen className="w-3.5 h-3.5" />
                          Sign Lease
                        </button>
                      )}
                      {lease.status === 'active' && (
                        <button
                          onClick={() => setTerminatingLease(lease)}
                          className="flex items-center gap-1 px-3 py-1.5 text-rose-600 border border-rose-200 hover:bg-rose-50 text-xs font-semibold rounded-xl transition-colors"
                        >
                          Terminate
                        </button>
                      )}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : lease.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors"
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
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="bg-slate-50 rounded-xl p-3">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Monthly Rent</p>
                            <p className="text-sm font-bold text-slate-900 mt-0.5">NPR {lease.agreedMonthlyRent.toLocaleString()}</p>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-3">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Deposit Held</p>
                            <p className="text-sm font-bold text-slate-900 mt-0.5">NPR {lease.agreedDeposit.toLocaleString()}</p>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-3">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Start Date</p>
                            <p className="text-sm font-bold text-slate-900 mt-0.5">{new Date(lease.startDate).toLocaleDateString()}</p>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-3">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">End Date</p>
                            <p className="text-sm font-bold text-slate-900 mt-0.5">{new Date(lease.endDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                        {lease.tenantEmail && (
                          <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" />
                            {lease.tenantEmail}
                            {lease.tenantPhone && ` · ${lease.tenantPhone}`}
                          </p>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => { if (!isProcessing) setSigningLease(null); }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="fixed inset-x-4 top-[4%] bottom-[4%] z-50 max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Modal header */}
              <div className="px-6 py-5 border-b border-slate-100 bg-amber-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Pen className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Digital Lease Signing</h2>
                    <p className="text-xs text-slate-500">Muluki Civil Code 2074, §§ 379–403 • Nepal</p>
                  </div>
                </div>
              </div>

              {/* Agreement text */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Home className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-semibold text-slate-900">
                      {signingLease.propertyTitle} — {signingLease.unitIdentifier}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                    <div><span className="text-slate-400">Tenant:</span> {signingLease.tenantName ?? '—'}</div>
                    <div><span className="text-slate-400">Monthly Rent:</span> NPR {signingLease.agreedMonthlyRent.toLocaleString()}</div>
                    <div><span className="text-slate-400">Deposit:</span> NPR {signingLease.agreedDeposit.toLocaleString()}</div>
                    <div><span className="text-slate-400">Start:</span> {new Date(signingLease.startDate).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-5">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    Legal Agreement — Muluki Civil Code 2074
                  </h3>
                  <pre className="whitespace-pre-wrap text-[11px] text-slate-600 leading-relaxed font-sans">
                    {LEASE_AGREEMENT_TEXT.trim()}
                  </pre>
                </div>

                {/* Tenant signed indicator */}
                {signingLease.tenantSignedAt && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-4">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-semibold text-emerald-700">
                      Tenant signed on {new Date(signingLease.tenantSignedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* Confirmation checkbox */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={signConfirmed}
                    onChange={(e) => setSignConfirmed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded accent-amber-600"
                  />
                  <span className="text-xs text-slate-700 leading-relaxed">
                    I, the landlord, have read and fully agree to all terms stated in this agreement under the Muluki Civil Code 2074. I understand that my digital signature is legally binding under the Electronic Transactions Act 2063 of Nepal.
                  </span>
                </label>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-3">
                <button
                  onClick={() => setSigningLease(null)}
                  disabled={isProcessing}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSign}
                  disabled={!signConfirmed || isProcessing}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Signing…
                    </>
                  ) : (
                    <>
                      <Pen className="w-3.5 h-3.5" />
                      Sign & Activate Lease
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => { if (!isProcessing) setTerminatingLease(null); }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-lg mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-rose-100 bg-rose-50/60">
                <h2 className="text-base font-bold text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Early Termination (§ 390)
                </h2>
                <p className="text-xs text-rose-600 mt-1">
                  35-day notice required under Muluki Civil Code 2074 § 390
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600">
                  <strong>{terminatingLease.propertyTitle}</strong> — {terminatingLease.unitIdentifier}
                  {' '} · Tenant: {terminatingLease.tenantName}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reason Code</label>
                  <select
                    value={terminationReason}
                    onChange={(e) => setTerminationReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400/20 bg-white"
                  >
                    {TERMINATION_REASONS.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Additional Details <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={terminationNarrative}
                    onChange={(e) => setTerminationNarrative(e.target.value)}
                    placeholder="Provide any additional context for the termination record…"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400/20 bg-white resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setTerminatingLease(null)}
                    disabled={isProcessing}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmTerminate}
                    disabled={isProcessing}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : 'Confirm Termination'}
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
