"""
DataFrame adapters for Granyt SDK metrics.
"""

from granyt_sdk.features.metrics.adapters.pandas import PandasAdapter
from granyt_sdk.features.metrics.adapters.polars import PolarsAdapter
from granyt_sdk.features.metrics.core import register_adapter


def register_default_adapters():
    """Register all built-in DataFrame adapters."""
    register_adapter(PandasAdapter)
    register_adapter(PolarsAdapter)
