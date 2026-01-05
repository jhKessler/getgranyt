"""
Polars adapter for Granyt SDK metrics.
"""

from typing import Any, Dict, List, Optional

from granyt_sdk.features.metrics.core import DataFrameAdapter


class PolarsAdapter(DataFrameAdapter):
    """Adapter for Polars DataFrames."""

    @classmethod
    def can_handle(cls, df: Any) -> bool:
        """Check if this is a Polars DataFrame."""
        try:
            import polars as pl

            return isinstance(df, (pl.DataFrame, pl.LazyFrame))
        except ImportError:
            return False

    @classmethod
    def get_type_name(cls) -> str:
        return "polars"

    @classmethod
    def get_columns_with_dtypes(cls, df: Any) -> List[tuple]:
        import polars as pl

        # Handle LazyFrame by getting schema
        if isinstance(df, pl.LazyFrame):
            schema = df.collect_schema()
            return [(str(name), str(dtype)) for name, dtype in schema.items()]
        return [(str(col), str(dtype)) for col, dtype in zip(df.columns, df.dtypes)]

    @classmethod
    def get_row_count(cls, df: Any) -> int:
        import polars as pl

        if isinstance(df, pl.LazyFrame):
            # For LazyFrame, we need to collect to get row count
            return int(df.select(pl.len()).collect().item())
        return len(df)

    @classmethod
    def get_null_counts(cls, df: Any) -> Dict[str, int]:
        import polars as pl

        if isinstance(df, pl.LazyFrame):
            df = df.collect()
        return {str(col): int(df[col].null_count()) for col in df.columns}

    @classmethod
    def get_empty_string_counts(cls, df: Any) -> Dict[str, int]:
        import polars as pl

        if isinstance(df, pl.LazyFrame):
            df = df.collect()
        result = {}
        for col in df.columns:
            if df[col].dtype == pl.Utf8 or df[col].dtype == pl.String:
                result[str(col)] = int((df[col] == "").sum())
            else:
                result[str(col)] = 0
        return result

    @classmethod
    def get_memory_bytes(cls, df: Any) -> Optional[int]:
        import polars as pl

        if isinstance(df, pl.LazyFrame):
            df = df.collect()
        return int(df.estimated_size())
