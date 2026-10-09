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
          <h1 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight">
            Tenant Application Screening
          </h1>
          <p className="text-xs" style={{ color: '#5a7299' }}>
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
                  isSelected ? 'text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
                style={{
                  background: isSelected ? 'rgba(46, 139, 255, 0.25)' : 'rgba(255, 255, 255, 0.02)',
                  border: isSelected ? '1px solid rgba(46, 139, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Applications List */}
      {filtered.length === 0 ? (
        <div className="card-premium p-12 text-center">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-bold text-white font-display">No applications in this category</h3>
          <p className="text-xs max-w-sm mx-auto mt-1" style={{ color: '#7187a5' }}>
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
                className="card-premium p-5 sm:p-6 space-y-4 transition-all"
                style={{
                  border: isApproved
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : isRejected
                    ? '1px solid rgba(255, 255, 255, 0.05)'
                    : '1px solid rgba(46, 139, 255, 0.2)',
                }}
              >
                {/* Top Applicant & Property Summary */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    {app.tenant?.avatarUrl ? (
                      <img
                        src={app.tenant.avatarUrl}
                        alt={app.tenant.name}
                        className="w-12 h-12 rounded-full object-cover shrink-0"
                        style={{ border: '2px solid rgba(46, 139, 255, 0.3)' }}
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full text-white font-bold text-base flex items-center justify-center shrink-0 font-display"
                        style={{ background: 'linear-gradient(135deg, #1567f5, #7c3aed)' }}
                      >
                        {app.tenant?.name?.[0] ?? 'T'}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-white font-display">{app.tenant?.name}</h3>
                        <span
                          className={`badge font-display ${
                            isApproved
                              ? 'badge-success'
                              : isPending
                              ? 'badge-warning'
                              : 'badge-error'
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>

                      <p className="text-xs mt-1" style={{ color: '#7187a5' }}>
                        Applied for: <strong className="text-white">{app.property?.title}</strong> ({app.unit?.unitIdentifier})
                      </p>

                      <div className="flex items-center gap-3 text-[11px] mt-2 flex-wrap" style={{ color: '#94aac5' }}>
                        {app.tenant?.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-brand-400" />
                            {app.tenant.email}
                          </span>
                        )}
                        {app.tenant?.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-brand-400" />
                            {app.tenant.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-brand-400" />
                          Move-in: <strong className="text-white">{app.proposedMoveIn || 'Flexible'}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-base font-bold text-white font-display">
                      NPR {app.unit?.monthlyRent?.toLocaleString()}
                      <span className="text-xs font-normal" style={{ color: '#5a7299' }}> / mo</span>
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: '#7187a5' }}>
                      Deposit: NPR {app.unit?.securityDeposit?.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Applicant Message Note */}
                {app.message && (
                  <div
                    className="p-3.5 rounded-2xl text-xs leading-relaxed italic"
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      color: '#c8d8f0',
                    }}
                  >
                    "{app.message}"
                  </div>
                )}

                {/* Action Buttons */}
                <div
                  className="pt-2 flex items-center justify-between gap-3"
                  style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}
                >
                  <span className="text-[10px] font-mono" style={{ color: '#5a7299' }}>
                    Application ID: {app.id.slice(0, 8)}
                  </span>

                  <div className="flex items-center gap-2">
                    {isPending && (
                      <>
                        <button
                          type="button"
                          onClick={() => setRejectingApp(app)}
                          className="btn-ghost btn-sm text-rose-400 hover:text-rose-300 font-display"
                        >
                          Reject
                        </button>
                        {app.unit?.availabilityStatus && app.unit.availabilityStatus !== 'AVAILABLE' ? (
                          <span className="badge-warning font-display">
                            Unit {app.unit.availabilityStatus.toLowerCase().replace('_', ' ')}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedApp(app)}
                            className="btn-primary btn-sm flex items-center gap-1.5 font-display shine-hover"
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
                        className="btn-secondary btn-sm flex items-center gap-1.5 font-display"
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
          <div className="fixed inset-0 z-50 overflow-y-auto modal-overlay flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card-premium p-6 sm:p-7 max-w-md w-full space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white font-display">Confirm Application Approval</h3>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs leading-relaxed" style={{ color: '#94aac5' }}>
                Approving this application will automatically generate a legally binding Digital Tenancy Agreement under Nepal Muluki Civil Code 2074 for{' '}
                <strong className="text-white">{selectedApp.tenant?.name}</strong> for unit{' '}
                <strong className="text-white">{selectedApp.unit?.unitIdentifier}</strong>.
              </p>

              <div
                className="p-3.5 rounded-xl space-y-1.5 text-xs"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <div className="flex justify-between">
                  <span style={{ color: '#5a7299' }}>Monthly Rent:</span>
                  <span className="font-bold text-white font-display">NPR {selectedApp.unit?.monthlyRent?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#5a7299' }}>Security Deposit:</span>
                  <span className="font-bold text-white font-display">NPR {selectedApp.unit?.securityDeposit?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#5a7299' }}>Proposed Move-in:</span>
                  <span className="text-white">{selectedApp.proposedMoveIn || 'Immediate'}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="btn-ghost btn-md font-display"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleConfirmApprove(selectedApp)}
                  className="btn-primary btn-md font-display shine-hover"
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
          <div className="fixed inset-0 z-50 overflow-y-auto modal-overlay flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card-premium p-6 sm:p-7 max-w-md w-full space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white font-display">Reject Application</h3>
                <button
                  onClick={() => setRejectingApp(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs" style={{ color: '#94aac5' }}>
                Reject application from <strong className="text-white">{rejectingApp.tenant?.name}</strong> for{' '}
                {rejectingApp.unit?.unitIdentifier}.
              </p>

              <div>
                <label className="text-xs font-semibold block mb-1.5 font-display" style={{ color: '#94aac5' }}>
                  Reason for rejection
                </label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="form-select text-xs"
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
                  className="btn-ghost btn-md font-display"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleConfirmReject}
                  className="btn-danger btn-md font-display"
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
