"""
Sanitization utilities for Granyt SDK.

Handles sensitive data masking and value sanitization for safe transmission.
"""

import logging
from typing import Any, Dict

logger = logging.getLogger(__name__)

# Environment variables that should be excluded from capture (security)
SENSITIVE_ENV_PATTERNS = [
    "KEY",
    "SECRET",
    "PASSWORD",
    "TOKEN",
    "CREDENTIAL",
    "AUTH",
    "PRIVATE",
    "API_KEY",
    "APIKEY",
    "ACCESS",
    "AWS_",
    "AZURE_",
    "GCP_",
    "DATABASE_URL",
    "DB_",
    "MYSQL_",
    "POSTGRES_",
    "REDIS_",
    "MONGO_",
    "AIRFLOW__",
    "FERNET_KEY",
]


def is_sensitive_key(key: str) -> bool:
    """Check if an environment variable key is sensitive."""
    key_upper = key.upper()
    return any(pattern in key_upper for pattern in SENSITIVE_ENV_PATTERNS)


def sanitize_value(value: Any, max_length: int = 1000) -> Any:
    """Sanitize a value for safe transmission."""
    if value is None:
        return None
    
    try:
        str_value = str(value)
        if len(str_value) > max_length:
            return str_value[:max_length] + "... [truncated]"
        return str_value
    except Exception:
        return "<unserializable>"


def sanitize_context(context: Any, depth: int = 0) -> Any:
    """Recursively sanitize a context dictionary."""
    if depth > 5:
        return "<max depth exceeded>"
    
    if context is None:
        return None
    
    if isinstance(context, dict):
        sanitized = {}
        for key, value in context.items():
            if is_sensitive_key(str(key)):
                sanitized[key] = "<redacted>"
            else:
                sanitized[key] = sanitize_context(value, depth + 1)
        return sanitized
    
    if isinstance(context, (list, tuple)):
        return [sanitize_context(item, depth + 1) for item in context[:100]]
    
    return sanitize_value(context)
