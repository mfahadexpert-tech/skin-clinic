"""
==============================================================================
SkinLab AI - Main FastAPI Application Server Entrypoint
==============================================================================
An asynchronous high-performance Python backend unifying:
1. Supabase PostgreSQL persistence & Realtime sync.
2. Clinical RAG + LangGraph GPT Doctor Assistant with SSE streaming.
3. POS Billing Terminal, Token generation, and Multi-Session Tracker.
4. AI Voice Booking Agent & Multi-Channel WhatsApp Communications.
5. Controlled AI Post-Treatment Follow-Up Assistant with Risk Escalation.
==============================================================================
"""

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from dotenv import load_dotenv

# Load environment configuration
load_dotenv()

# Import routers
from routers.pos_router import router as pos_router
from routers.patient_router import router as patient_router
from routers.catalog_router import router as catalog_router
from routers.voice_router import router as voice_router
from routers.whatsapp_router import router as whatsapp_router
from routers.reports_router import router as reports_router
from routers.hrm_router import router as hrm_router
from routers.purchases_router import router as purchases_router
from routers.backup_router import router as backup_router
from routers.waitlist_router import router as waitlist_router
from routers.policy_router import router as policy_router
from routers.forms_router import router as forms_router
from routers.clinical_notes_router import router as clinical_notes_router
from routers.charting_router import router as charting_router
from routers.photos_router import router as photos_router
from routers.prescriptions_router import router as prescriptions_router
from routers.adverse_events_router import router as adverse_events_router
from routers.safety_router import router as safety_router
from routers.scribe_router import router as scribe_router
from routers.followup_router import router as followup_router

# Import LangGraph AI Assistant & Database Store
from ai.langgraph_agent import langgraph_agent, ClinicalState
from database.supabase_client import clinic_store
from database.models import AIChatRequest

# Initialize FastAPI app
app = FastAPI(
    title="SkinLab AI - Clinical Management & POS API",
    description="Enterprise API for Aesthetic Clinics & Dermatology POS Systems with Clinical AI Layer",
    version="2.0.0"
)

# Configure Cross-Origin Resource Sharing (CORS) for React / Next.js client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Module Routers
app.include_router(pos_router)
app.include_router(patient_router)
app.include_router(catalog_router)
app.include_router(voice_router)
app.include_router(whatsapp_router)
app.include_router(reports_router)
app.include_router(hrm_router)
app.include_router(purchases_router)
app.include_router(backup_router)
app.include_router(waitlist_router)
app.include_router(policy_router)
app.include_router(forms_router)
app.include_router(clinical_notes_router)
app.include_router(charting_router)
app.include_router(photos_router)
app.include_router(prescriptions_router)
app.include_router(adverse_events_router)
app.include_router(safety_router)
app.include_router(scribe_router)
app.include_router(followup_router)


@app.get("/api/health", tags=["Health & Status"])
def health_check():
    """Health check endpoint for application status & database ping."""
    return {
        "status": "online",
        "system": "SkinLab AI Clinical OS",
        "version": "2.0.0",
        "database": "connected" if clinic_store else "local_fallback"
    }


@app.post("/api/ai/chat/stream", tags=["AI Doctor Assistant"])
async def stream_ai_chat(request: AIChatRequest):
    """
    Streaming endpoint for LangGraph Doctor Assistant.
    Emits Server-Sent Events (SSE) word-by-word into frontend UI.
    """
    state = ClinicalState(
        query=request.query,
        patient_id=request.patient_id,
        language=request.language
    )

    async def event_generator():
        async for chunk in langgraph_agent.stream_chat(state):
            yield f"data: {chunk}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
