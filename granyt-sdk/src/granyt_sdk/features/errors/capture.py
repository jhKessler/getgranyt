"""
Rich error capture module for Granyt SDK.

Captures comprehensive error information similar to Sentry, including:
- Full stack traces with local variables
- System information
- Task/DAG context
- Environment data
"""

import logging
import os
import platform
import sys
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from granyt_sdk.features.errors.sanitizer import (
    is_sensitive_key,
    sanitize_context,
    sanitize_value,
)

logger = logging.getLogger(__name__)


def _extract_local_variables(frame) -> Dict[str, Any]:
    """Extract local variables from a frame, sanitizing sensitive data."""
    locals_dict = {}

    try:
        for key, value in frame.f_locals.items():
            # Skip private and dunder variables
            if key.startswith("_"):
                continue

            # Skip sensitive keys
            if is_sensitive_key(key):
                locals_dict[key] = "<redacted>"
                continue

            # Try to serialize the value
            try:
                locals_dict[key] = sanitize_value(value)
            except Exception:
                locals_dict[key] = f"<{type(value).__name__}>"
    except Exception as e:
        logger.debug(f"Error extracting local variables: {e}")

    return locals_dict


class ErrorCapture:
    """Captures rich error information for debugging.

    This class extracts comprehensive information from exceptions and
    their context, similar to Sentry's error capture functionality.
    """

    def __init__(self, max_frames: int = 50, max_vars_per_frame: int = 50):
        """Initialize error capture.

        Args:
            max_frames: Maximum number of stack frames to capture
            max_vars_per_frame: Maximum number of local variables per frame
        """
        self.max_frames = max_frames
        self.max_vars_per_frame = max_vars_per_frame

    def capture_exception(
        self,
        exception: BaseException,
        task_instance=None,
        dag_run=None,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Capture comprehensive error information from an exception.

        Args:
            exception: The exception to capture
            task_instance: Optional Airflow TaskInstance
            dag_run: Optional Airflow DagRun
            context: Optional additional context

        Returns:
            Error event dictionary with all captured information
        """
        error_id = str(uuid4())
        timestamp = datetime.now(timezone.utc).isoformat()

        error_event = {
            "error_id": error_id,
            "timestamp": timestamp,
            "exception": self._extract_exception_info(exception),
            "stacktrace": self._extract_stacktrace(exception),
            "system": self._extract_system_info(),
        }

        # Add Airflow-specific context
        if task_instance:
            error_event["task_instance"] = self._extract_task_instance_info(task_instance)

        if dag_run:
            error_event["dag_run"] = self._extract_dag_run_info(dag_run)

        # Add custom context
        if context:
            error_event["context"] = sanitize_context(context)

        # Add breadcrumbs (recent log entries)
        error_event["breadcrumbs"] = self._extract_breadcrumbs()

        return error_event

    def _extract_exception_info(self, exception: BaseException) -> Dict[str, Any]:
        """Extract information about the exception itself."""
        exc_type = type(exception)

        info: Dict[str, Any] = {
            "type": exc_type.__name__,
            "module": exc_type.__module__,
            "message": str(exception),
            "args": [sanitize_value(arg) for arg in exception.args] if exception.args else [],
        }

        # Add exception attributes
        exc_attrs = {}
        for attr in dir(exception):
            if attr.startswith("_"):
                continue
            try:
                value = getattr(exception, attr)
                if not callable(value):
                    exc_attrs[attr] = sanitize_value(value, max_length=500)
            except Exception:
                pass

        if exc_attrs:
            info["attributes"] = exc_attrs

        # Check for chained exceptions
        if exception.__cause__:
            info["cause"] = self._extract_exception_info(exception.__cause__)
        elif exception.__context__ and not exception.__suppress_context__:
            info["context"] = self._extract_exception_info(exception.__context__)

        return info

    def _extract_stacktrace(self, exception: BaseException) -> List[Dict[str, Any]]:
        """Extract detailed stack trace with local variables."""
        frames: List[Dict[str, Any]] = []

        # Get the traceback
        tb = exception.__traceback__

        while tb is not None and len(frames) < self.max_frames:
            frame = tb.tb_frame
            lineno = tb.tb_lineno

            frame_info = {
                "filename": frame.f_code.co_filename,
                "function": frame.f_code.co_name,
                "lineno": lineno,
                "module": frame.f_globals.get("__name__", "<unknown>"),
            }

            # Try to get source code context
            try:
                import linecache

                lines = []
                for i in range(max(1, lineno - 3), lineno + 4):
                    line = linecache.getline(frame.f_code.co_filename, i)
                    if line:
                        lines.append(
                            {
                                "lineno": i,
                                "code": line.rstrip(),
                                "current": i == lineno,
                            }
                        )
                if lines:
                    frame_info["source_context"] = lines
            except Exception:
                pass

            # Extract local variables
            locals_dict = _extract_local_variables(frame)
            if locals_dict:
                # Limit number of variables
                if len(locals_dict) > self.max_vars_per_frame:
                    keys = list(locals_dict.keys())[: self.max_vars_per_frame]
                    locals_dict = {k: locals_dict[k] for k in keys}
                    locals_dict["__truncated__"] = True
                frame_info["locals"] = locals_dict

            frames.append(frame_info)
            tb = tb.tb_next

        return frames

    def _extract_system_info(self) -> Dict[str, Any]:
        """Extract system information."""
        info: Dict[str, Any] = {
            "python_version": sys.version,
            "python_implementation": platform.python_implementation(),
            "platform": platform.platform(),
            "machine": platform.machine(),
            "processor": platform.processor(),
            "hostname": platform.node(),
        }

        # Try to get Airflow version
        try:
            import airflow

            info["airflow_version"] = airflow.__version__
        except ImportError:
            pass

        # Try to get memory info
        try:
            import resource

            rusage = resource.getrusage(resource.RUSAGE_SELF)  # type: ignore[attr-defined]
            info["memory_usage_mb"] = rusage.ru_maxrss / 1024  # Convert to MB
        except Exception:
            pass

        # Try to get process info
        try:
            info["pid"] = os.getpid()
            info["ppid"] = os.getppid()
        except Exception:
            pass

        return info

    def _extract_task_instance_info(self, task_instance) -> Dict[str, Any]:
        """Extract information from an Airflow TaskInstance."""
        info = {}

        try:
            # Basic identifiers
            if hasattr(task_instance, "dag_id"):
                info["dag_id"] = task_instance.dag_id
            if hasattr(task_instance, "task_id"):
                info["task_id"] = task_instance.task_id
            if hasattr(task_instance, "run_id"):
                info["run_id"] = task_instance.run_id
            if hasattr(task_instance, "map_index"):
                info["map_index"] = task_instance.map_index

            # Execution information
            if hasattr(task_instance, "try_number"):
                info["try_number"] = task_instance.try_number
            if hasattr(task_instance, "max_tries"):
                info["max_tries"] = task_instance.max_tries
            if hasattr(task_instance, "state"):
                info["state"] = str(task_instance.state)
            if hasattr(task_instance, "operator"):
                info["operator"] = task_instance.operator

            # Timing information
            if hasattr(task_instance, "start_date") and task_instance.start_date:
                info["start_date"] = task_instance.start_date.isoformat()
            if hasattr(task_instance, "end_date") and task_instance.end_date:
                info["end_date"] = task_instance.end_date.isoformat()
            if hasattr(task_instance, "execution_date") and task_instance.execution_date:
                info["execution_date"] = task_instance.execution_date.isoformat()
            if hasattr(task_instance, "duration"):
                info["duration"] = task_instance.duration

            # Resource information
            if hasattr(task_instance, "pool"):
                info["pool"] = task_instance.pool
            if hasattr(task_instance, "queue"):
                info["queue"] = task_instance.queue
            if hasattr(task_instance, "priority_weight"):
                info["priority_weight"] = task_instance.priority_weight
            if hasattr(task_instance, "hostname"):
                info["hostname"] = task_instance.hostname
            if hasattr(task_instance, "executor"):
                info["executor"] = str(task_instance.executor) if task_instance.executor else None
            if hasattr(task_instance, "executor_config"):
                info["executor_config"] = sanitize_value(task_instance.executor_config)

            # Task details
            if hasattr(task_instance, "task"):
                task = task_instance.task
                task_info = {}

                if hasattr(task, "task_type"):
                    task_info["task_type"] = task.task_type
                if hasattr(task, "owner"):
                    task_info["owner"] = task.owner
                if hasattr(task, "email"):
                    task_info["email"] = task.email
                if hasattr(task, "retries"):
                    task_info["retries"] = task.retries
                if hasattr(task, "retry_delay"):
                    task_info["retry_delay"] = str(task.retry_delay)
                if hasattr(task, "trigger_rule"):
                    task_info["trigger_rule"] = str(task.trigger_rule)
                if hasattr(task, "depends_on_past"):
                    task_info["depends_on_past"] = task.depends_on_past
                if hasattr(task, "wait_for_downstream"):
                    task_info["wait_for_downstream"] = task.wait_for_downstream

                # Capture task parameters (sanitized)
                if hasattr(task, "params") and task.params:
                    task_info["params"] = sanitize_context(dict(task.params))

                info["task"] = task_info

            # XCom information (if any)
            if hasattr(task_instance, "xcom_pull"):
                try:
                    # Only include XCom keys, not values (could be sensitive)
                    if hasattr(task_instance, "get_previous_ti"):
                        info["has_xcoms"] = True
                except Exception:
                    pass

        except Exception as e:
            logger.warning(f"Error extracting task instance info: {e}")
            info["_extraction_error"] = str(e)

        return info

    def _extract_dag_run_info(self, dag_run) -> Dict[str, Any]:
        """Extract information from an Airflow DagRun."""
        info = {}

        try:
            if hasattr(dag_run, "dag_id"):
                info["dag_id"] = dag_run.dag_id
            if hasattr(dag_run, "run_id"):
                info["run_id"] = dag_run.run_id
            if hasattr(dag_run, "run_type"):
                info["run_type"] = str(dag_run.run_type)
            if hasattr(dag_run, "state"):
                info["state"] = str(dag_run.state)
            if hasattr(dag_run, "execution_date") and dag_run.execution_date:
                info["execution_date"] = dag_run.execution_date.isoformat()
            if hasattr(dag_run, "start_date") and dag_run.start_date:
                info["start_date"] = dag_run.start_date.isoformat()
            if hasattr(dag_run, "end_date") and dag_run.end_date:
                info["end_date"] = dag_run.end_date.isoformat()
            if hasattr(dag_run, "external_trigger"):
                info["external_trigger"] = dag_run.external_trigger
            if hasattr(dag_run, "data_interval_start") and dag_run.data_interval_start:
                info["data_interval_start"] = dag_run.data_interval_start.isoformat()
            if hasattr(dag_run, "data_interval_end") and dag_run.data_interval_end:
                info["data_interval_end"] = dag_run.data_interval_end.isoformat()

            # Conf (sanitized)
            if hasattr(dag_run, "conf") and dag_run.conf:
                info["conf"] = sanitize_context(dag_run.conf)

            # DAG details
            if hasattr(dag_run, "dag"):
                dag = dag_run.dag
                dag_info = {}

                if hasattr(dag, "description"):
                    dag_info["description"] = dag.description
                if hasattr(dag, "owner"):
                    dag_info["owner"] = dag.owner
                if hasattr(dag, "schedule_interval"):
                    dag_info["schedule_interval"] = str(dag.schedule_interval)
                if hasattr(dag, "catchup"):
                    dag_info["catchup"] = dag.catchup
                if hasattr(dag, "tags"):
                    dag_info["tags"] = list(dag.tags) if dag.tags else []
                if hasattr(dag, "default_args"):
                    dag_info["default_args"] = sanitize_context(dag.default_args or {})
                if hasattr(dag, "fileloc"):
                    dag_info["fileloc"] = dag.fileloc

                info["dag"] = dag_info

        except Exception as e:
            logger.warning(f"Error extracting DAG run info: {e}")
            info["_extraction_error"] = str(e)

        return info

    def _extract_breadcrumbs(self, max_breadcrumbs: int = 50) -> List[Dict[str, Any]]:
        """Extract recent breadcrumbs (log entries).

        This tries to capture recent log entries that might help
        understand what happened before the error.
        """
        breadcrumbs = []

        try:
            # Try to get recent log entries from the root logger
            root_logger = logging.getLogger()

            for handler in root_logger.handlers:
                if hasattr(handler, "buffer"):
                    # MemoryHandler or similar
                    for record in handler.buffer[-max_breadcrumbs:]:
                        breadcrumbs.append(
                            {
                                "timestamp": datetime.fromtimestamp(
                                    record.created, tz=timezone.utc
                                ).isoformat(),
                                "level": record.levelname,
                                "message": record.getMessage()[:500],
                                "logger": record.name,
                            }
                        )
        except Exception as e:
            logger.debug(f"Error extracting breadcrumbs: {e}")

        return breadcrumbs[-max_breadcrumbs:]

    def format_error_summary(self, error_event: Dict[str, Any]) -> str:
        """Format a human-readable error summary.

        Args:
            error_event: The error event dictionary

        Returns:
            Formatted error summary string
        """
        lines = []

        exc = error_event.get("exception", {})
        lines.append(f"Error: {exc.get('type', 'Unknown')}: {exc.get('message', 'No message')}")
        lines.append(f"Error ID: {error_event.get('error_id', 'N/A')}")
        lines.append(f"Timestamp: {error_event.get('timestamp', 'N/A')}")

        # Task info
        task_info = error_event.get("task_instance", {})
        if task_info:
            lines.append(f"DAG: {task_info.get('dag_id', 'N/A')}")
            lines.append(f"Task: {task_info.get('task_id', 'N/A')}")
            lines.append(f"Try: {task_info.get('try_number', 'N/A')}")

        # Stack trace summary
        stacktrace = error_event.get("stacktrace", [])
        if stacktrace:
            lines.append("\nStack trace (most recent call last):")
            for frame in stacktrace[-5:]:
                lines.append(
                    f"  File \"{frame.get('filename')}\", line {frame.get('lineno')}, "
                    f"in {frame.get('function')}"
                )

        return "\n".join(lines)
