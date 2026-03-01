# ╔══════════════════════════════════════════════════════════════╗
# ║   NYAYA MITRA — MEMBER 3 DOCUMENT LAMBDAS DEPLOY SCRIPT   ║
# ║   PowerShell script — Windows friendly                     ║
# ╚══════════════════════════════════════════════════════════════╝

$ErrorActionPreference = "Continue"
$REGION = "ap-south-1"
$TABLE_PREFIX = "nyaya-mitra"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   MEMBER 3 - DOCUMENT LAMBDAS DEPLOY      " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ── Step 0: AWS Credentials Check ──
Write-Host "[0/4] Checking AWS credentials..." -ForegroundColor Yellow
try {
    $identityJson = aws sts get-caller-identity --output json 2>&1
    $identity = $identityJson | ConvertFrom-Json
    $ACCOUNT_ID = $identity.Account
    Write-Host "  Account: $ACCOUNT_ID" -ForegroundColor Green
}
catch {
    Write-Host "  ERROR: AWS credentials not configured!" -ForegroundColor Red
    exit 1
}

$LAMBDA_ROLE_NAME = "nyaya-mitra-lambda-role"
$LAMBDA_ROLE_ARN = "arn:aws:iam::${ACCOUNT_ID}:role/$LAMBDA_ROLE_NAME"

# ENV Variables
$envJsonPath = Join-Path $env:TEMP "lambda-env-m3.json"
$envObj = @{
    Variables = @{
        TABLE_PREFIX          = $TABLE_PREFIX
        BEDROCK_MODEL_ID      = "amazon.nova-pro-v1:0"
        USER_UPLOADS_BUCKET   = "nyaya-mitra-user-uploads-$ACCOUNT_ID"
        USER_DOCUMENTS_BUCKET = "nyaya-mitra-user-documents-$ACCOUNT_ID"
        TEMPLATES_BUCKET      = "nyaya-mitra-templates-$ACCOUNT_ID"
        SES_SENDER_EMAIL      = "noreply@nyayamitra.in"
        ESCALATION_TOPIC_ARN  = ""
        MAX_TOKENS_TIMELINE   = "800"
        MAX_TOKENS_COMPLAINT  = "700"
        MAX_TOKENS_NOTICE     = "700"
        GUEST_QUERY_LIMIT     = "5"
    }
}
$envObj | ConvertTo-Json -Compress | Out-File -FilePath $envJsonPath -Encoding ascii

# ══════════════════════════════════════
#       STEP 1: CREATE LAMBDA FUNCTIONS
# ══════════════════════════════════════
Write-Host "[1/4] Creating 9 Document Lambda Functions..." -ForegroundColor Yellow

# Create dummy zip
$dummyDir = Join-Path $env:TEMP "dummy-lambda-m3"
New-Item -ItemType Directory -Path $dummyDir -Force | Out-Null
"def handler(e,c):`n    return {'statusCode':200,'body':'ok'}" | Out-File -FilePath "$dummyDir\index.py" -Encoding ascii
$dummyZip = Join-Path $env:TEMP "dummy-lambda-m3.zip"
Remove-Item $dummyZip -ErrorAction SilentlyContinue
Compress-Archive -Path "$dummyDir\*" -DestinationPath $dummyZip -Force

$functions = @(
    @("nyaya-mitra-timeline-builder", "60", "256"),
    @("nyaya-mitra-timeline-pdf", "60", "512"),
    @("nyaya-mitra-complaint-generator", "90", "512"),
    @("nyaya-mitra-complaint-delivery", "30", "256"),
    @("nyaya-mitra-notice-scanner", "30", "256"),
    @("nyaya-mitra-notice-analysis", "300", "512"),
    @("nyaya-mitra-deadline-reminder", "30", "128"),
    @("nyaya-mitra-legal-aid-escalator", "30", "256"),
    @("nyaya-mitra-dashboard-widgets", "15", "128")
)

foreach ($fn in $functions) {
    $fnName = $fn[0]
    $fnTimeout = $fn[1]
    $fnMemory = $fn[2]

    aws lambda get-function --function-name $fnName --region $REGION 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  $fnName (exists)" -ForegroundColor DarkGray
    }
    else {
        aws lambda create-function --function-name $fnName --runtime python3.11 --role $LAMBDA_ROLE_ARN --handler "index.handler" --zip-file "fileb://$dummyZip" --timeout $fnTimeout --memory-size $fnMemory --region $REGION --environment "file://$envJsonPath" --output text --query FunctionName 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  $fnName CREATED" -ForegroundColor Green
        }
        else {
            Write-Host "  $fnName ERROR" -ForegroundColor Red
        }
    }
}

Remove-Item $dummyZip -ErrorAction SilentlyContinue
Remove-Item $dummyDir -Recurse -ErrorAction SilentlyContinue

Write-Host "  Lambda Functions created!" -ForegroundColor Green
Write-Host ""

# ══════════════════════════════════════
#       STEP 2: DEPLOY PDF LAYER
# ══════════════════════════════════════
Write-Host "[2/4] Building and deploying PDF Layer..." -ForegroundColor Yellow

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$pdfLayerDir = Join-Path $scriptDir "layers\pdf-layer"

# Check if ReportLab is installed in the layer
$reportlabCheck = Join-Path $pdfLayerDir "python\reportlab"
if (!(Test-Path $reportlabCheck)) {
    Write-Host "  Installing ReportLab into layer..." -ForegroundColor DarkGray
    pip install reportlab --target "$pdfLayerDir\python" --quiet --upgrade 2>$null
}

