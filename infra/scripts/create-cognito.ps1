# Cognito User Pool Setup for Nyaya Mitra
$ErrorActionPreference = "Continue"
$REGION = "ap-south-1"
$env:PAGER = ""
$env:AWS_PAGER = ""

Write-Host "`n=== COGNITO USER POOL SETUP ===" -ForegroundColor Cyan

# ── Step 1: Create User Pool (email-only auto-verify, no SMS needed) ──
Write-Host "[1/5] Creating User Pool..." -ForegroundColor Yellow

$policiesPath = Join-Path $env:TEMP "cp.json"
'{"PasswordPolicy":{"MinimumLength":8,"RequireUppercase":false,"RequireLowercase":true,"RequireNumbers":true,"RequireSymbols":true}}' | Out-File $policiesPath -Encoding ascii

$schemaPath = Join-Path $env:TEMP "cs.json"
'[{"Name":"email","Required":true,"Mutable":true},{"Name":"phone_number","Required":false,"Mutable":true},{"Name":"pref_language","AttributeDataType":"String","Mutable":true,"Required":false,"StringAttributeConstraints":{"MinLength":"0","MaxLength":"10"}},{"Name":"location_state","AttributeDataType":"String","Mutable":true,"Required":false,"StringAttributeConstraints":{"MinLength":"0","MaxLength":"50"}},{"Name":"location_dist","AttributeDataType":"String","Mutable":true,"Required":false,"StringAttributeConstraints":{"MinLength":"0","MaxLength":"50"}},{"Name":"anon_mode","AttributeDataType":"String","Mutable":true,"Required":false,"StringAttributeConstraints":{"MinLength":"0","MaxLength":"10"}}]' | Out-File $schemaPath -Encoding ascii

$recoveryPath = Join-Path $env:TEMP "cr.json"
'{"RecoveryMechanisms":[{"Priority":1,"Name":"verified_email"},{"Priority":2,"Name":"verified_phone_number"}]}' | Out-File $recoveryPath -Encoding ascii

$raw = aws cognito-idp create-user-pool --pool-name "nyaya-mitra-users" --auto-verified-attributes email --alias-attributes email phone_number --mfa-configuration OFF --policies "file://$policiesPath" --schema "file://$schemaPath" --account-recovery-setting "file://$recoveryPath" --region $REGION --output json --no-cli-pager 2>&1
Remove-Item $policiesPath, $schemaPath, $recoveryPath -ErrorAction SilentlyContinue

try {
    $poolJson = $raw | Out-String | ConvertFrom-Json
    $USER_POOL_ID = $poolJson.UserPool.Id
}
catch {
    Write-Host "  ERROR: $raw" -ForegroundColor Red
    exit 1
}
if (-not $USER_POOL_ID) { Write-Host "  ERROR: $raw" -ForegroundColor Red; exit 1 }
Write-Host "  Pool: $USER_POOL_ID" -ForegroundColor Green

# ── Step 2: Groups ──
Write-Host "[2/5] Creating Groups..." -ForegroundColor Yellow
foreach ($g in @("admin", "legal_aid_partner", "registered")) {
    aws cognito-idp create-group --user-pool-id $USER_POOL_ID --group-name $g --region $REGION --no-cli-pager 2>$null | Out-Null
    Write-Host "  $g" -ForegroundColor Green
}

# ── Step 3: App Client ──
Write-Host "[3/5] Creating App Client..." -ForegroundColor Yellow
$tuPath = Join-Path $env:TEMP "tu.json"
'{"AccessToken":"hours","IdToken":"hours","RefreshToken":"days"}' | Out-File $tuPath -Encoding ascii

$craw = aws cognito-idp create-user-pool-client --user-pool-id $USER_POOL_ID --client-name "nyaya-mitra-web" --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_USER_SRP_AUTH ALLOW_CUSTOM_AUTH ALLOW_REFRESH_TOKEN_AUTH --supported-identity-providers COGNITO --callback-urls "http://localhost:5173/callback" "https://nyayamitra.in/callback" --logout-urls "http://localhost:5173/" "https://nyayamitra.in/" --allowed-o-auth-flows code --allowed-o-auth-scopes email openid profile --allowed-o-auth-flows-user-pool-client --access-token-validity 1 --id-token-validity 1 --refresh-token-validity 30 --token-validity-units "file://$tuPath" --prevent-user-existence-errors ENABLED --region $REGION --output json --no-cli-pager 2>&1
Remove-Item $tuPath -ErrorAction SilentlyContinue

try { $cJson = $craw | Out-String | ConvertFrom-Json } catch { Write-Host "  ERROR: $craw" -ForegroundColor Red }
$CLIENT_ID = $cJson.UserPoolClient.ClientId
if ($CLIENT_ID) { Write-Host "  Client: $CLIENT_ID" -ForegroundColor Green }
else { Write-Host "  ERROR: $craw" -ForegroundColor Red }

# ── Step 4: Domain ──
Write-Host "[4/5] Creating Domain..." -ForegroundColor Yellow
aws cognito-idp create-user-pool-domain --user-pool-id $USER_POOL_ID --domain "nyaya-mitra-auth" --region $REGION --no-cli-pager 2>&1 | Out-Null
Write-Host "  nyaya-mitra-auth.auth.ap-south-1.amazoncognito.com" -ForegroundColor Green

# ── Output ──
Write-Host "`n=== COGNITO COMPLETE ===" -ForegroundColor Green
Write-Host "  Pool ID:   $USER_POOL_ID" -ForegroundColor Cyan
Write-Host "  Client ID: $CLIENT_ID" -ForegroundColor Cyan
Write-Host ""

# Save for other scripts
$outPath = Join-Path $env:TEMP "cognito-output.txt"
"USER_POOL_ID=$USER_POOL_ID`nCLIENT_ID=$CLIENT_ID" | Out-File $outPath -Encoding ascii
