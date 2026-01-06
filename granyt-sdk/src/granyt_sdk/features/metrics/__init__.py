"""
Data Metrics feature for Granyt SDK.
"""

from granyt_sdk.features.metrics.core import (
    DF_SCHEMA_KEY,
    GRANYT_KEY,
    METRICS_KEYS,
    SCHEMA_KEYS,
    ColumnMetrics,
    DataFrameAdapter,
    DataFrameMetrics,
    compute_df_metrics,
    register_adapter,
    validate_df_schema,
)

# Register default adapters
try:
    from granyt_sdk.features.metrics.adapters.pandas import PandasAdapter

    register_adapter(PandasAdapter)
except ImportError:
    pass

try:
    from granyt_sdk.features.metrics.adapters.polars import PolarsAdapter

    register_adapter(PolarsAdapter)
except ImportError:
    pass

try:
    from granyt_sdk.features.metrics.adapters.spark import SparkAdapter

    register_adapter(SparkAdapter)
except ImportError:
    pass

__all__ = [
    "DataFrameMetrics",
    "ColumnMetrics",
    "DataFrameAdapter",
    "register_adapter",
    "compute_df_metrics",
    "validate_df_schema",
    "GRANYT_KEY",
    "DF_SCHEMA_KEY",
    "SCHEMA_KEYS",
    "METRICS_KEYS",
]
