/**
 * MaintenanceView Component — Architectural Facility Work Order Hub
 *
 * Modern Resident Maintenance Portal featuring:
 * - Real-time metrics overview: Active work orders, Emergency alerts, Resolved fixes
 * - Visual 4-Stage Lifecycle Pipeline: Reported → Scheduled → In Progress → Resolved
 * - Categorized issue badges with contextual icons (Plumbing, Electrical, HVAC, etc.)
 * - SLA urgency badges with high-contrast color indicators
 * - Technician assignment & scheduled inspection time cards
 * - Modern tactile ShimmerButton dispatch trigger
 */

import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Wrench,
  Clock,
  CheckCircle2,
  Plus,
  AlertTriangle,
  Zap,
  Droplets,
  Wind,
  Lock,
  Building,
  Calendar,
} from 'lucide-react';
import { ShimmerButton, StatusPill, FilterTabs } from '@/components/ui';
import type { MaintenanceRequest, LeaseAgreement } from '@/types/tenant';

interface MaintenanceViewProps {
  tickets: MaintenanceRequest[];
  lease: LeaseAgreement | null;
  onOpenNewTicketModal: () => void;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Plumbing: Droplets,
  Electrical: Zap,
  HVAC: Wind,
  Appliances: Wrench,
  'Carpentry & Locks': Lock,
  Structural: Building,
};

const STAGES = [
  { key: 'REPORTED', label: 'Reported', desc: 'Ticket logged' },
  { key: 'SCHEDULED', label: 'Scheduled', desc: 'Inspection set' },
  { key: 'IN_PROGRESS', label: 'In Progress', desc: 'Technician on site' },
  { key: 'RESOLVED', label: 'Resolved', desc: 'Completed & signed off' },
];

function getStageIndex(status: string): number {
  const s = status.toUpperCase();
  if (s === 'RESOLVED') return 3;
  if (s === 'IN_PROGRESS') return 2;
  if (s === 'SCHEDULED') return 1;
  return 0; // REPORTED
}

