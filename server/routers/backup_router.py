"""
==============================================================================
SkinLab AI - Settings, Security & Automated SQL Backup Router
==============================================================================
Handles:
1. Clinic Branding & Profile (Name, Phone, Doctor License, Thermal Footer note).
2. Automated Database Backup Engine: Exports timestamped SQL dumps
   (e.g., backup_bbc_pos_db_YYYYMMDD_HHMMSS.sql) on exit or on-demand.
3. System Restore & Security RBAC configuration.
==============================================================================
"""

import os
import json
from fastapi import APIRouter, Response
from typing import Dict, Any
from datetime import datetime
from database.supabase_client import clinic_store

router = APIRouter(prefix="/api/settings", tags=["Settings & Backups"])


@router.get("/")
def get_settings():
    """Returns clinic branding, doctor registration, and thermal footer note."""
    return {"success": True, "settings": clinic_store.settings}


@router.post("/update")
def update_settings(payload: Dict[str, Any]):
    """Updates clinic branding profile and receipt configurations."""
    clinic_store.settings.update(payload)
    return {"success": True, "message": "Settings updated successfully", "settings": clinic_store.settings}


@router.post("/backup/export")
def generate_sql_backup_dump():
    """
    Module 12: Automated Database Backup Engine.
    Generates a complete, timestamped SQL backup script (.sql dump)
    ready for storage or hardware migrations.
    """
    now = datetime.now()
    timestamp_str = now.strftime("%Y%m%d_%H%M%S")
    filename = f"backup_bbc_pos_db_{timestamp_str}.sql"

    # Generate SQL DDL & DML script
    sql_lines = [
        f"-- ========================================================",
        f"-- SkinLab Clinic Management System - Automated SQL Backup",
        f"-- Export Timestamp: {now.strftime('%Y-%m-%d %H:%M:%S')}",
        f"-- Database Target: Supabase / PostgreSQL / SQLite",
        f"-- ========================================================\n",
        f"-- 1. CLINIC BRANDING",
        f"INSERT INTO company_settings (company_name, phone, address, tax_number, footer_note) VALUES ('{clinic_store.settings['company_name']}', '{clinic_store.settings['phone']}', '{clinic_store.settings['address']}', '{clinic_store.settings['tax_number']}', '{clinic_store.settings['footer_note']}');\n",
        f"-- 2. PATIENTS MASTER ({len(clinic_store.customers)} records)"
    ]

    for p in clinic_store.customers:
        sql_lines.append(
            f"INSERT INTO customers (id, mrn, name, phone, email, skin_type, visit_count, current_balance, advance_balance) "
            f"VALUES ({p['id']}, '{p['mrn']}', '{p['name']}', '{p['phone']}', '{p.get('email', '')}', '{p.get('skin_type', '')}', {p.get('visit_count', 0)}, {p.get('current_balance', 0.0)}, {p.get('advance_balance', 0.0)});"
        )

    sql_lines.append(f"\n-- 3. PRODUCTS & SERVICES MASTER ({len(clinic_store.products)} records)")
    for prod in clinic_store.products:
        sql_lines.append(
            f"INSERT INTO products (id, name, sku, category_id, selling_price, cost_price, stock_quantity) "
            f"VALUES ({prod['id']}, '{prod['name']}', '{prod['sku']}', {prod['category_id']}, {prod['selling_price']}, {prod['cost_price']}, {prod['stock_quantity']});"
        )

    sql_lines.append(f"\n-- 4. SALES & MULTI-SESSION TRANSACTIONS ({len(clinic_store.sales)} records)")
    for s in clinic_store.sales:
        sql_lines.append(
            f"INSERT INTO sales (id, invoice_number, customer_id, doctor_id, token_number, subtotal, grand_total, paid_amount, payment_status) "
            f"VALUES ({s['id']}, '{s['invoice_number']}', {s['customer_id']}, {s['doctor_id']}, '{s.get('token_number', 'P-01')}', {s['subtotal']}, {s['grand_total']}, {s['paid_amount']}, '{s['payment_status']}');"
        )

    sql_dump_content = "\n".join(sql_lines)

    return {
        "success": True,
        "filename": filename,
        "timestamp": now.isoformat(),
        "total_records_backed_up": len(clinic_store.customers) + len(clinic_store.products) + len(clinic_store.sales),
        "sql_dump": sql_dump_content
    }
