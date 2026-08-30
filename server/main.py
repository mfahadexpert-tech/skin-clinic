"""
==============================================================================
SkinLab AI - Main FastAPI Application Server Entrypoint
==============================================================================
An asynchronous high-performance Python backend unifying:
1. Supabase PostgreSQL persistence & Realtime sync.
2. Clinical RAG + LangGraph GPT Doctor Assistant with SSE streaming.
3. POS Billing Terminal, Token generation, and Multi-Session Tracker.
4. AI Voice Booking Agent & Multi-Channel WhatsApp Communications.
5. Automated Database SQL Backup Engine.
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
    allow_origins=["*"], # In production, restrict to frontend domain
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


# ==============================================================================
# AI Streaming Endpoint (LangGraph + RAG + Server-Sent Events)
# ==============================================================================
@app.post("/api/ai/chat/stream")
async def stream_ai_doctor_chat(req: AIChatRequest):
    """
    Module 3.4 / 5.3: Streams real-time tokens from LangGraph clinical agent
    to the doctor dashboard via Server-Sent Events (SSE).
    Includes clinical protocols, SOAP note drafts, Roman Urdu & English NLP,
    and the mandatory non-removable safety disclaimer.
    """
    patient_data = None
    if req.patient_id:
        patient_data = next((c for c in clinic_store.customers if c["id"] == req.patient_id), None)

    state = ClinicalState(
        query=req.query,
        patient_info=patient_data,
        language=req.language
    )

    return StreamingResponse(
        langgraph_agent.stream_clinical_response(state),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


# ==============================================================================
# System Health & Status Endpoint
# ==============================================================================
@app.get("/api/health")
def system_health():
    return {
        "status": "healthy",
        "service": "SkinLab AI Clinical OS",
        "version": "2.0.0",
        "database": "Supabase PostgreSQL / Local Store Connected",
        "ai_engine": "LangGraph + LangChain RAG Active",
        "active_records": {
            "patients": len(clinic_store.customers),
            "products": len(clinic_store.products),
            "sales": len(clinic_store.sales),
            "appointments": len(clinic_store.appointments)
        }
    }


if __name__ == "__main__":
    print("==================================================================")
    print(" [SkinLab AI] Clinical Operating System - Python Server Starting ")
    print(" [URL] Listening on: http://127.0.0.1:8000                       ")
    print(" [AI Engine] LangGraph & Clinical RAG Engine: ACTIVE             ")
    print(" [Data Layer] Supabase PostgreSQL Store: ACTIVE                  ")
    print("==================================================================")
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
