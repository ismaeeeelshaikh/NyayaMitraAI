"""
Fact Extractor — Conversation se structured legal facts nikalta hai.
Invoke: ASYNC — user wait nahi karta, background mein chalta hai.

Use case: Timeline generator aur complaint generator ke liye pre-filled data.
Jab Member 3 timeline banata hai, ye already extracted facts use kar sakta hai.
"""
import boto3
import json
import os

bedrock  = boto3.client('bedrock-runtime', region_name='ap-south-1')
dynamodb = boto3.resource('dynamodb')

MODEL_ID     = os.environ.get('BEDROCK_MODEL_ID', 'apac.amazon.nova-pro-v1:0')
if "claude" in MODEL_ID.lower():
    MODEL_ID = 'apac.amazon.nova-pro-v1:0'
TABLE_PREFIX = os.environ.get('TABLE_PREFIX', 'nyaya-mitra')

EXTRACT_PROMPT = """Extract legal case facts from this conversation.
Return ONLY valid JSON (no extra text, no markdown):

{{
  "incident_date": "YYYY-MM-DD or null if unclear",
  "incident_location": {{
    "place": "specific place or null",
    "state": "state code like MH, DL or null",
    "district": "district name or null"
  }},
  "parties": {{
    "complainant": {{
      "name": "name or null",
      "gender": "male/female/other/null",
      "phone": "phone or null"
    }},
    "respondents": ["list of names, empty if none"]
  }},
  "issue_type": "property_dispute|family_law|consumer|criminal|labor|cyber|other",
  "brief_summary": "2-3 sentence summary of the legal issue",
  "key_dates": [
    {{"date": "YYYY-MM-DD or estimated", "event": "what happened"}}
  ],
  "evidence_mentioned": ["list of evidence user has"],
  "evidence_gaps": ["list of evidence user should get"],
  "monetary_amount": "amount in INR or null",
  "desired_outcome": "what the user wants",
  "urgency_indicators": ["any urgent factors mentioned"]
}}

Conversation (last 15 messages):
{conversation}"""

def handler(event, context):
    chat_history = event.get('chat_history', [])
    session_id   = event.get('session_id', '')

    # Kam se kam 3 messages ke baad hi extract karo
    if len(chat_history) < 3:
        print(f"Session {session_id}: Not enough history for fact extraction")
        return {'extracted': False, 'reason': 'insufficient_history'}

    # Conversation format karo
    conv_lines = []
    for msg in chat_history[-15:]:  # Last 15 messages
        sender = 'User' if msg.get('sender') == 'user' else 'Assistant'
        text   = msg.get('text', '')[:300]  # Max 300 chars per message
        conv_lines.append(f"{sender}: {text}")

    conversation = '\n'.join(conv_lines)

    resp = bedrock.invoke_model(
        modelId=MODEL_ID,
        body=json.dumps({
            "messages": [{"role": "user", "content": [{"text": EXTRACT_PROMPT.format(conversation=conversation)}]}],
            "inferenceConfig": {
                "max_new_tokens": 600,
                "temperature": 0.1
            }
        })
    )

    raw = json.loads(resp['body'].read())['output']['message']['content'][0]['text']
    raw = raw.replace('```json', '').replace('```', '').strip()

    try:
        facts = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}. Raw: {raw[:200]}")
        return {'extracted': False, 'reason': 'parse_error'}

    # Session mein facts save karo (Member 3 complaint generator use karega)
    try:
        dynamodb.Table(f'{TABLE_PREFIX}-sessions').update_item(
            Key={'session_id': session_id},
            UpdateExpression='SET extracted_facts = :f',
            ExpressionAttributeValues={':f': json.dumps(facts)}
        )
    except Exception as e:
        print(f"Facts save error: {e}")

    print(f"Session {session_id}: Facts extracted. Issue: {facts.get('issue_type')}")
    return {'extracted': True, 'session_id': session_id, 'facts': facts}
