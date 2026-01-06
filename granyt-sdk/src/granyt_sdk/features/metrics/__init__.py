"""
Data Metrics feature for Granyt SDK.
"""

from granyt_sdk.features.metrics.core import (
    ColumnMetrics,
    DataFrameAdapter,
    DataFrameMetrics,
    compute_df_metrics,
    register_adapter,
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
]
