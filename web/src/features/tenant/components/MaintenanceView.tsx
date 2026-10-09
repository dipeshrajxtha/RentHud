/**
 * MaintenanceView Component — Clean Light Maintenance Board
 *
 * Resident Maintenance Portal with:
 * - Direct landlord maintenance ticket submission
 * - Status pills (In Progress, Open, Resolved)
 * - Clean white cards with urgency tags (Emergency, High, Normal)
 * - Technician notes & inspection scheduling
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
          <h2 className="text-xl font-bold text-slate-900">Maintenance & Work Orders</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Report plumbing, electrical, structural, and appliance issues directly to your landlord
          </p>
        </div>

        <button
          type="button"
          disabled={!lease}
          onClick={onOpenNewTicketModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>New Maintenance Request</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 rounded-xl text-xs font-medium bg-slate-100 border border-slate-200/80">
          {(['ALL', 'OPEN', 'RESOLVED'] as const).map((tab) => {
            const isSelected = statusFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  isSelected
                    ? 'bg-white text-blue-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab === 'ALL' ? 'All Tickets' : tab === 'OPEN' ? 'In Progress / Open' : 'Resolved'}
              </button>
            );
          })}
        </div>

        <span className="text-xs text-slate-500 font-medium">
          {filtered.length} tickets
        </span>
      </div>

      {/* Tickets List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-12 text-center max-w-md mx-auto space-y-3.5">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto bg-blue-50 text-blue-600 border border-blue-100">
            <Wrench className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Tickets Found</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
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
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-mono text-xs text-blue-600 font-semibold">#{item.id}</span>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
                        {item.category}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          item.urgency === 'Emergency'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : item.urgency === 'High'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {item.urgency} Urgency
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="shrink-0">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        isResolved
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : item.status === 'IN_PROGRESS'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
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
                {(item.technicianNotes || item.scheduledDate || item.preferredTimeWindow) && (
                  <div className="p-3.5 rounded-xl text-xs space-y-1 bg-slate-50 border border-slate-200/80 text-slate-700">
                    {item.technicianNotes && (
                      <div>
                        <strong className="text-slate-900 font-semibold">Landlord / Technician Notes: </strong>
                        <span>{item.technicianNotes}</span>
                      </div>
                    )}
                    {item.scheduledDate && (
                      <div className="text-slate-600">
                        Scheduled Inspection: <strong className="text-slate-900">{item.scheduledDate}</strong>
                      </div>
                    )}
                    {item.preferredTimeWindow && (
                      <div className="text-slate-600">
                        Tenant Access Preference: {item.preferredTimeWindow}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 border-t border-slate-100">
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
