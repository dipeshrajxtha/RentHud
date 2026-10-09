/**
 * MaintenanceBoardView — Ultra-Premium Dark Portal
 *
 * Work order tracking & contractor dispatch hub:
 *  - Filter by category and urgency (Emergency / High / Normal / Low)
 *  - Status pipeline: Reported → Scheduled → In Progress → Resolved
 *  - Slide-over detail panel with contractor assignment and schedule date
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wrench, AlertTriangle, Clock, CheckCircle2,
  User, Building,
  Zap, Droplets, Wind, Lock,
  X, ArrowRight, Sparkles, Calendar, Check,
} from 'lucide-react';
import type { LandlordMaintenanceTicket } from '@/types/landlord';

interface MaintenanceBoardViewProps {
  tickets: LandlordMaintenanceTicket[];
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onUpdateTicket?: (
    id: string,
    update: {
      status?: LandlordMaintenanceTicket['status'];
      assignedContractor?: string;
      scheduledDate?: string;
    }
  ) => Promise<void>;
}

const URGENCY_CONFIG = {
  Emergency: { badgeClass: 'badge-error', icon: AlertTriangle, dot: 'bg-rose-500' },
  High: { badgeClass: 'badge-warning', icon: Zap, dot: 'bg-amber-500' },
  Normal: { badgeClass: 'badge-info', icon: Clock, dot: 'bg-brand-500' },
  Low: { badgeClass: 'badge-neutral', icon: Clock, dot: 'bg-slate-500' },
};

const STATUS_CONFIG = {
  Reported: { badgeClass: 'badge-warning', label: 'Reported' },
  Scheduled: { badgeClass: 'badge-info', label: 'Scheduled' },
  'In Progress': { badgeClass: 'badge-info', label: 'In Progress' },
  Resolved: { badgeClass: 'badge-success', label: 'Resolved' },
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Plumbing: Droplets,
  Electrical: Zap,
  HVAC: Wind,
  Appliances: Wrench,
  'Carpentry & Locks': Lock,
  Structural: Building,
};

const STATUS_PIPELINE: LandlordMaintenanceTicket['status'][] = ['Reported', 'Scheduled', 'In Progress', 'Resolved'];

type FilterUrgency = 'ALL' | LandlordMaintenanceTicket['urgency'];
type FilterStatus = 'ALL' | LandlordMaintenanceTicket['status'];

export function MaintenanceBoardView({ tickets, showToast, onUpdateTicket }: MaintenanceBoardViewProps) {
  const [filterUrgency, setFilterUrgency] = useState<FilterUrgency>('ALL');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [selected, setSelected] = useState<LandlordMaintenanceTicket | null>(null);
  const [localTickets, setLocalTickets] = useState<LandlordMaintenanceTicket[]>(tickets);
  const [contractorInput, setContractorInput] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [landlordNotes, setLandlordNotes] = useState('');

  React.useEffect(() => {
    setLocalTickets(tickets);
  }, [tickets]);

  const filtered = localTickets.filter((t) => {
    if (filterUrgency !== 'ALL' && t.urgency !== filterUrgency) return false;
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
    return true;
  });

  const openCount = localTickets.filter((t) => t.status !== 'Resolved').length;
  const emergencyCount = localTickets.filter((t) => t.urgency === 'Emergency' && t.status !== 'Resolved').length;

  async function handleAdvanceStatus(ticketId: string) {
    const t = localTickets.find((item) => item.id === ticketId);
    if (!t) return;
    const idx = STATUS_PIPELINE.indexOf(t.status);
    if (idx >= STATUS_PIPELINE.length - 1) return;
    const newStatus = STATUS_PIPELINE[idx + 1];

    setLocalTickets((prev) => prev.map((item) => (item.id === ticketId ? { ...item, status: newStatus } : item)));
    showToast('✓ Status progressed to ' + newStatus);

    if (onUpdateTicket) {
      try {
        await onUpdateTicket(ticketId, { status: newStatus });
      } catch (err: any) {
        showToast(err.message || 'Failed to update ticket on server', 'error');
      }
    }
  }

  async function handleSaveDetail() {
    if (!selected) return;
    const update = {
      assignedContractor: contractorInput || selected.assignedContractor,
      scheduledDate: scheduledDate || selected.scheduledDate,
      landlordNotes: landlordNotes || selected.landlordNotes,
    };

    setLocalTickets((prev) =>
      prev.map((t) =>
        t.id === selected.id
          ? {
              ...t,
              ...update,
            }
          : t
      )
    );
    showToast('✓ Work order updated');
    setSelected(null);

    if (onUpdateTicket) {
      try {
        await onUpdateTicket(selected.id, update);
      } catch (err: any) {
        showToast(err.message || 'Failed to sync with server', 'error');
      }
    }
  }

  function openDetail(ticket: LandlordMaintenanceTicket) {
    setSelected(ticket);
    setContractorInput(ticket.assignedContractor ?? '');
    setScheduledDate(ticket.scheduledDate ?? '');
    setLandlordNotes(ticket.landlordNotes ?? '');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-2"
            style={{
              background: 'rgba(244,63,94,0.12)',
              border: '1px solid rgba(244,63,94,0.25)',
              color: '#fb7185',
              fontFamily: 'Space Grotesk, sans-serif',
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Property Facility SLA
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient-blue" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Maintenance & Work Orders
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {openCount} active request(s){emergencyCount > 0 && <span className="text-rose-400 font-semibold"> · {emergencyCount} emergency</span>}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {(['ALL', 'Emergency', 'High', 'Normal', 'Low'] as FilterUrgency[]).map((u) => (
            <button
              key={u}
              onClick={() => setFilterUrgency(u)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                filterUrgency === u
                  ? 'btn-primary shadow-brand-sm'
                  : 'btn-ghost'
              }`}
            >
              {u !== 'ALL' && <span className={`w-2 h-2 rounded-full ${URGENCY_CONFIG[u].dot}`} />}
              <span>{u === 'ALL' ? 'All Urgency' : u}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(['ALL', 'Reported', 'Scheduled', 'In Progress', 'Resolved'] as FilterStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterStatus === s
                  ? 'btn-primary shadow-brand-sm'
                  : 'btn-ghost'
              }`}
            >
              {s === 'ALL' ? 'All Status' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket list */}
      {filtered.length === 0 ? (
        <div className="card-premium text-center py-20 px-6 border-dashed">
          <Wrench className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="font-semibold text-base" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk, sans-serif' }}>
            No maintenance work orders found
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            When tenants submit repair or maintenance tickets, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket) => {
            const urgCfg = URGENCY_CONFIG[ticket.urgency];
            const staCfg = STATUS_CONFIG[ticket.status];
            const CatIcon = CATEGORY_ICONS[ticket.category] ?? Wrench;

            return (
              <motion.div
                key={ticket.id}
                layout
                className="card-premium overflow-hidden cursor-pointer transition-all hover:border-brand-500/40"
                onClick={() => openDetail(ticket)}
              >
                {/* Urgency accent bar */}
                <div className={`h-1 w-full ${urgCfg.dot}`} />
                <div className="p-5 flex items-start gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <CatIcon className="w-5 h-5 text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className={urgCfg.badgeClass}>
                        {ticket.urgency}
                      </span>
                      <span className={staCfg.badgeClass}>
                        {staCfg.label}
                      </span>
                      <span className="badge-neutral text-[10px]">
                        {ticket.category}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-100" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {ticket.title}
                    </h3>
                    <p className="text-xs mt-1 line-clamp-1" style={{ color: 'var(--text-secondary)' }}>
                      {ticket.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2.5 flex-wrap">
                      <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <Building className="w-3.5 h-3.5 text-brand-400" />
                        {ticket.propertyTitle} · {ticket.unitIdentifier}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <User className="w-3.5 h-3.5 text-brand-400" />
                        {ticket.reportedBy}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <Clock className="w-3.5 h-3.5 text-brand-400" />
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {ticket.assignedContractor && (
                      <p className="text-xs text-brand-300 mt-2 font-medium flex items-center gap-1.5">
                        <Wrench className="w-3 h-3 text-brand-400" />
                        Contractor: <strong className="text-white">{ticket.assignedContractor}</strong>
                        {ticket.scheduledDate && ` · Scheduled: ${new Date(ticket.scheduledDate).toLocaleDateString()}`}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {ticket.status !== 'Resolved' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAdvanceStatus(ticket.id); }}
                        className="btn-secondary btn-sm text-xs py-1.5 px-3 flex items-center gap-1"
                      >
                        Advance
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                    {ticket.status === 'Resolved' && (
                      <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <CheckCircle2 className="w-5 h-5" />
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Slide-Over Detail Modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 modal-overlay"
              onClick={() => setSelected(null)}
            />
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md card-auth rounded-none sm:rounded-l-3xl flex flex-col overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-white/10 bg-brand-950/60 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-100" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Work Order Details
                  </h2>
                  <p className="text-xs text-text-muted">{selected.category} · {selected.urgency}</p>
                </div>
                <button onClick={() => setSelected(null)} className="p-2 rounded-xl text-text-muted hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Status stepper */}
                <div>
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Resolution Pipeline</p>
                  <div className="flex items-center gap-1">
                    {STATUS_PIPELINE.map((step, idx) => {
                      const isActive = selected.status === step;
                      const isDone = STATUS_PIPELINE.indexOf(selected.status) > idx;
                      return (
                        <React.Fragment key={step}>
                          <div className="flex flex-col items-center flex-1">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              isDone ? 'bg-emerald-500 text-white' :
                              isActive ? 'bg-brand-500 text-white shadow-brand-sm' :
                              'bg-surface-3 text-text-muted border border-white/5'
                            }`}>
                              {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                            </div>
                            <span className={`text-[10px] mt-1.5 text-center font-medium ${isActive ? 'text-brand-300 font-bold' : 'text-text-muted'}`}>
                              {step}
                            </span>
                          </div>
                          {idx < STATUS_PIPELINE.length - 1 && (
                            <div className={`h-0.5 flex-1 ${isDone ? 'bg-emerald-500' : 'bg-surface-4'}`} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Tenant Issue Description</p>
                  <p className="text-sm text-slate-200 leading-relaxed card-premium p-3.5">
                    {selected.description}
                  </p>
                </div>

                {/* Contractor assignment */}
                <div>
                  <label className="form-label text-xs">
                    Assign Technician / Contractor
                  </label>
                  <input
                    type="text"
                    value={contractorInput}
                    onChange={(e) => setContractorInput(e.target.value)}
                    placeholder="e.g. Bijay Electricals, Ram Plumber"
                    className="form-input text-xs"
                  />
                </div>

                {/* Schedule date */}
                <div>
                  <label className="form-label text-xs">
                    Inspection / Repair Date
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="form-input text-xs"
                  />
                </div>

                {/* Landlord notes */}
                <div>
                  <label className="form-label text-xs">
                    Landlord Internal Resolution Notes
                  </label>
                  <textarea
                    rows={3}
                    value={landlordNotes}
                    onChange={(e) => setLandlordNotes(e.target.value)}
                    placeholder="Document parts replaced, contractor invoices, or follow-up notes…"
                    className="form-input text-xs resize-none"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-white/10 bg-surface-1 flex gap-3">
                {selected.status !== 'Resolved' && (
                  <button
                    onClick={() => { handleAdvanceStatus(selected.id); setSelected(null); }}
                    className="btn-secondary flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    Advance Status
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={handleSaveDetail}
                  className="btn-primary flex-1 py-2.5 text-xs font-bold"
                >
                  Save Dispatch
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
