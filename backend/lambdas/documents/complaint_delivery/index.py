"""
Complaint Delivery
HTTP API: POST /v1/complaints/deliver

3 delivery methods:
  download → Presigned URL return karo (already hai)
  email    → SES se PDF attach karke bhejo
  sms      → SNS se link bhejo
"""
import boto3
import json
import os
import email.mime.multipart
import email.mime.text
import email.mime.application
from datetime import datetime, timezone

ses      = boto3.client('ses', region_name='ap-south-1')
sns      = boto3.client('sns', region_name='ap-south-1')
s3       = boto3.client('s3', region_name='ap-south-1')
dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')

TABLE_PREFIX = os.environ.get('TABLE_PREFIX', 'nyaya-mitra')
DOCS_BUCKET  = os.environ.get('USER_DOCUMENTS_BUCKET', '')
SES_SENDER   = os.environ.get('SES_SENDER_EMAIL', 'noreply@nyayamitra.in')

CORS = {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}

def handler(event, context):
    try:
        body = json.loads(event.get('body', '{}'))
    except Exception:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Invalid request'})}

    complaint_id     = body.get('complaint_id', '')
    delivery_method  = body.get('delivery_method', 'download')
    user_email       = body.get('user_email', '')
    user_phone       = body.get('user_phone', '')

    # Complaint fetch karo
    item = dynamodb.Table(f'{TABLE_PREFIX}-complaints').get_item(
        Key={'complaint_id': complaint_id}
    ).get('Item')

    if not item:
        return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Complaint not found'})}

    tracking  = item['tracking_number']
    s3_key    = item['pdf_s3_url'].replace(f's3://{DOCS_BUCKET}/', '')
    now       = datetime.now(timezone.utc)
    result    = {}

    # ── Method 1: Download ──
    if delivery_method == 'download':
        url = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': DOCS_BUCKET, 'Key': s3_key},
            ExpiresIn=3600
        )
        result = {'status': 'success', 'download_url': url, 'expires_in': '1 hour'}

    # ── Method 2: Email ──
    elif delivery_method == 'email' and user_email:
        try:
            pdf_bytes = s3.get_object(Bucket=DOCS_BUCKET, Key=s3_key)['Body'].read()

            msg = email.mime.multipart.MIMEMultipart()
            msg['Subject'] = f"Your Legal Document — Tracking: {tracking}"
            msg['From']    = SES_SENDER
            msg['To']      = user_email

            body_text = (
                f"Dear User,\n\n"
                f"Please find your legal document attached.\n\n"
                f"Tracking Number: {tracking}\n"
                f"Generated: {now.strftime('%d %B %Y')}\n\n"
                f"IMPORTANT: This document is AI-generated. "
                f"Please review with a qualified lawyer before submission.\n\n"
                f"— Nyaya Mitra Team\n"
                f"Helpline: 15100"
            )
            msg.attach(email.mime.text.MIMEText(body_text))

            att = email.mime.application.MIMEApplication(pdf_bytes)
            att.add_header('Content-Disposition', 'attachment', filename=f"complaint_{tracking}.pdf")
            msg.attach(att)

            ses.send_raw_email(
                Source=SES_SENDER,
                Destinations=[user_email],
                RawMessage={'Data': msg.as_string()}
            )
            result = {'status': 'success', 'sent_to': user_email}
        except Exception as e:
            result = {'status': 'failed', 'error': str(e)}

    # ── Method 3: SMS ──
    elif delivery_method == 'sms' and user_phone:
        try:
            url = s3.generate_presigned_url(
                'get_object',
                Params={'Bucket': DOCS_BUCKET, 'Key': s3_key},
                ExpiresIn=86400
            )
            sms_msg = (
                f"Nyaya Mitra: Aapka {item.get('complaint_type','complaint')} tayaar hai!\n"
                f"Tracking: {tracking}\n"
                f"Download (24hr): {url[:100]}..."
            )
            sns.publish(PhoneNumber=f"+91{user_phone.lstrip('0+')}", Message=sms_msg)
            result = {'status': 'success', 'sent_to': f"***{user_phone[-4:]}"}
        except Exception as e:
            result = {'status': 'failed', 'error': str(e)}
    else:
        result = {'status': 'failed', 'error': 'Invalid delivery method or missing contact info'}

    # Status update karo
    if result.get('status') == 'success':
        dynamodb.Table(f'{TABLE_PREFIX}-complaints').update_item(
            Key={'complaint_id': complaint_id},
            UpdateExpression='SET #st = :st, delivery_method = :dm, delivery_at = :ts',
            ExpressionAttributeNames={'#st': 'status'},
            ExpressionAttributeValues={
                ':st': 'delivered',
                ':dm': delivery_method,
                ':ts': now.isoformat()
            }
        )

    return {
        'statusCode': 200,
        'headers': CORS,
        'body': json.dumps({**result, 'tracking_number': tracking, 'timestamp': now.isoformat()})
    }
