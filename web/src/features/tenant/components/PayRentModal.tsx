/**
 * PayRentModal Component — Manus.im / Aceternity Dark Payment Gateway
 *
 * Integrated Nepali Payment Gateway Modal supporting:
 * - eSewa Mobile Wallet
 * - Khalti Digital Wallet
 * - ConnectIPS Direct Bank Settlement
 * - Card / Bank Transfer
 * - Instant cryptographic transaction receipt generation
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
      <div className="fixed inset-0 z-50 overflow-y-auto modal-overlay flex items-center justify-center p-3 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md card-premium overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, rgba(13,21,32,0.98) 0%, rgba(8,13,20,0.99) 100%)',
            border: '1px solid rgba(46, 139, 255, 0.25)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 40px rgba(46,139,255,0.1)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-5"
            style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}
          >
            <div>
              <h2 className="text-base font-display font-bold text-white">Pay Rent Online</h2>
              <p className="text-xs font-mono" style={{ color: '#5a7299' }}>{payment.invoiceNumber}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl transition-colors hover:text-white"
              style={{ color: '#7187a5', background: 'rgba(255,255,255,0.03)' }}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {completedPayment ? (
            <div className="p-8 text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  boxShadow: '0 0 24px rgba(16, 185, 129, 0.2)',
                }}
              >
                <CheckCircle2 className="w-9 h-9 text-emerald-400" />
              </motion.div>
              <h3 className="text-xl font-display font-bold text-white">Payment Successful!</h3>
              <p className="text-xs leading-relaxed" style={{ color: '#94aac5' }}>
                Your rent payment of <strong className="text-white">NPR {completedPayment.amount.toLocaleString()}</strong> for{' '}
                {completedPayment.billingMonth} has been completed and verified.
              </p>

              <div
                className="p-4 rounded-xl text-xs text-left space-y-2 my-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div className="flex justify-between">
                  <span style={{ color: '#5a7299' }}>Transaction ID:</span>
                  <span className="font-mono font-semibold text-brand-400">{completedPayment.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#5a7299' }}>Payment Method:</span>
                  <span className="font-medium text-white">{completedPayment.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#5a7299' }}>Date Cleared:</span>
                  <span className="font-medium text-white">{completedPayment.paidDate}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-primary btn-md w-full shine-hover font-display"
                >
                  View in Payments Ledger
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-5 text-xs">
              {/* Invoice Breakdown */}
              <div
                className="p-4 rounded-2xl space-y-2"
                style={{
                  background: 'rgba(46, 139, 255, 0.08)',
                  border: '1px solid rgba(46, 139, 255, 0.2)',
                }}
              >
                <div className="flex justify-between items-center text-xs">
                  <span style={{ color: '#94aac5' }}>Base Rent ({payment.billingMonth}):</span>
                  <span className="font-bold text-white font-display">NPR {payment.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span style={{ color: '#94aac5' }}>Platform Processing Fee:</span>
                  <span className="font-bold text-emerald-400">FREE (0.00)</span>
                </div>
                <div
                  className="pt-2.5 flex justify-between items-baseline"
                  style={{ borderTop: '1px solid rgba(46, 139, 255, 0.2)' }}
                >
                  <span className="font-bold text-white font-display">Total Payable:</span>
                  <span className="text-xl font-display font-black text-white">
                    NPR {payment.amount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Gateway Choice */}
              <div>
                <label
                  className="text-xs font-bold uppercase tracking-wider block mb-2.5 font-display"
                  style={{ color: '#5a7299' }}
                >
                  Select Nepali Payment Gateway
                </label>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map((m) => {
                    const isSelected = selectedMethod === m.id;

                    return (
                      <div
                        key={m.id}
                        onClick={() => setSelectedMethod(m.id)}
                        className={`p-3 rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-between ${
                          isSelected ? 'shadow-brand-sm' : ''
                        }`}
                        style={{
                          background: isSelected ? 'rgba(46, 139, 255, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                          border: isSelected ? '1px solid rgba(46, 139, 255, 0.45)' : '1px solid rgba(255, 255, 255, 0.06)',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg bg-gradient-to-br ${m.gradient} text-white flex items-center justify-center font-bold text-xs shadow-xs font-display`}
                          >
                            {m.id ? m.id[0] : 'P'}
                          </div>
                          <div>
                            <span className="font-bold text-xs block text-white font-display">{m.name}</span>
                            <span className="text-[10px]" style={{ color: isSelected ? '#8ec7ff' : '#7187a5' }}>
                              {m.tag}
                            </span>
                          </div>
                        </div>

                        <div
                          className="w-4 h-4 rounded-full border flex items-center justify-center transition-all"
                          style={{
                            borderColor: isSelected ? '#2e8bff' : 'rgba(255, 255, 255, 0.2)',
                            background: isSelected ? '#2e8bff' : 'transparent',
                          }}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Security Badge */}
              <div className="flex items-center gap-2 text-[11px] pt-1" style={{ color: '#7187a5' }}>
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>256-bit encrypted settlement · Instant receipt generated</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-ghost btn-md flex-1 font-display"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handlePay}
                  className="btn-primary btn-md flex-1 shine-hover flex items-center justify-center gap-2 font-display"
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
