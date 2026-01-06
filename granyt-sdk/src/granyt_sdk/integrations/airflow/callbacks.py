"""
Callback functions for Airflow DAGs.

These callbacks can be used with Airflow's on_success_callback,
on_failure_callback, etc. for older Airflow versions or when
you want more control over what gets captured.
"""

import logging
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


def _get_client():
    """Lazily get the Granyt client."""
    from granyt_sdk.core.client import get_client

    return get_client()


def on_task_success(context: Dict[str, Any]) -> None:
    """Callback for task success events."""
    try:
        client = _get_client()
        if not client.is_enabled():
            return

        task_instance = context.get("task_instance") or context.get("ti")
        if task_instance:
            client.send_task_complete(task_instance)
            logger.debug(f"Task success callback: {task_instance.task_id}")
    except Exception as e:
        logger.warning(f"Error in on_task_success callback: {e}")


def on_task_failure(context: Dict[str, Any]) -> None:
    """Callback for task failure events."""
    try:
        client = _get_client()
        if not client.is_enabled():
            return

        task_instance = context.get("task_instance") or context.get("ti")
        exception = context.get("exception")
        dag_run = context.get("dag_run")

        if task_instance:
            # Send lineage event
            client.send_task_failed(task_instance, error=exception)

            # Capture rich error information
            if exception:
                client.capture_exception(
                    exception=exception,
                    task_instance=task_instance,
                    dag_run=dag_run,
                    context={
                        "callback_type": "on_failure_callback",
                        "execution_date": str(context.get("execution_date")),
                        "run_id": context.get("run_id"),
                    },
                    sync=True,
                )

            logger.debug(f"Task failure callback: {task_instance.task_id}")
    except Exception as e:
        logger.warning(f"Error in on_task_failure callback: {e}")


def on_task_retry(context: Dict[str, Any]) -> None:
    """Callback for task retry events."""
    try:
        client = _get_client()
        if not client.is_enabled():
            return

        task_instance = context.get("task_instance") or context.get("ti")
        exception = context.get("exception")

        if task_instance and exception:
            # Capture the error that caused the retry
            client.capture_exception(
                exception=exception,
                task_instance=task_instance,
                context={
                    "callback_type": "on_retry_callback",
                    "try_number": task_instance.try_number,
                    "max_tries": getattr(task_instance, "max_tries", None),
                },
                sync=False,
            )

            logger.debug(
                f"Task retry callback: {task_instance.task_id} " f"(try {task_instance.try_number})"
            )
    except Exception as e:
        logger.warning(f"Error in on_task_retry callback: {e}")


def on_task_execute(context: Dict[str, Any]) -> None:
    """Callback for task execution start."""
    try:
        client = _get_client()
        if not client.is_enabled():
            return

        task_instance = context.get("task_instance") or context.get("ti")
        if task_instance:
            client.send_task_start(task_instance)
            logger.debug(f"Task execute callback: {task_instance.task_id}")
    except Exception as e:
        logger.warning(f"Error in on_task_execute callback: {e}")


def on_dag_success(context: Dict[str, Any]) -> None:
    """Callback for DAG success events."""
    try:
        client = _get_client()
        if not client.is_enabled():
            return

        dag_run = context.get("dag_run")
        if dag_run:
            client.send_dag_run_complete(dag_run)
            logger.debug(f"DAG success callback: {dag_run.dag_id}")
    except Exception as e:
        logger.warning(f"Error in on_dag_success callback: {e}")


def on_dag_failure(context: Dict[str, Any]) -> None:
    """Callback for DAG failure events."""
    try:
        client = _get_client()
        if not client.is_enabled():
            return

        dag_run = context.get("dag_run")
        if dag_run:
            client.send_dag_run_failed(dag_run)
            logger.debug(f"DAG failure callback: {dag_run.dag_id}")
    except Exception as e:
        logger.warning(f"Error in on_dag_failure callback: {e}")


def create_GRANYT_callbacks(
    include_success: bool = True,
    include_failure: bool = True,
    include_retry: bool = True,
    include_execute: bool = False,
) -> Dict[str, Any]:
    """Create a dictionary of Granyt callbacks for use with task parameters."""
    callbacks = {}

    if include_success:
        callbacks["on_success_callback"] = on_task_success
    if include_failure:
        callbacks["on_failure_callback"] = on_task_failure
    if include_retry:
        callbacks["on_retry_callback"] = on_task_retry
    if include_execute:
        callbacks["on_execute_callback"] = on_task_execute

    return callbacks


def create_dag_callbacks(
    include_success: bool = True,
    include_failure: bool = True,
) -> Dict[str, Any]:
    """Create a dictionary of Granyt callbacks for use with DAG parameters."""
    callbacks = {}

    if include_success:
        callbacks["on_success_callback"] = on_dag_success
    if include_failure:
        callbacks["on_failure_callback"] = on_dag_failure

    return callbacks
