"""
==============================================================================
SkinLab AI - SRM Purchases & Treatment Cancellation / Refund Router
==============================================================================
Handles:
1. Medical suppliers directory (HydraFacial serums, peels, disposables).
2. Purchase Orders with AVCO (Average Weighted Cost) inventory adjustments.
3. Treatment cancellation & session-level refund management.
==============================================================================
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from datetime import datetime
from database.supabase_client import clinic_store

router = APIRouter(prefix="/api/purchases", tags=["SRM Purchases & Refunds"])


@router.get("/suppliers")
def list_suppliers():
    """Returns suppliers and purchase inward orders."""
    return {
        "success": True,
        "suppliers": clinic_store.suppliers,
        "purchases": clinic_store.purchases
    }


@router.post("/refund")
def process_service_refund(refund_data: Dict[str, Any]):
    """
    Module 8: Treatment Cancellation & Refund Dialog.
    Refunds unused sessions of a package if a patient discontinues treatment.
    """
    sale_id = refund_data.get("sale_id")
    refund_amount = float(refund_data.get("refund_amount", 0.0))
    reason = refund_data.get("reason", "Patient relocation / Adverse skin sensitivity")

    sale = next((s for s in clinic_store.sales if s["id"] == sale_id), None)
    if not sale:
        raise HTTPException(status_code=404, detail="Sale record not found.")

    sale["is_refunded"] = True
    sale["clinical_remarks"] = f"{sale.get('clinical_remarks', '')}\n[REFUND ISSUED] PKR {refund_amount:,.2f} refunded. Reason: {reason}"

    # Credit patient ledger
    customer = next((c for c in clinic_store.customers if c["id"] == sale["customer_id"]), None)
    if customer:
        customer["current_balance"] = max(0.0, customer["current_balance"] - refund_amount)

    return {
        "success": True,
        "message": f"Refund of PKR {refund_amount:,.2f} processed successfully.",
        "sale": sale
    }
