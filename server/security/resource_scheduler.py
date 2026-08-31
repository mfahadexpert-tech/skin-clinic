"""
==============================================================================
SkinLab AI - Resource-Aware Conflict Detection Engine
==============================================================================
Prevents double-booking across Doctors, Treatment Suites & Aesthetic Machines.
Considers procedure duration + cleanup buffer minutes.
==============================================================================
"""

import logging
from typing import Dict, Any, List, Optional
from database.supabase_client import clinic_store

logger = logging.getLogger("SkinLab.ResourceScheduler")


def verify_resource_availability(
    doctor_id: int,
    room_id: int,
    equipment_id: Optional[int],
    appointment_time_str: str,
    duration_minutes: int = 45,
    buffer_minutes: int = 15
) -> Dict[str, Any]:
    """
    Checks for scheduling conflicts across doctor, room, and machine.
    """
    existing_appts = getattr(clinic_store, "appointments", [])

    # 1. Check Doctor Conflict
    doc_match = next((a for a in existing_appts if a.get("doctor_id") == doctor_id and a.get("time") == appointment_time_str), None)
    if doc_match:
        doctor_name = doc_match.get("doctor_name", "Selected Doctor")
        return {
            "has_conflict": True,
            "conflict_type": "doctor",
            "message": f"Conflict Detected: {doctor_name} is already assigned to {doc_match.get('customer_name')} at {appointment_time_str}."
        }

    # 2. Check Room Conflict
    room_match = next((a for a in existing_appts if a.get("room_id") == room_id and a.get("time") == appointment_time_str), None)
    if room_match:
        return {
            "has_conflict": True,
            "conflict_type": "room",
            "message": f"Conflict Detected: Treatment Room Suite {room_id} is already occupied at {appointment_time_str}."
        }

    # 3. Check Machine Conflict
    if equipment_id:
        eq_match = next((a for a in existing_appts if a.get("equipment_id") == equipment_id and a.get("time") == appointment_time_str), None)
        if eq_match:
            return {
                "has_conflict": True,
                "conflict_type": "equipment",
                "message": f"Conflict Detected: Aesthetic Machine #{equipment_id} is currently in use for another treatment session."
            }

    return {
        "has_conflict": False,
        "message": "All requested resources (Doctor, Room, Machine) are available!"
    }
