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

SQL & Data Warehouse:
- Snowflake: SnowflakeOperator, SnowflakeSqlApiOperator, SnowflakeCheckOperator, S3ToSnowflakeOperator
  Metrics: row_count, query_id, warehouse, database, schema, role

- BigQuery: BigQueryInsertJobOperator, BigQueryCheckOperator, BigQueryValueCheckOperator,
            BigQueryGetDataOperator, GCSToBigQueryOperator
  Metrics: bytes_processed, bytes_billed, row_count, query_id, slot_milliseconds

- Generic SQL: SQLExecuteQueryOperator, SQLColumnCheckOperator, SQLTableCheckOperator,
               SQLCheckOperator, SQLValueCheckOperator, SQLIntervalCheckOperator, BranchSQLOperator
  Metrics: row_count, database, schema, table, query_text

Cloud Storage:
- AWS S3: S3CopyObjectOperator, S3CreateObjectOperator, S3DeleteObjectsOperator, S3ListOperator,
          S3FileTransformOperator, S3CreateBucketOperator, S3DeleteBucketOperator
  Metrics: files_processed, bytes_processed, source_path, destination_path

- Google Cloud Storage: GCSCreateBucketOperator, GCSListObjectsOperator, GCSDeleteObjectsOperator,
                        GCSSynchronizeBucketsOperator, GCSDeleteBucketOperator, LocalFilesystemToGCSOperator
  Metrics: files_processed, bytes_processed, source_path, destination_path, region

Transformation & Compute:
- dbt Cloud: DbtCloudRunJobOperator, DbtCloudGetJobRunArtifactOperator, DbtCloudListJobsOperator
  Metrics: models_run, tests_passed, tests_failed, row_count, job_id, account_id, run_id

- dbt Core: DbtRunOperator, DbtTestOperator, DbtSeedOperator, DbtSnapshotOperator
  Metrics: models_run, tests_passed, tests_failed, row_count, path

- Spark: SparkSubmitOperator, DataprocSubmitJobOperator, EmrAddStepsOperator
  Metrics: stages_completed, tasks_completed, shuffle_bytes, row_count
"""

from granyt_sdk.integrations.airflow.operator_adapters.base import (
    ADAPTER_REGISTRY,
    OperatorAdapter,
    OperatorMetrics,
    extract_operator_metrics,
    get_adapter_for_task,
    register_adapter,
)
from granyt_sdk.integrations.airflow.operator_adapters.sql import (
    BigQueryAdapter,
    GenericSQLAdapter,
    MySQLAdapter,
    PostgresAdapter,
    RedshiftAdapter,
    SnowflakeAdapter,
    register_sql_adapters,
)
from granyt_sdk.integrations.airflow.operator_adapters.storage import (
    AzureBlobAdapter,
    GCSAdapter,
    S3Adapter,
    register_storage_adapters,
)
from granyt_sdk.integrations.airflow.operator_adapters.transform import (
    BashAdapter,
    DbtAdapter,
    EmailAdapter,
    HttpAdapter,
    PythonAdapter,
    SparkAdapter,
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
