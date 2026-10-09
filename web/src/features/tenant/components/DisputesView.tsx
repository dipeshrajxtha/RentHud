/**
 * DisputesView Component — Clean Light Legal Disputes View
 *
 * Resident Disputes and Formal Mediation records:
 * - Direct claim submission under Muluki Civil Code 2074 § 398
 * - Status pills (In Mediation, Open, Resolved)
 * - Claim amounts and resolution outcomes
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
          <h2 className="text-xl font-bold text-slate-900">Tenancy Disputes & Rights Protection</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Formal mediation records under Nepal Muluki Civil Code for deposit withholding, quiet enjoyment, and rent discrepancies
          </p>
        </div>

        <button
          type="button"
          disabled={!lease}
          onClick={onOpenNewDisputeModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>File Tenancy Dispute</span>
        </button>
      </div>

      {/* Disputes List */}
      {disputes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-12 text-center max-w-md mx-auto space-y-3.5">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto bg-blue-50 text-blue-600 border border-blue-100">
            <Scale className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Disputes on Record</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            You do not have any open or historical tenancy disputes. If an issue cannot be resolved
            informally with your landlord, you can file a formal claim here.
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
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-mono text-xs text-blue-600 font-semibold">ID: {d.id}</span>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
                        {d.category.replace('_', ' ')}
                      </span>
                      {d.claimAmount > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                          Claim: NPR {d.claimAmount.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{d.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {d.description}
                    </p>
                  </div>

                  <div className="shrink-0">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        isResolved
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : d.status === 'IN_MEDIATION'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
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
                  <div className="p-3.5 rounded-xl text-xs space-y-1 bg-emerald-50 border border-emerald-200 text-emerald-900">
                    <strong className="block font-bold">Mediated Resolution Outcome:</strong>
                    <p className="text-emerald-800">{d.resolutionSummary}</p>
                    {d.resolvedAt && (
                      <span className="text-[10px] block mt-1 text-emerald-600">
                        Resolved on {new Date(d.resolvedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 border-t border-slate-100">
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
