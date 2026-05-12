#!/bin/bash
# ============================================================
# NASAB Security Regression Test Suite
# ============================================================
# Verifikasi fix dari PROMPT-SECURITY-HARDENING-v1.md
#
# Usage:
#   chmod +x tests/security.sh
#   BASE=https://nasab-api.sopian-hadianto.workers.dev FRONT=https://nasab.biz.id ./tests/security.sh
#
# Atau lokal:
#   BASE=http://localhost:8787 FRONT=http://localhost:5173 ./tests/security.sh
#
# IMPORTANT: Run AFTER Worker + frontend + D1 migration are deployed to
# the target environment. Pre-deploy execution will report multiple
# FAILs that are not real regressions.
# ============================================================

set -uo pipefail

BASE=${BASE:-https://nasab-api.sopian-hadianto.workers.dev}
FRONT=${FRONT:-https://nasab.biz.id}

PASS=0
FAIL=0
FAILED_TESTS=()

color_red()   { printf "\033[31m%s\033[0m" "$*"; }
color_green() { printf "\033[32m%s\033[0m" "$*"; }
color_blue()  { printf "\033[34m%s\033[0m" "$*"; }

section() {
  echo ""
  echo "$(color_blue "═══ $* ═══")"
}

assert_eq() {
  local label="$1"; local expected="$2"; local actual="$3"
  if [ "$expected" = "$actual" ]; then
    echo "  $(color_green "✅ PASS") $label"
    PASS=$((PASS+1))
  else
    echo "  $(color_red "❌ FAIL") $label"
    echo "      expected: $expected"
    echo "      actual:   $actual"
    FAIL=$((FAIL+1))
    FAILED_TESTS+=("$label")
  fi
}

assert_ne() {
  local label="$1"; local notexpected="$2"; local actual="$3"
  if [ "$notexpected" != "$actual" ]; then
    echo "  $(color_green "✅ PASS") $label"
    PASS=$((PASS+1))
  else
    echo "  $(color_red "❌ FAIL") $label (got forbidden value: $actual)"
    FAIL=$((FAIL+1))
    FAILED_TESTS+=("$label")
  fi
}

echo "🛡️  NASAB Security Regression Suite"
echo "API:      $BASE"
echo "Frontend: $FRONT"

# ============================================================
section "CRIT-01: Old reset-password (name-matching) blocked"
# ============================================================
# Payload lama dengan {email, name, new_password} harusnya REJECT
# (token format tidak match → token.length !== 64)
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/reset-password" \
  -H "Content-Type: application/json" \
  -d '{"email":"victim@test.com","name":"Anyone","new_password":"Attacker123!"}')
assert_eq "Legacy name-matching payload rejected (expect 400)" "400" "$STATUS"


# ============================================================
section "CRIT-02: JWT signature forgery"
# ============================================================
# Format JWT lama: signature 16 char base64 (~12 byte) — harusnya invalid
FAKE_OLD_TOKEN="eyJ1aWQiOiJ1XzEiLCJleHAiOjk5OTk5OTk5OTk5fQ.YWFhYWFhYWFhYWFhYWFhYQ"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/auth/me" \
  -H "Authorization: Bearer $FAKE_OLD_TOKEN")
assert_eq "Old short-signature JWT rejected" "401" "$STATUS"

# Bogus token random
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/auth/me" \
  -H "Authorization: Bearer abc.xyz")
assert_eq "Malformed JWT rejected" "401" "$STATUS"

# Token kosong / tanpa Bearer prefix
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/auth/me" \
  -H "Authorization: invalid_format")
assert_eq "Non-Bearer auth rejected" "401" "$STATUS"


# ============================================================
section "CRIT-03: Health check (verify env secrets are set)"
# ============================================================
# Kalau secret tidak di-set, request akan throw 500 (intentional fail-loud)
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/health")
assert_eq "Health endpoint responds (secrets configured)" "200" "$STATUS"


# ============================================================
section "HIGH-01: CORS subdomain bypass"
# ============================================================
EVIL_ORIGIN="https://nasab.biz.id.evil.com"
RESPONSE_ORIGIN=$(curl -s -I "$BASE/api/health" -H "Origin: $EVIL_ORIGIN" \
  | grep -i "^access-control-allow-origin:" | tr -d '\r' | awk '{print $2}')
assert_ne "Evil subdomain not echoed in ACAO" "$EVIL_ORIGIN" "$RESPONSE_ORIGIN"

# Verifikasi origin yang sah tetap di-allow
LEGIT_ORIGIN="https://nasab.biz.id"
RESPONSE_ORIGIN=$(curl -s -I "$BASE/api/health" -H "Origin: $LEGIT_ORIGIN" \
  | grep -i "^access-control-allow-origin:" | tr -d '\r' | awk '{print $2}')
assert_eq "Legit origin allowed" "$LEGIT_ORIGIN" "$RESPONSE_ORIGIN"


# ============================================================
section "HIGH-02: CSP enforced (bukan report-only) di frontend"
# ============================================================
# v1 posture: CSP may be DRAFT (Report-Only) or ENFORCED — both are
# acceptable. A regression is "neither header present". Enforce-flip
# deferred to v1.1 per Group E decision (PROMPT row 5 HIGH-02 DRAFT).
CSP_RO=$(curl -s -I "$FRONT/" | grep -ic "^content-security-policy-report-only:")
CSP_EN=$(curl -s -I "$FRONT/" | grep -ic "^content-security-policy:")
CSP_ANY=$((CSP_RO + CSP_EN))
[ "$CSP_ANY" -ge 1 ] && CSP_OK=1 || CSP_OK=0
assert_eq "CSP present (enforce or report-only)" "1" "$CSP_OK"
if [ "$CSP_EN" = "0" ] && [ "$CSP_RO" = "1" ]; then
  echo "  $(color_blue "ℹ️  NOTE") CSP currently Report-Only (v1). Enforce-flip pending v1.1."
fi

# Frame-ancestors
FA=$(curl -s -I "$FRONT/" | grep -i "x-frame-options:" | tr -d '\r' | awk '{print $2}')
assert_eq "X-Frame-Options DENY" "DENY" "$FA"


# ============================================================
section "HIGH-03: Password complexity enforcement"
# ============================================================
TEST_EMAIL="sec-test-$(date +%s)-$$@nasab-test.invalid"

# Password terlalu pendek
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Sec Test\",\"email\":\"$TEST_EMAIL\",\"password\":\"short1\"}")
assert_eq "Short password rejected" "400" "$STATUS"

# Password tanpa uppercase
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Sec Test\",\"email\":\"$TEST_EMAIL\",\"password\":\"alllowercase123\"}")
assert_eq "No-uppercase password rejected" "400" "$STATUS"

