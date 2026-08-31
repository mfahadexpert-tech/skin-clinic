-- ==============================================================================
-- Migration 014: Adverse-Event & Complication Management Schema
-- ==============================================================================
-- 1. Creates adverse_events table for tracking clinical complications.
-- 2. Enforces immutable record protection via trigger preventing DELETE operations.
-- 3. Supports severity levels (mild, moderate, severe, critical) & audit logs.
-- ==============================================================================

-- 1. ADVERSE EVENTS & COMPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS adverse_events (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    clinic_id UUID DEFAULT gen_random_uuid(),
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES employees(id) ON DELETE RESTRICT,
    treatment_name VARCHAR(200) NOT NULL,
    severity_level VARCHAR(50) NOT NULL DEFAULT 'moderate', -- 'mild', 'moderate', 'severe', 'critical'
    symptoms TEXT NOT NULL,
    immediate_action TEXT NOT NULL,
    follow_up_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    resolution_notes TEXT,
    status VARCHAR(50) DEFAULT 'reported', -- 'reported', 'under_review', 'resolved'
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_adverse_events_severity ON adverse_events(severity_level, is_resolved);

-- 2. TRIGGER: PREVENT DELETION OF ADVERSE EVENT RECORDS (IMMUTABLE AUDIT TRAIL)
CREATE OR REPLACE FUNCTION prevent_adverse_event_deletion()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Deletion Blocked: Clinical adverse event incident records are immutable and cannot be deleted for medical compliance.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prevent_adverse_event_deletion') THEN
        CREATE TRIGGER trg_prevent_adverse_event_deletion
        BEFORE DELETE ON adverse_events
        FOR EACH ROW EXECUTE FUNCTION prevent_adverse_event_deletion();
    END IF;
END $$;

-- Seed Sample Incident Record
INSERT INTO adverse_events (id, customer_id, doctor_id, treatment_name, severity_level, symptoms, immediate_action, follow_up_deadline) VALUES
(1, 1, 1, 'Chemical Peel (TCA 30%)', 'moderate', 'Persistent erythema & localized blistering on cheek area', 'Applied hydrocortisone 1% cream + cool saline compress. Prescribed oral antihistamine.', CURRENT_TIMESTAMP + INTERVAL '24 hours')
ON CONFLICT (id) DO NOTHING;
