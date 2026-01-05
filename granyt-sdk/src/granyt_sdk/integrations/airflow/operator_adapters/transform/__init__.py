from granyt_sdk.integrations.airflow.operator_adapters.base import register_adapter
from granyt_sdk.integrations.airflow.operator_adapters.transform.bash import BashAdapter
from granyt_sdk.integrations.airflow.operator_adapters.transform.dbt import DbtAdapter
from granyt_sdk.integrations.airflow.operator_adapters.transform.email import EmailAdapter
from granyt_sdk.integrations.airflow.operator_adapters.transform.http import HttpAdapter
from granyt_sdk.integrations.airflow.operator_adapters.transform.python import PythonAdapter
from granyt_sdk.integrations.airflow.operator_adapters.transform.spark import SparkAdapter


def register_transform_adapters():
    register_adapter(DbtAdapter)
    register_adapter(SparkAdapter)
    register_adapter(PythonAdapter)
    register_adapter(BashAdapter)
    register_adapter(EmailAdapter)
    register_adapter(HttpAdapter)
