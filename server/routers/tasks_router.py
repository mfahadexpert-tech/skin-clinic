"""
==============================================================================
SkinLab AI - Staff Task Management & Automated Clinical Triggers Router
==============================================================================
Handles:
1. Internal tasks for Receptionists, Doctors, and Managers.
2. Patient & appointment linking, priority levels, due dates, checklists, & comments.
3. Automated task generation from:
   - Adverse Events
   - Abnormal Lab Results
   - Unread Patient Messages
   - Failed Communications
   - Overdue Payments
==============================================================================
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from database.supabase_client import clinic_store
from security.audit_logger import log_clinical_audit

router = APIRouter(prefix="/api/tasks", tags=["Staff Task Management"])


@router.get("/")
def list_staff_tasks(role: Optional[str] = None):
    """Lists internal tasks, optionally filtered by staff role."""
    if not hasattr(clinic_store, "staff_tasks"):
        clinic_store.staff_tasks = [
            {
                "id": 1,
                "title": "URGENT: Review Abnormal Free Testosterone Result",
                "assigned_role": "doctor",
                "customer_id": 1,
                "customer_name": "Ayesha Khan",
                "priority": "urgent",
                "status": "pending",
                "trigger_source": "abnormal_lab",
                "description": "Elevated Free Testosterone (4.2 ng/dL). Schedule PCOS endocrinology consult.",
                "due_date": (datetime.now() + timedelta(hours=12)).isoformat(),
                "comments": []
            },
            {
                "id": 2,
                "title": "Follow-Up: 24h Post TCA Peel Redness Check",
                "assigned_role": "doctor",
                "customer_id": 1,
                "customer_name": "Ayesha Khan",
                "priority": "high",
                "status": "in_progress",
                "trigger_source": "adverse_event",
                "description": "Check erythema resolution on cheek zone.",
                "due_date": (datetime.now() + timedelta(hours=24)).isoformat(),
                "comments": []
            },
            {
                "id": 3,
                "title": "Collect Outstanding Payment Balance PKR 1,200",
                "assigned_role": "receptionist",
                "customer_id": 1,
                "customer_name": "Ayesha Khan",
                "priority": "medium",
                "status": "pending",
                "trigger_source": "overdue_payment",
                "description": "Unpaid deposit balance from Session 2 booking.",
                "due_date": (datetime.now() + timedelta(days=1)).isoformat(),
                "comments": []
            }
        ]

    tasks = clinic_store.staff_tasks
    if role:
        tasks = [t for t in tasks if t["assigned_role"] == role]

    return {"success": True, "count": len(tasks), "tasks": tasks}


@router.post("/create")
def create_staff_task(payload: Dict[str, Any]):
    """Creates a manual or automated internal staff task."""
    if not hasattr(clinic_store, "staff_tasks"):
        clinic_store.staff_tasks = []

    patient_id = payload.get("customer_id", 1)
    patient = next((c for c in clinic_store.customers if c["id"] == patient_id), None)

    task = {
        "id": len(clinic_store.staff_tasks) + 1,
        "title": payload.get("title", "Clinical Follow-Up Task"),
        "description": payload.get("description", "Task notes"),
        "assigned_role": payload.get("assigned_role", "receptionist"),
        "customer_id": patient_id,
        "customer_name": patient["name"] if patient else "Patient",
        "appointment_id": payload.get("appointment_id"),
        "priority": payload.get("priority", "medium"),
        "status": "pending",
        "trigger_source": payload.get("trigger_source", "manual"),
        "due_date": payload.get("due_date", (datetime.now() + timedelta(days=1)).isoformat()),
        "comments": [],
        "created_at": datetime.now().isoformat()
    }
    clinic_store.staff_tasks.append(task)

    log_clinical_audit(
        action="CREATE_STAFF_TASK",
        entity="staff_task",
        entity_id=str(task["id"]),
        after_data=task
    )

    return {"success": True, "message": "Staff task created successfully.", "task": task}


@router.post("/auto-trigger")
def auto_trigger_clinical_task(payload: Dict[str, Any]):
    """
    Automatically generates tasks from Adverse Events, Abnormal Labs,
    Unread Messages, Failed Communications, or Overdue Payments!
    """
    trigger_source = payload.get("trigger_source", "adverse_event")
    patient_id = payload.get("customer_id", 1)
    patient = next((c for c in clinic_store.customers if c["id"] == patient_id), None)

    role_mapping = {
        "adverse_event": ("doctor", "urgent", "URGENT: Adverse Event Clinical Follow-Up Required"),
        "abnormal_lab": ("doctor", "urgent", "URGENT: Review Abnormal Laboratory Results"),
        "unread_message": ("receptionist", "high", "Unread Patient Message Overdue for Reply"),
        "failed_comm": ("receptionist", "medium", "Failed Communication Dispatch - Retry Delivery"),
        "overdue_payment": ("manager", "high", "Outstanding Payment Balance Recovery Required")
    }

    assigned_role, priority, default_title = role_mapping.get(
        trigger_source, ("receptionist", "medium", "Automated System Trigger Task")
    )

    task = {
        "id": len(getattr(clinic_store, "staff_tasks", [])) + 1,
        "title": payload.get("title", default_title),
        "description": payload.get("description", f"Automated trigger generated from {trigger_source}."),
        "assigned_role": assigned_role,
        "customer_id": patient_id,
        "customer_name": patient["name"] if patient else "Patient",
        "priority": priority,
        "status": "pending",
        "trigger_source": trigger_source,
        "due_date": (datetime.now() + timedelta(hours=12)).isoformat(),
        "comments": [],
        "created_at": datetime.now().isoformat()
    }

    if not hasattr(clinic_store, "staff_tasks"):
        clinic_store.staff_tasks = []
    clinic_store.staff_tasks.append(task)

    return {"success": True, "message": f"Automated task created for {assigned_role} via trigger '{trigger_source}'.", "task": task}


@router.post("/update-status")
def update_task_status(payload: Dict[str, Any]):
    """Updates task status (pending, in_progress, completed)."""
    task_id = payload.get("task_id")
    new_status = payload.get("status", "completed")

    task = next((t for t in getattr(clinic_store, "staff_tasks", []) if t["id"] == task_id), None)
    if not task:
        raise HTTPException(status_code=404, detail="Task record not found.")

    task["status"] = new_status
    task["updated_at"] = datetime.now().isoformat()

    return {"success": True, "message": f"Task #{task_id} updated to '{new_status}'.", "task": task}


@router.post("/add-comment")
def add_task_comment(payload: Dict[str, Any]):
    """Appends staff discussion comments to a task."""
    task_id = payload.get("task_id")
    comment_text = payload.get("comment_text", "").strip()

    task = next((t for t in getattr(clinic_store, "staff_tasks", []) if t["id"] == task_id), None)
    if not task:
        raise HTTPException(status_code=404, detail="Task record not found.")

    comment_entry = {
        "staff_name": payload.get("staff_name", "Clinical Staff"),
        "comment_text": comment_text,
        "timestamp": datetime.now().isoformat()
    }
    if "comments" not in task:
        task["comments"] = []
    task["comments"].append(comment_entry)

    return {"success": True, "message": "Task discussion comment added.", "comment": comment_entry}
