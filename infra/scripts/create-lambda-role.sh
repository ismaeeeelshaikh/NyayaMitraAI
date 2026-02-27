#!/bin/bash
# Lambda ke liye ek shared IAM role banao
# Sab Lambda functions yeh role use karenge

source ../config/.env.shared 2>/dev/null || true

ROLE_NAME="nyaya-mitra-lambda-role"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "Creating Lambda IAM Role: $ROLE_NAME"

# Trust policy banao
cat > /tmp/trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Role create karo
aws iam create-role \
  --role-name $ROLE_NAME \
  --assume-role-policy-document file:///tmp/trust-policy.json \
  --description "Shared role for all Nyaya Mitra Lambda functions" \
  2>/dev/null || echo "Role already exists"

echo "Attaching policies..."

# Basic Lambda execution (CloudWatch Logs)
aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# DynamoDB
aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess

# S3
aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

# Bedrock
aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

# Comprehend
aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/ComprehendFullAccess

# Textract (Member 3 notices ke liye)
aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/AmazonTextractFullAccess

# Transcribe + Polly (voice mode)
aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/AmazonTranscribeFullAccess

aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/AmazonPollyFullAccess

# SES (emails)
aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/AmazonSESFullAccess

# SNS (alerts)
aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/AmazonSNSFullAccess

# Lambda invoke (orchestrator ke liye)
aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/AWSLambdaRole

# API Gateway management (WebSocket ke liye)
aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/AmazonAPIGatewayInvokeFullAccess

# EventBridge (deadline reminders)
aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/AmazonEventBridgeFullAccess

# Secrets Manager
aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite

ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"
echo ""
echo "✅ IAM Role ready: $ROLE_ARN"
echo "Yeh ARN .env.shared mein save karo: LAMBDA_ROLE_ARN=$ROLE_ARN"
