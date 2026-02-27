# ╔══════════════════════════════════════════════════════════════╗
# ║   NYAYA MITRA — MEMBER 2 ALL-IN-ONE DEPLOY SCRIPT         ║
# ║   Ek baar chalao — sab kuch ho jayega!                     ║
# ║   PowerShell script — Windows friendly                     ║
# ╚══════════════════════════════════════════════════════════════╝

$ErrorActionPreference = "Continue"
$REGION = "ap-south-1"
$TABLE_PREFIX = "nyaya-mitra"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   NYAYA MITRA - FULL DEPLOY STARTED!      " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ── Step 0: AWS Credentials Check ──
Write-Host "[0/8] Checking AWS credentials..." -ForegroundColor Yellow
try {
    $identityJson = aws sts get-caller-identity --output json 2>&1
    $identity = $identityJson | ConvertFrom-Json
    $ACCOUNT_ID = $identity.Account
    Write-Host "  Account: $ACCOUNT_ID" -ForegroundColor Green
    Write-Host "  User: $($identity.Arn)" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: AWS credentials not configured!" -ForegroundColor Red
    Write-Host "  Run: aws configure" -ForegroundColor Red
    exit 1
}

# ── ENV Variables ──
$LEGAL_CORPUS_BUCKET = "nyaya-mitra-legal-corpus-$ACCOUNT_ID"
$USER_UPLOADS_BUCKET = "nyaya-mitra-user-uploads-$ACCOUNT_ID"
$USER_DOCUMENTS_BUCKET = "nyaya-mitra-user-documents-$ACCOUNT_ID"
$FRONTEND_BUCKET = "nyaya-mitra-frontend-$ACCOUNT_ID"
$TEMPLATES_BUCKET = "nyaya-mitra-templates-$ACCOUNT_ID"
$BEDROCK_MODEL_ID = "anthropic.claude-3-5-sonnet-20241022-v2:0"
$POLLY_VOICE_HI = "Aditi"
$POLLY_VOICE_EN = "Kajal"
$LAMBDA_ROLE_NAME = "nyaya-mitra-lambda-role"
$LAMBDA_ROLE_ARN = "arn:aws:iam::${ACCOUNT_ID}:role/$LAMBDA_ROLE_NAME"

Write-Host ""

# ══════════════════════════════════════
#       STEP 1: S3 BUCKETS
# ══════════════════════════════════════
Write-Host "[1/8] Creating S3 Buckets..." -ForegroundColor Yellow

$buckets = @($LEGAL_CORPUS_BUCKET, $USER_UPLOADS_BUCKET, $USER_DOCUMENTS_BUCKET, $FRONTEND_BUCKET, $TEMPLATES_BUCKET)

foreach ($bucket in $buckets) {
    aws s3api head-bucket --bucket $bucket 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  $bucket (already exists)" -ForegroundColor DarkGray
    } else {
        aws s3api create-bucket --bucket $bucket --region $REGION --create-bucket-configuration LocationConstraint=$REGION --output text 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  $bucket CREATED" -ForegroundColor Green
        } else {
            Write-Host "  $bucket (could not create - may already exist)" -ForegroundColor DarkGray
        }
    }
    # Block public access
    aws s3api put-public-access-block --bucket $bucket --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" 2>$null
}

Write-Host "  S3 Buckets done!" -ForegroundColor Green
Write-Host ""

# ══════════════════════════════════════
#       STEP 2: DYNAMODB TABLES
# ══════════════════════════════════════
Write-Host "[2/8] Creating DynamoDB Tables..." -ForegroundColor Yellow

function Create-SimpleTable {
    param([string]$TName, [string]$PK)

    aws dynamodb describe-table --table-name $TName --region $REGION --output text 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  $TName (exists)" -ForegroundColor DarkGray
        return
    }

    $ksJson = '[{"AttributeName":"' + $PK + '","KeyType":"HASH"}]'
    $adJson = '[{"AttributeName":"' + $PK + '","AttributeType":"S"}]'

    aws dynamodb create-table --table-name $TName --key-schema $ksJson --attribute-definitions $adJson --billing-mode PAY_PER_REQUEST --region $REGION --output text 2>$null | Out-Null
    Write-Host "  $TName CREATED" -ForegroundColor Green
}

