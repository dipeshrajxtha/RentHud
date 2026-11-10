import type { Kysely } from 'kysely';
import type { Database, ChatbotMode, UnitAvailabilityStatus } from '../../types/database.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../common/errors/index.js';
import {
  detectIntent,
  extractAllCriteria,
  type DetectedIntent,
  type ExtractedCriteria,
} from './nlp.service.js';
import { aiProviderService, type UserContext, type AIMessage } from './ai-provider.service.js';
import { searchProperties } from '../properties/properties.service.js';
import { createMaintenanceTicket } from '../operations/operations.service.js';
import type { CreateConversationInput, SendMessageInput, ExecuteActionInput } from './chatbot.schemas.js';
import { propertySearchQuerySchema, type PropertySearchQuery } from '../properties/properties.schemas.js';

export interface ChatbotConversationDetail {
  id: string;
  userId: string | null;
  sessionId: string | null;
  title: string;
  currentMode: ChatbotMode;
  contextData: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    mode: string | null;
    metadata: Record<string, any>;
    createdAt: Date;
  }>;
}

export class ChatbotService {
  /**
   * Simple in-memory sliding window rate limiter
   * Limits each user/session to 30 requests per minute to prevent abuse
   */
  private rateLimitMap = new Map<string, { count: number; resetAt: number }>();

