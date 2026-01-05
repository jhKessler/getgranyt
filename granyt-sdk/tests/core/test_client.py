"""
Tests for granyt_sdk.core.client module.
"""

import pytest
from unittest.mock import MagicMock, patch, PropertyMock
from datetime import datetime, timezone

from granyt_sdk.core.client import GranytClient, get_client
from granyt_sdk.core.config import GranytConfig


class TestClientSingleton:
    """Tests for GranytClient singleton pattern."""

    def test_singleton_returns_same_instance(self, valid_env):
        """Test that GranytClient returns the same instance."""
        client1 = GranytClient()
        client2 = GranytClient()

        assert client1 is client2

    def test_get_client_returns_singleton(self, valid_env):
        """Test that get_client returns singleton instance."""
        client1 = get_client()
        client2 = get_client()

        assert client1 is client2

    def test_get_client_same_as_direct_instantiation(self, valid_env):
        """Test get_client returns same as direct instantiation."""
        client1 = GranytClient()
        client2 = get_client()

        assert client1 is client2


class TestClientInitialization:
    """Tests for GranytClient initialization."""

    def test_client_initializes_with_valid_env(self, valid_env):
        """Test client initializes properly with valid environment."""
        client = GranytClient()

        assert client.is_enabled() is True
        assert client._config.endpoint == "https://api.granyt.dev"

    def test_client_disabled_without_credentials(self, clean_env):
        """Test client is disabled without credentials."""
        client = GranytClient()

        assert client.is_enabled() is False

    def test_client_disabled_with_disabled_flag(self, valid_env):
        """Test client is disabled when GRANYT_DISABLED is set."""
        valid_env.setenv("GRANYT_DISABLED", "true")
        client = GranytClient()

        assert client.is_enabled() is False


class TestClientGetConfig:
    """Tests for GranytClient.get_config()."""

    def test_get_config_returns_dict(self, valid_env):
        """Test get_config returns a dictionary."""
        client = GranytClient()
        config = client.get_config()

        assert isinstance(config, dict)
        assert "endpoint" in config
        assert "api_key" in config

    def test_get_config_masks_api_key(self, valid_env):
        """Test get_config masks API key."""
        client = GranytClient()
        config = client.get_config()

        assert config["api_key"] == "***"


class TestRunIdCache:
    """Tests for run ID caching."""

    def test_get_or_create_run_id_creates_new(self, valid_env):
        """Test get_or_create_run_id creates new ID."""
        client = GranytClient()

        run_id = client.get_or_create_run_id("dag1", "task1", "run1")

        assert run_id is not None
        assert len(run_id) == 36  # UUID format

    def test_get_or_create_run_id_returns_cached(self, valid_env):
        """Test get_or_create_run_id returns cached ID."""
        client = GranytClient()

        run_id1 = client.get_or_create_run_id("dag1", "task1", "run1")
        run_id2 = client.get_or_create_run_id("dag1", "task1", "run1")

        assert run_id1 == run_id2

    def test_get_or_create_run_id_different_for_different_tasks(self, valid_env):
        """Test different tasks get different run IDs."""
        client = GranytClient()

        run_id1 = client.get_or_create_run_id("dag1", "task1", "run1")
        run_id2 = client.get_or_create_run_id("dag1", "task2", "run1")

        assert run_id1 != run_id2

    def test_clear_run_id_removes_cached(self, valid_env):
        """Test clear_run_id removes the cached ID."""
        client = GranytClient()

        run_id1 = client.get_or_create_run_id("dag1", "task1", "run1")
        client.clear_run_id("dag1", "task1", "run1")
        run_id2 = client.get_or_create_run_id("dag1", "task1", "run1")

        assert run_id1 != run_id2


class TestSendTaskEvents:
    """Tests for task lineage event methods."""

    def test_send_task_start_disabled(self, clean_env):
        """Test send_task_start returns False when disabled."""
        client = GranytClient()

        result = client.send_task_start(MagicMock())

        assert result is False

    def test_send_task_start_success(self, valid_env, mock_task_instance):
        """Test send_task_start sends event."""
        client = GranytClient()
        mock_transport = MagicMock()
        mock_transport.send_lineage_event.return_value = True
        client._transport = mock_transport

        result = client.send_task_start(mock_task_instance)

        assert result is True
        mock_transport.send_lineage_event.assert_called_once()

    def test_send_task_complete_clears_run_id(self, valid_env, mock_task_instance):
        """Test send_task_complete clears the run ID cache."""
        client = GranytClient()
        mock_transport = MagicMock()
        mock_transport.send_lineage_event.return_value = True
        client._transport = mock_transport

        # Create a run ID first
        cache_key = (
            f"{mock_task_instance.dag_id}.{mock_task_instance.task_id}.{mock_task_instance.run_id}"
        )
        run_id = client.get_or_create_run_id(
            mock_task_instance.dag_id, mock_task_instance.task_id, mock_task_instance.run_id
        )
        assert cache_key in client._run_id_cache

        # Complete should clear it
        client.send_task_complete(mock_task_instance)

        assert cache_key not in client._run_id_cache

    def test_send_task_failed_with_error(self, valid_env, mock_task_instance):
        """Test send_task_failed includes error in event."""
        client = GranytClient()
        mock_transport = MagicMock()
        mock_transport.send_lineage_event.return_value = True
        client._transport = mock_transport

        error = ValueError("Test error")
        result = client.send_task_failed(mock_task_instance, error=error)

        assert result is True
        call_args = mock_transport.send_lineage_event.call_args
        event = call_args[0][0]
        assert event["eventType"] == "FAIL"

    def test_send_task_failed_disabled(self, clean_env):
        """Test send_task_failed returns False when disabled."""
        client = GranytClient()

        result = client.send_task_failed(MagicMock())

        assert result is False


