# ╔══════════════════════════════════════════════════════════════╗
# ║         NYAYA MITRA — MEMBER 2 DETAILED REPORT             ║
# ║         AI Chat Pipeline & Intelligence Engine              ║
# ║         Budget Version: ~$100 Total Project Budget          ║
# ╚══════════════════════════════════════════════════════════════╝

---

## 1. TUMHARA ROLE KYA HAI

Tum is project ki **dhadkan** ho. Jab ek user apni legal problem type karta hai ya bolke batata hai, tumhara poora backend pipeline us message ko samajhta hai, legal knowledge base se jawab dhundhta hai, risk assess karta hai, aur real-time WebSocket ke zariye user ko jawab bhejta hai.

**Tumhara scope:**
- Poora WebSocket real-time chat backend
- Intent classification (kya pooch raha hai user?)
- Risk scoring (kitna urgent/dangerous hai?)
- S3-based RAG retrieval (Kendra replace — legal docs S3 se padho)
- Bedrock Claude se RAG answer generate karna
- Confidence scoring (kitna reliable hai jawab?)
- Escalation (high risk cases alert)
- Fact extraction (conversation se structured data)
- Action recommendation (user ko kya karna chahiye)
- Voice input (Transcribe) + Voice output (Polly)
- Session aur guest limit management

**Kendra kyun nahi:**
Kendra akele $810/month tha — poora $100 budget wahan chala jaata. Tumhara `s3_rag_retriever` Lambda seedha S3 se `.txt` legal documents padhega, keyword matching se relevant docs select karega, aur Bedrock ko context dega. Demo ke liye quality bilkul sufficient hai.

**Budget mein tumhara contribution:** ~$43/month

**Dependency:** Member 1 ka poora kaam pehle complete hona chahiye. Unse lo:
- `.env.shared` file
- Shared Lambda Layer ARN
- Confirmation ki legal docs S3 pe upload ho gayi hain

---

## 2. COMPLETE FILE STRUCTURE

```
nyaya-mitra/
│
├── backend/
│   ├── lambdas/
│   │   │
│   │   ├── chat/                                  ← TUMHARA MAIN FOLDER
│   │   │   │
│   │   │   ├── websocket_connect/
│   │   │   │   └── index.py                       ← WS connect handler
│   │   │   │
│   │   │   ├── websocket_disconnect/
│   │   │   │   └── index.py                       ← WS disconnect handler
│   │   │   │
│   │   │   ├── message_orchestrator/
│   │   │   │   ├── index.py                       ← MAIN PIPELINE (sabse bada function)
│   │   │   │   └── requirements.txt
│   │   │   │
│   │   │   ├── intent_classifier/
│   │   │   │   └── index.py                       ← Domain + urgency + sentiment
│   │   │   │
│   │   │   ├── risk_scorer/
│   │   │   │   └── index.py                       ← 0-100 risk score
│   │   │   │
│   │   │   ├── s3_rag_retriever/
│   │   │   │   └── index.py                       ← Kendra replace — S3 se docs fetch
│   │   │   │
│   │   │   ├── bedrock_generator/
│   │   │   │   └── index.py                       ← RAG answer with citations
│   │   │   │
│   │   │   ├── confidence_calculator/
│   │   │   │   └── index.py                       ← Answer reliability score
│   │   │   │
│   │   │   ├── escalation_router/
│   │   │   │   └── index.py                       ← HIGH risk → legal aid alert
│   │   │   │
│   │   │   ├── fact_extractor/
│   │   │   │   └── index.py                       ← Conversation se structured facts
│   │   │   │
│   │   │   └── action_recommender/
│   │   │       └── index.py                       ← Next steps suggest karo
│   │   │
│   │   ├── entry/
│   │   │   └── session_handler/
│   │   │       └── index.py                       ← Session create/validate
│   │   │
│   │   └── voice/
│   │       ├── voice_input_handler/
│   │       │   └── index.py                       ← Audio → Transcribe → text
│   │       └── text_to_speech/
│   │           └── index.py                       ← Text → Polly → audio
│   │
│   ├── create-chat-lambdas.sh                     ← Sab Lambda functions AWS pe create
│   └── deploy-chat-lambdas.sh                     ← Code deploy/update karo
│
└── (baaki folders Member 1, 3, 4 ke hain — mat chhuo)
```

---

## 3. PIPELINE FLOW — SAMJHO PEHLE, CODE BAAD MEIN

```
User sends message via WebSocket
         │
         ▼
┌─────────────────────────────┐
│    ws-connect (connect)     │  ← Connection DynamoDB mein save
│  message-orchestrator (msg) │  ← MAIN FUNCTION — sab invoke karta hai
│  ws-disconnect (disconnect) │  ← Connection delete
└─────────────────────────────┘
         │
         ▼  message-orchestrator ke andar yeh order mein:
         │
         ├─→ [1] intent-classifier        → domain, urgency, sentiment
         │
         ├─→ [2] risk-scorer              → 0-100 score, LOW/MEDIUM/HIGH
         │
         ├─→ [3] escalation-router        → (sirf HIGH risk pe, ASYNC)
         │
         ├─→ [4] s3-rag-retriever         → S3 se legal docs fetch
         │
         ├─→ [5] bedrock-generator        → RAG answer with citations
         │
         ├─→ [6] confidence-calculator    → 0-100 confidence score
         │
         ├─→ [7] fact-extractor           → (ASYNC, user wait nahi karta)
         │
         └─→ [8] action-recommender       → (sirf medium/high risk pe)
                  │
                  ▼
         WebSocket pe user ko response send → Done!
```

---

## 4. KAHAN SE START KARO

```
DAY 1: Setup + WebSocket handlers + Session handler
DAY 2: Intent classifier + Risk scorer
DAY 3: S3 RAG retriever + Bedrock generator + Confidence calculator
DAY 4: Message orchestrator (sab jodo)
DAY 5: Escalation + Fact extractor + Action recommender
DAY 6: Voice handlers + Deploy scripts + Testing
```

---

## 5. DAY-BY-DAY DETAILED PLAN

### ═══ DAY 1 — Setup + WebSocket + Session Handler ═══
**Target: 8-10 ghante | Goal: WebSocket connect/disconnect kaam kare, session bane**

#### Step 1: Environment Setup

```bash
# .env.shared Member 1 se lo
cd backend
cp ../infra/config/.env.shared .env.shared

# Python virtual env banao (testing ke liye)
python3 -m venv venv
source venv/bin/activate
pip install boto3 aws-lambda-powertools

# Folder structure banao
mkdir -p lambdas/chat/websocket_connect
mkdir -p lambdas/chat/websocket_disconnect
mkdir -p lambdas/chat/message_orchestrator
mkdir -p lambdas/chat/intent_classifier
mkdir -p lambdas/chat/risk_scorer
mkdir -p lambdas/chat/s3_rag_retriever
mkdir -p lambdas/chat/bedrock_generator
mkdir -p lambdas/chat/confidence_calculator
mkdir -p lambdas/chat/escalation_router
mkdir -p lambdas/chat/fact_extractor
mkdir -p lambdas/chat/action_recommender
mkdir -p lambdas/entry/session_handler
mkdir -p lambdas/voice/voice_input_handler
mkdir -p lambdas/voice/text_to_speech
```

#### `lambdas/entry/session_handler/index.py` — Poora File

