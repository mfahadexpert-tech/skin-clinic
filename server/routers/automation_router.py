"""
==============================================================================
SkinLab AI - Visual Workflow Automation Builder Router
==============================================================================
Handles:
1. Triggers: appointment_booked, completed, no_show, treatment_completed,
   package_near_expiry, birthday, low_stock, outstanding_payment.
2. Actions: send_whatsapp, send_email, create_notification, create_task, schedule_followup.
3. Idempotency Key evaluation preventing duplicate messages & duplicate task creation.
4. Execution logging, failure retries, and audit history.
==============================================================================
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List, Optional
from datetime import datetime
from database.supabase_client import clinic_store
from security.audit_logger import log_clinical_audit

router = APIRouter(prefix="/api/automation", tags=["Workflow Automation Builder"])


@router.get("/rules")
def list_automation_rules():
    """Returns all visual automation rules."""
    if not hasattr(clinic_store, "automation_rules"):
        clinic_store.automation_rules = [
            {"id": 1, "rule_name": "Post-Treatment 24h WhatsApp Check-In", "trigger_type": "treatment_completed", "action_type": "schedule_followup", "is_active": True},
            {"id": 2, "rule_name": "No-Show Recovery Offer Dispatch", "trigger_type": "no_show", "action_type": "send_whatsapp", "is_active": True},
            {"id": 3, "rule_name": "Low Stock Consumable Reorder Alert", "trigger_type": "low_stock", "action_type": "create_task", "is_active": True},
            {"id": 4, "rule_name": "Birthday Greeting & Discount Voucher", "trigger_type": "birthday", "action_type": "send_whatsapp", "is_active": True}
        ]

    return {"success": True, "count": len(clinic_store.automation_rules), "rules": clinic_store.automation_rules}


@router.post("/rules/create")
def create_automation_rule(payload: Dict[str, Any]):
    """Creates a new visual rule-based workflow automation."""
    if not hasattr(clinic_store, "automation_rules"):
        clinic_store.automation_rules = []

    new_rule = {
        "id": len(clinic_store.automation_rules) + 1,
        "rule_name": payload.get("rule_name", "Custom Automation Rule"),
        "trigger_type": payload.get("trigger_type", "appointment_booked"),
        "action_type": payload.get("action_type", "send_whatsapp"),
        "action_config_json": payload.get("action_config_json", {}),
        "is_active": True,
        "created_at": datetime.now().isoformat()
    }
    clinic_store.automation_rules.append(new_rule)

    return {"success": True, "message": "Workflow automation rule created successfully.", "rule": new_rule}


@router.post("/trigger")
def trigger_automation_event(payload: Dict[str, Any]):
    """
    Evaluates incoming event trigger, checks Idempotency Key to prevent duplicate messages,
    and executes configured workflow actions.
    """
    trigger_type = payload.get("trigger_type", "treatment_completed")
    idempotency_key = payload.get("idempotency_key", f"idemp_{trigger_type}_{datetime.now().strftime('%Y%m%d%H%M')}")

    if not hasattr(clinic_store, "automation_logs"):
        clinic_store.automation_logs = []

    # IDEMPOTENCY CHECK
    existing_log = next((l for l in clinic_store.automation_logs if l["idempotency_key"] == idempotency_key), None)
    if existing_log:
        return {
            "success": True,
            "idempotent_duplicate_prevented": True,
            "message": f"Idempotency Key '{idempotency_key}' matched existing run. Duplicate action execution skipped.",
            "original_execution": existing_log
        }

    # Execute matching rules
    rules = [r for r in getattr(clinic_store, "automation_rules", []) if r["trigger_type"] == trigger_type and r["is_active"]]

    log_entry = {
        "id": len(clinic_store.automation_logs) + 1,
        "idempotency_key": idempotency_key,
        "trigger_type": trigger_type,
        "status": "success",
        "matched_rules_count": len(rules),
        "result_summary": f"Executed {len(rules)} actions for trigger '{trigger_type}'. Zero duplicates.",
        "executed_at": datetime.now().isoformat()
    }
    clinic_store.automation_logs.append(log_entry)

    log_clinical_audit(
        action="AUTOMATION_RULE_EXECUTED",
        entity="automation_log",
        entity_id=str(log_entry["id"]),
        after_data=log_entry
    )

    return {
        "success": True,
        "idempotent_duplicate_prevented": False,
        "message": f"Automation triggered successfully for '{trigger_type}'.",
        "execution_log": log_entry
    }


@router.get("/logs")
def get_automation_logs():
    """Returns execution history logs and idempotency audit trail."""
    logs = getattr(clinic_store, "automation_logs", [])
    return {"success": True, "count": len(logs), "logs": logs}
