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
import { ShimmerButton, FilterTabs, StatusPill } from '@/components/ui';
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

          <ShimmerButton
            variant="primary"
            size="md"
            onClick={() => onOpenPayModal(pendingPayment)}
            rightIcon={<ArrowUpRight className="w-4 h-4" />}
            className="self-start sm:self-center"
          >
            Pay with eSewa / Khalti
          </ShimmerButton>
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
        <FilterTabs
          tabs={[
            { id: 'ALL', label: 'All Invoices', count: payments.length },
            {
              id: 'PENDING',
              label: 'Pending',
              count: payments.filter((p) => p.status === 'PENDING').length,
            },
            {
              id: 'PAID',
              label: 'Completed',
              count: payments.filter((p) => p.status === 'PAID').length,
            },
          ]}
          activeId={filter}
          onChange={(id) => setFilter(id as 'ALL' | 'PAID' | 'PENDING')}
        />

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
                    <StatusPill
                      size="sm"
                      variant={
                        item.status === 'PAID'
                          ? 'success'
                          : item.status === 'PENDING'
                          ? 'warning'
                          : 'danger'
                      }
                    >
                      {item.status}
                    </StatusPill>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    {item.status === 'PAID' ? (
                      <ShimmerButton
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewReceipt(item)}
                        leftIcon={<FileText className="w-3.5 h-3.5" />}
                      >
                        Receipt
                      </ShimmerButton>
                    ) : (
                      <ShimmerButton
                        variant="primary"
                        size="sm"
                        onClick={() => onOpenPayModal(item)}
                      >
                        Pay Now
                      </ShimmerButton>
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
