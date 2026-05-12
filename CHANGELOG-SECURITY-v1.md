# NASAB Security Hardening v1 — Changelog

**Version:** Security v1  
**Date:** 2026-05-12  
**Scope:** Worker (`nasab-api`) + Frontend (`nasab.biz.id`) + D1 (`nasab-db`)  
**Trigger:** QA report from **Bapak Nabil Anugerah Pangestu** (Mei 2026) — a single
finding "forgot password tidak kirim email" opened the door to a source audit
that surfaced 3 critical + 4 high + 5 medium-severity hardening items. This
changelog documents what shipped, what was deferred, and how to deploy safely.

---

## 1. Summary

| ID | Severity | Title | Status | Commit |
|---|---|---|---|---|
| CRIT-01 | Critical | Account takeover via name-matching reset | ✅ Closed | `4e52dad` |
| CRIT-02 | Critical | JWT signature ~72-bit entropy + non-revocable | ✅ Closed | `4e52dad` |
| CRIT-03 | Critical | Hardcoded fallback secrets in source | ✅ Closed | `4e52dad` + `8e0b09a` |
| HIGH-01 | High | CORS subdomain bypass via `.startsWith` | ✅ Closed | `8e0b09a` |
| HIGH-02 | High | CSP only in Report-Only mode | 🟡 DRAFT shipped (v1.1 flip) | `1f89fa9` |
| HIGH-03 | High | Weak 6-char passwords | ✅ Closed | `8e0b09a` |
| HIGH-04 | High | 30-day token expiry, no revocation | ✅ Absorbed by CRIT-02 | `4e52dad` |
| HIGH-05 | High | AI proxy unbounded calls per user | ✅ Closed (60/hour) | `8e0b09a` |
| MED-01 | Medium | PBKDF2 100k iter (OWASP rec 600k+) | ✅ Closed | `cbd9a76` |
| MED-02 | Medium | `uid()` uses `Math.random()` | ✅ Closed | `cbd9a76` |
| MED-03 | Medium | Invite role enum not whitelisted | ✅ Closed | `8e0b09a` |
| MED-04 | Medium | Positions PUT no role check | ✅ Closed | `8e0b09a` |
| MED-05 | Medium | Missing baseline security headers | ✅ Closed | `8e0b09a` |
| **MED-06** | Medium | `Math.random()` in slug generation (lines 937, 978) | ⏳ Deferred to A6 / v1.1 | — |

**Closure rate:** 12/14 directly fixed; 1 ship as DRAFT (HIGH-02 awaiting flip);
1 deferred (MED-06 follow-up).

---

## 2. Per-finding detail

### CRIT-01 — Account takeover via name-matching reset

**Vulnerable:** `POST /api/auth/reset-password` accepted `{email, name, new_password}`
and rotated the password if `user.name === name`. Name is not a secret — scraped
from LinkedIn, family chat groups, public bio pages. Anyone who knew a target's
email + name could take over the account.

**Fix:** Replaced with a proper token-based recovery flow.
- `POST /api/auth/forgot-password` — accepts `{email}`, generates a 32-byte
  crypto-random token, stores SHA-256 hash + 30-min expiry in new
  `password_resets` table, sends emailed reset link via Resend/MailChannels.
- `POST /api/auth/reset-password` — accepts `{token, new_password}`, verifies
  hash, rotates password atomically with session revocation.
- Always-generic response on `forgot-password` (anti-enumeration), even when
  rate-limited or on transport error.
- Rate limit: 3 attempts/hour per (email + IP) hashed key.

**Commits:** `4e52dad` (handler), `4feccac` (`password_resets` table), `13eb3cc`
(frontend split + ResetPasswordPage).

### CRIT-02 — JWT signature ~72-bit entropy + non-revocable

**Vulnerable:** `_signToken` returned `btoa(SHA256(payload + secret)).slice(0, 16)`
— 16 base64 chars ≈ 72 bits of effective entropy. Construction `SHA(payload+secret)`
is not HMAC and is theoretically forgeable. Tokens lived 30 days with no
revocation path (logout was client-side only).

**Fix:**
- `makeToken` / `verifyToken` rewritten to use HMAC-SHA256 (256-bit signature).
- Lifetime cut from 30 days → 24 hours.
- New `sessions` table backs every token; `verifyToken` confirms the session row
  exists and is not expired on every authed request.
- New `POST /api/auth/logout` endpoint deletes the session row (idempotent).
- Password reset cascades `DELETE FROM sessions WHERE user_id = ?` — forces
  re-login on every device.
- **One-time user impact:** all existing tokens become invalid on deploy. Users
  see the `SecurityNoticeV1` banner at the login page explaining why.

