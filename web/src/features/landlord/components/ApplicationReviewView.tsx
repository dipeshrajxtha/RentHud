import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  CheckCircle2,
  Phone,
  Mail,
  Calendar,
  ArrowRight,
  X,
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
          <p className="text-xs text-slate-500 mt-1">
            Review applicant credentials, evaluate tenancy requests, and approve draft digital leases.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 font-display">
          {[
            { id: 'ALL', label: `All (${applications.length})` },
            { id: 'PENDING', label: `Pending (${applications.filter((a) => a.status === 'pending').length})` },
            { id: 'APPROVED', label: `Approved (${applications.filter((a) => a.status === 'approved').length})` },
            { id: 'REJECTED', label: 'Rejected' },
          ].map((tab) => {
            const isSelected = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id as AppFilter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Applications List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 font-display">No applications in this category</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            When prospective renters browse your listings and apply for available units, their applications will appear here for review.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => {
            const isPending = app.status === 'pending';
            const isApproved = app.status === 'approved';

            return (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4 hover:border-slate-300 transition-all"
              >
                {/* Top Applicant & Property Summary */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    {app.tenant?.avatarUrl ? (
                      <img
                        src={app.tenant.avatarUrl}
                        alt={app.tenant.name}
                        className="w-12 h-12 rounded-full object-cover shrink-0 border border-slate-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full text-white font-bold text-base flex items-center justify-center shrink-0 font-display bg-brand-600 shadow-xs">
                        {app.tenant?.name?.[0] ?? 'T'}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900 font-display">{app.tenant?.name}</h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-display uppercase tracking-wider ${
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

                      <p className="text-xs mt-1 text-slate-600">
                        Applied for: <strong className="text-slate-900">{app.property?.title}</strong> ({app.unit?.unitIdentifier})
                      </p>

                      <div className="flex items-center gap-3 text-[11px] mt-2 flex-wrap text-slate-500">
                        {app.tenant?.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-brand-600" />
                            {app.tenant.email}
                          </span>
                        )}
                        {app.tenant?.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-brand-600" />
                            {app.tenant.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-brand-600" />
                          Move-in: <strong className="text-slate-800">{app.proposedMoveIn || 'Flexible'}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-base font-bold text-slate-900 font-display">
                      NPR {app.unit?.monthlyRent?.toLocaleString()}
                      <span className="text-xs font-normal text-slate-500"> / mo</span>
                    </p>
                    <p className="text-[11px] mt-0.5 text-slate-500">
                      Deposit: NPR {app.unit?.securityDeposit?.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Applicant Message Note */}
                {app.message && (
                  <div className="p-3.5 rounded-xl text-xs leading-relaxed italic bg-slate-50 border border-slate-200 text-slate-700">
                    "{app.message}"
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
                  <span className="text-[10px] font-mono text-slate-400">
                    Application ID: {app.id.slice(0, 8)}
                  </span>

                  <div className="flex items-center gap-2">
                    {isPending && (
                      <>
                        <button
                          type="button"
                          onClick={() => setRejectingApp(app)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors font-display"
                        >
                          Reject
                        </button>
                        {app.unit?.availabilityStatus && app.unit.availabilityStatus !== 'AVAILABLE' ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 font-display">
                            Unit {app.unit.availabilityStatus.toLowerCase().replace('_', ' ')}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedApp(app)}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors flex items-center gap-1.5 font-display shadow-xs"
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
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5 font-display"
                      >
                        <span>View Lease Status</span>
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

      {/* Approve Confirmation Modal */}
      <AnimatePresence>
        {selectedApp && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-7 max-w-md w-full space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 font-display">Confirm Application Approval</h3>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs leading-relaxed text-slate-600">
                Approving this application will automatically generate a legally binding Digital Tenancy Agreement under Nepal Muluki Civil Code 2074 for{' '}
                <strong className="text-slate-900">{selectedApp.tenant?.name}</strong> for unit{' '}
                <strong className="text-slate-900">{selectedApp.unit?.unitIdentifier}</strong>.
              </p>

              <div className="p-3.5 rounded-xl space-y-1.5 text-xs bg-slate-50 border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Monthly Rent:</span>
                  <span className="font-bold text-slate-900 font-display">NPR {selectedApp.unit?.monthlyRent?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Security Deposit:</span>
                  <span className="font-bold text-slate-900 font-display">NPR {selectedApp.unit?.securityDeposit?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Proposed Move-in:</span>
                  <span className="text-slate-900">{selectedApp.proposedMoveIn || 'Immediate'}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors font-display"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleConfirmApprove(selectedApp)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors font-display shadow-xs disabled:opacity-50"
                >
                  {isProcessing ? 'Generating Lease…' : 'Approve & Issue Lease'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectingApp && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-7 max-w-md w-full space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 font-display">Reject Application</h3>
                <button
                  onClick={() => setRejectingApp(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600">
                Reject application from <strong className="text-slate-900">{rejectingApp.tenant?.name}</strong> for{' '}
                {rejectingApp.unit?.unitIdentifier}.
              </p>

              <div>
                <label className="text-xs font-semibold block mb-1.5 font-display text-slate-700">
                  Reason for rejection
                </label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value="Unit no longer available">Unit no longer available / leased to another tenant</option>
                  <option value="Incompatible move-in date">Incompatible move-in timeline</option>
                  <option value="Application qualifications not met">Application qualifications not met</option>
                  <option value="Other">Other reason</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingApp(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors font-display"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleConfirmReject}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors font-display shadow-xs disabled:opacity-50"
                >
                  {isProcessing ? 'Rejecting…' : 'Confirm Rejection'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
