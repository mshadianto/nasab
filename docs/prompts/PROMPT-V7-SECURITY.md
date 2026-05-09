# NASAB v7.1 — Security + Kisah Keluarga

Dua task tersisa. Kerjakan berurutan, deploy sekali di akhir.

---

## TASK 1: Security Hardening (PRIORITAS)

### 1A. Encrypt NIK di API (api/src/index.js)

NIK tersimpan plaintext di D1. Encrypt pakai AES-GCM via Web Crypto API (native Workers).

```javascript
// Tambah di atas file, sebelum routing:

async function getKey(env) {
  const raw = new TextEncoder().encode((env.NIK_ENCRYPTION_KEY || 'nasab-nik-default-key-32chars!!').slice(0, 32));
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function encNIK(nik, env) {
  if (!nik || nik.length < 10) return nik || '';
  const key = await getKey(env);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(nik));
  const buf = new Uint8Array(12 + ct.byteLength);
  buf.set(iv); buf.set(new Uint8Array(ct), 12);
  return 'ENC:' + btoa(String.fromCharCode(...buf));
}

async function decNIK(enc, env) {
  if (!enc || !enc.startsWith('ENC:')) return enc || '';
  try {
    const key = await getKey(env);
    const buf = Uint8Array.from(atob(enc.slice(4)), c => c.charCodeAt(0));
    const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: buf.slice(0, 12) }, key, buf.slice(12));
    return new TextDecoder().decode(dec);
  } catch { return ''; }
}

function maskNIK(nik) {
  return nik && nik.length >= 16 ? nik.slice(0, 4) + '••••••••' + nik.slice(12) : nik || '';
}
```

Perubahan di endpoints:
- **POST members**: `const encNik = await encNIK(m.nik, env);` → simpan `encNik` bukan `m.nik`
- **PUT members**: sama, encrypt sebelum UPDATE
- **GET family detail**: decrypt NIK per member setelah SELECT, berdasarkan role:
  - owner/super_admin → decrypt penuh
  - editor → masked
  - viewer → kosong

Tambah migration endpoint (temporary):
```javascript
// POST /api/admin/migrate-nik — encrypt semua NIK plaintext yang ada
// Loop members WHERE nik != '' AND nik NOT LIKE 'ENC:%', encrypt, update
// Hapus endpoint ini setelah dijalankan sekali
```

Set secret:
```bash
cd api && npx wrangler secret put NIK_ENCRYPTION_KEY
# Paste output dari: openssl rand -hex 16
```

### 1B. CORS Restriction (api/src/index.js)

Ganti CORS constant jadi function:
```javascript
const ALLOWED = ['https://nasab.biz.id','https://nasab-bua.pages.dev','http://localhost:5173'];

function corsH(req) {
  const o = req.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED.includes(o) ? o : ALLOWED[0],
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Vary': 'Origin'
  };
}
```
Ganti semua `CORS` → `corsH(request)` di json() dan err() dan OPTIONS handler.

### 1C. Token Secret ke Env Var

```javascript
// makeToken: ganti 'nasab-secret' → (env.TOKEN_SECRET || 'nasab-secret')
// verifyToken: juga perlu env parameter
```
```bash
cd api && npx wrangler secret put TOKEN_SECRET
# Paste random string
```

### 1D. Frontend NIK Visibility (frontend/nasab.jsx)

- Sidebar: Owner lihat NIK (dengan toggle show/hide), Editor lihat masked, Viewer tidak lihat
- PersonForm: NIK input hanya untuk Owner
- Export JSON/GEDCOM/PDF: NIK di-exclude atau masked
- Share/public: NIK NEVER included

---

## TASK 2: Kisah Keluarga (Biography Engine)

### 2A. Rename Tab

Nav: ganti "Insights" → "📖 Kisah". View ID tetap boleh `insights` atau ganti `kisah`.

### 2B. Layout Kisah Tab

