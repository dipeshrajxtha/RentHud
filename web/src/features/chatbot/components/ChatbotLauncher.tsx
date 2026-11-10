import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Bot } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { chatbotClientService } from '../chatbot.service';
import type { ChatbotMessage, ChatbotMode, MaintenanceDraft } from '../chatbot.types';
import { ChatWindow } from './ChatWindow';
import { PropertyDetailsModal } from '@/features/tenant/components/PropertyDetailsModal';
import { tenantService } from '@/features/tenant/tenant.service';
import type { PropertyListing, UnitDetail } from '@/types/tenant';

export function ChatbotLauncher() {
  const { user, accessToken } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<ChatbotMode>('general');
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Property modal state
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null);
  const [savedPropertyIds, setSavedPropertyIds] = useState<string[]>([]);

  const isTenant = user?.roles?.includes('tenant') ?? false;

  // Initialize conversation
  const initConversation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check existing conversations
      const existing = await chatbotClientService.listConversations(accessToken);
      if (existing.length > 0) {
        const latest = existing[0];
        const detail = await chatbotClientService.getConversation(latest.id, accessToken);
        setConversationId(detail.id);
        setCurrentMode(detail.currentMode);
        setMessages(detail.messages || []);
      } else {
        const created = await chatbotClientService.createConversation(
          isTenant ? 'tenant_support' : 'discovery',
          'RentHub Assistance',
          accessToken
        );
        setConversationId(created.conversation.id);
        setCurrentMode(created.conversation.currentMode);
        setMessages([created.initialMessage]);
      }
    } catch (err: any) {
      console.warn('[Chatbot] Init error:', err);
      // Fallback local initial message
      setMessages([
        {
          id: 'welcome_local',
          role: 'assistant',
          content: 'Hello! I am your RentHub AI Assistant. How can I help you today with finding a rental or managing your tenancy?',
          mode: 'general',
          metadata: {
            suggestedPrompts: [
              'Find a 2 BHK apartment in Kathmandu',
              'Report a maintenance issue',
              'Help communicating with landlord',
              'Under NPR 25,000 in Baneshwor',
            ],
          },
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isTenant]);

  useEffect(() => {
    if (isOpen && !conversationId) {
      initConversation();
    }
  }, [isOpen, conversationId, initConversation]);

  // Send message
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Optimistically add user message
    const tempUserMsg: ChatbotMessage = {
      id: 'temp_' + Date.now(),
      role: 'user',
      content: text,
      metadata: {},
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);
    setError(null);

    try {
      let activeConvId = conversationId;
      if (!activeConvId) {
        const created = await chatbotClientService.createConversation(
          'general',
          text.slice(0, 30),
          accessToken
        );
        activeConvId = created.conversation.id;
        setConversationId(activeConvId);
      }

      const response = await chatbotClientService.sendMessage(
        activeConvId,
        text,
        { currentUrl: window.location.pathname },
        accessToken
      );

      setCurrentMode(response.currentMode as ChatbotMode);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        response.userMessage,
        response.assistantMessage,
      ]);
    } catch (err: any) {
      console.error('[Chatbot Send Error]', err);
      setError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset conversation
  const handleResetChat = async () => {
    try {
      setLoading(true);
      setError(null);
      const created = await chatbotClientService.createConversation(
        isTenant ? 'tenant_support' : 'discovery',
        'New Conversation',
        accessToken
      );
      setConversationId(created.conversation.id);
      setCurrentMode(created.conversation.currentMode);
      setMessages([created.initialMessage]);
    } catch (err: any) {
      console.error('[Chatbot Reset Error]', err);
      setError('Could not reset chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Submit maintenance ticket
  const handleSubmitMaintenance = async (draft: MaintenanceDraft) => {
    if (!conversationId) return;
    try {
      const res = await chatbotClientService.executeAction(
        conversationId,
        'submit_maintenance_ticket',
        draft,
        accessToken
      );

      if (res.assistantMessage) {
        setMessages((prev) => [...prev, res.assistantMessage!]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit maintenance ticket.');
      throw err;
    }
  };

  // Select property to view details modal
  const handleSelectProperty = async (propertyId: string) => {
    try {
      const prop = await tenantService.getPropertyById(propertyId);
      if (prop) {
        setSelectedProperty(prop);
      }
    } catch (err) {
      console.error('[Chatbot Property Select Error]', err);
    }
  };

  const handleToggleSaveProperty = (id: string) => {
    setSavedPropertyIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSelectUnitToApply = (property: PropertyListing, _unit: UnitDetail) => {
    setSelectedProperty(null);
    window.location.href = `/tenant?tab=discover&apply=${property.id}`;
  };

  return (
    <>
      {/* ── Floating Launcher Button ─────────────────────── */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 10, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.9 }}
              onClick={() => {
                setIsOpen(true);
                setIsMinimized(false);
              }}
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-slate-200/90 shadow-lg text-xs font-semibold text-slate-800 cursor-pointer hover:bg-slate-50 hover:shadow-xl transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span>Ask RentHub AI</span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setIsOpen((prev) => !prev);
            setIsMinimized(false);
          }}
          className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl hover:shadow-2xl flex items-center justify-center transition-shadow focus:outline-none focus:ring-4 focus:ring-blue-100"
          aria-label={isOpen ? 'Close Chatbot' : 'Open RentHub AI Assistant'}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X className="w-6 h-6" />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="relative"
              >
                <Bot className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-blue-600 rounded-full animate-ping" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-blue-600 rounded-full" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* ── Chat Window ─────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <ChatWindow
            messages={messages}
            currentMode={currentMode}
            loading={loading}
            error={error}
            onSendMessage={handleSendMessage}
            onResetChat={handleResetChat}
            onClose={() => setIsOpen(false)}
            onMinimize={() => setIsMinimized(true)}
            onSelectProperty={handleSelectProperty}
            onSubmitMaintenance={handleSubmitMaintenance}
            userName={user?.name}
            isTenant={isTenant}
          />
        )}
      </AnimatePresence>

      {/* ── Minimized Pill ──────────────────────────────── */}
      <AnimatePresence>
        {isOpen && isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={() => setIsMinimized(false)}
            className="fixed bottom-22 right-6 z-40 bg-white border border-slate-200/90 rounded-full shadow-lg px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-slate-50 text-xs font-semibold text-slate-800"
          >
            <Bot className="w-4 h-4 text-blue-600" />
            <span>RentHub Assistant</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Connected Property Details Modal ────────────── */}
      {selectedProperty && (
        <PropertyDetailsModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          isSaved={savedPropertyIds.includes(selectedProperty.id)}
          onToggleSave={handleToggleSaveProperty}
          onSelectUnitToApply={handleSelectUnitToApply}
        />
      )}
    </>
  );
}
