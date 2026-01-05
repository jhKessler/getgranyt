"""
Airflow Listener for Granyt SDK.

This module implements Airflow's listener interface to automatically
capture task and DAG run events without any user configuration.
"""

import logging
from typing import Any, Optional

logger = logging.getLogger(__name__)


# Try to import Airflow's listener hooks
try:
    from airflow.listeners import hookimpl

    AIRFLOW_LISTENERS_AVAILABLE = True
except ImportError:
    # Airflow < 2.5 doesn't have listeners
    AIRFLOW_LISTENERS_AVAILABLE = False

    def hookimpl(f: Any) -> Any:  # type: ignore[no-redef, misc]
        """Stub for hookimpl decorator."""
        return f


def _get_client():
    """Lazily get the Granyt client to avoid import cycles."""
    from granyt_sdk.core.client import get_client

    return get_client()


def _extract_operator_metrics(task_instance: Any) -> Optional[Any]:
    """Extract operator-specific metrics from a task instance."""
    try:
        from granyt_sdk.integrations.airflow.operator_adapters import extract_operator_metrics

        return extract_operator_metrics(task_instance)
    except ImportError:
        logger.debug("Operator adapters not available")
        return None
    except Exception as e:
        logger.debug(f"Failed to extract operator metrics: {e}")
        return None


if AIRFLOW_LISTENERS_AVAILABLE:

    @hookimpl
    def on_task_instance_running(
        previous_state: Any,
        task_instance: Any,
        session: Any = None,
    ) -> None:
        """Called when a task instance starts running."""
        try:
            client = _get_client()
            if client.is_enabled():
                client.send_task_start(task_instance)
                logger.debug(
                    f"Sent task start event: {task_instance.dag_id}.{task_instance.task_id}"
                )
        except Exception as e:
            logger.warning(f"Failed to send task start event: {e}")

    @hookimpl
    def on_task_instance_success(
        previous_state: Any,
        task_instance: Any,
        session: Any = None,
    ) -> None:
        """Called when a task instance succeeds."""
        try:
            client = _get_client()
            if client.is_enabled():
                # Extract operator-specific metrics
                operator_metrics = _extract_operator_metrics(task_instance)

                # Send task complete event
                client.send_task_complete(task_instance, operator_metrics=operator_metrics)

                # If we got operator metrics, also send them separately
                if operator_metrics:
                    client.send_operator_metrics(operator_metrics)
                    logger.debug(
                        f"Sent operator metrics: {operator_metrics.operator_type} "
                        f"(row_count={operator_metrics.row_count})"
                    )

                logger.debug(
                    f"Sent task complete event: {task_instance.dag_id}.{task_instance.task_id}"
                )
        except Exception as e:
            logger.warning(f"Failed to send task complete event: {e}")

    @hookimpl
    def on_task_instance_failed(
        previous_state: Any,
        task_instance: Any,
        error: Optional[BaseException] = None,
        session: Any = None,
    ) -> None:
        """Called when a task instance fails."""
        try:
            client = _get_client()
            if client.is_enabled():
                # Send lineage event
                client.send_task_failed(task_instance, error=error)

                # Try to get exception from task instance if not directly provided
                exception_to_capture = error
                if not exception_to_capture:
                    import sys

                    exc_info = sys.exc_info()
                    if exc_info[1] is not None:
                        exception_to_capture = exc_info[1]

                # Capture rich error information if we have an exception
                if exception_to_capture:
                    dag_run = None
                    try:
                        if hasattr(task_instance, "get_dagrun"):
                            dag_run = task_instance.get_dagrun()
                    except Exception:
                        pass

                    client.capture_exception(
                        exception=exception_to_capture,
                        task_instance=task_instance,
                        dag_run=dag_run,
                        sync=True,
                    )
                else:
                    client.capture_task_failure_info(task_instance)

                logger.debug(
                    f"Sent task failed event: {task_instance.dag_id}.{task_instance.task_id}"
                )
        except Exception as e:
            logger.warning(f"Failed to send task failed event: {e}")

    @hookimpl
    def on_dag_run_running(dag_run: Any, msg: str = "") -> None:
        """Called when a DAG run starts."""
        try:
            client = _get_client()
            if client.is_enabled():
                client.send_dag_run_start(dag_run)
                logger.debug(f"Sent DAG run start event: {dag_run.dag_id}")
        except Exception as e:
            logger.warning(f"Failed to send DAG run start event: {e}")

    @hookimpl
    def on_dag_run_success(dag_run: Any, msg: str = "") -> None:
        """Called when a DAG run succeeds."""
        try:
            client = _get_client()
            if client.is_enabled():
                client.send_dag_run_complete(dag_run)
                logger.debug(f"Sent DAG run complete event: {dag_run.dag_id}")
        except Exception as e:
            logger.warning(f"Failed to send DAG run complete event: {e}")

    @hookimpl
    def on_dag_run_failed(dag_run: Any, msg: str = "") -> None:
        """Called when a DAG run fails."""
        try:
            client = _get_client()
            if client.is_enabled():
                client.send_dag_run_failed(dag_run)
                logger.debug(f"Sent DAG run failed event: {dag_run.dag_id}")
        except Exception as e:
            logger.warning(f"Failed to send DAG run failed event: {e}")

else:
    logger.warning(
        "Airflow listeners not available (requires Airflow 2.5+). "
        "Granyt SDK will use callback-based integration instead."
    )

    def on_task_instance_running(*args, **kwargs):
        pass

    def on_task_instance_success(*args, **kwargs):
        pass

    def on_task_instance_failed(*args, **kwargs):
        pass

    def on_dag_run_running(*args, **kwargs):
        pass

    def on_dag_run_success(*args, **kwargs):
        pass

    def on_dag_run_failed(*args, **kwargs):
        pass