```python
"""
Session Handler — entry page se session create karta hai.
HTTP API: POST /v1/entry/session
HTTP API: POST /v1/auth/guest

Kya karta hai:
1. Naya session_id generate karta hai
2. DynamoDB sessions table mein save karta hai
3. Guest users ke liye TTL 24 hours set karta hai
4. Frontend ko session_id aur redirect_url deta hai
"""
import boto3
import json
import os
import uuid
from datetime import datetime, timezone

dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
TABLE_PREFIX = os.environ.get('TABLE_PREFIX', 'nyaya-mitra')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Content-Type': 'application/json'
}

def handler(event, context):
    try:
        body = json.loads(event.get('body', '{}'))
    except Exception:
        body = {}

    language  = body.get('language_code', 'en')
    mode      = body.get('mode_selection', 'chat')
    anonymous = body.get('anonymous_mode', True)
    user_id   = body.get('user_id')          # Registered users ke liye
    loc_state = body.get('location_state', '')
    loc_dist  = body.get('location_district', '')

    session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    # Guest = 24 hours TTL, Registered = 7 days TTL
    ttl_seconds = 86400 if anonymous else 604800
    ttl = int(now.timestamp()) + ttl_seconds

    item = {
        'session_id':         session_id,
        'user_id':            user_id or f'guest_{session_id[:8]}',
        'mode':               mode,
        'language':           language,
        'anonymous_mode':     anonymous,
        'stealth_mode':       False,
        'queries_count':      0,
        'location_state':     loc_state,
        'location_district':  loc_dist,
        'created_at':         now.isoformat(),
        'last_activity':      now.isoformat(),
        'ttl':                ttl
    }

    dynamodb.Table(f'{TABLE_PREFIX}-sessions').put_item(Item=item)

    response_body = {
        'session_id':              session_id,
        'redirect_url':            '/dashboard',
        'ui_language':             language,
        'anonymous_mode':          anonymous,
        'query_limit_remaining':   5 if anonymous else 999,
        'stealth_mode_available':  True
    }

    return {
        'statusCode': 200,
        'headers': CORS,
        'body': json.dumps(response_body)
    }
```

#### `lambdas/chat/websocket_connect/index.py` — Poora File

```python
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
```

#### `lambdas/chat/websocket_disconnect/index.py` — Poora File

```python
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
```

---

### ═══ DAY 2 — Intent Classifier + Risk Scorer ═══
**Target: 8-10 ghante | Goal: Message ka domain aur risk samjho**

#### `lambdas/chat/intent_classifier/index.py` — Poora File

```python
"""
Intent Classifier
Kya karta hai:
1. User ka message padhta hai
2. Domain classify karta hai (property/family/consumer/criminal/labor/cyber)
3. Urgency detect karta hai (LOW/MEDIUM/HIGH)
4. Intent classify karta hai (SeekAdvice/FileComplaint/GenerateDoc/Emergency)
5. AWS Comprehend se sentiment nikalta hai

Cost: ~$0.0001 per call (Comprehend)
"""
import boto3
import os

comprehend = boto3.client('comprehend', region_name='ap-south-1')

# ── Domain Keywords ──
# Jitne zyada keywords match karein, usi domain ka score badhega
DOMAIN_KEYWORDS = {
    'property': [
        'property', 'land', 'plot', 'boundary', 'wall', 'fence', 'encroach',
        'survey', 'title', 'deed', 'registration', 'registry', 'rent', 'tenant',
        'landlord', 'eviction', 'possession', 'zameen', 'makaan', 'kiraya',
        'benami', 'mutation', 'khasra', 'girdawari', 'partition', 'inheritance'
    ],
    'family': [
        'divorce', 'separation', 'marriage', 'husband', 'wife', 'custody',
        'child', 'alimony', 'maintenance', 'dowry', 'domestic violence',
        'cruelty', '498a', 'talaq', 'nafaqa', 'shaadi', 'vivah', 'talaaq',
        'dv act', 'protection order', 'stridhan'
    ],
    'consumer': [
        'consumer', 'product', 'defect', 'refund', 'warranty', 'guarantee',
        'fraud', 'cheating', 'online', 'amazon', 'flipkart', 'ecommerce',
        'service', 'hospital', 'school', 'builder', 'developer', 'grahak',
        'ghatiya', 'naqli', 'dhoka', 'vapas', 'money back'
    ],
    'criminal': [
        'theft', 'robbery', 'assault', 'murder', 'kidnap', 'arrest', 'bail',
        'fir', 'police', 'accused', 'witness', 'jail', 'prison', 'chargesheet',
        'chori', 'maar', 'dacoity', 'kidnapping', 'extortion', 'blackmail',
        'threat', 'dhamki', 'hathiyar'
    ],
    'labor': [
        'salary', 'wage', 'job', 'termination', 'fired', 'dismiss', 'employer',
        'employee', 'provident', 'pf', 'esic', 'esi', 'gratuity', 'bonus',
        'leave', 'maternity', 'overtime', 'minimum wage', 'naukri', 'mazdoor',
        'shramik', 'chhutayi', 'barkhaast', 'rozgaar'
    ],
    'cyber': [
        'cyber', 'online fraud', 'hacking', 'phishing', 'otp', 'upi', 'payment',
        'social media', 'facebook', 'whatsapp', 'instagram', 'fake', 'account',
        'password', 'sextortion', 'morphing', 'screenshot', 'leak', 'virus',
        'malware', 'ransom', 'bitcoin', 'crypto', 'cybercrime'
    ]
}

URGENCY_HIGH = [
    'urgent', 'emergency', 'immediately', 'today', 'right now', 'asap',
    'danger', 'threat', 'help', 'please help', 'abhi', 'turant', 'jaldi',
    'madad', 'khatara', 'bachao', 'kal tak', 'notice mila', 'police aayi',
    'arrest', 'notice period', 'deadline'
]

URGENCY_MEDIUM = [
    'soon', 'this week', 'quickly', 'fast', 'worried', 'concerned',
    'is week', 'few days', 'kuch din'
]

INTENT_MAP = {
    'FileComplaint': [
        'file complaint', 'register fir', 'fir kaise', 'complaint kaise',
        'report karna', 'complain', 'case darna', 'case file'
    ],
    'GenerateDocument': [
        'draft', 'write', 'create', 'generate', 'legal notice', 'rti',
        'application', 'banao', 'likhna', 'document chahiye'
    ],
    'EmergencyHelp': [
        'emergency', 'danger', 'threat', 'violence', 'help me now',
        'khatara', 'maar raha', 'danger mein', 'bachao'
    ],
    'SeekLegalAdvice': []   # Default
}

def handler(event, context):
    text     = event.get('text', '')
    language = event.get('language', 'en')
    text_l   = text.lower()

    # ── Comprehend Sentiment ──
    lang_code = 'hi' if language == 'hi' else 'en'
    try:
        sent_resp = comprehend.detect_sentiment(
            Text=text[:4900],      # Comprehend 5000 char limit
            LanguageCode=lang_code
        )
        sentiment        = sent_resp['Sentiment']
        sentiment_scores = sent_resp['SentimentScore']
    except Exception as e:
        print(f"Comprehend error (non-fatal): {e}")
        sentiment        = 'NEUTRAL'
        sentiment_scores = {}

    # ── Domain Scoring ──
    domain_scores = {}
    for domain, keywords in DOMAIN_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text_l)
        domain_scores[domain] = score

    top_score  = max(domain_scores.values())
    domain     = max(domain_scores, key=domain_scores.get) if top_score > 0 else 'general'
    confidence = min(top_score * 20, 100)   # 0-100 scale

    # ── Urgency ──
    urgency_score  = sum(3 for kw in URGENCY_HIGH if kw in text_l)
    urgency_score += sum(1 for kw in URGENCY_MEDIUM if kw in text_l)

    # Negative sentiment bhi urgency add karta hai
    if sentiment in ['NEGATIVE', 'MIXED']:
        urgency_score += 2

    if urgency_score >= 6:    urgency = 'HIGH'
    elif urgency_score >= 3:  urgency = 'MEDIUM'
    else:                     urgency = 'LOW'

    # ── Intent ──
    intent = 'SeekLegalAdvice'   # Default
    for intent_name, keywords in INTENT_MAP.items():
        if intent_name == 'SeekLegalAdvice':
            continue
        if any(kw in text_l for kw in keywords):
            intent = intent_name
            break

    return {
        'intent':           intent,
        'domain':           domain,
        'domain_scores':    domain_scores,
        'domain_confidence': confidence,
        'urgency':          urgency,
        'urgency_score':    urgency_score,
        'sentiment':        sentiment,
        'sentiment_scores': sentiment_scores
    }
```

