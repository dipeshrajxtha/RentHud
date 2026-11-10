import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Send,
  X,
  Minus,
  RotateCcw,
  Sparkles,
  Bot,
  AlertCircle,
  Wrench,
  Compass,
  CreditCard,
  HeartHandshake,
} from 'lucide-react';
import type { ChatbotMessage, ChatbotMode, MaintenanceDraft } from '../chatbot.types';
import { ChatPropertyCard } from './ChatPropertyCard';
import { ChatMaintenanceCard } from './ChatMaintenanceCard';
import { ChatMessageDraftCard } from './ChatMessageDraftCard';

interface ChatWindowProps {
  messages: ChatbotMessage[];
  currentMode: ChatbotMode;
  loading: boolean;
  error: string | null;
  onSendMessage: (text: string) => void;
  onResetChat: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onSelectProperty: (propertyId: string) => void;
  onSubmitMaintenance: (draft: MaintenanceDraft) => Promise<void>;
  userName?: string;
  isTenant?: boolean;
}

const MODE_CONFIG: Record<
  ChatbotMode,
  { label: string; icon: React.ElementType; bg: string; text: string }
> = {
  discovery: {
    label: 'Property Discovery',
    icon: Compass,
    bg: 'bg-indigo-50 border-indigo-200',
    text: 'text-indigo-700',
  },
  tenant_support: {
    label: 'Tenant Support',
    icon: HeartHandshake,
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
  },
  maintenance: {
    label: 'Maintenance Assistant',
    icon: Wrench,
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
  },
  financial: {
    label: 'Rent & Payments',
    icon: CreditCard,
    bg: 'bg-purple-50 border-purple-200',
    text: 'text-purple-700',
  },
  general: {
    label: 'RentHub AI',
    icon: Sparkles,
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-700',
  },
};

export function ChatWindow({
  messages,
  currentMode,
  loading,
  error,
  onSendMessage,
  onResetChat,
  onClose,
  onMinimize,
  onSelectProperty,
  onSubmitMaintenance,
  userName,
  isTenant,
}: ChatWindowProps) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || loading) return;
    onSendMessage(trimmed);
    setInputText('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const activeModeConfig = MODE_CONFIG[currentMode] || MODE_CONFIG.general;
  const ModeIcon = activeModeConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 15 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-20 right-4 sm:right-6 w-[92vw] sm:w-[420px] h-[600px] max-h-[85vh] bg-white rounded-2xl border border-slate-200/90 shadow-2xl flex flex-col overflow-hidden z-50 select-none font-sans"
    >
      {/* ── Header ────────────────────────────────────────── */}
      <div className="px-4 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white border border-white/30">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-blue-600 rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold leading-tight">RentHub Assistant</h3>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-white/20 text-white/95 border border-white/20`}
              >
                <ModeIcon className="w-2.5 h-2.5" />
                <span>{activeModeConfig.label}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 text-white/80">
          <button
            type="button"
            onClick={onResetChat}
            title="Start New Conversation"
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/15 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onMinimize}
            title="Minimize"
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/15 hover:text-white transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/15 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Message Area ──────────────────────────────────── */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          const suggestedPrompts = msg.metadata?.suggestedPrompts;
          const properties = msg.metadata?.properties;
          const maintenanceDraft = msg.metadata?.maintenanceDraft;
          const messageDraft = msg.metadata?.messageDraft;

          return (
            <div
              key={msg.id || index}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-start gap-2 max-w-[88%]">
                {!isUser && (
                  <div className="w-6 h-6 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`p-3 rounded-2xl text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-br-xs shadow-xs'
                      : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs shadow-xs'
                  }`}
                >
                  {msg.content}
                </div>
              </div>

              {/* Rich embedded items for Assistant */}
              {!isUser && (
                <div className="w-full pl-8 mt-1 space-y-2">
                  {/* Maintenance Draft Card */}
                  {maintenanceDraft && (
                    <ChatMaintenanceCard
                      draft={maintenanceDraft}
                      onSubmitTicket={onSubmitMaintenance}
                      isSubmitted={msg.metadata?.ticketCreated}
                      ticketId={msg.metadata?.ticketId}
                    />
                  )}

                  {/* Landlord Message Draft Card */}
                  {messageDraft && <ChatMessageDraftCard draft={messageDraft} />}

                  {/* Property Recommendation Carousel / List */}
                  {properties && properties.length > 0 && (
                    <div className="py-1">
                      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                        {properties.map((prop) => (
                          <ChatPropertyCard
                            key={prop.id}
                            property={prop}
                            onSelectProperty={onSelectProperty}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Prompts */}
                  {suggestedPrompts && suggestedPrompts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {suggestedPrompts.map((prompt, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => onSendMessage(prompt)}
                          className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 hover:border-blue-200 transition-all shadow-2xs text-left"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Typing indicator */}
        {loading && (
          <div className="flex items-center gap-2 text-slate-400 pl-1">
            <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-white border border-slate-200 px-3 py-2 rounded-2xl rounded-bl-xs shadow-2xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        {/* Error notice */}
        {error && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Footer / Input ────────────────────────────────── */}
      <div className="p-3 bg-white border-t border-slate-200/90 shrink-0">
        <div className="relative flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <textarea
            ref={inputRef}
            rows={1}
            value={inputText}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder={
              isTenant
                ? `${userName ? userName.split(' ')[0] + ': ' : ''}Ask about your rent, report maintenance, or find properties...`
                : `${userName ? userName.split(' ')[0] + ': ' : ''}Describe your ideal rental (e.g., 2 BHK in Baneshwor under 25k)...`
            }
            className="flex-1 bg-transparent border-0 outline-none resize-none text-xs sm:text-[13px] text-slate-800 placeholder-slate-400 px-2 py-1 max-h-[100px] leading-relaxed"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!inputText.trim() || loading}
            className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shrink-0 transition-all disabled:opacity-40 disabled:hover:bg-blue-600 shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
          <span>RentHub AI Assistant</span>
          <span>For urgent danger, dial 100/101</span>
        </div>
      </div>
    </motion.div>
  );
}
