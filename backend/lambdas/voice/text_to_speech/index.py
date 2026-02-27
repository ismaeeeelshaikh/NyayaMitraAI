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
