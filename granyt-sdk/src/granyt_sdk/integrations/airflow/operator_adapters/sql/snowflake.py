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
    - connection_id: Snowflake connection ID (snowflake_conn_id)
    - role: Snowflake role used (in custom_metrics)
    
    Documentation references:
    - https://airflow.apache.org/docs/apache-airflow-providers-snowflake/stable/_api/airflow/providers/snowflake/operators/snowflake/index.html
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
    
    def _get_connection_id(self, task: Any) -> Optional[str]:
        """Extract Snowflake connection ID.
        
        Snowflake operators use snowflake_conn_id parameter.
        Ref: https://airflow.apache.org/docs/apache-airflow-providers-snowflake/stable/_api/airflow/providers/snowflake/operators/snowflake/index.html#airflow.providers.snowflake.operators.snowflake.SnowflakeOperator
        """
        if hasattr(task, "snowflake_conn_id"):
            conn_id = getattr(task, "snowflake_conn_id")
            if conn_id and isinstance(conn_id, str):
                return conn_id
        # Fallback to parent implementation
        return super()._get_connection_id(task)
    
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
            # warehouse - documented parameter
            # Ref: https://airflow.apache.org/docs/apache-airflow-providers-snowflake/stable/_api/airflow/providers/snowflake/operators/snowflake/index.html#airflow.providers.snowflake.operators.snowflake.SnowflakeOperator
            if hasattr(task, "warehouse"):
                warehouse = getattr(task, "warehouse")
                if warehouse and isinstance(warehouse, str):
                    metrics.warehouse = warehouse
            
            # database - documented parameter
            if hasattr(task, "database"):
                database = getattr(task, "database")
                if database and isinstance(database, str):
                    metrics.database = database
            
            # schema - documented parameter
            if hasattr(task, "schema"):
                schema = getattr(task, "schema")
                if schema and isinstance(schema, str):
                    metrics.schema = schema
            
            # role - documented parameter, stored in custom_metrics
            if hasattr(task, "role"):
                role = getattr(task, "role")
                if role and isinstance(role, str):
                    metrics.custom_metrics = metrics.custom_metrics or {}
                    metrics.custom_metrics["role"] = role
            
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
        # Note: query_ids is populated after execution
        if task and hasattr(task, "query_ids"):
            query_ids = getattr(task, "query_ids")
            if query_ids:
                if isinstance(query_ids, list) and len(query_ids) > 0:
                    first_id = query_ids[0]
                    if isinstance(first_id, str):
                        metrics.query_id = first_id
                elif isinstance(query_ids, str):
                    metrics.query_id = query_ids
        
        return metrics
    
    def _parse_snowflake_result(
        self,
        metrics: OperatorMetrics,
        result: Any,
    ) -> None:
        """Parse Snowflake query result for metrics.
        
        Snowflake XCom result can include:
        - rows_affected: Number of rows affected by DML
        - query_id: Snowflake query ID
        - rowcount: Row count from cursor
        """
        if isinstance(result, dict):
            # Handle dict result
            if "rows_affected" in result:
                metrics.row_count = result["rows_affected"]
            if "query_id" in result:
                query_id = result["query_id"]
                if isinstance(query_id, str):
                    metrics.query_id = query_id
            if "rowcount" in result:
                metrics.row_count = result["rowcount"]
                
        elif isinstance(result, (list, tuple)):
            # Result is likely rows - count them
            metrics.row_count = len(result)
            
        elif hasattr(result, "rowcount"):
            # Cursor-like result
            metrics.row_count = result.rowcount
