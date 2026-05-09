# PROMPT-ANTI-SPAM.md

> **Severity:** TOP URGENT — production database polluted, public stats inflated, registration endpoint actively being abused.
> **Target:** `api/src/index.js` (Cloudflare Worker), `api/wrangler.jsonc` (binding config), D1 database `nasab-db`.
> **Scope:** 3 patch surgical untuk stop bleeding sekarang. Anti-spam yang lebih sophisticated (Turnstile, email verify, honeypot) defer ke iterasi berikutnya.
> **Estimasi:** 30–60 menit total termasuk verifikasi cleanup. Bisa di-deploy bertahap (Patch 1 dulu untuk stop bleeding, Patch 3 belakangan setelah backup data).

---

## Konteks masalah

Ada bot/script yang abuse public registration flow dengan pola predictable:
- Family name: `NAME_<6-10 huruf kapital random>` (contoh `NAME_KKGERWZY`, `NAME_ZTZXMDAS`, `NAME_ZWLDSQQG`)
- Family description: `DESC_<8-15 huruf kapital random>` (contoh `DESC_TFMOIDAOITJL`, `DESC_KHZHXZWETDDV`)
- Setiap family memiliki 0 anggota dan 0 lokasi — confirm bot, bukan user real
- Visible di public landing dengan badge `ADMIN_VIEW` (separate UI bug, bukan fokus patch ini)

**Bukan hack** karena tidak ada exploitation — cuma abuse of normal endpoint. Tapi tetap pollute data, inflate stats publik (`168 keluarga sudah bergabung` jadi tidak akurat), dan habiskan storage D1.

---

## Patch 1 — Rate limiting di register & create family

### 1a. Tambahkan binding di `api/wrangler.jsonc`

Cloudflare Workers Rate Limiting API gunakan binding native. Tambahkan section ini di config (sesuaikan dengan struktur file aktual — bisa di root config object atau di dalam `unsafe.bindings` tergantung versi wrangler):

**Versi modern (wrangler ≥ 3.65, recommended):**

```jsonc
{
  // ... existing config

  "ratelimits": [
    {
      "name": "REGISTER_LIMIT",
      "namespace_id": "1001",
      "simple": { "limit": 5, "period": 60 }
    },
    {
      "name": "FAMILY_CREATE_LIMIT",
      "namespace_id": "1002",
      "simple": { "limit": 3, "period": 60 }
    },
    {
      "name": "LOGIN_LIMIT",
      "namespace_id": "1003",
      "simple": { "limit": 10, "period": 60 }
    }
  ]
}
```

**Catatan:** Kalau wrangler error karena syntax tidak dikenali, fallback ke `unsafe.bindings` syntax lama:

```jsonc
{
  "unsafe": {
    "bindings": [
      { "name": "REGISTER_LIMIT", "type": "ratelimit", "namespace_id": "1001", "simple": { "limit": 5, "period": 60 } },
      { "name": "FAMILY_CREATE_LIMIT", "type": "ratelimit", "namespace_id": "1002", "simple": { "limit": 3, "period": 60 } },
      { "name": "LOGIN_LIMIT", "type": "ratelimit", "namespace_id": "1003", "simple": { "limit": 10, "period": 60 } }
    ]
  }
}
```

Verifikasi syntax current di [Cloudflare Workers Rate Limiting docs](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/) sebelum deploy.

### 1b. Apply di handler `/api/auth/register`

Cari handler register di `api/src/index.js`. Tambahkan rate check di awal handler, sebelum logic create user:

```js
// Inside register handler, sebelum semua logic
const ip = request.headers.get('cf-connecting-ip') || 'unknown';
const { success: registerOk } = await env.REGISTER_LIMIT.limit({ key: ip });
if (!registerOk) {
  return new Response(
    JSON.stringify({ error: 'Terlalu banyak percobaan registrasi. Coba lagi dalam 1 menit.' }),
    { status: 429, headers: { 'Content-Type': 'application/json' } }
  );
}

// ... existing register logic
```

### 1c. Apply di handler `/api/families` POST

Untuk endpoint authenticated, key gunakan `userId` (bukan IP) supaya tidak punish multi-user di shared network:

