/**
 * ReceiptModal Component — Clean Light Mode
 *
 * Official printable rent payment voucher
 */

import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Printer } from 'lucide-react';
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
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-4.5 bg-slate-50 border-b border-slate-200/80">
            <span className="text-xs font-bold font-display text-slate-900">
              Official Electronic Rent Receipt
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
                title="Print Receipt"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Body */}
          <div className="p-8 space-y-6 text-xs font-sans leading-relaxed text-slate-800">
            {/* Logo & Platform Info */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-200">
              <RentHubLogo variant="original" size="sm" />
              <div className="text-right">
                <span className="font-mono font-bold text-blue-600 block text-xs">
                  {payment.invoiceNumber}
                </span>
                <span className="text-[11px] text-slate-500">
                  Date Cleared: {payment.paidDate ?? 'N/A'}
                </span>
              </div>
            </div>

            {/* Verification Stamp */}
            <div className="p-3.5 rounded-2xl flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-xs font-display">Payment Verified & Settled</span>
              </div>
              <span className="font-mono text-[10px] font-bold text-emerald-700">STATUS: PAID</span>
            </div>

            {/* Billing Details */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="block text-[11px] mb-1 font-display text-slate-500">
                  Billed To (Tenant):
                </span>
                <strong className="text-slate-900 font-bold block font-display">
                  {lease?.tenantName || 'Resident Tenant'}
                </strong>
                <span className="text-slate-500">Premises: {lease?.unitIdentifier ?? 'Unit 201'}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="block text-[11px] mb-1 font-display text-slate-500">
                  Payee (Landlord):
                </span>
                <strong className="text-slate-900 font-bold block font-display">
                  {lease?.landlordName || 'Property Landlord'}
                </strong>
                <span className="text-slate-500">
                  Property: {lease?.propertyTitle ?? 'Residential Property'}
                </span>
              </div>
            </div>

            {/* Line Items */}
            <div className="rounded-2xl overflow-hidden border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="uppercase text-[10px] font-bold font-display bg-slate-100 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-4 text-right">Amount (NPR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      Residential Rent for {payment.billingMonth}
                    </td>
                    <td className="py-3 px-4 text-right font-display font-bold text-slate-900">
                      {payment.amount.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-blue-50/60">
                    <td className="py-2.5 px-4 font-bold text-slate-900 font-display">Total Cleared</td>
                    <td className="py-2.5 px-4 text-right font-display font-black text-blue-900 text-sm">
                      NPR {payment.amount.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Gateway Metadata */}
            <div className="p-3.5 rounded-2xl space-y-1.5 text-[11px] bg-slate-50 border border-slate-200/80 text-slate-600">
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <strong className="text-slate-900 font-medium">{payment.paymentMethod ?? 'eSewa'}</strong>
              </div>
              <div className="flex justify-between">
                <span>Transaction Ref:</span>
                <span className="font-mono font-bold text-blue-600">{payment.transactionId ?? 'RH-TX-99128'}</span>
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