#### `lambdas/chat/risk_scorer/index.py` — Poora File

```python
"""
Risk Scorer
0 se 100 tak risk score deta hai.
Score ke basis pe action decide hota hai:
  0-39:  LOW   → Self help
  40-69: MEDIUM → Legal aid contact suggest
  70-100: HIGH  → Escalate immediately (SNS alert)

4 factors mein score baanta hai:
  Violence indicators  (max 25)
  Self-harm indicators (max 30) — critical
  Timeline urgency     (max 20)
  Vulnerability        (max 10)
  Domain multiplier    (max 15)
"""
import re

# ── Violence ──
VIOLENCE_HIGH = [
    'murder', 'kill', 'rape', 'assault with weapon', 'gun', 'knife', 'acid',
    'hatyaa', 'maar denge', 'jaan se maroonga', 'shoot', 'stab'
]
VIOLENCE_MED = [
    'threat', 'harm', 'hurt', 'beat', 'slap', 'abuse', 'violence',
    'dhamki', 'nuksaan', 'maara', 'pitaai', 'maar raha'
]

# ── Self-harm / Suicidal ──
SELFHARM = [
    'suicide', 'kill myself', 'end my life', 'no reason to live', 'want to die',
    'khatam kar loon', 'jee nahi chahta', 'mar jaana chahta hoon',
    'zindagi khatam', 'nahi rehna', 'aatmahatya'
]

# ── Vulnerability Indicators ──
# Ye log zyada vulnerable hote hain — score badhta hai
VULNERABILITY = [
    'woman', 'female', 'girl', 'pregnant', 'child', 'minor', 'kid',
    'senior', 'elderly', 'old', 'disabled', 'handicapped', 'widow',
    'aurat', 'mahila', 'ladki', 'baccha', 'budhapa', 'divyang'
]

# ── High-risk domains ──
HIGH_RISK_DOMAINS = {'criminal', 'family'}
MED_RISK_DOMAINS  = {'property', 'labor'}

def handler(event, context):
    text   = event.get('text', '').lower()
    urgency = event.get('urgency', 'LOW')
    domain  = event.get('domain', 'general')

    breakdown = {}

    # Factor 1: Violence (max 25)
    v_score  = sum(10 for kw in VIOLENCE_HIGH if kw in text)
    v_score += sum(5  for kw in VIOLENCE_MED  if kw in text)
    breakdown['violence'] = min(v_score, 25)

    # Factor 2: Self-harm (max 30 — most critical)
    # Sirf ek word mile toh bhi 30 points
    sh_score = 30 if any(kw in text for kw in SELFHARM) else 0
    breakdown['selfharm'] = sh_score

    # Factor 3: Timeline urgency (max 20)
    t_score = 0
    if urgency == 'HIGH':
        t_score += 10
    elif urgency == 'MEDIUM':
        t_score += 5

    # Specific deadline words
    if any(kw in text for kw in ['today', 'deadline', 'last date', 'abhi', 'kal tak', 'turant']):
        t_score += 8
    if any(kw in text for kw in ['notice mila', 'summons', 'warrant', 'court date']):
        t_score += 8

    # "X days" mein agar X <= 3 hai
    days_match = re.search(r'(\d+)\s*days?', text)
    if days_match and int(days_match.group(1)) <= 3:
        t_score += 5

    breakdown['timeline_urgency'] = min(t_score, 20)

    # Factor 4: Vulnerability (max 10)
    v_score = sum(2 for kw in VULNERABILITY if kw in text)
    breakdown['vulnerability'] = min(v_score, 10)

    # Domain multiplier (max 15)
    if domain in HIGH_RISK_DOMAINS:
        breakdown['domain_risk'] = 15
    elif domain in MED_RISK_DOMAINS:
        breakdown['domain_risk'] = 7
    else:
        breakdown['domain_risk'] = 0

    total = min(sum(breakdown.values()), 100)

    if total >= 70:
        level  = 'HIGH'
        action = 'ESCALATE_IMMEDIATELY'
    elif total >= 40:
        level  = 'MEDIUM'
        action = 'SUGGEST_LEGAL_AID'
    else:
        level  = 'LOW'
        action = 'SELF_HELP'

    return {
        'risk_score':         total,
        'risk_level':         level,
        'recommended_action': action,
        'breakdown':          breakdown,
        'selfharm_detected':  breakdown['selfharm'] > 0
    }
```

---

### ═══ DAY 3 — S3 RAG + Bedrock Generator + Confidence ═══
**Target: 8-10 ghante | Goal: Legal documents se jawab generate ho**

#### `lambdas/chat/s3_rag_retriever/index.py` — Poora File

