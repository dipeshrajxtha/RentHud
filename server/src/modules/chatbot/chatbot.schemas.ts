import { z } from 'zod';

export const createConversationSchema = z.object({
  title: z.string().trim().max(100).optional(),
  initialMode: z
    .enum(['discovery', 'tenant_support', 'maintenance', 'financial', 'general'])
    .optional()
    .default('general'),
  sessionId: z.string().trim().min(8).max(128).optional(),
});

export const sendMessageSchema = z.object({
  message: z.string().trim().min(1, 'Message cannot be empty').max(2000, 'Message exceeds 2000 characters'),
  sessionId: z.string().trim().min(8).max(128).optional(),
  clientContext: z
    .object({
      currentUrl: z.string().optional(),
      selectedPropertyId: z.string().uuid().optional(),
      activeTab: z.string().optional(),
    })
    .optional(),
});

export const executeActionSchema = z.object({
  actionType: z.enum([
    'submit_maintenance_ticket',
    'search_properties',
    'save_search_criteria',
    'reset_context',
  ]),
  payload: z.record(z.any()),
  sessionId: z.string().trim().min(8).max(128).optional(),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type ExecuteActionInput = z.infer<typeof executeActionSchema>;

