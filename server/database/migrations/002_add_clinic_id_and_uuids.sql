-- ==============================================================================
-- Migration 002: Add Multi-Tenant clinic_id, UUID Identifiers, Indexes & Triggers
-- ==============================================================================
-- Safely upgrades all 14 tables without data loss.
-- 1. Enables uuid-ossp extension.
-- 2. Adds clinic_id UUID column for multi-clinic tenant isolation.
-- 3. Adds guid UUID column for external API safety.
-- 4. Creates performance indexes on frequent query columns.
-- 5. Attaches auto-update trigger for updated_at timestamps.
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Default Clinic Tenant UUID Constant
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'clinic_tenant_enum') THEN
        -- Add clinic_id columns safely
        ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS clinic_id UUID DEFAULT gen_random_uuid();
        ALTER TABLE departments ADD COLUMN IF NOT EXISTS clinic_id UUID DEFAULT gen_random_uuid();
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS clinic_id UUID DEFAULT gen_random_uuid();
        ALTER TABLE users ADD COLUMN IF NOT EXISTS clinic_id UUID DEFAULT gen_random_uuid();
        ALTER TABLE categories ADD COLUMN IF NOT EXISTS clinic_id UUID DEFAULT gen_random_uuid();
        ALTER TABLE products ADD COLUMN IF NOT EXISTS clinic_id UUID DEFAULT gen_random_uuid();
        ALTER TABLE deals ADD COLUMN IF NOT EXISTS clinic_id UUID DEFAULT gen_random_uuid();
        ALTER TABLE deal_items ADD COLUMN IF NOT EXISTS clinic_id UUID DEFAULT gen_random_uuid();
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS clinic_id UUID DEFAULT gen_random_uuid();
        ALTER TABLE sales ADD COLUMN IF NOT EXISTS clinic_id UUID DEFAULT gen_random_uuid();
        ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS clinic_id UUID DEFAULT gen_random_uuid();
        ALTER TABLE appointments ADD COLUMN IF NOT EXISTS clinic_id UUID DEFAULT gen_random_uuid();
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS clinic_id UUID DEFAULT gen_random_uuid();
        ALTER TABLE purchases ADD COLUMN IF NOT EXISTS clinic_id UUID DEFAULT gen_random_uuid();
    END IF;
END $$;

-- Add Secondary GUID UUID Identifiers for API Contracts
ALTER TABLE customers ADD COLUMN IF NOT EXISTS guid UUID DEFAULT gen_random_uuid() UNIQUE;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS guid UUID DEFAULT gen_random_uuid() UNIQUE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS guid UUID DEFAULT gen_random_uuid() UNIQUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS guid UUID DEFAULT gen_random_uuid() UNIQUE;

-- Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_customers_mrn ON customers(mrn);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_number ON sales(invoice_number);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
CREATE INDEX IF NOT EXISTS idx_appointments_time ON appointments(appointment_time);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- Auto-Updated Trigger Function
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Attach Triggers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_company_settings_timestamp') THEN
        CREATE TRIGGER trg_update_company_settings_timestamp
        BEFORE UPDATE ON company_settings
        FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
    END IF;
END $$;
