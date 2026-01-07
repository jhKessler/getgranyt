import logging
from typing import Any, Optional

from granyt_sdk.features.metrics import (
    DF_METRICS_KEY,
    GRANYT_KEY,
    validate_df_metrics,
)
from granyt_sdk.integrations.airflow.operator_adapters.base import (
    OperatorAdapter,
    OperatorMetrics,
)

logger = logging.getLogger(__name__)


class PythonAdapter(OperatorAdapter):
    """Adapter for Python operators.

    Extracts metrics from:
    - PythonOperator
    - BranchPythonOperator
    - ShortCircuitOperator
    - PythonVirtualenvOperator
    - ExternalPythonOperator
    - etc.

    Note: Python operators are generic, so metrics extraction
    is limited to what's returned via XCom using the 'granyt' key.
    """

    OPERATOR_PATTERNS = [
        "PythonOperator",
        "BranchPythonOperator",
        "ShortCircuitOperator",
        "PythonVirtualenvOperator",
        "ExternalPythonOperator",
        "BranchExternalPythonOperator",
        "_PythonDecoratedOperator",
        "DecoratedMappedOperator",
    ]

    OPERATOR_TYPE = "python"
    PRIORITY = 5  # Medium priority

    def extract_metrics(
        self,
        task_instance: Any,
        task: Optional[Any] = None,
    ) -> Optional[OperatorMetrics]:
        """Extract Python operator metrics."""
        task = task or self._get_task(task_instance)

        # Try to get return value from XCom
        xcom_result = self._extract_xcom_value(task_instance)

        # If no granyt key in XCom, return None to avoid sending metrics
        # as per user request to only make a request if granyt is specified.
        if not isinstance(xcom_result, dict) or GRANYT_KEY not in xcom_result:
            return None

        metrics = OperatorMetrics(
            operator_type=self.OPERATOR_TYPE,
            operator_class=self._get_operator_class(task_instance),
        )

        if task:
            # Extract callable info
            if hasattr(task, "python_callable"):
                callable_obj = task.python_callable
                if callable_obj:
                    metrics.custom_metrics = metrics.custom_metrics or {}
                    metrics.custom_metrics["function_name"] = getattr(
                        callable_obj, "__name__", str(callable_obj)
                    )
                    if hasattr(callable_obj, "__module__"):
                        metrics.custom_metrics["module"] = callable_obj.__module__

            # Virtualenv specific
            if hasattr(task, "requirements"):
                metrics.custom_metrics = metrics.custom_metrics or {}
                metrics.custom_metrics["requirements"] = task.requirements
            if hasattr(task, "python_version"):
                metrics.custom_metrics = metrics.custom_metrics or {}
                metrics.custom_metrics["python_version"] = task.python_version

        self._parse_python_result(metrics, xcom_result)

        return metrics

    def _parse_python_result(
        self,
        metrics: OperatorMetrics,
        result: Any,
    ) -> None:
        """Parse Python callable result for metrics.

        Handles the 'granyt' key structure:
        - granyt.df_metrics: DataFrame schema/metrics from compute_df_metrics()
        - granyt.<custom_key>: Any custom user-defined metrics

        The df_metrics is split into:
        - Schema fields (column_dtypes, null_counts, empty_string_counts) -> backend's 'schema' field
        - Metric fields (row_count, column_count, dataframe_type, memory_bytes) -> backend's 'metrics' field
        """
        # Check if result contains Granyt key
        if not isinstance(result, dict) or GRANYT_KEY not in result:
            return

        granyt_data = result[GRANYT_KEY]
        if not isinstance(granyt_data, dict):
            return

        metrics.custom_metrics = metrics.custom_metrics or {}

        # Handle df_metrics if present - this comes from compute_df_metrics()
        if DF_METRICS_KEY in granyt_data:
            df_metrics = granyt_data[DF_METRICS_KEY]

            # Validate the schema structure - raise error if invalid
            if not validate_df_metrics(df_metrics):
                raise ValueError(
                    f"Invalid df_metrics structure. "
                    f"df_metrics must be a dictionary with 'column_dtypes' (Dict[str, str]) as a required field. "
                    f"Got: {type(df_metrics).__name__}. "
                    f"Use compute_df_metrics() to generate a valid schema."
                )

            # Extract schema fields for backend's 'schema' field
            schema_data = {}
            if "column_dtypes" in df_metrics:
                schema_data["column_dtypes"] = df_metrics["column_dtypes"]
            if "null_counts" in df_metrics:
                schema_data["null_counts"] = df_metrics["null_counts"]
            if "empty_string_counts" in df_metrics:
                schema_data["empty_string_counts"] = df_metrics["empty_string_counts"]

            if schema_data:
                metrics.custom_metrics["schema"] = schema_data

            # Extract metric fields
            if "row_count" in df_metrics:
                metrics.row_count = df_metrics["row_count"]
            if "memory_bytes" in df_metrics:
                metrics.bytes_processed = df_metrics["memory_bytes"]

            # Capture other metadata from df_metrics
            for key in ["dataframe_type", "column_count"]:
                if key in df_metrics:
                    metrics.custom_metrics[key] = df_metrics[key]

        # Process all other keys in granyt (custom metrics)
        reserved_keys = {DF_METRICS_KEY}
        for key, value in granyt_data.items():
            if key not in reserved_keys:
                # Handle standard metric names
                if key in ("row_count", "rows_affected", "rows_read", "rows_written"):
                    if metrics.row_count is None:
                        metrics.row_count = value
                elif key in ("bytes_processed", "memory_bytes"):
                    if metrics.bytes_processed is None:
                        metrics.bytes_processed = value
                else:
                    # All other keys become custom metrics
                    metrics.custom_metrics[key] = value
