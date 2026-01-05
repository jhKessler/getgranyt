import logging
from typing import Any, Optional

from granyt_sdk.integrations.airflow.operator_adapters.base import (
    OperatorAdapter,
    OperatorMetrics,
)

logger = logging.getLogger(__name__)


class PostgresAdapter(OperatorAdapter):
    """Adapter for PostgreSQL operators.
    
    Extracts metrics from:
    - PostgresOperator
    - PostgresHook operations
    - PostgresCheckOperator
    - etc.
    
    Captured metrics:
    - row_count: Rows affected by DML or read by SELECT
    - query_duration_ms: Execution time
    - database: Database name
    - schema: Schema name
    """
    
    OPERATOR_PATTERNS = [
        "PostgresOperator",
        "PostgresCheckOperator",
        "PostgresValueCheckOperator",
        "PostgresIntervalCheckOperator",
        "PostgresHook",
        "PostgreSQLOperator",
        "PostgresqlOperator",
    ]
    
    OPERATOR_TYPE = "postgres"
    PRIORITY = 10
    
    def extract_metrics(
        self,
        task_instance: Any,
        task: Optional[Any] = None,
    ) -> OperatorMetrics:
        """Extract Postgres-specific metrics."""
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
                
            query = self._get_sql_query(task)
            if query:
                metrics.query_text = self._sanitize_query(query)

            # Extract additional metadata
            custom = {}
            if hasattr(task, "owner"):
                custom["owner"] = task.owner
            if hasattr(task, "autocommit"):
                custom["autocommit"] = task.autocommit
            if hasattr(task, "parameters") and task.parameters:
                custom["parameters"] = str(task.parameters)
            
            # Lineage
            if hasattr(task, "inlets") and task.inlets:
                custom["inlets"] = [str(i.uri) if hasattr(i, "uri") else str(i) for i in task.inlets]
            if hasattr(task, "outlets") and task.outlets:
                custom["outlets"] = [str(o.uri) if hasattr(o, "uri") else str(o) for o in task.outlets]
                
            if custom:
                metrics.custom_metrics = custom
        
        # Try to get row count from XCom
        xcom_result = self._extract_xcom_value(task_instance)
        if xcom_result is not None:
            if isinstance(xcom_result, int):
                metrics.row_count = xcom_result
            elif isinstance(xcom_result, (list, tuple)):
                metrics.row_count = len(xcom_result)
        
        return metrics
