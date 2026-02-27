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
