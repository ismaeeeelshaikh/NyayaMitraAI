"""
Notice Analysis Pipeline — ASYNC (notice_scanner ne trigger kiya)
Kya karta hai:
1. Textract se PDF text extract karta hai
2. Bedrock se structured analysis karta hai
3. Deadline calculate karta hai
4. Risk score nikalta hai
5. DynamoDB update karta hai
6. Deadline reminder schedule karta hai
"""
import boto3
import json
import os
from datetime import datetime, date, timezone, timedelta

textract = boto3.client('textract', region_name='ap-south-1')
bedrock  = boto3.client('bedrock-runtime', region_name='ap-south-1')
dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
lmb      = boto3.client('lambda', region_name='ap-south-1')

MODEL_ID     = os.environ.get('BEDROCK_MODEL_ID', 'apac.amazon.nova-pro-v1:0')
if "claude" in MODEL_ID.lower():
    MODEL_ID = 'apac.amazon.nova-pro-v1:0'
TABLE_PREFIX = os.environ.get('TABLE_PREFIX', 'nyaya-mitra')
MAX_TOKENS   = int(os.environ.get('MAX_TOKENS_NOTICE', '700'))

NOTICE_ANALYSIS_PROMPT = """Analyze this Indian legal notice/document.
Return ONLY valid JSON (no markdown):
{{
  "notice_type": "Legal Notice|Court Summons|Demand Letter|Government Notice|Bank Notice|Recovery Notice|Other",
  "sender_details": {{
    "name": "sender name or organization",
    "is_lawyer": true or false,
    "is_court": true or false,
    "is_bank": true or false
  }},
  "issue_date": "YYYY-MM-DD or null",
  "response_deadline_date": "YYYY-MM-DD or null",
  "response_deadline_days": "number of days given to respond or null",
  "legal_sections_cited": ["list of law sections mentioned"],
  "demands": ["what they are demanding"],
  "consequences_if_ignored": ["what happens if not responded"],
  "monetary_amount_claimed": "amount in words or null",
  "risk_level": "HIGH|MEDIUM|LOW",
  "risk_reasoning": "2 sentences on why this risk level",
  "recommended_actions": [
    {{
      "priority": "IMMEDIATE|WITHIN_3_DAYS|WITHIN_DEADLINE",
      "action": "specific action to take",
      "reason": "why this action"
    }}
  ],
  "information_gaps": ["what's unclear or missing in the notice"]
}}

Document Text:
{text}"""

def calculate_deadline_status(deadline_str: str) -> dict:
    """Deadline kitni door hai"""
    if not deadline_str:
        return {'status': 'UNKNOWN', 'days_remaining': None, 'color': 'grey', 'label': 'Unknown Deadline'}

    try:
        deadline  = datetime.strptime(deadline_str, '%Y-%m-%d').date()
        today     = date.today()
        days_left = (deadline - today).days

        if days_left < 0:
            return {'status': 'OVERDUE', 'days_remaining': days_left, 'color': 'red', 'label': f'Overdue by {abs(days_left)} days'}
        elif days_left == 0:
            return {'status': 'TODAY', 'days_remaining': 0, 'color': 'red', 'label': 'Due TODAY'}
        elif days_left <= 3:
            return {'status': 'CRITICAL', 'days_remaining': days_left, 'color': 'red', 'label': f'{days_left} day(s) remaining'}
        elif days_left <= 7:
            return {'status': 'URGENT', 'days_remaining': days_left, 'color': 'orange', 'label': f'{days_left} days remaining'}
        elif days_left <= 15:
            return {'status': 'IMPORTANT', 'days_remaining': days_left, 'color': 'yellow', 'label': f'{days_left} days remaining'}
        else:
            return {'status': 'NORMAL', 'days_remaining': days_left, 'color': 'green', 'label': f'{days_left} days remaining'}
    except ValueError:
        return {'status': 'UNKNOWN', 'days_remaining': None, 'color': 'grey', 'label': 'Invalid date format'}

def calculate_risk_score(analysis: dict, dl_status: dict) -> int:
    """0-100 risk score"""
    score = 0

    type_scores = {
        'Court Summons': 25, 'Government Notice': 22, 'Bank Notice': 18,
        'Recovery Notice': 18, 'Legal Notice': 15, 'Demand Letter': 12, 'Other': 8
    }
    score += type_scores.get(analysis.get('notice_type', 'Other'), 8)

    deadline_scores = {
        'OVERDUE': 25, 'TODAY': 25, 'CRITICAL': 22, 'URGENT': 18,
        'IMPORTANT': 12, 'NORMAL': 5, 'UNKNOWN': 10
    }
    score += deadline_scores.get(dl_status.get('status', 'UNKNOWN'), 10)

    sections = analysis.get('legal_sections_cited', [])
    score += min(len(sections) * 5, 20)

    consequences = [c.lower() for c in analysis.get('consequences_if_ignored', [])]
    if any('court' in c or 'prosecution' in c or 'arrest' in c for c in consequences):
        score += 15
    elif any('recovery' in c or 'legal action' in c for c in consequences):
        score += 10
    elif consequences:
        score += 5

    sender = analysis.get('sender_details', {})
    if sender.get('is_court'):    score += 15
    elif sender.get('is_bank'):   score += 10
    elif sender.get('is_lawyer'): score += 8
    else:                         score += 3

    return min(score, 100)

