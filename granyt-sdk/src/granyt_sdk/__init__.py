"""
Granyt SDK for Apache Airflow

Automatic lineage tracking and error monitoring for Apache Airflow DAGs.

Usage:
    The SDK automatically integrates with Airflow when installed. Just set the
    environment variables:

    - GRANYT_ENDPOINT: Your Granyt backend URL
    - GRANYT_API_KEY: Your API key

    For manual usage:

    ```python
    from granyt_sdk import GranytClient

    client = GranytClient()

    # Capture an exception
    try:
        risky_operation()
    except Exception as e:
        client.capture_exception(e)

    # Send a message
    client.capture_message("Something happened", level="info")
    ```
"""

from granyt_sdk.core.client import GranytClient, get_client
from granyt_sdk.core.config import GranytConfig
from granyt_sdk.features.errors.capture import ErrorCapture
from granyt_sdk.features.lineage.adapter import OpenLineageAdapter
from granyt_sdk.features.metrics.core import (
    ColumnMetrics,
    DataFrameAdapter,
    DataFrameMetrics,
    capture_data_metrics,
    create_data_metrics,
    register_adapter,
    send_data_metrics,
)
from granyt_sdk.integrations.airflow.callbacks import (
    create_dag_callbacks,
    create_GRANYT_callbacks,
    on_dag_failure,
    on_dag_success,
    on_task_execute,
    on_task_failure,
    on_task_retry,
    on_task_success,
)

__version__ = "0.1.0"
__all__ = [
    # Main client
    "GranytClient",
    "get_client",
    # Configuration
    "GranytConfig",
    # Error capture
    "ErrorCapture",
    # Lineage
    "OpenLineageAdapter",
    # Callbacks
    "on_task_success",
    "on_task_failure",
    "on_task_retry",
    "on_task_execute",
    "on_dag_success",
    "on_dag_failure",
    "create_GRANYT_callbacks",
    "create_dag_callbacks",
    # Data Metrics
    "create_data_metrics",
    "send_data_metrics",
    "capture_data_metrics",
    "DataFrameMetrics",
    "ColumnMetrics",
    "DataFrameAdapter",
    "register_adapter",
]
