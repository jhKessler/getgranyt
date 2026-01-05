"""
Shared fixtures for Granyt SDK tests.
"""

import os
import sys
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest

# ==================== Environment Fixtures ====================


@pytest.fixture
def clean_env(monkeypatch):
    """Remove all GRANYT_ environment variables."""
    env_vars = [
        "GRANYT_ENDPOINT",
        "GRANYT_API_KEY",
        "GRANYT_ENDPOINTS",
        "GRANYT_DEBUG",
        "GRANYT_DISABLED",
        "GRANYT_NAMESPACE",
        "GRANYT_MAX_RETRIES",
        "GRANYT_RETRY_DELAY",
        "GRANYT_BATCH_SIZE",
        "GRANYT_FLUSH_INTERVAL",
        "GRANYT_TIMEOUT",
    ]
    for var in env_vars:
        monkeypatch.delenv(var, raising=False)
    return monkeypatch


@pytest.fixture
def valid_env(clean_env):
    """Set up valid GRANYT environment variables."""
    clean_env.setenv("GRANYT_ENDPOINT", "https://api.granyt.dev")
    clean_env.setenv("GRANYT_API_KEY", "test-api-key-12345")
    return clean_env


@pytest.fixture
def debug_env(valid_env):
    """Valid environment with debug enabled."""
    valid_env.setenv("GRANYT_DEBUG", "true")
    return valid_env


# ==================== Config Fixtures ====================


@pytest.fixture
def valid_config():
    """Create a valid GranytConfig."""
    from granyt_sdk.core.config import GranytConfig

    return GranytConfig(
        endpoint="https://api.granyt.dev",
        api_key="test-api-key-12345",
        debug=False,
        disabled=False,
        namespace="airflow",
        max_retries=3,
        retry_delay=1.0,
        batch_size=10,
        flush_interval=5.0,
        timeout=30.0,
    )


@pytest.fixture
def invalid_config():
    """Create an invalid GranytConfig (missing credentials)."""
    from granyt_sdk.core.config import GranytConfig

    return GranytConfig()


# ==================== Mock Airflow Objects ====================


@pytest.fixture
def mock_task_instance():
    """Create a mock Airflow TaskInstance."""
    ti = MagicMock()
    ti.dag_id = "test_dag"
    ti.task_id = "test_task"
    ti.run_id = "manual__2026-01-05T00:00:00+00:00"
    ti.map_index = -1
    ti.try_number = 1
    ti.max_tries = 3
    ti.state = "running"
    ti.operator = "PythonOperator"
    ti.pool = "default_pool"
    ti.queue = "default"
    ti.priority_weight = 1
    ti.hostname = "localhost"
    ti.execution_date = datetime(2026, 1, 5, tzinfo=timezone.utc)
    ti.start_date = datetime(2026, 1, 5, 0, 0, 1, tzinfo=timezone.utc)
    ti.end_date = None
    ti.duration = None

    # Mock task object
    task = MagicMock()
    task.task_type = "PythonOperator"
    task.owner = "airflow"
    task.email = None
    task.retries = 3
    task.retry_delay = "0:05:00"
    task.trigger_rule = "all_success"
    task.depends_on_past = False
    task.wait_for_downstream = False
    task.params = {"key": "value"}
    ti.task = task

    return ti


@pytest.fixture
def mock_dag_run():
    """Create a mock Airflow DagRun."""
    dr = MagicMock()
    dr.dag_id = "test_dag"
    dr.run_id = "manual__2026-01-05T00:00:00+00:00"
    dr.run_type = "manual"
    dr.state = "running"
    dr.execution_date = datetime(2026, 1, 5, tzinfo=timezone.utc)
    dr.start_date = datetime(2026, 1, 5, 0, 0, 1, tzinfo=timezone.utc)
    dr.end_date = None
    dr.external_trigger = True
    dr.conf = {"param1": "value1"}
    dr.data_interval_start = datetime(2026, 1, 4, tzinfo=timezone.utc)
    dr.data_interval_end = datetime(2026, 1, 5, tzinfo=timezone.utc)

    # Mock dag object
    dag = MagicMock()
    dag.description = "Test DAG"
    dag.owner = "airflow"
    dag.schedule_interval = "@daily"
    dag.catchup = False
    dag.tags = ["test", "example"]
    dag.default_args = {"owner": "airflow"}
    dag.fileloc = "/opt/airflow/dags/test_dag.py"
    dr.dag = dag

    return dr


