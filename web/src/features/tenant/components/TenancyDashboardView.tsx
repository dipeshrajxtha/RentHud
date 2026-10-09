/**
 * TenancyDashboardView — Clean Light Resident Hub
 *
 * Resident Hub featuring:
 * - Animated SVG progress rings & lease elapsed counters
 * - Clean white stat cards with colorful accents
 * - Real-time payment history & Khalti / eSewa settlement triggers
 * - Key tenancy conditions accordion with legal covenants
 * - Early termination workflow
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  CreditCard,
  Wrench,
  Building,
  Phone,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  Calendar,
  Zap,
  Clock,
  ChevronRight,
  Star,
  AlertTriangle,
  Home,
  Key,
} from 'lucide-react';
import type { LeaseAgreement, PaymentRecord, MaintenanceRequest } from '@/types/tenant';

interface TenancyDashboardViewProps {
  lease: LeaseAgreement | null;
  payments: PaymentRecord[];
  maintenanceTickets: MaintenanceRequest[];
  onOpenLeaseModal: () => void;
  onOpenPayRentModal: () => void;
  onOpenMaintenanceModal: () => void;
  onOpenDisputeModal: () => void;
  onOpenEarlyTerminationModal: () => void;
  onBrowseListings: () => void;
}

function ProgressRing({
  value,
  max,
  size = 80,
  stroke = 6,
  color = '#2563eb',
  label,
  sublabel,
}: {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  color?: string;
  label: string;
  sublabel: string;
}) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(value / Math.max(max, 1), 1));
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(0,0,0,0.06)"
            strokeWidth={stroke}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.4, ease: 'easeOut', delay: 0.35 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-slate-900">{label}</span>
        </div>
      </div>
      <span className="text-[10px] text-center leading-tight max-w-[76px] text-slate-500 font-medium">
        {sublabel}
      </span>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  gradient,
  onClick,
  pulse,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  gradient: string;
  onClick?: () => void;
  pulse?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 cursor-pointer relative overflow-hidden select-none hover:shadow-md transition-all duration-200"
    >
      <div className="flex flex-col justify-between h-full gap-3">
        <div className="flex items-center justify-between">
          <div
            className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center shadow-xs`}
          >
            <Icon className="w-5 h-5" />
          </div>
          {pulse && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
            </span>
          )}
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className="text-base font-bold text-slate-900 mt-1 leading-tight">
            {value}
          </p>
          <p className="text-[11px] mt-0.5 text-slate-500">{sub}</p>
        </div>
        {onClick && (
          <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 pt-1">
            <span>Open</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function TenancyDashboardView({
  lease,
  payments,
  maintenanceTickets,
  onOpenLeaseModal,
  onOpenPayRentModal,
  onOpenMaintenanceModal,
  onOpenDisputeModal,
  onOpenEarlyTerminationModal,
  onBrowseListings,
}: TenancyDashboardViewProps) {
  const [covenantsOpen, setCovenantsOpen] = useState(true);

  if (!lease) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-12 sm:p-14 text-center max-w-lg mx-auto space-y-6"
      >
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto bg-blue-50 text-blue-600 border border-blue-100 shadow-xs">
          <Building className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-slate-900">No Active Tenancy</h3>
          <p className="text-sm text-slate-500 leading-relaxed mt-2 max-w-sm mx-auto">
            Once your rental application is approved and both parties digitally sign the lease,
            your full Resident Hub activates here.
          </p>
        </div>
        <button
          type="button"
          onClick={onBrowseListings}
          className="w-full px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs transition-colors"
        >
          Discover Available Properties
        </button>
      </motion.div>
    );
  }

  const isTerminated = lease.status === 'terminated_early';
  const isPendingSignature = lease.status === 'pending_signature' || !lease.signedAt;
  const nextPayment = payments.find((p) => p.status === 'PENDING');
  const openMaintCount = maintenanceTickets.filter((m) => m.status !== 'RESOLVED').length;
  const paidCount = payments.filter((p) => p.status === 'PAID').length;

  const leaseStartMs = new Date(lease.startDate).getTime();
  const leaseEndMs = new Date(lease.endDate).getTime();
  const nowMs = Date.now();
  const totalMs = leaseEndMs - leaseStartMs;
  const elapsedMs = Math.min(Math.max(nowMs - leaseStartMs, 0), totalMs);
  const leaseProgress = totalMs > 0 ? Math.round((elapsedMs / totalMs) * 100) : 0;
  const daysLeft = Math.max(0, Math.ceil((leaseEndMs - nowMs) / 86400000));
  const totalDays = Math.ceil(totalMs / 86400000);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Hero Banner */}
      <div className="relative rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden p-6 sm:p-8">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                isTerminated
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : isPendingSignature
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isTerminated ? 'bg-rose-500' : isPendingSignature ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
                }`}
              />
              {isTerminated ? 'Terminated Early' : isPendingSignature ? 'Signature Pending' : 'Active Tenancy'}
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              #{lease.id}
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-3.5 mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-blue-50 text-blue-600 border border-blue-100">
                  <Home className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {lease.unitIdentifier}
                  </h1>
                  <p className="font-semibold text-sm mt-0.5 truncate text-blue-600">
                    {lease.propertyTitle}
                  </p>
                  <p className="text-xs truncate text-slate-500">
                    {lease.propertyAddress}, {lease.propertyCity}
                  </p>
                </div>
              </div>

              {/* Progress Slider */}
              <div className="flex justify-between text-[11px] mb-1.5 text-slate-500 font-medium">
                <span>{lease.startDate}</span>
                <span className="text-blue-600 font-semibold">{leaseProgress}% elapsed</span>
                <span>{lease.endDate}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${leaseProgress}%` }}
                  transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 }}
                />
              </div>

              {/* Badges row */}
              <div className="flex flex-wrap gap-2.5 mt-4">
                {[
                  { icon: CreditCard, label: `NPR ${lease.agreedMonthlyRent.toLocaleString()}`, sub: '/ month', c: 'text-blue-600' },
                  { icon: Key, label: `NPR ${lease.agreedDeposit.toLocaleString()}`, sub: 'deposit', c: 'text-amber-600' },
                  { icon: Calendar, label: `${totalDays} days`, sub: 'total term', c: 'text-emerald-600' },
                ].map(({ icon: Ic, label, sub, c }) => (
                  <div
                    key={sub}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs bg-slate-50 border border-slate-200/70"
                  >
                    <Ic className={`w-3.5 h-3.5 ${c}`} />
                    <span className="text-slate-900 font-bold">{label}</span>
                    <span className="text-slate-500">{sub}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Rings */}
            <div className="flex items-center gap-5 sm:gap-7 shrink-0">
              <ProgressRing
                value={elapsedMs}
                max={totalMs}
                color="#10b981"
                label={`${leaseProgress}%`}
                sublabel="Lease elapsed"
              />
              <ProgressRing
                value={paidCount}
                max={payments.length || 1}
                color="#2563eb"
                label={`${paidCount}/${payments.length}`}
                sublabel="Invoices paid"
              />
              <div className="hidden sm:flex flex-col items-center gap-1.5">
                <div className="w-[80px] h-[80px] rounded-full flex flex-col items-center justify-center bg-slate-50 border border-slate-200">
                  <span className="text-xl font-extrabold text-slate-900">{daysLeft}</span>
                  <span className="text-[10px] text-slate-500">days</span>
                </div>
                <span className="text-[10px] text-center text-slate-500">
                  {isTerminated ? 'terminated' : 'remaining'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Alerts */}
      <AnimatePresence>
        {isPendingSignature && !isTerminated && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-50 border border-amber-200/90 shadow-xs"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-amber-100 text-amber-700">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900">
                  Lease Requires Your Electronic Signature
                </h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  Review the Muluki Civil Code 2074-compliant terms and execute your binding digital signature.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenLeaseModal}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shrink-0 flex items-center gap-2 shadow-xs transition-colors"
            >
              <FileText className="w-4 h-4" /> Review & Sign
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {nextPayment && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-rose-50 border border-rose-200/90 shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-rose-100 text-rose-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-rose-900 block">
                  Rent Due: {nextPayment.dueDate}
                </span>
                <span className="text-rose-700">
                  {nextPayment.invoiceNumber} · NPR {nextPayment.amount.toLocaleString()} · {nextPayment.billingMonth}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenPayRentModal}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shrink-0 transition-colors shadow-xs"
            >
              Pay Now →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stat Cards Bento Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          label="Lease Agreement"
          value={lease.signedAt ? 'Signed & Active' : 'Needs Signature'}
          sub={lease.signedAt ? `Signed ${new Date(lease.signedAt).toLocaleDateString()}` : 'Review & sign digitally'}
          gradient="from-blue-600 to-indigo-600"
          onClick={onOpenLeaseModal}
          pulse={!lease.signedAt}
        />
        <StatCard
          icon={CreditCard}
          label="Rent Payments"
          value={nextPayment ? `NPR ${nextPayment.amount.toLocaleString()}` : 'All Settled ✓'}
          sub={nextPayment ? `Due: ${nextPayment.dueDate}` : `${paidCount} invoices paid`}
          gradient="from-emerald-600 to-teal-600"
          onClick={onOpenPayRentModal}
          pulse={!!nextPayment}
        />
        <StatCard
          icon={Wrench}
          label="Maintenance"
          value={openMaintCount > 0 ? `${openMaintCount} Open` : 'No Issues'}
          sub={openMaintCount > 0 ? 'Tickets in progress' : 'All resolved'}
          gradient="from-amber-600 to-orange-600"
          onClick={onOpenMaintenanceModal}
          pulse={openMaintCount > 0}
        />
        <StatCard
          icon={ShieldCheck}
          label="Disputes & Rights"
          value="Protected"
          sub="Muluki Civil Code 2074"
          gradient="from-violet-600 to-purple-600"
          onClick={onOpenDisputeModal}
        />
      </div>

      {/* Detail Grid */}
      <div className="grid lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4 space-y-4">
          {/* Landlord Contact Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider mb-4 text-slate-500">
              Landlord Contact
            </p>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold text-white shadow-xs bg-blue-600">
                {lease.landlordName[0]}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{lease.landlordName}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs text-slate-500">Verified Landlord</span>
                </div>
              </div>
            </div>
            {lease.landlordPhone && (
              <a
                href={`tel:${lease.landlordPhone}`}
                className="flex items-center gap-2.5 p-3 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 hover:bg-blue-100 transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>{lease.landlordPhone}</span>
              </a>
            )}
          </div>

          {/* Tenancy Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider mb-3 text-slate-500">
              Tenancy Summary
            </p>
            {[
              { label: 'Monthly Rent', value: `NPR ${lease.agreedMonthlyRent.toLocaleString()}`, icon: CreditCard },
              { label: 'Security Deposit', value: `NPR ${lease.agreedDeposit.toLocaleString()}`, icon: Key },
              { label: 'Term Start', value: lease.startDate, icon: Calendar },
              { label: 'Term End', value: lease.endDate, icon: Clock },
              { label: 'Days Remaining', value: isTerminated ? 'Terminated' : `${daysLeft} days`, icon: TrendingUp },
            ].map(({ label, value, icon: Ic }) => (
              <div
                key={label}
                className="flex items-center justify-between py-2 text-xs border-b border-slate-100 last:border-b-0"
              >
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Ic className="w-3.5 h-3.5 text-blue-600" />
                  <span>{label}</span>
                </div>
                <span className="font-bold text-slate-900">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-4">
          {/* Collapsible Covenants */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setCovenantsOpen((v) => !v)}
              className="w-full flex items-center justify-between p-5 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-slate-900">
                  Key Tenancy Conditions & Rights
                </span>
              </div>
              <motion.div animate={{ rotate: covenantsOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </motion.div>
            </button>
            <AnimatePresence initial={false}>
              {covenantsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 space-y-2.5 border-t border-slate-100 pt-3">
                    {[
                      { icon: CreditCard, c: 'text-emerald-600', t: 'Rent Due Date', d: 'Cleared by the 5th of each month via RentHub digital payment.' },
                      { icon: Home, c: 'text-blue-600', t: 'Quiet Enjoyment', d: 'Landlord must give 24h written notice before any premises entry.' },
                      { icon: Key, c: 'text-amber-600', t: 'Deposit Protection', d: `NPR ${lease.agreedDeposit.toLocaleString()} refunded within 14 days of lease completion.` },
                      { icon: Zap, c: 'text-purple-600', t: 'Utilities', d: 'Electricity (NEA), water, and internet billed separately at actuals.' },
                    ].map(({ c, t, d }) => (
                      <div
                        key={t}
                        className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/60"
                      >
                        <CheckCircle2 className={`w-4 h-4 ${c} shrink-0 mt-0.5`} />
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">{t}</span>
                          <span className="text-[11px] text-slate-600 leading-relaxed">{d}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Payment History Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-100">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-slate-900">Payment Ledger</span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {payments.length} records
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {payments.slice(0, 5).map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        p.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : 'bg-amber-50 text-amber-600 border border-amber-200'
                      }`}
                    >
                      {p.status === 'PAID' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{p.billingMonth}</p>
                      <p className="text-[10px] font-mono text-slate-500">{p.invoiceNumber}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900">
                      NPR {p.amount.toLocaleString()}
                    </p>
                    <span
                      className={`text-[10px] font-bold ${
                        p.status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {p.status === 'PAID' ? `via ${p.paymentMethod ?? 'Platform'}` : 'PENDING'}
                    </span>
                  </div>
                </motion.div>
              ))}
              {payments.length === 0 && (
                <div className="p-10 text-center text-xs text-slate-500">
                  No payment records yet
                </div>
              )}
            </div>
          </div>

          {/* Early Termination Callout */}
          <div className="rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200/80">
            <div className="text-xs text-slate-600">
              <span className="font-bold text-slate-900 block mb-0.5">
                Need to relocate or end your agreement early?
              </span>
              Subject to Muluki Civil Code 2074 notice periods. Penalty clauses may apply per Clause 12 of your lease.
            </div>
            <button
              type="button"
              onClick={onOpenEarlyTerminationModal}
              disabled={isTerminated}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline disabled:opacity-40 shrink-0 whitespace-nowrap transition-colors"
            >
              Request Early Termination →
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
