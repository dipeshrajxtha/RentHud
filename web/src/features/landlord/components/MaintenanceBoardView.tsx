/**
 * MaintenanceBoardView — Phase 5
 *
 * Work order Kanban / list view:
 *  - Filter by category and urgency
 *  - Status pipeline: Reported → Scheduled → In Progress → Resolved
 *  - Detail modal with contractor assignment and status update
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wrench, AlertTriangle, Clock, CheckCircle2,
  User, Building,
  Zap, Droplets, Wind, Lock,
  X, ArrowRight,
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
  Emergency: { color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', icon: AlertTriangle, dot: 'bg-rose-500' },
  High: { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', icon: Zap, dot: 'bg-orange-500' },
  Normal: { color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200', icon: Clock, dot: 'bg-sky-500' },
  Low: { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', icon: Clock, dot: 'bg-slate-400' },
};

const STATUS_CONFIG = {
  Reported: { color: 'text-amber-700', bg: 'bg-amber-50', label: 'Reported' },
  Scheduled: { color: 'text-sky-700', bg: 'bg-sky-50', label: 'Scheduled' },
  'In Progress': { color: 'text-violet-700', bg: 'bg-violet-50', label: 'In Progress' },
  Resolved: { color: 'text-emerald-700', bg: 'bg-emerald-50', label: 'Resolved' },
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
    showToast('✓ Status updated');

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
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-rose-600" />
            Maintenance Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {openCount} open work order(s){emergencyCount > 0 && ` · ${emergencyCount} emergency`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-1">
          {(['ALL', 'Emergency', 'High', 'Normal', 'Low'] as FilterUrgency[]).map((u) => (
            <button
              key={u}
              onClick={() => setFilterUrgency(u)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterUrgency === u
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {u === 'ALL' ? 'All Urgency' : u}
              {u !== 'ALL' && (
                <span className={`ml-1 w-2 h-2 rounded-full inline-block ${URGENCY_CONFIG[u].dot}`} />
              )}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {(['ALL', 'Reported', 'Scheduled', 'In Progress', 'Resolved'] as FilterStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterStatus === s
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {s === 'ALL' ? 'All Status' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket list */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <Wrench className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No maintenance requests</p>
          <p className="text-xs text-slate-400 mt-1">Open requests from tenants will appear here</p>
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
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => openDetail(ticket)}
              >
                {/* Urgency accent bar */}
                <div className={`h-1 w-full ${urgCfg.dot}`} />
                <div className="p-5 flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${urgCfg.bg} flex items-center justify-center shrink-0`}>
                    <CatIcon className={`w-5 h-5 ${urgCfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${urgCfg.bg} ${urgCfg.color}`}>
                        {ticket.urgency}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${staCfg.bg} ${staCfg.color}`}>
                        {staCfg.label}
                      </span>
                      <span className="text-[10px] text-slate-400">{ticket.category}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{ticket.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{ticket.description}</p>
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Building className="w-3 h-3" />
                        {ticket.propertyTitle} · {ticket.unitIdentifier}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <User className="w-3 h-3" />
                        {ticket.reportedBy}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {ticket.assignedContractor && (
                      <p className="text-xs text-violet-700 mt-1.5 font-medium">
                        🔧 Assigned: {ticket.assignedContractor}
                        {ticket.scheduledDate && ` · Visit: ${new Date(ticket.scheduledDate).toLocaleDateString()}`}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">
                    {ticket.status !== 'Resolved' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAdvanceStatus(ticket.id); }}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        Advance
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                    {ticket.status === 'Resolved' && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Detail Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setSelected(null)} />
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Work Order Detail</h2>
                  <p className="text-xs text-slate-400">{selected.category} · {selected.urgency}</p>
                </div>
                <button onClick={() => setSelected(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Status stepper */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Progress Pipeline</p>
                  <div className="flex items-center gap-0">
                    {STATUS_PIPELINE.map((step, idx) => {
                      const isActive = selected.status === step;
                      const isDone = STATUS_PIPELINE.indexOf(selected.status) > idx;
                      return (
                        <React.Fragment key={step}>
                          <div className="flex flex-col items-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isDone ? 'bg-emerald-500 text-white' :
                              isActive ? 'bg-amber-500 text-white' :
                              'bg-slate-200 text-slate-500'
                            }`}>
                              {isDone ? '✓' : idx + 1}
                            </div>
                            <span className={`text-[9px] mt-1 text-center ${isActive ? 'text-amber-700 font-bold' : 'text-slate-400'}`}>
                              {step}
                            </span>
                          </div>
                          {idx < STATUS_PIPELINE.length - 1 && (
                            <div className={`h-0.5 flex-1 mx-1 ${isDone ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</p>
                  <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-3">
                    {selected.description}
                  </p>
                </div>

                {/* Contractor assignment */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assign Contractor / Technician
                  </label>
                  <input
                    type="text"
                    value={contractorInput}
                    onChange={(e) => setContractorInput(e.target.value)}
                    placeholder="e.g. Bijay Electricals, Ram Plumber"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400/20 bg-white"
                  />
                </div>

                {/* Schedule date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Schedule Inspection Visit
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400/20 bg-white"
                  />
                </div>

                {/* Landlord notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Landlord Resolution Notes
                  </label>
                  <textarea
                    rows={3}
                    value={landlordNotes}
                    onChange={(e) => setLandlordNotes(e.target.value)}
                    placeholder="Add notes for your records or tenant communication…"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400/20 bg-white resize-none"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
                {selected.status !== 'Resolved' && (
                  <button
                    onClick={() => { handleAdvanceStatus(selected.id); setSelected(null); }}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Advance Status →
                  </button>
                )}
                <button
                  onClick={handleSaveDetail}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
