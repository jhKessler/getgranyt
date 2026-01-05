import logging
from typing import Any, Optional

from granyt_sdk.integrations.airflow.operator_adapters.base import (
    OperatorAdapter,
    OperatorMetrics,
)

logger = logging.getLogger(__name__)


class MySQLAdapter(OperatorAdapter):
    """Adapter for MySQL operators.
    
    Extracts metrics from:
    - MySqlOperator
    - MySqlCheckOperator
    - MySqlHook operations
    - etc.
    """
    
    OPERATOR_PATTERNS = [
        "MySqlOperator",
        "MySqlCheckOperator",
        "MySqlValueCheckOperator",
        "MySqlIntervalCheckOperator",
        "MySqlHook",
        "MysqlOperator",
        "MysqlToS3",
        "S3ToMysql",
    ]
    
    OPERATOR_TYPE = "mysql"
    PRIORITY = 10
    
    def extract_metrics(
        self,
        task_instance: Any,
        task: Optional[Any] = None,
    ) -> OperatorMetrics:
        """Extract MySQL-specific metrics."""
        task = task or self._get_task(task_instance)
        
        metrics = OperatorMetrics(
            operator_type=self.OPERATOR_TYPE,
            operator_class=self._get_operator_class(task_instance),
            connection_id=self._get_connection_id(task) if task else None,
        )
        
        if task:
            if hasattr(task, "database"):
                metrics.database = task.database
                
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
