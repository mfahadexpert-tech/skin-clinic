import sqlite3
import json
import os
from datetime import datetime

db_path = os.path.join(os.path.dirname(__file__), "hospital_system.db")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
now_str = datetime.now().isoformat()

# Seed records for pat-02 (Bilal Hassan)
cursor.execute("INSERT OR REPLACE INTO doctor_patient_relationships (id, doctor_id, patient_id, first_visit_date, last_visit_date, total_visits, is_currently_assigned) VALUES ('rel-02-1', 'doc-02', 'pat-02', '2026-08-20', '2026-08-20', 2, 1)")
cursor.execute("INSERT OR REPLACE INTO visits (id, appointment_id, patient_id, doctor_id, visit_date, status, created_at) VALUES ('visit-02-1', 'appt-02-hist1', 'pat-02', 'doc-02', '2026-08-20', 'completed', ?)", (now_str,))
cursor.execute("INSERT OR REPLACE INTO appointments (id, patient_id, doctor_id, service_id, appointment_date, token_id, token_number, status, booking_source, approved_by, created_at, updated_at) VALUES ('appt-02-hist1', 'pat-02', 'doc-02', 'srv-04', '2026-08-20', 'tok-02-hist1', 3, 'completed', 'patient_portal', 'user-recep-01', ?, ?)", (now_str, now_str))

cursor.execute("""
INSERT OR REPLACE INTO clinical_records (id, visit_id, appointment_id, patient_id, doctor_id, chief_complaint, examination_findings, diagnosis, treatment_plan, clinical_notes, doctor_private_notes, created_at, updated_at)
VALUES ('clin-02-1', 'visit-02-1', 'appt-02-hist1', 'pat-02', 'doc-02',
'Progressive vertex hair thinning and increased shedding for 8 months',
'Diffuse thinning over crown/vertex, miniaturized hair follicles, pull test positive (+3 hairs)',
'Androgenetic Alopecia (Norwood Grade III) with Telogen Effluvium',
'Autologous Scalp PRP Session 1 of 4. Biotin & Minoxidil 5% topical solution twice daily.',
'Avoid heat styling and harsh sulfate shampoos. Follow-up PRP session in 4 weeks.',
'Patient motivated. Explained difference between shedding and permanent follicle miniaturization.',
?, ?)
""", (now_str, now_str))

cursor.execute("INSERT OR REPLACE INTO prescriptions (id, visit_id, patient_id, doctor_id, created_at) VALUES ('rx-02-1', 'visit-02-1', 'pat-02', 'doc-02', ?)", (now_str,))
v_pat2 = [
    {"medication_name": "Minoxidil 5% Topical Solution", "dosage": "1 ml", "frequency": "Twice daily", "duration": "90 days", "instructions": "Apply directly to dry scalp in thinning areas and massage gently"},
    {"medication_name": "Biotin High-Potency 5000mcg", "dosage": "1 capsule", "frequency": "Once daily", "duration": "60 days", "instructions": "Take after breakfast with water"},
    {"medication_name": "Ketoconazole 2% Therapeutic Shampoo", "dosage": "Palm amount", "frequency": "Twice weekly", "duration": "30 days", "instructions": "Leave on scalp for 5 minutes before rinsing"}
]
cursor.execute("""
INSERT OR REPLACE INTO prescription_versions (id, prescription_id, version_number, content_json, correction_reason, notes, doctor_id, is_current, created_at)
VALUES ('rxv-02-1', 'rx-02-1', 1, ?, 'Initial trichology formulation', 'Maintain regular sleep and low stress for hair follicle recovery', 'doc-02', 1, ?)
""", (json.dumps(v_pat2), now_str))

# Seed records for pat-03 (Hamza Ali)
cursor.execute("INSERT OR REPLACE INTO doctor_patient_relationships (id, doctor_id, patient_id, first_visit_date, last_visit_date, total_visits, is_currently_assigned) VALUES ('rel-03-1', 'doc-01', 'pat-03', '2026-08-14', '2026-08-14', 1, 1)")
cursor.execute("INSERT OR REPLACE INTO visits (id, appointment_id, patient_id, doctor_id, visit_date, status, created_at) VALUES ('visit-03-1', 'appt-03-hist1', 'pat-03', 'doc-01', '2026-08-14', 'completed', ?)", (now_str,))
cursor.execute("INSERT OR REPLACE INTO appointments (id, patient_id, doctor_id, service_id, appointment_date, token_id, token_number, status, booking_source, approved_by, created_at, updated_at) VALUES ('appt-03-hist1', 'pat-03', 'doc-01', 'srv-02', '2026-08-14', 'tok-03-hist1', 7, 'completed', 'patient_portal', 'user-recep-01', ?, ?)", (now_str, now_str))

