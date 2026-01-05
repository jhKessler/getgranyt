import logging
import os
from typing import Any, Optional

from granyt_sdk.integrations.airflow.operator_adapters.base import (
    OperatorAdapter,
    OperatorMetrics,
)

logger = logging.getLogger(__name__)


class S3Adapter(OperatorAdapter):
    """Adapter for AWS S3 operators.

    Extracts metrics from:
    - S3CopyObjectOperator
    - S3CreateBucketOperator
    - S3DeleteObjectsOperator
    - S3FileTransformOperator
    - S3ListOperator
    - S3ToRedshiftOperator
    - S3ToSnowflakeOperator
    - LocalFilesystemToS3Operator
    - S3CreateObjectOperator
    - etc.

    Captured metrics:
    - files_processed: Number of files transferred/processed
    - bytes_processed: Bytes transferred (when available)
    - source_path: Source S3 path or local path
    - destination_path: Destination S3 path

    Documentation references:
    - https://airflow.apache.org/docs/apache-airflow-providers-amazon/stable/_api/airflow/providers/amazon/aws/operators/s3/index.html
    """

    OPERATOR_PATTERNS = [
        "S3CopyObjectOperator",
        "S3CreateBucketOperator",
        "S3CreateObjectOperator",
        "S3DeleteBucketOperator",
        "S3DeleteObjectsOperator",
        "S3FileTransformOperator",
        "S3ListOperator",
        "S3ListPrefixesOperator",
        "S3KeySensor",
        "S3KeysUnchangedSensor",
        "S3PrefixSensor",
        "S3ToRedshift",
        "S3ToSnowflake",
        "S3ToGCS",
        "S3ToSFTP",
        "S3ToFTP",
        "LocalFilesystemToS3",
        "SFTPToS3",
        "FTPToS3",
        "ImapAttachmentToS3",
        "SqlToS3",
        "GCSToS3",
        "AzureBlobStorageToS3",
    ]

    OPERATOR_TYPE = "s3"
    PRIORITY = 10

    def _get_operator_class_name(self, task_instance: Any, task: Optional[Any] = None) -> str:
        """Get operator class name from task or task_instance."""
        # Try to get from explicit task first
        if task and hasattr(task, "__class__"):
            return str(task.__class__.__name__)
        # Fall back to task_instance
        return str(self._get_operator_class(task_instance))

    def extract_metrics(
        self,
        task_instance: Any,
        task: Optional[Any] = None,
    ) -> OperatorMetrics:
        """Extract S3-specific metrics."""
        task = task or self._get_task(task_instance)

        metrics = OperatorMetrics(
            operator_type=self.OPERATOR_TYPE,
            operator_class=self._get_operator_class(task_instance),
            connection_id=self._get_connection_id(task) if task else None,
        )

        if task:
            operator_class = self._get_operator_class_name(task_instance, task)

            # Region
            if hasattr(task, "region_name"):
                region = getattr(task, "region_name")
                if region and isinstance(region, str):
                    metrics.region = region

            # Handle S3CopyObjectOperator - source_bucket_name, source_bucket_key, dest_bucket_name, dest_bucket_key
            # Ref: https://airflow.apache.org/docs/apache-airflow-providers-amazon/stable/_api/airflow/providers/amazon/aws/operators/s3/index.html#airflow.providers.amazon.aws.operators.s3.S3CopyObjectOperator
            if "S3CopyObject" in operator_class:
                source_bucket = getattr(task, "source_bucket_name", None)
                source_key = getattr(task, "source_bucket_key", "")
                dest_bucket = getattr(task, "dest_bucket_name", None)
                dest_key = getattr(task, "dest_bucket_key", "")

                if source_bucket and isinstance(source_bucket, str):
                    if source_key and isinstance(source_key, str):
                        metrics.source_path = f"s3://{source_bucket}/{source_key}"
                    else:
                        metrics.source_path = f"s3://{source_bucket}"

                if dest_bucket and isinstance(dest_bucket, str):
                    if dest_key and isinstance(dest_key, str):
                        metrics.destination_path = f"s3://{dest_bucket}/{dest_key}"
                    else:
                        metrics.destination_path = f"s3://{dest_bucket}"

            # Handle S3DeleteObjectsOperator - bucket, keys
            # Ref: https://airflow.apache.org/docs/apache-airflow-providers-amazon/stable/_api/airflow/providers/amazon/aws/operators/s3/index.html#airflow.providers.amazon.aws.operators.s3.S3DeleteObjectsOperator
            elif "S3DeleteObjects" in operator_class:
                bucket = getattr(task, "bucket", None)
                keys = getattr(task, "keys", None)

                if bucket and isinstance(bucket, str):
                    metrics.source_path = f"s3://{bucket}"

                if keys:
                    if isinstance(keys, list):
                        metrics.files_processed = len(keys)
                    elif isinstance(keys, str):
                        metrics.files_processed = 1

            # Handle S3ListOperator - bucket, prefix
            # Ref: https://airflow.apache.org/docs/apache-airflow-providers-amazon/stable/_api/airflow/providers/amazon/aws/operators/s3/index.html#airflow.providers.amazon.aws.operators.s3.S3ListOperator
            elif "S3List" in operator_class:
                bucket = getattr(task, "bucket", None)
                prefix = getattr(task, "prefix", "")

                if bucket and isinstance(bucket, str):
                    if prefix and isinstance(prefix, str):
                        metrics.source_path = f"s3://{bucket}/{prefix}"
                    else:
                        metrics.source_path = f"s3://{bucket}"

            # Handle S3CreateObjectOperator - s3_bucket, s3_key, data
            # Ref: https://airflow.apache.org/docs/apache-airflow-providers-amazon/stable/_api/airflow/providers/amazon/aws/operators/s3/index.html#airflow.providers.amazon.aws.operators.s3.S3CreateObjectOperator
            elif "S3CreateObject" in operator_class:
                s3_bucket = getattr(task, "s3_bucket", None)
                s3_key = getattr(task, "s3_key", "")

                if s3_bucket and isinstance(s3_bucket, str):
                    if s3_key and isinstance(s3_key, str):
                        metrics.destination_path = f"s3://{s3_bucket}/{s3_key}"
                    else:
                        metrics.destination_path = f"s3://{s3_bucket}"

                # Extract data size
                if hasattr(task, "data"):
                    data = getattr(task, "data")
                    if isinstance(data, (str, bytes)):
                        metrics.bytes_processed = len(data)

            else:
                # Default extraction logic for other operators
                bucket = None
                key = None

                for attr in ["bucket_name", "bucket", "dest_bucket", "source_bucket"]:
                    if hasattr(task, attr):
                        val = getattr(task, attr)
                        if val and isinstance(val, str):
                            bucket = val
                            break

                for attr in ["key", "keys", "prefix", "source_key", "dest_key", "wildcard_key"]:
                    if hasattr(task, attr):
                        key = getattr(task, attr)
                        if isinstance(key, list):
                            metrics.files_processed = len(key)
                            key = key[0] if key else None
                        break

                if bucket:
                    if key and isinstance(key, str):
                        metrics.source_path = f"s3://{bucket}/{key}"
                    else:
                        metrics.source_path = f"s3://{bucket}"

                # Destination info
                dest_bucket = getattr(task, "dest_bucket", None) or getattr(
                    task, "destination_bucket", None
                )
                dest_key = getattr(task, "dest_key", None) or getattr(task, "destination_key", None)

                if dest_bucket and isinstance(dest_bucket, str):
                    if dest_key and isinstance(dest_key, str):
                        metrics.destination_path = f"s3://{dest_bucket}/{dest_key}"
                    else:
                        metrics.destination_path = f"s3://{dest_bucket}"

                # Extract data size if present (e.g. S3CreateObjectOperator)
                if hasattr(task, "data"):
                    data = getattr(task, "data")
                    if isinstance(data, (str, bytes)):
                        metrics.bytes_processed = len(data)
                    elif hasattr(data, "seek") and hasattr(data, "tell"):
                        # It's a file-like object
                        try:
                            current_pos = data.tell()
                            data.seek(0, 2)  # Seek to end
                            metrics.bytes_processed = data.tell()
                            data.seek(current_pos)  # Restore position
                        except Exception:
                            pass

            # Extract file size from local filename if present (e.g. LocalFilesystemToS3)
            if hasattr(task, "filename"):
                filename = getattr(task, "filename")
                if isinstance(filename, str) and os.path.exists(filename):
                    metrics.bytes_processed = os.path.getsize(filename)

        # Try to get result from XCom
        xcom_result = self._extract_xcom_value(task_instance)
        if xcom_result:
            self._parse_s3_result(metrics, xcom_result)

        return metrics

    def _parse_s3_result(
        self,
        metrics: OperatorMetrics,
        result: Any,
    ) -> None:
        """Parse S3 operation result for metrics."""
        if isinstance(result, list):
            # List of keys/files
            metrics.files_processed = len(result)
        elif isinstance(result, dict):
            if "Contents" in result:
                # ListObjectsV2 response
                contents = result["Contents"]
                metrics.files_processed = len(contents)
                total_bytes = sum(obj.get("Size", 0) for obj in contents)
                metrics.bytes_processed = total_bytes
            if "ContentLength" in result:
                metrics.bytes_processed = result["ContentLength"]
