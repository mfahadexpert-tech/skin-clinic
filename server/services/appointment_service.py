"""
Hospital Management System - Appointment & Receptionist Approval Service
Implements:
1. Patient / AI booking requests created in PENDING status.
2. Authoritative Receptionist Approval / Decline workflow.
3. Concurrency-safe token booking integration.
4. Non-destructive appointment cancellation (preserves historical record & permanently cancels token).
5. Rescheduling = Cancel old + Create new PENDING booking request.
"""

import sqlite3
import uuid
import json
from datetime import datetime, date
from typing import Dict, Any, List, Optional
from database.hospital_db import get_db_connection, _lock
from database.hospital_models import AppointmentStatus, BookingSource, QueueStatus
from services.token_service import TokenService


class AppointmentService:

    @staticmethod
    def create_booking_request(
        patient_id: str,
        doctor_id: str,
        service_id: str,
        appointment_date: str,
        token_number: Optional[int] = None,
        booking_source: BookingSource = BookingSource.PATIENT_PORTAL,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Creates a new appointment booking request.
        CRITICAL RULE: Always created in 'PENDING' status for Patient Portal and AI Agent.
        Allocates the next available non-reusable token safely.
        """
        with _lock:
            conn = get_db_connection()
            try:
                cursor = conn.cursor()

                # Verify patient
                cursor.execute("SELECT id, full_name, phone FROM patients WHERE id = ?", (patient_id,))
                patient = cursor.fetchone()
                if not patient:
                    raise ValueError(f"Patient ID '{patient_id}' not found.")

                # Verify doctor & service relationship
                cursor.execute("""
                    SELECT ds.id, d.full_name AS doctor_name, s.name AS service_name, s.base_price
                    FROM doctor_services ds
                    JOIN doctors d ON ds.doctor_id = d.id
                    JOIN services s ON ds.service_id = s.id
                    WHERE ds.doctor_id = ? AND ds.service_id = ? AND d.is_active = 1 AND s.is_active = 1
                """, (doctor_id, service_id))
                rel = cursor.fetchone()
                if not rel:
                    raise ValueError("Selected doctor does not offer this service or is currently inactive.")

                # Allocate token safely
                token_result = TokenService.allocate_next_token(doctor_id, appointment_date)
                allocated_token_num = token_result["token_number"]
                token_id = token_result["token_id"]

                # Generate Appointment ID
                appt_id = f"appt-{uuid.uuid4().hex[:8]}"
                now_str = datetime.now().isoformat()

                # Determine initial status
                # If created directly by front-desk receptionist with direct booking, it can be confirmed;
                # Otherwise (Patient Portal / AI Agent) it is strictly PENDING.
                initial_status = "confirmed" if booking_source == BookingSource.RECEPTIONIST_WALKIN else "pending"

                cursor.execute("""
                    INSERT INTO appointments (
                        id, patient_id, doctor_id, service_id, appointment_date, 
                        token_id, token_number, status, booking_source, receptionist_notes, 
                        created_at, updated_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    appt_id, patient_id, doctor_id, service_id, appointment_date,
                    token_id, allocated_token_num, initial_status, booking_source.value, notes,
                    now_str, now_str
                ))

                # Update token with appointment_id
                cursor.execute("UPDATE tokens SET appointment_id = ? WHERE id = ?", (appt_id, token_id))

                # If receptionist walk-in created directly as confirmed, initialize queue entry
                if initial_status == "confirmed":
                    queue_id = str(uuid.uuid4())
                    cursor.execute("""
                        INSERT INTO queue_entries (id, appointment_id, doctor_id, patient_id, date, token_number, queue_status, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, 'not_checked_in', ?)
                    """, (queue_id, appt_id, doctor_id, patient_id, appointment_date, allocated_token_num, now_str))

                # Audit Log
                cursor.execute("""
                    INSERT INTO audit_logs (id, actor_id, actor_type, action, resource_type, resource_id, metadata_json, created_at)
                    VALUES (?, ?, ?, 'create_booking_request', 'appointment', ?, ?, ?)
                """, (
                    str(uuid.uuid4()), patient_id, booking_source.value, appt_id,
                    json.dumps({
                        "token_number": allocated_token_num,
                        "doctor": rel["doctor_name"],
                        "service": rel["service_name"],
                        "status": initial_status
                    }),
                    now_str
                ))

                conn.commit()

                return {
                    "appointment_id": appt_id,
                    "patient_id": patient_id,
                    "patient_name": patient["full_name"],
                    "doctor_id": doctor_id,
                    "doctor_name": rel["doctor_name"],
                    "service_id": service_id,
                    "service_name": rel["service_name"],
                    "appointment_date": appointment_date,
                    "token_number": allocated_token_num,
                    "token_id": token_id,
                    "status": initial_status,
                    "booking_source": booking_source.value,
                    "message": "Appointment confirmed." if initial_status == "confirmed" else "Your appointment request has been submitted and is awaiting Receptionist approval."
                }

            except Exception as e:
                conn.rollback()
                raise e
            finally:
                conn.close()

    @staticmethod
    def process_booking_approval(
        appointment_id: str,
        action: str,  # "approve" or "decline"
        receptionist_user_id: str,
        reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Authoritative Receptionist Workflow:
        - Approve: PENDING -> CONFIRMED. Creates queue entry in 'not_checked_in' state.
        - Decline: PENDING -> DECLINED. Cancels token so it cannot be reused.
        """
        with _lock:
            conn = get_db_connection()
            try:
                cursor = conn.cursor()
                now_str = datetime.now().isoformat()

                cursor.execute("""
                    SELECT a.id, a.status, a.patient_id, a.doctor_id, a.service_id, a.appointment_date, 
                           a.token_id, a.token_number, p.full_name AS patient_name, d.full_name AS doctor_name
                    FROM appointments a
                    JOIN patients p ON a.patient_id = p.id
                    JOIN doctors d ON a.doctor_id = d.id
                    WHERE a.id = ?
                """, (appointment_id,))
                appt = cursor.fetchone()

                if not appt:
                    raise ValueError("Appointment not found.")

                if appt["status"] != "pending":
                    raise ValueError(f"Only PENDING appointments can be approved/declined. Current status: '{appt['status']}'.")

                if action.lower() == "approve":
                    cursor.execute("""
                        UPDATE appointments
                        SET status = 'confirmed', approved_by = ?, updated_at = ?
                        WHERE id = ?
                    """, (receptionist_user_id, now_str, appointment_id))

                    # Create Queue Entry
                    queue_id = str(uuid.uuid4())
                    cursor.execute("""
                        INSERT INTO queue_entries (id, appointment_id, doctor_id, patient_id, date, token_number, queue_status, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, 'not_checked_in', ?)
                    """, (queue_id, appointment_id, appt["doctor_id"], appt["patient_id"], appt["appointment_date"], appt["token_number"], now_str))

                    # Maintain Doctor-Patient Relationship
                    cursor.execute("""
                        INSERT INTO doctor_patient_relationships (id, doctor_id, patient_id, first_visit_date, last_visit_date, total_visits, is_currently_assigned)
                        VALUES (?, ?, ?, ?, ?, 1, 1)
                        ON CONFLICT(doctor_id, patient_id) DO UPDATE SET 
                            last_visit_date = excluded.last_visit_date,
                            is_currently_assigned = 1
                    """, (str(uuid.uuid4()), appt["doctor_id"], appt["patient_id"], appt["appointment_date"], appt["appointment_date"]))

                    new_status = "confirmed"

                elif action.lower() == "decline":
                    cursor.execute("""
                        UPDATE appointments
                        SET status = 'declined', receptionist_notes = ?, approved_by = ?, updated_at = ?
                        WHERE id = ?
                    """, (reason or "Declined by reception", receptionist_user_id, now_str, appointment_id))

                    # Cancel token permanently
                    if appt["token_id"]:
                        cursor.execute("UPDATE tokens SET status = 'cancelled', cancelled_at = ? WHERE id = ?", (now_str, appt["token_id"]))

                    new_status = "declined"
                else:
                    raise ValueError("Action must be either 'approve' or 'decline'.")

                # Audit Log
                cursor.execute("""
                    INSERT INTO audit_logs (id, actor_id, actor_type, action, resource_type, resource_id, previous_state_json, new_state_json, metadata_json, created_at)
                    VALUES (?, ?, 'receptionist', ?, 'appointment', ?, ?, ?, ?, ?)
                """, (
                    str(uuid.uuid4()), receptionist_user_id, f"booking_{new_status}", appointment_id,
                    json.dumps({"status": "pending"}),
                    json.dumps({"status": new_status}),
                    json.dumps({"reason": reason, "token_number": appt["token_number"]}),
                    now_str
                ))

                conn.commit()

                return {
                    "appointment_id": appointment_id,
                    "patient_name": appt["patient_name"],
                    "doctor_name": appt["doctor_name"],
                    "token_number": appt["token_number"],
                    "status": new_status,
                    "approved_by": receptionist_user_id
                }

            finally:
                conn.close()

    @staticmethod
    def cancel_appointment(appointment_id: str, actor_id: str, actor_role: str, reason: Optional[str] = None) -> Dict[str, Any]:
        """
        Cancels an existing appointment:
        1. Preserves appointment record in database (never deletes).
        2. Sets appointment status to 'cancelled'.
        3. Sets token status to 'cancelled' (token is permanently retired for today).
        4. Updates queue entry to 'cancelled'.
        5. Logs full audit record.
        """
        with _lock:
            conn = get_db_connection()
            try:
                cursor = conn.cursor()
                now_str = datetime.now().isoformat()

                cursor.execute("""
                    SELECT a.id, a.status, a.patient_id, a.doctor_id, a.appointment_date, a.token_id, a.token_number, p.full_name AS patient_name
                    FROM appointments a
                    JOIN patients p ON a.patient_id = p.id
                    WHERE a.id = ?
                """, (appointment_id,))
                appt = cursor.fetchone()

                if not appt:
                    raise ValueError("Appointment not found.")

                if appt["status"] == "cancelled":
                    return {"status": "already_cancelled", "appointment_id": appointment_id}

                # Patient ownership security check
                if actor_role == "patient" and appt["patient_id"] != actor_id:
                    raise PermissionError("Unauthorized: Patients can only cancel their own appointments.")

                # Cancel appointment
                cursor.execute("""
                    UPDATE appointments
                    SET status = 'cancelled', receptionist_notes = ?, updated_at = ?
                    WHERE id = ?
                """, (reason or f"Cancelled by {actor_role}", now_str, appointment_id))

                # Cancel token permanently (Rule 3: never reused)
                if appt["token_id"]:
                    cursor.execute("""
                        UPDATE tokens
                        SET status = 'cancelled', cancelled_at = ?
                        WHERE id = ?
                    """, (now_str, appt["token_id"]))

                # Cancel queue entry
                cursor.execute("""
                    UPDATE queue_entries
                    SET queue_status = 'cancelled'
                    WHERE appointment_id = ?
                """, (appointment_id,))

                # Audit Log
                cursor.execute("""
                    INSERT INTO audit_logs (id, actor_id, actor_type, action, resource_type, resource_id, previous_state_json, new_state_json, metadata_json, created_at)
                    VALUES (?, ?, ?, 'cancel_appointment', 'appointment', ?, ?, ?, ?, ?)
                """, (
                    str(uuid.uuid4()), actor_id, actor_role, appointment_id,
                    json.dumps({"status": appt["status"], "token_number": appt["token_number"]}),
                    json.dumps({"status": "cancelled"}),
                    json.dumps({"reason": reason, "token_retired": appt["token_number"]}),
                    now_str
                ))

                conn.commit()

                return {
                    "success": True,
                    "appointment_id": appointment_id,
                    "patient_name": appt["patient_name"],
                    "token_number": appt["token_number"],
                    "status": "cancelled",
                    "token_status": "cancelled_permanently_unavailable",
                    "cancelled_at": now_str
                }

            finally:
                conn.close()

    @staticmethod
    def reschedule_appointment(
        old_appointment_id: str,
        new_appointment_date: str,
        actor_id: str,
        actor_role: str,
        new_doctor_id: Optional[str] = None,
        new_service_id: Optional[str] = None,
        reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Rescheduling Workflow:
        1. Cancel old appointment (preserves history + permanently cancels old token).
        2. Create new booking request in PENDING status.
        3. Requires Receptionist approval.
        """
        with _lock:
            conn = get_db_connection()
            try:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM appointments WHERE id = ?", (old_appointment_id,))
                old_appt = cursor.fetchone()
                if not old_appt:
                    raise ValueError("Existing appointment not found.")

                target_doc = new_doctor_id or old_appt["doctor_id"]
                target_srv = new_service_id or old_appt["service_id"]
                patient_id = old_appt["patient_id"]

                # 1. Cancel old appointment
                AppointmentService.cancel_appointment(
                    old_appointment_id, actor_id, actor_role, 
                    reason=f"Rescheduled to {new_appointment_date}: {reason or ''}"
                )

                # 2. Create new booking request (PENDING)
                new_booking = AppointmentService.create_booking_request(
                    patient_id=patient_id,
                    doctor_id=target_doc,
                    service_id=target_srv,
                    appointment_date=new_appointment_date,
                    booking_source=BookingSource.PATIENT_PORTAL if actor_role == "patient" else BookingSource.RECEPTIONIST_WALKIN,
                    notes=f"Rescheduled from previous appointment {old_appointment_id}"
                )

                return {
                    "reschedule_success": True,
                    "old_appointment_id": old_appointment_id,
                    "old_appointment_status": "cancelled",
                    "new_appointment": new_booking
                }

            finally:
                conn.close()
