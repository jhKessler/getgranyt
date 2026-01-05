"""
Tests for DbtAdapter based on official Airflow documentation.

Documentation Source:
https://airflow.apache.org/docs/apache-airflow-providers-dbt-cloud/stable/_api/airflow/providers/dbt/cloud/operators/dbt/index.html

These tests verify that the adapter correctly extracts metrics from dbt Cloud operators
based on their documented parameters.
"""

import pytest
from unittest.mock import MagicMock

from granyt_sdk.integrations.airflow.operator_adapters.transform.dbt import DbtAdapter


class TestDbtAdapterPatterns:
    """Tests for DbtAdapter operator pattern matching.
    
    Based on operators documented at:
    https://airflow.apache.org/docs/apache-airflow-providers-dbt-cloud/stable/_api/airflow/providers/dbt/cloud/operators/dbt/index.html
    """
    
    def test_handles_dbt_cloud_run_job_operator(self):
        """DbtCloudRunJobOperator is the primary dbt Cloud operator."""
        assert DbtAdapter.can_handle("DbtCloudRunJobOperator") is True
        
    def test_handles_dbt_cloud_get_job_run_artifact_operator(self):
        """DbtCloudGetJobRunArtifactOperator retrieves job artifacts."""
        assert DbtAdapter.can_handle("DbtCloudGetJobRunArtifactOperator") is True
        
    def test_handles_dbt_cloud_list_jobs_operator(self):
        """DbtCloudListJobsOperator lists dbt Cloud jobs."""
        assert DbtAdapter.can_handle("DbtCloudListJobsOperator") is True
        
    def test_handles_dbt_run_operator(self):
        """DbtRunOperator (Cosmos) runs dbt models locally."""
        assert DbtAdapter.can_handle("DbtRunOperator") is True
        
    def test_handles_dbt_test_operator(self):
        """DbtTestOperator (Cosmos) runs dbt tests locally."""
        assert DbtAdapter.can_handle("DbtTestOperator") is True


class TestDbtCloudRunJobOperator:
    """Tests for DbtCloudRunJobOperator metric extraction.
    
    Documented parameters:
    - dbt_cloud_conn_id: dbt Cloud connection ID
    - job_id: dbt Cloud job ID to trigger
    - account_id: dbt Cloud account ID
    - trigger_reason: Reason for triggering (optional)
    - wait_for_termination: Wait for job completion
    - timeout: Timeout in seconds
    """
    
    @pytest.fixture
    def mock_task_instance(self):
        ti = MagicMock()
        ti.xcom_pull = MagicMock(return_value=None)
        return ti
    
    @pytest.fixture
    def run_job_task(self):
        task = MagicMock()
        task.__class__.__name__ = "DbtCloudRunJobOperator"
        task.__class__.__module__ = "airflow.providers.dbt.cloud.operators.dbt"
        task.dbt_cloud_conn_id = "dbt_cloud_default"
        task.job_id = 12345
        task.account_id = 67890
        task.wait_for_termination = True
        task.timeout = 3600
        return task
    
    def test_extracts_dbt_cloud_conn_id_as_connection_id(self, mock_task_instance, run_job_task):
        """dbt_cloud_conn_id should be extracted as connection_id."""
        adapter = DbtAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, run_job_task)
        
        assert metrics.connection_id == "dbt_cloud_default"
        
    def test_extracts_job_id_in_custom_metrics(self, mock_task_instance, run_job_task):
        """job_id should be extracted into custom_metrics."""
        adapter = DbtAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, run_job_task)
        
        assert metrics.custom_metrics is not None
        assert metrics.custom_metrics.get("job_id") == 12345
        
    def test_extracts_account_id_in_custom_metrics(self, mock_task_instance, run_job_task):
        """account_id should be extracted into custom_metrics."""
        adapter = DbtAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, run_job_task)
        
        assert metrics.custom_metrics is not None
        assert metrics.custom_metrics.get("account_id") == 67890


