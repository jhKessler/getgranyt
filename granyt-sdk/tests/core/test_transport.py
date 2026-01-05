"""
Tests for granyt_sdk.core.transport module.
"""

import json
import pytest
from unittest.mock import MagicMock, patch, PropertyMock
from queue import Queue
import requests

from granyt_sdk.core.config import GranytConfig, EndpointConfig
from granyt_sdk.core.transport import GranytTransport, EndpointSession


@pytest.fixture
def valid_config():
    """Create a valid config for transport tests."""
    return GranytConfig(
        endpoint="https://api.granyt.dev",
        api_key="test-api-key",
        debug=False,
        disabled=False,
        max_retries=3,
        retry_delay=0.1,  # Fast retries for tests
        batch_size=10,
        flush_interval=0.1,  # Fast flush for tests
        timeout=5.0,
    )


@pytest.fixture
def multi_endpoint_config():
    """Create a config with multiple endpoints."""
    return GranytConfig(
        endpoints_json='[{"endpoint":"https://prod.granyt.io","api_key":"prod-key"},{"endpoint":"https://dev.granyt.io","api_key":"dev-key"}]',
        debug=False,
        disabled=False,
        max_retries=3,
        retry_delay=0.1,
        batch_size=10,
        flush_interval=0.1,
        timeout=5.0,
    )


@pytest.fixture
def invalid_config():
    """Create an invalid config."""
    return GranytConfig()


class TestTransportInitialization:
    """Tests for GranytTransport initialization."""

    @patch("granyt_sdk.core.transport.GranytTransport._init_sessions")
    @patch("granyt_sdk.core.transport.GranytTransport._start_flush_thread")
    def test_init_with_valid_config(self, mock_flush, mock_sessions, valid_config):
        """Test transport initializes with valid config."""
        transport = GranytTransport(valid_config)

        mock_sessions.assert_called_once()
        mock_flush.assert_called_once()
        assert transport.config == valid_config

    @patch("granyt_sdk.core.transport.GranytTransport._init_sessions")
    @patch("granyt_sdk.core.transport.GranytTransport._start_flush_thread")
    def test_init_with_invalid_config(self, mock_flush, mock_sessions, invalid_config):
        """Test transport does not initialize session with invalid config."""
        transport = GranytTransport(invalid_config)

        mock_sessions.assert_not_called()
        mock_flush.assert_not_called()

    @patch("requests.Session")
    def test_init_creates_endpoint_sessions(self, mock_session_class, valid_config):
        """Test that endpoint sessions are created for each endpoint."""
        transport = GranytTransport(valid_config)

        assert len(transport._endpoint_sessions) == 1
        assert transport._executor is not None

    @patch("requests.Session")
    def test_init_multi_endpoint(self, mock_session_class, multi_endpoint_config):
        """Test initialization with multiple endpoints."""
        transport = GranytTransport(multi_endpoint_config)

        assert len(transport._endpoint_sessions) == 2
        transport.close()


