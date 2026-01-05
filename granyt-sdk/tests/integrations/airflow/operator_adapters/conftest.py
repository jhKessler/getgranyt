"""
Shared fixtures for operator adapter tests.
"""

import pytest
from unittest.mock import MagicMock


@pytest.fixture
def mock_task_instance():
    """Create a mock task instance."""
    ti = MagicMock()
    ti.task_id = "test_task"
    ti.dag_id = "test_dag"
    ti.run_id = "test_run_2024"
    ti.xcom_pull = MagicMock(return_value=None)
    return ti


@pytest.fixture
def mock_task():
    """Create a mock task/operator."""
    task = MagicMock()
    task.__class__.__name__ = "MockOperator"
    task.__class__.__module__ = "airflow.operators.mock"
    return task


@pytest.fixture
def mock_snowflake_task():
    """Create a mock Snowflake operator.
    
    Documented attributes from:
    https://airflow.apache.org/docs/apache-airflow-providers-snowflake/stable/_api/airflow/providers/snowflake/operators/snowflake/index.html
    
    Confirmed attributes:
    - snowflake_conn_id: Connection ID for Snowflake
    - warehouse: Snowflake warehouse name
    - database: Database name
    - schema: Schema name
    - role: Snowflake role
    - sql: SQL query or list of queries
    - parameters: Parameters to render SQL
    - autocommit: Whether to autocommit
    """
    task = MagicMock()
    task.__class__.__name__ = "SnowflakeOperator"
    task.__class__.__module__ = "airflow.providers.snowflake.operators.snowflake"
    task.snowflake_conn_id = "snowflake_default"
    task.warehouse = "COMPUTE_WH"
    task.database = "ANALYTICS_DB"
    task.schema = "PUBLIC"
    task.role = "ANALYST_ROLE"
    task.sql = "SELECT * FROM users"
    task.query_ids = ["01ab2345-6789-cdef-0123-456789abcdef"]
    return task


@pytest.fixture
def mock_bigquery_task():
    """Create a mock BigQuery operator.
    
    Documented attributes from:
    https://airflow.apache.org/docs/apache-airflow-providers-google/stable/_api/airflow/providers/google/cloud/operators/bigquery/index.html
    
    Confirmed attributes for BigQueryInsertJobOperator:
    - configuration: Job configuration dictionary
    - job_id: Optional job ID
    - project_id: Google Cloud project ID
    - location: BigQuery dataset location
    - gcp_conn_id: Connection ID for GCP
    
    Confirmed attributes for BigQueryCheckOperator:
    - sql: SQL query
    - gcp_conn_id: Connection ID
    - use_legacy_sql: Whether to use legacy SQL
    - location: Dataset location
    """
    task = MagicMock()
    task.__class__.__name__ = "BigQueryInsertJobOperator"
    task.__class__.__module__ = "airflow.providers.google.cloud.operators.bigquery"
    task.gcp_conn_id = "google_cloud_default"
    task.project_id = "my-gcp-project"
    task.dataset_id = "analytics"
    task.table_id = "events"
    task.location = "US"
    task.job_id = "bq_job_12345"
    task.sql = "SELECT COUNT(*) FROM `my-gcp-project.analytics.events`"
    return task


@pytest.fixture
def mock_s3_copy_task():
    """Create a mock S3CopyObjectOperator.
    
    Documented attributes from:
    https://airflow.apache.org/docs/apache-airflow-providers-amazon/stable/_api/airflow/providers/amazon/aws/operators/s3/index.html
    
    Confirmed attributes for S3CopyObjectOperator:
    - source_bucket_key: Source bucket/key path
    - dest_bucket_key: Destination bucket/key path
    - source_bucket_name: Source bucket name
    - dest_bucket_name: Destination bucket name
    - source_version_id: Source object version
    - acl_policy: ACL policy for destination
    """
    task = MagicMock()
    task.__class__.__name__ = "S3CopyObjectOperator"
    task.__class__.__module__ = "airflow.providers.amazon.aws.operators.s3"
    task.aws_conn_id = "aws_default"
    task.source_bucket = "source-bucket"
    task.source_key = "data/input.csv"
    task.dest_bucket = "dest-bucket"
    task.dest_key = "processed/output.csv"
    task.source_bucket_key = "s3://source-bucket/data/input.csv"
    task.dest_bucket_key = "s3://dest-bucket/processed/output.csv"
    return task


