import logging
from typing import Any, Optional

from granyt_sdk.integrations.airflow.operator_adapters.base import (
    OperatorAdapter,
    OperatorMetrics,
)

logger = logging.getLogger(__name__)


class HttpAdapter(OperatorAdapter):
    """Adapter for HTTP operators."""
    
    OPERATOR_PATTERNS = [
        "SimpleHttpOperator",
        "HttpOperator",
        "HttpSensor",
    ]
    
    OPERATOR_TYPE = "http"
    PRIORITY = 5
    
    def extract_metrics(
        self,
        task_instance: Any,
        task: Optional[Any] = None,
    ) -> OperatorMetrics:
        """Extract HTTP operator metrics."""
        task = task or self._get_task(task_instance)
        
        metrics = OperatorMetrics(
            operator_type=self.OPERATOR_TYPE,
            operator_class=self._get_operator_class(task_instance),
            connection_id=self._get_connection_id(task) if task else None,
        )
        
        if task:
            if hasattr(task, "endpoint"):
                metrics.destination_path = task.endpoint
            if hasattr(task, "method"):
                metrics.custom_metrics = metrics.custom_metrics or {}
                metrics.custom_metrics["method"] = task.method
        
        return metrics
