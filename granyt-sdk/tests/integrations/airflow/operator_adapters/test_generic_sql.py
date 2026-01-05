"""
Tests for GenericSQLAdapter based on official Airflow documentation.

Documentation Source:
https://airflow.apache.org/docs/apache-airflow-providers-common-sql/stable/_api/airflow/providers/common/sql/operators/sql/index.html

These tests verify that the adapter correctly extracts metrics from generic SQL operators
based on their documented parameters.
"""

import pytest
from unittest.mock import MagicMock

from granyt_sdk.integrations.airflow.operator_adapters.sql.generic import GenericSQLAdapter


class TestGenericSQLAdapterPatterns:
    """Tests for GenericSQLAdapter operator pattern matching.
    
    Based on operators documented at:
    https://airflow.apache.org/docs/apache-airflow-providers-common-sql/stable/_api/airflow/providers/common/sql/operators/sql/index.html
    """
    
    def test_handles_sql_execute_query_operator(self):
        """SQLExecuteQueryOperator is the primary SQL operator."""
        assert GenericSQLAdapter.can_handle("SQLExecuteQueryOperator") is True
        
    def test_handles_sql_column_check_operator(self):
        """SQLColumnCheckOperator is for column-level checks."""
        assert GenericSQLAdapter.can_handle("SQLColumnCheckOperator") is True
        
    def test_handles_sql_table_check_operator(self):
        """SQLTableCheckOperator is for table-level checks."""
        assert GenericSQLAdapter.can_handle("SQLTableCheckOperator") is True
        
    def test_handles_sql_check_operator(self):
        """SQLCheckOperator is for generic SQL checks."""
        assert GenericSQLAdapter.can_handle("SQLCheckOperator") is True
        
    def test_handles_sql_value_check_operator(self):
        """SQLValueCheckOperator checks SQL result values."""
        assert GenericSQLAdapter.can_handle("SQLValueCheckOperator") is True
        
    def test_handles_sql_interval_check_operator(self):
        """SQLIntervalCheckOperator compares metrics across time intervals."""
        assert GenericSQLAdapter.can_handle("SQLIntervalCheckOperator") is True
        
    def test_handles_branch_sql_operator(self):
        """BranchSQLOperator branches based on SQL results."""
        assert GenericSQLAdapter.can_handle("BranchSQLOperator") is True


class TestSQLExecuteQueryOperator:
    """Tests for SQLExecuteQueryOperator metric extraction.
    
    Documented parameters:
    - sql: SQL query or list of queries to execute
    - conn_id: Database connection ID
    - database: Database name to use
    - autocommit: Auto-commit transactions
    - parameters: Query parameters
    """
    
    @pytest.fixture
    def mock_task_instance(self):
        ti = MagicMock()
        ti.xcom_pull = MagicMock(return_value=None)
        return ti
    
    @pytest.fixture
    def execute_query_task(self):
        task = MagicMock()
        task.__class__.__name__ = "SQLExecuteQueryOperator"
        task.__class__.__module__ = "airflow.providers.common.sql.operators.sql"
        task.conn_id = "postgres_default"
        task.database = "analytics"
        task.schema = "public"
        task.sql = "INSERT INTO events SELECT * FROM staging_events"
        return task
    
    def test_extracts_database(self, mock_task_instance, execute_query_task):
        """database should be extracted as database."""
        adapter = GenericSQLAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, execute_query_task)
        
        assert metrics.database == "analytics"
        
    def test_extracts_schema(self, mock_task_instance, execute_query_task):
        """schema should be extracted as schema."""
        adapter = GenericSQLAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, execute_query_task)
        
        assert metrics.schema == "public"
        
    def test_extracts_sql_as_query_text(self, mock_task_instance, execute_query_task):
        """sql should be extracted as query_text."""
        adapter = GenericSQLAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, execute_query_task)
        
        assert metrics.query_text is not None
        assert "INSERT INTO events" in metrics.query_text
        
    def test_extracts_conn_id_as_connection_id(self, mock_task_instance, execute_query_task):
        """conn_id should be extracted as connection_id."""
        adapter = GenericSQLAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, execute_query_task)
        
        assert metrics.connection_id == "postgres_default"


class TestSQLColumnCheckOperator:
    """Tests for SQLColumnCheckOperator metric extraction.
    
    Documented parameters:
    - table: Table name to check
    - column_mapping: Dict mapping columns to checks
    - conn_id: Database connection ID
    - database: Database name
    """
    
    @pytest.fixture
    def mock_task_instance(self):
        ti = MagicMock()
        ti.xcom_pull = MagicMock(return_value=None)
        return ti
    
    @pytest.fixture
    def column_check_task(self):
        task = MagicMock()
        task.__class__.__name__ = "SQLColumnCheckOperator"
        task.__class__.__module__ = "airflow.providers.common.sql.operators.sql"
        task.conn_id = "postgres_default"
        task.database = "sales"
        task.table = "orders"
        task.column_mapping = {
            "id": {"null_check": {"equal_to": 0}},
            "amount": {"min": {"greater_than": 0}}
        }
        return task
    
    def test_extracts_table(self, mock_task_instance, column_check_task):
        """table should be extracted as table."""
        adapter = GenericSQLAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, column_check_task)
        
        assert metrics.table == "orders"
        
    def test_extracts_database(self, mock_task_instance, column_check_task):
        """database should be extracted as database."""
        adapter = GenericSQLAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, column_check_task)
        
        assert metrics.database == "sales"


class TestGenericSQLXComParsing:
    """Tests for parsing SQL query results from XCom."""
    
    @pytest.fixture
    def mock_task_instance(self):
        ti = MagicMock()
        ti.xcom_pull = MagicMock(return_value=None)
        return ti
    
    @pytest.fixture
    def execute_query_task(self):
        task = MagicMock()
        task.__class__.__name__ = "SQLExecuteQueryOperator"
        task.__class__.__module__ = "airflow.providers.common.sql.operators.sql"
        task.conn_id = "postgres_default"
        task.database = "analytics"
        task.sql = "INSERT INTO target SELECT * FROM source"
        return task
    
    def test_parses_integer_result_as_row_count(self, mock_task_instance, execute_query_task):
        """Integer XCom result should be extracted as row_count."""
        mock_task_instance.xcom_pull.return_value = 150
        
        adapter = GenericSQLAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, execute_query_task)
        
        assert metrics.row_count == 150
        
    def test_parses_list_result_as_row_count(self, mock_task_instance, execute_query_task):
        """List XCom result should be counted as row_count."""
        mock_task_instance.xcom_pull.return_value = [
            {"id": 1}, {"id": 2}, {"id": 3}
        ]
        
        adapter = GenericSQLAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, execute_query_task)
        
        assert metrics.row_count == 3
