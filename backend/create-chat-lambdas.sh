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
