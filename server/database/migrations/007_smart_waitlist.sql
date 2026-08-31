-- ==============================================================================
-- Migration 007: Smart Appointment Waitlist & Cancellation Recovery Schema
-- ==============================================================================
-- 1. Creates waitlist_requests table.
-- 2. Creates waitlist_offers table with 15-minute offer expiry timer.
-- 3. Stores offer history and responses in Supabase.
-- ==============================================================================

-- 1. WAITLIST REQUESTS TABLE
CREATE TABLE IF NOT EXISTS waitlist_requests (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    clinic_id UUID DEFAULT gen_random_uuid(),
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    preferred_doctor_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    preferred_treatment VARCHAR(200) NOT NULL,
    preferred_days VARCHAR(100) DEFAULT 'Any Day',
    preferred_time_range VARCHAR(50) DEFAULT 'Morning (09:00 - 12:00)',
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'offered', 'booked', 'expired', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. WAITLIST OFFERS & CANCELLATION RECOVERY TABLE
CREATE TABLE IF NOT EXISTS waitlist_offers (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    clinic_id UUID DEFAULT gen_random_uuid(),
    waitlist_id INTEGER REFERENCES waitlist_requests(id) ON DELETE CASCADE,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
    offered_slot_time TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- 15-minute countdown timer
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'expired'
    response_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist_requests(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_offers_expires ON waitlist_offers(expires_at, status);

-- Seed Sample Waitlist Request
INSERT INTO waitlist_requests (id, customer_id, customer_name, customer_phone, preferred_treatment, preferred_days, preferred_time_range) VALUES
(1, 1, 'Ayesha Khan', '0300-1234567', 'HydraFacial Deluxe', 'Mon, Wed, Fri', 'Morning (09:00 - 12:00)'),
(2, 2, 'Sana Mir', '0300-9988776', 'Full Body Laser Hair Reduction', 'Sat, Sun', 'Afternoon (12:00 - 16:00)')
ON CONFLICT (id) DO NOTHING;