function Create-CompositeTable {
    param([string]$TName, [string]$PK, [string]$SK)

    aws dynamodb describe-table --table-name $TName --region $REGION --output text 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  $TName (exists)" -ForegroundColor DarkGray
        return
    }

    $ksJson = '[{"AttributeName":"' + $PK + '","KeyType":"HASH"},{"AttributeName":"' + $SK + '","KeyType":"RANGE"}]'
    $adJson = '[{"AttributeName":"' + $PK + '","AttributeType":"S"},{"AttributeName":"' + $SK + '","AttributeType":"S"}]'

    aws dynamodb create-table --table-name $TName --key-schema $ksJson --attribute-definitions $adJson --billing-mode PAY_PER_REQUEST --region $REGION --output text 2>$null | Out-Null
    Write-Host "  $TName CREATED" -ForegroundColor Green
}

# Simple PK tables
Create-SimpleTable -TName "$TABLE_PREFIX-users" -PK "user_id"
Create-SimpleTable -TName "$TABLE_PREFIX-sessions" -PK "session_id"
Create-SimpleTable -TName "$TABLE_PREFIX-connections" -PK "connection_id"
Create-SimpleTable -TName "$TABLE_PREFIX-risk-assessments" -PK "assessment_id"
Create-SimpleTable -TName "$TABLE_PREFIX-timelines" -PK "timeline_id"
Create-SimpleTable -TName "$TABLE_PREFIX-complaints" -PK "complaint_id"
Create-SimpleTable -TName "$TABLE_PREFIX-scanned-notices" -PK "notice_id"
Create-SimpleTable -TName "$TABLE_PREFIX-legal-aid-partners" -PK "partner_id"
Create-SimpleTable -TName "$TABLE_PREFIX-escalation-logs" -PK "escalation_id"
Create-SimpleTable -TName "$TABLE_PREFIX-case-referrals" -PK "referral_id"

# Composite PK+SK tables
Create-CompositeTable -TName "$TABLE_PREFIX-chat-history" -PK "session_id" -SK "timestamp"
Create-CompositeTable -TName "$TABLE_PREFIX-complaint-analytics" -PK "state_district" -SK "timestamp"

Write-Host "  Waiting for tables to become active..." -ForegroundColor DarkGray
Start-Sleep -Seconds 10

# Enable TTL on relevant tables
$ttlTables = @{
    "$TABLE_PREFIX-sessions" = "ttl"
    "$TABLE_PREFIX-chat-history" = "ttl"
    "$TABLE_PREFIX-connections" = "ttl"
}

foreach ($tbl in $ttlTables.Keys) {
    $ttlAttr = $ttlTables[$tbl]
    aws dynamodb update-time-to-live --table-name $tbl --time-to-live-specification "Enabled=true,AttributeName=$ttlAttr" --region $REGION 2>$null | Out-Null
    Write-Host "  TTL enabled on $tbl" -ForegroundColor DarkGray
}

Write-Host "  DynamoDB Tables done!" -ForegroundColor Green
Write-Host ""

# ══════════════════════════════════════
#       STEP 3: GSI (Global Secondary Indexes)
# ══════════════════════════════════════
Write-Host "[3/8] Adding GSIs..." -ForegroundColor Yellow

function Add-SimpleGSI {
    param([string]$TName, [string]$IName, [string]$PK)

    $adJson = '[{"AttributeName":"' + $PK + '","AttributeType":"S"}]'
    $gsiJson = '[{"Create":{"IndexName":"' + $IName + '","KeySchema":[{"AttributeName":"' + $PK + '","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}}}]'

    aws dynamodb update-table --table-name $TName --attribute-definitions $adJson --global-secondary-index-updates $gsiJson --region $REGION --output text 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  $TName / $IName ADDED" -ForegroundColor Green
        Start-Sleep -Seconds 5
    } else {
        Write-Host "  $TName / $IName (exists or error)" -ForegroundColor DarkGray
    }
}

function Add-CompositeGSI {
    param([string]$TName, [string]$IName, [string]$PK, [string]$SK)

    $adJson = '[{"AttributeName":"' + $PK + '","AttributeType":"S"},{"AttributeName":"' + $SK + '","AttributeType":"S"}]'
    $gsiJson = '[{"Create":{"IndexName":"' + $IName + '","KeySchema":[{"AttributeName":"' + $PK + '","KeyType":"HASH"},{"AttributeName":"' + $SK + '","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}}]'

    aws dynamodb update-table --table-name $TName --attribute-definitions $adJson --global-secondary-index-updates $gsiJson --region $REGION --output text 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  $TName / $IName ADDED" -ForegroundColor Green
        Start-Sleep -Seconds 5
    } else {
        Write-Host "  $TName / $IName (exists or error)" -ForegroundColor DarkGray
    }
}

