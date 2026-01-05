"""
Tests for granyt_sdk.integrations.airflow.plugin module.
"""

import pytest
from unittest.mock import MagicMock, patch


class TestGranytPlugin:
    """Tests for GranytPlugin."""

    def test_plugin_imports(self):
        """Test that plugin module imports without error."""
        from granyt_sdk.integrations.airflow import plugin

        assert hasattr(plugin, "GranytPlugin")

    def test_plugin_name(self):
        """Test plugin has correct name."""
        from granyt_sdk.integrations.airflow.plugin import GranytPlugin

        assert GranytPlugin.name == "GRANYT_plugin"

    def test_plugin_has_listeners(self):
        """Test plugin has listeners attribute."""
        from granyt_sdk.integrations.airflow.plugin import GranytPlugin

        assert hasattr(GranytPlugin, "listeners")

    def test_plugin_listeners_not_empty(self):
        """Test plugin listeners is not empty when Airflow available."""
        from granyt_sdk.integrations.airflow import plugin

        if not plugin.AIRFLOW_AVAILABLE:
            pytest.skip("Airflow not available")

        assert len(plugin.GranytPlugin.listeners) > 0
