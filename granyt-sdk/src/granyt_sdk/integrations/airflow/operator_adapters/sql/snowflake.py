import logging
from typing import Any, Optional

from granyt_sdk.integrations.airflow.operator_adapters.base import (
    OperatorAdapter,
    OperatorMetrics,
)

logger = logging.getLogger(__name__)


class SnowflakeAdapter(OperatorAdapter):
    """Adapter for Snowflake operators.
    
    Extracts metrics from:
    - SnowflakeOperator
    - SnowflakeSqlApiOperator
    - SnowflakeCheckOperator
    - S3ToSnowflakeOperator
    - SnowflakeToSlackOperator
    - etc.
    
    Captured metrics:
    - row_count: Number of rows affected or read
    - query_id: Snowflake query ID for tracing
    - warehouse: Snowflake warehouse used
    - database: Database name
    - schema: Schema name
    - query_duration_ms: Execution time
    """
    
    OPERATOR_PATTERNS = [
        "SnowflakeOperator",
        "SnowflakeSqlApiOperator",
        "SnowflakeCheckOperator",
        "SnowflakeValueCheckOperator",
        "SnowflakeIntervalCheckOperator",
        "S3ToSnowflake",
        "SnowflakeToS3",
        "SnowflakeToSlack",
        "SnowflakeToGCS",
        "GCSToSnowflake",
        "SnowflakeSensor",
    ]
    
    OPERATOR_TYPE = "snowflake"
    PRIORITY = 10
    
    def extract_metrics(
        self,
        task_instance: Any,
        task: Optional[Any] = None,
    ) -> OperatorMetrics:
        """Extract Snowflake-specific metrics."""
        task = task or self._get_task(task_instance)
        
        metrics = OperatorMetrics(
            operator_type=self.OPERATOR_TYPE,
            operator_class=self._get_operator_class(task_instance),
            connection_id=self._get_connection_id(task) if task else None,
        )
        
        if task:
            # Extract Snowflake-specific attributes
            if hasattr(task, "warehouse"):
                metrics.warehouse = task.warehouse
            if hasattr(task, "database"):
                metrics.database = task.database
            if hasattr(task, "schema"):
                metrics.schema = task.schema
            if hasattr(task, "role"):
                metrics.custom_metrics = metrics.custom_metrics or {}
                metrics.custom_metrics["role"] = task.role
            
            # Extract SQL query
            query = self._get_sql_query(task)
            if query:
                metrics.query_text = self._sanitize_query(query)
        
        # Try to get execution results from XCom
        # Snowflake operators often return query results
        xcom_result = self._extract_xcom_value(task_instance)
        if xcom_result:
            self._parse_snowflake_result(metrics, xcom_result)
        
        # Try to get query ID from task state
        if task and hasattr(task, "query_ids"):
            query_ids = task.query_ids
            if query_ids:
                metrics.query_id = query_ids[0] if isinstance(query_ids, list) else str(query_ids)
        
        return metrics
    
    def _parse_snowflake_result(
        self,
        metrics: OperatorMetrics,
        result: Any,
    ) -> None:
        """Parse Snowflake query result for metrics."""
        if isinstance(result, dict):
            # Handle dict result
            if "rows_affected" in result:
                metrics.row_count = result["rows_affected"]
            if "query_id" in result:
                metrics.query_id = result["query_id"]
            if "rowcount" in result:
                metrics.row_count = result["rowcount"]
                
        elif isinstance(result, (list, tuple)):
            # Result is likely rows - count them
            metrics.row_count = len(result)
            
        elif hasattr(result, "rowcount"):
            # Cursor-like result
            metrics.row_count = result.rowcount
