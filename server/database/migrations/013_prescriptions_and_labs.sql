-- ==============================================================================
-- Migration 013: Prescription & Laboratory Workflow Schema
-- ==============================================================================
-- 1. Creates prescriptions table with medication details, dosage, & doctor approval.
-- 2. Creates lab_requests table with result uploads & abnormal result flags.
-- ==============================================================================

-- 1. PRESCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS prescriptions (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    clinic_id UUID DEFAULT gen_random_uuid(),
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES employees(id) ON DELETE RESTRICT,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    medications_json JSONB NOT NULL, -- [{ medication, dose, frequency, duration, instructions }]
    allergies_snapshot TEXT DEFAULT 'None reported',
    clinical_diagnosis TEXT,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'approved', 'dispensed'
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by_doctor_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. LABORATORY REQUESTS TABLE
CREATE TABLE IF NOT EXISTS lab_requests (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    clinic_id UUID DEFAULT gen_random_uuid(),
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES employees(id) ON DELETE RESTRICT,
    tests_requested TEXT NOT NULL, -- e.g. 'Full Blood Count, Hormonal Panel (FSH/LH), LFT'
    result_notes TEXT,
    has_abnormal_result BOOLEAN DEFAULT FALSE,
    abnormal_flags TEXT,
    status VARCHAR(50) DEFAULT 'requested', -- 'requested', 'sample_collected', 'completed', 'abnormal'
    follow_up_task TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_customer ON prescriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_lab_requests_customer ON lab_requests(customer_id);

-- Seed Sample Prescription & Lab Record
INSERT INTO prescriptions (id, customer_id, doctor_id, clinical_diagnosis, medications_json, is_approved) VALUES
(1, 1, 1, 'Post-laser recovery & mild acne vulgaris', '[{"medication": "DermaShield SPF 60", "dose": "Apply liberally", "frequency": "Every 4 hours", "duration": "14 days", "instructions": "Mandatory sun avoidance"}, {"medication": "Clindamycin Gel 1%", "dose": "Pea size", "frequency": "Twice daily", "duration": "10 days", "instructions": "Apply to affected acne zones"}]', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lab_requests (id, customer_id, doctor_id, tests_requested, status, has_abnormal_result, abnormal_flags) VALUES
(1, 1, 1, 'Hormonal Acne Profile (Free Testosterone, DHEA-S, Thyroid TSH)', 'completed', true, 'Elevated Free Testosterone (4.2 ng/dL) - Advise PCOS evaluation')
ON CONFLICT (id) DO NOTHING;
