"""
Tests for PythonAdapter - handles Python operators and @task decorated functions.

Tests verify:
1. Pattern matching for Python operators
2. Extraction of metrics from XCom return values with 'granyt' key
3. DataFrame schema (df_schema) validation and extraction
4. Custom metrics handling
5. Error handling for invalid df_schema structures
"""

from unittest.mock import MagicMock

import pytest

from granyt_sdk.integrations.airflow.operator_adapters.transform.python import (
    PythonAdapter,
)


class TestPythonAdapterPatterns:
    """Tests for PythonAdapter operator pattern matching."""

    def test_handles_python_operator(self):
        """PythonOperator is the primary Python operator."""
        assert PythonAdapter.can_handle("PythonOperator") is True

    def test_handles_branch_python_operator(self):
        """BranchPythonOperator for branching logic."""
        assert PythonAdapter.can_handle("BranchPythonOperator") is True

    def test_handles_short_circuit_operator(self):
        """ShortCircuitOperator for conditional DAG execution."""
        assert PythonAdapter.can_handle("ShortCircuitOperator") is True

    def test_handles_python_virtualenv_operator(self):
        """PythonVirtualenvOperator runs in isolated virtualenv."""
        assert PythonAdapter.can_handle("PythonVirtualenvOperator") is True

    def test_handles_external_python_operator(self):
        """ExternalPythonOperator uses external Python interpreter."""
        assert PythonAdapter.can_handle("ExternalPythonOperator") is True

    def test_handles_branch_external_python_operator(self):
        """BranchExternalPythonOperator for branching with external Python."""
        assert PythonAdapter.can_handle("BranchExternalPythonOperator") is True

    def test_handles_decorated_operator(self):
        """_PythonDecoratedOperator is created by @task decorator."""
        assert PythonAdapter.can_handle("_PythonDecoratedOperator") is True

    def test_handles_decorated_mapped_operator(self):
        """DecoratedMappedOperator is created by @task with .expand()."""
        assert PythonAdapter.can_handle("DecoratedMappedOperator") is True

    def test_does_not_handle_bash_operator(self):
        """Should not handle non-Python operators."""
        assert PythonAdapter.can_handle("BashOperator") is False


class TestPythonAdapterNoGranytKey:
    """Tests for when XCom result does not contain 'granyt' key."""

    def test_returns_none_when_no_xcom_result(self, mock_task_instance, mock_python_task):
        """Should return None if no XCom result."""
        mock_task_instance.xcom_pull.return_value = None
        adapter = PythonAdapter()

        result = adapter.extract_metrics(mock_task_instance, mock_python_task)

        assert result is None

    def test_returns_none_when_xcom_not_dict(self, mock_task_instance, mock_python_task):
        """Should return None if XCom result is not a dict."""
        mock_task_instance.xcom_pull.return_value = "string result"
        adapter = PythonAdapter()

        result = adapter.extract_metrics(mock_task_instance, mock_python_task)

        assert result is None

    def test_returns_none_when_no_granyt_key(self, mock_task_instance, mock_python_task):
        """Should return None if XCom dict doesn't contain 'granyt' key."""
        mock_task_instance.xcom_pull.return_value = {"other_key": "value"}
        adapter = PythonAdapter()

        result = adapter.extract_metrics(mock_task_instance, mock_python_task)

        assert result is None


class TestPythonAdapterDfSchemaValidation:
    """Tests for df_schema validation - should raise ValueError for invalid schemas."""

    def test_raises_error_when_df_schema_not_dict(self, mock_task_instance, mock_python_task):
        """Should raise ValueError when df_schema is not a dict."""
        mock_task_instance.xcom_pull.return_value = {"granyt": {"df_schema": "not a dict"}}
        adapter = PythonAdapter()

        with pytest.raises(ValueError) as exc_info:
            adapter.extract_metrics(mock_task_instance, mock_python_task)

        assert "Invalid df_schema structure" in str(exc_info.value)
        assert "column_dtypes" in str(exc_info.value)

    def test_raises_error_when_df_schema_missing_column_dtypes(
        self, mock_task_instance, mock_python_task
    ):
        """Should raise ValueError when df_schema is missing column_dtypes."""
        mock_task_instance.xcom_pull.return_value = {"granyt": {"df_schema": {"row_count": 100}}}
        adapter = PythonAdapter()

        with pytest.raises(ValueError) as exc_info:
            adapter.extract_metrics(mock_task_instance, mock_python_task)

        assert "Invalid df_schema structure" in str(exc_info.value)

    def test_raises_error_when_column_dtypes_not_dict(self, mock_task_instance, mock_python_task):
        """Should raise ValueError when column_dtypes is not a dict."""
        mock_task_instance.xcom_pull.return_value = {
            "granyt": {"df_schema": {"column_dtypes": ["a", "b"]}}
        }
        adapter = PythonAdapter()

        with pytest.raises(ValueError) as exc_info:
            adapter.extract_metrics(mock_task_instance, mock_python_task)

        assert "Invalid df_schema structure" in str(exc_info.value)

    def test_raises_error_when_column_dtypes_has_non_string_values(
        self, mock_task_instance, mock_python_task
    ):
        """Should raise ValueError when column_dtypes values are not strings."""
        mock_task_instance.xcom_pull.return_value = {
            "granyt": {"df_schema": {"column_dtypes": {"col1": 123}}}
        }
        adapter = PythonAdapter()

        with pytest.raises(ValueError) as exc_info:
            adapter.extract_metrics(mock_task_instance, mock_python_task)

        assert "Invalid df_schema structure" in str(exc_info.value)