@pytest.fixture
def mock_context(mock_task_instance, mock_dag_run):
    """Create a mock Airflow context dictionary."""
    return {
        "task_instance": mock_task_instance,
        "ti": mock_task_instance,
        "dag_run": mock_dag_run,
        "execution_date": mock_task_instance.execution_date,
        "run_id": mock_task_instance.run_id,
        "exception": None,
    }


# ==================== Exception Fixtures ====================


@pytest.fixture
def sample_exception():
    """Create an exception with a traceback."""

    def inner_function():
        local_var = "test_value"
        secret_key = "should_be_redacted"
        raise ValueError("Test error message")

    def outer_function():
        data = {"key": "value"}
        inner_function()

    try:
        outer_function()
    except ValueError as e:
        return e


@pytest.fixture
def chained_exception():
    """Create an exception with a chained cause."""
    try:
        try:
            raise KeyError("Original error")
        except KeyError as e:
            raise ValueError("Wrapper error") from e
    except ValueError as e:
        return e


@pytest.fixture
def nested_exception():
    """Create an exception with context (implicit chaining)."""
    try:
        try:
            raise KeyError("Original error")
        except KeyError:
            raise ValueError("During handling")
    except ValueError as e:
        return e


# ==================== DataFrame Fixtures ====================


@pytest.fixture
def pandas_df():
    """Create a sample pandas DataFrame."""
    try:
        import pandas as pd

        return pd.DataFrame(
            {
                "id": [1, 2, 3, 4, 5],
                "name": ["Alice", "Bob", "", "David", None],
                "score": [95.5, 87.0, None, 92.3, 88.1],
                "active": [True, False, True, True, False],
            }
        )
    except ImportError:
        pytest.skip("pandas not installed")


@pytest.fixture
def pandas_df_empty():
    """Create an empty pandas DataFrame."""
    try:
        import pandas as pd

        return pd.DataFrame()
    except ImportError:
        pytest.skip("pandas not installed")


@pytest.fixture
def polars_df():
    """Create a sample polars DataFrame."""
    try:
        import polars as pl

        return pl.DataFrame(
            {
                "id": [1, 2, 3, 4, 5],
                "name": ["Alice", "Bob", "", "David", None],
                "score": [95.5, 87.0, None, 92.3, 88.1],
                "active": [True, False, True, True, False],
            }
        )
    except ImportError:
        pytest.skip("polars not installed")


@pytest.fixture
def polars_lazyframe():
    """Create a sample polars LazyFrame."""
    try:
        import polars as pl

        return pl.LazyFrame(
            {
                "id": [1, 2, 3],
                "value": [10, 20, 30],
            }
        )
    except ImportError:
        pytest.skip("polars not installed")


# ==================== HTTP Mock Fixtures ====================


@pytest.fixture
def mock_response_success():
    """Create a successful mock HTTP response."""
    response = MagicMock()
    response.status_code = 200
    response.text = '{"status": "ok"}'
    response.json.return_value = {"status": "ok"}
    return response


@pytest.fixture
def mock_response_error():
    """Create an error mock HTTP response."""
    response = MagicMock()
    response.status_code = 500
    response.text = '{"error": "Internal server error"}'
    return response


@pytest.fixture
def mock_session(mock_response_success):
    """Create a mock requests Session."""
    session = MagicMock()
    session.post.return_value = mock_response_success
    session.get.return_value = mock_response_success
    return session


# ==================== Client Reset Fixture ====================


@pytest.fixture(autouse=True)
def reset_client_singleton():
    """Reset the client singleton before and after each test."""
    from granyt_sdk.core import client

    # Store original
    original_instance = client._client
    original_class_instance = client.GranytClient._instance

    # Reset before test
    client._client = None
    client.GranytClient._instance = None

    yield

    # Reset after test
    client._client = None
    client.GranytClient._instance = None
