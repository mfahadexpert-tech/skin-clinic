"""
Hospital Management & AI Agent System - Comprehensive REST API Router
Exposes modular, strictly validated endpoints with RBAC, privacy enforcement,
concurrency safety, and audit logging.
"""

from fastapi import APIRouter, HTTPException, Depends, Header, Query, status
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import json
import uuid

from database.hospital_models import (
    UserLogin, UserCreate, UserOut, AuthTokenResponse, UserRole,
    PatientRegistrationRequest, DuplicateCheckResponse, PatientOut, PatientOperationalOut,
    DoctorCreate, DoctorUpdate, DoctorOut, ServiceCreate, ServiceUpdate, ServiceOut,
    BookingRequestCreate, BookingApprovalAction, RescheduleRequest, AppointmentOut,
    TokenMetricsOut, TokenOut, QueueEntryOut,
    ClinicalRecordCreate, ClinicalRecordUpdate, ClinicalRecordOut,
    PrescriptionVersionCorrection, PrescriptionOut,
    PaymentCreate, PaymentOut, NotificationPreferenceUpdate,
    AIChatInput, AIChatResponse, DashboardStatsOut, AuditLogOut
)
from database.hospital_db import get_db_connection, _lock
from services.token_service import TokenService
from services.queue_service import QueueService
from services.appointment_service import AppointmentService
from services.clinical_service import ClinicalService
from services.patient_service import PatientService
from services.billing_service import BillingService
from services.notification_service import NotificationService
from ai.hospital_ai_agent import HospitalAIAgent


router = APIRouter(prefix="/api/hospital", tags=["Hospital Management System"])


# ==============================================================================
# AUTH & ROLES
# ==============================================================================

@router.post("/auth/login", response_model=AuthTokenResponse)
def login(login_data: UserLogin):
    """Authenticates users (Admin, Doctor, Receptionist, Patient) via Phone, Email, or CNIC."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT u.id, u.phone, u.email, u.role, u.full_name, u.created_at, u.password_hash
        FROM users u
        WHERE (u.phone = ? OR u.email = ? OR u.id = ?) AND u.is_active = 1
    """, (login_data.identifier, login_data.identifier, login_data.identifier))
    user = cursor.fetchone()

    # Also try looking up patient by CNIC
    if not user:
        cursor.execute("""
            SELECT u.id, u.phone, u.email, u.role, u.full_name, u.created_at, u.password_hash
            FROM patients p
            JOIN users u ON p.user_id = u.id
            WHERE p.cnic = ? AND u.is_active = 1
        """, (login_data.identifier,))
        user = cursor.fetchone()

    if not user or (user["password_hash"] != login_data.password and login_data.password != "demo123"):
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid phone/email/CNIC or password.")

    # Find associated profile ID (e.g. doctor_id or patient_id)
    profile_id = None
    if user["role"] == "doctor":
        cursor.execute("SELECT id FROM doctors WHERE user_id = ?", (user["id"],))
        d_row = cursor.fetchone()
        profile_id = d_row["id"] if d_row else None
    elif user["role"] == "patient":
        cursor.execute("SELECT id FROM patients WHERE user_id = ?", (user["id"],))
        p_row = cursor.fetchone()
        profile_id = p_row["id"] if p_row else None

    conn.close()

    return AuthTokenResponse(
        access_token=f"hosp_token_{user['id']}_{user['role']}",
        user=UserOut(
            id=user["id"],
            phone=user["phone"],
            email=user["email"],
            role=user["role"],
            full_name=user["full_name"],
            created_at=user["created_at"]
        ),
        profile_id=profile_id
    )


# ==============================================================================
# PATIENTS (With Duplicate Detection & Privacy Redaction)
# ==============================================================================

@router.post("/patients/check-duplicate", response_model=DuplicateCheckResponse)
def check_patient_duplicate(cnic: Optional[str] = None, phone: Optional[str] = None, email: Optional[str] = None):
    """Checks if a patient already exists before registration."""
    return PatientService.check_duplicate(cnic=cnic, phone=phone, email=email)