class TestPythonAdapterDfSchemaExtraction:
    """Tests for valid df_schema extraction."""

    def test_extracts_schema_fields(self, mock_task_instance, mock_python_task):
        """Should extract schema fields into custom_metrics['schema']."""
        mock_task_instance.xcom_pull.return_value = {
            "granyt": {
                "df_schema": {
                    "column_dtypes": {"id": "int64", "name": "object"},
                    "null_counts": {"id": 0, "name": 5},
                    "empty_string_counts": {"id": 0, "name": 2},
                }
            }
        }
        adapter = PythonAdapter()

        result = adapter.extract_metrics(mock_task_instance, mock_python_task)

        assert result is not None
        assert "schema" in result.custom_metrics
        schema = result.custom_metrics["schema"]
        assert schema["column_dtypes"] == {"id": "int64", "name": "object"}
        assert schema["null_counts"] == {"id": 0, "name": 5}
        assert schema["empty_string_counts"] == {"id": 0, "name": 2}

    def test_extracts_row_count_from_df_schema(self, mock_task_instance, mock_python_task):
        """Should extract row_count from df_schema."""
        mock_task_instance.xcom_pull.return_value = {
            "granyt": {
                "df_schema": {
                    "column_dtypes": {"id": "int64"},
                    "row_count": 1000,
                }
            }
        }
        adapter = PythonAdapter()

        result = adapter.extract_metrics(mock_task_instance, mock_python_task)

        assert result is not None
        assert result.row_count == 1000

    def test_extracts_memory_bytes_as_bytes_processed(self, mock_task_instance, mock_python_task):
        """Should extract memory_bytes as bytes_processed."""
        mock_task_instance.xcom_pull.return_value = {
            "granyt": {
                "df_schema": {
                    "column_dtypes": {"id": "int64"},
                    "memory_bytes": 8192,
                }
            }
        }
        adapter = PythonAdapter()

        result = adapter.extract_metrics(mock_task_instance, mock_python_task)

        assert result is not None
        assert result.bytes_processed == 8192

    def test_extracts_dataframe_metadata(self, mock_task_instance, mock_python_task):
        """Should extract dataframe_type and column_count to custom_metrics."""
        mock_task_instance.xcom_pull.return_value = {
            "granyt": {
                "df_schema": {
                    "column_dtypes": {"id": "int64", "name": "object"},
                    "dataframe_type": "pandas",
                    "column_count": 2,
                }
            }
        }
        adapter = PythonAdapter()

        result = adapter.extract_metrics(mock_task_instance, mock_python_task)

        assert result is not None
        assert result.custom_metrics["dataframe_type"] == "pandas"
        assert result.custom_metrics["column_count"] == 2


