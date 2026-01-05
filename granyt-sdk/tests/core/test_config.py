"""
Tests for granyt_sdk.core.config module.
"""

import os
import pytest
from granyt_sdk.core.config import GranytConfig, _str_to_bool


class TestStrToBool:
    """Tests for _str_to_bool helper function."""
    
    def test_true_values(self):
        """Test that 'true', '1', 'yes', 'on' return True."""
        assert _str_to_bool("true") is True
        assert _str_to_bool("True") is True
        assert _str_to_bool("TRUE") is True
        assert _str_to_bool("1") is True
        assert _str_to_bool("yes") is True
        assert _str_to_bool("YES") is True
        assert _str_to_bool("on") is True
        assert _str_to_bool("ON") is True
    
    def test_false_values(self):
        """Test that 'false', '0', 'no', 'off' return False."""
        assert _str_to_bool("false") is False
        assert _str_to_bool("False") is False
        assert _str_to_bool("FALSE") is False
        assert _str_to_bool("0") is False
        assert _str_to_bool("no") is False
        assert _str_to_bool("NO") is False
        assert _str_to_bool("off") is False
        assert _str_to_bool("OFF") is False
    
    def test_empty_string(self):
        """Test that empty string returns False."""
        assert _str_to_bool("") is False
    
    def test_random_string(self):
        """Test that random strings return False."""
        assert _str_to_bool("random") is False
        assert _str_to_bool("maybe") is False


class TestGranytConfigDefaults:
    """Tests for GranytConfig default values."""
    
    def test_default_values(self):
        """Test that defaults are set correctly."""
        config = GranytConfig()
        
        assert config.endpoint is None
        assert config.api_key is None
        assert config.debug is False
        assert config.disabled is False
        assert config.namespace == "airflow"
        assert config.max_retries == 3
        assert config.retry_delay == 1.0
        assert config.batch_size == 10
        assert config.flush_interval == 5.0
        assert config.timeout == 30.0


class TestGranytConfigFromEnvironment:
    """Tests for GranytConfig.from_environment()."""
    
    def test_from_environment_empty(self, clean_env):
        """Test config from empty environment."""
        config = GranytConfig.from_environment()
        
        assert config.endpoint is None
        assert config.api_key is None
        assert config.debug is False
        assert config.disabled is False
    
    def test_from_environment_with_credentials(self, valid_env):
        """Test config with endpoint and API key set."""
        config = GranytConfig.from_environment()
        
        assert config.endpoint == "https://api.granyt.dev"
        assert config.api_key == "test-api-key-12345"
    
    def test_from_environment_with_debug(self, debug_env):
        """Test config with debug enabled."""
        config = GranytConfig.from_environment()
        
        assert config.debug is True
    
    def test_from_environment_disabled(self, valid_env):
        """Test config with SDK disabled."""
        valid_env.setenv("GRANYT_DISABLED", "true")
        config = GranytConfig.from_environment()
        
        assert config.disabled is True
    
    def test_from_environment_custom_namespace(self, valid_env):
        """Test config with custom namespace."""
        valid_env.setenv("GRANYT_NAMESPACE", "my_custom_namespace")
        config = GranytConfig.from_environment()
        
        assert config.namespace == "my_custom_namespace"
    
    def test_from_environment_numeric_values(self, valid_env):
        """Test config with custom numeric values."""
        valid_env.setenv("GRANYT_MAX_RETRIES", "5")
        valid_env.setenv("GRANYT_RETRY_DELAY", "2.5")
        valid_env.setenv("GRANYT_BATCH_SIZE", "20")
        valid_env.setenv("GRANYT_FLUSH_INTERVAL", "10.0")
        valid_env.setenv("GRANYT_TIMEOUT", "60.0")
        
        config = GranytConfig.from_environment()
        
        assert config.max_retries == 5
        assert config.retry_delay == 2.5
        assert config.batch_size == 20
        assert config.flush_interval == 10.0
        assert config.timeout == 60.0


