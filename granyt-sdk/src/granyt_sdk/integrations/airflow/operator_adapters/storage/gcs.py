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
    - GCSSynchronizeBucketsOperator
    - etc.
    
    Captured metrics:
    - files_processed: Number of files transferred/processed
    - bytes_processed: Bytes transferred
    - source_path: Source GCS path
    - destination_path: Destination GCS path
    - region: GCS location (from location parameter)
    
    Documentation references:
    - https://airflow.apache.org/docs/apache-airflow-providers-google/stable/_api/airflow/providers/google/cloud/operators/gcs/index.html
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
        # Added based on Airflow documentation
        "GCSSynchronizeBucketsOperator",
        "LocalFilesystemToGCSOperator",
        "GCSToBigQueryOperator",
        "GCSToGCSOperator",
    ]
    
    OPERATOR_TYPE = "gcs"
    PRIORITY = 10
    
    def _get_operator_class_name(self, task_instance: Any, task: Optional[Any] = None) -> str:
        """Get operator class name from task or task_instance."""
        # Try to get from explicit task first
        if task and hasattr(task, "__class__"):
            return task.__class__.__name__
        # Fall back to task_instance
        return self._get_operator_class(task_instance)
    
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
            operator_class = self._get_operator_class_name(task_instance, task)
            
            # Extract location as region (documented parameter for GCSCreateBucketOperator)
            # Ref: https://airflow.apache.org/docs/apache-airflow-providers-google/stable/_api/airflow/providers/google/cloud/operators/gcs/index.html#airflow.providers.google.cloud.operators.gcs.GCSCreateBucketOperator
            if hasattr(task, "location"):
                location = getattr(task, "location")
                if location and isinstance(location, str):
                    metrics.region = location
            
            # Handle GCSSynchronizeBucketsOperator specifically
            # Ref: https://airflow.apache.org/docs/apache-airflow-providers-google/stable/_api/airflow/providers/google/cloud/operators/gcs/index.html#airflow.providers.google.cloud.operators.gcs.GCSSynchronizeBucketsOperator
            if "GCSSynchronizeBuckets" in operator_class:
                source_bucket = getattr(task, "source_bucket", None)
                source_object = getattr(task, "source_object", "")
                dest_bucket = getattr(task, "destination_bucket", None)
                dest_object = getattr(task, "destination_object", "")
                
                if source_bucket:
                    if isinstance(source_bucket, str):
                        if source_object and isinstance(source_object, str):
                            metrics.source_path = f"gs://{source_bucket}/{source_object}"
                        else:
                            metrics.source_path = f"gs://{source_bucket}/"
                
                if dest_bucket:
                    if isinstance(dest_bucket, str):
                        if dest_object and isinstance(dest_object, str):
                            metrics.destination_path = f"gs://{dest_bucket}/{dest_object}"
                        else:
                            metrics.destination_path = f"gs://{dest_bucket}/"
            
            # Handle GCSCreateBucketOperator - bucket_name is the destination
            # Ref: https://airflow.apache.org/docs/apache-airflow-providers-google/stable/_api/airflow/providers/google/cloud/operators/gcs/index.html#airflow.providers.google.cloud.operators.gcs.GCSCreateBucketOperator
            elif "GCSCreateBucket" in operator_class:
                bucket_name = getattr(task, "bucket_name", None)
                if bucket_name and isinstance(bucket_name, str):
                    metrics.destination_path = f"gs://{bucket_name}"
                    
            # Handle GCSListObjectsOperator - bucket is source_path, prefix refines it
            # Ref: https://airflow.apache.org/docs/apache-airflow-providers-google/stable/_api/airflow/providers/google/cloud/operators/gcs/index.html#airflow.providers.google.cloud.operators.gcs.GCSListObjectsOperator
            elif "GCSListObjects" in operator_class:
                bucket = getattr(task, "bucket", None)
                prefix = getattr(task, "prefix", "")
                
                if bucket and isinstance(bucket, str):
                    if prefix and isinstance(prefix, str):
                        metrics.source_path = f"gs://{bucket}/{prefix}"
                    else:
                        metrics.source_path = f"gs://{bucket}"
                        
            # Handle GCSDeleteObjectsOperator - bucket_name is source, objects count as files_processed
            # Ref: https://airflow.apache.org/docs/apache-airflow-providers-google/stable/_api/airflow/providers/google/cloud/operators/gcs/index.html#airflow.providers.google.cloud.operators.gcs.GCSDeleteObjectsOperator
            elif "GCSDeleteObjects" in operator_class:
                bucket_name = getattr(task, "bucket_name", None)
                objects = getattr(task, "objects", None)
                
                if bucket_name and isinstance(bucket_name, str):
                    metrics.source_path = f"gs://{bucket_name}"
                
                if objects and isinstance(objects, list):
                    metrics.files_processed = len(objects)
            
            else:
                # Default extraction logic for other operators
                bucket = None
                obj = None
                
                for attr in ["bucket_name", "bucket", "source_bucket"]:
                    if hasattr(task, attr):
                        val = getattr(task, attr)
                        if val and isinstance(val, str):
                            bucket = val
                            break
                
                for attr in ["object_name", "object", "source_object", "source_objects", "prefix"]:
                    if hasattr(task, attr):
                        obj = getattr(task, attr)
                        if isinstance(obj, list):
                            metrics.files_processed = len(obj)
                            obj = obj[0] if obj else None
                        break
                
                if bucket:
                    if obj and isinstance(obj, str):
                        metrics.source_path = f"gs://{bucket}/{obj}"
                    else:
                        metrics.source_path = f"gs://{bucket}"
                
                # Destination info
                dest_bucket = getattr(task, "destination_bucket", None)
                dest_object = getattr(task, "destination_object", None)
                
                if dest_bucket and isinstance(dest_bucket, str):
                    if dest_object and isinstance(dest_object, str):
                        metrics.destination_path = f"gs://{dest_bucket}/{dest_object}"
                    else:
                        metrics.destination_path = f"gs://{dest_bucket}"
            
            # Project ID
            if hasattr(task, "project_id"):
                project_id = getattr(task, "project_id")
                if project_id and isinstance(project_id, str):
                    metrics.custom_metrics = metrics.custom_metrics or {}
                    metrics.custom_metrics["project_id"] = project_id

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
