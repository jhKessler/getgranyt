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
    - etc.
    
    Captured metrics:
    - files_processed: Number of files transferred/processed
    - bytes_processed: Bytes transferred (when available)
    - source_path: Source S3 path or local path
    - destination_path: Destination S3 path
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
            # Extract bucket and key info
            bucket = None
            key = None
            
            for attr in ["bucket_name", "bucket", "dest_bucket", "source_bucket"]:
                if hasattr(task, attr):
                    bucket = getattr(task, attr)
                    break
            
            for attr in ["key", "keys", "prefix", "source_key", "dest_key", "wildcard_key"]:
                if hasattr(task, attr):
                    key = getattr(task, attr)
                    if isinstance(key, list):
                        metrics.files_processed = len(key)
                        key = key[0] if key else None
                    break
            
            if bucket and key:
                metrics.source_path = f"s3://{bucket}/{key}"
            elif bucket:
                metrics.source_path = f"s3://{bucket}"
            
            # Destination info
            dest_bucket = getattr(task, "dest_bucket", None) or getattr(task, "destination_bucket", None)
            dest_key = getattr(task, "dest_key", None) or getattr(task, "destination_key", None)
            
            if dest_bucket and dest_key:
                metrics.destination_path = f"s3://{dest_bucket}/{dest_key}"
            elif dest_bucket:
                metrics.destination_path = f"s3://{dest_bucket}"
            
            # Region
            if hasattr(task, "region_name"):
                metrics.region = task.region_name

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
