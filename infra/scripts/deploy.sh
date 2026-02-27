#!/bin/bash
set -e  # Koi bhi error aaye toh ruk jao

echo "╔══════════════════════════════════════╗"
echo "║   NYAYA MITRA — FULL DEPLOYMENT     ║"
echo "╚══════════════════════════════════════╝"

# Check karo ki AWS credentials set hain
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS credentials not configured!"
    echo "Run: aws configure"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "AWS Account: $ACCOUNT_ID"
echo "Region: ap-south-1"
echo ""

# Step 1: CDK build + deploy
echo "📦 Step 1/5: CDK Stacks Deploy..."
cd infra
npm install --silent
npm run build

npx cdk deploy NyayaSecurityStack  --require-approval never --outputs-file /tmp/security-outputs.json
npx cdk deploy NyayaIdentityStack  --require-approval never --outputs-file /tmp/identity-outputs.json
npx cdk deploy NyayaDataStack      --require-approval never --outputs-file /tmp/data-outputs.json
npx cdk deploy NyayaApiStack       --require-approval never --outputs-file /tmp/api-outputs.json
npx cdk deploy NyayaOpsStack       --require-approval never

echo "✅ CDK Stacks deployed!"
echo ""

# Step 2: IAM Role
echo "🔐 Step 2/5: IAM Role Setup..."
chmod +x scripts/create-lambda-role.sh
./scripts/create-lambda-role.sh
echo ""

# Step 3: .env.shared banao
echo "📝 Step 3/5: .env.shared file generating..."
HTTP_API_URL=$(aws cloudformation describe-stacks \
  --stack-name NyayaApiStack \
  --query 'Stacks[0].Outputs[?OutputKey==`HttpApiUrl`].OutputValue' \
  --output text --region ap-south-1)

WS_URL=$(aws cloudformation describe-stacks \
  --stack-name NyayaApiStack \
  --query 'Stacks[0].Outputs[?OutputKey==`WebSocketUrl`].OutputValue' \
  --output text --region ap-south-1)

COGNITO_POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name NyayaIdentityStack \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
  --output text --region ap-south-1)

COGNITO_CLIENT_ID=$(aws cloudformation describe-stacks \
  --stack-name NyayaIdentityStack \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
  --output text --region ap-south-1)

ESCALATION_TOPIC=$(aws cloudformation describe-stacks \
  --stack-name NyayaSecurityStack \
  --query 'Stacks[0].Outputs[?OutputKey==`EscalationTopicArn`].OutputValue' \
  --output text --region ap-south-1)

LAMBDA_ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/nyaya-mitra-lambda-role"

mkdir -p config

cat > config/.env.shared << EOF
# ════════════════════════════════════════════════
# NYAYA MITRA — SHARED ENVIRONMENT VARIABLES
# Generated: $(date)
# YAHI FILE SABSE ZYADA IMPORTANT HAI
# Sab members ko share karo
# ════════════════════════════════════════════════

AWS_REGION=ap-south-1
AWS_ACCOUNT_ID=${ACCOUNT_ID}

# ── Cognito ──
COGNITO_USER_POOL_ID=${COGNITO_POOL_ID}
COGNITO_CLIENT_ID=${COGNITO_CLIENT_ID}
COGNITO_DOMAIN=nyaya-mitra-auth.auth.ap-south-1.amazoncognito.com

# ── API Gateway ──
HTTP_API_URL=${HTTP_API_URL}
WEBSOCKET_URL=${WS_URL}
HTTP_API_ID=$(aws cloudformation describe-stacks --stack-name NyayaApiStack --query 'Stacks[0].Outputs[?OutputKey==`HttpApiId`].OutputValue' --output text --region ap-south-1)
WS_API_ID=$(aws cloudformation describe-stacks --stack-name NyayaApiStack --query 'Stacks[0].Outputs[?OutputKey==`WebSocketApiId`].OutputValue' --output text --region ap-south-1)

# ── S3 Buckets ──
FRONTEND_BUCKET=nyaya-mitra-frontend-${ACCOUNT_ID}
LEGAL_CORPUS_BUCKET=nyaya-mitra-legal-corpus-${ACCOUNT_ID}
USER_DOCUMENTS_BUCKET=nyaya-mitra-user-documents-${ACCOUNT_ID}
USER_UPLOADS_BUCKET=nyaya-mitra-user-uploads-${ACCOUNT_ID}
TEMPLATES_BUCKET=nyaya-mitra-templates-${ACCOUNT_ID}

# ── DynamoDB ──
TABLE_PREFIX=nyaya-mitra

# ── Lambda ──
LAMBDA_ROLE_ARN=${LAMBDA_ROLE_ARN}
# Layers — baad mein fill karo
SHARED_LAYER_ARN=FILL_AFTER_LAYER_DEPLOY
PDF_LAYER_ARN=FILL_AFTER_MEMBER3_DEPLOYS

# ── AI / ML ──
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
POLLY_VOICE_HI=Aditi
POLLY_VOICE_EN=Kajal

# ── Notifications ──
ESCALATION_TOPIC_ARN=${ESCALATION_TOPIC}
SES_SENDER_EMAIL=noreply@nyayamitra.in

# ── Budget Controls ──
GUEST_QUERY_LIMIT=5
MAX_TOKENS_CHAT=500
MAX_TOKENS_COMPLAINT=700
MAX_TOKENS_TIMELINE=800
MAX_TOKENS_NOTICE=700
EOF

echo "✅ .env.shared generated at config/.env.shared"
echo ""

# Step 4: Shared Lambda Layer
echo "🐍 Step 4/5: Shared Python Layer Deploy..."
mkdir -p layers/shared-python/python
# Layer aise deploy karo
cd layers/shared-python
zip -r /tmp/shared-layer.zip python/
LAYER_ARN=$(aws lambda publish-layer-version \
  --layer-name nyaya-mitra-shared \
  --description "Shared Python utilities for Nyaya Mitra" \
  --zip-file fileb:///tmp/shared-layer.zip \
  --compatible-runtimes python3.11 \
  --region ap-south-1 \
  --query 'LayerVersionArn' --output text)
rm /tmp/shared-layer.zip
cd ../..

# Layer ARN .env.shared mein update karo
sed -i "s|FILL_AFTER_LAYER_DEPLOY|${LAYER_ARN}|g" config/.env.shared
echo "✅ Shared Layer deployed: $LAYER_ARN"
echo ""

# Step 5: Seed data
echo "🌱 Step 5/5: Seeding demo data..."
cd ..
source infra/config/.env.shared
python3 infra/scripts/seed-data.py
python3 infra/scripts/upload-legal-corpus.py
echo ""

echo "╔══════════════════════════════════════╗"
echo "║        DEPLOYMENT COMPLETE!          ║"
echo "╚══════════════════════════════════════╝"
echo ""
echo "HTTP API URL: $HTTP_API_URL"
echo "WebSocket URL: $WS_URL"
echo ""
echo "NEXT STEPS:"
echo "1. Share config/.env.shared with Member 2, 3, 4"
echo "2. Tell Member 2 to run: backend/create-chat-lambdas.sh"
echo "3. Tell Member 3 to deploy PDF layer first"
echo "4. Tell Member 4 to copy .env.shared to frontend/.env.local"
