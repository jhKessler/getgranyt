import logging
from typing import Any, Optional

from granyt_sdk.integrations.airflow.operator_adapters.base import (
    OperatorAdapter,
    OperatorMetrics,
)

logger = logging.getLogger(__name__)


class GenericSQLAdapter(OperatorAdapter):
    """Generic adapter for SQL operators that don't have a specific adapter.
    
    This adapter handles common SQL operators from the apache-airflow-providers-common-sql package.
    
    Supported operators:
    - SQLExecuteQueryOperator
    - SQLColumnCheckOperator
    - SQLTableCheckOperator
    - SQLCheckOperator
    - SQLValueCheckOperator
    - SQLIntervalCheckOperator
    - SQLThresholdCheckOperator
    - BranchSQLOperator
    - BaseSQLOperator
    - And various database-specific operators as fallback
    
    Captured metrics:
    - database: Database name
    - schema: Schema name
    - table: Table name (for check operators)
    - connection_id: Connection ID (conn_id)
    - query_text: SQL query executed
    - row_count: Number of rows from XCom result
    
    Documentation references:
    - https://airflow.apache.org/docs/apache-airflow-providers-common-sql/stable/_api/airflow/providers/common/sql/operators/sql/index.html
    """
    
    OPERATOR_PATTERNS = [
        # Common SQL operators (from apache-airflow-providers-common-sql)
        "SQLExecuteQueryOperator",
        "SQLColumnCheckOperator",
        "SQLTableCheckOperator",
        "SQLCheckOperator",
        "SQLValueCheckOperator",
        "SQLIntervalCheckOperator",
        "SQLThresholdCheckOperator",
        "BranchSQLOperator",
        "BaseSQLOperator",
        # Legacy/generic patterns
        "SQLOperator",
        "SqlOperator",
        # Database-specific fallbacks
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
            # database - documented parameter for SQLExecuteQueryOperator
            # Ref: https://airflow.apache.org/docs/apache-airflow-providers-common-sql/stable/_api/airflow/providers/common/sql/operators/sql/index.html
            for attr in ["database", "db", "database_name"]:
                if hasattr(task, attr):
                    val = getattr(task, attr)
                    if val and isinstance(val, str):
                        metrics.database = val
                        break
            
            # schema - documented parameter
            for attr in ["schema", "schema_name"]:
                if hasattr(task, attr):
                    val = getattr(task, attr)
                    if val and isinstance(val, str):
                        metrics.schema = val
                        break
            
            # table - documented parameter for SQLColumnCheckOperator, SQLTableCheckOperator
            # Ref: https://airflow.apache.org/docs/apache-airflow-providers-common-sql/stable/_api/airflow/providers/common/sql/operators/sql/index.html#airflow.providers.common.sql.operators.sql.SQLColumnCheckOperator
            if hasattr(task, "table"):
                table = getattr(task, "table")
                if table and isinstance(table, str):
                    metrics.table = table
            
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
