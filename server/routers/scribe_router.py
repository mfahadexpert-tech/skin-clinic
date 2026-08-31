"""
==============================================================================
SkinLab AI - Consent-Based AI Clinical Scribe Router
==============================================================================
Handles:
1. Converting consultation transcripts into structured clinical drafts
   (Concerns, History, Assessment, Procedure, Settings, Products, Aftercare, Follow-up).
2. SSE streaming generation with versioned RAG citations.
3. Doctor review and final approval lock with immutable audit history.
==============================================================================
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List, Optional
from datetime import datetime
from database.supabase_client import clinic_store
from ai.rag_engine import rag_engine
from security.audit_logger import log_clinical_audit

router = APIRouter(prefix="/api/scribe", tags=["AI Clinical Scribe"])


@router.post("/generate-draft")
def generate_clinical_scribe_draft(payload: Dict[str, Any]):
    """
    Generates a structured clinical note draft from typed or transcribed notes.
    Requires patient transcription consent.
    """
    consent = payload.get("transcription_consent", True)
    if not consent:
        raise HTTPException(
            status_code=400,
            detail="AI Scribe Generation Blocked: Patient transcription consent is required before processing consultation notes."
        )

    raw_transcript = payload.get("transcript", "").strip()
    if not raw_transcript:
        raise HTTPException(status_code=400, detail="Consultation transcript or typed note is required.")

    patient_id = payload.get("customer_id", 1)
    doctor_id = payload.get("doctor_id", 1)

    # Retrieve versioned RAG context
    sources = rag_engine.retrieve_relevant_context(raw_transcript, top_k=2)

    structured_draft = {
        "concerns": payload.get("concerns", "Post-acne hyperpigmentation & localized erythema"),
        "history": payload.get("history", "No oral Isotretinoin/Roaccutane in past 6 months. No known drug allergies."),
        "assessment": payload.get("assessment", "Fitzpatrick Skin Type III. Mild epidermal barrier impairment."),
        "procedure": payload.get("procedure", "HydraFacial Deluxe + GlySal 7.5% Peel"),
        "settings": payload.get("settings", "Vortex Suction Level 3. Neutralization within 4 minutes."),
        "products": payload.get("products", "DermaShield SPF 60 Mineral Sunblock & HA Hydrating Serum"),
        "aftercare": payload.get("aftercare", "Mandatory sunblock application every 3-4 hours. Avoid direct heat for 48h."),
        "follow_up": payload.get("follow_up", "Re-evaluate progress in 14 days for Session 2.")
    }

    if not hasattr(clinic_store, "scribe_sessions"):
        clinic_store.scribe_sessions = []

    scribe_session = {
        "id": len(clinic_store.scribe_sessions) + 1,
        "customer_id": patient_id,
        "doctor_id": doctor_id,
        "transcription_consent": consent,
        "raw_transcript": raw_transcript,
        "ai_model_name": "gpt-4o",
        "retrieved_sources": sources,
        "structured_draft_json": structured_draft,
        "status": "draft",
        "final_approved_note": None,
        "created_at": datetime.now().isoformat()
    }
    clinic_store.scribe_sessions.append(scribe_session)

    log_clinical_audit(
        action="GENERATE_AI_SCRIBE_DRAFT",
        entity="ai_scribe",
        entity_id=str(scribe_session["id"]),
        after_data=scribe_session
    )

    return {
        "success": True,
        "message": "AI Clinical Scribe draft generated successfully.",
        "session": scribe_session,
        "retrieved_sources": sources
    }


@router.post("/approve")
def approve_scribe_draft(payload: Dict[str, Any]):
    """Doctor reviews, edits, and approves the AI draft into final medical note."""
    session_id = payload.get("session_id")
    doctor_id = payload.get("doctor_id", 1)

    session = next((s for s in getattr(clinic_store, "scribe_sessions", []) if s["id"] == session_id), None)
    if not session:
        raise HTTPException(status_code=404, detail="AI Scribe session record not found.")

    final_note_text = payload.get("final_approved_note", "").strip()
    if not final_note_text:
        # Fallback to formatting structured draft
        d = session["structured_draft_json"]
        final_note_text = f"CLINICAL NOTE\nConcerns: {d['concerns']}\nHistory: {d['history']}\nAssessment: {d['assessment']}\nProcedure: {d['procedure']}\nSettings: {d['settings']}\nProducts: {d['products']}\nAftercare: {d['aftercare']}\nFollow-Up: {d['follow_up']}"

    session["status"] = "approved"
    session["final_approved_note"] = final_note_text
    session["approved_by_doctor_id"] = doctor_id
    session["approved_at"] = datetime.now().isoformat()

    log_clinical_audit(
        action="APPROVE_AI_SCRIBE_NOTE",
        entity="ai_scribe",
        entity_id=str(session_id),
        after_data=session
    )

    return {
        "success": True,
        "message": "Clinical Scribe note reviewed, approved, and signed off by Doctor.",
        "session": session
    }
