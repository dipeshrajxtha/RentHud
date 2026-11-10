import type {
  ChatbotConversation,
  ChatbotMessage,
} from './chatbot.types';

const SESSION_STORAGE_KEY = 'rh_chatbot_session_id';

function getOrGenerateSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!id || id.length < 8) {
      id = 'guest_' + crypto.randomUUID();
      localStorage.setItem(SESSION_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return 'guest_fallback_' + Date.now();
  }
}

function buildHeaders(accessToken?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Session-ID': getOrGenerateSessionId(),
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
}

export const chatbotClientService = {
  getSessionId(): string {
    return getOrGenerateSessionId();
  },

  async createConversation(
    initialMode = 'general',
    title?: string,
    accessToken?: string | null
  ): Promise<{ conversation: ChatbotConversation; initialMessage: ChatbotMessage }> {
    const res = await fetch('/api/chatbot/conversations', {
      method: 'POST',
      headers: buildHeaders(accessToken),
      credentials: 'include',
      body: JSON.stringify({
        initialMode,
        title,
        sessionId: getOrGenerateSessionId(),
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to create conversation (${res.status})`);
    }

    const json = await res.json();
    return json.data;
  },

  async listConversations(accessToken?: string | null): Promise<ChatbotConversation[]> {
    const sessionId = getOrGenerateSessionId();
    const res = await fetch(`/api/chatbot/conversations?sessionId=${sessionId}`, {
      method: 'GET',
      headers: buildHeaders(accessToken),
      credentials: 'include',
    });

    if (!res.ok) {
      return [];
    }

    const json = await res.json();
    return json.data?.conversations || [];
  },

  async getConversation(
    id: string,
    accessToken?: string | null
  ): Promise<ChatbotConversation & { messages: ChatbotMessage[] }> {
    const sessionId = getOrGenerateSessionId();
    const res = await fetch(`/api/chatbot/conversations/${id}?sessionId=${sessionId}`, {
      method: 'GET',
      headers: buildHeaders(accessToken),
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch conversation (${res.status})`);
    }

    const json = await res.json();
    return json.data.conversation;
  },

  async sendMessage(
    id: string,
    message: string,
    clientContext?: any,
    accessToken?: string | null
  ): Promise<{
    userMessage: ChatbotMessage;
    assistantMessage: ChatbotMessage;
    currentMode: string;
  }> {
    const res = await fetch(`/api/chatbot/conversations/${id}/messages`, {
      method: 'POST',
      headers: buildHeaders(accessToken),
      credentials: 'include',
      body: JSON.stringify({
        message,
        sessionId: getOrGenerateSessionId(),
        clientContext,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `Failed to send message (${res.status})`);
    }

    const json = await res.json();
    return json.data;
  },

  async executeAction(
    id: string,
    actionType: string,
    payload: any,
    accessToken?: string | null
  ): Promise<{
    success: boolean;
    ticket?: any;
    assistantMessage?: ChatbotMessage;
  }> {
    const res = await fetch(`/api/chatbot/conversations/${id}/action`, {
      method: 'POST',
      headers: buildHeaders(accessToken),
      credentials: 'include',
      body: JSON.stringify({
        actionType,
        payload,
        sessionId: getOrGenerateSessionId(),
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `Failed to execute action (${res.status})`);
    }

    const json = await res.json();
    return json.data;
  },

  async deleteConversation(id: string, accessToken?: string | null): Promise<void> {
    const sessionId = getOrGenerateSessionId();
    await fetch(`/api/chatbot/conversations/${id}?sessionId=${sessionId}`, {
      method: 'DELETE',
      headers: buildHeaders(accessToken),
      credentials: 'include',
    });
  },
};

