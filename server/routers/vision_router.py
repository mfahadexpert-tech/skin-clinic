"""
==============================================================================
SkinLab AI - Vision Multimodal Image Selection & Analysis Router
==============================================================================
Handles:
1. Uploading clinical photographs & lab report scans.
2. Extracting dermatological classifications, acne grading, lab values & contraindications.
==============================================================================
"""

from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from typing import Dict, Any, Optional
import base64
from ai.vision_engine import vision_engine
from security.audit_logger import log_clinical_audit

router = APIRouter(prefix="/api/ai/vision", tags=["Vision AI Assistant"])


@router.post("/analyze")
async def analyze_clinical_image(
    patient_id: int = Form(1),
    prompt_hint: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    """
    Multimodal Vision AI endpoint: Extracts information from selected clinical images
    and generates protocol recommendations.
    """
    image_base64 = ""
    if file:
        contents = await file.read()
        image_base64 = base64.b64encode(contents).decode("utf-8")

    result = vision_engine.analyze_clinical_image(
        image_base64=image_base64,
        patient_id=patient_id,
        prompt_hint=prompt_hint
    )

    log_clinical_audit(
        action="VISION_IMAGE_ANALYSIS",
        entity="patient_photo",
        entity_id=str(patient_id),
        after_data={"model": result["model"], "prompt": prompt_hint}
    )

    return result
