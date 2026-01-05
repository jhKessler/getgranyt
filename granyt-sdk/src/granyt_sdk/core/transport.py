"""
HTTP Transport module for Granyt SDK.

Handles all HTTP communication with the Granyt backend with retry logic
and proper error handling. Supports multi-endpoint broadcasting.
"""

import json
import logging
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from queue import Empty, Queue
from threading import Event, Thread
from typing import Any, Callable, Dict, List, Optional, Tuple

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from granyt_sdk.core.config import EndpointConfig, GranytConfig

logger = logging.getLogger(__name__)


class EndpointSession:
    """HTTP session for a single endpoint."""

    def __init__(self, endpoint_config: EndpointConfig, global_config: GranytConfig):
        self.endpoint_config = endpoint_config
        self.global_config = global_config
        self.session = self._create_session()

    def _create_session(self) -> requests.Session:
        """Create HTTP session with retry configuration."""
        session = requests.Session()

        retry_strategy = Retry(
            total=self.global_config.max_retries,
            backoff_factor=self.global_config.retry_delay,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "POST", "PUT", "DELETE", "OPTIONS", "TRACE"],
            raise_on_status=False,
        )

        adapter = HTTPAdapter(
            max_retries=retry_strategy,
            pool_connections=10,
            pool_maxsize=20,
        )

        session.mount("http://", adapter)
        session.mount("https://", adapter)
        session.headers.update(self.endpoint_config.get_headers())

        return session

    def close(self) -> None:
        """Close the session."""
        self.session.close()


