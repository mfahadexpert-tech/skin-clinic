"""
==============================================================================
SkinLab AI - Services Catalog, Deals Master & Barcode Router
==============================================================================
Handles:
1. Skincare treatments & clinical procedures master.
2. Bundled deals & package configurations (e.g. Bridal Glow, 6S Laser).
3. Retail skincare inventory stock levels & alerts.
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


@router.post("/deals/create")
def create_bundled_deal(deal_data: Dict[str, Any]):
    """
    Creates a new bundled package with multi-session allowances
    (e.g., 'HydraFacial 4-Session Glow Deal').
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
    Module 9: Returns thermal label configuration for a product or service.
    Outputs: Product Name, Service Code / SKU, Price (PKR), Clinic Branding, Barcode text.
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
