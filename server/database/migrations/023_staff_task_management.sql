-- ==============================================================================
-- Migration 023: Staff Task Management & Automated Clinical Triggers Schema
-- ==============================================================================
-- 1. Creates staff_tasks table (supports role assignment, patient & appointment linking,
--    priority levels, due dates, checklists, comments & automated trigger sources).
-- ==============================================================================

CREATE TABLE IF NOT EXISTS staff_tasks (
    id SERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() UNIQUE,
    clinic_id UUID DEFAULT gen_random_uuid(),
    title VARCHAR(250) NOT NULL,
    description TEXT,
    assigned_role VARCHAR(50) NOT NULL DEFAULT 'receptionist', -- 'receptionist', 'doctor', 'manager'
    assigned_staff_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    due_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
    checklist_json JSONB, -- [{ item, done }]
    comments_json JSONB, -- [{ staff_name, comment_text, timestamp }]
    trigger_source VARCHAR(100) DEFAULT 'manual', -- 'adverse_event', 'abnormal_lab', 'unread_message', 'failed_comm', 'overdue_payment', 'manual'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_staff_tasks_assigned ON staff_tasks(assigned_role, status, priority);
CREATE INDEX IF NOT EXISTS idx_staff_tasks_customer ON staff_tasks(customer_id);

-- Seed Sample Staff Tasks
INSERT INTO staff_tasks (id, title, assigned_role, customer_id, priority, trigger_source, description, status) VALUES
(1, 'URGENT: Review Abnormal Free Testosterone Result', 'doctor', 1, 'urgent', 'abnormal_lab', 'Elevated Free Testosterone (4.2 ng/dL). Schedule PCOS endocrinology consult.', 'pending'),
(2, 'Follow-Up: 24h Post TCA Peel Redness Check', 'doctor', 1, 'high', 'adverse_event', 'Check erythema resolution on cheek zone.', 'in_progress'),
(3, 'Collect Outstanding Payment Balance PKR 1,200', 'receptionist', 1, 'medium', 'overdue_payment', 'Unpaid deposit balance from Session 2 booking.', 'pending')
ON CONFLICT (id) DO NOTHING;
