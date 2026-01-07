<p align="center">
  <img src="../granyt-app/public/logo.png" width="200" alt="Granyt Logo" />
</p>

# Granyt SDK for Apache Airflow

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python 3.9+" />
  <img src="https://img.shields.io/badge/Airflow-2.5--2.10-017CEE?style=for-the-badge&logo=apache-airflow" alt="Airflow Support" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License" />
</p>

<p align="center">
  <strong>Python SDK for Granyt - the modern, open-source Airflow observability platform</strong><br>
  Automatically capture lineage, errors, and metrics from your Airflow DAGs
</p>

> **Note:** This is the Python SDK component of Granyt. For the complete project overview, see the [main README](../README.md).

---

![Granyt Dashboard](../images/demo.png)

---

## ✨ Features

- **Automatic Lineage Tracking** - Captures DAG/task run status using OpenLineage without any manual instrumentation
- **Rich Error Capture** - Sentry-like error capturing with full stack traces, context variables, and system information
- **Zero Configuration** - Just install and set environment variables - no code changes required
- **Operator Adapters** - Built-in support for popular operators (Snowflake, BigQuery, dbt, S3, and more)
- **DataFrame Metrics** - Automatic schema and metrics extraction from Pandas/Polars DataFrames
- **100% Open Source & Self-Hostable** - Fully open source under the MIT license
---

## 📦 Installation

```bash
pip install granyt-sdk
```

---

## ✅ Compatibility

| Airflow Version | Status |
|-----------------|--------|
| 2.5.x – 2.10.x | ✅ Fully Supported |
| 3.0.x+ | 🚧 Coming Soon |

**Python:** Requires Python 3.10 or later.

---

## ⚙️ Configuration

Set the following environment variables:

```bash
export GRANYT_ENDPOINT="https://your-granyt-backend.com"
export GRANYT_API_KEY="your-api-key" # Get from Granyt App deployment
```

---

## 🔧 How It Works

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

---

### Rich Error Capture

When a task fails, the SDK automatically captures:

- Full stack trace with local variables
- Task instance metadata (dag_id, task_id, run_id, try_number, etc.)
- DAG configuration and task parameters
- Environment context
- Previous log entries

---

## 🚀 Usage

Once installed and configured, the SDK works automatically. No code changes are required in your DAGs.

### Reporting Metrics from Python Tasks

The most flexible way to report metrics from an Airflow `@task` or `PythonOperator` is to include a `granyt` key in your return value. The SDK automatically captures everything inside this dictionary from the xcom.

#### Simple Manual Metrics
You can pass any key-value pairs you want to track in your dashboard:

```python
@task
def process_data():
    # ... your logic ...
    return {
        "granyt": {
            "row_count": 1500,
            "data_quality_passed": True,
            "source_file": "users.csv"
        }
    }
```

#### Automatic Metric Calculation
For deep data insights, use `compute_df_metrics`. It automatically calculates row counts, null counts, and column types from your Pandas or Polars DataFrames. Pass the result to `granyt["df_metrics"]` to get schema change detection and rich metrics:

```python
from granyt_sdk import compute_df_metrics

@task
def transform_data():
    df = pd.read_parquet("data.parquet")
    
    return {
        "granyt": {
            # df_metrics automatically splits into schema and metrics
            "df_metrics": compute_df_metrics(df),
            "data_quality_passed": True
        }
    }
```

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

---

## 📖 API Reference

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GRANYT_ENDPOINT` | Backend API endpoint (single endpoint mode) | Required* |
| `GRANYT_API_KEY` | API key for authentication (single endpoint mode) | Required* |
| `GRANYT_DEBUG` | Enable debug logging | `false` |
| `GRANYT_DISABLED` | Disable the SDK | `false` |

---

## � Contact

- **GitHub:** [@jhkessler](https://github.com/jhkessler)
- **Email:** johnny@granyt.dev
- **Issues:** [GitHub Issues](https://github.com/jhkessler/getgranyt/issues)

---

## �📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  <a href="../README.md">← Back to main README</a>
</p>
