/**
 * FinancialsLedgerView — Clean Light Modern Portal
 *
 * Live rent roll, security deposit escrow, gateway status.
 * Computed directly from active lease & property portfolio data.
 */

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  DollarSign, TrendingUp, Shield, AlertCircle, Building,
  Clock, CreditCard, Banknote, Download, Sparkles, CheckCircle2,
} from 'lucide-react';
import type { LandlordProperty, LandlordLease } from '@/types/landlord';

interface FinancialsLedgerViewProps {
  properties: LandlordProperty[];
  leases: LandlordLease[];
  loading: boolean;
}

const GATEWAY_STATUS = [
  {
    name: 'eSewa Merchant',
    logo: '💚',
    status: 'Ready for Integration',
    description: 'Accept instant rent settlement via eSewa digital wallet & QR.',
    badgeClass: 'badge-success',
  },
  {
    name: 'Khalti Merchant',
    logo: '💜',
    status: 'Ready for Integration',
    description: 'Direct Khalti checkout for tenant rent and security deposit collection.',
    badgeClass: 'badge-info',
  },
  {
    name: 'ConnectIPS (NCHL)',
    logo: '🏦',
    status: 'Bank Direct Clearing',
    description: 'National interbank direct account debits across all major Nepal commercial banks.',
    badgeClass: 'badge-warning',
  },
];

type LedgerTab = 'rent-roll' | 'deposits' | 'gateways';

