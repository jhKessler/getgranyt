"""
Data Metrics module for Granyt SDK.

Computes metrics from DataFrames (Pandas, Polars, etc.) for use with
the `granyt` key in Airflow task return values.
"""

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Protocol, Type, Union, runtime_checkable

logger = logging.getLogger(__name__)

# Constants for the special keys in task return values
GRANYT_KEY = "granyt"
DF_METRICS_KEY = "df_metrics"

# Keys that belong in the schema object (sent to backend's 'schema' field)
SCHEMA_KEYS = {"column_dtypes", "null_counts", "empty_string_counts"}

# Keys that belong in the metrics object (sent to backend's 'metrics' field)
METRICS_KEYS = {"row_count", "column_count", "dataframe_type", "memory_bytes"}


def validate_df_metrics(df_metrics: Any) -> bool:
    """Validate that df_metrics has the required structure.

    The df_metrics must be a dictionary containing at minimum:
    - column_dtypes: Dict[str, str] - mapping of column names to their dtypes

    Optional fields:
    - null_counts: Dict[str, int] - mapping of column names to null counts
    - empty_string_counts: Dict[str, int] - mapping of column names to empty string counts
    - row_count: int - number of rows
    - column_count: int - number of columns
    - dataframe_type: str - type of dataframe (pandas, polars, etc.)
    - memory_bytes: int - memory usage in bytes

    Args:
        df_metrics: The value to validate

    Returns:
        True if validation passes, False otherwise (with warning logged)
    """
    if not isinstance(df_metrics, dict):
        logger.warning(
            f"df_metrics must be a dictionary, got {type(df_metrics).__name__}. "
            "Schema will not be sent to Granyt."
        )
        return False

    # column_dtypes is required
    if "column_dtypes" not in df_metrics:
        logger.warning(
            "df_metrics is missing required 'column_dtypes' field. "
            "Schema will not be sent to Granyt. "
            "Use compute_df_metrics() to generate a valid schema."
        )
        return False

    column_dtypes = df_metrics["column_dtypes"]
    if not isinstance(column_dtypes, dict):
        logger.warning(
            f"df_metrics['column_dtypes'] must be a dictionary, got {type(column_dtypes).__name__}. "
            "Schema will not be sent to Granyt."
        )
        return False

    # Validate column_dtypes values are strings
    for col_name, dtype in column_dtypes.items():
        if not isinstance(col_name, str) or not isinstance(dtype, str):
            logger.warning(
                f"df_metrics['column_dtypes'] must have string keys and values, "
                f"got {type(col_name).__name__}: {type(dtype).__name__}. "
                "Schema will not be sent to Granyt."
            )
            return False

    # Validate optional null_counts if present
    if "null_counts" in df_metrics:
        null_counts = df_metrics["null_counts"]
        if not isinstance(null_counts, dict):
            logger.warning(
                f"df_metrics['null_counts'] must be a dictionary, got {type(null_counts).__name__}. "
                "null_counts will be ignored."
            )
        else:
            for col_name, count in null_counts.items():
                if not isinstance(col_name, str) or not isinstance(count, (int, type(None))):
                    logger.warning(
                        "df_metrics['null_counts'] must have string keys and int/null values. "
                        "null_counts will be ignored."
                    )
                    break

    # Validate optional empty_string_counts if present
    if "empty_string_counts" in df_metrics:
        empty_counts = df_metrics["empty_string_counts"]
        if not isinstance(empty_counts, dict):
            logger.warning(
                f"df_metrics['empty_string_counts'] must be a dictionary, got {type(empty_counts).__name__}. "
                "empty_string_counts will be ignored."
            )
        else:
            for col_name, count in empty_counts.items():
                if not isinstance(col_name, str) or not isinstance(count, (int, type(None))):
                    logger.warning(
                        "df_metrics['empty_string_counts'] must have string keys and int/null values. "
                        "empty_string_counts will be ignored."
                    )
                    break

    return True


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
    def prepare(cls, df: Any) -> Any:
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


def compute_df_metrics(
    df: Any,
) -> Dict[str, Any]:
    """Compute metrics from a DataFrame for use with the granyt key.

    This function calculates DataFrame statistics that should be passed
    to the `granyt["df_metrics"]` key in your task's return value. The SDK
    automatically splits this into schema (column types, null counts) and
    metrics (row count, memory) before sending to the backend.

    Args:
        df: The DataFrame to compute metrics from. Supports Pandas, Polars,
            or any custom registered type.

    Returns:
        A dictionary containing the computed metrics, ready to be assigned
        to your granyt["df_metrics"] return value.

    Example:
        @task
        def transform_data():
            df = pd.read_parquet("data.parquet")
            return {
                "granyt": {
                    "df_metrics": compute_df_metrics(df),
                    "custom_metric": 42
                }
            }
    """
    # Find appropriate adapter
    adapter = _get_adapter(df)
    if adapter is None:
        supported = [a.get_type_name() for a in _ADAPTERS]
        raise TypeError(
            f"Unsupported DataFrame type: {type(df).__name__}. "
            f"Supported types: {supported}. "
            f"Use register_adapter() to add support for custom types."
        )

    # Prepare DF (e.g. for Spark Observation or Caching)
    df = adapter.prepare(df)

    # Get basic metrics (always computed)
    columns_dtypes = adapter.get_columns_with_dtypes(df)
    row_count = adapter.get_row_count(df)

    # Build the metrics dictionary
    metrics: Dict[str, Any] = {
        "row_count": row_count,
        "column_count": len(columns_dtypes),
        "dataframe_type": adapter.get_type_name(),
        "column_dtypes": {col_name: dtype for col_name, dtype in columns_dtypes},
    }

    # Get computed metrics
    null_counts = adapter.get_null_counts(df)
    if null_counts:
        metrics["null_counts"] = null_counts

    empty_counts = adapter.get_empty_string_counts(df)
    if empty_counts:
        metrics["empty_string_counts"] = empty_counts

    memory_bytes = adapter.get_memory_bytes(df)
    if memory_bytes is not None:
        metrics["memory_bytes"] = memory_bytes

    logger.debug(f"Computed metrics for {adapter.get_type_name()} DataFrame: {row_count} rows")

    return metrics
