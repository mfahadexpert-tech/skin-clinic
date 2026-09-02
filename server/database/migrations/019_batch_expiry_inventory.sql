-- ==============================================================================
-- Migration 019: Batch, Expiry, FEFO Inventory & Clinical Traceability Schema
-- ==============================================================================
-- 1. Creates inventory_batches table (Lot #, Batch #, Expiry, Storage Temp).
-- 2. Creates stock_movements table for wastage, branch transfers, & patient usage.
-- 3. Enables clinical traceability linking batch numbers to patient treatments.
-- ==============================================================================

-- 1. INVENTORY BATCHES TABLE
CREATE TABLE IF NOT EXISTS inventory_batches (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    clinic_id UUID DEFAULT gen_random_uuid(),
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    batch_number VARCHAR(100) NOT NULL,
    lot_number VARCHAR(100),
    expiry_date DATE NOT NULL,
    supplier_invoice_no VARCHAR(100),
    storage_requirements VARCHAR(150) DEFAULT 'Refrigerated 2-8°C', -- 'Refrigerated 2-8°C', 'Room Temp < 25°C', 'Frozen'
    initial_quantity INTEGER NOT NULL,
    current_quantity INTEGER NOT NULL,
    is_recalled BOOLEAN DEFAULT FALSE,
    recall_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. STOCK MOVEMENTS TABLE
CREATE TABLE IF NOT EXISTS stock_movements (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    clinic_id UUID DEFAULT gen_random_uuid(),
    batch_id INTEGER REFERENCES inventory_batches(id) ON DELETE CASCADE,
    movement_type VARCHAR(50) NOT NULL, -- 'purchase', 'treatment_usage', 'wastage', 'branch_transfer'
    quantity INTEGER NOT NULL,
    patient_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    transfer_target_branch VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_batches_fefo ON inventory_batches(product_id, expiry_date, current_quantity);
CREATE INDEX IF NOT EXISTS idx_movements_batch ON stock_movements(batch_id);

-- Seed Sample Injectable & Consumable Batches
INSERT INTO inventory_batches (id, product_id, batch_number, lot_number, expiry_date, supplier_invoice_no, storage_requirements, initial_quantity, current_quantity) VALUES
(1, 1, 'BTX-2026-A', 'LOT-99211', '2026-10-15', 'INV-ALLERGAN-882', 'Refrigerated 2-8°C', 50, 42),
(2, 1, 'BTX-2026-B', 'LOT-99212', '2027-02-28', 'INV-ALLERGAN-882', 'Refrigerated 2-8°C', 100, 100),
(3, 2, 'FIL-JUV-104', 'LOT-77341', '2026-09-30', 'INV-JUVEDERM-401', 'Room Temp < 25°C', 20, 14)
ON CONFLICT (id) DO NOTHING;
