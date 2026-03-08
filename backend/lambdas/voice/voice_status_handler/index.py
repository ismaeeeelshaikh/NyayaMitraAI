"""
Voice Status Handler
HTTP API: GET /v1/voice/status?job_name=xyz

Kya karta hai:
1. Transcribe job status fetch karta hai
2. Completed hone par transcript text return karta hai
3. Failed hone par failure reason return karta hai
"""
import boto3
import json
import urllib.request
import os

s3 = boto3.client('s3', region_name='ap-south-1')
UPLOADS_BUCKET = os.environ.get('USER_UPLOADS_BUCKET', 'nyaya-mitra-user-uploads-804078307105')

def _parse_job_name(event: dict) -> str:
    params = event.get('queryStringParameters') or {}
    if params.get('job_name'):
        return params['job_name']

    try:
        body = json.loads(event.get('body', '{}'))
        return body.get('job_name', '')
    except Exception:
        return ''


def _load_transcript_from_s3(job_name: str) -> str:
    try:
        obj = s3.get_object(Bucket=UPLOADS_BUCKET, Key=f"transcripts/{job_name}.json")
        data = json.loads(obj['Body'].read().decode('utf-8'))
        transcripts = data.get('results', {}).get('transcripts', [])
        if transcripts:
            return transcripts[0].get('transcript', '').strip()
    except Exception as e:
        print(f"S3 fetch error: {e}")
    return ''

transcribe = boto3.client('transcribe', region_name='ap-south-1')
CORS = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}

def handler(event, context):
    job_name = _parse_job_name(event)
    if not job_name:
        return {
            'statusCode': 400,
            'headers': CORS,
            'body': json.dumps({'error': 'job_name is required'})
        }

    try:
        resp = transcribe.get_transcription_job(TranscriptionJobName=job_name)
        job = resp.get('TranscriptionJob', {})
        status = job.get('TranscriptionJobStatus', 'FAILED')
    except Exception as exc:
        return {
            'statusCode': 500,
            'headers': CORS,
            'body': json.dumps({'error': f'Could not fetch transcription job: {exc}'})
        }

    if status in ('QUEUED', 'IN_PROGRESS'):
        return {
            'statusCode': 202,
            'headers': CORS,
            'body': json.dumps({'status': 'processing', 'job_name': job_name})
        }

    if status == 'FAILED':
        return {
            'statusCode': 200,
            'headers': CORS,
            'body': json.dumps({
                'status': 'failed',
                'job_name': job_name,
                'reason': job.get('FailureReason', 'Transcription failed')
            })
        }

    transcript = _load_transcript_from_s3(job_name)
    if not transcript:
        return {
            'statusCode': 500,
            'headers': CORS,
            'body': json.dumps({'error': f'Could not read transcript from S3 for job {job_name}'})
        }

    return {
        'statusCode': 200,
        'headers': CORS,
        'body': json.dumps({
            'status': 'completed',
            'job_name': job_name,
            'transcript': transcript
        })
    }