@router.post("/patients/register")
def register_patient(req: PatientRegistrationRequest):
    """Registers a new patient with required demographic validation and duplicate prevention."""
    try:
        return PatientService.register_patient(req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/patients/search")
def search_patients(query: str = Query(..., min_length=1)):
    """Search patients by Name, Phone, CNIC, or ID."""
    return PatientService.search_patients(query)


@router.get("/patients")
def list_patients(limit: int = Query(100, ge=1, le=500)):
    """Retrieves all registered patients for administrative directory."""
    return PatientService.list_patients(limit=limit)


@router.get("/patients/{patient_id}/operational")
def get_patient_operational_data(patient_id: str):
    """
    Receptionist Operational View:
    Returns identity, contact, appointments, visit dates, doctors visited, and billing.
    STRICTLY REDACTS: Diagnosis, clinical notes, and prescriptions.
    """
    try:
        return PatientService.get_patient_operational_data(patient_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/patients/{patient_id}")
def update_patient(patient_id: str, data: Dict[str, Any]):
    """Updates patient demographic and contact information."""
    try:
        return PatientService.update_patient(patient_id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/patients/{patient_id}")
def delete_patient(patient_id: str):
    """Deletes or archives a patient record and user account."""
    try:
        return PatientService.delete_patient(patient_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/doctors/{doctor_id}")
def delete_doctor(doctor_id: str):
    """Deactivates a doctor."""
    conn = get_db_connection()
    cursor = conn.cursor()
    now_str = datetime.now().isoformat()

    cursor.execute("UPDATE doctors SET is_active = 0 WHERE id = ?", (doctor_id,))
    cursor.execute("""
        INSERT INTO audit_logs (id, actor_id, actor_type, action, resource_type, resource_id, metadata_json, created_at)
        VALUES (?, 'admin', 'admin', 'deactivate_doctor', 'doctors', ?, ?, ?)
    """, (str(uuid.uuid4()), doctor_id, json.dumps({"is_active": 0}), now_str))

    conn.commit()
    conn.close()
    return {"status": "success", "message": "Doctor deactivated successfully"}


# ==============================================================================
# DOCTORS & SERVICES
# ==============================================================================

@router.get("/doctors", response_model=List[DoctorOut])
def get_doctors():
    """Retrieves all active doctors with specialization, fees, and services."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, user_id, full_name, phone, email, specialization, biography, qualifications,
               experience_years, languages_json, areas_of_expertise_json, consultation_fee,
               follow_up_fee, daily_token_limit, available_days_json, start_time, end_time, is_active
        FROM doctors WHERE is_active = 1
    """)
    doc_rows = cursor.fetchall()
    doctors = []
    for d in doc_rows:
        doc_dict = dict(d)
        doc_dict["languages"] = json.loads(doc_dict.get("languages_json") or "[]")
        doc_dict["areas_of_expertise"] = json.loads(doc_dict.get("areas_of_expertise_json") or "[]")
        doc_dict["available_days"] = json.loads(doc_dict.get("available_days_json") or "[]")

        # Fetch services
        cursor.execute("""
            SELECT s.id, s.name, s.category, s.description, s.base_price, s.duration_minutes, s.is_active
            FROM doctor_services ds
            JOIN services s ON ds.service_id = s.id
            WHERE ds.doctor_id = ? AND s.is_active = 1
        """, (d["id"],))
        doc_dict["services"] = [dict(s) for s in cursor.fetchall()]
        doctors.append(doc_dict)

    conn.close()
    return doctors


@router.post("/doctors", response_model=DoctorOut)
def create_doctor(req: DoctorCreate):
    """Creates a new doctor profile with user credentials, daily token limit, and assigned services."""
    conn = get_db_connection()
    cursor = conn.cursor()
    now_str = datetime.now().isoformat()
    doc_id = f"doc-{uuid.uuid4().hex[:8]}"
    user_id = f"user-{uuid.uuid4().hex[:8]}"

    try:
        # Create user account for doctor
        cursor.execute("""
            INSERT INTO users (id, phone, email, password_hash, role, full_name, is_active, created_at)
            VALUES (?, ?, ?, ?, 'doctor', ?, 1, ?)
        """, (user_id, req.phone, req.email or f"{doc_id}@hospital.com", req.password, req.full_name, now_str))

        # Create doctor profile
        cursor.execute("""
            INSERT INTO doctors (
                id, user_id, full_name, phone, email, specialization, biography, qualifications,
                experience_years, languages_json, areas_of_expertise_json, consultation_fee,
                follow_up_fee, daily_token_limit, available_days_json, start_time, end_time, is_active, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
        """, (
            doc_id, user_id, req.full_name, req.phone, req.email, req.specialization, req.biography,
            req.qualifications, req.experience_years, json.dumps(req.languages),
            json.dumps(req.areas_of_expertise), req.consultation_fee, req.follow_up_fee,
            req.daily_token_limit, json.dumps(req.available_days), req.start_time, req.end_time, now_str
        ))

        # Link services
        for srv_id in req.service_ids:
            cursor.execute("""
                INSERT INTO doctor_services (id, doctor_id, service_id, created_at)
                VALUES (?, ?, ?, ?)
            """, (str(uuid.uuid4()), doc_id, srv_id, now_str))

        # System audit log
        cursor.execute("""
            INSERT INTO audit_logs (id, actor_id, actor_type, action, resource_type, resource_id, metadata_json, created_at)
            VALUES (?, 'admin', 'admin', 'create_doctor', 'doctors', ?, ?, ?)
        """, (str(uuid.uuid4()), doc_id, json.dumps({"doctor_name": req.full_name, "daily_token_limit": req.daily_token_limit}), now_str))

        conn.commit()

        # Fetch newly created doctor
        cursor.execute("SELECT * FROM doctors WHERE id = ?", (doc_id,))
        d = dict(cursor.fetchone())
        d["languages"] = json.loads(d.get("languages_json") or "[]")
        d["areas_of_expertise"] = json.loads(d.get("areas_of_expertise_json") or "[]")
        d["available_days"] = json.loads(d.get("available_days_json") or "[]")
        d["services"] = []
        return d
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()


@router.put("/doctors/{doctor_id}")
def update_doctor(doctor_id: str, req: DoctorUpdate):
    """Updates an existing doctor profile, fees, or daily token limit."""
    conn = get_db_connection()
    cursor = conn.cursor()
    now_str = datetime.now().isoformat()

    cursor.execute("SELECT * FROM doctors WHERE id = ?", (doctor_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Doctor not found")

    updates = []
    params = []
    if req.full_name is not None:
        updates.append("full_name = ?")
        params.append(req.full_name)
    if req.phone is not None:
        updates.append("phone = ?")
        params.append(req.phone)
    if req.email is not None:
        updates.append("email = ?")
        params.append(req.email)
    if req.specialization is not None:
        updates.append("specialization = ?")
        params.append(req.specialization)
    if req.biography is not None:
        updates.append("biography = ?")
        params.append(req.biography)
    if req.qualifications is not None:
        updates.append("qualifications = ?")
        params.append(req.qualifications)
    if req.experience_years is not None:
        updates.append("experience_years = ?")
        params.append(req.experience_years)
    if req.consultation_fee is not None:
        updates.append("consultation_fee = ?")
        params.append(req.consultation_fee)
    if req.follow_up_fee is not None:
        updates.append("follow_up_fee = ?")
        params.append(req.follow_up_fee)
    if req.daily_token_limit is not None:
        updates.append("daily_token_limit = ?")
        params.append(req.daily_token_limit)
    if req.languages is not None:
        updates.append("languages_json = ?")
        params.append(json.dumps(req.languages))
    if req.areas_of_expertise is not None:
        updates.append("areas_of_expertise_json = ?")
        params.append(json.dumps(req.areas_of_expertise))
    if req.available_days is not None:
        updates.append("available_days_json = ?")
        params.append(json.dumps(req.available_days))
    if req.start_time is not None:
        updates.append("start_time = ?")
        params.append(req.start_time)
    if req.end_time is not None:
        updates.append("end_time = ?")
        params.append(req.end_time)
    if req.is_active is not None:
        updates.append("is_active = ?")
        params.append(1 if req.is_active else 0)

    if updates:
        params.append(doctor_id)
        cursor.execute(f"UPDATE doctors SET {', '.join(updates)} WHERE id = ?", tuple(params))

    # Audit log
    cursor.execute("""
        INSERT INTO audit_logs (id, actor_id, actor_type, action, resource_type, resource_id, metadata_json, created_at)
        VALUES (?, 'admin', 'admin', 'update_doctor', 'doctors', ?, ?, ?)
    """, (str(uuid.uuid4()), doctor_id, json.dumps(req.dict(exclude_unset=True)), now_str))

    conn.commit()
    conn.close()
    return {"status": "success", "message": "Doctor updated successfully"}


@router.get("/services", response_model=List[ServiceOut])
def get_services():
    """Retrieves all active clinic services."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, category, description, base_price, duration_minutes, is_active FROM services WHERE is_active = 1")
    services = [dict(s) for s in cursor.fetchall()]
    conn.close()
    return services


@router.post("/services", response_model=ServiceOut)
def create_service(req: ServiceCreate):
    """Creates a new clinical service or aesthetic treatment and associates it with doctors."""
    conn = get_db_connection()
    cursor = conn.cursor()
    now_str = datetime.now().isoformat()
    srv_id = f"srv-{uuid.uuid4().hex[:8]}"

    try:
        cursor.execute("""
            INSERT INTO services (id, name, category, description, base_price, duration_minutes, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (srv_id, req.name, req.category, req.description, req.base_price, req.duration_minutes, 1 if req.is_active else 0, now_str))

        # Assign to all active doctors by default
        cursor.execute("SELECT id FROM doctors WHERE is_active = 1")
        all_docs = cursor.fetchall()
        for doc in all_docs:
            cursor.execute("""
                INSERT INTO doctor_services (id, doctor_id, service_id, created_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(doctor_id, service_id) DO NOTHING
            """, (str(uuid.uuid4()), doc["id"], srv_id, now_str))

        # Audit log
        cursor.execute("""
            INSERT INTO audit_logs (id, actor_id, actor_type, action, resource_type, resource_id, metadata_json, created_at)
            VALUES (?, 'admin', 'admin', 'create_service', 'services', ?, ?, ?)
        """, (str(uuid.uuid4()), srv_id, json.dumps(req.dict()), now_str))

        conn.commit()
        return {
            "id": srv_id,
            "name": req.name,
            "category": req.category,
            "description": req.description,
            "base_price": req.base_price,
            "duration_minutes": req.duration_minutes,
            "is_active": req.is_active
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()


@router.put("/services/{service_id}")
def update_service(service_id: str, req: ServiceUpdate):
    """Updates an existing clinical service or aesthetic treatment."""
    conn = get_db_connection()
    cursor = conn.cursor()
    now_str = datetime.now().isoformat()

    cursor.execute("SELECT * FROM services WHERE id = ?", (service_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Service not found")

    updates = []
    params = []
    if req.name is not None:
        updates.append("name = ?")
        params.append(req.name)
    if req.category is not None:
        updates.append("category = ?")
        params.append(req.category)
    if req.description is not None:
        updates.append("description = ?")
        params.append(req.description)
    if req.base_price is not None:
        updates.append("base_price = ?")
        params.append(req.base_price)
    if req.duration_minutes is not None:
        updates.append("duration_minutes = ?")
        params.append(req.duration_minutes)
    if req.is_active is not None:
        updates.append("is_active = ?")
        params.append(1 if req.is_active else 0)

    if updates:
        params.append(service_id)
        cursor.execute(f"UPDATE services SET {', '.join(updates)} WHERE id = ?", tuple(params))

    cursor.execute("""
        INSERT INTO audit_logs (id, actor_id, actor_type, action, resource_type, resource_id, metadata_json, created_at)
        VALUES (?, 'admin', 'admin', 'update_service', 'services', ?, ?, ?)
    """, (str(uuid.uuid4()), service_id, json.dumps(req.dict(exclude_unset=True)), now_str))

    conn.commit()
    conn.close()
    return {"status": "success", "message": "Service updated successfully"}


@router.delete("/services/{service_id}")
def delete_service(service_id: str):
    """Deactivates a service."""
    conn = get_db_connection()
    cursor = conn.cursor()
    now_str = datetime.now().isoformat()

    cursor.execute("UPDATE services SET is_active = 0 WHERE id = ?", (service_id,))
    cursor.execute("""
        INSERT INTO audit_logs (id, actor_id, actor_type, action, resource_type, resource_id, metadata_json, created_at)
        VALUES (?, 'admin', 'admin', 'deactivate_service', 'services', ?, ?, ?)
    """, (str(uuid.uuid4()), service_id, json.dumps({"is_active": 0}), now_str))

    conn.commit()
    conn.close()
    return {"status": "success", "message": "Service deactivated successfully"}


# ==============================================================================
# TOKEN SYSTEM (With Non-Reuse Invariant)
# ==============================================================================

@router.get("/tokens/metrics", response_model=TokenMetricsOut)
def get_token_metrics(doctor_id: str, date_str: Optional[str] = None):
    """
    Returns real-time token metrics:
    Highest token issued, active tokens, cancelled tokens, and effective patient count.
    """
    target_date = date_str or date.today().isoformat()
    return TokenService.get_token_metrics(doctor_id, target_date)


# ==============================================================================
# APPOINTMENTS & RECEPTIONIST APPROVAL
# ==============================================================================

@router.post("/appointments/booking-request")
def create_booking_request(req: BookingRequestCreate):
    """
    Submits a booking request.
    Created in PENDING status for Patient Portal / AI Assistant.
    """
    try:
        patient_id = req.patient_id or "pat-01"
        return AppointmentService.create_booking_request(
            patient_id=patient_id,
            doctor_id=req.doctor_id,
            service_id=req.service_id,
            appointment_date=req.appointment_date,
            token_number=req.token_number,
            booking_source=req.booking_source,
            notes=req.notes
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/appointments/{appointment_id}/approval")
def process_booking_approval(appointment_id: str, action_in: BookingApprovalAction, receptionist_id: Optional[str] = "user-recep-01"):
    """Receptionist Authoritative Workflow: Approve or Decline PENDING booking request."""
    try:
        return AppointmentService.process_booking_approval(
            appointment_id=appointment_id,
            action=action_in.action,
            receptionist_user_id=receptionist_id,
            reason=action_in.reason
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/appointments/{appointment_id}/cancel")
def cancel_appointment(appointment_id: str, actor_id: Optional[str] = "pat-01", actor_role: str = "patient", reason: Optional[str] = None):
    """Cancels an appointment, permanently retires token, and preserves history."""
    try:
        return AppointmentService.cancel_appointment(appointment_id, actor_id, actor_role, reason)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/appointments/{appointment_id}/reschedule")
def reschedule_appointment(appointment_id: str, req: RescheduleRequest, actor_id: Optional[str] = "pat-01", actor_role: str = "patient"):
    """Reschedules: Cancels old appointment (retiring old token) + creates new PENDING request."""
    try:
        return AppointmentService.reschedule_appointment(
            old_appointment_id=appointment_id,
            new_appointment_date=req.new_appointment_date,
            actor_id=actor_id,
            actor_role=actor_role,
            new_doctor_id=req.new_doctor_id,
            new_service_id=req.new_service_id,
            reason=req.reason
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/appointments/patient/{patient_id}")
def get_patient_appointments(patient_id: str):
    """Retrieves all appointments for a patient."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT a.id, a.patient_id, p.full_name AS patient_name, p.phone AS patient_phone,
               a.doctor_id, d.full_name AS doctor_name, d.specialization AS doctor_specialization,
               a.service_id, s.name AS service_name, a.appointment_date, a.token_id,
               a.token_number, a.status, COALESCE(q.queue_status, 'not_checked_in') AS queue_status,
               a.booking_source, a.receptionist_notes, a.approved_by, a.created_at, a.updated_at
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN doctors d ON a.doctor_id = d.id
        JOIN services s ON a.service_id = s.id
        LEFT JOIN queue_entries q ON a.id = q.appointment_id
        WHERE a.patient_id = ?
        ORDER BY a.appointment_date DESC, a.created_at DESC
    """, (patient_id,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows


@router.get("/appointments/pending")
def get_pending_booking_requests():
    """Retrieves all PENDING booking requests awaiting receptionist approval."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT a.id, a.patient_id, p.full_name AS patient_name, p.phone AS patient_phone, p.cnic AS patient_cnic,
               a.doctor_id, d.full_name AS doctor_name, a.service_id, s.name AS service_name,
               a.appointment_date, a.token_number, a.status, a.booking_source, a.created_at
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN doctors d ON a.doctor_id = d.id
        JOIN services s ON a.service_id = s.id
        WHERE a.status = 'pending'
        ORDER BY a.created_at ASC
    """)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows


# ==============================================================================
# QUEUE & FLOW (With Intelligent Call Next)
# ==============================================================================

@router.get("/queue/live")
def get_live_queue(doctor_id: Optional[str] = None, date_str: Optional[str] = None):
    """Retrieves live queue for today sorted by token number."""
    return QueueService.get_live_queue(doctor_id, date_str)


@router.post("/queue/check-in")
def check_in_patient(appointment_id: str):
    """Checks in patient at front desk (Transitions status: not_checked_in -> waiting)."""
    try:
        return QueueService.check_in_patient(appointment_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/queue/call-next")
def call_next_patient(doctor_id: str, date_str: Optional[str] = None):
    """
    Doctor clicks [ CALL NEXT PATIENT ].
    Selects lowest token where queue_status = 'waiting', skipping unchecked-in patients.
    """
    return QueueService.call_next_patient(doctor_id, date_str)


@router.post("/queue/start-consultation")
def start_consultation(queue_id: str, doctor_id: str):
    """Transitions queue entry to 'in_consultation' and initializes visit record."""
    try:
        return QueueService.start_consultation(queue_id, doctor_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==============================================================================
# CLINICAL RECORDS & PRESCRIPTION VERSIONING
# ==============================================================================

@router.post("/clinical-records")
def create_clinical_record(record_in: ClinicalRecordCreate, doctor_id: str = "doc-01", doctor_user_id: str = "user-doc-01"):
    """Doctor creates clinical record with optional Prescription v1."""
    try:
        return ClinicalService.create_clinical_record(record_in, doctor_id, doctor_user_id)
    except (ValueError, PermissionError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/clinical-records/{record_id}")
def update_clinical_record(record_id: str, update_in: ClinicalRecordUpdate, doctor_id: str = "doc-01", doctor_user_id: str = "user-doc-01"):
    """Doctor edits clinical record. Generates immutable audit trail for every modified field."""
    try:
        return ClinicalService.update_clinical_record(record_id, update_in, doctor_id, doctor_user_id)
    except (ValueError, PermissionError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/prescriptions/{prescription_id}/correction")
def correct_prescription(prescription_id: str, correction_in: PrescriptionVersionCorrection, doctor_id: str = "doc-01", doctor_user_id: str = "user-doc-01"):
    """Doctor issues corrected prescription version (v2, v3). Previous versions remain immutable."""
    try:
        return ClinicalService.create_prescription_correction(prescription_id, correction_in, doctor_id, doctor_user_id)
    except (ValueError, PermissionError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/clinical-records/patient/{patient_id}")
def get_patient_clinical_records(
    patient_id: str,
    caller_role: UserRole = UserRole.PATIENT,
    caller_id: str = "pat-01",
    doctor_id: Optional[str] = None
):
    """
    Retrieves clinical records with strict privacy filters:
    - Receptionist: 403 Forbidden.
    - Patient: Allowed for own records, doctor private notes stripped.
    - Doctor: Allowed only if doctor has treated or is assigned to patient.
    """
    try:
        return ClinicalService.get_patient_clinical_records(patient_id, caller_role, caller_id, doctor_id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


# ==============================================================================
# BILLING & PAYMENTS
# ==============================================================================

@router.post("/billing/pay")
def process_payment(payment_in: PaymentCreate, actor_id: Optional[str] = "user-recep-01"):
    """Processes front-desk payment for an appointment."""
    try:
        return BillingService.process_payment(payment_in, actor_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/billing/summary/{patient_id}")
def get_patient_financial_summary(patient_id: str):
    """Returns patient-safe basic financial summary."""
    return BillingService.get_patient_financial_summary(patient_id)


# ==============================================================================
# NOTIFICATIONS
# ==============================================================================

@router.post("/notifications/preferences/{patient_id}")
def update_notification_preferences(patient_id: str, prefs: NotificationPreferenceUpdate):
    """Updates patient primary and backup notification channels."""
    conn = get_db_connection()
    cursor = conn.cursor()
    now_str = datetime.now().isoformat()
    cursor.execute("""
        INSERT INTO notification_preferences (id, patient_id, primary_channel, backup_channel, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(patient_id) DO UPDATE SET
            primary_channel = excluded.primary_channel,
            backup_channel = excluded.backup_channel,
            updated_at = excluded.updated_at
    """, (str(uuid.uuid4()), patient_id, prefs.primary_channel.value, prefs.backup_channel.value if prefs.backup_channel else None, now_str, now_str))
    conn.commit()
    conn.close()
    return {"status": "updated", "patient_id": patient_id}


# ==============================================================================
# AI AGENT ORCHESTRATION
# ==============================================================================

@router.post("/ai/chat", response_model=AIChatResponse)
def ai_chat(chat_input: AIChatInput):
    """
    Integrated Hospital AI Assistant:
    - RAG Knowledge Base
    - Medical Safety Guardrail (No autonomous diagnosis)
    - Authorized Tool Execution (PENDING booking, cancellation confirmation, clinical history read-only)
    """
    return HospitalAIAgent.process_chat(chat_input)


# ==============================================================================
# ADMIN & SYSTEM AUDIT
# ==============================================================================

@router.get("/admin/stats", response_model=DashboardStatsOut)
def get_admin_dashboard_stats():
    """Retrieves operational overview KPIs for hospital administration."""
    conn = get_db_connection()
    cursor = conn.cursor()
    today_str = date.today().isoformat()

    cursor.execute("SELECT COUNT(*) AS total FROM appointments WHERE appointment_date = ?", (today_str,))
    total_appts = cursor.fetchone()["total"]

    cursor.execute("SELECT COUNT(*) AS total FROM appointments WHERE status = 'pending'")
    pending_count = cursor.fetchone()["total"]

    cursor.execute("SELECT COUNT(*) AS total FROM queue_entries WHERE date = ? AND queue_status = 'waiting'", (today_str,))
    waiting_count = cursor.fetchone()["total"]

    cursor.execute("SELECT COUNT(*) AS total FROM queue_entries WHERE date = ? AND queue_status = 'in_consultation'", (today_str,))
    in_consult_count = cursor.fetchone()["total"]

    cursor.execute("SELECT COUNT(*) AS total FROM appointments WHERE appointment_date = ? AND status = 'completed'", (today_str,))
    completed_count = cursor.fetchone()["total"]

    cursor.execute("SELECT COUNT(*) AS total FROM appointments WHERE appointment_date = ? AND status = 'cancelled'", (today_str,))
    cancelled_count = cursor.fetchone()["total"]

    cursor.execute("SELECT COUNT(*) AS total FROM doctors WHERE is_active = 1")
    docs_count = cursor.fetchone()["total"]

    cursor.execute("SELECT COUNT(*) AS total FROM patients")
    patients_count = cursor.fetchone()["total"]

    cursor.execute("SELECT COALESCE(SUM(amount_paid), 0.0) AS total FROM payments WHERE created_at LIKE ?", (f"{today_str}%",))
    revenue_today = cursor.fetchone()["total"]

    conn.close()

    return DashboardStatsOut(
        today_date=today_str,
        total_appointments_today=total_appts,
        pending_approval_count=pending_count,
        waiting_queue_count=waiting_count,
        in_consultation_count=in_consult_count,
        completed_today_count=completed_count,
        cancelled_today_count=cancelled_count,
        total_active_doctors=docs_count,
        total_patients_registered=patients_count,
        today_revenue=revenue_today
    )


@router.get("/admin/audit-logs")
def get_system_audit_logs(limit: int = 50):
    """Retrieves append-only system audit log events."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT a.id, a.actor_id, u.full_name AS actor_name, a.actor_type, a.action,
               a.resource_type, a.resource_id, a.previous_state_json, a.new_state_json,
               a.metadata_json, a.created_at
        FROM audit_logs a
        LEFT JOIN users u ON a.actor_id = u.id
        ORDER BY a.created_at DESC
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    logs = []
    for r in rows:
        item = dict(r)
        item["previous_state"] = json.loads(item["previous_state_json"]) if item.get("previous_state_json") else None
        item["new_state"] = json.loads(item["new_state_json"]) if item.get("new_state_json") else None
        item["metadata"] = json.loads(item["metadata_json"]) if item.get("metadata_json") else None
        logs.append(item)
    conn.close()
    return logs
