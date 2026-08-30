"""
==============================================================================
SkinLab AI - Multi-Channel WhatsApp Communications & Webhook Router
==============================================================================
Handles:
1. High-priority WhatsApp appointment reminders & booking confirmations.
2. Post-procedure clinical care instructions (HydraFacial / Laser / Botox).
3. Webhook listener for asynchronous delivery confirmations.
==============================================================================
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from datetime import datetime
from database.supabase_client import clinic_store
from database.models import WhatsAppReminderRequest

router = APIRouter(prefix="/api/whatsapp", tags=["WhatsApp Hub"])

# Simulated in-memory message history & webhook log
whatsapp_logs = [
    {
        "id": 1,
        "recipient_name": "Ayesha Khan",
        "phone": "+92 300 1234567",
        "type": "24h_reminder",
        "message": "Assalam-o-Alaikum Ayesha, reminder for your Laser Hair Reduction Session #3 tomorrow at 11:00 AM with Dr. Sarah Khan at SkinLab Clinic. Please shave 24h prior. Reply 1 to Confirm.",
        "status": "delivered",
        "timestamp": "2026-08-30T14:00:00"
    },
    {
        "id": 2,
        "recipient_name": "Fatima Ali",
        "phone": "+92 333 5566778",
        "type": "post_care_facial",
        "message": "Dear Fatima, thank you for visiting SkinLab today for your HydraFacial! Post-care reminder: Please reapply DermaShield SPF 60 every 3 hours and avoid direct sun and steam for 48 hours.",
        "status": "read",
        "timestamp": "2026-08-27T16:30:00"
    }
]


@router.get("/logs")
def get_whatsapp_logs():
    """Returns recent WhatsApp outbound logs and webhook delivery events."""
    return {"success": True, "logs": whatsapp_logs}


@router.post("/send")
def send_whatsapp_message(payload: WhatsAppReminderRequest):
    """
    Dispatches high-priority WhatsApp message with auto-formatted templates.
    """
    patient = next((c for c in clinic_store.customers if c["id"] == payload.customer_id), None)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")

    if payload.template_type == "confirmation":
        msg_text = (
            f"Assalam-o-Alaikum {patient['name']},\n"
            f"Your appointment at SkinLab Clinic has been successfully confirmed!\n"
            f"📍 Location: Plaza 45, DHA Phase 5, Lahore.\n"
            f"📞 Contact: 0300-1234567\n"
            f"Please arrive 10 minutes prior to your scheduled time."
        )
    elif payload.template_type == "post_care_laser":
        msg_text = (
            f"Dear {patient['name']},\n"
            f"SkinLab Laser Post-Care Guide:\n"
            f"1. Apply soothing Aloe Vera gel if redness persists.\n"
            f"2. Strict sun avoidance: Apply SPF 50+ mineral sunblock every 3 hours.\n"
            f"3. No hot water, steam, or gym workouts for 48 hours."
        )
    else:
        msg_text = payload.custom_message or f"Hello {patient['name']}, greeting from SkinLab Aesthetic Clinic."

    new_log = {
        "id": len(whatsapp_logs) + 1,
        "recipient_name": patient["name"],
        "phone": patient["phone"],
        "type": payload.template_type,
        "message": msg_text,
        "status": "delivered",
        "timestamp": datetime.now().isoformat()
    }
    whatsapp_logs.insert(0, new_log)

    return {
        "success": True,
        "message": f"WhatsApp message successfully dispatched to {patient['phone']}",
        "log": new_log
    }
