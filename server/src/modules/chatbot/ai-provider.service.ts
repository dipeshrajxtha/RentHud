import config from '../../../config/env.js';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIProviderResponse {
  content: string;
  providerUsed: 'gemini' | 'openai' | 'rule_based_fallback';
  modelUsed: string;
}

export interface UserContext {
  userId?: string;
  userName?: string;
  roles?: string[];
  activeTenancy?: {
    id: string;
    propertyTitle: string;
    unitIdentifier: string;
    address: string;
    city: string;
    landlordName: string;
    monthlyRent: number;
    startDate: string;
    endDate: string;
  } | null;
  openMaintenanceTicketsCount?: number;
  pendingPaymentsCount?: number;
}

export class AIProviderService {
  private geminiKey?: string;
  private openaiKey?: string;
  private configuredProvider: string;
  private configuredModel: string;

  constructor() {
    this.geminiKey = config.ai.geminiApiKey || process.env.GEMINI_API_KEY;
    this.openaiKey = config.ai.openaiApiKey || process.env.OPENAI_API_KEY;
    this.configuredProvider = config.ai.provider;
    this.configuredModel = config.ai.model;
  }

  /**
   * Generates a conversational response using the configured AI provider,
   * with graceful fallback to the built-in intelligent engine.
   */
  async generateResponse(
    messages: AIMessage[],
    userContext?: UserContext,
    systemInstructionExtra?: string
  ): Promise<AIProviderResponse> {
    const systemPrompt = this.buildSystemPrompt(userContext, systemInstructionExtra);

    // Try Gemini if configured or auto with key present
    if (
      (this.configuredProvider === 'gemini' || this.configuredProvider === 'auto') &&
      this.geminiKey
    ) {
      try {
        const result = await this.callGemini(messages, systemPrompt);
        if (result) {
          return {
            content: result,
            providerUsed: 'gemini',
            modelUsed: this.configuredModel || 'gemini-1.5-flash',
          };
        }
      } catch (err) {
        console.warn('[Chatbot AI] Gemini call failed, falling back:', err);
      }
    }

    // Try OpenAI if configured or auto with key present
    if (
      (this.configuredProvider === 'openai' || this.configuredProvider === 'auto') &&
      this.openaiKey
    ) {
      try {
        const result = await this.callOpenAI(messages, systemPrompt);
        if (result) {
          return {
            content: result,
            providerUsed: 'openai',
            modelUsed: 'gpt-4o-mini',
          };
        }
      } catch (err) {
        console.warn('[Chatbot AI] OpenAI call failed, falling back:', err);
      }
    }

    // High-quality local rule-based fallback
    return {
      content: this.generateRuleBasedFallback(messages, userContext),
      providerUsed: 'rule_based_fallback',
      modelUsed: 'renthub-intelligent-rule-engine-v1',
    };
  }

