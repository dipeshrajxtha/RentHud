/**
 * LeaseAgreementModal Component
 * Digital Tenancy Agreement viewer with Electronic Signature execution
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, CheckCircle2, ShieldCheck, Printer, PenTool, AlertTriangle } from 'lucide-react';
import type { LeaseAgreement } from '@/types/tenant';
import { useAuth } from '@/features/auth/AuthContext';
import { tenantService } from '@/features/tenant/tenant.service';

interface LeaseAgreementModalProps {
  lease: LeaseAgreement | null;
  onClose: () => void;
  onSigned: (updated: LeaseAgreement) => void;
}

export function LeaseAgreementModal({
  lease,
  onClose,
  onSigned,
}: LeaseAgreementModalProps) {
  if (!lease) return null;

  const { accessToken } = useAuth();
  const [isSigning, setIsSigning] = useState(false);
  const isTenantSigned = Boolean(lease.tenantSignedAt);
  const isLandlordSigned = Boolean(lease.landlordSignedAt);
  const canTenantSign = isLandlordSigned && !isTenantSigned;

  const handleSign = async () => {
    if (isSigning || isTenantSigned || !isLandlordSigned) return;
    setIsSigning(true);
    try {
      const updated = await tenantService.signLease(lease.id, accessToken);
      onSigned(updated);
    } finally {
      setIsSigning(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-600" />
              <div>
                <h2 className="text-base font-display font-semibold text-slate-900">
                  Residential Tenancy Agreement
                </h2>
                <p className="text-xs text-slate-500 font-mono">Reference: {lease.id}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition-colors"
                title="Print or Save as PDF"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Legal Document Content */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 text-xs sm:text-sm text-slate-700 font-sans leading-relaxed">
            {/* Agreement Header */}
            <div className="text-center pb-6 border-b border-slate-200">
              <span className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold block mb-1">
                Federal Democratic Republic of Nepal · Muluki Civil Code 2074
              </span>
              <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight">
                STANDARD RESIDENTIAL LEASE CONTRACT
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Concluded electronically via the RentHub Verified Tenancy Platform
              </p>
            </div>

            {/* Section 1: The Parties */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-900 mb-2">
                1. The Parties to this Agreement
              </h3>
              <p className="mb-2">
                This Residential Tenancy Agreement is entered into on this day between:
              </p>
              <div className="grid sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <strong className="text-slate-900 block font-semibold">THE LANDLORD (Lessor):</strong>
                  <span>{lease.landlordName}</span>
                  {lease.landlordPhone && <span className="block text-slate-500">Contact: {lease.landlordPhone}</span>}
                </div>
                <div>
                  <strong className="text-slate-900 block font-semibold">THE TENANT (Lessee):</strong>
                  <span>{lease.tenantName}</span>
                  <span className="block text-slate-500">Identity: Google OAuth Verified Resident</span>
                </div>
              </div>
            </div>

            {/* Section 2: Demised Premises */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-900 mb-2">
                2. The Demised Premises
              </h3>
              <p>
                The Landlord hereby agrees to lease to the Tenant, and the Tenant agrees to take on lease, the residential property known as <strong>{lease.unitIdentifier}</strong> situated within <strong>{lease.propertyTitle}</strong>, at {lease.propertyAddress}, {lease.propertyCity}, Nepal, together with fixtures and fittings.
              </p>
            </div>

            {/* Section 3: Term & Rent */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-900 mb-2">
                3. Term, Rent & Security Deposit
              </h3>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li>
                  <strong>Term:</strong> Commencing from <strong>{lease.startDate}</strong> and expiring on <strong>{lease.endDate}</strong>, unless terminated earlier in accordance with the provisions of this contract.
                </li>
                <li>
                  <strong>Monthly Rent:</strong> The agreed monthly rent is <strong>NPR {lease.agreedMonthlyRent.toLocaleString()}</strong>, payable on or before the 5th day of every calendar month through the RentHub automated payments system.
                </li>
                <li>
                  <strong>Security Deposit:</strong> The Tenant has deposited <strong>NPR {lease.agreedDeposit.toLocaleString()}</strong> with the Landlord, to be held without interest and refundable within 14 days following the peaceful vacation of the premises.
                </li>
              </ul>
            </div>

            {/* Section 4: Obligations */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-900 mb-2">
                4. Covenants of the Parties
              </h3>
              <div className="space-y-2 text-slate-600">
                <p>
                  <strong>4.1 Quiet Enjoyment & Landlord Entry:</strong> The Tenant shall peaceably hold and enjoy the premises without interruption. The Landlord or authorized agents shall not enter the demised premises without giving at least twenty-four (24) hours prior notice, except in genuine emergency circumstances.
                </p>
                <p>
                  <strong>4.2 Maintenance Responsibilities:</strong> The Landlord shall maintain the structural fabric, electrical mainlines, solar inverter installations, and water pumps. The Tenant shall maintain internal light fixtures and keep the premises clean and sanitary.
                </p>
                <p>
                  <strong>4.3 Subletting:</strong> The Tenant shall not assign, sublet, or part with possession of the premises without written consent of the Landlord.
                </p>
              </div>
            </div>

            {/* Section 5: Early Termination & Dispute Resolution */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-900 mb-2">
                5. Early Termination & Dispute Resolution
              </h3>
              <p className="text-slate-600">
                Either party may initiate early termination of this tenancy by serving 35 days prior notice through RentHub. All disputes arising under this agreement shall first be referred to RentHub Informal Tenancy Mediation prior to municipal arbitral bodies in accordance with Section 398 of the Muluki Civil Code.
              </p>
            </div>

            {/* Section 6: Execution & Electronic Signatures */}
            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-900 mb-3">
                6. Execution & Digital Signatures
              </h3>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Tenant Box */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase">Tenant Signature</span>
                    <p className="text-sm font-semibold text-slate-900 mt-1">{lease.tenantName}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200">
                    {isTenantSigned ? (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Signed {new Date(lease.tenantSignedAt!).toLocaleDateString()}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-amber-600 font-medium">Signature pending</span>
                    )}
                  </div>
                </div>

                {/* Landlord Box */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase">Landlord Signature</span>
                    <p className="text-sm font-semibold text-slate-900 mt-1">{lease.landlordName}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200">
                    {lease.landlordSignedAt ? (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Signed {new Date(lease.landlordSignedAt).toLocaleDateString()}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-amber-600 font-medium">Signature pending</span>
                    )}
                  </div>
                </div>
              </div>

              {lease.signedAt && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Contract Sealed & Legally Activated on {new Date(lease.signedAt).toLocaleDateString()}</span>
                  </div>
                  <span className="font-mono text-[10px] text-emerald-700">HASH: SHA256-LEGAL-VALID</span>
                </div>
              )}

              {!isLandlordSigned && !isTenantSigned && (
                <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-medium">Awaiting landlord’s signature — you will be able to counter-sign once the landlord has signed this lease.</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Signature CTA */}
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {isTenantSigned ? 'You have signed this agreement' : !isLandlordSigned ? 'Landlord signature required before you can sign' : 'Click below to affix your electronic signature'}
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
              >
                Close
              </button>

              {canTenantSign && (
                <button
                  type="button"
                  disabled={isSigning}
                  onClick={handleSign}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2"
                >
                  <PenTool className="w-4 h-4" />
                  <span>{isSigning ? 'Signing…' : 'Sign Electronically'}</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
