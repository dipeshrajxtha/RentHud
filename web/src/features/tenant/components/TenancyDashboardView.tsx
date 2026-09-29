/**
 * TenancyDashboardView Component
 */

import React from 'react';
import { motion } from 'motion/react';
import {
  FileText,
  CreditCard,
  Wrench,
  AlertTriangle,
  LogOut,
  Calendar,
  Building,
  User,
  Phone,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Download,
  AlertCircle,
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
  if (!lease) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
          <Building className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-display font-semibold text-slate-900">No Active Tenancy</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          You do not have an active or pending rental agreement. Once your rental application is approved and signed, your resident portal will activate here.
        </p>
        <button
          onClick={onBrowseListings}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
        >
          Discover Available Properties
        </button>
      </div>
    );
  }

  const isTerminated = lease.status === 'terminated_early';
  const isPendingSignature = lease.status === 'pending_signature' || !lease.signedAt;
  const nextPayment = payments.find((p) => p.status === 'PENDING');
  const openMaintenanceCount = maintenanceTickets.filter((m) => m.status !== 'RESOLVED').length;

  // Calculate days remaining
  const end = new Date(lease.endDate).getTime();
  const now = new Date().getTime();
  const daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));

  return (
    <div className="space-y-6">
      {/* Active Tenancy Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-brand-950 via-slate-900 to-brand-900 text-white p-6 sm:p-8 overflow-hidden shadow-lg">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                  isTerminated
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : isPendingSignature
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isTerminated ? 'Terminated Early' : isPendingSignature ? 'Pending Digital Signature' : 'Active Tenancy'}
              </span>

              <span className="text-xs text-slate-400 font-mono">Lease #{lease.id}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-white">
              {lease.unitIdentifier} · {lease.propertyTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 flex items-center gap-1.5">
              <span>{lease.propertyAddress}, {lease.propertyCity}</span>
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 sm:gap-6 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">Monthly Rent</span>
              <span className="text-xl sm:text-2xl font-display font-bold text-white">
                NPR {lease.agreedMonthlyRent.toLocaleString()}
              </span>
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">Term Remaining</span>
              <span className="text-xl sm:text-2xl font-display font-bold text-brand-300">
                {isTerminated ? '0 days' : `${daysLeft} days`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tenancy Notice if Pending Signature */}
      {isPendingSignature && !isTerminated && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-amber-900">Lease Agreement Requires Electronic Signature</h4>
              <p className="text-xs text-amber-700">
                Review the terms and execute your digital signature to seal the tenancy agreement legally.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenLeaseModal}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
          >
            Review & Sign Lease
          </button>
        </div>
      )}

      {/* Grid of Key Actions & Summaries */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Lease Agreement Card */}
        <div
          onClick={onOpenLeaseModal}
          className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-brand-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-display font-semibold text-slate-900">Digital Lease Agreement</h3>
            <p className="text-xs text-slate-500 mt-1">
              {lease.signedAt ? 'Signed & legally sealed' : 'Signature pending'}
            </p>
          </div>
          <span className="text-xs font-semibold text-brand-600 mt-4 inline-flex items-center gap-1">
            View Contract →
          </span>
        </div>

        {/* Rent Payments Card */}
        <div
          onClick={onOpenPayRentModal}
          className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-brand-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-display font-semibold text-slate-900">Rent & Payments</h3>
            <p className="text-xs text-slate-500 mt-1">
              {nextPayment ? `Next due: ${nextPayment.dueDate}` : 'All payments settled'}
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-600 mt-4 inline-flex items-center gap-1">
            {nextPayment ? 'Pay Rent Now →' : 'View Ledger →'}
          </span>
        </div>

        {/* Maintenance Card */}
        <div
          onClick={onOpenMaintenanceModal}
          className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-brand-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <Wrench className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-display font-semibold text-slate-900">Maintenance & Repairs</h3>
            <p className="text-xs text-slate-500 mt-1">
              {openMaintenanceCount > 0 ? `${openMaintenanceCount} open ticket` : 'No open issues'}
            </p>
          </div>
          <span className="text-xs font-semibold text-amber-600 mt-4 inline-flex items-center gap-1">
            Report Issue →
          </span>
        </div>

        {/* Disputes / Legal Card */}
        <div
          onClick={onOpenDisputeModal}
          className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-brand-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-display font-semibold text-slate-900">Disputes & Rights</h3>
            <p className="text-xs text-slate-500 mt-1">Deposit, quiet enjoyment, & legal mediation</p>
          </div>
          <span className="text-xs font-semibold text-indigo-600 mt-4 inline-flex items-center gap-1">
            Legal Support →
          </span>
        </div>
      </div>

      {/* Tenancy Covenants & Landlord Details */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Landlord Contact Info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-sm font-display font-semibold text-slate-900">Landlord Details</h3>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center">
              {lease.landlordName[0]}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{lease.landlordName}</p>
              <p className="text-xs text-slate-500">Registered Landlord</p>
            </div>
          </div>

          {lease.landlordPhone && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs font-medium text-slate-700">
              <Phone className="w-4 h-4 text-brand-600" />
              <span>{lease.landlordPhone}</span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Security Deposit:</span>
              <strong className="text-slate-900 font-medium">NPR {lease.agreedDeposit.toLocaleString()}</strong>
            </div>
            <div className="flex justify-between">
              <span>Term Start:</span>
              <span className="text-slate-700">{lease.startDate}</span>
            </div>
            <div className="flex justify-between">
              <span>Term End:</span>
              <span className="text-slate-700">{lease.endDate}</span>
            </div>
          </div>
        </div>

        {/* Covenants Digest */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-display font-semibold text-slate-900 mb-3">Key Tenancy Conditions</h3>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Rent Due Date:</strong> Payment must be cleared by the 5th of each Gregorian calendar month via RentHub.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Quiet Enjoyment & Privacy:</strong> Landlord is legally required to provide at least 24 hours prior written notice before entering premises for routine maintenance.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Deposit Protection:</strong> Security deposit of NPR {lease.agreedDeposit.toLocaleString()} is held for premises handover and refunded within 14 days of lease completion.
                </span>
              </li>
            </ul>
          </div>

          {/* Early termination option */}
          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Need to relocate or end your agreement early?</span>
            <button
              type="button"
              onClick={onOpenEarlyTerminationModal}
              disabled={isTerminated}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline disabled:opacity-50"
            >
              Request Early Termination
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
