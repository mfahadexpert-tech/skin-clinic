# Hospital Management & AI Agent System

A production-quality, enterprise-grade Clinic & Hospital Operating System with an Integrated Governed AI Assistant, Non-Reusable Concurrency-Safe Tokens, Authoritative Receptionist Approval Workflow, Queue State Machine, Append-Only Clinical Record Auditing, and Immutable Prescription Versioning.

---

## 🎨 Mandatory Brand Palette Tokens

- `--color-50:  #E0FBFC` (Very light cyan - page backgrounds, subtle highlights, selected states, AI surfaces)
- `--color-100: #C2DFE3` (Soft blue-gray - secondary surfaces, cards, subtle sections, hover states)
- `--color-300: #9DB4C0` (Muted blue-gray - borders, dividers, secondary icons, inactive elements, badges)
- `--color-600: #5C6B73` (Dark slate gray - secondary text, secondary buttons, controls, labels)
- `--color-900: #253237` (Deep charcoal - primary headings, primary text, navigation, primary buttons)

---

## 🚀 Core Architectural Features

### 1. Token Invariant & Queue Lifecycle Engine
- **Non-Reusable Cancelled Tokens**: Cancelled tokens (e.g. Token 2) are permanently retired and can **never** be reallocated on that day.
- **Effective Patient Workload Cap**: Cancelled tokens do not consume active doctor capacity. For a daily limit of 100, if Token 2 is cancelled, the system safely generates **Token 101** for the 100th active patient.
- **Intelligent "Call Next Patient" Algorithm**: Doctor's dashboard selects the lowest token number strictly in `waiting` (checked-in) state, automatically skipping booked patients who have not checked in (`not_checked_in`).

### 2. Authoritative Receptionist Approval Workflow
- Booking requests initiated through the **Patient Portal** or the **AI Agent** are strictly created in `PENDING` status.
- Only the authorized front-desk Receptionist workflow can review and transition bookings to `CONFIRMED` or `DECLINED`.

### 3. Clinical Record Integrity & Append-Only Audit Logging
- Attending doctors can edit completed clinical records.
- Every field modification (`diagnosis`, `examination_findings`, `treatment_plan`, etc.) appends an immutable record to `clinical_record_audits` capturing the actor ID, timestamp, old value, new value, and clinical justification.

### 4. Immutable Prescription Versioning
- Prescriptions are strictly versioned (`v1`, `v2`, `v3`...) and **never overwritten**.
- Prior versions remain intact for historical audits while the latest version is flagged as `is_current = True` and presented to the patient.

### 5. Multi-Tiered Clinical Privacy & RBAC
- **Receptionist Privacy**: Receptionists have full access to operational records (appointments, doctor, service, visit dates, payment status, follow-up dates), but **diagnosis, examination findings, clinical notes, and prescriptions are strictly redacted** at the backend API level (returning 403 Forbidden).
- **Patient Privacy**: Patients can view their full clinical records and current prescriptions, but **Doctor Private Notes** are strictly stripped.
- **Doctor Permissions**: Doctors can access clinical history only for patients they have previously treated or are currently assigned to.

### 6. Governed AI Agent Layer (RAG + Safety Guardrails)
- **RAG Knowledge Retrieval**: Grounds answers to hospital FAQs, doctor credentials, services, and cancellation policies.
- **Medical Safety Guardrail**: AI explicitly refuses to diagnose medical conditions or invent clinical treatments, advising patients to book a doctor consultation.
- **Controlled Authorized Backend Tools**: AI operates through authenticated backend tools with explicit human confirmation prompts for booking and cancellation.

---

## 📁 System Architecture & Directory Structure

