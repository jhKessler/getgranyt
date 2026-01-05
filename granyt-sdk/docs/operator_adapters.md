# Operator Adapters System

The Operator Adapters system in Granyt SDK is a powerful mechanism for automatically extracting rich metadata and metrics from Airflow operators during execution. This allows Granyt to provide deep visibility into data processing tasks without requiring manual instrumentation of your DAGs.

## How It Works

When a task instance succeeds, the Granyt Airflow Listener triggers the `extract_operator_metrics` function. This function:

1.  **Identifies the Operator**: It looks at the class name of the operator being executed.
2.  **Finds a Matching Adapter**: It searches the `ADAPTER_REGISTRY` for an adapter that can handle that operator class.
3.  **Extracts Metrics**: The matching adapter's `extract_metrics` method is called to pull relevant data from the task instance and the operator object.
4.  **Sends Data to Granyt**: The extracted `OperatorMetrics` are then sent to the Granyt backend.

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

*   **SQL**: Snowflake, BigQuery, Postgres, MySQL, Redshift, and a Generic SQL adapter.
*   **Storage**: S3, GCS, Azure Blob Storage.
*   **Transform**: dbt (via `DbtCloudOperator` or `DbtRunOperator`), Spark.
*   **Utilities**: Python, Bash, HTTP, Email.

You can find the implementations of these adapters in `granyt_sdk.integrations.airflow.operator_adapters/`.
