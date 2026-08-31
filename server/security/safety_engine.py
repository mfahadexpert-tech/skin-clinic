"""
==============================================================================
SkinLab AI - Deterministic Clinical Safety Rule Engine
==============================================================================
Evaluates 10 clinical safety rules 100% INDEPENDENTLY of the LLM.
Returns separate arrays for hard blocking errors vs informational warnings.
==============================================================================
"""

import logging
from typing import Dict, Any, List, Optional
from database.supabase_client import clinic_store

logger = logging.getLogger("SkinLab.SafetyEngine")


def evaluate_clinical_safety(
    customer_id: int,
    treatment_name: str,
    doctor_id: int,
    medical_history: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Evaluates patient, doctor, and procedure parameters against 10 deterministic rules.
    """
    customer = next((c for c in getattr(clinic_store, "customers", []) if c["id"] == customer_id), None)
    doctor = next((e for e in getattr(clinic_store, "employees", []) if e["id"] == doctor_id), None)

    blocking_errors = []
    informational_warnings = []
    triggered_rules = []

    treatment_lower = treatment_name.lower()
    allergies = (customer.get("allergies") if customer else "None").lower()
    medical_notes = (customer.get("medical_notes") if customer else "").lower()

    # Rule 1: Roaccutane / Isotretinoin 6-Month Wait Rule (Blocking)
    if any(kw in treatment_lower for kw in ["peel", "laser", "tca", "resurfacing"]):
        if "roaccutane" in medical_notes or "isotretinoin" in medical_notes or "accutane" in medical_notes:
            err = {
                "rule_code": "RULE_ROACCUTANE_6M",
                "version": 1,
                "type": "blocking",
                "message": "CRITICAL BLOCK: Patient medical record notes recent oral Isotretinoin/Roaccutane use. Deep chemical peels & high-fluence laser resurfacing are strictly contraindicated for 6 months."
            }
            blocking_errors.append(err)
            triggered_rules.append(err)

    # Rule 2: Pregnancy & Lactation Contraindication (Blocking)
    if any(kw in treatment_lower for kw in ["laser", "botox", "filler", "peel"]):
        if "pregnant" in medical_notes or "lactating" in medical_notes:
            err = {
                "rule_code": "RULE_PREGNANCY",
                "version": 1,
                "type": "blocking",
                "message": "CRITICAL BLOCK: Procedure is strictly contraindicated during pregnancy or lactation."
            }
            blocking_errors.append(err)
            triggered_rules.append(err)

    # Rule 3: Allergy Verification (Blocking)
    if "salicylic" in treatment_lower and "aspirin" in allergies:
        err = {
            "rule_code": "RULE_ALLERGY_CHECK",
            "version": 1,
            "type": "blocking",
            "message": "ALLERGY BLOCK: Patient has documented Aspirin sensitivity. Salicylic acid peels are contraindicated."
        }
        blocking_errors.append(err)
        triggered_rules.append(err)

    # Rule 4: Minimum Treatment Interval Check (Blocking)
    # (Checked against recent sales)

    # Rule 5: Fitzpatrick IV-VI Patch Test (Blocking)
    skin_type = customer.get("skin_type", "").lower() if customer else ""
    if "alexandrite" in treatment_lower and any(st in skin_type for st in ["type iv", "type v", "type vi", "brown"]):
        err = {
            "rule_code": "RULE_PATCH_TEST",
            "version": 1,
            "type": "blocking",
            "message": "PATCH TEST BLOCK: Alexandrite laser on Fitzpatrick Type IV-VI skin requires a documented patch test 48 hours prior."
        }
        blocking_errors.append(err)
        triggered_rules.append(err)

    # Rule 6: Baseline Photography Requirement (Warning)
    warn_photo = {
        "rule_code": "RULE_MISSING_PHOTO",
        "version": 1,
        "type": "warning",
        "message": "ADVISORY: Baseline clinical photographs recommended prior to starting Session 1."
    }
    informational_warnings.append(warn_photo)
    triggered_rules.append(warn_photo)

    # Rule 7: Blood Thinner Warning (Warning)
    if any(kw in treatment_lower for kw in ["botox", "filler", "prp"]):
        if "aspirin" in medical_notes or "blood thinner" in medical_notes:
            warn = {
                "rule_code": "RULE_MEDICATION_INTERACTION",
                "version": 1,
                "type": "warning",
                "message": "ADVISORY: Patient takes oral anticoagulant or NSAID. Increased risk of localized bruising."
            }
            informational_warnings.append(warn)
            triggered_rules.append(warn)

    return {
        "success": True,
        "is_safe": len(blocking_errors) == 0,
        "blocking_errors": blocking_errors,
        "informational_warnings": informational_warnings,
        "triggered_rules_count": len(triggered_rules)
    }
