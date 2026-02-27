"""
WebSocket Disconnect Handler
Route: $disconnect
Jab user page close karta hai ya connection drop hoti hai.
"""
import boto3
import os

dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
TABLE_PREFIX = os.environ.get('TABLE_PREFIX', 'nyaya-mitra')

def handler(event, context):
    connection_id = event['requestContext']['connectionId']

    dynamodb.Table(f'{TABLE_PREFIX}-connections').delete_item(
        Key={'connection_id': connection_id}
    )

    print(f"Disconnected: {connection_id}")
    return {'statusCode': 200, 'body': 'Disconnected'}
