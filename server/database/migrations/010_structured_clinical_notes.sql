-- ==============================================================================
-- Migration 010: Structured Clinical Note Templates & Revision History Schema
-- ==============================================================================
-- 1. Creates clinical_note_templates table.
-- 2. Creates clinical_notes table with drafts & doctor approvals.
-- 3. Creates clinical_note_revisions table for complete audit trail.
-- 4. Seeds templates for 8 procedure types.
-- ==============================================================================

-- 1. CLINICAL NOTE TEMPLATES
CREATE TABLE IF NOT EXISTS clinical_note_templates (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    clinic_id UUID DEFAULT gen_random_uuid(),
    procedure_type VARCHAR(100) NOT NULL UNIQUE, -- 'laser_hair_reduction', 'chemical_peel', 'hydrafacial', 'botox', 'dermal_filler', 'prp', 'microneedling', 'iv_therapy'
    template_name VARCHAR(200) NOT NULL,
    parameters_schema JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. CLINICAL NOTES TABLE
CREATE TABLE IF NOT EXISTS clinical_notes (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    clinic_id UUID DEFAULT gen_random_uuid(),
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES employees(id) ON DELETE RESTRICT,
    sale_id INTEGER REFERENCES sales(id) ON DELETE SET NULL,
    procedure_type VARCHAR(100) NOT NULL,
    parameters_json JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'approved', 'amended'
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by_doctor_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. REVISION HISTORY TABLE FOR AMENDMENTS
CREATE TABLE IF NOT EXISTS clinical_note_revisions (
    id SERIAL PRIMARY KEY,
    note_id INTEGER REFERENCES clinical_notes(id) ON DELETE CASCADE,
    revision_number INTEGER NOT NULL DEFAULT 1,
    modified_by_user_id UUID,
    parameters_snapshot JSONB NOT NULL,
    amendment_reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clinical_notes_customer ON clinical_notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_doctor ON clinical_notes(doctor_id);

-- Seed 8 Structured Clinical Templates
INSERT INTO clinical_note_templates (id, procedure_type, template_name, parameters_schema) VALUES
(1, 'laser_hair_reduction', 'Laser Hair Reduction Template', '{"fields": ["fluence_j_cm2", "wavelength_nm", "pulse_duration_ms", "spot_size_mm", "treated_areas", "skin_reaction", "aftercare_advised"]}'),
(2, 'chemical_peel', 'Chemical Peel Clinical Template', '{"fields": ["peel_type", "concentration_percent", "neutralization_time_min", "erythema_grade", "spf_mandate"]}'),
(3, 'hydrafacial', 'HydraFacial Deluxe Template', '{"fields": ["vortex_tip", "glysal_percent", "serum_infusion", "suction_level", "booster"]}'),
(4, 'botox', 'Botox Injectable Template', '{"fields": ["units_administered", "reconstitution_saline_ml", "batch_lot_number", "injection_sites", "aspiration_verified"]}'),
(5, 'dermal_filler', 'Dermal Filler Template', '{"fields": ["volume_ml", "filler_brand", "batch_lot_number", "injection_depth", "vascular_check"]}'),
(6, 'prp', 'PRP Vampire Facial Template', '{"fields": ["blood_drawn_ml", "centrifuge_rpm", "centrifuge_time_min", "plasma_yield_ml"]}'),
(7, 'microneedling', 'Microneedling DermaPen Template', '{"fields": ["needle_depth_mm", "pass_count", "active_serum", "erythema_score"]}'),
(8, 'iv_therapy', 'Glutathione IV Therapy Template', '{"fields": ["glutathione_dose_mg", "vitamin_c_dose_mg", "saline_volume_ml", "drip_rate_drops_min"]}')
ON CONFLICT (id) DO NOTHING;
