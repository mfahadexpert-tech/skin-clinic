"""
==============================================================================
SkinLab AI - Supabase Client & Persistence Provider
==============================================================================
This module manages the connection to Supabase PostgreSQL database.
It supports:
1. Live Supabase connection via `supabase-py` when credentials are provided.
2. In-memory / Local SQLite structured fallback store pre-seeded with
   realistic aesthetic clinic records (patients, treatments, packages, sales).
3. Real-time operations and data synchronization.
==============================================================================
"""

import os
import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SkinLab.SupabaseClient")

# Retrieve Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

# Initialize Supabase client if credentials are configured
supabase_client = None
if SUPABASE_URL and SUPABASE_KEY and SUPABASE_URL != "your_supabase_url_here":
    try:
        from supabase import create_client, Client
        supabase_client: Optional[Client] = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("[SUPABASE] Connected successfully to live Supabase instance.")
    except Exception as e:
        logger.warning(f"[SUPABASE] Could not connect to Supabase: {e}. Falling back to local data store.")
else:
    logger.info("[SUPABASE] No live Supabase credentials configured. Running with high-performance local clinic store.")


class LocalClinicStore:
    """
    High-performance fallback store providing instant data access and
    conforming 100% to the Supabase database schema specifications.
    """
    def __init__(self):
        self.settings = {
            "company_name": "Skin Lab - Aesthetic & Dermatology Clinic",
            "phone": "+92 300 1234567",
            "address": "Plaza 45, Commercial Avenue, DHA Phase 5, Lahore, Pakistan",
            "tax_number": "PMC-DERMA-8921-X",
            "footer_note": "Appointments: 0300-1234567 | Follow us on Instagram @SkinLabClinic | Packages valid for 12 months",
            "enable_backup": True,
            "backup_path": "./backups",
            "session_timeout_minutes": 60
        }

        self.departments = [
            {"id": 1, "name": "Dermatology & Clinical Skin", "description": "Medical consultations, acne, eczema, and mole mapping"},
            {"id": 2, "name": "Laser Therapy", "description": "Laser hair reduction, tattoo removal, Carbon peels, resurfacing"},
            {"id": 3, "name": "Facials & Medical Peels", "description": "HydraFacial Deluxe, Chemical peels, Hollywood facials"},
            {"id": 4, "name": "Injectables & Anti-Aging", "description": "Botox, Dermal Fillers, PRP, Profhilo"},
            {"id": 5, "name": "Hair Restoration", "description": "PRP Hair, GFC Therapy, Mesotherapy"},
            {"id": 6, "name": "Reception & Billing", "description": "Front desk check-in, token generation, cashier POS"}
        ]

        self.employees = [
            {"id": 1, "name": "Dr. Sarah Khan", "department_id": 1, "designation": "Consultant Dermatologist", "phone": "0300-1122334", "email": "dr.sarah@skinlab.com", "commission_rate": 15.0, "shift_start": "10:00", "shift_end": "18:00", "is_active": True},
            {"id": 2, "name": "Dr. Ayesha Tariq", "department_id": 4, "designation": "Aesthetic Physician", "phone": "0301-2233445", "email": "dr.ayesha@skinlab.com", "commission_rate": 12.5, "shift_start": "11:00", "shift_end": "19:00", "is_active": True},
            {"id": 3, "name": "Zeeshan Ahmed", "department_id": 2, "designation": "Senior Laser Technician", "phone": "0321-3344556", "email": "zeeshan@skinlab.com", "commission_rate": 8.0, "shift_start": "10:00", "shift_end": "20:00", "is_active": True},
            {"id": 4, "name": "Hina Malik", "department_id": 6, "designation": "Front Desk Executive", "phone": "0333-4455667", "email": "hina@skinlab.com", "commission_rate": 0.0, "shift_start": "09:00", "shift_end": "18:00", "is_active": True}
        ]

        self.categories = [
            {"id": 1, "name": "Laser Therapy", "code": "CAT-LASER"},
            {"id": 2, "name": "Facials & Peels", "code": "CAT-FACIAL"},
            {"id": 3, "name": "Injectables & Anti-Aging", "code": "CAT-INJECT"},
            {"id": 4, "name": "Hair Restoration", "code": "CAT-HAIR"},
            {"id": 5, "name": "Skincare Retail", "code": "CAT-RETAIL"}
        ]

        self.products = [
            {"id": 1, "name": "HydraFacial Deluxe (Deep Cleansing)", "sku": "SRV-FACIAL-01", "barcode": "890123450001", "category_id": 2, "is_service": True, "selling_price": 6000.0, "cost_price": 1200.0, "tax_class": "none", "stock_quantity": 999.0, "clinical_instructions": "Step 1: Vortex Exfoliation, Step 2: GlySal Peel 7.5%, Step 3: Hyaluronic Infusion."},
            {"id": 2, "name": "Full Body Laser Hair Reduction (Single Session)", "sku": "SRV-LASER-01", "barcode": "890123450002", "category_id": 1, "is_service": True, "selling_price": 7500.0, "cost_price": 800.0, "tax_class": "none", "stock_quantity": 999.0, "clinical_instructions": "Diode 808nm / Alexandrite. Fluence 12-16 J/cm2. Shave 24h prior."},
            {"id": 3, "name": "Carbon Laser Peel (Hollywood Peel)", "sku": "SRV-LASER-02", "barcode": "890123450003", "category_id": 1, "is_service": True, "selling_price": 5000.0, "cost_price": 900.0, "tax_class": "none", "stock_quantity": 999.0, "clinical_instructions": "Q-Switched Nd:YAG 1064nm. Apply liquid carbon layer, wait 10 min."},
            {"id": 4, "name": "PRP Vampire Facial with Microneedling", "sku": "SRV-INJECT-01", "barcode": "890123450004", "category_id": 3, "is_service": True, "selling_price": 12000.0, "cost_price": 2500.0, "tax_class": "none", "stock_quantity": 999.0, "clinical_instructions": "10ml blood draw, centrifuge 3200 RPM for 10m. DermaPen depth 1.0-1.5mm."},
            {"id": 5, "name": "Botox Forehead & Crow's Feet (20 Units)", "sku": "SRV-INJECT-02", "barcode": "890123450005", "category_id": 3, "is_service": True, "selling_price": 18000.0, "cost_price": 8500.0, "tax_class": "none", "stock_quantity": 999.0, "clinical_instructions": "Allergan Botox. Reconstituted with 2.5ml saline. Check for neuromuscular disorders."},
            {"id": 6, "name": "Salicylic / Glycolic Chemical Peel", "sku": "SRV-FACIAL-02", "barcode": "890123450006", "category_id": 2, "is_service": True, "selling_price": 4500.0, "cost_price": 600.0, "tax_class": "none", "stock_quantity": 999.0, "clinical_instructions": "Neutralize within 3-5 minutes. Strictly mandate SPF 50 sunblock."},
            {"id": 7, "name": "DermaShield SPF 60 Sunblock (100ml)", "sku": "RET-CREAM-01", "barcode": "890123450007", "category_id": 5, "is_service": False, "selling_price": 2200.0, "cost_price": 1100.0, "tax_class": "none", "stock_quantity": 48.0, "clinical_instructions": "Post-procedure mineral physical sunscreen."},
            {"id": 8, "name": "Hyaluronic Acid Hydrating Serum (30ml)", "sku": "RET-SERUM-01", "barcode": "890123450008", "category_id": 5, "is_service": False, "selling_price": 3500.0, "cost_price": 1700.0, "tax_class": "none", "stock_quantity": 22.0, "clinical_instructions": "Post-laser skin barrier repair."}
        ]

        self.deals = [
            {
                "id": 1,
                "name": "6-Session Full Body Laser Package",
                "sku": "DEAL-LASER-6S",
                "description": "Complete 6-session full body laser hair reduction package with 35% bundle savings.",
                "discounted_price": 30000.0,
                "is_active": True,
                "items": [
                    {"product_id": 2, "product_name": "Full Body Laser Hair Reduction", "sessions": 6}
                ]
            },
            {
                "id": 2,
                "name": "Bridal Glow Deluxe Deal (4 Sessions)",
                "sku": "DEAL-BRIDAL-GLOW",
                "description": "Comprehensive bridal package: 2x HydraFacial Deluxe + 2x Carbon Laser Peels.",
                "discounted_price": 18000.0,
                "is_active": True,
                "items": [
                    {"product_id": 1, "product_name": "HydraFacial Deluxe", "sessions": 2},
                    {"product_id": 3, "product_name": "Carbon Laser Peel", "sessions": 2}
                ]
            }
        ]

        # Initial Patients matching documentation (MRN format: 0001-MM-YYYY)
        self.customers = [
            {
                "id": 1,
                "mrn": "0001-08-2026",
                "name": "Ayesha Khan",
                "phone": "0300-1234567",
                "email": "ayesha.khan@example.com",
                "address": "House 12-A, Model Town, Lahore",
                "skin_type": "Fitzpatrick Type III (Medium, turns brown)",
                "allergies": "No known allergies. Sensitive to strong AHA peels.",
                "visit_count": 4,
                "current_balance": 0.0,      # No dues
                "advance_balance": 2000.0,   # 2000 PKR Wallet credit
                "created_at": "2026-08-10T10:00:00"
            },
            {
                "id": 2,
                "mrn": "0002-08-2026",
                "name": "Bilal Ahmed",
                "phone": "0321-9876543",
                "email": "bilal.ahmed@example.com",
                "address": "Sector C, Bahria Town, Lahore",
                "skin_type": "Fitzpatrick Type IV (Olive / Darker Asian)",
                "allergies": "Sensitive to topical Lidocaine 10%",
                "visit_count": 2,
                "current_balance": 4500.0,   # Owes 4,500 PKR
                "advance_balance": 0.0,
                "created_at": "2026-08-15T14:30:00"
            },
            {
                "id": 3,
                "mrn": "0003-08-2026",
                "name": "Fatima Ali",
                "phone": "0333-5566778",
                "email": "fatima.ali@example.com",
                "address": "Gulberg III, Lahore",
                "skin_type": "Fitzpatrick Type II (Fair, burns easily)",
                "allergies": "None",
                "visit_count": 6,
                "current_balance": 0.0,
                "advance_balance": 5000.0,
                "created_at": "2026-08-20T16:00:00"
            }
        ]

        # Initial sales history & multi-session tracking
        self.sales = [
            {
                "id": 1,
                "invoice_number": "INV-0029",
                "customer_id": 1,
                "customer_name": "Ayesha Khan",
                "customer_mrn": "0001-08-2026",
                "doctor_id": 1,
                "doctor_name": "Dr. Sarah Khan",
                "token_number": "P-01",
                "date": "2026-08-10T11:15:00",
                "subtotal": 30000.0,
                "discount_amount": 0.0,
                "tax_amount": 0.0,
                "grand_total": 30000.0,
                "paid_amount": 20000.0,
                "payment_method": "split",
                "payment_status": "partial", # PKR 10,000 due
                "clinical_remarks": "Fluence 14J/cm2, Spot size 10mm, Session 2 of 6 completed. Prescribed DermaShield SPF 60.",
                "items": [
                    {
                        "id": 1,
                        "product_id": 2,
                        "product_name": "Full Body Laser (6 Sess)",
                        "quantity": 1,
                        "unit_price": 30000.0,
                        "sessions_allowed": 6,
                        "sessions_consumed": 2, # 4 sessions remaining
                        "item_group_name": "6-Session Full Body Laser Package",
                        "total_price": 30000.0
                    }
                ]
            },
            {
                "id": 2,
                "invoice_number": "INV-0038",
                "customer_id": 3,
                "customer_name": "Fatima Ali",
                "customer_mrn": "0003-08-2026",
                "doctor_id": 1,
                "doctor_name": "Dr. Sarah Khan",
                "token_number": "P-02",
                "date": "2026-08-27T15:45:00",
                "subtotal": 18000.0,
                "discount_amount": 0.0,
                "tax_amount": 0.0,
                "grand_total": 18000.0,
                "paid_amount": 18000.0,
                "payment_method": "card",
                "payment_status": "paid",
                "clinical_remarks": "Bridal Glow Session 1. HydraFacial completed with vortex extraction. Skin glowing, mild erythema resolved in 20 min.",
                "items": [
                    {
                        "id": 2,
                        "product_id": 1,
                        "product_name": "HydraFacial Deluxe",
                        "quantity": 1,
                        "unit_price": 6000.0,
                        "sessions_allowed": 2,
                        "sessions_consumed": 1,
                        "item_group_name": "Bridal Glow Deluxe Deal",
                        "total_price": 18000.0
                    }
                ]
            }
        ]

        # Upcoming clinic appointments for doctor calendar sync
        self.appointments = [
            {
                "id": 1,
                "customer_id": 1,
                "customer_name": "Ayesha Khan",
                "customer_phone": "0300-1234567",
                "doctor_id": 1,
                "doctor_name": "Dr. Sarah Khan",
                "treatment_name": "Laser Hair Removal (Session 3)",
                "appointment_time": "2026-08-31T11:00:00",
                "duration_minutes": 45,
                "source": "ai-voice",
                "status": "confirmed",
                "notes": "Booked automatically via 24/7 AI Voice Agent."
            },
            {
                "id": 2,
                "customer_id": 2,
                "customer_name": "Bilal Ahmed",
                "customer_phone": "0321-9876543",
                "doctor_id": 2,
                "doctor_name": "Dr. Ayesha Tariq",
                "treatment_name": "PRP Vampire Facial",
                "appointment_time": "2026-08-31T14:30:00",
                "duration_minutes": 60,
                "source": "whatsapp",
                "status": "confirmed",
                "notes": "Confirmed via automated WhatsApp notification."
            },
            {
                "id": 3,
                "customer_id": 3,
                "customer_name": "Fatima Ali",
                "customer_phone": "0333-5566778",
                "doctor_id": 1,
                "doctor_name": "Dr. Sarah Khan",
                "treatment_name": "Carbon Laser Peel (Session 2)",
                "appointment_time": "2026-08-31T16:00:00",
                "duration_minutes": 30,
                "source": "walk-in",
                "status": "confirmed",
                "notes": "Bridal package redemption."
            }
        ]

        # SRM Suppliers & Inward stock
        self.suppliers = [
            {"id": 1, "name": "DermaMed Supplies Ltd", "contact_person": "Kamran Raza", "phone": "0300-9988776", "address": "Industrial Area, Lahore", "balance": 15000.0},
            {"id": 2, "name": "LaserTech Global Imports", "contact_person": "Tariq Mahmood", "phone": "0321-8877665", "address": "Blue Area, Islamabad", "balance": 0.0}
        ]

        self.purchases = [
            {"id": 1, "purchase_number": "PO-2026-081", "supplier_id": 1, "supplier_name": "DermaMed Supplies Ltd", "total_amount": 45000.0, "paid_amount": 30000.0, "status": "received", "date": "2026-08-12"}
        ]

        self.token_counter = 5
        self.invoice_counter = 42

    def get_next_token(self) -> str:
        """Generates the next waiting lounge queue token (e.g. P-06)"""
        self.token_counter += 1
        return f"P-{self.token_counter:02d}"

    def get_next_invoice_number(self) -> str:
        """Generates the next sequential invoice number (e.g. INV-0043)"""
        self.invoice_counter += 1
        return f"INV-{self.invoice_counter:04d}"

    def get_next_mrn(self) -> str:
        """Generates the next clinical Medical Registration Number (0004-08-2026)"""
        now = datetime.now()
        next_id = len(self.customers) + 1
        return f"{next_id:04d}-{now.strftime('%m-%Y')}"


# Instantiate singleton local store
clinic_store = LocalClinicStore()
