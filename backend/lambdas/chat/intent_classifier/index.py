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
