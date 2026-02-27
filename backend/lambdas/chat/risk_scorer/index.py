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
