"""
Message Orchestrator — Main Pipeline Controller
WebSocket route: sendMessage

Yeh function:
1. User ka message receive karta hai WebSocket se
2. 8 Lambda functions sequentially/async invoke karta hai
3. Final response user ko WebSocket se bhejta hai
4. Chat history DynamoDB mein save karta hai

Invocation order:
  SYNC:  intent → risk → (if HIGH: escalation async) → rag → bedrock → confidence
  ASYNC: fact_extractor, (conditionally) action_recommender
"""
import boto3
import json
import os
import uuid
from datetime import datetime, timezone

dynamodb     = boto3.resource('dynamodb', region_name='ap-south-1')
lambda_client= boto3.client('lambda', region_name='ap-south-1')

TABLE_PREFIX  = os.environ.get('TABLE_PREFIX', 'nyaya-mitra')
GUEST_LIMIT   = int(os.environ.get('GUEST_QUERY_LIMIT', '5'))

# ── Helper: Invoke Lambda synchronously ──
def invoke_sync(func_name: str, payload: dict) -> dict:
    """Kisi Lambda ko call karo aur response wait karo"""
    try:
        resp = lambda_client.invoke(
            FunctionName=func_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )
        raw = resp['Payload'].read()
        return json.loads(raw)
    except Exception as e:
        print(f"invoke_sync error ({func_name}): {e}")
        return {}

# ── Helper: Invoke Lambda asynchronously ──
def invoke_async(func_name: str, payload: dict):
    """Background mein kisi Lambda ko chalao — wait nahi karte"""
    try:
        lambda_client.invoke(
            FunctionName=func_name,
            InvocationType='Event',
            Payload=json.dumps(payload)
        )
    except Exception as e:
        print(f"invoke_async error ({func_name}): {e}")

# ── Helper: WebSocket pe message bhejo ──
def send_ws(apigw_client, connection_id: str, data: dict):
    """User ke WebSocket connection pe data bhejo"""
    try:
        apigw_client.post_to_connection(
            ConnectionId=connection_id,
            Data=json.dumps(data, default=str).encode('utf-8')
        )
    except apigw_client.exceptions.GoneException:
        print(f"Connection {connection_id} already gone")
    except Exception as e:
        print(f"WebSocket send error: {e}")

