-- ==============================================================================
-- Migration 027: Multi-Location Clinic Branches & Inter-Branch Stock Transfers
-- ==============================================================================
-- 1. Creates branches table with location-specific tax settings & receipt branding.
-- 2. Creates branch_transfers table with complete transfer audit trail.
-- ==============================================================================

-- 1. BRANCHES TABLE
CREATE TABLE IF NOT EXISTS branches (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    clinic_id UUID DEFAULT gen_random_uuid(),
    branch_name VARCHAR(150) NOT NULL, -- e.g. 'Lahore Main Gulberg', 'Islamabad F-7 Branch', 'Karachi DHA Branch'
    address TEXT NOT NULL,
    phone VARCHAR(50),
    tax_registration_no VARCHAR(50) DEFAULT 'NTN-9988112-0',
    receipt_branding_logo TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. BRANCH STOCK TRANSFERS TABLE
CREATE TABLE IF NOT EXISTS branch_transfers (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    clinic_id UUID DEFAULT gen_random_uuid(),
    from_branch_id INTEGER REFERENCES branches(id) ON DELETE RESTRICT,
    to_branch_id INTEGER REFERENCES branches(id) ON DELETE RESTRICT,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    batch_id INTEGER REFERENCES inventory_batches(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'completed',
    transfer_notes TEXT,
    transferred_by_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_branch_transfers ON branch_transfers(from_branch_id, to_branch_id);

-- Seed Sample Clinic Branches
INSERT INTO branches (id, branch_name, address, phone) VALUES
(1, 'Lahore Main Gulberg Flagship', 'Plot 12-C, MM Alam Road, Gulberg III, Lahore', '+92 42 35789000'),
(2, 'Islamabad F-7 Aesthetic Centre', 'Block 4-B, Jinnah Super, F-7 Markaz, Islamabad', '+92 51 2654321'),
(3, 'Karachi DHA Suite', 'Street 10, Badar Commercial, DHA Phase V, Karachi', '+92 21 35891122')
ON CONFLICT (id) DO NOTHING;
