"""
Tests for granyt_sdk.features.lineage.adapter module.
"""

from datetime import datetime, timezone
from unittest.mock import MagicMock

import pytest

from granyt_sdk.features.lineage.adapter import (
    OpenLineageAdapter,
    generate_run_id,
    get_current_timestamp,
)


class TestHelperFunctions:
    """Tests for module-level helper functions."""

    def test_generate_run_id_is_uuid(self):
        """Test that generate_run_id returns a valid UUID."""
        run_id = generate_run_id()

        assert isinstance(run_id, str)
        assert len(run_id) == 36  # UUID format: 8-4-4-4-12
        assert run_id.count("-") == 4

    def test_generate_run_id_unique(self):
        """Test that generate_run_id returns unique values."""
        ids = [generate_run_id() for _ in range(100)]

        assert len(set(ids)) == 100  # All unique

    def test_get_current_timestamp_iso_format(self):
        """Test that timestamp is in ISO format."""
        timestamp = get_current_timestamp()

        # Should be parseable as ISO format
        parsed = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        assert parsed.tzinfo is not None

    def test_get_current_timestamp_is_utc(self):
        """Test that timestamp is in UTC."""
        timestamp = get_current_timestamp()

        # Should end with +00:00 or Z
        assert "+00:00" in timestamp or timestamp.endswith("Z")


class TestOpenLineageAdapterInit:
    """Tests for OpenLineageAdapter initialization."""

    def test_default_namespace(self):
        """Test default namespace is 'airflow'."""
        adapter = OpenLineageAdapter()

        assert adapter.namespace == "airflow"

    def test_custom_namespace(self):
        """Test custom namespace is set."""
        adapter = OpenLineageAdapter(namespace="my_namespace")

        assert adapter.namespace == "my_namespace"

    def test_producer_constant(self):
        """Test PRODUCER constant is set."""
        assert OpenLineageAdapter.PRODUCER == "https://github.com/granyt/granyt-sdk"

    def test_schema_url_constant(self):
        """Test SCHEMA_URL constant is set."""
        assert "openlineage.io" in OpenLineageAdapter.SCHEMA_URL


class TestCreateJob:
    """Tests for OpenLineageAdapter.create_job()."""

    def test_create_job_with_task_id(self):
        """Test job creation with task_id."""
        adapter = OpenLineageAdapter()
        job = adapter.create_job("my_dag", "my_task")

        assert job["namespace"] == "airflow"
        assert job["name"] == "my_dag.my_task"

    def test_create_job_without_task_id(self):
        """Test job creation without task_id."""
        adapter = OpenLineageAdapter()
        job = adapter.create_job("my_dag")

        assert job["namespace"] == "airflow"
        assert job["name"] == "my_dag"

    def test_create_job_with_facets(self):
        """Test job creation with facets."""
        adapter = OpenLineageAdapter()
        facets = {"documentation": {"description": "Test job"}}
        job = adapter.create_job("my_dag", facets=facets)

        assert job["facets"] == facets

    def test_create_job_custom_namespace(self):
        """Test job creation with custom namespace."""
        adapter = OpenLineageAdapter(namespace="custom")
        job = adapter.create_job("my_dag")

        assert job["namespace"] == "custom"


class TestCreateRun:
    """Tests for OpenLineageAdapter.create_run()."""

    def test_create_run_with_id(self):
        """Test run creation with specified ID."""
        adapter = OpenLineageAdapter()
        run = adapter.create_run("my-run-id")

        assert run["runId"] == "my-run-id"

    def test_create_run_with_facets(self):
        """Test run creation with facets."""
        adapter = OpenLineageAdapter()
        facets = {"nominalTime": {"nominalStartTime": "2026-01-05T00:00:00Z"}}
        run = adapter.create_run("my-run-id", facets=facets)

        assert run["facets"] == facets

    def test_create_run_without_facets(self):
        """Test run creation without facets."""
        adapter = OpenLineageAdapter()
        run = adapter.create_run("my-run-id")

        assert "facets" not in run


class TestCreateDataset:
    """Tests for OpenLineageAdapter.create_dataset()."""

    def test_create_dataset_basic(self):
        """Test basic dataset creation."""
        adapter = OpenLineageAdapter()
        dataset = adapter.create_dataset("s3://bucket", "path/to/data")

        assert dataset["namespace"] == "s3://bucket"
        assert dataset["name"] == "path/to/data"

    def test_create_dataset_with_facets(self):
        """Test dataset creation with facets."""
        adapter = OpenLineageAdapter()
        facets = {"schema": {"fields": []}}
        dataset = adapter.create_dataset("db://host", "table", facets=facets)

        assert dataset["facets"] == facets


class TestCreateRunEvent:
    """Tests for OpenLineageAdapter.create_run_event()."""

    def test_create_run_event_structure(self):
        """Test run event has correct structure."""
        adapter = OpenLineageAdapter()
        event = adapter.create_run_event(
            event_type="START",
            dag_id="my_dag",
            task_id="my_task",
        )

        assert event["eventType"] == "START"
        assert "eventTime" in event
        assert event["producer"] == OpenLineageAdapter.PRODUCER
        assert event["schemaURL"] == OpenLineageAdapter.SCHEMA_URL
        assert "job" in event
        assert "run" in event
        assert "inputs" in event
        assert "outputs" in event

    def test_create_run_event_with_inputs_outputs(self):
        """Test run event with inputs and outputs."""
        adapter = OpenLineageAdapter()
        inputs = [{"namespace": "s3", "name": "input"}]
        outputs = [{"namespace": "s3", "name": "output"}]

        event = adapter.create_run_event(
            event_type="COMPLETE",
            dag_id="my_dag",
            inputs=inputs,
            outputs=outputs,
        )

        assert event["inputs"] == inputs
        assert event["outputs"] == outputs

    def test_create_run_event_with_custom_run_id(self):
        """Test run event with custom run ID."""
        adapter = OpenLineageAdapter()
        event = adapter.create_run_event(
            event_type="START",
            dag_id="my_dag",
            run_id="custom-run-id",
        )

        assert event["run"]["runId"] == "custom-run-id"

    def test_create_run_event_generates_run_id(self):
        """Test run event generates run ID if not provided."""
        adapter = OpenLineageAdapter()
        event = adapter.create_run_event(
            event_type="START",
            dag_id="my_dag",
        )

        assert "runId" in event["run"]
        assert len(event["run"]["runId"]) == 36