```python
"""
S3 RAG Retriever — Kendra ki jagah
Kya karta hai:
1. User ke domain ke hisab se relevant .txt files select karta hai
2. S3 se un files ko padhta hai
3. Keyword relevance score nikalta hai
4. Top 3 most relevant passages return karta hai

Yeh Bedrock generator ko context deta hai.
Files Member 1 ne upload ki hain: s3://nyaya-mitra-legal-corpus-<account>/corpus/
"""
import boto3
import os
import re

s3 = boto3.client('s3', region_name='ap-south-1')
LEGAL_CORPUS_BUCKET = os.environ.get('LEGAL_CORPUS_BUCKET', '')

# ── Domain se relevant files ka mapping ──
# Har domain ke liye konse files padhne chahiye
DOMAIN_FILES = {
    'property':  ['property_guide.txt', 'consumer_protection.txt'],
    'family':    ['ipc_498a.txt', 'property_guide.txt'],
    'consumer':  ['consumer_protection.txt'],
    'criminal':  ['ipc_498a.txt', 'cyber_crime.txt'],
    'labor':     ['labor_laws.txt', 'consumer_protection.txt'],
    'cyber':     ['cyber_crime.txt'],
    'general':   ['consumer_protection.txt', 'property_guide.txt', 'rti_guide_hi.txt'],
}

# Cache — ek Lambda invocation mein same file dobara mat padhna
_doc_cache = {}

def load_doc(filename: str) -> dict | None:
    """S3 se ek document load karo (with in-memory cache)"""
    if filename in _doc_cache:
        return _doc_cache[filename]

    try:
        obj = s3.get_object(
            Bucket=LEGAL_CORPUS_BUCKET,
            Key=f'corpus/{filename}'
        )
        raw = obj['Body'].read().decode('utf-8')

        # Parse metadata — file ke top mein KEY: VALUE format mein hain
        lines = raw.strip().split('\n')
        metadata = {}
        text_lines_start = 0

        for i, line in enumerate(lines):
            if ': ' in line and i < 8:
                key, val = line.split(': ', 1)
                metadata[key.strip()] = val.strip()
            else:
                text_lines_start = i
                break

        content = '\n'.join(lines[text_lines_start:]).strip()

        doc = {
            'filename': filename,
            'title':    metadata.get('TITLE', filename.replace('.txt', '').replace('_', ' ').title()),
            'category': metadata.get('CATEGORY', 'general'),
            'language': metadata.get('LANGUAGE', 'en'),
            'keywords': metadata.get('KEYWORDS', '').split(', '),
            'content':  content
        }

        _doc_cache[filename] = doc
        return doc

    except Exception as e:
        print(f"S3 load error for {filename}: {e}")
        return None

def compute_relevance(doc: dict, query: str, language: str) -> float:
    """
    Keyword-based relevance score (0.0 to 1.0).
    Kendra ki jagah yeh simple scoring use karenge.
    """
    query_words = set(re.findall(r'\w+', query.lower()))
    text_lower  = doc['content'].lower()

    # Query words kitni baar content mein aate hain
    word_matches = sum(1 for w in query_words if w in text_lower and len(w) > 3)

    # Keyword metadata match
    kw_matches = sum(1 for kw in doc['keywords'] if kw.lower() in query.lower())

    # Language bonus — user Hindi mein pooch raha hai aur doc Hindi mein hai
    lang_bonus = 0.2 if (language == 'hi' and doc['language'] == 'hi') else 0

    score = (word_matches / max(len(query_words), 1)) * 0.6 + \
            (kw_matches / max(len(doc['keywords']), 1)) * 0.4 + \
            lang_bonus

    return min(score, 1.0)

def extract_relevant_passage(content: str, query: str, max_chars: int = 600) -> str:
    """
    Pure content mein se most relevant section nikalo.
    Sirf top 600 chars nahi — relevant section dhundho.
    """
    query_words = set(re.findall(r'\w+', query.lower()))

    # Content ko paragraphs mein tod do
    paragraphs = [p.strip() for p in content.split('\n\n') if len(p.strip()) > 50]

    if not paragraphs:
        return content[:max_chars]

    # Har paragraph ka score nikalo
    para_scores = []
    for para in paragraphs:
        para_lower = para.lower()
        score = sum(1 for w in query_words if w in para_lower and len(w) > 3)
        para_scores.append((score, para))

    # Top paragraphs sort karo by score
    para_scores.sort(key=lambda x: -x[0])

    # Top paragraphs leke max_chars mein fit karo
    result = ''
    for _, para in para_scores:
        if len(result) + len(para) + 2 <= max_chars:
            result += para + '\n\n'
        else:
            break

    return result.strip() or content[:max_chars]

def handler(event, context):
    query    = event.get('text', '')
    language = event.get('language', 'en')
    domain   = event.get('domain', 'general')

    # Domain ke hisab se files select karo
    target_files = list(DOMAIN_FILES.get(domain, DOMAIN_FILES['general']))

    # Hindi users ke liye Hindi guide bhi add karo
    if language == 'hi' and 'rti_guide_hi.txt' not in target_files:
        target_files.append('rti_guide_hi.txt')

    # Documents load + score karo
    scored_docs = []
    for filename in target_files:
        doc = load_doc(filename)
        if doc:
            score = compute_relevance(doc, query, language)
            scored_docs.append({**doc, 'relevance_score_raw': score})

    # Relevance ke order mein sort, top 3 lo
    scored_docs.sort(key=lambda x: -x['relevance_score_raw'])
    top_docs = scored_docs[:3]

    # Response format karo
    passages  = []
    citations = []

    for i, doc in enumerate(top_docs):
        passage_text = extract_relevant_passage(doc['content'], query, max_chars=600)
        rel_label    = 'HIGH' if doc['relevance_score_raw'] > 0.35 else \
                       'MEDIUM' if doc['relevance_score_raw'] > 0.15 else 'LOW'

        passages.append({
            'index':            i,
            'text':             passage_text,
            'title':            doc['title'],
            'filename':         doc['filename'],
            'relevance_score':  rel_label,
            'relevance_raw':    round(doc['relevance_score_raw'], 3)
        })
        citations.append({
            'index':    i,
            'source':   doc['title'],
            'category': doc['category'],
            'language': doc['language'],
            'relevance': rel_label
        })

    return {
        'passages':       passages,
        'citations':      citations,
        'docs_searched':  len(target_files),
        'docs_returned':  len(top_docs),
        'domain_used':    domain
    }
```

#### `lambdas/chat/bedrock_generator/index.py` — Poora File

```python
"""
Bedrock Generator — RAG Answer Generator
Kya karta hai:
1. S3 RAG retriever se aaye passages context mein rakho
2. Strict RAG prompt se Bedrock Claude ko call karo
3. Answer extract karo + citation indices nikalo

COST CONTROL:
- max_tokens: 500 (chat ke liye kaafi hai)
- temperature: 0.1 (consistent answers)
- Context max 1500 chars (teen docs × 500 chars each)
"""
import boto3
import json
import os
import re

bedrock = boto3.client('bedrock-runtime', region_name='ap-south-1')
dynamodb = boto3.resource('dynamodb')

MODEL_ID     = os.environ.get('BEDROCK_MODEL_ID', 'anthropic.claude-3-5-sonnet-20241022-v2:0')
TABLE_PREFIX = os.environ.get('TABLE_PREFIX', 'nyaya-mitra')
MAX_TOKENS   = int(os.environ.get('MAX_TOKENS_CHAT', '500'))

# ── Strict RAG Prompt ──
# "Strict" ka matlab: sirf provided context se answer do
# Kuch bhi invent mat karo
STRICT_RAG_PROMPT_EN = """You are Nyaya Mitra, an AI legal assistant for Indian citizens.
Your ONLY job is to help users understand their legal rights and options based on Indian law.

CRITICAL RULES:
1. Answer ONLY using the provided Legal Context below
2. If the answer is NOT in the context, say exactly: "I don't have specific information about this in my legal database. Please consult a lawyer."
3. When you use information from a document, cite it like: [Document 0], [Document 1], etc.
4. Use simple, clear language — explain legal terms in brackets
5. Maximum answer length: 200 words
6. Do NOT make up law sections, case names, or legal provisions not in context
7. Always end with: "This is general legal information, not legal advice. For your specific case, consult a lawyer."

Legal Context:
{context}

User Question: {query}

Answer:"""

STRICT_RAG_PROMPT_HI = """आप न्याय मित्र हैं, भारतीय नागरिकों के लिए एक AI कानूनी सहायक।

महत्वपूर्ण नियम:
1. केवल नीचे दिए गए कानूनी संदर्भ से उत्तर दें
2. यदि उत्तर संदर्भ में नहीं है, तो कहें: "मेरे पास इस बारे में जानकारी नहीं है। कृपया वकील से मिलें।"
3. जब किसी दस्तावेज़ की जानकारी उपयोग करें: [दस्तावेज़ 0], [दस्तावेज़ 1] लिखें
4. सरल भाषा में बताएं — कानूनी शब्द ब्रैकेट में समझाएं
5. अधिकतम 200 शब्द
6. संदर्भ में न हो तो कोई कानून/धारा मत बनाएं

कानूनी संदर्भ:
{context}

प्रश्न: {query}

उत्तर:"""

def get_cache(query: str, domain: str) -> str | None:
    """DynamoDB mein cached answer check karo (repeat questions ke liye cost bachao)"""
    # Simple cache key — first 60 chars + domain
    cache_key = f"cache_{domain}_{query[:60].lower().strip()}".replace(' ', '_')
    try:
        resp = dynamodb.Table(f'{TABLE_PREFIX}-sessions').get_item(
            Key={'session_id': cache_key}
        )
        item = resp.get('Item')
        if item and item.get('cached_answer'):
            return item['cached_answer']
    except Exception:
        pass
    return None

def handler(event, context):
    query    = event.get('text', '')
    passages = event.get('passages', [])
    language = event.get('language', 'en')
    domain   = event.get('domain', 'general')

    # ── No passages case ──
    if not passages:
        no_info = (
            "मुझे इस विषय पर अपने कानूनी डेटाबेस में जानकारी नहीं मिली। "
            "कृपया नजदीकी विधिक सहायता केंद्र से संपर्क करें।"
            if language == 'hi'
            else
            "I don't have specific information about this in my legal database. "
            "Please consult a lawyer or your nearest legal aid office."
        )
        return {
            'answer': no_info,
            'cited_indices': [],
            'from_cache': False
        }

    # ── Build context from passages ──
    # Max 500 chars per passage, 3 passages = max 1500 chars context
    context_parts = []
    for p in passages[:3]:
        excerpt = p.get('text', '')[:500]
        title   = p.get('title', 'Legal Document')
        idx     = p.get('index', 0)
        context_parts.append(f"[Document {idx}] — {title}:\n{excerpt}")

    context_text = '\n\n---\n\n'.join(context_parts)

    # ── Choose prompt language ──
    prompt = (STRICT_RAG_PROMPT_HI if language == 'hi' else STRICT_RAG_PROMPT_EN).format(
        context=context_text,
        query=query
    )

    # ── Bedrock call ──
    resp = bedrock.invoke_model(
        modelId=MODEL_ID,
        body=json.dumps({
            'anthropic_version': 'bedrock-2023-05-31',
            'max_tokens':        MAX_TOKENS,   # Cost control: 500 tokens
            'messages':          [{'role': 'user', 'content': prompt}],
            'temperature':       0.1,          # Consistent, factual answers
            'top_p':             0.9
        })
    )

    body   = json.loads(resp['body'].read())
    answer = body['content'][0]['text'].strip()

    # ── Extract cited document indices ──
    # "[Document 0]" ya "[दस्तावेज़ 1]" patterns dhundho
    cited_indices = list(set(
        int(m) for m in re.findall(r'\[(?:Document|दस्तावेज़)\s*(\d+)\]', answer)
    ))

    return {
        'answer':        answer,
        'cited_indices': cited_indices,
        'tokens_used':   body.get('usage', {}).get('output_tokens', 0),
        'from_cache':    False
    }
```

