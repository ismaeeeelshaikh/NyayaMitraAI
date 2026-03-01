# Update BEDROCK_MODEL_ID on all Nyaya Mitra Lambdas
$REGION = "ap-south-1"
$env:PAGER = ""
$env:AWS_PAGER = ""
$NEW_MODEL = "amazon.nova-pro-v1:0"

Write-Host "=== Updating Lambda BEDROCK_MODEL_ID ===" -ForegroundColor Cyan

$fnsRaw = aws lambda list-functions --region $REGION --query "Functions[?starts_with(FunctionName, 'nyaya-mitra')].FunctionName" --output text --no-cli-pager 2>&1
$fns = $fnsRaw -split "`t"

$updated = 0
$skipped = 0

foreach ($fn in $fns) {
    $fn = $fn.Trim()
    if (-not $fn) { continue }

    $envRaw = aws lambda get-function-configuration --function-name $fn --region $REGION --query "Environment" --output json --no-cli-pager 2>&1
    $envStr = $envRaw | Out-String

    if ($envStr -match '"BEDROCK_MODEL_ID"') {
        if ($envStr -match $NEW_MODEL) {
            Write-Host "  $fn (already Nova)" -ForegroundColor DarkGray
            $skipped++
            continue
        }

        $envObj = $envStr | ConvertFrom-Json
        $envObj.Variables.BEDROCK_MODEL_ID = $NEW_MODEL

        $tmpPath = Join-Path $env:TEMP "lambda-env-tmp.json"
        $envObj | ConvertTo-Json -Compress -Depth 5 | Out-File $tmpPath -Encoding ascii

        aws lambda update-function-configuration --function-name $fn --environment "file://$tmpPath" --region $REGION --output text --query FunctionName --no-cli-pager 2>&1 | Out-Null
        Remove-Item $tmpPath -ErrorAction SilentlyContinue

        Write-Host "  $fn UPDATED" -ForegroundColor Green
        $updated++
        Start-Sleep -Milliseconds 500
    }
    else {
        Write-Host "  $fn (no BEDROCK_MODEL_ID)" -ForegroundColor DarkGray
        $skipped++
    }
}

Write-Host "`nDone: $updated updated, $skipped skipped" -ForegroundColor Green
