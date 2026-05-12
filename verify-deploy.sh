#!/usr/bin/env bash
# verify-deploy.sh
# Auto-verifier untuk NASAB performance & security fix
# Jalankan: bash verify-deploy.sh
# Atau:    chmod +x verify-deploy.sh && ./verify-deploy.sh

set -u

DOMAIN="${DOMAIN:-https://nasab.biz.id}"
API="${API:-https://nasab-api.sopian-hadianto.workers.dev}"

# Colors
G='\033[0;32m'  # Green
R='\033[0;31m'  # Red
Y='\033[0;33m'  # Yellow
C='\033[0;36m'  # Cyan
N='\033[0m'     # No color

PASS=0
FAIL=0
WARN=0

pass() { echo -e "  ${G}✓${N} $1"; PASS=$((PASS+1)); }
fail() { echo -e "  ${R}✗${N} $1"; FAIL=$((FAIL+1)); }
warn() { echo -e "  ${Y}⚠${N} $1"; WARN=$((WARN+1)); }
info() { echo -e "  ${C}ℹ${N} $1"; }

section() {
  echo ""
  echo -e "${C}━━━ $1 ━━━${N}"
}

# Helper: get response header value
header_value() {
  local url="$1"
  local header="$2"
  curl -sSI "$url" | grep -i "^${header}:" | head -1 | sed "s/^${header}: //I" | tr -d '\r\n'
}

# Helper: get response time
response_time() {
  curl -sS -o /dev/null -w "%{time_total}" "$1"
}

# Helper: get http status
http_status() {
  curl -sS -o /dev/null -w "%{http_code}" "$1" -A "${2:-Mozilla/5.0}"
}

echo ""
echo -e "${C}╔════════════════════════════════════════════════════════╗${N}"
echo -e "${C}║  NASAB Deployment Verifier                             ║${N}"
echo -e "${C}║  Target: ${DOMAIN}                              ║${N}"
echo -e "${C}╚════════════════════════════════════════════════════════╝${N}"
echo ""
echo "Tanggal: $(date)"
echo "API:     $API"

# ════════════════════════════════════════════════════════════
section "1. KONEKTIVITAS DASAR"
# ════════════════════════════════════════════════════════════

STATUS=$(http_status "$DOMAIN/")
if [ "$STATUS" = "200" ]; then
  pass "Homepage reachable (HTTP $STATUS)"
else
  fail "Homepage HTTP $STATUS (expected 200)"
fi

STATUS=$(http_status "$API/api/health")
if [ "$STATUS" = "200" ]; then
  pass "API health endpoint reachable (HTTP $STATUS)"
else
  fail "API health HTTP $STATUS"
fi

# ════════════════════════════════════════════════════════════
section "2. CACHE HEADERS (P0)"
# ════════════════════════════════════════════════════════════

# 2a. index.html harus must-revalidate
INDEX_CC=$(header_value "$DOMAIN/" "cache-control")
info "index.html cache-control: $INDEX_CC"
if echo "$INDEX_CC" | grep -qE "max-age=0.*must-revalidate"; then
  pass "index.html must-revalidate ✓"
else
  fail "index.html cache-control salah (expected: max-age=0, must-revalidate)"
fi

# 2b. Hashed asset harus immutable
# Cari nama bundle JS dari index.html
BUNDLE_PATH=$(curl -sS "$DOMAIN/" | grep -oE '/assets/index-[a-zA-Z0-9_-]+\.js' | head -1)
if [ -n "$BUNDLE_PATH" ]; then
  ASSET_CC=$(header_value "${DOMAIN}${BUNDLE_PATH}" "cache-control")
  info "$BUNDLE_PATH cache-control: $ASSET_CC"
  if echo "$ASSET_CC" | grep -qE "max-age=(2592000|31536000).*immutable"; then
    pass "Hashed asset immutable ✓"
  else
    fail "Asset cache-control salah (expected: max-age=31536000, immutable)"
  fi

  # 2c. Cache HIT pada hit ke-2
  curl -sS -o /dev/null "${DOMAIN}${BUNDLE_PATH}"  # warm up
  sleep 1
  HIT1=$(header_value "${DOMAIN}${BUNDLE_PATH}" "cf-cache-status")
  HIT2=$(header_value "${DOMAIN}${BUNDLE_PATH}" "cf-cache-status")
  info "Asset hit#1: $HIT1, hit#2: $HIT2"
  if [ "$HIT2" = "HIT" ]; then
    pass "Cloudflare edge cache HIT pada repeat request ✓"
  else
    warn "Cache status: $HIT2 (mungkin masih warming up — coba lagi 1-2 menit)"
  fi
