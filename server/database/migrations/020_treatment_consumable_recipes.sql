-- ==============================================================================
-- Migration 020: Treatment Consumable Recipes & Profitability Schema
-- ==============================================================================
-- 1. Creates treatment_recipes table (links services to standard consumable ingredients).
-- 2. Creates treatment_consumable_logs table (audits automated deductions & manual variance adjustments).
-- 3. Enables net profit & machine ROI calculation considering exact consumable costs.
-- ==============================================================================

-- 1. TREATMENT RECIPES TABLE
CREATE TABLE IF NOT EXISTS treatment_recipes (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    clinic_id UUID DEFAULT gen_random_uuid(),
    treatment_product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    consumable_product_id INTEGER REFERENCES products(id) ON DELETE RESTRICT,
    standard_quantity NUMERIC(10,2) NOT NULL DEFAULT 1.00,
    unit_cost_pkr NUMERIC(15,4) NOT NULL DEFAULT 150.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TREATMENT CONSUMABLE LOGS TABLE
CREATE TABLE IF NOT EXISTS treatment_consumable_logs (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    clinic_id UUID DEFAULT gen_random_uuid(),
    sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
    treatment_product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    consumable_product_id INTEGER REFERENCES products(id) ON DELETE RESTRICT,
    standard_qty NUMERIC(10,2) NOT NULL,
    actual_qty NUMERIC(10,2) NOT NULL,
    variance_reason TEXT,
    total_consumable_cost NUMERIC(15,4) NOT NULL,
    adjusted_by_doctor_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recipes_treatment ON treatment_recipes(treatment_product_id);
CREATE INDEX IF NOT EXISTS idx_consumable_logs_sale ON treatment_consumable_logs(sale_id);

-- Seed Sample Recipe (e.g. HydraFacial Deluxe requires Cartridge + Serum + Gloves)
INSERT INTO treatment_recipes (id, treatment_product_id, consumable_product_id, standard_quantity, unit_cost_pkr) VALUES
(1, 1, 3, 1.00, 450.00), -- HydraFacial Tip
(2, 1, 4, 1.00, 300.00)  -- GlySal Serum 10ml
ON CONFLICT (id) DO NOTHING;
