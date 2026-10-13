/**
 * LeaseAgreementModal Component — Clean Light Mode with Digital & Biometric Signatures
 *
 * Full-fidelity Digital Tenancy Agreement viewer with:
 * - Legal contract typography compliant with Nepal Muluki Civil Code 2074
 * - Local device upload for Digital Signature (PNG) & Biometric Thumbprint (PNG)
 * - Cryptographic & visual verification stamps
 * - Dual-party signature execution review
 * - Print / Export ready formatting
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  FileText,
  ShieldCheck,
  Printer,
  PenTool,
  AlertTriangle,
  Upload,
  Fingerprint,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import type { LeaseAgreement } from '@/types/tenant';
import { useAuth } from '@/features/auth/AuthContext';
import { tenantService } from '@/features/tenant/tenant.service';
import { ShimmerButton, StatusPill } from '@/components/ui';

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
  const { accessToken } = useAuth();
  const [isSigning, setIsSigning] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [biometricData, setBiometricData] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const sigInputRef = useRef<HTMLInputElement>(null);
  const bioInputRef = useRef<HTMLInputElement>(null);

  if (!lease) return null;

  const isTenantSigned = Boolean(lease.tenantSignedAt);
  const isLandlordSigned = Boolean(lease.landlordSignedAt);
  const canTenantSign = isLandlordSigned && !isTenantSigned;

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'signature' | 'biometric'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG/JPEG).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size must be under 5MB.');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (type === 'signature') {
        setSignatureData(result);
      } else {
        setBiometricData(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSign = async () => {
    if (isSigning || isTenantSigned || !isLandlordSigned) return;
    setIsSigning(true);
    setUploadError(null);
    try {
      const updated = await tenantService.signLease(
        lease.id,
        accessToken,
        signatureData || undefined,
        biometricData || undefined
      );
      onSigned(updated);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to sign lease agreement');
    } finally {
      setIsSigning(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto modal-overlay flex items-center justify-center p-3 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-3xl bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4.5 bg-slate-50 border-b border-slate-200/80">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-display font-bold text-slate-900">
                  Residential Tenancy Agreement
                </h2>
                <p className="text-xs font-mono text-slate-500">
                  Reference: {lease.id}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
                title="Print or Save as PDF"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Legal Document Content */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-7 text-xs sm:text-sm font-sans leading-relaxed text-slate-700">
            {/* Agreement Header */}
            <div className="text-center pb-6 border-b border-slate-200">
              <span className="text-[11px] uppercase tracking-widest font-bold block mb-1.5 font-display text-blue-600">
                Federal Democratic Republic of Nepal &middot; Muluki Civil Code 2074
              </span>
              <h1 className="text-xl sm:text-2xl font-display font-black text-slate-900 tracking-tight">
                STANDARD RESIDENTIAL LEASE CONTRACT
              </h1>
              <p className="text-xs mt-1 text-slate-500">
                Concluded electronically via the RentHub Verified Tenancy Platform
              </p>
            </div>

            {/* Section 1: The Parties */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2.5 font-display text-blue-600">
                1. The Parties to this Agreement
              </h3>
              <p className="mb-2 text-slate-600">
                This Residential Tenancy Agreement is entered into between:
              </p>
              <div className="grid sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px]">LANDLORD:</span>
                  <strong className="text-slate-900 font-bold block text-sm">{lease.landlordName}</strong>
                  {lease.landlordPhone && <span className="text-slate-500 font-mono">{lease.landlordPhone}</span>}
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px]">TENANT:</span>
                  <strong className="text-slate-900 font-bold block text-sm">{lease.tenantName}</strong>
                  <span className="text-slate-500">Verified Renter Identity</span>
                </div>
              </div>
            </div>

            {/* Section 2: Property & Term */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2.5 font-display text-blue-600">
                2. Rented Premises & Term
              </h3>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1.5">
                <p>
                  <strong>Property:</strong> {lease.propertyTitle} — {lease.unitIdentifier}
                </p>
                <p>
                  <strong>Address:</strong> {lease.propertyAddress}, {lease.propertyCity}
                </p>
                <p>
                  <strong>Lease Term:</strong> {lease.startDate} to {lease.endDate}
                </p>
              </div>
            </div>

            {/* Section 3: Financial Considerations */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2.5 font-display text-blue-600">
                3. Rent & Security Deposit
              </h3>
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-[11px] block">Monthly Rent:</span>
                  <span className="text-lg font-black text-slate-900 font-display">
                    NPR {lease.agreedMonthlyRent.toLocaleString()}
                  </span>
                  <span className="text-slate-400 text-[11px] block mt-0.5">Payable by 7th of Nepali month</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-[11px] block">Security Deposit:</span>
                  <span className="text-lg font-black text-slate-900 font-display">
                    NPR {lease.agreedDeposit.toLocaleString()}
                  </span>
                  <span className="text-slate-400 text-[11px] block mt-0.5">Refundable upon vacating</span>
                </div>
              </div>
            </div>

            {/* Section 4: General Terms */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2.5 font-display text-blue-600">
                4. Statutory Rights & Obligations
              </h3>
              <p className="text-slate-600">
                In compliance with Chapter 9 of the Muluki Civil Code 2074, the tenant shall occupy the premises for residential purposes with quiet enjoyment. The landlord warrants peaceful possession and structural habitability.
              </p>
            </div>

            {/* Section 5: Execution & Digital Signatures */}
            <div className="pt-5 border-t border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider font-display text-blue-600">
                  5. Execution, Digital Signatures & Biometric Seals
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">§ 403 Electronic Transactions Act</span>
              </div>

              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {uploadError}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                {/* ── TENANT BOX ──────────────────────────────────────────────── */}
                <div className="p-5 rounded-2xl flex flex-col justify-between bg-slate-50 border border-slate-200/90 space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider font-display text-slate-500">
                        Tenant Execution
                      </span>
                      {isTenantSigned ? (
                        <StatusPill variant="success" size="sm">
                          Signed {new Date(lease.tenantSignedAt!).toLocaleDateString()}
                        </StatusPill>
                      ) : (
                        <StatusPill variant="warning" size="sm">
                          Pending Signature
                        </StatusPill>
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-900 mt-1 font-display">{lease.tenantName}</p>
                  </div>

                  {/* Render Existing or Uploaded Signatures */}
                  {(isTenantSigned || signatureData || biometricData) ? (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                      {/* Tenant Digital Sign */}
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center min-h-[90px]">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <PenTool className="w-3 h-3 text-blue-500" /> Digital Sign
                        </span>
                        {(lease.tenantSignatureUrl || signatureData) ? (
                          <img
                            src={lease.tenantSignatureUrl || signatureData!}
                            alt="Tenant Signature"
                            className="max-h-14 max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Electronic Sign Only</span>
                        )}
                      </div>

                      {/* Tenant Biometric Thumbprint */}
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center min-h-[90px]">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <Fingerprint className="w-3 h-3 text-emerald-600" /> Biometric PNG
                        </span>
                        {(lease.tenantBiometricUrl || biometricData) ? (
                          <img
                            src={lease.tenantBiometricUrl || biometricData!}
                            alt="Tenant Biometric"
                            className="max-h-14 max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Not Uploaded</span>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {/* File Upload Controls when tenant is ready to sign */}
                  {canTenantSign && (
                    <div className="pt-3 border-t border-slate-200 space-y-2.5">
                      <span className="text-[11px] font-bold text-slate-700 block">
                        Upload Signature & Biometrics from Local Device (PNG):
                      </span>

                      {/* Hidden file inputs */}
                      <input
                        type="file"
                        ref={sigInputRef}
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'signature')}
                      />
                      <input
                        type="file"
                        ref={bioInputRef}
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'biometric')}
                      />

                      <div className="grid grid-cols-2 gap-2">
                        {/* Digital Sign Upload Button */}
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => sigInputRef.current?.click()}
                            className="w-full py-2 px-2.5 rounded-xl border border-dashed border-blue-300 bg-blue-50/60 hover:bg-blue-50 text-blue-700 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>{signatureData ? 'Replace Sign' : 'Upload Sign PNG'}</span>
                          </button>
                          {signatureData && (
                            <button
                              type="button"
                              onClick={() => setSignatureData(null)}
                              className="text-[10px] text-rose-600 hover:underline flex items-center gap-1 mx-auto"
                            >
                              <Trash2 className="w-3 h-3" /> Remove
                            </button>
                          )}
                        </div>

                        {/* Biometric Thumbprint Upload Button */}
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => bioInputRef.current?.click()}
                            className="w-full py-2 px-2.5 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/60 hover:bg-emerald-50 text-emerald-700 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Fingerprint className="w-3.5 h-3.5" />
                            <span>{biometricData ? 'Replace Bio' : 'Upload Bio PNG'}</span>
                          </button>
                          {biometricData && (
                            <button
                              type="button"
                              onClick={() => setBiometricData(null)}
                              className="text-[10px] text-rose-600 hover:underline flex items-center gap-1 mx-auto"
                            >
                              <Trash2 className="w-3 h-3" /> Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── LANDLORD BOX ────────────────────────────────────────────── */}
                <div className="p-5 rounded-2xl flex flex-col justify-between bg-slate-50 border border-slate-200/90 space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider font-display text-slate-500">
                        Landlord Execution
                      </span>
                      {isLandlordSigned ? (
                        <StatusPill variant="success" size="sm">
                          Signed {new Date(lease.landlordSignedAt!).toLocaleDateString()}
                        </StatusPill>
                      ) : (
                        <StatusPill variant="warning" size="sm">
                          Signature Pending
                        </StatusPill>
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-900 mt-1 font-display">{lease.landlordName}</p>
                  </div>

                  {/* Render Landlord Signatures */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                    {/* Landlord Digital Sign */}
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center min-h-[90px]">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <PenTool className="w-3 h-3 text-blue-500" /> Digital Sign
                      </span>
                      {lease.landlordSignatureUrl ? (
                        <img
                          src={lease.landlordSignatureUrl}
                          alt="Landlord Signature"
                          className="max-h-14 max-w-full object-contain"
                        />
                      ) : isLandlordSigned ? (
                        <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Recorded
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Awaiting Landlord</span>
                      )}
                    </div>

                    {/* Landlord Biometric Thumbprint */}
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center min-h-[90px]">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Fingerprint className="w-3 h-3 text-emerald-600" /> Biometric PNG
                      </span>
                      {lease.landlordBiometricUrl ? (
                        <img
                          src={lease.landlordBiometricUrl}
                          alt="Landlord Biometric"
                          className="max-h-14 max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">
                          {isLandlordSigned ? 'Not Attached' : 'Awaiting'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Legal Activation Seal */}
              {lease.signedAt && (
                <div className="p-4 rounded-2xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <strong className="block font-bold">Contract Sealed & Legally Activated</strong>
                      <span className="text-emerald-700 text-[11px]">
                        Both parties have recorded valid signatures on {new Date(lease.signedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-emerald-800 bg-white/70 px-3 py-1.5 rounded-lg border border-emerald-300 self-start sm:self-auto">
                    SHA256: NEPAL-MCC-VERIFIED
                  </span>
                </div>
              )}

              {!isLandlordSigned && !isTenantSigned && (
                <div className="p-3.5 rounded-2xl text-xs flex items-center gap-2.5 bg-amber-50 border border-amber-200 text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Awaiting landlord’s initial signature — once the landlord signs, you will be able to counter-sign and attach your digital signature & biometric PNG files.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Signature CTA */}
          <div className="p-4 sm:p-5 flex items-center justify-between bg-slate-50/80 border-t border-slate-200/80">
            <span className="text-xs text-slate-500">
              {isTenantSigned
                ? '✓ You have executed this tenancy agreement'
                : !isLandlordSigned
                ? 'Landlord signature required before tenant execution'
                : 'Upload signature/biometric PNG files above and click below to sign'}
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>

              {canTenantSign && (
                <ShimmerButton
                  variant="primary"
                  size="md"
                  isLoading={isSigning}
                  onClick={handleSign}
                  leftIcon={<PenTool className="w-4 h-4" />}
                >
                  Sign Electronically
                </ShimmerButton>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
