import { useState } from 'react';
import { Wrench, CheckCircle2, Loader2, Send } from 'lucide-react';
import type { MaintenanceDraft } from '../chatbot.types';

interface ChatMaintenanceCardProps {
  draft: MaintenanceDraft;
  onSubmitTicket: (draft: MaintenanceDraft) => Promise<void>;
  isSubmitted?: boolean;
  ticketId?: string;
}

export function ChatMaintenanceCard({
  draft,
  onSubmitTicket,
  isSubmitted = false,
  ticketId,
}: ChatMaintenanceCardProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(isSubmitted);
  const createdId = ticketId;

  const urgencyColors = {
    Emergency: 'bg-rose-50 text-rose-700 border-rose-200',
    High: 'bg-amber-50 text-amber-700 border-amber-200',
    Normal: 'bg-blue-50 text-blue-700 border-blue-200',
    Low: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  const handleConfirmSubmit = async () => {
    try {
      setLoading(true);
      await onSubmitTicket(draft);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-3.5 my-2 text-left">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <Wrench className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-900">
            Maintenance Request Draft
          </span>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
            urgencyColors[draft.urgency] || urgencyColors.Normal
          }`}
        >
          {draft.urgency} Urgency
        </span>
      </div>

      <div className="space-y-1 mb-3 text-xs">
        <div>
          <span className="text-slate-500 font-medium">Category: </span>
          <span className="text-slate-800 font-semibold">{draft.category}</span>
        </div>
        <div>
          <span className="text-slate-500 font-medium">Issue: </span>
          <span className="text-slate-800">{draft.title}</span>
        </div>
        {draft.propertyTitle && (
          <div>
            <span className="text-slate-500 font-medium">Property: </span>
            <span className="text-slate-800">{draft.propertyTitle}</span>
          </div>
        )}
      </div>

      {submitted ? (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Ticket logged successfully {createdId ? `(#${createdId.slice(0, 8)})` : ''}! Landlord notified.
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleConfirmSubmit}
          disabled={loading}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Submitting Ticket...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Submit Maintenance Request</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
