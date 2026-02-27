"""
WebSocket Connect Handler
Route: $connect
Jab frontend WebSocket se connect karta hai tab yeh chalta hai.
Connection ID DynamoDB mein save hota hai.
"""
import boto3
import os
from datetime import datetime, timezone

dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
TABLE_PREFIX = os.environ.get('TABLE_PREFIX', 'nyaya-mitra')

def handler(event, context):
    connection_id = event['requestContext']['connectionId']
    params = event.get('queryStringParameters') or {}

    session_id = params.get('session_id', '')
    user_id    = params.get('user_id', 'guest')

    now = int(datetime.now(timezone.utc).timestamp())

    # Connection DynamoDB mein save karo
    # TTL: 2 hours (WebSocket max timeout)
    dynamodb.Table(f'{TABLE_PREFIX}-connections').put_item(Item={
        'connection_id': connection_id,
        'session_id':    session_id,
        'user_id':       user_id,
        'connected_at':  datetime.now(timezone.utc).isoformat(),
        'ttl':           now + 7200   # 2 hours
    })

    print(f"Connected: {connection_id} | Session: {session_id}")
    return {'statusCode': 200, 'body': 'Connected'}
