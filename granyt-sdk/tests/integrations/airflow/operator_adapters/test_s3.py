"""
Tests for S3Adapter based on official Airflow documentation.

Documentation Source:
https://airflow.apache.org/docs/apache-airflow-providers-amazon/stable/_api/airflow/providers/amazon/aws/operators/s3/index.html

These tests verify that the adapter correctly extracts metrics from S3 operators
based on their documented parameters.
"""

import pytest
from unittest.mock import MagicMock

from granyt_sdk.integrations.airflow.operator_adapters.storage.s3 import S3Adapter


class TestS3AdapterPatterns:
    """Tests for S3Adapter operator pattern matching.
    
    Based on operators documented at:
    https://airflow.apache.org/docs/apache-airflow-providers-amazon/stable/_api/airflow/providers/amazon/aws/operators/s3/index.html
    """
    
    def test_handles_s3_copy_object_operator(self):
        """S3CopyObjectOperator is documented in the S3 operators module."""
        assert S3Adapter.can_handle("S3CopyObjectOperator") is True
        
    def test_handles_s3_create_object_operator(self):
        """S3CreateObjectOperator is documented in the S3 operators module."""
        assert S3Adapter.can_handle("S3CreateObjectOperator") is True
        
    def test_handles_s3_delete_objects_operator(self):
        """S3DeleteObjectsOperator is documented in the S3 operators module."""
        assert S3Adapter.can_handle("S3DeleteObjectsOperator") is True
        
    def test_handles_s3_list_operator(self):
        """S3ListOperator is documented in the S3 operators module."""
        assert S3Adapter.can_handle("S3ListOperator") is True
        
    def test_handles_s3_file_transform_operator(self):
        """S3FileTransformOperator is documented in the S3 operators module."""
        assert S3Adapter.can_handle("S3FileTransformOperator") is True
        
    def test_handles_s3_create_bucket_operator(self):
        """S3CreateBucketOperator is documented in the S3 operators module."""
        assert S3Adapter.can_handle("S3CreateBucketOperator") is True
        
    def test_handles_s3_delete_bucket_operator(self):
        """S3DeleteBucketOperator is documented in the S3 operators module."""
        assert S3Adapter.can_handle("S3DeleteBucketOperator") is True


class TestS3CopyObjectOperator:
    """Tests for S3CopyObjectOperator metric extraction.
    
    Documented parameters:
    - source_bucket_key: Source S3 URI or bucket/key path
    - dest_bucket_key: Destination S3 URI or bucket/key path
    - source_bucket_name: Source bucket name (if not in source_bucket_key)
    - dest_bucket_name: Destination bucket name (if not in dest_bucket_key)
    - aws_conn_id: Connection ID for AWS
    """
    
    @pytest.fixture
    def mock_task_instance(self):
        ti = MagicMock()
        ti.xcom_pull = MagicMock(return_value=None)
        return ti
    
    @pytest.fixture
    def copy_object_task(self):
        task = MagicMock()
        task.__class__.__name__ = "S3CopyObjectOperator"
        task.__class__.__module__ = "airflow.providers.amazon.aws.operators.s3"
        task.aws_conn_id = "aws_default"
        task.source_bucket_name = "source-bucket"
        task.source_bucket_key = "data/input.csv"
        task.dest_bucket_name = "dest-bucket"
        task.dest_bucket_key = "processed/output.csv"
        return task
    
    def test_extracts_source_bucket_as_source_path(self, mock_task_instance, copy_object_task):
        """source_bucket_name/key should be extracted as source_path."""
        adapter = S3Adapter()
        metrics = adapter.extract_metrics(mock_task_instance, copy_object_task)
        
        assert metrics.source_path is not None
        assert "source-bucket" in metrics.source_path
        assert metrics.source_path.startswith("s3://")
        
    def test_extracts_dest_bucket_as_destination_path(self, mock_task_instance, copy_object_task):
        """dest_bucket_name/key should be extracted as destination_path."""
        adapter = S3Adapter()
        metrics = adapter.extract_metrics(mock_task_instance, copy_object_task)
        
        assert metrics.destination_path is not None
        assert "dest-bucket" in metrics.destination_path
        assert metrics.destination_path.startswith("s3://")


