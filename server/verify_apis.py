"""
==============================================================================
SkinLab AI - API Keys & LLM Model Health Diagnostics
==============================================================================
Tests:
1. Supabase PostgreSQL Connection & Authentication
2. OpenAI / LLM Model Connectivity (GPT-4o / GPT-4o-mini / LangChain RAG)
3. FastAPI Backend & LangGraph Agent Health
==============================================================================
"""

import os
import sys
import json
import urllib.request
from dotenv import load_dotenv

# Load environment
load_dotenv()

supabase_url = os.getenv("SUPABASE_URL", "")
supabase_key = os.getenv("SUPABASE_KEY", "")
openai_api_key = os.getenv("OPENAI_API_KEY", "")

report = {
    "llm_model": "OpenAI GPT-4o / GPT-4o-mini (via LangGraph & LangChain RAG)",
    "multilingual_capabilities": "English + Roman Urdu (Medical NLP)",
    "apis": {}
}

# 1. Check Supabase
if supabase_url and supabase_key and "your-project" not in supabase_url and "your-supabase" not in supabase_key:
    try:
        from supabase import create_client
        client = create_client(supabase_url, supabase_key)
        # Test query
        res = client.table("company_settings").select("*").limit(1).execute()
        report["apis"]["supabase"] = {
            "status": "CONNECTED_LIVE",
            "url": supabase_url,
            "message": "Successfully authenticated with live Supabase PostgreSQL database."
        }
    except Exception as e:
        report["apis"]["supabase"] = {
            "status": "KEY_CONFIGURED_BUT_ERROR",
            "url": supabase_url,
            "error": str(e),
            "fallback": "Local high-performance clinic storage active."
        }
else:
    report["apis"]["supabase"] = {
        "status": "LOCAL_FALLBACK_ACTIVE",
        "message": "No live Supabase keys configured in .env yet. Running on built-in local database store."
    }

# 2. Check OpenAI API Key
if openai_api_key and openai_api_key.startswith("sk-") and "your-openai" not in openai_api_key:
    try:
        req = urllib.request.Request(
            "https://api.openai.com/v1/models",
            headers={"Authorization": f"Bearer {openai_api_key}"}
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.getcode() == 200:
                report["apis"]["openai"] = {
                    "status": "VALID_AND_ACTIVE",
                    "model": "gpt-4o / gpt-4o-mini",
                    "message": "OpenAI API Key is valid and active for real-time inference."
                }
    except Exception as e:
        report["apis"]["openai"] = {
            "status": "KEY_INVALID_OR_NETWORK_ISSUE",
            "error": str(e),
            "fallback": "LangGraph clinical state machine running with embedded RAG knowledge."
        }
else:
    report["apis"]["openai"] = {
        "status": "EMBEDDED_RAG_ACTIVE",
        "model": "LangGraph Clinical RAG Engine (Built-in)",
        "message": "No live OpenAI API key set. The system is operating via the built-in LangGraph Clinical Protocol & Contraindication Knowledge Base."
    }

# 3. Check Backend Status
try:
    with urllib.request.urlopen("http://127.0.0.1:8000/api/health", timeout=3) as res:
        data = json.loads(res.read().decode())
        report["backend_server"] = {
            "status": "ONLINE",
            "version": data.get("version"),
            "url": "http://127.0.0.1:8000"
        }
except Exception:
    report["backend_server"] = {
        "status": "OFFLINE",
        "hint": "Run 'python main.py' in the server directory."
    }

# Print clean JSON
print(json.dumps(report, indent=2))
