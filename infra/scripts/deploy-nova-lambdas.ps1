# Deploy 4 Nova-migrated Lambda code files
$ErrorActionPreference = "Continue"
$REGION = "ap-south-1"
$env:PAGER = ""
$env:AWS_PAGER = ""

$scriptDir = "c:\Users\shaik\OneDrive\Desktop\nyayaMitraAI\backend\lambdas"

$deployMap = @(
    @("nyaya-mitra-bedrock-generator", "chat\bedrock_generator"),
    @("nyaya-mitra-fact-extractor", "chat\fact_extractor"),
    @("nyaya-mitra-complaint-generator", "documents\complaint_generator"),
    @("nyaya-mitra-timeline-builder", "documents\timeline_builder")
)

Write-Host "=== Deploying 4 Nova-migrated Lambdas ===" -ForegroundColor Cyan

foreach ($item in $deployMap) {
    $fnName = $item[0]
    $fnFolder = $item[1]
    $folderPath = Join-Path $scriptDir $fnFolder
    $zipPath = Join-Path $env:TEMP "lambda-nova-deploy.zip"

    if (!(Test-Path (Join-Path $folderPath "index.py"))) {
        Write-Host "  $fnName — index.py NOT FOUND" -ForegroundColor Red
        continue
    }

    Remove-Item $zipPath -ErrorAction SilentlyContinue
    Compress-Archive -Path "$folderPath\*" -DestinationPath $zipPath -Force

    aws lambda update-function-code --function-name $fnName --zip-file "fileb://$zipPath" --region $REGION --output text --query FunctionName --no-cli-pager 2>&1 | Out-Null

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  $fnName DEPLOYED" -ForegroundColor Green
    }
    else {
        Write-Host "  $fnName FAILED" -ForegroundColor Red
    }

    Remove-Item $zipPath -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 500
}

Write-Host "`nDone!" -ForegroundColor Green
