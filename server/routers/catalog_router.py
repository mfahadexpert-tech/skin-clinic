"""
==============================================================================
SkinLab AI - Services Catalog, Deals Master & Barcode Router
==============================================================================
Handles:
1. Skincare treatments & clinical procedures master (Create & List).
2. Registering new services (Full Body Laser, Skin Whitening, PRP, Botox, Peels).
3. Bundled deals & package configurations.
4. Barcode thermal label generation (Code-128 / EAN-13).
==============================================================================
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from database.supabase_client import clinic_store

router = APIRouter(prefix="/api/catalog", tags=["Catalog & Barcodes"])


@router.get("/services")
def list_services():
    """Lists all treatments, procedures, and retail products grouped by category."""
    return {
        "success": True,
        "categories": clinic_store.categories,
        "products": clinic_store.products,
        "deals": clinic_store.deals
    }


@router.post("/services/create")
def create_service(payload: Dict[str, Any]):
    """
    Creates a new clinical service or procedure (e.g. Skin Whitening, Full Body Laser).
    """
    name = payload.get("name", "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Service name is required.")

    selling_price = float(payload.get("selling_price", 5000.0))
    is_service = payload.get("is_service", True)
    sku = payload.get("sku", f"SRV-{len(clinic_store.products) + 1:03d}")

    new_prod = {
        "id": len(clinic_store.products) + 1,
        "name": name,
        "sku": sku,
        "barcode": f"89012345000{len(clinic_store.products) + 1}",
        "category_id": payload.get("category_id", 1),
        "cost_price": float(payload.get("cost_price", selling_price * 0.4)),
        "selling_price": selling_price,
        "tax_rate": 0.0,
        "is_service": is_service,
        "sessions_default": int(payload.get("sessions_default", 1)),
        "stock_qty": 999 if is_service else int(payload.get("stock_qty", 50)),
        "is_active": True
    }
    clinic_store.products.append(new_prod)

    return {
        "success": True,
        "message": "Service created successfully",
        "product": new_prod,
        "products": clinic_store.products
    }


@router.post("/deals/create")
def create_bundled_deal(deal_data: Dict[str, Any]):
    """
    Creates a new bundled package with multi-session allowances.
    """
    new_deal = {
        "id": len(clinic_store.deals) + 1,
        "name": deal_data.get("name", "Custom Clinic Package"),
        "sku": deal_data.get("sku", f"DEAL-{len(clinic_store.deals) + 1:02d}"),
        "description": deal_data.get("description", ""),
        "discounted_price": float(deal_data.get("discounted_price", 0.0)),
        "is_active": True,
        "items": deal_data.get("items", [])
    }
    clinic_store.deals.append(new_deal)
    return {"success": True, "message": "Bundled package created successfully", "deal": new_deal}


@router.get("/barcode/{product_id}")
def generate_barcode_label(product_id: int):
    """
    Returns thermal label configuration for a product or service.
    """
    prod = next((p for p in clinic_store.products if p["id"] == product_id), None)
    if not prod:
        raise HTTPException(status_code=404, detail="Product or Service not found.")

    return {
        "success": True,
        "label": {
            "clinic_name": clinic_store.settings.get("company_name", "Skin Lab Clinic"),
            "product_name": prod["name"],
            "sku": prod["sku"],
            "barcode": prod.get("barcode", f"89012345000{prod['id']}"),
            "barcode_type": "Code-128",
            "price_formatted": f"PKR {prod['selling_price']:,.2f}",
            "is_service": prod.get("is_service", True)
        }
    }
