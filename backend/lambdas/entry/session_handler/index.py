"""
Session Handler — entry page se session create karta hai.
HTTP API: POST /v1/entry/session
HTTP API: POST /v1/auth/guest

Kya karta hai:
1. Naya session_id generate karta hai
2. DynamoDB sessions table mein save karta hai
3. Guest users ke liye TTL 24 hours set karta hai
4. Frontend ko session_id aur redirect_url deta hai
"""
import boto3
import json
import os
import uuid
from datetime import datetime, timezone

dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
TABLE_PREFIX = os.environ.get('TABLE_PREFIX', 'nyaya-mitra')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Content-Type': 'application/json'
}

def handler(event, context):
    try:
        body = json.loads(event.get('body', '{}'))
    except Exception:
        body = {}

    language  = body.get('language_code', 'en')
    mode      = body.get('mode_selection', 'chat')
    anonymous = body.get('anonymous_mode', True)
    user_id   = body.get('user_id')          # Registered users ke liye
    loc_state = body.get('location_state', '')
    loc_dist  = body.get('location_district', '')

    session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    # Guest = 24 hours TTL, Registered = 7 days TTL
    ttl_seconds = 86400 if anonymous else 604800
    ttl = int(now.timestamp()) + ttl_seconds

    item = {
        'session_id':         session_id,
        'user_id':            user_id or f'guest_{session_id[:8]}',
        'mode':               mode,
        'language':           language,
        'anonymous_mode':     anonymous,
        'stealth_mode':       False,
        'queries_count':      0,
        'location_state':     loc_state,
        'location_district':  loc_dist,
        'created_at':         now.isoformat(),
        'last_activity':      now.isoformat(),
        'ttl':                ttl
    }

    dynamodb.Table(f'{TABLE_PREFIX}-sessions').put_item(Item=item)

    response_body = {
        'session_id':              session_id,
        'redirect_url':            '/dashboard',
        'ui_language':             language,
        'anonymous_mode':          anonymous,
        'query_limit_remaining':   5 if anonymous else 999,
        'stealth_mode_available':  True
    }

    return {
        'statusCode': 200,
        'headers': CORS,
        'body': json.dumps(response_body)
    }
