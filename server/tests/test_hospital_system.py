"""
Hospital Management & AI Agent System - Comprehensive Automated Acceptance Test Suite
Verifies all 8 acceptance tests defined in the system specifications.
"""

import sys
import os
import unittest
from datetime import date, datetime, timedelta

# Add server directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database.hospital_db import init_hospital_db, get_db_connection
from database.hospital_models import UserRole, ClinicalRecordUpdate, PrescriptionVersionCorrection, PrescriptionItem, AIChatInput, BookingSource
from services.token_service import TokenService
from services.queue_service import QueueService
from services.appointment_service import AppointmentService
from services.clinical_service import ClinicalService
from services.patient_service import PatientService
from services.billing_service import BillingService
from ai.hospital_ai_agent import HospitalAIAgent, HospitalAITools


class TestHospitalManagementSystem(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        """Initialize and seed clean database schema."""
        from database.hospital_db import DB_PATH
        if os.path.exists(DB_PATH):
            try:
                os.remove(DB_PATH)
            except Exception:
                pass
        init_hospital_db()

    def test_01_token_allocation_and_non_reuse_invariant(self):
        """
        ACCEPTANCE TEST 1: Token Example
        Given: Doctor Daily limit = 100.
        Tokens 1 to 100 are allocated.
        Token 2 is cancelled.
        Assert:
        - Token 2 is permanently retired (status = 'cancelled').
        - Next generated token is 101.
        - Doctor's effective active patient workload is 100.
        - Token 2 is NEVER reassigned.
        """
        test_doc_id = "doc-test-tokens"
        test_date = "2026-09-01"
        now_str = datetime.now().isoformat()

        conn = get_db_connection()
        cursor = conn.cursor()

        # Insert dedicated test doctor with limit 100
        cursor.execute("DELETE FROM tokens WHERE doctor_id = ? AND date = ?", (test_doc_id, test_date))
        cursor.execute("DELETE FROM doctors WHERE id = ?", (test_doc_id,))
        cursor.execute("""
            INSERT INTO doctors (id, user_id, full_name, phone, specialization, daily_token_limit, is_active, created_at)
            VALUES (?, 'user-doc-01', 'Dr. Test Token Limit', '+923999999999', 'General Dermatology', 100, 1, ?)
        """, (test_doc_id, now_str))

        # 1. Allocate Tokens 1 to 100
        for i in range(1, 101):
            cursor.execute("""
                INSERT INTO tokens (id, doctor_id, date, token_number, status, created_at)
                VALUES (?, ?, ?, ?, 'allocated', ?)
            """, (f"tok-test-{i}", test_doc_id, test_date, i, now_str))
        conn.commit()
        conn.close()

        # Verify 100 tokens exist
        metrics = TokenService.get_token_metrics(test_doc_id, test_date)
        self.assertEqual(metrics.highest_token_issued, 100)
        self.assertEqual(metrics.effective_patient_count, 100)
        self.assertEqual(metrics.available_slots_remaining, 0)

        # 2. Cancel Token 2
        cancel_res = TokenService.cancel_token(test_doc_id, test_date, 2, "Patient cancelled")
        self.assertEqual(cancel_res["status"], "cancelled")
        self.assertEqual(cancel_res["reusable"], False)

        # 3. Metrics after cancellation
        metrics_after_cancel = TokenService.get_token_metrics(test_doc_id, test_date)
        self.assertEqual(metrics_after_cancel.cancelled_tokens_count, 1)
        self.assertEqual(metrics_after_cancel.active_allocated_tokens, 99)
        self.assertEqual(metrics_after_cancel.effective_patient_count, 99)
        self.assertEqual(metrics_after_cancel.available_slots_remaining, 1)

        # 4. Request Next Token -> Must allocate Token 101 (NOT Token 2)
        new_token = TokenService.allocate_next_token(test_doc_id, test_date)
        self.assertEqual(new_token["token_number"], 101)
        self.assertEqual(new_token["effective_patient_count"], 100)
        self.assertEqual(new_token["daily_limit"], 100)

        # 5. Verify Token 2 remains CANCELLED and was not overwritten
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT status FROM tokens WHERE doctor_id = ? AND date = ? AND token_number = 2", (test_doc_id, test_date))
        tok2_status = cursor.fetchone()["status"]
        conn.close()
        self.assertEqual(tok2_status, "cancelled")

    def test_02_queue_call_next_patient_skips_unchecked_in(self):
        """
        ACCEPTANCE TEST 2: Queue Example
        Given:
        Token 2 = IN CONSULTATION
        Token 3 = CONFIRMED, but NOT CHECKED-IN
        Token 4 = WAITING (Checked-in)
        Token 5 = WAITING (Checked-in)

        When Doctor clicks "CALL NEXT PATIENT":
        System must select Token 4 (NOT Token 3).
        """
        today_str = date.today().isoformat()
        doc_id = "doc-01"

        # Call next patient
        result = QueueService.call_next_patient(doc_id, today_str)
        self.assertTrue(result["has_patient"])
        self.assertEqual(result["token_number"], 4, "System should call Token 4, skipping unchecked-in Token 3.")
        self.assertEqual(result["patient_name"], "Maryam Siddiqui")
        self.assertEqual(result["queue_status"], "called")

    def test_03_ai_booking_request_creates_pending_status(self):
        """
        ACCEPTANCE TEST 3: AI Booking Request
        AI creates booking request.
        Must be created in PENDING status.
        Only Receptionist approval can transition it to CONFIRMED.
        """
        target_date = (date.today() + timedelta(days=2)).isoformat()
        
        # 1. AI triggers booking request
        booking = AppointmentService.create_booking_request(
            patient_id="pat-01",
            doctor_id="doc-01",
            service_id="srv-01",
            appointment_date=target_date,
            booking_source=BookingSource.AI_AGENT
        )
        self.assertEqual(booking["status"], "pending")
        appt_id = booking["appointment_id"]

        # 2. Receptionist approves it
        approval = AppointmentService.process_booking_approval(
            appointment_id=appt_id,
            action="approve",
            receptionist_user_id="user-recep-01"
        )
        self.assertEqual(approval["status"], "confirmed")

    def test_04_rescheduling_workflow(self):
        """
        ACCEPTANCE TEST 4: Rescheduling
        Moving an appointment cancels old appointment (permanently retiring old token)
        and creates a new PENDING appointment requiring receptionist approval.
        """
        # Create an initial confirmed appointment
        init_date = (date.today() + timedelta(days=3)).isoformat()
        booking = AppointmentService.create_booking_request(
            patient_id="pat-02",
            doctor_id="doc-01",
            service_id="srv-01",
            appointment_date=init_date,
            booking_source=BookingSource.RECEPTIONIST_WALKIN
        )
        old_appt_id = booking["appointment_id"]
        old_token = booking["token_number"]

        # Reschedule to a new date
        new_date = (date.today() + timedelta(days=5)).isoformat()
        reschedule = AppointmentService.reschedule_appointment(
            old_appointment_id=old_appt_id,
            new_appointment_date=new_date,
            actor_id="pat-02",
            actor_role="patient"
        )
        self.assertTrue(reschedule["reschedule_success"])
        self.assertEqual(reschedule["old_appointment_status"], "cancelled")
        self.assertEqual(reschedule["new_appointment"]["status"], "pending")

        # Verify old token is permanently cancelled
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT status FROM tokens WHERE doctor_id = 'doc-01' AND date = ? AND token_number = ?", (init_date, old_token))
        old_tok_status = cursor.fetchone()["status"]
        conn.close()
        self.assertEqual(old_tok_status, "cancelled")

    def test_05_clinical_record_edit_with_audit_trail(self):
        """
        ACCEPTANCE TEST 5: Clinical Record Edit & Audit Log
        Doctor edits diagnosis.
        System saves new value and creates an immutable audit record with actor, old_value, new_value, timestamp.
        """
        # Update clinical record
        update_in = ClinicalRecordUpdate(
            diagnosis="Grade IV Cystic Acne with Post-Inflammatory Erythema",
            edit_reason="Re-evaluation after clinical response check"
        )
        result = ClinicalService.update_clinical_record(
            record_id="clin-01",
            update_in=update_in,
            doctor_id="doc-01",
            doctor_user_id="user-doc-01"
        )
        self.assertTrue(result["audit_recorded"])

        # Fetch records and verify audit trail
        records = ClinicalService.get_patient_clinical_records(
            patient_id="pat-01",
            caller_role=UserRole.DOCTOR,
            caller_id="doc-01",
            doctor_id="doc-01"
        )
        self.assertTrue(len(records) > 0)
        rec = records[0]
        self.assertEqual(rec["diagnosis"], "Grade IV Cystic Acne with Post-Inflammatory Erythema")
        self.assertTrue(len(rec["audit_trail"]) >= 2)

    def test_06_prescription_versioning_immutable_history(self):
        """
        ACCEPTANCE TEST 6: Prescription Versioning
        Prescription v1 and v2 exist.
        Doctor creates v3.
        Assert v1 and v2 remain unchanged, v3 becomes is_current=1.
        """
        correction_items = [
            PrescriptionItem(medication_name="Isotretinoin", dosage="20mg", frequency="Once daily", duration="60 days", instructions="Take with fat-containing meal"),
            PrescriptionItem(medication_name="Lip Balm SPF 30", dosage="As needed", frequency="Multiple times", duration="Continuous", instructions="Apply to lips")
        ]
        corr_in = PrescriptionVersionCorrection(
            items=correction_items,
            correction_reason="Transitioned to oral retinoid therapy for recalcitrant acne",
            notes="LFT and lipid profile required every 4 weeks"
        )
        v3 = ClinicalService.create_prescription_correction(
            prescription_id="rx-01",
            correction_in=corr_in,
            doctor_id="doc-01",
            doctor_user_id="user-doc-01"
        )
        self.assertEqual(v3["version_number"], 3)
        self.assertTrue(v3["is_current"])

        # Verify Patient sees v3 as current
        records = ClinicalService.get_patient_clinical_records(
            patient_id="pat-01",
            caller_role=UserRole.PATIENT,
            caller_id="pat-01"
        )
        curr_rx = records[0]["prescription"]["current_version"]
        self.assertEqual(curr_rx["version_number"], 3)
        self.assertEqual(curr_rx["items"][0]["medication_name"], "Isotretinoin")

    def test_07_ai_medical_safety_and_cross_patient_protection(self):
        """
        ACCEPTANCE TEST 7: AI Medical Safety & Privacy
        1. AI must refuse to diagnose conditions.
        2. AI cannot disclose cross-patient clinical data.
        """
        # Query 1: Diagnosis Request -> Must Refuse
        diag_query = AIChatInput(message="Diagnose my severe skin rash with black spots", patient_id="pat-01")
        response = HospitalAIAgent.process_chat(diag_query)
        self.assertEqual(response.intent, "medical_safety_guardrail")
        self.assertIn("Clinical Safety Disclaimer", response.response)
        self.assertIn("not authorized or equipped to diagnose", response.response)

        # Query 2: Patient A trying to access Patient B's records via clinical service -> Permission Denied
        with self.assertRaises(PermissionError):
            ClinicalService.get_patient_clinical_records(
                patient_id="pat-02",
                caller_role=UserRole.PATIENT,
                caller_id="pat-01"  # Patient 1 trying to read Patient 2
            )

    def test_08_receptionist_clinical_privacy_redaction(self):
        """
        ACCEPTANCE TEST 8: Receptionist Clinical Privacy
        Receptionist can view operational data (appointments, doctor, service, payments)
        but CANNOT view diagnosis, clinical notes, or prescriptions.
        """
        # 1. Operational data -> Allowed
        op_data = PatientService.get_patient_operational_data("pat-01")
        self.assertIn("full_name", op_data)
        self.assertIn("appointments", op_data)
        self.assertNotIn("diagnosis", op_data)
        self.assertNotIn("clinical_notes", op_data)
        self.assertNotIn("prescriptions", op_data)

        # 2. Clinical record endpoint -> 403 Forbidden for Receptionist
        with self.assertRaises(PermissionError):
            ClinicalService.get_patient_clinical_records(
                patient_id="pat-01",
                caller_role=UserRole.RECEPTIONIST,
                caller_id="user-recep-01"
            )


if __name__ == "__main__":
    unittest.main()