cursor.execute("""
INSERT OR REPLACE INTO clinical_records (id, visit_id, appointment_id, patient_id, doctor_id, chief_complaint, examination_findings, diagnosis, treatment_plan, clinical_notes, doctor_private_notes, created_at, updated_at)
VALUES ('clin-03-1', 'visit-03-1', 'appt-03-hist1', 'pat-03', 'doc-01',
'Deep acne scars and uneven surface across cheeks following severe adolescent acne',
'Multiple deep rolling and boxcar scars on bilateral zygomatic zones. No active cysts.',
'Post-Acne Atrophic Boxcar Scars (Grade III)',
'Fractional CO2 Laser Resurfacing (Pass 1 deep + Pass 2 superficial). Healing barrier cream.',
'Strict avoidance of direct sunlight for 10 days. Do not pick micro-crusts.',
'Patient consented to laser downtime. Patch test clear.',
?, ?)
""", (now_str, now_str))

cursor.execute("INSERT OR REPLACE INTO prescriptions (id, visit_id, patient_id, doctor_id, created_at) VALUES ('rx-03-1', 'visit-03-1', 'pat-03', 'doc-01', ?)", (now_str,))
v_pat3 = [
    {"medication_name": "Fusidic Acid 2% Antibacterial Ointment", "dosage": "Thin film", "frequency": "Twice daily", "duration": "7 days", "instructions": "Apply after washing with sterile water"},
    {"medication_name": "Ceramide & Hyaluronic Barrier Cream", "dosage": "Generous layer", "frequency": "3-4 times daily", "duration": "14 days", "instructions": "Keep laser treated skin consistently hydrated"},
    {"medication_name": "Physical Zinc Oxide Sunscreen SPF 60+", "dosage": "Generous layer", "frequency": "Every 2-3 hours", "duration": "Continuous", "instructions": "Apply 20 mins prior to any window or outdoor exposure"}
]
cursor.execute("""
INSERT OR REPLACE INTO prescription_versions (id, prescription_id, version_number, content_json, correction_reason, notes, doctor_id, is_current, created_at)
VALUES ('rxv-03-1', 'rx-03-1', 1, ?, 'Post-laser resurfacing recovery protocol', 'Drink plenty of water. Avoid steam rooms and saunas for 2 weeks.', 'doc-01', 1, ?)
""", (json.dumps(v_pat3), now_str))

# Seed records for pat-04 (Maryam Siddiqui)
cursor.execute("INSERT OR REPLACE INTO doctor_patient_relationships (id, doctor_id, patient_id, first_visit_date, last_visit_date, total_visits, is_currently_assigned) VALUES ('rel-04-1', 'doc-02', 'pat-04', '2026-08-28', '2026-08-28', 1, 1)")
cursor.execute("INSERT OR REPLACE INTO visits (id, appointment_id, patient_id, doctor_id, visit_date, status, created_at) VALUES ('visit-04-1', 'appt-04-hist1', 'pat-04', 'doc-02', '2026-08-28', 'completed', ?)", (now_str,))
cursor.execute("INSERT OR REPLACE INTO appointments (id, patient_id, doctor_id, service_id, appointment_date, token_id, token_number, status, booking_source, approved_by, created_at, updated_at) VALUES ('appt-04-hist1', 'pat-04', 'doc-02', 'srv-05', '2026-08-28', 'tok-04-hist1', 5, 'completed', 'patient_portal', 'user-recep-01', ?, ?)", (now_str, now_str))

cursor.execute("""
INSERT OR REPLACE INTO clinical_records (id, visit_id, appointment_id, patient_id, doctor_id, chief_complaint, examination_findings, diagnosis, treatment_plan, clinical_notes, doctor_private_notes, created_at, updated_at)
VALUES ('clin-04-1', 'visit-04-1', 'appt-04-hist1', 'pat-04', 'doc-02',
'Bilateral brown facial patches on cheeks and bridge of nose aggravated by sun exposure',
'Centrofacial hyperpigmentation under Wood’s lamp highlighting epidermal melanin deposits',
'Epidermal Melasma & Post-Inflammatory Hyperpigmentation',
'Medical Chemical Peel (Glycolic 30% + TCA 10%) followed by daily Tranexamic Acid regimen.',
'Strict UV shielding required. Discontinue retinol 3 days prior to next session.',
'Good response to peel. No frosting or adverse burns noted.',
?, ?)
""", (now_str, now_str))

