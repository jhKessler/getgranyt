"""
Tests for granyt_sdk.features.errors.sanitizer module.
"""

import pytest

from granyt_sdk.features.errors.sanitizer import (
    SENSITIVE_ENV_PATTERNS,
    is_sensitive_key,
    sanitize_context,
    sanitize_value,
)


class TestIsSensitiveKey:
    """Tests for is_sensitive_key function."""

    def test_detects_key_pattern(self):
        """Test detection of 'KEY' pattern."""
        assert is_sensitive_key("api_key") is True
        assert is_sensitive_key("API_KEY") is True
        assert is_sensitive_key("secret_key") is True
        assert is_sensitive_key("PRIVATE_KEY") is True

    def test_detects_secret_pattern(self):
        """Test detection of 'SECRET' pattern."""
        assert is_sensitive_key("secret") is True
        assert is_sensitive_key("SECRET_VALUE") is True
        assert is_sensitive_key("client_secret") is True

    def test_detects_password_pattern(self):
        """Test detection of 'PASSWORD' pattern."""
        assert is_sensitive_key("password") is True
        assert is_sensitive_key("PASSWORD") is True
        assert is_sensitive_key("db_password") is True
        assert is_sensitive_key("user_password") is True

    def test_detects_token_pattern(self):
        """Test detection of 'TOKEN' pattern."""
        assert is_sensitive_key("token") is True
        assert is_sensitive_key("access_token") is True
        assert is_sensitive_key("refresh_token") is True
        assert is_sensitive_key("AUTH_TOKEN") is True

    def test_detects_credential_pattern(self):
        """Test detection of 'CREDENTIAL' pattern."""
        assert is_sensitive_key("credential") is True
        assert is_sensitive_key("credentials") is True
        assert is_sensitive_key("GOOGLE_CREDENTIALS") is True

    def test_detects_auth_pattern(self):
        """Test detection of 'AUTH' pattern."""
        assert is_sensitive_key("auth") is True
        assert is_sensitive_key("authorization") is True
        assert is_sensitive_key("AUTH_HEADER") is True

    def test_detects_cloud_provider_patterns(self):
        """Test detection of cloud provider patterns."""
        assert is_sensitive_key("AWS_SECRET_ACCESS_KEY") is True
        assert is_sensitive_key("aws_access_key_id") is True
        assert is_sensitive_key("AZURE_CLIENT_SECRET") is True
        assert is_sensitive_key("GCP_SERVICE_ACCOUNT") is True

    def test_detects_database_patterns(self):
        """Test detection of database patterns."""
        assert is_sensitive_key("DATABASE_URL") is True
        assert is_sensitive_key("DB_PASSWORD") is True
        assert is_sensitive_key("MYSQL_ROOT_PASSWORD") is True
        assert is_sensitive_key("POSTGRES_PASSWORD") is True
        assert is_sensitive_key("REDIS_PASSWORD") is True
        assert is_sensitive_key("MONGO_URI") is True

    def test_detects_airflow_patterns(self):
        """Test detection of Airflow patterns."""
        assert is_sensitive_key("AIRFLOW__CORE__SQL_ALCHEMY_CONN") is True
        assert is_sensitive_key("FERNET_KEY") is True

    def test_case_insensitive(self):
        """Test that matching is case insensitive."""
        assert is_sensitive_key("api_key") is True
        assert is_sensitive_key("API_KEY") is True
        assert is_sensitive_key("Api_Key") is True
        assert is_sensitive_key("ApI_kEy") is True

    def test_non_sensitive_keys(self):
        """Test that non-sensitive keys return False."""
        assert is_sensitive_key("username") is False
        assert is_sensitive_key("email") is False
        assert is_sensitive_key("host") is False
        assert is_sensitive_key("port") is False
        assert is_sensitive_key("name") is False
        assert is_sensitive_key("id") is False
        assert is_sensitive_key("data") is False
        assert is_sensitive_key("value") is False


