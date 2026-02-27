#!/bin/bash
set -e

# Load from shared .env
source ../infra/config/.env.shared

echo "🏗  Building React app..."
npm run build

echo "📤 Deploying to S3: $FRONTEND_BUCKET"
aws s3 sync dist/ s3://$FRONTEND_BUCKET/ \
  --delete \
  --region ap-south-1 \
  --cache-control "max-age=31536000" \
  --exclude "index.html"

aws s3 cp dist/index.html s3://$FRONTEND_BUCKET/index.html \
  --cache-control "no-cache, no-store, must-revalidate" \
  --content-type "text/html" \
  --region ap-south-1

echo ""
echo "✅ Frontend deployed!"
echo "URL: http://$FRONTEND_BUCKET.s3-website.ap-south-1.amazonaws.com"
echo ""
echo "NOTE: Agar CloudFront use karna hai:"
echo "  1. AWS Console → CloudFront → Create Distribution"
echo "  2. Origin: $FRONTEND_BUCKET.s3.amazonaws.com"
echo "  3. Default root object: index.html"
echo "  4. Error pages: 404 → /index.html (React Router ke liye)"
