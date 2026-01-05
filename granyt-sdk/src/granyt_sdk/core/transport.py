"""
HTTP Transport module for Granyt SDK.

Handles all HTTP communication with the Granyt backend with retry logic
and proper error handling.
"""

import json
import logging
import time
from typing import Any, Dict, Optional
from queue import Queue, Empty
from threading import Thread, Event
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from granyt_sdk.core.config import GranytConfig

logger = logging.getLogger(__name__)


class GranytTransport:
    """HTTP Transport for sending events to Granyt backend.
    
    Features:
    - Automatic retries with exponential backoff
    - Connection pooling
    - Async batch processing for error events
    - Graceful shutdown
    """
    
    def __init__(self, config: GranytConfig):
        self.config = config
        self._session: Optional[requests.Session] = None
        self._error_queue: Queue = Queue()
        self._shutdown_event = Event()
        self._flush_thread: Optional[Thread] = None
        
        if config.is_valid():
            self._init_session()
            self._start_flush_thread()
    
    def _init_session(self) -> None:
        """Initialize HTTP session with retry configuration."""
        self._session = requests.Session()
        
        retry_strategy = Retry(
            total=self.config.max_retries,
            backoff_factor=self.config.retry_delay,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "POST", "PUT", "DELETE", "OPTIONS", "TRACE"],
            raise_on_status=False,
        )
        
        adapter = HTTPAdapter(
            max_retries=retry_strategy,
            pool_connections=10,
            pool_maxsize=20,
        )
        
        self._session.mount("http://", adapter)
        self._session.mount("https://", adapter)
        self._session.headers.update(self.config.get_headers())
    
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
        errors = []
        try:
            while len(errors) < self.config.batch_size:
                error = self._error_queue.get_nowait()
                errors.append(error)
        except Empty:
            pass
        
        if errors:
            self._send_errors_batch(errors)
    
    def _send_errors_batch(self, errors: list) -> None:
        """Send a batch of errors to the backend."""
        if not self._session or not self.config.is_valid():
            return
        
        try:
            response = self._session.post(
                self.config.get_errors_url(),
                json={"errors": errors},
                timeout=self.config.timeout,
            )
            
            if response.status_code >= 400:
                logger.warning(
                    f"Failed to send error batch: {response.status_code} - {response.text}"
                )
            elif self.config.debug:
                logger.debug(f"Sent {len(errors)} errors to backend")
                
        except requests.RequestException as e:
            logger.error(f"Failed to send error batch: {e}")
    
    def send_lineage_event(self, event: Dict[str, Any]) -> bool:
        """Send a lineage event to the backend.
        
        Args:
            event: OpenLineage-compatible event dictionary
            
        Returns:
            True if event was sent successfully, False otherwise
        """
        if not self._session or not self.config.is_valid():
            if self.config.debug:
                logger.debug("SDK disabled or invalid config - skipping lineage event")
            return False
        
        try:
            if self.config.debug:
                logger.debug(f"Sending lineage event: {json.dumps(event, default=str)[:500]}...")
            
            response = self._session.post(
                self.config.get_lineage_url(),
                json=event,
                timeout=self.config.timeout,
            )
            
            if response.status_code >= 400:
                logger.warning(
                    f"Failed to send lineage event: {response.status_code} - {response.text}"
                )
                return False
            
            if self.config.debug:
                logger.debug(f"Lineage event sent successfully")
            return True
            
        except requests.RequestException as e:
            logger.error(f"Failed to send lineage event: {e}")
            return False
    
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
        """Send an error event synchronously (for critical errors).
        
        Args:
            error: Error event dictionary
            
        Returns:
            True if event was sent successfully, False otherwise
        """
        if not self._session or not self.config.is_valid():
            logger.warning("Cannot send error event: session not initialized or invalid config")
            return False
        
        try:
            url = self.config.get_errors_url()
            logger.debug(f"Sending error event to {url}")
            
            response = self._session.post(
                url,
                json={"errors": [error]},
                timeout=self.config.timeout,
            )
            
            if response.status_code >= 400:
                logger.warning(
                    f"Failed to send error event: {response.status_code} - {response.text}"
                )
                return False
            
            logger.debug(f"Error event sent successfully: {response.status_code}")
            return True
            
        except requests.RequestException as e:
            logger.error(f"Failed to send error event: {e}")
            return False
    
    def send_heartbeat(self, metadata: Dict[str, Any]) -> bool:
        """Send a heartbeat to the backend.
        
        Args:
            metadata: Heartbeat metadata
            
        Returns:
            True if heartbeat was sent successfully, False otherwise
        """
        if not self._session or not self.config.is_valid():
            return False
        
        try:
            response = self._session.post(
                self.config.get_heartbeat_url(),
                json=metadata,
                timeout=self.config.timeout,
            )
            
            return response.status_code < 400
            
        except requests.RequestException as e:
            logger.error(f"Failed to send heartbeat: {e}")
            return False
    
    def send_data_metrics(self, metrics: Dict[str, Any]) -> bool:
        """Send data metrics to the backend.
        
        Args:
            metrics: Data metrics dictionary
            
        Returns:
            True if metrics were sent successfully, False otherwise
        """
        if not self._session or not self.config.is_valid():
            if self.config.debug:
                logger.debug("SDK disabled or invalid config - skipping data metrics")
            return False
        
        try:
            if self.config.debug:
                logger.debug(f"Sending data metrics: {json.dumps(metrics, default=str)[:500]}...")
            
            response = self._session.post(
                self.config.get_data_metrics_url(),
                json=metrics,
                timeout=self.config.timeout,
            )
            
            if response.status_code >= 400:
                logger.warning(
                    f"Failed to send data metrics: {response.status_code} - {response.text}"
                )
                return False
            
            if self.config.debug:
                logger.debug("Data metrics sent successfully")
            return True
            
        except requests.RequestException as e:
            logger.error(f"Failed to send data metrics: {e}")
            return False
    
    def send_operator_metrics(self, metrics: Dict[str, Any]) -> bool:
        """Send operator-specific metrics to the backend.
        
        These metrics include operator-specific data like rows processed,
        query stats, bytes transferred, etc.
        
        Args:
            metrics: Operator metrics dictionary
            
        Returns:
            True if metrics were sent successfully, False otherwise
        """
        if not self._session or not self.config.is_valid():
            if self.config.debug:
                logger.debug("SDK disabled or invalid config - skipping operator metrics")
            return False
        
        try:
            if self.config.debug:
                logger.debug(
                    f"Sending operator metrics ({metrics.get('operator_type', 'unknown')}): "
                    f"{json.dumps(metrics, default=str)[:500]}..."
                )
            
            response = self._session.post(
                self.config.get_operator_metrics_url(),
                json=metrics,
                timeout=self.config.timeout,
            )
            
            if response.status_code >= 400:
                logger.warning(
                    f"Failed to send operator metrics: {response.status_code} - {response.text}"
                )
                return False
            
            if self.config.debug:
                logger.debug("Operator metrics sent successfully")
            return True
            
        except requests.RequestException as e:
            logger.error(f"Failed to send operator metrics: {e}")
            return False
    
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
        
        # Close session
        if self._session:
            self._session.close()
            self._session = None
