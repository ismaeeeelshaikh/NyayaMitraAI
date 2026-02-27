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
