import logging
from typing import Any, Optional

from granyt_sdk.integrations.airflow.operator_adapters.base import (
    OperatorAdapter,
    OperatorMetrics,
)

logger = logging.getLogger(__name__)


class BigQueryAdapter(OperatorAdapter):
    """Adapter for BigQuery operators.
    
    Extracts metrics from:
    - BigQueryExecuteQueryOperator
    - BigQueryInsertJobOperator
    - BigQueryCreateExternalTableOperator
    - BigQueryCheckOperator
    - BigQueryGetDataOperator
    - GCSToBigQueryOperator
    - BigQueryToGCSOperator
    - etc.
    
    Captured metrics:
    - bytes_processed: Total bytes processed (billable)
    - bytes_billed: Bytes billed
    - row_count: Rows affected or read
    - query_id: BigQuery job ID
    - slot_milliseconds: Slot time used
    """
    
    OPERATOR_PATTERNS = [
        "BigQueryExecuteQueryOperator",
        "BigQueryInsertJobOperator",
        "BigQueryCreateExternalTableOperator",
        "BigQueryCheckOperator",
        "BigQueryValueCheckOperator",
        "BigQueryIntervalCheckOperator",
        "BigQueryGetDataOperator",
        "BigQueryTableExistenceSensor",
        "BigQueryTablePartitionExistenceSensor",
        "GCSToBigQuery",
        "BigQueryToGCS",
        "BigQueryToBigQuery",
        "BigQueryToMySql",
    ]
    
    OPERATOR_TYPE = "bigquery"
    PRIORITY = 10
    
    def extract_metrics(
        self,
        task_instance: Any,
        task: Optional[Any] = None,
    ) -> OperatorMetrics:
        """Extract BigQuery-specific metrics."""
        task = task or self._get_task(task_instance)
        
        metrics = OperatorMetrics(
            operator_type=self.OPERATOR_TYPE,
            operator_class=self._get_operator_class(task_instance),
            connection_id=self._get_connection_id(task) if task else None,
        )
        
        if task:
            # Extract BigQuery-specific attributes
            if hasattr(task, "project_id"):
                metrics.custom_metrics = metrics.custom_metrics or {}
                metrics.custom_metrics["project_id"] = task.project_id
            if hasattr(task, "dataset_id"):
                metrics.database = task.dataset_id
            if hasattr(task, "table_id"):
                metrics.table = task.table_id
            if hasattr(task, "destination_dataset_table"):
                metrics.destination_path = task.destination_dataset_table
            if hasattr(task, "location"):
                metrics.region = task.location
                
            # Extract SQL query
            query = self._get_sql_query(task)
            if query:
                metrics.query_text = self._sanitize_query(query)
        
        # Try to get job results from XCom
        xcom_result = self._extract_xcom_value(task_instance)
        if xcom_result:
            self._parse_bigquery_result(metrics, xcom_result)
        
        # Try to get job_id from task
        if task and hasattr(task, "job_id"):
            metrics.query_id = task.job_id
        
        return metrics
    
    def _parse_bigquery_result(
        self,
        metrics: OperatorMetrics,
        result: Any,
    ) -> None:
        """Parse BigQuery job result for metrics."""
        # BigQuery jobs often return job info
        if isinstance(result, dict):
            if "statistics" in result:
                stats = result["statistics"]
                if "query" in stats:
                    query_stats = stats["query"]
                    if "totalBytesProcessed" in query_stats:
                        metrics.bytes_processed = int(query_stats["totalBytesProcessed"])
                    if "totalBytesBilled" in query_stats:
                        metrics.custom_metrics = metrics.custom_metrics or {}
                        metrics.custom_metrics["bytes_billed"] = int(query_stats["totalBytesBilled"])
                    if "totalSlotMs" in query_stats:
                        metrics.custom_metrics = metrics.custom_metrics or {}
                        metrics.custom_metrics["slot_milliseconds"] = int(query_stats["totalSlotMs"])
                if "totalBytesProcessed" in stats:
                    metrics.bytes_processed = int(stats["totalBytesProcessed"])
            
            if "numDmlAffectedRows" in result:
                metrics.row_count = int(result["numDmlAffectedRows"])
            if "jobId" in result:
                metrics.query_id = result["jobId"]
            if "job_id" in result:
                metrics.query_id = result["job_id"]
                
        elif isinstance(result, (list, tuple)):
            # Result is rows
            metrics.row_count = len(result)
