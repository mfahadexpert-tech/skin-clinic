"""
==============================================================================
SkinLab AI - Prescription & Laboratory Workflow Router
==============================================================================
Handles:
1. Prescription Builder (Medication, Dose, Frequency, Duration, Instructions).
2. Doctor Approval & Role Authorization.
3. Laboratory Requests & Abnormal Result Flagging.
4. Printable Prescription & Lab Request Formats.
==============================================================================
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
from datetime import datetime
from database.supabase_client import clinic_store
from security.auth_middleware import require_roles

router = APIRouter(prefix="/api/rx", tags=["Prescriptions & Labs"])


@router.get("/patient/{patient_id}")
def get_patient_rx_and_labs(patient_id: int):
    """Returns all prescriptions and lab requests for a patient."""
    if not hasattr(clinic_store, "prescriptions"):
        clinic_store.prescriptions = [
            {
                "id": 1,
                "customer_id": patient_id,
                "doctor_id": 1,
                "doctor_name": "Dr. Sarah Khan",
                "clinical_diagnosis": "Post-laser recovery & mild acne vulgaris",
                "allergies_snapshot": "None reported",
                "medications_json": [
                    {"medication": "DermaShield SPF 60", "dose": "Apply liberally", "frequency": "Every 4 hours", "duration": "14 days", "instructions": "Mandatory sun avoidance"},
                    {"medication": "Clindamycin Gel 1%", "dose": "Pea size", "frequency": "Twice daily", "duration": "10 days", "instructions": "Apply to affected acne zones"}
                ],
                "status": "approved",
                "is_approved": True,
                "created_at": datetime.now().isoformat()
            }
        ]

    if not hasattr(clinic_store, "lab_requests"):
        clinic_store.lab_requests = [
            {
                "id": 1,
                "customer_id": patient_id,
                "doctor_id": 1,
                "doctor_name": "Dr. Sarah Khan",
                "tests_requested": "Hormonal Acne Profile (Free Testosterone, DHEA-S, Thyroid TSH)",
                "result_notes": "Completed by Chughtai Lab",
                "has_abnormal_result": True,
                "abnormal_flags": "Elevated Free Testosterone (4.2 ng/dL) - Advise PCOS evaluation",
                "status": "completed",
                "follow_up_task": "Schedule PCOS Endocrinology Consultation",
                "created_at": datetime.now().isoformat()
            }
        ]

    rx_list = [r for r in clinic_store.prescriptions if r["customer_id"] == patient_id]
    labs_list = [l for l in clinic_store.lab_requests if l["customer_id"] == patient_id]

    return {
        "success": True,
        "prescriptions": rx_list,
        "lab_requests": labs_list
    }


@router.post("/create-prescription")
def create_prescription(payload: Dict[str, Any]):
    """Creates a draft prescription with medication details and dosage."""
    if not hasattr(clinic_store, "prescriptions"):
        clinic_store.prescriptions = []

    patient_id = payload.get("customer_id", 1)
    patient = next((c for c in clinic_store.customers if c["id"] == patient_id), None)
    allergies = patient["allergies"] if patient else "None reported"

    doctor_id = payload.get("doctor_id", 1)
    doctor = next((e for e in clinic_store.employees if e["id"] == doctor_id), None)
    doctor_name = doctor["name"] if doctor else "Attending Doctor"

    new_rx = {
        "id": len(clinic_store.prescriptions) + 1,
        "customer_id": patient_id,
        "customer_name": patient["name"] if patient else "Patient",
        "doctor_id": doctor_id,
        "doctor_name": doctor_name,
        "clinical_diagnosis": payload.get("clinical_diagnosis", "Aesthetic Skin Consultation"),
        "allergies_snapshot": allergies,
        "medications_json": payload.get("medications_json", []),
        "status": "draft",
        "is_approved": False,
        "created_at": datetime.now().isoformat()
    }
    clinic_store.prescriptions.append(new_rx)

    return {
        "success": True,
        "message": "Prescription draft created successfully.",
        "prescription": new_rx
    }


@router.post("/approve-prescription")
def approve_prescription(
    payload: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(require_roles(["owner", "admin", "doctor"]))
):
    """
    Doctor Approval endpoint. Enforces role security so only Doctor/Admin can approve prescriptions.
    """
    rx_id = payload.get("prescription_id")
    rx = next((r for r in getattr(clinic_store, "prescriptions", []) if r["id"] == rx_id), None)
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription record not found.")

    rx["status"] = "approved"
    rx["is_approved"] = True
    rx["approved_by_doctor"] = current_user.get("full_name", "Authorized Doctor")
    rx["approved_at"] = datetime.now().isoformat()

    return {
        "success": True,
        "message": f"Prescription #{rx_id} approved and signed off by {rx['approved_by_doctor']}.",
        "prescription": rx
    }


@router.post("/create-lab-request")
def create_lab_request(payload: Dict[str, Any]):
    """Creates a laboratory request for a patient."""
    if not hasattr(clinic_store, "lab_requests"):
        clinic_store.lab_requests = []

    new_lab = {
        "id": len(clinic_store.lab_requests) + 1,
        "customer_id": payload.get("customer_id", 1),
        "doctor_id": payload.get("doctor_id", 1),
        "doctor_name": "Dr. Sarah Khan",
        "tests_requested": payload.get("tests_requested", "Full Blood Count, Hormonal Panel"),
        "result_notes": None,
        "has_abnormal_result": False,
        "abnormal_flags": None,
        "status": "requested",
        "follow_up_task": payload.get("follow_up_task", "Review lab results upon completion"),
        "created_at": datetime.now().isoformat()
    }
    clinic_store.lab_requests.append(new_lab)

    return {
        "success": True,
        "message": "Laboratory test request created successfully.",
        "lab_request": new_lab
    }


@router.post("/upload-lab-result")
def upload_lab_result(payload: Dict[str, Any]):
    """Uploads lab results, sets abnormal result flags, and schedules follow-up tasks."""
    lab_id = payload.get("lab_id")
    lab = next((l for l in getattr(clinic_store, "lab_requests", []) if l["id"] == lab_id), None)
    if not lab:
        raise HTTPException(status_code=404, detail="Lab request record not found.")

    has_abnormal = payload.get("has_abnormal_result", False)

    lab["result_notes"] = payload.get("result_notes", "Lab results uploaded.")
    lab["has_abnormal_result"] = has_abnormal
    lab["abnormal_flags"] = payload.get("abnormal_flags") if has_abnormal else None
    lab["status"] = "abnormal" if has_abnormal else "completed"
    lab["follow_up_task"] = payload.get("follow_up_task", "Review follow-up care plan")

    return {
        "success": True,
        "message": "Lab result uploaded successfully.",
        "lab_request": lab
    }
