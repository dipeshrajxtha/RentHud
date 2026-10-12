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
import { ShimmerButton, StatusPill, FilterTabs } from '@/components/ui';
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

        <ShimmerButton
          variant="primary"
          size="md"
          disabled={!lease}
          onClick={onOpenNewTicketModal}
          leftIcon={<Plus className="w-4 h-4" />}
          className="self-start sm:self-center"
        >
          New Maintenance Request
        </ShimmerButton>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <FilterTabs
          tabs={[
            { id: 'ALL', label: 'All Tickets', count: tickets.length },
            {
              id: 'OPEN',
              label: 'In Progress / Open',
              count: tickets.filter((t) => t.status !== 'RESOLVED').length,
            },
            {
              id: 'RESOLVED',
              label: 'Resolved',
              count: tickets.filter((t) => t.status === 'RESOLVED').length,
            },
          ]}
          activeId={statusFilter}
          onChange={(id) => setStatusFilter(id as 'ALL' | 'OPEN' | 'RESOLVED')}
        />

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
                      <StatusPill variant="neutral" size="sm">
                        {item.category}
                      </StatusPill>
                      <StatusPill
                        size="sm"
                        variant={
                          item.urgency === 'Emergency'
                            ? 'danger'
                            : item.urgency === 'High'
                            ? 'warning'
                            : 'info'
                        }
                      >
                        {item.urgency} Urgency
                      </StatusPill>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="shrink-0">
                    <StatusPill
                      variant={
                        isResolved ? 'success' : item.status === 'IN_PROGRESS' ? 'info' : 'warning'
                      }
                      icon={
                        isResolved ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )
                      }
                    >
                      {item.status.replace('_', ' ')}
                    </StatusPill>
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
