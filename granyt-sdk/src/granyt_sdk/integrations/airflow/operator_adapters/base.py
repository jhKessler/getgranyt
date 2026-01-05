"""
Base classes and registry for Operator Adapters.

This module defines the core abstractions for automatic operator
detection and metadata extraction.
"""

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Type, Union
from uuid import uuid4

logger = logging.getLogger(__name__)


@dataclass
class OperatorMetrics:
    """Captured metrics from an operator execution.
    
    This class holds all the metadata extracted from an operator,
    including generic metrics and operator-specific details.
    
    Attributes:
        operator_type: The detected operator type (e.g., 'snowflake', 'bigquery')
        operator_class: The full class name of the operator
        captured_at: ISO timestamp when metrics were captured
        
        # Data metrics (when applicable)
        row_count: Number of rows processed/affected/read
        bytes_processed: Bytes processed by the operation
        bytes_read: Bytes read from source
        bytes_written: Bytes written to destination
        
        # Query metrics (for SQL operators)
        query_id: Unique query identifier from the system
        query_text: The SQL query executed (sanitized)
        query_duration_ms: Query execution time in milliseconds
        
        # Connection/resource info
        connection_id: Airflow connection ID used
        database: Database name
        schema: Schema name
        table: Table name (if single table)
        tables: List of tables (if multiple)
        warehouse: Data warehouse name (Snowflake, etc.)
        
        # File/object metrics (for storage operators)
        files_processed: Number of files processed
        source_path: Source file/object path
        destination_path: Destination file/object path
        
        # Transform metrics (for dbt, Spark, etc.)
        models_run: Number of models executed
        tests_passed: Number of tests passed
        tests_failed: Number of tests failed
        stages_completed: Number of Spark stages
        tasks_completed: Number of Spark tasks
        
        # Custom operator-specific metrics
        custom_metrics: Any additional operator-specific metrics
    """
    operator_type: str
    operator_class: str
    captured_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    capture_id: str = field(default_factory=lambda: str(uuid4()))
    
    # Data metrics
    row_count: Optional[int] = None
    bytes_processed: Optional[int] = None
    bytes_read: Optional[int] = None
    bytes_written: Optional[int] = None
    
    # Query metrics
    query_id: Optional[str] = None
    query_text: Optional[str] = None
    query_duration_ms: Optional[int] = None
    
    # Connection/resource info
    connection_id: Optional[str] = None
    database: Optional[str] = None
    schema: Optional[str] = None
    table: Optional[str] = None
    tables: Optional[List[str]] = None
    warehouse: Optional[str] = None
    region: Optional[str] = None
    
    # File/object metrics
    files_processed: Optional[int] = None
    source_path: Optional[str] = None
    destination_path: Optional[str] = None
    
    # Transform metrics
    models_run: Optional[int] = None
    tests_passed: Optional[int] = None
    tests_failed: Optional[int] = None
    stages_completed: Optional[int] = None
    tasks_completed: Optional[int] = None
    shuffle_bytes: Optional[int] = None
    
    # Lineage linkage
    dag_id: Optional[str] = None
    task_id: Optional[str] = None
    run_id: Optional[str] = None
    
    # Custom metrics
    custom_metrics: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert metrics to dictionary for serialization.
        
        The backend expects a 'metrics' field containing all metric values
        as flexible key-value pairs. Base fields (capture_id, dag_id, etc.)
        stay at the top level.
        """
        # Build the metrics object with all metric values
        metrics: Dict[str, Any] = {
            "dataframe_type": "operator",
            "operator_type": self.operator_type,
            "operator_class": self.operator_class,
        }
        
        # Map row count if available
        if self.row_count is not None:
            metrics["row_count"] = self.row_count

        # Map memory bytes if available
        if self.bytes_processed is not None:
            metrics["memory_bytes"] = self.bytes_processed
        elif self.bytes_written is not None:
            metrics["memory_bytes"] = self.bytes_written
        elif self.bytes_read is not None:
            metrics["memory_bytes"] = self.bytes_read
            
        # Add all other fields directly to metrics
        other_fields = [
            "row_count",
            "bytes_processed", "bytes_read", "bytes_written",
            "query_id", "query_text", "query_duration_ms",
            "connection_id", "database", "schema", "table", "tables",
            "warehouse", "region",
            "files_processed", "source_path", "destination_path",
            "models_run", "tests_passed", "tests_failed",
            "stages_completed", "tasks_completed", "shuffle_bytes",
        ]
        
        for field_name in other_fields:
            value = getattr(self, field_name)
            if value is not None:
                metrics[field_name] = value
                
        # Merge custom_metrics into the metrics object
        if self.custom_metrics:
            metrics.update(self.custom_metrics)
        
        # Return structure matching backend schema
        return {
            "capture_id": self.capture_id,
            "captured_at": self.captured_at,
            "dag_id": self.dag_id,
            "task_id": self.task_id,
            "run_id": self.run_id,
            "metrics": metrics,
        }
    
    def to_openlineage_facet(self) -> Dict[str, Any]:
        """Convert to OpenLineage custom facet format."""
        return {
            "_producer": "https://github.com/granyt/granyt-sdk",
            "_schemaURL": "https://granyt.io/spec/facets/1-0-0/OperatorMetricsFacet.json",
            **self.to_dict(),
        }


class  OperatorAdapter(ABC):
    """Abstract base class for operator adapters.
    
    Extend this class to add support for new operator types.
    Each adapter is responsible for:
    1. Detecting if it can handle a specific operator
    2. Extracting metrics from the operator/task instance
    
    Example:
        ```python
        class MyCustomAdapter(OperatorAdapter):
            OPERATOR_PATTERNS = ["MyCustomOperator"]
            OPERATOR_TYPE = "my_custom"
            
            def extract_metrics(self, task_instance, task) -> OperatorMetrics:
                return OperatorMetrics(
                    operator_type=self.OPERATOR_TYPE,
                    operator_class=self._get_operator_class(task_instance),
                    row_count=task.my_custom_row_count,
                )
        
        register_adapter(MyCustomAdapter)
        ```
    """
    
    # List of operator class name patterns to match (supports partial matching)
    OPERATOR_PATTERNS: List[str] = []
    
    # The normalized operator type identifier
    OPERATOR_TYPE: str = "unknown"
    
    # Priority for matching (higher = checked first, useful for specific vs generic)
    PRIORITY: int = 0
    
    @classmethod
    def can_handle(cls, operator_class_name: str) -> bool:
        """Check if this adapter can handle the given operator.
        
        Args:
            operator_class_name: The class name of the operator
            
        Returns:
            True if this adapter can handle the operator
        """
        for pattern in cls.OPERATOR_PATTERNS:
            if pattern.lower() in operator_class_name.lower():
                return True
        return False
    
    @abstractmethod
    def extract_metrics(
        self,
        task_instance: Any,
        task: Optional[Any] = None,
    ) -> OperatorMetrics:
        """Extract metrics from a task execution.
        
        Args:
            task_instance: The Airflow TaskInstance object
            task: The Airflow Task/Operator object (may be None)
            
        Returns:
            OperatorMetrics with extracted data
        """
        pass
    
    def _get_operator_class(self, task_instance: Any) -> str:
        """Get the full operator class name."""
        if hasattr(task_instance, "operator"):
            return task_instance.operator
        if hasattr(task_instance, "task") and hasattr(task_instance.task, "__class__"):
            return task_instance.task.__class__.__name__
        return "unknown"
    
    def _get_task(self, task_instance: Any) -> Optional[Any]:
        """Get the task object from a task instance."""
        return getattr(task_instance, "task", None)
    
    def _get_connection_id(self, task: Any) -> Optional[str]:
        """Extract connection ID from various operator attributes."""
        # Different operators use different attribute names
        conn_attrs = [
            "conn_id",
            "connection_id", 
            "snowflake_conn_id",
            "gcp_conn_id",
            "postgres_conn_id",
            "mysql_conn_id",
            "redshift_conn_id",
            "aws_conn_id",
            "azure_conn_id",
        ]
        
        for attr in conn_attrs:
            if hasattr(task, attr):
                value = getattr(task, attr)
                if value:
                    return value
        
        return None
    
    def _get_sql_query(self, task: Any) -> Optional[str]:
        """Extract SQL query from operator."""
        if hasattr(task, "sql"):
            sql = task.sql
            if isinstance(sql, str):
                return sql
            if isinstance(sql, (list, tuple)):
                return "; ".join(str(s) for s in sql)
        return None
    
    def _sanitize_query(self, query: str, max_length: int = 10000) -> str:
        """Sanitize and truncate a query for storage."""
        if len(query) > max_length:
            return query[:max_length] + "... [truncated]"
        return query
    
    def _extract_xcom_value(
        self,
        task_instance: Any,
        key: str = "return_value",
    ) -> Optional[Any]:
        """Try to extract a value from XCom.
        
        Note: This requires database access and may not always work.
        """
        try:
            if hasattr(task_instance, "xcom_pull"):
                return task_instance.xcom_pull(key=key)
        except Exception as e:
            logger.debug(f"Could not pull XCom value '{key}': {e}")
        return None


# Global adapter registry
ADAPTER_REGISTRY: Dict[str, Type[OperatorAdapter]] = {}


def register_adapter(adapter_class: Type[OperatorAdapter]) -> None:
    """Register an operator adapter.
    
    Args:
        adapter_class: The adapter class to register
    """
    ADAPTER_REGISTRY[adapter_class.OPERATOR_TYPE] = adapter_class
    logger.debug(f"Registered operator adapter: {adapter_class.OPERATOR_TYPE}")


def get_adapter_for_task(
    task_instance: Any,
    task: Optional[Any] = None,
) -> Optional[OperatorAdapter]:
    """Get the appropriate adapter for a task.
    
    This function inspects the task instance and returns an adapter
    that can extract metrics from it.
    
    Args:
        task_instance: The Airflow TaskInstance object
        task: The Airflow Task/Operator object (optional)
        
    Returns:
        An adapter instance, or None if no adapter matches
    """
    # Get operator class name
    operator_class = None
    
    if hasattr(task_instance, "operator"):
        operator_class = task_instance.operator
    elif task and hasattr(task, "__class__"):
        operator_class = task.__class__.__name__
    
    if not operator_class:
        logger.debug("Could not determine operator class")
        return None
    
    logger.debug(f"Looking for adapter for operator: {operator_class}")
    
    # Sort adapters by priority (highest first)
    sorted_adapters = sorted(
        ADAPTER_REGISTRY.values(),
        key=lambda a: a.PRIORITY,
        reverse=True,
    )
    
    # Find matching adapter
    for adapter_class in sorted_adapters:
        if adapter_class.can_handle(operator_class):
            logger.debug(f"Found adapter: {adapter_class.OPERATOR_TYPE}")
            return adapter_class()
    
    logger.debug(f"No adapter found for operator: {operator_class}")
    return None


def extract_operator_metrics(
    task_instance: Any,
    task: Optional[Any] = None,
) -> Optional[OperatorMetrics]:
    """Convenience function to extract metrics from a task.
    
    Args:
        task_instance: The Airflow TaskInstance object
        task: The Airflow Task/Operator object (optional)
        
    Returns:
        OperatorMetrics if extraction succeeded, None otherwise
    """
    if task is None:
        task = getattr(task_instance, "task", None)
    
    adapter = get_adapter_for_task(task_instance, task)
    
    if adapter is None:
        return None
    
    try:
        metrics = adapter.extract_metrics(task_instance, task)
        
        # Add lineage linkage
        if hasattr(task_instance, "dag_id"):
            metrics.dag_id = task_instance.dag_id
        if hasattr(task_instance, "task_id"):
            metrics.task_id = task_instance.task_id
        if hasattr(task_instance, "run_id"):
            metrics.run_id = task_instance.run_id
        
        return metrics
    except Exception as e:
        logger.warning(f"Failed to extract operator metrics: {e}")
        return None
