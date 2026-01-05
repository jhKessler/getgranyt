# Granyt SDK for Apache Airflow

Granyt SDK is a Python package that integrates with Apache Airflow to automatically capture lineage data and rich error information, sending it to your Granyt backend for monitoring and observability.

## Features

- **Automatic Lineage Tracking**: Captures DAG/task run status using OpenLineage without any manual instrumentation
- **Rich Error Capture**: Sentry-like error capturing with full stack traces, context variables, and system information
- **Zero Configuration**: Just install and set environment variables - no code changes required
- **Production Ready**: Built for reliability with retry logic, async processing, and graceful degradation

## Installation

```bash
pip install granyt-sdk
```

## Configuration

Set the following environment variables:

```bash
export GRANYT_ENDPOINT="https://your-granyt-backend.com"
export GRANYT_API_KEY="your-api-key"
```

### Multi-Endpoint Configuration

To send events to multiple Granyt backends simultaneously (e.g., for dev/prod mirroring or multi-region deployments), use the `GRANYT_ENDPOINTS` environment variable with a JSON array:

```bash
export GRANYT_ENDPOINTS='[{"endpoint":"https://prod.granyt.io","api_key":"prod-key"},{"endpoint":"https://dev.granyt.io","api_key":"dev-key"}]'
```

When `GRANYT_ENDPOINTS` is set, it takes precedence over `GRANYT_ENDPOINT`/`GRANYT_API_KEY`. Events are broadcast to all configured endpoints in parallel, with warnings logged for any failures. The SDK considers an event successfully sent if at least one endpoint receives it.

### Optional Configuration

```bash
# Enable debug mode for verbose logging
export GRANYT_DEBUG="true"

# Set custom namespace for lineage events
export GRANYT_NAMESPACE="my-airflow-instance"

# Disable SDK (useful for development)
export GRANYT_DISABLED="false"

# Configure retry settings
export GRANYT_MAX_RETRIES="3"
export GRANYT_RETRY_DELAY="1.0"

# Configure batch settings for error events
export GRANYT_BATCH_SIZE="10"
export GRANYT_FLUSH_INTERVAL="5.0"
```

## How It Works

### Automatic Lineage Tracking

The SDK integrates with Airflow's plugin system and listener mechanism to automatically:

1. Capture task/DAG run starts, completions, and failures
2. Extract OpenLineage-compatible metadata
3. Send lineage events to your Granyt backend

### Operator Adapters

The SDK includes built-in adapters for popular Airflow operators that automatically extract rich metrics:

| Category | Operators | Key Metrics |
|----------|-----------|-------------|
| **Snowflake** | `SnowflakeOperator`, `SnowflakeSqlApiOperator`, `S3ToSnowflakeOperator` | `row_count`, `query_id`, `warehouse`, `database`, `schema` |
| **BigQuery** | `BigQueryInsertJobOperator`, `BigQueryCheckOperator`, `GCSToBigQueryOperator` | `bytes_processed`, `row_count`, `query_id`, `slot_milliseconds` |
| **Generic SQL** | `SQLExecuteQueryOperator`, `SQLColumnCheckOperator`, `BranchSQLOperator` | `row_count`, `database`, `schema`, `table` |
| **AWS S3** | `S3CopyObjectOperator`, `S3ListOperator`, `S3DeleteObjectsOperator` | `files_processed`, `bytes_processed`, `source_path`, `destination_path` |
| **GCS** | `GCSCreateBucketOperator`, `GCSListObjectsOperator`, `GCSSynchronizeBucketsOperator` | `files_processed`, `bytes_processed`, `source_path`, `destination_path` |
| **dbt** | `DbtCloudRunJobOperator`, `DbtRunOperator`, `DbtTestOperator` | `models_run`, `tests_passed`, `tests_failed`, `row_count` |

For more details on how we extract metrics from specific operators, see the [Operator Adapters documentation](docs/operator_adapters.md).

### Rich Error Capture

When a task fails, the SDK automatically captures:

- Full stack trace with local variables
- Task instance metadata (dag_id, task_id, run_id, try_number, etc.)
- System information (Python version, Airflow version, hostname, etc.)
- DAG configuration and task parameters
- Environment context (sanitized - no secrets)
- Previous log entries

## Usage

Once installed and configured, the SDK works automatically. No code changes are required in your DAGs.

### Manual Error Reporting (Optional)

You can also manually report errors or messages:

