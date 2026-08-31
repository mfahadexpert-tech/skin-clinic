-- ==============================================================================
-- Migration 015: Deterministic Clinical Safety Rules & Audit Engine Schema
-- ==============================================================================
-- 1. Creates safety_rules table for versioned deterministic safety rules.
-- 2. Creates safety_audit_logs table to audit every triggered rule & override reason.
-- ==============================================================================

-- 1. SAFETY RULES TABLE
CREATE TABLE IF NOT EXISTS safety_rules (
    id SERIAL PRIMARY KEY,
    rule_code VARCHAR(100) UNIQUE NOT NULL, -- e.g. 'RULE_ROACCUTANE_6M', 'RULE_PREGNANCY', 'RULE_MIN_INTERVAL'
    rule_name VARCHAR(200) NOT NULL,
    version INTEGER DEFAULT 1,
    rule_type VARCHAR(50) NOT NULL DEFAULT 'blocking', -- 'blocking' or 'warning'
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. SAFETY AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS safety_audit_logs (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    clinic_id UUID DEFAULT gen_random_uuid(),
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES employees(id) ON DELETE RESTRICT,
    rule_code VARCHAR(100) NOT NULL,
    rule_version INTEGER NOT NULL DEFAULT 1,
    rule_type VARCHAR(50) NOT NULL,
    triggered_status VARCHAR(50) NOT NULL, -- 'triggered', 'passed', 'overridden'
    message_text TEXT NOT NULL,
    override_used BOOLEAN DEFAULT FALSE,
    override_reason TEXT,
    authorized_by_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_safety_logs_rule ON safety_audit_logs(rule_code, triggered_status);

-- Seed 10 Deterministic Clinical Safety Rules
INSERT INTO safety_rules (id, rule_code, rule_name, version, rule_type, description) VALUES
(1, 'RULE_ROACCUTANE_6M', 'Isotretinoin 6-Month Wait Rule', 1, 'blocking', 'Blocks deep peels & laser resurfacing if oral Roaccutane used in past 6 months'),
(2, 'RULE_PREGNANCY', 'Pregnancy & Lactation Contraindication', 1, 'blocking', 'Blocks laser, Botox, dermal fillers & peels during pregnancy'),
(3, 'RULE_ALLERGY_CHECK', 'Allergy & Sensitivity Verification', 1, 'blocking', 'Blocks procedures if patient allergy snapshot flags acid or anesthetic sensitivity'),
(4, 'RULE_MIN_INTERVAL', 'Minimum Treatment Interval Check', 1, 'blocking', 'Enforces minimum 14-28 day interval between laser or microneedling sessions'),
(5, 'RULE_PATCH_TEST', 'Fitzpatrick IV-VI Patch Test Verification', 1, 'blocking', 'Requires verified patch test prior to high-fluence laser on darker skin tones'),
(6, 'RULE_CONSENT_EXPIRED', 'Mandatory Medical Consent Check', 1, 'blocking', 'Blocks treatment if consent form is missing or expired'),
(7, 'RULE_MISSING_PHOTO', 'Baseline Photography Check', 1, 'warning', 'Warns if baseline clinical photographs are missing before Session 1'),
(8, 'RULE_SESSION_LIMIT', 'Daily Procedure Limit', 1, 'warning', 'Warns if patient is scheduled for more than 3 major procedures in a single day'),
(9, 'RULE_PRACTITIONER_SKILL', 'Practitioner Authorization Check', 1, 'blocking', 'Verifies doctor/laser technician qualification for procedure'),
(10, 'RULE_MEDICATION_INTERACTION', 'Blood Thinner Interaction Warning', 1, 'warning', 'Warns if patient takes oral anticoagulant or NSAID prior to injectables')
ON CONFLICT (id) DO NOTHING;