@pytest.fixture
def mock_s3_delete_task():
    """Create a mock S3DeleteObjectsOperator.
    
    Documented attributes from:
    https://airflow.apache.org/docs/apache-airflow-providers-amazon/stable/_api/airflow/providers/amazon/aws/operators/s3/index.html
    
    Confirmed attributes for S3DeleteObjectsOperator:
    - bucket: Bucket name
    - keys: List of keys to delete
    - prefix: Prefix to filter objects for deletion
    - from_datetime: Filter objects modified after this datetime
    - to_datetime: Filter objects modified before this datetime
    """
    task = MagicMock()
    task.__class__.__name__ = "S3DeleteObjectsOperator"
    task.__class__.__module__ = "airflow.providers.amazon.aws.operators.s3"
    task.aws_conn_id = "aws_default"
    task.bucket = "my-bucket"
    task.keys = ["file1.csv", "file2.csv", "file3.csv"]
    task.prefix = "temp/"
    return task


@pytest.fixture
def mock_s3_list_task():
    """Create a mock S3ListOperator.
    
    Documented attributes from:
    https://airflow.apache.org/docs/apache-airflow-providers-amazon/stable/_api/airflow/providers/amazon/aws/operators/s3/index.html
    
    Confirmed attributes for S3ListOperator:
    - bucket: Bucket name to list
    - prefix: Prefix to filter objects
    - delimiter: Delimiter for grouping results
    - apply_wildcard: Whether to apply wildcard matching
    """
    task = MagicMock()
    task.__class__.__name__ = "S3ListOperator"
    task.__class__.__module__ = "airflow.providers.amazon.aws.operators.s3"
    task.aws_conn_id = "aws_default"
    task.bucket = "data-lake"
    task.prefix = "raw/2024/"
    task.delimiter = "/"
    return task


@pytest.fixture
def mock_gcs_create_bucket_task():
    """Create a mock GCSCreateBucketOperator.
    
    Documented attributes from:
    https://airflow.apache.org/docs/apache-airflow-providers-google/stable/_api/airflow/providers/google/cloud/operators/gcs/index.html
    
    Confirmed attributes for GCSCreateBucketOperator:
    - bucket_name: Name of the bucket to create
    - storage_class: Storage class (MULTI_REGIONAL, REGIONAL, STANDARD, etc.)
    - location: Bucket location (US, EU, etc.)
    - project_id: Google Cloud project ID
    - labels: User-provided labels
    - gcp_conn_id: Connection ID for GCP
    """
    task = MagicMock()
    task.__class__.__name__ = "GCSCreateBucketOperator"
    task.__class__.__module__ = "airflow.providers.google.cloud.operators.gcs"
    task.gcp_conn_id = "google_cloud_default"
    task.bucket_name = "new-data-bucket"
    task.storage_class = "STANDARD"
    task.location = "US"
    task.project_id = "my-gcp-project"
    task.labels = {"env": "dev", "team": "data"}
    # GCSCreateBucketOperator doesn't have destination_bucket/destination_object
    # The adapter will use bucket_name as source_path
    return task


@pytest.fixture
def mock_gcs_list_task():
    """Create a mock GCSListObjectsOperator.
    
    Documented attributes from:
    https://airflow.apache.org/docs/apache-airflow-providers-google/stable/_api/airflow/providers/google/cloud/operators/gcs/index.html
    
    Confirmed attributes for GCSListObjectsOperator:
    - bucket: Bucket name to list
    - prefix: Prefix to filter objects
    - delimiter: Delimiter for hierarchical listing
    - gcp_conn_id: Connection ID
    - match_glob: Glob pattern for filtering
    """
    task = MagicMock()
    task.__class__.__name__ = "GCSListObjectsOperator"
    task.__class__.__module__ = "airflow.providers.google.cloud.operators.gcs"
    task.gcp_conn_id = "google_cloud_default"
    task.bucket = "data-bucket"
    task.prefix = "raw/events/"
    task.delimiter = "/"
    task.match_glob = "**/*.parquet"
    return task


@pytest.fixture
def mock_gcs_delete_task():
    """Create a mock GCSDeleteObjectsOperator.
    
    Documented attributes from:
    https://airflow.apache.org/docs/apache-airflow-providers-google/stable/_api/airflow/providers/google/cloud/operators/gcs/index.html
    
    Confirmed attributes for GCSDeleteObjectsOperator:
    - bucket_name: GCS bucket name
    - objects: List of object names to delete
    - prefix: Prefix to filter objects for deletion
    - gcp_conn_id: Connection ID
    """
    task = MagicMock()
    task.__class__.__name__ = "GCSDeleteObjectsOperator"
    task.__class__.__module__ = "airflow.providers.google.cloud.operators.gcs"
    task.gcp_conn_id = "google_cloud_default"
    task.bucket_name = "cleanup-bucket"
    task.objects = ["temp1.csv", "temp2.csv"]
    task.prefix = "staging/"
    return task


