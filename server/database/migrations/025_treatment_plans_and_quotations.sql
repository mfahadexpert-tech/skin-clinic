-- ==============================================================================
-- Migration 025: Doctor Treatment Plans, Quotations & 1-Click Conversion Schema
-- ==============================================================================
-- 1. Creates treatment_plans table (procedures, sessions, discounts, risks, prep).
-- 2. Supports patient/reception acceptance, rejection, & change requests.
-- 3. Enables 1-Click conversion into appointments, package sessions, & invoices.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS treatment_plans (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    clinic_id UUID DEFAULT gen_random_uuid(),
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES employees(id) ON DELETE RESTRICT,
    plan_title VARCHAR(200) NOT NULL, -- e.g. 'Comprehensive Acne Scarring Transformation Plan'
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'pending_approval', 'accepted', 'rejected', 'converted'
    procedures_json JSONB NOT NULL, -- [{ procedure_name, sessions, unit_price, discount, total }]
    estimated_total_price NUMERIC(15,4) NOT NULL,
    total_discount NUMERIC(15,4) DEFAULT 0.00,
    final_quoted_price NUMERIC(15,4) NOT NULL,
    clinical_risks TEXT DEFAULT 'Post-procedure transient erythema & localized dryness. SPF 50 required.',
    patient_prep_instructions TEXT DEFAULT 'Avoid direct sun exposure & active retinoid creams 3 days prior.',
    expected_followup_weeks INTEGER DEFAULT 4,
    accepted_at TIMESTAMP WITH TIME ZONE,
    converted_invoice_id INTEGER REFERENCES sales(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_plans_customer ON treatment_plans(customer_id, status);

-- Seed Sample Doctor Treatment Plan
INSERT INTO treatment_plans (id, customer_id, doctor_id, plan_title, status, procedures_json, estimated_total_price, total_discount, final_quoted_price) VALUES
(1, 1, 1, 'Acne Scarring & Skin Texture Protocol', 'pending_approval', '[{"procedure_name": "TCA Cross Peel 30%", "sessions": 3, "unit_price": 6000, "discount": 1000, "total": 17000}, {"procedure_name": "HydraFacial Maintenance", "sessions": 2, "unit_price": 8500, "discount": 2000, "total": 15000}]', 33000.00, 3000.00, 30000.00)
ON CONFLICT (id) DO NOTHING;