Add-SimpleGSI -TName "$TABLE_PREFIX-sessions" -IName "user-index" -PK "user_id"
Add-SimpleGSI -TName "$TABLE_PREFIX-connections" -IName "session-index" -PK "session_id"
Add-SimpleGSI -TName "$TABLE_PREFIX-risk-assessments" -IName "session-index" -PK "session_id"
Add-SimpleGSI -TName "$TABLE_PREFIX-timelines" -IName "user-index" -PK "user_id"
Add-SimpleGSI -TName "$TABLE_PREFIX-complaints" -IName "user-index" -PK "user_id"
Add-SimpleGSI -TName "$TABLE_PREFIX-scanned-notices" -IName "user-index" -PK "user_id"
Add-SimpleGSI -TName "$TABLE_PREFIX-escalation-logs" -IName "user-index" -PK "user_id"
Add-CompositeGSI -TName "$TABLE_PREFIX-legal-aid-partners" -IName "state-district-index" -PK "state" -SK "district"
Add-CompositeGSI -TName "$TABLE_PREFIX-scanned-notices" -IName "deadline-index" -PK "deadline_status" -SK "response_deadline_date"

Write-Host "  GSIs done!" -ForegroundColor Green
Write-Host ""

# ══════════════════════════════════════
#       STEP 4: IAM ROLE
# ══════════════════════════════════════
Write-Host "[4/8] Creating IAM Role..." -ForegroundColor Yellow

# Write trust policy to temp file
$trustPolicyPath = Join-Path $env:TEMP "trust-policy.json"
@'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }
  ]
}
'@ | Out-File -FilePath $trustPolicyPath -Encoding ascii

aws iam get-role --role-name $LAMBDA_ROLE_NAME 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Role $LAMBDA_ROLE_NAME already exists" -ForegroundColor DarkGray
} else {
    aws iam create-role --role-name $LAMBDA_ROLE_NAME --assume-role-policy-document "file://$trustPolicyPath" --description "Shared role for Nyaya Mitra Lambda" --output text 2>$null | Out-Null
    Write-Host "  Role CREATED" -ForegroundColor Green
    Start-Sleep -Seconds 5
}
Remove-Item $trustPolicyPath -ErrorAction SilentlyContinue

# Attach policies
$policies = @(
    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess",
    "arn:aws:iam::aws:policy/AmazonS3FullAccess",
    "arn:aws:iam::aws:policy/AmazonBedrockFullAccess",
    "arn:aws:iam::aws:policy/ComprehendFullAccess",
    "arn:aws:iam::aws:policy/AmazonTranscribeFullAccess",
    "arn:aws:iam::aws:policy/AmazonPollyFullAccess",
    "arn:aws:iam::aws:policy/AmazonSNSFullAccess",
    "arn:aws:iam::aws:policy/AWSLambdaRole",
    "arn:aws:iam::aws:policy/AmazonAPIGatewayInvokeFullAccess"
)

foreach ($policy in $policies) {
    aws iam attach-role-policy --role-name $LAMBDA_ROLE_NAME --policy-arn $policy 2>$null
}
Write-Host "  10 IAM Policies attached" -ForegroundColor Green

# Inline policy for API GW manage connections
$apiGwPolicyPath = Join-Path $env:TEMP "apigw-policy.json"
$apiGwContent = '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":["execute-api:ManageConnections"],"Resource":"arn:aws:execute-api:ap-south-1:' + $ACCOUNT_ID + ':*/*/@connections/*"}]}'
$apiGwContent | Out-File -FilePath $apiGwPolicyPath -Encoding ascii

aws iam put-role-policy --role-name $LAMBDA_ROLE_NAME --policy-name "APIGatewayManageConnections" --policy-document "file://$apiGwPolicyPath" 2>$null
Remove-Item $apiGwPolicyPath -ErrorAction SilentlyContinue

Write-Host "  Waiting 10s for IAM propagation..." -ForegroundColor DarkGray
Start-Sleep -Seconds 10
Write-Host "  IAM Role done!" -ForegroundColor Green
Write-Host ""

# ══════════════════════════════════════
#       STEP 5: SNS TOPIC
# ══════════════════════════════════════
Write-Host "[5/8] Creating SNS Escalation Topic..." -ForegroundColor Yellow

