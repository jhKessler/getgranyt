"""
Tests for BigQueryAdapter based on official Airflow documentation.

Documentation Source:
https://airflow.apache.org/docs/apache-airflow-providers-google/stable/_api/airflow/providers/google/cloud/operators/bigquery/index.html

These tests verify that the adapter correctly extracts metrics from BigQuery operators
based on their documented parameters.
"""

import pytest
from unittest.mock import MagicMock

from granyt_sdk.integrations.airflow.operator_adapters.sql.bigquery import BigQueryAdapter


class TestBigQueryAdapterPatterns:
    """Tests for BigQueryAdapter operator pattern matching.

    Based on operators documented at:
    https://airflow.apache.org/docs/apache-airflow-providers-google/stable/_api/airflow/providers/google/cloud/operators/bigquery/index.html
    """

    def test_handles_bigquery_insert_job_operator(self):
        """BigQueryInsertJobOperator is the primary BigQuery operator."""
        assert BigQueryAdapter.can_handle("BigQueryInsertJobOperator") is True

    def test_handles_bigquery_check_operator(self):
        """BigQueryCheckOperator is documented in the BigQuery operators module."""
        assert BigQueryAdapter.can_handle("BigQueryCheckOperator") is True

    def test_handles_bigquery_value_check_operator(self):
        """BigQueryValueCheckOperator is documented in the BigQuery operators module."""
        assert BigQueryAdapter.can_handle("BigQueryValueCheckOperator") is True

    def test_handles_bigquery_get_data_operator(self):
        """BigQueryGetDataOperator is documented in the BigQuery operators module."""
        assert BigQueryAdapter.can_handle("BigQueryGetDataOperator") is True

    def test_handles_gcs_to_bigquery_operator(self):
        """GCSToBigQueryOperator is a transfer operator to BigQuery."""
        assert BigQueryAdapter.can_handle("GCSToBigQueryOperator") is True


class TestBigQueryInsertJobOperator:
    """Tests for BigQueryInsertJobOperator metric extraction.

    Documented parameters:
    - configuration: Job configuration dictionary
    - job_id: Optional job ID
    - project_id: Google Cloud project ID
    - location: BigQuery dataset location
    - gcp_conn_id: Connection ID for GCP
    """

    @pytest.fixture
    def mock_task_instance(self):
        ti = MagicMock()
        ti.xcom_pull = MagicMock(return_value=None)
        return ti

    @pytest.fixture
    def insert_job_task(self):
        task = MagicMock()
        task.__class__.__name__ = "BigQueryInsertJobOperator"
        task.__class__.__module__ = "airflow.providers.google.cloud.operators.bigquery"
        task.gcp_conn_id = "google_cloud_default"
        task.project_id = "my-gcp-project"
        task.location = "US"
        task.job_id = "bq_job_12345"
        task.configuration = {
            "query": {
                "query": "SELECT * FROM `my-gcp-project.analytics.events`",
                "destinationTable": {
                    "projectId": "my-gcp-project",
                    "datasetId": "analytics",
                    "tableId": "events_summary",
                },
            }
        }
        return task

    def test_extracts_project_id(self, mock_task_instance, insert_job_task):
        """project_id should be extracted into custom_metrics."""
        adapter = BigQueryAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, insert_job_task)

        assert metrics.custom_metrics is not None
        assert metrics.custom_metrics.get("project_id") == "my-gcp-project"

    def test_extracts_location_as_region(self, mock_task_instance, insert_job_task):
        """location should be extracted as region."""
        adapter = BigQueryAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, insert_job_task)

        assert metrics.region == "US"

    def test_extracts_job_id_as_query_id(self, mock_task_instance, insert_job_task):
        """job_id should be extracted as query_id."""
        adapter = BigQueryAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, insert_job_task)

        assert metrics.query_id == "bq_job_12345"

    def test_extracts_gcp_conn_id_as_connection_id(self, mock_task_instance, insert_job_task):
        """gcp_conn_id should be extracted as connection_id."""
        adapter = BigQueryAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, insert_job_task)

        assert metrics.connection_id == "google_cloud_default"


class TestBigQueryXComParsing:
    """Tests for parsing BigQuery job statistics from XCom."""

    @pytest.fixture
    def mock_task_instance(self):
        ti = MagicMock()
        ti.xcom_pull = MagicMock(return_value=None)
        return ti

    @pytest.fixture
    def insert_job_task(self):
        task = MagicMock()
        task.__class__.__name__ = "BigQueryInsertJobOperator"
        task.__class__.__module__ = "airflow.providers.google.cloud.operators.bigquery"
        task.gcp_conn_id = "google_cloud_default"
        task.project_id = "my-gcp-project"
        task.location = "US"
        return task

    def test_parses_bytes_processed_from_statistics(self, mock_task_instance, insert_job_task):
        """totalBytesProcessed from job statistics should be extracted."""
        mock_task_instance.xcom_pull.return_value = {
            "statistics": {
                "query": {
                    "totalBytesProcessed": "1073741824",  # 1 GB
                    "totalBytesBilled": "1073741824",
                }
            }
        }

        adapter = BigQueryAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, insert_job_task)

        assert metrics.bytes_processed == 1073741824

    def test_parses_rows_affected_from_dml_stats(self, mock_task_instance, insert_job_task):
        """numDmlAffectedRows from DML statistics should be extracted."""
        mock_task_instance.xcom_pull.return_value = {
            "statistics": {"query": {"numDmlAffectedRows": "5000"}}
        }

        adapter = BigQueryAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, insert_job_task)

        assert metrics.row_count == 5000


class TestBigQueryCheckOperator:
    """Tests for BigQueryCheckOperator metric extraction.

    Documented parameters:
    - sql: SQL query to execute
    - gcp_conn_id: Connection ID
    - use_legacy_sql: Whether to use legacy SQL
    - location: Dataset location
    """

    @pytest.fixture
    def mock_task_instance(self):
        ti = MagicMock()
        ti.xcom_pull = MagicMock(return_value=None)
        return ti

    @pytest.fixture
    def check_task(self):
        task = MagicMock()
        task.__class__.__name__ = "BigQueryCheckOperator"
        task.__class__.__module__ = "airflow.providers.google.cloud.operators.bigquery"
        task.gcp_conn_id = "google_cloud_default"
        task.sql = "SELECT COUNT(*) FROM `project.dataset.table` WHERE date = '2024-01-01'"
        task.location = "EU"
        task.use_legacy_sql = False
        return task

    def test_extracts_sql_as_query_text(self, mock_task_instance, check_task):
        """sql should be extracted as query_text."""
        adapter = BigQueryAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, check_task)

        assert metrics.query_text is not None
        assert "SELECT COUNT(*)" in metrics.query_text

    def test_extracts_location_as_region(self, mock_task_instance, check_task):
        """location should be extracted as region."""
        adapter = BigQueryAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, check_task)

        assert metrics.region == "EU"
