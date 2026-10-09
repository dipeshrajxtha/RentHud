/**
 * PayRentModal Component — Clean Light Mode
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
      const txId = TX--;
      const res = await tenantService.payRent(payment.id, selectedMethod, txId, accessToken);
      setCompletedPayment(res);
      onPaymentSuccess(res);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className=fixed inset-0 z-50 overflow-y-auto modal-overlay flex items-center justify-center p-3 sm:p-6>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className=relative w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden
        >
          {/* Header */}
          <div className=flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/60>
            <div>
              <h2 className=text-base font-display font-bold text-slate-900>Pay Rent Online</h2>
              <p className=text-xs font-mono text-slate-500>{payment.invoiceNumber}</p>
            </div>
            <button
              onClick={onClose}
              className=p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors
              aria-label=Close
            >
              <X className=w-5 h-5 />
            </button>
          </div>

          {completedPayment ? (
            <div className=p-8 text-center space-y-4>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                className=w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-sm
              >
                <CheckCircle2 className=w-9 h-9 />
              </motion.div>
              <h3 className=text-xl font-display font-bold text-slate-900>Payment Successful!</h3>
              <p className=text-xs leading-relaxed text-slate-600>
                Your rent payment of <strong className=text-slate-900>NPR {completedPayment.amount.toLocaleString()}</strong> for{' '}
                {completedPayment.billingMonth} has been completed and verified.
              </p>

              <div className=p-4 rounded-2xl text-xs text-left space-y-2.5 my-4 bg-slate-50 border border-slate-200/80>
                <div className=flex justify-between>
                  <span className=text-slate-500>Transaction ID:</span>
                  <span className=font-mono font-bold text-blue-600>{completedPayment.transactionId}</span>
                </div>
                <div className=flex justify-between>
                  <span className=text-slate-500>Payment Method:</span>
                  <span className=font-semibold text-slate-800>{completedPayment.paymentMethod}</span>
                </div>
                <div className=flex justify-between>
                  <span className=text-slate-500>Date Cleared:</span>
                  <span className=font-semibold text-slate-800>{completedPayment.paidDate}</span>
                </div>
              </div>

              <div className=pt-2>
                <button
                  type=button
                  onClick={onClose}
                  className=btn-primary btn-md w-full font-display
                >
                  View in Payments Ledger
                </button>
              </div>
            </div>
          ) : (
            <div className=p-6 space-y-5 text-xs>
              {/* Invoice Breakdown */}
              <div className=p-4 rounded-2xl space-y-2.5 bg-blue-50/70 border border-blue-200/80>
                <div className=flex justify-between items-center text-xs>
                  <span className=text-slate-600>Base Rent ({payment.billingMonth}):</span>
                  <span className=font-bold text-slate-900 font-display>NPR {payment.amount.toLocaleString()}</span>
                </div>
                <div className=flex justify-between items-center text-xs>
                  <span className=text-slate-600>Platform Processing Fee:</span>
                  <span className=font-bold text-emerald-700>FREE (NPR 0.00)</span>
                </div>
                <div className=pt-2.5 flex justify-between items-baseline border-t border-blue-200>
                  <span className=font-bold text-slate-800 font-display>Total Payable:</span>
                  <span className=text-xl font-display font-black text-blue-900>
                    NPR {payment.amount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Gateway Choice */}
              <div>
                <label className=text-xs font-bold uppercase tracking-wider block mb-2.5 font-display text-slate-500>
                  Select Nepali Payment Gateway
                </label>
                <div className=space-y-2>
                  {PAYMENT_METHODS.map((m) => {
                    const isSelected = selectedMethod === m.id;

                    return (
                      <div
                        key={m.id}
                        onClick={() => setSelectedMethod(m.id)}
                        className={p-3 rounded-2xl cursor-pointer transition-all duration-200 flex items-center justify-between border-2 }
                      >
                        <div className=flex items-center gap-3>
                          <div
                            className={w-8 h-8 rounded-xl bg-gradient-to-br  text-white flex items-center justify-center font-bold text-xs shadow-xs font-display}
                          >
                            {m.id ? m.id[0] : 'P'}
                          </div>
                          <div>
                            <span className=font-bold text-xs block text-slate-900 font-display>{m.name}</span>
                            <span className={	ext-[10px] }>
                              {m.tag}
                            </span>
                          </div>
                        </div>

                        <div
                          className={w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all }
                        >
                          {isSelected && <div className=w-1.5 h-1.5 rounded-full bg-white />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Security Badge */}
              <div className=flex items-center gap-2 text-[11px] pt-1 text-slate-500>
                <ShieldCheck className=w-4 h-4 text-emerald-600 shrink-0 />
                <span>256-bit encrypted settlement &middot; Instant receipt generated</span>
              </div>

              {/* Action Buttons */}
              <div className=flex items-center gap-3 pt-2>
                <button
                  type=button
                  onClick={onClose}
                  className=btn-secondary btn-md flex-1 font-display
                >
                  Cancel
                </button>
                <button
                  type=button
                  disabled={isProcessing}
                  onClick={handlePay}
                  className=btn-primary btn-md flex-1 flex items-center justify-center gap-2 font-display
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className=w-4 h-4 animate-spin />
                      <span>Authorizing…</span>
                    </>
                  ) : (
                    <>
                      <span>Pay NPR {payment.amount.toLocaleString()}</span>
                      <ArrowRight className=w-3.5 h-3.5 />
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
