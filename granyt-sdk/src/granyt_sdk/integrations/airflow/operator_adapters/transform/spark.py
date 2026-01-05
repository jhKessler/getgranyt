import logging
from typing import Any, Optional

from granyt_sdk.integrations.airflow.operator_adapters.base import (
    OperatorAdapter,
    OperatorMetrics,
)

logger = logging.getLogger(__name__)


class SparkAdapter(OperatorAdapter):
    """Adapter for Apache Spark operators.
    
    Extracts metrics from:
    - SparkSubmitOperator
    - SparkJDBCOperator
    - SparkSqlOperator
    - DataprocSubmitJobOperator
    - DataprocSubmitSparkJobOperator
    - EMRAddStepsOperator
    - etc.
    
    Captured metrics:
    - stages_completed: Number of Spark stages
    - tasks_completed: Number of Spark tasks
    - shuffle_bytes: Bytes shuffled
    - row_count: Record counts
    """
    
    OPERATOR_PATTERNS = [
        "SparkSubmitOperator",
        "SparkJDBCOperator",
        "SparkSqlOperator",
        "SparkKubernetesOperator",
        "DataprocSubmitJobOperator",
        "DataprocSubmitSparkJobOperator",
        "DataprocSubmitPySparkJobOperator",
        "DataprocSubmitSparkSqlJobOperator",
        "DataprocCreateClusterOperator",
        "DataprocClusterLink",
        "EMRAddStepsOperator",
        "EMRContainerOperator",
        "EmrAddStepsOperator",
        "EmrCreateJobFlowOperator",
        "GlueJobOperator",
        "AwsGlueJobOperator",
        "AthenaOperator",
        "DatabricksSubmitRunOperator",
        "DatabricksRunNowOperator",
        "LivyOperator",
    ]
    
    OPERATOR_TYPE = "spark"
    PRIORITY = 10
    
    def extract_metrics(
        self,
        task_instance: Any,
        task: Optional[Any] = None,
    ) -> OperatorMetrics:
        """Extract Spark-specific metrics."""
        task = task or self._get_task(task_instance)
        
        metrics = OperatorMetrics(
            operator_type=self.OPERATOR_TYPE,
            operator_class=self._get_operator_class(task_instance),
            connection_id=self._get_connection_id(task) if task else None,
        )
        
        if task:
            # SparkSubmit specific
            if hasattr(task, "application"):
                metrics.source_path = task.application
            if hasattr(task, "application_args"):
                metrics.custom_metrics = metrics.custom_metrics or {}
                metrics.custom_metrics["application_args"] = task.application_args
            if hasattr(task, "spark_binary"):
                metrics.custom_metrics = metrics.custom_metrics or {}
                metrics.custom_metrics["spark_binary"] = task.spark_binary
            if hasattr(task, "driver_memory"):
                metrics.custom_metrics = metrics.custom_metrics or {}
                metrics.custom_metrics["driver_memory"] = task.driver_memory
            if hasattr(task, "executor_memory"):
                metrics.custom_metrics = metrics.custom_metrics or {}
                metrics.custom_metrics["executor_memory"] = task.executor_memory
            if hasattr(task, "num_executors"):
                metrics.custom_metrics = metrics.custom_metrics or {}
                metrics.custom_metrics["num_executors"] = task.num_executors
            
            # Dataproc specific
            if hasattr(task, "cluster_name"):
                metrics.custom_metrics = metrics.custom_metrics or {}
                metrics.custom_metrics["cluster_name"] = task.cluster_name
            if hasattr(task, "region"):
                metrics.region = task.region
            if hasattr(task, "project_id"):
                metrics.custom_metrics = metrics.custom_metrics or {}
                metrics.custom_metrics["project_id"] = task.project_id
            
            # Databricks specific
            if hasattr(task, "job_id"):
                metrics.query_id = str(task.job_id)
            if hasattr(task, "notebook_path"):
                metrics.source_path = task.notebook_path
        
        # Try to get job results from XCom
        xcom_result = self._extract_xcom_value(task_instance)
        if xcom_result:
            self._parse_spark_result(metrics, xcom_result)
        
        return metrics
    
    def _parse_spark_result(
        self,
        metrics: OperatorMetrics,
        result: Any,
    ) -> None:
        """Parse Spark job result for metrics."""
        if isinstance(result, dict):
            # Spark history server / job info
            if "numTasks" in result:
                metrics.tasks_completed = result["numTasks"]
            if "numCompletedTasks" in result:
                metrics.tasks_completed = result["numCompletedTasks"]
            if "numStages" in result:
                metrics.stages_completed = result["numStages"]
            if "numCompletedStages" in result:
                metrics.stages_completed = result["numCompletedStages"]
            if "shuffleBytesWritten" in result:
                metrics.shuffle_bytes = result["shuffleBytesWritten"]
            if "inputRecords" in result:
                metrics.row_count = result["inputRecords"]
            if "outputRecords" in result:
                metrics.row_count = result["outputRecords"]
            
            # Databricks job result
            if "run_id" in result:
                metrics.query_id = str(result["run_id"])
            if "state" in result and isinstance(result["state"], dict):
                metrics.custom_metrics = metrics.custom_metrics or {}
                metrics.custom_metrics["result_state"] = result["state"].get("result_state")