else
  warn "Tidak bisa parse path bundle JS dari index.html"
fi

# 2d. /api/* harus no-store
API_CC=$(header_value "$API/api/health" "cache-control")
info "/api/health cache-control: $API_CC"
if echo "$API_CC" | grep -qiE "no-store|private"; then
  pass "API endpoint no-store ✓"
else
  warn "API cache-control: $API_CC (sebaiknya: private, no-store)"
fi

# ════════════════════════════════════════════════════════════
section "3. SECURITY HEADERS"
# ════════════════════════════════════════════════════════════

# HSTS
HSTS=$(header_value "$DOMAIN/" "strict-transport-security")
if [ -n "$HSTS" ]; then
  pass "HSTS: $HSTS"
else
  fail "Strict-Transport-Security tidak ada"
fi

# X-Frame-Options
XFO=$(header_value "$DOMAIN/" "x-frame-options")
if [ -n "$XFO" ]; then
  pass "X-Frame-Options: $XFO"
else
  fail "X-Frame-Options tidak ada"
fi

# X-Content-Type-Options
XCTO=$(header_value "$DOMAIN/" "x-content-type-options")
if echo "$XCTO" | grep -qi "nosniff"; then
  pass "X-Content-Type-Options: nosniff ✓"
else
  fail "X-Content-Type-Options tidak ada/salah"
fi

# Referrer-Policy
RP=$(header_value "$DOMAIN/" "referrer-policy")
if [ -n "$RP" ]; then
  pass "Referrer-Policy: $RP"
else
  warn "Referrer-Policy tidak ada"
fi

# Permissions-Policy
PP=$(header_value "$DOMAIN/" "permissions-policy")
if [ -n "$PP" ]; then
  pass "Permissions-Policy ada"
else
  warn "Permissions-Policy tidak ada"
fi

# CSP (enforce atau report-only)
CSP=$(header_value "$DOMAIN/" "content-security-policy")
CSP_RO=$(header_value "$DOMAIN/" "content-security-policy-report-only")
if [ -n "$CSP" ]; then
  pass "Content-Security-Policy ENFORCE aktif (P1) ✓"
elif [ -n "$CSP_RO" ]; then
  warn "CSP masih Report-Only (P0 - normal, migrate ke enforce setelah monitor)"
else
  fail "CSP tidak ada"
fi

# ════════════════════════════════════════════════════════════
section "4. AI BOT BLOCKING"
# ════════════════════════════════════════════════════════════

for BOT in "GPTBot/1.0" "ClaudeBot/1.0" "CCBot/2.0" "Bytespider"; do
  STATUS=$(http_status "$DOMAIN/" "Mozilla/5.0 (compatible; $BOT)")
  if [ "$STATUS" = "403" ] || [ "$STATUS" = "401" ] || [ "$STATUS" = "429" ]; then
    pass "$BOT diblok (HTTP $STATUS) ✓"
  elif [ "$STATUS" = "200" ]; then
    fail "$BOT TIDAK diblok (HTTP $STATUS) — aktifkan AI Crawl Control di Cloudflare"
  else
    warn "$BOT → HTTP $STATUS"
  fi
done

