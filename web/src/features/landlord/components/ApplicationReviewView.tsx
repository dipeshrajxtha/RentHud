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
import type { LandlordApplication, LandlordLease } from '@/types/landlord';
import { ShimmerButton, StatusPill, FilterTabs, FormSelect } from '@/components/ui';

type AppFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

interface ApplicationReviewViewProps {
  applications: LandlordApplication[];
  leases?: LandlordLease[];
  onApprove: (applicationId: string) => Promise<void>;
  onReject: (applicationId: string, reason?: string) => Promise<void>;
  onViewLeases: () => void;
}

export function ApplicationReviewView({
  applications,
  leases = [],
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
        <div className="font-display">
          <FilterTabs
            tabs={[
              { id: 'ALL', label: 'All', count: applications.length },
              {
                id: 'PENDING',
                label: 'Pending',
                count: applications.filter((a) => a.status === 'pending').length,
              },
              {
                id: 'APPROVED',
                label: 'Approved',
                count: applications.filter((a) => a.status === 'approved').length,
              },
              {
                id: 'REJECTED',
                label: 'Rejected',
                count: applications.filter((a) => a.status === 'rejected').length,
              },
            ]}
            activeId={filter}
            onChange={(id) => setFilter(id as AppFilter)}
          />
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
            const appLease = leases.find(
              (l) => l.rentalRequestId === app.id || l.unitId === app.unit?.id
            );
            const isLeaseActive = appLease?.status === 'active';
            const isAwaitingTenant =
              appLease?.status === 'pending_signature' &&
              appLease.landlordSignedAt &&
              !appLease.tenantSignedAt;
            const isAwaitingLandlord =
              appLease?.status === 'pending_signature' && !appLease.landlordSignedAt;

            return (
              <div
                key={app.id}
                className={`bg-white rounded-2xl border shadow-xs p-5 sm:p-6 space-y-4 transition-all ${
                  isLeaseActive
                    ? 'border-emerald-300 ring-1 ring-emerald-200/60'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
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
                        {isLeaseActive ? (
                          <StatusPill size="sm" variant="success" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                            Active Tenant
                          </StatusPill>
                        ) : isAwaitingTenant ? (
                          <StatusPill size="sm" variant="info">
                            Awaiting Tenant Sign
                          </StatusPill>
                        ) : isAwaitingLandlord ? (
                          <StatusPill size="sm" variant="warning">
                            Awaiting Countersign
                          </StatusPill>
                        ) : (
                          <StatusPill
                            size="sm"
                            variant={
                              isApproved ? 'info' : isPending ? 'warning' : 'danger'
                            }
                          >
                            {app.status}
                          </StatusPill>
                        )}
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
                        <ShimmerButton
                          variant="danger"
                          size="sm"
                          onClick={() => setRejectingApp(app)}
                        >
                          Reject
                        </ShimmerButton>
                        {app.unit?.availabilityStatus && app.unit.availabilityStatus !== 'AVAILABLE' ? (
                          <StatusPill variant="warning">
                            Unit {app.unit.availabilityStatus.toLowerCase().replace('_', ' ')}
                          </StatusPill>
                        ) : (
                          <ShimmerButton
                            variant="primary"
                            size="sm"
                            onClick={() => setSelectedApp(app)}
                            leftIcon={<CheckCircle2 className="w-4 h-4" />}
                          >
                            Approve & Generate Lease
                          </ShimmerButton>
                        )}
                      </>
                    )}

                    {isApproved && (
                      <ShimmerButton
                        variant={isLeaseActive ? 'primary' : 'outline'}
                        size="sm"
                        onClick={onViewLeases}
                        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        {isLeaseActive ? 'View Active Tenancy' : 'View Lease Status'}
                      </ShimmerButton>
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
                <ShimmerButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedApp(null)}
                  className="px-2"
                >
                  <X className="w-5 h-5" />
                </ShimmerButton>
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
                <ShimmerButton
                  variant="outline"
                  size="md"
                  onClick={() => setSelectedApp(null)}
                >
                  Cancel
                </ShimmerButton>
                <ShimmerButton
                  variant="primary"
                  size="md"
                  disabled={isProcessing}
                  isLoading={isProcessing}
                  onClick={() => handleConfirmApprove(selectedApp)}
                >
                  Approve & Issue Lease
                </ShimmerButton>
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
                <ShimmerButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setRejectingApp(null)}
                  className="px-2"
                >
                  <X className="w-5 h-5" />
                </ShimmerButton>
              </div>

              <p className="text-xs text-slate-600">
                Reject application from <strong className="text-slate-900">{rejectingApp.tenant?.name}</strong> for{' '}
                {rejectingApp.unit?.unitIdentifier}.
              </p>

              <FormSelect
                label="Reason for rejection"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                options={[
                  {
                    value: 'Unit no longer available',
                    label: 'Unit no longer available / leased to another tenant',
                  },
                  { value: 'Incompatible move-in date', label: 'Incompatible move-in timeline' },
                  {
                    value: 'Application qualifications not met',
                    label: 'Application qualifications not met',
                  },
                  { value: 'Other', label: 'Other reason' },
                ]}
              />

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <ShimmerButton
                  variant="outline"
                  size="md"
                  onClick={() => setRejectingApp(null)}
                >
                  Cancel
                </ShimmerButton>
                <ShimmerButton
                  variant="danger"
                  size="md"
                  disabled={isProcessing}
                  isLoading={isProcessing}
                  onClick={handleConfirmReject}
                >
                  Confirm Rejection
                </ShimmerButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
