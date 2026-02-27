"""
Voice Input Handler
1. Frontend audio (base64 webm) receive karta hai
2. S3 pe upload karta hai
3. AWS Transcribe job start karta hai
4. Job name return karta hai (frontend poll karega)

Note: Transcribe async hai — turant transcript nahi milta.
Frontend 2-3 seconds baad /voice/status?job_name=X pe check karega.
"""
import boto3
import base64
import json
import os
import uuid
from datetime import datetime, timezone

transcribe = boto3.client('transcribe', region_name='ap-south-1')
s3         = boto3.client('s3', region_name='ap-south-1')

UPLOADS_BUCKET = os.environ.get('USER_UPLOADS_BUCKET', '')

CORS = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}

def handler(event, context):
    try:
        body       = json.loads(event.get('body', '{}'))
        audio_b64  = body.get('audio_data', '')
        language   = body.get('language', 'en')
        session_id = body.get('session_id', 'unknown')
    except Exception:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Invalid request'})}

    if not audio_b64:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'No audio data'})}

    # Base64 decode + S3 upload
    audio_bytes = base64.b64decode(audio_b64)
    audio_key   = f"voice/{session_id}/{uuid.uuid4()}.webm"

    try:
        s3.put_object(
            Bucket=UPLOADS_BUCKET,
            Key=audio_key,
            Body=audio_bytes,
            ContentType='audio/webm'
        )
    except Exception as e:
        return {'statusCode': 500, 'headers': CORS, 'body': json.dumps({'error': f'Upload failed: {e}'})}

    # Transcribe job start karo
    lang_code = 'hi-IN' if language == 'hi' else 'en-IN'
    job_name  = f"nyaya-{uuid.uuid4().hex[:12]}"

    try:
        transcribe.start_transcription_job(
            TranscriptionJobName=job_name,
            Media={'MediaFileUri': f's3://{UPLOADS_BUCKET}/{audio_key}'},
            MediaFormat='webm',
            LanguageCode=lang_code,
            OutputBucketName=UPLOADS_BUCKET,
            OutputKey=f'transcripts/{job_name}.json',
            Settings={
                'ShowSpeakerLabels': False,
                'ChannelIdentification': False
            }
        )
    except Exception as e:
        return {'statusCode': 500, 'headers': CORS, 'body': json.dumps({'error': f'Transcribe start failed: {e}'})}

    return {
        'statusCode': 202,
        'headers': CORS,
        'body': json.dumps({
            'job_name': job_name,
            'status': 'processing',
            'poll_after_ms': 2500,   # Frontend 2.5 seconds baad check kare
            'message': 'Audio uploaded. Transcribing...'
        })
    }
