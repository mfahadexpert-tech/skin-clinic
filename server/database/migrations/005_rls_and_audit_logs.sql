-- ==============================================================================
-- Migration 005: Supabase Row Level Security (RLS) & Clinical Audit Logging
-- ==============================================================================
-- 1. Creates audit_logs table for HIPAA-grade access & mutation tracking.
-- 2. Enables Row Level Security (RLS) on all exposed tables.
-- 3. Restricts data access strictly to active members of the tenant clinic.
-- ==============================================================================

-- 1. CREATE AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    clinic_id UUID,
    user_id UUID,
    user_email VARCHAR(150),
    action VARCHAR(50) NOT NULL, -- 'CREATE', 'READ', 'UPDATE', 'DELETE', 'REDEEM_SESSION', 'AI_QUERY'
    entity VARCHAR(100) NOT NULL, -- 'customer', 'sale', 'appointment', 'product', 'ai_chat'
    entity_id VARCHAR(100),
    ip_address VARCHAR(45),
    before_data JSONB,
    after_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_clinic_action ON audit_logs(clinic_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- 2. HELPER FUNCTION: GET AUTHENTICATED USER'S ACTIVE CLINIC ID
CREATE OR REPLACE FUNCTION get_auth_clinic_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT clinic_id 
        FROM clinic_members 
        WHERE user_id = auth.uid() AND is_active = TRUE 
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ENABLE RLS ON ALL SENSITIVE TABLES
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES FOR TENANT ISOLATION

-- Customers (Patients & Medical Notes) Policy
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_isolation_customers') THEN
        CREATE POLICY tenant_isolation_customers ON customers
        FOR ALL USING (
            clinic_id = get_auth_clinic_id() OR auth.role() = 'service_role'
        );
    END IF;
END $$;

-- Sales (Invoices & Financial Records) Policy
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_isolation_sales') THEN
        CREATE POLICY tenant_isolation_sales ON sales
        FOR ALL USING (
            clinic_id = get_auth_clinic_id() OR auth.role() = 'service_role'
        );
    END IF;
END $$;

-- Appointments Policy
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_isolation_appointments') THEN
        CREATE POLICY tenant_isolation_appointments ON appointments
        FOR ALL USING (
            clinic_id = get_auth_clinic_id() OR auth.role() = 'service_role'
        );
    END IF;
END $$;

-- Products & Procedures Policy
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_isolation_products') THEN
        CREATE POLICY tenant_isolation_products ON products
        FOR ALL USING (
            clinic_id = get_auth_clinic_id() OR auth.role() = 'service_role'
        );
    END IF;
END $$;

-- Audit Logs Policy
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_isolation_audit_logs') THEN
        CREATE POLICY tenant_isolation_audit_logs ON audit_logs
        FOR ALL USING (
            clinic_id = get_auth_clinic_id() OR auth.role() = 'service_role'
        );
    END IF;
END $$;
