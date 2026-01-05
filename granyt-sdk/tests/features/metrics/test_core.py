"""
Tests for granyt_sdk.features.metrics.core module.
"""

from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import pytest

from granyt_sdk.features.metrics.core import (
    _ADAPTERS,
    ColumnMetrics,
    DataFrameAdapter,
    DataFrameMetrics,
    _get_adapter,
    compute_df_metrics,
    register_adapter,
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
            capture_id="test_capture",
            captured_at="2026-01-05T00:00:00Z",
            row_count=100,
            column_count=5,
            columns=[],
        )

        assert metrics.capture_id == "test_capture"
        assert metrics.row_count == 100
        assert metrics.column_count == 5

    def test_to_dict_structure(self):
        """Test to_dict returns correct structure."""
        columns = [
            ColumnMetrics(name="col1", dtype="int64", null_count=0),
            ColumnMetrics(name="col2", dtype="object", null_count=2, empty_string_count=1),
        ]
        metrics = DataFrameMetrics(
            capture_id="test_capture",
            captured_at="2026-01-05T00:00:00Z",
            row_count=100,
            column_count=2,
            columns=columns,
            dag_id="my_dag",
            task_id="my_task",
            run_id="my_run",
        )

        result = metrics.to_dict()

        assert result["capture_id"] == "test_capture"
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
            capture_id="test",
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
            capture_id="test",
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

    def test_computes_metrics_for_polars(self, polars_df):
        """Test computing metrics for polars DataFrame."""
        metrics = compute_df_metrics(df=polars_df)

        assert metrics["dataframe_type"] == "polars"
        assert metrics["row_count"] == 5
        assert metrics["column_count"] == 4

    def test_raises_for_unsupported_type(self):
        """Test that unsupported types raise TypeError."""
        with pytest.raises(TypeError, match="Unsupported DataFrame type"):
            compute_df_metrics(df="not a dataframe")

    def test_compute_stats_false(self, pandas_df):
        """Test that stats are not computed when disabled."""
        metrics = compute_df_metrics(
            df=pandas_df,
            compute_stats=False,
        )

        # Null counts should not be included
        assert "null_counts" not in metrics
        assert "empty_string_counts" not in metrics
        assert "memory_bytes" not in metrics

    def test_compute_stats_true(self, pandas_df):
        """Test that stats are computed when enabled."""
        metrics = compute_df_metrics(
            df=pandas_df,
            compute_stats=True,
        )

        # Null counts should be computed
        assert "null_counts" in metrics
        assert metrics["null_counts"]["name"] == 1  # One None value
        assert metrics["null_counts"]["score"] == 1  # One None value

    def test_returns_dict_for_xcom(self, pandas_df):
        """Test that metrics can be used directly in granyt_metrics."""
        metrics = compute_df_metrics(df=pandas_df, compute_stats=True)

        # Should be a plain dict that can be spread into granyt_metrics
        assert isinstance(metrics, dict)

        # Simulate usage pattern
        result = {
            "granyt_metrics": {
                **metrics,
                "custom_metric": 42,
            }
        }

        assert result["granyt_metrics"]["row_count"] == 5
        assert result["granyt_metrics"]["custom_metric"] == 42

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
        """Test that empty string counts are included when computed."""
        metrics = compute_df_metrics(df=pandas_df, compute_stats=True)

        # Should include empty string counts
        assert "empty_string_counts" in metrics
        assert metrics["empty_string_counts"]["name"] == 1  # One empty string

    def test_memory_bytes_when_computed(self, pandas_df):
        """Test that memory bytes are included when computed."""
        metrics = compute_df_metrics(df=pandas_df, compute_stats=True)

        # Should include memory bytes
        assert "memory_bytes" in metrics
        assert isinstance(metrics["memory_bytes"], int)
        assert metrics["memory_bytes"] > 0
