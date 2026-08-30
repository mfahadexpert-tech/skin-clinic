"""
==============================================================================
SkinLab AI - Pydantic Data Models & Schema Contracts
==============================================================================
Defines request and response schemas for all 12 clinic modules, POS billing,
PRM session redemption, AI Doctor dialogues, and settings.
==============================================================================
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


# ==========================================
# 1. Patient / Customer (PRM) Models
# ==========================================
class CustomerCreate(BaseModel):
    """Schema for registering a new walk-in patient from POS or PRM."""
    name: str = Field(..., description="Full name of the patient")
    phone: str = Field(..., description="Contact phone number")
    email: Optional[str] = Field(None, description="Patient email address")
    address: Optional[str] = Field(None, description="Residential address")
    skin_type: Optional[str] = Field("Fitzpatrick Type III", description="Skin classification")
    allergies: Optional[str] = Field(None, description="Any documented allergies or sensitivities")
    medical_notes: Optional[str] = Field(None, description="Clinical baseline notes")


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    skin_type: Optional[str] = None
    allergies: Optional[str] = None
    medical_notes: Optional[str] = None
    advance_balance: Optional[float] = None
    current_balance: Optional[float] = None


# ==========================================
# 2. POS Billing & Cart Line Item Models
# ==========================================
class CartItem(BaseModel):
    """Individual line item inside POS billing terminal cart."""
    product_id: int
    product_name: str
    quantity: float = 1.0
    unit_price: float
    sessions_allowed: int = 1       # Total sessions included in this procedure/deal
    sessions_consumed: int = 1      # Sessions performed in today's visit (defaults to 1)
    item_group_name: Optional[str] = None
    total_price: float


class SaleCreate(BaseModel):
    """Payload for completing a sale / checkout at the reception desk."""
    customer_id: int
    doctor_id: int
    items: List[CartItem]
    subtotal: float
    discount_amount: float = 0.0
    tax_amount: float = 0.0
    grand_total: float
    paid_amount: float
    payment_method: str = "cash"    # 'cash', 'card', 'split', 'wallet'
    clinical_remarks: Optional[str] = Field(None, description="Laser fluence, spot size, procedure remarks")


class SplitPaymentItem(BaseModel):
    method: str  # 'cash', 'card', 'advance_wallet', 'due_credit'
    amount: float


class SplitCheckoutRequest(BaseModel):
    sale_id: Optional[int] = None
    customer_id: int
    doctor_id: int
    items: List[CartItem]
    subtotal: float
    discount_amount: float = 0.0
    tax_amount: float = 0.0
    grand_total: float
    splits: List[SplitPaymentItem]
    clinical_remarks: Optional[str] = None


# ==========================================
# 3. PRM Multi-Session Redemption Models
# ==========================================
class SessionRedeemRequest(BaseModel):
    """Payload for incrementing session consumption on an active package."""
    sale_id: int
    item_id: int
    sessions_to_consume: int = 1    # 'Session Now' counter
    payment_amount: float = 0.0     # Optional due payment collection
    payment_method: str = "cash"
    session_notes: Optional[str] = None


# ==========================================
# 4. Custom On-the-Fly Package Builder
# ==========================================
class CustomPackageItem(BaseModel):
    product_id: int
    sessions: int = 1
    price_override: Optional[float] = None


class CustomPackageCreate(BaseModel):
    package_name: str
    items: List[CustomPackageItem]
    total_package_price: float


# ==========================================
# 5. LangChain / LangGraph AI Assistant Models
# ==========================================
class AIChatRequest(BaseModel):
    """Query sent to the GPT-powered Doctor Assistant."""
    query: str
    patient_id: Optional[int] = None
    doctor_id: Optional[int] = None
    language: str = "auto"          # 'en', 'roman_urdu', 'auto'
    context_type: str = "clinical"  # 'clinical', 'protocol', 'session_notes', 'contraindications'


class AIVoiceBookingRequest(BaseModel):
    """Simulated voice transcript from caller for AI phone booking."""
    caller_phone: str
    caller_name: Optional[str] = None
    speech_transcript: str
    preferred_time: Optional[str] = None
    service_inquiry: Optional[str] = None


class WhatsAppReminderRequest(BaseModel):
    """Trigger payload for multi-channel WhatsApp notifications."""
    customer_id: int
    template_type: str              # 'confirmation', '24h_reminder', 'post_care_laser', 'post_care_facial'
    custom_message: Optional[str] = None
