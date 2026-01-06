import logging
from typing import Any, Optional

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
    is limited to what's returned via XCom.
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

        # If no granyt_metrics in XCom, return None to avoid sending metrics
        # as per user request to only make a request if granyt_metrics is specified.
        if not isinstance(xcom_result, dict) or "granyt_metrics" not in xcom_result:
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
        """Parse Python callable result for metrics."""
        # Check if result contains Granyt metrics
        if not isinstance(result, dict) or "granyt_metrics" not in result:
            return

        granyt_metrics = result["granyt_metrics"]
        if not isinstance(granyt_metrics, dict):
            return

        # Handle nested 'metrics' key (from compute_df_metrics)
        source_data = granyt_metrics
        if "metrics" in granyt_metrics and isinstance(granyt_metrics["metrics"], dict):
            # Merge nested metrics into a flat view for extraction
            source_data = {**granyt_metrics, **granyt_metrics["metrics"]}

        # Extract standard metrics
        if "row_count" in source_data:
            metrics.row_count = source_data["row_count"]
        elif "rows_affected" in source_data:
            metrics.row_count = source_data["rows_affected"]
        elif "rows_read" in source_data:
            metrics.row_count = source_data["rows_read"]
        elif "rows_written" in source_data:
            metrics.row_count = source_data["rows_written"]

        if "bytes_processed" in source_data:
            metrics.bytes_processed = source_data["bytes_processed"]
        elif "memory_bytes" in source_data:
            metrics.bytes_processed = source_data["memory_bytes"]

        # Extract custom metrics
        metrics.custom_metrics = metrics.custom_metrics or {}

        # If there's a 'custom' key, use it
        if "custom" in granyt_metrics and isinstance(granyt_metrics["custom"], dict):
            metrics.custom_metrics.update(granyt_metrics["custom"])

        # If there's a 'schema' key (from compute_df_metrics), capture it
        if "schema" in granyt_metrics:
            metrics.custom_metrics["schema"] = granyt_metrics["schema"]

        # Capture other metadata from compute_df_metrics
        for key in ["dataframe_type", "column_count"]:
            if key in source_data:
                metrics.custom_metrics[key] = source_data[key]
