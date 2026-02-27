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
