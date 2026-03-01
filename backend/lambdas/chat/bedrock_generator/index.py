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

MODEL_ID     = os.environ.get('BEDROCK_MODEL_ID', 'apac.amazon.nova-pro-v1:0')
if "claude" in MODEL_ID.lower():
    MODEL_ID = 'apac.amazon.nova-pro-v1:0'
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

    # ── Bedrock call (Amazon Nova generic format) ──
    resp = bedrock.invoke_model(
        modelId=MODEL_ID,
        body=json.dumps({
            "messages": [{"role": "user", "content": [{"text": prompt}]}],
            "inferenceConfig": {
                "max_new_tokens": MAX_TOKENS,
                "temperature": 0.1,
                "top_p": 0.9
            }
        })
    )

    body   = json.loads(resp['body'].read())
    answer = body['output']['message']['content'][0]['text'].strip()

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
