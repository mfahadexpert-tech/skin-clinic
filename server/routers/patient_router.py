"""
==============================================================================
SkinLab AI - Patient Relationship Management (PRM) & Session Tracker Router
==============================================================================
Handles:
1. Patient directory search (by MRN, Name, Phone).
2. Walk-in patient quick creation & full profile registration.
3. Patient Deletion & Profile Updates.
4. `receive_payment_dialog`:
   - Viewing active packages & session consumption.
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
    Returns full patient profile.
    """
    patient = next((p for p in clinic_store.customers if p["id"] == patient_id), None)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found.")

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
        "skin_type": payload.skin_type or "Medium Asian Skin",
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
        "patient": new_patient,
        "patients": clinic_store.customers
    }


@router.put("/{patient_id}")
def update_patient(patient_id: int, payload: Dict[str, Any]):
    """
    Updates an existing patient record.
    """
    patient = next((p for p in clinic_store.customers if p["id"] == patient_id), None)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found.")

    if "name" in payload:
        patient["name"] = payload["name"]
    if "phone" in payload:
        patient["phone"] = payload["phone"]
    if "skin_type" in payload:
        patient["skin_type"] = payload["skin_type"]
    if "allergies" in payload:
        patient["allergies"] = payload["allergies"]

    return {
        "success": True,
        "message": "Patient updated successfully",
        "patient": patient,
        "patients": clinic_store.customers
    }


@router.delete("/{patient_id}")
def delete_patient(patient_id: int):
    """
    Deletes a patient record from the database.
    """
    clinic_store.customers = [p for p in clinic_store.customers if p["id"] != patient_id]
    return {
        "success": True,
        "message": "Patient record deleted successfully",
        "patients": clinic_store.customers
    }


@router.post("/redeem-session")
def redeem_session(payload: SessionRedeemRequest):
    """
    Module 6 / Workflow 3: Interactive Patient Visits & Session Redemption Dialog.
    """
    sale = next((s for s in clinic_store.sales if s["id"] == payload.sale_id), None)
    if not sale:
        raise HTTPException(status_code=404, detail="Sale invoice record not found.")

    item = next((i for i in sale["items"] if i["id"] == payload.item_id), None)
    if not item:
        item = sale["items"][0]

    remaining = item["sessions_allowed"] - item["sessions_consumed"]
    if remaining < payload.sessions_to_consume:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot consume {payload.sessions_to_consume} sessions. Only {remaining} sessions remaining."
        )

    item["sessions_consumed"] += payload.sessions_to_consume
    remaining_after = item["sessions_allowed"] - item["sessions_consumed"]

    customer = next((c for c in clinic_store.customers if c["id"] == sale["customer_id"]), None)
    if payload.payment_amount > 0:
        sale["paid_amount"] += payload.payment_amount
        if customer:
            customer["current_balance"] = max(0.0, customer["current_balance"] - payload.payment_amount)

        if sale["paid_amount"] >= sale["grand_total"]:
            sale["payment_status"] = "paid"
        else:
            sale["payment_status"] = "partial"

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