class TestSanitizeValue:
    """Tests for sanitize_value function."""

    def test_returns_none_for_none(self):
        """Test that None returns None."""
        assert sanitize_value(None) is None

    def test_returns_string_for_simple_values(self):
        """Test that simple values are converted to strings."""
        assert sanitize_value("hello") == "hello"
        assert sanitize_value(123) == "123"
        assert sanitize_value(3.14) == "3.14"
        assert sanitize_value(True) == "True"

    def test_truncates_long_strings(self):
        """Test that long strings are truncated."""
        long_string = "x" * 2000
        result = sanitize_value(long_string)

        assert len(result) < 2000
        assert "... [truncated]" in result

    def test_respects_custom_max_length(self):
        """Test that custom max_length is respected."""
        result = sanitize_value("hello world", max_length=5)

        assert result == "hello... [truncated]"

    def test_handles_unserializable(self):
        """Test that unserializable objects return placeholder."""

        class Unserializable:
            def __str__(self):
                raise Exception("Cannot serialize")

        result = sanitize_value(Unserializable())

        assert result == "<unserializable>"

    def test_handles_complex_objects(self):
        """Test handling of complex objects."""
        obj = {"key": "value", "nested": {"a": 1}}
        result = sanitize_value(obj)

        assert isinstance(result, str)
        assert "key" in result


class TestSanitizeContext:
    """Tests for sanitize_context function."""

    def test_returns_none_for_none(self):
        """Test that None returns None."""
        assert sanitize_context(None) is None

    def test_sanitizes_simple_dict(self):
        """Test sanitization of simple dictionary."""
        context = {"name": "test", "value": 123}
        result = sanitize_context(context)

        assert result == {"name": "test", "value": "123"}

    def test_redacts_sensitive_keys(self):
        """Test that sensitive keys are redacted."""
        context = {
            "username": "john",
            "password": "secret123",
            "api_key": "abc123",
            "data": "safe",
        }
        result = sanitize_context(context)

        assert result["username"] == "john"
        assert result["password"] == "<redacted>"
        assert result["api_key"] == "<redacted>"
        assert result["data"] == "safe"

    def test_handles_nested_dicts(self):
        """Test sanitization of nested dictionaries."""
        context = {
            "config": {
                "host": "localhost",
                "password": "secret",
                "nested": {
                    "api_key": "abc123",
                    "value": "safe",
                },
            }
        }
        result = sanitize_context(context)

        assert result["config"]["host"] == "localhost"
        assert result["config"]["password"] == "<redacted>"
        assert result["config"]["nested"]["api_key"] == "<redacted>"
        assert result["config"]["nested"]["value"] == "safe"

    def test_handles_lists(self):
        """Test sanitization of lists."""
        context = {
            "items": ["a", "b", "c"],
            "users": [{"name": "alice", "password": "x"}, {"name": "bob", "password": "y"}],
        }
        result = sanitize_context(context)

        assert result["items"] == ["a", "b", "c"]
        assert result["users"][0]["name"] == "alice"
        assert result["users"][0]["password"] == "<redacted>"

    def test_truncates_long_lists(self):
        """Test that long lists are truncated to 100 items."""
        context = {"items": list(range(150))}
        result = sanitize_context(context)

        assert len(result["items"]) == 100

    def test_handles_tuples(self):
        """Test sanitization of tuples (converted to list)."""
        context = {"coords": (1, 2, 3)}
        result = sanitize_context(context)

        assert result["coords"] == ["1", "2", "3"]

    def test_max_depth_exceeded(self):
        """Test that max depth is respected."""
        # Create deeply nested structure
        context = {"a": {"b": {"c": {"d": {"e": {"f": {"g": "value"}}}}}}}
        result = sanitize_context(context)

        # At some point it should stop recursing
        assert "<max depth exceeded>" in str(result)

    def test_handles_mixed_types(self):
        """Test sanitization of mixed types."""
        context = {
            "string": "hello",
            "int": 42,
            "float": 3.14,
            "bool": True,
            "list": [1, 2, 3],
            "dict": {"nested": "value"},
            "none": None,
        }
        result = sanitize_context(context)

        assert result["string"] == "hello"
        assert result["int"] == "42"
        assert result["float"] == "3.14"
        assert result["bool"] == "True"
        assert result["list"] == ["1", "2", "3"]
        assert result["dict"]["nested"] == "value"
        assert result["none"] is None
