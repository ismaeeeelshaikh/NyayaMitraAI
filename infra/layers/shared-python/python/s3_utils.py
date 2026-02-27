"""S3 helper functions"""
import boto3
import os
import base64
from typing import Optional

s3 = boto3.client('s3', region_name='ap-south-1')

def get_presigned_url(
    bucket: str,
    key: str,
    expires_in: int = 604800,  # 7 days default
    method: str = 'get_object'
) -> str:
    """Presigned URL generate karo"""
    return s3.generate_presigned_url(
        method,
        Params={'Bucket': bucket, 'Key': key},
        ExpiresIn=expires_in
    )

def upload_bytes(bucket: str, key: str, data: bytes, content_type: str = 'application/octet-stream') -> str:
    """Bytes S3 pe upload karo, S3 URI return karo"""
    s3.put_object(Bucket=bucket, Key=key, Body=data, ContentType=content_type)
    return f's3://{bucket}/{key}'

def download_text(bucket: str, key: str, encoding: str = 'utf-8') -> Optional[str]:
    """S3 se text file padho"""
    try:
        obj = s3.get_object(Bucket=bucket, Key=key)
        return obj['Body'].read().decode(encoding)
    except Exception:
        return None

def list_keys(bucket: str, prefix: str = '') -> list:
    """Bucket mein keys list karo"""
    resp = s3.list_objects_v2(Bucket=bucket, Prefix=prefix)
    return [obj['Key'] for obj in resp.get('Contents', [])]
