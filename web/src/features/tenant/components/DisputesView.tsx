/**
 * DisputesView Component
 */

import { motion } from 'motion/react';
import { Plus, CheckCircle2, Clock, Scale } from 'lucide-react';
import type { TenancyDispute, LeaseAgreement } from '@/types/tenant';

interface DisputesViewProps {
  disputes: TenancyDispute[];
  lease: LeaseAgreement | null;
  onOpenNewDisputeModal: () => void;
}

export function DisputesView({
  disputes,
  lease,
  onOpenNewDisputeModal,
}: DisputesViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold text-slate-900">Tenancy Disputes & Rights Protection</h2>
          <p className="text-xs text-slate-500">
            Formal mediation records under Nepal Muluki Civil Code for deposit withholding, quiet enjoyment, and rent discrepancies
          </p>
        </div>

        <button
          type="button"
          disabled={!lease}
          onClick={onOpenNewDisputeModal}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>File Tenancy Dispute</span>
        </button>
      </div>

      {/* Disputes List */}
      {disputes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <Scale className="w-6 h-6" />
          </div>
          <h3 className="text-base font-display font-semibold text-slate-900">No Disputes on Record</h3>
          <p className="text-xs text-slate-500">
            You do not have any open or historical tenancy disputes. If an issue cannot be resolved informally with your landlord, you can file a formal claim here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {disputes.map((d) => {
            const isResolved = d.status.startsWith('RESOLVED');

            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono text-xs text-slate-400">ID: {d.id}</span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium uppercase">
                        {d.category.replace('_', ' ')}
                      </span>
                      {d.claimAmount > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[11px] font-semibold border border-rose-200">
                          Claim: NPR {d.claimAmount.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-display font-semibold text-slate-900">{d.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{d.description}</p>
                  </div>

                  <div className="shrink-0">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        isResolved
                          ? 'bg-emerald-100 text-emerald-800'
                          : d.status === 'IN_MEDIATION'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isResolved ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                      <span>{d.status.replace('_', ' ')}</span>
                    </span>
                  </div>
                </div>

                {/* Resolution Summary if Available */}
                {d.resolutionSummary && (
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                    <strong className="block font-semibold">Mediated Resolution Outcome:</strong>
                    <p className="text-emerald-800">{d.resolutionSummary}</p>
                    {d.resolvedAt && (
                      <span className="text-[10px] text-emerald-600 block mt-1">
                        Resolved on {new Date(d.resolvedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Filed on {new Date(d.createdAt).toLocaleDateString()}</span>
                  <span>Governing Law: Muluki Civil Code 2074 § 398</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
