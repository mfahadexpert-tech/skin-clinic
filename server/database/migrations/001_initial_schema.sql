-- ==============================================================================
-- Migration 001: Initial 14-Table Clinical Base Schema
-- ==============================================================================
-- Preserves existing structure for all 14 core tables with primary keys,
-- foreign keys, default timestamps, and soft constraints.
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

-- 2. DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. EMPLOYEES & PRACTITIONERS
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    designation VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(150),
    commission_rate NUMERIC(5,2) DEFAULT 10.00,
    shift_start VARCHAR(10) DEFAULT '10:00',
    shift_end VARCHAR(10) DEFAULT '18:00',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. SYSTEM USERS & RBAC AUTH
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'cashier',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. SERVICE & PRODUCT CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. PRODUCTS & PROCEDURES MASTER
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    barcode VARCHAR(100) UNIQUE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    is_service BOOLEAN DEFAULT TRUE,
    selling_price NUMERIC(15,4) NOT NULL DEFAULT 0.00,
    cost_price NUMERIC(15,4) NOT NULL DEFAULT 0.00,
    tax_class VARCHAR(50) DEFAULT 'none',
    stock_quantity NUMERIC(15,4) DEFAULT 0.00,
    low_stock_threshold NUMERIC(15,4) DEFAULT 5.00,
    clinical_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. TREATMENT DEALS & PACKAGES MASTER
CREATE TABLE IF NOT EXISTS deals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    discounted_price NUMERIC(15,4) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. DEAL ITEMS
CREATE TABLE IF NOT EXISTS deal_items (
    id SERIAL PRIMARY KEY,
    deal_id INTEGER REFERENCES deals(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    sessions INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. PATIENT PRM DIRECTORY
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    mrn VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(150),
    address TEXT,
    skin_type VARCHAR(100) DEFAULT 'Medium Asian Skin',
    allergies TEXT DEFAULT 'None reported',
    medical_notes TEXT,
    visit_count INTEGER DEFAULT 0,
    current_balance NUMERIC(15,4) DEFAULT 0.00,
    advance_balance NUMERIC(15,4) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. SALES & POS INVOICES
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE RESTRICT,
    doctor_id INTEGER REFERENCES employees(id) ON DELETE RESTRICT,
    token_number VARCHAR(20) NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    subtotal NUMERIC(15,4) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(15,4) DEFAULT 0.00,
    tax_amount NUMERIC(15,4) DEFAULT 0.00,
    grand_total NUMERIC(15,4) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(15,4) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'cash',
    payment_status VARCHAR(50) NOT NULL DEFAULT 'paid',
    clinical_remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. SALE ITEMS & MULTI-SESSION TRACKING
CREATE TABLE IF NOT EXISTS sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(200) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(15,4) NOT NULL DEFAULT 0.00,
    sessions_allowed INTEGER DEFAULT 1,
    sessions_consumed INTEGER DEFAULT 1,
    item_group_name VARCHAR(100),
    total_price NUMERIC(15,4) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. APPOINTMENTS CALENDAR
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(50),
    doctor_id INTEGER REFERENCES employees(id) ON DELETE RESTRICT,
    doctor_name VARCHAR(150) NOT NULL,
    treatment_name VARCHAR(200) NOT NULL,
    appointment_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 45,
    source VARCHAR(50) DEFAULT 'receptionist',
    status VARCHAR(50) DEFAULT 'confirmed',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. SRM SUPPLIERS
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(150),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. SRM PURCHASES & STOCK INFLOWS
CREATE TABLE IF NOT EXISTS purchases (
    id SERIAL PRIMARY KEY,
    purchase_number VARCHAR(100) NOT NULL UNIQUE,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE RESTRICT,
    total_cost NUMERIC(15,4) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(50) DEFAULT 'paid',
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