@pytest.fixture
def mock_sql_execute_task():
    """Create a mock SQLExecuteQueryOperator.
    
    Documented attributes from:
    https://airflow.apache.org/docs/apache-airflow-providers-common-sql/stable/_api/airflow/providers/common/sql/operators/sql/index.html
    
    Confirmed attributes for SQLExecuteQueryOperator:
    - sql: SQL code to execute
    - autocommit: Whether to autocommit each command
    - parameters: Parameters to render the SQL query
    - conn_id: Connection ID for the database
    - database: Database name to use
    - split_statements: Whether to split SQL into statements
    - return_last: Whether to return only last statement result
    """
    task = MagicMock()
    task.__class__.__name__ = "SQLExecuteQueryOperator"
    task.__class__.__module__ = "airflow.providers.common.sql.operators.sql"
    task.conn_id = "postgres_default"
    task.database = "warehouse"
    task.schema = "analytics"
    task.sql = "INSERT INTO events SELECT * FROM staging_events"
    task.autocommit = True
    task.parameters = {"date": "2024-01-01"}
    return task


@pytest.fixture
def mock_sql_check_task():
    """Create a mock SQLCheckOperator.
    
    Documented attributes from:
    https://airflow.apache.org/docs/apache-airflow-providers-common-sql/stable/_api/airflow/providers/common/sql/operators/sql/index.html
    
    Confirmed attributes for SQLCheckOperator:
    - sql: SQL code to execute (templated)
    - conn_id: Connection ID for the database
    - database: Database name
    - parameters: Parameters to render SQL
    """
    task = MagicMock()
    task.__class__.__name__ = "SQLCheckOperator"
    task.__class__.__module__ = "airflow.providers.common.sql.operators.sql"
    task.conn_id = "mysql_default"
    task.database = "production"
    task.sql = "SELECT COUNT(*) FROM orders WHERE date = '2024-01-01'"
    task.parameters = None
    return task


@pytest.fixture
def mock_dbt_cloud_run_task():
    """Create a mock DbtCloudRunJobOperator.
    
    Documented attributes from:
    https://airflow.apache.org/docs/apache-airflow-providers-dbt-cloud/stable/_api/airflow/providers/dbt/cloud/operators/dbt/index.html
    
    Confirmed attributes for DbtCloudRunJobOperator:
    - dbt_cloud_conn_id: Connection ID for dbt Cloud
    - job_id: ID of dbt Cloud job
    - account_id: dbt Cloud account ID
    - project_name: Name of dbt Cloud project
    - environment_name: Name of dbt Cloud environment
    - job_name: Name of the dbt Cloud job
    - trigger_reason: Description of why job was triggered
    - steps_override: List of dbt commands to override
    - schema_override: Override destination schema
    - wait_for_termination: Whether to wait for job to complete
    - timeout: Timeout in seconds
    - check_interval: Interval to check job status
    """
    task = MagicMock()
    task.__class__.__name__ = "DbtCloudRunJobOperator"
    task.__class__.__module__ = "airflow.providers.dbt.cloud.operators.dbt"
    task.dbt_cloud_conn_id = "dbt_cloud_default"
    task.job_id = 12345
    task.account_id = 67890
    task.project_name = "analytics_project"
    task.job_name = "daily_models"
    task.wait_for_termination = True
    task.timeout = 3600
    task.check_interval = 30
    return task


@pytest.fixture
def mock_dbt_artifact_task():
    """Create a mock DbtCloudGetJobRunArtifactOperator.
    
    Documented attributes from:
    https://airflow.apache.org/docs/apache-airflow-providers-dbt-cloud/stable/_api/airflow/providers/dbt/cloud/operators/dbt/index.html
    
    Confirmed attributes for DbtCloudGetJobRunArtifactOperator:
    - dbt_cloud_conn_id: Connection ID for dbt Cloud
    - run_id: ID of the dbt Cloud job run
    - path: File path for the artifact (e.g., "manifest.json")
    - account_id: dbt Cloud account ID
    - step: Index of the step to get artifacts from
    - output_file_name: Desired output file name
    """
    task = MagicMock()
    task.__class__.__name__ = "DbtCloudGetJobRunArtifactOperator"
    task.__class__.__module__ = "airflow.providers.dbt.cloud.operators.dbt"
    task.dbt_cloud_conn_id = "dbt_cloud_default"
    task.run_id = 98765
    task.path = "manifest.json"
    task.account_id = 67890
    task.step = 1
    task.output_file_name = "98765_manifest.json"
    return task
