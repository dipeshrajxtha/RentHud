/**
 * PayRentModal Component
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import type { PaymentRecord } from '@/types/tenant';
import { useAuth } from '@/features/auth/AuthContext';
import { tenantService } from '@/features/tenant/tenant.service';

interface PayRentModalProps {
  payment: PaymentRecord | null;
  onClose: () => void;
  onPaymentSuccess: (paidPayment: PaymentRecord) => void;
}

type PaymentMethodType = PaymentRecord['paymentMethod'];

const PAYMENT_METHODS: { id: PaymentMethodType; name: string; tag: string; bg: string }[] = [
  { id: 'eSewa', name: 'eSewa Mobile Wallet', tag: 'Fastest in Nepal', bg: 'bg-emerald-600' },
  { id: 'Khalti', name: 'Khalti Digital Wallet', tag: 'Instant Cashback', bg: 'bg-purple-600' },
  { id: 'ConnectIPS', name: 'ConnectIPS Bank Transfer', tag: 'Direct NCHL', bg: 'bg-blue-600' },
  { id: 'Card', name: 'Debit / Credit Card', tag: 'Visa / Mastercard', bg: 'bg-slate-700' },
  { id: 'Bank Transfer', name: 'Manual Bank Deposit', tag: 'Voucher Upload', bg: 'bg-teal-700' },
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
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
            <div>
              <h2 className="text-base font-display font-semibold text-slate-900">Pay Rent Online</h2>
              <p className="text-xs text-slate-500 font-mono">{payment.invoiceNumber}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {completedPayment ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-display font-semibold text-slate-900">Payment Successful!</h3>
              <p className="text-xs text-slate-500">
                Your rent payment of <strong>NPR {completedPayment.amount.toLocaleString()}</strong> for {completedPayment.billingMonth} has been completed and verified.
              </p>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-left space-y-1.5 my-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Transaction ID:</span>
                  <span className="font-mono font-semibold text-slate-800">{completedPayment.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Method:</span>
                  <span className="font-medium text-slate-800">{completedPayment.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date Cleared:</span>
                  <span className="font-medium text-slate-800">{completedPayment.paidDate}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                >
                  View in Payments Ledger
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-5 text-xs text-slate-700">
              {/* Invoice Breakdown */}
              <div className="p-4 rounded-2xl bg-brand-50/70 border border-brand-200/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-brand-900">Base Rent ({payment.billingMonth}):</span>
                  <span className="font-medium text-slate-900">NPR {payment.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-brand-900">Platform Processing Fee:</span>
                  <span className="font-medium text-emerald-700">FREE (0.00)</span>
                </div>
                <div className="pt-2 border-t border-brand-200/80 flex justify-between items-baseline">
                  <span className="font-semibold text-brand-950">Total Payable:</span>
                  <span className="text-xl font-display font-bold text-brand-950">
                    NPR {payment.amount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Gateway Choice */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                  Select Nepali Payment Gateway
                </label>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map((m) => {
                    const isSelected = selectedMethod === m.id;

                    return (
                      <div
                        key={m.id}
                        onClick={() => setSelectedMethod(m.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg ${m.bg} text-white flex items-center justify-center font-bold text-[11px]`}>
                            {m.id ? m.id[0] : 'P'}
                          </div>
                          <div>
                            <span className="font-semibold text-xs block">{m.name}</span>
                            <span className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                              {m.tag}
                            </span>
                          </div>
                        </div>

                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-brand-400 bg-brand-400 text-slate-900' : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Security Badge */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>256-bit encrypted settlement · Instant receipt generated</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handlePay}
                  className="flex-1 py-2.5 px-4 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authorizing…</span>
                    </>
                  ) : (
                    <>
                      <span>Pay NPR {payment.amount.toLocaleString()}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
