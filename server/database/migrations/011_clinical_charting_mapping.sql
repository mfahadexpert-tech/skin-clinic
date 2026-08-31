-- ==============================================================================
-- Migration 011: Interactive Face & Body Anatomy Charting Schema
-- ==============================================================================
-- 1. Creates clinical_charts table for storing anatomical mapping markers as JSON.
-- 2. Supports injection points, Botox units, filler volumes, pigmentation, acne, scars & laser zones.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clinical_charts (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    clinic_id UUID DEFAULT gen_random_uuid(),
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    chart_type VARCHAR(50) NOT NULL DEFAULT 'face', -- 'face', 'body', 'scalp'
    markers_json JSONB NOT NULL, -- Array of [{ x, y, marker_type, units, notes, area_label }]
    summary_notes TEXT,
    created_by_doctor_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clinical_charts_customer ON clinical_charts(customer_id);

-- Seed Sample Face Chart Record
INSERT INTO clinical_charts (id, customer_id, chart_type, markers_json, summary_notes) VALUES
(1, 1, 'face', '[{"x": 150, "y": 120, "marker_type": "botox", "units": 10, "area_label": "Forehead Lines"}, {"x": 220, "y": 250, "marker_type": "laser", "units": 0, "area_label": "Cheek Carbon Peel"}]', 'Standard Botox 10 Units forehead & Carbon Peel cheek zone.')
ON CONFLICT (id) DO NOTHING;
