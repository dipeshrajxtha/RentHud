import { useState, useEffect, useCallback } from 'react';
import {
  FileCheck2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  ExternalLink,
  Eye,
  X,
  ShieldCheck,
} from 'lucide-react';
import { kycService, type KycSubmissionData } from '../kyc.service';

interface AdminKycReviewViewProps {
  accessToken: string;
  onKycCountChange?: (pendingCount: number) => void;
}

export function AdminKycReviewView({ accessToken, onKycCountChange }: AdminKycReviewViewProps) {
  const [submissions, setSubmissions] = useState<KycSubmissionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'tenant' | 'landlord'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Image zoom modal
  const [zoomedImage, setZoomedImage] = useState<{ url: string; title: string } | null>(null);

  // Reject modal
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchKycList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await kycService.adminListKyc(undefined, accessToken);
      setSubmissions(data);
      const pendingCount = data.filter(s => s.status === 'pending').length;
      onKycCountChange?.(pendingCount);
    } catch (err: any) {
      console.error('Failed to load KYC submissions:', err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, onKycCountChange]);

  useEffect(() => {
    fetchKycList();
  }, [fetchKycList]);

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await kycService.adminApproveKyc(id, accessToken);
      await fetchKycList();
    } catch (err: any) {
      setActionError(err.message || 'Failed to approve submission');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectingId) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await kycService.adminRejectKyc(rejectingId, rejectReason || 'Document verification failed', accessToken);
      setRejectingId(null);
      setRejectReason('');
      await fetchKycList();
    } catch (err: any) {
      setActionError(err.message || 'Failed to reject submission');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const approvedCount = submissions.filter(s => s.status === 'approved').length;
  const rejectedCount = submissions.filter(s => s.status === 'rejected').length;

  const filtered = submissions.filter(sub => {
    if (statusFilter !== 'all' && sub.status !== statusFilter) return false;
    if (roleFilter !== 'all' && sub.userRole !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = sub.userName?.toLowerCase().includes(q);
      const matchEmail = sub.userEmail?.toLowerCase().includes(q);
      return matchName || matchEmail;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
            Identity Verification Desk (KYC)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review citizenship certificates, police reports, and property deeds to grant platform verification.
          </p>
        </div>

        {/* Quick count chips */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            {pendingCount} Pending Review
          </span>
          <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            {approvedCount} Verified
          </span>
          {rejectedCount > 0 && (
            <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
              {rejectedCount} Rejected
            </span>
          )}
        </div>
      </div>

      {actionError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-500 hover:text-red-700 font-bold">✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                statusFilter === tab
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab}
              {tab === 'pending' && pendingCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px]">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Role Filter & Search */}
        <div className="flex items-center gap-3 ml-auto flex-1 max-w-md">
          <div className="relative">
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value as any)}
              className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Roles</option>
              <option value="tenant">Tenants</option>
              <option value="landlord">Landlords</option>
            </select>
          </div>

          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-slate-200">
          <Clock className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
          <p className="text-sm text-slate-500">Loading KYC submissions...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-slate-200">
          <FileCheck2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">No submissions found</h3>
          <p className="text-xs text-slate-400 mt-1">There are no KYC submissions matching the selected filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filtered.map(sub => {
            const isPending = sub.status === 'pending';
            const isApproved = sub.status === 'approved';
            const isRejected = sub.status === 'rejected';

            return (
              <div
                key={sub.id}
                className={`p-6 rounded-3xl bg-white border transition-all ${
                  isPending
                    ? 'border-amber-200 shadow-md shadow-amber-500/5'
                    : isApproved
                    ? 'border-emerald-200/80 shadow-xs'
                    : 'border-slate-200 shadow-xs'
                }`}
              >
                {/* Top User Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                      {sub.userName ? sub.userName[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-base">{sub.userName || 'Unnamed User'}</h3>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            sub.userRole === 'landlord'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {sub.userRole}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">{sub.userEmail}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider ${
                        isApproved
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isRejected
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {isApproved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                      {isRejected && <AlertTriangle className="w-3.5 h-3.5 text-red-600" />}
                      {isPending && <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />}
                      {sub.status}
                    </span>

                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(sub.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Rejection notice if present */}
                {isRejected && sub.rejectionReason && (
                  <div className="mt-4 p-3 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Rejection Reason: </span>
                      {sub.rejectionReason}
                    </div>
                  </div>
                )}

                {/* Document Gallery */}
                <div className="mt-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Submitted Verification Documents
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                    {/* Citizenship Front */}
                    {sub.citizenshipFrontUrl && (
                      <div
                        onClick={() =>
                          setZoomedImage({
                            url: sub.citizenshipFrontUrl,
                            title: `Citizenship (Front) — ${sub.userName}`,
                          })
                        }
                        className="group relative rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden cursor-pointer hover:shadow-md transition-all"
                      >
                        <div className="aspect-[4/3] bg-slate-100 overflow-hidden relative">
                          <img
                            src={sub.citizenshipFrontUrl}
                            alt="Citizenship Front"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <Eye className="w-6 h-6 text-white drop-shadow" />
                          </div>
                        </div>
                        <div className="p-2.5 bg-white border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-700">Citizenship (Front)</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </div>
                      </div>
                    )}

                    {/* Citizenship Back */}
                    {sub.citizenshipBackUrl && (
                      <div
                        onClick={() =>
                          setZoomedImage({
                            url: sub.citizenshipBackUrl,
                            title: `Citizenship (Back) — ${sub.userName}`,
                          })
                        }
                        className="group relative rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden cursor-pointer hover:shadow-md transition-all"
                      >
                        <div className="aspect-[4/3] bg-slate-100 overflow-hidden relative">
                          <img
                            src={sub.citizenshipBackUrl}
                            alt="Citizenship Back"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <Eye className="w-6 h-6 text-white drop-shadow" />
                          </div>
                        </div>
                        <div className="p-2.5 bg-white border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-700">Citizenship (Back)</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </div>
                      </div>
                    )}

                    {/* Police Report (Tenant) */}
                    {sub.policeReportUrl && (
                      <div
                        onClick={() =>
                          setZoomedImage({
                            url: sub.policeReportUrl!,
                            title: `Police Report — ${sub.userName}`,
                          })
                        }
                        className="group relative rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden cursor-pointer hover:shadow-md transition-all"
                      >
                        <div className="aspect-[4/3] bg-slate-100 overflow-hidden relative">
                          <img
                            src={sub.policeReportUrl}
                            alt="Police Report"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <Eye className="w-6 h-6 text-white drop-shadow" />
                          </div>
                        </div>
                        <div className="p-2.5 bg-white border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-700">Police Report</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </div>
                      </div>
                    )}

                    {/* Ownership Document (Landlord) */}
                    {sub.ownershipDocumentUrl && (
                      <div
                        onClick={() =>
                          setZoomedImage({
                            url: sub.ownershipDocumentUrl!,
                            title: `Ownership Document — ${sub.userName}`,
                          })
                        }
                        className="group relative rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden cursor-pointer hover:shadow-md transition-all"
                      >
                        <div className="aspect-[4/3] bg-slate-100 overflow-hidden relative">
                          <img
                            src={sub.ownershipDocumentUrl}
                            alt="Ownership Document"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <Eye className="w-6 h-6 text-white drop-shadow" />
                          </div>
                        </div>
                        <div className="p-2.5 bg-white border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-700">Ownership Deed</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </div>
                      </div>
                    )}

                    {/* Business Registration (Landlord optional) */}
                    {sub.businessRegistrationUrl && (
                      <div
                        onClick={() =>
                          setZoomedImage({
                            url: sub.businessRegistrationUrl!,
                            title: `Business Registration — ${sub.userName}`,
                          })
                        }
                        className="group relative rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden cursor-pointer hover:shadow-md transition-all"
                      >
                        <div className="aspect-[4/3] bg-slate-100 overflow-hidden relative">
                          <img
                            src={sub.businessRegistrationUrl}
                            alt="Business Registration"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <Eye className="w-6 h-6 text-white drop-shadow" />
                          </div>
                        </div>
                        <div className="p-2.5 bg-white border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-700">Business Reg.</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Review Action Controls */}
                {isPending && (
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button
                      onClick={() => {
                        setRejectingId(sub.id);
                        setRejectReason('');
                      }}
                      disabled={actionLoading}
                      className="px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition disabled:opacity-50"
                    >
                      Reject Submission
                    </button>
                    <button
                      onClick={() => handleApprove(sub.id)}
                      disabled={actionLoading}
                      className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-500/20 rounded-xl transition disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve & Verify User
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Image Preview Zoom Modal */}
      {zoomedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-semibold text-sm">{zoomedImage.title}</span>
              <button
                onClick={() => setZoomedImage(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center bg-slate-950/5 min-h-[300px]">
              <img
                src={zoomedImage.url}
                alt={zoomedImage.title}
                className="max-h-[75vh] w-auto object-contain rounded-xl shadow-md"
              />
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Reject KYC Submission
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Provide a clear reason for rejection so the user knows what documents to re-upload.
            </p>

            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Citizenship photo is blurry / expired, or police report is missing official stamp."
              className="mt-4 w-full h-28 p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                onClick={() => {
                  setRejectingId(null);
                  setRejectReason('');
                }}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition disabled:opacity-50 shadow-md shadow-red-500/20"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
