"""
Hospital Management System - Patient Treatment Package & Multi-Session Service
Provides exclusive clinical authority for doctors to:
1. Prescribe customized combinations of treatments/services (e.g. 5x Laser, 3x Facials, 2x Manicures).
2. Track sessions served vs total allowed across multiple visits.
3. Mark sessions as served during consultation (+1 session consumed).
4. Update package pricing, notes, and session allocations.
"""

import sqlite3
import uuid
from datetime import datetime, date
from typing import Dict, Any, List, Optional
from database.hospital_db import get_db_connection, _lock
from database.hospital_models import (
    PatientPackageCreateRequest, PatientPackageUpdateRequest, 
    PatientPackageOut, PackageItemOut
)


class TreatmentPackageService:

    @staticmethod
    def list_patient_packages(patient_id: str, doctor_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Retrieves all tailored packages for a given patient.
        Optionally filtered by doctor_id (for chamber isolation).
        """
        conn = get_db_connection()
        cursor = conn.cursor()

        query = """
            SELECT p.id, p.patient_id, p.doctor_id, p.package_name, p.package_type,
                   p.total_price, p.discount_amount, p.status, p.notes, p.created_at, p.updated_at,
                   d.full_name as doctor_name, d.specialization as doctor_specialization
            FROM patient_treatment_packages p
            LEFT JOIN doctors d ON p.doctor_id = d.id
            WHERE p.patient_id = ?
        """
        params = [patient_id]
        if doctor_id:
            query += " AND p.doctor_id = ?"
            params.append(doctor_id)

        query += " ORDER BY p.created_at DESC"
        cursor.execute(query, tuple(params))
        package_rows = cursor.fetchall()

        packages = []
        for pkg_row in package_rows:
            pkg = dict(pkg_row)
            pkg_id = pkg["id"]

            # Fetch items for this package
            cursor.execute("""
                SELECT id, package_id, service_id, item_name, sessions_total, sessions_used,
                       unit_price, last_served_date, last_served_doctor_id, status, created_at
                FROM patient_package_items
                WHERE package_id = ?
                ORDER BY created_at ASC
            """, (pkg_id,))
            item_rows = cursor.fetchall()

            items = []
            total_sessions = 0
            consumed_sessions = 0

            for it_row in item_rows:
                it = dict(it_row)
                s_total = int(it.get("sessions_total") or 1)
                s_used = int(it.get("sessions_used") or 0)
                it["sessions_remaining"] = max(0, s_total - s_used)
                total_sessions += s_total
                consumed_sessions += s_used
                items.append(it)

            pkg["items"] = items
            pkg["total_sessions"] = total_sessions
            pkg["consumed_sessions"] = consumed_sessions
            pkg["remaining_sessions"] = max(0, total_sessions - consumed_sessions)
            pkg["final_price"] = max(0.0, float(pkg.get("total_price") or 0.0) - float(pkg.get("discount_amount") or 0.0))
            packages.append(pkg)

        conn.close()
        return packages

    @staticmethod
    def get_package_by_id(package_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a specific treatment package with all multi-session items."""
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT p.id, p.patient_id, p.doctor_id, p.package_name, p.package_type,
                   p.total_price, p.discount_amount, p.status, p.notes, p.created_at, p.updated_at,
                   d.full_name as doctor_name, d.specialization as doctor_specialization
            FROM patient_treatment_packages p
            LEFT JOIN doctors d ON p.doctor_id = d.id
            WHERE p.id = ?
        """, (package_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return None

        pkg = dict(row)
        cursor.execute("""
            SELECT id, package_id, service_id, item_name, sessions_total, sessions_used,
                   unit_price, last_served_date, last_served_doctor_id, status, created_at
            FROM patient_package_items
            WHERE package_id = ?
            ORDER BY created_at ASC
        """, (package_id,))
        item_rows = cursor.fetchall()

        items = []
        total_sessions = 0
        consumed_sessions = 0
        for it_row in item_rows:
            it = dict(it_row)
            s_total = int(it.get("sessions_total") or 1)
            s_used = int(it.get("sessions_used") or 0)
            it["sessions_remaining"] = max(0, s_total - s_used)
            total_sessions += s_total
            consumed_sessions += s_used
            items.append(it)

        pkg["items"] = items
        pkg["total_sessions"] = total_sessions
        pkg["consumed_sessions"] = consumed_sessions
        pkg["remaining_sessions"] = max(0, total_sessions - consumed_sessions)
        pkg["final_price"] = max(0.0, float(pkg.get("total_price") or 0.0) - float(pkg.get("discount_amount") or 0.0))

        conn.close()
        return pkg

    @staticmethod
    def create_patient_package(patient_id: str, doctor_id: str, payload: PatientPackageCreateRequest) -> Dict[str, Any]:
        """
        Prescribes a new treatment package or single service for a patient.
        Strictly executed by an attending Doctor or Admin.
        """
        with _lock:
            conn = get_db_connection()
            cursor = conn.cursor()

            # Verify patient exists
            cursor.execute("SELECT id, full_name FROM patients WHERE id = ?", (patient_id,))
            p_row = cursor.fetchone()
            if not p_row:
                conn.close()
                raise ValueError(f"Patient with ID '{patient_id}' not found.")

            # Verify doctor exists
            cursor.execute("SELECT id, full_name FROM doctors WHERE id = ?", (doctor_id,))
            d_row = cursor.fetchone()
            if not d_row:
                conn.close()
                raise ValueError(f"Doctor with ID '{doctor_id}' not found.")

            now_str = datetime.now().isoformat()
            today_str = date.today().isoformat()
            pkg_id = f"pkg-{uuid.uuid4().hex[:8]}"

            cursor.execute("""
                INSERT INTO patient_treatment_packages (
                    id, patient_id, doctor_id, package_name, package_type,
                    total_price, discount_amount, status, notes, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)
            """, (
                pkg_id, patient_id, doctor_id, payload.package_name.strip(),
                payload.package_type, float(payload.total_price),
                float(payload.discount_amount), payload.notes or "",
                now_str, now_str
            ))

            # Insert combination items
            for item in payload.items:
                item_id = f"item-{uuid.uuid4().hex[:8]}"
                s_total = max(1, int(item.sessions_total))
                s_used = max(0, int(item.sessions_used))
                status = "completed" if s_used >= s_total else "in_progress"
                last_served = today_str if s_used > 0 else None
                last_doc = doctor_id if s_used > 0 else None

                cursor.execute("""
                    INSERT INTO patient_package_items (
                        id, package_id, service_id, item_name, sessions_total,
                        sessions_used, unit_price, last_served_date, last_served_doctor_id,
                        status, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    item_id, pkg_id, item.service_id, item.item_name.strip(),
                    s_total, s_used, float(item.unit_price), last_served, last_doc,
                    status, now_str
                ))

                if s_used > 0:
                    cursor.execute("""
                        INSERT INTO patient_session_logs (
                            id, package_id, item_id, patient_id, doctor_id,
                            action, sessions_delta, notes, timestamp
                        ) VALUES (?, ?, ?, ?, ?, 'session_served', ?, 'Session served during package creation', ?)
                    """, (str(uuid.uuid4()), pkg_id, item_id, patient_id, doctor_id, s_used, now_str))

            # Audit log
            cursor.execute("""
                INSERT INTO audit_logs (
                    id, actor_id, actor_type, action, resource_type,
                    resource_id, new_state_json, created_at
                ) VALUES (?, ?, 'doctor', 'create_patient_package', 'patient_treatment_packages', ?, ?, ?)
            """, (
                str(uuid.uuid4()), doctor_id, pkg_id,
                f'{{"patient_id": "{patient_id}", "package_name": "{payload.package_name}", "total_price": {payload.total_price}}}',
                now_str
            ))

            conn.commit()
            conn.close()

        return TreatmentPackageService.get_package_by_id(pkg_id)

    @staticmethod
    def update_patient_package(package_id: str, doctor_id: str, payload: PatientPackageUpdateRequest) -> Dict[str, Any]:
        """
        Updates package details or item configurations.
        """
        with _lock:
            conn = get_db_connection()
            cursor = conn.cursor()

            cursor.execute("SELECT * FROM patient_treatment_packages WHERE id = ?", (package_id,))
            pkg_row = cursor.fetchone()
            if not pkg_row:
                conn.close()
                raise ValueError(f"Treatment package with ID '{package_id}' not found.")

            now_str = datetime.now().isoformat()
            updates = []
            params = []

            if payload.package_name is not None:
                updates.append("package_name = ?")
                params.append(payload.package_name.strip())
            if payload.package_type is not None:
                updates.append("package_type = ?")
                params.append(payload.package_type)
            if payload.total_price is not None:
                updates.append("total_price = ?")
                params.append(float(payload.total_price))
            if payload.discount_amount is not None:
                updates.append("discount_amount = ?")
                params.append(float(payload.discount_amount))
            if payload.status is not None:
                updates.append("status = ?")
                params.append(payload.status)
            if payload.notes is not None:
                updates.append("notes = ?")
                params.append(payload.notes)

            updates.append("updated_at = ?")
            params.append(now_str)

            params.append(package_id)
            cursor.execute(f"UPDATE patient_treatment_packages SET {', '.join(updates)} WHERE id = ?", tuple(params))

            # If items provided, replace/synchronize items
            if payload.items is not None:
                today_str = date.today().isoformat()
                cursor.execute("DELETE FROM patient_package_items WHERE package_id = ?", (package_id,))
                for item in payload.items:
                    item_id = f"item-{uuid.uuid4().hex[:8]}"
                    s_total = max(1, int(item.sessions_total))
                    s_used = max(0, int(item.sessions_used))
                    status = "completed" if s_used >= s_total else "in_progress"
                    last_served = today_str if s_used > 0 else None
                    cursor.execute("""
                        INSERT INTO patient_package_items (
                            id, package_id, service_id, item_name, sessions_total,
                            sessions_used, unit_price, last_served_date, last_served_doctor_id,
                            status, created_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        item_id, package_id, item.service_id, item.item_name.strip(),
                        s_total, s_used, float(item.unit_price), last_served, doctor_id if s_used > 0 else None,
                        status, now_str
                    ))

            conn.commit()
            conn.close()

        return TreatmentPackageService.get_package_by_id(package_id)

    @staticmethod
    def consume_package_session(package_id: str, item_id: str, doctor_id: str, delta: int = 1, notes: Optional[str] = None) -> Dict[str, Any]:
        """
        Marks one or more sessions as consumed/served by a doctor during consultation.
        Validates that consumed sessions do not exceed total allowed sessions.
        """
        with _lock:
            conn = get_db_connection()
            cursor = conn.cursor()

            cursor.execute("SELECT * FROM patient_treatment_packages WHERE id = ?", (package_id,))
            pkg_row = cursor.fetchone()
            if not pkg_row:
                conn.close()
                raise ValueError(f"Package '{package_id}' not found.")

            cursor.execute("SELECT * FROM patient_package_items WHERE id = ? AND package_id = ?", (item_id, package_id))
            it_row = cursor.fetchone()
            if not it_row:
                conn.close()
                raise ValueError(f"Package item '{item_id}' not found in package '{package_id}'.")

            current_used = int(it_row["sessions_used"])
            total_allowed = int(it_row["sessions_total"])
            new_used = current_used + delta

            if new_used > total_allowed:
                conn.close()
                raise ValueError(f"Cannot consume session: only {total_allowed - current_used} remaining out of {total_allowed}.")
            if new_used < 0:
                new_used = 0

            item_status = "completed" if new_used >= total_allowed else "in_progress"
            now_str = datetime.now().isoformat()
            today_str = date.today().isoformat()

            cursor.execute("""
                UPDATE patient_package_items
                SET sessions_used = ?, status = ?, last_served_date = ?, last_served_doctor_id = ?
                WHERE id = ?
            """, (new_used, item_status, today_str, doctor_id, item_id))

            # Log to session logs
            cursor.execute("""
                INSERT INTO patient_session_logs (
                    id, package_id, item_id, patient_id, doctor_id,
                    action, sessions_delta, notes, timestamp
                ) VALUES (?, ?, ?, ?, ?, 'session_served', ?, ?, ?)
            """, (
                str(uuid.uuid4()), package_id, item_id, pkg_row["patient_id"],
                doctor_id, delta, notes or "Session served during consultation", now_str
            ))

            # Check if all items in package are now completed
            cursor.execute("SELECT COUNT(*) as remaining_items FROM patient_package_items WHERE package_id = ? AND status != 'completed'", (package_id,))
            rem = cursor.fetchone()["remaining_items"]
            if rem == 0:
                cursor.execute("UPDATE patient_treatment_packages SET status = 'completed', updated_at = ? WHERE id = ?", (now_str, package_id))
            else:
                cursor.execute("UPDATE patient_treatment_packages SET status = 'active', updated_at = ? WHERE id = ?", (now_str, package_id))

            conn.commit()
            conn.close()

        return TreatmentPackageService.get_package_by_id(package_id)
