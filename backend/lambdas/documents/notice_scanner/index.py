"""
Notice Scanner — Upload Handler
HTTP API: POST /v1/notices/upload
HTTP API: GET /v1/notices/{notice_id}/analysis

Kya karta hai:
1. Base64 file receive karta hai (PDF ya image)
2. S3 pe upload karta hai
3. notice_analysis Lambda ko async trigger karta hai
4. notice_id return karta hai (frontend isko poll karega)
"""
import boto3
import base64
import json
import os
import uuid
from datetime import datetime, timezone
from decimal import Decimal

s3       = boto3.client('s3', region_name='ap-south-1')
lmb      = boto3.client('lambda', region_name='ap-south-1')
dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')

TABLE_PREFIX    = os.environ.get('TABLE_PREFIX', 'nyaya-mitra')
UPLOADS_BUCKET  = os.environ.get('USER_UPLOADS_BUCKET', '')

CORS = {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}

def get_notice_status(event, context):
    """GET /v1/notices/{notice_id}/analysis"""
    notice_id = event.get('pathParameters', {}).get('notice_id', '')
    if not notice_id:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'notice_id required'})}

    item = dynamodb.Table(f'{TABLE_PREFIX}-scanned-notices').get_item(
        Key={'notice_id': notice_id}
    ).get('Item')

    if not item:
        return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Notice not found'})}

    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(item, default=str)}

def handler(event, context):
    # GET request → status check
    if event.get('requestContext', {}).get('http', {}).get('method') == 'GET':
        return get_notice_status(event, context)

    # POST request → upload
    try:
        body      = json.loads(event.get('body', '{}'))
        file_data = body.get('file_data', '')    # Base64 encoded
        file_name = body.get('file_name', 'notice.pdf')
        file_type = body.get('file_type', 'application/pdf')
        user_id   = body.get('user_id', 'unknown')
    except Exception:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Invalid request'})}

    if not file_data:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'No file data provided'})}

    # Validate file size (max 5MB)
    try:
        file_bytes = base64.b64decode(file_data)
    except Exception:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Invalid base64 data'})}

    if len(file_bytes) > 5 * 1024 * 1024:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'File too large (max 5MB)'})}

    notice_id = str(uuid.uuid4())
    s3_key    = f"notices/{user_id}/{notice_id}_{file_name}"
    now       = datetime.now(timezone.utc)

    # S3 upload
    try:
        s3.put_object(
            Bucket=UPLOADS_BUCKET,
            Key=s3_key,
            Body=file_bytes,
            ContentType=file_type
        )
    except Exception as e:
        return {'statusCode': 500, 'headers': CORS, 'body': json.dumps({'error': f'Upload failed: {e}'})}

    # DynamoDB initial record
    dynamodb.Table(f'{TABLE_PREFIX}-scanned-notices').put_item(Item={
        'notice_id':          notice_id,
        'user_id':            user_id,
        'file_name':          file_name,
        'upload_timestamp':   now.isoformat(),
        's3_document_url':    f's3://{UPLOADS_BUCKET}/{s3_key}',
        'processing_status':  'processing',
        'status':             'pending_analysis',
        'file_size_kb':       Decimal(str(round(len(file_bytes) / 1024, 1)))
    })

    # Async analysis trigger
    lmb.invoke(
        FunctionName='nyaya-mitra-notice-analysis',
        InvocationType='Event',
        Payload=json.dumps({
            'notice_id': notice_id,
            'user_id':   user_id,
            's3_bucket': UPLOADS_BUCKET,
            's3_key':    s3_key,
            'file_type': file_type
        })
    )

    return {
        'statusCode': 202,
        'headers': CORS,
        'body': json.dumps({
            'notice_id':         notice_id,
            'processing_status': 'processing',
            'poll_after_ms':     3000,
            'poll_url':          f'/v1/notices/{notice_id}/analysis',
            'message':           'Document uploaded. Analysis will be ready in 30-60 seconds.'
        })
    }
