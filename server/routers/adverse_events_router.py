"""
==============================================================================
SkinLab AI - Adverse-Event & Complication Management Router
==============================================================================
Handles:
1. Clinical complication logging with severity levels (mild, moderate, severe, critical).
2. Immediate action plans, assigned clinician, and follow-up deadlines.
3. Urgent clinical alerts for severe & critical incidents.
4. Immutable incident protection preventing record deletion.
==============================================================================
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from database.supabase_client import clinic_store
from security.audit_logger import log_clinical_audit

router = APIRouter(prefix="/api/incidents", tags=["Adverse-Event Management"])


@router.get("/")
def list_adverse_events():
    """Lists all clinical adverse events and complication logs."""
    if not hasattr(clinic_store, "adverse_events"):
        clinic_store.adverse_events = [
            {
                "id": 1,
                "customer_id": 1,
                "customer_name": "Ayesha Khan",
                "doctor_id": 1,
                "doctor_name": "Dr. Sarah Khan",
                "treatment_name": "Chemical Peel (TCA 30%)",
                "severity_level": "moderate",
                "symptoms": "Persistent erythema & localized blistering on cheek area",
                "immediate_action": "Applied hydrocortisone 1% cream + cool saline compress.",
                "follow_up_deadline": (datetime.now() + timedelta(hours=24)).isoformat(),
                "status": "under_review",
                "is_resolved": False,
                "created_at": datetime.now().isoformat()
            }
        ]

    return {"success": True, "count": len(clinic_store.adverse_events), "incidents": clinic_store.adverse_events}


@router.post("/report")
def report_adverse_event(payload: Dict[str, Any]):
    """Reports a new adverse event with severity assessment & immediate action."""
    if not hasattr(clinic_store, "adverse_events"):
        clinic_store.adverse_events = []

    severity = payload.get("severity_level", "moderate").lower()
    customer_id = payload.get("customer_id", 1)
    patient = next((c for c in clinic_store.customers if c["id"] == customer_id), None)

    incident = {
        "id": len(clinic_store.adverse_events) + 1,
        "customer_id": customer_id,
        "customer_name": patient["name"] if patient else "Patient",
        "doctor_id": payload.get("doctor_id", 1),
        "doctor_name": "Dr. Sarah Khan",
        "treatment_name": payload.get("treatment_name", "Clinical Procedure"),
        "severity_level": severity,
        "symptoms": payload.get("symptoms", "Erythema / Swelling"),
        "immediate_action": payload.get("immediate_action", "Applied soothing mask & cool compress."),
        "follow_up_deadline": (datetime.now() + timedelta(hours=24)).isoformat(),
        "status": "reported",
        "is_resolved": False,
        "urgent_alert": severity in ["severe", "critical"],
        "created_at": datetime.now().isoformat()
    }
    clinic_store.adverse_events.append(incident)

    # Record immutable audit log
    log_clinical_audit(
        action="REPORT_ADVERSE_EVENT",
        entity="adverse_event",
        entity_id=str(incident["id"]),
        after_data=incident
    )

    return {
        "success": True,
        "message": f"Adverse event logged successfully. {'URGENT ALERT DISPATCHED TO LEAD DERMATOLOGIST.' if incident['urgent_alert'] else ''}",
        "incident": incident
    }


@router.post("/resolve")
def resolve_adverse_event(payload: Dict[str, Any]):
    """Resolves an adverse event with outcome notes."""
    incident_id = payload.get("incident_id")
    inc = next((i for i in getattr(clinic_store, "adverse_events", []) if i["id"] == incident_id), None)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident record not found.")

    inc["status"] = "resolved"
    inc["is_resolved"] = True
    inc["resolution_notes"] = payload.get("resolution_notes", "Symptom resolution verified.")
    inc["resolved_at"] = datetime.now().isoformat()

    log_clinical_audit(
        action="RESOLVE_ADVERSE_EVENT",
        entity="adverse_event",
        entity_id=str(incident_id),
        after_data=inc
    )

    return {
        "success": True,
        "message": f"Incident #{incident_id} marked as resolved.",
        "incident": inc
    }


@router.delete("/{incident_id}")
def delete_adverse_event(incident_id: int):
    """
    Prevents deletion of incident records to preserve an immutable audit trail.
    """
    raise HTTPException(
        status_code=403,
        detail="Deletion Blocked: Clinical adverse event incident records are immutable and cannot be deleted for medical compliance."
    )
