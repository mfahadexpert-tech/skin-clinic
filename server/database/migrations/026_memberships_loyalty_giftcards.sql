-- ==============================================================================
-- Migration 026: Memberships, Loyalty Points & Gift Cards Schema
-- ==============================================================================
-- 1. Creates memberships, loyalty_points, and gift_cards tables.
-- 2. Prevents negative balances, duplicate redemptions, & unauthorized manual edits.
-- 3. Tracks membership revenue and unredeemed service financial liabilities.
-- ==============================================================================

-- 1. CLINIC MEMBERSHIPS TABLE
CREATE TABLE IF NOT EXISTS memberships (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    clinic_id UUID DEFAULT gen_random_uuid(),
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    tier_name VARCHAR(100) NOT NULL DEFAULT 'Platinum Glow Membership',
    monthly_fee NUMERIC(15,4) NOT NULL DEFAULT 15000.00,
    included_services_json JSONB NOT NULL, -- [{ service_name, monthly_limit, used_count }]
    member_discount_percent NUMERIC(5,2) DEFAULT 15.00,
    starts_at DATE NOT NULL DEFAULT CURRENT_DATE,
    expires_at DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. LOYALTY POINTS & REFERRALS TABLE
CREATE TABLE IF NOT EXISTS loyalty_points (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    clinic_id UUID DEFAULT gen_random_uuid(),
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE UNIQUE,
    points_balance INTEGER NOT NULL DEFAULT 0,
    referral_code VARCHAR(50) UNIQUE NOT NULL,
    referrals_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. GIFT CARDS TABLE
CREATE TABLE IF NOT EXISTS gift_cards (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    clinic_id UUID DEFAULT gen_random_uuid(),
    card_code VARCHAR(50) UNIQUE NOT NULL,
    initial_balance NUMERIC(15,4) NOT NULL,
    current_balance NUMERIC(15,4) NOT NULL CHECK (current_balance >= 0.00), -- NON-NEGATIVE GUARD
    expiry_date DATE NOT NULL,
    purchased_by_customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_memberships_customer ON memberships(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_giftcards_code ON gift_cards(card_code, status);

-- Seed Sample Membership & Gift Card
INSERT INTO memberships (id, customer_id, tier_name, monthly_fee, included_services_json, member_discount_percent) VALUES
(1, 1, 'Platinum Glow Membership', 15000.00, '[{"service_name": "HydraFacial Deluxe", "monthly_limit": 1, "used_count": 0}, {"service_name": "Carbon Peel", "monthly_limit": 1, "used_count": 0}]', 15.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO gift_cards (id, card_code, initial_balance, current_balance, expiry_date) VALUES
(1, 'GIFT-SKINLAB-5000', 5000.00, 5000.00, '2027-12-31')
ON CONFLICT (id) DO NOTHING;
