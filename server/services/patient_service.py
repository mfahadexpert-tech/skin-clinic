"""
Hospital Management System - Patient Management & Operational Privacy Service
Implements:
1. Duplicate checks by CNIC, Phone, and Email before registration.
2. Mandatory phone vs optional email registration validation.
3. Receptionist operational view with strict clinical redaction.
"""

import sqlite3
import uuid
from datetime import datetime, date
from typing import Dict, Any, List, Optional
from database.hospital_db import get_db_connection, _lock
from database.hospital_models import (
    PatientRegistrationRequest, DuplicateCheckResponse, PatientOperationalOut, NotificationChannel
)


class PatientService:

    @staticmethod
    def check_duplicate(cnic: Optional[str] = None, phone: Optional[str] = None, email: Optional[str] = None) -> DuplicateCheckResponse:
        """
        Checks if a patient already exists with the given CNIC, Phone, or Email.
        Returns detailed warning message so duplicate is not silently created.
        """
        conn = get_db_connection()
        cursor = conn.cursor()

        duplicate_field = None
        existing_patient = None

        if cnic:
            cursor.execute("SELECT id, full_name, phone, email, cnic FROM patients WHERE cnic = ?", (cnic.strip(),))
            row = cursor.fetchone()
            if row:
                duplicate_field = "CNIC"
                existing_patient = dict(row)

        if not existing_patient and phone:
            cursor.execute("SELECT id, full_name, phone, email, cnic FROM patients WHERE phone = ?", (phone.strip(),))
            row = cursor.fetchone()
            if row:
                duplicate_field = "Phone Number"
                existing_patient = dict(row)

        if not existing_patient and email and email.strip():
            cursor.execute("SELECT id, full_name, phone, email, cnic FROM patients WHERE email = ?", (email.strip(),))
            row = cursor.fetchone()
            if row:
                duplicate_field = "Email Address"
                existing_patient = dict(row)

        conn.close()

        if existing_patient:
            return DuplicateCheckResponse(
                has_duplicate=True,
                duplicate_field=duplicate_field,
                existing_patient=existing_patient,
                warning_message=f"Possible duplicate detected! An existing patient '{existing_patient['full_name']}' is already registered with {duplicate_field}: {existing_patient.get(duplicate_field.lower().replace(' ', '_')) or cnic or phone}."
            )

        return DuplicateCheckResponse(has_duplicate=False)

    @staticmethod
    def register_patient(req: PatientRegistrationRequest, created_by_role: str = "patient") -> Dict[str, Any]:
        """
        Registers a new patient with duplicate checks and notification channel setup.
        """
        # 1. Duplicate check
        dup = PatientService.check_duplicate(cnic=req.cnic, phone=req.phone, email=req.email)
        if dup.has_duplicate:
            raise ValueError(dup.warning_message)

        with _lock:
            conn = get_db_connection()
            try:
                cursor = conn.cursor()
                now_str = datetime.now().isoformat()
                user_id = f"user-pat-{uuid.uuid4().hex[:8]}"
                patient_id = f"pat-{uuid.uuid4().hex[:8]}"

                # Insert User Account
                cursor.execute("""
                    INSERT INTO users (id, phone, email, password_hash, role, full_name, is_active, created_at)
                    VALUES (?, ?, ?, ?, 'patient', ?, 1, ?)
                """, (user_id, req.phone.strip(), req.email.strip() if req.email else None, req.password or "Patient@123", req.full_name.strip(), now_str))

                # Insert Patient Record
                cursor.execute("""
                    INSERT INTO patients (
                        id, user_id, full_name, phone, email, gender, dob, 
                        cnic, address, emergency_contact, whatsapp_available, created_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    patient_id, user_id, req.full_name.strip(), req.phone.strip(),
                    req.email.strip() if req.email else None, req.gender.value, req.dob,
                    req.cnic.strip(), req.address.strip(), req.emergency_contact.strip(),
                    1 if req.whatsapp_available else 0, now_str
                ))

                # Insert Notification Preferences
                pref_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO notification_preferences (id, patient_id, primary_channel, backup_channel, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    pref_id, patient_id, req.primary_notification_channel.value,
                    req.backup_notification_channel.value if req.backup_notification_channel else None,
                    now_str, now_str
                ))

                conn.commit()

                return {
                    "patient_id": patient_id,
                    "user_id": user_id,
                    "full_name": req.full_name,
                    "phone": req.phone,
                    "cnic": req.cnic,
                    "created_at": now_str
                }
            finally:
                conn.close()

    @staticmethod
    def get_patient_operational_data(patient_id: str) -> Dict[str, Any]:
        """
        Receptionist operational view:
        Returns identity, contact, appointments, visit dates, doctors visited, services received,
        and billing/payment status.
        STRICTLY HIDES: diagnosis, clinical notes, examination findings, and prescriptions.
        """
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, full_name, phone, email, gender, dob, cnic, address, emergency_contact, created_at
            FROM patients WHERE id = ?
        """, (patient_id,))
        patient = cursor.fetchone()
        if not patient:
            conn.close()
            raise ValueError("Patient not found.")

        # Get appointments history
        cursor.execute("""
            SELECT 
                a.id AS appointment_id,
                a.appointment_date,
                a.token_number,
                a.status,
                d.full_name AS doctor_name,
                s.name AS service_name,
                s.base_price,
                p.payment_status,
                p.amount_paid,
                p.amount_due
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            JOIN services s ON a.service_id = s.id
            LEFT JOIN payments p ON a.id = p.appointment_id
            WHERE a.patient_id = ?
            ORDER BY a.appointment_date DESC
        """, (patient_id,))
        appts = [dict(r) for r in cursor.fetchall()]

        # Get latest follow up date
        cursor.execute("""
            SELECT recommended_date, status FROM follow_ups 
            WHERE patient_id = ? ORDER BY recommended_date DESC LIMIT 1
        """, (patient_id,))
        fu = cursor.fetchone()

        conn.close()

        res = dict(patient)
        res["appointments"] = appts
        res["total_visits"] = len([a for a in appts if a["status"] == "completed"])
        res["latest_follow_up"] = dict(fu) if fu else None
        return res

    @staticmethod
    def list_patients(limit: int = 100) -> List[Dict[str, Any]]:
        """Retrieves all registered patients for administrative directory."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, user_id, full_name, phone, email, gender, dob, cnic, address, emergency_contact, whatsapp_available, created_at
            FROM patients
            ORDER BY created_at DESC
            LIMIT ?
        """, (limit,))
        patients = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return patients

    @staticmethod
    def update_patient(patient_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Updates patient demographic and contact information."""
        with _lock:
            conn = get_db_connection()
            try:
                cursor = conn.cursor()
                updates = []
                params = []
                for field in ["full_name", "phone", "email", "gender", "dob", "cnic", "address", "emergency_contact"]:
                    if field in data and data[field] is not None:
                        updates.append(f"{field} = ?")
                        params.append(data[field])

                if updates:
                    params.append(patient_id)
                    cursor.execute(f"UPDATE patients SET {', '.join(updates)} WHERE id = ?", tuple(params))
                    conn.commit()
                return {"status": "success", "message": "Patient updated successfully"}
            except Exception as e:
                conn.rollback()
                raise ValueError(str(e))
            finally:
                conn.close()

    @staticmethod
    def delete_patient(patient_id: str) -> Dict[str, Any]:
        """Deletes or archives a patient record and cleans up references."""
        with _lock:
            conn = get_db_connection()
            try:
                cursor = conn.cursor()
                cursor.execute("SELECT user_id FROM patients WHERE id = ?", (patient_id,))
                row = cursor.fetchone()
                user_id = row["user_id"] if row else None

                cursor.execute("DELETE FROM patients WHERE id = ?", (patient_id,))
                if user_id:
                    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))

                # Log to audit
                cursor.execute("""
                    INSERT INTO audit_logs (id, actor_id, actor_type, action, resource_type, resource_id, metadata_json, created_at)
                    VALUES (?, 'admin', 'admin', 'delete_patient', 'patients', ?, '{}', ?)
                """, (str(uuid.uuid4()), patient_id, datetime.now().isoformat()))

                conn.commit()
                return {"status": "success", "message": "Patient deleted successfully"}
            except Exception as e:
                conn.rollback()
                raise ValueError(str(e))
            finally:
                conn.close()

    @staticmethod
    def search_patients(query: str) -> List[Dict[str, Any]]:
        """Search patients by name, phone, CNIC, or ID."""
        conn = get_db_connection()
        cursor = conn.cursor()
        search_pattern = f"%{query.strip()}%"

        cursor.execute("""
            SELECT id, full_name, phone, email, gender, dob, cnic, address, emergency_contact, created_at
            FROM patients
            WHERE full_name LIKE ? OR phone LIKE ? OR cnic LIKE ? OR id LIKE ?
            ORDER BY full_name ASC
            LIMIT 20
        """, (search_pattern, search_pattern, search_pattern, search_pattern))

        results = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return results
