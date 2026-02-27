"""
╔══════════════════════════════════════════════════════════════╗
║   NYAYA MITRA — LIVE PIPELINE TESTER                        ║
║   Deploy ke baad chalao — poora pipeline dekhne milega!     ║
║   python test-live-pipeline.py                              ║
╚══════════════════════════════════════════════════════════════╝

Yeh script directly AWS pe deployed Lambda functions
ko invoke karega aur full pipeline dikhayega.
Frontend nahi chahiye — terminal mein hi sab dikhega!
"""
import boto3
import json
import sys
import time

REGION = 'ap-south-1'
lambda_client = boto3.client('lambda', region_name=REGION)

# ── Colors for terminal ──
class C:
    GREEN  = '\033[92m'
    RED    = '\033[91m'
    YELLOW = '\033[93m'
    CYAN   = '\033[96m'
    BOLD   = '\033[1m'
    DIM    = '\033[2m'
    RESET  = '\033[0m'

def invoke(func_name, payload):
    """Lambda invoke karo aur result return karo"""
    try:
        resp = lambda_client.invoke(
            FunctionName=func_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )
        raw = resp['Payload'].read().decode('utf-8')
        return json.loads(raw)
    except Exception as e:
        print(f"  {C.RED}ERROR invoking {func_name}: {e}{C.RESET}")
        return {}

def print_header():
    print(f"""
{C.CYAN}╔══════════════════════════════════════════════════════════════╗
║         🏛️  NYAYA MITRA — LIVE PIPELINE TESTER              ║
║         Apna legal sawaal type karo, pipeline dekhne milega  ║
╚══════════════════════════════════════════════════════════════╝{C.RESET}
""")

def print_step(step_num, name, status="running"):
    if status == "running":
        print(f"  {C.YELLOW}⏳ Step {step_num}: {name}...{C.RESET}", end="", flush=True)
    elif status == "done":
        print(f"\r  {C.GREEN}✅ Step {step_num}: {name}     {C.RESET}")
    elif status == "skip":
        print(f"\r  {C.DIM}⏭️  Step {step_num}: {name} (skipped){C.RESET}")

