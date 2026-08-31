"""
==============================================================================
SkinLab AI - Clinical Audit Logger Service
==============================================================================
HIPAA-compliant audit logger recording user actions, IP addresses,
and before/after mutation payloads for sensitive clinical operations.
==============================================================================
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime
from database.supabase_client import clinic_store

logger = logging.getLogger("SkinLab.AuditLogger")


def log_clinical_audit(
    action: str,
    entity: str,
    entity_id: Optional[str] = None,
    user_id: Optional[str] = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    user_email: Optional[str] = "admin@skinlab.com",
    clinic_id: Optional[str] = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
    before_data: Optional[Dict[str, Any]] = None,
    after_data: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = "127.0.0.1"
) -> Dict[str, Any]:
    """
    Persists audit trail record for sensitive clinical mutations and AI operations.
    """
    audit_entry = {
        "id": len(getattr(clinic_store, "audit_logs", [])) + 1,
        "clinic_id": clinic_id,
        "user_id": user_id,
        "user_email": user_email,
        "action": action.upper(),
        "entity": entity.lower(),
        "entity_id": str(entity_id) if entity_id else None,
        "ip_address": ip_address,
        "before_data": before_data,
        "after_data": after_data,
        "timestamp": datetime.now().isoformat()
    }

    if not hasattr(clinic_store, "audit_logs"):
        clinic_store.audit_logs = []

    clinic_store.audit_logs.append(audit_entry)
    logger.info(f"[AUDIT] {action.upper()} on {entity} (ID: {entity_id}) by {user_email}")
    return audit_entry