export function MaintenanceView({
  tickets,
  lease,
  onOpenNewTicketModal,
}: MaintenanceViewProps) {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const metrics = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => t.status !== 'RESOLVED').length;
    const emergency = tickets.filter((t) => t.urgency === 'Emergency' && t.status !== 'RESOLVED').length;
    const resolved = tickets.filter((t) => t.status === 'RESOLVED').length;
    return { total, open, emergency, resolved };
  }, [tickets]);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter === 'OPEN' && t.status === 'RESOLVED') return false;
      if (statusFilter === 'RESOLVED' && t.status !== 'RESOLVED') return false;
      if (selectedCategory !== 'ALL' && t.category !== selectedCategory) return false;
      return true;
    });
  }, [tickets, statusFilter, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* ── 1. Header & Dispatch Action ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Premises Care & Repair
            </span>
            {lease && (
              <span className="text-xs text-slate-400 font-medium">
                · {lease.unitIdentifier}, {lease.propertyTitle}
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Maintenance & Work Orders
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit repair requests, track technician dispatch, and monitor resolution timelines
          </p>
        </div>

        <ShimmerButton
          variant="primary"
          size="md"
          disabled={!lease}
          onClick={onOpenNewTicketModal}
          leftIcon={<Plus className="w-4 h-4" />}
          className="self-start sm:self-center font-bold shadow-sm cursor-pointer"
        >
          New Maintenance Request
        </ShimmerButton>
      </div>

      {/* ── 2. Real-Time Facility Metrics Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Tickets
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{metrics.open}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Awaiting landlord / contractor action
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Urgent / Emergency
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              metrics.emergency > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-extrabold ${metrics.emergency > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {metrics.emergency}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Response SLA within 4 hours
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Resolved Issues
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">{metrics.resolved}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Completed satisfactorily
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Logged
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{metrics.total}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Lifetime premises work orders
          </span>
        </div>
      </div>

      {/* ── 3. Filters & Category Pills ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <FilterTabs
          tabs={[
            { id: 'ALL', label: 'All Tickets', count: tickets.length },
            { id: 'OPEN', label: 'Open / In Progress', count: metrics.open },
            { id: 'RESOLVED', label: 'Resolved', count: metrics.resolved },
          ]}
          activeId={statusFilter}
          onChange={(id) => setStatusFilter(id as 'ALL' | 'OPEN' | 'RESOLVED')}
        />

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'Plumbing', 'Electrical', 'HVAC', 'Appliances', 'Carpentry & Locks', 'Structural'].map(
            (cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {cat === 'ALL' ? 'All Categories' : cat}
              </button>
            )
          )}
        </div>
      </div>

      {/* ── 4. Tickets List & Stepper Cards ── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-12 text-center max-w-md mx-auto space-y-3.5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto bg-blue-50 text-blue-600 border border-blue-100 shadow-2xs">
            <Wrench className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Tickets Found</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {statusFilter === 'OPEN'
              ? 'Great! There are no outstanding maintenance issues reported for your residence.'
              : 'You have not submitted any maintenance tickets in this category.'}
          </p>
          {lease && (
            <button
              onClick={onOpenNewTicketModal}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Report a New Issue</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-5">
          {filtered.map((item) => {
            const isResolved = item.status === 'RESOLVED';
            const stageIndex = getStageIndex(item.status);
            const CatIcon = CATEGORY_ICONS[item.category] || Wrench;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-3xl border shadow-xs overflow-hidden transition-all ${
                  isResolved
                    ? 'border-slate-200/90'
                    : item.urgency === 'Emergency'
                    ? 'border-rose-300 ring-1 ring-rose-200/60'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                {/* Urgency colored accent header stripe */}
                <div
                  className={`h-1.5 w-full ${
                    isResolved
                      ? 'bg-emerald-500'
                      : item.urgency === 'Emergency'
                      ? 'bg-rose-500'
                      : item.urgency === 'High'
                      ? 'bg-amber-500'
                      : 'bg-blue-500'
                  }`}
                />

                <div className="p-5 sm:p-6 space-y-5">
                  {/* Top Bar: IDs, Categories, Urgency, Status */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                          isResolved
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            : 'bg-blue-50 text-blue-600 border-blue-100'
                        }`}
                      >
                        <CatIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono text-xs text-blue-600 font-bold">
                            #{item.id.slice(0, 8)}
                          </span>
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

                        <h3 className="text-base font-bold text-slate-900 tracking-tight">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Unit: <strong className="text-slate-700">{item.unitIdentifier}</strong> ·{' '}
                          {item.propertyTitle}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 self-start">
                      <StatusPill
                        variant={
                          isResolved ? 'success' : item.status === 'IN_PROGRESS' ? 'info' : 'warning'
                        }
                        size="md"
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

                  {/* Issue Description */}
                  <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {item.description}
                  </div>

                  {/* ── 4-Stage Lifecycle Stepper ── */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/50 border border-slate-100/80">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Resolution Progress
                      </span>
                      <span className="text-xs font-semibold text-slate-600">
                        Stage {stageIndex + 1} of 4: {STAGES[stageIndex].label}
                      </span>
                    </div>

                    <div className="relative">
                      {/* Progress connector line */}
                      <div className="absolute top-3.5 left-[12%] right-[12%] h-0.5 bg-slate-200 -z-0" />
                      <div
                        className="absolute top-3.5 left-[12%] h-0.5 bg-blue-600 transition-all duration-500 -z-0"
                        style={{ width: `${(stageIndex / 3) * 76}%` }}
                      />

                      <div className="grid grid-cols-4 gap-2 relative z-10">
                        {STAGES.map((stg, sIdx) => {
                          const isDone = sIdx <= stageIndex;
                          const isCurrent = sIdx === stageIndex;

                          return (
                            <div key={stg.key} className="text-center">
                              <div
                                className={`w-7 h-7 rounded-full mx-auto flex items-center justify-center text-xs font-bold mb-1.5 transition-all ${
                                  isDone
                                    ? isResolved && sIdx === 3
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-slate-200 text-slate-500'
                                } ${isCurrent ? 'ring-4 ring-blue-100' : ''}`}
                              >
                                {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : sIdx + 1}
                              </div>
                              <span
                                className={`text-[11px] font-bold block ${
                                  isCurrent
                                    ? 'text-blue-600'
                                    : isDone
                                    ? 'text-slate-900'
                                    : 'text-slate-400'
                                }`}
                              >
                                {stg.label}
                              </span>
                              <span className="text-[10px] text-slate-400 hidden sm:block">
                                {stg.desc}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Technician Notes & Scheduled Dates */}
                  {(item.technicianNotes || item.scheduledDate || item.preferredTimeWindow) && (
                    <div className="p-4 rounded-2xl text-xs space-y-2 bg-blue-50/60 border border-blue-100 text-slate-700">
                      {item.scheduledDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>
                            Scheduled Inspection:{' '}
                            <strong className="text-slate-900 font-bold">{item.scheduledDate}</strong>
                          </span>
                        </div>
                      )}
                      {item.preferredTimeWindow && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Tenant Access Preference: {item.preferredTimeWindow}</span>
                        </div>
                      )}
                      {item.technicianNotes && (
                        <div className="pt-2 border-t border-blue-200/60 text-slate-800">
                          <strong className="font-semibold text-blue-900">
                            Landlord / Contractor Notes:{' '}
                          </strong>
                          <span>{item.technicianNotes}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Card Footer */}
                  <div className="flex items-center justify-between text-[11px] pt-3 text-slate-400 border-t border-slate-100">
                    <span>
                      Reported on {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recently'}
                    </span>
                    <span className="font-medium text-slate-600">
                      Premises: {item.unitIdentifier}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
