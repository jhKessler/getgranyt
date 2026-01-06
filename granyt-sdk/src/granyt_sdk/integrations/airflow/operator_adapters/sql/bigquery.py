import logging
from typing import Any, Optional, cast

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
    - region: BigQuery location
    - connection_id: GCP connection ID (gcp_conn_id)

    Documentation references:
    - https://airflow.apache.org/docs/apache-airflow-providers-google/stable/_api/airflow/providers/google/cloud/operators/bigquery/index.html
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

    def _get_connection_id(self, task: Any) -> Optional[str]:
        """Extract BigQuery connection ID.

        BigQuery operators use gcp_conn_id parameter.
        Ref: https://airflow.apache.org/docs/apache-airflow-providers-google/stable/_api/airflow/providers/google/cloud/operators/bigquery/index.html#airflow.providers.google.cloud.operators.bigquery.BigQueryInsertJobOperator
        """
        if hasattr(task, "gcp_conn_id"):
            conn_id = getattr(task, "gcp_conn_id")
            if isinstance(conn_id, str):
                return conn_id
        # Fallback to parent implementation
        val = super()._get_connection_id(task)
        return cast(Optional[str], val)

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
            # project_id - documented parameter
            if hasattr(task, "project_id"):
                project_id = getattr(task, "project_id")
                if project_id and isinstance(project_id, str):
                    metrics.custom_metrics = metrics.custom_metrics or {}
                    metrics.custom_metrics["project_id"] = project_id

            # dataset_id - for table operations
            if hasattr(task, "dataset_id"):
                dataset_id = getattr(task, "dataset_id")
                if dataset_id and isinstance(dataset_id, str):
                    metrics.database = dataset_id

            # table_id - for table operations
            if hasattr(task, "table_id"):
                table_id = getattr(task, "table_id")
                if table_id and isinstance(table_id, str):
                    metrics.table = table_id

            # destination_dataset_table - for query results
            if hasattr(task, "destination_dataset_table"):
                dest = getattr(task, "destination_dataset_table")
                if dest and isinstance(dest, str):
                    metrics.destination_path = dest

            # location - maps to region
            # Ref: https://airflow.apache.org/docs/apache-airflow-providers-google/stable/_api/airflow/providers/google/cloud/operators/bigquery/index.html#airflow.providers.google.cloud.operators.bigquery.BigQueryInsertJobOperator
            if hasattr(task, "location"):
                location = getattr(task, "location")
                if location and isinstance(location, str):
                    metrics.region = location

            # Extract SQL query
            query = self._get_sql_query(task)
            if query:
                metrics.query_text = self._sanitize_query(query)

        # Try to get job results from XCom
        xcom_result = self._extract_xcom_value(task_instance)
        if xcom_result:
            self._parse_bigquery_result(metrics, xcom_result)

        # Try to get job_id from task
        # Ref: https://airflow.apache.org/docs/apache-airflow-providers-google/stable/_api/airflow/providers/google/cloud/operators/bigquery/index.html#airflow.providers.google.cloud.operators.bigquery.BigQueryInsertJobOperator
        if task and hasattr(task, "job_id"):
            job_id = getattr(task, "job_id")
            if job_id and isinstance(job_id, str):
                metrics.query_id = job_id

        return metrics

    def _parse_bigquery_result(
        self,
        metrics: OperatorMetrics,
        result: Any,
    ) -> None:
        """Parse BigQuery job result for metrics.

        BigQuery XCom result structure includes:
        - statistics.query.totalBytesProcessed
        - statistics.query.totalBytesBilled
        - statistics.query.totalSlotMs
        - numDmlAffectedRows (for DML statements)
        """
        if isinstance(result, dict):
            if "statistics" in result:
                stats = result["statistics"]
                if "query" in stats:
                    query_stats = stats["query"]
                    if "totalBytesProcessed" in query_stats:
                        metrics.bytes_processed = int(query_stats["totalBytesProcessed"])
                    if "totalBytesBilled" in query_stats:
                        metrics.custom_metrics = metrics.custom_metrics or {}
                        metrics.custom_metrics["bytes_billed"] = int(
                            query_stats["totalBytesBilled"]
                        )
                    if "totalSlotMs" in query_stats:
                        metrics.custom_metrics = metrics.custom_metrics or {}
                        metrics.custom_metrics["slot_milliseconds"] = int(
                            query_stats["totalSlotMs"]
                        )
                    # numDmlAffectedRows can be in query stats
                    if "numDmlAffectedRows" in query_stats:
                        metrics.row_count = int(query_stats["numDmlAffectedRows"])
                if "totalBytesProcessed" in stats:
                    metrics.bytes_processed = int(stats["totalBytesProcessed"])

            # numDmlAffectedRows at top level
            if "numDmlAffectedRows" in result:
                metrics.row_count = int(result["numDmlAffectedRows"])
            if "jobId" in result:
                metrics.query_id = result["jobId"]
            if "job_id" in result:
                metrics.query_id = result["job_id"]

        elif isinstance(result, (list, tuple)):
            # Result is rows
            metrics.row_count = len(result)
