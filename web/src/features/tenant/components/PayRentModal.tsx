/**
 * PayRentModal Component — Upgraded with Modern UI Primitives
 *
 * Integrated Nepali Payment Gateway Modal supporting:
 * - eSewa Mobile Wallet
 * - Khalti Digital Wallet
 * - ConnectIPS Direct Bank Settlement
 * - Card / Bank Transfer
 * - ShimmerButton action and StatusPill trust badge
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import type { PaymentRecord } from '@/types/tenant';
import { useAuth } from '@/features/auth/AuthContext';
import { tenantService } from '@/features/tenant/tenant.service';
import { ShimmerButton, StatusPill } from '@/components/ui';

interface PayRentModalProps {
  payment: PaymentRecord | null;
  onClose: () => void;
  onPaymentSuccess: (paidPayment: PaymentRecord) => void;
}

type PaymentMethodType = PaymentRecord['paymentMethod'];

const PAYMENT_METHODS: { id: PaymentMethodType; name: string; tag: string; gradient: string }[] = [
  { id: 'eSewa', name: 'eSewa Mobile Wallet', tag: 'Fastest in Nepal', gradient: 'from-emerald-600 to-green-500' },
  { id: 'Khalti', name: 'Khalti Digital Wallet', tag: 'Instant Cashback', gradient: 'from-purple-600 to-violet-500' },
  { id: 'ConnectIPS', name: 'ConnectIPS Bank Transfer', tag: 'Direct NCHL', gradient: 'from-blue-600 to-cyan-500' },
  { id: 'Card', name: 'Debit / Credit Card', tag: 'Visa / Mastercard', gradient: 'from-slate-700 to-slate-600' },
  { id: 'Bank Transfer', name: 'Manual Bank Deposit', tag: 'Voucher Upload', gradient: 'from-teal-700 to-emerald-600' },
];

export function PayRentModal({
  payment,
  onClose,
  onPaymentSuccess,
}: PayRentModalProps) {
  const { accessToken } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('eSewa');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedPayment, setCompletedPayment] = useState<PaymentRecord | null>(null);

  if (!payment) return null;

  const handlePay = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const txId = `TX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const res = await tenantService.payRent(payment.id, selectedMethod, txId, accessToken);
      setCompletedPayment(res);
      onPaymentSuccess(res);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 14 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/70">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-display font-bold text-slate-900 tracking-tight">Pay Rent Online</h2>
                <StatusPill variant="info" size="sm">Escrow Protected</StatusPill>
              </div>
              <p className="text-xs font-mono text-slate-400 mt-0.5">{payment.invoiceNumber}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full transition-colors text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {completedPayment ? (
            <div className="p-7 text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto bg-emerald-50 border border-emerald-200 shadow-sm"
              >
                <CheckCircle2 className="w-9 h-9 text-emerald-600" />
              </motion.div>
              <h3 className="text-xl font-display font-bold text-slate-900">Payment Successful!</h3>
              <p className="text-xs leading-relaxed text-slate-600">
                Your rent payment of <strong className="text-slate-900 font-mono">NPR {completedPayment.amount.toLocaleString()}</strong> for{' '}
                {completedPayment.billingMonth} has been completed and verified.
              </p>

              <div className="p-4 rounded-2xl text-xs text-left space-y-2 my-4 bg-slate-50 border border-slate-200/90">
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction ID:</span>
                  <span className="font-mono font-semibold text-blue-600">{completedPayment.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Method:</span>
                  <span className="font-medium text-slate-800">{completedPayment.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date Cleared:</span>
                  <span className="font-medium text-slate-800">{completedPayment.paidDate}</span>
                </div>
              </div>

              <div className="pt-2">
                <ShimmerButton
                  variant="primary"
                  size="md"
                  onClick={onClose}
                  className="w-full"
                >
                  View in Payments Ledger
                </ShimmerButton>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-4 text-xs">
              {/* Invoice Breakdown */}
              <div className="p-4 rounded-2xl space-y-2 bg-blue-50/50 border border-blue-100">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">Base Rent ({payment.billingMonth}):</span>
                  <span className="font-bold text-slate-900 font-mono">NPR {payment.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">Platform Escrow Fee:</span>
                  <span className="font-bold text-emerald-600 font-mono">FREE (0.00)</span>
                </div>
                <div className="pt-2.5 flex justify-between items-baseline border-t border-blue-200/60">
                  <span className="font-bold text-slate-900 font-display">Total Payable:</span>
                  <span className="text-xl font-display font-black text-slate-900 font-mono">
                    NPR {payment.amount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Gateway Choice */}
              <div className="space-y-2">
                <label className="text-xs font-semibold block text-slate-700 tracking-tight">
                  Select Nepali Payment Gateway
                </label>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map((m) => {
                    const isSelected = selectedMethod === m.id;

                    return (
                      <div
                        key={m.id}
                        onClick={() => setSelectedMethod(m.id)}
                        className={`p-3 rounded-2xl cursor-pointer transition-all duration-200 flex items-center justify-between border ${
                          isSelected
                            ? 'bg-blue-50/60 border-blue-600 ring-2 ring-blue-500/10 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-xl bg-gradient-to-br ${m.gradient} text-white flex items-center justify-center font-bold text-xs shadow-xs font-display`}
                          >
                            {m.id ? m.id[0] : 'P'}
                          </div>
                          <div>
                            <span className="font-bold text-xs block text-slate-900 font-display">{m.name}</span>
                            <span className={`text-[10px] ${isSelected ? 'text-blue-700 font-medium' : 'text-slate-400'}`}>
                              {m.tag}
                            </span>
                          </div>
                        </div>

                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                            isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Security Badge */}
              <div className="flex items-center gap-2 text-[11px] pt-1 text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>256-bit encrypted settlement &bull; Instant tax-compliant receipt</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <ShimmerButton
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </ShimmerButton>
                <ShimmerButton
                  type="button"
                  isLoading={isProcessing}
                  onClick={handlePay}
                  className="flex-1"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Pay NPR {payment.amount.toLocaleString()}
                </ShimmerButton>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
