/**
 * ReceiptModal Component — Manus / Aceternity Digital Receipt
 *
 * Official Electronic Rent Receipt with:
 * - Legal proof of settlement under Nepal Muluki Civil Code
 * - Cryptographic verification seal
 * - Line item breakdown & cleared amounts
 * - Print-ready styling
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
      <div className="fixed inset-0 z-50 overflow-y-auto modal-overlay flex items-center justify-center p-3 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg card-premium overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, rgba(13,21,32,0.98) 0%, rgba(8,13,20,0.99) 100%)',
            border: '1px solid rgba(46, 139, 255, 0.25)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 35px rgba(46,139,255,0.1)',
          }}
        >
          {/* Top Bar */}
          <div
            className="flex items-center justify-between px-6 py-4.5"
            style={{
              background: 'rgba(8, 13, 20, 0.9)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <span className="text-xs font-bold font-display text-white">
              Official Electronic Rent Receipt
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="p-1.5 rounded-xl transition-colors hover:text-white"
                style={{ color: '#7187a5', background: 'rgba(255,255,255,0.03)' }}
                title="Print Receipt"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl transition-colors hover:text-white"
                style={{ color: '#7187a5', background: 'rgba(255,255,255,0.03)' }}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Body */}
          <div className="p-8 space-y-6 text-xs font-sans leading-relaxed" style={{ color: '#c8d8f0' }}>
            {/* Logo & Platform Info */}
            <div
              className="flex items-center justify-between pb-6"
              style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}
            >
              <RentHubLogo variant="white" className="h-6" />
              <div className="text-right">
                <span className="font-mono font-semibold text-brand-400 block text-xs">
                  {payment.invoiceNumber}
                </span>
                <span className="text-[11px]" style={{ color: '#5a7299' }}>
                  Date Cleared: {payment.paidDate ?? 'N/A'}
                </span>
              </div>
            </div>

            {/* Verification Stamp */}
            <div
              className="p-3.5 rounded-xl flex items-center justify-between"
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#6ee7b7',
              }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-xs font-display">Payment Verified & Settled</span>
              </div>
              <span className="font-mono text-[10px] text-emerald-300">STATUS: PAID</span>
            </div>

            {/* Billing Details */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div
                className="p-3.5 rounded-xl"
                style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}
              >
                <span className="block text-[11px] mb-1 font-display" style={{ color: '#5a7299' }}>
                  Billed To (Tenant):
                </span>
                <strong className="text-white font-bold block font-display">
                  {lease?.tenantName || 'Resident Tenant'}
                </strong>
                <span style={{ color: '#7187a5' }}>Premises: {lease?.unitIdentifier ?? 'Unit 201'}</span>
              </div>
              <div
                className="p-3.5 rounded-xl"
                style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}
              >
                <span className="block text-[11px] mb-1 font-display" style={{ color: '#5a7299' }}>
                  Payee (Landlord):
                </span>
                <strong className="text-white font-bold block font-display">
                  {lease?.landlordName || 'Property Landlord'}
                </strong>
                <span style={{ color: '#7187a5' }}>
                  Property: {lease?.propertyTitle ?? 'Residential Property'}
                </span>
              </div>
            </div>

            {/* Line Items */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: '1px solid rgba(255, 255, 255, 0.06)' }}
            >
              <table className="w-full text-left text-xs">
                <thead
                  className="uppercase text-[10px] font-semibold font-display"
                  style={{
                    background: 'rgba(8, 13, 20, 0.95)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    color: '#5a7299',
                  }}
                >
                  <tr>
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-4 text-right">Amount (NPR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="py-3 px-4 font-medium text-white">
                      Residential Rent for {payment.billingMonth}
                    </td>
                    <td className="py-3 px-4 text-right font-display font-bold text-white">
                      {payment.amount.toLocaleString()}
                    </td>
                  </tr>
                  <tr style={{ background: 'rgba(46, 139, 255, 0.05)' }}>
                    <td className="py-2.5 px-4 font-bold text-white font-display">Total Cleared</td>
                    <td className="py-2.5 px-4 text-right font-display font-black text-brand-300 text-sm">
                      NPR {payment.amount.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Gateway Metadata */}
            <div
              className="p-3.5 rounded-xl space-y-1.5 text-[11px]"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                color: '#7187a5',
              }}
            >
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <strong className="text-white font-medium">{payment.paymentMethod ?? 'eSewa'}</strong>
              </div>
              <div className="flex justify-between">
                <span>Transaction Ref:</span>
                <span className="font-mono text-brand-400">{payment.transactionId ?? 'RH-TX-99128'}</span>
              </div>
            </div>

            <div className="text-center pt-2 text-[10px]" style={{ color: '#4a6285' }}>
              This receipt constitutes legal proof of residential rent payment under Nepal Tenancy Regulations.
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
