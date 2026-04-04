#!/bin/bash
set -e

echo ""
echo "⚕  ShiftSifter — Setup"
echo "──────────────────────────────────────"

npm install

echo ""
echo "→ Linking to Vercel..."
vercel link

echo ""
echo "→ Adding environment variables..."
echo "re_iF6EWCCt_BL3Xzp3Sibak3mYTHkw6fXmX" | vercel env add RESEND_API_KEY production
echo "jamesgithaiga@mtrh.go.ke" | vercel env add ALLOWED_EMAIL production

echo ""
echo "→ Now go to: https://vercel.com/dashboard"
echo "   Storage → Create Database → KV"
echo "   Then: Settings → Environment Variables"
echo "   Copy these 4 vars to your clipboard and run:"
echo ""
echo "   vercel env add KV_URL production"
echo "   vercel env add KV_REST_API_URL production"
echo "   vercel env add KV_REST_API_TOKEN production"
echo "   vercel env add KV_REST_API_READ_ONLY_TOKEN production"
echo ""
read -p "Press Enter once you've added the KV vars..."

echo ""
echo "→ Deploying..."
vercel --prod

echo ""
echo "✓ Done. ShiftSifter is live."
