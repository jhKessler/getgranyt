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
    ) -> OperatorMetrics:
        """Extract Python operator metrics."""
        task = task or self._get_task(task_instance)
        
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
        
        # Try to get return value from XCom
        xcom_result = self._extract_xcom_value(task_instance)
        if xcom_result:
            self._parse_python_result(metrics, xcom_result)
        
        return metrics
    
    def _parse_python_result(
        self,
        metrics: OperatorMetrics,
        result: Any,
    ) -> None:
        """Parse Python callable result for metrics."""
        # Check if result contains Granyt metrics
        if isinstance(result, dict):
            if "granyt_metrics" in result:
                granyt_metrics = result["granyt_metrics"]
                if "row_count" in granyt_metrics:
                    metrics.row_count = granyt_metrics["row_count"]
                if "rows_affected" in granyt_metrics:
                    metrics.row_count = granyt_metrics["rows_affected"]
                if "rows_read" in granyt_metrics:
                    metrics.row_count = granyt_metrics["rows_read"]
                if "rows_written" in granyt_metrics:
                    metrics.row_count = granyt_metrics["rows_written"]
                if "bytes_processed" in granyt_metrics:
                    metrics.bytes_processed = granyt_metrics["bytes_processed"]
                if "custom" in granyt_metrics:
                    metrics.custom_metrics = metrics.custom_metrics or {}
                    metrics.custom_metrics.update(granyt_metrics["custom"])
