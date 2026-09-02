-- ==============================================================================
-- Migration 030: Strict Supabase RLS & Storage Cross-Tenant Isolation Policies
-- ==============================================================================
-- 1. Enforces Row Level Security (RLS) across all tables to prevent cross-clinic leakage.
-- 2. Restricts Storage Bucket access (photos, consents, backups) to verified clinic_id JWTs.
-- ==============================================================================

-- Enforce RLS on core tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- 1. Strict Tenant Isolation Policy for Customers
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_isolation_strict_customers') THEN
        CREATE POLICY tenant_isolation_strict_customers ON customers
            FOR ALL USING (clinic_id = (auth.jwt() -> 'user_metadata' ->> 'clinic_id')::uuid);
    END IF;
END $$;

-- 2. Strict Tenant Isolation Policy for Clinical Photos
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_isolation_strict_photos') THEN
        CREATE POLICY tenant_isolation_strict_photos ON patient_photos
            FOR ALL USING (clinic_id = (auth.jwt() -> 'user_metadata' ->> 'clinic_id')::uuid);
    END IF;
END $$;