class TestEventTypeShortcuts:
    """Tests for event type shortcut methods."""

    def test_create_start_event(self):
        """Test create_start_event."""
        adapter = OpenLineageAdapter()
        event = adapter.create_start_event(dag_id="my_dag")

        assert event["eventType"] == "START"

    def test_create_complete_event(self):
        """Test create_complete_event."""
        adapter = OpenLineageAdapter()
        event = adapter.create_complete_event(dag_id="my_dag")

        assert event["eventType"] == "COMPLETE"

    def test_create_fail_event_without_error(self):
        """Test create_fail_event without error message."""
        adapter = OpenLineageAdapter()
        event = adapter.create_fail_event(dag_id="my_dag")

        assert event["eventType"] == "FAIL"

    def test_create_fail_event_with_error(self):
        """Test create_fail_event with error message."""
        adapter = OpenLineageAdapter()
        event = adapter.create_fail_event(dag_id="my_dag", error_message="Something went wrong")

        assert event["eventType"] == "FAIL"
        assert "errorMessage" in event["run"]["facets"]
        assert event["run"]["facets"]["errorMessage"]["message"] == "Something went wrong"

    def test_create_abort_event(self):
        """Test create_abort_event."""
        adapter = OpenLineageAdapter()
        event = adapter.create_abort_event(dag_id="my_dag")

        assert event["eventType"] == "ABORT"


class TestExtractTaskFacets:
    """Tests for OpenLineageAdapter.extract_task_facets()."""

    def test_extracts_nominal_time(self, mock_task_instance):
        """Test extraction of nominal time facet."""
        adapter = OpenLineageAdapter()
        facets = adapter.extract_task_facets(mock_task_instance)

        assert "nominalTime" in facets
        assert "nominalStartTime" in facets["nominalTime"]

    def test_extracts_parent_run(self, mock_task_instance):
        """Test extraction of parent run facet."""
        adapter = OpenLineageAdapter()
        facets = adapter.extract_task_facets(mock_task_instance)

        assert "parent" in facets
        assert facets["parent"]["job"]["name"] == "test_dag"

    def test_extracts_airflow_facet(self, mock_task_instance):
        """Test extraction of Airflow-specific facet."""
        adapter = OpenLineageAdapter()
        facets = adapter.extract_task_facets(mock_task_instance)

        assert "airflow" in facets
        airflow = facets["airflow"]
        assert airflow["dag_id"] == "test_dag"
        assert airflow["task_id"] == "test_task"
        assert airflow["operator"] == "PythonOperator"

    def test_handles_missing_attributes(self):
        """Test handling of task instance with missing attributes."""
        adapter = OpenLineageAdapter()
        minimal_ti = MagicMock(spec=[])  # No attributes

        # Should not raise
        facets = adapter.extract_task_facets(minimal_ti)

        assert isinstance(facets, dict)


class TestExtractDagFacets:
    """Tests for OpenLineageAdapter.extract_dag_facets()."""

    def test_extracts_nominal_time(self, mock_dag_run):
        """Test extraction of nominal time from DAG run."""
        adapter = OpenLineageAdapter()
        facets = adapter.extract_dag_facets(mock_dag_run)

        assert "nominalTime" in facets

    def test_extracts_dag_run_facet(self, mock_dag_run):
        """Test extraction of DAG run facet."""
        adapter = OpenLineageAdapter()
        facets = adapter.extract_dag_facets(mock_dag_run)

        assert "airflowDagRun" in facets
        dag_run_facet = facets["airflowDagRun"]
        assert dag_run_facet["dag_id"] == "test_dag"
        assert dag_run_facet["run_type"] == "manual"

    def test_handles_missing_attributes(self):
        """Test handling of DAG run with missing attributes."""
        adapter = OpenLineageAdapter()
        minimal_dr = MagicMock(spec=[])  # No attributes

        # Should not raise
        facets = adapter.extract_dag_facets(minimal_dr)

        assert isinstance(facets, dict)


class TestExtractJobFacets:
    """Tests for OpenLineageAdapter.extract_job_facets()."""

    def test_extracts_from_task(self, mock_task_instance):
        """Test extraction of job facets from task."""
        adapter = OpenLineageAdapter()
        facets = adapter.extract_job_facets(task=mock_task_instance.task)

        assert isinstance(facets, dict)

    def test_extracts_from_dag(self, mock_dag_run):
        """Test extraction of job facets from DAG."""
        adapter = OpenLineageAdapter()
        facets = adapter.extract_job_facets(dag=mock_dag_run.dag)

        assert isinstance(facets, dict)

    def test_handles_no_input(self):
        """Test handling when no task or dag provided."""
        adapter = OpenLineageAdapter()
        facets = adapter.extract_job_facets()

        assert isinstance(facets, dict)