class TestGranytConfigIsValid:
    """Tests for GranytConfig.is_valid()."""
    
    def test_is_valid_with_valid_config(self, valid_config):
        """Test is_valid returns True with valid config."""
        assert valid_config.is_valid() is True
    
    def test_is_valid_missing_endpoint(self):
        """Test is_valid returns False when endpoint is missing."""
        config = GranytConfig(api_key="test-key")
        assert config.is_valid() is False
    
    def test_is_valid_missing_api_key(self):
        """Test is_valid returns False when API key is missing."""
        config = GranytConfig(endpoint="https://api.granyt.dev")
        assert config.is_valid() is False
    
    def test_is_valid_when_disabled(self, valid_config):
        """Test is_valid returns False when SDK is disabled."""
        valid_config.disabled = True
        assert valid_config.is_valid() is False
    
    def test_is_valid_with_empty_strings(self):
        """Test is_valid with empty string credentials."""
        config = GranytConfig(endpoint="", api_key="")
        assert config.is_valid() is False


class TestGranytConfigGetHeaders:
    """Tests for GranytConfig.get_headers()."""
    
    def test_get_headers_format(self, valid_config):
        """Test headers contain correct format."""
        headers = valid_config.get_headers()
        
        assert "Authorization" in headers
        assert headers["Authorization"] == "Bearer test-api-key-12345"
        assert headers["Content-Type"] == "application/json"
        assert "X-granyt-sdk-Version" in headers
        assert "User-Agent" in headers
        assert "granyt-sdk-python" in headers["User-Agent"]


class TestGranytConfigUrls:
    """Tests for GranytConfig URL builder methods."""
    
    def test_get_lineage_url(self, valid_config):
        """Test lineage URL is built correctly."""
        assert valid_config.get_lineage_url() == "https://api.granyt.dev/api/v1/lineage"
    
    def test_get_errors_url(self, valid_config):
        """Test errors URL is built correctly."""
        assert valid_config.get_errors_url() == "https://api.granyt.dev/api/v1/errors"
    
    def test_get_heartbeat_url(self, valid_config):
        """Test heartbeat URL is built correctly."""
        assert valid_config.get_heartbeat_url() == "https://api.granyt.dev/api/v1/heartbeat"
    
    def test_get_data_metrics_url(self, valid_config):
        """Test data metrics URL is built correctly."""
        assert valid_config.get_data_metrics_url() == "https://api.granyt.dev/api/v1/metrics"
    
    def test_urls_strip_trailing_slash(self):
        """Test URLs strip trailing slashes from endpoint."""
        config = GranytConfig(
            endpoint="https://api.granyt.dev/",
            api_key="test-key"
        )
        assert config.get_lineage_url() == "https://api.granyt.dev/api/v1/lineage"
        assert config.get_errors_url() == "https://api.granyt.dev/api/v1/errors"


class TestGranytConfigToDict:
    """Tests for GranytConfig.to_dict()."""
    
    def test_to_dict_masks_api_key(self, valid_config):
        """Test to_dict masks the API key."""
        result = valid_config.to_dict()
        
        assert result["api_key"] == "***"
        assert result["endpoint"] == "https://api.granyt.dev"
    
    def test_to_dict_no_api_key(self):
        """Test to_dict with no API key."""
        config = GranytConfig(endpoint="https://api.granyt.dev")
        result = config.to_dict()
        
        assert result["api_key"] is None
    
    def test_to_dict_contains_all_fields(self, valid_config):
        """Test to_dict contains all configuration fields."""
        result = valid_config.to_dict()
        
        expected_keys = [
            "endpoint", "api_key", "debug", "disabled", "namespace",
            "max_retries", "retry_delay", "batch_size", "flush_interval", "timeout"
        ]
        for key in expected_keys:
            assert key in result
