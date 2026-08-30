"""
==============================================================================
SkinLab AI - Patient Relationship Management (PRM) & Session Tracker Router
==============================================================================
Handles:
1. Patient directory search (by MRN, Name, Phone).
2. Walk-in patient quick creation with MRN generator (0001-MM-YYYY).
3. `receive_payment_dialog` (Module 6 & Workflow 3):
   - Viewing active packages & session consumption (used vs remaining).
   - Consuming next session (incrementing 'Session Now' counter).
   - Settling outstanding patient dues with direct account crediting.
==============================================================================
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List, Optional
from datetime import datetime
from database.supabase_client import clinic_store
from database.models import CustomerCreate, CustomerUpdate, SessionRedeemRequest

router = APIRouter(prefix="/api/patients", tags=["Patient PRM & Sessions"])


@router.get("/")
def list_patients(search: Optional[str] = Query(None, description="Search by Name, Phone, or MRN")):
    """
    Lists all clinic patients. If `search` is provided, filters across
    name, phone, or formatted Medical ID (e.g. 0001-08-2026).
    """
    patients = clinic_store.customers
    if search:
        s = search.lower().strip()
        patients = [
            p for p in patients
            if s in p["name"].lower() or s in p["phone"] or s in p["mrn"].lower()
        ]
    return {"success": True, "count": len(patients), "patients": patients}


@router.get("/{patient_id}")
def get_patient_details(patient_id: int):
    """
    Returns full patient profile including:
    - Demographic info, skin classification, allergies
    - Advance Wallet deposit balance & Current balance (dues)
    - Complete sales history & multi-session active packages
    """
    patient = next((p for p in clinic_store.customers if p["id"] == patient_id), None)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found.")

    # Fetch patient's sales & packages
    patient_sales = [s for s in clinic_store.sales if s["customer_id"] == patient_id]

    return {
        "success": True,
        "patient": patient,
        "sales_history": patient_sales
    }


@router.post("/register")
def register_patient(payload: CustomerCreate):
    """
    Registers a walk-in patient from POS or PRM directory.
    Automatically assigns unique sequential MRN (e.g. 0004-08-2026).
    """
    new_mrn = clinic_store.get_next_mrn()
    new_patient = {
        "id": len(clinic_store.customers) + 1,
        "mrn": new_mrn,
        "name": payload.name,
        "phone": payload.phone,
        "email": payload.email,
        "address": payload.address,
        "skin_type": payload.skin_type or "Fitzpatrick Type III",
        "allergies": payload.allergies or "None reported",
        "medical_notes": payload.medical_notes or "Walk-in patient registration.",
        "visit_count": 0,
        "current_balance": 0.0,
        "advance_balance": 0.0,
        "created_at": datetime.now().isoformat()
    }
    clinic_store.customers.append(new_patient)

    return {
        "success": True,
        "message": f"Patient registered successfully with MRN: {new_mrn}",
        "patient": new_patient
    }


@router.post("/redeem-session")
def redeem_session(payload: SessionRedeemRequest):
    """
    Module 6 / Workflow 3: Interactive Patient Visits & Session Redemption Dialog.
    - Finds active sale invoice.
    - Increments `sessions_consumed` on target procedure line item.
    - Collects any outstanding due payments and decrements `current_balance`.
    - Captures updated clinical remarks.
    """
    # 1. Locate sale record
    sale = next((s for s in clinic_store.sales if s["id"] == payload.sale_id), None)
    if not sale:
        raise HTTPException(status_code=404, detail="Sale invoice record not found.")

    # 2. Locate line item in sale
    item = next((i for i in sale["items"] if i["id"] == payload.item_id), None)
    if not item:
        # Fallback to first item if item_id match is loose
        item = sale["items"][0]

    # 3. Check session limits
    remaining = item["sessions_allowed"] - item["sessions_consumed"]
    if remaining < payload.sessions_to_consume:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot consume {payload.sessions_to_consume} sessions. Only {remaining} sessions remaining."
        )

    # Increment consumed sessions
    item["sessions_consumed"] += payload.sessions_to_consume
    remaining_after = item["sessions_allowed"] - item["sessions_consumed"]

    # 4. Handle Due Payment Collection
    customer = next((c for c in clinic_store.customers if c["id"] == sale["customer_id"]), None)
    if payload.payment_amount > 0:
        sale["paid_amount"] += payload.payment_amount
        if customer:
            customer["current_balance"] = max(0.0, customer["current_balance"] - payload.payment_amount)

        # Update sale payment status
        if sale["paid_amount"] >= sale["grand_total"]:
            sale["payment_status"] = "paid"
        else:
            sale["payment_status"] = "partial"

    # Append session notes to remarks
    if payload.session_notes:
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
        sale["clinical_remarks"] = f"{sale.get('clinical_remarks', '')}\n[{now_str}] Session Redeemed: {payload.session_notes}"

    return {
        "success": True,
        "message": f"Session redeemed successfully! Remaining sessions: {remaining_after}",
        "sale": sale,
        "customer": customer,
        "remaining_sessions": remaining_after
    }
