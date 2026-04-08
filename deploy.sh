#!/bin/bash
# ═══════════════════════════════════════════════
# NASAB — Deploy Script
# Usage: bash deploy.sh
# ═══════════════════════════════════════════════

set -e

echo "═══════════════════════════════════════"
echo "  NASAB — Jaga Nasabmu"
echo "  Deploying to Cloudflare Workers + D1"
echo "═══════════════════════════════════════"
echo ""

# Check wrangler
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Install Node.js first."
    exit 1
fi

# Step 1: Login check
echo "🔑 Step 1: Checking Cloudflare auth..."
npx wrangler whoami 2>/dev/null || {
    echo "Not logged in. Running wrangler login..."
    npx wrangler login
}
echo ""

# Step 2: Deploy Worker
echo "🚀 Step 2: Deploying NASAB API Worker..."
cd api/
npx wrangler deploy
echo ""

# Step 3: Verify
echo "🔍 Step 3: Verifying deployment..."
WORKER_URL="https://nasab-api.mshadianto.workers.dev"
echo "Testing health endpoint..."
curl -s "${WORKER_URL}/api/health" | python3 -m json.tool 2>/dev/null || echo "(curl test skipped)"
echo ""

echo "═══════════════════════════════════════"
echo "  ✅ NASAB API DEPLOYED!"
echo ""
echo "  API URL: ${WORKER_URL}"
echo "  Health:  ${WORKER_URL}/api/health"
echo ""
echo "  D1 Database: nasab-db"
echo "  ID: 745e2555-b659-4eb7-bc60-5a705eb6a15a"
echo ""
echo "  Next: Update API_URL in frontend"
echo "═══════════════════════════════════════"
