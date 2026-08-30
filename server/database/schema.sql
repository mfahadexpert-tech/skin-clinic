-- ==============================================================================
-- SkinLab AI & POS Management System - Supabase PostgreSQL Database Schema
-- Complete clinical schema covering all 12 modules (non-finance) and AI workflows
-- ==============================================================================

-- 1. CLINIC & SYSTEM CONFIGURATION
CREATE TABLE IF NOT EXISTS company_settings (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL DEFAULT 'Skin Lab - Aesthetic & Dermatology Clinic',
    phone VARCHAR(50) DEFAULT '+92 300 1234567',
    address TEXT DEFAULT 'Plaza 45, Commercial Avenue, DHA Phase 5, Lahore, Pakistan',
    tax_number VARCHAR(100) DEFAULT 'PMC-DERMA-8921-X',
    logo_base64 TEXT,
    footer_note TEXT DEFAULT 'Appointments: 0300-1234567 | Follow @SkinLabClinic | Packages valid for 12 months',
    enable_backup BOOLEAN DEFAULT TRUE,
    backup_path VARCHAR(255) DEFAULT './backups',
    session_timeout_minutes INTEGER DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. DEPARTMENTS & CLINIC ROLES
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- e.g. 'Dermatology', 'Laser Therapy', 'Aesthetic Facials', 'Reception'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. EMPLOYEES & PRACTITIONERS (Doctors, Technicians, Receptionists)
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    designation VARCHAR(100) NOT NULL, -- e.g. 'Senior Dermatologist', 'Laser Specialist'
    phone VARCHAR(50),
    email VARCHAR(150),
    commission_rate NUMERIC(5,2) DEFAULT 10.00, -- Percentage commission on executed procedures
    shift_start VARCHAR(10) DEFAULT '10:00',
    shift_end VARCHAR(10) DEFAULT '18:00',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. SYSTEM USERS & RBAC AUTHENTICATION
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'cashier', -- 'admin', 'manager', 'doctor', 'cashier'
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. SERVICE & PRODUCT CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- 'Laser Therapy', 'Facials & Peels', 'Injectables', 'Skincare Retail'
    code VARCHAR(50) UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. PRODUCTS & PROCEDURES MASTER (Treatments & Retail Skincare)
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL, -- e.g. 'SRV-LASER-01', 'SRV-FACIAL-02'
    barcode VARCHAR(100) UNIQUE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    is_service BOOLEAN DEFAULT TRUE, -- TRUE = Clinical Procedure, FALSE = Retail Product
    selling_price NUMERIC(15,4) NOT NULL DEFAULT 0.00,
    cost_price NUMERIC(15,4) NOT NULL DEFAULT 0.00,
    tax_class VARCHAR(50) DEFAULT 'none',
    stock_quantity NUMERIC(15,4) DEFAULT 0.00,
    low_stock_threshold NUMERIC(15,4) DEFAULT 5.00,
    clinical_instructions TEXT, -- Guidelines & standard machine settings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. TREATMENT DEALS & PACKAGES MASTER
CREATE TABLE IF NOT EXISTS deals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL, -- e.g. 'Bridal Glow 6-Session Package'
    sku VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    discounted_price NUMERIC(15,4) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. DEAL ITEMS (Bundled services and session allowances)
CREATE TABLE IF NOT EXISTS deal_items (
    id SERIAL PRIMARY KEY,
    deal_id INTEGER REFERENCES deals(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    sessions INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. CUSTOMERS / PATIENTS (PRM Master)
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    mrn VARCHAR(50) UNIQUE NOT NULL, -- Formatted Medical ID: '0001-MM-YYYY'
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(150),
    address TEXT,
    skin_type VARCHAR(50), -- Fitzpatrick scale (e.g. 'Type III - Moderate Sunburn')
    allergies TEXT,
    medical_notes TEXT,
    visit_count INTEGER DEFAULT 0,
    current_balance NUMERIC(15,4) DEFAULT 0.00, -- Positive = Patient Owes Clinic, Negative = Credit
    advance_balance NUMERIC(15,4) DEFAULT 0.00, -- Advance Wallet Deposit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. TREATMENT INVOICES & SALES (POS Billing)
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(100) UNIQUE NOT NULL, -- e.g. 'INV-0042'
    customer_id INTEGER REFERENCES customers(id) ON DELETE RESTRICT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    doctor_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    token_number VARCHAR(50), -- Patient Queue Token (e.g. 'P-01')
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    subtotal NUMERIC(15,4) DEFAULT 0.00,
    discount_amount NUMERIC(15,4) DEFAULT 0.00,
    tax_amount NUMERIC(15,4) DEFAULT 0.00,
    grand_total NUMERIC(15,4) DEFAULT 0.00,
    paid_amount NUMERIC(15,4) DEFAULT 0.00,
    payment_method VARCHAR(50) DEFAULT 'cash', -- 'cash', 'card', 'split', 'wallet'
    payment_status VARCHAR(50) DEFAULT 'paid', -- 'paid', 'partial', 'pending'
    clinical_remarks TEXT, -- Fluence, spot size, skin response remarks
    is_refunded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. SALE ITEMS & MULTI-SESSION TRACKER
CREATE TABLE IF NOT EXISTS sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE RESTRICT,
    quantity NUMERIC(15,4) DEFAULT 1.00,
    unit_price NUMERIC(15,4) NOT NULL DEFAULT 0.00,
    sessions_allowed INTEGER DEFAULT 1, -- Total sessions purchased
    sessions_consumed INTEGER DEFAULT 0, -- Sessions redeemed/used to date
    item_group_name VARCHAR(150), -- Deal/Package Name if bundled
    total_price NUMERIC(15,4) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. APPOINTMENTS & CALENDAR SLOTS
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    treatment_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    appointment_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 45,
    source VARCHAR(50) DEFAULT 'walk-in', -- 'walk-in', 'ai-voice', 'whatsapp', 'online'
    status VARCHAR(50) DEFAULT 'confirmed', -- 'confirmed', 'completed', 'cancelled', 'in-progress'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. SUPPLIERS & PURCHASE ORDERS (SRM)
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(50),
    address TEXT,
    tax_number VARCHAR(100),
    balance NUMERIC(15,4) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchases (
    id SERIAL PRIMARY KEY,
    purchase_number VARCHAR(100) UNIQUE NOT NULL,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE RESTRICT,
    total_amount NUMERIC(15,4) DEFAULT 0.00,
    paid_amount NUMERIC(15,4) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'received',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. AI SESSIONS & LOG AUDIT
CREATE TABLE IF NOT EXISTS ai_clinical_logs (
    id SERIAL PRIMARY KEY,
    doctor_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    patient_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    query_text TEXT NOT NULL,
    response_text TEXT NOT NULL,
    language VARCHAR(20) DEFAULT 'en', -- 'en' or 'roman_urdu'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