#### `lambdas/chat/confidence_calculator/index.py` — Poora File

```python
"""
Confidence Calculator
Answer kitna reliable hai — 0 se 100.

4 factors:
  1. Document relevance avg      (40%)
  2. Citations actually used     (30%)
  3. Answer has real content     (20%)
  4. Answer length appropriate   (10%)

Labels:
  90-100: Highly Verified   (green badge)
  75-89:  Verified          (teal badge)
  60-74:  Partially Verified (yellow badge)
  0-59:   Limited Info      (orange badge)
"""

REL_SCORES = {'HIGH': 1.0, 'MEDIUM': 0.6, 'LOW': 0.3}

NO_INFO_PHRASES = [
    "don't have", "not in the context", "no information",
    "नहीं मिली", "जानकारी नहीं", "संदर्भ में नहीं"
]

def handler(event, context):
    passages       = event.get('passages', [])
    cited_indices  = event.get('cited_indices', [])
    answer         = event.get('answer', '')

    if not passages or not answer:
        return {'confidence_score': 0, 'label': 'Limited Information', 'color': 'orange'}

    # Factor 1: Average relevance of retrieved docs (40%)
    avg_rel = sum(
        REL_SCORES.get(p.get('relevance_score', 'LOW'), 0.3)
        for p in passages
    ) / len(passages)

    # Factor 2: Citation usage (30%)
    # Kitne citations actually answer mein use hue
    citation_ratio = min(len(cited_indices) / max(len(passages), 1), 1.0)

    # Factor 3: Has meaningful answer (20%)
    answer_lower  = answer.lower()
    has_no_info   = any(p in answer_lower for p in NO_INFO_PHRASES)
    has_content   = 0.0 if has_no_info else 1.0

    # Factor 4: Answer length appropriate (10%)
    a_len = len(answer)
    if 80 < a_len < 1200:
        length_ok = 1.0
    elif a_len <= 80:
        length_ok = 0.4
    else:
        length_ok = 0.7

    # Weighted score
    score = int(
        avg_rel        * 0.40 +
        citation_ratio * 0.30 +
        has_content    * 0.20 +
        length_ok      * 0.10
    ) * 100

    score = max(0, min(score, 100))

    if score >= 90:
        label, color = 'Highly Verified', 'green'
    elif score >= 75:
        label, color = 'Verified', 'teal'
    elif score >= 60:
        label, color = 'Partially Verified', 'yellow'
    else:
        label, color = 'Limited Information', 'orange'

    return {
        'confidence_score': score,
        'label':            label,
        'color':            color,
        'breakdown': {
            'relevance':        round(avg_rel * 40),
            'citations_used':   round(citation_ratio * 30),
            'has_real_answer':  round(has_content * 20),
            'answer_length':    round(length_ok * 10)
        }
    }
```

---

### ═══ DAY 4 — Message Orchestrator (MAIN PIPELINE) ═══
**Target: 8-10 ghante | Goal: End-to-end pipeline ek message pe kaam kare**

> Yeh sabse important function hai. Agar yeh kaam kare toh baaki sab secondary hai.

#### `lambdas/chat/message_orchestrator/index.py` — Poora File

```python
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

    # ── Validate session ──
    sessions_table = dynamodb.Table(f'{TABLE_PREFIX}-sessions')
    session = sessions_table.get_item(Key={'session_id': session_id}).get('Item')

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
```

#### `lambdas/chat/message_orchestrator/requirements.txt`
```
boto3>=1.28.0
```

---

### ═══ DAY 5 — Escalation + Fact Extractor + Action Recommender ═══
**Target: 8-10 ghante**

#### `lambdas/chat/escalation_router/index.py`

```python
"""
Escalation Router — HIGH risk cases ko legal aid partners ke paas route karta hai.
Invoke: ASYNC (user wait nahi karta)

Kya karta hai:
1. State/district ke basis pe legal aid partners dhundho (DynamoDB query)
2. SNS topic pe alert bhejo
3. Escalation log DynamoDB mein save karo
"""
import boto3
import json
import os
import uuid
from datetime import datetime, timezone

dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
sns      = boto3.client('sns', region_name='ap-south-1')

TABLE_PREFIX          = os.environ.get('TABLE_PREFIX', 'nyaya-mitra')
ESCALATION_TOPIC_ARN  = os.environ.get('ESCALATION_TOPIC_ARN', '')

def handler(event, context):
    session_id      = event.get('session_id', '')
    user_id         = event.get('user_id', 'unknown')
    risk_score      = event.get('risk_score', 0)
    risk_factors    = event.get('risk_factors', [])
    issue_summary   = event.get('issue_summary', '')
    location        = event.get('location', {})
    language        = event.get('language', 'en')
    selfharm        = event.get('selfharm_detected', False)

    state    = location.get('state', 'MH')
    district = location.get('district', '')

    # Legal aid partners dhundho — state ke basis pe
    try:
        resp = dynamodb.Table(f'{TABLE_PREFIX}-legal-aid-partners').query(
            IndexName='state-district-index',
            KeyConditionExpression='#st = :state',
            ExpressionAttributeNames={'#st': 'state'},
            ExpressionAttributeValues={
                ':state': state,
                ':active': 'active'
            },
            FilterExpression='availability_status = :active',
            Limit=5
        )
        partners = sorted(
            resp.get('Items', []),
            key=lambda x: -float(x.get('rating', 0))
        )[:3]
    except Exception as e:
        print(f"Partner query error: {e}")
        partners = []

    escalation_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    # SNS Alert bhejo
    if ESCALATION_TOPIC_ARN:
        alert_msg = (
            f"🚨 HIGH RISK ALERT — Nyaya Mitra\n\n"
            f"Escalation ID: {escalation_id}\n"
            f"Session: {session_id}\n"
            f"Risk Score: {risk_score}/100\n"
            f"Risk Factors: {', '.join(risk_factors)}\n"
            f"Self-harm detected: {'YES ⚠️' if selfharm else 'No'}\n"
            f"Location: {district}, {state}\n"
            f"Language: {language}\n"
            f"Issue: {issue_summary[:300]}\n\n"
            f"Partners notified: {len(partners)}"
        )
        try:
            sns.publish(
                TopicArn=ESCALATION_TOPIC_ARN,
                Message=alert_msg,
                Subject=f"HIGH RISK LEGAL CASE - {state}/{district}"
            )
        except Exception as e:
            print(f"SNS publish error: {e}")

    # Escalation log save karo
    dynamodb.Table(f'{TABLE_PREFIX}-escalation-logs').put_item(Item={
        'escalation_id':      escalation_id,
        'session_id':         session_id,
        'user_id':            user_id,
        'risk_score':         risk_score,
        'escalation_level':   'CRITICAL' if selfharm else 'HIGH',
        'risk_factors':       risk_factors,
        'matched_partners':   [p.get('partner_id') for p in partners],
        'location':           location,
        'selfharm_detected':  selfharm,
        'escalation_timestamp': now.isoformat(),
        'outcome':            'pending',
        'alert_sent':         bool(ESCALATION_TOPIC_ARN)
    })

    print(f"Escalation {escalation_id}: risk={risk_score}, partners={len(partners)}, selfharm={selfharm}")

    return {
        'escalation_id':          escalation_id,
        'matched_partners':       partners,
        'expected_response_window': '30 minutes' if selfharm else '1 hour'
    }
```

