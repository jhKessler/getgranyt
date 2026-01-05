import logging
from typing import Any, Optional

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
    - DbtCloudRunJobOperator (Astronomer/dbt Cloud)
    - etc.
    
    Captured metrics:
    - models_run: Number of models executed
    - tests_passed: Number of tests passed
    - tests_failed: Number of tests failed
    - row_count: Total rows affected across models
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
            # Extract dbt-specific attributes
            if hasattr(task, "project_dir"):
                metrics.custom_metrics = metrics.custom_metrics or {}
                metrics.custom_metrics["project_dir"] = task.project_dir
            if hasattr(task, "profiles_dir"):
                metrics.custom_metrics = metrics.custom_metrics or {}
                metrics.custom_metrics["profiles_dir"] = task.profiles_dir
            if hasattr(task, "target"):
                metrics.custom_metrics = metrics.custom_metrics or {}
                metrics.custom_metrics["target"] = task.target
            if hasattr(task, "select"):
                metrics.custom_metrics = metrics.custom_metrics or {}
                metrics.custom_metrics["select"] = task.select
            if hasattr(task, "models"):
                models = task.models
                if isinstance(models, str):
                    models = models.split()
                metrics.custom_metrics = metrics.custom_metrics or {}
                metrics.custom_metrics["models"] = models
            
            # Cosmos-specific
            if hasattr(task, "profile_config"):
                metrics.custom_metrics = metrics.custom_metrics or {}
                metrics.custom_metrics["profile_config"] = str(task.profile_config)
        
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
        """Parse dbt run result for metrics."""
        if isinstance(result, dict):
            # dbt run_results.json format
            if "results" in result:
                results = result["results"]
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
            
            # dbt Cloud job format
            if "run_id" in result:
                metrics.query_id = str(result["run_id"])
            if "job_id" in result:
                metrics.custom_metrics = metrics.custom_metrics or {}
                metrics.custom_metrics["job_id"] = result["job_id"]
        
        elif isinstance(result, (list, tuple)):
            # List of model results
            metrics.models_run = len(result)
