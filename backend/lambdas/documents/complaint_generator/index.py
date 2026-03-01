"""
Complaint Generator
HTTP API: POST /v1/complaints/generate

6 complaint types:
  police       → FIR at police station
  rti          → RTI Application
  legal_notice → Legal notice to opposite party
  consumer     → Consumer court complaint
  womens_cell  → Women's cell complaint
  cyber        → Cyber crime complaint

Cost per call: ~$0.02-0.04 (700 tokens)
"""
import boto3
import json
import os
import uuid
import random
import sys
from datetime import datetime, timezone

sys.path.insert(0, '/opt/python')
from pdf_generator import generate_complaint_pdf

bedrock  = boto3.client('bedrock-runtime', region_name='ap-south-1')
dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
s3       = boto3.client('s3', region_name='ap-south-1')

MODEL_ID     = os.environ.get('BEDROCK_MODEL_ID', 'apac.amazon.nova-pro-v1:0')
if "claude" in MODEL_ID.lower():
    MODEL_ID = 'apac.amazon.nova-pro-v1:0'
TABLE_PREFIX = os.environ.get('TABLE_PREFIX', 'nyaya-mitra')
DOCS_BUCKET  = os.environ.get('USER_DOCUMENTS_BUCKET', '')
MAX_TOKENS   = int(os.environ.get('MAX_TOKENS_COMPLAINT', '700'))

CORS = {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}

COMPLAINT_CONFIGS = {
    'police': {
        'display':        'Police Complaint (FIR)',
        'addressee':      'The Station House Officer',
        'addressee_org':  'Police Station',
        'subject_prefix': 'Complaint for Registration of FIR',
        'laws_hint':      'Relevant IPC sections (354, 379, 406, 420, 498A, etc.)',
        'closing':        'I request you to register an FIR and take appropriate legal action.'
    },
    'rti': {
        'display':        'RTI Application',
        'addressee':      'The Public Information Officer',
        'addressee_org':  'Concerned Government Department',
        'subject_prefix': 'Application under Right to Information Act, 2005',
        'laws_hint':      'Section 6 of RTI Act 2005',
        'closing':        'I request you to provide the above information within 30 days as per RTI Act 2005.'
    },
    'legal_notice': {
        'display':        'Legal Notice',
        'addressee':      'To',
        'addressee_org':  'The Respondent',
        'subject_prefix': 'Legal Notice',
        'laws_hint':      'Relevant civil/criminal laws',
        'closing':        'Failing compliance within 30 days, I shall be constrained to initiate appropriate legal proceedings without further notice.'
    },
    'consumer': {
        'display':        'Consumer Court Complaint',
        'addressee':      "The Hon'ble President",
        'addressee_org':  'District Consumer Disputes Redressal Commission',
        'subject_prefix': 'Consumer Complaint under Consumer Protection Act 2019',
        'laws_hint':      'Consumer Protection Act 2019, Sections 2(7), 35, 47',
        'closing':        'I pray that this Hon\'ble Commission may be pleased to grant appropriate relief and compensation.'
    },
    'womens_cell': {
        'display':        "Women's Cell Complaint",
        'addressee':      'The Officer In-Charge',
        'addressee_org':  "Women's Cell / Crime Against Women Cell",
        'subject_prefix': 'Complaint Regarding Harassment/Violence Against Woman',
        'laws_hint':      'Protection of Women from Domestic Violence Act 2005, IPC 498A, 354',
        'closing':        'I request you to take immediate action and provide protection as per the law.'
    },
    'cyber': {
        'display':        'Cyber Crime Complaint',
        'addressee':      'The Officer In-Charge',
        'addressee_org':  'Cyber Crime Cell',
        'subject_prefix': 'Complaint Regarding Cyber Crime',
        'laws_hint':      'IT Act 2000 (Sections 43, 66, 66C, 66D, 67), IPC 420',
        'closing':        'I request you to investigate the matter and take appropriate legal action against the accused.'
    }
}

COMPLAINT_PROMPT = """Draft a formal {complaint_type_display} in {language} for India.

COMPLAINANT DETAILS: {complainant}
AUTHORITY ADDRESSEE: {addressee}, {addressee_org}
INCIDENT DESCRIPTION: {incident}
TIMELINE: {timeline}
RELIEF SOUGHT: {relief}
APPLICABLE LAWS: {laws_hint}

STRICT RULES:
1. Start with: To, {addressee}, {addressee_org}
2. Include: Subject: {subject_prefix} — [brief topic]
3. Number each paragraph
4. Use formal legal language
5. Include all complainant details in "I, [name]..."
6. Cite the applicable laws mentioned above
7. End with: {closing}
8. Sign-off: Yours faithfully, [complainant name], Date: {today}
9. MAXIMUM 400 words
10. Write in {language} language
11. Do NOT use placeholder text like [your name] — use actual details provided

Write ONLY the complaint document, nothing else:"""

def generate_tracking_number(state: str, district: str) -> str:
    state_code    = (state or 'XX')[:2].upper()
    district_code = (district or 'XXX')[:3].upper().replace(' ', '')
    date_code     = datetime.now().strftime('%Y%m%d')
    random_code   = random.randint(1000, 9999)
    return f"NYM-{state_code}-{district_code}-{date_code}-{random_code}"