```
skinlab-ai-clinic/
├── client/                               # Frontend: React 18 / Next.js 14
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.jsx                # Clinical Typography & Root Metadata
│   │   │   ├── page.jsx                  # Master App Render
│   │   │   └── globals.css               # Mandatory Palette & Clinical Design Tokens
│   │   ├── components/
│   │   │   └── Hospital/
│   │   │       ├── HospitalApp.jsx       # Multi-role Workspace Switcher & Shell
│   │   │       ├── ReceptionistView.jsx  # Booking Approval, Queue & POS Billing
│   │   │       ├── DoctorView.jsx        # Call Next Patient & Clinical Record Versioning
│   │   │       ├── PatientPortal.jsx     # 5-Step Booking Stepper & Medical History
│   │   │       ├── AdminView.jsx         # Governance, Limits & System Audit Trail
│   │   │       ├── AIChatModal.jsx       # Governed AI Assistant with RAG & Action Cards
│   │   │       └── SharedComponents.jsx  # TokenBadge, StatusBadge, AuditTimeline
│   │   └── lib/
│   │       └── hospitalApi.js            # REST API Client
│
└── server/                               # Backend: Python 3.10+ (FastAPI + SQLite WAL)
    ├── main.py                           # FastAPI Server Entrypoint
    ├── database/
    │   ├── hospital_models.py            # Strict Pydantic Domain Schemas
    │   ├── hospital_db.py                # Concurrency-safe Persistence & Seeding
    │   └── hospital_system.db            # SQLite WAL Relational Database
    ├── services/
    │   ├── token_service.py              # Atomic Token Allocator & Limit Engine
    │   ├── queue_service.py              # Call-Next & Check-in Logic
    │   ├── appointment_service.py        # Booking Requests & Receptionist Approval
    │   ├── clinical_service.py           # Field Edit Audits & Prescription Versioning
    │   ├── patient_service.py            # Duplicate Checks & Operational Redaction
    │   ├── billing_service.py            # POS Receipts & Dues Summary
    │   └── notification_service.py       # Multi-Channel Failover Engine
    ├── ai/
    │   └── hospital_ai_agent.py          # RAG Engine, Intent Classifier & Tool Bounding
    ├── routers/
    │   └── hospital_router.py            # REST API Routes (/api/hospital/...)
    └── tests/
        └── test_hospital_system.py       # Automated Acceptance Test Suite (8 Tests)
```

---

## 🧪 Running the Acceptance Tests

Execute the comprehensive automated acceptance test suite verifying all 8 critical business rules and invariant scenarios:

```bash
cd server
python tests/test_hospital_system.py
```

### Verified Acceptance Scenarios:
1. `test_01_token_allocation_and_non_reuse_invariant`: Allocates 1-100, cancels Token 2, verifies Token 2 is never reassigned, generates Token 101, and preserves 100 effective patients.
2. `test_02_queue_call_next_patient_skips_unchecked_in`: Verifies "Call Next Patient" picks Token 4 (waiting) and skips Token 3 (not checked in).
3. `test_03_ai_booking_request_creates_pending_status`: Verifies AI booking creates PENDING request requiring Receptionist approval.
4. `test_04_rescheduling_workflow`: Verifies cancellation of old appointment, retirement of old token, and creation of new PENDING booking.
5. `test_05_clinical_record_edit_with_audit_trail`: Verifies doctor diagnosis edits append immutable audit records with old value, new value, actor ID, and reason.
6. `test_06_prescription_versioning_immutable_history`: Verifies prescription corrections create `v2` / `v3` with historical versions remaining intact.
7. `test_07_ai_medical_safety_and_cross_patient_protection`: Verifies refusal to diagnose and prevents cross-patient clinical data leakage.
8. `test_08_receptionist_clinical_privacy_redaction`: Verifies Receptionist can view operational data but receives 403 Forbidden on clinical record details.

---

## 🖥️ Running the Application

### 1. Start the FastAPI Backend Server
```bash
cd server
python main.py
```
*Backend API runs at `http://127.0.0.1:8000` (Swagger UI at `http://127.0.0.1:8000/docs`).*

### 2. Start the React / Next.js Client
```bash
cd client
npm run dev
```
*Frontend opens at `http://localhost:3000`.*
