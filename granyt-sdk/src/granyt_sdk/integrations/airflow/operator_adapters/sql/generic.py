import logging
from typing import Any, Optional

from granyt_sdk.integrations.airflow.operator_adapters.base import (
    OperatorAdapter,
    OperatorMetrics,
)

logger = logging.getLogger(__name__)


class GenericSQLAdapter(OperatorAdapter):
    """Generic adapter for SQL operators that don't have a specific adapter.
    
    This is a fallback adapter for any SQL-based operator.
    """
    
    OPERATOR_PATTERNS = [
        "SQLOperator",
        "SqlOperator",
        "SQLCheckOperator",
        "SQLValueCheckOperator",
        "SQLIntervalCheckOperator",
        "SQLThresholdCheckOperator",
        "SQLColumnCheckOperator",
        "SQLTableCheckOperator",
        "BaseSQLOperator",
        "JdbcOperator",
        "OracleOperator",
        "MsSqlOperator",
        "TrinoOperator",
        "PrestoOperator",
        "DruidOperator",
        "VerticaOperator",
        "SqliteOperator",
    ]
    
    OPERATOR_TYPE = "generic_sql"
    PRIORITY = 1  # Low priority - use as fallback
    
    def extract_metrics(
        self,
        task_instance: Any,
        task: Optional[Any] = None,
    ) -> OperatorMetrics:
        """Extract generic SQL metrics."""
        task = task or self._get_task(task_instance)
        
        metrics = OperatorMetrics(
            operator_type=self.OPERATOR_TYPE,
            operator_class=self._get_operator_class(task_instance),
            connection_id=self._get_connection_id(task) if task else None,
        )
        
        if task:
            # Try common SQL attributes
            for attr in ["database", "db", "database_name"]:
                if hasattr(task, attr):
                    metrics.database = getattr(task, attr)
                    break
            
            for attr in ["schema", "schema_name"]:
                if hasattr(task, attr):
                    metrics.schema = getattr(task, attr)
                    break
            
            query = self._get_sql_query(task)
            if query:
                metrics.query_text = self._sanitize_query(query)
        
        xcom_result = self._extract_xcom_value(task_instance)
        if xcom_result is not None:
            if isinstance(xcom_result, int):
                metrics.row_count = xcom_result
            elif isinstance(xcom_result, (list, tuple)):
                metrics.row_count = len(xcom_result)
        
        return metrics
