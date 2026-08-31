-- ==============================================================================
-- Migration 012: Standardized Clinical Photography Vault & Private Storage
-- ==============================================================================
-- 1. Creates patient_photos table for categorized clinical photography.
-- 2. Supports pose categories: Front, Left 45°, Right 45°, Close-up Detail.
-- 3. Supports privacy consent flags, EXIF metadata stripping, and signed URLs.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS patient_photos (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    clinic_id UUID DEFAULT gen_random_uuid(),
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    photo_category VARCHAR(50) NOT NULL DEFAULT 'front', -- 'front', 'left_45', 'right_45', 'close_up'
    session_label VARCHAR(100) NOT NULL DEFAULT 'Baseline Pre-Treatment',
    storage_path TEXT NOT NULL,
    signed_url TEXT,
    photography_consent BOOLEAN DEFAULT TRUE,
    marketing_consent BOOLEAN DEFAULT FALSE,
    metadata_stripped BOOLEAN DEFAULT TRUE,
    captured_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patient_photos_customer ON patient_photos(customer_id, photo_category);

-- Seed Initial Photography Sample Records
INSERT INTO patient_photos (id, customer_id, photo_category, session_label, storage_path, photography_consent, marketing_consent) VALUES
(1, 1, 'front', 'Session 1 Baseline (Pre-HydraFacial)', 'photos/customer_1_front_baseline.jpg', true, false),
(2, 1, 'front', 'Session 3 Progress (Post-HydraFacial)', 'photos/customer_1_front_s3.jpg', true, true),
(3, 1, 'left_45', 'Session 1 Baseline Left 45°', 'photos/customer_1_left_baseline.jpg', true, false)
ON CONFLICT (id) DO NOTHING;
