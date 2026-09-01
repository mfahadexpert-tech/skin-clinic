-- ==============================================================================
-- Migration 021: Unified Omnichannel Communication Inbox Schema
-- ==============================================================================
-- 1. Creates conversations table (WhatsApp, Email, Web Chat, Voice Call Transcripts).
-- 2. Creates messages table (supports patient messages, staff replies, AI agent responses & internal team notes).
-- ==============================================================================

-- 1. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    clinic_id UUID DEFAULT gen_random_uuid(),
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL DEFAULT 'whatsapp', -- 'whatsapp', 'email', 'web_chat', 'voice_call'
    assigned_staff_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    unread_count INTEGER DEFAULT 0,
    is_overdue BOOLEAN DEFAULT FALSE,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    clinic_id UUID DEFAULT gen_random_uuid(),
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(50) NOT NULL DEFAULT 'patient', -- 'patient', 'staff', 'ai_agent', 'system'
    channel VARCHAR(50) NOT NULL,
    message_body TEXT NOT NULL,
    transcript_json JSONB,
    is_internal_note BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conversations_customer ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);

-- Seed Sample Omnichannel Conversations
INSERT INTO conversations (id, customer_id, channel, unread_count, is_overdue) VALUES
(1, 1, 'whatsapp', 1, false),
(2, 1, 'voice_call', 0, false),
(3, 1, 'email', 0, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO messages (id, conversation_id, sender_type, channel, message_body, is_internal_note) VALUES
(1, 1, 'patient', 'whatsapp', 'Hi, I want to confirm my HydraFacial session tomorrow at 3 PM.', false),
(2, 1, 'ai_agent', 'whatsapp', 'Hello Ayesha! Your HydraFacial appointment is confirmed for tomorrow 3:00 PM with Dr. Sarah Khan.', false),
(3, 1, 'staff', 'whatsapp', 'Internal Note: Patient requested sunblock sample upon arrival.', true),
(4, 2, 'patient', 'voice_call', 'Voice Booking Call Transcript: Inquired about TCA Peel package prices.', false)
ON CONFLICT (id) DO NOTHING;
