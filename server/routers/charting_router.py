"""
==============================================================================
SkinLab AI - Interactive Clinical Face & Body Charting Router
==============================================================================
Handles:
1. Anatomical region mapping (Face, Body, Scalp).
2. Marker placement: Injection Points (Botox Units / Filler Quantity),
   Pigmentation, Scars, Acne, and Laser Treatment Zones.
3. Historical treatment map comparisons & clean clinical export.
==============================================================================
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List, Optional
from datetime import datetime
from database.supabase_client import clinic_store

router = APIRouter(prefix="/api/charting", tags=["Face & Body Charting"])


@router.get("/patient/{patient_id}")
def get_patient_charts(patient_id: int):
    """Returns all historical face and body treatment maps for a patient."""
    if not hasattr(clinic_store, "clinical_charts"):
        clinic_store.clinical_charts = [
            {
                "id": 1,
                "customer_id": patient_id,
                "chart_type": "face",
                "markers_json": [
                    {"x": 150, "y": 120, "marker_type": "botox", "units": 10, "area_label": "Forehead Lines"},
                    {"x": 220, "y": 250, "marker_type": "laser", "units": 0, "area_label": "Cheek Carbon Peel"}
                ],
                "summary_notes": "Standard Botox 10 Units forehead & Carbon Peel cheek zone.",
                "created_at": datetime.now().isoformat()
            }
        ]

    charts = [c for c in clinic_store.clinical_charts if c["customer_id"] == patient_id]
    return {"success": True, "count": len(charts), "charts": charts}


@router.post("/save")
def save_clinical_chart(payload: Dict[str, Any]):
    """Saves structured JSON anatomical map markers for a treatment session."""
    if not hasattr(clinic_store, "clinical_charts"):
        clinic_store.clinical_charts = []

    new_chart = {
        "id": len(clinic_store.clinical_charts) + 1,
        "customer_id": payload.get("customer_id", 1),
        "appointment_id": payload.get("appointment_id"),
        "chart_type": payload.get("chart_type", "face"),
        "markers_json": payload.get("markers_json", []),
        "summary_notes": payload.get("summary_notes", "Anatomical mapping saved."),
        "created_by_doctor_id": payload.get("doctor_id", 1),
        "created_at": datetime.now().isoformat()
    }
    clinic_store.clinical_charts.append(new_chart)

    return {
        "success": True,
        "message": "Anatomical treatment map saved successfully.",
        "chart": new_chart
    }


@router.get("/export/{chart_id}")
def export_clinical_chart_record(chart_id: int):
    """Exports a clean clinical record summary of an anatomical chart."""
    chart = next((c for c in getattr(clinic_store, "clinical_charts", []) if c["id"] == chart_id), None)
    if not chart:
        raise HTTPException(status_code=404, detail="Clinical chart record not found.")

    return {
        "success": True,
        "clinical_record": {
            "chart_id": chart["id"],
            "patient_id": chart["customer_id"],
            "chart_type": chart["chart_type"].upper(),
            "total_markers": len(chart["markers_json"]),
            "markers": chart["markers_json"],
            "notes": chart["summary_notes"],
            "timestamp": chart["created_at"]
        }
    }
