/**
 * TenancyDashboardView — Premium Resident Portal
 *
 * Glassmorphism hero, animated SVG progress rings, pulse stat cards,
 * collapsible covenants, payment history, and full motion.dev animations.
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
  value, max, size = 80, stroke = 6, color = '#818cf8', label, sublabel,
}: { value: number; max: number; size?: number; stroke?: number; color?: string; label: string; sublabel: string; }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(value / Math.max(max, 1), 1));
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} />
          <motion.circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={color} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.4, ease: 'easeOut', delay: 0.35 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-white">{label}</span>
        </div>
      </div>
      <span className="text-[10px] text-slate-400 text-center leading-tight max-w-[72px]">{sublabel}</span>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, sub, gradient, onClick, pulse,
}: { icon: React.ElementType; label: string; value: string; sub: string; gradient: string; onClick?: () => void; pulse?: boolean; }) {
  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: '0 20px 48px rgba(0,0,0,0.13)' }}
      whileTap={{ scale: 0.975 }}
      onClick={onClick}
      className="relative bg-white rounded-2xl border border-slate-200/80 p-5 cursor-pointer overflow-hidden shadow-sm select-none hover:border-brand-200 transition-all"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-[0.05]`} />
      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center shadow-sm`}>
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
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="text-base font-display font-bold text-slate-900 mt-0.5 leading-tight">{value}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
        </div>
        {onClick && (
          <div className="flex items-center gap-1 text-xs font-semibold text-brand-600">
            <span>Open</span><ChevronRight className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function TenancyDashboardView({
  lease, payments, maintenanceTickets,
  onOpenLeaseModal, onOpenPayRentModal, onOpenMaintenanceModal,
  onOpenDisputeModal, onOpenEarlyTerminationModal, onBrowseListings,
}: TenancyDashboardViewProps) {
  const [covenantsOpen, setCovenantsOpen] = useState(true);

  if (!lease) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-slate-200 p-14 text-center max-w-lg mx-auto space-y-5 shadow-sm">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center mx-auto shadow-lg">
          <Building className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl font-display font-semibold text-slate-900">No Active Tenancy</h3>
          <p className="text-sm text-slate-500 leading-relaxed mt-2">
            Once your rental application is approved and both parties digitally sign the lease, your full Resident Hub activates here.
          </p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onBrowseListings}
          className="px-6 py-3 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white text-sm font-semibold rounded-xl shadow-md transition-all">
          Discover Available Properties
        </motion.button>
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
      <div className="relative rounded-3xl overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-brand-950 to-slate-900" />
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.4) 1px,transparent 1px)`,
          backgroundSize: '48px 48px',
        }} />
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 p-7 sm:p-9">
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                isTerminated ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                : isPendingSignature ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'}`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                isTerminated ? 'bg-rose-400' : isPendingSignature ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              {isTerminated ? 'Terminated Early' : isPendingSignature ? 'Signature Pending' : 'Active Tenancy'}
            </motion.span>
            <span className="text-[11px] text-slate-500 font-mono">#{lease.id}</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">{lease.unitIdentifier}</h1>
                  <p className="text-brand-300 font-medium text-sm mt-0.5 truncate">{lease.propertyTitle}</p>
                  <p className="text-xs text-slate-400 truncate">{lease.propertyAddress}, {lease.propertyCity}</p>
                </div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1.5">
                <span>{lease.startDate}</span>
                <span className="text-brand-300 font-semibold">{leaseProgress}% elapsed</span>
                <span>{lease.endDate}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-brand-400 to-emerald-400 rounded-full"
                  initial={{ width: 0 }} animate={{ width: `${leaseProgress}%` }}
                  transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }} />
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {[
                  { icon: CreditCard, label: `NPR ${lease.agreedMonthlyRent.toLocaleString()}`, sub: '/ month', c: 'text-brand-300' },
                  { icon: Key, label: `NPR ${lease.agreedDeposit.toLocaleString()}`, sub: 'deposit', c: 'text-amber-300' },
                  { icon: Calendar, label: `${totalDays} days`, sub: 'total term', c: 'text-emerald-300' },
                ].map(({ icon: Ic, label, sub, c }) => (
                  <div key={sub} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/8 border border-white/10 text-xs">
                    <Ic className={`w-3.5 h-3.5 ${c}`} />
                    <span className="text-white font-semibold">{label}</span>
                    <span className="text-slate-400">{sub}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-5 sm:gap-7 shrink-0">
              <ProgressRing value={elapsedMs} max={totalMs} color="#34d399" label={`${leaseProgress}%`} sublabel="Lease elapsed" />
              <ProgressRing value={paidCount} max={payments.length || 1} color="#818cf8" label={`${paidCount}/${payments.length}`} sublabel="Invoices paid" />
              <div className="hidden sm:flex flex-col items-center gap-1.5">
                <div className="w-[80px] h-[80px] rounded-full bg-white/10 border border-white/15 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-white">{daysLeft}</span>
                  <span className="text-[10px] text-slate-400">days</span>
                </div>
                <span className="text-[10px] text-slate-400 text-center">{isTerminated ? 'terminated' : 'remaining'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {isPendingSignature && !isTerminated && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0"><AlertCircle className="w-5 h-5" /></div>
              <div>
                <h4 className="text-sm font-semibold text-amber-900">Lease Requires Your Electronic Signature</h4>
                <p className="text-xs text-amber-700 mt-0.5">Review the Muluki Civil Code 2074-compliant terms and execute your binding digital signature.</p>
              </div>
            </div>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={onOpenLeaseModal}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors shrink-0 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Review & Sign
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {nextPayment && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50/60 border border-rose-200 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0"><AlertTriangle className="w-5 h-5" /></div>
              <div className="text-xs">
                <span className="font-bold text-rose-900 block">Rent Due: {nextPayment.dueDate}</span>
                <span className="text-rose-700">{nextPayment.invoiceNumber} · NPR {nextPayment.amount.toLocaleString()} · {nextPayment.billingMonth}</span>
              </div>
            </div>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={onOpenPayRentModal}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors shrink-0">
              Pay Now →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stat Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Lease Agreement"
          value={lease.signedAt ? 'Signed & Active' : 'Needs Signature'}
          sub={lease.signedAt ? `Signed ${new Date(lease.signedAt).toLocaleDateString()}` : 'Review & sign digitally'}
          gradient="from-brand-500 to-brand-700" onClick={onOpenLeaseModal} pulse={!lease.signedAt} />
        <StatCard icon={CreditCard} label="Rent Payments"
          value={nextPayment ? `NPR ${nextPayment.amount.toLocaleString()}` : 'All Settled ✓'}
          sub={nextPayment ? `Due: ${nextPayment.dueDate}` : `${paidCount} invoices paid`}
          gradient="from-emerald-500 to-teal-600" onClick={onOpenPayRentModal} pulse={!!nextPayment} />
        <StatCard icon={Wrench} label="Maintenance"
          value={openMaintCount > 0 ? `${openMaintCount} Open` : 'No Issues'}
          sub={openMaintCount > 0 ? 'Tickets in progress' : 'All resolved'}
          gradient="from-amber-500 to-orange-600" onClick={onOpenMaintenanceModal} pulse={openMaintCount > 0} />
        <StatCard icon={ShieldCheck} label="Disputes & Rights" value="Protected"
          sub="Muluki Civil Code 2074" gradient="from-indigo-500 to-purple-600" onClick={onOpenDisputeModal} />
      </div>

      {/* Detail Grid */}
      <div className="grid lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4 space-y-4">
          {/* Landlord */}
          <motion.div whileHover={{ y: -2 }} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-4">Landlord Contact</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 text-brand-700 font-bold flex items-center justify-center text-lg shadow-xs">
                {lease.landlordName[0]}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{lease.landlordName}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs text-slate-500">Verified Landlord</span>
                </div>
              </div>
            </div>
            {lease.landlordPhone && (
              <a href={`tel:${lease.landlordPhone}`}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 hover:bg-brand-50 border border-slate-200 hover:border-brand-200 text-xs font-medium text-slate-700 hover:text-brand-700 transition-all">
                <Phone className="w-4 h-4 text-brand-600" />{lease.landlordPhone}
              </a>
            )}
          </motion.div>
          {/* Summary */}
          <motion.div whileHover={{ y: -2 }} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Tenancy Summary</p>
            {[
              { label: 'Monthly Rent', value: `NPR ${lease.agreedMonthlyRent.toLocaleString()}`, icon: CreditCard },
              { label: 'Security Deposit', value: `NPR ${lease.agreedDeposit.toLocaleString()}`, icon: Key },
              { label: 'Term Start', value: lease.startDate, icon: Calendar },
              { label: 'Term End', value: lease.endDate, icon: Clock },
              { label: 'Days Remaining', value: isTerminated ? 'Terminated' : `${daysLeft} days`, icon: TrendingUp },
            ].map(({ label, value, icon: Ic }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 text-xs">
                <div className="flex items-center gap-1.5 text-slate-500"><Ic className="w-3.5 h-3.5 text-brand-400" />{label}</div>
                <span className="font-semibold text-slate-800">{value}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="lg:col-span-8 space-y-4">
          {/* Collapsible Covenants */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <button type="button" onClick={() => setCovenantsOpen((v) => !v)}
              className="w-full flex items-center justify-between p-5 hover:bg-slate-50/70 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><ShieldCheck className="w-4 h-4" /></div>
                <span className="text-sm font-display font-semibold text-slate-900">Key Tenancy Conditions</span>
              </div>
              <motion.div animate={{ rotate: covenantsOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </motion.div>
            </button>
            <AnimatePresence initial={false}>
              {covenantsOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                  <div className="px-5 pb-5 space-y-2">
                    {[
                      { icon: CreditCard, c: 'text-emerald-600', t: 'Rent Due Date', d: 'Cleared by the 5th of each month via RentHub digital payment.' },
                      { icon: Home, c: 'text-brand-600', t: 'Quiet Enjoyment', d: 'Landlord must give 24h written notice before any premises entry.' },
                      { icon: Key, c: 'text-amber-600', t: 'Deposit Protection', d: `NPR ${lease.agreedDeposit.toLocaleString()} refunded within 14 days of lease completion.` },
                      { icon: Zap, c: 'text-purple-600', t: 'Utilities', d: 'Electricity (NEA), water, and internet billed separately at actuals.' },
                    ].map(({ c, t, d }) => (
                      <div key={t} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                        <CheckCircle2 className={`w-4 h-4 ${c} shrink-0 mt-0.5`} />
                        <div>
                          <span className="text-xs font-semibold text-slate-800 block">{t}</span>
                          <span className="text-[11px] text-slate-500 leading-relaxed">{d}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Payment History */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"><TrendingUp className="w-4 h-4" /></div>
                <span className="text-sm font-display font-semibold text-slate-900">Payment History</span>
              </div>
              <span className="text-xs text-slate-400">{payments.length} records</span>
            </div>
            <div className="divide-y divide-slate-100">
              {payments.slice(0, 5).map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${p.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {p.status === 'PAID' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{p.billingMonth}</p>
                      <p className="text-[10px] text-slate-400">{p.invoiceNumber}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900">NPR {p.amount.toLocaleString()}</p>
                    <span className={`text-[10px] font-semibold ${p.status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {p.status === 'PAID' ? `via ${p.paymentMethod ?? 'Platform'}` : 'PENDING'}
                    </span>
                  </div>
                </motion.div>
              ))}
              {payments.length === 0 && <div className="p-10 text-center text-xs text-slate-400">No payment records yet</div>}
            </div>
          </div>

          {/* Early Termination */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700 block mb-0.5">Need to relocate or end your agreement early?</span>
              Subject to Muluki Civil Code 2074 notice periods. Penalty clauses may apply per Clause 12 of your lease.
            </div>
            <button type="button" onClick={onOpenEarlyTerminationModal} disabled={isTerminated}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline disabled:opacity-40 shrink-0 whitespace-nowrap transition-colors">
              Request Early Termination →
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
