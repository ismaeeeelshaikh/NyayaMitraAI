"""
Escalation Router — HIGH risk cases ko legal aid partners ke paas route karta hai.
Invoke: ASYNC (user wait nahi karta)

Kya karta hai:
1. State/district ke basis pe legal aid partners dhundho (DynamoDB query)
2. SNS topic pe alert bhejo
3. Escalation log DynamoDB mein save karo
"""
import boto3
import json
import os
import uuid
from datetime import datetime, timezone

dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
sns      = boto3.client('sns', region_name='ap-south-1')

TABLE_PREFIX          = os.environ.get('TABLE_PREFIX', 'nyaya-mitra')
ESCALATION_TOPIC_ARN  = os.environ.get('ESCALATION_TOPIC_ARN', '')

def handler(event, context):
    session_id      = event.get('session_id', '')
    user_id         = event.get('user_id', 'unknown')
    risk_score      = event.get('risk_score', 0)
    risk_factors    = event.get('risk_factors', [])
    issue_summary   = event.get('issue_summary', '')
    location        = event.get('location', {})
    language        = event.get('language', 'en')
    selfharm        = event.get('selfharm_detected', False)

    state    = location.get('state', 'MH')
    district = location.get('district', '')

    # Legal aid partners dhundho — state ke basis pe
    try:
        resp = dynamodb.Table(f'{TABLE_PREFIX}-legal-aid-partners').query(
            IndexName='state-district-index',
            KeyConditionExpression='#st = :state',
            ExpressionAttributeNames={'#st': 'state'},
            ExpressionAttributeValues={
                ':state': state,
                ':active': 'active'
            },
            FilterExpression='availability_status = :active',
            Limit=5
        )
        partners = sorted(
            resp.get('Items', []),
            key=lambda x: -float(x.get('rating', 0))
        )[:3]
    except Exception as e:
        print(f"Partner query error: {e}")
        partners = []

    escalation_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    # SNS Alert bhejo
    if ESCALATION_TOPIC_ARN:
        alert_msg = (
            f"🚨 HIGH RISK ALERT — Nyaya Mitra\n\n"
            f"Escalation ID: {escalation_id}\n"
            f"Session: {session_id}\n"
            f"Risk Score: {risk_score}/100\n"
            f"Risk Factors: {', '.join(risk_factors)}\n"
            f"Self-harm detected: {'YES ⚠️' if selfharm else 'No'}\n"
            f"Location: {district}, {state}\n"
            f"Language: {language}\n"
            f"Issue: {issue_summary[:300]}\n\n"
            f"Partners notified: {len(partners)}"
        )
        try:
            sns.publish(
                TopicArn=ESCALATION_TOPIC_ARN,
                Message=alert_msg,
                Subject=f"HIGH RISK LEGAL CASE - {state}/{district}"
            )
        except Exception as e:
            print(f"SNS publish error: {e}")

    # Escalation log save karo
    dynamodb.Table(f'{TABLE_PREFIX}-escalation-logs').put_item(Item={
        'escalation_id':      escalation_id,
        'session_id':         session_id,
        'user_id':            user_id,
        'risk_score':         risk_score,
        'escalation_level':   'CRITICAL' if selfharm else 'HIGH',
        'risk_factors':       risk_factors,
        'matched_partners':   [p.get('partner_id') for p in partners],
        'location':           location,
        'selfharm_detected':  selfharm,
        'escalation_timestamp': now.isoformat(),
        'outcome':            'pending',
        'alert_sent':         bool(ESCALATION_TOPIC_ARN)
    })

    print(f"Escalation {escalation_id}: risk={risk_score}, partners={len(partners)}, selfharm={selfharm}")

    return {
        'escalation_id':          escalation_id,
        'matched_partners':       partners,
        'expected_response_window': '30 minutes' if selfharm else '1 hour'
    }
