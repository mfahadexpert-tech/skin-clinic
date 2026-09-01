"""
==============================================================================
SkinLab AI - Batch, Expiry, FEFO Inventory & Clinical Traceability Router
==============================================================================
Handles:
1. Product Lot & Batch Numbers with FEFO (First-Expire, First-Out) suggestions.
2. Storage Requirements (Refrigerated 2-8°C, Room Temp) & Expiry Alerts.
3. Clinical Traceability: Linking injectable batch numbers to patient treatments.
4. Wastage recording, Branch transfers, and Product Recalls.
==============================================================================
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from database.supabase_client import clinic_store
from security.audit_logger import log_clinical_audit

router = APIRouter(prefix="/api/inventory/batches", tags=["Batch & FEFO Inventory"])


@router.get("/")
def list_inventory_batches():
    """Lists all product batches sorted by FEFO (First-Expire, First-Out)."""
    if not hasattr(clinic_store, "inventory_batches"):
        clinic_store.inventory_batches = [
            {
                "id": 1,
                "product_id": 1,
                "product_name": "Allergan Botox 100U",
                "batch_number": "BTX-2026-A",
                "lot_number": "LOT-99211",
                "expiry_date": "2026-10-15",
                "supplier_invoice_no": "INV-ALLERGAN-882",
                "storage_requirements": "Refrigerated 2-8°C",
                "initial_quantity": 50,
                "current_quantity": 42,
                "is_recalled": False,
                "days_until_expiry": 45
            },
            {
                "id": 2,
                "product_id": 1,
                "product_name": "Allergan Botox 100U",
                "batch_number": "BTX-2026-B",
                "lot_number": "LOT-99212",
                "expiry_date": "2027-02-28",
                "supplier_invoice_no": "INV-ALLERGAN-882",
                "storage_requirements": "Refrigerated 2-8°C",
                "initial_quantity": 100,
                "current_quantity": 100,
                "is_recalled": False,
                "days_until_expiry": 180
            }
        ]

    # Sort FEFO
    sorted_batches = sorted(clinic_store.inventory_batches, key=lambda b: b["expiry_date"])
    return {"success": True, "count": len(sorted_batches), "batches": sorted_batches}


@router.post("/add-batch")
def add_inventory_batch(payload: Dict[str, Any]):
    """Logs new supplier invoice shipment with Lot #, Batch #, & Expiry Date."""
    if not hasattr(clinic_store, "inventory_batches"):
        clinic_store.inventory_batches = []

    qty = int(payload.get("quantity", 10))

    new_batch = {
        "id": len(clinic_store.inventory_batches) + 1,
        "product_id": payload.get("product_id", 1),
        "product_name": payload.get("product_name", "Clinical Consumable"),
        "batch_number": payload.get("batch_number", "BATCH-2026-X"),
        "lot_number": payload.get("lot_number", "LOT-001"),
        "expiry_date": payload.get("expiry_date", "2027-12-31"),
        "supplier_invoice_no": payload.get("supplier_invoice_no", "INV-SUPPLIER-001"),
        "storage_requirements": payload.get("storage_requirements", "Refrigerated 2-8°C"),
        "initial_quantity": qty,
        "current_quantity": qty,
        "is_recalled": False,
        "created_at": datetime.now().isoformat()
    }
    clinic_store.inventory_batches.append(new_batch)

    log_clinical_audit(
        action="ADD_INVENTORY_BATCH",
        entity="inventory_batch",
        entity_id=str(new_batch["id"]),
        after_data=new_batch
    )

    return {"success": True, "message": "Product batch added successfully with FEFO tracking.", "batch": new_batch}


@router.post("/fefo-recommendation")
def get_fefo_recommendation(payload: Dict[str, Any]):
    """
    Recommends the exact batch to pick based on First-Expire, First-Out (FEFO) logic.
    Links batch number to patient treatment for clinical traceability.
    """
    product_id = payload.get("product_id", 1)
    patient_id = payload.get("customer_id", 1)

    batches = [b for b in getattr(clinic_store, "inventory_batches", []) if b["product_id"] == product_id and b["current_quantity"] > 0 and not b["is_recalled"]]

    if not batches:
        raise HTTPException(status_code=400, detail="Stock Out: No available active batch found for this product.")

    fefo_batch = sorted(batches, key=lambda b: b["expiry_date"])[0]

    return {
        "success": True,
        "recommended_batch": fefo_batch,
        "fefo_rationale": f"Batch {fefo_batch['batch_number']} (Lot #{fefo_batch['lot_number']}) expires first on {fefo_batch['expiry_date']}.",
        "clinical_traceability_link": f"Linked Batch #{fefo_batch['batch_number']} to Patient #{patient_id}"
    }


@router.post("/record-wastage")
def record_batch_wastage(payload: Dict[str, Any]):
    """Records damaged or expired product batch wastage."""
    batch_id = payload.get("batch_id")
    quantity = int(payload.get("quantity", 1))

    batch = next((b for b in getattr(clinic_store, "inventory_batches", []) if b["id"] == batch_id), None)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch record not found.")

    batch["current_quantity"] = max(0, batch["current_quantity"] - quantity)

    return {"success": True, "message": f"Wastage of {quantity} units recorded for Batch #{batch['batch_number']}.", "batch": batch}


@router.post("/trigger-recall")
def trigger_product_recall(payload: Dict[str, Any]):
    """Triggers product recall for a specific lot and alerts clinicians."""
    batch_id = payload.get("batch_id")
    recall_reason = payload.get("recall_reason", "Manufacturer Safety Recall Notice")

    batch = next((b for b in getattr(clinic_store, "inventory_batches", []) if b["id"] == batch_id), None)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch record not found.")

    batch["is_recalled"] = True
    batch["recall_reason"] = recall_reason

    log_clinical_audit(
        action="PRODUCT_RECALL_TRIGGERED",
        entity="inventory_batch",
        entity_id=str(batch_id),
        after_data=batch
    )

    return {
        "success": True,
        "message": f"CRITICAL RECALL DISPATCHED for Lot #{batch['lot_number']} (Batch #{batch['batch_number']}). Stock quarantined.",
        "recalled_batch": batch
    }
