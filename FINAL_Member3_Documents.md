# ╔══════════════════════════════════════════════════════════════╗
# ║         NYAYA MITRA — MEMBER 3 DETAILED REPORT             ║
# ║         Document Features: Timeline, Complaints, Notices    ║
# ║         Budget Version: ~$100 Total Project Budget          ║
# ╚══════════════════════════════════════════════════════════════╝

---

## 1. TUMHARA ROLE KYA HAI

Tum is project ke **"document factory"** ho. Jab user chat kar leta hai, ek point aata hai jahan sirf baatein karna kaafi nahi hota — user ko **actual files chahiye**. PDF complaints, timeline exports, scanned notice analysis — yeh sab tumhara kaam hai.

**Tumhara kaam sabse zyada judges ko impress karta hai** kyunki:
- Demo mein actual PDF download hoti hai — tangible result
- Notice scanner mein AI real-time analysis dikhata hai
- Complaint ke saath tracking number milta hai — professional feel

**Tumhara scope:**
- Timeline extraction (Bedrock se chronological events)
- Timeline PDF generation (ReportLab)
- Complaint generator (6 types: police, RTI, legal notice, consumer, women's cell, cyber)
- Complaint delivery (download URL / email / SMS)
- Notice scanner (upload → Textract → Bedrock analysis)
- Deadline tracker aur EventBridge reminders
- Legal aid escalator
- Dashboard widgets (popular issues, suggested actions)

**Budget ke changes:**
- Bedrock calls mein max_tokens 700-800 rakha (cost control)
- Textract sirf demo notices ke liye
- PDF generation ReportLab se — bilkul free
- Authority details hardcoded — Bedrock se dynamic nahi (cost bachao)

**Dependencies:**
- Member 1 ka kaam complete hona chahiye
- `.env.shared` file + Shared Layer ARN + PDF Layer ARN
- S3 buckets ready hone chahiye

**Budget mein tumhara contribution:** ~$30/month

---

## 2. COMPLETE FILE STRUCTURE

```
nyaya-mitra/
│
├── backend/
│   ├── lambdas/
│   │   └── documents/                          ← TUMHARA MAIN FOLDER
│   │       │
│   │       ├── timeline_builder/
│   │       │   └── index.py                    ← Narrative → JSON timeline (Bedrock)
│   │       │
│   │       ├── timeline_pdf_generator/
│   │       │   └── index.py                    ← JSON → PDF (ReportLab)
│   │       │
│   │       ├── complaint_generator/
│   │       │   └── index.py                    ← Form data → Complaint PDF (Bedrock + ReportLab)
│   │       │
│   │       ├── complaint_delivery/
│   │       │   └── index.py                    ← Download URL / SES email / SNS SMS
│   │       │
│   │       ├── notice_scanner/
│   │       │   └── index.py                    ← File upload + async analysis trigger
│   │       │
│   │       ├── notice_analysis/
│   │       │   └── index.py                    ← Textract + Bedrock analysis pipeline
│   │       │
│   │       ├── deadline_reminder/
│   │       │   └── index.py                    ← EventBridge rules schedule karo
│   │       │
│   │       ├── legal_aid_escalator/
│   │       │   └── index.py                    ← Legal aid partners match + escalate
│   │       │
│   │       └── dashboard_widgets/
│   │           └── index.py                    ← Popular issues + suggested actions
│   │
│   ├── layers/
│   │   └── pdf-layer/                          ← TUMHARA LAYER
│   │       └── python/
│   │           └── pdf_generator.py            ← ReportLab PDF utilities
│   │
│   ├── deploy-pdf-layer.sh                     ← PDF layer deploy karo (pehle)
│   ├── create-document-lambdas.sh              ← Functions create karo
│   └── deploy-document-lambdas.sh              ← Code deploy karo
```

---

## 3. KAHAN SE START KARO

```
PEHLE: Member 1 se .env.shared lo + confirm karo S3 buckets ready hain
DAY 1: Setup + PDF Layer + Timeline Builder
DAY 2: Timeline PDF Generator + Complaint Generator
DAY 3: Complaint Delivery + Notice Scanner Upload
DAY 4: Notice Analysis Pipeline (Textract + Bedrock)
DAY 5: Deadline Reminder + Legal Aid Escalator + Dashboard Widgets
DAY 6: Deploy scripts + Testing
```

---

## 4. DAY-BY-DAY DETAILED PLAN

### ═══ DAY 1 — Setup + PDF Layer + Timeline Builder ═══
**Target: 8-10 ghante | Goal: ReportLab layer ready + timeline extraction kaam kare**

#### Step 1: Environment Setup

```bash
# .env.shared Member 1 se lo
cd backend
cp ../infra/config/.env.shared .env.shared

# Folder structure banao
mkdir -p lambdas/documents/timeline_builder
mkdir -p lambdas/documents/timeline_pdf_generator
mkdir -p lambdas/documents/complaint_generator
mkdir -p lambdas/documents/complaint_delivery
mkdir -p lambdas/documents/notice_scanner
mkdir -p lambdas/documents/notice_analysis
mkdir -p lambdas/documents/deadline_reminder
mkdir -p lambdas/documents/legal_aid_escalator
mkdir -p lambdas/documents/dashboard_widgets
mkdir -p layers/pdf-layer/python

# Python venv testing ke liye
python3 -m venv venv
source venv/bin/activate
pip install boto3 reportlab
```

#### Step 2: PDF Layer Banao — `layers/pdf-layer/python/pdf_generator.py`

```python
"""
PDF Generator Utilities — ReportLab se professional PDFs banao
Yeh file Lambda Layer mein rahegi.
Dono Member 3 ke Lambda functions yeh use karenge:
  - timeline_pdf_generator
  - complaint_generator

INSTALL: pip install reportlab -t layers/pdf-layer/python/
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table,
    TableStyle, HRFlowable, PageBreak
)
from io import BytesIO
from datetime import datetime

# ── Brand Colors ──
BRAND_DARK   = colors.HexColor('#1a237e')   # Deep Indigo
BRAND_MED    = colors.HexColor('#283593')   # Medium Indigo
BRAND_LIGHT  = colors.HexColor('#e8eaf6')   # Light Indigo background
BRAND_ACCENT = colors.HexColor('#ff6f00')   # Amber accent
TEXT_DARK    = colors.HexColor('#212121')
TEXT_MUTED   = colors.HexColor('#757575')

def _get_styles():
    """Document styles define karo"""
    base = getSampleStyleSheet()
    return {
        'title': ParagraphStyle(
            'DocTitle', parent=base['Title'],
            fontSize=20, textColor=BRAND_DARK,
            spaceAfter=6, spaceBefore=0,
            fontName='Helvetica-Bold'
        ),
        'subtitle': ParagraphStyle(
            'Subtitle', parent=base['Normal'],
            fontSize=11, textColor=BRAND_MED,
            spaceAfter=4
        ),
        'heading': ParagraphStyle(
            'Heading', parent=base['Heading2'],
            fontSize=12, textColor=BRAND_DARK,
            spaceBefore=12, spaceAfter=6,
            fontName='Helvetica-Bold'
        ),
        'normal': ParagraphStyle(
            'Body', parent=base['Normal'],
            fontSize=10, leading=15,
            textColor=TEXT_DARK, spaceAfter=4,
            alignment=TA_JUSTIFY
        ),
        'normal_left': ParagraphStyle(
            'BodyLeft', parent=base['Normal'],
            fontSize=10, leading=14,
            textColor=TEXT_DARK
        ),
        'bold': ParagraphStyle(
            'Bold', parent=base['Normal'],
            fontSize=10, leading=14,
            fontName='Helvetica-Bold',
            textColor=TEXT_DARK
        ),
        'small': ParagraphStyle(
            'Small', parent=base['Normal'],
            fontSize=8, textColor=TEXT_MUTED,
            alignment=TA_CENTER
        ),
        'table_header': ParagraphStyle(
            'TH', parent=base['Normal'],
            fontSize=9, textColor=colors.white,
            fontName='Helvetica-Bold',
            alignment=TA_CENTER
        ),
        'table_cell': ParagraphStyle(
            'TC', parent=base['Normal'],
            fontSize=9, leading=12,
            textColor=TEXT_DARK
        ),
        'disclaimer': ParagraphStyle(
            'Disclaimer', parent=base['Normal'],
            fontSize=8, textColor=TEXT_MUTED,
            alignment=TA_CENTER, spaceAfter=0
        )
    }

def _add_header(story, styles, title: str, subtitle: str = '', ref: str = ''):
    """Document header add karo"""
    # Top bar
    header_data = [[
        Paragraph('⚖ NYAYA MITRA', ParagraphStyle(
            'Logo', fontSize=14, textColor=colors.white,
            fontName='Helvetica-Bold'
        )),
        Paragraph(
            f'<font color="white">Ref: {ref}</font>' if ref else '',
            ParagraphStyle('Ref', fontSize=9, textColor=colors.white, alignment=2)
        )
    ]]
    header_table = Table(header_data, colWidths=[10*cm, 7*cm])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BRAND_DARK),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('LEFTPADDING', (0, 0), (0, -1), 12),
        ('RIGHTPADDING', (-1, 0), (-1, -1), 12),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph(title, styles['title']))
    if subtitle:
        story.append(Paragraph(subtitle, styles['subtitle']))
    story.append(HRFlowable(width='100%', thickness=2, color=BRAND_DARK))
    story.append(Spacer(1, 0.3*cm))

def _add_footer(story, styles, ref: str = ''):
    """Document footer add karo"""
    story.append(Spacer(1, 0.5*cm))
    story.append(HRFlowable(width='100%', thickness=0.5, color=TEXT_MUTED))
    story.append(Spacer(1, 0.2*cm))
    date_str = datetime.now().strftime('%d %B %Y, %H:%M')
    footer_text = f"Generated by Nyaya Mitra — {date_str}"
    if ref:
        footer_text += f" | Ref: {ref}"
    story.append(Paragraph(footer_text, styles['small']))
    story.append(Paragraph(
        "This document is for informational purposes only and does not constitute legal advice. "
        "Please consult a qualified lawyer for your specific situation.",
        styles['disclaimer']
    ))


# ════════════════════════════════════════════
#              TIMELINE PDF
# ════════════════════════════════════════════

def generate_timeline_pdf(data: dict) -> bytes:
    """
    Timeline PDF banao.
    data format:
    {
        'timeline_id': str,
        'issue_type': str,
        'timeline': [
            {'date': str, 'event': str, 'legal_significance': str, 'category': str}
        ],
        'gaps': [str],
        'complainant_name': str (optional)
    }
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=1.5*cm, bottomMargin=2*cm
    )
    styles = _get_styles()
    story  = []

    issue_display = data.get('issue_type', 'General').replace('_', ' ').title()
    ref = data.get('timeline_id', '')[:8].upper()

    _add_header(
        story, styles,
        'LEGAL TIMELINE',
        f"Issue Type: {issue_display}  |  Generated: {datetime.now().strftime('%d %b %Y')}",
        ref
    )

    if data.get('complainant_name'):
        story.append(Paragraph(f"<b>Prepared for:</b> {data['complainant_name']}", styles['normal_left']))
        story.append(Spacer(1, 0.2*cm))

    # ── Events Table ──
    events = data.get('timeline', [])
    if events:
        story.append(Paragraph('CHRONOLOGICAL EVENTS', styles['heading']))

        category_colors = {
            'incident':  colors.HexColor('#ffebee'),
            'action':    colors.HexColor('#e8f5e9'),
            'response':  colors.HexColor('#fff3e0'),
            'deadline':  colors.HexColor('#fce4ec'),
        }

        rows = [[
            Paragraph('Date', styles['table_header']),
            Paragraph('Event', styles['table_header']),
            Paragraph('Legal Significance', styles['table_header'])
        ]]

        for e in events:
            cat   = e.get('category', 'incident')
            rows.append([
                Paragraph(e.get('date', 'Unknown'), styles['table_cell']),
                Paragraph(e.get('event', ''), styles['table_cell']),
                Paragraph(e.get('legal_significance', ''), styles['table_cell'])
            ])

        t = Table(rows, colWidths=[3.2*cm, 8*cm, 5.5*cm])
        t.setStyle(TableStyle([
            # Header row
            ('BACKGROUND',    (0, 0), (-1, 0),  BRAND_DARK),
            ('ROWBACKGROUNDS',(0, 1), (-1, -1),  [colors.white, BRAND_LIGHT]),
            ('GRID',          (0, 0), (-1, -1),  0.5, colors.HexColor('#bdbdbd')),
            ('VALIGN',        (0, 0), (-1, -1),  'TOP'),
            ('TOPPADDING',    (0, 0), (-1, -1),  5),
            ('BOTTOMPADDING', (0, 0), (-1, -1),  5),
            ('LEFTPADDING',   (0, 0), (-1, -1),  6),
            ('RIGHTPADDING',  (0, 0), (-1, -1),  6),
        ]))
        story.append(t)
        story.append(Spacer(1, 0.3*cm))

    # ── Gaps Section ──
    gaps = data.get('gaps', [])
    if gaps:
        story.append(Paragraph('INFORMATION GAPS (Collect These)', styles['heading']))
        gaps_data = []
        for g in gaps:
            gaps_data.append([
                Paragraph('⚠', ParagraphStyle('W', fontSize=12, textColor=BRAND_ACCENT)),
                Paragraph(g, styles['normal_left'])
            ])
        if gaps_data:
            gaps_table = Table(gaps_data, colWidths=[0.8*cm, 15.9*cm])
            gaps_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fff8e1')),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#ffe082')),
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                ('LEFTPADDING', (0, 0), (-1, -1), 6),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            story.append(gaps_table)

    _add_footer(story, styles, ref)
    doc.build(story)
    return buffer.getvalue()


# ════════════════════════════════════════════
#              COMPLAINT PDF
# ════════════════════════════════════════════

def generate_complaint_pdf(data: dict, complaint_text: str) -> bytes:
    """
    Complaint PDF banao.
    data format:
    {
        'tracking_number': str,
        'complaint_type': str,
        'complaint_type_display': str
    }
    complaint_text: Bedrock se generate hua formal complaint text
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=3*cm, rightMargin=2.5*cm,
        topMargin=2*cm, bottomMargin=2.5*cm
    )
    styles = _get_styles()
    story  = []

    tracking    = data.get('tracking_number', 'N/A')
    type_display= data.get('complaint_type_display', 'Complaint')

    _add_header(
        story, styles,
        type_display.upper(),
        f"Generated by Nyaya Mitra AI Legal Assistant",
        tracking
    )

    # ── Tracking box ──
    tracking_data = [[
        Paragraph('Tracking Number', styles['bold']),
        Paragraph(tracking, ParagraphStyle(
            'TN', fontSize=12, textColor=BRAND_DARK, fontName='Helvetica-Bold'
        ))
    ]]
    tracking_table = Table(tracking_data, colWidths=[5*cm, 11.7*cm])
    tracking_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BRAND_LIGHT),
        ('GRID', (0, 0), (-1, -1), 1, BRAND_MED),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(tracking_table)
    story.append(Spacer(1, 0.5*cm))

    # ── Complaint text ──
    # Text ko lines mein parse karo
    for line in complaint_text.strip().split('\n'):
        stripped = line.strip()
        if not stripped:
            story.append(Spacer(1, 0.15*cm))
            continue

        # Detect headings (ALL CAPS ya colon ke saath end hone wali lines)
        is_heading = (stripped.isupper() and len(stripped) > 3) or \
                     (stripped.endswith(':') and len(stripped.split()) <= 5)

        if is_heading:
            story.append(Paragraph(stripped, styles['heading']))
        else:
            story.append(Paragraph(stripped, styles['normal']))

    _add_footer(story, styles, tracking)
    doc.build(story)
    return buffer.getvalue()
```

#### PDF Layer Deploy Script — `backend/deploy-pdf-layer.sh`

```bash
#!/bin/bash
set -e
source ../infra/config/.env.shared

echo "Building PDF Layer with ReportLab..."
cd layers/pdf-layer

# Pehle saaf karo
rm -rf python/reportlab* python/Pillow* python/PIL*

# ReportLab install karo layer mein
pip install reportlab --target python/ --quiet --upgrade

echo "Zipping layer..."
zip -r /tmp/pdf-layer.zip python/ -x "*.pyc" "__pycache__/*" > /dev/null

echo "Uploading to AWS Lambda..."
LAYER_ARN=$(aws lambda publish-layer-version \
  --layer-name nyaya-mitra-pdf \
  --description "ReportLab PDF generation for Nyaya Mitra" \
  --zip-file fileb:///tmp/pdf-layer.zip \
  --compatible-runtimes python3.11 \
  --region ap-south-1 \
  --query 'LayerVersionArn' \
  --output text)

rm /tmp/pdf-layer.zip
echo ""
echo "✅ PDF Layer deployed!"
echo "Layer ARN: $LAYER_ARN"
echo ""
echo "IMPORTANT: .env.shared mein update karo:"
echo "PDF_LAYER_ARN=$LAYER_ARN"
echo ""
echo "Aur Member 1 ko bhi batao taaki wo baaki sab ko share kar sake."

cd ../..
```

#### `lambdas/documents/timeline_builder/index.py` — Poora File

```python
"""
Timeline Builder
HTTP API: POST /v1/timeline/extract

Kya karta hai:
1. User ki narrative text receive karta hai (chat mein jo bola)
2. Bedrock se chronological events extract karta hai
3. Legal significance identify karta hai
4. Information gaps note karta hai
5. DynamoDB mein save karta hai

Cost: ~$0.01-0.03 per call (800 tokens output)
"""
import boto3
import json
import os
import uuid
from datetime import datetime, timezone

bedrock  = boto3.client('bedrock-runtime', region_name='ap-south-1')
dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')

MODEL_ID     = os.environ.get('BEDROCK_MODEL_ID', 'anthropic.claude-3-5-sonnet-20241022-v2:0')
TABLE_PREFIX = os.environ.get('TABLE_PREFIX', 'nyaya-mitra')
MAX_TOKENS   = int(os.environ.get('MAX_TOKENS_TIMELINE', '800'))

CORS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type'
}

TIMELINE_PROMPT = """You are a legal document analyzer for Indian law cases.
Extract a chronological legal timeline from the narrative below.

Return ONLY valid JSON (no markdown, no extra text):
{{
  "timeline": [
    {{
      "date": "YYYY-MM-DD or estimated like '2024-01 (approx)' or 'Unknown'",
      "event": "Clear description of what happened (max 50 words)",
      "legal_significance": "Why this matters legally (1 sentence, max 30 words)",
      "category": "incident|action|response|deadline|evidence"
    }}
  ],
  "gaps": [
    "Missing information that would strengthen the legal case"
  ],
  "legal_issue_type": "property_dispute|domestic_violence|consumer_fraud|criminal_assault|labor_dispute|cyber_crime|other",
  "summary": "2 sentence summary of the entire legal situation"
}}

Rules:
- Sort events chronologically (oldest first)
- Include ALL mentioned dates/times as events
- Maximum 15 events
- Use "Unknown" for dates not mentioned, but still include the event
- gaps: List 2-5 specific documents or evidence that would help

Narrative:
{narrative}"""

def handler(event, context):
    try:
        body = json.loads(event.get('body', '{}'))
    except Exception:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Invalid JSON'})}

    narrative  = body.get('narrative_text', '').strip()
    session_id = body.get('session_id', '')
    user_id    = body.get('user_id', 'unknown')

    if len(narrative) < 30:
        return {
            'statusCode': 400,
            'headers': CORS,
            'body': json.dumps({'error': 'Please provide more details about your situation (at least 30 characters)'})
        }

    # Bedrock call karo
    try:
        resp = bedrock.invoke_model(
            modelId=MODEL_ID,
            body=json.dumps({
                'anthropic_version': 'bedrock-2023-05-31',
                'max_tokens':        MAX_TOKENS,
                'messages':          [{'role': 'user', 'content': TIMELINE_PROMPT.format(narrative=narrative[:4000])}],
                'temperature':       0.1
            })
        )
        raw = json.loads(resp['body'].read())['content'][0]['text']
        raw = raw.replace('```json', '').replace('```', '').strip()
        extracted = json.loads(raw)
    except json.JSONDecodeError as e:
        return {
            'statusCode': 500,
            'headers': CORS,
            'body': json.dumps({'error': 'Could not extract timeline. Please rephrase with more specific dates and events.'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': CORS,
            'body': json.dumps({'error': f'AI service error: {str(e)}'})
        }

    timeline_id = str(uuid.uuid4())
    now         = datetime.now(timezone.utc)

    # DynamoDB mein save karo
    dynamodb.Table(f'{TABLE_PREFIX}-timelines').put_item(Item={
        'timeline_id':       timeline_id,
        'user_id':           user_id,
        'session_id':        session_id,
        'narrative_text':    narrative[:3000],
        'extracted_timeline':json.dumps(extracted.get('timeline', [])),
        'gaps_identified':   extracted.get('gaps', []),
        'issue_type':        extracted.get('legal_issue_type', 'other'),
        'summary':           extracted.get('summary', ''),
        'created_at':        now.isoformat(),
        'status':            'draft',
        'pdf_s3_url':        None,
        'pdf_presigned_url': None
    })

    return {
        'statusCode': 200,
        'headers': CORS,
        'body': json.dumps({
            'timeline_id': timeline_id,
            'timeline':    extracted.get('timeline', []),
            'gaps':        extracted.get('gaps', []),
            'issue_type':  extracted.get('legal_issue_type', 'other'),
            'summary':     extracted.get('summary', ''),
            'events_count': len(extracted.get('timeline', []))
        })
    }
```

---

### ═══ DAY 2 — Timeline PDF + Complaint Generator ═══
**Target: 8-10 ghante**

#### `lambdas/documents/timeline_pdf_generator/index.py`

```python
"""
Timeline PDF Generator
HTTP API: POST /v1/timeline/export

Kya karta hai:
1. timeline_id se DynamoDB se data fetch karta hai
2. pdf_generator.py se PDF banata hai
3. S3 pe upload karta hai
4. 7-day presigned URL return karta hai

NOTE: pdf-layer (ReportLab) attach hona chahiye is Lambda mein
"""
import boto3
import json
import os
import sys

# PDF layer se import karo
sys.path.insert(0, '/opt/python')
from pdf_generator import generate_timeline_pdf

dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
s3       = boto3.client('s3', region_name='ap-south-1')

TABLE_PREFIX  = os.environ.get('TABLE_PREFIX', 'nyaya-mitra')
DOCS_BUCKET   = os.environ.get('USER_DOCUMENTS_BUCKET', '')

CORS = {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}

def handler(event, context):
    try:
        body = json.loads(event.get('body', '{}'))
    except Exception:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Invalid request'})}

    timeline_id      = body.get('timeline_id', '')
    complainant_name = body.get('complainant_name', '')

    if not timeline_id:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'timeline_id required'})}

    # DynamoDB se fetch karo
    item = dynamodb.Table(f'{TABLE_PREFIX}-timelines').get_item(
        Key={'timeline_id': timeline_id}
    ).get('Item')

    if not item:
        return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Timeline not found'})}

    # PDF generate karo
    try:
        import json as json_mod
        pdf_data = {
            'timeline_id':     timeline_id,
            'issue_type':      item.get('issue_type', 'general'),
            'timeline':        json_mod.loads(item.get('extracted_timeline', '[]')),
            'gaps':            item.get('gaps_identified', []),
            'complainant_name': complainant_name or ''
        }
        pdf_bytes = generate_timeline_pdf(pdf_data)
    except Exception as e:
        return {'statusCode': 500, 'headers': CORS, 'body': json.dumps({'error': f'PDF generation failed: {e}'})}

    # S3 pe upload karo
    user_id = item.get('user_id', 'unknown')
    s3_key  = f"timelines/{user_id}/timeline_{timeline_id}.pdf"

    try:
        s3.put_object(
            Bucket=DOCS_BUCKET,
            Key=s3_key,
            Body=pdf_bytes,
            ContentType='application/pdf',
            ContentDisposition=f'attachment; filename="timeline_{timeline_id[:8]}.pdf"'
        )
    except Exception as e:
        return {'statusCode': 500, 'headers': CORS, 'body': json.dumps({'error': f'S3 upload failed: {e}'})}

    # Presigned URL generate karo (7 days)
    presigned_url = s3.generate_presigned_url(
        'get_object',
        Params={'Bucket': DOCS_BUCKET, 'Key': s3_key},
        ExpiresIn=604800
    )

    # DynamoDB update karo
    dynamodb.Table(f'{TABLE_PREFIX}-timelines').update_item(
        Key={'timeline_id': timeline_id},
        UpdateExpression='SET pdf_s3_url = :s3, pdf_presigned_url = :url, #st = :st',
        ExpressionAttributeNames={'#st': 'status'},
        ExpressionAttributeValues={
            ':s3':  f's3://{DOCS_BUCKET}/{s3_key}',
            ':url': presigned_url,
            ':st':  'finalized'
        }
    )

    return {
        'statusCode': 200,
        'headers': CORS,
        'body': json.dumps({
            'download_url':  presigned_url,
            'expires_in':    '7 days',
            'file_size_kb':  round(len(pdf_bytes) / 1024, 1),
            'events_count':  len(pdf_data['timeline'])
        })
    }
```

#### `lambdas/documents/complaint_generator/index.py`

```python
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

Kya karta hai:
1. User inputs + complaint type receive karta hai
2. Bedrock se formal complaint text generate karta hai
3. pdf_generator se PDF banata hai
4. S3 pe upload karta hai
5. Tracking number + presigned URL return karta hai

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

MODEL_ID     = os.environ.get('BEDROCK_MODEL_ID', 'anthropic.claude-3-5-sonnet-20241022-v2:0')
TABLE_PREFIX = os.environ.get('TABLE_PREFIX', 'nyaya-mitra')
DOCS_BUCKET  = os.environ.get('USER_DOCUMENTS_BUCKET', '')
MAX_TOKENS   = int(os.environ.get('MAX_TOKENS_COMPLAINT', '700'))

CORS = {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}

# ── Complaint Type Configs (hardcoded — Bedrock se dynamic nahi, cost bachao) ──
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
                    for e in events[:10]  # Max 10 events
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

    # Bedrock call
    try:
        resp = bedrock.invoke_model(
            modelId=MODEL_ID,
            body=json.dumps({
                'anthropic_version': 'bedrock-2023-05-31',
                'max_tokens':        MAX_TOKENS,
                'messages':          [{'role': 'user', 'content': prompt}],
                'temperature':       0.2
            })
        )
        complaint_text = json.loads(resp['body'].read())['content'][0]['text'].strip()
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
        'file_size_kb':      round(len(pdf_bytes) / 1024, 1)
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
```

---

### ═══ DAY 3 — Complaint Delivery + Notice Scanner Upload ═══

#### `lambdas/documents/complaint_delivery/index.py`

```python
"""
Complaint Delivery
HTTP API: POST /v1/complaints/deliver

3 delivery methods:
  download → Presigned URL return karo (already hai)
  email    → SES se PDF attach karke bhejo
  sms      → SNS se link bhejo

Cost:
  Email (SES): $0.0001 per email
  SMS (SNS):   $0.02 per SMS (India)
"""
import boto3
import json
import os
import email.mime.multipart
import email.mime.text
import email.mime.application
from datetime import datetime, timezone

ses      = boto3.client('ses', region_name='ap-south-1')
sns      = boto3.client('sns', region_name='ap-south-1')
s3       = boto3.client('s3', region_name='ap-south-1')
dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')

TABLE_PREFIX = os.environ.get('TABLE_PREFIX', 'nyaya-mitra')
DOCS_BUCKET  = os.environ.get('USER_DOCUMENTS_BUCKET', '')
SES_SENDER   = os.environ.get('SES_SENDER_EMAIL', 'noreply@nyayamitra.in')

CORS = {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}

def handler(event, context):
    try:
        body = json.loads(event.get('body', '{}'))
    except Exception:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Invalid request'})}

    complaint_id     = body.get('complaint_id', '')
    delivery_method  = body.get('delivery_method', 'download')
    user_email       = body.get('user_email', '')
    user_phone       = body.get('user_phone', '')

    # Complaint fetch karo
    item = dynamodb.Table(f'{TABLE_PREFIX}-complaints').get_item(
        Key={'complaint_id': complaint_id}
    ).get('Item')

    if not item:
        return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Complaint not found'})}

    tracking  = item['tracking_number']
    s3_key    = item['pdf_s3_url'].replace(f's3://{DOCS_BUCKET}/', '')
    now       = datetime.now(timezone.utc)
    result    = {}

    # ── Method 1: Download (URL already generate hai) ──
    if delivery_method == 'download':
        url = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': DOCS_BUCKET, 'Key': s3_key},
            ExpiresIn=3600   # 1 hour for immediate download
        )
        result = {'status': 'success', 'download_url': url, 'expires_in': '1 hour'}

    # ── Method 2: Email ──
    elif delivery_method == 'email' and user_email:
        try:
            # PDF bytes fetch karo S3 se
            pdf_bytes = s3.get_object(Bucket=DOCS_BUCKET, Key=s3_key)['Body'].read()

            # MIME message banao
            msg = email.mime.multipart.MIMEMultipart()
            msg['Subject'] = f"Your Legal Document — Tracking: {tracking}"
            msg['From']    = SES_SENDER
            msg['To']      = user_email

            # Body
            body_text = (
                f"Dear User,\n\n"
                f"Please find your legal document attached.\n\n"
                f"Tracking Number: {tracking}\n"
                f"Generated: {now.strftime('%d %B %Y')}\n\n"
                f"IMPORTANT: This document is AI-generated. "
                f"Please review with a qualified lawyer before submission.\n\n"
                f"— Nyaya Mitra Team\n"
                f"Helpline: 15100"
            )
            msg.attach(email.mime.text.MIMEText(body_text))

            # PDF attachment
            att = email.mime.application.MIMEApplication(pdf_bytes)
            att.add_header(
                'Content-Disposition',
                'attachment',
                filename=f"complaint_{tracking}.pdf"
            )
            msg.attach(att)

            ses.send_raw_email(
                Source=SES_SENDER,
                Destinations=[user_email],
                RawMessage={'Data': msg.as_string()}
            )
            result = {'status': 'success', 'sent_to': user_email}
        except Exception as e:
            result = {'status': 'failed', 'error': str(e)}

    # ── Method 3: SMS ──
    elif delivery_method == 'sms' and user_phone:
        try:
            # Short URL banao (presigned URL too long for SMS)
            url = s3.generate_presigned_url(
                'get_object',
                Params={'Bucket': DOCS_BUCKET, 'Key': s3_key},
                ExpiresIn=86400   # 24 hours
            )
            sms_msg = (
                f"Nyaya Mitra: Aapka {item.get('complaint_type','complaint')} tayaar hai!\n"
                f"Tracking: {tracking}\n"
                f"Download (24hr): {url[:100]}..."
            )
            sns.publish(PhoneNumber=f"+91{user_phone.lstrip('0+')}", Message=sms_msg)
            result = {'status': 'success', 'sent_to': f"***{user_phone[-4:]}"}
        except Exception as e:
            result = {'status': 'failed', 'error': str(e)}
    else:
        result = {'status': 'failed', 'error': 'Invalid delivery method or missing contact info'}

    # Status update karo
    if result.get('status') == 'success':
        dynamodb.Table(f'{TABLE_PREFIX}-complaints').update_item(
            Key={'complaint_id': complaint_id},
            UpdateExpression='SET #st = :st, delivery_method = :dm, delivery_at = :ts',
            ExpressionAttributeNames={'#st': 'status'},
            ExpressionAttributeValues={
                ':st': 'delivered',
                ':dm': delivery_method,
                ':ts': now.isoformat()
            }
        )

    return {
        'statusCode': 200,
        'headers': CORS,
        'body': json.dumps({**result, 'tracking_number': tracking, 'timestamp': now.isoformat()})
    }
```

#### `lambdas/documents/notice_scanner/index.py`

```python
"""
Notice Scanner — Upload Handler
HTTP API: POST /v1/notices/upload

Kya karta hai:
1. Base64 file receive karta hai (PDF ya image)
2. S3 pe upload karta hai
3. notice_analysis Lambda ko async trigger karta hai
4. notice_id return karta hai (frontend isko poll karega)

GET /v1/notices/{notice_id}/analysis → DynamoDB se analysis status fetch
"""
import boto3
import base64
import json
import os
import uuid
from datetime import datetime, timezone

s3       = boto3.client('s3', region_name='ap-south-1')
lmb      = boto3.client('lambda', region_name='ap-south-1')
dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')

TABLE_PREFIX    = os.environ.get('TABLE_PREFIX', 'nyaya-mitra')
UPLOADS_BUCKET  = os.environ.get('USER_UPLOADS_BUCKET', '')

CORS = {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}

def get_notice_status(event, context):
    """GET /v1/notices/{notice_id}/analysis"""
    notice_id = event.get('pathParameters', {}).get('notice_id', '')
    if not notice_id:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'notice_id required'})}

    item = dynamodb.Table(f'{TABLE_PREFIX}-scanned-notices').get_item(
        Key={'notice_id': notice_id}
    ).get('Item')

    if not item:
        return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Notice not found'})}

    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(item, default=str)}

def handler(event, context):
    # GET request → status check
    if event.get('requestContext', {}).get('http', {}).get('method') == 'GET':
        return get_notice_status(event, context)

    # POST request → upload
    try:
        body      = json.loads(event.get('body', '{}'))
        file_data = body.get('file_data', '')    # Base64 encoded
        file_name = body.get('file_name', 'notice.pdf')
        file_type = body.get('file_type', 'application/pdf')
        user_id   = body.get('user_id', 'unknown')
    except Exception:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Invalid request'})}

    if not file_data:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'No file data provided'})}

    # Validate file size (max 5MB)
    try:
        file_bytes = base64.b64decode(file_data)
    except Exception:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Invalid base64 data'})}

    if len(file_bytes) > 5 * 1024 * 1024:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'File too large (max 5MB)'})}

    notice_id = str(uuid.uuid4())
    s3_key    = f"notices/{user_id}/{notice_id}_{file_name}"
    now       = datetime.now(timezone.utc)

    # S3 upload
    try:
        s3.put_object(
            Bucket=UPLOADS_BUCKET,
            Key=s3_key,
            Body=file_bytes,
            ContentType=file_type
        )
    except Exception as e:
        return {'statusCode': 500, 'headers': CORS, 'body': json.dumps({'error': f'Upload failed: {e}'})}

    # DynamoDB initial record
    dynamodb.Table(f'{TABLE_PREFIX}-scanned-notices').put_item(Item={
        'notice_id':          notice_id,
        'user_id':            user_id,
        'file_name':          file_name,
        'upload_timestamp':   now.isoformat(),
        's3_document_url':    f's3://{UPLOADS_BUCKET}/{s3_key}',
        'processing_status':  'processing',
        'status':             'pending_analysis',
        'file_size_kb':       round(len(file_bytes) / 1024, 1)
    })

    # Async analysis trigger
    lmb.invoke(
        FunctionName='nyaya-mitra-notice-analysis',
        InvocationType='Event',
        Payload=json.dumps({
            'notice_id': notice_id,
            'user_id':   user_id,
            's3_bucket': UPLOADS_BUCKET,
            's3_key':    s3_key,
            'file_type': file_type
        })
    )

    return {
        'statusCode': 202,
        'headers': CORS,
        'body': json.dumps({
            'notice_id':         notice_id,
            'processing_status': 'processing',
            'poll_after_ms':     3000,
            'poll_url':          f'/v1/notices/{notice_id}/analysis',
            'message':           'Document uploaded. Analysis will be ready in 30-60 seconds.'
        })
    }
```

---

### ═══ DAY 4 — Notice Analysis Pipeline ═══
**Target: 8-10 ghante | Goal: Textract + Bedrock se complete notice analysis**

#### `lambdas/documents/notice_analysis/index.py`

```python
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

MODEL_ID     = os.environ.get('BEDROCK_MODEL_ID', 'anthropic.claude-3-5-sonnet-20241022-v2:0')
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

    # Notice type (max 25)
    type_scores = {
        'Court Summons':    25,
        'Government Notice':22,
        'Bank Notice':      18,
        'Recovery Notice':  18,
        'Legal Notice':     15,
        'Demand Letter':    12,
        'Other':            8
    }
    score += type_scores.get(analysis.get('notice_type', 'Other'), 8)

    # Deadline urgency (max 25)
    deadline_scores = {
        'OVERDUE':   25,
        'TODAY':     25,
        'CRITICAL':  22,
        'URGENT':    18,
        'IMPORTANT': 12,
        'NORMAL':    5,
        'UNKNOWN':   10
    }
    score += deadline_scores.get(dl_status.get('status', 'UNKNOWN'), 10)

    # Legal sections cited (max 20)
    sections = analysis.get('legal_sections_cited', [])
    score += min(len(sections) * 5, 20)

    # Consequences severity (max 15)
    consequences = [c.lower() for c in analysis.get('consequences_if_ignored', [])]
    if any('court' in c or 'prosecution' in c or 'arrest' in c for c in consequences):
        score += 15
    elif any('recovery' in c or 'legal action' in c for c in consequences):
        score += 10
    elif consequences:
        score += 5

    # Sender type (max 15)
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

    # ── Step 2: Bedrock Analysis ──
    try:
        resp = bedrock.invoke_model(
            modelId=MODEL_ID,
            body=json.dumps({
                'anthropic_version': 'bedrock-2023-05-31',
                'max_tokens':        MAX_TOKENS,
                'messages':          [{'role': 'user', 'content': NOTICE_ANALYSIS_PROMPT.format(text=extracted_text[:5000])}],
                'temperature':       0.1
            })
        )
        raw = json.loads(resp['body'].read())['content'][0]['text']
        raw = raw.replace('```json', '').replace('```', '').strip()
        analysis = json.loads(raw)
    except json.JSONDecodeError:
        # Fallback
        analysis = {
            'notice_type':               'Unknown',
            'sender_details':            {'name': 'Unknown', 'is_lawyer': False, 'is_court': False, 'is_bank': False},
            'issue_date':                None,
            'response_deadline_date':    None,
            'legal_sections_cited':      [],
            'demands':                   ['Unable to parse document clearly'],
            'consequences_if_ignored':   ['Unknown — please consult a lawyer'],
            'risk_level':                'MEDIUM',
            'risk_reasoning':            'Could not fully analyze. Treat as MEDIUM risk.',
            'recommended_actions':       [{'priority': 'WITHIN_3_DAYS', 'action': 'Consult a lawyer immediately', 'reason': 'Document could not be fully analyzed'}],
            'information_gaps':          ['Full document analysis failed']
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
```

---

### ═══ DAY 5 — Deadline Reminder + Legal Aid + Dashboard ═══

#### `lambdas/documents/deadline_reminder/index.py`

```python
"""
Deadline Reminder Scheduler
EventBridge cron rules banata hai:
  1. Midpoint reminder (deadline ka aadha time beeche)
  2. 2 din pehle reminder
  3. Deadline ke din reminder

NOTE: Actual notification (push/SMS) yahan nahi hoti —
EventBridge rule sirf schedule karti hai.
Production mein EventBridge → SNS → user hotee.
Demo ke liye sirf scheduling dikhao.
"""
import boto3
import json
import os
from datetime import datetime, timedelta, timezone

events_client = boto3.client('events', region_name='ap-south-1')

def schedule_rule(rule_name: str, target_date: datetime, payload: dict) -> bool:
    """EventBridge cron rule banao"""
    try:
        cron = (
            f"cron({target_date.minute} {target_date.hour} "
            f"{target_date.day} {target_date.month} ? {target_date.year})"
        )
        events_client.put_rule(
            Name=rule_name,
            ScheduleExpression=cron,
            State='ENABLED',
            Description=f"Nyaya Mitra deadline reminder for notice {payload.get('notice_id','')[:8]}"
        )
        return True
    except Exception as e:
        print(f"EventBridge rule failed ({rule_name}): {e}")
        return False

def handler(event, context):
    notice_id    = event.get('notice_id', '')
    deadline_str = event.get('deadline_date', '')
    days_rem     = int(event.get('days_remaining', 0))
    notice_type  = event.get('notice_type', 'Legal Notice')

    if not deadline_str or days_rem <= 0:
        return {'scheduled': 0, 'reason': 'No valid deadline'}

    try:
        deadline = datetime.strptime(deadline_str, '%Y-%m-%d').replace(
            hour=9, minute=0, tzinfo=timezone.utc
        )
    except ValueError:
        return {'scheduled': 0, 'reason': 'Invalid date format'}

    now       = datetime.now(timezone.utc)
    nid_short = notice_id[:8]
    scheduled = 0

    payload = {'notice_id': notice_id, 'notice_type': notice_type}

    # Reminder 1: Midpoint (agar 4+ din hain)
    if days_rem >= 4:
        midpoint = now + timedelta(days=days_rem // 2)
        if schedule_rule(f"nyaya-rem-mid-{nid_short}", midpoint, payload):
            scheduled += 1

    # Reminder 2: 2 din pehle
    if days_rem > 2:
        two_days_before = deadline - timedelta(days=2)
        if two_days_before > now:
            if schedule_rule(f"nyaya-rem-2d-{nid_short}", two_days_before, payload):
                scheduled += 1

    # Reminder 3: Deadline ke din (9 AM)
    if schedule_rule(f"nyaya-rem-due-{nid_short}", deadline, payload):
        scheduled += 1

    print(f"Notice {notice_id}: {scheduled} reminders scheduled for deadline {deadline_str}")
    return {'scheduled': scheduled, 'deadline': deadline_str}
```

#### `lambdas/documents/legal_aid_escalator/index.py`

```python
"""
Legal Aid Escalator
HTTP API: POST /v1/legal-aid/escalate
HTTP API: GET /v1/legal-aid/referrals?state=MH&district=MUMBAI

Kya karta hai:
1. State/district ke basis pe partners dhundho
2. Escalation log banao
3. Matching partners return karo
"""
import boto3
import json
import os
import uuid
from datetime import datetime, timezone

dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')

TABLE_PREFIX = os.environ.get('TABLE_PREFIX', 'nyaya-mitra')

CORS = {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}

def get_referrals(event, context):
    """GET — Partners list karo"""
    params = event.get('queryStringParameters') or {}
    state  = params.get('state', 'MH')

    try:
        resp = dynamodb.Table(f'{TABLE_PREFIX}-legal-aid-partners').query(
            IndexName='state-district-index',
            KeyConditionExpression='#st = :state',
            ExpressionAttributeNames={'#st': 'state'},
            ExpressionAttributeValues={':state': state, ':active': 'active'},
            FilterExpression='availability_status = :active'
        )
        partners = sorted(resp.get('Items', []), key=lambda x: -float(x.get('rating', 0)))
    except Exception as e:
        partners = []

    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'partners': partners}, default=str)}

def handler(event, context):
    method = event.get('requestContext', {}).get('http', {}).get('method', 'POST')
    if method == 'GET':
        return get_referrals(event, context)

    try:
        body = json.loads(event.get('body', '{}'))
    except Exception:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Invalid request'})}

    session_id    = body.get('session_id', '')
    risk_score    = body.get('risk_score', 0)
    location      = body.get('location', {})
    issue_summary = body.get('issue_summary', '')
    language      = body.get('language', 'en')
    state         = location.get('state', 'MH')

    # Partners dhundho
    try:
        resp = dynamodb.Table(f'{TABLE_PREFIX}-legal-aid-partners').query(
            IndexName='state-district-index',
            KeyConditionExpression='#st = :state',
            ExpressionAttributeNames={'#st': 'state'},
            ExpressionAttributeValues={':state': state, ':active': 'active'},
            FilterExpression='availability_status = :active'
        )
        partners = sorted(resp.get('Items', []), key=lambda x: -float(x.get('rating', 0)))[:5]
    except Exception as e:
        partners = []

    esc_id = str(uuid.uuid4())
    now    = datetime.now(timezone.utc)

    dynamodb.Table(f'{TABLE_PREFIX}-escalation-logs').put_item(Item={
        'escalation_id':        esc_id,
        'session_id':           session_id,
        'risk_score':           risk_score,
        'escalation_level':     'HIGH' if risk_score >= 70 else 'MEDIUM',
        'matched_partners':     [p.get('partner_id') for p in partners],
        'location':             location,
        'issue_summary':        issue_summary[:300],
        'escalation_timestamp': now.isoformat(),
        'outcome':              'pending'
    })

    return {
        'statusCode': 200,
        'headers': CORS,
        'body': json.dumps({
            'escalation_id':          esc_id,
            'matched_partners':       partners,
            'expected_response_window': '30 min' if risk_score >= 70 else '24 hours'
        }, default=str)
    }
```

#### `lambdas/documents/dashboard_widgets/index.py`

```python
"""
Dashboard Widgets
HTTP API: GET /v1/dashboard/widgets?state=MH&district=MUMBAI

Returns:
  popular_issues:    Last 30 days ke top issues
  suggested_actions: User ke liye smart suggestions
  legal_updates:     Recent legal news
"""
import boto3
import json
import os
from datetime import datetime, timedelta
from collections import Counter

dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
TABLE_PREFIX = os.environ.get('TABLE_PREFIX', 'nyaya-mitra')

CORS = {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}

STATIC_LEGAL_UPDATES = [
    {
        'date': '2024-12-01',
        'title': 'Supreme Court: Speedy Trial Right',
        'summary': 'Undertrial prisoners entitled to bail if trial delayed beyond reasonable period.',
        'category': 'criminal', 'state': 'Central'
    },
    {
        'date': '2024-11-15',
        'title': 'Consumer Protection: E-commerce Refund Rules Strengthened',
        'summary': 'E-commerce platforms must process refunds within 5 days of return acceptance.',
        'category': 'consumer', 'state': 'Central'
    },
    {
        'date': '2024-11-01',
        'title': 'Digital Personal Data Protection Act Implementation',
        'summary': 'Citizens can now request deletion of their personal data from online platforms.',
        'category': 'cyber', 'state': 'Central'
    },
    {
        'date': '2024-10-20',
        'title': 'Labor Ministry: Gratuity Payment Deadline',
        'summary': 'Employers must pay gratuity within 30 days or pay 10% interest per annum.',
        'category': 'labor', 'state': 'Central'
    }
]

SUGGESTED_ACTIONS = [
    {'action': 'Upload a legal notice for instant AI analysis', 'route': '/notice-scanner', 'icon': 'scan'},
    {'action': 'Generate a police complaint in 2 minutes',      'route': '/complaint-generator?type=police', 'icon': 'document'},
    {'action': 'Build your case timeline with AI',              'route': '/timeline', 'icon': 'timeline'},
    {'action': 'Find free legal aid near you',                  'route': '/legal-aid', 'icon': 'location'},
    {'action': 'File an RTI application online',                'route': '/complaint-generator?type=rti', 'icon': 'rti'}
]

def handler(event, context):
    params   = event.get('queryStringParameters') or {}
    state    = params.get('state', 'MH')
    district = params.get('district', 'MUMBAI')
    key      = f"{state}_{district}"
    since    = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')

    # Popular issues from analytics table
    popular_issues = []
    try:
        resp = dynamodb.Table(f'{TABLE_PREFIX}-complaint-analytics').query(
            KeyConditionExpression='state_district = :k AND #ts > :d',
            ExpressionAttributeNames={'#ts': 'timestamp'},
            ExpressionAttributeValues={':k': key, ':d': since},
            Limit=100
        )
        counts = Counter()
        for item in resp.get('Items', []):
            counts[item.get('issue_type', 'other')] += int(item.get('count', 0))

        issue_names = {
            'property': 'Property Disputes',
            'family':   'Family & Matrimonial',
            'consumer': 'Consumer Rights',
            'criminal': 'Criminal Matters',
            'labor':    'Labour & Employment',
            'cyber':    'Cyber Crime'
        }

        for issue, count in counts.most_common(5):
            popular_issues.append({
                'issue_type':    issue,
                'count':         count,
                'display_name':  issue_names.get(issue, issue.title()),
                'trend':         'up' if count > 30 else 'stable'
            })
    except Exception:
        # Fallback static data
        popular_issues = [
            {'issue_type': 'property',  'count': 234, 'display_name': 'Property Disputes',   'trend': 'up'},
            {'issue_type': 'family',    'count': 189, 'display_name': 'Family & Matrimonial', 'trend': 'stable'},
            {'issue_type': 'consumer',  'count': 156, 'display_name': 'Consumer Rights',      'trend': 'up'},
            {'issue_type': 'criminal',  'count': 98,  'display_name': 'Criminal Matters',     'trend': 'stable'},
            {'issue_type': 'labor',     'count': 76,  'display_name': 'Labour & Employment',  'trend': 'down'},
        ]

    return {
        'statusCode': 200,
        'headers': CORS,
        'body': json.dumps({
            'popular_issues':    popular_issues,
            'suggested_actions': SUGGESTED_ACTIONS,
            'legal_updates':     STATIC_LEGAL_UPDATES,
            'location':          {'state': state, 'district': district},
            'timestamp':         datetime.now().isoformat()
        })
    }
```

---

### ═══ DAY 6 — Create + Deploy Scripts + Testing ═══

#### `backend/create-document-lambdas.sh`

```bash
#!/bin/bash
set -e
source ../infra/config/.env.shared

echo "Creating Document Lambda Functions..."

# PDF Layer ARN check
if [ -z "$PDF_LAYER_ARN" ] || [ "$PDF_LAYER_ARN" = "FILL_AFTER_MEMBER3_DEPLOYS" ]; then
  echo "❌ PDF_LAYER_ARN not set in .env.shared!"
  echo "Run: ./deploy-pdf-layer.sh first, then update .env.shared"
  exit 1
fi

FUNCTIONS=(
  "nyaya-mitra-timeline-builder:documents/timeline_builder:60:256"
  "nyaya-mitra-timeline-pdf:documents/timeline_pdf_generator:60:512"
  "nyaya-mitra-complaint-generator:documents/complaint_generator:90:512"
  "nyaya-mitra-complaint-delivery:documents/complaint_delivery:30:256"
  "nyaya-mitra-notice-scanner:documents/notice_scanner:30:256"
  "nyaya-mitra-notice-analysis:documents/notice_analysis:300:512"
  "nyaya-mitra-deadline-reminder:documents/deadline_reminder:30:128"
  "nyaya-mitra-legal-aid-escalator:documents/legal_aid_escalator:30:256"
  "nyaya-mitra-dashboard-widgets:documents/dashboard_widgets:15:128"
)

echo "def handler(e,c): return {'statusCode':200,'body':'ok'}" > /tmp/d.py
zip /tmp/dummy.zip /tmp/d.py && rm /tmp/d.py

for entry in "${FUNCTIONS[@]}"; do
  IFS=':' read -r FUNC_NAME FOLDER TIMEOUT MEMORY <<< "$entry"

  # Timeline PDF aur Complaint Generator ko PDF layer bhi chahiye
  if [[ "$FUNC_NAME" == *"timeline-pdf"* ]] || [[ "$FUNC_NAME" == *"complaint-generator"* ]]; then
    LAYERS_ARG="$SHARED_LAYER_ARN $PDF_LAYER_ARN"
  else
    LAYERS_ARG="$SHARED_LAYER_ARN"
  fi

  echo -n "Creating $FUNC_NAME..."
  aws lambda create-function \
    --function-name "$FUNC_NAME" \
    --runtime python3.11 \
    --role "$LAMBDA_ROLE_ARN" \
    --handler "index.handler" \
    --zip-file fileb:///tmp/dummy.zip \
    --timeout "$TIMEOUT" \
    --memory-size "$MEMORY" \
    --region ap-south-1 \
    --layers $LAYERS_ARG \
    --environment "Variables={
      TABLE_PREFIX=${TABLE_PREFIX},
      BEDROCK_MODEL_ID=${BEDROCK_MODEL_ID},
      USER_UPLOADS_BUCKET=${USER_UPLOADS_BUCKET},
      USER_DOCUMENTS_BUCKET=${USER_DOCUMENTS_BUCKET},
      TEMPLATES_BUCKET=${TEMPLATES_BUCKET},
      SES_SENDER_EMAIL=${SES_SENDER_EMAIL},
      ESCALATION_TOPIC_ARN=${ESCALATION_TOPIC_ARN},
      MAX_TOKENS_TIMELINE=800,
      MAX_TOKENS_COMPLAINT=700,
      MAX_TOKENS_NOTICE=700
    }" \
    --output text --query 'FunctionName' 2>/dev/null \
    && echo " ✅" || echo " (exists, skip)"
done

rm /tmp/dummy.zip
echo "✅ All document Lambdas created!"
```

#### `backend/deploy-document-lambdas.sh`

```bash
#!/bin/bash
set -e
source ../infra/config/.env.shared

deploy() {
  local FUNC_NAME=$1
  local FOLDER=$2

  echo -n "Deploying $FUNC_NAME..."
  cd lambdas/$FOLDER

  zip -r /tmp/fn.zip . -x "*.pyc" "__pycache__/*" > /dev/null

  aws lambda update-function-code \
    --function-name "$FUNC_NAME" \
    --zip-file fileb:///tmp/fn.zip \
    --region ap-south-1 \
    --output text --query 'FunctionName'

  rm /tmp/fn.zip
  cd ../..
  echo " ✅"
}

echo "Deploying Document Lambdas..."

# Pehle PDF layer deploy karo
./deploy-pdf-layer.sh

deploy "nyaya-mitra-timeline-builder"     "documents/timeline_builder"
deploy "nyaya-mitra-timeline-pdf"         "documents/timeline_pdf_generator"
deploy "nyaya-mitra-complaint-generator"  "documents/complaint_generator"
deploy "nyaya-mitra-complaint-delivery"   "documents/complaint_delivery"
deploy "nyaya-mitra-notice-scanner"       "documents/notice_scanner"
deploy "nyaya-mitra-notice-analysis"      "documents/notice_analysis"
deploy "nyaya-mitra-deadline-reminder"    "documents/deadline_reminder"
deploy "nyaya-mitra-legal-aid-escalator"  "documents/legal_aid_escalator"
deploy "nyaya-mitra-dashboard-widgets"    "documents/dashboard_widgets"

echo ""
echo "✅ All Member 3 Lambdas deployed!"
echo "Update .env.shared with PDF_LAYER_ARN if not done already"
```

---

## 5. LOCAL TESTING

```bash
# Timeline builder test (local — bina AWS ke)
cd backend/lambdas/documents/timeline_builder
python3 -c "
import json
# Bedrock mock karna padega local test ke liye
# Ya seedha deploy karke AWS Console mein test karo
event = {
    'body': json.dumps({
        'narrative_text': 'My neighbor Ravi built a wall on my property boundary in January 2024. I sent him a notice in February but he did not respond. In March 2024 he extended the wall further. I have photos and witnesses.',
        'user_id': 'test_user_001',
        'session_id': 'test_session_001'
    })
}
print('Event ready for testing in AWS Console')
print('Test this via AWS Lambda Console > Test tab')
"

# PDF generation local test (koi AWS nahi chahiye)
cd ../../layers/pdf-layer/python
python3 -c "
from pdf_generator import generate_timeline_pdf
pdf_bytes = generate_timeline_pdf({
    'timeline_id': 'test-123',
    'issue_type': 'property_dispute',
    'timeline': [
        {'date': '2024-01-15', 'event': 'Neighbor built wall', 'legal_significance': 'Encroachment started', 'category': 'incident'},
        {'date': '2024-02-10', 'event': 'Sent legal notice', 'legal_significance': 'Formal notice served', 'category': 'action'}
    ],
    'gaps': ['Survey report missing', 'Sale deed not mentioned']
})
with open('/tmp/test_timeline.pdf', 'wb') as f:
    f.write(pdf_bytes)
print(f'PDF generated: {len(pdf_bytes)} bytes')
print('Open /tmp/test_timeline.pdf to check')
"
```

---

## 6. COST BREAKDOWN — TUMHARA CONTRIBUTION

| Service | Usage | Cost/month |
|---|---|---|
| Bedrock Claude | Timeline (800t × 30 calls) | ~$7 |
| Bedrock Claude | Complaints (700t × 50 calls) | ~$10 |
| Bedrock Claude | Notice analysis (700t × 20 calls) | ~$4 |
| AWS Textract | Notice text extraction (demo) | ~$3 |
| SES | Email delivery (demo) | ~$1 |
| SNS | SMS delivery (demo) | ~$2 |
| Lambda | 9 functions | ~$2 |
| S3 | PDFs + uploads storage | ~$1 |
| **Member 3 total** | | **~$30** |

---

## 7. FINAL CHECKLIST

```
[ ] Folder structure complete banaya
[ ] pdf-layer/python/ mein ReportLab install kiya
[ ] deploy-pdf-layer.sh run kiya — PDF_LAYER_ARN .env.shared mein update kiya
[ ] create-document-lambdas.sh run kiya — sab 9 functions create hue
[ ] deploy-document-lambdas.sh run kiya — actual code deploy hua
[ ] timeline-builder: Narrative se JSON events extract hote hain
[ ] timeline-pdf-generator: PDF S3 pe jaati hai, presigned URL milta hai
[ ] Local PDF test: /tmp/test_timeline.pdf achi dikhti hai
[ ] complaint-generator: Tracking number NYM-XX-XXX-YYYYMMDD-XXXX format mein
[ ] complaint-generator: PDF S3 pe upload hoti hai
[ ] complaint-delivery: Download URL milta hai
[ ] complaint-delivery: SES email bheji (pehle SES mein email verify karo)
[ ] notice-scanner: File S3 pe upload hoti hai, notice_id milta hai, processing_status: 'processing'
[ ] notice-analysis: Textract text extract karta hai
[ ] notice-analysis: Bedrock analysis JSON valid hai
[ ] notice-analysis: Deadline status correctly calculate hoti hai (OVERDUE/URGENT/IMPORTANT/NORMAL)
[ ] notice-analysis: Risk score 0-100 sahi calculate hota hai
[ ] deadline-reminder: EventBridge rules create hote hain
[ ] legal-aid-escalator: Partners DynamoDB se match hote hain
[ ] dashboard-widgets: JSON response mein popular_issues + suggested_actions + legal_updates hain
[ ] Sab Lambda responses mein CORS headers hain
[ ] SES: sender email verified hai AWS SES mein
```
