"""
Hospital Management & AI Agent System - Server Runner
Executes the FastAPI application server via Uvicorn.
"""
import uvicorn
import os
import sys

if __name__ == "__main__":
    # Ensure current directory is in sys.path
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    print("Starting Hospital Management & AI Agent System Server at http://127.0.0.1:8000 ...")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
