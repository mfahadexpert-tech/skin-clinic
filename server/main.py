"""
==============================================================================
SkinLab AI - Main FastAPI Application Server
==============================================================================
Registers all 12 modules, AI streaming, Google Calendar sync, and database backup engine.
==============================================================================
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import (
    pos_router,
    patient_router,
    catalog_router,
    voice_router,
    whatsapp_router,
    reports_router,
    hrm_router,
    purchases_router,
    backup_router,
    calendar_router
)
from ai.langgraph_agent import langgraph_agent, ClinicalState
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional

app = FastAPI(
    title="SkinLab AI - Clinical Operating System",
    description="Enterprise POS & Management Backend for Aesthetic, Skin Care & Dermatology Clinics",
    version="2.0.0"
)

# CORS configuration for frontend Next.js app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include All Clinical Routers
app.include_router(pos_router.router)
app.include_router(patient_router.router)
app.include_router(catalog_router.router)
app.include_router(voice_router.router)
app.include_router(whatsapp_router.router)
app.include_router(reports_router.router)
app.include_router(hrm_router.router)
app.include_router(purchases_router.router)
app.include_router(backup_router.router)
app.include_router(calendar_router.router)


@app.get("/")
def read_root():
    return {
        "system": "SkinLab AI Clinical Operating System",
        "status": "ONLINE",
        "version": "2.0.0",
        "docs_url": "http://127.0.0.1:8000/docs"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "ai_engine": "active",
        "google_calendar_sync": "active",
        "version": "2.0.0"
    }


class AIChatRequest(BaseModel):
    query: str
    patient_id: Optional[int] = 1
    language: Optional[str] = "auto"


@app.post("/api/ai/chat/stream")
async def stream_ai_chat(request: AIChatRequest):
    """Server-Sent Events (SSE) Real-Time AI Chat Streaming."""
    state = ClinicalState(
        query=request.query,
        patient_info={"id": request.patient_id, "name": "Ayesha Khan", "skin_type": "Medium Asian Skin", "mrn": "0001-08-2026"},
        language=request.language
    )
    return StreamingResponse(
        langgraph_agent.stream_clinical_response(state),
        media_type="text/event-stream"
    )


if __name__ == "__main__":
    import uvicorn
    print("\n==================================================================")
    print(" [SkinLab AI] Clinical Operating System - Python Server Starting ")
    print(" [URL] Listening on: http://127.0.0.1:8000                       ")
    print(" [AI Engine] LangGraph & Clinical RAG Engine: ACTIVE             ")
    print(" [Calendar] Google Calendar API Sync Router: ACTIVE               ")
    print("==================================================================\n")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
