"""
Hospital Management System - Queue & Flow Management Service
Implements the queue state lifecycle and Doctor "Call Next Patient" logic:
1. Queue entries are ordered by token_number.
2. Only checked-in patients in 'waiting' state are eligible for 'Call Next Patient'.
3. Unchecked-in booked patients remain in 'not_checked_in' and are skipped.
4. Separates Appointment Status (e.g. CONFIRMED) from Queue Status (e.g. WAITING).
"""

import sqlite3
import uuid
from datetime import datetime, date
from typing import Dict, Any, List, Optional
from database.hospital_db import get_db_connection, _lock
from database.hospital_models import QueueStatus, AppointmentStatus


class QueueService:

    @staticmethod
    def get_live_queue(doctor_id: Optional[str] = None, appointment_date: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieves today's live queue sorted by token order with patient and appointment metadata."""
        if not appointment_date:
            appointment_date = date.today().isoformat()

        conn = get_db_connection()
        cursor = conn.cursor()

        query = """
            SELECT 
                q.id AS queue_id,
                q.appointment_id,
                q.doctor_id,
                d.full_name AS doctor_name,
                d.specialization AS doctor_specialization,
                q.patient_id,
                p.full_name AS patient_name,
                p.phone AS patient_phone,
                q.date,
                q.token_number,
                s.name AS service_name,
                a.status AS appointment_status,
                q.queue_status,
                q.check_in_time,
                q.called_time,
                q.consultation_start_time,
                q.consultation_end_time
            FROM queue_entries q
            JOIN appointments a ON q.appointment_id = a.id
            JOIN patients p ON q.patient_id = p.id
            JOIN doctors d ON q.doctor_id = d.id
            JOIN services s ON a.service_id = s.id
            WHERE q.date = ?
        """
        params = [appointment_date]
        if doctor_id:
            query += " AND q.doctor_id = ?"
            params.append(doctor_id)

        query += " ORDER BY q.token_number ASC"
        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()
        conn.close()

        return [dict(row) for row in rows]

    @staticmethod
    def check_in_patient(appointment_id: str, check_in_time: Optional[str] = None) -> Dict[str, Any]:
        """
        Checks in a patient at the front desk or self check-in.
        Transitions queue status from 'not_checked_in' -> 'waiting'.
        Requires the appointment to be in 'confirmed' status.
        """
        with _lock:
            conn = get_db_connection()
            try:
                cursor = conn.cursor()
                if not check_in_time:
                    check_in_time = datetime.now().strftime("%H:%M:%S")

                # Verify appointment
                cursor.execute("""
                    SELECT a.id, a.status, a.token_number, a.doctor_id, a.patient_id, a.appointment_date, p.full_name
                    FROM appointments a
                    JOIN patients p ON a.patient_id = p.id
                    WHERE a.id = ?
                """, (appointment_id,))
                appt = cursor.fetchone()
                if not appt:
                    raise ValueError("Appointment not found.")

                if appt["status"] != "confirmed":
                    raise ValueError(f"Cannot check in appointment with status '{appt['status']}'. Must be 'confirmed'.")

                # Check or create queue entry
                cursor.execute("SELECT id, queue_status FROM queue_entries WHERE appointment_id = ?", (appointment_id,))
                q_row = cursor.fetchone()

                if q_row:
                    if q_row["queue_status"] in ["waiting", "called", "in_consultation", "completed"]:
                        return {
                            "status": "already_checked_in",
                            "queue_status": q_row["queue_status"],
                            "token_number": appt["token_number"]
                        }

                    cursor.execute("""
                        UPDATE queue_entries
                        SET queue_status = 'waiting', check_in_time = ?
                        WHERE id = ?
                    """, (check_in_time, q_row["id"]))
                else:
                    queue_id = str(uuid.uuid4())
                    cursor.execute("""
                        INSERT INTO queue_entries (id, appointment_id, doctor_id, patient_id, date, token_number, queue_status, check_in_time, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, 'waiting', ?, ?)
                    """, (queue_id, appointment_id, appt["doctor_id"], appt["patient_id"], appt["appointment_date"], appt["token_number"], check_in_time, datetime.now().isoformat()))

                conn.commit()
                return {
                    "success": True,
                    "appointment_id": appointment_id,
                    "patient_name": appt["full_name"],
                    "token_number": appt["token_number"],
                    "queue_status": "waiting",
                    "check_in_time": check_in_time
                }
            finally:
                conn.close()

    @staticmethod
    def call_next_patient(doctor_id: str, appointment_date: Optional[str] = None) -> Dict[str, Any]:
        """
        Doctor clicks [ CALL NEXT PATIENT ].
        Algorithm:
        1. Find today's appointments for this doctor.
        2. Filter queue_status = 'waiting' (checked-in patients only).
        3. Sort by token_number ASC.
        4. Select lowest eligible token.
        5. Transition state: 'waiting' -> 'called'.
        """
        if not appointment_date:
            appointment_date = date.today().isoformat()

        with _lock:
            conn = get_db_connection()
            try:
                cursor = conn.cursor()
                now_str = datetime.now().strftime("%H:%M:%S")

                # Find lowest token in 'waiting' status
                cursor.execute("""
                    SELECT 
                        q.id AS queue_id,
                        q.appointment_id,
                        q.doctor_id,
                        q.patient_id,
                        q.token_number,
                        p.full_name AS patient_name,
                        p.phone AS patient_phone,
                        s.name AS service_name,
                        s.duration_minutes
                    FROM queue_entries q
                    JOIN appointments a ON q.appointment_id = a.id
                    JOIN patients p ON q.patient_id = p.id
                    JOIN services s ON a.service_id = s.id
                    WHERE q.doctor_id = ? AND q.date = ? AND q.queue_status = 'waiting'
                    ORDER BY q.token_number ASC
                    LIMIT 1
                """, (doctor_id, appointment_date))

                next_patient = cursor.fetchone()

                if not next_patient:
                    return {
                        "has_patient": False,
                        "message": "No checked-in waiting patients currently in the queue for this Doctor."
                    }

                # Update queue entry to 'called'
                cursor.execute("""
                    UPDATE queue_entries
                    SET queue_status = 'called', called_time = ?
                    WHERE id = ?
                """, (now_str, next_patient["queue_id"]))

                conn.commit()

                return {
                    "has_patient": True,
                    "queue_id": next_patient["queue_id"],
                    "appointment_id": next_patient["appointment_id"],
                    "token_number": next_patient["token_number"],
                    "patient_id": next_patient["patient_id"],
                    "patient_name": next_patient["patient_name"],
                    "patient_phone": next_patient["patient_phone"],
                    "service_name": next_patient["service_name"],
                    "called_time": now_str,
                    "queue_status": "called"
                }
            finally:
                conn.close()

    @staticmethod
    def start_consultation(queue_id: str, doctor_id: str) -> Dict[str, Any]:
        """Transitions queue entry from 'called' or 'waiting' -> 'in_consultation'."""
        with _lock:
            conn = get_db_connection()
            try:
                cursor = conn.cursor()
                now_str = datetime.now().strftime("%H:%M:%S")

                cursor.execute("""
                    SELECT q.id, q.appointment_id, q.patient_id, q.token_number, q.doctor_id, p.full_name, a.service_id
                    FROM queue_entries q
                    JOIN appointments a ON q.appointment_id = a.id
                    JOIN patients p ON q.patient_id = p.id
                    WHERE q.id = ? AND q.doctor_id = ?
                """, (queue_id, doctor_id))
                entry = cursor.fetchone()
                if not entry:
                    raise ValueError("Queue record not found or doctor mismatch.")

                cursor.execute("""
                    UPDATE queue_entries
                    SET queue_status = 'in_consultation', consultation_start_time = ?
                    WHERE id = ?
                """, (now_str, queue_id))

                # Ensure active visit record exists
                visit_id = f"visit-{uuid.uuid4().hex[:8]}"
                cursor.execute("""
                    INSERT OR IGNORE INTO visits (id, appointment_id, patient_id, doctor_id, visit_date, status, created_at)
                    VALUES (?, ?, ?, ?, ?, 'in_progress', ?)
                """, (visit_id, entry["appointment_id"], entry["patient_id"], entry["doctor_id"], date.today().isoformat(), datetime.now().isoformat()))

                conn.commit()
                return {
                    "success": True,
                    "queue_id": queue_id,
                    "appointment_id": entry["appointment_id"],
                    "patient_id": entry["patient_id"],
                    "patient_name": entry["full_name"],
                    "token_number": entry["token_number"],
                    "queue_status": "in_consultation",
                    "consultation_start_time": now_str
                }
            finally:
                conn.close()
