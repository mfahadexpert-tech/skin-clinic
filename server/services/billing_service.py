"""
Hospital Management System - POS Billing & Payment Service
Tracks appointment payments, dues, payment methods, and financial summaries.
"""

import sqlite3
import uuid
import json
from datetime import datetime, date
from typing import Dict, Any, List, Optional
from database.hospital_db import get_db_connection, _lock
from database.hospital_models import PaymentCreate, PaymentStatus


class BillingService:

    @staticmethod
    def process_payment(payment_in: PaymentCreate, actor_id: str) -> Dict[str, Any]:
        """Processes payment for an appointment and generates receipt."""
        with _lock:
            conn = get_db_connection()
            try:
                cursor = conn.cursor()
                now_str = datetime.now().isoformat()

                cursor.execute("""
                    SELECT a.id, a.patient_id, a.doctor_id, a.service_id, p.full_name AS patient_name, s.name AS service_name
                    FROM appointments a
                    JOIN patients p ON a.patient_id = p.id
                    JOIN services s ON a.service_id = s.id
                    WHERE a.id = ?
                """, (payment_in.appointment_id,))
                appt = cursor.fetchone()
                if not appt:
                    raise ValueError("Appointment not found.")

                amount_due = max(0.0, payment_in.total_amount - payment_in.amount_paid)
                if payment_in.amount_paid >= payment_in.total_amount:
                    payment_status = "paid"
                elif payment_in.amount_paid > 0:
                    payment_status = "partial"
                else:
                    payment_status = "unpaid"

                payment_id = f"pay-{uuid.uuid4().hex[:8]}"
                cursor.execute("""
                    INSERT INTO payments (
                        id, appointment_id, patient_id, total_amount, amount_paid,
                        amount_due, payment_status, payment_method, notes, created_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    payment_id, payment_in.appointment_id, appt["patient_id"],
                    payment_in.total_amount, payment_in.amount_paid, amount_due,
                    payment_status, payment_in.payment_method, payment_in.notes, now_str
                ))

                # Audit Log
                cursor.execute("""
                    INSERT INTO audit_logs (id, actor_id, actor_type, action, resource_type, resource_id, metadata_json, created_at)
                    VALUES (?, ?, 'receptionist', 'process_payment', 'payment', ?, ?, ?)
                """, (
                    str(uuid.uuid4()), actor_id, payment_id,
                    json.dumps({"total": payment_in.total_amount, "paid": payment_in.amount_paid, "status": payment_status}),
                    now_str
                ))

                conn.commit()

                return {
                    "payment_id": payment_id,
                    "appointment_id": payment_in.appointment_id,
                    "patient_name": appt["patient_name"],
                    "service_name": appt["service_name"],
                    "total_amount": payment_in.total_amount,
                    "amount_paid": payment_in.amount_paid,
                    "amount_due": amount_due,
                    "payment_status": payment_status,
                    "payment_method": payment_in.payment_method,
                    "created_at": now_str
                }
            finally:
                conn.close()

    @staticmethod
    def get_patient_financial_summary(patient_id: str) -> Dict[str, Any]:
        """
        AI-safe and patient-safe basic financial summary.
        Only returns amount paid, outstanding dues, and basic charge summary.
        Excludes administrative overheads, doctor commissions, or hospital ledger.
        """
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT 
                COALESCE(SUM(total_amount), 0.0) AS total_billed,
                COALESCE(SUM(amount_paid), 0.0) AS total_paid,
                COALESCE(SUM(amount_due), 0.0) AS total_due
            FROM payments
            WHERE patient_id = ?
        """, (patient_id,))
        totals = cursor.fetchone()

        cursor.execute("""
            SELECT p.id, p.appointment_id, p.total_amount, p.amount_paid, p.amount_due, p.payment_status, p.payment_method, p.created_at, s.name AS service_name
            FROM payments p
            JOIN appointments a ON p.appointment_id = a.id
            JOIN services s ON a.service_id = s.id
            WHERE p.patient_id = ?
            ORDER BY p.created_at DESC
        """, (patient_id,))
        transactions = [dict(r) for r in cursor.fetchall()]
        conn.close()

        return {
            "patient_id": patient_id,
            "total_billed": totals["total_billed"],
            "total_paid": totals["total_paid"],
            "outstanding_due": totals["total_due"],
            "has_dues": totals["total_due"] > 0,
            "recent_payments": transactions
        }
