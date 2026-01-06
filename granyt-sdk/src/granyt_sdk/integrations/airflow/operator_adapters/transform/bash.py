import logging
from typing import Any, Optional

from granyt_sdk.integrations.airflow.operator_adapters.base import (
    OperatorAdapter,
    OperatorMetrics,
)

logger = logging.getLogger(__name__)


class BashAdapter(OperatorAdapter):
    """Adapter for Bash operators.

    Extracts metrics from:
    - BashOperator
    - SSHOperator
    - etc.
    """

    OPERATOR_PATTERNS = [
        "BashOperator",
        "SSHOperator",
    ]

    OPERATOR_TYPE = "bash"
    PRIORITY = 3  # Lower priority

    def extract_metrics(
        self,
        task_instance: Any,
        task: Optional[Any] = None,
    ) -> OperatorMetrics:
        """Extract Bash operator metrics."""
        task = task or self._get_task(task_instance)

        metrics = OperatorMetrics(
            operator_type=self.OPERATOR_TYPE,
            operator_class=self._get_operator_class(task_instance),
            connection_id=self._get_connection_id(task) if task else None,
        )

        if task:
            if hasattr(task, "bash_command"):
                # Truncate long commands
                cmd = task.bash_command
                if len(cmd) > 500:
                    cmd = cmd[:500] + "..."
                metrics.custom_metrics = metrics.custom_metrics or {}
                metrics.custom_metrics["command_preview"] = cmd

            if hasattr(task, "env"):
                # Count env vars without exposing values
                metrics.custom_metrics = metrics.custom_metrics or {}
                metrics.custom_metrics["env_var_count"] = len(task.env) if task.env else 0

        return metrics
