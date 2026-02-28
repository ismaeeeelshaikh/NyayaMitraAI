"""
Legal Aid Escalator
HTTP API: POST /v1/legal-aid/escalate
HTTP API: GET /v1/legal-aid/referrals?state=MH&district=MUMBAI

Kya karta hai:
1. State/district ke basis pe partners dhundho
2. Escalation log banao
3. Matching partners return karo
"""
import boto3
import json
import os
import uuid
from datetime import datetime, timezone

dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')

TABLE_PREFIX = os.environ.get('TABLE_PREFIX', 'nyaya-mitra')

CORS = {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}

def get_referrals(event, context):
    """GET — Partners list karo"""
    params = event.get('queryStringParameters') or {}
    state  = params.get('state', 'MH')

    try:
        resp = dynamodb.Table(f'{TABLE_PREFIX}-legal-aid-partners').query(
            IndexName='state-district-index',
            KeyConditionExpression='#st = :state',
            ExpressionAttributeNames={'#st': 'state'},
            ExpressionAttributeValues={':state': state, ':active': 'active'},
            FilterExpression='availability_status = :active'
        )
        partners = sorted(resp.get('Items', []), key=lambda x: -float(x.get('rating', 0)))
    except Exception as e:
        partners = []

    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'partners': partners}, default=str)}

def handler(event, context):
    method = event.get('requestContext', {}).get('http', {}).get('method', 'POST')
    if method == 'GET':
        return get_referrals(event, context)

    try:
        body = json.loads(event.get('body', '{}'))
    except Exception:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Invalid request'})}

    session_id    = body.get('session_id', '')
    risk_score    = body.get('risk_score', 0)
    location      = body.get('location', {})
    issue_summary = body.get('issue_summary', '')
    language      = body.get('language', 'en')
    state         = location.get('state', 'MH')

    # Partners dhundho
    try:
        resp = dynamodb.Table(f'{TABLE_PREFIX}-legal-aid-partners').query(
            IndexName='state-district-index',
            KeyConditionExpression='#st = :state',
            ExpressionAttributeNames={'#st': 'state'},
            ExpressionAttributeValues={':state': state, ':active': 'active'},
            FilterExpression='availability_status = :active'
        )
        partners = sorted(resp.get('Items', []), key=lambda x: -float(x.get('rating', 0)))[:5]
    except Exception as e:
        partners = []

    esc_id = str(uuid.uuid4())
    now    = datetime.now(timezone.utc)

    dynamodb.Table(f'{TABLE_PREFIX}-escalation-logs').put_item(Item={
        'escalation_id':        esc_id,
        'session_id':           session_id,
        'risk_score':           risk_score,
        'escalation_level':     'HIGH' if risk_score >= 70 else 'MEDIUM',
        'matched_partners':     [p.get('partner_id') for p in partners],
        'location':             location,
        'issue_summary':        issue_summary[:300],
        'escalation_timestamp': now.isoformat(),
        'outcome':              'pending'
    })

    return {
        'statusCode': 200,
        'headers': CORS,
        'body': json.dumps({
            'escalation_id':          esc_id,
            'matched_partners':       partners,
            'expected_response_window': '30 min' if risk_score >= 70 else '24 hours'
        }, default=str)
    }