**Commits:** `4e52dad` (Worker handler + sessions table writes), `4feccac`
(`sessions` table), `13eb3cc` (SecurityNoticeV1 banner).

### CRIT-03 — Hardcoded fallback secrets

**Vulnerable:** When `TOKEN_SECRET` / `NIK_ENCRYPTION_KEY` / `AI_SECRETS_KEY` env
vars were unset, the Worker fell back to hardcoded strings: `'nasab-secret'`,
`'nasab-nik-default-key-32chars!!'`, `'nasab-secret-default-32-chars!!!'`.
Source-visible defaults. An attacker reading the source could forge JWTs and
decrypt NIK / user_secrets data if any env was missing in prod.

**Fix:**
- `requireSecret(env)` (A1 helper) throws if `TOKEN_SECRET` missing or `<32 chars`.
- `getEncKey(env)` throws if `NIK_ENCRYPTION_KEY` missing or `<32 chars`.
- `getSecretKey(env)` throws if `AI_SECRETS_KEY` missing or `<32 chars` (3-level
  cascade `AI_SECRETS_KEY || NIK_ENCRYPTION_KEY || literal` removed).
- Fail-loud: misconfigured deploys hit 500 on first authed request instead of
  silently running with a known-public key.

**Production verification:** `wrangler secret list` confirms `TOKEN_SECRET` +
`NIK_ENCRYPTION_KEY` set. **`AI_SECRETS_KEY` is currently UNSET** — see deploy
runbook below. D1 query confirmed `user_secrets` table is empty (0 rows), so
no re-encryption migration needed before flipping AI_SECRETS_KEY on.

**Commits:** `4e52dad` (TOKEN_SECRET via requireSecret), `8e0b09a` (NIK/AI keys
fail-loud).

### HIGH-01 — CORS `.startsWith` bypass

**Vulnerable:** `ALLOWED_ORIGINS.some(a => o.startsWith(a))` matches
`https://nasab.biz.id.evil.com` (attacker-owned subdomain of evil.com that
happens to start with nasab.biz.id). Attacker can mount cross-origin XHR
against the API from their domain.

**Fix:** Exact-match via `ALLOWED_ORIGINS.includes(o)`. None of the 3 entries
have trailing slashes, so no legit origins regress.

**Commit:** `8e0b09a`.

### HIGH-02 — CSP enforce (DRAFT shipped, flip in v1.1)

**Current state:** Frontend ships `Content-Security-Policy-Report-Only` with the
full v1 policy. **Not yet enforced.** Group E (commit `1f89fa9`) added an inline
`# CSP-ENFORCE-DRAFT` documentation block in `frontend/public/_headers` with the
ready-to-go enforce header value.

**v1.1 procedure** (documented in `_headers` itself):
1. Monitor browser console + NEL reports for 7+ days post-deploy.
2. Confirm zero unexpected violations from real prod traffic.
3. Comment out the `Content-Security-Policy-Report-Only:` line.
4. Uncomment the DRAFT `Content-Security-Policy:` line (move into `/*` block).
5. Deploy; rollback if anything breaks.

**Commit:** `1f89fa9`.

### HIGH-03 — Weak password requirements

**Vulnerable:** `if (password.length < 6) return err(...)` — 6 chars, no
complexity, no max length. Allowed `password`, `123456`, `aaaaaa`, etc.

**Fix:** `validatePassword(pw, email)` enforces:
- Length 12-128 chars
- Must contain upper + lower + digit
- Reject all-same-char patterns (`aaaa...`)
- Reject common prefixes (`password`, `nasab`, `admin`, `qwerty`, `12345`)
- Reject `pw === email` (case-insensitive) at register-time

Existing 6-char users keep logging in (login verifies stored hash, not policy).
Only new registrations + resets face the new floor.

**Commit:** `8e0b09a`.

### HIGH-04 — Token expiry + revocability

**Absorbed by CRIT-02.** Token lifetime 30d → 24h, session table backing enables
revocation via `POST /api/auth/logout` or password reset cascade. No separate
fix needed.

### HIGH-05 — AI proxy rate limit

**Vulnerable:** `POST /api/ai/proxy` had no per-user rate limit. A user (or
compromised client) could run an unbounded loop, exhausting the user's billing
key with the AI provider.

**Fix:** `rateLimit('ai_proxy', `ai:${user.id}`)` at handler entry,
`RL_SPECS.ai_proxy = { limit: 60, period: 3600 }` — 60 calls/hour per user.

**Commit:** `8e0b09a`.

### MED-01 — PBKDF2 100k → 600k

**Vulnerable:** Password hashing used 100,000 PBKDF2-SHA256 iterations. OWASP
2023+ recommends 600,000 minimum.

