"""
Tests for granyt_sdk.integrations.airflow.listener module.
"""

from unittest.mock import MagicMock, patch

import pytest


class TestListenerAvailability:
    """Tests for listener availability detection."""

    def test_listener_module_imports(self):
        """Test that listener module imports without error."""
        # This should not raise even if Airflow is not installed
        from granyt_sdk.integrations.airflow import listener

        assert hasattr(listener, "AIRFLOW_LISTENERS_AVAILABLE")

    def test_stub_functions_exist(self):
        """Test that stub functions exist when listeners unavailable."""
        from granyt_sdk.integrations.airflow import listener

        # These should always exist
        assert hasattr(listener, "on_task_instance_running")
        assert hasattr(listener, "on_task_instance_success")
        assert hasattr(listener, "on_task_instance_failed")
        assert hasattr(listener, "on_dag_run_running")
        assert hasattr(listener, "on_dag_run_success")
        assert hasattr(listener, "on_dag_run_failed")


class TestOnTaskInstanceRunning:
    """Tests for on_task_instance_running listener."""

    def test_sends_task_start(self, mock_task_instance):
        """Test that running listener sends task start."""
        from granyt_sdk.integrations.airflow import listener

        if not listener.AIRFLOW_LISTENERS_AVAILABLE:
            pytest.skip("Airflow listeners not available")

        with patch.object(listener, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.is_enabled.return_value = True
            mock_get_client.return_value = mock_client

            listener.on_task_instance_running(
                previous_state=None,
                task_instance=mock_task_instance,
            )

            mock_client.send_task_start.assert_called_once_with(mock_task_instance)

    def test_no_op_when_disabled(self, mock_task_instance):
        """Test listener is no-op when client disabled."""
        from granyt_sdk.integrations.airflow import listener

        if not listener.AIRFLOW_LISTENERS_AVAILABLE:
            pytest.skip("Airflow listeners not available")

        with patch.object(listener, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.is_enabled.return_value = False
            mock_get_client.return_value = mock_client

            listener.on_task_instance_running(
                previous_state=None,
                task_instance=mock_task_instance,
            )

            mock_client.send_task_start.assert_not_called()


class TestOnTaskInstanceSuccess:
    """Tests for on_task_instance_success listener."""

    def test_sends_task_complete(self, mock_task_instance):
        """Test that success listener sends task complete."""
        from granyt_sdk.integrations.airflow import listener

        if not listener.AIRFLOW_LISTENERS_AVAILABLE:
            pytest.skip("Airflow listeners not available")

        with patch.object(listener, "_get_client") as mock_get_client:
            with patch.object(listener, "_extract_operator_metrics", return_value=None):
                mock_client = MagicMock()
                mock_client.is_enabled.return_value = True
                mock_get_client.return_value = mock_client

                listener.on_task_instance_success(
                    previous_state=None,
                    task_instance=mock_task_instance,
                )

                mock_client.send_task_complete.assert_called_once()


class TestOnTaskInstanceFailed:
    """Tests for on_task_instance_failed listener."""

    def test_sends_task_failed(self, mock_task_instance):
        """Test that failed listener sends task failed."""
        from granyt_sdk.integrations.airflow import listener

        if not listener.AIRFLOW_LISTENERS_AVAILABLE:
            pytest.skip("Airflow listeners not available")

        with patch.object(listener, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.is_enabled.return_value = True
            mock_get_client.return_value = mock_client

            error = ValueError("Task failed")
            listener.on_task_instance_failed(
                previous_state=None,
                task_instance=mock_task_instance,
                error=error,
            )

            mock_client.send_task_failed.assert_called_once()
            mock_client.capture_exception.assert_called_once()

    def test_captures_exception_with_error(self, mock_task_instance):
        """Test that exception is captured when error provided."""
        from granyt_sdk.integrations.airflow import listener

        if not listener.AIRFLOW_LISTENERS_AVAILABLE:
            pytest.skip("Airflow listeners not available")

        with patch.object(listener, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.is_enabled.return_value = True
            mock_get_client.return_value = mock_client

            error = ValueError("Test error")
            listener.on_task_instance_failed(
                previous_state=None,
                task_instance=mock_task_instance,
                error=error,
            )

            mock_client.capture_exception.assert_called_once()
            call_kwargs = mock_client.capture_exception.call_args[1]
            assert call_kwargs["exception"] == error


class TestOnDagRunRunning:
    """Tests for on_dag_run_running listener."""

    def test_sends_dag_run_start(self, mock_dag_run):
        """Test that running listener sends DAG run start."""
        from granyt_sdk.integrations.airflow import listener

        if not listener.AIRFLOW_LISTENERS_AVAILABLE:
            pytest.skip("Airflow listeners not available")

        with patch.object(listener, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.is_enabled.return_value = True
            mock_get_client.return_value = mock_client

            listener.on_dag_run_running(dag_run=mock_dag_run)

            mock_client.send_dag_run_start.assert_called_once_with(mock_dag_run)


class TestOnDagRunSuccess:
    """Tests for on_dag_run_success listener."""

    def test_sends_dag_run_complete(self, mock_dag_run):
        """Test that success listener sends DAG run complete."""
        from granyt_sdk.integrations.airflow import listener

        if not listener.AIRFLOW_LISTENERS_AVAILABLE:
            pytest.skip("Airflow listeners not available")

        with patch.object(listener, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.is_enabled.return_value = True
            mock_get_client.return_value = mock_client

            listener.on_dag_run_success(dag_run=mock_dag_run)

            mock_client.send_dag_run_complete.assert_called_once_with(mock_dag_run)


class TestOnDagRunFailed:
    """Tests for on_dag_run_failed listener."""

    def test_sends_dag_run_failed(self, mock_dag_run):
        """Test that failed listener sends DAG run failed."""
        from granyt_sdk.integrations.airflow import listener

        if not listener.AIRFLOW_LISTENERS_AVAILABLE:
            pytest.skip("Airflow listeners not available")

        with patch.object(listener, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.is_enabled.return_value = True
            mock_get_client.return_value = mock_client

            listener.on_dag_run_failed(dag_run=mock_dag_run)

            mock_client.send_dag_run_failed.assert_called_once_with(mock_dag_run)
