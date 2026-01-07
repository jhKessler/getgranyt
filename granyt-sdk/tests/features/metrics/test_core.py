"""
Tests for granyt_sdk.features.metrics.core module.
"""

from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import pytest

from granyt_sdk.features.metrics.core import (
    _ADAPTERS,
    DF_METRICS_KEY,
    GRANYT_KEY,
    METRICS_KEYS,
    SCHEMA_KEYS,
    ColumnMetrics,
    DataFrameAdapter,
    DataFrameMetrics,
    _get_adapter,
    compute_df_metrics,
    register_adapter,
    validate_df_metrics,
)


class TestColumnMetrics:
    """Tests for ColumnMetrics dataclass."""

    def test_basic_creation(self):
        """Test basic column metrics creation."""
        col = ColumnMetrics(name="test_col", dtype="int64")

        assert col.name == "test_col"
        assert col.dtype == "int64"
        assert col.null_count is None
        assert col.empty_string_count is None

    def test_with_all_fields(self):
        """Test column metrics with all fields."""
        col = ColumnMetrics(
            name="test_col",
            dtype="object",
            null_count=5,
            empty_string_count=2,
        )

        assert col.null_count == 5
        assert col.empty_string_count == 2


class TestDataFrameMetrics:
    """Tests for DataFrameMetrics dataclass."""

    def test_basic_creation(self):
        """Test basic dataframe metrics creation."""
        metrics = DataFrameMetrics(
            captured_at="2026-01-05T00:00:00Z",
            row_count=100,
            column_count=5,
            columns=[],
        )

        assert metrics.row_count == 100
        assert metrics.column_count == 5

    def test_to_dict_structure(self):
        """Test to_dict returns correct structure."""
        columns = [
            ColumnMetrics(name="col1", dtype="int64", null_count=0),
            ColumnMetrics(name="col2", dtype="object", null_count=2, empty_string_count=1),
        ]
        metrics = DataFrameMetrics(
            captured_at="2026-01-05T00:00:00Z",
            row_count=100,
            column_count=2,
            columns=columns,
            dag_id="my_dag",
            task_id="my_task",
            run_id="my_run",
        )

        result = metrics.to_dict()

        assert result["dag_id"] == "my_dag"
        assert result["task_id"] == "my_task"
        assert result["run_id"] == "my_run"
        assert "metrics" in result
        assert result["metrics"]["row_count"] == 100
        assert result["metrics"]["column_count"] == 2
        assert "schema" in result
        assert result["schema"]["column_dtypes"]["col1"] == "int64"

    def test_to_dict_with_custom_metrics(self):
        """Test to_dict includes custom metrics."""
        metrics = DataFrameMetrics(
            captured_at="2026-01-05T00:00:00Z",
            row_count=100,
            column_count=2,
            columns=[],
            custom_metrics={"accuracy": 0.95, "count": 42},
        )

        result = metrics.to_dict()

        assert result["metrics"]["accuracy"] == 0.95
        assert result["metrics"]["count"] == 42

    def test_to_dict_with_upstream(self):
        """Test to_dict includes upstream references."""
        metrics = DataFrameMetrics(
            captured_at="2026-01-05T00:00:00Z",
            row_count=100,
            column_count=2,
            columns=[],
            upstream=["capture1", "capture2"],
        )

        result = metrics.to_dict()

        assert result["metrics"]["upstream"] == ["capture1", "capture2"]


class TestRegisterAdapter:
    """Tests for register_adapter function."""

    def test_registers_valid_adapter(self):
        """Test that valid adapter is registered."""

        class TestAdapter(DataFrameAdapter):
            @classmethod
            def can_handle(cls, df):
                return False

            @classmethod
            def get_type_name(cls):
                return "test"

            @classmethod
            def get_columns_with_dtypes(cls, df):
                return []

            @classmethod
            def get_row_count(cls, df):
                return 0

        initial_count = len(_ADAPTERS)
        register_adapter(TestAdapter)

        assert len(_ADAPTERS) == initial_count + 1
        assert _ADAPTERS[0] == TestAdapter

        # Cleanup
        _ADAPTERS.remove(TestAdapter)

    def test_rejects_non_adapter(self):
        """Test that non-adapter class raises TypeError."""

        class NotAnAdapter:
            pass

        with pytest.raises(TypeError):
            register_adapter(NotAnAdapter)


class TestGetAdapter:
    """Tests for _get_adapter function."""

    def test_returns_none_for_unknown_type(self):
        """Test that unknown types return None."""
        result = _get_adapter("not a dataframe")

        assert result is None

    def test_finds_pandas_adapter(self, pandas_df):
        """Test finding adapter for pandas DataFrame."""
        adapter = _get_adapter(pandas_df)

        assert adapter is not None
        assert adapter.get_type_name() == "pandas"

    def test_finds_polars_adapter(self, polars_df):
        """Test finding adapter for polars DataFrame."""
        adapter = _get_adapter(polars_df)

        assert adapter is not None
        assert adapter.get_type_name() == "polars"


