"""
Operator Adapters for Granyt SDK.

This module provides automatic detection and metadata extraction from
popular Airflow operators. When a task runs, Granyt automatically
detects the operator type and extracts relevant metrics like:
- Rows processed
- Query execution stats
- Connection information
- Data transfer metrics

Supported Operators:
- Snowflake operators (rows affected, query ID, warehouse, etc.)
- BigQuery operators (bytes processed, slot milliseconds, etc.)
- Postgres/MySQL/SQL operators (rows affected, query stats)
- S3/GCS operators (files transferred, bytes transferred)
- dbt operators (model stats, test results)
- Spark operators (stages, tasks, shuffle stats)
"""

from granyt_sdk.integrations.airflow.operator_adapters.base import (
    OperatorAdapter,
    OperatorMetrics,
    get_adapter_for_task,
    register_adapter,
    extract_operator_metrics,
    ADAPTER_REGISTRY,
)
from granyt_sdk.integrations.airflow.operator_adapters.sql import (
    SnowflakeAdapter,
    BigQueryAdapter,
    PostgresAdapter,
    MySQLAdapter,
    RedshiftAdapter,
    GenericSQLAdapter,
    register_sql_adapters,
)
from granyt_sdk.integrations.airflow.operator_adapters.storage import (
    S3Adapter,
    GCSAdapter,
    AzureBlobAdapter,
    register_storage_adapters,
)
from granyt_sdk.integrations.airflow.operator_adapters.transform import (
    DbtAdapter,
    SparkAdapter,
    PythonAdapter,
    BashAdapter,
    EmailAdapter,
    HttpAdapter,
    register_transform_adapters,
)

# Register all adapters
register_sql_adapters()
register_storage_adapters()
register_transform_adapters()

__all__ = [
    # Base classes
    "OperatorAdapter",
    "OperatorMetrics",
    "get_adapter_for_task",
    "register_adapter",
    "extract_operator_metrics",
    "ADAPTER_REGISTRY",
    # SQL adapters
    "SnowflakeAdapter",
    "BigQueryAdapter", 
    "PostgresAdapter",
    "MySQLAdapter",
    "RedshiftAdapter",
    "GenericSQLAdapter",
    # Storage adapters
    "S3Adapter",
    "GCSAdapter",
    "AzureBlobAdapter",
    # Transform adapters
    "DbtAdapter",
    "SparkAdapter",
    "PythonAdapter",
    "BashAdapter",
    "EmailAdapter",
    "HttpAdapter",
]
