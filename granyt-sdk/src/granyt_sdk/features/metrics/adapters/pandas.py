"""
Pandas adapter for Granyt SDK metrics.
"""

from typing import Any, Dict, List, Optional
from granyt_sdk.features.metrics.core import DataFrameAdapter


class PandasAdapter(DataFrameAdapter):
    """Adapter for Pandas DataFrames."""
    
    @classmethod
    def can_handle(cls, df: Any) -> bool:
        """Check if this is a Pandas DataFrame."""
        try:
            import pandas as pd
            return isinstance(df, pd.DataFrame)
        except ImportError:
            return False
    
    @classmethod
    def get_type_name(cls) -> str:
        return "pandas"
    
    @classmethod
    def get_columns_with_dtypes(cls, df: Any) -> List[tuple]:
        return [(str(col), str(dtype)) for col, dtype in zip(df.columns, df.dtypes)]
    
    @classmethod
    def get_row_count(cls, df: Any) -> int:
        return len(df)
    
    @classmethod
    def get_null_counts(cls, df: Any) -> Dict[str, int]:
        return df.isnull().sum().to_dict()
    
    @classmethod
    def get_empty_string_counts(cls, df: Any) -> Dict[str, int]:
        result = {}
        for col in df.columns:
            if df[col].dtype == "object":
                result[str(col)] = int((df[col] == "").sum())
            else:
                result[str(col)] = 0
        return result
    
    @classmethod
    def get_memory_bytes(cls, df: Any) -> Optional[int]:
        return int(df.memory_usage(deep=True).sum())
