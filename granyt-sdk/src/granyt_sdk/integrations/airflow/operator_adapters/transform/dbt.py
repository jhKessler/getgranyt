import logging
from typing import Any, Optional, cast

from granyt_sdk.integrations.airflow.operator_adapters.base import (
    OperatorAdapter,
    OperatorMetrics,
)

logger = logging.getLogger(__name__)


class DbtAdapter(OperatorAdapter):
    """Adapter for dbt operators.

    Extracts metrics from:
    - DbtRunOperator
    - DbtTestOperator
    - DbtSeedOperator
    - DbtSnapshotOperator
    - DbtDocsGenerateOperator
    - DbtCloudRunJobOperator (dbt Cloud)
    - DbtCloudGetJobRunArtifactOperator (dbt Cloud)
    - etc.

    Captured metrics:
    - models_run: Number of models executed
    - tests_passed: Number of tests passed
    - tests_failed: Number of tests failed
    - row_count: Total rows affected across models
    - connection_id: dbt Cloud connection ID (dbt_cloud_conn_id)
    - job_id: dbt Cloud job ID (in custom_metrics)
    - account_id: dbt Cloud account ID (in custom_metrics)
    - run_id: dbt Cloud run ID (in custom_metrics)

    Documentation references:
    - https://airflow.apache.org/docs/apache-airflow-providers-dbt-cloud/stable/_api/airflow/providers/dbt/cloud/operators/dbt/index.html
    """

    OPERATOR_PATTERNS = [
        "DbtRunOperator",
        "DbtTestOperator",
        "DbtSeedOperator",
        "DbtSnapshotOperator",
        "DbtDocsGenerateOperator",
        "DbtDocsOperator",
        "DbtDepsOperator",
        "DbtCleanOperator",
        "DbtCompileOperator",
        "DbtLsOperator",
        "DbtSourceOperator",
        "DbtBuildOperator",
        "DbtCloudRunJobOperator",
        "DbtCloudGetJobRunArtifactOperator",
        "DbtCloudListJobsOperator",
        "CosmosOperator",  # Astronomer Cosmos
        "DbtDag",  # Cosmos DAG wrapper
    ]

    OPERATOR_TYPE = "dbt"
    PRIORITY = 10

    def _get_connection_id(self, task: Any) -> Optional[str]:
        """Extract dbt Cloud connection ID.

        dbt Cloud operators use dbt_cloud_conn_id parameter.
        Ref: https://airflow.apache.org/docs/apache-airflow-providers-dbt-cloud/stable/_api/airflow/providers/dbt/cloud/operators/dbt/index.html#airflow.providers.dbt.cloud.operators.dbt.DbtCloudRunJobOperator
        """
        if hasattr(task, "dbt_cloud_conn_id"):
            conn_id = getattr(task, "dbt_cloud_conn_id")
            if isinstance(conn_id, str):
                return conn_id
        # Fallback to parent implementation
        val = super()._get_connection_id(task)
        return cast(Optional[str], val)

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
        """Extract dbt-specific metrics."""
        task = task or self._get_task(task_instance)

        metrics = OperatorMetrics(
            operator_type=self.OPERATOR_TYPE,
            operator_class=self._get_operator_class(task_instance),
            connection_id=self._get_connection_id(task) if task else None,
        )

        if task:
            operator_class = self._get_operator_class_name(task_instance, task)

            # Handle DbtCloudRunJobOperator specific attributes
            # Ref: https://airflow.apache.org/docs/apache-airflow-providers-dbt-cloud/stable/_api/airflow/providers/dbt/cloud/operators/dbt/index.html#airflow.providers.dbt.cloud.operators.dbt.DbtCloudRunJobOperator
            if "DbtCloudRunJob" in operator_class:
                # job_id - documented required parameter
                if hasattr(task, "job_id"):
                    job_id = getattr(task, "job_id")
                    if job_id is not None:
                        metrics.custom_metrics = metrics.custom_metrics or {}
                        if isinstance(job_id, int):
                            metrics.custom_metrics["job_id"] = job_id
                        elif isinstance(job_id, str) and job_id.isdigit():
                            metrics.custom_metrics["job_id"] = int(job_id)

                # account_id - documented optional parameter
                if hasattr(task, "account_id"):
                    account_id = getattr(task, "account_id")
                    if account_id is not None:
                        metrics.custom_metrics = metrics.custom_metrics or {}
                        if isinstance(account_id, int):
                            metrics.custom_metrics["account_id"] = account_id
                        elif isinstance(account_id, str) and account_id.isdigit():
                            metrics.custom_metrics["account_id"] = int(account_id)

            # Handle DbtCloudGetJobRunArtifactOperator specific attributes
            # Ref: https://airflow.apache.org/docs/apache-airflow-providers-dbt-cloud/stable/_api/airflow/providers/dbt/cloud/operators/dbt/index.html#airflow.providers.dbt.cloud.operators.dbt.DbtCloudGetJobRunArtifactOperator
            elif "DbtCloudGetJobRunArtifact" in operator_class:
                # run_id - documented required parameter
                if hasattr(task, "run_id"):
                    run_id = getattr(task, "run_id")
                    if run_id is not None:
                        metrics.custom_metrics = metrics.custom_metrics or {}
                        if isinstance(run_id, int):
                            metrics.custom_metrics["run_id"] = run_id
                        elif isinstance(run_id, str) and run_id.isdigit():
                            metrics.custom_metrics["run_id"] = int(run_id)

                # path - documented required parameter (artifact path)
                if hasattr(task, "path"):
                    path = getattr(task, "path")
                    if path and isinstance(path, str):
                        metrics.custom_metrics = metrics.custom_metrics or {}
                        metrics.custom_metrics["artifact_path"] = path

            else:
                # Default dbt CLI operator attributes
                if hasattr(task, "project_dir"):
                    val = getattr(task, "project_dir")
                    if val and isinstance(val, str):
                        metrics.custom_metrics = metrics.custom_metrics or {}
                        metrics.custom_metrics["project_dir"] = val

                if hasattr(task, "profiles_dir"):
                    val = getattr(task, "profiles_dir")
                    if val and isinstance(val, str):
                        metrics.custom_metrics = metrics.custom_metrics or {}
                        metrics.custom_metrics["profiles_dir"] = val

                if hasattr(task, "target"):
                    val = getattr(task, "target")
                    if val and isinstance(val, str):
                        metrics.custom_metrics = metrics.custom_metrics or {}
                        metrics.custom_metrics["target"] = val

                if hasattr(task, "select"):
                    val = getattr(task, "select")
                    if val and isinstance(val, str):
                        metrics.custom_metrics = metrics.custom_metrics or {}
                        metrics.custom_metrics["select"] = val

                if hasattr(task, "models"):
                    models = getattr(task, "models")
                    if isinstance(models, str):
                        models = models.split()
                    if models:
                        metrics.custom_metrics = metrics.custom_metrics or {}
                        metrics.custom_metrics["models"] = models

                # Cosmos-specific
                if hasattr(task, "profile_config"):
                    val = getattr(task, "profile_config")
                    if val:
                        metrics.custom_metrics = metrics.custom_metrics or {}
                        metrics.custom_metrics["profile_config"] = str(val)

        # Try to get dbt run results from XCom
        xcom_result = self._extract_xcom_value(task_instance)
        if xcom_result:
            self._parse_dbt_result(metrics, xcom_result)

        return metrics

    def _parse_dbt_result(
        self,
        metrics: OperatorMetrics,
        result: Any,
    ) -> None:
        """Parse dbt run result for metrics.

        dbt Cloud and dbt Core return run_results.json format with:
        - results: List of model/test results
        - Each result has status, adapter_response (with rows_affected)

        dbt Cloud may nest this under run_results key.
        """
        if isinstance(result, dict):
            # Handle nested run_results structure (dbt Cloud format)
            # e.g., {"run_id": 12345, "run_results": {"results": [...]}}
            if "run_results" in result and isinstance(result["run_results"], dict):
                nested_results = result["run_results"]
                if "results" in nested_results:
                    self._parse_results_array(metrics, nested_results["results"])
            # Handle flat results structure (dbt Core format)
            # e.g., {"results": [...]}
            elif "results" in result:
                self._parse_results_array(metrics, result["results"])

            # dbt Cloud job format
            if "run_id" in result:
                metrics.query_id = str(result["run_id"])
            if "job_id" in result:
                metrics.custom_metrics = metrics.custom_metrics or {}
                metrics.custom_metrics["job_id"] = result["job_id"]

        elif isinstance(result, (list, tuple)):
            # List of model results
            metrics.models_run = len(result)

    def _parse_results_array(
        self,
        metrics: OperatorMetrics,
        results: list,
    ) -> None:
        """Parse the results array from dbt run_results."""
        if not isinstance(results, list):
            return

        metrics.models_run = len(results)

        passed = sum(1 for r in results if r.get("status") in ["success", "pass"])
        failed = sum(1 for r in results if r.get("status") in ["error", "fail"])

        metrics.tests_passed = passed
        metrics.tests_failed = failed

        # Sum up rows affected
        total_rows = 0
        for r in results:
            adapter_response = r.get("adapter_response", {})
            if isinstance(adapter_response, dict):
                rows = adapter_response.get("rows_affected", 0)
                if rows:
                    total_rows += int(rows)

        if total_rows > 0:
            metrics.row_count = total_rows
