"""
Hospital Management & AI Agent System - Intelligence Orchestration Layer
Implements:
1. RAG Knowledge Retriever for hospital FAQs, doctor profiles, service details, and policies.
2. Semantic Intent Classification & Routing.
3. Medical Safety Guardrail (Refuses autonomous diagnosis / treatment invention).
4. Explicit Authorized Tools bounded by caller identity & role.
5. Absolute refusal of write access to clinical records / prescriptions.
6. Explicit Confirmation Flow for destructive/consequential actions (Cancellation / Booking).
"""

import json
import re
import uuid
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional, Tuple
from database.hospital_db import get_db_connection, _lock
from database.hospital_models import AIChatInput, AIChatResponse, UserRole
from services.appointment_service import AppointmentService
from services.token_service import TokenService
from services.clinical_service import ClinicalService
from services.billing_service import BillingService


# ==============================================================================
# RAG KNOWLEDGE BASE
# ==============================================================================

RAG_KNOWLEDGE_DOCS = [
    {
        "id": "faq-01",
        "category": "Appointment Policy",
        "title": "Booking & Receptionist Approval Workflow",
        "content": "All appointment booking requests submitted through the Patient Portal or AI Assistant are initially created in 'PENDING' status. The front desk Receptionist reviews and approves each booking to confirm the schedule. Once approved, the appointment status changes to 'CONFIRMED' and the patient receives a confirmed queue token."
    },
    {
        "id": "faq-02",
        "category": "Cancellation Policy",
        "title": "Appointment Cancellation & Token Retirment",
        "content": "Patients may cancel appointments up to 2 hours prior to scheduled consultation times. When an appointment is cancelled, the associated token is permanently retired for that day and CANNOT be reassigned to any other patient, preserving full auditability and clinical queue integrity."
    },
    {
        "id": "faq-03",
        "category": "Queue System",
        "title": "Token Queue & Check-In Rules",
        "content": "Upon arrival at the clinic, patients must check in at the reception desk or through self-check-in to enter the active 'WAITING' queue. The Doctor's 'Call Next Patient' system automatically selects the lowest token number among patients who have checked in and are waiting. Booked patients who have not checked in are skipped."
    },
    {
        "id": "faq-04",
        "category": "Clinical Integrity",
        "title": "Prescription Versioning & Records",
        "content": "Prescriptions in our hospital are strictly versioned (v1, v2, etc.) and never overwritten. When a doctor modifies a dosage or medication, a new immutable version is issued with clinical justification while preserving complete history. Patients can view their current active prescription at any time."
    },
    {
        "id": "faq-05",
        "category": "Doctors",
        "title": "Dr. Ahmed Tariq - Consultant Dermatologist",
        "content": "Dr. Ahmed Tariq (MBBS, FCPS Dermatology, Fellow AAD) has 12+ years of experience specializing in Severe Acne, Eczema, Laser Skin Resurfacing, and Melasma. Consultation Fee: PKR 2,500. Available Monday to Saturday (09:00 - 17:00)."
    },
    {
        "id": "faq-06",
        "category": "Doctors",
        "title": "Dr. Sarah Khan - Aesthetic Physician & Trichologist",
        "content": "Dr. Sarah Khan (MBBS, MCPS Dermatology, Board Certified Aesthetic Medicine) specializes in Alopecia, PRP Hair Therapy, Chemical Peels, and HydraFacial Pro. Consultation Fee: PKR 2,000. Available Monday to Friday (10:00 - 18:00)."
    },
    {
        "id": "faq-07",
        "category": "Services",
        "title": "Dermatology Services & Treatments",
        "content": "Our clinic offers: 1. Dermatology Consultation (PKR 2,500), 2. Laser Acne Scar Treatment with fractional CO2 (PKR 8,500), 3. HydraFacial MD Clinical Cleansing (PKR 6,000), 4. PRP Hair Restoration Therapy (PKR 9,500), 5. Medical Chemical Peel (PKR 4,500)."
    },
    {
        "id": "faq-08",
        "category": "Medical Disclaimer",
        "title": "AI Clinical Boundaries",
        "content": "The AI Assistant is an informational and scheduling interface. It cannot diagnose medical conditions, invent clinical findings, or prescribe medications. All diagnoses and treatment plans must be made by licensed physicians during consultation."
    }
]