**Fix:**
- New v2 format: `PBKDF2v2:<iter>:<salt>:<hash>` (iter embedded for future bumps).
- v1 format (`PBKDF2:<salt>:<hash>`) still readable via `verifyPwPBKDF2`
  dual-path (implicit 100k).
- Auto-upgrade v1 → v2 on successful login (one-time ~600ms latency hit per
  legacy user; subsequent logins back to ~600ms steady-state).
- SHA-256 legacy branch upgrades direct to v2, skipping v1 intermediate.

**Commit:** `cbd9a76`.

### MED-02 — Crypto-secure `uid()`

**Vulnerable:** `uid()` returned `Date.now()_${Math.random().toString(36).slice(2,8)}` —
6 base36 chars from non-cryptographic `Math.random()`. Predictable, collision-prone.

**Fix:** `bytesToHex(crypto.getRandomValues(new Uint8Array(12)))` — 24 hex chars,
~2^96 entropy.

**Note:** Two other `Math.random()` call sites in slug generation
(`frontend/nasab.jsx` lines 937, 978) were deliberately scoped OUT of A5 and
tracked as Task #8 (MED-06).

**Commit:** `cbd9a76`.

### MED-03 — Invite role enum whitelist

**Vulnerable:** Invite handler wrote `role || 'editor'` directly into
`family_collaborators.role` — any string the client sent (including malformed
JSON values) would persist. Downstream role checks compare `=== 'owner'` etc.,
so a `"Owner"` (mixed case) bypassed them.

**Fix:**
- `VALID_ROLES = ['viewer', 'editor', 'owner']` whitelist.
- `requestedRole = (role || 'editor').toLowerCase()` — normalize first.
- Reject unknown values with 400.
- Defense-in-depth: only existing-owner can grant `'owner'` (caller-role gate at
  invite entry already restricts, this is belt-and-suspenders).

**Commit:** `8e0b09a`.

### MED-04 — Positions PUT role check

**Vulnerable:** `PUT /api/families/:fid/positions` had no role check. Any
authenticated user could wipe and overwrite any family's canvas positions.

**Fix:** Single-path role check matching 9 sibling handlers:
`SELECT role FROM family_collaborators WHERE family_id = ? AND user_id = ?`,
reject viewer-and-below.

