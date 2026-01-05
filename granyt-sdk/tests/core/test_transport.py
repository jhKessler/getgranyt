"""
Tests for granyt_sdk.core.transport module.
"""

import json
import pytest
from unittest.mock import MagicMock, patch, PropertyMock
from queue import Queue
import requests

from granyt_sdk.core.config import GranytConfig
from granyt_sdk.core.transport import GranytTransport


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
def invalid_config():
    """Create an invalid config."""
    return GranytConfig()


class TestTransportInitialization:
    """Tests for GranytTransport initialization."""
    
    @patch("granyt_sdk.core.transport.GranytTransport._init_session")
    @patch("granyt_sdk.core.transport.GranytTransport._start_flush_thread")
    def test_init_with_valid_config(self, mock_flush, mock_session, valid_config):
        """Test transport initializes with valid config."""
        transport = GranytTransport(valid_config)
        
        mock_session.assert_called_once()
        mock_flush.assert_called_once()
        assert transport.config == valid_config
    
    @patch("granyt_sdk.core.transport.GranytTransport._init_session")
    @patch("granyt_sdk.core.transport.GranytTransport._start_flush_thread")
    def test_init_with_invalid_config(self, mock_flush, mock_session, invalid_config):
        """Test transport does not initialize session with invalid config."""
        transport = GranytTransport(invalid_config)
        
        mock_session.assert_not_called()
        mock_flush.assert_not_called()


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
            transport._session = mock_session
            
            event = {"eventType": "START", "job": {"name": "test"}}
            result = transport.send_lineage_event(event)
            
            assert result is True
            mock_session.post.assert_called_once()
            call_args = mock_session.post.call_args
            assert "lineage" in call_args[0][0]
    
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
            transport._session = mock_session
            
            result = transport.send_lineage_event({"test": "event"})
            
            assert result is False
    
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
            transport._session = mock_session
            
            result = transport.send_lineage_event({"test": "event"})
            
            assert result is False
    
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
            transport._session = mock_session
            
            result = transport.send_lineage_event({"test": "event"})
            
            assert result is False


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
            transport._session = mock_session
            
            error = {"error_id": "123", "message": "Test error"}
            result = transport.send_error_event_sync(error)
            
            assert result is True
            mock_session.post.assert_called_once()
    
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
            transport._session = mock_session
            
            result = transport.send_error_event_sync({"error": "test"})
            
            assert result is False


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
            transport._session = mock_session
            
            metrics = {"capture_id": "test", "row_count": 100}
            result = transport.send_data_metrics(metrics)
            
            assert result is True
            mock_session.post.assert_called_once()
            call_args = mock_session.post.call_args
            assert "metrics" in call_args[0][0]
    
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
            transport._session = mock_session
            
            result = transport.send_data_metrics({"test": "metrics"})
            
            assert result is False
    
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
            transport._session = mock_session
            
            metrics = {"operator_type": "snowflake", "row_count": 100}
            result = transport.send_operator_metrics(metrics)
            
            assert result is True


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
            transport._session = mock_session
            
            metadata = {"timestamp": "2026-01-05T00:00:00Z"}
            result = transport.send_heartbeat(metadata)
            
            assert result is True
            call_args = mock_session.post.call_args
            assert "heartbeat" in call_args[0][0]
    
    def test_send_heartbeat_failure(self, valid_config):
        """Test heartbeat send failure."""
        with patch("requests.Session") as mock_session_class:
            mock_session = MagicMock()
            mock_response = MagicMock()
            mock_response.status_code = 500
            mock_session.post.return_value = mock_response
            mock_session_class.return_value = mock_session
            
            transport = GranytTransport(valid_config)
            transport._session = mock_session
            
            result = transport.send_heartbeat({})
            
            assert result is False


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
            transport._session = mock_session
            
            # Queue some errors
            transport._error_queue.put({"error": "1"})
            transport._error_queue.put({"error": "2"})
            
            transport.flush()
            
            # Check that errors were sent
            assert transport._error_queue.qsize() == 0
    
    def test_close_sets_shutdown_event(self, valid_config):
        """Test close sets shutdown event."""
        with patch("requests.Session"):
            transport = GranytTransport(valid_config)
            
            assert not transport._shutdown_event.is_set()
            
            transport.close()
            
            assert transport._shutdown_event.is_set()
            assert transport._session is None
