-- ==============================================================================
-- Migration 028: Staff Performance, Procedure Commissions & Payroll Approval
-- ==============================================================================
-- 1. Creates staff_timesheets table for attendance tracking.
-- 2. Creates procedure_commissions table for paid treatment commissions & refund adjustments.
-- 3. Creates payroll_runs table for manager review & approval.
-- ==============================================================================

-- 1. STAFF TIMESHEETS TABLE
CREATE TABLE IF NOT EXISTS staff_timesheets (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    clinic_id UUID DEFAULT gen_random_uuid(),
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    clock_in TIMESTAMP WITH TIME ZONE NOT NULL,
    clock_out TIMESTAMP WITH TIME ZONE,
    total_hours NUMERIC(5,2) DEFAULT 8.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. PROCEDURE COMMISSIONS TABLE
CREATE TABLE IF NOT EXISTS procedure_commissions (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    clinic_id UUID DEFAULT gen_random_uuid(),
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
    treatment_name VARCHAR(200) NOT NULL,
    treatment_amount NUMERIC(15,4) NOT NULL,
    commission_percent NUMERIC(5,2) NOT NULL DEFAULT 10.00,
    commission_pkr NUMERIC(15,4) NOT NULL,
    is_refund_adjusted BOOLEAN DEFAULT FALSE,
    refund_deduction_pkr NUMERIC(15,4) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'pending_approval', -- 'pending_approval', 'approved', 'paid'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. PAYROLL RUNS TABLE
CREATE TABLE IF NOT EXISTS payroll_runs (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    clinic_id UUID DEFAULT gen_random_uuid(),
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    base_salary NUMERIC(15,4) NOT NULL,
    total_commissions NUMERIC(15,4) NOT NULL DEFAULT 0.00,
    refund_adjustments NUMERIC(15,4) NOT NULL DEFAULT 0.00,
    net_payroll_pkr NUMERIC(15,4) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'approved',
    approved_by_manager_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_commissions_staff ON procedure_commissions(employee_id, status);

-- Seed Sample Commission & Payroll
INSERT INTO procedure_commissions (id, employee_id, sale_id, treatment_name, treatment_amount, commission_percent, commission_pkr, status) VALUES
(1, 1, 1, 'HydraFacial Deluxe', 8500.00, 10.00, 850.00, 'pending_approval')
ON CONFLICT (id) DO NOTHING;
