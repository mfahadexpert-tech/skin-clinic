-- ==============================================================================
-- Migration 017: Consent-Based AI Clinical Scribe Schema
-- ==============================================================================
-- 1. Creates ai_scribe_sessions table for storing consultation transcripts,
--    RAG sources, AI model information, and doctor review sign-offs.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS ai_scribe_sessions (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    clinic_id UUID DEFAULT gen_random_uuid(),
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES employees(id) ON DELETE RESTRICT,
    transcription_consent BOOLEAN NOT NULL DEFAULT TRUE,
    raw_transcript TEXT NOT NULL,
    ai_model_name VARCHAR(100) DEFAULT 'gpt-4o',
    retrieved_sources JSONB,
    structured_draft_json JSONB, -- { concerns, history, assessment, procedure, settings, products, aftercare, follow_up }
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'approved', 'amended'
    final_approved_note TEXT,
    approved_by_doctor_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_scribe_customer ON ai_scribe_sessions(customer_id);

-- Seed Sample AI Scribe Session
INSERT INTO ai_scribe_sessions (id, customer_id, doctor_id, transcription_consent, raw_transcript, structured_draft_json, status) VALUES
(1, 1, 1, true, 'Patient reports post-acne scarring on cheeks. Executed HydraFacial Deluxe with GlySal 7.5% peel and hyaluronic infusion.', '{"concerns": "Post-acne scarring & mild dullness", "history": "No Roaccutane in 6 months", "assessment": "Fitzpatrick Type III", "procedure": "HydraFacial Deluxe", "settings": "Suction Level 3, GlySal 7.5%", "products": "DermaShield SPF 60", "aftercare": "Sunblock every 4h", "follow_up": "2 weeks"}', 'draft')
ON CONFLICT (id) DO NOTHING;
