"""
Timeline PDF Generator
HTTP API: POST /v1/timeline/export

Kya karta hai:
1. timeline_id se DynamoDB se data fetch karta hai
2. pdf_generator.py se PDF banata hai
3. S3 pe upload karta hai
4. 7-day presigned URL return karta hai

NOTE: pdf-layer (ReportLab) attach hona chahiye is Lambda mein
"""
import boto3
import json
import os
import sys

# PDF layer se import karo
sys.path.insert(0, '/opt/python')
from pdf_generator import generate_timeline_pdf

dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
s3       = boto3.client('s3', region_name='ap-south-1')

TABLE_PREFIX  = os.environ.get('TABLE_PREFIX', 'nyaya-mitra')
DOCS_BUCKET   = os.environ.get('USER_DOCUMENTS_BUCKET', '')

CORS = {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}

def handler(event, context):
    try:
        body = json.loads(event.get('body', '{}'))
    except Exception:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Invalid request'})}

    timeline_id      = body.get('timeline_id', '')
    complainant_name = body.get('complainant_name', '')

    if not timeline_id:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'timeline_id required'})}

    # DynamoDB se fetch karo
    item = dynamodb.Table(f'{TABLE_PREFIX}-timelines').get_item(
        Key={'timeline_id': timeline_id}
    ).get('Item')

    if not item:
        return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Timeline not found'})}

    # PDF generate karo
    try:
        import json as json_mod
        pdf_data = {
            'timeline_id':     timeline_id,
            'issue_type':      item.get('issue_type', 'general'),
            'timeline':        json_mod.loads(item.get('extracted_timeline', '[]')),
            'gaps':            item.get('gaps_identified', []),
            'complainant_name': complainant_name or ''
        }
        pdf_bytes = generate_timeline_pdf(pdf_data)
    except Exception as e:
        return {'statusCode': 500, 'headers': CORS, 'body': json.dumps({'error': f'PDF generation failed: {e}'})}

    # S3 pe upload karo
    user_id = item.get('user_id', 'unknown')
    s3_key  = f"timelines/{user_id}/timeline_{timeline_id}.pdf"

    try:
        s3.put_object(
            Bucket=DOCS_BUCKET,
            Key=s3_key,
            Body=pdf_bytes,
            ContentType='application/pdf',
            ContentDisposition=f'attachment; filename="timeline_{timeline_id[:8]}.pdf"'
        )
    except Exception as e:
        return {'statusCode': 500, 'headers': CORS, 'body': json.dumps({'error': f'S3 upload failed: {e}'})}

    # Presigned URL generate karo (7 days)
    presigned_url = s3.generate_presigned_url(
        'get_object',
        Params={'Bucket': DOCS_BUCKET, 'Key': s3_key},
        ExpiresIn=604800
    )

    # DynamoDB update karo
    dynamodb.Table(f'{TABLE_PREFIX}-timelines').update_item(
        Key={'timeline_id': timeline_id},
        UpdateExpression='SET pdf_s3_url = :s3, pdf_presigned_url = :url, #st = :st',
        ExpressionAttributeNames={'#st': 'status'},
        ExpressionAttributeValues={
            ':s3':  f's3://{DOCS_BUCKET}/{s3_key}',
            ':url': presigned_url,
            ':st':  'finalized'
        }
    )

    return {
        'statusCode': 200,
        'headers': CORS,
        'body': json.dumps({
            'download_url':  presigned_url,
            'expires_in':    '7 days',
            'file_size_kb':  round(len(pdf_bytes) / 1024, 1),
            'events_count':  len(pdf_data['timeline'])
        })
    }
