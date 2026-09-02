"""
Hospital Management & AI Agent System - Core Data Models
Strict Pydantic schemas enforcing data integrity, role-based access, 
prescription versioning, token invariants, and audit logging.
"""

from typing import List, Optional, Dict, Any, Union
from datetime import datetime, date, time
from enum import Enum
from pydantic import BaseModel, Field, EmailStr


# ==============================================================================
# ENUMS
# ==============================================================================

class UserRole(str, Enum):
    ADMIN = "admin"
    DOCTOR = "doctor"
    RECEPTIONIST = "receptionist"
    PATIENT = "patient"


class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class AppointmentStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    DECLINED = "declined"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class QueueStatus(str, Enum):
    NOT_CHECKED_IN = "not_checked_in"
    WAITING = "waiting"
    CALLED = "called"
    IN_CONSULTATION = "in_consultation"
    COMPLETED = "completed"
    NO_SHOW = "no_show"
    CANCELLED = "cancelled"


class TokenStatus(str, Enum):
    ALLOCATED = "allocated"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class BookingSource(str, Enum):
    PATIENT_PORTAL = "patient_portal"
    RECEPTIONIST_WALKIN = "receptionist_walkin"
    AI_AGENT = "ai_agent"


class NotificationChannel(str, Enum):
    WHATSAPP = "whatsapp"
    SMS = "sms"
    EMAIL = "email"


class NotificationEvent(str, Enum):
    BOOKING_PENDING = "booking_pending"
    BOOKING_CONFIRMED = "booking_confirmed"
    BOOKING_DECLINED = "booking_declined"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"
    REMINDER = "reminder"
    FOLLOW_UP = "follow_up"


class PaymentStatus(str, Enum):
    UNPAID = "unpaid"
    PARTIAL = "partial"
    PAID = "paid"


# ==============================================================================
# AUTH & USER MODELS
# ==============================================================================

class UserBase(BaseModel):
    phone: str
    email: Optional[str] = None
    role: UserRole = UserRole.PATIENT
    full_name: str


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    identifier: str  # Phone or Email or CNIC
    password: str


class UserOut(BaseModel):
    id: str
    phone: str
    email: Optional[str] = None
    role: UserRole
    full_name: str
    created_at: str


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
    profile_id: Optional[str] = None


# ==============================================================================
# PATIENT MODELS
# ==============================================================================

class PatientRegistrationRequest(BaseModel):
    full_name: str
    phone: str
    password: Optional[str] = "Patient@123"  # default if registered at desk
    gender: Gender
    dob: str  # YYYY-MM-DD
    cnic: str
    address: str
    emergency_contact: str
    email: Optional[str] = None
    whatsapp_available: bool = False
    primary_notification_channel: NotificationChannel = NotificationChannel.SMS
    backup_notification_channel: Optional[NotificationChannel] = None
    doctor_id: Optional[str] = None
    service_id: Optional[str] = None
    auto_queue: bool = True


class PatientDuplicateCheck(BaseModel):
    cnic: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class DuplicateCheckResponse(BaseModel):
    has_duplicate: bool
    duplicate_field: Optional[str] = None
    existing_patient: Optional[Dict[str, Any]] = None
    warning_message: Optional[str] = None


class PatientOut(BaseModel):
    id: str
    user_id: Optional[str] = None
    full_name: str
    phone: str
    email: Optional[str] = None
    gender: str
    dob: str
    cnic: str
    address: str
    emergency_contact: str
    whatsapp_available: bool
    created_at: str


# Operational-only patient view for Receptionist (Strictly clinical redacted)
class PatientOperationalOut(BaseModel):
    id: str
    full_name: str
    phone: str
    email: Optional[str] = None
    gender: str
    dob: str
    cnic: str
    address: str
    emergency_contact: str
    total_visits: int = 0
    last_visit_date: Optional[str] = None
    payment_status: Optional[str] = "paid"
    follow_up_date: Optional[str] = None


# ==============================================================================
# DOCTOR & SERVICE MODELS
# ==============================================================================

class ServiceCreate(BaseModel):
    name: str
    category: str
    description: str
    base_price: float
    duration_minutes: int = 30
    is_active: bool = True


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    base_price: Optional[float] = None
    duration_minutes: Optional[int] = None
    is_active: Optional[bool] = None


class ServiceOut(BaseModel):
    id: str
    name: str
    category: str
    description: str
    base_price: float
    duration_minutes: int
    is_active: bool


class DoctorCreate(BaseModel):
    full_name: str
    phone: str
    email: Optional[str] = None
    password: str = "Doctor@123"
    specialization: str
    biography: str
    qualifications: str
    experience_years: int
    languages: List[str] = ["English", "Urdu"]
    areas_of_expertise: List[str] = []
    consultation_fee: float = 2000.0
    follow_up_fee: float = 1000.0
    daily_token_limit: int = 100
    service_ids: List[str] = []
    available_days: List[str] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    start_time: str = "09:00"
    end_time: str = "17:00"


class DoctorUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    specialization: Optional[str] = None
    biography: Optional[str] = None
    qualifications: Optional[str] = None
    experience_years: Optional[int] = None
    languages: Optional[List[str]] = None
    areas_of_expertise: Optional[List[str]] = None
    consultation_fee: Optional[float] = None
    follow_up_fee: Optional[float] = None
    daily_token_limit: Optional[int] = None
    service_ids: Optional[List[str]] = None
    available_days: Optional[List[str]] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    is_active: Optional[bool] = None


class DoctorOut(BaseModel):
    id: str
    user_id: str
    full_name: str
    phone: str
    email: Optional[str] = None
    specialization: str
    biography: Optional[str] = ""
    qualifications: Optional[str] = ""
    experience_years: int = 5
    languages: List[str] = ["English", "Urdu"]
    areas_of_expertise: List[str] = []
    consultation_fee: float = 2000.0
    follow_up_fee: float = 1000.0
    daily_token_limit: int = 100
    services: List[ServiceOut] = []
    available_days: List[str] = []
    start_time: str = "09:00"
    end_time: str = "17:00"
    is_active: bool = True


# ==============================================================================
# TOKEN & QUEUE MODELS
# ==============================================================================

class TokenMetricsOut(BaseModel):
    doctor_id: str
    date: str
    daily_limit: int
    highest_token_issued: int
    active_allocated_tokens: int
    cancelled_tokens_count: int
    completed_tokens_count: int
    effective_patient_count: int
    available_slots_remaining: int


class TokenOut(BaseModel):
    id: str
    doctor_id: str
    doctor_name: Optional[str] = None
    date: str
    token_number: int
    status: TokenStatus
    appointment_id: Optional[str] = None
    patient_name: Optional[str] = None
    created_at: str
    cancelled_at: Optional[str] = None


class QueueEntryOut(BaseModel):
    id: str
    appointment_id: str
    doctor_id: str
    doctor_name: Optional[str] = None
    patient_id: str
    patient_name: str
    patient_phone: str
    date: str
    token_number: int
    service_name: Optional[str] = None
    appointment_status: AppointmentStatus
    queue_status: QueueStatus
    check_in_time: Optional[str] = None
    called_time: Optional[str] = None
    consultation_start_time: Optional[str] = None
    consultation_end_time: Optional[str] = None


# ==============================================================================
# APPOINTMENT MODELS
# ==============================================================================

class BookingRequestCreate(BaseModel):
    doctor_id: str
    service_id: str
    appointment_date: str  # YYYY-MM-DD
    token_number: Optional[int] = None  # If specified or auto-allocated
    patient_id: Optional[str] = None  # Set by auth middleware or receptionist
    booking_source: BookingSource = BookingSource.PATIENT_PORTAL
    notes: Optional[str] = None


class BookingApprovalAction(BaseModel):
    action: str  # "approve" or "decline"
    reason: Optional[str] = None


class RescheduleRequest(BaseModel):
    new_doctor_id: Optional[str] = None
    new_service_id: Optional[str] = None
    new_appointment_date: str
    new_token_number: Optional[int] = None
    reason: Optional[str] = "Patient requested reschedule"


class AppointmentOut(BaseModel):
    id: str
    patient_id: str
    patient_name: str
    patient_phone: str
    doctor_id: str
    doctor_name: str
    doctor_specialization: Optional[str] = None
    service_id: str
    service_name: str
    appointment_date: str
    token_id: Optional[str] = None
    token_number: int
    status: AppointmentStatus
    queue_status: QueueStatus
    booking_source: BookingSource
    receptionist_notes: Optional[str] = None
    approved_by: Optional[str] = None
    created_at: str
    updated_at: str


# ==============================================================================
# CLINICAL RECORDS & PRESCRIPTION VERSIONING
# ==============================================================================

class PrescriptionItem(BaseModel):
    medication_name: str
    dosage: str  # e.g. "500mg"
    frequency: str  # e.g. "Twice daily"
    duration: str  # e.g. "5 days"
    instructions: Optional[str] = "Take after meals"


class PrescriptionCreate(BaseModel):
    items: List[PrescriptionItem]
    notes: Optional[str] = None


class PrescriptionVersionCorrection(BaseModel):
    items: List[PrescriptionItem]
    correction_reason: str
    notes: Optional[str] = None


