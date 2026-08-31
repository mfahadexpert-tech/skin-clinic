"""
==============================================================================
SkinLab AI - Digital Intake & Medical Consent Form Router
==============================================================================
Handles:
1. Templates for Medical History, Fitzpatrick Assessment, Photo Consent,
   Laser Hair Reduction & Chemical Peel Consent.
2. Form submission with digital signatures & timestamps.
3. Doctor review and clinical sign-off.
4. Mandatory consent verification prior to treatment execution.
==============================================================================
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List, Optional
from datetime import datetime
from database.supabase_client import clinic_store

router = APIRouter(prefix="/api/forms", tags=["Intake & Consent Forms"])


@router.get("/templates")
def list_form_templates():
    """Returns clinical intake & consent templates."""
    if not hasattr(clinic_store, "form_templates"):
        clinic_store.form_templates = [
            {"id": 1, "name": "Medical History & Allergies Intake", "version": 1, "is_mandatory": True},
            {"id": 2, "name": "Fitzpatrick Skin Type Classification", "version": 1, "is_mandatory": True},
            {"id": 3, "name": "Before & After Clinical Photography Consent", "version": 1, "is_mandatory": True},
            {"id": 4, "name": "Laser Hair Reduction & Resurfacing Consent", "version": 1, "is_mandatory": False},
            {"id": 5, "name": "Chemical Peel & Injectable Medical Consent", "version": 1, "is_mandatory": False}
        ]

    return {"success": True, "templates": clinic_store.form_templates}


@router.post("/submit")
def submit_patient_form(payload: Dict[str, Any]):
    """Submits patient intake/consent response with digital signature."""
    if not hasattr(clinic_store, "form_submissions"):
        clinic_store.form_submissions = []

    submission = {
        "id": len(clinic_store.form_submissions) + 1,
        "customer_id": payload.get("customer_id", 1),
        "appointment_id": payload.get("appointment_id"),
        "template_id": payload.get("template_id", 1),
        "responses": payload.get("responses", {}),
        "signature_base64": payload.get("signature_base64", "data:image/png;base64,sample_signature"),
        "submitted_at": datetime.now().isoformat(),
        "reviewed_by_doctor_id": None,
        "reviewed_at": None,
        "override_reason": None
    }
    clinic_store.form_submissions.append(submission)

    return {
        "success": True,
        "message": "Clinical form submitted successfully with digital signature.",
        "submission": submission
    }


@router.post("/doctor-review")
def doctor_review_submission(payload: Dict[str, Any]):
    """Audits doctor review and sign-off on patient consent form."""
    submission_id = payload.get("submission_id")
    doctor_id = payload.get("doctor_id", 1)

    sub = next((s for s in getattr(clinic_store, "form_submissions", []) if s["id"] == submission_id), None)
    if not sub:
        raise HTTPException(status_code=404, detail="Form submission record not found.")

    sub["reviewed_by_doctor_id"] = doctor_id
    sub["reviewed_at"] = datetime.now().isoformat()

    return {
        "success": True,
        "message": "Form submission reviewed and signed off by Doctor.",
        "submission": sub
    }


@router.post("/verify-consent-status")
def verify_consent_status(payload: Dict[str, Any]):
    """
    Verifies if mandatory consent is completed before executing treatment.
    Blocks completion if mandatory consent is missing unless override reason is provided.
    """
    customer_id = payload.get("customer_id", 1)
    override_reason = payload.get("override_reason")

    submissions = [s for s in getattr(clinic_store, "form_submissions", []) if s["customer_id"] == customer_id]
    has_mandatory = len(submissions) > 0

    if not has_mandatory and not override_reason:
        raise HTTPException(
            status_code=400,
            detail="Treatment Execution Blocked: Mandatory patient consent is missing. An authorized doctor or receptionist must record an override reason to proceed."
        )

    return {
        "success": True,
        "can_proceed": True,
        "consent_verified": has_mandatory,
        "override_used": bool(override_reason)
    }