class TestS3DeleteObjectsOperator:
    """Tests for S3DeleteObjectsOperator metric extraction.
    
    Documented parameters:
    - bucket: Bucket name
    - keys: List of keys to delete
    - prefix: Delete objects matching prefix
    - aws_conn_id: Connection ID
    """
    
    @pytest.fixture
    def mock_task_instance(self):
        ti = MagicMock()
        ti.xcom_pull = MagicMock(return_value=None)
        return ti
    
    @pytest.fixture
    def delete_objects_task(self):
        task = MagicMock()
        task.__class__.__name__ = "S3DeleteObjectsOperator"
        task.__class__.__module__ = "airflow.providers.amazon.aws.operators.s3"
        task.aws_conn_id = "aws_default"
        task.bucket = "my-bucket"
        task.keys = ["file1.csv", "file2.csv", "file3.csv"]
        task.prefix = None
        return task
    
    def test_extracts_bucket_as_source_path(self, mock_task_instance, delete_objects_task):
        """bucket should be extracted as source_path."""
        adapter = S3Adapter()
        metrics = adapter.extract_metrics(mock_task_instance, delete_objects_task)
        
        assert metrics.source_path is not None
        assert "my-bucket" in metrics.source_path
        
    def test_counts_keys_as_files_processed(self, mock_task_instance, delete_objects_task):
        """keys list should be counted as files_processed."""
        adapter = S3Adapter()
        metrics = adapter.extract_metrics(mock_task_instance, delete_objects_task)
        
        assert metrics.files_processed == 3


class TestS3ListOperator:
    """Tests for S3ListOperator metric extraction.
    
    Documented parameters:
    - bucket: Bucket name to list
    - prefix: Filter objects by prefix
    - delimiter: Delimiter for grouping
    - aws_conn_id: Connection ID
    """
    
    @pytest.fixture
    def mock_task_instance(self):
        ti = MagicMock()
        ti.xcom_pull = MagicMock(return_value=None)
        return ti
    
    @pytest.fixture
    def list_task(self):
        task = MagicMock()
        task.__class__.__name__ = "S3ListOperator"
        task.__class__.__module__ = "airflow.providers.amazon.aws.operators.s3"
        task.aws_conn_id = "aws_default"
        task.bucket = "data-lake"
        task.prefix = "raw/2024/"
        return task
    
    def test_extracts_bucket_as_source_path(self, mock_task_instance, list_task):
        """bucket should be extracted as source_path."""
        adapter = S3Adapter()
        metrics = adapter.extract_metrics(mock_task_instance, list_task)
        
        assert metrics.source_path is not None
        assert "data-lake" in metrics.source_path
        
    def test_counts_files_from_xcom_result(self, mock_task_instance, list_task):
        """XCom result (list of keys) should be counted as files_processed."""
        mock_task_instance.xcom_pull.return_value = [
            "raw/2024/file1.csv",
            "raw/2024/file2.csv",
            "raw/2024/file3.csv",
            "raw/2024/file4.csv",
            "raw/2024/file5.csv",
        ]
        
        adapter = S3Adapter()
        metrics = adapter.extract_metrics(mock_task_instance, list_task)
        
        assert metrics.files_processed == 5


class TestS3CreateObjectOperator:
    """Tests for S3CreateObjectOperator metric extraction.
    
    Documented parameters:
    - s3_bucket: S3 bucket name
    - s3_key: S3 key name
    - data: Object data to upload
    - aws_conn_id: Connection ID
    """
    
    @pytest.fixture
    def mock_task_instance(self):
        ti = MagicMock()
        ti.xcom_pull = MagicMock(return_value=None)
        return ti
    
    @pytest.fixture
    def create_object_task(self):
        task = MagicMock()
        task.__class__.__name__ = "S3CreateObjectOperator"
        task.__class__.__module__ = "airflow.providers.amazon.aws.operators.s3"
        task.aws_conn_id = "aws_default"
        task.s3_bucket = "output-bucket"
        task.s3_key = "results/output.json"
        task.data = '{"result": "success", "count": 42}'
        return task
    
    def test_extracts_s3_bucket_as_destination_path(self, mock_task_instance, create_object_task):
        """s3_bucket/s3_key should be extracted as destination_path."""
        adapter = S3Adapter()
        metrics = adapter.extract_metrics(mock_task_instance, create_object_task)
        
        assert metrics.destination_path is not None
        assert "output-bucket" in metrics.destination_path
        
    def test_extracts_data_size_as_bytes_processed(self, mock_task_instance, create_object_task):
        """data length should be extracted as bytes_processed."""
        adapter = S3Adapter()
        metrics = adapter.extract_metrics(mock_task_instance, create_object_task)
        
        assert metrics.bytes_processed == len(create_object_task.data)
