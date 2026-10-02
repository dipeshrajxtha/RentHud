/**
 * FinancialsLedgerView — Phase 5
 *
 * Live rent roll, security deposit escrow, gateway status.
 * Computed from real lease & property data (no mock).
 */

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  DollarSign, TrendingUp, Shield, AlertCircle, Building,
  Clock, CreditCard, Banknote, Download,
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
    status: 'Pending Setup',
    description: 'Integrate your eSewa merchant ID to accept digital rent payments.',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  {
    name: 'Khalti',
    logo: '💜',
    status: 'Pending Setup',
    description: 'Connect Khalti merchant account for wallet-based collections.',
    color: 'text-violet-700',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
  },
  {
    name: 'ConnectIPS',
    logo: '🏦',
    status: 'Pending Setup',
    description: 'Enable bank-to-bank rent transfers via Nepal Clearing House ConnectIPS.',
    color: 'text-sky-700',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
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
      label: 'Gross Monthly Rent', value: `NPR ${metrics.grossMonthlyRent.toLocaleString()}`,
      sub: `${metrics.activeLeases.length} active lease(s)`,
      icon: TrendingUp, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200',
    },
    {
      label: 'Deposits in Escrow', value: `NPR ${metrics.totalDepositsHeld.toLocaleString()}`,
      sub: 'Held on behalf of tenants',
      icon: Shield, color: 'text-brand-700', bg: 'bg-brand-50', border: 'border-brand-200',
    },
    {
      label: 'Occupancy Rate', value: `${metrics.occupancyRate}%`,
      sub: `${metrics.occupiedUnits} / ${metrics.totalUnits} units occupied`,
      icon: Building, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200',
    },
    {
      label: 'Pending Activation', value: `${metrics.pendingSignLeases.length}`,
      sub: 'Leases awaiting signature',
      icon: Clock, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200',
    },
  ];

  const TABS: { key: LedgerTab; label: string }[] = [
    { key: 'rent-roll', label: 'Rent Roll' },
    { key: 'deposits', label: 'Deposit Escrow' },
    { key: 'gateways', label: 'Payment Gateways' },
  ];

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded-2xl bg-slate-200 animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-emerald-600" />
          Financials & Rent Ledger
        </h1>
        <p className="text-sm text-slate-500 mt-1">Live rent roll computed from your active lease agreements</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {SUMMARY_CARDS.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.35 }}
              className={`rounded-2xl border ${c.border} ${c.bg} p-4`}
            >
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center mb-3 shadow-xs">
                <Icon className={`w-4 h-4 ${c.color}`} />
              </div>
              <p className="text-xs text-slate-500 font-medium">{c.label}</p>
              <p className="text-base font-bold text-slate-900 mt-0.5">{c.value}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{c.sub}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              tab === t.key
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Rent Roll Tab ──────────────────────────────────────────────── */}
      {tab === 'rent-roll' && (
        <div>
          {metrics.activeLeases.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No active leases yet</p>
              <p className="text-xs text-slate-400 mt-1">Approve applications and sign leases to see the rent roll here.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Active Rent Roll</span>
                <button className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors">
                  <Download className="w-3.5 h-3.5" />
                  Export
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {metrics.activeLeases.map((lease) => (
                  <div key={lease.id} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {lease.propertyTitle ?? 'Property'} — {lease.unitIdentifier ?? 'Unit'}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Tenant: {lease.tenantName ?? '—'} · Since {new Date(lease.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-slate-900">NPR {lease.agreedMonthlyRent.toLocaleString()}</p>
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                        Active
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Total row */}
              <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200 bg-emerald-50/30">
                <span className="text-sm font-bold text-slate-900">Gross Monthly Total</span>
                <span className="text-base font-bold text-emerald-700">
                  NPR {metrics.grossMonthlyRent.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Deposit Escrow Tab ──────────────────────────────────────────── */}
      {tab === 'deposits' && (
        <div>
          {metrics.activeLeases.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <Shield className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No deposits on record</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Security Deposits in Escrow</span>
              </div>
              <div className="divide-y divide-slate-100">
                {metrics.activeLeases.map((lease) => (
                  <div key={lease.id} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {lease.propertyTitle ?? 'Property'} — {lease.unitIdentifier ?? 'Unit'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {lease.tenantName ?? '—'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-brand-700">NPR {lease.agreedDeposit.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400">Refundable</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200 bg-brand-50/30">
                <span className="text-sm font-bold text-slate-900">Total Held in Escrow</span>
                <span className="text-base font-bold text-brand-700">
                  NPR {metrics.totalDepositsHeld.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              <strong>Muluki Civil Code 2074 § 385:</strong> Security deposits must be refunded within 30 days of lease completion, minus lawful deductions for damages beyond normal wear and tear.
            </p>
          </div>
        </div>
      )}

      {/* ── Payment Gateways Tab ────────────────────────────────────────── */}
      {tab === 'gateways' && (
        <div className="space-y-4">
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex gap-3 mb-2">
            <AlertCircle className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <p className="text-xs text-sky-800">
              Payment gateway integration (eSewa, Khalti, ConnectIPS) requires a Merchant API agreement. Current status reflects integration readiness — no live transactions are processed yet.
            </p>
          </div>
          {GATEWAY_STATUS.map((gw) => (
            <div key={gw.name} className={`bg-white rounded-2xl border ${gw.border} p-5 flex items-center gap-4`}>
              <div className={`w-12 h-12 rounded-2xl ${gw.bg} flex items-center justify-center text-2xl shrink-0`}>
                {gw.logo}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900">{gw.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{gw.description}</p>
              </div>
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-xl ${gw.bg} ${gw.color} border ${gw.border} shrink-0`}>
                {gw.status}
              </span>
            </div>
          ))}

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-slate-600" />
              Manual Payment Recording
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              For cash or direct bank transfer (Nabil Bank, NIC Asia, Global IME), record payments manually to keep your rent ledger accurate.
            </p>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors">
              <CreditCard className="w-3.5 h-3.5" />
              Record Manual Payment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
