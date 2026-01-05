"""
Spark adapter for Granyt SDK metrics.
"""

import os
import logging
from typing import Any, Dict, List
from granyt_sdk.features.metrics.core import DataFrameAdapter

logger = logging.getLogger(__name__)


class SparkAdapter(DataFrameAdapter):
    """Adapter for PySpark DataFrames."""
    
    @classmethod
    def can_handle(cls, df: Any) -> bool:
        """Check if this is a Spark DataFrame."""
        try:
            from pyspark.sql import DataFrame
            return isinstance(df, DataFrame)
        except ImportError:
            return False
    
    @classmethod
    def get_type_name(cls) -> str:
        return "spark"
    
    @classmethod
    def prepare(cls, df: Any, should_compute: bool) -> Any:
        """Prepare the Spark DataFrame using the Observation API."""
        if not should_compute:
            return df
            
        try:
            from pyspark.sql import Observation
            from pyspark.sql import functions as F
            from pyspark import StorageLevel
        except ImportError:
            logger.debug("PySpark not available or version too old for Observation API")
            return df
            
        # Cache to ensure the user's subsequent pipeline uses the work we do here
        if df.storageLevel == StorageLevel.NONE:
            df.cache()
            
        # Build expressions for all stats in one pass
        exprs = []
        for field in df.schema.fields:
            col_name = field.name
            dtype = field.dataType.simpleString()
            
            # Null count for all columns
            exprs.append(F.sum(F.col(col_name).isNull().cast("int")).alias(f"null_{col_name}"))
            
            # Empty string count for string columns
            if "string" in dtype.lower():
                exprs.append(F.sum((F.col(col_name) == "").cast("int")).alias(f"empty_{col_name}"))
        
        if not exprs:
            return df
            
        # Create observation and attach it to a new DataFrame
        obs = Observation(f"granyt_stats_{os.getpid()}")
        observed_df = df.observe(obs, *exprs)
        
        # Store the observation on the DF so we can retrieve it in subsequent adapter calls
        observed_df._granyt_observation = obs
        return observed_df

    @classmethod
    def get_columns_with_dtypes(cls, df: Any) -> List[tuple]:
        return [(str(f.name), str(f.dataType.simpleString())) for f in df.schema.fields]
    
    @classmethod
    def get_row_count(cls, df: Any) -> int:
        # This will trigger the observation if it's an observed DF from prepare()
        return df.count()
    
    @classmethod
    def get_null_counts(cls, df: Any) -> Dict[str, int]:
        if not hasattr(df, "_granyt_observation"):
            return {}
        
        # This blocks until the action (df.count()) is finished
        stats = df._granyt_observation.get
        return {col: stats.get(f"null_{col}", 0) for col, _ in cls.get_columns_with_dtypes(df)}
    
    @classmethod
    def get_empty_string_counts(cls, df: Any) -> Dict[str, int]:
        if not hasattr(df, "_granyt_observation"):
            return {}
            
        stats = df._granyt_observation.get
        result = {}
        for col, dtype in cls.get_columns_with_dtypes(df):
            if "string" in dtype.lower():
                result[col] = stats.get(f"empty_{col}", 0)
            else:
                result[col] = 0
        return result
