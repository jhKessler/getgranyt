"""
Tests for granyt_sdk.features.errors.capture module.
"""

import pytest
from datetime import datetime, timezone
from unittest.mock import MagicMock

from granyt_sdk.features.errors.capture import ErrorCapture, _extract_local_variables


class TestExtractLocalVariables:
    """Tests for _extract_local_variables helper."""

    def test_extracts_simple_variables(self):
        """Test extraction of simple local variables."""

        def test_func():
            local_var = "test_value"
            number = 42
            # Get the current frame
            import sys

            frame = sys._getframe()
            return _extract_local_variables(frame)

        result = test_func()

        assert "local_var" in result
        assert result["local_var"] == "test_value"
        assert "number" in result
        assert result["number"] == "42"

    def test_skips_private_variables(self):
        """Test that private variables are skipped."""

        def test_func():
            _private = "should_skip"
            __dunder = "also_skip"
            public = "include"
            import sys

            frame = sys._getframe()
            return _extract_local_variables(frame)

        result = test_func()

        assert "_private" not in result
        assert "__dunder" not in result
        assert "public" in result

    def test_redacts_sensitive_variables(self):
        """Test that sensitive variable names are redacted."""

        def test_func():
            password = "secret123"
            api_key = "abc123"
            username = "john"
            import sys

            frame = sys._getframe()
            return _extract_local_variables(frame)

        result = test_func()

        assert result["password"] == "<redacted>"
        assert result["api_key"] == "<redacted>"
        assert result["username"] == "john"


class TestErrorCaptureInit:
    """Tests for ErrorCapture initialization."""

    def test_default_values(self):
        """Test default initialization values."""
        capture = ErrorCapture()

        assert capture.max_frames == 50
        assert capture.max_vars_per_frame == 50

    def test_custom_values(self):
        """Test custom initialization values."""
        capture = ErrorCapture(max_frames=10, max_vars_per_frame=20)

        assert capture.max_frames == 10
        assert capture.max_vars_per_frame == 20


class TestCaptureException:
    """Tests for ErrorCapture.capture_exception()."""

    def test_capture_generates_error_id(self, sample_exception):
        """Test that capture generates a unique error ID."""
        capture = ErrorCapture()
        result = capture.capture_exception(sample_exception)

        assert "error_id" in result
        assert len(result["error_id"]) == 36  # UUID format

    def test_capture_includes_timestamp(self, sample_exception):
        """Test that capture includes timestamp."""
        capture = ErrorCapture()
        result = capture.capture_exception(sample_exception)

        assert "timestamp" in result
        # Verify it's a valid ISO format timestamp
        datetime.fromisoformat(result["timestamp"].replace("Z", "+00:00"))

    def test_capture_includes_exception_info(self, sample_exception):
        """Test that capture includes exception information."""
        capture = ErrorCapture()
        result = capture.capture_exception(sample_exception)

        assert "exception" in result
        exc_info = result["exception"]
        assert exc_info["type"] == "ValueError"
        assert exc_info["message"] == "Test error message"
        assert exc_info["module"] == "builtins"

    def test_capture_includes_stacktrace(self, sample_exception):
        """Test that capture includes stacktrace."""
        capture = ErrorCapture()
        result = capture.capture_exception(sample_exception)

        assert "stacktrace" in result
        assert isinstance(result["stacktrace"], list)
        assert len(result["stacktrace"]) > 0

        # Check frame structure
        frame = result["stacktrace"][-1]  # Most recent frame
        assert "filename" in frame
        assert "function" in frame
        assert "lineno" in frame
        assert "module" in frame

    def test_capture_includes_system_info(self, sample_exception):
        """Test that capture includes system information."""
        capture = ErrorCapture()
        result = capture.capture_exception(sample_exception)

        assert "system" in result
        system = result["system"]
        assert "python_version" in system
        assert "platform" in system
        assert "hostname" in system

    def test_capture_with_task_instance(self, sample_exception, mock_task_instance):
        """Test capture with Airflow TaskInstance."""
        capture = ErrorCapture()
        result = capture.capture_exception(sample_exception, task_instance=mock_task_instance)

        assert "task_instance" in result
        ti_info = result["task_instance"]
        assert ti_info["dag_id"] == "test_dag"
        assert ti_info["task_id"] == "test_task"

    def test_capture_with_dag_run(self, sample_exception, mock_dag_run):
        """Test capture with Airflow DagRun."""
        capture = ErrorCapture()
        result = capture.capture_exception(sample_exception, dag_run=mock_dag_run)

        assert "dag_run" in result
        dr_info = result["dag_run"]
        assert dr_info["dag_id"] == "test_dag"

    def test_capture_with_custom_context(self, sample_exception):
        """Test capture with custom context."""
        capture = ErrorCapture()
        result = capture.capture_exception(
            sample_exception, context={"user_name": "custom_value", "password": "secret"}
        )

        assert "context" in result
        assert result["context"]["user_name"] == "custom_value"
        assert result["context"]["password"] == "<redacted>"

    def test_capture_chained_exception(self, chained_exception):
        """Test capture of chained exception (with __cause__)."""
        capture = ErrorCapture()
        result = capture.capture_exception(chained_exception)

        exc_info = result["exception"]
        assert exc_info["type"] == "ValueError"
        assert "cause" in exc_info
        assert exc_info["cause"]["type"] == "KeyError"

    def test_capture_nested_exception(self, nested_exception):
        """Test capture of nested exception (with __context__)."""
        capture = ErrorCapture()
        result = capture.capture_exception(nested_exception)

        exc_info = result["exception"]
        assert exc_info["type"] == "ValueError"
        assert "context" in exc_info
        assert exc_info["context"]["type"] == "KeyError"