# Pastikan Googlebot tetap diizinkan (untuk SEO)
STATUS=$(http_status "$DOMAIN/" "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")
if [ "$STATUS" = "200" ]; then
  pass "Googlebot diizinkan (HTTP 200) ✓"
else
  warn "Googlebot dapat HTTP $STATUS — cek konfigurasi SEO bot"
fi

# ════════════════════════════════════════════════════════════
section "5. PERFORMANCE TIMING"
# ════════════════════════════════════════════════════════════

# TTFB landing
TTFB=$(curl -sS -o /dev/null -w "%{time_starttransfer}" "$DOMAIN/")
info "TTFB landing page: ${TTFB}s"
TTFB_MS=$(echo "$TTFB" | awk '{printf "%d", $1*1000}')
if [ "$TTFB_MS" -lt 500 ]; then
  pass "TTFB <500ms ✓"
elif [ "$TTFB_MS" -lt 1000 ]; then
  warn "TTFB ${TTFB_MS}ms (target <500ms setelah P0 cache fix)"
else
  fail "TTFB ${TTFB_MS}ms TERLALU LAMBAT"
fi

# Bundle size
if [ -n "$BUNDLE_PATH" ]; then
  BUNDLE_SIZE=$(curl -sS -o /dev/null -w "%{size_download}" "${DOMAIN}${BUNDLE_PATH}")
  BUNDLE_KB=$((BUNDLE_SIZE / 1024))
  info "Main bundle size: ${BUNDLE_KB}KB"
  if [ "$BUNDLE_KB" -lt 100 ]; then
    pass "Main bundle <100KB (P1 done) ✓"
  elif [ "$BUNDLE_KB" -lt 200 ]; then
    warn "Main bundle ${BUNDLE_KB}KB — lakukan code splitting (P1)"
  else
    fail "Main bundle ${BUNDLE_KB}KB TERLALU BESAR untuk first paint"
  fi
fi

# API cold start
API_TTFB=$(curl -sS -o /dev/null -w "%{time_starttransfer}" "$API/api/public/stats")
info "API /api/public/stats TTFB: ${API_TTFB}s"

# ════════════════════════════════════════════════════════════
section "6. AI PROXY CHECK (P1)"
# ════════════════════════════════════════════════════════════

# Cek bundle untuk panggilan langsung ke AI provider (tanda P1 belum dijalankan)
if [ -n "$BUNDLE_PATH" ]; then
  BUNDLE_CONTENT=$(curl -sS "${DOMAIN}${BUNDLE_PATH}")

  if echo "$BUNDLE_CONTENT" | grep -q "api.anthropic.com"; then
    warn "Bundle masih panggil api.anthropic.com langsung (P1 belum dijalankan)"
  else
    pass "Bundle tidak panggil api.anthropic.com langsung ✓"
  fi

  if echo "$BUNDLE_CONTENT" | grep -q "api.groq.com"; then
    warn "Bundle masih panggil api.groq.com langsung (P1 belum dijalankan)"
  else
    pass "Bundle tidak panggil api.groq.com langsung ✓"
  fi

  if echo "$BUNDLE_CONTENT" | grep -q "generativelanguage.googleapis.com"; then
    warn "Bundle masih panggil Gemini langsung (P1 belum dijalankan)"
  else
    pass "Bundle tidak panggil Gemini langsung ✓"
  fi

  if echo "$BUNDLE_CONTENT" | grep -q "anthropic-dangerous-direct-browser-access"; then
    fail "Bundle masih pakai 'anthropic-dangerous-direct-browser-access' — security risk"
  else
    pass "Tidak ada flag 'dangerous-direct-browser-access' ✓"
  fi
fi

# AI proxy endpoint check (POST-only — GET hits would 404)
PROXY_STATUS=$(curl -sS -o /dev/null -w "%{http_code}" -X POST \
  -H "Content-Type: application/json" -d '{}' \
  "$API/api/ai/proxy")
