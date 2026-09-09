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

from database.hospital_models import PatientRegistrationRequest, Gender, NotificationChannel
from services.patient_service import PatientService
import uuid

router = APIRouter(prefix="/api/patients", tags=["Patient PRM & Sessions"])


@router.get("/")
def list_patients(search: Optional[str] = Query(None, description="Search by Name, Phone, or MRN")):
    """
    Lists all clinic patients from the single authoritative database.
    If `search` is provided, filters across name, phone, CNIC, or MRN.
    """
    if search:
        patients = PatientService.search_patients(search)
    else:
        patients = PatientService.list_patients(limit=200)

    return {"success": True, "count": len(patients), "patients": patients}


@router.get("/{patient_id}")
def get_patient_details(patient_id: str):
    """
    Returns full patient profile and sales/visit history.
    """
    try:
        op_data = PatientService.get_patient_operational_data(patient_id)
        patient_sales = [s for s in clinic_store.sales if str(s.get("customer_id")) == str(patient_id) or str(s.get("customer_mrn")) == str(op_data.get("mrn"))]
        return {
            "success": True,
            "patient": op_data,
            "sales_history": patient_sales
        }
    except ValueError:
        patient = clinic_store.get_patient_by_id(patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient record not found.")
        patient_sales = [s for s in clinic_store.sales if str(s.get("customer_id")) == str(patient_id)]
        return {
            "success": True,
            "patient": patient,
            "sales_history": patient_sales
        }


@router.post("/register")
def register_patient(payload: CustomerCreate):
    """
    Registers a walk-in patient from POS or PRM directory into the authoritative database.
    Automatically assigns unique sequential MRN (e.g. 0006-08-2026).
    """
    # Auto-generate unique placeholder CNIC if not provided by cashier/POS
    cnic = payload.cnic.strip() if payload.cnic else f"35202-{abs(hash(payload.phone)) % 9000000 + 1000000}-1"
    gender_enum = Gender.FEMALE if (payload.gender or "").lower() == "female" else Gender.MALE

    reg_req = PatientRegistrationRequest(
        full_name=payload.name,
        phone=payload.phone,
        email=payload.email,
        gender=gender_enum,
        dob=payload.dob or "1995-01-01",
        cnic=cnic,
        address=payload.address or "Walk-in registration",
        emergency_contact=payload.emergency_contact or payload.phone,
        whatsapp_available=True,
        primary_notification_channel=NotificationChannel.WHATSAPP,
        skin_type=payload.skin_type or "Fitzpatrick Type III (Medium)",
        allergies=payload.allergies or "No known allergies",
        advance_balance=float(payload.advance_balance or 0.0),
        current_balance=float(payload.current_balance or 0.0)
    )

    try:
        res = PatientService.register_patient(reg_req)
    except ValueError as e:
        # If duplicate detected, return the existing patient with warning
        dup_check = PatientService.check_duplicate(cnic=cnic, phone=payload.phone, email=payload.email)
        if dup_check.has_duplicate and dup_check.existing_patient:
            return {
                "success": True,
                "message": f"Patient already exists: {dup_check.warning_message}",
                "patient": dup_check.existing_patient,
                "patients": PatientService.list_patients(100)
            }
        raise HTTPException(status_code=400, detail=str(e))

    all_patients = PatientService.list_patients(100)
    return {
        "success": True,
        "message": f"Patient registered successfully with MRN: {res.get('mrn')}",
        "patient": res,
        "patients": all_patients
    }


@router.put("/{patient_id}")
def update_patient(patient_id: str, payload: Dict[str, Any]):
    """
    Updates an existing patient record in the authoritative database.
    """
    try:
        PatientService.update_patient(patient_id, payload)
        updated = PatientService.get_patient_operational_data(patient_id)
        return {
            "success": True,
            "message": "Patient updated successfully",
            "patient": updated,
            "patients": PatientService.list_patients(100)
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{patient_id}")
def delete_patient(patient_id: str):
    """
    Deletes a patient record from the authoritative database.
    """
    try:
        PatientService.delete_patient(patient_id)
        return {
            "success": True,
            "message": "Patient record deleted successfully",
            "patients": PatientService.list_patients(100)
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


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
