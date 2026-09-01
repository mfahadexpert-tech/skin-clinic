-- ==============================================================================
-- Migration 022: Visual Workflow Automation Builder & Idempotency Schema
-- ==============================================================================
-- 1. Creates automation_rules table (Triggers: appointment_booked, completed, no_show, package_expiry, birthday, low_stock, unpaid).
-- 2. Creates automation_execution_logs table with UNIQUE idempotency_key constraint.
-- ==============================================================================

-- 1. AUTOMATION RULES TABLE
CREATE TABLE IF NOT EXISTS automation_rules (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    clinic_id UUID DEFAULT gen_random_uuid(),
    rule_name VARCHAR(200) NOT NULL,
    trigger_type VARCHAR(100) NOT NULL, -- 'appointment_booked', 'appointment_completed', 'no_show', 'treatment_completed', 'package_near_expiry', 'birthday', 'low_stock', 'outstanding_payment'
    action_type VARCHAR(100) NOT NULL, -- 'send_whatsapp', 'send_email', 'create_notification', 'create_task', 'schedule_followup'
    action_config_json JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. AUTOMATION EXECUTION LOGS TABLE (IDEMPOTENT EXECUTION)
CREATE TABLE IF NOT EXISTS automation_execution_logs (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    clinic_id UUID DEFAULT gen_random_uuid(),
    rule_id INTEGER REFERENCES automation_rules(id) ON DELETE CASCADE,
    idempotency_key VARCHAR(150) UNIQUE NOT NULL,
    trigger_payload JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'success', -- 'success', 'failed', 'retried'
    result_summary TEXT NOT NULL,
    retry_count INTEGER DEFAULT 0,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_automation_trigger ON automation_rules(trigger_type, is_active);
CREATE INDEX IF NOT EXISTS idx_automation_idempotency ON automation_execution_logs(idempotency_key);

-- Seed Sample Automation Rules
INSERT INTO automation_rules (id, rule_name, trigger_type, action_type, is_active) VALUES
(1, 'Post-Treatment 24h WhatsApp Check-In', 'treatment_completed', 'schedule_followup', true),
(2, 'No-Show Recovery Offer Dispatch', 'no_show', 'send_whatsapp', true),
(3, 'Low Stock Consumable Reorder Alert', 'low_stock', 'create_task', true),
(4, 'Birthday Greeting & Discount Voucher', 'birthday', 'send_whatsapp', true)
ON CONFLICT (id) DO NOTHING;
