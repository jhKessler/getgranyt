"""
Tests for GCSAdapter based on official Airflow documentation.

Documentation Source:
https://airflow.apache.org/docs/apache-airflow-providers-google/stable/_api/airflow/providers/google/cloud/operators/gcs/index.html

These tests verify that the adapter correctly extracts metrics from GCS operators
based on their documented parameters.
"""

from unittest.mock import MagicMock

import pytest

from granyt_sdk.integrations.airflow.operator_adapters.storage.gcs import GCSAdapter


class TestGCSAdapterPatterns:
    """Tests for GCSAdapter operator pattern matching.

    Based on operators documented at:
    https://airflow.apache.org/docs/apache-airflow-providers-google/stable/_api/airflow/providers/google/cloud/operators/gcs/index.html
    """

    def test_handles_gcs_create_bucket_operator(self):
        """GCSCreateBucketOperator is documented in the GCS operators module."""
        assert GCSAdapter.can_handle("GCSCreateBucketOperator") is True

    def test_handles_gcs_list_objects_operator(self):
        """GCSListObjectsOperator is documented in the GCS operators module."""
        assert GCSAdapter.can_handle("GCSListObjectsOperator") is True

    def test_handles_gcs_delete_objects_operator(self):
        """GCSDeleteObjectsOperator is documented in the GCS operators module."""
        assert GCSAdapter.can_handle("GCSDeleteObjectsOperator") is True

    def test_handles_gcs_synchronize_buckets_operator(self):
        """GCSSynchronizeBucketsOperator is documented in the GCS operators module."""
        assert GCSAdapter.can_handle("GCSSynchronizeBucketsOperator") is True

    def test_handles_gcs_delete_bucket_operator(self):
        """GCSDeleteBucketOperator is documented in the GCS operators module."""
        assert GCSAdapter.can_handle("GCSDeleteBucketOperator") is True

    def test_handles_local_filesystem_to_gcs_operator(self):
        """LocalFilesystemToGCSOperator is a documented transfer operator."""
        assert GCSAdapter.can_handle("LocalFilesystemToGCSOperator") is True


class TestGCSCreateBucketOperator:
    """Tests for GCSCreateBucketOperator metric extraction.

    Documented parameters:
    - bucket_name: Name of the bucket to create
    - storage_class: Storage class (STANDARD, NEARLINE, COLDLINE, ARCHIVE)
    - location: Bucket location (region)
    - project_id: GCP project ID
    - gcp_conn_id: GCP connection ID
    """

    @pytest.fixture
    def mock_task_instance(self):
        ti = MagicMock()
        ti.xcom_pull = MagicMock(return_value=None)
        return ti

    @pytest.fixture
    def create_bucket_task(self):
        task = MagicMock()
        task.__class__.__name__ = "GCSCreateBucketOperator"
        task.__class__.__module__ = "airflow.providers.google.cloud.operators.gcs"
        task.gcp_conn_id = "google_cloud_default"
        task.bucket_name = "my-new-bucket"
        task.storage_class = "STANDARD"
        task.location = "US"
        task.project_id = "my-gcp-project"
        return task

    def test_extracts_bucket_name_as_destination(self, mock_task_instance, create_bucket_task):
        """bucket_name should be extracted as destination_path for create operations."""
        adapter = GCSAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, create_bucket_task)

        assert metrics.destination_path is not None
        assert "my-new-bucket" in metrics.destination_path
        assert metrics.destination_path.startswith("gs://")

    def test_extracts_location_as_region(self, mock_task_instance, create_bucket_task):
        """location parameter should be extracted as region."""
        adapter = GCSAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, create_bucket_task)

        assert metrics.region == "US"

    def test_extracts_project_id(self, mock_task_instance, create_bucket_task):
        """project_id should be extracted into custom_metrics."""
        adapter = GCSAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, create_bucket_task)

        assert metrics.custom_metrics is not None
        assert metrics.custom_metrics.get("project_id") == "my-gcp-project"