cursor.execute("INSERT OR REPLACE INTO prescriptions (id, visit_id, patient_id, doctor_id, created_at) VALUES ('rx-04-1', 'visit-04-1', 'pat-04', 'doc-02', ?)", (now_str,))
v_pat4 = [
    {"medication_name": "Azelaic Acid 20% Micronized Gel", "dosage": "Pea-sized amount", "frequency": "Every night", "duration": "60 days", "instructions": "Apply on cleansed skin over hyperpigmented areas"},
    {"medication_name": "Tranexamic Acid 3% Brightening Serum", "dosage": "3-4 drops", "frequency": "Every morning", "duration": "60 days", "instructions": "Apply after cleansing and before sunscreen"},
    {"medication_name": "Broad-Spectrum Tinted Fluid SPF 50+", "dosage": "Generous amount", "frequency": "Every 3 hours", "duration": "Continuous", "instructions": "Tinted formulation blocks visible blue light & HEV"}
]
cursor.execute("""
INSERT OR REPLACE INTO prescription_versions (id, prescription_id, version_number, content_json, correction_reason, notes, doctor_id, is_current, created_at)
VALUES ('rxv-04-1', 'rx-04-1', 1, ?, 'Melasma control and depigmentation protocol', 'Use wide-brim hat outdoors', 'doc-02', 1, ?)
""", (json.dumps(v_pat4), now_str))

# Seed records for pat-05 (Usman Sheikh)
cursor.execute("INSERT OR REPLACE INTO doctor_patient_relationships (id, doctor_id, patient_id, first_visit_date, last_visit_date, total_visits, is_currently_assigned) VALUES ('rel-05-1', 'doc-01', 'pat-05', '2026-08-05', '2026-08-05', 1, 1)")
cursor.execute("INSERT OR REPLACE INTO visits (id, appointment_id, patient_id, doctor_id, visit_date, status, created_at) VALUES ('visit-05-1', 'appt-05-hist1', 'pat-05', 'doc-01', '2026-08-05', 'completed', ?)", (now_str,))
cursor.execute("INSERT OR REPLACE INTO appointments (id, patient_id, doctor_id, service_id, appointment_date, token_id, token_number, status, booking_source, approved_by, created_at, updated_at) VALUES ('appt-05-hist1', 'pat-05', 'doc-01', 'srv-01', '2026-08-05', 'tok-05-hist1', 2, 'completed', 'patient_portal', 'user-recep-01', ?, ?)", (now_str, now_str))

cursor.execute("""
INSERT OR REPLACE INTO clinical_records (id, visit_id, appointment_id, patient_id, doctor_id, chief_complaint, examination_findings, diagnosis, treatment_plan, clinical_notes, doctor_private_notes, created_at, updated_at)
VALUES ('clin-05-1', 'visit-05-1', 'appt-05-hist1', 'pat-05', 'doc-01',
'Persistent facial flushing, stinging sensation, and central facial erythema for 1 year',
'Erythematous telangiectasias across cheeks and nose with scattered non-comedonal papules',
'Papulopustular Rosacea with Facial Telangiectasias (Subtype 2)',
'Topical Ivermectin 1% once daily + soothing anti-redness barrier repair.',
'Avoid known dietary triggers: spicy foods, alcohol, and sudden hot showers.',
'Patient educated on vascular hyper-reactivity triggers.',
?, ?)
""", (now_str, now_str))

cursor.execute("INSERT OR REPLACE INTO prescriptions (id, visit_id, patient_id, doctor_id, created_at) VALUES ('rx-05-1', 'visit-05-1', 'pat-05', 'doc-01', ?)", (now_str,))
v_pat5 = [
    {"medication_name": "Ivermectin 1% Anti-Parasitic/Anti-Inflammatory Cream", "dosage": "Pea-sized amount", "frequency": "Once daily at bedtime", "duration": "60 days", "instructions": "Apply across forehead, chin, nose, and cheeks"},
    {"medication_name": "Metronidazole 0.75% Soothing Gel", "dosage": "Thin film", "frequency": "Once daily in morning", "duration": "45 days", "instructions": "Apply gently before moisturizer"},
    {"medication_name": "Ultra-Gentle Barrier Foam Cleanser", "dosage": "1 pump", "frequency": "Twice daily", "duration": "Continuous", "instructions": "Non-foaming surfactant, rinse with cool water"}
]
cursor.execute("""
INSERT OR REPLACE INTO prescription_versions (id, prescription_id, version_number, content_json, correction_reason, notes, doctor_id, is_current, created_at)
VALUES ('rxv-05-1', 'rx-05-1', 1, ?, 'Rosacea reduction protocol', 'Review in 6 weeks for laser vascular telangiectasia check', 'doc-01', 1, ?)
""", (json.dumps(v_pat5), now_str))

conn.commit()
conn.close()
print("SUCCESS: Seeded detailed previous checkup and clinical records for all patients!")
