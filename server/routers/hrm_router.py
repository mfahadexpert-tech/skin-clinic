"""
==============================================================================
SkinLab AI - HRM & Clinic Staff / Practitioner Management Router
==============================================================================
Handles:
1. Practitioner profiles (Doctors, Dermatologists, Laser Techs, Receptionists).
2. Registering new doctors & specialists with custom shift hours & commission rates.
3. Performance incentives / commission calculation on executed procedures.
==============================================================================
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from database.supabase_client import clinic_store

router = APIRouter(prefix="/api/hrm", tags=["HRM & Staff"])


@router.get("/staff")
def list_staff_members():
    """Returns directory of all aesthetic doctors, laser techs, and staff."""
    enhanced_staff = []
    for emp in clinic_store.employees:
        doctor_sales = [s for s in clinic_store.sales if s.get("doctor_id") == emp["id"]]
        gross_sales = sum(s.get("grand_total", 0) for s in doctor_sales)
        commission = gross_sales * (emp.get("commission_rate", 0) / 100.0)

        item = dict(emp)
        item["total_procedures_count"] = len(doctor_sales)
        item["gross_sales_generated"] = gross_sales
        item["commission_earned_pkr"] = commission
        enhanced_staff.append(item)

    return {
        "success": True,
        "departments": clinic_store.departments,
        "staff": enhanced_staff
    }


@router.post("/staff/create")
def create_staff_doctor(payload: Dict[str, Any]):
    """
    Registers a new Doctor / Specialist / Practitioner into the clinic roster.
    """
    name = payload.get("name", "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Doctor name is required.")

    designation = payload.get("designation", "Consultant Dermatologist")
    specialization = payload.get("specialization", "Aesthetic & Laser Medicine")
    phone = payload.get("phone", "0300-0000000")
    shift_start = payload.get("shift_start", "10:00")
    shift_end = payload.get("shift_end", "18:00")
    commission_rate = float(payload.get("commission_rate", 10.0))

    new_doc = {
        "id": len(clinic_store.employees) + 1,
        "name": name if name.startswith("Dr.") else f"Dr. {name}",
        "designation": designation,
        "specialization": specialization,
        "phone": phone,
        "department_id": 1,
        "shift_start": shift_start,
        "shift_end": shift_end,
        "commission_rate": commission_rate,
        "is_active": True
    }
    clinic_store.employees.append(new_doc)

    return {
        "success": True,
        "message": "Doctor registered successfully",
        "doctor": new_doc,
        "doctors": clinic_store.employees
    }