#### `lambdas/chat/fact_extractor/index.py`

```python
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

MODEL_ID     = os.environ.get('BEDROCK_MODEL_ID', 'anthropic.claude-3-5-sonnet-20241022-v2:0')
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
            'anthropic_version': 'bedrock-2023-05-31',
            'max_tokens':        600,   # Cost control
            'messages':          [{'role': 'user', 'content': EXTRACT_PROMPT.format(conversation=conversation)}],
            'temperature':       0.1
        })
    )

    raw = json.loads(resp['body'].read())['content'][0]['text']
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
```

#### `lambdas/chat/action_recommender/index.py`

```python
"""
Action Recommender — User ko kya karna chahiye suggest karta hai.
HARDCODED rules — Bedrock call nahi (cost bachao).
Risk level + domain + intent se action determine hota hai.
"""
import json

# ── Action definitions ──
# system_route: Frontend Member 4 is route pe navigate karega
ACTIONS = {
    'property': {
        'LOW': {
            'action_type':  'Send Legal Notice',
            'priority':     'MEDIUM',
            'timeline':     'Within 2 weeks',
            'reasoning':    'A legal notice is the first formal step in property disputes.',
            'steps': [
                'Collect all property documents (sale deed, tax receipts)',
                'Get a survey report from the Revenue Department',
                'Send registered legal notice to the opposite party',
                'Give 30-60 days to respond before court action'
            ],
            'cost':         'Low (~Rs. 500-2000 for drafting)',
            'system_route': '/complaint-generator?type=legal_notice'
        },
        'HIGH': {
            'action_type':  'Consult Legal Aid Immediately',
            'priority':     'HIGH',
            'timeline':     'Within 24 hours',
            'reasoning':    'High risk property dispute needs immediate professional help.',
            'steps': [
                'Contact nearest District Legal Aid Office',
                'Carry all property documents',
                'Get an emergency injunction if construction/encroachment is ongoing'
            ],
            'cost':         'Free (Legal Aid)',
            'system_route': '/legal-aid'
        }
    },
    'family': {
        'LOW': {
            'action_type':  'Consult Legal Aid',
            'priority':     'MEDIUM',
            'timeline':     'Within 1 week',
            'reasoning':    'Family law cases need professional guidance.',
            'steps': [
                'Visit District Legal Services Authority (DLSA)',
                'Bring marriage certificate and relevant documents',
                'Explore mediation first — faster and less adversarial'
            ],
            'cost':         'Free (DLSA)',
            'system_route': '/legal-aid'
        },
        'HIGH': {
            'action_type':  'File DV Act Complaint',
            'priority':     'URGENT',
            'timeline':     'Immediately',
            'reasoning':    'Domestic violence needs immediate police protection.',
            'steps': [
                'Go to nearest police station',
                'File complaint under DV Act 2005 and IPC 498A',
                'Ask for Protection Order from Magistrate',
                'Contact Women\'s Cell: 1091'
            ],
            'cost':         'Free',
            'system_route': '/complaint-generator?type=police'
        }
    },
    'consumer': {
        'LOW': {
            'action_type':  'File Consumer Complaint',
            'priority':     'MEDIUM',
            'timeline':     'Within 2 weeks',
            'reasoning':    'Consumer courts are fast — usually resolved in 3-6 months.',
            'steps': [
                'Collect proof of purchase (bill, invoice)',
                'Document the defect (photos/videos)',
                'Send complaint email to company first',
                'If no response in 15 days: file at edaakhil.nic.in'
            ],
            'cost':         'Rs. 200-4000 filing fee',
            'system_route': '/complaint-generator?type=consumer'
        },
        'HIGH': {
            'action_type':  'File Consumer Complaint',
            'priority':     'HIGH',
            'timeline':     'Within 3 days',
            'reasoning':    'Urgent consumer fraud needs immediate action.',
            'steps': [
                'Call National Consumer Helpline: 1915',
                'File online at edaakhil.nic.in',
                'Also file police complaint for fraud'
            ],
            'cost':         'Free (helpline)',
            'system_route': '/complaint-generator?type=consumer'
        }
    },
    'criminal': {
        'LOW': {
            'action_type':  'File Police Complaint',
            'priority':     'HIGH',
            'timeline':     'Within 24 hours',
            'reasoning':    'Criminal offences should be reported to police immediately.',
            'steps': [
                'Go to nearest police station',
                'Carry evidence/witnesses if any',
                'Demand FIR copy (your legal right)',
                'If police refuse: approach Magistrate under Section 156(3) CrPC'
            ],
            'cost':         'Free',
            'system_route': '/complaint-generator?type=police'
        },
        'HIGH': {
            'action_type':  'File Police Complaint + Legal Aid',
            'priority':     'URGENT',
            'timeline':     'Immediately',
            'reasoning':    'High-risk criminal case needs both police action and legal representation.',
            'steps': [
                'Call Police: 100 immediately',
                'Go to police station to file FIR',
                'Contact Legal Aid for lawyer assistance',
                'Document everything: photos, witnesses'
            ],
            'cost':         'Free (Police + Legal Aid)',
            'system_route': '/legal-aid'
        }
    },
    'labor': {
        'LOW': {
            'action_type':  'File Labor Complaint',
            'priority':     'MEDIUM',
            'timeline':     'Within 1 week',
            'reasoning':    'Labor Commissioner handles salary and termination disputes.',
            'steps': [
                'Collect appointment letter and salary slips',
                'Give written complaint to employer first',
                'If unresolved: file with Labour Commissioner',
                'For PF issues: contact EPFO helpline 1800-118-005'
            ],
            'cost':         'Free',
            'system_route': '/complaint-generator?type=labor'
        },
        'HIGH': {
            'action_type':  'Urgent Labor Complaint',
            'priority':     'HIGH',
            'timeline':     'Within 48 hours',
            'reasoning':    'Immediate wage/termination issue needs quick action.',
            'steps': [
                'Contact Labour Commissioner immediately',
                'File for urgent injunction if being illegally terminated',
                'Contact District Legal Aid for free lawyer'
            ],
            'cost':         'Free',
            'system_route': '/legal-aid'
        }
    },
    'cyber': {
        'LOW': {
            'action_type':  'File Cyber Crime Complaint',
            'priority':     'HIGH',
            'timeline':     'Within 24 hours',
            'reasoning':    'Digital evidence disappears quickly — report immediately.',
            'steps': [
                'Take screenshots of all evidence immediately',
                'File at cybercrime.gov.in',
                'For financial fraud: call 1930 immediately',
                'Also file at local police cyber cell'
            ],
            'cost':         'Free',
            'system_route': '/complaint-generator?type=cyber'
        },
        'HIGH': {
            'action_type':  'Emergency Cyber Report',
            'priority':     'URGENT',
            'timeline':     'Immediately',
            'reasoning':    'Active cyber fraud — call 1930 in the golden hour.',
            'steps': [
                'Call Cyber Crime Helpline: 1930 NOW',
                'Block your bank cards immediately',
                'Take screenshots before blocking fraudster',
                'File at cybercrime.gov.in after calling'
            ],
            'cost':         'Free',
            'system_route': '/complaint-generator?type=cyber'
        }
    },
    'general': {
        'LOW': {
            'action_type':  'Consult Legal Aid',
            'priority':     'MEDIUM',
            'timeline':     'Within 1 week',
            'reasoning':    'A legal professional can best advise on your specific situation.',
            'steps': [
                'Visit nearest District Legal Services Authority',
                'Describe your situation in detail',
                'Ask for free legal advice'
            ],
            'cost':         'Free',
            'system_route': '/legal-aid'
        },
        'HIGH': {
            'action_type':  'Immediate Legal Aid',
            'priority':     'URGENT',
            'timeline':     'Within 24 hours',
            'reasoning':    'Urgent situation needs immediate professional help.',
            'steps': [
                'Call Legal Aid helpline: 15100',
                'Visit nearest District Legal Services Authority',
                'Carry all relevant documents'
            ],
            'cost':         'Free',
            'system_route': '/legal-aid'
        }
    }
}

def handler(event, context):
    domain      = event.get('domain', 'general')
    risk_result = event.get('risk_assessment', {})
    risk_level  = risk_result.get('risk_level', 'LOW')
    intent      = event.get('intent', 'SeekLegalAdvice')

    # Emergency intent → always HIGH action
    if intent == 'EmergencyHelp':
        risk_level = 'HIGH'

    domain_actions = ACTIONS.get(domain, ACTIONS['general'])

    # HIGH ya MEDIUM risk → HIGH action; LOW → LOW action
    action_key = 'HIGH' if risk_level in ['HIGH', 'MEDIUM'] else 'LOW'
    action = domain_actions.get(action_key, domain_actions.get('LOW'))

    if not action:
        action = ACTIONS['general']['LOW']

    action['can_do_now'] = True
    action['domain']     = domain
    action['risk_level'] = risk_level

    if risk_level == 'HIGH':
        action['auto_escalate'] = True

    return {'primary_action': action}
```

