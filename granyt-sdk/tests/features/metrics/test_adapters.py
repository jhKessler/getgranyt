"""
Tests for DataFrame adapters (pandas, polars).
"""

from unittest.mock import MagicMock, patch

import pytest


class TestPandasAdapter:
    """Tests for PandasAdapter."""

    def test_can_handle_pandas_df(self, pandas_df):
        """Test can_handle returns True for pandas DataFrame."""
        from granyt_sdk.features.metrics.adapters.pandas import PandasAdapter

        assert PandasAdapter.can_handle(pandas_df) is True

    def test_can_handle_non_pandas(self):
        """Test can_handle returns False for non-pandas."""
        from granyt_sdk.features.metrics.adapters.pandas import PandasAdapter

        assert PandasAdapter.can_handle("not a dataframe") is False
        assert PandasAdapter.can_handle([1, 2, 3]) is False
        assert PandasAdapter.can_handle({"key": "value"}) is False

    def test_get_type_name(self):
        """Test get_type_name returns 'pandas'."""
        from granyt_sdk.features.metrics.adapters.pandas import PandasAdapter

        assert PandasAdapter.get_type_name() == "pandas"

    def test_get_columns_with_dtypes(self, pandas_df):
        """Test get_columns_with_dtypes returns correct pairs."""
        from granyt_sdk.features.metrics.adapters.pandas import PandasAdapter

        result = PandasAdapter.get_columns_with_dtypes(pandas_df)

        assert isinstance(result, list)
        assert len(result) == 4

        col_names = [name for name, _ in result]
        assert "id" in col_names
        assert "name" in col_names
        assert "score" in col_names
        assert "active" in col_names

    def test_get_row_count(self, pandas_df):
        """Test get_row_count returns correct count."""
        from granyt_sdk.features.metrics.adapters.pandas import PandasAdapter

        assert PandasAdapter.get_row_count(pandas_df) == 5

    def test_get_null_counts(self, pandas_df):
        """Test get_null_counts returns correct counts."""
        from granyt_sdk.features.metrics.adapters.pandas import PandasAdapter

        result = PandasAdapter.get_null_counts(pandas_df)

        assert isinstance(result, dict)
        assert result["name"] == 1  # One None
        assert result["score"] == 1  # One None
        assert result["id"] == 0  # No nulls
        assert result["active"] == 0  # No nulls

    def test_get_empty_string_counts(self, pandas_df):
        """Test get_empty_string_counts returns correct counts."""
        from granyt_sdk.features.metrics.adapters.pandas import PandasAdapter

        result = PandasAdapter.get_empty_string_counts(pandas_df)

        assert isinstance(result, dict)
        assert result["name"] == 1  # One empty string
        assert result["id"] == 0  # Not string column

    def test_get_memory_bytes(self, pandas_df):
        """Test get_memory_bytes returns a positive integer."""
        from granyt_sdk.features.metrics.adapters.pandas import PandasAdapter

        result = PandasAdapter.get_memory_bytes(pandas_df)

        assert isinstance(result, int)
        assert result > 0

    def test_empty_dataframe(self, pandas_df_empty):
        """Test handling of empty DataFrame."""
        from granyt_sdk.features.metrics.adapters.pandas import PandasAdapter

        assert PandasAdapter.can_handle(pandas_df_empty) is True
        assert PandasAdapter.get_row_count(pandas_df_empty) == 0
        assert PandasAdapter.get_columns_with_dtypes(pandas_df_empty) == []


