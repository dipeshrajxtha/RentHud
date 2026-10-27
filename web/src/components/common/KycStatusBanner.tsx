/**
 * KycStatusBanner — Inline verification status indicator.
 * Shows a prominent banner when user is unverified, pending, or rejected.
 */

import React from 'react';
import { ShieldCheck, Clock, AlertTriangle, ShieldAlert } from 'lucide-react';

interface KycStatusBannerProps {
  kycStatus: 'none' | 'pending' | 'approved' | 'rejected';
  rejectionReason?: string | null;
  onStartKyc: () => void;
  isLandlord?: boolean;
}

export function KycStatusBanner({ kycStatus, rejectionReason, onStartKyc, isLandlord }: KycStatusBannerProps) {
  if (kycStatus === 'approved') return null;

  const action = isLandlord ? 'list properties' : 'apply for rentals';

  if (kycStatus === 'pending') {
    return (
      <div className="mb-5 flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
        <Clock className="w-5 h-5 text-amber-600 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-800">KYC verification under review</p>
          <p className="text-xs text-amber-600 mt-0.5">Your documents are being reviewed. You'll be able to {action} once approved.</p>
        </div>
      </div>
    );
  }

  if (kycStatus === 'rejected') {
    return (
      <div className="mb-5 flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-200">
        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-red-800">KYC verification rejected</p>
          <p className="text-xs text-red-600 mt-0.5">{rejectionReason || 'Please re-submit valid documents.'}</p>
        </div>
        <button
          onClick={onStartKyc}
          className="px-4 py-2 text-xs font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition shrink-0"
        >
          Re-submit
        </button>
      </div>
    );
  }

  // kycStatus === 'none'
  return (
    <div className="mb-5 flex items-center gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-200">
      <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-blue-800">Identity verification required</p>
        <p className="text-xs text-blue-600 mt-0.5">Complete KYC verification to {action}. Upload your citizenship and required documents.</p>
      </div>
      <button
        onClick={onStartKyc}
        className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 transition-all shrink-0"
      >
        Verify Now
      </button>
    </div>
  );
}
