/**
 * PaymentsView Component
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
        <h2 className="text-xl font-display font-semibold text-slate-900">Rent & Payments Ledger</h2>
        <p className="text-xs text-slate-500">Track monthly billing cycles, digital payment receipts, and security deposit</p>
      </div>

      {/* Top Banner: Upcoming Due */}
      {pendingPayment ? (
        <div className="rounded-3xl bg-gradient-to-br from-brand-900 to-brand-800 text-white p-6 sm:p-7 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-brand-200 font-semibold block">
                Upcoming Rent Invoice · {pendingPayment.billingMonth}
              </span>
              <div className="text-2xl font-display font-bold text-white">
                NPR {pendingPayment.amount.toLocaleString()}
              </div>
              <p className="text-xs text-brand-200/80 mt-0.5">Due date: {pendingPayment.dueDate}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenPayModal(pendingPayment)}
            className="px-6 py-3 bg-white hover:bg-slate-100 text-brand-900 text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 self-start sm:self-center"
          >
            <span>Pay Rent with eSewa / Khalti</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-xs">
            <span className="font-semibold text-emerald-900 block">All Rent Invoices Settled</span>
            <span className="text-emerald-700">You have no pending dues for the current billing cycle.</span>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 text-xs font-medium">
          {(['ALL', 'PENDING', 'PAID'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === tab ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab === 'ALL' ? 'All Invoices' : tab === 'PENDING' ? 'Pending' : 'Completed'}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400">{filtered.length} records</span>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-5">Invoice Reference</th>
                <th className="py-3 px-4">Billing Month</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-5 font-mono font-medium text-slate-900">{item.invoiceNumber}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-800">{item.billingMonth}</td>
                  <td className="py-3.5 px-4 text-slate-500">{item.dueDate}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900 font-display">
                    NPR {item.amount.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{item.paymentMethod ?? '—'}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        item.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
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
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenPayModal(item)}
                        className="px-3 py-1 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        Pay Now
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
