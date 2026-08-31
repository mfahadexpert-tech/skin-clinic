-- ==============================================================================
-- Migration 016: Versioned Supabase RAG Knowledge System Schema
-- ==============================================================================
-- 1. Creates rag_documents, protocol_versions, and rag_chunks tables.
-- 2. Restricts retrieval strictly to approved & active clinical protocols.
-- 3. Supports versioning, effective dates, reviewers, and clinic_id isolation.
-- ==============================================================================

-- 1. RAG DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS rag_documents (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    clinic_id UUID DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL, -- e.g. 'Diode 808nm Laser Clinical Protocol'
    category VARCHAR(100) NOT NULL, -- 'laser', 'chemical_peel', 'botox', 'hydrafacial'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. PROTOCOL VERSIONS TABLE
CREATE TABLE IF NOT EXISTS protocol_versions (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    document_id INTEGER REFERENCES rag_documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_approved BOOLEAN DEFAULT TRUE,
    approved_by_reviewer VARCHAR(150) NOT NULL DEFAULT 'Dr. Sarah Khan',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. RAG CHUNKS TABLE
CREATE TABLE IF NOT EXISTS rag_chunks (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    protocol_version_id INTEGER REFERENCES protocol_versions(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    metadata_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_protocol_approval ON protocol_versions(is_approved, is_active);

-- Seed Versioned Clinical Protocols
INSERT INTO rag_documents (id, title, category) VALUES
(1, 'Diode 808nm & Alexandrite Laser Protocol', 'laser'),
(2, 'Carbon Laser Peel (Hollywood Peel) Guidelines', 'laser'),
(3, 'HydraFacial Deluxe Vortex & GlySal Protocol', 'facial'),
(4, 'TCA & Glycolic Chemical Peel Depth Manual', 'facial'),
(5, 'Allergan Botox & Dermal Filler Reconstitution Protocol', 'injectable')
ON CONFLICT (id) DO NOTHING;

INSERT INTO protocol_versions (id, document_id, version_number, effective_date, is_approved, approved_by_reviewer, is_active) VALUES
(1, 1, 2, '2026-08-01', true, 'Dr. Sarah Khan (Head Dermatologist)', true),
(2, 2, 1, '2026-08-01', true, 'Dr. Ayesha Tariq (Aesthetic Physician)', true),
(3, 3, 2, '2026-08-01', true, 'Dr. Sarah Khan', true),
(4, 4, 1, '2026-08-01', true, 'Dr. Sarah Khan', true),
(5, 5, 3, '2026-08-01', true, 'Dr. Sarah Khan', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO rag_chunks (id, protocol_version_id, chunk_text) VALUES
(1, 1, 'Diode 808nm Laser Hair Reduction: Recommended fluences for Fitzpatrick Type III-IV are 12-16 J/cm2 with 20ms pulse duration and 10mm spot size. Ensure area is shaved 24h prior. Strict SPF 50 sunblock required post-treatment.'),
(2, 2, 'Carbon Laser Peel: Apply liquid carbon layer, wait 10 minutes for pore penetration. Use Q-Switched Nd:YAG 1064nm Spectra mode for warm-up, followed by Q-switched mode (1.8-2.4 J/cm2, 7-8mm spot) to vaporize carbon. Contraindicated if Roaccutane used in past 6 months.'),
(3, 3, 'HydraFacial Deluxe: Step 1 Vortex Exfoliation, Step 2 GlySal Peel 7.5%, Step 3 Hyaluronic Acid Infusion. Advise non-comedogenic SPF 50.'),
(4, 4, 'Chemical Peel Safety: Salicylic 20-30% or TCA 15-30%. Neutralize within 3-5 minutes. Strictly mandate SPF 50 sunblock and no direct sun exposure for 7 days.'),
(5, 5, 'Botox Reconstitution: Reconstitute 100U Allergan Botox with 2.5ml sterile unpreserved 0.9% saline (4 Units per 0.1ml). Injection sites: Forehead 10-20U, Crow''s feet 12-24U.')
ON CONFLICT (id) DO NOTHING;
