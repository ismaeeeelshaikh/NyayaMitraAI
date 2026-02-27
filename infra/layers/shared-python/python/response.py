"""Standard API response format — sab Lambda functions yeh use karenge"""
import json
from typing import Any

CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Session-Id',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
}

def success(data: Any, status_code: int = 200) -> dict:
    return {
        'statusCode': status_code,
        'headers': CORS_HEADERS,
        'body': json.dumps(data, default=str)
    }

def error(message: str, status_code: int = 400, code: str = 'ERROR') -> dict:
    return {
        'statusCode': status_code,
        'headers': CORS_HEADERS,
        'body': json.dumps({'error': message, 'code': code})
    }

def guest_limit_error() -> dict:
    return error(
        'Guest query limit (5) reached. Please register to continue.',
        429,
        'GUEST_LIMIT'
    )

def unauthorized() -> dict:
    return error('Unauthorized. Please login.', 401, 'UNAUTHORIZED')

def not_found(resource: str) -> dict:
    return error(f'{resource} not found.', 404, 'NOT_FOUND')

def server_error(msg: str = 'Internal server error') -> dict:
    return error(msg, 500, 'SERVER_ERROR')
