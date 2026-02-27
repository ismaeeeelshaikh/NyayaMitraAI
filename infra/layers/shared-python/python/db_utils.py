"""
Shared DynamoDB utilities — Member 2 aur 3 ke Lambda functions use karenge
Yeh file EDIT MAT KARO bina Member 1 se baat kiye
"""
import boto3
import os
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
TABLE_PREFIX = os.environ.get('TABLE_PREFIX', 'nyaya-mitra')

def get_table(name: str):
    """Table reference lo"""
    return dynamodb.Table(f'{TABLE_PREFIX}-{name}')

# ── Sessions ──

def create_session(
    user_id: Optional[str],
    language: str,
    mode: str,
    anonymous: bool = False,
    location_state: str = '',
    location_district: str = ''
) -> Dict:
    """Naya session create karo"""
    session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    # Guest 24h, Registered 7 days
    ttl_seconds = 86400 if anonymous else 604800
    ttl = int(now.timestamp()) + ttl_seconds

    item = {
        'session_id': session_id,
        'user_id': user_id or f'guest_{session_id[:8]}',
        'mode': mode,
        'language': language,
        'anonymous_mode': anonymous,
        'stealth_mode': False,
        'queries_count': 0,
        'location_state': location_state,
        'location_district': location_district,
        'created_at': now.isoformat(),
        'last_activity': now.isoformat(),
        'ttl': ttl
    }

    get_table('sessions').put_item(Item=item)
    return item

def get_session(session_id: str) -> Optional[Dict]:
    """Session fetch karo"""
    resp = get_table('sessions').get_item(Key={'session_id': session_id})
    return resp.get('Item')

def update_stealth_mode(session_id: str, enabled: bool) -> None:
    """
    Stealth mode toggle.
    DynamoDB mein store karte hain (ElastiCache nahi — cost bachao).
    """
    get_table('sessions').update_item(
        Key={'session_id': session_id},
        UpdateExpression='SET stealth_mode = :v, last_activity = :ts',
        ExpressionAttributeValues={
            ':v': enabled,
            ':ts': datetime.now(timezone.utc).isoformat()
        }
    )

def increment_query_count(session_id: str) -> int:
    """Query count badhao, naya count return karo"""
    resp = get_table('sessions').update_item(
        Key={'session_id': session_id},
        UpdateExpression='ADD queries_count :inc SET last_activity = :ts',
        ExpressionAttributeValues={
            ':inc': 1,
            ':ts': datetime.now(timezone.utc).isoformat()
        },
        ReturnValues='UPDATED_NEW'
    )
    return int(resp['Attributes']['queries_count'])

# ── Chat History ──

def save_chat_message(
    session_id: str,
    message: Dict,
    anonymous: bool = False
) -> None:
    """Chat message save karo"""
    now = datetime.now(timezone.utc)
    ttl = int(now.timestamp()) + (86400 if anonymous else 7776000)  # 24h or 90 days

    item = {
        'session_id': session_id,
        'timestamp': now.isoformat(),
        'ttl': ttl,
        **message
    }
    get_table('chat-history').put_item(Item=item)

def get_chat_history(session_id: str, limit: int = 20) -> List[Dict]:
    """Recent messages fetch karo (latest first, phir reverse)"""
    resp = get_table('chat-history').query(
        KeyConditionExpression='session_id = :sid',
        ExpressionAttributeValues={':sid': session_id},
        ScanIndexForward=False,
        Limit=limit
    )
    return list(reversed(resp.get('Items', [])))
