"""
OpenLineage integration for Granyt SDK.

Converts Airflow task/DAG events into OpenLineage-compatible events.
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

logger = logging.getLogger(__name__)


def generate_run_id() -> str:
    """Generate a unique run ID."""
    return str(uuid4())


def get_current_timestamp() -> str:
    """Get current timestamp in ISO format."""
    return datetime.now(timezone.utc).isoformat()


class OpenLineageAdapter:
    """Adapter for converting Airflow events to OpenLineage format.

    OpenLineage is an open standard for metadata and lineage collection.
    This adapter creates compliant events from Airflow task executions.
    """

    PRODUCER = "https://github.com/granyt/granyt-sdk"
    SCHEMA_URL = "https://openlineage.io/spec/1-0-5/OpenLineage.json"

    def __init__(self, namespace: str = "airflow"):
        self.namespace = namespace

    def create_job(
        self,
        dag_id: str,
        task_id: Optional[str] = None,
        facets: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Create an OpenLineage Job object.

        Args:
            dag_id: The DAG ID
            task_id: Optional task ID (if task-level event)
            facets: Optional job facets

        Returns:
            Job dictionary
        """
        job_name = f"{dag_id}.{task_id}" if task_id else dag_id

        job: Dict[str, Any] = {
            "namespace": self.namespace,
            "name": job_name,
        }

        if facets:
            job["facets"] = facets

        return job

    def create_run(
        self,
        run_id: str,
        facets: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Create an OpenLineage Run object.

        Args:
            run_id: Unique run identifier
            facets: Optional run facets

        Returns:
            Run dictionary
        """
        run: Dict[str, Any] = {"runId": run_id}

        if facets:
            run["facets"] = facets

        return run

    def create_dataset(
        self,
        namespace: str,
        name: str,
        facets: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Create an OpenLineage Dataset object.

        Args:
            namespace: Dataset namespace
            name: Dataset name
            facets: Optional dataset facets

        Returns:
            Dataset dictionary
        """
        dataset: Dict[str, Any] = {
            "namespace": namespace,
            "name": name,
        }

        if facets:
            dataset["facets"] = facets

        return dataset

    def create_run_event(
        self,
        event_type: str,
        dag_id: str,
        task_id: Optional[str] = None,
        run_id: Optional[str] = None,
        inputs: Optional[List[Dict[str, Any]]] = None,
        outputs: Optional[List[Dict[str, Any]]] = None,
        job_facets: Optional[Dict[str, Any]] = None,
        run_facets: Optional[Dict[str, Any]] = None,
        event_time: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Create an OpenLineage RunEvent.

        Args:
            event_type: Event type (START, RUNNING, COMPLETE, FAIL, ABORT)
            dag_id: The DAG ID
            task_id: Optional task ID
            run_id: Optional run ID (generated if not provided)
            inputs: Optional input datasets
            outputs: Optional output datasets
            job_facets: Optional job facets
            run_facets: Optional run facets
            event_time: Optional event timestamp
            **kwargs: Additional arguments (e.g., operator_metrics)

        Returns:
            RunEvent dictionary
        """
        run_facets = run_facets or {}

        # Add operator metrics as a facet if provided
        operator_metrics = kwargs.get("operator_metrics")
        if operator_metrics and hasattr(operator_metrics, "to_openlineage_facet"):
            run_facets["operatorMetrics"] = operator_metrics.to_openlineage_facet()

        return {
            "eventType": event_type,
            "eventTime": event_time or get_current_timestamp(),
            "producer": self.PRODUCER,
            "schemaURL": self.SCHEMA_URL,
            "job": self.create_job(dag_id, task_id, job_facets),
            "run": self.create_run(run_id or generate_run_id(), run_facets),
            "inputs": inputs or [],
            "outputs": outputs or [],
        }

    def create_start_event(
        self,
        dag_id: str,
        task_id: Optional[str] = None,
        run_id: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Create a START event."""
        return self.create_run_event(
            event_type="START",
            dag_id=dag_id,
            task_id=task_id,
            run_id=run_id,
            **kwargs,
        )

    def create_complete_event(
        self,
        dag_id: str,
        task_id: Optional[str] = None,
        run_id: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Create a COMPLETE event."""
        return self.create_run_event(
            event_type="COMPLETE",
            dag_id=dag_id,
            task_id=task_id,
            run_id=run_id,
            **kwargs,
        )

    def create_fail_event(
        self,
        dag_id: str,
        task_id: Optional[str] = None,
        run_id: Optional[str] = None,
        error_message: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Create a FAIL event."""
        run_facets = kwargs.pop("run_facets", {}) or {}

        if error_message:
            run_facets["errorMessage"] = {
                "_producer": self.PRODUCER,
                "_schemaURL": f"{self.SCHEMA_URL}#/definitions/ErrorMessageRunFacet",
                "message": error_message,
                "programmingLanguage": "python",
            }

        return self.create_run_event(
            event_type="FAIL",
            dag_id=dag_id,
            task_id=task_id,
            run_id=run_id,
            run_facets=run_facets,
            **kwargs,
        )

    def create_abort_event(
        self,
        dag_id: str,
        task_id: Optional[str] = None,
        run_id: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Create an ABORT event."""
        return self.create_run_event(
            event_type="ABORT",
            dag_id=dag_id,
            task_id=task_id,
            run_id=run_id,
            **kwargs,
        )

    def extract_task_facets(self, task_instance) -> Dict[str, Any]:
        """Extract facets from an Airflow TaskInstance.

        Args:
            task_instance: Airflow TaskInstance object

        Returns:
            Dictionary of facets
        """
        facets = {}

        try:
            # Nominal time facet
            if hasattr(task_instance, "execution_date") and task_instance.execution_date:
                facets["nominalTime"] = {
                    "_producer": self.PRODUCER,
                    "_schemaURL": f"{self.SCHEMA_URL}#/definitions/NominalTimeRunFacet",
                    "nominalStartTime": task_instance.execution_date.isoformat(),
                }

            # Parent run facet (DAG run)
            if hasattr(task_instance, "dag_id") and hasattr(task_instance, "run_id"):
                facets["parent"] = {
                    "_producer": self.PRODUCER,
                    "_schemaURL": f"{self.SCHEMA_URL}#/definitions/ParentRunFacet",
                    "run": {"runId": task_instance.run_id},
                    "job": {
                        "namespace": self.namespace,
                        "name": task_instance.dag_id,
                    },
                }

            # Airflow-specific facet
            airflow_facet = {
                "_producer": self.PRODUCER,
                "_schemaURL": "https://openlineage.io/spec/facets/1-0-0/AirflowRunFacet.json",
            }

            if hasattr(task_instance, "dag_id"):
                airflow_facet["dag_id"] = task_instance.dag_id
            if hasattr(task_instance, "task_id"):
                airflow_facet["task_id"] = task_instance.task_id
            if hasattr(task_instance, "run_id"):
                airflow_facet["run_id"] = task_instance.run_id
            if hasattr(task_instance, "try_number"):
                airflow_facet["try_number"] = task_instance.try_number
            if hasattr(task_instance, "state"):
                airflow_facet["state"] = str(task_instance.state)
            if hasattr(task_instance, "operator"):
                airflow_facet["operator"] = task_instance.operator
            if hasattr(task_instance, "pool"):
                airflow_facet["pool"] = task_instance.pool
            if hasattr(task_instance, "queue"):
                airflow_facet["queue"] = task_instance.queue
            if hasattr(task_instance, "priority_weight"):
                airflow_facet["priority_weight"] = task_instance.priority_weight

            facets["airflow"] = airflow_facet

        except Exception as e:
            logger.warning(f"Error extracting task facets: {e}")

        return facets

    def extract_dag_facets(self, dag_run) -> Dict[str, Any]:
        """Extract facets from an Airflow DagRun.

        Args:
            dag_run: Airflow DagRun object

        Returns:
            Dictionary of facets
        """
        facets = {}

        try:
            # Nominal time facet
            if hasattr(dag_run, "execution_date") and dag_run.execution_date:
                facets["nominalTime"] = {
                    "_producer": self.PRODUCER,
                    "_schemaURL": f"{self.SCHEMA_URL}#/definitions/NominalTimeRunFacet",
                    "nominalStartTime": dag_run.execution_date.isoformat(),
                }

            # Airflow DAG run facet
            airflow_facet: Dict[str, Any] = {
                "_producer": self.PRODUCER,
                "_schemaURL": "https://openlineage.io/spec/facets/1-0-0/AirflowDagRunFacet.json",
            }

            if hasattr(dag_run, "dag_id"):
                airflow_facet["dag_id"] = dag_run.dag_id
            if hasattr(dag_run, "run_id"):
                airflow_facet["run_id"] = dag_run.run_id
            if hasattr(dag_run, "run_type"):
                airflow_facet["run_type"] = str(dag_run.run_type)
            if hasattr(dag_run, "state"):
                airflow_facet["state"] = str(dag_run.state)
            if hasattr(dag_run, "external_trigger"):
                airflow_facet["external_trigger"] = dag_run.external_trigger
            if hasattr(dag_run, "conf") and dag_run.conf:
                # Sanitize conf to avoid exposing secrets
                airflow_facet["conf_keys"] = (
                    list(dag_run.conf.keys()) if isinstance(dag_run.conf, dict) else []
                )

            facets["airflowDagRun"] = airflow_facet

        except Exception as e:
            logger.warning(f"Error extracting DAG facets: {e}")

        return facets

    def extract_job_facets(self, task=None, dag=None) -> Dict[str, Any]:
        """Extract job-level facets.

        Args:
            task: Optional Airflow Task/Operator
            dag: Optional Airflow DAG

        Returns:
            Dictionary of job facets
        """
        facets = {}

        try:
            if task:
                # Source code location facet
                if hasattr(task, "filepath") and task.filepath:
                    facets["sourceCodeLocation"] = {
                        "_producer": self.PRODUCER,
                        "_schemaURL": f"{self.SCHEMA_URL}#/definitions/SourceCodeLocationJobFacet",
                        "type": "file",
                        "url": task.filepath,
                    }

                # Documentation facet
                if hasattr(task, "doc_md") and task.doc_md:
                    facets["documentation"] = {
                        "_producer": self.PRODUCER,
                        "_schemaURL": f"{self.SCHEMA_URL}#/definitions/DocumentationJobFacet",
                        "description": task.doc_md,
                    }

                # SQL facet (if applicable)
                if hasattr(task, "sql") and task.sql:
                    facets["sql"] = {
                        "_producer": self.PRODUCER,
                        "_schemaURL": f"{self.SCHEMA_URL}#/definitions/SqlJobFacet",
                        "query": task.sql if isinstance(task.sql, str) else str(task.sql),
                    }

            if dag:
                # DAG-level documentation
                if hasattr(dag, "description") and dag.description:
                    facets["documentation"] = {
                        "_producer": self.PRODUCER,
                        "_schemaURL": f"{self.SCHEMA_URL}#/definitions/DocumentationJobFacet",
                        "description": dag.description,
                    }

                # Ownership facet
                if hasattr(dag, "owner") and dag.owner:
                    facets["ownership"] = {
                        "_producer": self.PRODUCER,
                        "_schemaURL": f"{self.SCHEMA_URL}#/definitions/OwnershipJobFacet",
                        "owners": [{"name": dag.owner, "type": "MAINTAINER"}],
                    }

                # Airflow DAG facet (custom)
                if hasattr(dag, "schedule_interval") and dag.schedule_interval:
                    facets["airflow_dag"] = {
                        "_producer": self.PRODUCER,
                        "_schemaURL": "https://openlineage.io/spec/facets/1-0-0/AirflowDagJobFacet.json",
                        "schedule_interval": str(dag.schedule_interval),
                    }

        except Exception as e:
            logger.warning(f"Error extracting job facets: {e}")

        return facets
