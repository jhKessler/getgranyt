# Operator Adapters System

The Operator Adapters system in Granyt SDK is a powerful mechanism for automatically extracting rich metadata and metrics from Airflow operators during execution. This allows Granyt to provide deep visibility into data processing tasks without requiring manual instrumentation of your DAGs.

## How It Works

When a task instance succeeds, the Granyt Airflow Listener triggers the `extract_operator_metrics` function. This function:

1.  **Identifies the Operator**: It looks at the class name of the operator being executed.
2.  **Finds a Matching Adapter**: It searches the `ADAPTER_REGISTRY` for an adapter that can handle that operator class.
3.  **Extracts Metrics**: The matching adapter's `extract_metrics` method is called to pull relevant data from the task instance and the operator object.
4.  **Captures Return Values**: For `PythonOperators`, it specifically looks for a `granyt` key in the task's return value (XCom).
5.  **Sends Data to Granyt**: The extracted metrics are then sent to the Granyt backend.

## The `OperatorMetrics` Class

The `OperatorMetrics` class is a standardized container for all captured data. Key fields include:

*   **Data Metrics**: `rows_affected`, `rows_read`, `rows_written`, `bytes_processed`, etc.
*   **Query Metrics**: `query_id`, `query_text`, `query_duration_ms`.
*   **Connection Info**: `connection_id`, `database`, `schema`, `table`, `warehouse`.
*   **Storage Metrics**: `files_processed`, `source_path`, `destination_path`.
*   **Transform Metrics**: `models_run`, `tests_passed`, `tests_failed`.
*   **Custom Metrics**: A dictionary for any operator-specific data not covered by standard fields.

## Creating a Custom Adapter

If you use custom operators or third-party operators not yet supported by Granyt, you can easily create your own adapter.

### 1. Inherit from `OperatorAdapter`

Create a new class that inherits from `granyt_sdk.integrations.airflow.operator_adapters.base.OperatorAdapter`.

```python
from granyt_sdk.integrations.airflow.operator_adapters.base import (
    OperatorAdapter,
    OperatorMetrics,
)

class MyCustomAdapter(OperatorAdapter):
    # List of operator class name patterns to match
    OPERATOR_PATTERNS = ["MyCustomOperator", "AnotherRelatedOperator"]
    
    # The normalized operator type identifier
    OPERATOR_TYPE = "my_custom"
    
    # Priority for matching (higher = checked first)
    PRIORITY = 5
    
    def extract_metrics(self, task_instance, task=None) -> OperatorMetrics:
        # Ensure we have the task object
        task = task or self._get_task(task_instance)
        
        # Initialize metrics with basic info
        metrics = OperatorMetrics(
            operator_type=self.OPERATOR_TYPE,
            operator_class=self._get_operator_class(task_instance),
            connection_id=self._get_connection_id(task) if task else None,
        )
        
        if task:
            # Extract custom attributes from your operator
            if hasattr(task, "row_count"):
                metrics.row_count = task.row_count
            
            if hasattr(task, "target_table"):
                metrics.table = task.target_table
                
            # You can also add custom metrics
            metrics.custom_metrics = {
                "api_version": getattr(task, "api_version", "v1"),
                "is_batch": getattr(task, "is_batch", True),
            }
            
        return metrics
```

### 2. Register Your Adapter

To make Granyt aware of your adapter, you need to register it using `register_adapter`.

```python
from granyt_sdk.integrations.airflow.operator_adapters import register_adapter

register_adapter(MyCustomAdapter)
```

### 3. Where to Register?

For the adapter to be active, the registration code must be executed when Airflow starts. A good place to do this is in an Airflow Plugin or within your `airflow_local_settings.py`.

```python
# In your Airflow environment (e.g., plugins/granyt_custom.py)
from granyt_sdk.integrations.airflow.operator_adapters import register_adapter
from my_package.adapters import MyCustomAdapter

register_adapter(MyCustomAdapter)
```

## Built-in Adapters

Granyt SDK comes with built-in support for many popular operators:

### SQL & Data Warehouse