class TestDbtCloudGetJobRunArtifactOperator:
    """Tests for DbtCloudGetJobRunArtifactOperator metric extraction.
    
    Documented parameters:
    - dbt_cloud_conn_id: dbt Cloud connection ID
    - run_id: dbt Cloud run ID
    - path: Path to artifact file
    - account_id: dbt Cloud account ID
    """
    
    @pytest.fixture
    def mock_task_instance(self):
        ti = MagicMock()
        ti.xcom_pull = MagicMock(return_value=None)
        return ti
    
    @pytest.fixture
    def artifact_task(self):
        task = MagicMock()
        task.__class__.__name__ = "DbtCloudGetJobRunArtifactOperator"
        task.__class__.__module__ = "airflow.providers.dbt.cloud.operators.dbt"
        task.dbt_cloud_conn_id = "dbt_cloud_default"
        task.run_id = 98765
        task.path = "manifest.json"
        task.account_id = 67890
        return task
    
    def test_extracts_run_id_in_custom_metrics(self, mock_task_instance, artifact_task):
        """run_id should be extracted into custom_metrics."""
        adapter = DbtAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, artifact_task)
        
        assert metrics.custom_metrics is not None
        assert metrics.custom_metrics.get("run_id") == 98765
        
    def test_extracts_artifact_path_in_custom_metrics(self, mock_task_instance, artifact_task):
        """path should be extracted into custom_metrics."""
        adapter = DbtAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, artifact_task)
        
        assert metrics.custom_metrics is not None
        assert metrics.custom_metrics.get("artifact_path") == "manifest.json"


class TestDbtXComParsing:
    """Tests for parsing dbt run results from XCom."""
    
    @pytest.fixture
    def mock_task_instance(self):
        ti = MagicMock()
        ti.xcom_pull = MagicMock(return_value=None)
        return ti
    
    @pytest.fixture
    def run_job_task(self):
        task = MagicMock()
        task.__class__.__name__ = "DbtCloudRunJobOperator"
        task.__class__.__module__ = "airflow.providers.dbt.cloud.operators.dbt"
        task.dbt_cloud_conn_id = "dbt_cloud_default"
        task.job_id = 12345
        return task
    
    def test_parses_models_run_from_run_results(self, mock_task_instance, run_job_task):
        """models_run should be extracted from run_results."""
        mock_task_instance.xcom_pull.return_value = {
            "run_id": 12345,
            "status": "success",
            "run_results": {
                "results": [
                    {"status": "success", "unique_id": "model.project.model_a"},
                    {"status": "success", "unique_id": "model.project.model_b"},
                    {"status": "success", "unique_id": "model.project.model_c"},
                ]
            }
        }
        
        adapter = DbtAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, run_job_task)
        
        assert metrics.models_run == 3
        
    def test_parses_tests_passed_and_failed(self, mock_task_instance, run_job_task):
        """tests_passed and tests_failed should be extracted from test results."""
        mock_task_instance.xcom_pull.return_value = {
            "run_id": 12345,
            "run_results": {
                "results": [
                    {"status": "pass", "unique_id": "test.project.test_1"},
                    {"status": "pass", "unique_id": "test.project.test_2"},
                    {"status": "fail", "unique_id": "test.project.test_3"},
                ]
            }
        }
        
        adapter = DbtAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, run_job_task)
        
        assert metrics.tests_passed == 2
        assert metrics.tests_failed == 1
        
    def test_parses_rows_affected_from_adapter_response(self, mock_task_instance, run_job_task):
        """rows_affected from adapter_response should be summed as row_count."""
        mock_task_instance.xcom_pull.return_value = {
            "run_id": 12345,
            "run_results": {
                "results": [
                    {
                        "status": "success",
                        "unique_id": "model.project.model_a",
                        "adapter_response": {"rows_affected": 1000}
                    },
                    {
                        "status": "success", 
                        "unique_id": "model.project.model_b",
                        "adapter_response": {"rows_affected": 500}
                    },
                ]
            }
        }
        
        adapter = DbtAdapter()
        metrics = adapter.extract_metrics(mock_task_instance, run_job_task)
        
        assert metrics.row_count == 1500
