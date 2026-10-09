/**
 * LandlordDisputesView — Ultra-Premium Dark Portal
 *
 * Legal Dispute Mediation Center (Muluki Civil Code 2074 § 398)
 * Connected to live tenancy dispute arbitration records.
 */

import React from 'react';
import { motion } from 'motion/react';
import {
  Scale, AlertCircle, Clock, CheckCircle2, XCircle,
  FileText, DollarSign, ExternalLink, ChevronRight, ShieldAlert,
} from 'lucide-react';
import type { LandlordDispute, TenancyDisputeStatus } from '@/types/landlord';

interface LandlordDisputesViewProps {
  disputes: LandlordDispute[];
  loading: boolean;
}

const DISPUTE_STATUS_CONFIG: Record<
  TenancyDisputeStatus,
  { label: string; badgeClass: string; icon: React.ElementType }
> = {
  OPEN: { label: 'Open Claim', badgeClass: 'badge-warning', icon: AlertCircle },
  IN_MEDIATION: { label: 'In Arbitration', badgeClass: 'badge-info', icon: Clock },
  RESOLVED_MUTUAL: { label: 'Mutual Settlement', badgeClass: 'badge-success', icon: CheckCircle2 },
  RESOLVED_ARBITRATED: { label: 'Tribunal Award', badgeClass: 'badge-success', icon: CheckCircle2 },
  ESCALATED: { label: 'Escalated to Court', badgeClass: 'badge-error', icon: XCircle },
};

export function LandlordDisputesView({ disputes, loading }: LandlordDisputesViewProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => <div key={i} className="h-32 rounded-2xl card-premium animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-2"
            style={{
              background: 'rgba(124,58,237,0.12)',
              border: '1px solid rgba(124,58,237,0.25)',
              color: '#c4b5fd',
              fontFamily: 'Space Grotesk, sans-serif',
            }}
          >
            <Scale className="w-3.5 h-3.5" />
            Muluki Civil Code 2074 § 398
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient-blue" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Legal Dispute & Mediation Center
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Digital arbitration tribunal records and formal tenancy claims.
          </p>
        </div>
      </div>

      {/* Legal statutory banner */}
      <div className="card-premium p-4 flex gap-3 border-violet-500/20 bg-violet-500/5">
        <ShieldAlert className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed text-violet-300/90">
          <strong className="text-violet-200">§ 398 — Dispute Resolution:</strong> Any dispute arising from a tenancy agreement shall first be referred to RentHub's structured digital mediation process. If mutual settlement is not reached within 30 days, both parties receive a certified claim statement for submission to the Kathmandu District Court.
        </div>
      </div>

      {/* Disputes list */}
      {disputes.length === 0 ? (
        <div className="card-premium text-center py-20 px-6 border-dashed">
          <Scale className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="font-semibold text-base" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk, sans-serif' }}>
            No legal disputes on record
          </p>
          <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
            All tenancy agreements are currently in good standing with zero active claims or arbitration notices.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => {
            const cfg = DISPUTE_STATUS_CONFIG[dispute.status] ?? DISPUTE_STATUS_CONFIG['OPEN'];
            const StatusIcon = cfg.icon;

            return (
              <motion.div
                key={dispute.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-premium p-5 sm:p-6"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <StatusIcon className="w-5 h-5 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className={cfg.badgeClass}>
                        {cfg.label}
                      </span>
                      <span className="badge-neutral text-[10px]">
                        {dispute.category.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-100" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {dispute.title}
                    </h3>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {dispute.description}
                    </p>

                    <div className="flex items-center gap-4 sm:gap-6 mt-3 flex-wrap">
                      {dispute.propertyTitle && (
                        <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                          <FileText className="w-3.5 h-3.5 text-brand-400" />
                          {dispute.propertyTitle}
                          {dispute.unitIdentifier && ` — ${dispute.unitIdentifier}`}
                        </span>
                      )}
                      {dispute.claimAmount > 0 && (
                        <span className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold font-display">
                          <DollarSign className="w-3.5 h-3.5" />
                          Claimed Damages: NPR {dispute.claimAmount.toLocaleString()}
                        </span>
                      )}
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Filed on {new Date(dispute.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {dispute.resolutionSummary && (
                      <div className="mt-3 p-3 rounded-xl badge-success border border-emerald-500/20 w-full">
                        <p className="text-xs">
                          <strong>Arbitration Settlement:</strong> {dispute.resolutionSummary}
                        </p>
                      </div>
                    )}

                    {dispute.evidenceUrls && dispute.evidenceUrls.length > 0 && (
                      <div className="mt-3 flex gap-2 flex-wrap">
                        {dispute.evidenceUrls.slice(0, 3).map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-ghost btn-sm text-[11px] py-1 px-2.5 flex items-center gap-1"
                          >
                            Evidence Doc #{i + 1}
                            <ExternalLink className="w-3 h-3 text-brand-400" />
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

      {/* Help card */}
      <div className="card-premium p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-100" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Need to file a formal claim under § 398?
          </h3>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            To dispute non-payment of rent, structural property damage, or unlawful subletting, initiate a claim from the Tenancies & Leases tab.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-brand-400 font-semibold shrink-0">
          <span>Navigate to Leases</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}
