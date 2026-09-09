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
        Authoritative patient-safe financial summary synchronized across all clinic views.
        Reconciles payments transactions with registered advance_balance and current_balance.
        """
        conn = get_db_connection()
        cursor = conn.cursor()

        # Fetch authoritative patient balance on record
        cursor.execute("SELECT advance_balance, current_balance FROM patients WHERE id = ?", (patient_id,))
        pat_row = cursor.fetchone()
        pat_advance = float(pat_row["advance_balance"]) if pat_row and pat_row["advance_balance"] is not None else 0.0
        pat_current = float(pat_row["current_balance"]) if pat_row and pat_row["current_balance"] is not None else 0.0

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

        total_billed = float(totals["total_billed"])
        total_paid = float(totals["total_paid"])
        # Outstanding due is synchronized with payments amount_due or patient's current_balance
        outstanding_due = max(float(totals["total_due"]), pat_current)
        if total_billed == 0.0 and outstanding_due > 0.0:
            total_billed = outstanding_due

        return {
            "patient_id": patient_id,
            "total_billed": total_billed,
            "total_paid": total_paid,
            "outstanding_due": outstanding_due,
            "outstanding_balance": outstanding_due,
            "current_balance": outstanding_due,
            "advance_balance": pat_advance,
            "advance_wallet": pat_advance,
            "wallet_balance": pat_advance,
            "has_dues": outstanding_due > 0.0,
            "recent_payments": transactions
        }
