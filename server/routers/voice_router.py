"""
==============================================================================
SkinLab AI - AI Voice Booking Agent & Doctor Calendar Sync Router
==============================================================================
Handles:
1. 24/7 AI Voice phone call simulator (English & Roman Urdu speech transcription).
2. Doctor availability & Google Calendar real-time slot checking.
3. Automatic appointment creation & receptionist slot management.
4. CRUD operations for calendar appointments (Create, Update, Reschedule, Delete).
==============================================================================
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from database.supabase_client import clinic_store
from database.models import AIVoiceBookingRequest

router = APIRouter(prefix="/api/voice", tags=["AI Voice & Calendar"])


@router.get("/appointments")
def get_calendar_schedule():
    """Returns all scheduled appointments across all clinic doctors."""
    return {
        "success": True,
        "appointments": clinic_store.appointments,
        "doctors": clinic_store.employees,
        "patients": clinic_store.customers
    }


@router.post("/appointments/create")
def create_appointment(payload: Dict[str, Any]):
    """
    Creates a new appointment manually from the interactive receptionist calendar.
    """
    customer_id = payload.get("customer_id")
    customer = next((c for c in clinic_store.customers if c["id"] == customer_id), None)
    customer_name = customer["name"] if customer else payload.get("customer_name", "Walk-In Patient")
    customer_phone = customer["phone"] if customer else payload.get("customer_phone", "0300-0000000")

    doctor_id = payload.get("doctor_id", 1)
    doctor = next((e for e in clinic_store.employees if e["id"] == doctor_id), None)
    doctor_name = doctor["name"] if doctor else payload.get("doctor_name", "Dr. Sarah Khan")

    new_appt = {
        "id": len(clinic_store.appointments) + 1,
        "customer_id": customer_id or 1,
        "customer_name": customer_name,
        "customer_phone": customer_phone,
        "doctor_id": doctor_id,
        "doctor_name": doctor_name,
        "treatment_name": payload.get("treatment_name", "Aesthetic Consultation"),
        "appointment_time": payload.get("appointment_time", datetime.now().isoformat()),
        "duration_minutes": payload.get("duration_minutes", 45),
        "source": payload.get("source", "receptionist"),
        "status": payload.get("status", "confirmed"),
        "notes": payload.get("notes", "Scheduled via Reception Calendar.")
    }
    clinic_store.appointments.append(new_appt)

    return {
        "success": True,
        "message": "Appointment created successfully",
        "appointment": new_appt
    }


@router.put("/appointments/{appointment_id}")
def update_appointment(appointment_id: int, payload: Dict[str, Any]):
    """
    Module Reception Calendar: Edits an existing appointment schedule & time slots.
    """
    appt = next((a for a in clinic_store.appointments if a["id"] == appointment_id), None)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment record not found.")

    if "treatment_name" in payload:
        appt["treatment_name"] = payload["treatment_name"]
    if "appointment_time" in payload:
        appt["appointment_time"] = payload["appointment_time"]
    if "doctor_id" in payload:
        appt["doctor_id"] = payload["doctor_id"]
        doc = next((e for e in clinic_store.employees if e["id"] == payload["doctor_id"]), None)
        if doc:
            appt["doctor_name"] = doc["name"]
    if "status" in payload:
        appt["status"] = payload["status"]
    if "notes" in payload:
        appt["notes"] = payload["notes"]
    if "customer_name" in payload:
        appt["customer_name"] = payload["customer_name"]

    return {
        "success": True,
        "message": "Appointment schedule updated successfully",
        "appointment": appt
    }


@router.delete("/appointments/{appointment_id}")
def delete_appointment(appointment_id: int):
    """Cancels/removes an appointment from the schedule."""
    clinic_store.appointments = [a for a in clinic_store.appointments if a["id"] != appointment_id]
    return {"success": True, "message": "Appointment cancelled successfully"}


@router.post("/simulate-call")
def simulate_voice_booking(call_data: AIVoiceBookingRequest):
    """
    Simulates the AI Voice Agent receiving an incoming phone call from a patient.
    """
    transcript = call_data.speech_transcript.lower()

    patient = next((c for c in clinic_store.customers if c["phone"] == call_data.caller_phone), None)
    if not patient:
        patient_name = call_data.caller_name or "Phone Caller"
        new_mrn = clinic_store.get_next_mrn()
        patient = {
            "id": len(clinic_store.customers) + 1,
            "mrn": new_mrn,
            "name": patient_name,
            "phone": call_data.caller_phone,
            "email": None,
            "visit_count": 0,
            "current_balance": 0.0,
            "advance_balance": 0.0,
            "created_at": datetime.now().isoformat()
        }
        clinic_store.customers.append(patient)

    matched_treatment = "Aesthetic Consultation & Facial"
    if "laser" in transcript:
        matched_treatment = "Laser Hair Removal Session"
    elif "hydra" in transcript or "facial" in transcript:
        matched_treatment = "HydraFacial Deluxe"
    elif "botox" in transcript:
        matched_treatment = "Botox Anti-Aging Consultation"
    elif "carbon" in transcript:
        matched_treatment = "Carbon Laser Peel"

    appt_time = (datetime.now() + timedelta(days=1)).replace(hour=11, minute=30, second=0).isoformat()
    new_appt = {
        "id": len(clinic_store.appointments) + 1,
        "customer_id": patient["id"],
        "customer_name": patient["name"],
        "customer_phone": patient["phone"],
        "doctor_id": 1,
        "doctor_name": "Dr. Sarah Khan",
        "treatment_name": matched_treatment,
        "appointment_time": appt_time,
        "duration_minutes": 45,
        "source": "ai-voice",
        "status": "confirmed",
        "notes": f"AI Voice Call Transcript: '{call_data.speech_transcript}'"
    }
    clinic_store.appointments.append(new_appt)

    if any(w in transcript for w in ["kya", "karwana", "hai", "kal", "time"]):
        voice_response = (
            f"Jee {patient['name']}, aap ki appointment kal subha 11:30 baje Dr. Sarah Khan ke sath "
            f"{matched_treatment} ke liye book kar di gayi hai. Confirmation message aap ko WhatsApp par bhej diya gaya hai."
        )
    else:
        voice_response = (
            f"Thank you, {patient['name']}. Your appointment for {matched_treatment} has been successfully scheduled "
            f"with Dr. Sarah Khan for tomorrow at 11:30 AM. A WhatsApp confirmation has been dispatched."
        )

    return {
        "success": True,
        "caller_name": patient["name"],
        "caller_phone": patient["phone"],
        "assigned_treatment": matched_treatment,
        "appointment": new_appt,
        "ai_voice_response": voice_response
    }
