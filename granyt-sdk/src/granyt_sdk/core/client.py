"""
Granyt client - Main interface for the SDK.

This module provides the main client interface for interacting with
the Granyt backend, including lineage tracking and error capture.
"""

import atexit
import logging
from typing import Any, Dict, Optional, cast

from granyt_sdk.core.config import GranytConfig
from granyt_sdk.core.transport import GranytTransport
from granyt_sdk.features.errors.capture import ErrorCapture
from granyt_sdk.features.lineage.adapter import OpenLineageAdapter, generate_run_id

logger = logging.getLogger(__name__)


class GranytClient:
    """Main client for Granyt SDK.

    This client provides methods for:
    - Sending lineage events (automatically via plugin or manually)
    - Capturing and sending error events
    - Managing SDK configuration

    The client is thread-safe and can be used from multiple threads.
    """

    _instance: Optional["GranytClient"] = None
    _initialized: bool = False

    def __new__(cls) -> "GranytClient":
        """Singleton pattern - ensure only one client instance exists."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        """Initialize the Granyt client."""
        if self._initialized:
            return

        self._config = GranytConfig.from_environment()
        self._transport = GranytTransport(self._config)
        self._lineage_adapter = OpenLineageAdapter(
            namespace=self._config.namespace,
            producer=self._config.producer,
            facet_schema_url=self._config.facet_schema_url,
        )
        self._error_capture = ErrorCapture()
        self._run_id_cache: Dict[str, str] = {}

        # Setup debug logging if enabled
        if self._config.debug:
            logging.getLogger("granyt_sdk").setLevel(logging.DEBUG)
            handler = logging.StreamHandler()
            handler.setFormatter(
                logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
            )
            logging.getLogger("granyt_sdk").addHandler(handler)

        # Register cleanup on exit
        atexit.register(self.close)

        self._initialized = True

        if self._config.is_valid():
            endpoints = self._config.get_all_endpoints()
            endpoint_info = ", ".join(ep.endpoint for ep in endpoints)
            logger.info(f"Granyt SDK initialized ({len(endpoints)} endpoint(s): {endpoint_info})")
        else:
            logger.warning("Granyt SDK disabled - missing or invalid configuration")

    def is_enabled(self) -> bool:
        """Check if the SDK is enabled and properly configured."""
        return bool(self._config.is_valid())

    def get_config(self) -> Dict[str, Any]:
        """Get current configuration (with sensitive data masked)."""
        return cast(Dict[str, Any], self._config.to_dict())

    def get_or_create_run_id(self, dag_id: str, task_id: str, run_id: str) -> str:
        """Get or create a unique run ID for a task execution."""
        cache_key = f"{dag_id}.{task_id}.{run_id}"
        if cache_key not in self._run_id_cache:
            self._run_id_cache[cache_key] = generate_run_id()
        return self._run_id_cache[cache_key]

    def clear_run_id(self, dag_id: str, task_id: str, run_id: str) -> None:
        """Clear a cached run ID (called when task completes)."""
        cache_key = f"{dag_id}.{task_id}.{run_id}"
        self._run_id_cache.pop(cache_key, None)

    # ==================== Lineage Methods ====================

    def send_task_start(self, task_instance, **kwargs) -> bool:
        """Send a task start lineage event."""
        if not self.is_enabled():
            return False

        try:
            run_id = self.get_or_create_run_id(
                task_instance.dag_id,
                task_instance.task_id,
                task_instance.run_id,
            )

            run_facets = self._lineage_adapter.extract_task_facets(task_instance)
            job_facets = {}

            if hasattr(task_instance, "task"):
                job_facets = self._lineage_adapter.extract_job_facets(task=task_instance.task)

            event = self._lineage_adapter.create_start_event(
                dag_id=task_instance.dag_id,
                task_id=task_instance.task_id,
                run_id=run_id,
                run_facets=run_facets,
                job_facets=job_facets,
                **kwargs,
            )

            return bool(self._transport.send_lineage_event(event))

        except Exception as e:
            logger.error(f"Failed to send task start event: {e}")
            return False

    def send_task_complete(self, task_instance, **kwargs) -> bool:
        """Send a task complete lineage event."""
        if not self.is_enabled():
            return False

        try:
            run_id = self.get_or_create_run_id(
                task_instance.dag_id,
                task_instance.task_id,
                task_instance.run_id,
            )

            run_facets = self._lineage_adapter.extract_task_facets(task_instance)
            job_facets = {}

            if hasattr(task_instance, "task"):
                job_facets = self._lineage_adapter.extract_job_facets(task=task_instance.task)

            event = self._lineage_adapter.create_complete_event(
                dag_id=task_instance.dag_id,
                task_id=task_instance.task_id,
                run_id=run_id,
                run_facets=run_facets,
                job_facets=job_facets,
                **kwargs,
            )

            result = self._transport.send_lineage_event(event)

            # Clear cached run ID
            self.clear_run_id(
                task_instance.dag_id,
                task_instance.task_id,
                task_instance.run_id,
            )

            return bool(result)

        except Exception as e:
            logger.error(f"Failed to send task complete event: {e}")
            return False

    def send_task_failed(
        self, task_instance, error: Optional[BaseException] = None, **kwargs
    ) -> bool:
        """Send a task failed lineage event."""
        if not self.is_enabled():
            return False

        try:
            run_id = self.get_or_create_run_id(
                task_instance.dag_id,
                task_instance.task_id,
                task_instance.run_id,
            )

            run_facets = self._lineage_adapter.extract_task_facets(task_instance)
            job_facets = {}

            if hasattr(task_instance, "task"):
                job_facets = self._lineage_adapter.extract_job_facets(task=task_instance.task)

            error_message = str(error) if error else None

            event = self._lineage_adapter.create_fail_event(
                dag_id=task_instance.dag_id,
                task_id=task_instance.task_id,
                run_id=run_id,
                error_message=error_message,
                run_facets=run_facets,
                job_facets=job_facets,
                **kwargs,
            )

            result = self._transport.send_lineage_event(event)

            # Clear cached run ID
            self.clear_run_id(
                task_instance.dag_id,
                task_instance.task_id,
                task_instance.run_id,
            )

            return bool(result)

        except Exception as e:
            logger.error(f"Failed to send task failed event: {e}")
            return False

    def send_dag_run_start(self, dag_run, **kwargs) -> bool:
        """Send a DAG run start lineage event."""
        if not self.is_enabled():
            return False

        try:
            run_facets = self._lineage_adapter.extract_dag_facets(dag_run)
            job_facets = {}

            if hasattr(dag_run, "dag"):
                job_facets = self._lineage_adapter.extract_job_facets(dag=dag_run.dag)

            event = self._lineage_adapter.create_start_event(
                dag_id=dag_run.dag_id,
                run_id=dag_run.run_id,
                run_facets=run_facets,
                job_facets=job_facets,
                **kwargs,
            )

            return bool(self._transport.send_lineage_event(event))

        except Exception as e:
            logger.error(f"Failed to send DAG run start event: {e}")
            return False

    def send_dag_run_complete(self, dag_run, **kwargs) -> bool:
        """Send a DAG run complete lineage event."""
        if not self.is_enabled():
            return False

        try:
            run_facets = self._lineage_adapter.extract_dag_facets(dag_run)
            job_facets = {}

            if hasattr(dag_run, "dag"):
                job_facets = self._lineage_adapter.extract_job_facets(dag=dag_run.dag)

            event = self._lineage_adapter.create_complete_event(
                dag_id=dag_run.dag_id,
                run_id=dag_run.run_id,
                run_facets=run_facets,
                job_facets=job_facets,
                **kwargs,
            )

            return bool(self._transport.send_lineage_event(event))

        except Exception as e:
            logger.error(f"Failed to send DAG run complete event: {e}")
            return False

    def send_dag_run_failed(self, dag_run, **kwargs) -> bool:
        """Send a DAG run failed lineage event."""
        if not self.is_enabled():
            return False

        try:
            run_facets = self._lineage_adapter.extract_dag_facets(dag_run)
            job_facets = {}

            if hasattr(dag_run, "dag"):
                job_facets = self._lineage_adapter.extract_job_facets(dag=dag_run.dag)

            event = self._lineage_adapter.create_fail_event(
                dag_id=dag_run.dag_id,
                run_id=dag_run.run_id,
                run_facets=run_facets,
                job_facets=job_facets,
                **kwargs,
            )

            return bool(self._transport.send_lineage_event(event))

        except Exception as e:
            logger.error(f"Failed to send DAG run failed event: {e}")
            return False

    # ==================== Error Capture Methods ====================

    def capture_exception(
        self,
        exception: BaseException,
        task_instance=None,
        dag_run=None,
        context: Optional[Dict[str, Any]] = None,
        sync: bool = False,
    ) -> Optional[str]:
        """Capture and send an exception to the backend."""
        if not self.is_enabled():
            return None

        try:
            error_event = self._error_capture.capture_exception(
                exception=exception,
                task_instance=task_instance,
                dag_run=dag_run,
                context=context,
            )

            if sync:
                self._transport.send_error_event_sync(error_event)
            else:
                self._transport.send_error_event(error_event)

            if self._config.debug:
                logger.debug(
                    f"Captured exception: {self._error_capture.format_error_summary(error_event)}"
                )

            error_id = error_event.get("error_id")
            return str(error_id) if error_id else None

        except Exception as e:
            logger.error(f"Failed to capture exception: {e}")
            return None

    def capture_task_failure_info(self, task_instance) -> Optional[str]:
        """Capture failure information from a task instance when no exception is available."""
        if not self.is_enabled():
            return None

        try:
            from datetime import datetime, timezone
            from uuid import uuid4

            error_event = {
                "error_id": str(uuid4()),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "exception": {
                    "type": "TaskFailure",
                    "module": "airflow",
                    "message": f"Task {task_instance.task_id} failed in DAG {task_instance.dag_id}",
                },
                "task_instance": self._error_capture._extract_task_instance_info(task_instance),
                "system": self._error_capture._extract_system_info(),
            }

            self._transport.send_error_event_sync(error_event)
            logger.debug(f"Captured task failure info: {error_event['error_id']}")

            return error_event.get("error_id")

        except Exception as e:
            logger.error(f"Failed to capture task failure info: {e}")
            return None

    def capture_message(
        self,
        message: str,
        level: str = "info",
        context: Optional[Dict[str, Any]] = None,
    ) -> Optional[str]:
        """Capture and send a message to the backend."""
        if not self.is_enabled():
            return None

        try:
            from datetime import datetime, timezone
            from uuid import uuid4

            message_event = {
                "message_id": str(uuid4()),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "level": level,
                "message": message,
                "context": context or {},
            }

            self._transport.send_error_event(message_event)

            return str(message_event.get("message_id"))

        except Exception as e:
            logger.error(f"Failed to capture message: {e}")
            return None

    # ==================== Data Metrics Methods ====================

    def send_operator_metrics(self, metrics) -> bool:
        """Send operator-specific metrics to the backend."""
        if not self.is_enabled():
            return False

        try:
            metrics_dict = metrics.to_dict()
            return bool(self._transport.send_operator_metrics(metrics_dict))
        except Exception as e:
            logger.error(f"Failed to send operator metrics: {e}")
            return False

    # ==================== Utility Methods ====================

    def flush(self) -> None:
        """Force flush all queued events."""
        self._transport.flush()

    def close(self) -> None:
        """Gracefully shutdown the client."""
        try:
            self._transport.close()
            logger.info("Granyt SDK shutdown complete")
        except Exception as e:
            logger.error(f"Error during shutdown: {e}")

    def send_heartbeat(self) -> bool:
        """Send a heartbeat to the backend."""
        if not self.is_enabled():
            return False

        import platform
        from datetime import datetime, timezone

        metadata = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "hostname": platform.node(),
            "sdk_version": "0.1.0",
            "namespace": self._config.namespace,
        }

        try:
            import airflow

            metadata["airflow_version"] = airflow.__version__
        except ImportError:
            pass

        return bool(self._transport.send_heartbeat(metadata))


# Global client instance
_client: Optional[GranytClient] = None


def get_client() -> GranytClient:
    """Get the global Granyt client instance."""
    global _client
    if _client is None:
        _client = GranytClient()
    return _client