def handler(event, context):
    # ── Parse WebSocket event ──
    req_ctx       = event['requestContext']
    connection_id = req_ctx['connectionId']
    domain_name   = req_ctx['domainName']
    stage         = req_ctx['stage']

    # API Gateway Management client — WebSocket responses ke liye
    apigw = boto3.client(
        'apigatewaymanagementapi',
        endpoint_url=f'https://{domain_name}/{stage}',
        region_name='ap-south-1'
    )

    # ── Parse body ──
    try:
        body = json.loads(event.get('body', '{}'))
    except Exception:
        send_ws(apigw, connection_id, {'error': 'Invalid message format'})
        return {'statusCode': 400}

    session_id = body.get('session_id', '')
    text       = body.get('text', '').strip()
    language   = body.get('language', 'en')
    message_id = body.get('message_id', str(uuid.uuid4()))

    print(f"DEBUG: Received WebSocket message. ConnectionId: {connection_id}, SessionID from body: '{session_id}'")

    # ── Validate session ──
    sessions_table = dynamodb.Table(f'{TABLE_PREFIX}-sessions')
    session = sessions_table.get_item(Key={'session_id': session_id}).get('Item')

    print(f"DEBUG: Fetched session from DDB: {session is not None}")

    if not session:
        send_ws(apigw, connection_id, {
            'error': 'Session expired. Please refresh the page.',
            'error_code': 'SESSION_EXPIRED'
        })
        return {'statusCode': 400}

    is_anonymous = session.get('anonymous_mode', True)

    # ── Guest Limit Check ──
    current_count = int(session.get('queries_count', 0))
    if is_anonymous and current_count >= GUEST_LIMIT:
        send_ws(apigw, connection_id, {
            'error': 'You have used all 5 free questions.',
            'error_code': 'GUEST_LIMIT_REACHED',
            'message': 'Please create a free account to continue asking questions.',
            'queries_used': current_count,
            'queries_limit': GUEST_LIMIT
        })
        return {'statusCode': 429}

    # ── Increment query count ──
    sessions_table.update_item(
        Key={'session_id': session_id},
        UpdateExpression='ADD queries_count :inc SET last_activity = :ts',
        ExpressionAttributeValues={
            ':inc': 1,
            ':ts': datetime.now(timezone.utc).isoformat()
        }
    )

    # ── Fetch recent chat history (context ke liye) ──
    history_resp = dynamodb.Table(f'{TABLE_PREFIX}-chat-history').query(
        KeyConditionExpression='session_id = :sid',
        ExpressionAttributeValues={':sid': session_id},
        ScanIndexForward=False,
        Limit=10
    )
    chat_history = list(reversed(history_resp.get('Items', [])))

    # ══════════════════════════════════════
    #           PIPELINE START
    # ══════════════════════════════════════

    # STEP 1: Intent Classification
    print(f"[{message_id}] Step 1: Intent classification...")
    intent_result = invoke_sync('nyaya-mitra-intent-classifier', {
        'text': text,
        'language': language,
        'session_id': session_id
    })
    domain  = intent_result.get('domain', 'general')
    urgency = intent_result.get('urgency', 'LOW')
    intent  = intent_result.get('intent', 'SeekLegalAdvice')

    # STEP 2: Risk Scoring
    print(f"[{message_id}] Step 2: Risk scoring...")
    risk_result = invoke_sync('nyaya-mitra-risk-scorer', {
        'text':    text,
        'urgency': urgency,
        'domain':  domain
    })
    risk_score = risk_result.get('risk_score', 0)
    risk_level = risk_result.get('risk_level', 'LOW')

    # STEP 3: Escalation (HIGH risk only — ASYNC, don't block user)
    if risk_level == 'HIGH':
        print(f"[{message_id}] Step 3: HIGH RISK detected ({risk_score}) — escalating async...")
        invoke_async('nyaya-mitra-escalation-router', {
            'session_id':   session_id,
            'user_id':      session.get('user_id'),
            'risk_score':   risk_score,
            'risk_factors': list(risk_result.get('breakdown', {}).keys()),
            'issue_summary': text[:500],
            'location': {
                'state':    session.get('location_state', ''),
                'district': session.get('location_district', '')
            },
            'language': language,
            'selfharm_detected': risk_result.get('selfharm_detected', False)
        })

    # STEP 4: S3 RAG Retrieval (Kendra replace)
    print(f"[{message_id}] Step 4: S3 RAG retrieval (domain: {domain})...")
    rag_result = invoke_sync('nyaya-mitra-s3-rag-retriever', {
        'text':     text,
        'language': language,
        'domain':   domain
    })
    passages  = rag_result.get('passages', [])
    citations = rag_result.get('citations', [])

    # STEP 5: Bedrock Answer Generation
    print(f"[{message_id}] Step 5: Bedrock answer generation...")
    bedrock_result = invoke_sync('nyaya-mitra-bedrock-generator', {
        'text':     text,
        'passages': passages,
        'language': language,
        'domain':   domain
    })
    answer         = bedrock_result.get('answer', 'I was unable to generate a response. Please try again.')
    cited_indices  = bedrock_result.get('cited_indices', [])

    # STEP 6: Confidence Score
    print(f"[{message_id}] Step 6: Confidence calculation...")
    confidence_result = invoke_sync('nyaya-mitra-confidence-calculator', {
        'passages':      passages,
        'cited_indices': cited_indices,
        'answer':        answer
    })
    confidence_score = confidence_result.get('confidence_score', 0)
    confidence_label = confidence_result.get('label', 'Limited Information')

    # STEP 7: Fact Extraction (ASYNC — user wait nahi karta)
    print(f"[{message_id}] Step 7: Fact extraction (async)...")
    invoke_async('nyaya-mitra-fact-extractor', {
        'session_id': session_id,
        'chat_history': chat_history + [
            {'sender': 'user', 'text': text, 'timestamp': datetime.now(timezone.utc).isoformat()},
            {'sender': 'assistant', 'text': answer}
        ]
    })

    # STEP 8: Action Recommendation (only if medium/high risk or specific intent)
    recommended_actions = []
    if risk_score >= 30 or intent in ['FileComplaint', 'GenerateDocument', 'EmergencyHelp']:
        print(f"[{message_id}] Step 8: Action recommendation...")
        action_result = invoke_sync('nyaya-mitra-action-recommender', {
            'domain':          domain,
            'intent':          intent,
            'risk_assessment': risk_result,
            'location': {
                'state':    session.get('location_state', ''),
                'district': session.get('location_district', '')
            },
            'language': language
        })
        primary_action = action_result.get('primary_action')
        if primary_action:
            recommended_actions = [primary_action]

    # ══════════════════════════════════════
    #           PIPELINE END
    # ══════════════════════════════════════

    # ── Filter citations to only cited ones ──
    used_citations = [c for c in citations if c.get('index') in cited_indices]

    # ── Build final response ──
    response_payload = {
        'type':             'message_response',
        'message_id':       message_id,
        'answer':           answer,
        'citations':        used_citations,
        'confidence_score': confidence_score,
        'confidence_label': confidence_label,
        'confidence_color': confidence_result.get('color', 'orange'),
        'risk_level':       risk_level,
        'risk_score':       risk_score,
        'domain':           domain,
        'intent':           intent,
        'recommended_actions': recommended_actions,
        'queries_used':     current_count + 1,
        'queries_remaining': max(0, GUEST_LIMIT - (current_count + 1)) if is_anonymous else 999,
        'timestamp':        datetime.now(timezone.utc).isoformat()
    }

    # ── Selfharm special response ──
    if risk_result.get('selfharm_detected'):
        response_payload['crisis_resources'] = {
            'message': 'We noticed your message may indicate distress. Please reach out:',
            'helplines': [
                {'name': 'Vandrevala Foundation (24/7)', 'number': '1860-2662-345'},
                {'name': 'iCall', 'number': '9152987821'},
                {'name': 'Sneha India', 'number': '044-24640050'}
            ]
        }

    # ── Send to user via WebSocket ──
    send_ws(apigw, connection_id, response_payload)
    print(f"[{message_id}] Response sent. Risk: {risk_level}({risk_score}), Conf: {confidence_score}")

    # ── Save chat history ──
    now = datetime.now(timezone.utc)
    ttl = int(now.timestamp()) + (86400 if is_anonymous else 7776000)

    dynamodb.Table(f'{TABLE_PREFIX}-chat-history').put_item(Item={
        'session_id':       session_id,
        'timestamp':        now.isoformat(),
        'message_id':       message_id,
        'sender':           'user',
        'text':             text,
        'language':         language,
        'intent':           intent,
        'domain':           domain,
        'risk_score':       risk_score,
        'risk_level':       risk_level,
        'answer':           answer,
        'confidence_score': confidence_score,
        'citations':        used_citations,
        'recommended_actions': recommended_actions,
        'ttl':              ttl
    })

    return {'statusCode': 200}