class TestExtractExceptionInfo:
    """Tests for _extract_exception_info method."""

    def test_basic_exception_info(self, sample_exception):
        """Test basic exception info extraction."""
        capture = ErrorCapture()
        result = capture._extract_exception_info(sample_exception)

        assert result["type"] == "ValueError"
        assert result["module"] == "builtins"
        assert "Test error message" in result["message"]

    def test_exception_args(self):
        """Test extraction of exception args."""
        capture = ErrorCapture()

        exc = ValueError("message", "extra_arg", 123)
        result = capture._extract_exception_info(exc)

        assert "args" in result
        assert len(result["args"]) == 3


class TestExtractStacktrace:
    """Tests for _extract_stacktrace method."""

    def test_stacktrace_frame_structure(self, sample_exception):
        """Test that stacktrace frames have correct structure."""
        capture = ErrorCapture()
        result = capture._extract_stacktrace(sample_exception)

        assert len(result) > 0

        for frame in result:
            assert "filename" in frame
            assert "function" in frame
            assert "lineno" in frame
            assert "module" in frame

    def test_stacktrace_includes_locals(self, sample_exception):
        """Test that stacktrace includes local variables."""
        capture = ErrorCapture()
        result = capture._extract_stacktrace(sample_exception)

        # At least one frame should have locals
        frames_with_locals = [f for f in result if "locals" in f]
        assert len(frames_with_locals) > 0

    def test_stacktrace_respects_max_frames(self):
        """Test that max_frames is respected."""

        def recursive(n):
            if n <= 0:
                raise ValueError("Bottom of recursion")
            return recursive(n - 1)

        try:
            recursive(100)
        except ValueError as e:
            capture = ErrorCapture(max_frames=5)
            result = capture._extract_stacktrace(e)

            assert len(result) <= 5

    def test_stacktrace_source_context(self, sample_exception):
        """Test that source context is included when available."""
        capture = ErrorCapture()
        result = capture._extract_stacktrace(sample_exception)

        # Some frames should have source context
        frames_with_source = [f for f in result if "source_context" in f]
        # Note: This might be empty if running from compiled code
        # Just verify the structure if present
        for frame in frames_with_source:
            for line in frame["source_context"]:
                assert "lineno" in line
                assert "code" in line
                assert "current" in line


class TestExtractSystemInfo:
    """Tests for _extract_system_info method."""

    def test_includes_python_info(self):
        """Test that Python information is included."""
        capture = ErrorCapture()
        result = capture._extract_system_info()

        assert "python_version" in result
        assert "python_implementation" in result

    def test_includes_platform_info(self):
        """Test that platform information is included."""
        capture = ErrorCapture()
        result = capture._extract_system_info()

        assert "platform" in result
        assert "machine" in result
        assert "hostname" in result

    def test_includes_process_info(self):
        """Test that process information is included."""
        capture = ErrorCapture()
        result = capture._extract_system_info()

        assert "pid" in result


class TestExtractTaskInstanceInfo:
    """Tests for _extract_task_instance_info method."""

    def test_extracts_basic_info(self, mock_task_instance):
        """Test extraction of basic task instance info."""
        capture = ErrorCapture()
        result = capture._extract_task_instance_info(mock_task_instance)

        assert result["dag_id"] == "test_dag"
        assert result["task_id"] == "test_task"
        assert result["run_id"] == "manual__2026-01-05T00:00:00+00:00"

    def test_extracts_execution_info(self, mock_task_instance):
        """Test extraction of execution information."""
        capture = ErrorCapture()
        result = capture._extract_task_instance_info(mock_task_instance)

        assert result["try_number"] == 1
        assert result["state"] == "running"
        assert result["operator"] == "PythonOperator"

    def test_extracts_resource_info(self, mock_task_instance):
        """Test extraction of resource information."""
        capture = ErrorCapture()
        result = capture._extract_task_instance_info(mock_task_instance)

        assert result["pool"] == "default_pool"
        assert result["queue"] == "default"


class TestExtractDagRunInfo:
    """Tests for _extract_dag_run_info method."""

    def test_extracts_basic_info(self, mock_dag_run):
        """Test extraction of basic DAG run info."""
        capture = ErrorCapture()
        result = capture._extract_dag_run_info(mock_dag_run)

        assert result["dag_id"] == "test_dag"
        assert result["run_id"] == "manual__2026-01-05T00:00:00+00:00"
        assert result["run_type"] == "manual"

    def test_extracts_timing_info(self, mock_dag_run):
        """Test extraction of timing information."""
        capture = ErrorCapture()
        result = capture._extract_dag_run_info(mock_dag_run)

        assert "execution_date" in result
        assert "start_date" in result

    def test_extracts_dag_info(self, mock_dag_run):
        """Test extraction of DAG information."""
        capture = ErrorCapture()
        result = capture._extract_dag_run_info(mock_dag_run)

        assert "dag" in result
        dag_info = result["dag"]
        assert dag_info["description"] == "Test DAG"
        assert dag_info["schedule_interval"] == "@daily"


class TestFormatErrorSummary:
    """Tests for format_error_summary method."""

    def test_formats_basic_summary(self, sample_exception):
        """Test basic error summary formatting."""
        capture = ErrorCapture()
        error_event = capture.capture_exception(sample_exception)

        summary = capture.format_error_summary(error_event)

        assert "ValueError" in summary
        assert "Test error message" in summary
        assert "Error ID:" in summary

    def test_includes_task_info(self, sample_exception, mock_task_instance):
        """Test that task info is included in summary."""
        capture = ErrorCapture()
        error_event = capture.capture_exception(sample_exception, task_instance=mock_task_instance)

        summary = capture.format_error_summary(error_event)

        assert "test_dag" in summary
        assert "test_task" in summary