---

### ═══ DAY 6 — Voice Handlers + Deploy Scripts ═══
**Target: 6-8 ghante | Goal: Voice mode + sab deploy**

#### `lambdas/voice/voice_input_handler/index.py`

```python
"""
Voice Input Handler
1. Frontend audio (base64 webm) receive karta hai
2. S3 pe upload karta hai
3. AWS Transcribe job start karta hai
4. Job name return karta hai (frontend poll karega)

Note: Transcribe async hai — turant transcript nahi milta.
Frontend 2-3 seconds baad /voice/status?job_name=X pe check karega.
"""
import boto3
import base64
import json
import os
import uuid
from datetime import datetime, timezone

transcribe = boto3.client('transcribe', region_name='ap-south-1')
s3         = boto3.client('s3', region_name='ap-south-1')

UPLOADS_BUCKET = os.environ.get('USER_UPLOADS_BUCKET', '')

CORS = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}

def handler(event, context):
    try:
        body       = json.loads(event.get('body', '{}'))
        audio_b64  = body.get('audio_data', '')
        language   = body.get('language', 'en')
        session_id = body.get('session_id', 'unknown')
    except Exception:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Invalid request'})}

    if not audio_b64:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'No audio data'})}

    # Base64 decode + S3 upload
    audio_bytes = base64.b64decode(audio_b64)
    audio_key   = f"voice/{session_id}/{uuid.uuid4()}.webm"

    try:
        s3.put_object(
            Bucket=UPLOADS_BUCKET,
            Key=audio_key,
            Body=audio_bytes,
            ContentType='audio/webm'
        )
    except Exception as e:
        return {'statusCode': 500, 'headers': CORS, 'body': json.dumps({'error': f'Upload failed: {e}'})}

    # Transcribe job start karo
    lang_code = 'hi-IN' if language == 'hi' else 'en-IN'
    job_name  = f"nyaya-{uuid.uuid4().hex[:12]}"

    try:
        transcribe.start_transcription_job(
            TranscriptionJobName=job_name,
            Media={'MediaFileUri': f's3://{UPLOADS_BUCKET}/{audio_key}'},
            MediaFormat='webm',
            LanguageCode=lang_code,
            OutputBucketName=UPLOADS_BUCKET,
            OutputKey=f'transcripts/{job_name}.json',
            Settings={
                'ShowSpeakerLabels': False,
                'ChannelIdentification': False
            }
        )
    except Exception as e:
        return {'statusCode': 500, 'headers': CORS, 'body': json.dumps({'error': f'Transcribe start failed: {e}'})}

    return {
        'statusCode': 202,
        'headers': CORS,
        'body': json.dumps({
            'job_name': job_name,
            'status': 'processing',
            'poll_after_ms': 2500,   # Frontend 2.5 seconds baad check kare
            'message': 'Audio uploaded. Transcribing...'
        })
    }
```

#### `lambdas/voice/text_to_speech/index.py`

```python
"""
Text to Speech Handler
1. Answer text receive karta hai
2. Polly se audio generate karta hai (Aditi: Hindi, Kajal: English)
3. Base64 MP3 return karta hai frontend ko

Cost: ~$0.000004 per character (Polly Standard)
Max chars send karo: 2500 (cost control)
"""
import boto3
import base64
import json
import os
import re

polly = boto3.client('polly', region_name='ap-south-1')

VOICE_MAP = {
    'hi': os.environ.get('POLLY_VOICE_HI', 'Aditi'),
    'en': os.environ.get('POLLY_VOICE_EN', 'Kajal')
}

CORS = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}

def clean_for_speech(text: str) -> str:
    """
    TTS ke liye text clean karo:
    - Citation markers remove karo [Document 0]
    - Markdown symbols remove karo
    - Max 2500 chars (cost control)
    """
    text = re.sub(r'\[(?:Document|दस्तावेज़)\s*\d+\]', '', text)
    text = re.sub(r'[*_`#]', '', text)
    text = re.sub(r'\n+', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text[:2500]

def handler(event, context):
    try:
        body     = json.loads(event.get('body', '{}'))
        text     = body.get('text', '')
        language = body.get('language', 'en')
    except Exception:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Invalid request'})}

    if not text.strip():
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'No text provided'})}

    clean_text = clean_for_speech(text)
    voice_id   = VOICE_MAP.get(language, 'Kajal')
    lang_code  = 'hi-IN' if language == 'hi' else 'en-IN'

    try:
        resp = polly.synthesize_speech(
            Text=clean_text,
            OutputFormat='mp3',
            VoiceId=voice_id,
            LanguageCode=lang_code,
            Engine='standard'   # Standard cheaper than neural
        )
        audio_b64 = base64.b64encode(resp['AudioStream'].read()).decode('utf-8')
    except Exception as e:
        return {'statusCode': 500, 'headers': CORS, 'body': json.dumps({'error': f'Polly error: {e}'})}

    return {
        'statusCode': 200,
        'headers': CORS,
        'body': json.dumps({
            'audio_base64': audio_b64,
            'format': 'mp3',
            'voice_id': voice_id,
            'chars_processed': len(clean_text)
        })
    }
```

---

### DEPLOY SCRIPTS

#### `backend/create-chat-lambdas.sh` — Pehli Baar Lambdas Create Karo

```bash
#!/bin/bash
# Pehli baar chalao — Lambda functions AWS pe create karta hai
# Baad mein sirf deploy-chat-lambdas.sh chalate rahna

set -e
source ../.env.shared 2>/dev/null || source ../infra/config/.env.shared

echo "Creating Nyaya Mitra Chat Lambda Functions..."

FUNCTIONS=(
  "nyaya-mitra-ws-connect:chat/websocket_connect:30:128"
  "nyaya-mitra-ws-disconnect:chat/websocket_disconnect:10:128"
  "nyaya-mitra-message-orchestrator:chat/message_orchestrator:60:512"
  "nyaya-mitra-intent-classifier:chat/intent_classifier:30:256"
  "nyaya-mitra-risk-scorer:chat/risk_scorer:10:128"
  "nyaya-mitra-s3-rag-retriever:chat/s3_rag_retriever:30:256"
  "nyaya-mitra-bedrock-generator:chat/bedrock_generator:60:256"
  "nyaya-mitra-confidence-calculator:chat/confidence_calculator:10:128"
  "nyaya-mitra-escalation-router:chat/escalation_router:30:256"
  "nyaya-mitra-fact-extractor:chat/fact_extractor:60:256"
  "nyaya-mitra-action-recommender:chat/action_recommender:10:128"
  "nyaya-mitra-session-handler:entry/session_handler:30:128"
  "nyaya-mitra-voice-input:voice/voice_input_handler:60:256"
  "nyaya-mitra-text-to-speech:voice/text_to_speech:30:256"
)