  checkRateLimit(identifier: string): void {
    const now = Date.now();
    const windowMs = 60 * 1000;
    const maxReqs = 30;

    const current = this.rateLimitMap.get(identifier);
    if (!current || now > current.resetAt) {
      this.rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs });
      return;
    }

    if (current.count >= maxReqs) {
      throw new BadRequestError('Too many chatbot requests. Please wait a moment before sending another message.');
    }

    current.count += 1;
  }

  /**
   * Retrieves authenticated user tenancy context
   */
  async getUserContext(db: Kysely<Database>, userId?: string): Promise<UserContext | undefined> {
    if (!userId) return undefined;

    const user = await db
      .selectFrom('users')
      .select(['id', 'name', 'roles'])
      .where('id', '=', userId)
      .executeTakeFirst();

    if (!user) return undefined;

    // Fetch active tenancy if user is a tenant — optional, never crash if schema differs
    let activeTenancy: Awaited<ReturnType<typeof this._fetchActiveTenancy>> = undefined;
    let openMaintenanceTicketsCount = 0;
    let pendingPaymentsCount = 0;

    try {
      activeTenancy = await this._fetchActiveTenancy(db, userId);
    } catch (err) {
      console.warn('[Chatbot] activeTenancy query failed (non-fatal):', (err as Error).message);
    }

    try {
      const openTickets = await db
        .selectFrom('maintenance_requests')
        .select(db.fn.count('id').as('count'))
        .where('reported_by_id', '=', userId)
        .where('status', 'in', ['Reported', 'Scheduled', 'In Progress'])
        .executeTakeFirst();
      openMaintenanceTicketsCount = Number(openTickets?.count ?? 0);
    } catch (err) {
      console.warn('[Chatbot] openTickets query failed (non-fatal):', (err as Error).message);
    }

    try {
      const pendingPayments = await db
        .selectFrom('rent_payments')
        .select(db.fn.count('id').as('count'))
        .where('tenant_id', '=', userId)
        .where('status', '=', 'PENDING')
        .executeTakeFirst();
      pendingPaymentsCount = Number(pendingPayments?.count ?? 0);
    } catch (err) {
      console.warn('[Chatbot] pendingPayments query failed (non-fatal):', (err as Error).message);
    }

    return {
      userId: user.id,
      userName: user.name,
      roles: user.roles,
      activeTenancy: activeTenancy ?? null,
      openMaintenanceTicketsCount,
      pendingPaymentsCount,
    };
  }

  private async _fetchActiveTenancy(db: Kysely<Database>, userId: string) {
    const row = await db
      .selectFrom('tenancies as t')
      .innerJoin('property_units as pu', 'pu.id', 't.unit_id')
      .innerJoin('properties as p', 'p.id', 'pu.property_id')
      .innerJoin('users as l', 'l.id', 't.landlord_id')
      .select([
        't.id',
        'p.title as property_title',
        'pu.unit_identifier',
        'p.address',
        'p.city',
        'l.name as landlord_name',
        't.agreed_monthly_rent',
        't.start_date',
        't.end_date',
      ])
      .where('t.tenant_id', '=', userId)
      .where('t.status', '=', 'active')
      .executeTakeFirst();

    if (!row) return undefined;
    return {
      id: row.id,
      propertyTitle: row.property_title,
      unitIdentifier: row.unit_identifier,
      address: row.address,
      city: row.city,
      landlordName: row.landlord_name,
      monthlyRent: row.agreed_monthly_rent,
      startDate: new Date(row.start_date).toLocaleDateString(),
      endDate: new Date(row.end_date).toLocaleDateString(),
    };
  }

  /**
   * Verify conversation ownership to prevent cross-user data leakage
   */
  private async getConversationAndVerifyAccess(
    db: Kysely<Database>,
    conversationId: string,
    userId?: string,
    sessionId?: string
  ) {
    const conv = await db
      .selectFrom('chatbot_conversations')
      .selectAll()
      .where('id', '=', conversationId)
      .executeTakeFirst();

    if (!conv) {
      throw new NotFoundError('Conversation not found');
    }

    if (userId) {
      if (conv.user_id && conv.user_id !== userId) {
        throw new ForbiddenError('You do not have access to this conversation');
      }
    } else {
      if (conv.user_id) {
        throw new ForbiddenError('Authentication required to access this conversation');
      }
      if (conv.session_id && sessionId && conv.session_id !== sessionId) {
        throw new ForbiddenError('Session mismatch for guest conversation');
      }
    }

    return conv;
  }

  /**
   * Create a new conversation
   */
  async createConversation(
    db: Kysely<Database>,
    userId?: string,
    input?: CreateConversationInput
  ) {
    const sessionId = input?.sessionId ?? crypto.randomUUID();
    const title = input?.title ?? 'New Conversation';
    const currentMode = input?.initialMode ?? 'general';

    const [conv] = await db
      .insertInto('chatbot_conversations')
      .values({
        user_id: userId ?? null,
        session_id: sessionId,
        title,
        current_mode: currentMode,
        context_data: JSON.stringify({}),
      })
      .returningAll()
      .execute();

    // Insert initial greeting message — getUserContext is best-effort; never fail createConversation over it
    let userContext: Awaited<ReturnType<typeof this.getUserContext>> = undefined;
    try {
      userContext = await this.getUserContext(db, userId);
    } catch (err) {
      console.warn('[Chatbot] getUserContext failed during createConversation (non-fatal):', err);
    }
    let initialGreeting = `Hello! I am your RentHub AI Assistant. I can help you discover ideal rental properties across Nepal or assist with your tenancy.`;

    if (userContext?.activeTenancy) {
      initialGreeting = `Namaste ${userContext.userName}! I am your RentHub Assistant. I see you are currently residing at **${userContext.activeTenancy.propertyTitle} (${userContext.activeTenancy.unitIdentifier})**.\n\nHow can I support your tenancy today?`;
    }

    const [msg] = await db
      .insertInto('chatbot_messages')
      .values({
        conversation_id: conv.id,
        role: 'assistant',
        content: initialGreeting,
        mode: currentMode,
        metadata: JSON.stringify({
          suggestedPrompts: userContext?.activeTenancy
            ? [
                'Report a maintenance issue',
                'Help communicating with landlord',
                'Concern about rent payment',
                'Looking for a new property',
              ]
            : [
                'Find a 2 BHK apartment in Kathmandu',
                'Explore rentals under NPR 25,000',
                'Properties around Baneshwor',
                'Furnished flats in Lalitpur',
              ],
        }),
      })
      .returningAll()
      .execute();

    return {
      conversation: {
        ...conv,
        context_data: typeof conv.context_data === 'string' ? JSON.parse(conv.context_data) : conv.context_data,
      },
      initialMessage: {
        ...msg,
        metadata: typeof msg.metadata === 'string' ? JSON.parse(msg.metadata) : msg.metadata,
      },
    };
  }

  /**
   * List conversations
   */
  async listConversations(
    db: Kysely<Database>,
    userId?: string,
    sessionId?: string
  ) {
    let query = db.selectFrom('chatbot_conversations').selectAll();

    if (userId) {
      query = query.where('user_id', '=', userId);
    } else if (sessionId) {
      query = query.where('session_id', '=', sessionId).where('user_id', 'is', null);
    } else {
      return [];
    }

    const rows = await query.orderBy('updated_at', 'desc').limit(20).execute();
    return rows.map((r) => ({
      ...r,
      context_data: typeof r.context_data === 'string' ? JSON.parse(r.context_data) : r.context_data,
    }));
  }

  /**
   * Get full conversation history
   */
  async getConversationDetail(
    db: Kysely<Database>,
    conversationId: string,
    userId?: string,
    sessionId?: string
  ): Promise<ChatbotConversationDetail> {
    const conv = await this.getConversationAndVerifyAccess(db, conversationId, userId, sessionId);

    const messages = await db
      .selectFrom('chatbot_messages')
      .selectAll()
      .where('conversation_id', '=', conv.id)
      .orderBy('created_at', 'asc')
      .execute();

    return {
      id: conv.id,
      userId: conv.user_id,
      sessionId: conv.session_id,
      title: conv.title,
      currentMode: conv.current_mode,
      contextData: typeof conv.context_data === 'string' ? JSON.parse(conv.context_data) : conv.context_data,
      createdAt: conv.created_at,
      updatedAt: conv.updated_at,
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        mode: m.mode,
        metadata: typeof m.metadata === 'string' ? JSON.parse(m.metadata) : m.metadata,
        createdAt: m.created_at,
      })),
    };
  }

  /**
   * Process incoming user message
   */
  async processUserMessage(
    db: Kysely<Database>,
    conversationId: string,
    userId: string | undefined,
    sessionId: string | undefined,
    input: SendMessageInput
  ) {
    this.checkRateLimit(userId || sessionId || 'anonymous');

    const conv = await this.getConversationAndVerifyAccess(db, conversationId, userId, sessionId);
    const existingContext =
      typeof conv.context_data === 'string' ? JSON.parse(conv.context_data) : { ...conv.context_data };

    // 1. Record the user message
    const [userMessage] = await db
      .insertInto('chatbot_messages')
      .values({
        conversation_id: conv.id,
        role: 'user',
        content: input.message,
        mode: conv.current_mode,
        metadata: JSON.stringify(input.clientContext || {}),
      })
      .returningAll()
      .execute();

    // 2. Perform Natural Language Understanding
    const detectedIntent = detectIntent(input.message);
    const extractedCriteria = extractAllCriteria(input.message);
    let userContext: Awaited<ReturnType<typeof this.getUserContext>> = undefined;
    try {
      userContext = await this.getUserContext(db, userId);
    } catch (err) {
      console.warn('[Chatbot] getUserContext failed during processUserMessage (non-fatal):', err);
    }

    // Merge accumulated criteria into contextData
    if (extractedCriteria.location) {
      existingContext.location = extractedCriteria.location;
      existingContext.locationName = extractedCriteria.location.name;
      existingContext.city = extractedCriteria.location.city;
      existingContext.latitude = extractedCriteria.location.latitude;
      existingContext.longitude = extractedCriteria.location.longitude;
    }
    if (extractedCriteria.minRent !== undefined) existingContext.minRent = extractedCriteria.minRent;
    if (extractedCriteria.maxRent !== undefined) existingContext.maxRent = extractedCriteria.maxRent;
    if (extractedCriteria.bedrooms !== undefined) existingContext.bedrooms = extractedCriteria.bedrooms;
    if (extractedCriteria.bathrooms !== undefined) existingContext.bathrooms = extractedCriteria.bathrooms;
    if (extractedCriteria.propertyType) existingContext.propertyType = extractedCriteria.propertyType;
    if (extractedCriteria.furnishing) existingContext.furnishing = extractedCriteria.furnishing;
    if (extractedCriteria.amenities) {
      existingContext.amenities = Array.from(
        new Set([...(existingContext.amenities || []), ...extractedCriteria.amenities])
      );
    }
    if (extractedCriteria.maintenanceCategory) {
      existingContext.maintenanceCategory = extractedCriteria.maintenanceCategory;
      existingContext.maintenanceUrgency = extractedCriteria.maintenanceUrgency;
      existingContext.maintenanceTitle = extractedCriteria.maintenanceTitle;
      existingContext.maintenanceDescription = extractedCriteria.maintenanceDescription;
    }

    // Determine conversational mode
    let targetMode: ChatbotMode = conv.current_mode;
    if (detectedIntent === 'property_search') targetMode = 'discovery';
    else if (detectedIntent === 'maintenance_issue') targetMode = 'maintenance';
    else if (detectedIntent === 'financial_difficulty') targetMode = 'financial';
    else if (detectedIntent === 'tenant_satisfaction' || detectedIntent === 'landlord_communication') targetMode = 'tenant_support';

    // 3. Execute Domain Logic
    let assistantContent = '';
    const metadata: Record<string, any> = {};

    if (detectedIntent === 'emergency') {
      targetMode = 'tenant_support';
      assistantContent = `🚨 **IMMEDIATE EMERGENCY SAFETY NOTICE**\n\nIf you or anyone in the premises is in danger, please contact Nepal emergency services immediately:\n\n- 🚓 **Nepal Police:** 100\n- 🚒 **Fire Department:** 101\n- 🚑 **Ambulance Services:** 102\n\nPlease move to a secure location. Once safety is secured, contact your landlord and property manager immediately.`;
      metadata.isEmergency = true;
    } else if (targetMode === 'discovery' || detectedIntent === 'property_search') {
      // Check if we should execute a real property search
      const hasSpecificLocation = !!existingContext.locationName && existingContext.locationName !== 'Kathmandu Center' && existingContext.locationName !== 'Lalitpur Center';
      const hasLocation = !!existingContext.locationName || !!existingContext.city;
      const hasBudget = !!existingContext.maxRent;
      const hasBedrooms = !!existingContext.bedrooms;
      const explicitSearch = input.message.toLowerCase().includes('search') || input.message.toLowerCase().includes('find') && (hasBudget || hasSpecificLocation);

      // If user provided specific location AND budget, or explicitly asked to search:
      if ((hasLocation && hasBudget && (hasBedrooms || hasSpecificLocation)) || (explicitSearch && hasLocation)) {
        const searchQuery = propertySearchQuerySchema.parse({
          city: existingContext.city,
          latitude: existingContext.latitude,
          longitude: existingContext.longitude,
          minRent: existingContext.minRent,
          maxRent: existingContext.maxRent,
          bedrooms: existingContext.bedrooms,
          bathrooms: existingContext.bathrooms,
          amenities: existingContext.amenities,
          availability: 'AVAILABLE',
          limit: 6,
        });

        let searchResult;
        try {
          searchResult = await searchProperties(db, searchQuery);
        } catch (err) {
          console.warn('[Chatbot Search Error]', err);
          searchResult = { properties: [], spatial: undefined, pagination: { total: 0, page: 1, limit: 6, totalPages: 0 } };
        }

        const foundProps = searchResult.properties;

        if (foundProps.length > 0) {
          const locDesc = existingContext.locationName ? `around ${existingContext.locationName}` : 'in your preferred area';
          const budgetDesc = existingContext.maxRent ? `within NPR ${existingContext.maxRent.toLocaleString()}` : '';
          const bhkDesc = existingContext.bedrooms ? `${existingContext.bedrooms} BHK ` : '';

          assistantContent = `I found **${foundProps.length}** available ${bhkDesc}properties ${locDesc} ${budgetDesc} in our database. Here are the top matching listings:`;
          
          metadata.properties = foundProps.map((p) => ({
            id: p.id,
            title: p.title,
            address: p.address,
            city: p.city,
            minMonthlyRent: p.minMonthlyRent,
            maxMonthlyRent: p.maxMonthlyRent,
            coverPhotoUrl: p.coverPhotoUrl,
            availableUnitsCount: p.availableUnitsCount,
            totalFloors: p.totalFloors,
            units: p.units,
            amenities: p.amenities,
          }));
          metadata.suggestedPrompts = [
            'Show unfurnished options only',
            'Filter with parking space',
            'Look in nearby areas',
          ];
        } else {
          const locDesc = existingContext.locationName || existingContext.city || 'your chosen location';
          const budgetDesc = existingContext.maxRent ? `under NPR ${existingContext.maxRent.toLocaleString()}` : '';
          assistantContent = `I searched our database, but there are currently no available properties matching those exact criteria around **${locDesc}** ${budgetDesc}.\n\nWould you like to:\n1. Expand your search radius to nearby neighborhoods?\n2. Slightly adjust your rental budget?\n3. Look for available properties in surrounding areas like ${locDesc.includes('Baneshwor') ? 'Koteshwor or Tinkune' : 'Patan or Sanepa'}?`;
          metadata.noResults = true;
          metadata.suggestedPrompts = [
            'Increase budget by NPR 5,000',
            'Expand search radius',
            'Search in nearby areas',
          ];
        }
      } else {
        // Natural sequential follow-up questioning
        if (!hasLocation) {
          assistantContent = `I can help you find your ideal rental home! Do you have a preferred neighborhood or area in Kathmandu Valley (such as Baneshwor, Thamel, Sanepa, or Jhamsikhel)?`;
          metadata.suggestedPrompts = ['Around Baneshwor', 'Thamel', 'Sanepa, Lalitpur', 'Baluwatar'];
        } else if (!hasBudget) {
          const areaName = existingContext.locationName === 'Kathmandu Center' ? 'Kathmandu' : existingContext.locationName;
          assistantContent = `I can help you find one. Do you have a preferred area in ${areaName}, and what is your approximate monthly rental budget?`;
          metadata.suggestedPrompts = ['Below NPR 20,000', 'Below NPR 25,000', 'Around Baneshwor, below NPR 25,000'];
        } else if (!existingContext.furnishing) {
          assistantContent = `Great. Would you prefer a furnished apartment or an unfurnished one?`;
          metadata.suggestedPrompts = ['Furnished', 'Semi-furnished', 'Unfurnished'];
        } else {
          assistantContent = `Understood. I will look for available ${existingContext.bedrooms ? existingContext.bedrooms + '-bedroom ' : ''}properties around ${existingContext.locationName || existingContext.city} within your budget.`;
        }
      }
    } else if (targetMode === 'maintenance' || detectedIntent === 'maintenance_issue') {
      const isUrgent = input.message.toLowerCase().includes('continuous') || input.message.toLowerCase().includes('flooding');
      const category = existingContext.maintenanceCategory || 'Plumbing';
      const title = existingContext.maintenanceTitle || 'Maintenance Request';

      assistantContent = `I understand how inconvenient maintenance issues can be.\n\n${
        isUrgent
          ? '⚠️ **Urgent Action:** If water is actively flowing or electric sparking is occurring, please shut off the nearest valve or circuit breaker if safe to do so.'
          : 'I have prepared an official maintenance ticket draft for your landlord and property manager.'
      }\n\nYou can review the details below and click **"Submit Maintenance Request"** to officially log it.`;

      metadata.maintenanceDraft = {
        category,
        urgency: existingContext.maintenanceUrgency || (isUrgent ? 'High' : 'Normal'),
        title,
        description: input.message,
        tenancyId: userContext?.activeTenancy?.id,
        propertyTitle: userContext?.activeTenancy?.propertyTitle || 'Rented Property',
      };
      metadata.suggestedPrompts = [
        'Submit this maintenance request',
        'Mark as High Urgency',
        'Draft a message to landlord instead',
      ];
    } else if (targetMode === 'financial' || detectedIntent === 'financial_difficulty') {
      const landlord = userContext?.activeTenancy?.landlordName || 'Landlord';
      assistantContent = `I am sorry to hear you are experiencing financial difficulties. Situations like delayed salary or unexpected expenses do occur, and open communication is the best approach.\n\nWhile I cannot directly alter payment terms or waive rent, I can help you draft a respectful and professional message to **${landlord}** proposing a realistic payment timeline. In Nepal, landlords appreciate early notice rather than unexpected late payments.\n\nHere is a drafted message for your review:`;

      metadata.messageDraft = {
        recipient: landlord,
        subject: 'Notice regarding upcoming rent payment & extension request',
        body: `Dear ${landlord},\n\nI hope this message finds you well. I am writing to respectfully inform you that due to unexpected financial circumstances (such as delayed payroll), I may experience a short delay in paying this month's rent for unit ${userContext?.activeTenancy?.unitIdentifier || 'my unit'}.\n\nI anticipate resolving this and making the payment by [Expected Date]. I sincerely apologize for any inconvenience this may cause and greatly appreciate your kind understanding.\n\nWarm regards,\n${userContext?.userName || 'Your Tenant'}`,
        legalNote: 'Under Section 613 of Nepal Civil Code 2074, tenant payment terms are governed by your signed tenancy agreement. RentHub provides this draft for communication purposes only.',
      };
      metadata.suggestedPrompts = [
        'Copy drafted message',
        'Propose split payment plan',
        'Review lease payment terms',
      ];
    } else if (detectedIntent === 'tenant_satisfaction') {
      assistantContent = `Thank you for sharing your thoughts with me. Your comfort in your home is top priority.\n\nWhether you are dealing with noise from neighboring units, building cleanliness, or utility interruptions, RentHub provides structured dispute mediation and communication tools.\n\nWould you like me to help draft a constructive message to your landlord, or provide guidance on our resolution process?`;
      metadata.suggestedPrompts = [
        'Draft message to landlord',
        'Learn about dispute mediation',
        'Check my tenancy agreement',
      ];
    } else {
      // General or AI model fallback
      const recentMessages = await db
        .selectFrom('chatbot_messages')
        .select(['role', 'content'])
        .where('conversation_id', '=', conv.id)
        .orderBy('created_at', 'asc')
        .limit(10)
        .execute();

      const aiMessages: AIMessage[] = recentMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const aiRes = await aiProviderService.generateResponse(aiMessages, userContext);
      assistantContent = aiRes.content;
      metadata.aiProvider = aiRes.providerUsed;
    }

    // 4. Record assistant message
    const [assistantMessage] = await db
      .insertInto('chatbot_messages')
      .values({
        conversation_id: conv.id,
        role: 'assistant',
        content: assistantContent,
        mode: targetMode,
        metadata: JSON.stringify(metadata),
      })
      .returningAll()
      .execute();

    // 5. Update conversation state
    await db
      .updateTable('chatbot_conversations')
      .set({
        current_mode: targetMode,
        context_data: JSON.stringify(existingContext),
        updated_at: new Date(),
        title: conv.title === 'New Conversation' ? input.message.slice(0, 35) : conv.title,
      })
      .where('id', '=', conv.id)
      .execute();

    return {
      userMessage: {
        ...userMessage,
        metadata: typeof userMessage.metadata === 'string' ? JSON.parse(userMessage.metadata) : userMessage.metadata,
      },
      assistantMessage: {
        ...assistantMessage,
        metadata: typeof assistantMessage.metadata === 'string' ? JSON.parse(assistantMessage.metadata) : assistantMessage.metadata,
      },
      currentMode: targetMode,
    };
  }

  /**
   * Execute confirmed action (e.g. submit maintenance ticket)
   */
  async executeAction(
    db: Kysely<Database>,
    conversationId: string,
    userId: string | undefined,
    sessionId: string | undefined,
    input: ExecuteActionInput
  ) {
    const conv = await this.getConversationAndVerifyAccess(db, conversationId, userId, sessionId);

    if (input.actionType === 'submit_maintenance_ticket') {
      if (!userId) {
        throw new ForbiddenError('You must be logged in as a tenant to submit a maintenance request');
      }

      const payload = input.payload;
      let userContext: Awaited<ReturnType<typeof this.getUserContext>> = undefined;
      try {
        userContext = await this.getUserContext(db, userId);
      } catch (err) {
        console.warn('[Chatbot] getUserContext failed during executeAction (non-fatal):', err);
      }

      const ticket = await createMaintenanceTicket(db, userId, {
        tenancyId: payload.tenancyId || userContext?.activeTenancy?.id,
        category: payload.category || 'Plumbing',
        urgency: payload.urgency || 'Normal',
        title: payload.title || 'Maintenance Request from AI Assistant',
        description: payload.description || 'Reported via RentHub AI Assistant',
        preferredTimeWindow: payload.preferredTimeWindow,
      });

      const confirmationContent = `✅ **Maintenance Ticket Created Successfully!**\n\nYour request **"${payload.title || 'Maintenance Request'}"** (Urgency: **${payload.urgency || 'Normal'}**) has been registered with Ticket ID **#${ticket.id.slice(0, 8)}**.\n\nYour landlord and maintenance team have been notified. You can track this in your **Maintenance** tab.`;

      const [assistantMessage] = await db
        .insertInto('chatbot_messages')
        .values({
          conversation_id: conv.id,
          role: 'assistant',
          content: confirmationContent,
          mode: 'maintenance',
          metadata: JSON.stringify({
            ticketCreated: true,
            ticketId: ticket.id,
            status: 'Reported',
          }),
        })
        .returningAll()
        .execute();

      return {
        success: true,
        ticket,
        assistantMessage: {
          ...assistantMessage,
          metadata: typeof assistantMessage.metadata === 'string' ? JSON.parse(assistantMessage.metadata) : assistantMessage.metadata,
        },
      };
    }

    if (input.actionType === 'reset_context') {
      await db
        .updateTable('chatbot_conversations')
        .set({
          context_data: JSON.stringify({}),
          updated_at: new Date(),
        })
        .where('id', '=', conv.id)
        .execute();

      return { success: true, message: 'Context reset' };
    }

    throw new BadRequestError(`Unknown action: ${input.actionType}`);
  }

  /**
   * Delete conversation
   */
  async deleteConversation(
    db: Kysely<Database>,
    conversationId: string,
    userId?: string,
    sessionId?: string
  ) {
    await this.getConversationAndVerifyAccess(db, conversationId, userId, sessionId);
    await db.deleteFrom('chatbot_conversations').where('id', '=', conversationId).execute();
    return { success: true };
  }
}

export const chatbotService = new ChatbotService();
