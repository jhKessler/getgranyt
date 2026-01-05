"""
DataFrame adapters for Granyt SDK metrics.
"""

from granyt_sdk.features.metrics.core import register_adapter
from granyt_sdk.features.metrics.adapters.pandas import PandasAdapter
from granyt_sdk.features.metrics.adapters.polars import PolarsAdapter
from granyt_sdk.features.metrics.adapters.spark import SparkAdapter

def register_default_adapters():
    """Register all built-in DataFrame adapters."""
    register_adapter(SparkAdapter)
    register_adapter(PandasAdapter)
    register_adapter(PolarsAdapter)
