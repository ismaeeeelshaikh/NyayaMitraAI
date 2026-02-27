"""
Token validation utility — Cognito JWT tokens verify karta hai
Member 2 aur 3 ke Lambda functions mein use hoga
"""
import os
import json
import urllib.request
import hmac
import hashlib
import base64
from typing import Optional, Dict

COGNITO_REGION = os.environ.get('AWS_REGION', 'ap-south-1')
COGNITO_POOL_ID = os.environ.get('COGNITO_USER_POOL_ID', '')

# Guest session check
GUEST_QUERY_LIMIT = int(os.environ.get('GUEST_QUERY_LIMIT', '5'))

def extract_token(event: dict) -> Optional[str]:
    """API Gateway event se Authorization header nikalo"""
    headers = event.get('headers', {}) or {}
    auth = headers.get('authorization') or headers.get('Authorization') or ''
    if auth.startswith('Bearer '):
        return auth[7:]
    return None

def extract_session_id(event: dict) -> Optional[str]:
    """X-Session-Id header se session ID nikalo"""
    headers = event.get('headers', {}) or {}
    return headers.get('x-session-id') or headers.get('X-Session-Id')

def is_guest_request(event: dict) -> bool:
    """Check karo ki request guest se aayi ya registered user se"""
    return extract_token(event) is None

def get_user_id_from_token(token: str) -> Optional[str]:
    """
    JWT token se user_id nikalo (simple decode — full verification Cognito pe)
    NOTE: Production mein proper JWT verification use karo with JWKS
    """
    try:
        # JWT ka payload part (second segment)
        payload_part = token.split('.')[1]
        # Base64 padding fix
        padding = 4 - len(payload_part) % 4
        if padding != 4:
            payload_part += '=' * padding
        payload = json.loads(base64.b64decode(payload_part))
        return payload.get('sub')  # Cognito user ID
    except Exception:
        return None

def get_user_claims(token: str) -> Dict:
    """JWT token se saare claims nikalo"""
    try:
        payload_part = token.split('.')[1]
        padding = 4 - len(payload_part) % 4
        if padding != 4:
            payload_part += '=' * padding
        return json.loads(base64.b64decode(payload_part))
    except Exception:
        return {}

def check_guest_limit(queries_count: int) -> bool:
    """Guest user ka query limit check karo — True = allowed, False = limit reached"""
    return queries_count < GUEST_QUERY_LIMIT
