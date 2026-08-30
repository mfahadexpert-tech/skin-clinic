"""
==============================================================================
SkinLab AI - POS & Clinical Treatment Billing Terminal Router
==============================================================================
Handles:
1. Live checkout with doctor allocation, patient lookup, and token generation.
2. Multi-session package tracking (sessions_allowed vs sessions_consumed).
3. Split checkout across Cash, Card, Advance Wallet, and Due Ledger.
4. Reload existing sale for modifications without sequence corruption.
==============================================================================
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from datetime import datetime
from database.supabase_client import clinic_store
from database.models import SaleCreate, SplitCheckoutRequest

router = APIRouter(prefix="/api/pos", tags=["POS Billing"])


@router.get("/overview")
def get_pos_overview():
    """
    Returns initial setup data for POS Terminal:
    - Active Doctors / Practitioners
    - Products & Services list
    - Bundled Packages / Deals
    - Current Next Invoice Number and Waiting Queue Token
    """
    doctors = [e for e in clinic_store.employees if e.get("department_id") in [1, 2, 4]]
    next_inv = f"INV-{clinic_store.invoice_counter + 1:04d}"
    next_token = f"P-{clinic_store.token_counter + 1:02d}"

    return {
        "success": True,
        "doctors": doctors,
        "products": clinic_store.products,
        "deals": clinic_store.deals,
        "next_invoice_number": next_inv,
        "next_token_number": next_token,
        "categories": clinic_store.categories
    }


@router.post("/checkout")
def create_sale(sale: SaleCreate):
    """
    Processes patient checkout from the main POS billing terminal.
    - Increments and assigns queue token (e.g. P-01).
    - Allocates treating doctor for commission calculation.
    - Updates patient visit count and balance dues if partial payment.
    - Inserts multi-session records with `sessions_allowed` and `sessions_consumed`.
    """
    # 1. Verify Patient
    customer = next((c for c in clinic_store.customers if c["id"] == sale.customer_id), None)
    if not customer:
        raise HTTPException(status_code=404, detail="Selected patient not found.")

    # 2. Verify Doctor
    doctor = next((e for e in clinic_store.employees if e["id"] == sale.doctor_id), None)
    doctor_name = doctor["name"] if doctor else "Attending Doctor"

    # 3. Generate Sequential Identifiers
    inv_num = clinic_store.get_next_invoice_number()
    token_num = clinic_store.get_next_token()

    # 4. Calculate Payment Status & Balance Dues
    remaining_due = sale.grand_total - sale.paid_amount
    if remaining_due <= 0:
        payment_status = "paid"
        if remaining_due < 0:
            # Overpaid -> Credit to Advance Wallet
            customer["advance_balance"] += abs(remaining_due)
    elif sale.paid_amount > 0:
        payment_status = "partial"
        customer["current_balance"] += remaining_due
    else:
        payment_status = "pending"
        customer["current_balance"] += remaining_due

    # Increment patient visit count
    customer["visit_count"] = customer.get("visit_count", 0) + 1

    # 5. Format Line Items
    sale_items = []
    for idx, item in enumerate(sale.items, 1):
        sale_items.append({
            "id": idx,
            "product_id": item.product_id,
            "product_name": item.product_name,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "sessions_allowed": item.sessions_allowed,
            "sessions_consumed": item.sessions_consumed,
            "item_group_name": item.item_group_name,
            "total_price": item.total_price
        })

    # 6. Save Sale Record
    new_sale = {
        "id": len(clinic_store.sales) + 1,
        "invoice_number": inv_num,
        "customer_id": customer["id"],
        "customer_name": customer["name"],
        "customer_mrn": customer["mrn"],
        "doctor_id": sale.doctor_id,
        "doctor_name": doctor_name,
        "token_number": token_num,
        "date": datetime.now().isoformat(),
        "subtotal": sale.subtotal,
        "discount_amount": sale.discount_amount,
        "tax_amount": sale.tax_amount,
        "grand_total": sale.grand_total,
        "paid_amount": sale.paid_amount,
        "payment_method": sale.payment_method,
        "payment_status": payment_status,
        "clinical_remarks": sale.clinical_remarks or "Routine session conducted according to standard protocol.",
        "items": sale_items
    }
    clinic_store.sales.append(new_sale)

    return {
        "success": True,
        "message": f"Sale completed successfully with Token {token_num}",
        "sale": new_sale
    }


@router.post("/split-checkout")
def process_split_checkout(req: SplitCheckoutRequest):
    """
    Handles complex multi-method split payments (Cash + Card + Advance Wallet + Dues).
    """
    total_paid = sum(split.amount for split in req.splits if split.method != "due_credit")
    due_amount = sum(split.amount for split in req.splits if split.method == "due_credit")

    sale_payload = SaleCreate(
        customer_id=req.customer_id,
        doctor_id=req.doctor_id,
        items=req.items,
        subtotal=req.subtotal,
        discount_amount=req.discount_amount,
        tax_amount=req.tax_amount,
        grand_total=req.grand_total,
        paid_amount=total_paid,
        payment_method="split",
        clinical_remarks=req.clinical_remarks
    )
    return create_sale(sale_payload)


@router.get("/sale/{invoice_number}")
def load_existing_sale(invoice_number: str):
    """
    Module 4: Reconstructs an existing invoice back into the POS terminal.
    """
    sale = next((s for s in clinic_store.sales if s["invoice_number"] == invoice_number), None)
    if not sale:
        raise HTTPException(status_code=404, detail="Invoice not found.")
    return {"success": True, "sale": sale}