class TestGCSListObjectsOperator:
    """Tests for GCSListObjectsOperator metric extraction.

    Documented parameters:
    - bucket: Bucket name to list
    - prefix: Prefix to filter objects
    - delimiter: Delimiter for hierarchical listing
    - gcp_conn_id: GCP connection ID
    """

    @pytest.fixture
    def mock_task_instance(self):
        ti = MagicMock()
        ti.xcom_pull = MagicMock(return_value=None)
        return ti

    @pytest.fixture
    def list_objects_task(self):
        task = MagicMock()
        task.__class__.__name__ = "GCSListObjectsOperator"
        task.__class__.__module__ = "airflow.providers.google.cloud.operators.gcs"
        task.gcp_conn_id = "google_cloud_default"
        task.bucket = "data-bucket"
        task.prefix = "raw/events/"
        return task

    def test_extracts_bucket_as_source_path(self, mock_task_instance, list_objects_task):
        """bucket parameter should be extracted as source_path."""
        adapter = GCSAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, list_objects_task)

        assert metrics.source_path is not None
        assert "data-bucket" in metrics.source_path
        assert metrics.source_path.startswith("gs://")

    def test_extracts_prefix_in_source_path(self, mock_task_instance, list_objects_task):
        """prefix should be included in source_path."""
        adapter = GCSAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, list_objects_task)

        assert "raw/events/" in metrics.source_path

    def test_counts_files_from_xcom_result(self, mock_task_instance, list_objects_task):
        """XCom result (list of object names) should be counted as files_processed."""
        mock_task_instance.xcom_pull.return_value = [
            "raw/events/file1.parquet",
            "raw/events/file2.parquet",
            "raw/events/file3.parquet",
        ]

        adapter = GCSAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, list_objects_task)

        assert metrics.files_processed == 3


class TestGCSDeleteObjectsOperator:
    """Tests for GCSDeleteObjectsOperator metric extraction.

    Documented parameters:
    - bucket_name: GCS bucket name
    - objects: List of object names to delete
    - prefix: Prefix to filter objects for deletion
    - gcp_conn_id: GCP connection ID
    """

    @pytest.fixture
    def mock_task_instance(self):
        ti = MagicMock()
        ti.xcom_pull = MagicMock(return_value=None)
        return ti

    @pytest.fixture
    def delete_objects_task(self):
        task = MagicMock()
        task.__class__.__name__ = "GCSDeleteObjectsOperator"
        task.__class__.__module__ = "airflow.providers.google.cloud.operators.gcs"
        task.gcp_conn_id = "google_cloud_default"
        task.bucket_name = "cleanup-bucket"
        task.objects = ["temp1.csv", "temp2.csv", "temp3.csv"]
        task.prefix = None
        return task

    def test_extracts_bucket_name_as_source_path(self, mock_task_instance, delete_objects_task):
        """bucket_name should be extracted as source_path."""
        adapter = GCSAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, delete_objects_task)

        assert metrics.source_path is not None
        assert "cleanup-bucket" in metrics.source_path

    def test_counts_objects_as_files_processed(self, mock_task_instance, delete_objects_task):
        """objects list should be counted as files_processed."""
        adapter = GCSAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, delete_objects_task)

        assert metrics.files_processed == 3


class TestGCSSynchronizeBucketsOperator:
    """Tests for GCSSynchronizeBucketsOperator metric extraction.

    Documented parameters:
    - source_bucket: Source bucket name
    - destination_bucket: Destination bucket name
    - source_object: Source object path
    - destination_object: Destination object path
    - gcp_conn_id: GCP connection ID
    """

    @pytest.fixture
    def mock_task_instance(self):
        ti = MagicMock()
        ti.xcom_pull = MagicMock(return_value=None)
        return ti

    @pytest.fixture
    def sync_buckets_task(self):
        task = MagicMock()
        task.__class__.__name__ = "GCSSynchronizeBucketsOperator"
        task.__class__.__module__ = "airflow.providers.google.cloud.operators.gcs"
        task.gcp_conn_id = "google_cloud_default"
        task.source_bucket = "source-bucket"
        task.destination_bucket = "dest-bucket"
        task.source_object = "data/"
        task.destination_object = "backup/"
        return task

    def test_extracts_source_bucket_as_source_path(self, mock_task_instance, sync_buckets_task):
        """source_bucket should be extracted as source_path."""
        adapter = GCSAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, sync_buckets_task)

        assert metrics.source_path is not None
        assert "source-bucket" in metrics.source_path

    def test_extracts_destination_bucket_as_destination_path(
        self, mock_task_instance, sync_buckets_task
    ):
        """destination_bucket should be extracted as destination_path."""
        adapter = GCSAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, sync_buckets_task)

        assert metrics.destination_path is not None
        assert "dest-bucket" in metrics.destination_path
