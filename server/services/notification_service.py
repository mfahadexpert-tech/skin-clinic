"""
Hospital Management System - Multi-Channel Notification & Failover Engine
Implements:
1. Patient notification preferences (primary and optional backup channel).
2. Automated failover if primary channel is unreachable.
3. Full audit logging in notification_logs.
"""

import sqlite3
import uuid
import json
from datetime import datetime
from typing import Dict, Any, Optional
from database.hospital_db import get_db_connection, _lock
from database.hospital_models import NotificationChannel, NotificationEvent


class NotificationService:

    @staticmethod
    def send_notification(
        patient_id: str,
        event_type: NotificationEvent,
        payload: Dict[str, Any],
        simulate_primary_failure: bool = False
    ) -> Dict[str, Any]:
        """
        Sends notification using patient's configured primary channel.
        If primary fails, automatically attempts failover to backup channel.
        Logs all operations to notification_logs.
        """
        with _lock:
            conn = get_db_connection()
            try:
                cursor = conn.cursor()
                now_str = datetime.now().isoformat()

                # Get patient contact & preferences
                cursor.execute("""
                    SELECT p.id, p.full_name, p.phone, p.email, p.whatsapp_available,
                           np.primary_channel, np.backup_channel
                    FROM patients p
                    LEFT JOIN notification_preferences np ON p.id = np.patient_id
                    WHERE p.id = ?
                """, (patient_id,))
                pat = cursor.fetchone()
                if not pat:
                    raise ValueError("Patient not found.")

                primary_channel = pat["primary_channel"] or ("whatsapp" if pat["whatsapp_available"] else "sms")
                backup_channel = pat["backup_channel"] or "email"

                status = "sent"
                channel_used = primary_channel
                failure_reason = None

                # Simulate / Check channel delivery
                if primary_channel == "whatsapp" and not pat["whatsapp_available"]:
                    simulate_primary_failure = True
                    failure_reason = "WhatsApp not registered on destination phone number"

                if simulate_primary_failure:
                    # Trigger failover
                    if backup_channel:
                        channel_used = backup_channel
                        status = "failover_sent"
                        failure_reason = f"Primary channel '{primary_channel}' unavailable. Failover to '{backup_channel}'."
                    else:
                        status = "failed"
                        failure_reason = f"Primary channel '{primary_channel}' failed and no backup configured."

                log_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO notification_logs (
                        id, patient_id, event_type, channel_used, status, failure_reason, payload_json, created_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    log_id, patient_id, event_type.value, channel_used,
                    status, failure_reason, json.dumps(payload), now_str
                ))

                conn.commit()

                return {
                    "notification_id": log_id,
                    "patient_name": pat["full_name"],
                    "event_type": event_type.value,
                    "channel_used": channel_used,
                    "status": status,
                    "failure_reason": failure_reason,
                    "sent_at": now_str
                }
            finally:
                conn.close()
