-- ==============================================================================
-- Migration 029: MFA Support, Session Revocation & Login History Audit Schema
-- ==============================================================================
-- 1. Creates user_mfa table for TOTP Multi-Factor Authentication.
-- 2. Creates login_history table for auditing IP addresses, user agents, & timestamps.
-- 3. Creates revoked_sessions table for immediate JWT session invalidation.
-- ==============================================================================

-- 1. USER MFA TABLE
CREATE TABLE IF NOT EXISTS user_mfa (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    user_id UUID NOT NULL UNIQUE,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret_encrypted TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. LOGIN HISTORY TABLE
CREATE TABLE IF NOT EXISTS login_history (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    clinic_id UUID DEFAULT gen_random_uuid(),
    user_id UUID,
    email VARCHAR(150) NOT NULL,
    ip_address VARCHAR(50) NOT NULL,
    user_agent TEXT,
    login_status VARCHAR(50) NOT NULL, -- 'success', 'failed_password', 'failed_mfa'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. REVOKED SESSIONS TABLE
CREATE TABLE IF NOT EXISTS revoked_sessions (
    id SERIAL PRIMARY KEY,
    jti VARCHAR(150) NOT NULL UNIQUE,
    user_id UUID NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_revoked_jti ON revoked_sessions(jti);
