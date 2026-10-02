/**
 * LandlordDisputesView — Phase 6
 *
 * Legal Dispute Mediation Center (Muluki Civil Code 2074 § 398)
 * Connected to GET /api/tenancy/disputes
 */

import React from 'react';
import { motion } from 'motion/react';
import {
  Scale, AlertCircle, Clock, CheckCircle2, XCircle,
  FileText, DollarSign, ExternalLink, ChevronRight,
} from 'lucide-react';
import type { LandlordDispute, TenancyDisputeStatus } from '@/types/landlord';

interface LandlordDisputesViewProps {
  disputes: LandlordDispute[];
  loading: boolean;
}

const DISPUTE_STATUS_CONFIG: Record<TenancyDisputeStatus, {
  label: string; color: string; bg: string; icon: React.ElementType;
}> = {
  OPEN: { label: 'Open', color: 'text-amber-700', bg: 'bg-amber-50', icon: AlertCircle },
  IN_MEDIATION: { label: 'In Mediation', color: 'text-sky-700', bg: 'bg-sky-50', icon: Clock },
  RESOLVED_MUTUAL: { label: 'Resolved (Mutual)', color: 'text-emerald-700', bg: 'bg-emerald-50', icon: CheckCircle2 },
  RESOLVED_ARBITRATED: { label: 'Resolved (Arbitrated)', color: 'text-emerald-700', bg: 'bg-emerald-50', icon: CheckCircle2 },
  ESCALATED: { label: 'Escalated to Court', color: 'text-rose-700', bg: 'bg-rose-50', icon: XCircle },
};

const CATEGORY_COLORS: Record<string, string> = {
  RENT_DISPUTE: 'bg-amber-100 text-amber-800',
  DEPOSIT_DISPUTE: 'bg-brand-100 text-brand-800',
  PROPERTY_DAMAGE: 'bg-rose-100 text-rose-800',
  MAINTENANCE_NEGLIGENCE: 'bg-orange-100 text-orange-800',
  LEASE_BREACH: 'bg-violet-100 text-violet-800',
  EVICTION: 'bg-red-100 text-red-800',
  OTHER: 'bg-slate-100 text-slate-700',
};

export function LandlordDisputesView({ disputes, loading }: LandlordDisputesViewProps) {
  if (loading) {
    return (
      <div className="p-8 space-y-4">
        {[1, 2].map((i) => <div key={i} className="h-28 rounded-2xl bg-slate-200 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Scale className="w-6 h-6 text-violet-600" />
          Legal Disputes
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Dispute mediation under Muluki Civil Code 2074 § 398
        </p>
      </div>

      {/* Info banner */}
      <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 flex gap-3 mb-6">
        <Scale className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
        <div className="text-xs text-violet-800">
          <strong>§ 398 — Dispute Resolution:</strong> Any dispute arising from a tenancy agreement shall first be referred to RentHub's mediation mechanism. If mediation fails within 30 days, either party may escalate the matter to the local District Court having jurisdiction over the property location.
        </div>
      </div>

      {/* Empty state */}
      {disputes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <Scale className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-600 font-semibold">No disputes on record</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Formal disputes raised by tenants under Muluki Civil Code 2074 will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => {
            const cfg = DISPUTE_STATUS_CONFIG[dispute.status] ?? DISPUTE_STATUS_CONFIG['OPEN'];
            const StatusIcon = cfg.icon;
            const catColor = CATEGORY_COLORS[dispute.category] ?? CATEGORY_COLORS['OTHER'];

            return (
              <motion.div
                key={dispute.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                    <StatusIcon className={`w-5 h-5 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${catColor}`}>
                        {dispute.category.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{dispute.title}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{dispute.description}</p>

                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      {dispute.propertyTitle && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <FileText className="w-3 h-3" />
                          {dispute.propertyTitle}
                          {dispute.unitIdentifier && ` — ${dispute.unitIdentifier}`}
                        </span>
                      )}
                      {dispute.claimAmount > 0 && (
                        <span className="flex items-center gap-1 text-xs text-rose-700 font-semibold">
                          <DollarSign className="w-3 h-3" />
                          Claimed: NPR {dispute.claimAmount.toLocaleString()}
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        Filed {new Date(dispute.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {dispute.resolutionSummary && (
                      <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                        <p className="text-xs text-emerald-700">
                          <strong>Resolution:</strong> {dispute.resolutionSummary}
                        </p>
                      </div>
                    )}

                    {dispute.evidenceUrls && dispute.evidenceUrls.length > 0 && (
                      <div className="mt-3 flex gap-2">
                        {dispute.evidenceUrls.slice(0, 3).map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] text-brand-600 hover:text-brand-700 bg-brand-50 border border-brand-200 px-2 py-1 rounded-lg transition-colors"
                          >
                            Evidence {i + 1}
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* CTA for new disputes */}
      <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-2">Need to raise a formal dispute?</h3>
        <p className="text-xs text-slate-500 mb-3">
          If you need to formally dispute a tenant claim or initiate mediation, you can file a dispute directly from the relevant tenancy's detail page.
        </p>
        <div className="flex items-center gap-2 text-xs text-violet-700 font-semibold">
          <span>Go to Tenancies & Leases to initiate a dispute</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}
