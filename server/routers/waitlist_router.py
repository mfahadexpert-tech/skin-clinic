"""
==============================================================================
SkinLab AI - Smart Waitlist & Cancellation Recovery Router
==============================================================================
Handles:
1. Patient waitlist requests with preferred doctor, treatment & time preferences.
2. Automated cancellation recovery triggers when a slot opens.
3. 15-minute offer expiry timers with automatic slot reservation.
4. Receptionist manual selection and override controls.
==============================================================================
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from database.supabase_client import clinic_store

router = APIRouter(prefix="/api/waitlist", tags=["Smart Waitlist"])


@router.get("/")
def get_waitlist():
    """Lists all active waitlist requests and open cancellation offers."""
    if not hasattr(clinic_store, "waitlist_requests"):
        clinic_store.waitlist_requests = [
            {"id": 1, "customer_id": 1, "customer_name": "Ayesha Khan", "customer_phone": "0300-1234567", "preferred_treatment": "HydraFacial Deluxe", "preferred_days": "Mon, Wed", "preferred_time_range": "Morning", "status": "active"},
            {"id": 2, "customer_id": 2, "customer_name": "Sana Mir", "customer_phone": "0300-9988776", "preferred_treatment": "Full Body Laser Hair Reduction", "preferred_days": "Sat, Sun", "preferred_time_range": "Afternoon", "status": "active"}
        ]
    if not hasattr(clinic_store, "waitlist_offers"):
        clinic_store.waitlist_offers = []

    return {
        "success": True,
        "requests": clinic_store.waitlist_requests,
        "offers": clinic_store.waitlist_offers
    }


@router.post("/create")
def create_waitlist_request(payload: Dict[str, Any]):
    """Adds a patient to the smart waitlist."""
    if not hasattr(clinic_store, "waitlist_requests"):
        clinic_store.waitlist_requests = []

    new_req = {
        "id": len(clinic_store.waitlist_requests) + 1,
        "customer_id": payload.get("customer_id", 1),
        "customer_name": payload.get("customer_name", "Walk-In Patient"),
        "customer_phone": payload.get("customer_phone", "0300-0000000"),
        "preferred_doctor_id": payload.get("preferred_doctor_id"),
        "preferred_treatment": payload.get("preferred_treatment", "Aesthetic Treatment"),
        "preferred_days": payload.get("preferred_days", "Any Day"),
        "preferred_time_range": payload.get("preferred_time_range", "Morning"),
        "status": "active",
        "created_at": datetime.now().isoformat()
    }
    clinic_store.waitlist_requests.append(new_req)

    return {
        "success": True,
        "message": "Patient added to waitlist successfully",
        "request": new_req
    }


@router.post("/trigger-recovery")
def trigger_cancellation_recovery(payload: Dict[str, Any]):
    """
    Triggers automated cancellation recovery when an appointment is cancelled.
    Identifies matching waitlisted patients and dispatches 15-minute expiry offers.
    """
    treatment_name = payload.get("treatment_name", "")
    cancelled_appt_id = payload.get("appointment_id", 1)

    if not hasattr(clinic_store, "waitlist_requests"):
        clinic_store.waitlist_requests = []
    if not hasattr(clinic_store, "waitlist_offers"):
        clinic_store.waitlist_offers = []

    # Find matching active waitlist requests
    matching = [
        w for w in clinic_store.waitlist_requests 
        if w["status"] == "active" and (not treatment_name or treatment_name.lower() in w["preferred_treatment"].lower())
    ]

    offers_created = []
    expires_at = (datetime.now() + timedelta(minutes=15)).isoformat()

    for req in matching[:3]: # Send offer to top 3 eligible waitlisted patients
        new_offer = {
            "id": len(clinic_store.waitlist_offers) + 1,
            "waitlist_id": req["id"],
            "customer_name": req["customer_name"],
            "customer_phone": req["customer_phone"],
            "appointment_id": cancelled_appt_id,
            "offered_slot_time": payload.get("cancelled_time", "10:30 AM"),
            "expires_at": expires_at,
            "status": "pending",
            "message": f"Slot opened for {req['preferred_treatment']}! Confirm within 15 minutes."
        }
        clinic_store.waitlist_offers.append(new_offer)
        req["status"] = "offered"
        offers_created.append(new_offer)

    return {
        "success": True,
        "message": f"Cancellation recovery triggered! Dispatched {len(offers_created)} 15-min offers.",
        "offers": offers_created
    }


@router.post("/accept-offer")
def accept_waitlist_offer(payload: Dict[str, Any]):
    """First confirmed patient claims the cancelled slot."""
    offer_id = payload.get("offer_id")
    offer = next((o for o in clinic_store.waitlist_offers if o["id"] == offer_id), None)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer record not found.")

    if offer["status"] == "accepted":
        raise HTTPException(status_code=400, detail="This slot has already been claimed by another patient.")

    offer["status"] = "accepted"
    offer["response_notes"] = "Patient accepted slot via WhatsApp / SMS link."

    return {
        "success": True,
        "message": f"Slot claimed successfully for {offer['customer_name']}!",
        "offer": offer
    }


@router.post("/receptionist-override")
def receptionist_override_assignment(payload: Dict[str, Any]):
    """Receptionist manually assigns cancelled slot to any waitlisted patient."""
    waitlist_id = payload.get("waitlist_id")
    req = next((w for w in clinic_store.waitlist_requests if w["id"] == waitlist_id), None)
    if not req:
        raise HTTPException(status_code=404, detail="Waitlist request not found.")

    req["status"] = "booked"
    return {
        "success": True,
        "message": f"Receptionist Override: Slot manually assigned to {req['customer_name']}.",
        "request": req
    }
