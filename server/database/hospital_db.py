"""
Hospital Management System - Concurrency-Safe Database & Repository Layer
Implements ACID relational transactions, atomic token allocation, duplicate checks,
append-only audit logs, prescription versioning, and privacy filters.
"""

import sqlite3
import json
import uuid
import threading
import os
from datetime import datetime, date
from typing import List, Optional, Dict, Any, Tuple


DB_PATH = os.path.join(os.path.dirname(__file__), "hospital_system.db")
_lock = threading.RLock()


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=30.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn


def init_hospital_db():
    """Initializes schema and tables for the Hospital Management System."""
    with _lock:
        conn = get_db_connection()
        cursor = conn.cursor()

        # 1. Users Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            phone TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL,
            full_name TEXT NOT NULL,
            is_active INTEGER DEFAULT 1,
            created_at TEXT NOT NULL
        )
        """)

        # 2. Patients Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS patients (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            full_name TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT,
            gender TEXT NOT NULL,
            dob TEXT NOT NULL,
            cnic TEXT UNIQUE NOT NULL,
            address TEXT NOT NULL,
            emergency_contact TEXT NOT NULL,
            whatsapp_available INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_patients_cnic ON patients(cnic)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone)")

        # 3. Doctors Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS doctors (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            full_name TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT,
            specialization TEXT NOT NULL,
            biography TEXT,
            qualifications TEXT,
            experience_years INTEGER DEFAULT 5,
            languages_json TEXT,
            areas_of_expertise_json TEXT,
            consultation_fee REAL DEFAULT 2000.0,
            follow_up_fee REAL DEFAULT 1000.0,
            daily_token_limit INTEGER DEFAULT 100,
            available_days_json TEXT,
            start_time TEXT DEFAULT '09:00',
            end_time TEXT DEFAULT '17:00',
            is_active INTEGER DEFAULT 1,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """)

        # 4. Services Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS services (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            base_price REAL NOT NULL,
            duration_minutes INTEGER DEFAULT 30,
            is_active INTEGER DEFAULT 1,
            created_at TEXT NOT NULL
        )
        """)

        # 5. Doctor Services Bridge
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS doctor_services (
            id TEXT PRIMARY KEY,
            doctor_id TEXT NOT NULL,
            service_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            UNIQUE(doctor_id, service_id),
            FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
            FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
        )
        """)

        # 6. Tokens Table
        # CRITICAL BUSINESS RULE: Cancelled tokens cannot be reused on the same day.
        # doctor_id + date + token_number must be UNIQUE.
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS tokens (
            id TEXT PRIMARY KEY,
            doctor_id TEXT NOT NULL,
            date TEXT NOT NULL,
            token_number INTEGER NOT NULL,
            status TEXT NOT NULL, -- 'allocated', 'cancelled', 'completed'
            appointment_id TEXT,
            created_at TEXT NOT NULL,
            cancelled_at TEXT,
            UNIQUE(doctor_id, date, token_number),
            FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
        )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tokens_doc_date ON tokens(doctor_id, date)")

        # 7. Appointments Table
        # State: PENDING (default for Patient & AI) -> CONFIRMED / DECLINED by Receptionist -> CANCELLED
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS appointments (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL,
            doctor_id TEXT NOT NULL,
            service_id TEXT NOT NULL,
            appointment_date TEXT NOT NULL,
            token_id TEXT,
            token_number INTEGER NOT NULL,
            status TEXT NOT NULL, -- 'pending', 'confirmed', 'declined', 'cancelled', 'completed'
            booking_source TEXT NOT NULL, -- 'patient_portal', 'receptionist_walkin', 'ai_agent'
            receptionist_notes TEXT,
            approved_by TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
            FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
            FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
            FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE SET NULL
        )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_appts_patient ON appointments(patient_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_appts_doc_date ON appointments(doctor_id, appointment_date)")

        # 8. Queue Entries Table
        # Queue state is logically separated from appointment status
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS queue_entries (
            id TEXT PRIMARY KEY,
            appointment_id TEXT UNIQUE NOT NULL,
            doctor_id TEXT NOT NULL,
            patient_id TEXT NOT NULL,
            date TEXT NOT NULL,
            token_number INTEGER NOT NULL,
            queue_status TEXT NOT NULL, -- 'not_checked_in', 'waiting', 'called', 'in_consultation', 'completed', 'no_show', 'cancelled'
            check_in_time TEXT,
            called_time TEXT,
            consultation_start_time TEXT,
            consultation_end_time TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
            FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
        )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_queue_doc_date ON queue_entries(doctor_id, date, queue_status)")

        # 9. Visits Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS visits (
            id TEXT PRIMARY KEY,
            appointment_id TEXT NOT NULL,
            patient_id TEXT NOT NULL,
            doctor_id TEXT NOT NULL,
            visit_date TEXT NOT NULL,
            status TEXT NOT NULL, -- 'in_progress', 'completed'
            created_at TEXT NOT NULL,
            FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
            FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
        )
        """)

        # 10. Clinical Records Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS clinical_records (
            id TEXT PRIMARY KEY,
            visit_id TEXT UNIQUE NOT NULL,
            appointment_id TEXT NOT NULL,
            patient_id TEXT NOT NULL,
            doctor_id TEXT NOT NULL,
            chief_complaint TEXT NOT NULL,
            examination_findings TEXT NOT NULL,
            diagnosis TEXT NOT NULL,
            treatment_plan TEXT NOT NULL,
            clinical_notes TEXT,
            doctor_private_notes TEXT, -- Strictly forbidden to patient and receptionist
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
            FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
        )
        """)

        # 11. Clinical Record Audits Table (Append-only audit trail for clinical edits)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS clinical_record_audits (
            id TEXT PRIMARY KEY,
            clinical_record_id TEXT NOT NULL,
            actor_id TEXT NOT NULL,
            actor_role TEXT NOT NULL,
            field_name TEXT NOT NULL,
            old_value TEXT,
            new_value TEXT,
            reason TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (clinical_record_id) REFERENCES clinical_records(id) ON DELETE CASCADE
        )
        """)

        # 12. Prescriptions Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS prescriptions (
            id TEXT PRIMARY KEY,
            visit_id TEXT UNIQUE NOT NULL,
            patient_id TEXT NOT NULL,
            doctor_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
            FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
        )
        """)

        # 13. Prescription Versions Table (Immutable versioning: v1, v2...)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS prescription_versions (
            id TEXT PRIMARY KEY,
            prescription_id TEXT NOT NULL,
            version_number INTEGER NOT NULL,
            content_json TEXT NOT NULL,
            correction_reason TEXT,
            notes TEXT,
            doctor_id TEXT NOT NULL,
            is_current INTEGER DEFAULT 1,
            created_at TEXT NOT NULL,
            UNIQUE(prescription_id, version_number),
            FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
            FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
        )
        """)

        # 14. Follow-ups Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS follow_ups (
            id TEXT PRIMARY KEY,
            visit_id TEXT NOT NULL,
            patient_id TEXT NOT NULL,
            doctor_id TEXT NOT NULL,
            recommended_date TEXT NOT NULL,
            instructions TEXT,
            status TEXT DEFAULT 'pending',
            created_at TEXT NOT NULL,
            FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
            FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
        )
        """)

        # 15. Payments Table (Basic billing / POS)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS payments (
            id TEXT PRIMARY KEY,
            appointment_id TEXT NOT NULL,
            patient_id TEXT NOT NULL,
            total_amount REAL NOT NULL,
            amount_paid REAL NOT NULL,
            amount_due REAL NOT NULL,
            payment_status TEXT NOT NULL, -- 'unpaid', 'partial', 'paid'
            payment_method TEXT DEFAULT 'cash',
            notes TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
        )
        """)

        # 16. Notification Preferences Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS notification_preferences (
            id TEXT PRIMARY KEY,
            patient_id TEXT UNIQUE NOT NULL,
            primary_channel TEXT NOT NULL DEFAULT 'sms',
            backup_channel TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
        )
        """)

        # 17. Notification Logs Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS notification_logs (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL,
            event_type TEXT NOT NULL,
            channel_used TEXT NOT NULL,
            status TEXT NOT NULL, -- 'sent', 'failed', 'failover_sent'
            failure_reason TEXT,
            payload_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
        )
        """)

        # 18. Doctor Patient Relationships Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS doctor_patient_relationships (
            id TEXT PRIMARY KEY,
            doctor_id TEXT NOT NULL,
            patient_id TEXT NOT NULL,
            first_visit_date TEXT NOT NULL,
            last_visit_date TEXT NOT NULL,
            total_visits INTEGER DEFAULT 1,
            is_currently_assigned INTEGER DEFAULT 1,
            UNIQUE(doctor_id, patient_id),
            FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
        )
        """)

        # 19. System Audit Logs Table (Append-only)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            actor_id TEXT NOT NULL,
            actor_type TEXT NOT NULL,
            action TEXT NOT NULL,
            resource_type TEXT NOT NULL,
            resource_id TEXT NOT NULL,
            previous_state_json TEXT,
            new_state_json TEXT,
            metadata_json TEXT,
            created_at TEXT NOT NULL
        )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at)")

        # 20. AI Action Logs Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS ai_action_logs (
            id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL,
            patient_id TEXT,
            tool_name TEXT NOT NULL,
            tool_args_json TEXT NOT NULL,
            execution_status TEXT NOT NULL,
            confirmation_received INTEGER DEFAULT 0,
            result_summary TEXT,
            created_at TEXT NOT NULL
        )
        """)

        conn.commit()
        conn.close()

        # Seed essential baseline demo data
        seed_baseline_data()


def seed_baseline_data():
    """Seeds baseline services, doctors, receptionists, admin, patients, and initial records."""
    with _lock:
        conn = get_db_connection()
        cursor = conn.cursor()
        now_str = datetime.now().isoformat()
        today_str = date.today().isoformat()

        # Check if users already seeded
        cursor.execute("SELECT COUNT(*) as count FROM users")
        has_users = cursor.fetchone()["count"] > 0

        doc_1_id = "doc-01"
        doc_2_id = "doc-02"

        if not has_users:
            # 1. Admin User
            admin_id = "user-admin-01"
            cursor.execute("""
            INSERT INTO users (id, phone, email, password_hash, role, full_name, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 1, ?)
            """, (admin_id, "+923000000001", "admin@hospital.com", "admin123", "admin", "System Administrator", now_str))

            # 2. Receptionist User
            recep_id = "user-recep-01"
            cursor.execute("""
            INSERT INTO users (id, phone, email, password_hash, role, full_name, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 1, ?)
            """, (recep_id, "+923000000002", "reception@hospital.com", "recep123", "receptionist", "Front Desk Manager (Ayesha)", now_str))

            # 3. Doctor Users & Doctor Records
            doc_user_1 = "user-doc-01"
            cursor.execute("""
            INSERT INTO users (id, phone, email, password_hash, role, full_name, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 1, ?)
            """, (doc_user_1, "+923000000003", "dr.ahmed@hospital.com", "doc123", "doctor", "Dr. Ahmed Tariq", now_str))

            cursor.execute("""
            INSERT INTO doctors (id, user_id, full_name, phone, email, specialization, biography, qualifications, experience_years, languages_json, areas_of_expertise_json, consultation_fee, follow_up_fee, daily_token_limit, available_days_json, start_time, end_time, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
            """, (
                doc_1_id, doc_user_1, "Dr. Ahmed Tariq", "+923000000003", "dr.ahmed@hospital.com",
                "Consultant Dermatologist & Laser Specialist",
                "Senior Consultant with 12+ years in clinical dermatology, acne pathology, and advanced cosmetic laser treatments.",
                "MBBS, FCPS (Dermatology), Fellow American Academy of Dermatology",
                12, json.dumps(["English", "Urdu"]),
                json.dumps(["Severe Acne", "Eczema", "Laser Skin Resurfacing", "Melasma"]),
                2500.0, 1500.0, 100,
                json.dumps(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]),
                "09:00", "17:00", now_str
            ))

            doc_user_2 = "user-doc-02"
            cursor.execute("""
            INSERT INTO users (id, phone, email, password_hash, role, full_name, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 1, ?)
            """, (doc_user_2, "+923000000004", "dr.sarah@hospital.com", "doc123", "doctor", "Dr. Sarah Khan", now_str))

            cursor.execute("""
            INSERT INTO doctors (id, user_id, full_name, phone, email, specialization, biography, qualifications, experience_years, languages_json, areas_of_expertise_json, consultation_fee, follow_up_fee, daily_token_limit, available_days_json, start_time, end_time, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
            """, (
                doc_2_id, doc_user_2, "Dr. Sarah Khan", "+923000000004", "dr.sarah@hospital.com",
                "Aesthetic Physician & Trichologist",
                "Specialist in hair restoration, PRP therapies, anti-aging rejuvenation, and micro-pigmentation.",
                "MBBS, MCPS (Dermatology), Board Certified in Aesthetic Medicine",
                8, json.dumps(["English", "Urdu", "Punjabi"]),
                json.dumps(["Alopecia", "PRP Hair Therapy", "Chemical Peels", "HydraFacial Pro"]),
                2000.0, 1200.0, 80,
                json.dumps(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]),
                "10:00", "18:00", now_str
            ))

        # 4. Comprehensive Aesthetic Clinic Services Catalog
        services = [
            ("srv-01", "Dermatology & Skin Assessment", "Clinical", "Comprehensive clinical examination of skin, hair, acne grade, and dermatological conditions.", 2500.0, 30),
            ("srv-02", "Fractional CO2 Laser Resurfacing", "Laser & Aesthetics", "Medical-grade fractional laser targeting severe acne scars, deep pores, and texture renewal.", 8500.0, 45),
            ("srv-03", "HydraFacial MD Elite Glow", "Medical Facial", "Multi-stage vortex deep pore extraction, antioxidant hydration, and medical infusion.", 6000.0, 40),
            ("srv-04", "PRP Hair Restoration & Scalp Boost", "Trichology", "Autologous platelet-rich plasma scalp micro-injections for hair density and follicle activation.", 9500.0, 45),
            ("srv-05", "Medical Chemical Peel (Glycolic/TCA)", "Aesthetic Dermatology", "Dermatologist-formulated peel targeting hyperpigmentation, melasma, and active breakouts.", 4500.0, 30),
            ("srv-06", "Q-Switched Nd:YAG Carbon Laser Peel", "Laser Aesthetics", "Hollywood Carbon Peel for instant pore tightening, oil control, and skin brightening.", 7000.0, 35),
            ("srv-07", "HIFU Non-Surgical Face Lifting", "Skin Tightening", "High-Intensity Focused Ultrasound for jawline sculpting and deep collagen lifting.", 15000.0, 60),
            ("srv-08", "Microneedling RF (Scar & Texture Repair)", "Skin Rejuvenation", "Fractional radiofrequency microneedling for collagen remodeling and acne scar lifting.", 9000.0, 45),
            ("srv-09", "Triple-Wavelength Diode Laser Hair Removal", "Laser Care", "Pain-free ice-cooling diode laser for permanent hair reduction across all skin types.", 5500.0, 30),
            ("srv-10", "Glutathione Radiance IV Infusion", "Wellness & Glow", "Intravenous antioxidant blend of high-potency Glutathione and Vitamin C for systemic glow.", 6500.0, 45),
            ("srv-11", "Acne Scar Subcision & TCA Cross", "Clinical Dermatology", "Surgical release of tethered rolling scars combined with high-strength TCA spot application.", 8000.0, 40),
            ("srv-12", "Botox / Dysport Anti-Wrinkle Smoothing", "Injectables & Anti-Aging", "Targeted neurotoxin injections for crow's feet, forehead lines, and frown reduction.", 18000.0, 30),
            ("srv-13", "Hyaluronic Acid Lip & Cheek Filler", "Dermal Fillers", "Premium cross-linked hyaluronic acid filler for natural volume contouring and hydration.", 22000.0, 40),
            ("srv-14", "Under-Eye Dark Circle PRP Therapy", "Aesthetic Rejuvenation", "Targeted periorbital PRP injections for tear trough rejuvenation and pigmentation correction.", 7500.0, 35)
        ]

        for srv in services:
            cursor.execute("""
            INSERT INTO services (id, name, category, description, base_price, duration_minutes, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 1, ?)
            ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                category = excluded.category,
                description = excluded.description,
                base_price = excluded.base_price,
                duration_minutes = excluded.duration_minutes
            """, (srv[0], srv[1], srv[2], srv[3], srv[4], srv[5], now_str))

        # Assign all aesthetic services to active physicians
        for srv in services:
            cursor.execute("""
                INSERT INTO doctor_services (id, doctor_id, service_id, created_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(doctor_id, service_id) DO NOTHING
            """, (f"ds-1-{srv[0]}", doc_1_id, srv[0], now_str))

            cursor.execute("""
                INSERT INTO doctor_services (id, doctor_id, service_id, created_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(doctor_id, service_id) DO NOTHING
            """, (f"ds-2-{srv[0]}", doc_2_id, srv[0], now_str))

        # 5. Seed Patients and Initial Workflows only if fresh DB
        if not has_users:
            patients_data = [
                ("pat-01", "user-pat-01", "Zainab Fatima", "+923011112233", "zainab@gmail.com", "female", "1996-05-14", "35202-1234567-1", "House 12, Street 4, F-7/2, Islamabad", "+923011112200", 1),
                ("pat-02", "user-pat-02", "Bilal Hassan", "+923022223344", "bilal@gmail.com", "male", "1991-11-20", "35202-7654321-2", "Apartment 4B, Gulberg III, Lahore", "+923022223300", 1),
                ("pat-03", "user-pat-03", "Hamza Ali", "+923033334455", "hamza@gmail.com", "male", "1998-02-10", "35202-9988776-3", "House 88, Phase 5, DHA, Lahore", "+923033334400", 0),
                ("pat-04", "user-pat-04", "Maryam Siddiqui", "+923044445566", "maryam@gmail.com", "female", "1994-08-30", "35202-3344556-4", "Street 9, Clifton Block 4, Karachi", "+923044445500", 1),
                ("pat-05", "user-pat-05", "Usman Sheikh", "+923055556677", "usman@gmail.com", "male", "1988-04-18", "35202-5566778-5", "Sector G-11/3, Islamabad", "+923055556600", 1),
            ]

            for pat in patients_data:
                cursor.execute("""
                INSERT INTO users (id, phone, email, password_hash, role, full_name, is_active, created_at)
                VALUES (?, ?, ?, ?, 'patient', ?, 1, ?)
                """, (pat[1], pat[3], pat[4], "pat123", pat[2], now_str))

                cursor.execute("""
                INSERT INTO patients (id, user_id, full_name, phone, email, gender, dob, cnic, address, emergency_contact, whatsapp_available, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (pat[0], pat[1], pat[2], pat[3], pat[4], pat[5], pat[6], pat[7], pat[8], pat[9], pat[10], now_str))

                # Set Notification Preferences
                cursor.execute("""
                INSERT INTO notification_preferences (id, patient_id, primary_channel, backup_channel, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """, (str(uuid.uuid4()), pat[0], "whatsapp" if pat[10] else "sms", "email", now_str, now_str))

            # 6. Pre-seed Today's Tokens & Appointments for Dr. Ahmed (Demonstrating Queue States)
            # Token 1 (Completed)
            tok_1_id = "tok-01"
            appt_1_id = "appt-01"
            cursor.execute("INSERT INTO tokens (id, doctor_id, date, token_number, status, appointment_id, created_at) VALUES (?, ?, ?, 1, 'completed', ?, ?)", (tok_1_id, doc_1_id, today_str, appt_1_id, now_str))
            cursor.execute("""
            INSERT INTO appointments (id, patient_id, doctor_id, service_id, appointment_date, token_id, token_number, status, booking_source, approved_by, created_at, updated_at)
            VALUES (?, 'pat-01', ?, 'srv-01', ?, ?, 1, 'completed', 'patient_portal', 'user-recep-01', ?, ?)
            """, (appt_1_id, doc_1_id, today_str, tok_1_id, now_str, now_str))
            cursor.execute("""
            INSERT INTO queue_entries (id, appointment_id, doctor_id, patient_id, date, token_number, queue_status, check_in_time, consultation_start_time, consultation_end_time, created_at)
            VALUES (?, ?, ?, 'pat-01', ?, 1, 'completed', '09:05', '09:15', '09:40', ?)
            """, (str(uuid.uuid4()), appt_1_id, doc_1_id, today_str, now_str))

            # Create completed visit, clinical record, and prescription v1 & v2 for Patient 01
            visit_1_id = "visit-01"
            cursor.execute("INSERT INTO visits (id, appointment_id, patient_id, doctor_id, visit_date, status, created_at) VALUES (?, ?, 'pat-01', ?, ?, 'completed', ?)", (visit_1_id, appt_1_id, doc_1_id, today_str, now_str))
            
            clin_rec_1 = "clin-01"
            cursor.execute("""
            INSERT INTO clinical_records (id, visit_id, appointment_id, patient_id, doctor_id, chief_complaint, examination_findings, diagnosis, treatment_plan, clinical_notes, doctor_private_notes, created_at, updated_at)
            VALUES (?, ?, ?, 'pat-01', ?, 'Erythematous papules and pustules on cheeks and jawline for 6 months', 'Multiple inflammatory papules, open comedones, mild scarring across bilateral cheeks', 'Moderate Inflammatory Acne Vulgaris (Grade III)', 'Topical retinoid therapy + oral antibiotic regimen. Sun protection advised.', 'Patient advised to avoid oil-based cosmetics. Review in 4 weeks.', 'Patient appears mildly anxious about scarring. Monitored for retinoid sensitivity.', ?, ?)
            """, (clin_rec_1, visit_1_id, appt_1_id, doc_1_id, now_str, now_str))

            # Audit event for clinical record (e.g. edited diagnosis)
            cursor.execute("""
            INSERT INTO clinical_record_audits (id, clinical_record_id, actor_id, actor_role, field_name, old_value, new_value, reason, created_at)
            VALUES (?, ?, ?, 'doctor', 'diagnosis', 'Mild Acne', 'Moderate Inflammatory Acne Vulgaris (Grade III)', 'Refined following physical assessment and grade determination', ?)
            """, (str(uuid.uuid4()), clin_rec_1, doc_user_1, now_str))

            # Prescription v1 and corrected v2
            rx_1_id = "rx-01"
            cursor.execute("INSERT INTO prescriptions (id, visit_id, patient_id, doctor_id, created_at) VALUES (?, ?, 'pat-01', ?, ?)", (rx_1_id, visit_1_id, doc_1_id, now_str))
            
            v1_content = [
                {"medication_name": "Doxycycline", "dosage": "100mg", "frequency": "Once daily", "duration": "14 days", "instructions": "Take with plenty of water after breakfast"},
                {"medication_name": "Adapalene Gel 0.1%", "dosage": "Pea-sized amount", "frequency": "Once at night", "duration": "30 days", "instructions": "Apply gently to affected areas"}
            ]
            cursor.execute("""
            INSERT INTO prescription_versions (id, prescription_id, version_number, content_json, correction_reason, notes, doctor_id, is_current, created_at)
            VALUES (?, ?, 1, ?, 'Initial consultation formulation', 'Drink 2L water daily', ?, 0, ?)
            """, (str(uuid.uuid4()), rx_1_id, json.dumps(v1_content), doc_1_id, now_str))

            v2_content = [
                {"medication_name": "Doxycycline", "dosage": "100mg", "frequency": "Twice daily", "duration": "21 days", "instructions": "Take with meals after breakfast and dinner"},
                {"medication_name": "Adapalene Gel 0.1%", "dosage": "Pea-sized amount", "frequency": "Once at night", "duration": "30 days", "instructions": "Apply gently to affected areas"},
                {"medication_name": "Mineral Sunscreen SPF 50+", "dosage": "Generous layer", "frequency": "Every 3 hours outdoors", "duration": "Continuous", "instructions": "Apply 15 mins before sun exposure"}
            ]
            cursor.execute("""
            INSERT INTO prescription_versions (id, prescription_id, version_number, content_json, correction_reason, notes, doctor_id, is_current, created_at)
            VALUES (?, ?, 2, ?, 'Adjusted dosage for faster inflammatory response and added UV protection', 'Avoid direct midday sun', ?, 1, ?)
            """, (str(uuid.uuid4()), rx_1_id, json.dumps(v2_content), doc_1_id, now_str))

            # Doctor-Patient Relationship
            cursor.execute("""
            INSERT INTO doctor_patient_relationships (id, doctor_id, patient_id, first_visit_date, last_visit_date, total_visits, is_currently_assigned)
            VALUES (?, ?, 'pat-01', ?, ?, 1, 1)
            """, (str(uuid.uuid4()), doc_1_id, today_str, today_str))

            # Payment for Token 1
            cursor.execute("""
            INSERT INTO payments (id, appointment_id, patient_id, total_amount, amount_paid, amount_due, payment_status, payment_method, notes, created_at)
            VALUES (?, ?, 'pat-01', 2500.0, 2500.0, 0.0, 'paid', 'cash', 'Full payment received at front desk', ?)
            """, (str(uuid.uuid4()), appt_1_id, now_str))

            # Token 2 (In Consultation)
            tok_2_id = "tok-02"
            appt_2_id = "appt-02"
            cursor.execute("INSERT INTO tokens (id, doctor_id, date, token_number, status, appointment_id, created_at) VALUES (?, ?, ?, 2, 'allocated', ?, ?)", (tok_2_id, doc_1_id, today_str, appt_2_id, now_str))
            cursor.execute("""
            INSERT INTO appointments (id, patient_id, doctor_id, service_id, appointment_date, token_id, token_number, status, booking_source, approved_by, created_at, updated_at)
            VALUES (?, 'pat-02', ?, 'srv-02', ?, ?, 2, 'confirmed', 'patient_portal', 'user-recep-01', ?, ?)
            """, (appt_2_id, doc_1_id, today_str, tok_2_id, now_str, now_str))
            cursor.execute("""
            INSERT INTO queue_entries (id, appointment_id, doctor_id, patient_id, date, token_number, queue_status, check_in_time, called_time, consultation_start_time, created_at)
            VALUES (?, ?, ?, 'pat-02', ?, 2, 'in_consultation', '09:40', '09:45', '09:48', ?)
            """, (str(uuid.uuid4()), appt_2_id, doc_1_id, today_str, now_str))

            # Doctor-Patient Relationship for pat-02
            cursor.execute("""
            INSERT INTO doctor_patient_relationships (id, doctor_id, patient_id, first_visit_date, last_visit_date, total_visits, is_currently_assigned)
            VALUES (?, ?, 'pat-02', ?, ?, 1, 1)
            """, (str(uuid.uuid4()), doc_1_id, today_str, today_str))

            # Token 3 (CONFIRMED but NOT CHECKED IN)
            tok_3_id = "tok-03"
            appt_3_id = "appt-03"
            cursor.execute("INSERT INTO tokens (id, doctor_id, date, token_number, status, appointment_id, created_at) VALUES (?, ?, ?, 3, 'allocated', ?, ?)", (tok_3_id, doc_1_id, today_str, appt_3_id, now_str))
            cursor.execute("""
            INSERT INTO appointments (id, patient_id, doctor_id, service_id, appointment_date, token_id, token_number, status, booking_source, approved_by, created_at, updated_at)
            VALUES (?, 'pat-03', ?, 'srv-01', ?, ?, 3, 'confirmed', 'patient_portal', 'user-recep-01', ?, ?)
            """, (appt_3_id, doc_1_id, today_str, tok_3_id, now_str, now_str))
            cursor.execute("""
            INSERT INTO queue_entries (id, appointment_id, doctor_id, patient_id, date, token_number, queue_status, created_at)
            VALUES (?, ?, ?, 'pat-03', ?, 3, 'not_checked_in', ?)
            """, (str(uuid.uuid4()), appt_3_id, doc_1_id, today_str, now_str))

            # Token 4 (CONFIRMED & CHECKED IN -> WAITING)
            tok_4_id = "tok-04"
            appt_4_id = "appt-04"
            cursor.execute("INSERT INTO tokens (id, doctor_id, date, token_number, status, appointment_id, created_at) VALUES (?, ?, ?, 4, 'allocated', ?, ?)", (tok_4_id, doc_1_id, today_str, appt_4_id, now_str))
            cursor.execute("""
            INSERT INTO appointments (id, patient_id, doctor_id, service_id, appointment_date, token_id, token_number, status, booking_source, approved_by, created_at, updated_at)
            VALUES (?, 'pat-04', ?, 'srv-05', ?, ?, 4, 'confirmed', 'patient_portal', 'user-recep-01', ?, ?)
            """, (appt_4_id, doc_1_id, today_str, tok_4_id, now_str, now_str))
            cursor.execute("""
            INSERT INTO queue_entries (id, appointment_id, doctor_id, patient_id, date, token_number, queue_status, check_in_time, created_at)
            VALUES (?, ?, ?, 'pat-04', ?, 4, 'waiting', '10:00', ?)
            """, (str(uuid.uuid4()), appt_4_id, doc_1_id, today_str, now_str))

            # Token 5 (CONFIRMED & CHECKED IN -> WAITING)
            tok_5_id = "tok-05"
            appt_5_id = "appt-05"
            cursor.execute("INSERT INTO tokens (id, doctor_id, date, token_number, status, appointment_id, created_at) VALUES (?, ?, ?, 5, 'allocated', ?, ?)", (tok_5_id, doc_1_id, today_str, appt_5_id, now_str))
            cursor.execute("""
            INSERT INTO appointments (id, patient_id, doctor_id, service_id, appointment_date, token_id, token_number, status, booking_source, approved_by, created_at, updated_at)
            VALUES (?, 'pat-05', ?, 'srv-01', ?, ?, 5, 'confirmed', 'patient_portal', 'user-recep-01', ?, ?)
            """, (appt_5_id, doc_1_id, today_str, tok_5_id, now_str, now_str))
            cursor.execute("""
            INSERT INTO queue_entries (id, appointment_id, doctor_id, patient_id, date, token_number, queue_status, check_in_time, created_at)
            VALUES (?, ?, ?, 'pat-05', ?, 5, 'waiting', '10:15', ?)
            """, (str(uuid.uuid4()), appt_5_id, doc_1_id, today_str, now_str))

            # Initial Audit Log
            cursor.execute("""
            INSERT INTO audit_logs (id, actor_id, actor_type, action, resource_type, resource_id, metadata_json, created_at)
            VALUES (?, 'user-admin-01', 'admin', 'system_init', 'database', 'hospital_system', '{"status": "initialized_successfully"}', ?)
            """, (str(uuid.uuid4()), now_str))

        conn.commit()
        conn.close()


# Ensure DB is initialized upon import
init_hospital_db()