class TestComputeDfMetrics:
    """Tests for compute_df_metrics function."""

    def test_computes_metrics_for_pandas(self, pandas_df):
        """Test computing metrics for pandas DataFrame."""
        metrics = compute_df_metrics(df=pandas_df)

        assert metrics["dataframe_type"] == "pandas"
        assert metrics["row_count"] == 5
        assert metrics["column_count"] == 4
        assert "column_dtypes" in metrics
        assert "id" in metrics["column_dtypes"]
        # Stats should be computed by default
        assert "null_counts" in metrics
        assert "empty_string_counts" in metrics
        assert "memory_bytes" in metrics

    def test_computes_metrics_for_polars(self, polars_df):
        """Test computing metrics for polars DataFrame."""
        metrics = compute_df_metrics(df=polars_df)

        assert metrics["dataframe_type"] == "polars"
        assert metrics["row_count"] == 5
        assert metrics["column_count"] == 4
        # Stats should be computed by default
        assert "null_counts" in metrics
        assert "empty_string_counts" in metrics
        assert "memory_bytes" in metrics

    def test_raises_for_unsupported_type(self):
        """Test that unsupported types raise TypeError."""
        with pytest.raises(TypeError, match="Unsupported DataFrame type"):
            compute_df_metrics(df="not a dataframe")

    def test_returns_dict_for_xcom(self, pandas_df):
        """Test that metrics can be used directly in granyt.df_metrics."""
        metrics = compute_df_metrics(df=pandas_df)

        # Should be a plain dict that can be assigned to granyt.df_metrics
        assert isinstance(metrics, dict)

        # Simulate usage pattern with new granyt key
        result = {
            "granyt": {
                "df_metrics": metrics,
                "custom_metric": 42,
            }
        }

        assert result["granyt"]["df_metrics"]["row_count"] == 5
        assert result["granyt"]["custom_metric"] == 42

    def test_column_dtypes_structure(self, pandas_df):
        """Test that column_dtypes has correct structure."""
        metrics = compute_df_metrics(df=pandas_df)

        assert "column_dtypes" in metrics
        assert isinstance(metrics["column_dtypes"], dict)
        assert "id" in metrics["column_dtypes"]
        assert "name" in metrics["column_dtypes"]
        assert "active" in metrics["column_dtypes"]
        assert "score" in metrics["column_dtypes"]

    def test_empty_string_counts_when_computed(self, pandas_df):
        """Test that empty string counts are included."""
        metrics = compute_df_metrics(df=pandas_df)

        # Should include empty string counts
        assert "empty_string_counts" in metrics
        assert metrics["empty_string_counts"]["name"] == 1  # One empty string

    def test_memory_bytes_when_computed(self, pandas_df):
        """Test that memory bytes are included."""
        metrics = compute_df_metrics(df=pandas_df)

        # Should include memory bytes
        assert "memory_bytes" in metrics
        assert isinstance(metrics["memory_bytes"], int)
        assert metrics["memory_bytes"] > 0


class TestValidateDfMetrics:
    """Tests for validate_df_metrics function."""

    def test_valid_schema_with_required_fields(self):
        """Test validation passes with required fields."""
        schema = {"column_dtypes": {"col1": "int64", "col2": "object"}}
        assert validate_df_metrics(schema) is True

    def test_valid_schema_with_all_fields(self):
        """Test validation passes with all fields."""
        schema = {
            "column_dtypes": {"col1": "int64", "col2": "object"},
            "null_counts": {"col1": 0, "col2": 5},
            "empty_string_counts": {"col2": 2},
            "row_count": 100,
            "column_count": 2,
            "dataframe_type": "pandas",
            "memory_bytes": 1024,
        }
        assert validate_df_metrics(schema) is True

    def test_invalid_not_dict(self, caplog):
        """Test validation fails for non-dict."""
        assert validate_df_metrics("not a dict") is False
        assert "must be a dictionary" in caplog.text

    def test_invalid_missing_column_dtypes(self, caplog):
        """Test validation fails when column_dtypes missing."""
        schema = {"row_count": 100}
        assert validate_df_metrics(schema) is False
        assert "missing required 'column_dtypes'" in caplog.text

    def test_invalid_column_dtypes_not_dict(self, caplog):
        """Test validation fails when column_dtypes is not dict."""
        schema = {"column_dtypes": "not a dict"}
        assert validate_df_metrics(schema) is False
        assert "column_dtypes'] must be a dictionary" in caplog.text

    def test_invalid_column_dtypes_values(self, caplog):
        """Test validation fails when column_dtypes has non-string values."""
        schema = {"column_dtypes": {"col1": 123}}
        assert validate_df_metrics(schema) is False
        assert "string keys and values" in caplog.text

    def test_warning_for_invalid_null_counts(self, caplog):
        """Test warning logged for invalid null_counts but validation passes."""
        schema = {
            "column_dtypes": {"col1": "int64"},
            "null_counts": "not a dict",
        }
        # Should still pass since column_dtypes is valid
        assert validate_df_metrics(schema) is True
        assert "null_counts'] must be a dictionary" in caplog.text


class TestConstants:
    """Tests for module constants."""

    def test_granyt_key_constant(self):
        """Test GRANYT_KEY constant value."""
        assert GRANYT_KEY == "granyt"

    def test_df_metrics_key_constant(self):
        """Test DF_METRICS_KEY constant value."""
        assert DF_METRICS_KEY == "df_metrics"

    def test_schema_keys_constant(self):
        """Test SCHEMA_KEYS contains expected keys."""
        assert "column_dtypes" in SCHEMA_KEYS
        assert "null_counts" in SCHEMA_KEYS
        assert "empty_string_counts" in SCHEMA_KEYS

    def test_metrics_keys_constant(self):
        """Test METRICS_KEYS contains expected keys."""
        assert "row_count" in METRICS_KEYS
        assert "column_count" in METRICS_KEYS
        assert "dataframe_type" in METRICS_KEYS
        assert "memory_bytes" in METRICS_KEYS