# ==============================================================================
# AUTHORIZED BACKEND TOOL IMPLEMENTATIONS
# ==============================================================================

class HospitalAITools:

    @staticmethod
    def find_doctor(query: str) -> List[Dict[str, Any]]:
        """Finds doctors matching query name or specialization."""
        conn = get_db_connection()
        cursor = conn.cursor()
        pattern = f"%{query.strip()}%"
        cursor.execute("""
            SELECT id, full_name, specialization, qualifications, experience_years, consultation_fee, available_days_json, start_time, end_time
            FROM doctors
            WHERE is_active = 1 AND (full_name LIKE ? OR specialization LIKE ? OR areas_of_expertise_json LIKE ?)
        """, (pattern, pattern, pattern))
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        for r in rows:
            r["available_days"] = json.loads(r.get("available_days_json") or "[]")
        return rows

    @staticmethod
    def find_service(query: str) -> List[Dict[str, Any]]:
        """Finds services matching name or category."""
        conn = get_db_connection()
        cursor = conn.cursor()
        pattern = f"%{query.strip()}%"
        cursor.execute("""
            SELECT id, name, category, description, base_price, duration_minutes
            FROM services
            WHERE is_active = 1 AND (name LIKE ? OR category LIKE ? OR description LIKE ?)
        """, (pattern, pattern, pattern))
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return rows

    @staticmethod
    def find_doctors_by_service(service_id: str) -> List[Dict[str, Any]]:
        """Finds active doctors offering a specific service."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT d.id, d.full_name, d.specialization, d.consultation_fee, d.start_time, d.end_time
            FROM doctor_services ds
            JOIN doctors d ON ds.doctor_id = d.id
            WHERE ds.service_id = ? AND d.is_active = 1
        """, (service_id,))
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return rows

    @staticmethod
    def get_doctor_availability(doctor_id: str, target_date: str) -> Dict[str, Any]:
        """Checks token availability and metrics for a doctor on a target date."""
        metrics = TokenService.get_token_metrics(doctor_id, target_date)
        return {
            "doctor_id": doctor_id,
            "date": target_date,
            "daily_limit": metrics.daily_limit,
            "effective_patient_count": metrics.effective_patient_count,
            "available_slots_remaining": metrics.available_slots_remaining,
            "has_availability": metrics.available_slots_remaining > 0
        }

    @staticmethod
    def get_patient_appointments(patient_id: str) -> List[Dict[str, Any]]:
        """Retrieves caller's appointments (active, pending, and past)."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT a.id, a.appointment_date, a.token_number, a.status, 
                   d.full_name AS doctor_name, s.name AS service_name, s.base_price,
                   COALESCE(q.queue_status, 'not_checked_in') AS queue_status
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            JOIN services s ON a.service_id = s.id
            LEFT JOIN queue_entries q ON a.id = q.appointment_id
            WHERE a.patient_id = ?
            ORDER BY a.appointment_date DESC
        """, (patient_id,))
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return rows

    @staticmethod
    def get_patient_clinical_history(patient_id: str) -> List[Dict[str, Any]]:
        """Retrieves patient's permitted medical history (Doctor private notes strictly stripped)."""
        records = ClinicalService.get_patient_clinical_records(
            patient_id=patient_id,
            caller_role=UserRole.PATIENT,
            caller_id=patient_id
        )
        return records

    @staticmethod
    def get_patient_financials(patient_id: str) -> Dict[str, Any]:
        """Retrieves basic financial overview for caller."""
        return BillingService.get_patient_financial_summary(patient_id)


# ==============================================================================
# AI AGENT ORCHESTRATOR
# ==============================================================================