def run_full_pipeline(text, language='en'):
    """Poora 8-step pipeline chalao aur results dikhao"""
    print(f"\n{C.BOLD}{'='*60}{C.RESET}")
    print(f"{C.CYAN}  📩 User Message: {C.RESET}{text}")
    print(f"{C.CYAN}  🌐 Language: {C.RESET}{language}")
    print(f"{C.BOLD}{'='*60}{C.RESET}\n")

    start_time = time.time()

    # ── STEP 1: Intent Classification ──
    print_step(1, "Intent Classification")
    intent_result = invoke('nyaya-mitra-intent-classifier', {
        'text': text,
        'language': language
    })
    print_step(1, "Intent Classification", "done")

    domain     = intent_result.get('domain', 'general')
    urgency    = intent_result.get('urgency', 'LOW')
    intent     = intent_result.get('intent', 'SeekLegalAdvice')
    sentiment  = intent_result.get('sentiment', 'NEUTRAL')
    confidence = intent_result.get('domain_confidence', 0)

    print(f"      Domain:     {C.BOLD}{domain}{C.RESET} (confidence: {confidence}%)")
    print(f"      Urgency:    {C.BOLD}{urgency}{C.RESET}")
    print(f"      Intent:     {C.BOLD}{intent}{C.RESET}")
    print(f"      Sentiment:  {C.BOLD}{sentiment}{C.RESET}")
    print()

    # ── STEP 2: Risk Scoring ──
    print_step(2, "Risk Scoring")
    risk_result = invoke('nyaya-mitra-risk-scorer', {
        'text': text,
        'urgency': urgency,
        'domain': domain
    })
    print_step(2, "Risk Scoring", "done")

    risk_score = risk_result.get('risk_score', 0)
    risk_level = risk_result.get('risk_level', 'LOW')
    selfharm   = risk_result.get('selfharm_detected', False)
    breakdown  = risk_result.get('breakdown', {})

    risk_color = C.RED if risk_level == 'HIGH' else C.YELLOW if risk_level == 'MEDIUM' else C.GREEN
    print(f"      Risk Score: {risk_color}{C.BOLD}{risk_score}/100 ({risk_level}){C.RESET}")
    print(f"      Breakdown:  Violence={breakdown.get('violence',0)}, Selfharm={breakdown.get('selfharm',0)}, Timeline={breakdown.get('timeline_urgency',0)}, Vulnerability={breakdown.get('vulnerability',0)}, Domain={breakdown.get('domain_risk',0)}")
    if selfharm:
        print(f"      {C.RED}⚠️  SELF-HARM DETECTED — Crisis resources will be shown{C.RESET}")
    print()

    # ── STEP 3: Escalation (HIGH risk only) ──
    if risk_level == 'HIGH':
        print_step(3, "Escalation Router (HIGH RISK!)")
        print_step(3, "Escalation Router — would send SNS alert", "done")
        print(f"      {C.RED}🚨 HIGH RISK — Legal aid partners notified!{C.RESET}")
    else:
        print_step(3, "Escalation Router", "skip")
    print()

    # ── STEP 4: S3 RAG Retrieval ──
    print_step(4, "S3 RAG Retrieval")
    rag_result = invoke('nyaya-mitra-s3-rag-retriever', {
        'text': text,
        'language': language,
        'domain': domain
    })
    print_step(4, "S3 RAG Retrieval", "done")

    passages  = rag_result.get('passages', [])
    citations = rag_result.get('citations', [])

    print(f"      Docs searched: {rag_result.get('docs_searched', 0)}")
    print(f"      Docs returned: {rag_result.get('docs_returned', 0)}")
    for p in passages:
        rel_color = C.GREEN if p.get('relevance_score') == 'HIGH' else C.YELLOW if p.get('relevance_score') == 'MEDIUM' else C.DIM
        print(f"      📄 [{p.get('index')}] {p.get('title', '')} — {rel_color}{p.get('relevance_score', '')} ({p.get('relevance_raw', 0)}){C.RESET}")
    print()

    # ── STEP 5: Bedrock Answer Generation ──
    print_step(5, "Bedrock Answer Generation")
    bedrock_result = invoke('nyaya-mitra-bedrock-generator', {
        'text': text,
        'passages': passages,
        'language': language,
        'domain': domain
    })
    print_step(5, "Bedrock Answer Generation", "done")

    answer        = bedrock_result.get('answer', 'No answer generated')
    cited_indices = bedrock_result.get('cited_indices', [])
    tokens_used   = bedrock_result.get('tokens_used', 0)

    print(f"      Tokens used: {tokens_used}")
    print(f"      Citations:   {cited_indices}")
    print()

    # ── STEP 6: Confidence Score ──
    print_step(6, "Confidence Calculation")
    conf_result = invoke('nyaya-mitra-confidence-calculator', {
        'passages': passages,
        'cited_indices': cited_indices,
        'answer': answer
    })
    print_step(6, "Confidence Calculation", "done")

    conf_score = conf_result.get('confidence_score', 0)
    conf_label = conf_result.get('label', 'Limited')
    conf_color_name = conf_result.get('color', 'orange')
    conf_color = C.GREEN if conf_color_name == 'green' else C.CYAN if conf_color_name == 'teal' else C.YELLOW
    
    print(f"      Confidence: {conf_color}{C.BOLD}{conf_score}/100 — {conf_label}{C.RESET}")
    print()

    # ── STEP 7: Fact Extraction (skip in test — needs chat history) ──
    print_step(7, "Fact Extraction (async)", "skip")
    print()

    # ── STEP 8: Action Recommendation ──
    if risk_score >= 30 or intent in ['FileComplaint', 'GenerateDocument', 'EmergencyHelp']:
        print_step(8, "Action Recommendation")
        action_result = invoke('nyaya-mitra-action-recommender', {
            'domain': domain,
            'intent': intent,
            'risk_assessment': risk_result,
            'language': language
        })
        print_step(8, "Action Recommendation", "done")

        action = action_result.get('primary_action', {})
        print(f"      Action:   {C.BOLD}{action.get('action_type', 'N/A')}{C.RESET}")
        print(f"      Priority: {C.BOLD}{action.get('priority', 'N/A')}{C.RESET}")
        print(f"      Timeline: {action.get('timeline', 'N/A')}")
        print(f"      Cost:     {action.get('cost', 'N/A')}")
        if action.get('steps'):
            print(f"      Steps:")
            for i, step in enumerate(action['steps'], 1):
                print(f"        {i}. {step}")
    else:
        print_step(8, "Action Recommendation", "skip")
    
    elapsed = round(time.time() - start_time, 2)

    # ══════════════════════════════════════
    #    FINAL RESPONSE (jaise frontend dikhata)
    # ══════════════════════════════════════
    print(f"\n{C.BOLD}{'='*60}{C.RESET}")
    print(f"{C.GREEN}{C.BOLD}  🏛️  NYAYA MITRA RESPONSE{C.RESET}")
    print(f"{C.BOLD}{'='*60}{C.RESET}\n")
    
    print(f"  {C.CYAN}{answer}{C.RESET}\n")

    if citations:
        print(f"  {C.DIM}📚 Sources:{C.RESET}")
        for c in citations:
            if c.get('index') in cited_indices:
                print(f"     [{c.get('index')}] {c.get('source', '')} ({c.get('relevance', '')})")
    
    print(f"\n  {risk_color}🛡️  Risk: {risk_level} ({risk_score}/100){C.RESET}  |  {conf_color}📊 Confidence: {conf_label} ({conf_score}/100){C.RESET}")
    print(f"  {C.DIM}⏱️  Pipeline time: {elapsed}s{C.RESET}")

    if selfharm:
        print(f"\n  {C.RED}{'='*50}")
        print(f"  ⚠️  CRISIS RESOURCES")
        print(f"  Vandrevala Foundation (24/7): 1860-2662-345")
        print(f"  iCall: 9152987821")
        print(f"  Sneha India: 044-24640050")
        print(f"  {'='*50}{C.RESET}")

    print()

