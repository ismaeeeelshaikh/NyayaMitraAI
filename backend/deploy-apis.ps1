$Region = "ap-south-1"
$AccountId = (aws sts get-caller-identity --query Account --output text)
$RepoRoot = Split-Path -Parent $PSScriptRoot
$FrontendEnvPath = Join-Path $RepoRoot "frontend\.env.local"

Write-Host "Creating HTTP API..."
$CorsJson = '{"AllowOrigins":["http://localhost:5173","https://nyayamitra.in"],"AllowMethods":["GET","POST","PUT","OPTIONS"],"AllowHeaders":["Content-Type","Authorization","X-Session-Id"]}'
$HttpApiId = aws apigatewayv2 create-api --name "NyayaMitra-HTTP-API" --protocol-type HTTP --cors-configuration $CorsJson --query ApiId --output text

function Create-HttpRoute {
    param($RouteKey, $LambdaName)
    $LambdaArn = "arn:aws:lambda:${Region}:${AccountId}:function:$LambdaName"
    aws lambda add-permission --function-name $LambdaName --statement-id apigw-$LambdaName-$([guid]::NewGuid().ToString().Substring(0,8)) --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "arn:aws:execute-api:${Region}:${AccountId}:${HttpApiId}/*" --region $Region 2>$null
    $IntId = aws apigatewayv2 create-integration --api-id $HttpApiId --integration-type AWS_PROXY --integration-uri $LambdaArn --payload-format-version 2.0 --query IntegrationId --output text
    aws apigatewayv2 create-route --api-id $HttpApiId --route-key $RouteKey --target "integrations/$IntId" | Out-Null
}

Create-HttpRoute "POST /v1/entry/session" "nyaya-mitra-session-handler"
Create-HttpRoute "POST /v1/voice/input" "nyaya-mitra-voice-input"
Create-HttpRoute "GET /v1/voice/status" "nyaya-mitra-voice-status"
Create-HttpRoute "POST /v1/voice/output" "nyaya-mitra-text-to-speech"

# Member 3 Document Routes
Create-HttpRoute "POST /v1/timeline/extract" "nyaya-mitra-timeline-builder"
Create-HttpRoute "POST /v1/timeline/export" "nyaya-mitra-timeline-pdf"
Create-HttpRoute "POST /v1/complaints/generate" "nyaya-mitra-complaint-generator"
Create-HttpRoute "POST /v1/complaints/deliver" "nyaya-mitra-complaint-delivery"
Create-HttpRoute "POST /v1/notices/upload" "nyaya-mitra-notice-scanner"
Create-HttpRoute "GET /v1/notices/{notice_id}/analysis" "nyaya-mitra-notice-scanner"
Create-HttpRoute "POST /v1/legal-aid/escalate" "nyaya-mitra-legal-aid-escalator"
Create-HttpRoute "GET /v1/legal-aid/referrals" "nyaya-mitra-legal-aid-escalator"
Create-HttpRoute "GET /v1/dashboard/widgets" "nyaya-mitra-dashboard-widgets"

aws apigatewayv2 create-stage --api-id $HttpApiId --stage-name prod --auto-deploy | Out-Null
$HttpUrl = "https://${HttpApiId}.execute-api.${Region}.amazonaws.com/prod"

Write-Host "Creating WebSocket API..."
$WsApiId = aws apigatewayv2 create-api --name "NyayaMitra-WS-API" --protocol-type WEBSOCKET --route-selection-expression '$request.body.action' --query ApiId --output text

function Create-WsRoute {
    param($RouteKey, $LambdaName)
    $LambdaArn = "arn:aws:lambda:${Region}:${AccountId}:function:$LambdaName"
    aws lambda add-permission --function-name $LambdaName --statement-id apigw-ws-$LambdaName-$([guid]::NewGuid().ToString().Substring(0,8)) --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "arn:aws:execute-api:${Region}:${AccountId}:${WsApiId}/*" --region $Region 2>$null
    $IntId = aws apigatewayv2 create-integration --api-id $WsApiId --integration-type AWS_PROXY --integration-uri "arn:aws:apigateway:${Region}:lambda:path/2015-03-31/functions/${LambdaArn}/invocations" --query IntegrationId --output text
    aws apigatewayv2 create-route --api-id $WsApiId --route-key "$RouteKey" --target "integrations/$IntId" | Out-Null
}

Create-WsRoute '$connect' "nyaya-mitra-ws-connect"
Create-WsRoute '$disconnect' "nyaya-mitra-ws-disconnect"
Create-WsRoute "sendMessage" "nyaya-mitra-message-orchestrator"

aws apigatewayv2 create-stage --api-id $WsApiId --stage-name prod --auto-deploy | Out-Null
$WsUrl = "wss://${WsApiId}.execute-api.${Region}.amazonaws.com/prod"

Write-Host "APIs created! URLs:"
Write-Host "HTTP: $HttpUrl"
Write-Host "WS: $WsUrl"

# Resolve Cognito values from CloudFormation exports if available
$CognitoDomain = aws cloudformation list-exports --query "Exports[?Name=='NyayaCognitoDomain'].Value | [0]" --output text 2>$null
$CognitoClientId = aws cloudformation list-exports --query "Exports[?Name=='NyayaUserPoolClientId'].Value | [0]" --output text 2>$null

if ([string]::IsNullOrWhiteSpace($CognitoDomain) -or $CognitoDomain -eq "None") {
    $CognitoDomain = "nyaya-mitra-auth.auth.$Region.amazoncognito.com"
}
if ([string]::IsNullOrWhiteSpace($CognitoClientId) -or $CognitoClientId -eq "None") {
    $CognitoClientId = ""
    Write-Host "Warning: Cognito client ID export not found. Set VITE_COGNITO_CLIENT_ID manually." -ForegroundColor Yellow
}

$EnvContent = "VITE_HTTP_API_URL=$HttpUrl
VITE_WEBSOCKET_URL=$WsUrl
VITE_AWS_REGION=$Region
VITE_GUEST_QUERY_LIMIT=5
VITE_COGNITO_DOMAIN=$CognitoDomain
VITE_COGNITO_CLIENT_ID=$CognitoClientId
VITE_COGNITO_REDIRECT_URI=http://localhost:5173/callback
VITE_COGNITO_LOGOUT_URI=http://localhost:5173/"
Set-Content -Path $FrontendEnvPath -Value $EnvContent
Write-Host "Frontend .env.local updated perfectly."