# Password tanpa angka
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Sec Test\",\"email\":\"$TEST_EMAIL\",\"password\":\"NoNumbersHere\"}")
assert_eq "No-digit password rejected" "400" "$STATUS"


# ============================================================
section "Forgot password: anti-enumeration (response identik)"
# ============================================================
RESP_EXIST=$(curl -s -X POST "$BASE/api/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"email":"existing@nasab.biz.id"}')
RESP_NOT=$(curl -s -X POST "$BASE/api/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"nonexistent-$(date +%s)@nowhere.invalid\"}")
assert_eq "Response identical for existing vs non-existent email" "$RESP_EXIST" "$RESP_NOT"

# Status code juga harus 200 untuk kedua kasus
STATUS_EXIST=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"email":"existing@nasab.biz.id"}')
assert_eq "Forgot password always 200 (no enumeration via status)" "200" "$STATUS_EXIST"


# ============================================================
section "Security headers di API"
# ============================================================
HEADERS=$(curl -s -I "$BASE/api/health")

HSTS=$(echo "$HEADERS" | grep -ic "^strict-transport-security:")
assert_eq "HSTS header present" "1" "$HSTS"

NOSNIFF=$(echo "$HEADERS" | grep -i "^x-content-type-options:" | tr -d '\r' | awk '{print $2}')
assert_eq "X-Content-Type-Options nosniff" "nosniff" "$NOSNIFF"

XFO=$(echo "$HEADERS" | grep -i "^x-frame-options:" | tr -d '\r' | awk '{print $2}')
assert_eq "X-Frame-Options DENY (API)" "DENY" "$XFO"

REF=$(echo "$HEADERS" | grep -ic "^referrer-policy:")
assert_eq "Referrer-Policy present" "1" "$REF"


# ============================================================
section "Rate limit endpoint sensitif"
# ============================================================
# forgot-password ALWAYS returns 200 + generic message even when rate
# limited (anti-enumeration). Can't directly observe its 429 from outside.
# Probe via /api/auth/login instead — login returns explicit 429 when
# its 10/min IP-keyed limit is exceeded.
#
# NOTE: This test consumes rate-limit budget for the runner IP.
# Subsequent /api/auth/login attempts from this IP may 429 for ~1 minute.
# Run from CI or expect brief login throttling when run locally.
PROBE_EMAIL="probe-$(date +%s)-$$@nasab-test.invalid"
HIT_429=0
for i in 1 2 3 4 5 6 7 8 9 10 11 12; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$PROBE_EMAIL\",\"password\":\"x\"}")
  if [ "$STATUS" = "429" ]; then
    HIT_429=1
    break
  fi
done
assert_eq "Rate limiter active on /api/auth/login (12 rapid POSTs)" "1" "$HIT_429"

# ============================================================
section "robots.txt & security.txt"
# ============================================================
ROBOTS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONT/robots.txt")
assert_eq "robots.txt accessible" "200" "$ROBOTS"

SECTXT=$(curl -s -o /dev/null -w "%{http_code}" "$FRONT/.well-known/security.txt")
# Optional — kalau belum ada, log warning saja
if [ "$SECTXT" = "200" ]; then
  echo "  $(color_green "✅ INFO") security.txt published"
else
  echo "  $(color_blue "ℹ️  TODO") security.txt belum ada (rekomendasi: tambahkan untuk responsible disclosure)"
fi


# ============================================================
echo ""
echo "$(color_blue "════════════════════════════════════════════")"
echo "Results: $(color_green "PASS=$PASS")  $(color_red "FAIL=$FAIL")"
if [ $FAIL -gt 0 ]; then
  echo ""
  echo "$(color_red "Failed tests:")"
  for t in "${FAILED_TESTS[@]}"; do
    echo "  - $t"
  done
  exit 1
fi
echo "$(color_green "✅ All security tests passed!")"
exit 0
