"""
Tests for granyt_sdk.integrations.airflow.callbacks module.
"""

from unittest.mock import MagicMock, patch

import pytest

from granyt_sdk.integrations.airflow.callbacks import (
    create_dag_callbacks,
    create_GRANYT_callbacks,
    on_dag_failure,
    on_dag_success,
    on_task_execute,
    on_task_failure,
    on_task_retry,
    on_task_success,
)


class TestOnTaskSuccess:
    """Tests for on_task_success callback."""

    def test_sends_complete_event(self, mock_context):
        """Test that success callback sends complete event."""
        with patch("granyt_sdk.integrations.airflow.callbacks._get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.is_enabled.return_value = True
            mock_get_client.return_value = mock_client

            on_task_success(mock_context)

            mock_client.send_task_complete.assert_called_once()

    def test_no_op_when_disabled(self, mock_context):
        """Test that callback is no-op when client disabled."""
        with patch("granyt_sdk.integrations.airflow.callbacks._get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.is_enabled.return_value = False
            mock_get_client.return_value = mock_client

            on_task_success(mock_context)

            mock_client.send_task_complete.assert_not_called()

    def test_handles_exception(self, mock_context):
        """Test that exceptions in callback are handled gracefully."""
        with patch("granyt_sdk.integrations.airflow.callbacks._get_client") as mock_get_client:
            mock_get_client.side_effect = Exception("Connection failed")

            # Should not raise
            on_task_success(mock_context)


class TestOnTaskFailure:
    """Tests for on_task_failure callback."""

    def test_sends_failed_event(self, mock_context):
        """Test that failure callback sends failed event."""
        with patch("granyt_sdk.integrations.airflow.callbacks._get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.is_enabled.return_value = True
            mock_get_client.return_value = mock_client

            on_task_failure(mock_context)

            mock_client.send_task_failed.assert_called_once()

    def test_captures_exception(self, mock_context):
        """Test that failure callback captures exception."""
        mock_context["exception"] = ValueError("Test error")

        with patch("granyt_sdk.integrations.airflow.callbacks._get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.is_enabled.return_value = True
            mock_get_client.return_value = mock_client

            on_task_failure(mock_context)

            mock_client.capture_exception.assert_called_once()
            call_kwargs = mock_client.capture_exception.call_args[1]
            assert call_kwargs["sync"] is True

    def test_no_op_when_disabled(self, mock_context):
        """Test that callback is no-op when client disabled."""
        with patch("granyt_sdk.integrations.airflow.callbacks._get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.is_enabled.return_value = False
            mock_get_client.return_value = mock_client

            on_task_failure(mock_context)

            mock_client.send_task_failed.assert_not_called()


class TestOnTaskRetry:
    """Tests for on_task_retry callback."""

    def test_captures_retry_exception(self, mock_context):
        """Test that retry callback captures exception."""
        mock_context["exception"] = ValueError("Retry error")

        with patch("granyt_sdk.integrations.airflow.callbacks._get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.is_enabled.return_value = True
            mock_get_client.return_value = mock_client

            on_task_retry(mock_context)

            mock_client.capture_exception.assert_called_once()
            call_kwargs = mock_client.capture_exception.call_args[1]
            assert call_kwargs["sync"] is False  # Async for retries

    def test_no_exception_no_capture(self, mock_context):
        """Test that no exception means no capture."""
        mock_context["exception"] = None

        with patch("granyt_sdk.integrations.airflow.callbacks._get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.is_enabled.return_value = True
            mock_get_client.return_value = mock_client

            on_task_retry(mock_context)

            mock_client.capture_exception.assert_not_called()


class TestOnTaskExecute:
    """Tests for on_task_execute callback."""

    def test_sends_start_event(self, mock_context):
        """Test that execute callback sends start event."""
        with patch("granyt_sdk.integrations.airflow.callbacks._get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.is_enabled.return_value = True
            mock_get_client.return_value = mock_client

            on_task_execute(mock_context)

            mock_client.send_task_start.assert_called_once()


class TestOnDagSuccess:
    """Tests for on_dag_success callback."""

    def test_sends_dag_complete_event(self, mock_context):
        """Test that DAG success callback sends complete event."""
        with patch("granyt_sdk.integrations.airflow.callbacks._get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.is_enabled.return_value = True
            mock_get_client.return_value = mock_client

            on_dag_success(mock_context)

            mock_client.send_dag_run_complete.assert_called_once()


class TestOnDagFailure:
    """Tests for on_dag_failure callback."""

    def test_sends_dag_failed_event(self, mock_context):
        """Test that DAG failure callback sends failed event."""
        with patch("granyt_sdk.integrations.airflow.callbacks._get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.is_enabled.return_value = True
            mock_get_client.return_value = mock_client

            on_dag_failure(mock_context)

            mock_client.send_dag_run_failed.assert_called_once()


class TestCreateGranytCallbacks:
    """Tests for create_GRANYT_callbacks function."""

    def test_returns_all_callbacks_by_default(self):
        """Test that all callbacks are included by default."""
        callbacks = create_GRANYT_callbacks()

        assert "on_success_callback" in callbacks
        assert "on_failure_callback" in callbacks
        assert "on_retry_callback" in callbacks
        assert "on_execute_callback" not in callbacks  # Not included by default

    def test_include_execute_callback(self):
        """Test including execute callback."""
        callbacks = create_GRANYT_callbacks(include_execute=True)

        assert "on_execute_callback" in callbacks
        assert callbacks["on_execute_callback"] == on_task_execute

    def test_exclude_callbacks(self):
        """Test excluding specific callbacks."""
        callbacks = create_GRANYT_callbacks(
            include_success=False,
            include_failure=False,
            include_retry=False,
        )

        assert callbacks == {}

    def test_callback_functions_are_correct(self):
        """Test that callback functions are correct."""
        callbacks = create_GRANYT_callbacks()

        assert callbacks["on_success_callback"] == on_task_success
        assert callbacks["on_failure_callback"] == on_task_failure
        assert callbacks["on_retry_callback"] == on_task_retry


class TestCreateDagCallbacks:
    """Tests for create_dag_callbacks function."""

    def test_returns_dag_callbacks(self):
        """Test that DAG callbacks are returned."""
        callbacks = create_dag_callbacks()

        assert "on_success_callback" in callbacks
        assert "on_failure_callback" in callbacks
        assert callbacks["on_success_callback"] == on_dag_success
        assert callbacks["on_failure_callback"] == on_dag_failure

    def test_exclude_callbacks(self):
        """Test excluding DAG callbacks."""
        callbacks = create_dag_callbacks(
            include_success=False,
            include_failure=False,
        )

        assert callbacks == {}
