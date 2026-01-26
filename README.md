<p align="center">
  <img src="granyt-app/public/logo.png" width="40" alt="Granyt Logo" />
</p>

<p align="center">
  <img src="https://img.shields.io/github/license/jhkessler/getgranyt?style=for-the-badge" alt="MIT License" />
  <a href="https://pypi.org/project/granyt-sdk/"><img src="https://img.shields.io/pypi/v/granyt-sdk?style=for-the-badge" alt="PyPI Version" /></a>
  <img src="https://img.shields.io/github/actions/workflow/status/jhkessler/getgranyt/ci.yml?style=for-the-badge" alt="Build Status" />
  <img src="https://img.shields.io/badge/Airflow-2.5--2.10-017CEE?style=for-the-badge&logo=apache-airflow" alt="Airflow Support" />
</p>

<h1 align="center">Granyt</h1>

<p align="center">
  <strong>Stop finding out your DAG failed from Slack messages.</strong>
</p>

<p align="center">
  Open source Airflow observability with error tracking, metrics, and alerts that actually understand your pipelines. Self-hosted. 5 minutes to deploy.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#why-granyt">Why Granyt?</a> •
  <a href="#quick-start">Quick Start</a>
</p>

---

![Granyt Dashboard](images/demo.png)

---

## Features

- **DAG Monitoring**: Know when pipelines break before downstream teams do. Track run history, duration trends, and success rates.
- **Smart Alerts**: Get notified when your BigQuery job returns 0 rows instead of finding out from your CEO on Monday. Schema changes, row count drops, failures: all covered.
- **Error Tracking**: Stack traces with DAG context, not just Python tracebacks. Errors grouped by fingerprint so you see patterns, not noise.
- **Automatic Metrics**: Snowflake query stats, BigQuery bytes scanned, dbt test results - captured automatically from your existing operators.
- **Multi-Environment**: Compare errors across dev, staging, and prod without switching tabs or grep-ing through logs.
- **Self-Hosted**: Your data never leaves your infrastructure. No $2k/month observability bill. MIT licensed.

---

## Why Granyt?

**The Airflow UI shows you what happened. Granyt tells you what went wrong.**

If you've ever:
- Discovered a DAG failed because someone asked "why is the dashboard empty?"
- Spent 20 minutes clicking through task logs to find the actual error
- Wished Sentry understood that `dag_id` and `task_id` matter
- Set up Grafana dashboards that nobody looks at

...then you know why generic monitoring tools don't cut it for data pipelines.

Granyt is built specifically for Airflow. It speaks DAG, not just HTTP status codes.

---

## Quick Start

Get from zero to monitoring in under 5 minutes. No credit card, no sales call, no "contact us for pricing."

### 1. Deploy the Granyt App

```bash
# Download the docker-compose file
curl -O https://raw.githubusercontent.com/jhkessler/getgranyt/main/granyt-app/docker-compose.yml

# Create a .env file with required variables
cat > .env << EOF
POSTGRES_PASSWORD=$(openssl rand -hex 24)
BETTER_AUTH_SECRET=$(openssl rand -hex 32)
BETTER_AUTH_URL=http://localhost:3000
EOF

# Start with Docker Compose
docker compose up -d
```

Open [http://localhost:3000](http://localhost:3000) and create your account.

> For production deployment with Kubernetes, configuration and more options, see the [Deployment Guide](./granyt-app/DEPLOYMENT.md).

### 2. Install the SDK in Airflow

The Granyt SDK is a lightweight Python listener that must be installed where your Airflow workers and scheduler run. It automatically captures DAG and task execution events and sends them to your Granyt dashboard.

Install the SDK in your Airflow environment's Python (e.g., add to your `requirements.txt` or install directly in your Airflow container/virtualenv):

```bash
pip install granyt-sdk
```

### 3. Configure the SDK

Set environment variables in your Airflow environment:

```bash
export GRANYT_ENDPOINT="https://granyt.yourdomain.com"
export GRANYT_API_KEY="your-api-key"  # Get this from the Granyt dashboard
```

That's it! The SDK automatically captures task events and errors from your DAGs.

---

### Capture metrics from Popular Operators

Granyt works with the Airflow lifecycle to automatically capture metrics from popular operators.
Need support for a custom operator? You can easily build and register your own adapters to extract any metadata you need. [Learn more in our docs](https://granyt.dev/docs/operators).

Supported Operators include:
| Category | Operators |
|----------|-----------|
| **SQL & Warehouses** | Snowflake, BigQuery, Redshift, Postgres |
| **Cloud Storage** | AWS S3, Google Cloud Storage, Azure Blob |
| **Transformation** | dbt Cloud, dbt Core, Spark, Bash |


---

### Custom Metrics in Python Tasks
You can emit custom metrics in your python tasks by returning a `granyt` key in your task's return value. 

```python
from granyt_sdk import compute_df_metrics
@task
def transform_data():
    # Load raw data
    df_raw = pd.read_sql("SELECT * FROM raw_events", conn)

    return {
        "granyt": {
            # pass the number of rows to the special "row_count" key to get anomaly warnings
            "row_count": len(df_raw),
            # add custom metrics you want to track
            "high_value_orders": (df_raw["amount"] > 1000).sum()
        }
    }
```
For deep data insights, use `compute_df_metrics`. It automatically calculates row counts, null counts, and column types from your Pandas or Polars DataFrames. Pass the result to `granyt["df_metrics"]` to get schema change detection and rich metrics:

```python
from granyt_sdk import compute_df_metrics

@task
def transform_data():
    df = pd.read_parquet("data.parquet")
    
    return {
        "granyt": {
            # automatically captures schema and df metadata
            "df_metrics": compute_df_metrics(df),
            "data_quality_passed": True
        }
    }
```
---

### Proactive Data Alerts

Granyt automatically monitors your pipelines and alerts you when data anomalies occur.

**Built-in Alert Types:**

| Alert Type | What It Detects |
|------------|-----------------|
| **Schema Change** | Columns added, removed, or data types changed (requires `df_metrics` key) |
| **Row Count Drop** | Sudden drops in row count compared to historical baseline (requires `row_count` or `df_metrics` key) |
| **Null Occurrence** | Columns that historically never had nulls now contain null values (requires `df_metrics` key) |

You can also set up custom alerts for your own metrics in the dashboard.

---

## Contact

- **GitHub:** [@jhkessler](https://github.com/jhkessler)
- **Email:** johnny@granyt.dev
- **Issues:** [GitHub Issues](https://github.com/jhkessler/getgranyt/issues)

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---