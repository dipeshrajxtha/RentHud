/**
 * ReceiptModal Component
 */

import { motion, AnimatePresence } from 'motion/react';
import { X, Printer, CheckCircle2 } from 'lucide-react';
import type { PaymentRecord, LeaseAgreement } from '@/types/tenant';
import { RentHubLogo } from '@/components/common/RentHubLogo';

interface ReceiptModalProps {
  payment: PaymentRecord | null;
  lease: LeaseAgreement | null;
  onClose: () => void;
}

export function ReceiptModal({ payment, lease, onClose }: ReceiptModalProps) {
  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
            <span className="text-xs font-semibold text-slate-700">Official Electronic Rent Receipt</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition-colors"
                title="Print Receipt"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Body */}
          <div className="p-8 space-y-6 text-xs text-slate-700 font-sans">
            {/* Logo & Platform Info */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-200">
              <RentHubLogo variant="original" className="h-6" />
              <div className="text-right">
                <span className="font-mono font-semibold text-slate-900 block text-xs">{payment.invoiceNumber}</span>
                <span className="text-[11px] text-slate-400">Date Cleared: {payment.paidDate ?? 'N/A'}</span>
              </div>
            </div>

            {/* Verification Stamp */}
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-xs">Payment Verified & Settled</span>
              </div>
              <span className="font-mono text-[10px] text-emerald-700">STATUS: PAID</span>
            </div>

            {/* Billing Details */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Billed To (Tenant):</span>
                <strong className="text-slate-900 font-semibold block">{lease?.tenantName ?? 'Dipesh Raj'}</strong>
                <span className="text-slate-500">Premises: {lease?.unitIdentifier ?? 'Unit 201'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Payee (Landlord):</span>
                <strong className="text-slate-900 font-semibold block">{lease?.landlordName ?? 'Bikram Thapa'}</strong>
                <span className="text-slate-500">Property: {lease?.propertyTitle ?? 'Sanepa Heights'}</span>
              </div>
            </div>

            {/* Line Items */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-4 text-right">Amount (NPR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      Residential Rent for {payment.billingMonth}
                    </td>
                    <td className="py-3 px-4 text-right font-display font-semibold text-slate-900">
                      {payment.amount.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="py-2.5 px-4 font-semibold text-slate-800">Total Cleared</td>
                    <td className="py-2.5 px-4 text-right font-display font-bold text-slate-900 text-sm">
                      NPR {payment.amount.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Gateway Metadata */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 text-[11px] text-slate-500">
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <strong className="text-slate-800 font-medium">{payment.paymentMethod ?? 'eSewa'}</strong>
              </div>
              <div className="flex justify-between">
                <span>Transaction Ref:</span>
                <span className="font-mono text-slate-800">{payment.transactionId ?? 'RH-TX-99128'}</span>
              </div>
            </div>

            <div className="text-center pt-2 text-[10px] text-slate-400">
              This receipt constitutes legal proof of residential rent payment under Nepal Tenancy Regulations.
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
