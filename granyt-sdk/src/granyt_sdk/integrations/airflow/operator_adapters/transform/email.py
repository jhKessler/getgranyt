import logging
from typing import Any, Optional

from granyt_sdk.integrations.airflow.operator_adapters.base import (
    OperatorAdapter,
    OperatorMetrics,
)

logger = logging.getLogger(__name__)


class EmailAdapter(OperatorAdapter):
    """Adapter for Email operators."""
    
    OPERATOR_PATTERNS = [
        "EmailOperator",
        "SlackAPIPostOperator",
        "SlackAPIFileOperator",
        "TelegramOperator",
        "MsTeamsOperator",
        "DiscordWebhookOperator",
    ]
    
    OPERATOR_TYPE = "notification"
    PRIORITY = 2
    
    def extract_metrics(
        self,
        task_instance: Any,
        task: Optional[Any] = None,
    ) -> OperatorMetrics:
        """Extract notification operator metrics."""
        task = task or self._get_task(task_instance)
        
        metrics = OperatorMetrics(
            operator_type=self.OPERATOR_TYPE,
            operator_class=self._get_operator_class(task_instance),
            connection_id=self._get_connection_id(task) if task else None,
        )
        
        if task:
            # Just capture notification type, not content
            if hasattr(task, "to"):
                recipients = task.to
                if isinstance(recipients, str):
                    recipients = [recipients]
                metrics.custom_metrics = metrics.custom_metrics or {}
                metrics.custom_metrics["recipient_count"] = len(recipients) if recipients else 0
            
            if hasattr(task, "channel"):
                metrics.custom_metrics = metrics.custom_metrics or {}
                metrics.custom_metrics["channel"] = task.channel
        
        return metrics
