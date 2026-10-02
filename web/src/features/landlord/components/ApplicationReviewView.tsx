import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import type { LandlordApplication } from '@/types/landlord';

type AppFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

interface ApplicationReviewViewProps {
  applications: LandlordApplication[];
  onApprove: (applicationId: string) => Promise<void>;
  onReject: (applicationId: string, reason?: string) => Promise<void>;
  onViewLeases: () => void;
}

export function ApplicationReviewView({
  applications,
  onApprove,
  onReject,
  onViewLeases,
}: ApplicationReviewViewProps) {
  const [filter, setFilter] = useState<AppFilter>('ALL');
  const [selectedApp, setSelectedApp] = useState<LandlordApplication | null>(null);
  const [rejectingApp, setRejectingApp] = useState<LandlordApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('Unit no longer available');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filtered = applications.filter((a) => {
    if (filter === 'PENDING') return a.status === 'pending';
    if (filter === 'APPROVED') return a.status === 'approved';
    if (filter === 'REJECTED') return a.status === 'rejected';
    return true;
  });

  const handleConfirmApprove = async (app: LandlordApplication) => {
    setErrorMsg(null);
    setIsProcessing(true);
    try {
      await onApprove(app.id);
      setSelectedApp(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to approve application');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingApp) return;
    setErrorMsg(null);
    setIsProcessing(true);
    try {
      await onReject(rejectingApp.id, rejectReason);
      setRejectingApp(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reject application');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight">
            Tenant Application Screening
          </h1>
          <p className="text-xs text-slate-500">
            Review applicant credentials, evaluate tenancy requests, and approve draft digital leases.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: `All (${applications.length})` },
            { id: 'PENDING', label: `Pending (${applications.filter((a) => a.status === 'pending').length})` },
            { id: 'APPROVED', label: `Approved (${applications.filter((a) => a.status === 'approved').length})` },
            { id: 'REJECTED', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as AppFilter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Applications List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No applications in this category</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            When prospective renters browse your listings and apply for available units, their applications will appear here for review.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => {
            const isPending = app.status === 'pending';
            const isApproved = app.status === 'approved';
            const isRejected = app.status === 'rejected';

            return (
              <div
                key={app.id}
                className={`bg-white rounded-3xl border p-5 sm:p-6 shadow-xs transition-all space-y-4 ${
                  isApproved
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : isRejected
                    ? 'border-slate-200 bg-slate-50/60 opacity-75'
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {/* Top Applicant & Property Summary */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    {app.tenant?.avatarUrl ? (
                      <img
                        src={app.tenant.avatarUrl}
                        alt={app.tenant.name}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 font-bold text-base flex items-center justify-center shrink-0">
                        {app.tenant?.name?.[0] ?? 'T'}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900">{app.tenant?.name}</h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800'
                              : isPending
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 mt-0.5">
                        Applied for: <strong className="text-slate-800">{app.property?.title}</strong> ({app.unit?.unitIdentifier})
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2 flex-wrap">
                        {app.tenant?.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {app.tenant.email}
                          </span>
                        )}
                        {app.tenant?.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {app.tenant.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          Move-in: <strong className="text-slate-700">{app.proposedMoveIn || 'Flexible'}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-base font-bold text-slate-900">
                      NPR {app.unit?.monthlyRent?.toLocaleString()}
                      <span className="text-xs font-normal text-slate-500"> / mo</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Deposit: NPR {app.unit?.securityDeposit?.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Applicant Message Note */}
                {app.message && (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed italic">
                    "{app.message}"
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-[10px] text-slate-400">
                    Application ID: <span className="font-mono">{app.id.slice(0, 8)}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    {isPending && (
                      <>
                        <button
                          type="button"
                          onClick={() => setRejectingApp(app)}
                          className="px-3.5 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors"
                        >
                          Reject
                        </button>
                        {app.unit?.availabilityStatus && app.unit.availabilityStatus !== 'AVAILABLE' ? (
                          <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-[11px] font-semibold">
                            Unit {app.unit.availabilityStatus.toLowerCase().replace('_', ' ')}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedApp(app)}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Approve & Generate Lease</span>
                          </button>
                        )}
                      </>
                    )}

                    {isApproved && (
                      <button
                        type="button"
                        onClick={onViewLeases}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
                      >
                        <span>View Lease in Tenancies Hub</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* APPROVE CONFIRMATION MODAL */}
      <AnimatePresence>
        {selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">Approve Rental Application?</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Approving <strong className="text-slate-800">{selectedApp.tenant?.name}</strong> will:
                </p>
                <ul className="text-xs text-slate-600 space-y-1.5 mt-2 list-disc pl-4">
                  <li>Reserve <strong>{selectedApp.property?.title} ({selectedApp.unit?.unitIdentifier})</strong>.</li>
                  <li>Automatically draft a bilingual <strong>Digital Lease Agreement</strong> under Nepal's Muluki Civil Code 2074.</li>
                  <li>Enable digital signing for both you and the tenant.</li>
                </ul>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleConfirmApprove(selectedApp)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  {isProcessing ? 'Approving…' : 'Confirm Approval'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REJECT MODAL */}
      <AnimatePresence>
        {rejectingApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <XCircle className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">Decline Application</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Please specify a reason for declining the application from {rejectingApp.tenant?.name}.
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <label className="font-semibold text-slate-700 block">Reason</label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="Unit no longer available">Unit no longer available</option>
                  <option value="Incompatible move-in timeline">Incompatible move-in timeline</option>
                  <option value="Application criteria not met">Application criteria not met</option>
                  <option value="Other residential preference">Other residential preference</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingApp(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleConfirmReject}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  {isProcessing ? 'Rejecting…' : 'Decline Application'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
