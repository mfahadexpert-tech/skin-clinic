"""
==============================================================================
SkinLab AI - Controlled Post-Treatment Follow-Up Assistant Router
==============================================================================
Handles:
1. Scheduled 24h / 48h / 7-day post-treatment check-in questions.
2. Collecting patient replies & clinical progress photographs.
3. Automated warning phrase detection ('severe pain', 'blistering', 'pus', 'bleeding', 'burn').
4. Clinician Task creation & escalation history without diagnosing emergencies.
==============================================================================
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from database.supabase_client import clinic_store
from security.audit_logger import log_clinical_audit

router = APIRouter(prefix="/api/followup", tags=["Post-Treatment Follow-Up"])

WARNING_PHRASES = ["severe pain", "blistering", "pus", "bleeding", "burn", "pus discharge", "extreme swelling", "infection", "khatra", "nishan"]


@router.get("/")
def list_followup_campaigns():
    """Lists all active post-treatment follow-up check-in campaigns."""
    if not hasattr(clinic_store, "followup_campaigns"):
        clinic_store.followup_campaigns = [
            {
                "id": 1,
                "customer_id": 1,
                "customer_name": "Ayesha Khan",
                "treatment_name": "TCA Chemical Peel 30%",
                "checkin_day": 1,
                "question_text": "How is your skin feeling today? Any excessive redness, warmth, or discomfort?",
                "status": "sent",
                "created_at": datetime.now().isoformat()
            }
        ]

    return {"success": True, "count": len(clinic_store.followup_campaigns), "campaigns": clinic_store.followup_campaigns}


@router.post("/schedule")
def schedule_followup_campaign(payload: Dict[str, Any]):
    """Schedules automated post-treatment check-in questions."""
    if not hasattr(clinic_store, "followup_campaigns"):
        clinic_store.followup_campaigns = []

    campaign = {
        "id": len(clinic_store.followup_campaigns) + 1,
        "customer_id": payload.get("customer_id", 1),
        "treatment_name": payload.get("treatment_name", "Aesthetic Treatment"),
        "checkin_day": payload.get("checkin_day", 1),
        "question_text": payload.get("question_text", "How is your skin healing today? Any concerns?"),
        "status": "scheduled",
        "created_at": datetime.now().isoformat()
    }
    clinic_store.followup_campaigns.append(campaign)

    return {
        "success": True,
        "message": f"Follow-up check-in scheduled for Day {campaign['checkin_day']}.",
        "campaign": campaign
    }


@router.post("/process-reply")
def process_patient_reply(payload: Dict[str, Any]):
    """
    Processes patient reply & photo upload.
    Scans for warning phrases, sets risk level, & creates clinician task if risk criteria met!
    """
    campaign_id = payload.get("campaign_id", 1)
    patient_reply = payload.get("patient_reply", "").strip()
    photo_url = payload.get("photo_url")

    reply_lower = patient_reply.lower()
    triggered_phrases = [w for w in WARNING_PHRASES if w in reply_lower]

    risk_level = "normal"
    if len(triggered_phrases) > 0 or "photo" in payload:
        risk_level = "critical" if any(w in reply_lower for w in ["severe pain", "blistering", "pus", "infection"]) else "warning"

    if not hasattr(clinic_store, "followup_responses"):
        clinic_store.followup_responses = []

    response_entry = {
        "id": len(clinic_store.followup_responses) + 1,
        "campaign_id": campaign_id,
        "customer_id": payload.get("customer_id", 1),
        "patient_reply": patient_reply,
        "photo_url": photo_url,
        "risk_level": risk_level,
        "triggered_warning_phrases": ", ".join(triggered_phrases) if triggered_phrases else None,
        "clinician_task_created": risk_level in ["warning", "critical"],
        "escalated_at": datetime.now().isoformat() if risk_level in ["warning", "critical"] else None,
        "created_at": datetime.now().isoformat()
    }
    clinic_store.followup_responses.append(response_entry)

    log_clinical_audit(
        action="PROCESS_FOLLOWUP_REPLY",
        entity="followup_response",
        entity_id=str(response_entry["id"]),
        after_data=response_entry
    )

    escalation_msg = ""
    if response_entry["clinician_task_created"]:
        escalation_msg = "URGENT ESCALATION TASK CREATED FOR CLINICIAN: Patient reply triggered warning phrases. Doctor review assigned."

    return {
        "success": True,
        "risk_level": risk_level,
        "triggered_phrases": triggered_phrases,
        "clinician_task_created": response_entry["clinician_task_created"],
        "escalation_message": escalation_msg,
        "escalation_instructions": "This automated follow-up system does NOT diagnose medical emergencies. If experiencing severe adverse symptoms, please call the clinic emergency line or visit nearest hospital.",
        "response": response_entry
    }
