-- ==============================================================================
-- Migration 009: Digital Intake & Medical Consent Form Schema
-- ==============================================================================
-- 1. Creates form_templates table.
-- 2. Creates patient_form_submissions table with digital signatures & doctor review.
-- 3. Seeds core clinical consent templates.
-- ==============================================================================

-- 1. FORM TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS form_templates (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    clinic_id UUID DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL, -- e.g. 'Medical History & Allergies', 'Fitzpatrick Skin Assessment', 'Laser Hair Reduction Consent'
    version INTEGER DEFAULT 1,
    schema_json JSONB NOT NULL,
    is_mandatory BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. PATIENT FORM SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS patient_form_submissions (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    clinic_id UUID DEFAULT gen_random_uuid(),
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
    template_id INTEGER REFERENCES form_templates(id) ON DELETE CASCADE,
    responses_json JSONB NOT NULL,
    signature_base64 TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_by_doctor_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    override_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_submissions_customer ON patient_form_submissions(customer_id);
CREATE INDEX IF NOT EXISTS idx_submissions_appointment ON patient_form_submissions(appointment_id);

-- Seed Core Clinical Consent Templates
INSERT INTO form_templates (id, name, version, is_mandatory, schema_json) VALUES
(1, 'Medical History & Allergies Intake', 1, true, '{"fields": [{"id": "allergies", "label": "Known Allergies", "type": "text"}, {"id": "medications", "label": "Current Oral Medications (Roaccutane, Blood Thinners)", "type": "text"}]}'),
(2, 'Fitzpatrick Skin Type Classification', 1, true, '{"fields": [{"id": "sun_reaction", "label": "Reaction to Sun Exposure", "type": "select", "options": ["Always burns, never tans (Type I)", "Burns easily, tans minimally (Type II)", "Sometimes burns, tans uniformly (Type III)", "Rarely burns, tans easily (Type IV)", "Never burns, deeply pigmented (Type V-VI)"]}]}'),
(3, 'Before & After Clinical Photography Consent', 1, true, '{"fields": [{"id": "photo_consent", "label": "I authorize clinical photography for medical record & progress tracking.", "type": "boolean"}]}'),
(4, 'Laser Hair Reduction & Resurfacing Consent', 1, false, '{"fields": [{"id": "shaved_prior", "label": "Area shaved 24h prior to session", "type": "boolean"}, {"id": "sun_exposure", "label": "No active sunburn or tanning in past 14 days", "type": "boolean"}]}'),
(5, 'Chemical Peel & Injectable Medical Consent', 1, false, '{"fields": [{"id": "peel_history", "label": "No Roaccutane use in past 6 months", "type": "boolean"}]}')
ON CONFLICT (id) DO NOTHING;
