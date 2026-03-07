# ╔══════════════════════════════════════════════════════════════╗
# ║   NYAYA MITRA — VERIFICATION & TESTING SCRIPT              ║
# ║   Deploy ke baad chalao — sab check ho jayega!             ║
# ╚══════════════════════════════════════════════════════════════╝

$REGION = "ap-south-1"
$TABLE_PREFIX = "nyaya-mitra"
$ACCOUNT_ID = (aws sts get-caller-identity --query Account --output text)

$totalTests = 0
$passedTests = 0
$failedTests = 0
$failedNames = @()

function Test-Check {
    param([string]$Name, [bool]$Result)
    $script:totalTests++
    if ($Result) {
        Write-Host "  PASS: $Name" -ForegroundColor Green
        $script:passedTests++
    } else {
        Write-Host "  FAIL: $Name" -ForegroundColor Red
        $script:failedTests++
        $script:failedNames += $Name
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   NYAYA MITRA - VERIFICATION START        " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ══════════════════════════════════════
#   TEST 1: AWS CREDENTIALS
# ══════════════════════════════════════
Write-Host "TEST 1 of 7: AWS Credentials" -ForegroundColor Yellow
$identity = aws sts get-caller-identity --output json 2>$null | ConvertFrom-Json
Test-Check "AWS Account accessible ($ACCOUNT_ID)" ($null -ne $identity.Account)
Write-Host ""

# ══════════════════════════════════════
#   TEST 2: S3 BUCKETS
# ══════════════════════════════════════
Write-Host "TEST 2 of 7: S3 Buckets" -ForegroundColor Yellow

$bucketNames = @(
    "nyaya-mitra-legal-corpus-$ACCOUNT_ID",
    "nyaya-mitra-user-uploads-$ACCOUNT_ID",
    "nyaya-mitra-user-documents-$ACCOUNT_ID",
    "nyaya-mitra-frontend-$ACCOUNT_ID",
    "nyaya-mitra-templates-$ACCOUNT_ID"
)

foreach ($b in $bucketNames) {
    aws s3api head-bucket --bucket $b 2>$null | Out-Null
    Test-Check "S3: $b" ($LASTEXITCODE -eq 0)
}

# Legal docs uploaded?
$legalDocs = aws s3 ls "s3://nyaya-mitra-legal-corpus-$ACCOUNT_ID/corpus/" --region $REGION 2>$null
Test-Check "Legal docs in S3 corpus folder" ($null -ne $legalDocs -and $legalDocs.Length -gt 0)
Write-Host ""

# ══════════════════════════════════════
#   TEST 3: DYNAMODB TABLES
# ══════════════════════════════════════
Write-Host "TEST 3 of 7: DynamoDB Tables" -ForegroundColor Yellow

$tables = @(
    "$TABLE_PREFIX-users",
    "$TABLE_PREFIX-sessions",
    "$TABLE_PREFIX-chat-history",
    "$TABLE_PREFIX-connections",
    "$TABLE_PREFIX-risk-assessments",
    "$TABLE_PREFIX-timelines",
    "$TABLE_PREFIX-complaints",
    "$TABLE_PREFIX-scanned-notices",
    "$TABLE_PREFIX-legal-aid-partners",
    "$TABLE_PREFIX-escalation-logs",
    "$TABLE_PREFIX-case-referrals",
    "$TABLE_PREFIX-complaint-analytics"
)

foreach ($t in $tables) {
    $desc = aws dynamodb describe-table --table-name $t --region $REGION --output text --query 'Table.TableStatus' 2>$null
    Test-Check "DynamoDB: $t ($desc)" ($desc -eq "ACTIVE")
}

# Seed data check
$partnerCount = aws dynamodb scan --table-name "$TABLE_PREFIX-legal-aid-partners" --region $REGION --select COUNT --output text --query 'Count' 2>$null
Test-Check "Seed data: legal-aid-partners ($partnerCount records)" ($partnerCount -gt 0)
Write-Host ""

# ══════════════════════════════════════
#   TEST 4: IAM ROLE
# ══════════════════════════════════════
Write-Host "TEST 4 of 7: IAM Role" -ForegroundColor Yellow

$role = aws iam get-role --role-name "nyaya-mitra-lambda-role" --output text --query 'Role.RoleName' 2>$null
Test-Check "IAM Role: nyaya-mitra-lambda-role" ($role -eq "nyaya-mitra-lambda-role")

$attachedPolicies = aws iam list-attached-role-policies --role-name "nyaya-mitra-lambda-role" --output text 2>$null
Test-Check "Policy: DynamoDB access" ($attachedPolicies -match "DynamoDB")
Test-Check "Policy: S3 access" ($attachedPolicies -match "S3")
Test-Check "Policy: Bedrock access" ($attachedPolicies -match "Bedrock")
Test-Check "Policy: Lambda invoke" ($attachedPolicies -match "LambdaRole")
Write-Host ""

# ══════════════════════════════════════
#   TEST 5: LAMBDA FUNCTIONS EXIST
# ══════════════════════════════════════
Write-Host "TEST 5 of 7: Lambda Functions" -ForegroundColor Yellow

$lambdas = @(
    "nyaya-mitra-ws-connect",
    "nyaya-mitra-ws-disconnect",
    "nyaya-mitra-message-orchestrator",
    "nyaya-mitra-intent-classifier",
    "nyaya-mitra-risk-scorer",
    "nyaya-mitra-s3-rag-retriever",
    "nyaya-mitra-bedrock-generator",
    "nyaya-mitra-confidence-calculator",
    "nyaya-mitra-escalation-router",
    "nyaya-mitra-fact-extractor",
    "nyaya-mitra-action-recommender",
    "nyaya-mitra-session-handler",
    "nyaya-mitra-voice-input",
    "nyaya-mitra-voice-status",
    "nyaya-mitra-text-to-speech"
)

foreach ($fn in $lambdas) {
    $state = aws lambda get-function --function-name $fn --region $REGION --output text --query 'Configuration.State' 2>$null
    Test-Check "Lambda: $fn ($state)" ($state -eq "Active")
}
Write-Host ""

# ══════════════════════════════════════
#   TEST 6: INVOKE LAMBDAS (LIVE TEST!)
# ══════════════════════════════════════
Write-Host "TEST 6 of 7: Lambda Invoke Tests (LIVE!)" -ForegroundColor Yellow

# 6a: Risk Scorer
Write-Host "  Testing risk-scorer..." -ForegroundColor DarkGray
$riskPayload = '{"text":"My husband is threatening to kill me","urgency":"HIGH","domain":"family"}'
$riskPayloadPath = Join-Path $env:TEMP "risk-test.json"
$riskResultPath = Join-Path $env:TEMP "risk-result.json"
$riskPayload | Out-File -FilePath $riskPayloadPath -Encoding ascii

aws lambda invoke --function-name "nyaya-mitra-risk-scorer" --payload "file://$riskPayloadPath" --region $REGION $riskResultPath 2>$null | Out-Null

if (Test-Path $riskResultPath) {
    $riskResult = Get-Content $riskResultPath -Raw | ConvertFrom-Json
    Test-Check "Risk Scorer invoke (score=$($riskResult.risk_score) level=$($riskResult.risk_level))" ($null -ne $riskResult.risk_score)
    Test-Check "Risk: violence detected" ($riskResult.breakdown.violence -gt 0)
    Test-Check "Risk: domain_risk for family = 15" ($riskResult.breakdown.domain_risk -eq 15)
} else {
    Test-Check "Risk Scorer invoke" $false
}

# 6b: Action Recommender
Write-Host "  Testing action-recommender..." -ForegroundColor DarkGray
$actionPayload = '{"domain":"criminal","risk_assessment":{"risk_level":"HIGH"},"intent":"EmergencyHelp"}'
$actionPayloadPath = Join-Path $env:TEMP "action-test.json"
$actionResultPath = Join-Path $env:TEMP "action-result.json"
$actionPayload | Out-File -FilePath $actionPayloadPath -Encoding ascii

aws lambda invoke --function-name "nyaya-mitra-action-recommender" --payload "file://$actionPayloadPath" --region $REGION $actionResultPath 2>$null | Out-Null

if (Test-Path $actionResultPath) {
    $actionResult = Get-Content $actionResultPath -Raw | ConvertFrom-Json
    $actionType = $actionResult.primary_action.action_type
    $priority = $actionResult.primary_action.priority
    Test-Check "Action Recommender invoke (action=$actionType priority=$priority)" ($null -ne $actionType)
    Test-Check "Action: Emergency gives URGENT priority" ($priority -eq "URGENT")
} else {
    Test-Check "Action Recommender invoke" $false
}

# 6c: Confidence Calculator
Write-Host "  Testing confidence-calculator..." -ForegroundColor DarkGray
$confPayload = '{"passages":[{"relevance_score":"HIGH"}],"cited_indices":[0],"answer":"Under Section 498A of IPC domestic cruelty is punishable."}'
$confPayloadPath = Join-Path $env:TEMP "conf-test.json"
$confResultPath = Join-Path $env:TEMP "conf-result.json"
$confPayload | Out-File -FilePath $confPayloadPath -Encoding ascii

aws lambda invoke --function-name "nyaya-mitra-confidence-calculator" --payload "file://$confPayloadPath" --region $REGION $confResultPath 2>$null | Out-Null

if (Test-Path $confResultPath) {
    $confResult = Get-Content $confResultPath -Raw | ConvertFrom-Json
    Test-Check "Confidence Calculator invoke (score=$($confResult.confidence_score) label=$($confResult.label))" ($null -ne $confResult.confidence_score)
} else {
    Test-Check "Confidence Calculator invoke" $false
}

# 6d: Session Handler
Write-Host "  Testing session-handler..." -ForegroundColor DarkGray
$sessionPayload = '{"body":"{\"language_code\":\"en\",\"mode_selection\":\"chat\",\"anonymous_mode\":true}"}'
$sessionPayloadPath = Join-Path $env:TEMP "session-test.json"
$sessionResultPath = Join-Path $env:TEMP "session-result.json"
$sessionPayload | Out-File -FilePath $sessionPayloadPath -Encoding ascii

aws lambda invoke --function-name "nyaya-mitra-session-handler" --payload "file://$sessionPayloadPath" --region $REGION $sessionResultPath 2>$null | Out-Null

if (Test-Path $sessionResultPath) {
    $sessionResult = Get-Content $sessionResultPath -Raw | ConvertFrom-Json
    $statusCode = $sessionResult.statusCode
    if ($statusCode -eq 200) {
        $body = $sessionResult.body | ConvertFrom-Json
        Test-Check "Session Handler invoke (session_id=$($body.session_id))" ($null -ne $body.session_id)
        Test-Check "Session: guest gets 5 query limit" ($body.query_limit_remaining -eq 5)
        Test-Check "Session: redirects to /dashboard" ($body.redirect_url -eq "/dashboard")
    } else {
        Test-Check "Session Handler invoke (status=$statusCode)" $false
    }
} else {
    Test-Check "Session Handler invoke" $false
}

# Cleanup temp files
Remove-Item "$env:TEMP\risk-test.json","$env:TEMP\risk-result.json" -ErrorAction SilentlyContinue
Remove-Item "$env:TEMP\action-test.json","$env:TEMP\action-result.json" -ErrorAction SilentlyContinue
Remove-Item "$env:TEMP\conf-test.json","$env:TEMP\conf-result.json" -ErrorAction SilentlyContinue
Remove-Item "$env:TEMP\session-test.json","$env:TEMP\session-result.json" -ErrorAction SilentlyContinue

Write-Host ""

# ══════════════════════════════════════
#   TEST 7: SNS TOPIC
# ══════════════════════════════════════
Write-Host "TEST 7 of 7: SNS Escalation Topic" -ForegroundColor Yellow

$topics = aws sns list-topics --region $REGION --output text 2>$null
Test-Check "SNS: nyaya-mitra-escalation-alerts" ($topics -match "nyaya-mitra-escalation")
Write-Host ""

# ══════════════════════════════════════
#   FINAL REPORT
# ══════════════════════════════════════
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "           TEST RESULTS                    " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Total Tests:  $totalTests" -ForegroundColor White
Write-Host "  PASSED:       $passedTests" -ForegroundColor Green

if ($failedTests -gt 0) {
    Write-Host "  FAILED:       $failedTests" -ForegroundColor Red
} else {
    Write-Host "  FAILED:       0" -ForegroundColor Green
}

Write-Host ""

if ($failedTests -gt 0) {
    Write-Host "  Failed tests:" -ForegroundColor Red
    foreach ($name in $failedNames) {
        Write-Host "    - $name" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "  FIX: deploy-all.ps1 phir se chalao" -ForegroundColor Yellow
} else {
    Write-Host "  SAB KUCH KAAM KAR RAHA HAI!" -ForegroundColor Green
    Write-Host "  Nyaya Mitra Member 2 backend fully deployed!" -ForegroundColor Green
}

$passRate = 0
if ($totalTests -gt 0) {
    $passRate = [math]::Round(($passedTests / $totalTests) * 100)
}

Write-Host ""
if ($passRate -ge 90) {
    Write-Host "  Pass Rate: $passRate%" -ForegroundColor Green
} elseif ($passRate -ge 70) {
    Write-Host "  Pass Rate: $passRate%" -ForegroundColor Yellow
} else {
    Write-Host "  Pass Rate: $passRate%" -ForegroundColor Red
}
Write-Host ""
Write-Host "  Next: python test-live-pipeline.py" -ForegroundColor Yellow
Write-Host ""
