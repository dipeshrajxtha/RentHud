/**
 * ApplicationTrackingView Component
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  FileText,
  CheckCircle,
  Building,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import type { RentalApplication } from '@/types/tenant';
import { tenantService } from '@/features/tenant/tenant.service';

interface ApplicationTrackingViewProps {
  applications: RentalApplication[];
  onRefresh: () => void;
  onOpenLeaseModal: () => void;
  onBrowseMore: () => void;
}

export function ApplicationTrackingView({
  applications,
  onRefresh,
  onOpenLeaseModal,
  onBrowseMore,
}: ApplicationTrackingViewProps) {
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this application?')) return;
    setCancellingId(id);
    try {
      await tenantService.cancelApplication(id);
      onRefresh();
    } finally {
      setCancellingId(null);
    }
  };

  const STEPS = [
    { label: 'Submitted', desc: 'Application received' },
    { label: 'Landlord Review', desc: 'Screening credentials' },
    { label: 'Verification', desc: 'Background & employment check' },
    { label: 'Lease Offer', desc: 'Agreement generated' },
    { label: 'Active Tenancy', desc: 'Signed by both parties' },
  ];

  function getStepIndex(status: RentalApplication['status']): number {
    switch (status) {
      case 'pending':
        return 1;
      case 'approved':
        return 3;
      case 'rejected':
      case 'cancelled':
        return 0;
      default:
        return 1;
    }
  }

  if (applications.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
          <FileText className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-display font-semibold text-slate-900">No Applications Yet</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          When you submit rental applications for available units in Kathmandu Valley, you can track their verification and approval progress here.
        </p>
        <button
          onClick={onBrowseMore}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
        >
          Explore Rental Listings
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-semibold text-slate-900">My Rental Applications</h2>
        <p className="text-xs text-slate-500">Track application stages, landlord reviews, and legal lease offers</p>
      </div>

      <div className="grid gap-6">
        {applications.map((app) => {
          const activeIndex = getStepIndex(app.status);
          const isCancelled = app.status === 'cancelled';
          const isRejected = app.status === 'rejected';
          const isApproved = app.status === 'approved';

          return (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                    <Building className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs text-slate-400">ID: {app.id}</span>
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : isCancelled || isRejected
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {app.status.toUpperCase()}
                      </span>
                    </div>

                    <h3 className="text-base font-display font-semibold text-slate-900">{app.property?.title ?? 'Rental Property'}</h3>
                    <p className="text-xs text-slate-500">{app.unit?.unitIdentifier ?? 'Unit'} · {app.property?.address ?? ''}{app.property?.city ? `, ${app.property.city}` : ''}</p>
                  </div>
                </div>

                <div className="sm:text-right">
                  <div className="text-base font-display font-bold text-slate-900">
                    NPR {app.unit?.monthlyRent != null ? app.unit.monthlyRent.toLocaleString() : 'N/A'}
                    <span className="text-xs font-normal text-slate-400"> / mo</span>
                  </div>
                  <span className="text-xs text-slate-500">Proposed Move-in: {app.proposedMoveIn || 'N/A'}</span>
                </div>
              </div>

              {/* Visual Pipeline Stepper */}
              {!isCancelled && !isRejected && (
                <div className="p-5 sm:p-6 bg-slate-50/50 border-b border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-4">
                    Application Lifecycle Progress
                  </div>
                  <div className="relative">
                    {/* Progress track connecting line */}
                    <div className="absolute top-3.5 left-[10%] right-[10%] h-0.5 bg-slate-200 -z-0" />
                    <div
                      className="absolute top-3.5 left-[10%] h-0.5 bg-brand-600 transition-all duration-500 -z-0"
                      style={{ width: `${(Math.min(activeIndex, 4) / 4) * 80}%` }}
                    />
                    <div className="grid grid-cols-5 gap-2 relative z-10">
                    {STEPS.map((step, idx) => {
                      const isCompleted = idx <= activeIndex;
                      const isCurrent = idx === activeIndex;

                      return (
                        <div key={step.label} className="text-center relative">
                          <div
                            className={`w-7 h-7 rounded-full mx-auto flex items-center justify-center text-xs font-semibold mb-2 transition-all ${
                              isCompleted
                                ? 'bg-brand-600 text-white shadow-xs ring-4 ring-brand-100'
                                : 'bg-slate-200 text-slate-500'
                            }`}
                          >
                            {isCompleted ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                          </div>
                          <p
                            className={`text-xs font-semibold leading-tight line-clamp-1 ${
                              isCurrent ? 'text-brand-700' : isCompleted ? 'text-slate-900' : 'text-slate-400'
                            }`}
                          >
                            {step.label}
                          </p>
                          <span className="text-[10px] text-slate-400 hidden sm:block mt-0.5">{step.desc}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

              {/* Bottom Actions & Details */}
              <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="text-slate-500">
                  <span>Landlord: <strong className="text-slate-700 font-medium">{app.landlord?.name ?? 'Property Owner'}</strong></span>
                  <span className="mx-2 text-slate-300">•</span>
                  <span>Submitted on {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'Recently'}</span>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  {app.status === 'pending' && (
                    <button
                      type="button"
                      disabled={cancellingId === app.id}
                      onClick={() => handleCancel(app.id)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors text-xs font-medium inline-flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{cancellingId === app.id ? 'Cancelling…' : 'Cancel Application'}</span>
                    </button>
                  )}

                  {isApproved && (
                    <button
                      type="button"
                      onClick={onOpenLeaseModal}
                      className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Review & Sign Lease Agreement</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
