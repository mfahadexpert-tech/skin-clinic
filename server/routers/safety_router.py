"""
==============================================================================
SkinLab AI - Deterministic Safety Engine Router
==============================================================================
Handles:
1. Evaluating 10 deterministic clinical safety rules independently of LLM.
2. Returning separate arrays for blocking errors vs informational warnings.
3. Auditing rule overrides with timestamped doctor rationales.
==============================================================================
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List, Optional
from datetime import datetime
from database.supabase_client import clinic_store
from security.safety_engine import evaluate_clinical_safety
from security.audit_logger import log_clinical_audit

router = APIRouter(prefix="/api/safety", tags=["Deterministic Safety Engine"])


@router.post("/evaluate")
def evaluate_safety(payload: Dict[str, Any]):
    """
    Evaluates patient & treatment against 10 deterministic clinical safety rules.
    """
    customer_id = payload.get("customer_id", 1)
    treatment_name = payload.get("treatment_name", "Aesthetic Treatment")
    doctor_id = payload.get("doctor_id", 1)

    res = evaluate_clinical_safety(
        customer_id=customer_id,
        treatment_name=treatment_name,
        doctor_id=doctor_id,
        medical_history=payload.get("medical_history")
    )
    return res


@router.post("/override")
def record_safety_override(payload: Dict[str, Any]):
    """
    Records an audited override for a blocking safety error with doctor rationale.
    """
    rule_code = payload.get("rule_code")
    override_reason = payload.get("override_reason", "").strip()

    if not override_reason:
        raise HTTPException(status_code=400, detail="Override reason is mandatory for clinical safety rule overrides.")

    override_record = {
        "id": len(getattr(clinic_store, "safety_overrides", [])) + 1,
        "customer_id": payload.get("customer_id", 1),
        "doctor_id": payload.get("doctor_id", 1),
        "rule_code": rule_code,
        "override_reason": override_reason,
        "timestamp": datetime.now().isoformat()
    }

    if not hasattr(clinic_store, "safety_overrides"):
        clinic_store.safety_overrides = []
    clinic_store.safety_overrides.append(override_record)

    log_clinical_audit(
        action="SAFETY_RULE_OVERRIDE",
        entity="safety_rule",
        entity_id=rule_code,
        after_data=override_record
    )

    return {
        "success": True,
        "message": f"Audited override recorded for rule '{rule_code}'.",
        "override": override_record
    }