**Legacy concern:** Owners whose `family_collaborators` row was never created
on family-creation would 403 on their own family. Mitigated via migration B's
backfill INSERT (Task #7), which seeded `family_collaborators (family_id, owner_id, 'owner')`
for any family where the row was missing. Idempotent (`NOT EXISTS` guard).

**Commits:** `8e0b09a` (handler), `4feccac` (backfill SQL).

### MED-05 — Security header expansion

**Vulnerable:** Worker responses carried only 4 baseline headers (HSTS, XCTO,
XFO, Referrer-Policy).

**Fix:** `SECURITY_HEADERS` expanded with `Permissions-Policy`,
`Cross-Origin-Resource-Policy`, `Cross-Origin-Opener-Policy`,
`Content-Security-Policy: default-src 'none'; frame-ancestors 'none'` (strict —
appropriate for JSON-only API).
`SECURITY_HEADERS_NO_CSP` variant for `/api/ai/proxy` (streams upstream Content-Type
of variable shape; CSP excluded defensively).

**Commit:** `8e0b09a`.

### MED-06 (Task #8) — `Math.random()` in slug generation

**Status:** Deferred to A6 follow-up (post-v1 PR).

Two call sites in `frontend/nasab.jsx` use `Math.random().toString(36).slice(2,8)`
for slug random suffix:
- Line 937: biography slug (public URL `/api/biography/:slug`)
- Line 978: event invitation slug (public URL `/api/events/public/:slug`)

Slug = `fid.slice(2,N) + '_' + Math.random()`. The `fid` portion is now
crypto-secure post-A5, so slug as a whole is harder to enumerate than the random
portion alone suggests, but the suffix is technically not crypto-secure.

**Planned fix:** swap `Math.random()` for `bytesToHex(crypto.getRandomValues(new Uint8Array(4)))`.

---

## 3. Deploy runbook

> **Order matters.** Migration first, then Worker, then Frontend. Frontend
> assumes Worker is updated.

### Pre-deploy gates (verify BEFORE any deploy)

```bash
# 1. Worker secrets — must show all 3, each ≥32 chars
cd api
npx wrangler secret list --name nasab-api
# Expected: TOKEN_SECRET, NIK_ENCRYPTION_KEY, AI_SECRETS_KEY

# If AI_SECRETS_KEY missing (currently unset in prod):
openssl rand -base64 32 | npx wrangler secret put AI_SECRETS_KEY --name nasab-api
```

### 1. D1 migration

```bash
cd api

# Dry-run against local D1 simulator
npx wrangler d1 execute nasab-db --local \
  --file=migration_2026-05-12_security_hardening.sql

# Production
npx wrangler d1 execute nasab-db --remote \
  --file=migration_2026-05-12_security_hardening.sql

# Verify (admin SQL via Cloudflare dashboard or wrangler d1 execute):
#   SELECT name FROM sqlite_master WHERE type='table' AND name IN ('password_resets','sessions');
#   -- Expected: 2 rows
#   SELECT COUNT(*) FROM families f WHERE NOT EXISTS (
#     SELECT 1 FROM family_collaborators fc WHERE fc.family_id = f.id AND fc.user_id = f.owner_id);
#   -- Expected: 0 (owner backfill complete)
```

### 2. Worker deploy

```bash
cd api
npx wrangler deploy
# Confirms binding count + new Version ID
```

### 3. Frontend deploy

```bash
cd frontend
npm run build
npx wrangler pages deploy dist --project-name=nasab --branch=main --commit-dirty=true
```

### 4. Smoke test

```bash
chmod +x tests/security.sh
BASE=https://nasab-api.sopian-hadianto.workers.dev \
FRONT=https://nasab.biz.id \
./tests/security.sh
# Expected: 0 FAILs (some informational notes are normal)
```

### Rollback

| Failure scenario | Action |
|---|---|
| Worker 500s after deploy | `wrangler rollback` to previous Version ID; check secrets are set |
| Frontend banner shows but reset link broken | Check Worker `/api/auth/forgot-password` endpoint; check Resend/MailChannels DKIM |
| All users 401 unexpectedly | Confirm migration B applied; sessions table exists |
| Migration partial | All operations idempotent (IF NOT EXISTS / NOT EXISTS) — safe to re-run |

---

## 4. Smoke test usage

After deploy, run `tests/security.sh`. Covers:
- CRIT-01/02 directly (token-based reject + bogus JWT)
- HIGH-01/03 directly
- HIGH-02 (accepts either Report-Only or Enforce — v1 ships Report-Only)
- MED-05 (API headers)
- Anti-enumeration + rate-limit probe

Uncovered in v1 (tracked Task #9):
- HIGH-05 AI proxy rate limit (needs auth token)
- MED-03/04 (needs family setup)
- MED-01/02 (internal hash format, not testable from outside)

---

## 5. Known limitations / TODO v1.1

| Item | Owner | Tracking |
|---|---|---|
| HIGH-02 CSP enforce-flip | TBD | Inline DRAFT in `_headers` |
| MED-06 `Math.random()` in slug generation | TBD | Task #8 |
| Expand security test coverage (auth-token bootstrap) | TBD | Task #9 |
| Add CORP + COOP to frontend `_headers` | TBD | — |
| Provision `security@nasab.biz.id` mailbox + rotate `security.txt` Contact | TBD | — |
| Create `/.well-known/security-policy` disclosure doc + restore `Policy:` line in `security.txt` | TBD | — |

---

## 6. Acknowledgments

- **Bapak Nabil Anugerah Pangestu** — QA report ("forgot password tidak kirim
  email", Mei 2026) that triggered the source audit. The functional bug led to
  the discovery of CRIT-01 (account takeover via name-matching) and the broader
  hardening sweep that became Security v1.
- **Bapak Sachlani** — earlier GEDCOM-import feedback that established the
  community-driven improvement pattern this audit follows.
- **NASAB community testers and contributors** — bug reports, feature
  suggestions, and security feedback throughout NASAB's evolution. This v1
  audit benefits from the cumulative testing culture they've built.
- **Cloudflare Workers + D1 platform** — Web Crypto, CF Cache API rate limiting,
  Pages _headers directives made the runtime hardening practical.

---

## 7. References

- `PROMPT-SECURITY-HARDENING-v1.md` (gitignored; local workflow spec)
- `SECURITY-REVIEW-NASAB-v2-FINAL.md` (committed alongside this changelog)
- `api/migration_2026-05-12_security_hardening.sql` (D1 schema migration)
- `tests/security.sh` (regression suite)
- Worker source: `api/src/index.js`
- Frontend source: `frontend/nasab.jsx`

### Commit list (v1 hardening, oldest → newest)

| Commit | Group |
|---|---|
| `4e52dad` | A1 + A2 + A3 + A4a — auth foundation |
| `8e0b09a` | A4b + A4c + A4d-1 + A4d-2 — hardening completion |
| `cbd9a76` | A5 — PBKDF2 v2 + crypto-secure uid |
| `4feccac` | B — D1 migration |
| `ac008f3` | C — tests/security.sh |
| `13eb3cc` | D — frontend reset flow + banner |
| `1f89fa9` | E — CSP enforce-draft + security.txt cleanup |
| _this commit_ | F — CHANGELOG + audit report |
