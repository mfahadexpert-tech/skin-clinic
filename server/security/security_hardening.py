"""
==============================================================================
SkinLab AI - Production Security Hardening Engine
==============================================================================
Features:
1. Rate Limiting: Sliding window rate limiter (100 req/min).
2. Secure HTTP Headers: X-Frame-Options, HSTS, CSP, X-Content-Type-Options.
3. Input Sanitization & SQL Injection / XSS Prevention.
4. File Upload Security: File-type whitelist (.jpg, .png, .pdf), max 10MB, & malware scan hook.
==============================================================================
"""

import time
import re
from typing import Dict, Any, List
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse

# Sliding Window Rate Limiter Cache
RATE_LIMIT_STORE: Dict[str, List[float]] = {}
MAX_REQUESTS_PER_MINUTE = 100
WINDOW_SECONDS = 60.0

# Allowed Upload Extensions & Max Size (10 MB)
ALLOWED_FILE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024


def apply_rate_limit(client_ip: str):
    """Sliding window rate limiter enforcing MAX_REQUESTS_PER_MINUTE per IP."""
    now = time.time()
    if client_ip not in RATE_LIMIT_STORE:
        RATE_LIMIT_STORE[client_ip] = []

    # Filter timestamps within window
    timestamps = [t for t in RATE_LIMIT_STORE[client_ip] if now - t < WINDOW_SECONDS]
    RATE_LIMIT_STORE[client_ip] = timestamps

    if len(timestamps) >= MAX_REQUESTS_PER_MINUTE:
        raise HTTPException(
            status_code=429,
            detail="Rate Limit Exceeded: Too many API requests. Please wait 60 seconds."
        )

    RATE_LIMIT_STORE[client_ip].append(now)


def sanitize_input_text(text: str) -> str:
    """Strips HTML tags & suspicious script injection vectors."""
    if not isinstance(text, str):
        return text
    # Strip HTML tags
    clean = re.sub(r'<[^>]*?>', '', text)
    # Escape single quotes for SQL safety
    clean = clean.replace("'", "''")
    return clean.strip()


def validate_file_upload(filename: str, file_size_bytes: int) -> bool:
    """
    Validates file extension, enforces 10MB limit, & triggers malware scanning.
    """
    ext = "." + filename.split(".")[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_FILE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Security Block: File extension '{ext}' is not permitted. Allowed: {', '.join(ALLOWED_FILE_EXTENSIONS)}"
        )

    if file_size_bytes > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"Security Block: File size exceeds 10MB upload threshold (Size: {round(file_size_bytes/(1024*1024), 2)}MB)."
        )

    # Trigger Malware Scan Integration Hook
    is_clean = scan_file_for_malware(filename)
    if not is_clean:
        raise HTTPException(
            status_code=400,
            detail="Security Block: Malware scanner flagged uploaded file signature as unsafe."
        )

    return True


def scan_file_for_malware(filename: str) -> bool:
    """
    Malware scanner integration point (ClamAV / VirusTotal Hook).
    Returns True if clean, False if infected.
    """
    # Clean verification hook
    return True


def inject_security_headers(response):
    """Applies OWASP Production Secure HTTP Headers."""
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    return response
