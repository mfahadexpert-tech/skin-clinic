-- ==============================================================================
-- Migration 008: Configurable Appointment Deposits & No-Show Policies
-- ==============================================================================
-- 1. Creates clinic_policies table for cancellation windows & no-show rules.
-- 2. Adds deposit requirement columns to products table.
-- 3. Adds deposit payment audit columns to appointments table.
-- ==============================================================================

-- 1. CLINIC POLICIES TABLE
CREATE TABLE IF NOT EXISTS clinic_policies (
    id SERIAL PRIMARY KEY,
    clinic_id UUID DEFAULT gen_random_uuid(),
    cancellation_window_hours INTEGER DEFAULT 24,
    late_cancellation_fee_percentage NUMERIC(5,2) DEFAULT 50.00,
    no_show_fee_percentage NUMERIC(5,2) DEFAULT 100.00,
    policy_terms_text TEXT DEFAULT 'Cancellations must be made at least 24 hours prior to appointment time. Late cancellations incur a 50% fee. No-shows forfeit full deposit.',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. ADD DEPOSIT CONFIG TO PRODUCTS / SERVICES MASTER
ALTER TABLE products ADD COLUMN IF NOT EXISTS required_deposit_type VARCHAR(50) DEFAULT 'percentage'; -- 'percentage' or 'fixed'
ALTER TABLE products ADD COLUMN IF NOT EXISTS required_deposit_value NUMERIC(15,4) DEFAULT 20.00;

-- 3. ADD DEPOSIT AUDIT TO APPOINTMENTS TABLE
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS deposit_required NUMERIC(15,4) DEFAULT 0.00;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS deposit_paid NUMERIC(15,4) DEFAULT 0.00;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS deposit_status VARCHAR(50) DEFAULT 'pending'; -- 'pending', 'paid', 'waived', 'forfeited'
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS policy_accepted_at TIMESTAMP WITH TIME ZONE;

-- Seed Default Policy
INSERT INTO clinic_policies (id, cancellation_window_hours, late_cancellation_fee_percentage, no_show_fee_percentage) VALUES
(1, 24, 50.00, 100.00)
ON CONFLICT (id) DO NOTHING;
