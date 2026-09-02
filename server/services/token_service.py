"""
Hospital Management System - Token Allocation & Management Service
Implements the core business rules:
1. Tokens are unique per Doctor + Date.
2. Cancelled tokens CANNOT be reused on the same day.
3. Cancelled tokens DO NOT count toward the effective daily patient limit.
4. Next token number is strictly max(highest_token_issued) + 1.
5. Concurrency-safe atomic transactions prevent double-allocation race conditions.
"""

import sqlite3
import uuid
from datetime import datetime, date
from typing import Dict, Any, Optional, Tuple
from database.hospital_db import get_db_connection, _lock
from database.hospital_models import TokenMetricsOut, TokenStatus


class TokenService:

    @staticmethod
    def get_token_metrics(doctor_id: str, appointment_date: str) -> TokenMetricsOut:
        """
        Calculates real-time token metrics:
        - daily_limit: Doctor's configured capacity
        - highest_token_issued: Highest sequence number generated today
        - cancelled_tokens_count: Number of cancelled tokens
        - active_allocated_tokens: Currently active/pending/confirmed tokens
        - effective_patient_count: Active patients being serviced
        - available_slots_remaining: daily_limit - effective_patient_count
        """
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get doctor daily limit
        cursor.execute("SELECT daily_token_limit FROM doctors WHERE id = ?", (doctor_id,))
        doc_row = cursor.fetchone()
        daily_limit = doc_row["daily_token_limit"] if doc_row else 100

        # Query token counts
        cursor.execute("""
            SELECT 
                COALESCE(MAX(token_number), 0) AS highest_token,
                COUNT(*) AS total_tokens,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_count,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
                SUM(CASE WHEN status = 'allocated' THEN 1 ELSE 0 END) AS allocated_count
            FROM tokens
            WHERE doctor_id = ? AND date = ?
        """, (doctor_id, appointment_date))
        
        metrics = cursor.fetchone()
        conn.close()

        highest_token_issued = metrics["highest_token"] or 0
        cancelled_count = metrics["cancelled_count"] or 0
        completed_count = metrics["completed_count"] or 0
        allocated_count = metrics["allocated_count"] or 0

        # Effective patients serviced/booked today (Active + Completed)
        effective_patient_count = allocated_count + completed_count
        available_slots = max(0, daily_limit - effective_patient_count)

        return TokenMetricsOut(
            doctor_id=doctor_id,
            date=appointment_date,
            daily_limit=daily_limit,
            highest_token_issued=highest_token_issued,
            active_allocated_tokens=allocated_count,
            cancelled_tokens_count=cancelled_count,
            completed_tokens_count=completed_count,
            effective_patient_count=effective_patient_count,
            available_slots_remaining=available_slots
        )

    @staticmethod
    def allocate_next_token(doctor_id: str, appointment_date: str, appointment_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Atomically allocates the next available token number for a Doctor on a specific Date.
        Ensures thread safety, prevents race conditions, and guarantees that cancelled tokens
        are NEVER reused, while correctly capping effective patient count.
        """
        with _lock:
            conn = get_db_connection()
            try:
                cursor = conn.cursor()

                # 1. Fetch Doctor Daily Limit
                cursor.execute("SELECT daily_token_limit, full_name FROM doctors WHERE id = ? AND is_active = 1", (doctor_id,))
                doc = cursor.fetchone()
                if not doc:
                    raise ValueError(f"Active doctor with ID '{doctor_id}' not found.")
                
                daily_limit = doc["daily_token_limit"] or 100

                # 2. Query Current Token State for this Doctor + Date
                cursor.execute("""
                    SELECT 
                        COALESCE(MAX(token_number), 0) AS max_token,
                        SUM(CASE WHEN status IN ('allocated', 'completed') THEN 1 ELSE 0 END) AS effective_count,
                        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_count
                    FROM tokens
                    WHERE doctor_id = ? AND date = ?
                """, (doctor_id, appointment_date))
                
                state = cursor.fetchone()
                max_token = state["max_token"] or 0
                effective_count = state["effective_count"] or 0
                cancelled_count = state["cancelled_count"] or 0

                # 3. Validate Daily Capacity Limit
                if effective_count >= daily_limit:
                    raise ValueError(
                        f"Daily token limit reached for {doc['full_name']} on {appointment_date}. "
                        f"Limit: {daily_limit}, Active: {effective_count}, Cancelled: {cancelled_count}."
                    )

                # 4. Next token number is strictly max_token + 1
                next_token_number = max_token + 1
                token_id = f"tok-{uuid.uuid4().hex[:8]}"
                now_str = datetime.now().isoformat()

                # 5. Insert New Token Record with Unique Constraint
                cursor.execute("""
                    INSERT INTO tokens (id, doctor_id, date, token_number, status, appointment_id, created_at)
                    VALUES (?, ?, ?, ?, 'allocated', ?, ?)
                """, (token_id, doctor_id, appointment_date, next_token_number, appointment_id, now_str))

                conn.commit()

                return {
                    "token_id": token_id,
                    "token_number": next_token_number,
                    "doctor_id": doctor_id,
                    "doctor_name": doc["full_name"],
                    "date": appointment_date,
                    "status": "allocated",
                    "effective_patient_count": effective_count + 1,
                    "daily_limit": daily_limit,
                    "highest_token_issued": next_token_number,
                    "cancelled_tokens_count": cancelled_count
                }

            except sqlite3.IntegrityError as e:
                conn.rollback()
                raise ValueError(f"Token allocation concurrency conflict on {appointment_date}. Please retry.")
            except Exception as e:
                conn.rollback()
                raise e
            finally:
                conn.close()

    @staticmethod
    def cancel_token(doctor_id: str, appointment_date: str, token_number: int, reason: str = "Appointment cancelled") -> Dict[str, Any]:
        """
        Marks a token as permanently CANCELLED.
        The token record is preserved and can NEVER be allocated to another patient on that day.
        """
        with _lock:
            conn = get_db_connection()
            try:
                cursor = conn.cursor()
                now_str = datetime.now().isoformat()

                cursor.execute("""
                    SELECT id, status, appointment_id FROM tokens 
                    WHERE doctor_id = ? AND date = ? AND token_number = ?
                """, (doctor_id, appointment_date, token_number))
                
                token_row = cursor.fetchone()
                if not token_row:
                    raise ValueError(f"Token #{token_number} on {appointment_date} not found.")
                
                if token_row["status"] == "cancelled":
                    return {"status": "already_cancelled", "token_number": token_number}

                cursor.execute("""
                    UPDATE tokens
                    SET status = 'cancelled', cancelled_at = ?
                    WHERE id = ?
                """, (now_str, token_row["id"]))

                conn.commit()
                return {
                    "token_id": token_row["id"],
                    "token_number": token_number,
                    "status": "cancelled",
                    "cancelled_at": now_str,
                    "reusable": False
                }
            finally:
                conn.close()
