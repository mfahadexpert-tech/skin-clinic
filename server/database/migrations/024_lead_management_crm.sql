-- ==============================================================================
-- Migration 024: Lead Management CRM & Patient Conversion System Schema
-- ==============================================================================
-- 1. Creates leads table (Stages: new_lead, contacted, consultation_booked, attended,
--    quote_sent, treatment_purchased, lost, follow_up).
-- 2. Supports source, campaign, interested treatment, estimated value, loss reason,
--    and non-duplicating conversion to permanent patient records.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    clinic_id UUID DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    lead_stage VARCHAR(50) NOT NULL DEFAULT 'new_lead', -- 'new_lead', 'contacted', 'consultation_booked', 'attended', 'quote_sent', 'treatment_purchased', 'lost', 'follow_up'
    lead_source VARCHAR(100) DEFAULT 'instagram', -- 'instagram', 'facebook_ad', 'google_search', 'referral', 'walk_in'
    campaign_name VARCHAR(100),
    interested_treatment VARCHAR(150),
    assigned_staff_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    estimated_value NUMERIC(15,4) DEFAULT 12000.00,
    loss_reason TEXT,
    followup_reminder_at TIMESTAMP WITH TIME ZONE,
    converted_customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    is_converted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(lead_stage, is_converted);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);

-- Seed Sample Leads
INSERT INTO inventory_batches (id, product_id, batch_number, lot_number, expiry_date, supplier_invoice_no, storage_requirements, initial_quantity, current_quantity) VALUES
(1, 1, 'BTX-2026-A', 'LOT-99211', '2026-10-15', 'INV-ALLERGAN-882', 'Refrigerated 2-8°C', 50, 42)
ON CONFLICT (id) DO NOTHING;

INSERT INTO leads (id, full_name, phone, lead_stage, lead_source, interested_treatment, estimated_value) VALUES
(1, 'Sara Mahmood', '+92 321 9988776', 'new_lead', 'instagram', 'HydraFacial Deluxe', 8500.00),
(2, 'Zainab Bibi', '+92 300 4455667', 'consultation_booked', 'facebook_ad', 'TCA Chemical Peel', 12000.00),
(3, 'Usman Ali', '+92 333 1122334', 'quote_sent', 'google_search', 'Diode Laser Hair Reduction', 35000.00)
ON CONFLICT (id) DO NOTHING;