if [ "$PROXY_STATUS" = "401" ] || [ "$PROXY_STATUS" = "403" ]; then
  pass "/api/ai/proxy ada dan butuh auth (HTTP $PROXY_STATUS) ✓"
elif [ "$PROXY_STATUS" = "400" ]; then
  pass "/api/ai/proxy ada (HTTP 400 — payload rejected, OK) ✓"
elif [ "$PROXY_STATUS" = "404" ]; then
  info "/api/ai/proxy belum di-deploy (P1 pending)"
else
  warn "/api/ai/proxy → HTTP $PROXY_STATUS"
fi

# ════════════════════════════════════════════════════════════
section "7. SERVICE WORKER VERSION"
# ════════════════════════════════════════════════════════════

SW_CACHE=$(curl -sS "$DOMAIN/sw.js" | grep -oE "CACHE\s*=\s*'nasab-v[0-9]+'" | head -1)
info "$SW_CACHE"
SW_VER=$(echo "$SW_CACHE" | grep -oE "v[0-9]+")
SW_NUM=$(echo "$SW_VER" | tr -d 'v')
if [ -n "$SW_NUM" ] && [ "$SW_NUM" -ge 32 ]; then
  pass "Service Worker version $SW_VER (>= v32 P0 fix applied) ✓"
elif [ -n "$SW_NUM" ]; then
  fail "Service Worker masih $SW_VER — bump ke nasab-v32 (P0)"
else
  warn "Tidak bisa detect SW version"
fi

# Cek SW strategy untuk index.html
SW_BODY=$(curl -sS "$DOMAIN/sw.js")
if echo "$SW_BODY" | grep -q "network-first\|networkFirst" ||
   echo "$SW_BODY" | grep -qE "pathname\s*===\s*['\"]\/['\"]\s*[\|&]\s*[a-z]+\s*=>\s*fetch"; then
  pass "SW pakai network-first untuk index.html ✓"
else
  warn "SW strategy untuk index.html perlu dicek manual"
fi

# ════════════════════════════════════════════════════════════
section "8. RATE LIMIT API (basic)"
# ════════════════════════════════════════════════════════════

# LOGIN_LIMIT is 10/60s — send 12 to ensure the limiter actually fires.
info "Sending 12 rapid requests ke /api/auth/login (cek rate limit)..."
SUCCESS=0
LIMITED=0
for i in $(seq 1 12); do
  CODE=$(curl -sS -o /dev/null -w "%{http_code}" -X POST "$API/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"x"}')
  if [ "$CODE" = "429" ] || [ "$CODE" = "403" ]; then
    LIMITED=$((LIMITED+1))
  else
    SUCCESS=$((SUCCESS+1))
  fi
done
info "Rate test: $SUCCESS bypassed, $LIMITED rate-limited"
if [ "$LIMITED" -gt 0 ]; then
  pass "Rate limiting aktif pada /api/auth/login ✓"
else
  warn "Tidak ada rate limit terdeteksi (mungkin threshold lebih tinggi atau belum aktif)"
fi

# ════════════════════════════════════════════════════════════
# SUMMARY
# ════════════════════════════════════════════════════════════
echo ""
echo -e "${C}╔════════════════════════════════════════════════════════╗${N}"
echo -e "${C}║  RINGKASAN                                             ║${N}"
echo -e "${C}╚════════════════════════════════════════════════════════╝${N}"
echo ""
echo -e "  ${G}✓ PASS:${N} $PASS"
echo -e "  ${Y}⚠ WARN:${N} $WARN"
echo -e "  ${R}✗ FAIL:${N} $FAIL"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo -e "${R}✗ Ada $FAIL kegagalan kritis. Cek log di atas dan fix sebelum announce.${N}"
  exit 1
elif [ "$WARN" -gt 0 ]; then
  echo -e "${Y}⚠ Ada $WARN warning. P0 minimum tercapai; pertimbangkan lanjut ke P1.${N}"
  exit 0
else
  echo -e "${G}✓ Semua check pass. Deploy looking good!${N}"
  exit 0
fi
