"""
Configuration module for Granyt SDK.

Handles all configuration from environment variables with sensible defaults.
"""

import os
from dataclasses import dataclass, field
from typing import Optional
import logging

logger = logging.getLogger(__name__)


def _str_to_bool(value: str) -> bool:
    """Convert string to boolean."""
    return value.lower() in ("true", "1", "yes", "on")


@dataclass
class GranytConfig:
    """Configuration for Granyt SDK.
    
    All configuration is read from environment variables:
    - GRANYT_ENDPOINT: Backend API endpoint (required)
    - GRANYT_API_KEY: API key for authentication (required)
    - GRANYT_DEBUG: Enable debug logging (default: false)
    - GRANYT_DISABLED: Disable the SDK (default: false)
    - GRANYT_NAMESPACE: OpenLineage namespace (default: airflow)
    - GRANYT_MAX_RETRIES: Max retries for failed requests (default: 3)
    - GRANYT_RETRY_DELAY: Delay between retries in seconds (default: 1.0)
    - GRANYT_BATCH_SIZE: Batch size for error events (default: 10)
    - GRANYT_FLUSH_INTERVAL: Flush interval in seconds (default: 5.0)
    - GRANYT_TIMEOUT: Request timeout in seconds (default: 30)
    """
    
    endpoint: Optional[str] = field(default=None)
    api_key: Optional[str] = field(default=None)
    debug: bool = field(default=False)
    disabled: bool = field(default=False)
    namespace: str = field(default="airflow")
    max_retries: int = field(default=3)
    retry_delay: float = field(default=1.0)
    batch_size: int = field(default=10)
    flush_interval: float = field(default=5.0)
    timeout: float = field(default=30.0)
    
    @classmethod
    def from_environment(cls) -> "GranytConfig":
        """Create configuration from environment variables."""
        endpoint = os.environ.get("GRANYT_ENDPOINT")
        api_key = os.environ.get("GRANYT_API_KEY")
        
        config = cls(
            endpoint=endpoint,
            api_key=api_key,
            debug=_str_to_bool(os.environ.get("GRANYT_DEBUG", "false")),
            disabled=_str_to_bool(os.environ.get("GRANYT_DISABLED", "false")),
            namespace=os.environ.get("GRANYT_NAMESPACE", "airflow"),
            max_retries=int(os.environ.get("GRANYT_MAX_RETRIES", "3")),
            retry_delay=float(os.environ.get("GRANYT_RETRY_DELAY", "1.0")),
            batch_size=int(os.environ.get("GRANYT_BATCH_SIZE", "10")),
            flush_interval=float(os.environ.get("GRANYT_FLUSH_INTERVAL", "5.0")),
            timeout=float(os.environ.get("GRANYT_TIMEOUT", "30.0")),
        )
        
        return config
    
    def is_valid(self) -> bool:
        """Check if configuration is valid for SDK operation."""
        if self.disabled:
            return False
        if not self.endpoint:
            logger.warning("GRANYT_ENDPOINT not set - SDK will be disabled")
            return False
        if not self.api_key:
            logger.warning("GRANYT_API_KEY not set - SDK will be disabled")
            return False
        return True
    
    def get_headers(self) -> dict:
        """Get HTTP headers for API requests."""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "X-granyt-sdk-Version": "0.1.0",
            "User-Agent": "granyt-sdk-python/0.1.0",
        }
    
    def get_lineage_url(self) -> str:
        """Get the lineage endpoint URL."""
        return f"{self.endpoint.rstrip('/')}/api/v1/lineage"
    
    def get_errors_url(self) -> str:
        """Get the errors endpoint URL."""
        return f"{self.endpoint.rstrip('/')}/api/v1/errors"
    
    def get_heartbeat_url(self) -> str:
        """Get the heartbeat endpoint URL."""
        return f"{self.endpoint.rstrip('/')}/api/v1/heartbeat"
    
    def get_data_metrics_url(self) -> str:
        """Get the data metrics endpoint URL."""
        return f"{self.endpoint.rstrip('/')}/api/v1/metrics"
    
    def get_operator_metrics_url(self) -> str:
        """Get the operator metrics endpoint URL (now using data-metrics)."""
        return self.get_data_metrics_url()
    
    def to_dict(self) -> dict:
        """Convert configuration to dictionary (excluding sensitive data)."""
        return {
            "endpoint": self.endpoint,
            "api_key": "***" if self.api_key else None,
            "debug": self.debug,
            "disabled": self.disabled,
            "namespace": self.namespace,
            "max_retries": self.max_retries,
            "retry_delay": self.retry_delay,
            "batch_size": self.batch_size,
            "flush_interval": self.flush_interval,
            "timeout": self.timeout,
        }