class GranytTransport:
    """HTTP Transport for sending events to Granyt backend.

    Features:
    - Multi-endpoint support: broadcasts events to all configured endpoints
    - Automatic retries with exponential backoff per endpoint
    - Connection pooling
    - Async batch processing for error events
    - Graceful shutdown
    - Parallel sending via ThreadPoolExecutor
    """

    def __init__(self, config: GranytConfig):
        self.config = config
        self._endpoint_sessions: List[EndpointSession] = []
        self._error_queue: Queue = Queue()
        self._shutdown_event = Event()
        self._flush_thread: Optional[Thread] = None
        self._executor: Optional[ThreadPoolExecutor] = None

        if config.is_valid():
            self._init_sessions()
            self._start_flush_thread()

    def _init_sessions(self) -> None:
        """Initialize HTTP sessions for all configured endpoints."""
        endpoints = self.config.get_all_endpoints()
        self._endpoint_sessions = [EndpointSession(ep, self.config) for ep in endpoints]
        # Create thread pool for parallel sending
        self._executor = ThreadPoolExecutor(max_workers=max(len(endpoints), 2))

        if self.config.debug:
            logger.debug(f"Initialized {len(endpoints)} endpoint session(s)")

    def _init_session(self) -> None:
        """Legacy method - calls _init_sessions for backward compatibility."""
        self._init_sessions()

    def _start_flush_thread(self) -> None:
        """Start background thread for flushing error events."""
        self._flush_thread = Thread(target=self._flush_loop, daemon=True)
        self._flush_thread.start()

    def _flush_loop(self) -> None:
        """Background loop for flushing error events in batches."""
        while not self._shutdown_event.is_set():
            try:
                self._flush_errors()
            except Exception as e:
                logger.error(f"Error in flush loop: {e}")

            # Wait for flush interval or shutdown
            self._shutdown_event.wait(timeout=self.config.flush_interval)

    def _flush_errors(self) -> None:
        """Flush queued error events to backend."""
        errors: list[dict[str, Any]] = []
        try:
            while len(errors) < self.config.batch_size:
                error = self._error_queue.get_nowait()
                errors.append(error)
        except Empty:
            pass

        if errors:
            self._send_errors_batch(errors)

    def _send_to_single_endpoint(
        self,
        endpoint_session: EndpointSession,
        url: str,
        payload: Dict[str, Any],
    ) -> Tuple[str, bool, Optional[str]]:
        """Send data to a single endpoint.

        Returns:
            Tuple of (endpoint_url, success, error_message)
        """
        try:
            response = endpoint_session.session.post(
                url,
                json=payload,
                timeout=self.config.timeout,
            )

            if response.status_code >= 400:
                return (
                    endpoint_session.endpoint_config.endpoint,
                    False,
                    f"{response.status_code} - {response.text}",
                )

            return (endpoint_session.endpoint_config.endpoint, True, None)

        except requests.RequestException as e:
            return (endpoint_session.endpoint_config.endpoint, False, str(e))

    def _broadcast_to_all_endpoints(
        self,
        url_getter: Callable[[EndpointConfig], str],
        payload: Dict[str, Any],
        event_type: str,
    ) -> bool:
        """Broadcast data to all configured endpoints in parallel.

        Args:
            url_getter: Function to get URL from EndpointConfig
            payload: Data to send
            event_type: Type of event for logging

        Returns:
            True if at least one endpoint received the event successfully
        """
        if not self._endpoint_sessions or not self.config.is_valid():
            if self.config.debug:
                logger.debug(f"SDK disabled or no endpoints - skipping {event_type}")
            return False

        if not self._executor:
            return False

        futures = []
        for ep_session in self._endpoint_sessions:
            url = url_getter(ep_session.endpoint_config)
            future = self._executor.submit(self._send_to_single_endpoint, ep_session, url, payload)
            futures.append(future)

        success_count = 0
        for future in as_completed(futures):
            endpoint, success, error = future.result()
            if success:
                success_count += 1
                if self.config.debug:
                    logger.debug(f"{event_type} sent successfully to {endpoint}")
            else:
                logger.warning(f"Failed to send {event_type} to {endpoint}: {error}")

        return success_count > 0

    def _send_errors_batch(self, errors: list) -> None:
        """Send a batch of errors to all endpoints."""
        if not self._endpoint_sessions or not self.config.is_valid():
            return

        payload = {"errors": errors}
        success = self._broadcast_to_all_endpoints(
            lambda ep: ep.get_errors_url(),
            payload,
            f"error batch ({len(errors)} errors)",
        )

        if success and self.config.debug:
            logger.debug(f"Sent {len(errors)} errors to backend(s)")

    def send_lineage_event(self, event: Dict[str, Any]) -> bool:
        """Send a lineage event to all configured endpoints.

        Args:
            event: OpenLineage-compatible event dictionary

        Returns:
            True if event was sent to at least one endpoint successfully, False otherwise
        """
        if self.config.debug:
            logger.debug(f"Sending lineage event: {json.dumps(event, default=str)[:500]}...")

        return self._broadcast_to_all_endpoints(
            lambda ep: ep.get_lineage_url(),
            event,
            "lineage event",
        )

    def send_error_event(self, error: Dict[str, Any]) -> None:
        """Queue an error event for batch sending.

        Args:
            error: Error event dictionary
        """
        if not self.config.is_valid():
            if self.config.debug:
                logger.debug("SDK disabled or invalid config - skipping error event")
            return

        self._error_queue.put(error)

        if self.config.debug:
            logger.debug(f"Error event queued (queue size: {self._error_queue.qsize()})")

    def send_error_event_sync(self, error: Dict[str, Any]) -> bool:
        """Send an error event synchronously to all endpoints (for critical errors).

        Args:
            error: Error event dictionary

        Returns:
            True if event was sent to at least one endpoint successfully, False otherwise
        """
        if not self._endpoint_sessions or not self.config.is_valid():
            logger.warning("Cannot send error event: no endpoints configured or invalid config")
            return False

        return self._broadcast_to_all_endpoints(
            lambda ep: ep.get_errors_url(),
            {"errors": [error]},
            "error event (sync)",
        )

    def send_heartbeat(self, metadata: Dict[str, Any]) -> bool:
        """Send a heartbeat to all configured endpoints.

        Args:
            metadata: Heartbeat metadata

        Returns:
            True if heartbeat was sent to at least one endpoint successfully, False otherwise
        """
        return self._broadcast_to_all_endpoints(
            lambda ep: ep.get_heartbeat_url(),
            metadata,
            "heartbeat",
        )

    def send_data_metrics(self, metrics: Dict[str, Any]) -> bool:
        """Send data metrics to all configured endpoints.

        Args:
            metrics: Data metrics dictionary

        Returns:
            True if metrics were sent to at least one endpoint successfully, False otherwise
        """
        if self.config.debug:
            logger.debug(f"Sending data metrics: {json.dumps(metrics, default=str)[:500]}...")

        return self._broadcast_to_all_endpoints(
            lambda ep: ep.get_data_metrics_url(),
            metrics,
            "data metrics",
        )

    def send_operator_metrics(self, metrics: Dict[str, Any]) -> bool:
        """Send operator-specific metrics to all configured endpoints.

        These metrics include operator-specific data like rows processed,
        query stats, bytes transferred, etc.

        Args:
            metrics: Operator metrics dictionary

        Returns:
            True if metrics were sent to at least one endpoint successfully, False otherwise
        """
        if self.config.debug:
            logger.debug(
                f"Sending operator metrics ({metrics.get('operator_type', 'unknown')}): "
                f"{json.dumps(metrics, default=str)[:500]}..."
            )

        return self._broadcast_to_all_endpoints(
            lambda ep: ep.get_operator_metrics_url(),
            metrics,
            "operator metrics",
        )

    def flush(self) -> None:
        """Force flush all queued events."""
        self._flush_errors()

    def close(self) -> None:
        """Gracefully shutdown the transport."""
        # Signal shutdown
        self._shutdown_event.set()

        # Flush remaining events
        self._flush_errors()

        # Wait for flush thread to finish
        if self._flush_thread and self._flush_thread.is_alive():
            self._flush_thread.join(timeout=5.0)

        # Shutdown executor
        if self._executor:
            self._executor.shutdown(wait=True)
            self._executor = None

        # Close all endpoint sessions
        for ep_session in self._endpoint_sessions:
            ep_session.close()
        self._endpoint_sessions = []
