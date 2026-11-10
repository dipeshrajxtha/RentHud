import { Kysely, sql } from 'kysely';

/**
 * Migration 00008: Add Chatbot Conversations and Messages Tables
 *
 * Supports persistent multi-turn conversations for:
 * - Property Discovery (structured criteria extraction, PostGIS spatial search)
 * - Continuous Tenant Support (satisfaction check-ins, financial difficulty guidance,
 *   maintenance ticket drafting, landlord communications, future accommodation)
 *
 * Supports authenticated users (user_id) and anonymous visitors (session_id).
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS chatbot_conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      session_id TEXT,
      title TEXT NOT NULL DEFAULT 'New Conversation',
      current_mode TEXT NOT NULL DEFAULT 'general' CHECK (
        current_mode IN ('discovery', 'tenant_support', 'maintenance', 'financial', 'general')
      ),
      context_data JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `.execute(db);

  await sql`CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_user_id ON chatbot_conversations(user_id)`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_session_id ON chatbot_conversations(session_id)`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_updated_at ON chatbot_conversations(updated_at DESC)`.execute(db);

  await sql`
    CREATE TABLE IF NOT EXISTS chatbot_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID NOT NULL REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
      content TEXT NOT NULL,
      mode TEXT DEFAULT 'general',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `.execute(db);

  await sql`CREATE INDEX IF NOT EXISTS idx_chatbot_messages_conv_id ON chatbot_messages(conversation_id)`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS idx_chatbot_messages_created_at ON chatbot_messages(created_at ASC)`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE IF EXISTS chatbot_messages CASCADE`.execute(db);
  await sql`DROP TABLE IF EXISTS chatbot_conversations CASCADE`.execute(db);
}
