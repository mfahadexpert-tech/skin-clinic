-- ==============================================================================
-- Migration 004: Supabase Auth Profiles & Clinic Membership Schema
-- ==============================================================================
-- Creates profiles and clinic_members tables for RBAC security.
-- Roles supported: Owner, Admin, Manager, Doctor, Therapist, Receptionist.
-- ==============================================================================

-- 1. PROFILES TABLE (Linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(50),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. CLINIC MEMBERSHIP & RBAC TABLE
CREATE TABLE IF NOT EXISTS clinic_members (
    id SERIAL PRIMARY KEY,
    clinic_id UUID DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'receptionist', -- 'owner', 'admin', 'manager', 'doctor', 'therapist', 'receptionist'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_member_role CHECK (role IN ('owner', 'admin', 'manager', 'doctor', 'therapist', 'receptionist', 'cashier'))
);

-- Index for RBAC role lookups
CREATE INDEX IF NOT EXISTS idx_clinic_members_user_role ON clinic_members(user_id, role);

-- Seed Initial Super Admin / Owner User Profile
INSERT INTO profiles (id, full_name, email, phone) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Clinic Administrator', 'admin@skinlab.com', '+92 300 1234567')
ON CONFLICT (id) DO NOTHING;

INSERT INTO clinic_members (clinic_id, user_id, role) VALUES
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'owner')
ON CONFLICT DO NOTHING;
