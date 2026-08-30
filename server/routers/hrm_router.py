"""
==============================================================================
SkinLab AI - HRM & Clinic Staff / Practitioner Management Router
==============================================================================
Handles:
1. Practitioner profiles (Doctors, Technicians, Receptionists).
2. Clinic shift scheduling & departments.
3. Performance incentives / commission calculation on executed procedures.
==============================================================================
"""

from fastapi import APIRouter
from typing import Dict, Any, List
from database.supabase_client import clinic_store

router = APIRouter(prefix="/api/hrm", tags=["HRM & Staff"])


@router.get("/staff")
def list_staff_members():
    """Returns directory of all aesthetic doctors, laser techs, and staff."""
    # Calculate simulated commission earned for each doctor
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