```
┌── 📖 Kisah Keluarga ───────────────────┐
│                                          │
│ [📝 Auto] [✨ AI] [📄 PDF] [🔗 Share]  │
│                                          │
│ ┌── Biography ────────────────────────┐ │
│ │ 🌳 Asal-Usul                       │ │
│ │ Teks narasi...                      │ │
│ │                                     │ │
│ │ 👨‍👩‍👧‍👦 Generasi Kedua                  │ │
│ │ Teks narasi...                      │ │
│ │ ...dst                              │ │
│ └─────────────────────────────────────┘ │
│                                          │
│ ── Tools (existing insights) ─────────  │
│ Relationship Finder | Birthday | etc    │
└──────────────────────────────────────────┘
```

### 2C. Template Biography (instant, no API)

Function `generateBio(pp, fam, marriages)` → returns `[{icon, title, text}]`:

**Section 1 "Asal-Usul"**: root couple → nama, lokasi, jumlah anak, nama anak
**Section 2 "Generasi Kedua"**: per anak root → nama + pasangan + jumlah anak + lokasi + notes
**Section 3 "Persebaran"**: group by location → kota/provinsi, migrasi dari NIK
**Section 4 "Milestones"**: stats inline (total, generasi, tertua, termuda, most children, upcoming birthday)
**Section 5 "Catatan"**: user stories dari fam.stories
**Section 6 "Penutup"**: hadits tentang nasab (HR. Tirmidzi) + branding NASAB

Data sources (semua sudah ada): `FE.stats()`, `FE.ch()`, `FE.sp()`, `FE.bdays()`, `fam.stories`, `NIK.parse()`, `fam.members[].location`

Design: book-like, max-width 640px, Instrument Serif headings 20px, DM Sans body 14px, line-height 1.8, generous spacing. Warm feel — bukan dashboard.

### 2D. AI Biography (via Claude API)

Button "✨ AI" → kirim structured family data ke Claude API → terima narasi sastra.

```javascript
const r = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [{ role: "user", content: `Tulis biografi keluarga Indonesia berdasarkan data ini dalam Bahasa Indonesia, 500 kata, gaya naratif hangat:\n${JSON.stringify(familySummary)}` }]
  })
});
```

Style selector: Naratif | Formal | Puitis. Cache result di state. Loading skeleton.

### 2E. Export PDF

Lazy-load html2pdf.js dari CDN:
```
https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js
```

Layout: Cover (NASAB logo + family name + date) → Biography sections → Daftar Anggota (table) → Footer.
Filename: `Kisah Keluarga [nama].pdf`. NIK EXCLUDED dari PDF.

### 2F. Share Link

Simpan biography ke D1 table baru:
```sql
CREATE TABLE IF NOT EXISTS biographies (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  is_public INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);
```

API endpoints:
- `POST /api/families/:fid/biography` → save & generate slug
- `GET /api/biography/:slug` → public, NO auth required

URL: `https://nasab.biz.id/kisah/[slug]`
Frontend: render biography page for public visitors (read-only, beautiful).
Toggle public/private. Copy link button.

---

## DEPLOY

```bash
# 1. Set secrets
cd api
npx wrangler secret put NIK_ENCRYPTION_KEY
npx wrangler secret put TOKEN_SECRET

# 2. Deploy API
npx wrangler deploy

# 3. Migrate existing NIK (run once)
curl -X POST https://nasab-api.sopian-hadianto.workers.dev/api/admin/migrate-nik \
  -H "Authorization: Bearer [SUPER_ADMIN_TOKEN]"

# 4. Verify encryption
npx wrangler d1 execute nasab-db --remote --command="SELECT id, nik FROM members WHERE nik != '' LIMIT 3"
# Should show 'ENC:...' not plaintext

# 5. Deploy frontend
cd ../frontend && npm run build && npx wrangler pages deploy dist --project-name=nasab --branch=main --commit-dirty=true

# 6. Bump CACHE in sw.js

# 7. HAPUS /api/admin/migrate-nik endpoint, re-deploy API
```

Version → v7.1. Verify https://nasab.biz.id.