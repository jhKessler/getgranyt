"""
Tests for granyt_sdk.features.metrics.core module.
"""

import pytest
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

from granyt_sdk.features.metrics.core import (
    ColumnMetrics,
    DataFrameMetrics,
    DataFrameAdapter,
    register_adapter,
    create_data_metrics,
    send_data_metrics,
    capture_data_metrics,
    _get_adapter,
    _validate_custom_metrics,
    _ADAPTERS,
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


class TestValidateCustomMetrics:
    """Tests for _validate_custom_metrics function."""
    
    def test_returns_none_for_none(self):
        """Test that None input returns None."""
        assert _validate_custom_metrics(None, "test") is None
    
    def test_accepts_valid_metrics(self):
        """Test that valid metrics are accepted."""
        metrics = {"count": 42, "ratio": 0.5}
        result = _validate_custom_metrics(metrics, "test")
        
        assert result == metrics
    
    def test_rejects_non_dict(self):
        """Test that non-dict raises TypeError."""
        with pytest.raises(TypeError, match="must be a dictionary"):
            _validate_custom_metrics("not a dict", "test")
    
    def test_rejects_non_string_keys(self):
        """Test that non-string keys raise TypeError."""
        with pytest.raises(TypeError, match="keys must be strings"):
            _validate_custom_metrics({123: "value"}, "test")
    
    def test_rejects_non_numeric_values(self):
        """Test that non-numeric values raise TypeError."""
        with pytest.raises(TypeError, match="values must be numbers"):
            _validate_custom_metrics({"key": "string_value"}, "test")
    
    def test_accepts_int_and_float(self):
        """Test that both int and float values are accepted."""
        metrics = {"int_val": 42, "float_val": 3.14}
        result = _validate_custom_metrics(metrics, "test")
        
        assert result["int_val"] == 42
        assert result["float_val"] == 3.14


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


class TestCreateDataMetrics:
    """Tests for create_data_metrics function."""
    
    def test_creates_metrics_for_pandas(self, pandas_df):
        """Test creating metrics for pandas DataFrame."""
        metrics = create_data_metrics(
            df=pandas_df,
            dag_id="test_dag",
            task_id="test_task",
            run_id="test_run",
        )
        
        assert metrics.dataframe_type == "pandas"
        assert metrics.row_count == 5
        assert metrics.column_count == 4
        assert metrics.dag_id == "test_dag"
    
    def test_creates_metrics_for_polars(self, polars_df):
        """Test creating metrics for polars DataFrame."""
        metrics = create_data_metrics(
            df=polars_df,
            dag_id="test_dag",
            task_id="test_task",
        )
        
        assert metrics.dataframe_type == "polars"
        assert metrics.row_count == 5
        assert metrics.column_count == 4
    
    def test_creates_metrics_without_df(self):
        """Test creating metrics without DataFrame."""
        metrics = create_data_metrics(
            dag_id="test_dag",
            task_id="test_task",
            custom_metrics={"my_metric": 42},
        )
        
        assert metrics.dataframe_type == "none"
        assert metrics.row_count == 0
        assert metrics.custom_metrics == {"my_metric": 42}
    
    def test_generates_capture_id(self, pandas_df):
        """Test that capture_id is generated if not provided."""
        metrics = create_data_metrics(
            df=pandas_df,
            dag_id="my_dag",
            task_id="my_task",
        )
        
        assert metrics.capture_id == "my_dag.my_task"
    
    def test_uses_provided_capture_id(self, pandas_df):
        """Test that provided capture_id is used."""
        metrics = create_data_metrics(
            df=pandas_df,
            capture_id="custom_id",
        )
        
        assert metrics.capture_id == "custom_id"
    
    def test_appends_suffix_to_capture_id(self, pandas_df):
        """Test that suffix is appended to capture_id."""
        metrics = create_data_metrics(
            df=pandas_df,
            dag_id="my_dag",
            task_id="my_task",
            suffix="output",
        )
        
        assert metrics.capture_id == "my_dag.my_task.output"
    
    def test_with_upstream(self, pandas_df):
        """Test creating metrics with upstream references."""
        metrics = create_data_metrics(
            df=pandas_df,
            upstream=["capture1", "capture2"],
        )
        
        assert metrics.upstream == ["capture1", "capture2"]
    
    def test_raises_for_unsupported_type(self):
        """Test that unsupported types raise TypeError."""
        with pytest.raises(TypeError, match="Unsupported DataFrame type"):
            create_data_metrics(df="not a dataframe")
    
    def test_compute_stats_false(self, pandas_df, monkeypatch):
        """Test that stats are not computed when disabled."""
        metrics = create_data_metrics(
            df=pandas_df,
            compute_stats=False,
        )
        
        # Null counts should not be computed
        for col in metrics.columns:
            assert col.null_count is None
    
    def test_compute_stats_true(self, pandas_df):
        """Test that stats are computed when enabled."""
        metrics = create_data_metrics(
            df=pandas_df,
            compute_stats=True,
        )
        
        # Null counts should be computed
        null_counts = {col.name: col.null_count for col in metrics.columns}
        assert null_counts["name"] == 1  # One None value
        assert null_counts["score"] == 1  # One None value


class TestSendDataMetrics:
    """Tests for send_data_metrics function."""
    
    def test_returns_false_when_disabled(self, clean_env, pandas_df):
        """Test that send returns False when SDK disabled."""
        metrics = create_data_metrics(df=pandas_df)
        
        result = send_data_metrics(metrics)
        
        assert result is False
    
    def test_sends_when_enabled(self, valid_env, pandas_df):
        """Test that send works when SDK enabled."""
        with patch("granyt_sdk.core.client.get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.is_enabled.return_value = True
            mock_client.send_data_metrics.return_value = True
            mock_get_client.return_value = mock_client
            
            metrics = create_data_metrics(df=pandas_df)
            result = send_data_metrics(metrics)
            
            assert result is True
            mock_client.send_data_metrics.assert_called_once()


class TestCaptureDataMetrics:
    """Tests for capture_data_metrics function."""
    
    def test_creates_and_sends(self, pandas_df):
        """Test that capture_data_metrics creates and sends."""
        with patch("granyt_sdk.core.client.get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.is_enabled.return_value = True
            mock_client.send_data_metrics.return_value = True
            mock_get_client.return_value = mock_client
            
            metrics = capture_data_metrics(
                df=pandas_df,
                dag_id="test_dag",
                task_id="test_task",
            )
            
            assert metrics.dataframe_type == "pandas"
            assert metrics.dag_id == "test_dag"
            mock_client.send_data_metrics.assert_called_once()
