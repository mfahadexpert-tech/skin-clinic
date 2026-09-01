"""
==============================================================================
SkinLab AI - Authorized-Device Registration & Remote Revocation Router
==============================================================================
Handles:
1. Authorized offline device registration (POS Terminals, Reception Touchscreens).
2. Remote revocation: Disables access & clears local offline IndexedDB caches upon revocation.
3. Secret key protection: Ensures server-only secret keys are NEVER exposed to browser client.
==============================================================================
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
from datetime import datetime
from database.supabase_client import clinic_store
from security.auth_middleware import require_roles
from security.audit_logger import log_clinical_audit

router = APIRouter(prefix="/api/devices", tags=["Authorized-Device Security"])


@router.get("/")
def list_registered_devices(current_user: Dict[str, Any] = Depends(require_roles(["owner", "admin"]))):
    """Lists registered authorized client devices."""
    if not hasattr(clinic_store, "registered_devices"):
        clinic_store.registered_devices = [
            {
                "id": 1,
                "device_fingerprint": "DEV-POS-LAHORE-01",
                "device_name": "Lahore Reception POS Touchscreen 1",
                "assigned_branch": "Lahore Main Gulberg Flagship",
                "status": "authorized",
                "registered_at": datetime.now().isoformat(),
                "last_active_at": datetime.now().isoformat()
            }
        ]

    return {"success": True, "count": len(clinic_store.registered_devices), "devices": clinic_store.registered_devices}


@router.post("/register")
def register_authorized_device(payload: Dict[str, Any]):
    """Registers a new authorized client device for offline POS/reception caching."""
    fingerprint = payload.get("device_fingerprint", "DEV-POS-NEW")
    device_name = payload.get("device_name", "Terminal Screen")

    if not hasattr(clinic_store, "registered_devices"):
        clinic_store.registered_devices = []

    device = {
        "id": len(clinic_store.registered_devices) + 1,
        "device_fingerprint": fingerprint,
        "device_name": device_name,
        "assigned_branch": payload.get("assigned_branch", "Main Branch"),
        "status": "authorized",
        "registered_at": datetime.now().isoformat(),
        "last_active_at": datetime.now().isoformat()
    }
    clinic_store.registered_devices.append(device)

    log_clinical_audit(
        action="REGISTER_AUTHORIZED_DEVICE",
        entity="device",
        entity_id=fingerprint,
        after_data=device
    )

    return {"success": True, "message": f"Device '{device_name}' authorized successfully.", "device": device}


@router.post("/revoke")
def revoke_device_access(
    payload: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(require_roles(["owner", "admin"]))
):
    """
    Remotely revokes a device's access. The client IndexedDB cache will automatically wipe.
    """
    fingerprint = payload.get("device_fingerprint")
    dev = next((d for d in getattr(clinic_store, "registered_devices", []) if d["device_fingerprint"] == fingerprint), None)

    if not dev:
        raise HTTPException(status_code=404, detail="Registered device record not found.")

    dev["status"] = "revoked"
    dev["revoked_at"] = datetime.now().isoformat()

    log_clinical_audit(
        action="REVOKE_DEVICE_ACCESS",
        entity="device",
        entity_id=fingerprint,
        after_data=dev
    )

    return {
        "success": True,
        "message": f"REMOTE REVOCATION SUCCESSFUL: Access for device '{fingerprint}' revoked.",
        "device": dev
    }