def handler(event, context):
    try:
        body = json.loads(event.get('body', '{}'))
    except Exception:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Invalid request'})}

    complaint_type  = body.get('complaint_type', 'police')
    user_inputs     = body.get('user_inputs', {})
    timeline_id     = body.get('timeline_id')
    user_id         = body.get('user_id', 'unknown')
    language        = body.get('language', 'en')

    config = COMPLAINT_CONFIGS.get(complaint_type, COMPLAINT_CONFIGS['police'])

    # Timeline summary fetch karo (agar hai)
    timeline_summary = 'No specific timeline provided'
    if timeline_id:
        try:
            tl_item = dynamodb.Table(f'{TABLE_PREFIX}-timelines').get_item(
                Key={'timeline_id': timeline_id}
            ).get('Item', {})
            events = json.loads(tl_item.get('extracted_timeline', '[]'))
            if events:
                timeline_summary = '\n'.join([
                    f"- [{e.get('date','?')}]: {e.get('event','')}"
                    for e in events[:10]
                ])
        except Exception as e:
            print(f"Timeline fetch error: {e}")

    location    = user_inputs.get('location', {})
    complainant = user_inputs.get('complainant', {})
    complainant_str = (
        f"Name: {complainant.get('name','Not provided')}, "
        f"Address: {complainant.get('address','Not provided')}, "
        f"Phone: {complainant.get('phone','Not provided')}, "
        f"Email: {complainant.get('email','Not provided')}"
    )

    prompt = COMPLAINT_PROMPT.format(
        complaint_type_display = config['display'],
        language               = 'Hindi' if language == 'hi' else 'English',
        complainant            = complainant_str,
        addressee              = config['addressee'],
        addressee_org          = config['addressee_org'],
        incident               = user_inputs.get('incident_description', 'As described below')[:1000],
        timeline               = timeline_summary[:800],
        relief                 = user_inputs.get('relief_sought', 'Appropriate legal action')[:300],
        laws_hint              = config['laws_hint'],
        subject_prefix         = config['subject_prefix'],
        closing                = config['closing'],
        today                  = datetime.now().strftime('%d %B %Y')
    )

    # Bedrock call (Amazon Nova generic format)
    try:
        resp = bedrock.invoke_model(
            modelId=MODEL_ID,
            body=json.dumps({
                "messages": [{"role": "user", "content": [{"text": prompt}]}],
                "inferenceConfig": {
                    "max_new_tokens": MAX_TOKENS,
                    "temperature": 0.2
                }
            })
        )
        complaint_text = json.loads(resp['body'].read())['output']['message']['content'][0]['text'].strip()
    except Exception as e:
        return {'statusCode': 500, 'headers': CORS, 'body': json.dumps({'error': f'AI error: {e}'})}

    tracking = generate_tracking_number(
        location.get('state', ''),
        location.get('district', '')
    )
    complaint_id = str(uuid.uuid4())

    # PDF generate karo
    try:
        pdf_data = {
            'tracking_number':       tracking,
            'complaint_type':        complaint_type,
            'complaint_type_display': config['display']
        }
        pdf_bytes = generate_complaint_pdf(pdf_data, complaint_text)
    except Exception as e:
        return {'statusCode': 500, 'headers': CORS, 'body': json.dumps({'error': f'PDF error: {e}'})}

    # S3 upload
    s3_key = f"complaints/{user_id}/{complaint_type}_{tracking}.pdf"
    try:
        s3.put_object(
            Bucket=DOCS_BUCKET,
            Key=s3_key,
            Body=pdf_bytes,
            ContentType='application/pdf',
            ContentDisposition=f'attachment; filename="complaint_{tracking}.pdf"'
        )
    except Exception as e:
        return {'statusCode': 500, 'headers': CORS, 'body': json.dumps({'error': f'S3 error: {e}'})}

    presigned_url = s3.generate_presigned_url(
        'get_object',
        Params={'Bucket': DOCS_BUCKET, 'Key': s3_key},
        ExpiresIn=604800
    )

    from decimal import Decimal

    # DynamoDB save
    now = datetime.now(timezone.utc)
    dynamodb.Table(f'{TABLE_PREFIX}-complaints').put_item(Item={
        'complaint_id':      complaint_id,
        'user_id':           user_id,
        'tracking_number':   tracking,
        'complaint_type':    complaint_type,
        'location':          location,
        'created_at':        now.isoformat(),
        'status':            'generated',
        'pdf_s3_url':        f's3://{DOCS_BUCKET}/{s3_key}',
        'pdf_presigned_url': presigned_url,
        'timeline_id':       timeline_id,
        'file_size_kb':      Decimal(str(round(len(pdf_bytes) / 1024, 1)))
    })

    return {
        'statusCode': 200,
        'headers': CORS,
        'body': json.dumps({
            'complaint_id':    complaint_id,
            'tracking_number': tracking,
            'pdf_url':         presigned_url,
            'expires_in':      '7 days',
            'complaint_type':  config['display'],
            'file_size_kb':    round(len(pdf_bytes) / 1024, 1)
        })
    }