```js
// Inside create family handler, setelah auth check (userId sudah resolve)
const { success: familyOk } = await env.FAMILY_CREATE_LIMIT.limit({ key: `user:${userId}` });
if (!familyOk) {
  return new Response(
    JSON.stringify({ error: 'Anda membuat keluarga terlalu cepat. Coba lagi dalam 1 menit.' }),
    { status: 429, headers: { 'Content-Type': 'application/json' } }
  );
}

// ... existing create family logic
```

### 1d. Bonus: rate limit di `/api/auth/login`

Sekalian tambahkan ke endpoint login untuk prevent credential stuffing:

```js
const ip = request.headers.get('cf-connecting-ip') || 'unknown';
const { success: loginOk } = await env.LOGIN_LIMIT.limit({ key: ip });
if (!loginOk) {
  return new Response(
    JSON.stringify({ error: 'Terlalu banyak percobaan login. Coba lagi dalam 1 menit.' }),
    { status: 429, headers: { 'Content-Type': 'application/json' } }
  );
}

// ... existing login logic
```

### Test Patch 1

```bash
# Deploy
cd api && npx wrangler deploy

# Test rate limit register (jalankan 6 kali cepat — request ke-6 harus 429)
for i in {1..6}; do
  curl -X POST https://nasab-api.<your-subdomain>.workers.dev/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Test $i\",\"email\":\"test$i@test.com\",\"password\":\"pass123\"}" \
    -w "\nHTTP %{http_code}\n"
done
```

Expected: request 1-5 return 200/400, request 6 return 429.

---

## Patch 2 — Pattern detection di input validation

### 2a. Tambahkan helper validation di `api/src/index.js`

Letakkan dekat helper functions atas file:

```js
// Pattern detection untuk anti-spam
const SUSPICIOUS_PATTERNS = [
  /^(NAME|DESC|TEST|DEMO|FAMILY|USER|ADMIN)_[A-Z0-9]{4,20}$/i,  // pattern attack pattern saat ini
  /^[a-z]{10,}$/,                                                 // gibberish lowercase 10+ chars
  /^[A-Z]{10,}$/,                                                 // gibberish uppercase 10+ chars
  /(.)\1{5,}/,                                                    // huruf sama 6x berturut: "aaaaaa"
  /^(test|demo|spam|bot|null|undefined|admin)\d*$/i,              // common spam markers
  /^[a-z0-9]{16,}$/i                                              // hash-like random string 16+ chars
];

function isSuspiciousInput(text, options = {}) {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed.length < (options.minLength || 2)) return true;
  if (trimmed.length > (options.maxLength || 200)) return true;
  return SUSPICIOUS_PATTERNS.some(p => p.test(trimmed));
}

function validateFamilyName(name) {
  if (!name || typeof name !== 'string') return 'Nama keluarga wajib diisi';
  const trimmed = name.trim();
  if (trimmed.length < 2) return 'Nama keluarga minimal 2 karakter';
  if (trimmed.length > 100) return 'Nama keluarga maksimal 100 karakter';
  if (isSuspiciousInput(trimmed, { minLength: 2, maxLength: 100 })) {
    return 'Nama keluarga tidak valid. Gunakan nama yang masuk akal.';
  }
  return null; // valid
}

function validateDescription(desc) {
  if (!desc) return null; // optional field
  if (typeof desc !== 'string') return 'Deskripsi tidak valid';
  const trimmed = desc.trim();
  if (trimmed.length > 500) return 'Deskripsi maksimal 500 karakter';
  if (trimmed.length > 0 && isSuspiciousInput(trimmed, { minLength: 1, maxLength: 500 })) {
    return 'Deskripsi mengandung pola yang tidak valid';
  }
  return null;
}

function validateUserName(name) {
  if (!name || typeof name !== 'string') return 'Nama wajib diisi';
  const trimmed = name.trim();
  if (trimmed.length < 2) return 'Nama minimal 2 karakter';
  if (trimmed.length > 80) return 'Nama maksimal 80 karakter';
  if (isSuspiciousInput(trimmed, { minLength: 2, maxLength: 80 })) {
    return 'Nama tidak valid. Gunakan nama asli.';
  }
  return null;
}
```

### 2b. Apply di handler register