```python
from granyt_sdk import GranytClient

client = GranytClient()

# Report a custom error
try:
    risky_operation()
except Exception as e:
    client.capture_exception(e, context={"custom_key": "custom_value"})

# Report a message
client.capture_message("Something interesting happened", level="info")
```

### Checking SDK Status

```python
from granyt_sdk import GranytClient

client = GranytClient()
print(f"SDK Enabled: {client.is_enabled()}")
print(f"Configuration: {client.get_config()}")
```

### Capturing Data Metrics

The SDK can capture metrics from your DataFrames (Pandas or Polars) and link them to your lineage events:

```python
from granyt_sdk import capture_data_metrics, capture_and_send_data_metrics
import pandas as pd

df = pd.DataFrame({
    "user_id": [1, 2, None, 4],
    "name": ["Alice", "", "Charlie", "David"],
    "score": [95.5, 87.3, 91.2, 88.8]
})

# Capture metrics only (without sending)
metrics = capture_data_metrics(df, capture_id="my_dataset")
print(f"Row count: {metrics.row_count}")
print(f"Columns: {[c.name for c in metrics.columns]}")

# Capture and send in one call
metrics = capture_and_send_data_metrics(df, capture_id="my_dataset")

# With computed statistics (null counts, empty strings, memory usage)
metrics = capture_data_metrics(df, compute_stats=True)
for col in metrics.columns:
    print(f"{col.name}: {col.null_count} nulls, {col.empty_string_count} empty strings")
```

By default, expensive computations (null counts, empty strings, memory usage) are disabled. Enable them via:
- Pass `compute_stats=True` to the function
- Set `GRANYT_COMPUTE_STATS=true` environment variable

When running inside an Airflow task, the `capture_id` defaults to `{dag_id}.{task_id}` and lineage fields are auto-populated.

#### Custom DataFrame Support

You can add support for other DataFrame types by creating a custom adapter:

```python
from granyt_sdk import DataFrameAdapter, register_adapter

class SparkAdapter(DataFrameAdapter):
    @classmethod
    def can_handle(cls, df):
        return hasattr(df, 'rdd')
    
    @classmethod
    def get_type_name(cls):
        return "spark"
    
    @classmethod
    def get_columns_with_dtypes(cls, df):
        return [(f.name, str(f.dataType)) for f in df.schema.fields]
    
    @classmethod
    def get_row_count(cls, df):
        return df.count()

register_adapter(SparkAdapter)
```

## API Reference

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GRANYT_ENDPOINT` | Backend API endpoint (single endpoint mode) | Required* |
| `GRANYT_API_KEY` | API key for authentication (single endpoint mode) | Required* |
| `GRANYT_ENDPOINTS` | JSON array of endpoints for multi-endpoint mode | Optional |
| `GRANYT_DEBUG` | Enable debug logging | `false` |
| `GRANYT_DISABLED` | Disable the SDK | `false` |
| `GRANYT_NAMESPACE` | OpenLineage namespace | `airflow` |
| `GRANYT_MAX_RETRIES` | Max retries for failed requests | `3` |
| `GRANYT_RETRY_DELAY` | Delay between retries (seconds) | `1.0` |
| `GRANYT_BATCH_SIZE` | Batch size for error events | `10` |
| `GRANYT_FLUSH_INTERVAL` | Flush interval (seconds) | `5.0` |
| `GRANYT_COMPUTE_STATS` | Enable computed stats for data metrics | `false` |

*Either `GRANYT_ENDPOINT`/`GRANYT_API_KEY` or `GRANYT_ENDPOINTS` must be set.

### Event Types

The SDK sends the following event types to the backend:

1. **Lineage Events** (`POST /api/v1/lineage`)
   - OpenLineage-compatible events for task runs
   - Includes inputs, outputs, and job facets

2. **Error Events** (`POST /api/v1/errors`)
   - Rich error information with stack traces
   - Context and environment data

3. **Data Metrics Events** (`POST /api/v1/data-metrics`)
   - DataFrame metrics (row count, column info, null counts, etc.)
   - Linked to lineage via dag_id, task_id, run_id

4. **Heartbeat Events** (`POST /api/v1/heartbeat`)
   - Periodic health checks from the SDK

## Development

### Setup Development Environment

```bash
git clone https://github.com/granyt/granyt-sdk
cd granyt-sdk
pip install -e ".[dev]"
```

### Running Tests

```bash
pytest
```

### Code Formatting

```bash
black src tests
isort src tests
```

## License

Apache License 2.0 - see [LICENSE](LICENSE) for details.
