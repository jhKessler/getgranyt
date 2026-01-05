"""
Tests for SnowflakeAdapter based on official Airflow documentation.

Documentation Source:
https://airflow.apache.org/docs/apache-airflow-providers-snowflake/stable/_api/airflow/providers/snowflake/operators/snowflake/index.html

These tests verify that the adapter correctly extracts metrics from Snowflake operators
based on their documented parameters.
"""

import pytest
from unittest.mock import MagicMock

from granyt_sdk.integrations.airflow.operator_adapters.sql.snowflake import SnowflakeAdapter


class TestSnowflakeAdapterPatterns:
    """Tests for SnowflakeAdapter operator pattern matching.
    
    Based on operators documented at:
    https://airflow.apache.org/docs/apache-airflow-providers-snowflake/stable/_api/airflow/providers/snowflake/operators/snowflake/index.html
    """
    
    def test_handles_snowflake_operator(self):
        """SnowflakeOperator is the primary Snowflake operator."""
        assert SnowflakeAdapter.can_handle("SnowflakeOperator") is True
        
    def test_handles_snowflake_sql_api_operator(self):
        """SnowflakeSqlApiOperator uses the SQL API."""
        assert SnowflakeAdapter.can_handle("SnowflakeSqlApiOperator") is True
        
    def test_handles_snowflake_check_operator(self):
        """SnowflakeCheckOperator is for data quality checks."""
        assert SnowflakeAdapter.can_handle("SnowflakeCheckOperator") is True
        
    def test_handles_s3_to_snowflake(self):
        """S3ToSnowflakeOperator is a transfer operator."""
        assert SnowflakeAdapter.can_handle("S3ToSnowflakeOperator") is True


class TestSnowflakeOperator:
    """Tests for SnowflakeOperator metric extraction.
    
    Documented parameters:
    - snowflake_conn_id: Connection ID for Snowflake
    - warehouse: Snowflake warehouse name
    - database: Database name
    - schema: Schema name
    - role: Snowflake role
    - sql: SQL query or list of queries
    """
    
    @pytest.fixture
    def mock_task_instance(self):
        ti = MagicMock()
        ti.xcom_pull = MagicMock(return_value=None)
        return ti
    
    @pytest.fixture
    def snowflake_task(self):
        task = MagicMock()
        task.__class__.__name__ = "SnowflakeOperator"
        task.__class__.__module__ = "airflow.providers.snowflake.operators.snowflake"
        task.snowflake_conn_id = "snowflake_default"
        task.warehouse = "COMPUTE_WH"
        task.database = "ANALYTICS_DB"
        task.schema = "PUBLIC"
        task.role = "ANALYST_ROLE"
        task.sql = "SELECT * FROM users WHERE active = true"
        return task
    
    def test_extracts_warehouse(self, mock_task_instance, snowflake_task):
        """warehouse should be extracted as warehouse."""
        adapter = SnowflakeAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, snowflake_task)
        
        assert metrics.warehouse == "COMPUTE_WH"
        
    def test_extracts_database(self, mock_task_instance, snowflake_task):
        """database should be extracted as database."""
        adapter = SnowflakeAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, snowflake_task)
        
        assert metrics.database == "ANALYTICS_DB"
        
    def test_extracts_schema(self, mock_task_instance, snowflake_task):
        """schema should be extracted as schema."""
        adapter = SnowflakeAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, snowflake_task)
        
        assert metrics.schema == "PUBLIC"
        
    def test_extracts_role_in_custom_metrics(self, mock_task_instance, snowflake_task):
        """role should be extracted into custom_metrics."""
        adapter = SnowflakeAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, snowflake_task)
        
        assert metrics.custom_metrics is not None
        assert metrics.custom_metrics.get("role") == "ANALYST_ROLE"
        
    def test_extracts_sql_as_query_text(self, mock_task_instance, snowflake_task):
        """sql should be extracted as query_text."""
        adapter = SnowflakeAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, snowflake_task)
        
        assert metrics.query_text is not None
        assert "SELECT * FROM users" in metrics.query_text
        
    def test_extracts_snowflake_conn_id_as_connection_id(self, mock_task_instance, snowflake_task):
        """snowflake_conn_id should be extracted as connection_id."""
        adapter = SnowflakeAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, snowflake_task)
        
        assert metrics.connection_id == "snowflake_default"


class TestSnowflakeXComParsing:
    """Tests for parsing Snowflake query results from XCom."""
    
    @pytest.fixture
    def mock_task_instance(self):
        ti = MagicMock()
        ti.xcom_pull = MagicMock(return_value=None)
        return ti
    
    @pytest.fixture
    def snowflake_task(self):
        task = MagicMock()
        task.__class__.__name__ = "SnowflakeOperator"
        task.__class__.__module__ = "airflow.providers.snowflake.operators.snowflake"
        task.snowflake_conn_id = "snowflake_default"
        task.warehouse = "COMPUTE_WH"
        task.database = "ANALYTICS_DB"
        task.schema = "PUBLIC"
        task.sql = "INSERT INTO target SELECT * FROM source"
        return task
    
    def test_parses_rows_affected_from_dict(self, mock_task_instance, snowflake_task):
        """rows_affected from XCom dict should be extracted as row_count."""
        mock_task_instance.xcom_pull.return_value = {
            "rows_affected": 1500,
            "query_id": "01ab2345-6789-cdef-0123-456789abcdef"
        }
        
        adapter = SnowflakeAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, snowflake_task)
        
        assert metrics.row_count == 1500
        
    def test_parses_query_id_from_xcom(self, mock_task_instance, snowflake_task):
        """query_id from XCom should be extracted as query_id."""
        mock_task_instance.xcom_pull.return_value = {
            "query_id": "01ab2345-6789-cdef-0123-456789abcdef"
        }
        
        adapter = SnowflakeAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, snowflake_task)
        
        assert metrics.query_id == "01ab2345-6789-cdef-0123-456789abcdef"
        
    def test_parses_list_result_as_row_count(self, mock_task_instance, snowflake_task):
        """List XCom result should be counted as row_count."""
        mock_task_instance.xcom_pull.return_value = [
            {"id": 1, "name": "Alice"},
            {"id": 2, "name": "Bob"},
            {"id": 3, "name": "Charlie"},
        ]
        
        adapter = SnowflakeAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, snowflake_task)
        
        assert metrics.row_count == 3