```js
// Inside register handler, sebelum DB.createUser
const nameError = validateUserName(name);
if (nameError) {
  return new Response(JSON.stringify({ error: nameError }), { 
    status: 400, headers: { 'Content-Type': 'application/json' } 
  });
}

// Email validation tambahan (kalau belum ada)
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  return new Response(JSON.stringify({ error: 'Email tidak valid' }), { 
    status: 400, headers: { 'Content-Type': 'application/json' } 
  });
}

// Password minimum
if (!password || password.length < 6) {
  return new Response(JSON.stringify({ error: 'Password minimal 6 karakter' }), { 
    status: 400, headers: { 'Content-Type': 'application/json' } 
  });
}
```

### 2c. Apply di handler create family

```js
// Inside create family handler, sebelum DB.createFamily
const nameError = validateFamilyName(name);
if (nameError) {
  return new Response(JSON.stringify({ error: nameError }), { 
    status: 400, headers: { 'Content-Type': 'application/json' } 
  });
}

const descError = validateDescription(description);
if (descError) {
  return new Response(JSON.stringify({ error: descError }), { 
    status: 400, headers: { 'Content-Type': 'application/json' } 
  });
}
```

### Test Patch 2

```bash
# Test pattern detection — semua harus return 400
curl -X POST https://nasab-api.<subdomain>.workers.dev/api/families \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"NAME_KKGERWZY","description":"DESC_TEST"}'

curl -X POST .../api/families \
  -d '{"name":"aaaaaaaaaaa","description":"test"}'

curl -X POST .../api/families \
  -d '{"name":"test123","description":""}'

# Test legitimate name harus tetap lolos
curl -X POST .../api/families \
  -d '{"name":"Keluarga Hadianto","description":"Trah Sopian dari Samarinda"}'
```

**Important:** Test legitimate Indonesian names (yang ada angka, tanda baca, dll) tidak ke-reject:
- `"Keluarga Hadianto"` ✓
- `"Trah Djojo Moeljono"` ✓  
- `"Bani Abdullah RT 03"` ✓
- `"Keluarga H. Achmad bin Djamil"` ✓

Kalau ada false positive, longgarkan regex `SUSPICIOUS_PATTERNS` accordingly.

---

## Patch 3 — Cleanup SQL untuk data junk yang sudah masuk

⚠️ **DESTRUCTIVE OPERATION — backup dulu sebelum DELETE.**

### 3a. Backup database lengkap

```bash
cd api

# Export semua tabel ke local file untuk safety
npx wrangler d1 execute nasab-db --remote --command="SELECT * FROM families" --json > backup-families-$(date +%Y%m%d-%H%M).json
npx wrangler d1 execute nasab-db --remote --command="SELECT * FROM users" --json > backup-users-$(date +%Y%m%d-%H%M).json
npx wrangler d1 execute nasab-db --remote --command="SELECT * FROM members" --json > backup-members-$(date +%Y%m%d-%H%M).json

# (Lakukan juga untuk tabel lain di schema: marriages, positions, stories, collaborators, invites)
```

Verifikasi backup file size ≥ 1 KB sebelum lanjut.

### 3b. Inspect data junk — DRY RUN dulu

Jangan langsung DELETE. Lihat dulu apa yang akan ke-affect:

```sql
-- Inspect families dengan pola spam
SELECT id, name, description, ownerId, createdAt, 
       (SELECT COUNT(*) FROM members WHERE familyId = f.id) as member_count
FROM families f
WHERE name LIKE 'NAME[_]%' ESCAPE '['
   OR name LIKE 'DESC[_]%' ESCAPE '['
   OR name LIKE 'TEST[_]%' ESCAPE '['
   OR description LIKE 'DESC[_]%' ESCAPE '['
   OR description LIKE 'NAME[_]%' ESCAPE '['
ORDER BY createdAt DESC
LIMIT 100;
```

Jalankan via:
```bash
npx wrangler d1 execute nasab-db --remote --command="<paste SQL above>"
```

**Verifikasi visual:** semua row yang muncul harus jelas spam (member_count = 0, name pattern jelas). Kalau ada nama legit yang terkena (false positive), adjust pattern di WHERE clause sebelum lanjut.

### 3c. Identifikasi orphan users (akun bot)

Bot kemungkinan create 1 family per akun. Identifikasi user yang HANYA punya spam family:

