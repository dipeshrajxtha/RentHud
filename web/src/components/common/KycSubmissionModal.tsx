/**
 * KycSubmissionModal — Upload identity documents for KYC verification.
 *
 * Adapts required documents based on user role:
 *   Tenant:   Citizenship (front + back) + Police Report
 *   Landlord: Citizenship (front + back) + Ownership Document (+ optional Business Reg)
 */

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, FileCheck2, AlertTriangle, Clock, CheckCircle2, ShieldCheck, Camera, FileText } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';

interface KycSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentKyc: any | null;
  onSubmitted: () => void;
}

type DocField = 'citizenshipFrontUrl' | 'citizenshipBackUrl' | 'policeReportUrl' | 'ownershipDocumentUrl' | 'businessRegistrationUrl';

interface DocSlot {
  key: DocField;
  label: string;
  required: boolean;
  icon: React.ElementType;
  description: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function KycSubmissionModal({ isOpen, onClose, currentKyc, onSubmitted }: KycSubmissionModalProps) {
  const { user, accessToken } = useAuth();
  const isLandlord = user?.roles?.includes('landlord');

  const [docs, setDocs] = useState<Record<DocField, string | null>>({
    citizenshipFrontUrl: null,
    citizenshipBackUrl: null,
    policeReportUrl: null,
    ownershipDocumentUrl: null,
    businessRegistrationUrl: null,
  });

  const [previews, setPreviews] = useState<Record<DocField, string | null>>({
    citizenshipFrontUrl: null,
    citizenshipBackUrl: null,
    policeReportUrl: null,
    ownershipDocumentUrl: null,
    businessRegistrationUrl: null,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRefs = useRef<Partial<Record<DocField, HTMLInputElement | null>>>({});

  const docSlots: DocSlot[] = isLandlord
    ? [
        { key: 'citizenshipFrontUrl', label: 'Citizenship Front', required: true, icon: FileText, description: 'Front side of your citizenship card' },
        { key: 'citizenshipBackUrl', label: 'Citizenship Back', required: true, icon: FileText, description: 'Back side of your citizenship card' },
        { key: 'ownershipDocumentUrl', label: 'Ownership Document', required: true, icon: FileCheck2, description: 'Property ownership / land revenue receipt' },
        { key: 'businessRegistrationUrl', label: 'Business Registration', required: false, icon: FileCheck2, description: 'Business registration certificate (optional)' },
      ]
    : [
        { key: 'citizenshipFrontUrl', label: 'Citizenship Front', required: true, icon: FileText, description: 'Front side of your citizenship card' },
        { key: 'citizenshipBackUrl', label: 'Citizenship Back', required: true, icon: FileText, description: 'Back side of your citizenship card' },
        { key: 'policeReportUrl', label: 'Police Report', required: true, icon: ShieldCheck, description: 'Recent police report / clearance certificate' },
      ];

  const handleFileSelect = useCallback(async (key: DocField, file: File) => {
    try {
      const base64 = await fileToBase64(file);
      setDocs(prev => ({ ...prev, [key]: base64 }));
      setPreviews(prev => ({ ...prev, [key]: URL.createObjectURL(file) }));
      setError(null);
    } catch {
      setError('Failed to read file. Please try again.');
    }
  }, []);

  const handleDrop = useCallback((key: DocField) => (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(key, file);
    }
  }, [handleFileSelect]);

  const handleSubmit = async () => {
    setError(null);

    // Validate required docs
    for (const slot of docSlots) {
      if (slot.required && !docs[slot.key]) {
        setError(`${slot.label} is required`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/kyc/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify(docs),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload.error?.message || 'Failed to submit KYC');
      }
      onSubmitted();
    } catch (err: any) {
      setError(err.message || 'Failed to submit KYC documents');
    } finally {
      setSubmitting(false);
    }
  };

  // If already approved, show status
  const isApproved = currentKyc?.status === 'approved';
  const isPending = currentKyc?.status === 'pending';
  const isRejected = currentKyc?.status === 'rejected';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative z-10 w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden my-auto"
          >
            {/* Header */}
            <div className="relative px-6 py-5 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Identity Verification</h2>
                  <p className="text-blue-100 text-sm mt-0.5">
                    {isLandlord ? 'Verify your identity to list properties' : 'Verify your identity to apply for rentals'}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 max-h-[65vh] overflow-y-auto">
              {/* Status banners */}
              {isApproved && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 mb-5">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-emerald-800">Verified ✓</p>
                    <p className="text-sm text-emerald-600">Your identity has been verified. You can now {isLandlord ? 'list properties' : 'apply for rentals'}.</p>
                  </div>
                </div>
              )}

              {isPending && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 mb-5">
                  <Clock className="w-6 h-6 text-amber-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-800">Under Review</p>
                    <p className="text-sm text-amber-600">Your documents are being reviewed by our team. This usually takes 1-2 business days.</p>
                  </div>
                </div>
              )}

              {isRejected && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 mb-5">
                  <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-red-800">Verification Rejected</p>
                    <p className="text-sm text-red-600">{currentKyc?.rejection_reason || 'Your documents were rejected. Please re-submit with valid documents.'}</p>
                  </div>
                </div>
              )}

              {/* Document upload slots (only show form if not approved and not pending) */}
              {!isApproved && !isPending && (
                <>
                  <p className="text-sm text-slate-500 mb-4">
                    Upload clear photos of the following documents. All images should be legible and unobstructed.
                  </p>

                  <div className="grid gap-4">
                    {docSlots.map((slot) => (
                      <div key={slot.key} className="group">
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                          <slot.icon className="w-4 h-4 text-blue-600" />
                          {slot.label}
                          {slot.required && <span className="text-red-500">*</span>}
                        </label>

                        {previews[slot.key] ? (
                          <div className="relative rounded-2xl overflow-hidden border-2 border-blue-200 bg-blue-50">
                            <img
                              src={previews[slot.key]!}
                              alt={slot.label}
                              className="w-full h-40 object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                            <div className="absolute bottom-3 left-3 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <span className="text-white text-xs font-medium">{slot.label} uploaded</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setDocs(prev => ({ ...prev, [slot.key]: null }));
                                setPreviews(prev => ({ ...prev, [slot.key]: null }));
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => fileInputRefs.current[slot.key]?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop(slot.key)}
                            className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all group-hover:shadow-sm"
                          >
                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                              <Camera className="w-5 h-5 text-blue-600" />
                            </div>
                            <p className="text-sm text-slate-600 font-medium">{slot.description}</p>
                            <p className="text-xs text-slate-400">Click to upload or drag & drop</p>
                          </div>
                        )}

                        <input
                          ref={(el) => { fileInputRefs.current[slot.key] = el; }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileSelect(slot.key, file);
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {error && (
                    <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {!isApproved && !isPending && (
              <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-4 flex items-center justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Submit for Verification
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
