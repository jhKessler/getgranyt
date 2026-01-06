from granyt_sdk.integrations.airflow.operator_adapters.base import register_adapter
from granyt_sdk.integrations.airflow.operator_adapters.sql.bigquery import BigQueryAdapter
from granyt_sdk.integrations.airflow.operator_adapters.sql.generic import GenericSQLAdapter
from granyt_sdk.integrations.airflow.operator_adapters.sql.mysql import MySQLAdapter
from granyt_sdk.integrations.airflow.operator_adapters.sql.postgres import PostgresAdapter
from granyt_sdk.integrations.airflow.operator_adapters.sql.redshift import RedshiftAdapter
from granyt_sdk.integrations.airflow.operator_adapters.sql.snowflake import SnowflakeAdapter


def register_sql_adapters():
    register_adapter(SnowflakeAdapter)
    register_adapter(BigQueryAdapter)
    register_adapter(PostgresAdapter)
    register_adapter(MySQLAdapter)
    register_adapter(RedshiftAdapter)
    register_adapter(GenericSQLAdapter)
