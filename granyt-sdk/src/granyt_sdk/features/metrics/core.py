"""
Data Metrics module for Granyt SDK.

Captures metrics from DataFrames (Pandas, Polars, etc.) and sends them
to the Granyt backend for monitoring and lineage tracking.
"""

import logging
import os
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Protocol, Type, Union, runtime_checkable

logger = logging.getLogger(__name__)


def _str_to_bool(value: str) -> bool:
    """Convert string to boolean."""
    return value.lower() in ("true", "1", "yes", "on")


def _get_compute_stats_default() -> bool:
    """Get default value for compute_stats from environment."""
    return _str_to_bool(os.environ.get("GRANYT_COMPUTE_STATS", "false"))


@dataclass
class ColumnMetrics:
    """Metrics for a single column."""

    name: str
    dtype: str
    null_count: Optional[int] = None
    empty_string_count: Optional[int] = None


@dataclass
class DataFrameMetrics:
    """Captured metrics from a DataFrame."""

    capture_id: str
    captured_at: str
    row_count: int
    column_count: int
    columns: List[ColumnMetrics]
    memory_bytes: Optional[int] = None
    dataframe_type: str = "unknown"

    # Lineage linkage fields
    dag_id: Optional[str] = None
    task_id: Optional[str] = None
    run_id: Optional[str] = None

    # Upstream capture IDs for data flow tracking
    upstream: Optional[List[str]] = None

    # User-defined custom metrics
    custom_metrics: Optional[Dict[str, Union[int, float]]] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert metrics to dictionary for serialization.

        The backend expects:
        - 'metrics' field: flat 1D key-value pairs (row_count, column_count, etc.)
        - 'schema' field: DataFrame structure info (column_dtypes, null_counts, empty_string_counts)
        """
        # Build the metrics object with flat 1D values only
        metrics: Dict[str, Any] = {
            "row_count": self.row_count,
            "column_count": self.column_count,
            "dataframe_type": self.dataframe_type,
        }

        # Add optional flat fields
        if self.memory_bytes is not None:
            metrics["memory_bytes"] = self.memory_bytes

        if self.upstream:
            metrics["upstream"] = self.upstream

        # Merge custom_metrics into the metrics object
        if self.custom_metrics:
            metrics.update(self.custom_metrics)

        # Build the schema object with column metadata
        schema: Dict[str, Any] = {
            "column_dtypes": {col.name: col.dtype for col in self.columns},
        }

        # Add null counts if computed
        null_counts = {
            col.name: col.null_count for col in self.columns if col.null_count is not None
        }
        if null_counts:
            schema["null_counts"] = null_counts

        # Add empty string counts if computed
        empty_counts = {
            col.name: col.empty_string_count
            for col in self.columns
            if col.empty_string_count is not None
        }
        if empty_counts:
            schema["empty_string_counts"] = empty_counts

        # Return structure matching backend schema
        return {
            "capture_id": self.capture_id,
            "captured_at": self.captured_at,
            "dag_id": self.dag_id,
            "task_id": self.task_id,
            "run_id": self.run_id,
            "metrics": metrics,
            "schema": schema if self.columns else None,
        }


@runtime_checkable
class DataFrameLike(Protocol):
    """Protocol for DataFrame-like objects."""

    @property
    def columns(self) -> Any: ...
    @property
    def dtypes(self) -> Any: ...
    def __len__(self) -> int: ...


class DataFrameAdapter(ABC):
    """Abstract base class for DataFrame adapters.

    Extend this class to add support for new DataFrame types.
    """

    @classmethod
    @abstractmethod
    def can_handle(cls, df: Any) -> bool:
        """Check if this adapter can handle the given DataFrame."""
        pass

    @classmethod
    def prepare(cls, df: Any, should_compute: bool) -> Any:
        """Prepare the DataFrame for metric capture."""
        return df

    @classmethod
    @abstractmethod
    def get_type_name(cls) -> str:
        """Get the name of the DataFrame type this adapter handles."""
        pass

    @classmethod
    @abstractmethod
    def get_columns_with_dtypes(cls, df: Any) -> List[tuple]:
        """Get list of (column_name, dtype_string) tuples."""
        pass

    @classmethod
    @abstractmethod
    def get_row_count(cls, df: Any) -> int:
        """Get the number of rows in the DataFrame."""
        pass

    @classmethod
    def get_null_counts(cls, df: Any) -> Dict[str, int]:
        """Get null counts per column. Returns empty dict if not computed."""
        return {}

    @classmethod
    def get_empty_string_counts(cls, df: Any) -> Dict[str, int]:
        """Get empty string counts per column. Returns empty dict if not computed."""
        return {}

    @classmethod
    def get_memory_bytes(cls, df: Any) -> Optional[int]:
        """Get memory footprint in bytes. Returns None if not computed."""
        return None


# Registry of available adapters (order matters - first match wins)
_ADAPTERS: List[Type[DataFrameAdapter]] = []


def register_adapter(adapter_class: Type[DataFrameAdapter]) -> None:
    """Register a new DataFrame adapter."""
    if not issubclass(adapter_class, DataFrameAdapter):
        raise TypeError(f"{adapter_class} must be a subclass of DataFrameAdapter")

    # Insert at beginning so custom adapters take precedence
    _ADAPTERS.insert(0, adapter_class)
    logger.debug(f"Registered DataFrame adapter: {adapter_class.__name__}")


def _get_adapter(df: Any) -> Optional[Type[DataFrameAdapter]]:
    """Find an appropriate adapter for the given DataFrame."""
    for adapter_cls in _ADAPTERS:
        if adapter_cls.can_handle(df):
            return adapter_cls
    return None


def _get_current_airflow_context() -> tuple:
    """Try to get current Airflow dag_id and task_id from context."""
    try:
        from airflow.operators.python import get_current_context

        context = get_current_context()
        ti = context.get("ti") or context.get("task_instance")
        if ti:
            return (ti.dag_id, ti.task_id, ti.run_id)
    except Exception:
        pass
    return (None, None, None)


def _validate_custom_metrics(
    metrics: Optional[Dict[str, Any]], name: str
) -> Optional[Dict[str, Union[int, float]]]:
    """Validate that custom metrics dictionary contains only numeric values."""
    if metrics is None:
        return None

    if not isinstance(metrics, dict):
        raise TypeError(f"{name} must be a dictionary, got {type(metrics).__name__}")

    validated: Dict[str, Union[int, float]] = {}
    for key, value in metrics.items():
        if not isinstance(key, str):
            raise TypeError(
                f"{name} keys must be strings, got {type(key).__name__} for key '{key}'"
            )
        if not isinstance(value, (int, float)):
            raise TypeError(
                f"{name} values must be numbers (int or float), "
                f"got {type(value).__name__} for key '{key}'"
            )
        validated[key] = value

    return validated


def create_data_metrics(
    df: Any = None,
    capture_id: Optional[str] = None,
    compute_stats: Optional[bool] = None,
    dag_id: Optional[str] = None,
    task_id: Optional[str] = None,
    run_id: Optional[str] = None,
    upstream: Optional[List[str]] = None,
    custom_metrics: Optional[Dict[str, Any]] = None,
    suffix: Optional[str] = None,
) -> DataFrameMetrics:
    """Capture metrics from a DataFrame."""
    # Validate custom metrics
    validated_custom_metrics = _validate_custom_metrics(custom_metrics, "custom_metrics")

    # Find appropriate adapter if df is provided
    adapter = None
    if df is not None:
        adapter = _get_adapter(df)
        if adapter is None:
            supported = [a.get_type_name() for a in _ADAPTERS]
            raise TypeError(
                f"Unsupported DataFrame type: {type(df).__name__}. "
                f"Supported types: {supported}. "
                f"Use register_adapter() to add support for custom types."
            )

    # Get Airflow context if not provided
    if dag_id is None or task_id is None or run_id is None:
        ctx_dag_id, ctx_task_id, ctx_run_id = _get_current_airflow_context()
        dag_id = dag_id or ctx_dag_id
        task_id = task_id or ctx_task_id
        run_id = run_id or ctx_run_id

    # Generate capture_id if not provided
    if capture_id is None:
        if dag_id and task_id:
            capture_id = f"{dag_id}.{task_id}"
        else:
            capture_id = f"capture_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S_%f')}"

        # Append suffix if provided
        if suffix:
            capture_id = f"{capture_id}.{suffix}"

    # Determine if we should compute expensive stats
    should_compute = compute_stats if compute_stats is not None else _get_compute_stats_default()

    # Get metrics from adapter if available
    columns_dtypes = []
    row_count = 0
    null_counts = {}
    empty_counts = {}
    memory_bytes = None
    dataframe_type = "none"

    if adapter and df is not None:
        # Prepare DF (e.g. for Spark Observation or Caching)
        df = adapter.prepare(df, should_compute)

        # Get basic metrics (always computed)
        columns_dtypes = adapter.get_columns_with_dtypes(df)
        row_count = adapter.get_row_count(df)

        # Get computed metrics (only if enabled)
        null_counts = adapter.get_null_counts(df) if should_compute else {}
        empty_counts = adapter.get_empty_string_counts(df) if should_compute else {}
        memory_bytes = adapter.get_memory_bytes(df) if should_compute else None
        dataframe_type = adapter.get_type_name()

    # Build column metrics
    columns = [
        ColumnMetrics(
            name=col_name,
            dtype=dtype,
            null_count=null_counts.get(col_name),
            empty_string_count=empty_counts.get(col_name),
        )
        for col_name, dtype in columns_dtypes
    ]

    metrics = DataFrameMetrics(
        capture_id=capture_id,
        captured_at=datetime.now(timezone.utc).isoformat(),
        row_count=row_count,
        column_count=len(columns),
        columns=columns,
        memory_bytes=memory_bytes,
        dataframe_type=dataframe_type,
        dag_id=dag_id,
        task_id=task_id,
        run_id=run_id,
        upstream=upstream,
        custom_metrics=validated_custom_metrics,
    )

    logger.debug(f"Captured metrics for {dataframe_type} DataFrame: {capture_id}")

    return metrics


def send_data_metrics(metrics: DataFrameMetrics) -> bool:
    """Send captured metrics to the Granyt backend."""
    from granyt_sdk.core.client import get_client

    client = get_client()
    if not client.is_enabled():
        logger.debug("Granyt SDK disabled - metrics not sent")
        return False

    return client.send_data_metrics(metrics)


def capture_data_metrics(
    df: Any = None,
    capture_id: Optional[str] = None,
    compute_stats: Optional[bool] = None,
    dag_id: Optional[str] = None,
    task_id: Optional[str] = None,
    run_id: Optional[str] = None,
    upstream: Optional[List[str]] = None,
    custom_metrics: Optional[Dict[str, Any]] = None,
    suffix: Optional[str] = None,
) -> DataFrameMetrics:
    """Capture metrics from a DataFrame and send them to the backend."""
    metrics = create_data_metrics(
        df=df,
        capture_id=capture_id,
        compute_stats=compute_stats,
        dag_id=dag_id,
        task_id=task_id,
        run_id=run_id,
        upstream=upstream,
        custom_metrics=custom_metrics,
        suffix=suffix,
    )

    send_data_metrics(metrics)

    return metrics
