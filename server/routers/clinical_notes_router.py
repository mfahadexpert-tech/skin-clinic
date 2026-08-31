"""
==============================================================================
SkinLab AI - Structured Clinical Notes Router
==============================================================================
Handles procedure-specific structured notes for:
1. Laser Hair Reduction (Fluence, Wavelength, Pulse, Spot Size)
2. Chemical Peel (Type, Concentration, Neutralization Time, Erythema)
3. HydraFacial (Vortex Tip, GlySal %, Infusion Serum)
4. Botox (Units, Reconstitution Saline, Injection Sites, Lot #)
5. Dermal Filler (Volume, Depth, Lot #, Vascular Check)
6. PRP Facial (Blood Drawn, Centrifuge RPM, Yield)
7. Microneedling (DermaPen Depth, Pass Count, Active Serum)
8. IV Therapy (Glutathione Dose, Vitamin C, Saline Volume)

Supports: Drafts, Doctor Approvals, Amendments, and Revision History.
==============================================================================
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List, Optional
from datetime import datetime
from database.supabase_client import clinic_store

router = APIRouter(prefix="/api/notes", tags=["Clinical Notes"])


@router.get("/templates")
def list_note_templates():
    """Returns structured parameter schemas for 8 procedure types."""
    templates = [
        {"procedure_type": "laser_hair_reduction", "name": "Laser Hair Reduction", "params": ["fluence_j_cm2", "wavelength_nm", "pulse_duration_ms", "spot_size_mm", "treated_areas", "skin_reaction", "aftercare_advised"]},
        {"procedure_type": "chemical_peel", "name": "Chemical Peel", "params": ["peel_type", "concentration_percent", "neutralization_time_min", "erythema_grade", "spf_mandate"]},
        {"procedure_type": "hydrafacial", "name": "HydraFacial Deluxe", "params": ["vortex_tip", "glysal_percent", "serum_infusion", "suction_level", "booster"]},
        {"procedure_type": "botox", "name": "Botox Injectable", "params": ["units_administered", "reconstitution_saline_ml", "batch_lot_number", "injection_sites", "aspiration_verified"]},
        {"procedure_type": "dermal_filler", "name": "Dermal Filler", "params": ["volume_ml", "filler_brand", "batch_lot_number", "injection_depth", "vascular_check"]},
        {"procedure_type": "prp", "name": "PRP Vampire Facial", "params": ["blood_drawn_ml", "centrifuge_rpm", "centrifuge_time_min", "plasma_yield_ml"]},
        {"procedure_type": "microneedling", "name": "Microneedling DermaPen", "params": ["needle_depth_mm", "pass_count", "active_serum", "erythema_score"]},
        {"procedure_type": "iv_therapy", "name": "Glutathione IV Therapy", "params": ["glutathione_dose_mg", "vitamin_c_dose_mg", "saline_volume_ml", "drip_rate_drops_min"]}
    ]
    return {"success": True, "templates": templates}


@router.post("/save-draft")
def save_draft_note(payload: Dict[str, Any]):
    """Saves a draft clinical note."""
    if not hasattr(clinic_store, "clinical_notes"):
        clinic_store.clinical_notes = []

    note = {
        "id": len(clinic_store.clinical_notes) + 1,
        "customer_id": payload.get("customer_id", 1),
        "doctor_id": payload.get("doctor_id", 1),
        "procedure_type": payload.get("procedure_type", "laser_hair_reduction"),
        "parameters_json": payload.get("parameters_json", {}),
        "status": "draft",
        "is_approved": False,
        "created_at": datetime.now().isoformat(),
        "revisions": []
    }
    clinic_store.clinical_notes.append(note)

    return {"success": True, "message": "Draft clinical note saved successfully.", "note": note}


@router.post("/approve")
def approve_clinical_note(payload: Dict[str, Any]):
    """Doctor sign-off and locks the note."""
    note_id = payload.get("note_id")
    doctor_id = payload.get("doctor_id", 1)

    note = next((n for n in getattr(clinic_store, "clinical_notes", []) if n["id"] == note_id), None)
    if not note:
        raise HTTPException(status_code=404, detail="Clinical note record not found.")

    note["status"] = "approved"
    note["is_approved"] = True
    note["approved_by_doctor_id"] = doctor_id
    note["approved_at"] = datetime.now().isoformat()

    return {"success": True, "message": "Clinical note approved and signed off by Doctor.", "note": note}


@router.post("/amend")
def amend_clinical_note(payload: Dict[str, Any]):
    """Amends an approved note and records revision history."""
    note_id = payload.get("note_id")
    amendment_reason = payload.get("amendment_reason", "").strip()

    if not amendment_reason:
        raise HTTPException(status_code=400, detail="Amendment reason is mandatory for clinical note modifications.")

    note = next((n for n in getattr(clinic_store, "clinical_notes", []) if n["id"] == note_id), None)
    if not note:
        raise HTTPException(status_code=404, detail="Clinical note record not found.")

    # Record snapshot in revision history
    rev_number = len(note.get("revisions", [])) + 1
    revision_entry = {
        "revision_number": rev_number,
        "parameters_snapshot": dict(note["parameters_json"]),
        "amendment_reason": amendment_reason,
        "modified_at": datetime.now().isoformat()
    }

    if "revisions" not in note:
        note["revisions"] = []
    note["revisions"].append(revision_entry)

    # Update parameters
    note["parameters_json"] = payload.get("updated_parameters_json", note["parameters_json"])
    note["status"] = "amended"
    note["updated_at"] = datetime.now().isoformat()

    return {
        "success": True,
        "message": f"Clinical note amended. Revision #{rev_number} archived in history.",
        "note": note,
        "revision": revision_entry
    }