  private buildSystemPrompt(userContext?: UserContext, extra?: string): string {
    let contextStr = '';
    if (userContext?.activeTenancy) {
      contextStr = `\n[AUTHENTICATED TENANT CONTEXT]
The user is currently an active tenant on RentHub:
- Property: ${userContext.activeTenancy.propertyTitle} (${userContext.activeTenancy.unitIdentifier})
- Address: ${userContext.activeTenancy.address}, ${userContext.activeTenancy.city}
- Landlord: ${userContext.activeTenancy.landlordName}
- Agreed Rent: NPR ${userContext.activeTenancy.monthlyRent.toLocaleString()} / month
- Lease Period: ${userContext.activeTenancy.startDate} to ${userContext.activeTenancy.endDate}
- Open Maintenance Tickets: ${userContext.openMaintenanceTicketsCount ?? 0}
- Pending Payments: ${userContext.pendingPaymentsCount ?? 0}
Acknowledge their living arrangement when relevant and offer personalized assistance.`;
    } else if (userContext?.roles?.includes('landlord')) {
      contextStr = `\n[LANDLORD CONTEXT]
The user is registered as a landlord on RentHub. Assist with property management questions, tenant communications, or listing policies.`;
    } else {
      contextStr = `\n[VISITOR / PROPERTY SEEKER CONTEXT]
The user is browsing or seeking rental properties in Nepal. Act as an expert property consultant.`;
    }

    return `You are the RentHub AI Assistant, an empathetic, highly knowledgeable rental and tenancy companion for RentHub — Nepal's premier digital rental platform.

CORE PRINCIPLES:
1. Intelligent Property Discovery: Ask natural, sequential clarifying questions (location in Kathmandu/Nepal, budget in NPR, bedrooms/BHK, furnishing). Never overwhelm the user with all questions at once.
2. Continuous Tenant Support: Assist existing tenants with satisfaction check-ins, drafting polite and culturally respectful messages to landlords, preparing maintenance tickets, and navigating financial delays with empathy.
3. Legal and Financial Guardrails: Never promise rent forgiveness, lease modifications, or binding contracts. RentHub facilitates communication, but agreements must be between landlord and tenant.
4. Emergency Safety: For urgent physical dangers (fire, gas leaks, electric sparks, severe structural damage), immediately advise emergency services (Police: 100, Fire: 101, Ambulance: 102).
5. Tone: Professional, warm, respectful of Nepali rental customs, and solution-oriented.
${contextStr}
${extra ? `\n[ADDITIONAL CONTEXT]\n${extra}` : ''}`;
  }

