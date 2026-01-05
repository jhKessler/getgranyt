import logging
import os
from typing import Any, Optional

from granyt_sdk.integrations.airflow.operator_adapters.base import (
    OperatorAdapter,
    OperatorMetrics,
)

logger = logging.getLogger(__name__)


class AzureBlobAdapter(OperatorAdapter):
    """Adapter for Azure Blob Storage operators.

    Extracts metrics from:
    - AzureBlobStorageToGCSOperator
    - LocalFilesystemToAzureBlobStorageOperator
    - etc.
    """

    OPERATOR_PATTERNS = [
        "AzureBlobStorageToGCS",
        "LocalFilesystemToAzureBlobStorage",
        "AzureBlobStorageDeleteBlobOperator",
        "AzureBlobStorageListOperator",
        "AzureBlobStorageToS3",
        "WasbBlobOperator",
        "WasbBlobSensor",
        "WasbPrefixSensor",
    ]

    OPERATOR_TYPE = "azure_blob"
    PRIORITY = 10

    def extract_metrics(
        self,
        task_instance: Any,
        task: Optional[Any] = None,
    ) -> OperatorMetrics:
        """Extract Azure Blob-specific metrics."""
        task = task or self._get_task(task_instance)

        metrics = OperatorMetrics(
            operator_type=self.OPERATOR_TYPE,
            operator_class=self._get_operator_class(task_instance),
            connection_id=self._get_connection_id(task) if task else None,
        )

        if task:
            # Extract container and blob info
            container = getattr(task, "container_name", None) or getattr(task, "container", None)
            blob = (
                getattr(task, "blob_name", None)
                or getattr(task, "blob", None)
                or getattr(task, "prefix", None)
            )

            if container and blob:
                metrics.source_path = f"wasbs://{container}/{blob}"
            elif container:
                metrics.source_path = f"wasbs://{container}"

            # Extract file size from local filename if present
            if hasattr(task, "filename"):
                filename = getattr(task, "filename")
                if isinstance(filename, str) and os.path.exists(filename):
                    metrics.bytes_processed = os.path.getsize(filename)

        xcom_result = self._extract_xcom_value(task_instance)
        if xcom_result and isinstance(xcom_result, list):
            metrics.files_processed = len(xcom_result)

        return metrics
