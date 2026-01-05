from granyt_sdk.integrations.airflow.operator_adapters.base import register_adapter
from granyt_sdk.integrations.airflow.operator_adapters.storage.s3 import S3Adapter
from granyt_sdk.integrations.airflow.operator_adapters.storage.gcs import GCSAdapter
from granyt_sdk.integrations.airflow.operator_adapters.storage.azure import AzureBlobAdapter

def register_storage_adapters():
    register_adapter(S3Adapter)
    register_adapter(GCSAdapter)
    register_adapter(AzureBlobAdapter)
