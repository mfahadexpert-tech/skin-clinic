"""
Hospital Management System - Clinical Records & Prescription Versioning Service
Enforces:
1. Immutable prescription versioning (v1, v2... never overwritten).
2. Append-only clinical record edit audit logging (field, old_value, new_value, reason, actor).
3. Role-based privacy filters:
   - Receptionist: Clinical data strictly redacted / 403 Forbidden.
   - Patient: Sees diagnosis/treatment/prescription, but doctor private notes are stripped.
   - Doctor: Allowed only if doctor has treated or is currently assigned to the patient.
"""

import sqlite3
import uuid
import json
from datetime import datetime, date
from typing import Dict, Any, List, Optional
from database.hospital_db import get_db_connection, _lock
from database.hospital_models import (
    ClinicalRecordCreate, ClinicalRecordUpdate, ClinicalRecordOut,
    PrescriptionCreate, PrescriptionVersionCorrection, PrescriptionOut,
    PrescriptionVersionOut, PrescriptionItem, UserRole
)


class ClinicalService:

    @staticmethod
    def check_doctor_patient_access(doctor_id: str, patient_id: str) -> bool:
        """
        Verifies if a doctor is authorized to view a patient's clinical history.
        Authorized if:
        1. Doctor has previously treated this patient.
        2. Doctor has an active/pending appointment with this patient.
        """
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check explicit relationship
        cursor.execute("""
            SELECT id FROM doctor_patient_relationships 
            WHERE doctor_id = ? AND patient_id = ?
        """, (doctor_id, patient_id))
        rel = cursor.fetchone()
        if rel:
            conn.close()
            return True

        # Check appointments
        cursor.execute("""
            SELECT id FROM appointments
            WHERE doctor_id = ? AND patient_id = ?
        """, (doctor_id, patient_id))
        appt = cursor.fetchone()
        conn.close()

        return bool(appt)

    @staticmethod
    def create_clinical_record(record_in: ClinicalRecordCreate, doctor_id: str, doctor_user_id: str) -> Dict[str, Any]:
        """Creates a clinical record for a completed/in-progress consultation."""
        with _lock:
            conn = get_db_connection()
            try:
                cursor = conn.cursor()
                now_str = datetime.now().isoformat()

                # Verify appointment
                cursor.execute("""
                    SELECT id, patient_id, doctor_id, appointment_date 
                    FROM appointments WHERE id = ?
                """, (record_in.appointment_id,))
                appt = cursor.fetchone()
                if not appt:
                    raise ValueError("Appointment not found.")

                if appt["doctor_id"] != doctor_id:
                    raise PermissionError("Attending doctor mismatch.")

                patient_id = appt["patient_id"]
                visit_id = record_in.visit_id or f"visit-{uuid.uuid4().hex[:8]}"

                # Ensure visit record exists
                cursor.execute("""
                    INSERT OR IGNORE INTO visits (id, appointment_id, patient_id, doctor_id, visit_date, status, created_at)
                    VALUES (?, ?, ?, ?, ?, 'completed', ?)
                """, (visit_id, appt["id"], patient_id, doctor_id, appt["appointment_date"], now_str))

                # Update visit status to completed
                cursor.execute("UPDATE visits SET status = 'completed' WHERE id = ?", (visit_id,))
                cursor.execute("UPDATE appointments SET status = 'completed' WHERE id = ?", (appt["id"],))
                cursor.execute("UPDATE queue_entries SET queue_status = 'completed', consultation_end_time = ? WHERE appointment_id = ?", (datetime.now().strftime("%H:%M:%S"), appt["id"]))

                # Insert Clinical Record
                clin_id = f"clin-{uuid.uuid4().hex[:8]}"
                cursor.execute("""
                    INSERT INTO clinical_records (
                        id, visit_id, appointment_id, patient_id, doctor_id,
                        chief_complaint, examination_findings, diagnosis, treatment_plan,
                        clinical_notes, doctor_private_notes, created_at, updated_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    clin_id, visit_id, appt["id"], patient_id, doctor_id,
                    record_in.chief_complaint, record_in.examination_findings,
                    record_in.diagnosis, record_in.treatment_plan,
                    record_in.clinical_notes or "", record_in.doctor_private_notes or "",
                    now_str, now_str
                ))

                # If prescription included, create Prescription v1
                rx_id = None
                if record_in.prescription and record_in.prescription.items:
                    rx_id = f"rx-{uuid.uuid4().hex[:8]}"
                    cursor.execute("""
                        INSERT INTO prescriptions (id, visit_id, patient_id, doctor_id, created_at)
                        VALUES (?, ?, ?, ?, ?)
                    """, (rx_id, visit_id, patient_id, doctor_id, now_str))

                    items_json = json.dumps([item.model_dump() for item in record_in.prescription.items])
                    cursor.execute("""
                        INSERT INTO prescription_versions (
                            id, prescription_id, version_number, content_json,
                            correction_reason, notes, doctor_id, is_current, created_at
                        )
                        VALUES (?, ?, 1, ?, 'Initial consultation formulation', ?, ?, 1, ?)
                    """, (str(uuid.uuid4()), rx_id, items_json, record_in.prescription.notes, doctor_id, now_str))

                # If follow-up requested
                if record_in.follow_up_days:
                    from datetime import timedelta
                    follow_up_date = (date.today() + timedelta(days=record_in.follow_up_days)).isoformat()
                    cursor.execute("""
                        INSERT INTO follow_ups (id, visit_id, patient_id, doctor_id, recommended_date, instructions, status, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
                    """, (str(uuid.uuid4()), visit_id, patient_id, doctor_id, follow_up_date, record_in.follow_up_instructions or "", now_str))

                # Maintain Doctor-Patient Relationship
                cursor.execute("""
                    INSERT INTO doctor_patient_relationships (id, doctor_id, patient_id, first_visit_date, last_visit_date, total_visits, is_currently_assigned)
                    VALUES (?, ?, ?, ?, ?, 1, 1)
                    ON CONFLICT(doctor_id, patient_id) DO UPDATE SET 
                        last_visit_date = excluded.last_visit_date,
                        total_visits = doctor_patient_relationships.total_visits + 1
                """, (str(uuid.uuid4()), doctor_id, patient_id, appt["appointment_date"], appt["appointment_date"]))

                # Audit Log
                cursor.execute("""
                    INSERT INTO audit_logs (id, actor_id, actor_type, action, resource_type, resource_id, metadata_json, created_at)
                    VALUES (?, ?, 'doctor', 'create_clinical_record', 'clinical_record', ?, ?, ?)
                """, (
                    str(uuid.uuid4()), doctor_user_id, clin_id,
                    json.dumps({"diagnosis": record_in.diagnosis, "patient_id": patient_id}),
                    now_str
                ))

                conn.commit()

                return {
                    "clinical_record_id": clin_id,
                    "visit_id": visit_id,
                    "prescription_id": rx_id,
                    "patient_id": patient_id,
                    "status": "completed"
                }

            finally:
                conn.close()

    @staticmethod
    def update_clinical_record(
        record_id: str,
        update_in: ClinicalRecordUpdate,
        doctor_id: str,
        doctor_user_id: str
    ) -> Dict[str, Any]:
        """
        Doctor updates fields of an existing clinical record.
        CRITICAL RULE: Generates an immutable audit trail entry for every changed field.
        """
        with _lock:
            conn = get_db_connection()
            try:
                cursor = conn.cursor()
                now_str = datetime.now().isoformat()

                cursor.execute("SELECT * FROM clinical_records WHERE id = ?", (record_id,))
                current = cursor.fetchone()
                if not current:
                    raise ValueError("Clinical record not found.")

                if current["doctor_id"] != doctor_id:
                    raise PermissionError("Unauthorized: Doctors can only edit their own clinical records.")

                # Check each field for updates and log audit
                fields_to_check = [
                    "chief_complaint", "examination_findings", "diagnosis",
                    "treatment_plan", "clinical_notes", "doctor_private_notes"
                ]

                updates = {}
                for field in fields_to_check:
                    new_val = getattr(update_in, field)
                    if new_val is not None and new_val != current[field]:
                        updates[field] = new_val
                        # Insert into immutable clinical_record_audits
                        cursor.execute("""
                            INSERT INTO clinical_record_audits (
                                id, clinical_record_id, actor_id, actor_role,
                                field_name, old_value, new_value, reason, created_at
                            )
                            VALUES (?, ?, ?, 'doctor', ?, ?, ?, ?, ?)
                        """, (
                            str(uuid.uuid4()), record_id, doctor_user_id,
                            field, current[field], new_val, update_in.edit_reason, now_str
                        ))

                if updates:
                    set_clauses = [f"{k} = ?" for k in updates.keys()]
                    set_clauses.append("updated_at = ?")
                    values = list(updates.values()) + [now_str, record_id]

                    cursor.execute(f"UPDATE clinical_records SET {', '.join(set_clauses)} WHERE id = ?", tuple(values))

                    # System Audit
                    cursor.execute("""
                        INSERT INTO audit_logs (id, actor_id, actor_type, action, resource_type, resource_id, metadata_json, created_at)
                        VALUES (?, ?, 'doctor', 'edit_clinical_record', 'clinical_record', ?, ?, ?)
                    """, (
                        str(uuid.uuid4()), doctor_user_id, record_id,
                        json.dumps({"modified_fields": list(updates.keys()), "reason": update_in.edit_reason}),
                        now_str
                    ))

                conn.commit()

                return {
                    "clinical_record_id": record_id,
                    "updated_fields": list(updates.keys()),
                    "audit_recorded": True,
                    "updated_at": now_str
                }

            finally:
                conn.close()

    @staticmethod
    def create_prescription_correction(
        prescription_id: str,
        correction_in: PrescriptionVersionCorrection,
        doctor_id: str,
        doctor_user_id: str
    ) -> Dict[str, Any]:
        """
        CRITICAL RULE: Prescriptions are versioned and NEVER overwritten.
        1. Queries current latest version number.
        2. Sets previous version's `is_current` to 0.
        3. Inserts new version (v_latest + 1) with `is_current = 1` and `correction_reason`.
        """
        with _lock:
            conn = get_db_connection()
            try:
                cursor = conn.cursor()
                now_str = datetime.now().isoformat()

                cursor.execute("SELECT id, doctor_id, patient_id FROM prescriptions WHERE id = ?", (prescription_id,))
                rx = cursor.fetchone()
                if not rx:
                    raise ValueError("Prescription not found.")

                if rx["doctor_id"] != doctor_id:
                    raise PermissionError("Unauthorized: Only the prescribing doctor can issue corrections.")

                # Get latest version number
                cursor.execute("""
                    SELECT COALESCE(MAX(version_number), 0) AS max_v 
                    FROM prescription_versions WHERE prescription_id = ?
                """, (prescription_id,))
                max_v = cursor.fetchone()["max_v"]
                new_version_num = max_v + 1

                # Demote all existing versions to not current
                cursor.execute("UPDATE prescription_versions SET is_current = 0 WHERE prescription_id = ?", (prescription_id,))

                # Insert new version
                items_json = json.dumps([item.model_dump() for item in correction_in.items])
                new_v_id = str(uuid.uuid4())

                cursor.execute("""
                    INSERT INTO prescription_versions (
                        id, prescription_id, version_number, content_json,
                        correction_reason, notes, doctor_id, is_current, created_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
                """, (
                    new_v_id, prescription_id, new_version_num, items_json,
                    correction_in.correction_reason, correction_in.notes,
                    doctor_id, now_str
                ))

                # Audit Log
                cursor.execute("""
                    INSERT INTO audit_logs (id, actor_id, actor_type, action, resource_type, resource_id, metadata_json, created_at)
                    VALUES (?, ?, 'doctor', 'correct_prescription', 'prescription_version', ?, ?, ?)
                """, (
                    str(uuid.uuid4()), doctor_user_id, new_v_id,
                    json.dumps({
                        "prescription_id": prescription_id,
                        "version_number": new_version_num,
                        "reason": correction_in.correction_reason
                    }),
                    now_str
                ))

                conn.commit()

                return {
                    "prescription_id": prescription_id,
                    "new_version_id": new_v_id,
                    "version_number": new_version_num,
                    "is_current": True,
                    "correction_reason": correction_in.correction_reason,
                    "created_at": now_str
                }

            finally:
                conn.close()

    @staticmethod
    def get_patient_clinical_records(
        patient_id: str,
        caller_role: UserRole,
        caller_id: str,
        doctor_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieves clinical history with strict role-based privacy filters:
        - Receptionist: FORBIDDEN (Raises PermissionError).
        - Patient: Allowed ONLY for their own ID; Doctor Private Notes are masked out.
        - Doctor: Allowed ONLY if doctor has treated or is assigned to this patient.
        """
        # 1. Receptionist Privacy Enforcement
        if caller_role == UserRole.RECEPTIONIST:
            raise PermissionError("Receptionists are not permitted to access detailed clinical records.")

        # 2. Patient Ownership Enforcement
        if caller_role == UserRole.PATIENT:
            if caller_id != patient_id:
                raise PermissionError("Access denied: Patients can only access their own clinical records.")

        # 3. Doctor Relationship Enforcement
        if caller_role == UserRole.DOCTOR:
            if not doctor_id or not ClinicalService.check_doctor_patient_access(doctor_id, patient_id):
                raise PermissionError("Access denied: Doctors can only view clinical records of patients they have treated or are assigned to.")

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT 
                c.id, c.visit_id, c.appointment_id, c.patient_id, p.full_name AS patient_name,
                c.doctor_id, d.full_name AS doctor_name, v.visit_date, s.name AS service_name,
                c.chief_complaint, c.examination_findings, c.diagnosis, c.treatment_plan,
                c.clinical_notes, c.doctor_private_notes, c.created_at, c.updated_at
            FROM clinical_records c
            JOIN visits v ON c.visit_id = v.id
            JOIN patients p ON c.patient_id = p.id
            JOIN doctors d ON c.doctor_id = d.id
            LEFT JOIN appointments a ON c.appointment_id = a.id
            LEFT JOIN services s ON a.service_id = s.id
            WHERE c.patient_id = ?
            ORDER BY v.visit_date DESC, c.created_at DESC
        """, (patient_id,))

        records = cursor.fetchall()
        result = []

        for row in records:
            item = dict(row)

            # Rule: Patient CANNOT see internal/private doctor notes
            if caller_role == UserRole.PATIENT:
                item["doctor_private_notes"] = None

            # Fetch audits for this record
            cursor.execute("""
                SELECT id, clinical_record_id, actor_id, actor_role, field_name, old_value, new_value, reason, created_at
                FROM clinical_record_audits
                WHERE clinical_record_id = ?
                ORDER BY created_at ASC
            """, (item["id"],))
            item["audit_trail"] = [dict(a) for a in cursor.fetchall()]

            # Fetch Prescription & Versions
            cursor.execute("SELECT id, created_at FROM prescriptions WHERE visit_id = ?", (item["visit_id"],))
            rx_row = cursor.fetchone()
            if rx_row:
                cursor.execute("""
                    SELECT id, version_number, content_json, correction_reason, notes, doctor_id, is_current, created_at
                    FROM prescription_versions
                    WHERE prescription_id = ?
                    ORDER BY version_number DESC
                """, (rx_row["id"],))
                v_rows = cursor.fetchall()
                
                versions_list = []
                current_v = None
                for v in v_rows:
                    v_dict = dict(v)
                    v_dict["items"] = json.loads(v_dict["content_json"])
                    versions_list.append(v_dict)
                    if v_dict["is_current"]:
                        current_v = v_dict

                item["prescription"] = {
                    "id": rx_row["id"],
                    "visit_id": item["visit_id"],
                    "patient_id": item["patient_id"],
                    "doctor_id": item["doctor_id"],
                    "doctor_name": item["doctor_name"],
                    "current_version": current_v or (versions_list[0] if versions_list else None),
                    "all_versions": versions_list if caller_role in [UserRole.DOCTOR, UserRole.ADMIN] else [current_v] if current_v else []
                }
            else:
                item["prescription"] = None

            # Fetch Follow-up
            cursor.execute("SELECT recommended_date, instructions, status FROM follow_ups WHERE visit_id = ?", (item["visit_id"],))
            fu = cursor.fetchone()
            item["follow_up"] = dict(fu) if fu else None

            result.append(item)

        conn.close()
        return result
