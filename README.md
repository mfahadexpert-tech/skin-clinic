# SkinLab AI — Premium Aesthetic & Dermatology Clinic Operating System

An enterprise-grade, modern, and user-friendly full-stack clinic management system and Point-of-Sale (POS) specifically custom-molded for **Aesthetic Clinics, Dermatology Centers, Laser Care Facilities, and Medical Spas**.

---

## 📁 Project Architecture & Folder Separation

The project is structured into two clean directories:

```
skinlab-ai-clinic/
├── client/                               # Frontend: React / Next.js / Node
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.jsx                # High-DPI typography & Root layout
│   │   │   ├── page.jsx                  # Main SPA Dashboard & Module Router
│   │   │   └── globals.css               # Glassmorphism design system & print styles
│   │   ├── components/
│   │   │   ├── Navigation.jsx            # Multi-tab header, Role switcher & Offline badge
│   │   │   ├── POS/                      # Module 3: POS Billing & Invoicing Terminal
│   │   │   │   ├── POSTerminal.jsx       # Patient search, Doctor assign, Remarks, Cart
│   │   │   │   ├── TreatmentCart.jsx     # Used Now vs Sessions Allowed counters
│   │   │   │   ├── CustomPackageModal.jsx# On-the-fly bundle builder
│   │   │   │   ├── SplitCheckoutModal.jsx# Multi-method split checkout
│   │   │   │   ├── ThermalReceipt.jsx    # 80mm ESC/POS thermal receipt slip
│   │   │   │   └── MedicalInvoiceA4.jsx  # Professional A4 medical invoice
│   │   │   ├── PRM/                      # Module 6: Patient PRM & Session Redemption
│   │   │   │   ├── PatientDirectory.jsx  # MRN (0001-08-2026), Wallets, Dues
│   │   │   │   ├── SessionRedeemModal.jsx# "receive_payment_dialog" session consumption
│   │   │   │   └── BeforeAfterGallery.jsx# Clinical Before/After photo comparison slider
│   │   │   ├── AI/                       # Clinical AI Suite
│   │   │   │   ├── DoctorAssistant.jsx   # LangGraph SSE streaming chatbot & disclaimer
│   │   │   │   ├── VoiceBookingAgent.jsx # 24/7 AI Voice Booking simulator & Calendar sync
│   │   │   │   └── WhatsAppHub.jsx       # Automated reminder dispatcher & webhook logs
│   │   │   ├── Catalog/                  # Module 5 & 9: Services, Bundles & Barcodes
│   │   │   │   ├── ServicesMaster.jsx    # Treatment catalog & deals master
│   │   │   │   └── BarcodeGenerator.jsx  # Code-128 thermal barcode printer
│   │   │   ├── Reports/                  # Module 2 & 11: Analytics & Machine ROI
│   │   │   │   ├── AnalyticsDashboard.jsx# Real-time KPI cards & sales book
│   │   │   │   └── MachineROIReport.jsx  # Laser vs HydraFacial vs PRP ROI margins
│   │   │   ├── HRM/                      # Module 10: Staff, shifts & commissions
│   │   │   ├── Purchases/                # Module 7 & 8: SRM supplies & refund auditor
│   │   │   └── Settings/                 # Module 12: Branding, RBAC & SQL backups
│   │   └── lib/
│   │       ├── api.js                    # FastAPI client with SSE streaming listener
│   │       ├── supabaseClient.js         # Supabase JS real-time client
│   │       └── outbox.js                 # PWA Offline Outbox pattern manager
│
└── server/                               # Backend: Python 3.12 (FastAPI + LangChain + LangGraph + Supabase)
    ├── main.py                           # FastAPI server entrypoint with CORS & SSE endpoints
    ├── requirements.txt                  # Python dependencies
    ├── ai/
    │   ├── langgraph_agent.py            # LangGraph StateGraph (Router -> RAG -> Synthesizer -> Guardrail)
    │   ├── rag_engine.py                 # Clinical RAG protocol retriever
    │   ├── knowledge_base.json           # Clinical database (laser fluence, spot sizes, contraindications)
    │   └── prompt_templates.py           # Medical few-shot prompts & Roman Urdu handlers
    ├── routers/                          # REST routers for all 12 modules
    │   ├── pos_router.py
    │   ├── patient_router.py
    │   ├── catalog_router.py
    │   ├── voice_router.py
    │   ├── whatsapp_router.py
    │   ├── reports_router.py
    │   ├── hrm_router.py
    │   ├── purchases_router.py
    │   └── backup_router.py
    └── database/
        ├── schema.sql                    # PostgreSQL Supabase schema
        ├── supabase_client.py            # Supabase Python client & resilient fallback store
        └── models.py                     # Pydantic schemas
```

---

## 🚀 How to Run the Application

### 1. Start the Python Backend (`server/`)
```bash
cd server
python main.py
```
*The server starts at `http://127.0.0.1:8000` with Swagger UI at `http://127.0.0.1:8000/docs`.*

### 2. Start the React / Next.js Frontend (`client/`)
```bash
cd client
npm run dev
```
*The web application opens at `http://localhost:3000`.*

---

## 🌟 Key Features & Workflow Highlights

1. **POS Treatment Billing Terminal & Dual-Format Receipting**:
   - Quick patient lookup with MRN (`0001-08-2026`), visit count, and due/wallet badges.
   - Doctor assignment for commission tracking and medical accountability.
   - Interactive cart with **"Sessions Allowed"** vs **"Used Now"** counters.
   - On-the-fly custom package builder with session and price overrides.
   - Automatic queue token generation (`P-01`, `P-02`).
   - Split checkout (Cash, Card, Wallet, Due Balance).
   - High-speed 80mm ESC/POS Thermal Receipt and Vector A4 Medical Clinical Invoice.

2. **Patient PRM & Multi-Session Redemption Lifecycle (`receive_payment_dialog`)**:
   - Track remaining sessions across active multi-session packages.
   - 1-click "Session Now (+1)" consumption button.
   - Receive partial/full payments against patient dues.

3. **LangChain & LangGraph GPT Doctor Clinical Assistant**:
   - Multi-node LangGraph State Machine (Intent Classifier $\rightarrow$ RAG Protocol Retriever $\rightarrow$ English/Roman Urdu Synthesizer $\rightarrow$ Safety Guardrail).
   - Real-time Server-Sent Events (SSE) word-by-word streaming.
   - SOAP Clinical Session Note drafting.
   - Mandatory non-removable disclaimer: *"AI-generated suggestion. Please verify before clinical application."*
   - 1-Click note injection into POS session remarks.

4. **24/7 AI Voice Booking Agent & Calendar Sync**:
   - Phone call simulator with audio waveforms and Roman Urdu/English transcription.
   - Automatically synchronizes with doctor availability and Google Calendar.

5. **Multi-Channel WhatsApp Center**:
   - High-priority appointment confirmations and 24-hour reminder triggers.
   - Post-treatment laser and facial care instructions.
   - Live webhook event logs.

6. **PWA Offline Resilience (Outbox Pattern)**:
   - Toggle offline mode to queue transactions locally without interruption.
   - Automatically syncs pending records to the backend when connectivity returns.

7. **Automated Database SQL Backup Engine**:
   - Generates timestamped `.sql` database dumps (`backup_bbc_pos_db_YYYYMMDD_HHMMSS.sql`) on exit or on demand.