```sql
-- User yang semua family-nya spam
SELECT u.id, u.name, u.email, u.createdAt,
       (SELECT COUNT(*) FROM families WHERE ownerId = u.id) as total_families,
       (SELECT COUNT(*) FROM families WHERE ownerId = u.id 
        AND (name LIKE 'NAME[_]%' ESCAPE '[' OR name LIKE 'DESC[_]%' ESCAPE '[')) as spam_families
FROM users u
WHERE u.id IN (
  SELECT DISTINCT ownerId FROM families 
  WHERE name LIKE 'NAME[_]%' ESCAPE '[' OR name LIKE 'DESC[_]%' ESCAPE '['
)
HAVING total_families = spam_families
ORDER BY u.createdAt DESC
LIMIT 100;
```

Verifikasi: semua user yang muncul harus punya `total_families = spam_families` (artinya semua family mereka adalah spam) DAN biasanya `email` pattern sus (random string @gmail.com, atau test@xxx).

### 3d. Execute cleanup — urutan delete penting

Karena D1 SQLite tidak otomatis cascade (kecuali FK didefinisikan dengan ON DELETE CASCADE), urutan delete harus dari child tables → parent:

```sql
-- Step 1: Save spam family IDs ke temp identifikasi (kalau D1 support, kalau tidak skip dan inline subquery)
-- Untuk D1, lebih reliable inline subquery saja:

-- Step 2: Delete semua child records dari spam families
DELETE FROM positions WHERE familyId IN (
  SELECT id FROM families WHERE name LIKE 'NAME[_]%' ESCAPE '[' OR name LIKE 'DESC[_]%' ESCAPE '['
);

DELETE FROM stories WHERE familyId IN (
  SELECT id FROM families WHERE name LIKE 'NAME[_]%' ESCAPE '[' OR name LIKE 'DESC[_]%' ESCAPE '['
);

DELETE FROM collaborators WHERE familyId IN (
  SELECT id FROM families WHERE name LIKE 'NAME[_]%' ESCAPE '[' OR name LIKE 'DESC[_]%' ESCAPE '['
);

DELETE FROM invites WHERE familyId IN (
  SELECT id FROM families WHERE name LIKE 'NAME[_]%' ESCAPE '[' OR name LIKE 'DESC[_]%' ESCAPE '['
);

DELETE FROM marriages WHERE familyId IN (
  SELECT id FROM families WHERE name LIKE 'NAME[_]%' ESCAPE '[' OR name LIKE 'DESC[_]%' ESCAPE '['
);

DELETE FROM members WHERE familyId IN (
  SELECT id FROM families WHERE name LIKE 'NAME[_]%' ESCAPE '[' OR name LIKE 'DESC[_]%' ESCAPE '['
);

-- Step 3: Delete spam families themselves
DELETE FROM families 
WHERE name LIKE 'NAME[_]%' ESCAPE '[' OR name LIKE 'DESC[_]%' ESCAPE '[';

-- Step 4: Delete orphan users (akun bot yang hanya punya spam families)
-- Karena step 3 sudah delete family, user bot sekarang tidak punya family lagi
DELETE FROM users WHERE id IN (
  SELECT id FROM users 
  WHERE id NOT IN (SELECT DISTINCT ownerId FROM families WHERE ownerId IS NOT NULL)
    AND id NOT IN (SELECT DISTINCT userId FROM collaborators WHERE userId IS NOT NULL)
    AND createdAt > '2025-10-01'  -- adjust ke window serangan
);
```

**Catatan kolom schema:** Kalau nama tabel/kolom berbeda dari list di atas (misalnya `family_id` bukan `familyId`, atau ada tabel tambahan seperti `audit_logs`), adjust accordingly. Cek schema dulu via:

```bash
npx wrangler d1 execute nasab-db --remote --command="SELECT name FROM sqlite_master WHERE type='table'"
npx wrangler d1 execute nasab-db --remote --command=".schema families"
```

### 3e. Verifikasi pasca-cleanup

```sql
-- Confirm zero spam families remaining
SELECT COUNT(*) FROM families 
WHERE name LIKE 'NAME[_]%' ESCAPE '[' OR name LIKE 'DESC[_]%' ESCAPE '[';
-- Expected: 0

-- Confirm legitimate data tetap utuh — count should match expected total minus spam yang ke-delete
SELECT COUNT(*) as total_families,
       COUNT(DISTINCT ownerId) as total_owners,
       (SELECT COUNT(*) FROM users) as total_users,
       (SELECT COUNT(*) FROM members) as total_members
FROM families;

-- Spot check beberapa family legit untuk pastikan tidak ke-delete
SELECT id, name, ownerId, createdAt FROM families 
WHERE name LIKE '%Keluarga%' OR name LIKE '%Trah%' OR name LIKE '%Bani%'
ORDER BY createdAt DESC LIMIT 20;
```