class TestSendLineageEvent:
    """Tests for GranytTransport.send_lineage_event()."""

    def test_send_lineage_event_success(self, valid_config):
        """Test successful lineage event send."""
        with patch("requests.Session") as mock_session_class:
            mock_session = MagicMock()
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_session.post.return_value = mock_response
            mock_session_class.return_value = mock_session

            transport = GranytTransport(valid_config)

            event = {"eventType": "START", "job": {"name": "test"}}
            result = transport.send_lineage_event(event)

            assert result is True
            mock_session.post.assert_called_once()
            call_args = mock_session.post.call_args
            assert "lineage" in call_args[0][0]
            transport.close()

    def test_send_lineage_event_failure_4xx(self, valid_config):
        """Test lineage event send failure with 4xx response."""
        with patch("requests.Session") as mock_session_class:
            mock_session = MagicMock()
            mock_response = MagicMock()
            mock_response.status_code = 400
            mock_response.text = "Bad request"
            mock_session.post.return_value = mock_response
            mock_session_class.return_value = mock_session

            transport = GranytTransport(valid_config)

            result = transport.send_lineage_event({"test": "event"})

            assert result is False
            transport.close()

    def test_send_lineage_event_failure_5xx(self, valid_config):
        """Test lineage event send failure with 5xx response."""
        with patch("requests.Session") as mock_session_class:
            mock_session = MagicMock()
            mock_response = MagicMock()
            mock_response.status_code = 500
            mock_response.text = "Internal server error"
            mock_session.post.return_value = mock_response
            mock_session_class.return_value = mock_session

            transport = GranytTransport(valid_config)

            result = transport.send_lineage_event({"test": "event"})

            assert result is False
            transport.close()

    def test_send_lineage_event_disabled(self, invalid_config):
        """Test lineage event send when disabled."""
        transport = GranytTransport(invalid_config)

        result = transport.send_lineage_event({"test": "event"})

        assert result is False

    def test_send_lineage_event_network_error(self, valid_config):
        """Test lineage event send with network error."""
        with patch("requests.Session") as mock_session_class:
            mock_session = MagicMock()
            mock_session.post.side_effect = requests.RequestException("Connection failed")
            mock_session_class.return_value = mock_session

            transport = GranytTransport(valid_config)

            result = transport.send_lineage_event({"test": "event"})

            assert result is False
            transport.close()

    def test_send_lineage_event_multi_endpoint(self, multi_endpoint_config):
        """Test lineage event sent to all endpoints."""
        with patch("requests.Session") as mock_session_class:
            mock_session = MagicMock()
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_session.post.return_value = mock_response
            mock_session_class.return_value = mock_session

            transport = GranytTransport(multi_endpoint_config)

            event = {"eventType": "START", "job": {"name": "test"}}
            result = transport.send_lineage_event(event)

            assert result is True
            # Should be called for each endpoint (2 endpoints)
            assert mock_session.post.call_count == 2
            transport.close()

    def test_send_lineage_event_partial_failure(self, multi_endpoint_config):
        """Test lineage event succeeds if at least one endpoint succeeds."""
        with patch("requests.Session") as mock_session_class:
            mock_session = MagicMock()
            # First call succeeds, second fails
            mock_response_success = MagicMock(status_code=200)
            mock_response_fail = MagicMock(status_code=500, text="Server error")
            mock_session.post.side_effect = [mock_response_success, mock_response_fail]
            mock_session_class.return_value = mock_session

            transport = GranytTransport(multi_endpoint_config)

            result = transport.send_lineage_event({"test": "event"})

            assert result is True  # At least one succeeded
            transport.close()


class TestSendErrorEvent:
    """Tests for GranytTransport error event methods."""

    def test_send_error_event_queues(self, valid_config):
        """Test error event is queued."""
        with patch("requests.Session"):
            transport = GranytTransport(valid_config)
            transport._error_queue = Queue()

            error = {"error_id": "123", "message": "Test error"}
            transport.send_error_event(error)

            assert transport._error_queue.qsize() == 1
            assert transport._error_queue.get() == error
            transport.close()

    def test_send_error_event_disabled(self, invalid_config):
        """Test error event not queued when disabled."""
        transport = GranytTransport(invalid_config)
        transport._error_queue = Queue()

        transport.send_error_event({"error": "test"})

        assert transport._error_queue.qsize() == 0

    def test_send_error_event_sync_success(self, valid_config):
        """Test synchronous error event send."""
        with patch("requests.Session") as mock_session_class:
            mock_session = MagicMock()
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_session.post.return_value = mock_response
            mock_session_class.return_value = mock_session

            transport = GranytTransport(valid_config)

            error = {"error_id": "123", "message": "Test error"}
            result = transport.send_error_event_sync(error)

            assert result is True
            mock_session.post.assert_called_once()
            transport.close()

    def test_send_error_event_sync_failure(self, valid_config):
        """Test synchronous error event send failure."""
        with patch("requests.Session") as mock_session_class:
            mock_session = MagicMock()
            mock_response = MagicMock()
            mock_response.status_code = 500
            mock_response.text = "Server error"
            mock_session.post.return_value = mock_response
            mock_session_class.return_value = mock_session

            transport = GranytTransport(valid_config)

            result = transport.send_error_event_sync({"error": "test"})

            assert result is False
            transport.close()


class TestSendDataMetrics:
    """Tests for GranytTransport.send_data_metrics()."""

    def test_send_data_metrics_success(self, valid_config):
        """Test successful data metrics send."""
        with patch("requests.Session") as mock_session_class:
            mock_session = MagicMock()
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_session.post.return_value = mock_response
            mock_session_class.return_value = mock_session

            transport = GranytTransport(valid_config)

            metrics = {"capture_id": "test", "row_count": 100}
            result = transport.send_data_metrics(metrics)

            assert result is True
            mock_session.post.assert_called_once()
            call_args = mock_session.post.call_args
            assert "metrics" in call_args[0][0]
            transport.close()

    def test_send_data_metrics_failure(self, valid_config):
        """Test data metrics send failure."""
        with patch("requests.Session") as mock_session_class:
            mock_session = MagicMock()
            mock_response = MagicMock()
            mock_response.status_code = 400
            mock_response.text = "Bad request"
            mock_session.post.return_value = mock_response
            mock_session_class.return_value = mock_session

            transport = GranytTransport(valid_config)

            result = transport.send_data_metrics({"test": "metrics"})

            assert result is False
            transport.close()

    def test_send_data_metrics_disabled(self, invalid_config):
        """Test data metrics send when disabled."""
        transport = GranytTransport(invalid_config)

        result = transport.send_data_metrics({"test": "metrics"})

        assert result is False


