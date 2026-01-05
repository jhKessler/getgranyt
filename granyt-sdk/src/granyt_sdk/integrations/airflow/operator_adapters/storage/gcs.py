import logging
import os
from typing import Any, Optional

from granyt_sdk.integrations.airflow.operator_adapters.base import (
    OperatorAdapter,
    OperatorMetrics,
)

logger = logging.getLogger(__name__)


class GCSAdapter(OperatorAdapter):
    """Adapter for Google Cloud Storage operators.
    
    Extracts metrics from:
    - GCSCreateBucketOperator
    - GCSDeleteBucketOperator
    - GCSDeleteObjectsOperator
    - GCSListObjectsOperator
    - GCSToLocalFilesystemOperator
    - LocalFilesystemToGCSOperator
    - GCSToBigQueryOperator
    - GCSToGCSOperator
    - etc.
    
    Captured metrics:
    - files_processed: Number of files transferred/processed
    - bytes_processed: Bytes transferred
    - source_path: Source GCS path
    - destination_path: Destination GCS path
    """
    
    OPERATOR_PATTERNS = [
        "GCSCreateBucketOperator",
        "GCSDeleteBucketOperator",
        "GCSDeleteObjectsOperator",
        "GCSListObjectsOperator",
        "GCSObjectExistenceSensor",
        "GCSObjectUpdateSensor",
        "GCSObjectsWithPrefixExistenceSensor",
        "GCSUploadSessionCompleteSensor",
        "GCSToLocalFilesystem",
        "LocalFilesystemToGCS",
        "GCSToBigQuery",
        "GCSToGCS",
        "GCSToS3",
        "GCSToSFTP",
        "S3ToGCS",
        "GCSBucketCreateAclEntryOperator",
        "GCSObjectCreateAclEntryOperator",
        "GCSFileTransformOperator",
        "GCSTimeSpanFileTransformOperator",
        "GCSDeleteBucketOperator",
    ]
    
    OPERATOR_TYPE = "gcs"
    PRIORITY = 10
    
    def extract_metrics(
        self,
        task_instance: Any,
        task: Optional[Any] = None,
    ) -> OperatorMetrics:
        """Extract GCS-specific metrics."""
        task = task or self._get_task(task_instance)
        
        metrics = OperatorMetrics(
            operator_type=self.OPERATOR_TYPE,
            operator_class=self._get_operator_class(task_instance),
            connection_id=self._get_connection_id(task) if task else None,
        )
        
        if task:
            # Extract bucket and object info
            bucket = None
            obj = None
            
            for attr in ["bucket_name", "bucket", "source_bucket"]:
                if hasattr(task, attr):
                    bucket = getattr(task, attr)
                    break
            
            for attr in ["object_name", "object", "source_object", "source_objects", "prefix"]:
                if hasattr(task, attr):
                    obj = getattr(task, attr)
                    if isinstance(obj, list):
                        metrics.files_processed = len(obj)
                        obj = obj[0] if obj else None
                    break
            
            if bucket and obj:
                metrics.source_path = f"gs://{bucket}/{obj}"
            elif bucket:
                metrics.source_path = f"gs://{bucket}"
            
            # Destination info
            dest_bucket = getattr(task, "destination_bucket", None)
            dest_object = getattr(task, "destination_object", None)
            
            if dest_bucket and dest_object:
                metrics.destination_path = f"gs://{dest_bucket}/{dest_object}"
            elif dest_bucket:
                metrics.destination_path = f"gs://{dest_bucket}"
            
            # Project ID
            if hasattr(task, "project_id"):
                metrics.custom_metrics = metrics.custom_metrics or {}
                metrics.custom_metrics["project_id"] = task.project_id

            # Extract file size from local filename if present
            if hasattr(task, "filename"):
                filename = getattr(task, "filename")
                if isinstance(filename, str) and os.path.exists(filename):
                    metrics.bytes_processed = os.path.getsize(filename)
        
        # Try to get result from XCom
        xcom_result = self._extract_xcom_value(task_instance)
        if xcom_result:
            self._parse_gcs_result(metrics, xcom_result)
        
        return metrics
    
    def _parse_gcs_result(
        self,
        metrics: OperatorMetrics,
        result: Any,
    ) -> None:
        """Parse GCS operation result for metrics."""
        if isinstance(result, list):
            metrics.files_processed = len(result)
        elif isinstance(result, dict):
            if "size" in result:
                metrics.bytes_processed = int(result["size"])
            if "items" in result:
                metrics.files_processed = len(result["items"])
                total_bytes = sum(int(item.get("size", 0)) for item in result["items"])
                metrics.bytes_processed = total_bytes