# Dummy zip
echo "def handler(e,c): return {'statusCode':200,'body':'ok'}" > /tmp/d.py
zip /tmp/dummy.zip /tmp/d.py
rm /tmp/d.py

for entry in "${FUNCTIONS[@]}"; do
  IFS=':' read -r FUNC_NAME FOLDER TIMEOUT MEMORY <<< "$entry"

  echo -n "Creating $FUNC_NAME..."

  ENV_VARS="Variables={"
  ENV_VARS+="TABLE_PREFIX=${TABLE_PREFIX},"
  ENV_VARS+="LEGAL_CORPUS_BUCKET=${LEGAL_CORPUS_BUCKET},"
  ENV_VARS+="USER_UPLOADS_BUCKET=${USER_UPLOADS_BUCKET},"
  ENV_VARS+="USER_DOCUMENTS_BUCKET=${USER_DOCUMENTS_BUCKET},"
  ENV_VARS+="BEDROCK_MODEL_ID=${BEDROCK_MODEL_ID},"
  ENV_VARS+="POLLY_VOICE_HI=${POLLY_VOICE_HI},"
  ENV_VARS+="POLLY_VOICE_EN=${POLLY_VOICE_EN},"
  ENV_VARS+="ESCALATION_TOPIC_ARN=${ESCALATION_TOPIC_ARN},"
  ENV_VARS+="GUEST_QUERY_LIMIT=5,"
  ENV_VARS+="MAX_TOKENS_CHAT=500"
  ENV_VARS+="}"

  aws lambda create-function \
    --function-name "$FUNC_NAME" \
    --runtime python3.11 \
    --role "$LAMBDA_ROLE_ARN" \
    --handler "index.handler" \
    --zip-file fileb:///tmp/dummy.zip \
    --timeout "$TIMEOUT" \
    --memory-size "$MEMORY" \
    --region ap-south-1 \
    --layers "$SHARED_LAYER_ARN" \
    --environment "$ENV_VARS" \
    --output text --query 'FunctionName' 2>/dev/null \
    && echo " ✅" || echo " (already exists, skip)"

done

rm /tmp/dummy.zip
echo ""
echo "✅ All Lambda functions created!"
echo "Now run: ./deploy-chat-lambdas.sh"
```

#### `backend/deploy-chat-lambdas.sh` — Actual Code Deploy Karo

```bash
#!/bin/bash
# Code update karo — yeh baar baar chalana padega
set -e
source ../infra/config/.env.shared

deploy() {
  local FUNC_NAME=$1
  local FOLDER=$2

  echo -n "Deploying $FUNC_NAME..."
  cd lambdas/$FOLDER

  # requirements.txt hai toh install karo
  if [ -f requirements.txt ]; then
    pip install -r requirements.txt -t . --quiet --upgrade
  fi

  # Zip banao (pyc aur cache exclude)
  zip -r /tmp/fn.zip . \
    -x "*.pyc" \
    -x "__pycache__/*" \
    -x "*.egg-info/*" \
    -x "dist/*" \
    > /dev/null

  aws lambda update-function-code \
    --function-name "$FUNC_NAME" \
    --zip-file fileb:///tmp/fn.zip \
    --region ap-south-1 \
    --output text --query 'FunctionName'

  rm /tmp/fn.zip
  cd ../..
  echo " ✅"
}

echo "Deploying Nyaya Mitra Chat Lambdas..."
echo ""

deploy "nyaya-mitra-ws-connect"           "chat/websocket_connect"
deploy "nyaya-mitra-ws-disconnect"        "chat/websocket_disconnect"
deploy "nyaya-mitra-message-orchestrator" "chat/message_orchestrator"
deploy "nyaya-mitra-intent-classifier"    "chat/intent_classifier"
deploy "nyaya-mitra-risk-scorer"          "chat/risk_scorer"
deploy "nyaya-mitra-s3-rag-retriever"     "chat/s3_rag_retriever"
deploy "nyaya-mitra-bedrock-generator"    "chat/bedrock_generator"
deploy "nyaya-mitra-confidence-calculator" "chat/confidence_calculator"
deploy "nyaya-mitra-escalation-router"    "chat/escalation_router"
deploy "nyaya-mitra-fact-extractor"       "chat/fact_extractor"
deploy "nyaya-mitra-action-recommender"   "chat/action_recommender"
deploy "nyaya-mitra-session-handler"      "entry/session_handler"
deploy "nyaya-mitra-voice-input"          "voice/voice_input_handler"
deploy "nyaya-mitra-text-to-speech"       "voice/text_to_speech"

echo ""
echo "✅ All Member 2 Lambdas deployed!"
```

---

## 6. LOCAL TESTING — DEPLOY SE PEHLE TEST KARO

```bash
# Intent classifier test karo (Python mein directly)
cd backend/lambdas/chat/intent_classifier

python3 -c "
import index
result = index.handler({
    'text': 'My neighbor built a wall on my land in January and is not listening',
    'language': 'en'
}, None)
print('Domain:', result['domain'])
print('Urgency:', result['urgency'])
print('Intent:', result['intent'])
print('Sentiment:', result['sentiment'])
"

# Risk scorer test
cd ../risk_scorer
python3 -c "
import index
result = index.handler({
    'text': 'My husband is threatening to kill me, I am very scared',
    'urgency': 'HIGH',
    'domain': 'family'
}, None)
print('Risk Score:', result['risk_score'])
print('Risk Level:', result['risk_level'])
print('Selfharm:', result['selfharm_detected'])
print('Breakdown:', result['breakdown'])
"
```

---

## 7. COST BREAKDOWN — TUMHARA CONTRIBUTION

| Service | Usage | Cost/month |
|---|---|---|
| AWS Comprehend | Intent classification | ~$5 |
| Bedrock Claude | RAG answers (500 tokens × 100 calls) | ~$25 |
| Bedrock Claude | Fact extraction (600 tokens × 50 calls) | ~$8 |
| Transcribe | Voice input (demo only) | ~$2 |
| Polly | Voice output (demo only) | ~$1 |
| Lambda | 14 functions invocations | ~$2 |
| **Member 2 total** | | **~$43** |

---

## 8. FINAL CHECKLIST

```
[ ] Folder structure complete banaya
[ ] .env.shared Member 1 se mila aur set kiya
[ ] create-chat-lambdas.sh run kiya — sab 14 functions create hue
[ ] deploy-chat-lambdas.sh run kiya — actual code deploy hua
[ ] ws-connect: DynamoDB mein connection save hoti hai
[ ] ws-disconnect: DynamoDB mein connection delete hoti hai
[ ] session-handler: Session create hota hai, query_count = 0
[ ] intent-classifier: domain + urgency + sentiment correct hain
[ ] risk-scorer: HIGH risk pe 70+ score, selfharm detection kaam karta hai
[ ] s3-rag-retriever: S3 se docs load hote hain, relevance score aata hai
[ ] bedrock-generator: Citations ke saath answer aata hai, max 500 tokens
[ ] confidence-calculator: Score 0-100 sahi calculate hota hai
[ ] message-orchestrator: End-to-end test — ek message se complete response
[ ] escalation-router: HIGH risk pe SNS alert + DynamoDB log
[ ] fact-extractor: Conversation se JSON facts extract hote hain
[ ] action-recommender: Correct domain + risk se action milta hai
[ ] voice-input: Transcribe job create hoti hai
[ ] text-to-speech: Polly MP3 base64 return karta hai
[ ] Guest limit (5 queries) enforce ho raha hai message-orchestrator mein
[ ] Crisis resources self-harm detection pe response mein aati hain
```