class TestPythonAdapterCustomMetrics:
    """Tests for custom metrics extraction alongside df_schema."""

    def test_extracts_custom_metrics(self, mock_task_instance, mock_python_task):
        """Should extract custom metrics from granyt key."""
        mock_task_instance.xcom_pull.return_value = {
            "granyt": {
                "high_value_orders": 42,
                "processing_status": "success",
            }
        }
        adapter = PythonAdapter()

        result = adapter.extract_metrics(mock_task_instance, mock_python_task)

        assert result is not None
        assert result.custom_metrics["high_value_orders"] == 42
        assert result.custom_metrics["processing_status"] == "success"

    def test_extracts_custom_metrics_alongside_df_schema(
        self, mock_task_instance, mock_python_task
    ):
        """Should extract both df_schema and custom metrics."""
        mock_task_instance.xcom_pull.return_value = {
            "granyt": {
                "df_schema": {
                    "column_dtypes": {"amount": "float64"},
                    "row_count": 100,
                },
                "high_value_orders": 25,
            }
        }
        adapter = PythonAdapter()

        result = adapter.extract_metrics(mock_task_instance, mock_python_task)

        assert result is not None
        assert result.row_count == 100
        assert "schema" in result.custom_metrics
        assert result.custom_metrics["high_value_orders"] == 25

    def test_row_count_in_custom_metrics_sets_row_count(self, mock_task_instance, mock_python_task):
        """Should map row_count custom metric to metrics.row_count."""
        mock_task_instance.xcom_pull.return_value = {"granyt": {"row_count": 500}}
        adapter = PythonAdapter()

        result = adapter.extract_metrics(mock_task_instance, mock_python_task)

        assert result is not None
        assert result.row_count == 500

    def test_rows_affected_sets_row_count(self, mock_task_instance, mock_python_task):
        """Should map rows_affected to row_count."""
        mock_task_instance.xcom_pull.return_value = {"granyt": {"rows_affected": 250}}
        adapter = PythonAdapter()

        result = adapter.extract_metrics(mock_task_instance, mock_python_task)

        assert result is not None
        assert result.row_count == 250

    def test_bytes_processed_sets_bytes_processed(self, mock_task_instance, mock_python_task):
        """Should map bytes_processed custom metric."""
        mock_task_instance.xcom_pull.return_value = {"granyt": {"bytes_processed": 1024}}
        adapter = PythonAdapter()

        result = adapter.extract_metrics(mock_task_instance, mock_python_task)

        assert result is not None
        assert result.bytes_processed == 1024


class TestPythonAdapterCallableInfo:
    """Tests for Python callable information extraction."""

    def test_extracts_function_name(self, mock_task_instance, mock_python_task):
        """Should extract function name from python_callable."""
        mock_task_instance.xcom_pull.return_value = {"granyt": {}}
        adapter = PythonAdapter()

        result = adapter.extract_metrics(mock_task_instance, mock_python_task)

        assert result is not None
        assert result.custom_metrics["function_name"] == "transform_data"
        assert result.custom_metrics["module"] == "my_dag"

    def test_extracts_virtualenv_requirements(
        self, mock_task_instance, mock_python_virtualenv_task
    ):
        """Should extract requirements from virtualenv operator."""
        mock_task_instance.xcom_pull.return_value = {"granyt": {}}
        adapter = PythonAdapter()

        result = adapter.extract_metrics(mock_task_instance, mock_python_virtualenv_task)

        assert result is not None
        assert result.custom_metrics["requirements"] == ["pandas>=1.0", "numpy"]
        assert result.custom_metrics["python_version"] == "3.10"


class TestPythonAdapterIntegration:
    """Integration tests simulating real-world usage patterns."""

    def test_full_df_schema_from_compute_df_metrics(self, mock_task_instance, mock_python_task):
        """Test with output matching compute_df_metrics() structure."""
        # This simulates what compute_df_metrics() returns
        mock_task_instance.xcom_pull.return_value = {
            "granyt": {
                "df_schema": {
                    "row_count": 4,
                    "column_count": 1,
                    "dataframe_type": "pandas",
                    "column_dtypes": {"amount": "int64"},
                    "null_counts": {"amount": 0},
                    "empty_string_counts": {"amount": 0},
                    "memory_bytes": 160,
                },
                "high_value_orders": 2,
            }
        }
        adapter = PythonAdapter()

        result = adapter.extract_metrics(mock_task_instance, mock_python_task)

        assert result is not None
        # Metrics extracted correctly
        assert result.row_count == 4
        assert result.bytes_processed == 160
        # Schema in custom_metrics
        assert "schema" in result.custom_metrics
        assert result.custom_metrics["schema"]["column_dtypes"] == {"amount": "int64"}
        assert result.custom_metrics["schema"]["null_counts"] == {"amount": 0}
        # Metadata in custom_metrics
        assert result.custom_metrics["dataframe_type"] == "pandas"
        assert result.custom_metrics["column_count"] == 1
        # Custom metric
        assert result.custom_metrics["high_value_orders"] == 2


# Fixtures specific to Python adapter tests
@pytest.fixture
def mock_python_task():
    """Create a mock Python operator with callable."""

    def transform_data():
        pass

    transform_data.__module__ = "my_dag"

    task = MagicMock()
    task.__class__.__name__ = "_PythonDecoratedOperator"
    task.__class__.__module__ = "airflow.decorators.python"
    task.python_callable = transform_data
    return task


@pytest.fixture
def mock_python_virtualenv_task():
    """Create a mock PythonVirtualenvOperator."""

    def process():
        pass

    process.__module__ = "my_dag"

    task = MagicMock()
    task.__class__.__name__ = "PythonVirtualenvOperator"
    task.__class__.__module__ = "airflow.operators.python"
    task.python_callable = process
    task.requirements = ["pandas>=1.0", "numpy"]
    task.python_version = "3.10"
    return task