Check public stats endpoint `/api/health` atau `/api/stats` setelah cleanup — angka `168 keluarga` (atau berapa pun yang ditampilkan di landing) harusnya turun ke angka yang masuk akal.

---

## Acceptance criteria

Setelah 3 patch deploy:

1. **Patch 1 — Rate limit aktif:**
   - 6 register dalam 60 detik dari IP yang sama → request ke-6 dapat 429
   - Login wrong password 11 kali dari IP yang sama → request ke-11 dapat 429
   - User authenticated create 4 family dalam 60 detik → request ke-4 dapat 429

2. **Patch 2 — Pattern detection aktif:**
   - POST family dengan `name="NAME_TEST"` → 400 dengan error message
   - POST family dengan `name="aaaaaaaaaaa"` → 400
   - POST family dengan `name="Keluarga Hadianto"` → 200 (legit pass)
   - POST register dengan `name="bot123"` → 400

3. **Patch 3 — Cleanup berhasil:**
   - `SELECT COUNT(*) FROM families WHERE name LIKE 'NAME_%'` → 0
   - Public stats `/api/stats` atau homepage `168 keluarga` turun ke angka realistis
   - Family Trah Djojo Moeljono dan keluarga lain yang legit tetap ada (spot check via query)
   - Tidak ada error di Cloudflare Workers logs setelah cleanup

4. **No regression:**
   - User existing masih bisa login tanpa hit rate limit
   - User existing masih bisa lihat family-nya di dashboard
   - Member count, marriages, stories tetap utuh untuk family yang legit

---

## Rollback plan

Kalau ada masalah setelah deploy:

**Patch 1 (rate limit):** Hapus binding `ratelimits` di wrangler.jsonc, hapus blok `await env.X_LIMIT.limit(...)` di code, redeploy. Reverts dalam 30 detik.

**Patch 2 (validation):** Comment out `if (nameError) return ...` blocks. Validation di-bypass tapi rate limit masih jalan. Redeploy.

**Patch 3 (cleanup):** Cleanup is destructive — restore via JSON backup di step 3a. Untuk D1, gunakan `wrangler d1 execute --file=restore.sql` dengan generated INSERT statements dari JSON. Bukan instan — bisa 5–15 menit tergantung volume.

---

## Out of scope (defer ke iterasi berikutnya)

Setelah 3 patch ini stabil di production, prioritas anti-abuse berikutnya:

1. **Cloudflare Turnstile** di register form — captcha gratis dari Cloudflare, drop-in replacement untuk reCAPTCHA. Block bot lebih sophisticated yang vary pattern.
2. **Email verification gate** — register kirim email konfirmasi, harus verified baru bisa create family. Kill bot tanpa real email infrastructure.
3. **Honeypot field** di form — `<input type="hidden" name="website">` yang user tidak isi tapi bot autofill. Reject submission yang isi field ini.
4. **Audit log table** — track semua register/family create dengan IP, user-agent, timestamp untuk forensic.
5. **Admin moderation queue** — family baru masuk pending state, admin approve sebelum visible publik. Heavy-handed tapi safest untuk public stats.
6. **Anomaly detection** — flag user yang create family > N dalam window > T jam, alert admin.

---

## Catatan penting untuk Sopian

- **Patch 1 deploy duluan** (5 menit). Stop bleeding sekarang sebelum bot bikin lebih banyak data junk.
- **Patch 3 cleanup paling akhir.** Setelah Patch 1 & 2 active selama minimal 30 menit untuk konfirmasi tidak ada lagi family masuk dengan pattern spam, baru jalankan cleanup. Kalau cleanup duluan tapi rate limit belum aktif, bot tinggal isi ulang dalam menit.
- **Jangan langsung umumkan ke komunitas.** Selesaikan dulu, dokumentasi ringkas, baru kalau perlu share — fokus ke "kami sudah memperkuat anti-spam protection" daripada "kami diserang bot". Frame matters.
- **Backup file dari step 3a** simpan minimal 30 hari sebelum dihapus, in case ada false positive di cleanup yang baru ketahuan kemudian.
