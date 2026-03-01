# CloudFront Distribution Setup for Nyaya Mitra
$ErrorActionPreference = "Continue"
$REGION = "ap-south-1"
$env:PAGER = ""
$env:AWS_PAGER = ""

$ACCOUNT_ID = "804078307105"
$BUCKET_NAME = "nyaya-mitra-frontend-$ACCOUNT_ID"
$BUCKET_DOMAIN = "$BUCKET_NAME.s3.ap-south-1.amazonaws.com"

Write-Host "`n=== CloudFront Distribution Setup ===" -ForegroundColor Cyan

# ── Step 1: Create Origin Access Control ──
Write-Host "[1/3] Creating Origin Access Control..." -ForegroundColor Yellow

$oacPath = Join-Path $env:TEMP "oac-config.json"
$oacConfig = @{
    Name                          = "nyaya-mitra-oac"
    Description                   = "OAC for Nyaya Mitra frontend S3 bucket"
    SigningProtocol               = "sigv4"
    SigningBehavior               = "always"
    OriginAccessControlOriginType = "s3"
} | ConvertTo-Json -Compress
$oacConfig | Out-File $oacPath -Encoding ascii

$oacRaw = aws cloudfront create-origin-access-control --origin-access-control-config "file://$oacPath" --region us-east-1 --output json --no-cli-pager 2>&1
Remove-Item $oacPath -ErrorAction SilentlyContinue

$oacJson = $oacRaw | Out-String | ConvertFrom-Json -ErrorAction SilentlyContinue
$OAC_ID = $oacJson.OriginAccessControl.Id

if ($OAC_ID) {
    Write-Host "  OAC Created: $OAC_ID" -ForegroundColor Green
}
else {
    Write-Host "  OAC Error: $oacRaw" -ForegroundColor Red
    exit 1
}

# ── Step 2: Create CloudFront Distribution ──
Write-Host "[2/3] Creating CloudFront Distribution..." -ForegroundColor Yellow

$callerRef = "nyaya-mitra-" + (Get-Date -Format "yyyyMMddHHmmss")

$distConfigPath = Join-Path $env:TEMP "cf-dist-config.json"
$distConfig = @{
    CallerReference      = $callerRef
    Comment              = "Nyaya Mitra AI - Frontend"
    DefaultCacheBehavior = @{
        TargetOriginId       = "S3-nyaya-mitra-frontend"
        ViewerProtocolPolicy = "redirect-to-https"
        AllowedMethods       = @{
            Quantity      = 2
            Items         = @("GET", "HEAD")
            CachedMethods = @{
                Quantity = 2
                Items    = @("GET", "HEAD")
            }
        }
        ForwardedValues      = @{
            QueryString = $false
            Cookies     = @{ Forward = "none" }
        }
        MinTTL               = 0
        DefaultTTL           = 86400
        MaxTTL               = 31536000
        Compress             = $true
    }
    Origins              = @{
        Quantity = 1
        Items    = @(@{
                Id                    = "S3-nyaya-mitra-frontend"
                DomainName            = $BUCKET_DOMAIN
                S3OriginConfig        = @{
                    OriginAccessIdentity = ""
                }
                OriginAccessControlId = $OAC_ID
            })
    }
    Enabled              = $true
    DefaultRootObject    = "index.html"
    PriceClass           = "PriceClass_200"
    CustomErrorResponses = @{
        Quantity = 1
        Items    = @(@{
                ErrorCode          = 403
                ResponsePagePath   = "/index.html"
                ResponseCode       = "200"
                ErrorCachingMinTTL = 300
            })
    }
} | ConvertTo-Json -Depth 10 -Compress
$distConfig | Out-File $distConfigPath -Encoding ascii

$distRaw = aws cloudfront create-distribution --distribution-config "file://$distConfigPath" --output json --no-cli-pager 2>&1
Remove-Item $distConfigPath -ErrorAction SilentlyContinue

$distJson = $distRaw | Out-String | ConvertFrom-Json -ErrorAction SilentlyContinue
$DIST_ID = $distJson.Distribution.Id
$DIST_DOMAIN = $distJson.Distribution.DomainName

if ($DIST_ID) {
    Write-Host "  Distribution: $DIST_ID" -ForegroundColor Green
    Write-Host "  URL: https://$DIST_DOMAIN" -ForegroundColor Green
}
else {
    Write-Host "  Error: $distRaw" -ForegroundColor Red
    exit 1
}

# ── Step 3: Update S3 Bucket Policy for CloudFront OAC ──
Write-Host "[3/3] Updating S3 Bucket Policy..." -ForegroundColor Yellow

$policyPath = Join-Path $env:TEMP "bucket-policy.json"
$policy = @{
    Version   = "2012-10-17"
    Statement = @(@{
            Sid       = "AllowCloudFrontServicePrincipal"
            Effect    = "Allow"
            Principal = @{
                Service = "cloudfront.amazonaws.com"
            }
            Action    = "s3:GetObject"
            Resource  = "arn:aws:s3:::$BUCKET_NAME/*"
            Condition = @{
                StringEquals = @{
                    "AWS:SourceArn" = "arn:aws:cloudfront::${ACCOUNT_ID}:distribution/$DIST_ID"
                }
            }
        })
} | ConvertTo-Json -Depth 10 -Compress
$policy | Out-File $policyPath -Encoding ascii

aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy "file://$policyPath" --region $REGION --no-cli-pager 2>&1 | Out-Null
Remove-Item $policyPath -ErrorAction SilentlyContinue

if ($LASTEXITCODE -eq 0) {
    Write-Host "  Bucket policy updated" -ForegroundColor Green
}
else {
    Write-Host "  Bucket policy may need manual update" -ForegroundColor Yellow
}

# ── Output ──
Write-Host "`n=== CloudFront Setup Complete ===" -ForegroundColor Green
Write-Host "  Distribution ID: $DIST_ID" -ForegroundColor Cyan
Write-Host "  OAC ID:          $OAC_ID" -ForegroundColor Cyan
Write-Host "  Frontend URL:    https://$DIST_DOMAIN" -ForegroundColor Cyan
Write-Host "`n  NOTE: Distribution takes 5-10 mins to fully deploy." -ForegroundColor Yellow
Write-Host "  Status check: aws cloudfront get-distribution --id $DIST_ID --query Distribution.Status" -ForegroundColor DarkGray
Write-Host ""

# Save output
$outPath = Join-Path $env:TEMP "cloudfront-output.txt"
"DIST_ID=$DIST_ID`nDIST_DOMAIN=$DIST_DOMAIN`nOAC_ID=$OAC_ID" | Out-File $outPath -Encoding ascii