class PrescriptionVersionOut(BaseModel):
    id: str
    prescription_id: str
    version_number: int
    items: List[PrescriptionItem]
    correction_reason: Optional[str] = None
    notes: Optional[str] = None
    doctor_id: str
    doctor_name: Optional[str] = None
    is_current: bool
    created_at: str


class PrescriptionOut(BaseModel):
    id: str
    visit_id: str
    patient_id: str
    doctor_id: str
    doctor_name: Optional[str] = None
    current_version: Optional[PrescriptionVersionOut] = None
    all_versions: List[PrescriptionVersionOut] = []
    created_at: str


class ClinicalRecordCreate(BaseModel):
    visit_id: Optional[str] = None
    appointment_id: str
    chief_complaint: str
    examination_findings: str
    diagnosis: str
    treatment_plan: str
    clinical_notes: Optional[str] = ""
    doctor_private_notes: Optional[str] = ""
    prescription: Optional[PrescriptionCreate] = None
    follow_up_days: Optional[int] = None
    follow_up_instructions: Optional[str] = None


class ClinicalRecordUpdate(BaseModel):
    chief_complaint: Optional[str] = None
    examination_findings: Optional[str] = None
    diagnosis: Optional[str] = None
    treatment_plan: Optional[str] = None
    clinical_notes: Optional[str] = None
    doctor_private_notes: Optional[str] = None
    edit_reason: str = "Clinical record update by attending physician"


class ClinicalRecordAuditOut(BaseModel):
    id: str
    clinical_record_id: str
    actor_id: str
    actor_name: Optional[str] = None
    actor_role: str
    field_name: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    reason: Optional[str] = None
    created_at: str


class ClinicalRecordOut(BaseModel):
    id: str
    visit_id: str
    appointment_id: str
    patient_id: str
    patient_name: str
    doctor_id: str
    doctor_name: str
    visit_date: str
    service_name: Optional[str] = None
    chief_complaint: str
    examination_findings: str
    diagnosis: str
    treatment_plan: str
    clinical_notes: Optional[str] = None
    doctor_private_notes: Optional[str] = None  # None if patient/receptionist viewing
    prescription: Optional[PrescriptionOut] = None
    follow_up: Optional[Dict[str, Any]] = None
    audit_trail: List[ClinicalRecordAuditOut] = []
    created_at: str
    updated_at: str


# ==============================================================================
# BILLING & NOTIFICATIONS
# ==============================================================================

class PaymentCreate(BaseModel):
    appointment_id: str
    total_amount: float
    amount_paid: float
    payment_method: str = "cash"  # cash, card, online
    notes: Optional[str] = None


class PaymentOut(BaseModel):
    id: str
    appointment_id: str
    patient_id: str
    patient_name: Optional[str] = None
    total_amount: float
    amount_paid: float
    amount_due: float
    payment_status: PaymentStatus
    payment_method: str
    created_at: str


class NotificationPreferenceUpdate(BaseModel):
    primary_channel: NotificationChannel
    backup_channel: Optional[NotificationChannel] = None


class NotificationLogOut(BaseModel):
    id: str
    patient_id: str
    patient_name: Optional[str] = None
    event_type: NotificationEvent
    channel_used: NotificationChannel
    status: str  # sent, failed, failover_sent
    failure_reason: Optional[str] = None
    payload: Dict[str, Any]
    created_at: str


# ==============================================================================
# AI AGENT MODELS
# ==============================================================================

class AIChatMessage(BaseModel):
    role: str  # "user", "assistant", "system", "tool"
    content: str
    tool_calls: Optional[List[Dict[str, Any]]] = None
    tool_call_id: Optional[str] = None
    name: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class AIChatInput(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    patient_id: Optional[str] = None
    confirmed_action_id: Optional[str] = None  # When user confirms a pending action


class AIChatResponse(BaseModel):
    response: str
    intent: str  # "rag_info", "tool_action", "safety_refusal", "confirmation_required"
    suggested_cards: Optional[List[Dict[str, Any]]] = None  # Doctor cards, Token cards, Confirmation cards
    action_required: Optional[Dict[str, Any]] = None  # Action needing explicit confirmation
    conversation_id: str
    created_at: str


# ==============================================================================
# AUDIT & REPORTING MODELS
# ==============================================================================

class AuditLogOut(BaseModel):
    id: str
    actor_id: str
    actor_name: Optional[str] = None
    actor_type: str
    action: str
    resource_type: str
    resource_id: str
    previous_state: Optional[Dict[str, Any]] = None
    new_state: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: str


class DashboardStatsOut(BaseModel):
    today_date: str
    total_appointments_today: int
    pending_approval_count: int
    waiting_queue_count: int
    in_consultation_count: int
    completed_today_count: int
    cancelled_today_count: int
    total_active_doctors: int
    total_patients_registered: int
    today_revenue: float