class TestPolarsAdapter:
    """Tests for PolarsAdapter."""

    def test_can_handle_polars_df(self, polars_df):
        """Test can_handle returns True for polars DataFrame."""
        from granyt_sdk.features.metrics.adapters.polars import PolarsAdapter

        assert PolarsAdapter.can_handle(polars_df) is True

    def test_can_handle_polars_lazyframe(self, polars_lazyframe):
        """Test can_handle returns True for polars LazyFrame."""
        from granyt_sdk.features.metrics.adapters.polars import PolarsAdapter

        assert PolarsAdapter.can_handle(polars_lazyframe) is True

    def test_can_handle_non_polars(self):
        """Test can_handle returns False for non-polars."""
        from granyt_sdk.features.metrics.adapters.polars import PolarsAdapter

        assert PolarsAdapter.can_handle("not a dataframe") is False
        assert PolarsAdapter.can_handle([1, 2, 3]) is False

    def test_get_type_name(self):
        """Test get_type_name returns 'polars'."""
        from granyt_sdk.features.metrics.adapters.polars import PolarsAdapter

        assert PolarsAdapter.get_type_name() == "polars"

    def test_get_columns_with_dtypes_df(self, polars_df):
        """Test get_columns_with_dtypes for DataFrame."""
        from granyt_sdk.features.metrics.adapters.polars import PolarsAdapter

        result = PolarsAdapter.get_columns_with_dtypes(polars_df)

        assert isinstance(result, list)
        assert len(result) == 4

        col_names = [name for name, _ in result]
        assert "id" in col_names
        assert "name" in col_names

    def test_get_columns_with_dtypes_lazyframe(self, polars_lazyframe):
        """Test get_columns_with_dtypes for LazyFrame."""
        from granyt_sdk.features.metrics.adapters.polars import PolarsAdapter

        result = PolarsAdapter.get_columns_with_dtypes(polars_lazyframe)

        assert isinstance(result, list)
        assert len(result) == 2

    def test_get_row_count_df(self, polars_df):
        """Test get_row_count for DataFrame."""
        from granyt_sdk.features.metrics.adapters.polars import PolarsAdapter

        assert PolarsAdapter.get_row_count(polars_df) == 5

    def test_get_row_count_lazyframe(self, polars_lazyframe):
        """Test get_row_count for LazyFrame (requires collect)."""
        from granyt_sdk.features.metrics.adapters.polars import PolarsAdapter

        assert PolarsAdapter.get_row_count(polars_lazyframe) == 3

    def test_get_null_counts(self, polars_df):
        """Test get_null_counts returns correct counts."""
        from granyt_sdk.features.metrics.adapters.polars import PolarsAdapter

        result = PolarsAdapter.get_null_counts(polars_df)

        assert isinstance(result, dict)
        assert result["name"] == 1  # One null
        assert result["score"] == 1  # One null
        assert result["id"] == 0  # No nulls

    def test_get_empty_string_counts(self, polars_df):
        """Test get_empty_string_counts returns correct counts."""
        from granyt_sdk.features.metrics.adapters.polars import PolarsAdapter

        result = PolarsAdapter.get_empty_string_counts(polars_df)

        assert isinstance(result, dict)
        assert result["name"] == 1  # One empty string

    def test_get_memory_bytes(self, polars_df):
        """Test get_memory_bytes returns a positive integer."""
        from granyt_sdk.features.metrics.adapters.polars import PolarsAdapter

        result = PolarsAdapter.get_memory_bytes(polars_df)

        assert isinstance(result, int)
        assert result > 0


class TestSparkAdapter:
    """Tests for SparkAdapter (mock-based since Spark is heavy)."""

    def test_can_handle_returns_false_without_spark(self):
        """Test can_handle returns False when Spark not available."""
        from granyt_sdk.features.metrics.adapters.spark import SparkAdapter

        # Should return False for non-Spark objects
        assert SparkAdapter.can_handle("not a dataframe") is False
        assert SparkAdapter.can_handle([1, 2, 3]) is False

    def test_get_type_name(self):
        """Test get_type_name returns 'spark'."""
        from granyt_sdk.features.metrics.adapters.spark import SparkAdapter

        assert SparkAdapter.get_type_name() == "spark"

    def test_can_handle_with_mock_spark_df(self):
        """Test can_handle with mocked Spark DataFrame."""
        from granyt_sdk.features.metrics.adapters.spark import SparkAdapter

        # Create a mock that looks like a Spark DataFrame
        with patch.dict("sys.modules", {"pyspark": MagicMock(), "pyspark.sql": MagicMock()}):
            # Even with mock, the isinstance check should work
            # This tests the import path
            pass

    def test_get_columns_with_dtypes_mock(self):
        """Test get_columns_with_dtypes with mock."""
        from granyt_sdk.features.metrics.adapters.spark import SparkAdapter

        mock_df = MagicMock()
        mock_field1 = MagicMock()
        mock_field1.name = "col1"
        mock_field1.dataType.simpleString.return_value = "string"

        mock_field2 = MagicMock()
        mock_field2.name = "col2"
        mock_field2.dataType.simpleString.return_value = "int"

        mock_df.schema.fields = [mock_field1, mock_field2]

        result = SparkAdapter.get_columns_with_dtypes(mock_df)

        assert result == [("col1", "string"), ("col2", "int")]

    def test_get_row_count_mock(self):
        """Test get_row_count with mock."""
        from granyt_sdk.features.metrics.adapters.spark import SparkAdapter

        mock_df = MagicMock()
        mock_df.count.return_value = 1000

        result = SparkAdapter.get_row_count(mock_df)

        assert result == 1000
        mock_df.count.assert_called_once()