def run_quick_demo():
    """Pre-set test cases se demo chalao"""
    print(f"\n{C.BOLD}🎯 QUICK DEMO — Pre-set legal questions{C.RESET}\n")
    
    test_cases = [
        ("My neighbor has built a wall on my land and is refusing to remove it. I have the property deed.", "en", "Property Dispute"),
        ("Mera pati mujhe roz maarta hai, mujhe bahut dar lagta hai, kya karun?", "hi", "Domestic Violence (Hindi)"),
        ("I ordered a phone from Amazon but received a broken one. They are refusing refund since 2 months.", "en", "Consumer Complaint"),
        ("Someone hacked my bank account and stole 50000 rupees through UPI", "en", "Cyber Crime"),
        ("My employer fired me without notice and is not paying my 3 months salary", "en", "Labor Dispute"),
    ]

    print("  Available test cases:")
    for i, (_, _, label) in enumerate(test_cases, 1):
        print(f"    {i}. {label}")
    print(f"    0. Custom question type karo")
    print()

    choice = input(f"  {C.CYAN}Choose (1-5, or 0 for custom): {C.RESET}").strip()

    if choice == '0':
        text = input(f"  {C.CYAN}Apna sawaal type karo: {C.RESET}").strip()
        lang = input(f"  {C.CYAN}Language (en/hi) [en]: {C.RESET}").strip() or 'en'
        run_full_pipeline(text, lang)
    elif choice.isdigit() and 1 <= int(choice) <= len(test_cases):
        text, lang, label = test_cases[int(choice) - 1]
        print(f"\n  {C.DIM}Running: {label}{C.RESET}")
        run_full_pipeline(text, lang)
    else:
        print(f"  {C.RED}Invalid choice!{C.RESET}")

def interactive_mode():
    """Chat loop — baar baar sawaal pooch sakta hai"""
    print(f"  {C.DIM}Type 'quit' to exit, 'demo' for pre-set questions{C.RESET}\n")
    
    while True:
        text = input(f"  {C.CYAN}👤 You: {C.RESET}").strip()
        
        if not text:
            continue
        if text.lower() in ['quit', 'exit', 'q']:
            print(f"\n  {C.GREEN}Dhanyavaad! Nyaya Mitra signing off. 🙏{C.RESET}\n")
            break
        if text.lower() == 'demo':
            run_quick_demo()
            continue
        
        # Auto-detect Hindi
        lang = 'hi' if any(c > '\u0900' and c < '\u097F' for c in text) else 'en'
        
        run_full_pipeline(text, lang)

if __name__ == '__main__':
    print_header()
    
    print(f"  {C.BOLD}Choose mode:{C.RESET}")
    print(f"    1. 🚀 Quick Demo (pre-set test cases)")
    print(f"    2. 💬 Interactive Chat (apna sawaal pooch)")
    print(f"    3. 🧪 Run ALL test cases at once")
    print()
    
    mode = input(f"  {C.CYAN}Mode (1/2/3) [1]: {C.RESET}").strip() or '1'
    
    if mode == '1':
        run_quick_demo()
    elif mode == '2':
        interactive_mode()
    elif mode == '3':
        test_cases = [
            ("My neighbor built a wall on my land", "en"),
            ("Mera pati mujhe roz maarta hai", "hi"),
            ("Amazon refused my refund for broken phone", "en"),
            ("Someone hacked my UPI and stole 50000", "en"),
            ("Employer fired me without notice or salary", "en"),
        ]
        for text, lang in test_cases:
            run_full_pipeline(text, lang)
            print(f"\n{C.DIM}{'─'*60}{C.RESET}\n")
    else:
        run_quick_demo()