export function FinancialsLedgerView({ properties, leases, loading }: FinancialsLedgerViewProps) {
  const [tab, setTab] = useState<LedgerTab>('rent-roll');

  /* ── Computed metrics ─────────────────────────────────────────────────── */
  const metrics = useMemo(() => {
    const activeLeases = leases.filter((l) => l.status === 'active');
    const pendingSignLeases = leases.filter((l) => l.status === 'pending_signature');
    const grossMonthlyRent = activeLeases.reduce((s, l) => s + l.agreedMonthlyRent, 0);
    const totalDepositsHeld = activeLeases.reduce((s, l) => s + l.agreedDeposit, 0);
    const totalUnits = properties.reduce((s, p) => s + (p.unitsCount ?? p.units?.length ?? 0), 0);
    const occupiedUnits = properties.reduce(
      (s, p) => s + (p.units?.filter((u) => u.availabilityStatus === 'ON_RENT').length ?? 0), 0
    );
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    return { activeLeases, pendingSignLeases, grossMonthlyRent, totalDepositsHeld, totalUnits, occupiedUnits, occupancyRate };
  }, [leases, properties]);

  const SUMMARY_CARDS = [
    {
      label: 'Gross Monthly Revenue',
      value: `NPR ${metrics.grossMonthlyRent.toLocaleString()}`,
      sub: `${metrics.activeLeases.length} active tenancy lease(s)`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      label: 'Deposits in Escrow',
      value: `NPR ${metrics.totalDepositsHeld.toLocaleString()}`,
      sub: 'Statutory custody (§ 385)',
      icon: Shield,
      color: 'text-blue-600',
      iconBg: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      label: 'Portfolio Occupancy',
      value: `${metrics.occupancyRate}%`,
      sub: `${metrics.occupiedUnits} / ${metrics.totalUnits} units rented`,
      icon: Building,
      color: 'text-violet-600',
      iconBg: 'bg-violet-50 text-violet-600 border-violet-200',
    },
    {
      label: 'Pending Activation',
      value: `${metrics.pendingSignLeases.length}`,
      sub: 'Contracts awaiting countersign',
      icon: Clock,
      color: 'text-amber-600',
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
    },
  ];

  const TABS: { key: LedgerTab; label: string }[] = [
    { key: 'rent-roll', label: 'Rent Roll Ledger' },
    { key: 'deposits', label: 'Deposit Escrow (§ 385)' },
    { key: 'gateways', label: 'Settlement Gateways' },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 rounded-2xl bg-white border border-slate-200 animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-2 bg-emerald-50 border border-emerald-200 text-emerald-700 font-display">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Live Financial Treasury
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-display">
            Financials & Rent Ledger
          </h1>
          <p className="text-sm mt-1 text-slate-500">
            Real-time rent roll aggregation and statutory escrow accounting for your properties.
          </p>
        </div>
      </div>

      {/* Summary Bento Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {SUMMARY_CARDS.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 relative shadow-xs hover:shadow-md hover:border-slate-300 transition-all"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 border ${c.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-slate-500">{c.label}</p>
              <p className="text-lg sm:text-xl font-bold text-slate-900 mt-1 font-display tracking-tight">{c.value}</p>
              <p className="text-[11px] mt-1 text-slate-500">{c.sub}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap border-b border-slate-200 pb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              tab === t.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Rent Roll Tab ──────────────────────────────────────────────── */}
      {tab === 'rent-roll' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          {metrics.activeLeases.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl text-center py-16 px-6">
              <DollarSign className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="font-semibold text-base text-slate-800 font-display">
                No active leases in the rent roll
              </p>
              <p className="text-xs mt-1 max-w-sm mx-auto text-slate-500">
                Approve applications and complete digital signing to populate the automated monthly rent ledger.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50/75">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider font-display">
                  Active Rent Ledger
                </span>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                  onClick={() => window.print()}
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Statement
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {metrics.activeLeases.map((lease) => (
                  <div key={lease.id} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50/60 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate font-display">
                        {lease.propertyTitle ?? 'Property'} — <span className="text-blue-600 font-semibold">{lease.unitIdentifier ?? 'Unit'}</span>
                      </p>
                      <p className="text-xs mt-0.5 text-slate-500">
                        Tenant: <span className="text-slate-800 font-medium">{lease.tenantName ?? '—'}</span> · Active since {new Date(lease.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-emerald-600 font-display">
                        NPR {lease.agreedMonthlyRent.toLocaleString()}
                      </p>
                      <span className="badge-success text-[10px] mt-1">
                        Active Tenancy
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Total row */}
              <div className="flex items-center justify-between px-5 py-4 border-t border-blue-100 bg-blue-50/50">
                <span className="text-sm font-bold text-slate-800 font-display">
                  Aggregated Monthly Gross
                </span>
                <span className="text-base font-bold text-emerald-600 font-display">
                  NPR {metrics.grossMonthlyRent.toLocaleString()} / mo
                </span>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Deposit Escrow Tab ──────────────────────────────────────────── */}
      {tab === 'deposits' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
          {metrics.activeLeases.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl text-center py-16 px-6">
              <Shield className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="font-semibold text-base text-slate-800 font-display">
                No security deposits recorded
              </p>
              <p className="text-xs mt-1 text-slate-500">
                Security deposits recorded in signed leases will appear in this ledger.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/75">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider font-display">
                  Security Deposits in Escrow (§ 385)
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {metrics.activeLeases.map((lease) => (
                  <div key={lease.id} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50/60 transition-colors">
                    <div>
                      <p className="text-sm font-bold text-slate-900 font-display">
                        {lease.propertyTitle ?? 'Property'} — <span className="text-blue-600 font-semibold">{lease.unitIdentifier ?? 'Unit'}</span>
                      </p>
                      <p className="text-xs mt-0.5 text-slate-500">
                        Tenant Custody: <span className="text-slate-800 font-medium">{lease.tenantName ?? '—'}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-blue-600 font-display">
                        NPR {lease.agreedDeposit.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-400">Refundable on move-out</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between px-5 py-4 border-t border-blue-100 bg-blue-50/50">
                <span className="text-sm font-bold text-slate-800 font-display">
                  Total Escrow Liabilities Held
                </span>
                <span className="text-base font-bold text-blue-600 font-display">
                  NPR {metrics.totalDepositsHeld.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed text-amber-900">
              <strong className="text-amber-950 font-bold">Muluki Civil Code 2074 § 385:</strong> Security deposits must be refunded within 30 days of tenancy completion, minus lawful deductions for damages beyond normal wear and tear. All escrow amounts remain property of the tenant until formal handover.
            </p>
          </div>
        </motion.div>
      )}

      {/* ── Payment Gateways Tab ────────────────────────────────────────── */}
      {tab === 'gateways' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
          <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 flex gap-3">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed text-blue-900">
              Nepali payment gateway integrations allow tenants to pay with 1-click through eSewa, Khalti, or ConnectIPS, settling directly to your designated bank account with automated digital receipts.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {GATEWAY_STATUS.map((gw) => (
              <div key={gw.name} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{gw.logo}</span>
                    <span className={gw.badgeClass}>{gw.status}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 font-display">
                    {gw.name}
                  </h3>
                  <p className="text-xs mt-1.5 leading-relaxed text-slate-500">
                    {gw.description}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Protocol Ready
                  </span>
                  <button className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer transition-colors">
                    Configure
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-display">
                <Banknote className="w-4 h-4 text-blue-600" />
                Manual Payment & Cash Receipt Recording
              </h3>
              <p className="text-xs mt-1 max-w-xl text-slate-500">
                For bank counter deposits, cheques, or direct cash payments (e.g. Nabil Bank, NIC Asia, Global IME), log receipts to update the ledger in real-time.
              </p>
            </div>
            <button className="btn-primary btn-sm flex items-center gap-2 shrink-0">
              <CreditCard className="w-3.5 h-3.5" />
              Record Manual Payment
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