def handler(event, context):
    notice_id = event.get('notice_id')
    s3_bucket = event.get('s3_bucket')
    s3_key    = event.get('s3_key')
    user_id   = event.get('user_id')

    print(f"Analyzing notice: {notice_id}")

    # ── Step 1: Textract ──
    try:
        tr = textract.detect_document_text(
            Document={'S3Object': {'Bucket': s3_bucket, 'Name': s3_key}}
        )
        extracted_text = ' '.join(
            block.get('Text', '')
            for block in tr.get('Blocks', [])
            if block.get('BlockType') == 'LINE'
        )
        print(f"Textract extracted {len(extracted_text)} chars")
    except Exception as e:
        print(f"Textract error: {e}")
        dynamodb.Table(f'{TABLE_PREFIX}-scanned-notices').update_item(
            Key={'notice_id': notice_id},
            UpdateExpression='SET processing_status = :s, error_message = :e',
            ExpressionAttributeValues={':s': 'failed', ':e': str(e)}
        )
        return

    if len(extracted_text) < 20:
        dynamodb.Table(f'{TABLE_PREFIX}-scanned-notices').update_item(
            Key={'notice_id': notice_id},
            UpdateExpression='SET processing_status = :s, error_message = :e',
            ExpressionAttributeValues={':s': 'failed', ':e': 'Could not extract text from document'}
        )
        return

    # ── Step 2: Bedrock Analysis (Amazon Nova format) ──
    try:
        resp = bedrock.invoke_model(
            modelId=MODEL_ID,
            body=json.dumps({
                "messages": [{"role": "user", "content": [{"text": NOTICE_ANALYSIS_PROMPT.format(text=extracted_text[:5000])}]}],
                "inferenceConfig": {
                    "max_new_tokens": MAX_TOKENS,
                    "temperature": 0.1
                }
            })
        )
        raw = json.loads(resp['body'].read())['output']['message']['content'][0]['text']
        raw = raw.replace('```json', '').replace('```', '').strip()
        analysis = json.loads(raw)
    except json.JSONDecodeError:
        analysis = {
            'notice_type': 'Unknown',
            'sender_details': {'name': 'Unknown', 'is_lawyer': False, 'is_court': False, 'is_bank': False},
            'issue_date': None, 'response_deadline_date': None,
            'legal_sections_cited': [],
            'demands': ['Unable to parse document clearly'],
            'consequences_if_ignored': ['Unknown — please consult a lawyer'],
            'risk_level': 'MEDIUM',
            'risk_reasoning': 'Could not fully analyze. Treat as MEDIUM risk.',
            'recommended_actions': [{'priority': 'WITHIN_3_DAYS', 'action': 'Consult a lawyer immediately', 'reason': 'Document could not be fully analyzed'}],
            'information_gaps': ['Full document analysis failed']
        }
    except Exception as e:
        print(f"Bedrock error: {e}")
        return

    # ── Step 3: Deadline + Risk ──
    dl_status   = calculate_deadline_status(analysis.get('response_deadline_date'))
    r_score     = calculate_risk_score(analysis, dl_status)
    now         = datetime.now(timezone.utc)

    # ── Step 4: DynamoDB Update ──
    dynamodb.Table(f'{TABLE_PREFIX}-scanned-notices').update_item(
        Key={'notice_id': notice_id},
        UpdateExpression='''SET
            processing_status       = :ps,
            extracted_text_length   = :etl,
            notice_type             = :nt,
            sender_details          = :sd,
            issue_date              = :id,
            response_deadline_date  = :rdd,
            deadline_status         = :ds,
            days_remaining          = :dr,
            deadline_color          = :dc,
            deadline_label          = :dl,
            risk_score              = :rs,
            risk_level              = :rl,
            risk_reasoning          = :rr,
            legal_sections_cited    = :lsc,
            demands                 = :dem,
            consequences_if_ignored = :con,
            recommended_actions     = :ra,
            information_gaps        = :ig,
            analysis_completed_at   = :ts''',
        ExpressionAttributeValues={
            ':ps':  'completed',
            ':etl': len(extracted_text),
            ':nt':  analysis.get('notice_type', 'Unknown'),
            ':sd':  analysis.get('sender_details', {}),
            ':id':  analysis.get('issue_date'),
            ':rdd': analysis.get('response_deadline_date'),
            ':ds':  dl_status.get('status'),
            ':dr':  dl_status.get('days_remaining'),
            ':dc':  dl_status.get('color'),
            ':dl':  dl_status.get('label'),
            ':rs':  r_score,
            ':rl':  analysis.get('risk_level', 'MEDIUM'),
            ':rr':  analysis.get('risk_reasoning', ''),
            ':lsc': analysis.get('legal_sections_cited', []),
            ':dem': analysis.get('demands', []),
            ':con': analysis.get('consequences_if_ignored', []),
            ':ra':  json.dumps(analysis.get('recommended_actions', [])),
            ':ig':  analysis.get('information_gaps', []),
            ':ts':  now.isoformat()
        }
    )
    print(f"Notice {notice_id} analyzed. Risk: {r_score}/100, Deadline: {dl_status['status']}")

    # ── Step 5: Schedule Deadline Reminders ──
    days_left = dl_status.get('days_remaining')
    if days_left and days_left > 0:
        lmb.invoke(
            FunctionName='nyaya-mitra-deadline-reminder',
            InvocationType='Event',
            Payload=json.dumps({
                'notice_id':     notice_id,
                'user_id':       user_id,
                'deadline_date': analysis.get('response_deadline_date'),
                'days_remaining': days_left,
                'notice_type':   analysis.get('notice_type', 'Legal Notice')
            })
        )