| Adapter | Supported Operators | Metrics Captured |
|---------|---------------------|------------------|
| **Snowflake** | `SnowflakeOperator`, `SnowflakeSqlApiOperator`, `SnowflakeCheckOperator`, `S3ToSnowflakeOperator` | `row_count`, `query_id`, `warehouse`, `database`, `schema`, `role` |
| **BigQuery** | `BigQueryInsertJobOperator`, `BigQueryCheckOperator`, `BigQueryValueCheckOperator`, `BigQueryGetDataOperator`, `GCSToBigQueryOperator` | `bytes_processed`, `bytes_billed`, `row_count`, `query_id`, `slot_milliseconds` |
| **Generic SQL** | `SQLExecuteQueryOperator`, `SQLColumnCheckOperator`, `SQLTableCheckOperator`, `SQLCheckOperator`, `SQLValueCheckOperator`, `SQLIntervalCheckOperator`, `BranchSQLOperator` | `row_count`, `database`, `schema`, `table`, `query_text` |

### Cloud Storage

| Adapter | Supported Operators | Metrics Captured |
|---------|---------------------|------------------|
| **AWS S3** | `S3CopyObjectOperator`, `S3CreateObjectOperator`, `S3DeleteObjectsOperator`, `S3ListOperator`, `S3FileTransformOperator`, `S3CreateBucketOperator`, `S3DeleteBucketOperator` | `files_processed`, `bytes_processed`, `source_path`, `destination_path` |
| **Google Cloud Storage** | `GCSCreateBucketOperator`, `GCSListObjectsOperator`, `GCSDeleteObjectsOperator`, `GCSSynchronizeBucketsOperator`, `GCSDeleteBucketOperator`, `LocalFilesystemToGCSOperator`, `GCSToLocalFilesystemOperator` | `files_processed`, `bytes_processed`, `source_path`, `destination_path`, `region` |

### Transformation & Compute

| Adapter | Supported Operators | Metrics Captured |
|---------|---------------------|------------------|
| **Python** | `PythonOperator`, `@task` | Any key inside the `granyt` return dictionary |
| **dbt Cloud** | `DbtCloudRunJobOperator`, `DbtCloudGetJobRunArtifactOperator`, `DbtCloudListJobsOperator` | `models_run`, `tests_passed`, `tests_failed`, `row_count`, `job_id`, `account_id`, `run_id` |
| **dbt Core** | `DbtRunOperator`, `DbtTestOperator`, `DbtSeedOperator`, `DbtSnapshotOperator` | `models_run`, `tests_passed`, `tests_failed`, `row_count`, `path` |
| **Spark** | `SparkSubmitOperator`, `DataprocSubmitJobOperator`, `EmrAddStepsOperator` | `stages_completed`, `tasks_completed`, `shuffle_bytes`, `row_count` |

You can find the implementations of these adapters in `granyt_sdk.integrations.airflow.operator_adapters/`.

## Python Operator Special Keys

When using `PythonOperator` or the `@task` decorator, you can return a dictionary with a `granyt` key to send custom data to Granyt. The following special keys are recognized:

### `df_metrics`

Use `compute_df_metrics()` to automatically capture DataFrame schema and metrics:

```python
from granyt_sdk import compute_df_metrics

@task
def transform_data():
    df = pd.read_parquet("data.parquet")

    return {
        "granyt": {
            "df_metrics": compute_df_metrics(df),  # Captures schema, row count, null counts
            "custom_metric": 42,  # Any additional metrics
        }
    }
```

### `create_alert`

> **Note:** The `create_alert` feature requires granyt-sdk and granyt-app version 0.2.0 or above.

Programmatically create alerts from your DAG. This is useful for custom data validation, business rule violations, or any condition you want to surface as an alert in the Granyt dashboard:

```python
@task
def validate_data():
    df = pd.read_parquet("data.parquet")
    invalid_count = (df['status'] == 'invalid').sum()

    alert = None
    if invalid_count > 100:
        alert = {
            "title": f"High invalid record count: {invalid_count}",
            "description": "Found more than 100 invalid records in the data pipeline",
            "send_notification": True  # Optional, defaults to False
        }

    return {
        "granyt": {
            "df_metrics": compute_df_metrics(df),
            "create_alert": alert  # None = no alert created
        }
    }
```

**Alert Fields:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `title` | string | Yes | - | Alert title (max 200 chars) |
| `description` | string | No | - | Detailed description (max 2000 chars) |
| `send_notification` | bool | No | `False` | Send email notification to team |

**Notes:**
- Setting `create_alert` to `None` or omitting it entirely will not create an alert
- Alerts created this way appear in the Granyt dashboard with type `USER_CREATED`
- When `send_notification` is `True`, an email is sent to team members subscribed to alerts
