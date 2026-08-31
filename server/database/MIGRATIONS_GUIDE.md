# 🗄️ SkinLab AI — Supabase Database Migration Guide

This guide explains how to apply the ordered SQL migrations in Supabase SQL Editor to establish a production-grade PostgreSQL database schema without losing existing data.

---

## 📁 Migration Files Directory
All migration files are located in `server/database/migrations/`:
1. `001_initial_schema.sql`: Base 14-table DDL schema.
2. `002_add_clinic_id_and_uuids.sql`: Multi-tenant `clinic_id` columns, `guid` UUIDs, performance indexes, and timestamp triggers.
3. `003_seed_clinical_data.sql`: Seed data for departments, categories, services, packages, and doctor profiles.

---

## 🚀 How to Run Migrations in Supabase SQL Editor

### Step 1: Open Supabase Dashboard
1. Log into your Supabase account: [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Select your project: **SkinLab AI Clinical OS**.
3. In the left navigation sidebar, click on **SQL Editor**.

---

### Step 2: Execute Migration 001 (`001_initial_schema.sql`)
1. Click **+ New Query**.
2. Copy the entire contents of [`server/database/migrations/001_initial_schema.sql`](file:///C:/Users/M%20Dawood/.gemini/antigravity-ide/scratch/skinlab-ai-clinic/server/database/migrations/001_initial_schema.sql).
3. Paste into the SQL Editor window and click **Run** (or press `Ctrl + Enter`).
4. **Verification**: Confirm that **Success. No rows returned** is displayed.

---

### Step 3: Execute Migration 002 (`002_add_clinic_id_and_uuids.sql`)
1. Click **+ New Query**.
2. Copy the entire contents of [`server/database/migrations/002_add_clinic_id_and_uuids.sql`](file:///C:/Users/M%20Dawood/.gemini/antigravity-ide/scratch/skinlab-ai-clinic/server/database/migrations/002_add_clinic_id_and_uuids.sql).
3. Paste into the SQL Editor window and click **Run**.
4. **Verification**: Run this verification query to confirm columns and indexes:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customers' AND column_name IN ('clinic_id', 'guid');
```

---

### Step 4: Execute Migration 003 (`003_seed_clinical_data.sql`)
1. Click **+ New Query**.
2. Copy the entire contents of [`server/database/migrations/003_seed_clinical_data.sql`](file:///C:/Users/M%20Dawood/.gemini/antigravity-ide/scratch/skinlab-ai-clinic/server/database/migrations/003_seed_clinical_data.sql).
3. Paste into the SQL Editor window and click **Run**.
4. **Verification**: Run this query to inspect seeded aesthetic procedures and doctors:
```sql
SELECT id, name, selling_price, is_service FROM products;
SELECT id, name, designation FROM employees;
```

---

## 🔍 Verification Queries

To verify that all 14 tables, indexes, and triggers exist, run:
```sql
-- Check total table count (should return 14)
SELECT COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check index creation
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public';
```