# Zip the layer
$layerZip = Join-Path $env:TEMP "pdf-layer.zip"
Remove-Item $layerZip -ErrorAction SilentlyContinue
Compress-Archive -Path "$pdfLayerDir\python\*" -DestinationPath $layerZip -Force

# Upload to Lambda
$PDF_LAYER_ARN = aws lambda publish-layer-version --layer-name "nyaya-mitra-pdf" --description "ReportLab PDF generation for Nyaya Mitra" --zip-file "fileb://$layerZip" --compatible-runtimes python3.11 --region $REGION --query 'LayerVersionArn' --output text 2>$null

Remove-Item $layerZip -ErrorAction SilentlyContinue

if ($PDF_LAYER_ARN) {
    Write-Host "  PDF Layer ARN: $PDF_LAYER_ARN" -ForegroundColor Green

    # Attach layer to functions that need it
    foreach ($fnName in @("nyaya-mitra-timeline-pdf", "nyaya-mitra-complaint-generator")) {
        aws lambda update-function-configuration --function-name $fnName --layers $PDF_LAYER_ARN --region $REGION --output text --query FunctionName 2>$null | Out-Null
        Write-Host "  Layer attached to $fnName" -ForegroundColor Green
    }
}
else {
    Write-Host "  PDF Layer deploy failed (non-fatal for demo)" -ForegroundColor DarkGray
}

Write-Host ""

# ══════════════════════════════════════
#       STEP 3: DEPLOY ACTUAL CODE
# ══════════════════════════════════════
Write-Host "[3/4] Deploying actual code to Lambda functions..." -ForegroundColor Yellow

$lambdasDir = Join-Path $scriptDir "lambdas"

$deployMap = @(
    @("nyaya-mitra-timeline-builder", "documents\timeline_builder"),
    @("nyaya-mitra-timeline-pdf", "documents\timeline_pdf_generator"),
    @("nyaya-mitra-complaint-generator", "documents\complaint_generator"),
    @("nyaya-mitra-complaint-delivery", "documents\complaint_delivery"),
    @("nyaya-mitra-notice-scanner", "documents\notice_scanner"),
    @("nyaya-mitra-notice-analysis", "documents\notice_analysis"),
    @("nyaya-mitra-deadline-reminder", "documents\deadline_reminder"),
    @("nyaya-mitra-legal-aid-escalator", "documents\legal_aid_escalator"),
    @("nyaya-mitra-dashboard-widgets", "documents\dashboard_widgets")
)

foreach ($item in $deployMap) {
    $fnName = $item[0]
    $fnFolder = $item[1]
    $folderPath = Join-Path $lambdasDir $fnFolder
    $indexFile = Join-Path $folderPath "index.py"
    $zipPath = Join-Path $env:TEMP "lambda-code-m3.zip"

    if (!(Test-Path $indexFile)) {
        Write-Host "  $fnName - index.py NOT FOUND" -ForegroundColor Red
        continue
    }

    Remove-Item $zipPath -ErrorAction SilentlyContinue
    Compress-Archive -Path "$folderPath\*" -DestinationPath $zipPath -Force

    aws lambda update-function-code --function-name $fnName --zip-file "fileb://$zipPath" --region $REGION --output text --query FunctionName 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  $fnName DEPLOYED" -ForegroundColor Green
    }
    else {
        Write-Host "  $fnName DEPLOY FAILED" -ForegroundColor Red
    }

    Remove-Item $zipPath -ErrorAction SilentlyContinue
}

Write-Host "  Code deployment done!" -ForegroundColor Green
Write-Host ""

# ══════════════════════════════════════
#       STEP 4: CREATE API ROUTES
# ══════════════════════════════════════
Write-Host "[4/4] Adding document API routes..." -ForegroundColor Yellow
Write-Host "  NOTE: Run deploy-apis.ps1 to add routes for document endpoints" -ForegroundColor DarkGray
Write-Host "  Routes needed:" -ForegroundColor DarkGray
Write-Host "    POST /v1/timeline/extract       → nyaya-mitra-timeline-builder" -ForegroundColor DarkGray
Write-Host "    POST /v1/timeline/export         → nyaya-mitra-timeline-pdf" -ForegroundColor DarkGray
Write-Host "    POST /v1/complaints/generate     → nyaya-mitra-complaint-generator" -ForegroundColor DarkGray
Write-Host "    POST /v1/complaints/deliver      → nyaya-mitra-complaint-delivery" -ForegroundColor DarkGray
Write-Host "    POST /v1/notices/upload           → nyaya-mitra-notice-scanner" -ForegroundColor DarkGray
Write-Host "    GET  /v1/notices/{id}/analysis    → nyaya-mitra-notice-scanner" -ForegroundColor DarkGray
Write-Host "    POST /v1/legal-aid/escalate       → nyaya-mitra-legal-aid-escalator" -ForegroundColor DarkGray
Write-Host "    GET  /v1/legal-aid/referrals      → nyaya-mitra-legal-aid-escalator" -ForegroundColor DarkGray
Write-Host "    GET  /v1/dashboard/widgets        → nyaya-mitra-dashboard-widgets" -ForegroundColor DarkGray

Remove-Item $envJsonPath -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "   MEMBER 3 DEPLOY COMPLETE!               " -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Account:   $ACCOUNT_ID" -ForegroundColor Cyan
Write-Host "  Region:    $REGION" -ForegroundColor Cyan
Write-Host "  Lambdas:   9 document functions" -ForegroundColor Cyan
Write-Host "  PDF Layer: $PDF_LAYER_ARN" -ForegroundColor Cyan
Write-Host ""