class TestSendDagRunEvents:
    """Tests for DAG run lineage event methods."""

    def test_send_dag_run_start_disabled(self, clean_env):
        """Test send_dag_run_start returns False when disabled."""
        client = GranytClient()

        result = client.send_dag_run_start(MagicMock())

        assert result is False

    def test_send_dag_run_start_success(self, valid_env, mock_dag_run):
        """Test send_dag_run_start sends event."""
        client = GranytClient()
        mock_transport = MagicMock()
        mock_transport.send_lineage_event.return_value = True
        client._transport = mock_transport

        result = client.send_dag_run_start(mock_dag_run)

        assert result is True
        mock_transport.send_lineage_event.assert_called_once()

    def test_send_dag_run_complete_success(self, valid_env, mock_dag_run):
        """Test send_dag_run_complete sends event."""
        client = GranytClient()
        mock_transport = MagicMock()
        mock_transport.send_lineage_event.return_value = True
        client._transport = mock_transport

        result = client.send_dag_run_complete(mock_dag_run)

        assert result is True

    def test_send_dag_run_failed_success(self, valid_env, mock_dag_run):
        """Test send_dag_run_failed sends event."""
        client = GranytClient()
        mock_transport = MagicMock()
        mock_transport.send_lineage_event.return_value = True
        client._transport = mock_transport

        result = client.send_dag_run_failed(mock_dag_run)

        assert result is True


class TestCaptureException:
    """Tests for exception capture methods."""

    def test_capture_exception_disabled(self, clean_env, sample_exception):
        """Test capture_exception returns None when disabled."""
        client = GranytClient()

        result = client.capture_exception(sample_exception)

        assert result is None

    def test_capture_exception_returns_error_id(self, valid_env, sample_exception):
        """Test capture_exception returns error ID."""
        client = GranytClient()
        mock_transport = MagicMock()
        client._transport = mock_transport

        result = client.capture_exception(sample_exception)

        assert result is not None
        assert len(result) == 36  # UUID format

    def test_capture_exception_sync(self, valid_env, sample_exception):
        """Test capture_exception with sync=True."""
        client = GranytClient()
        mock_transport = MagicMock()
        client._transport = mock_transport

        client.capture_exception(sample_exception, sync=True)

        mock_transport.send_error_event_sync.assert_called_once()

    def test_capture_exception_async(self, valid_env, sample_exception):
        """Test capture_exception with sync=False (default)."""
        client = GranytClient()
        mock_transport = MagicMock()
        client._transport = mock_transport

        client.capture_exception(sample_exception, sync=False)

        mock_transport.send_error_event.assert_called_once()


class TestCaptureMessage:
    """Tests for message capture."""

    def test_capture_message_disabled(self, clean_env):
        """Test capture_message returns None when disabled."""
        client = GranytClient()

        result = client.capture_message("Test message")

        assert result is None

    def test_capture_message_returns_id(self, valid_env):
        """Test capture_message returns message ID."""
        client = GranytClient()
        mock_transport = MagicMock()
        client._transport = mock_transport

        result = client.capture_message("Test message", level="info")

        assert result is not None


class TestSendMetrics:
    """Tests for metrics sending methods."""

    def test_send_data_metrics_disabled(self, clean_env):
        """Test send_data_metrics returns False when disabled."""
        client = GranytClient()
        mock_metrics = MagicMock()

        result = client.send_data_metrics(mock_metrics)

        assert result is False

    def test_send_data_metrics_success(self, valid_env):
        """Test send_data_metrics forwards to transport."""
        client = GranytClient()
        mock_transport = MagicMock()
        mock_transport.send_data_metrics.return_value = True
        client._transport = mock_transport

        mock_metrics = MagicMock()
        mock_metrics.to_dict.return_value = {"row_count": 100}

        result = client.send_data_metrics(mock_metrics)

        assert result is True
        mock_transport.send_data_metrics.assert_called_once()

    def test_send_operator_metrics_disabled(self, clean_env):
        """Test send_operator_metrics returns False when disabled."""
        client = GranytClient()
        mock_metrics = MagicMock()

        result = client.send_operator_metrics(mock_metrics)

        assert result is False


class TestUtilityMethods:
    """Tests for utility methods."""

    def test_flush_calls_transport(self, valid_env):
        """Test flush calls transport flush."""
        client = GranytClient()
        mock_transport = MagicMock()
        client._transport = mock_transport

        client.flush()

        mock_transport.flush.assert_called_once()

    def test_close_calls_transport(self, valid_env):
        """Test close calls transport close."""
        client = GranytClient()
        mock_transport = MagicMock()
        client._transport = mock_transport

        client.close()

        mock_transport.close.assert_called_once()

    def test_send_heartbeat_disabled(self, clean_env):
        """Test send_heartbeat returns False when disabled."""
        client = GranytClient()

        result = client.send_heartbeat()

        assert result is False

    def test_send_heartbeat_success(self, valid_env):
        """Test send_heartbeat sends metadata."""
        client = GranytClient()
        mock_transport = MagicMock()
        mock_transport.send_heartbeat.return_value = True
        client._transport = mock_transport

        result = client.send_heartbeat()

        assert result is True
        mock_transport.send_heartbeat.assert_called_once()
