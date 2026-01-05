import logging
from typing import Any, Optional

from granyt_sdk.integrations.airflow.operator_adapters.base import (
    OperatorAdapter,
    OperatorMetrics,
)

logger = logging.getLogger(__name__)


class RedshiftAdapter(OperatorAdapter):
    """Adapter for Amazon Redshift operators.
    
    Extracts metrics from:
    - RedshiftSQLOperator
    - RedshiftDataOperator
    - S3ToRedshiftOperator
    - RedshiftToS3Operator
    - etc.
    """
    
    OPERATOR_PATTERNS = [
        "RedshiftSQLOperator",
        "RedshiftDataOperator",
        "RedshiftCheckOperator",
        "S3ToRedshift",
        "RedshiftToS3",
        "RedshiftOperator",
        "RedshiftClusterSensor",
        "RedshiftResumeClusterOperator",
        "RedshiftPauseClusterOperator",
    ]
    
    OPERATOR_TYPE = "redshift"
    PRIORITY = 10
    
    def extract_metrics(
        self,
        task_instance: Any,
        task: Optional[Any] = None,
    ) -> OperatorMetrics:
        """Extract Redshift-specific metrics."""
        task = task or self._get_task(task_instance)
        
        metrics = OperatorMetrics(
            operator_type=self.OPERATOR_TYPE,
            operator_class=self._get_operator_class(task_instance),
            connection_id=self._get_connection_id(task) if task else None,
        )
        
        if task:
            if hasattr(task, "database"):
                metrics.database = task.database
            if hasattr(task, "schema"):
                metrics.schema = task.schema
            if hasattr(task, "cluster_identifier"):
                metrics.custom_metrics = metrics.custom_metrics or {}
                metrics.custom_metrics["cluster_identifier"] = task.cluster_identifier
            if hasattr(task, "region"):
                metrics.region = task.region
                
            query = self._get_sql_query(task)
            if query:
                metrics.query_text = self._sanitize_query(query)
        
        xcom_result = self._extract_xcom_value(task_instance)
        if xcom_result is not None:
            if isinstance(xcom_result, int):
                metrics.row_count = xcom_result
            elif isinstance(xcom_result, (list, tuple)):
                metrics.row_count = len(xcom_result)
            elif isinstance(xcom_result, dict):
                if "Id" in xcom_result:
                    metrics.query_id = xcom_result["Id"]
        
        return metrics