$ESCALATION_TOPIC_ARN = aws sns create-topic --name "nyaya-mitra-escalation-alerts" --region $REGION --output text --query TopicArn 2>$null
if ($ESCALATION_TOPIC_ARN) {
    Write-Host "  Topic: $ESCALATION_TOPIC_ARN" -ForegroundColor Green
} else {
    $ESCALATION_TOPIC_ARN = ""
    Write-Host "  SNS Topic error (non-fatal)" -ForegroundColor DarkGray
}
Write-Host ""

# ══════════════════════════════════════
#       STEP 6: CREATE LAMBDA FUNCTIONS
# ══════════════════════════════════════
Write-Host "[6/8] Creating 14 Lambda Functions..." -ForegroundColor Yellow

# Write env vars to temp file
$envJsonPath = Join-Path $env:TEMP "lambda-env.json"
$envObj = @{
    Variables = @{
        TABLE_PREFIX = $TABLE_PREFIX
        LEGAL_CORPUS_BUCKET = $LEGAL_CORPUS_BUCKET
        USER_UPLOADS_BUCKET = $USER_UPLOADS_BUCKET
        USER_DOCUMENTS_BUCKET = $USER_DOCUMENTS_BUCKET
        BEDROCK_MODEL_ID = $BEDROCK_MODEL_ID
        POLLY_VOICE_HI = $POLLY_VOICE_HI
        POLLY_VOICE_EN = $POLLY_VOICE_EN
        ESCALATION_TOPIC_ARN = "$ESCALATION_TOPIC_ARN"
        GUEST_QUERY_LIMIT = "5"
        MAX_TOKENS_CHAT = "500"
    }
}
$envObj | ConvertTo-Json -Compress | Out-File -FilePath $envJsonPath -Encoding ascii

# Create dummy zip
$dummyDir = Join-Path $env:TEMP "dummy-lambda"
New-Item -ItemType Directory -Path $dummyDir -Force | Out-Null
"def handler(e,c):`n    return {'statusCode':200,'body':'ok'}" | Out-File -FilePath "$dummyDir\index.py" -Encoding ascii
$dummyZip = Join-Path $env:TEMP "dummy-lambda.zip"
Remove-Item $dummyZip -ErrorAction SilentlyContinue
Compress-Archive -Path "$dummyDir\*" -DestinationPath $dummyZip -Force

$functions = @(
    @("nyaya-mitra-ws-connect", "30", "128"),
    @("nyaya-mitra-ws-disconnect", "10", "128"),
    @("nyaya-mitra-message-orchestrator", "60", "512"),
    @("nyaya-mitra-intent-classifier", "30", "256"),
    @("nyaya-mitra-risk-scorer", "10", "128"),
    @("nyaya-mitra-s3-rag-retriever", "30", "256"),
    @("nyaya-mitra-bedrock-generator", "60", "256"),
    @("nyaya-mitra-confidence-calculator", "10", "128"),
    @("nyaya-mitra-escalation-router", "30", "256"),
    @("nyaya-mitra-fact-extractor", "60", "256"),
    @("nyaya-mitra-action-recommender", "10", "128"),
    @("nyaya-mitra-session-handler", "30", "128"),
    @("nyaya-mitra-voice-input", "60", "256"),
    @("nyaya-mitra-text-to-speech", "30", "256")
)

foreach ($fn in $functions) {
    $fnName = $fn[0]
    $fnTimeout = $fn[1]
    $fnMemory = $fn[2]

    aws lambda get-function --function-name $fnName --region $REGION 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  $fnName (exists)" -ForegroundColor DarkGray
    } else {
        aws lambda create-function --function-name $fnName --runtime python3.11 --role $LAMBDA_ROLE_ARN --handler "index.handler" --zip-file "fileb://$dummyZip" --timeout $fnTimeout --memory-size $fnMemory --region $REGION --environment "file://$envJsonPath" --output text --query FunctionName 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  $fnName CREATED" -ForegroundColor Green
        } else {
            Write-Host "  $fnName ERROR" -ForegroundColor Red
        }
    }
}

Remove-Item $dummyZip -ErrorAction SilentlyContinue
Remove-Item $dummyDir -Recurse -ErrorAction SilentlyContinue
Remove-Item $envJsonPath -ErrorAction SilentlyContinue

Write-Host "  Lambda Functions done!" -ForegroundColor Green
Write-Host ""