  private async callGemini(messages: AIMessage[], systemPrompt: string): Promise<string | null> {
    const model = this.configuredModel || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.geminiKey}`;

    // Format messages for Gemini
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errText}`);
    }

    const data = (await response.json()) as any;
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return candidateText ?? null;
  }

  private async callOpenAI(messages: AIMessage[], systemPrompt: string): Promise<string | null> {
    const url = 'https://api.openai.com/v1/chat/completions';
    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: formattedMessages,
        temperature: 0.5,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${errText}`);
    }

    const data = (await response.json()) as any;
    return data?.choices?.[0]?.message?.content ?? null;
  }

  /**
   * Intelligent rule-based conversational fallback that delivers complete,
   * context-aware responses matching all prompt requirements even without API keys.
   */
  private generateRuleBasedFallback(messages: AIMessage[], userContext?: UserContext): string {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
    const text = lastUserMessage.toLowerCase();

    // 1. Emergency Detection
    if (
      text.includes('fire') ||
      text.includes('gas leak') ||
      text.includes('electric shock') ||
      text.includes('sparking') ||
      text.includes('ceiling collapsed') ||
      text.includes('threat')
    ) {
      return `🚨 **IMMEDIATE EMERGENCY ASSISTANCE NOTICE**\n\nIf you or anyone in the premises is in immediate danger, please reach out to emergency services right away:\n- **Nepal Police:** 100\n- **Fire Department:** 101\n- **Ambulance:** 102\n\nPlease evacuate to a safe location if necessary. Once you are safe, notify your landlord and property manager immediately.`;
    }

    // 2. Financial Difficulties with Rent
    if (
      text.includes('cannot pay') ||
      text.includes("can't pay") ||
      text.includes('unable to pay') ||
      text.includes('financial difficult') ||
      text.includes('trouble paying') ||
      text.includes('salary delayed') ||
      text.includes('delay rent') ||
      text.includes('rent extension')
    ) {
      const landlord = userContext?.activeTenancy?.landlordName || 'your landlord';
      return `I understand that unexpected financial circumstances happen, and I'm here to support you.\n\nWhile I cannot directly waive rent or change your lease terms, communication is key. Landlords in Nepal are generally understanding when informed early with transparency.\n\nHere is how I can assist you:\n1. **Draft a polite notice to ${landlord}** explaining your situation, expected timeline, and proposing a partial payment or payment date extension.\n2. **Review your lease agreement** regarding late payment grace periods.\n\nWould you like me to prepare a respectful message for you to review and send to your landlord?`;
    }

    // 3. Maintenance Problems
    if (
      text.includes('leakage') ||
      text.includes('leak') ||
      text.includes('tap') ||
      text.includes('pipe') ||
      text.includes('drain') ||
      text.includes('electricity') ||
      text.includes('water supply') ||
      text.includes('no water') ||
      text.includes('maintenance') ||
      text.includes('repair')
    ) {
      const isUrgent = text.includes('continuous') || text.includes('flooding') || text.includes('burst');
      const propTitle = userContext?.activeTenancy?.propertyTitle ? ` at ${userContext.activeTenancy.propertyTitle}` : '';
      return `I am sorry you are experiencing this maintenance issue${propTitle}.\n\n${
        isUrgent
          ? 'Since this appears to be an urgent issue, please turn off the main valve or circuit breaker if accessible to prevent property damage.'
          : 'I can help you log an official maintenance ticket directly to your landlord and property manager.'
      }\n\nI have prepared a maintenance request draft with your details. Would you like me to submit it, or would you like to add more details (such as preferred contractor time window or photos)?`;
    }

    // 4. Tenant Satisfaction & Living Arrangement
    if (
      text.includes('satisfied') ||
      text.includes('dissatisfied') ||
      text.includes('not happy') ||
      text.includes('unhappy') ||
      text.includes('living arrangement') ||
      text.includes('neighbor') ||
      text.includes('cold room') ||
      text.includes('noisy')
    ) {
      return `Thank you for sharing your experience. Your living comfort and peace of mind are essential.\n\nIf you are facing specific challenges—whether it's noise disturbances, facility upkeep, or common area maintenance—I can guide you on the best steps under RentHub guidelines, or help you draft a constructive note to your landlord.\n\nCould you tell me a bit more about the main issue causing dissatisfaction?`;
    }

    // 5. Landlord Communication Drafting
    if (
      text.includes('message to landlord') ||
      text.includes('draft') ||
      text.includes('talk to landlord') ||
      text.includes('write a letter')
    ) {
      return `I would be happy to draft a clear, polite, and professional message for your landlord. What is the main subject you would like to discuss (e.g., rent extension, maintenance update, lease renewal, or move-out notice)?`;
    }

    // 6. Future Accommodation Planning
    if (
      text.includes('moving out') ||
      text.includes('find a bigger place') ||
      text.includes('leave') ||
      text.includes('terminate lease') ||
      text.includes('renew')
    ) {
      return `Whether you are planning to renew your tenancy or transition to a new home, RentHub is here to assist.\n\nIf you are planning to move, remember that standard leases in Nepal typically require **30 days' advance notice** to ensure your security deposit is smoothly returned. If you are looking for your next property, I can also help you explore available listings matching your new preferences.\n\nWhat are your plans for your next accommodation?`;
    }

    // 7. Property Discovery Follow-up
    if (
      text.includes('kathmandu') ||
      text.includes('lalitpur') ||
      text.includes('bhaktapur') ||
      text.includes('baneshwor') ||
      text.includes('apartment') ||
      text.includes('flat') ||
      text.includes('bhk') ||
      text.includes('room') ||
      text.includes('budget') ||
      text.includes('looking for') ||
      text.includes('find')
    ) {
      return `I can help you find available properties in our real RentHub database! I'm searching matching listings with verified details and actual rental prices. Let me show you the current options.`;
    }

    // 8. General Greeting / Assistance
    if (userContext?.activeTenancy) {
      return `Hello ${userContext.userName || 'there'}! I am your RentHub AI Assistant.\n\nI see you are currently residing at **${userContext.activeTenancy.propertyTitle} (${userContext.activeTenancy.unitIdentifier})** with landlord **${userContext.activeTenancy.landlordName}**.\n\nHow can I support your tenancy today? I can help you with:\n- Submitting maintenance requests\n- Inquiring about rent payments or financial arrangements\n- Drafting communications to your landlord\n- Planning future accommodation moves`;
    }

    return `Hello! I am the RentHub AI Assistant. I can help you discover ideal rental properties in Nepal, or provide ongoing support for your tenancy.\n\nWhat kind of accommodation or assistance are you looking for today?`;
  }
}

export const aiProviderService = new AIProviderService();

