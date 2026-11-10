import { useState } from 'react';
import { Copy, Check, Mail, Info } from 'lucide-react';
import type { MessageDraft } from '../chatbot.types';

interface ChatMessageDraftCardProps {
  draft: MessageDraft;
}

export function ChatMessageDraftCard({ draft }: ChatMessageDraftCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(draft.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="bg-slate-50/90 rounded-xl border border-slate-200 p-3.5 my-2 text-left">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <Mail className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-900">
            Drafted Message to Landlord
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200/90 hover:bg-slate-100 px-2.5 py-1 rounded-md transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-600" />
              <span className="text-emerald-700">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-slate-500" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200/80 p-2.5 mb-2.5 text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed shadow-2xs">
        {draft.body}
      </div>

      {draft.legalNote && (
        <div className="flex items-start gap-1.5 text-[10px] text-slate-500 leading-normal">
          <Info className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
          <span>{draft.legalNote}</span>
        </div>
      )}
    </div>
  );
}