# ══════════════════════════════════════
#       STEP 7: DEPLOY ACTUAL CODE
# ══════════════════════════════════════
Write-Host "[7/8] Deploying actual code to Lambda functions..." -ForegroundColor Yellow

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$lambdasDir = Join-Path $scriptDir "lambdas"

$deployMap = @(
    @("nyaya-mitra-ws-connect", "chat\websocket_connect"),
    @("nyaya-mitra-ws-disconnect", "chat\websocket_disconnect"),
    @("nyaya-mitra-message-orchestrator", "chat\message_orchestrator"),
    @("nyaya-mitra-intent-classifier", "chat\intent_classifier"),
    @("nyaya-mitra-risk-scorer", "chat\risk_scorer"),
    @("nyaya-mitra-s3-rag-retriever", "chat\s3_rag_retriever"),
    @("nyaya-mitra-bedrock-generator", "chat\bedrock_generator"),
    @("nyaya-mitra-confidence-calculator", "chat\confidence_calculator"),
    @("nyaya-mitra-escalation-router", "chat\escalation_router"),
    @("nyaya-mitra-fact-extractor", "chat\fact_extractor"),
    @("nyaya-mitra-action-recommender", "chat\action_recommender"),
    @("nyaya-mitra-session-handler", "entry\session_handler"),
    @("nyaya-mitra-voice-input", "voice\voice_input_handler"),
    @("nyaya-mitra-text-to-speech", "voice\text_to_speech")
)

foreach ($item in $deployMap) {
    $fnName = $item[0]
    $fnFolder = $item[1]
    $folderPath = Join-Path $lambdasDir $fnFolder
    $indexFile = Join-Path $folderPath "index.py"
    $zipPath = Join-Path $env:TEMP "lambda-code-deploy.zip"

    if (!(Test-Path $indexFile)) {
        Write-Host "  $fnName - index.py NOT FOUND" -ForegroundColor Red
        continue
    }

    Remove-Item $zipPath -ErrorAction SilentlyContinue
    Compress-Archive -Path "$folderPath\*" -DestinationPath $zipPath -Force

    aws lambda update-function-code --function-name $fnName --zip-file "fileb://$zipPath" --region $REGION --output text --query FunctionName 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  $fnName DEPLOYED" -ForegroundColor Green
    } else {
        Write-Host "  $fnName DEPLOY FAILED" -ForegroundColor Red
    }

    Remove-Item $zipPath -ErrorAction SilentlyContinue
}

Write-Host "  Code deployment done!" -ForegroundColor Green
Write-Host ""

# ══════════════════════════════════════
#       STEP 8: UPLOAD LEGAL DOCS + SEED DATA
# ══════════════════════════════════════
Write-Host "[8/8] Uploading legal docs and seeding data..." -ForegroundColor Yellow

$legalDocsDir = Join-Path $scriptDir "..\infra\legal-docs"
if (Test-Path $legalDocsDir) {
    $docs = Get-ChildItem -Path $legalDocsDir -Filter "*.txt"
    foreach ($doc in $docs) {
        aws s3 cp $doc.FullName "s3://$LEGAL_CORPUS_BUCKET/corpus/$($doc.Name)" --region $REGION 2>$null | Out-Null
        Write-Host "  Uploaded: corpus/$($doc.Name)" -ForegroundColor Green
    }
} else {
    Write-Host "  legal-docs folder not found" -ForegroundColor DarkGray
}

# Seed data
$seedScript = Join-Path $scriptDir "..\infra\scripts\seed-data.py"
if (Test-Path $seedScript) {
    $env:AWS_DEFAULT_REGION = $REGION
    python $seedScript 2>$null
    Write-Host "  Seed data loaded!" -ForegroundColor Green
} else {
    Write-Host "  seed-data.py not found" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "   DEPLOYMENT COMPLETE!                    " -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Account:   $ACCOUNT_ID" -ForegroundColor Cyan
Write-Host "  Region:    $REGION" -ForegroundColor Cyan
Write-Host "  Tables:    12 DynamoDB tables" -ForegroundColor Cyan
Write-Host "  Buckets:   5 S3 buckets" -ForegroundColor Cyan
Write-Host "  Lambdas:   14 functions" -ForegroundColor Cyan
Write-Host "  Legal Docs: Uploaded to S3" -ForegroundColor Cyan
Write-Host "  IAM Role:  $LAMBDA_ROLE_ARN" -ForegroundColor Cyan
Write-Host ""
Write-Host "  NEXT: python test-live-pipeline.py" -ForegroundColor Yellow
Write-Host ""
