/**
 * MaintenanceView Component
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Wrench,
  Clock,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import type { MaintenanceRequest, LeaseAgreement } from '@/types/tenant';

interface MaintenanceViewProps {
  tickets: MaintenanceRequest[];
  lease: LeaseAgreement | null;
  onOpenNewTicketModal: () => void;
}

export function MaintenanceView({
  tickets,
  lease,
  onOpenNewTicketModal,
}: MaintenanceViewProps) {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');

  const filtered = tickets.filter((t) => {
    if (statusFilter === 'OPEN') return t.status !== 'RESOLVED';
    if (statusFilter === 'RESOLVED') return t.status === 'RESOLVED';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold text-slate-900">Maintenance & Work Orders</h2>
          <p className="text-xs text-slate-500">Report plumbing, electrical, structural, and appliance issues directly to your landlord</p>
        </div>

        <button
          type="button"
          disabled={!lease}
          onClick={onOpenNewTicketModal}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Maintenance Request</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 text-xs font-medium">
          {(['ALL', 'OPEN', 'RESOLVED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === tab
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab === 'ALL' ? 'All Tickets' : tab === 'OPEN' ? 'In Progress / Open' : 'Resolved'}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400">{filtered.length} tickets</span>
      </div>

      {/* Tickets List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <Wrench className="w-6 h-6" />
          </div>
          <h3 className="text-base font-display font-semibold text-slate-900">No Tickets Found</h3>
          <p className="text-xs text-slate-500">
            {statusFilter === 'OPEN'
              ? 'Great! There are no outstanding maintenance issues for your residence.'
              : 'You have not submitted any maintenance tickets yet.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((item) => {
            const isResolved = item.status === 'RESOLVED';

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono text-xs text-slate-400">#{item.id}</span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                        {item.category}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                          item.urgency === 'Emergency'
                            ? 'bg-rose-100 text-rose-700'
                            : item.urgency === 'High'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.urgency} Urgency
                      </span>
                    </div>

                    <h3 className="text-base font-display font-semibold text-slate-900">{item.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.description}</p>
                  </div>

                  <div className="shrink-0">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        isResolved
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isResolved ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                      <span>{item.status.replace('_', ' ')}</span>
                    </span>
                  </div>
                </div>

                {/* Technician Notes or Preferred Time */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
                  {item.technicianNotes && (
                    <div>
                      <strong className="text-slate-800 font-medium">Landlord / Technician Notes: </strong>
                      <span>{item.technicianNotes}</span>
                    </div>
                  )}
                  {item.scheduledDate && (
                    <div className="text-slate-500">
                      Scheduled Inspection: <strong>{item.scheduledDate}</strong>
                    </div>
                  )}
                  {item.preferredTimeWindow && (
                    <div className="text-slate-500">
                      Tenant Access Preference: {item.preferredTimeWindow}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Reported on {new Date(item.createdAt).toLocaleDateString()}</span>
                  <span>Premises: {item.unitIdentifier}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
