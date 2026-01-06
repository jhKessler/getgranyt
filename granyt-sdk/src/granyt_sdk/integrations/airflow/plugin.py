"""
Granyt Airflow Plugin.

This plugin automatically registers Granyt's listeners with Airflow,
enabling automatic lineage tracking and error capture without any
user configuration beyond setting environment variables.
"""

import logging

logger = logging.getLogger(__name__)

try:
    from airflow.plugins_manager import AirflowPlugin

    AIRFLOW_AVAILABLE = True
except ImportError:
    AIRFLOW_AVAILABLE = False

    class AirflowPlugin:  # type: ignore[no-redef]
        """Stub for AirflowPlugin."""

        pass


if AIRFLOW_AVAILABLE:
    # Import the listener module
    from granyt_sdk.integrations.airflow import listener

    class GranytPlugin(AirflowPlugin):  # type: ignore[misc]
        """Airflow plugin for Granyt SDK."""

        name = "GRANYT_plugin"

        # Register the listener module with Airflow
        listeners: list = [listener]

        @classmethod
        def on_load(cls, *args, **kwargs):
            """Called when the plugin is loaded by Airflow."""
            try:
                from granyt_sdk.core.client import get_client

                client = get_client()

                if client.is_enabled():
                    logger.info(
                        f"Granyt plugin loaded successfully "
                        f"(endpoint: {client.get_config().get('endpoint')})"
                    )
                else:
                    logger.warning(
                        "Granyt plugin loaded but SDK is disabled. "
                        "Set GRANYT_ENDPOINT and GRANYT_API_KEY to enable."
                    )
            except Exception as e:
                logger.error(f"Failed to initialize Granyt plugin: {e}")

else:

    class GranytPlugin:  # type: ignore[no-redef]
        """Stub plugin for when Airflow is not installed."""

        name = "GRANYT_plugin"
        listeners: list = []
