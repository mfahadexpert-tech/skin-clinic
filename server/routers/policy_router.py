"""
==============================================================================
SkinLab AI - Deposits & No-Show Policy Router
==============================================================================
Handles:
1. Configurable cancellation windows (e.g. 24 hours prior).
2. Late-cancellation fees (50%) & No-show forfeiture rules (100%).
3. Auditing service-specific deposit requirements (Percentage vs Fixed PKR).
4. Recording timestamped patient policy acceptance.
==============================================================================
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List, Optional
from datetime import datetime
from database.supabase_client import clinic_store

router = APIRouter(prefix="/api/policies", tags=["Policies & Deposits"])


@router.get("/settings")
def get_policy_settings():
    """Returns active clinic cancellation policy settings."""
    if not hasattr(clinic_store, "clinic_policy"):
        clinic_store.clinic_policy = {
            "cancellation_window_hours": 24,
            "late_cancellation_fee_percentage": 50.0,
            "no_show_fee_percentage": 100.0,
            "policy_terms_text": "Cancellations must be made at least 24 hours prior to appointment time. Late cancellations incur a 50% fee. No-shows forfeit full deposit."
        }

    return {"success": True, "policy": clinic_store.clinic_policy}


@router.post("/settings")
def update_policy_settings(payload: Dict[str, Any]):
    """Updates clinic cancellation and no-show policies."""
    clinic_store.clinic_policy = {
        "cancellation_window_hours": int(payload.get("cancellation_window_hours", 24)),
        "late_cancellation_fee_percentage": float(payload.get("late_cancellation_fee_percentage", 50.0)),
        "no_show_fee_percentage": float(payload.get("no_show_fee_percentage", 100.0)),
        "policy_terms_text": payload.get("policy_terms_text", "Standard Clinic Policy")
    }

    return {"success": True, "message": "Clinic policies updated successfully", "policy": clinic_store.clinic_policy}


@router.post("/verify-deposit")
def verify_service_deposit(payload: Dict[str, Any]):
    """Calculates required deposit amount for a service."""
    service_price = float(payload.get("selling_price", 6000.0))
    deposit_type = payload.get("deposit_type", "percentage")
    deposit_value = float(payload.get("deposit_value", 20.0))

    if deposit_type == "percentage":
        deposit_required = service_price * (deposit_value / 100.0)
    else:
        deposit_required = min(service_price, deposit_value)

    return {
        "success": True,
        "selling_price": service_price,
        "deposit_type": deposit_type,
        "deposit_value": deposit_value,
        "deposit_required_pkr": deposit_required
    }


@router.post("/record-acceptance")
def record_patient_policy_acceptance(payload: Dict[str, Any]):
    """Audits timestamped patient acceptance of clinic policy."""
    appointment_id = payload.get("appointment_id")
    now_iso = datetime.now().isoformat()

    appt = next((a for a in getattr(clinic_store, "appointments", []) if a["id"] == appointment_id), None)
    if appt:
        appt["policy_accepted_at"] = now_iso
        appt["deposit_status"] = payload.get("deposit_status", "paid")

    return {
        "success": True,
        "message": "Patient policy acceptance and deposit record audited successfully.",
        "accepted_at": now_iso
    }
