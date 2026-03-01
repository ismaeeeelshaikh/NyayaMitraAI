"""
Timeline Builder
HTTP API: POST /v1/timeline/extract

Kya karta hai:
1. User ki narrative text receive karta hai (chat mein jo bola)
2. Bedrock se chronological events extract karta hai
3. Legal significance identify karta hai
4. Information gaps note karta hai
5. DynamoDB mein save karta hai

Cost: ~$0.01-0.03 per call (800 tokens output)
"""
import boto3
import json
import os
import uuid
from datetime import datetime, timezone

bedrock  = boto3.client('bedrock-runtime', region_name='ap-south-1')
dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')

MODEL_ID     = os.environ.get('BEDROCK_MODEL_ID', 'apac.amazon.nova-pro-v1:0')
if "claude" in MODEL_ID.lower():
    MODEL_ID = 'apac.amazon.nova-pro-v1:0'
TABLE_PREFIX = os.environ.get('TABLE_PREFIX', 'nyaya-mitra')
MAX_TOKENS   = int(os.environ.get('MAX_TOKENS_TIMELINE', '800'))

CORS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type'
}

TIMELINE_PROMPT = """You are a legal document analyzer for Indian law cases.
Extract a chronological legal timeline from the narrative below.

Return ONLY valid JSON (no markdown, no extra text):
{{
  "timeline": [
    {{
      "date": "YYYY-MM-DD or estimated like '2024-01 (approx)' or 'Unknown'",
      "event": "Clear description of what happened (max 50 words)",
      "legal_significance": "Why this matters legally (1 sentence, max 30 words)",
      "category": "incident|action|response|deadline|evidence"
    }}
  ],
  "gaps": [
    "Missing information that would strengthen the legal case"
  ],
  "legal_issue_type": "property_dispute|domestic_violence|consumer_fraud|criminal_assault|labor_dispute|cyber_crime|other",
  "summary": "2 sentence summary of the entire legal situation"
}}

Rules:
- Sort events chronologically (oldest first)
- Include ALL mentioned dates/times as events
- Maximum 15 events
- Use "Unknown" for dates not mentioned, but still include the event
- gaps: List 2-5 specific documents or evidence that would help

Narrative:
{narrative}"""

def handler(event, context):
    try:
        body = json.loads(event.get('body', '{}'))
    except Exception:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Invalid JSON'})}

    narrative  = body.get('text', body.get('narrative_text', '')).strip()
    session_id = body.get('session_id', '')
    user_id    = body.get('user_id', 'unknown')

    if len(narrative) < 30:
        return {
            'statusCode': 400,
            'headers': CORS,
            'body': json.dumps({'error': 'Please provide more details about your situation (at least 30 characters)'})
        }

    # Bedrock call karo (Amazon Nova generic format)
    try:
        resp = bedrock.invoke_model(
            modelId=MODEL_ID,
            body=json.dumps({
                "messages": [{"role": "user", "content": [{"text": TIMELINE_PROMPT.format(narrative=narrative[:4000])}]}],
                "inferenceConfig": {
                    "max_new_tokens": MAX_TOKENS,
                    "temperature": 0.1
                }
            })
        )
        raw = json.loads(resp['body'].read())['output']['message']['content'][0]['text']
        raw = raw.replace('```json', '').replace('```', '').strip()
        extracted = json.loads(raw)
    except json.JSONDecodeError as e:
        return {
            'statusCode': 500,
            'headers': CORS,
            'body': json.dumps({'error': 'Could not extract timeline. Please rephrase with more specific dates and events.'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': CORS,
            'body': json.dumps({'error': f'AI service error: {str(e)}'})
        }

    timeline_id = str(uuid.uuid4())
    now         = datetime.now(timezone.utc)

    # DynamoDB mein save karo
    dynamodb.Table(f'{TABLE_PREFIX}-timelines').put_item(Item={
        'timeline_id':       timeline_id,
        'user_id':           user_id,
        'session_id':        session_id,
        'narrative_text':    narrative[:3000],
        'extracted_timeline':json.dumps(extracted.get('timeline', [])),
        'gaps_identified':   extracted.get('gaps', []),
        'issue_type':        extracted.get('legal_issue_type', 'other'),
        'summary':           extracted.get('summary', ''),
        'created_at':        now.isoformat(),
        'status':            'draft',
        'pdf_s3_url':        None,
        'pdf_presigned_url': None
    })

    return {
        'statusCode': 200,
        'headers': CORS,
        'body': json.dumps({
            'timeline_id': timeline_id,
            'timeline':    extracted.get('timeline', []),
            'gaps':        extracted.get('gaps', []),
            'issue_type':  extracted.get('legal_issue_type', 'other'),
            'summary':     extracted.get('summary', ''),
            'events_count': len(extracted.get('timeline', []))
        })
    }
