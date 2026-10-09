/**
 * PaymentsView Component — Clean Light Financial Ledger
 *
 * Resident Financial Hub with:
 * - Upcoming billing cycle alert banner with direct payment CTA
 * - Segmented invoice filters (All, Pending, Completed)
 * - Crisp white card ledger table with status pills
 * - Instant digital receipt viewer trigger
 */

import { useState } from 'react';
import { CreditCard, CheckCircle2, FileText, ArrowUpRight } from 'lucide-react';
import type { PaymentRecord } from '@/types/tenant';

interface PaymentsViewProps {
  payments: PaymentRecord[];
  onOpenPayModal: (payment: PaymentRecord) => void;
  onViewReceipt: (payment: PaymentRecord) => void;
}

export function PaymentsView({
  payments,
  onOpenPayModal,
  onViewReceipt,
}: PaymentsViewProps) {
  const [filter, setFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');

  const pendingPayment = payments.find((p) => p.status === 'PENDING');
  const filtered = filter === 'ALL' ? payments : payments.filter((p) => p.status === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Rent & Payments Ledger</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Track monthly billing cycles, digital payment receipts, and security deposits
        </p>
      </div>

      {/* Top Banner: Upcoming Due */}
      {pendingPayment ? (
        <div className="rounded-2xl p-6 bg-gradient-to-r from-blue-50 via-indigo-50/60 to-white border border-blue-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl flex items-center justify-center bg-blue-600 text-white shrink-0 shadow-xs">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-blue-700 block">
                Upcoming Rent Invoice · {pendingPayment.billingMonth}
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5 tracking-tight">
                NPR {pendingPayment.amount.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Due date: {pendingPayment.dueDate}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenPayModal(pendingPayment)}
            className="flex items-center justify-center gap-2 self-start sm:self-center px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Pay with eSewa / Khalti</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="rounded-2xl p-5 flex items-center gap-3.5 bg-emerald-50 border border-emerald-200/90">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <span className="font-bold text-emerald-900 block text-sm">
              All Rent Invoices Settled
            </span>
            <span className="text-emerald-700">
              You have no pending dues for the current billing cycle.
            </span>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1 p-1 rounded-xl text-xs font-medium bg-slate-100 border border-slate-200/80">
          {(['ALL', 'PENDING', 'PAID'] as const).map((tab) => {
            const isSelected = filter === tab;
            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  isSelected
                    ? 'bg-white text-blue-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab === 'ALL' ? 'All Invoices' : tab === 'PENDING' ? 'Pending' : 'Completed'}
              </button>
            );
          })}
        </div>

        <span className="text-xs text-slate-500 font-medium">
          {filtered.length} records
        </span>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 bg-slate-50 border-b border-slate-200/80">
              <tr>
                <th className="py-3.5 px-5">Invoice Reference</th>
                <th className="py-3.5 px-4">Billing Month</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Method</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/75 transition-colors">
                  <td className="py-3.5 px-5 font-mono font-semibold text-blue-600">
                    {item.invoiceNumber}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{item.billingMonth}</td>
                  <td className="py-3.5 px-4 text-slate-500">{item.dueDate}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    NPR {item.amount.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{item.paymentMethod ?? '—'}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : item.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    {item.status === 'PAID' ? (
                      <button
                        type="button"
                        onClick={() => onViewReceipt(item)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenPayModal(item)}
                        className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                      >
                        Pay Now
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-slate-500">
                    No payments found matching this filter
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