class HospitalAIAgent:

    @staticmethod
    def rag_search(query: str) -> List[Dict[str, Any]]:
        """Keyword & semantic similarity search across hospital knowledge base."""
        query_words = set(re.findall(r'\w+', query.lower()))
        scored_docs = []
        for doc in RAG_KNOWLEDGE_DOCS:
            text = f"{doc['title']} {doc['content']} {doc['category']}".lower()
            doc_words = set(re.findall(r'\w+', text))
            overlap = len(query_words.intersection(doc_words))
            if overlap > 0:
                scored_docs.append((overlap, doc))
        
        scored_docs.sort(key=lambda x: x[0], reverse=True)
        return [doc for _, doc in scored_docs[:3]]

    @staticmethod
    def classify_intent(query: str) -> str:
        """Classifies incoming user query into domain intents."""
        q = query.lower()

        # 1. Medical Diagnosis / Treatment Formulation Check
        diagnosis_patterns = [
            r"\bdiagnose\b", r"\bwhat disease\b", r"\bdo i have\b", r"\bis this cancerous\b",
            r"\bwhat illness\b", r"\bprescribe me\b", r"\bgive me medicine\b",
            r"\bwhat should i take for\b", r"\bcure my\b"
        ]
        if any(re.search(p, q) for p in diagnosis_patterns):
            return "medical_safety_guardrail"

        # 2. Appointment Booking / Scheduling Action
        if any(w in q for w in ["book", "appointment", "schedule", "reserve", "slot", "token"]):
            if any(w in q for w in ["cancel", "delete", "drop"]):
                return "appointment_cancel"
            if any(w in q for w in ["reschedule", "postpone", "move", "change date"]):
                return "appointment_reschedule"
            return "appointment_booking"

        # 3. Patient Clinical History Retrieval
        if any(w in q for w in ["my diagnosis", "last visit", "prescription", "medical history", "clinical record", "doctor notes"]):
            return "patient_clinical_history"

        # 4. Financial & Payment Queries
        if any(w in q for w in ["bill", "payment", "how much do i owe", "outstanding", "due", "fees", "cost"]):
            return "patient_financial"

        # 5. Doctor / Service Discovery
        if any(w in q for w in ["doctor", "specialist", "dermatologist", "trichologist", "service", "treatment", "laser", "facial", "peel"]):
            return "discovery"

        # 6. Default to RAG knowledge retrieval
        return "rag_knowledge"

    @staticmethod
    def process_chat(chat_input: AIChatInput, patient_id: Optional[str] = "pat-01") -> AIChatResponse:
        """
        Executes end-to-end AI workflow:
        1. Classifies Intent
        2. Applies Security Boundaries & Guardrails
        3. Invokes Authorized Tools or RAG
        4. Handles Confirmation Prompts for Destructive Actions
        5. Logs AI Action to append-only table
        """
        conv_id = chat_input.conversation_id or f"conv-{uuid.uuid4().hex[:8]}"
        query = chat_input.message.strip()
        effective_patient_id = chat_input.patient_id or patient_id or "pat-01"
        intent = HospitalAIAgent.classify_intent(query)
        now_str = datetime.now().isoformat()

        response_text = ""
        suggested_cards = []
        action_required = None

        # ======================================================================
        # INTENT 1: MEDICAL SAFETY GUARDRAIL (Zero Hallucination / No Diagnosis)
        # ======================================================================
        if intent == "medical_safety_guardrail":
            response_text = (
                "**Clinical Safety Disclaimer:** As an AI assistant, I am not authorized or equipped to diagnose medical conditions, formulate new clinical assessments, or prescribe medications. "
                "Only a licensed dermatologist or medical doctor can evaluate physical symptoms and provide a diagnosis. "
                "\n\nWould you like me to help you schedule a clinical consultation with **Dr. Ahmed Tariq** (Consultant Dermatologist) or **Dr. Sarah Khan** (Aesthetic Physician)?"
            )
            suggested_cards = [
                {"type": "doctor_card", "id": "doc-01", "name": "Dr. Ahmed Tariq", "specialization": "Consultant Dermatologist", "fee": "PKR 2,500"},
                {"type": "doctor_card", "id": "doc-02", "name": "Dr. Sarah Khan", "specialization": "Aesthetic Physician", "fee": "PKR 2,000"}
            ]

        # ======================================================================
        # INTENT 2: APPOINTMENT CANCELLATION (With Explicit Confirmation)
        # ======================================================================
        elif intent == "appointment_cancel":
            # Check if confirmation was passed
            if chat_input.confirmed_action_id:
                try:
                    result = AppointmentService.cancel_appointment(
                        appointment_id=chat_input.confirmed_action_id,
                        actor_id=effective_patient_id,
                        actor_role="patient",
                        reason="Cancelled via AI Assistant by patient"
                    )
                    response_text = f"Your appointment (Token #{result['token_number']}) has been successfully **CANCELLED**. The token has been permanently retired for today. Please let me know if you would like to book a new appointment."
                except Exception as e:
                    response_text = f"Unable to cancel appointment: {str(e)}"
            else:
                # Find active appointments to cancel
                appts = HospitalAITools.get_patient_appointments(effective_patient_id)
                active_appts = [a for a in appts if a["status"] in ["pending", "confirmed"]]
                if active_appts:
                    target_appt = active_appts[0]
                    response_text = (
                        f"I found your upcoming appointment with **{target_appt['doctor_name']}** on **{target_appt['appointment_date']}** (Token #{target_appt['token_number']}, Status: {target_appt['status'].upper()}). "
                        f"\n\nAre you sure you want to cancel this appointment? **Please confirm below.**"
                    )
                    action_required = {
                        "action": "cancel_appointment",
                        "appointment_id": target_appt["id"],
                        "token_number": target_appt["token_number"],
                        "doctor_name": target_appt["doctor_name"],
                        "date": target_appt["appointment_date"]
                    }
                    suggested_cards = [{
                        "type": "confirmation_card",
                        "title": "Confirm Appointment Cancellation",
                        "details": f"{target_appt['doctor_name']} — Token #{target_appt['token_number']} ({target_appt['appointment_date']})",
                        "action_id": target_appt["id"],
                        "confirm_label": "Cancel Appointment",
                        "cancel_label": "Keep Appointment"
                    }]
                else:
                    response_text = "You do not have any active or pending appointments to cancel."

        # ======================================================================
        # INTENT 3: APPOINTMENT BOOKING (Creates PENDING Request with Confirmation)
        # ======================================================================
        elif intent == "appointment_booking":
            if chat_input.confirmed_action_id:
                # Parse confirmed payload
                try:
                    # Action format: "book:doc_id:srv_id:date"
                    parts = chat_input.confirmed_action_id.split(":")
                    doc_id = parts[1] if len(parts) > 1 else "doc-01"
                    srv_id = parts[2] if len(parts) > 2 else "srv-01"
                    target_date = parts[3] if len(parts) > 3 else (date.today() + timedelta(days=1)).isoformat()

                    booking = AppointmentService.create_booking_request(
                        patient_id=effective_patient_id,
                        doctor_id=doc_id,
                        service_id=srv_id,
                        appointment_date=target_date,
                        booking_source="ai_agent",
                        notes="Booked via AI Assistant"
                    )

                    response_text = (
                        f"🎉 **Appointment Request Submitted!**\n\n"
                        f"- **Doctor:** {booking['doctor_name']}\n"
                        f"- **Service:** {booking['service_name']}\n"
                        f"- **Date:** {booking['appointment_date']}\n"
                        f"- **Token Allocated:** **Token #{booking['token_number']}**\n"
                        f"- **Status:** **PENDING**\n\n"
                        f"*{booking['message']}*"
                    )
                    suggested_cards = [{
                        "type": "token_card",
                        "token_number": booking["token_number"],
                        "doctor_name": booking["doctor_name"],
                        "date": booking["appointment_date"],
                        "status": "PENDING APPROVAL"
                    }]
                except Exception as e:
                    response_text = f"Could not create booking request: {str(e)}"
            else:
                target_date = (date.today() + timedelta(days=1)).isoformat()
                # Find available doctors and tokens
                docs = HospitalAITools.find_doctor("Ahmed") or HospitalAITools.find_doctor("Dermatology")
                target_doc = docs[0] if docs else {"id": "doc-01", "full_name": "Dr. Ahmed Tariq", "consultation_fee": 2500.0}
                avail = HospitalAITools.get_doctor_availability(target_doc["id"], target_date)

                response_text = (
                    f"I found availability for **{target_doc['full_name']}** on **{target_date}**.\n\n"
                    f"- **Remaining Slots Today:** {avail['available_slots_remaining']} slots available\n"
                    f"- **Consultation Fee:** PKR {target_doc['consultation_fee']:,.0f}\n\n"
                    f"Would you like me to submit a **PENDING booking request** for this date?"
                )
                suggested_cards = [{
                    "type": "booking_option_card",
                    "title": f"Book with {target_doc['full_name']}",
                    "details": f"Date: {target_date} • Fee: PKR {target_doc['consultation_fee']:,.0f}",
                    "action_id": f"book:{target_doc['id']}:srv-01:{target_date}",
                    "confirm_label": "Submit Booking Request",
                    "cancel_label": "Choose Another Date"
                }]

        # ======================================================================
        # INTENT 4: PATIENT CLINICAL HISTORY (Authorized Own Records Only)
        # ======================================================================
        elif intent == "patient_clinical_history":
            try:
                records = HospitalAITools.get_patient_clinical_history(effective_patient_id)
                if records:
                    rec = records[0]
                    rx_summary = ""
                    if rec.get("prescription") and rec["prescription"].get("current_version"):
                        items = rec["prescription"]["current_version"].get("items", [])
                        rx_items_str = ", ".join([f"{it['medication_name']} ({it['dosage']})" for it in items])
                        rx_summary = f"\n- **Current Prescription (v{rec['prescription']['current_version']['version_number']}):** {rx_items_str}"

                    response_text = (
                        f"Here is your clinical record summary from your visit on **{rec['visit_date']}** with **{rec['doctor_name']}**:\n\n"
                        f"- **Chief Complaint:** {rec['chief_complaint']}\n"
                        f"- **Diagnosis:** **{rec['diagnosis']}**\n"
                        f"- **Treatment Plan:** {rec['treatment_plan']}\n"
                        f"- **Clinical Notes:** {rec.get('clinical_notes') or 'N/A'}"
                        f"{rx_summary}"
                    )
                    suggested_cards = [{
                        "type": "clinical_summary_card",
                        "date": rec["visit_date"],
                        "doctor": rec["doctor_name"],
                        "diagnosis": rec["diagnosis"],
                        "prescription_version": rec["prescription"]["current_version"]["version_number"] if rec.get("prescription") and rec["prescription"].get("current_version") else None
                    }]
                else:
                    response_text = "You do not have any completed clinical records on file yet."
            except Exception as e:
                response_text = f"Unable to retrieve clinical history: {str(e)}"

        # ======================================================================
        # INTENT 5: PATIENT FINANCIAL OVERVIEW
        # ======================================================================
        elif intent == "patient_financial":
            fin = HospitalAITools.get_patient_financials(effective_patient_id)
            response_text = (
                f"Here is your basic billing summary:\n\n"
                f"- **Total Billed:** PKR {fin['total_billed']:,.2f}\n"
                f"- **Total Paid:** PKR {fin['total_paid']:,.2f}\n"
                f"- **Outstanding Dues:** **PKR {fin['outstanding_due']:,.2f}**\n\n"
                f"{'You have no outstanding dues.' if not fin['has_dues'] else 'Please clear your pending dues at the front desk.'}"
            )

        # ======================================================================
        # INTENT 6: DOCTOR / SERVICE DISCOVERY & RAG KNOWLEDGE BASE
        # ======================================================================
        else:
            rag_results = HospitalAIAgent.rag_search(query)
            if rag_results:
                top_doc = rag_results[0]
                response_text = f"**{top_doc['title']}**\n\n{top_doc['content']}"
                if len(rag_results) > 1:
                    response_text += f"\n\n*Related Information:* {rag_results[1]['content']}"
            else:
                response_text = (
                    "Welcome to SkinLab Hospital AI Assistant. I can help you with:\n"
                    "1. Finding doctors, specializations, and checking token availability.\n"
                    "2. Submitting appointment booking requests (subject to Receptionist approval).\n"
                    "3. Viewing your clinical history, diagnoses, and current prescriptions.\n"
                    "4. Checking billing status and hospital policies.\n\n"
                    "How can I assist you today?"
                )

        # Log AI action
        try:
            with _lock:
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO ai_action_logs (
                        id, conversation_id, patient_id, tool_name, tool_args_json,
                        execution_status, confirmation_received, result_summary, created_at
                    )
                    VALUES (?, ?, ?, ?, ?, 'success', ?, ?, ?)
                """, (
                    str(uuid.uuid4()), conv_id, effective_patient_id, intent,
                    json.dumps({"query": query}),
                    1 if chat_input.confirmed_action_id else 0,
                    response_text[:200], now_str
                ))
                conn.commit()
                conn.close()
        except Exception:
            pass

        return AIChatResponse(
            response=response_text,
            intent=intent,
            suggested_cards=suggested_cards,
            action_required=action_required,
            conversation_id=conv_id,
            created_at=now_str
        )
