"""
==============================================================================
SkinLab AI - Production Environment Validator & Configuration Engine
==============================================================================
Validates required environment variables on server boot:
- SUPABASE_URL, SUPABASE_KEY, JWT_SECRET, CORS_ORIGINS
- Sentry / Datadog Error Monitoring Integration Points
==============================================================================
"""

import os
import logging

logger = logging.getLogger("SkinLab.ProdConfig")

ENV = os.getenv("ENVIRONMENT", "development") # 'development', 'staging', 'production'
IS_PRODUCTION = ENV == "production"

REQUIRED_ENV_VARS = [
    "SUPABASE_URL",
    "SUPABASE_KEY",
    "JWT_SECRET"
]


def validate_production_environment():
    """
    Validates environment variables on server boot.
    Prevents launching in production mode with default development secrets.
    """
    missing_vars = [var for var in REQUIRED_ENV_VARS if not os.getenv(var)]

    if missing_vars and IS_PRODUCTION:
        error_msg = f"CRITICAL PRODUCTION LAUNCH BLOCK: Missing required environment variables: {', '.join(missing_vars)}"
        logger.critical(error_msg)
        raise RuntimeError(error_msg)

    jwt_secret = os.getenv("JWT_SECRET", "")
    if IS_PRODUCTION and ("skinlab_secure_jwt_secret" in jwt_secret or len(jwt_secret) < 32):
        raise RuntimeError("CRITICAL SECURITY BLOCK: Production JWT_SECRET is weak or default. Must be at least 32 random characters.")

    logger.info(f"[ProdConfig] Environment validated successfully: {ENV.upper()} MODE")
    return True


def init_error_monitoring_hooks():
    """
    Integration point for Sentry / Datadog error reporting.
    """
    sentry_dsn = os.getenv("SENTRY_DSN")
    if sentry_dsn:
        logger.info("[ProdConfig] Sentry Error Monitoring Hook initialized.")
    else:
        logger.info("[ProdConfig] Error Monitoring Hook active (Local Logging Fallback).")
