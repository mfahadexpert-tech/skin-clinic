-- ==============================================================================
-- Migration 006: Resource-Aware Scheduling Schema
-- ==============================================================================
-- 1. Creates rooms, equipment, and appointment_resources tables.
-- 2. Adds resource requirements (cleanup buffer, room type, machine) to products.
-- 3. Seeds initial clinical rooms & aesthetic devices.
-- ==============================================================================

-- 1. ROOMS TABLE
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    clinic_id UUID DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL, -- e.g. 'Laser Suite 1', 'HydraFacial Suite 2', 'Consultation Room 3'
    room_type VARCHAR(50) NOT NULL, -- 'laser', 'facial', 'injectable', 'consultation'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. EQUIPMENT & MACHINES TABLE
CREATE TABLE IF NOT EXISTS equipment (
    id SERIAL PRIMARY KEY,
    clinic_id UUID DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL, -- e.g. 'Diode Laser 808nm', 'HydraFacial Machine', 'Q-Switched Nd:YAG'
    equipment_type VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. APPOINTMENT RESOURCES RELATIONAL MAPPING
CREATE TABLE IF NOT EXISTS appointment_resources (
    id SERIAL PRIMARY KEY,
    clinic_id UUID DEFAULT gen_random_uuid(),
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
    room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
    equipment_id INTEGER REFERENCES equipment(id) ON DELETE SET NULL,
    cleanup_buffer_minutes INTEGER DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add Resource Requirements to Products / Services Master
ALTER TABLE products ADD COLUMN IF NOT EXISTS cleanup_buffer_minutes INTEGER DEFAULT 15;
ALTER TABLE products ADD COLUMN IF NOT EXISTS required_skill VARCHAR(100) DEFAULT 'Aesthetic Specialist';
ALTER TABLE products ADD COLUMN IF NOT EXISTS required_room_type VARCHAR(50) DEFAULT 'facial';
ALTER TABLE products ADD COLUMN IF NOT EXISTS required_equipment VARCHAR(100);

-- Seed Initial Treatment Rooms
INSERT INTO rooms (id, name, room_type) VALUES
(1, 'Laser Treatment Suite 1', 'laser'),
(2, 'HydraFacial Suite 2', 'facial'),
(3, 'Injectables & Dermatology Room 3', 'injectable'),
(4, 'Consultation Suite 4', 'consultation')
ON CONFLICT (id) DO NOTHING;

-- Seed Initial Aesthetic Machines
INSERT INTO equipment (id, name, equipment_type) VALUES
(1, 'Alma Soprano Diode 808nm Laser', 'laser'),
(2, 'Spectra Q-Switched Nd:YAG Laser', 'laser'),
(3, 'HydraFacial MD Tower', 'facial'),
(4, 'RegenLab PRP Centrifuge 3200 RPM', 'injectable')
ON CONFLICT (id) DO NOTHING;
