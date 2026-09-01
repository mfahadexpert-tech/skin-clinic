"""
==============================================================================
SkinLab AI - Lead Management CRM & Patient Conversion Router
==============================================================================
Handles:
1. Lead Pipeline Stages: New Lead, Contacted, Consultation Booked, Attended,
   Quote Sent, Treatment Purchased, Lost, Follow-Up.
2. Capturing source, campaign, interested treatment, staff assignment,
   estimated value, loss reason, & follow-up reminders.
3. Converting qualified leads into permanent patients without duplicating details.
4. Pipeline conversion analytics & ROI reporting.
==============================================================================
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from database.supabase_client import clinic_store
from security.audit_logger import log_clinical_audit

router = APIRouter(prefix="/api/leads", tags=["Lead Management CRM"])


@router.get("/")
def list_crm_leads():
    """Returns all leads grouped by pipeline stage."""
    if not hasattr(clinic_store, "crm_leads"):
        clinic_store.crm_leads = [
            {"id": 1, "full_name": "Sara Mahmood", "phone": "+92 321 9988776", "lead_stage": "new_lead", "lead_source": "instagram", "interested_treatment": "HydraFacial Deluxe", "estimated_value": 8500.0, "is_converted": False},
            {"id": 2, "full_name": "Zainab Bibi", "phone": "+92 300 4455667", "lead_stage": "consultation_booked", "lead_source": "facebook_ad", "interested_treatment": "TCA Chemical Peel", "estimated_value": 12000.0, "is_converted": False},
            {"id": 3, "full_name": "Usman Ali", "phone": "+92 333 1122334", "lead_stage": "quote_sent", "lead_source": "google_search", "interested_treatment": "Diode Laser Hair Reduction", "estimated_value": 35000.0, "is_converted": False}
        ]

    return {"success": True, "count": len(clinic_store.crm_leads), "leads": clinic_store.crm_leads}


@router.post("/create")
def create_lead(payload: Dict[str, Any]):
    """Captures a new clinical prospect lead."""
    if not hasattr(clinic_store, "crm_leads"):
        clinic_store.crm_leads = []

    phone = payload.get("phone", "").strip()
    # Check for existing lead with same phone
    existing = next((l for l in clinic_store.crm_leads if l["phone"] == phone), None)
    if existing:
        return {"success": True, "message": "Lead already exists in CRM pipeline.", "lead": existing}

    new_lead = {
        "id": len(clinic_store.crm_leads) + 1,
        "full_name": payload.get("full_name", "Prospective Patient"),
        "phone": phone,
        "email": payload.get("email"),
        "lead_stage": payload.get("lead_stage", "new_lead"),
        "lead_source": payload.get("lead_source", "instagram"),
        "campaign_name": payload.get("campaign_name", "Summer Glow Promo"),
        "interested_treatment": payload.get("interested_treatment", "HydraFacial"),
        "assigned_staff_id": payload.get("assigned_staff_id", 1),
        "estimated_value": float(payload.get("estimated_value", 10000.0)),
        "is_converted": False,
        "followup_reminder_at": (datetime.now() + timedelta(days=2)).isoformat(),
        "created_at": datetime.now().isoformat()
    }
    clinic_store.crm_leads.append(new_lead)

    log_clinical_audit(
        action="CREATE_CRM_LEAD",
        entity="crm_lead",
        entity_id=str(new_lead["id"]),
        after_data=new_lead
    )

    return {"success": True, "message": "Lead captured in CRM pipeline successfully.", "lead": new_lead}


@router.post("/update-stage")
def update_lead_stage(payload: Dict[str, Any]):
    """Updates lead pipeline stage with loss reason if lost."""
    lead_id = payload.get("lead_id")
    new_stage = payload.get("lead_stage", "contacted")
    loss_reason = payload.get("loss_reason")

    lead = next((l for l in getattr(clinic_store, "crm_leads", []) if l["id"] == lead_id), None)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead record not found.")

    lead["lead_stage"] = new_stage
    if new_stage == "lost" and loss_reason:
        lead["loss_reason"] = loss_reason

    return {"success": True, "message": f"Lead #{lead_id} moved to stage '{new_stage}'.", "lead": lead}


@router.post("/convert-to-patient")
def convert_lead_to_patient(payload: Dict[str, Any]):
    """
    Converts a qualified lead into a permanent patient record in `customers` table
    WITHOUT DUPLICATING details if patient already exists.
    """
    lead_id = payload.get("lead_id")
    lead = next((l for l in getattr(clinic_store, "crm_leads", []) if l["id"] == lead_id), None)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead record not found.")

    # Check if patient already exists in customers directory by phone
    existing_customer = next((c for c in getattr(clinic_store, "customers", []) if c["phone"] == lead["phone"]), None)

    if existing_customer:
        customer_record = existing_customer
    else:
        customer_record = {
            "id": len(clinic_store.customers) + 1,
            "mrn": f"MRN-2026-{len(clinic_store.customers) + 1:04d}",
            "name": lead["full_name"],
            "phone": lead["phone"],
            "email": lead.get("email", ""),
            "gender": "Female",
            "age": 28,
            "skin_type": "Fitzpatrick Type III",
            "allergies": "None reported",
            "total_visits": 0,
            "outstanding_balance": 0.0,
            "created_at": datetime.now().isoformat()
        }
        clinic_store.customers.append(customer_record)

    lead["is_converted"] = True
    lead["converted_customer_id"] = customer_record["id"]
    lead["lead_stage"] = "treatment_purchased"

    log_clinical_audit(
        action="CONVERT_LEAD_TO_PATIENT",
        entity="customer",
        entity_id=str(customer_record["id"]),
        after_data=customer_record
    )

    return {
        "success": True,
        "message": f"Lead '{lead['full_name']}' successfully converted to permanent patient (MRN: {customer_record['mrn']}) without duplicate records.",
        "patient": customer_record,
        "lead": lead
    }


@router.get("/conversion-report")
def get_lead_conversion_report():
    """Returns pipeline conversion rates, total pipeline value, and campaign ROI."""
    leads = getattr(clinic_store, "crm_leads", [])
    total_leads = len(leads)
    converted_count = sum(1 for l in leads if l.get("is_converted"))
    pipeline_value = sum(float(l.get("estimated_value", 0.0)) for l in leads)
    conversion_rate = (converted_count / total_leads * 100.0) if total_leads > 0 else 0.0

    return {
        "success": True,
        "total_leads": total_leads,
        "converted_patients": converted_count,
        "conversion_rate_percent": round(conversion_rate, 2),
        "total_pipeline_value_pkr": pipeline_value
    }