class TestSendOperatorMetrics:
    """Tests for GranytTransport.send_operator_metrics()."""

    def test_send_operator_metrics_success(self, valid_config):
        """Test successful operator metrics send."""
        with patch("requests.Session") as mock_session_class:
            mock_session = MagicMock()
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_session.post.return_value = mock_response
            mock_session_class.return_value = mock_session

            transport = GranytTransport(valid_config)

            metrics = {"operator_type": "snowflake", "row_count": 100}
            result = transport.send_operator_metrics(metrics)

            assert result is True
            transport.close()


class TestSendHeartbeat:
    """Tests for GranytTransport.send_heartbeat()."""

    def test_send_heartbeat_success(self, valid_config):
        """Test successful heartbeat send."""
        with patch("requests.Session") as mock_session_class:
            mock_session = MagicMock()
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_session.post.return_value = mock_response
            mock_session_class.return_value = mock_session

            transport = GranytTransport(valid_config)

            metadata = {"timestamp": "2026-01-05T00:00:00Z"}
            result = transport.send_heartbeat(metadata)

            assert result is True
            call_args = mock_session.post.call_args
            assert "heartbeat" in call_args[0][0]
            transport.close()

    def test_send_heartbeat_failure(self, valid_config):
        """Test heartbeat send failure."""
        with patch("requests.Session") as mock_session_class:
            mock_session = MagicMock()
            mock_response = MagicMock()
            mock_response.status_code = 500
            mock_session.post.return_value = mock_response
            mock_session_class.return_value = mock_session

            transport = GranytTransport(valid_config)

            result = transport.send_heartbeat({})

            assert result is False
            transport.close()


class TestFlushAndClose:
    """Tests for flush and close methods."""

    def test_flush_sends_queued_errors(self, valid_config):
        """Test flush sends queued errors."""
        with patch("requests.Session") as mock_session_class:
            mock_session = MagicMock()
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_session.post.return_value = mock_response
            mock_session_class.return_value = mock_session

            transport = GranytTransport(valid_config)

            # Queue some errors
            transport._error_queue.put({"error": "1"})
            transport._error_queue.put({"error": "2"})

            transport.flush()

            # Check that errors were sent
            assert transport._error_queue.qsize() == 0
            transport.close()

    def test_close_sets_shutdown_event(self, valid_config):
        """Test close sets shutdown event."""
        with patch("requests.Session"):
            transport = GranytTransport(valid_config)

            assert not transport._shutdown_event.is_set()

            transport.close()

            assert transport._shutdown_event.is_set()
            assert len(transport._endpoint_sessions) == 0

    def test_close_shuts_down_executor(self, valid_config):
        """Test close shuts down the thread pool executor."""
        with patch("requests.Session"):
            transport = GranytTransport(valid_config)

            assert transport._executor is not None

            transport.close()

            assert transport._executor is None


class TestEndpointSession:
    """Tests for EndpointSession class."""

    def test_endpoint_session_creation(self, valid_config):
        """Test creating an EndpointSession."""
        ep_config = EndpointConfig(endpoint="https://api.granyt.io", api_key="test-key")

        with patch("requests.Session") as mock_session_class:
            mock_session = MagicMock()
            mock_session_class.return_value = mock_session

            session = EndpointSession(ep_config, valid_config)

            assert session.endpoint_config == ep_config
            assert session.global_config == valid_config
            mock_session.headers.update.assert_called_once()

    def test_endpoint_session_close(self, valid_config):
        """Test closing an EndpointSession."""
        ep_config = EndpointConfig(endpoint="https://api.granyt.io", api_key="test-key")

        with patch("requests.Session") as mock_session_class:
            mock_session = MagicMock()
            mock_session_class.return_value = mock_session

            session = EndpointSession(ep_config, valid_config)
            session.close()

            mock_session.close.assert_called_once()
