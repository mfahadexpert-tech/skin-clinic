-- ==============================================================================
-- Migration 018: Controlled AI Post-Treatment Follow-Up Assistant Schema
-- ==============================================================================
-- 1. Creates followup_campaigns table for scheduled post-treatment check-ins.
-- 2. Creates followup_responses table with warning phrase detection & clinician task escalation.
-- ==============================================================================

-- 1. FOLLOW-UP CAMPAIGNS TABLE
CREATE TABLE IF NOT EXISTS followup_campaigns (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    clinic_id UUID DEFAULT gen_random_uuid(),
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    treatment_name VARCHAR(200) NOT NULL,
    checkin_day INTEGER NOT NULL DEFAULT 1, -- Day 1, Day 3, Day 7 post-treatment
    question_text TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'sent', 'replied', 'escalated'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. FOLLOW-UP RESPONSES & ESCALATION HISTORY TABLE
CREATE TABLE IF NOT EXISTS followup_responses (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    clinic_id UUID DEFAULT gen_random_uuid(),
    campaign_id INTEGER REFERENCES followup_campaigns(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    patient_reply TEXT NOT NULL,
    photo_url TEXT,
    risk_level VARCHAR(50) NOT NULL DEFAULT 'normal', -- 'normal', 'warning', 'critical'
    triggered_warning_phrases TEXT,
    clinician_task_created BOOLEAN DEFAULT FALSE,
    escalation_notes TEXT,
    escalated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_followup_risk ON followup_responses(risk_level);

-- Seed Sample Follow-Up Campaign
INSERT INTO followup_campaigns (id, customer_id, treatment_name, checkin_day, question_text, status) VALUES
(1, 1, 'TCA Chemical Peel 30%', 1, 'How is your skin feeling today? Any excessive redness, warmth, or discomfort?', 'sent')
ON CONFLICT (id) DO NOTHING;
