"""
Unified Runner for Hospital Management & AI Agent System
"""
import subprocess
import sys
import os
import time

def start_server():
    server_dir = os.path.join(os.path.dirname(__file__), "server")
    print("Starting FastAPI Backend Server on http://127.0.0.1:8000 ...")
    return subprocess.Popen([sys.executable, "main.py"], cwd=server_dir)

def start_client():
    client_dir = os.path.join(os.path.dirname(__file__), "client")
    print("Starting Next.js Frontend Client on http://localhost:3000 ...")
    # Windows npm run dev
    shell_cmd = "npm run dev"
    return subprocess.Popen(shell_cmd, cwd=client_dir, shell=True)

if __name__ == "__main__":
    print("=" * 70)
    print("  SkinLab Hospital Management & AI Agent System")
    print("=" * 70)
    
    server_proc = start_server()
    time.sleep(2)
    client_proc = start_client()

    print("\n[OK] Both Backend and Frontend processes launched!")
    print("• Backend API: http://127.0.0.1:8000  (Docs: http://127.0.0.1:8000/docs)")
    print("• Frontend App: http://localhost:3000")
    print("\nPress Ctrl+C to stop both servers.\n")

    try:
        server_proc.wait()
        client_proc.wait()
    except KeyboardInterrupt:
        print("\nShutting down servers...")
        server_proc.terminate()
        client_proc.terminate()
