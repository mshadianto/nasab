# NASAB v8.0 — Enterprise-Grade Upgrade

Empat area upgrade untuk transformasi NASAB dari MVP ke enterprise SaaS. Kerjakan berurutan, test per area, deploy di akhir.

---

## AREA 1: Security, Governance & Audit

### 1A. PBKDF2 Password Hashing (ganti SHA-256)

Current: `SHA-256 + hardcoded salt` → rentan brute-force.
Target: `PBKDF2-SHA256` dengan random salt per user. Web Crypto API sudah support di Workers.

```javascript
// ─── NEW: PBKDF2 Password Hashing ───
async function hashPwPBKDF2(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  // Format: PBKDF2:base64(salt):base64(hash)
  const saltB64 = btoa(String.fromCharCode(...salt));
  const hashB64 = btoa(String.fromCharCode(...new Uint8Array(derivedBits)));
  return `PBKDF2:${saltB64}:${hashB64}`;
}

async function verifyPwPBKDF2(password, stored) {
  if (!stored.startsWith('PBKDF2:')) return false;
  const [, saltB64, hashB64] = stored.split(':');
  const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  const newHashB64 = btoa(String.fromCharCode(...new Uint8Array(derivedBits)));
  return newHashB64 === hashB64;
}
```

**Backward-compatible login:**
```javascript
// Di login endpoint:
if (user.password_hash.startsWith('PBKDF2:')) {
  // New format: verify with PBKDF2
  if (!await verifyPwPBKDF2(password, user.password_hash)) return err('...');
} else {
  // Legacy SHA-256 format: verify old way, then auto-upgrade
  const legacyHash = await hashPw(password); // existing SHA-256
  if (user.password_hash !== legacyHash) return err('...');
  // Auto-upgrade to PBKDF2 on successful login
  const newHash = await hashPwPBKDF2(password);
  await DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(newHash, user.id).run();
}
```

**Register:** langsung pakai `hashPwPBKDF2()`.
**Reset password:** langsung pakai `hashPwPBKDF2()`.
**Migration:** gradual — setiap user login, hash auto-upgrade. Tidak perlu bulk migration.

### 1B. Immutable Audit Trail

Schema baru:
```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT DEFAULT (datetime('now')),
  actor_id TEXT NOT NULL,
  actor_name TEXT DEFAULT '',
  actor_ip TEXT DEFAULT '',
  actor_ua TEXT DEFAULT '',
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT DEFAULT '',
  family_id TEXT DEFAULT '',
  details TEXT DEFAULT '',
  severity TEXT DEFAULT 'info'
);
CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_family ON audit_logs(family_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
```

**Severity levels:** `info`, `warning`, `critical`

**Actions yang di-audit (minimal):**
```javascript
const AUDIT_ACTIONS = {
  // Critical
  'member.nik_changed': 'critical',
  'member.deleted': 'critical',
  'member.bulk_deleted': 'critical',
  'family.role_changed': 'critical',
  'admin.role_changed': 'critical',
  'admin.user_deleted': 'critical',
  'auth.password_reset': 'critical',
  // Warning
  'member.created': 'warning',
  'member.updated': 'warning',
  'family.created': 'warning',
  'marriage.created': 'warning',
  // Info
  'auth.login': 'info',
  'auth.register': 'info',
  'gedcom.imported': 'info',
  'kk.imported': 'info',
  'biography.generated': 'info',
};
```

**Helper function:**
```javascript
async function auditLog(DB, request, { action, resourceType, resourceId, familyId, details, actorId, actorName }) {
  const id = 'al_' + uid();
  const ip = request.headers.get('CF-Connecting-IP') || '';
  const ua = (request.headers.get('User-Agent') || '').slice(0, 200);
  const severity = AUDIT_ACTIONS[action] || 'info';
  await DB.prepare(
    'INSERT INTO audit_logs (id, actor_id, actor_name, actor_ip, actor_ua, action, resource_type, resource_id, family_id, details, severity) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
  ).bind(id, actorId || '', actorName || '', ip, ua, action, resourceType, resourceId || '', familyId || '', details || '', severity).run();
}
```

**Panggil di setiap endpoint yang mutasi:**
```javascript
// Contoh: di member delete
await auditLog(DB, request, {
  action: 'member.deleted',
  resourceType: 'member',
  resourceId: mid,
  familyId: fid,
  actorId: user.id,
  actorName: user.name,
  details: `Deleted member ${memberName}`
});
```

**API endpoints audit (admin only):**
```
GET /api/admin/audit?family_id=&action=&severity=&from=&to=&limit=50
```

**Frontend: Audit Log viewer di Admin Panel**
- Tabel: Waktu | Actor | Action | Resource | Severity
- Filter: by family, by severity, by date range
- Badge warna: 🔴 critical, 🟡 warning, 🔵 info

---

## AREA 2: Ekspansi Faraidh & Manajemen Aset

### 2A. Kalkulator Distribusi Aset Riil

Extend FARAIDH engine. Setelah hitung rasio per ahli waris, user bisa input rincian aset:

```javascript
const ASSET_TYPES = [
  { id: 'cash', label: 'Uang Tunai/Tabungan', icon: '💰', unit: 'Rp' },
  { id: 'gold', label: 'Emas/Logam Mulia', icon: '🥇', unit: 'gram' },
  { id: 'property', label: 'Properti/Tanah', icon: '🏠', unit: 'Rp' },
  { id: 'vehicle', label: 'Kendaraan', icon: '🚗', unit: 'Rp' },
  { id: 'stock_sharia', label: 'Saham Syariah', icon: '📈', unit: 'Rp' },
  { id: 'sukuk', label: 'Sukuk/Obligasi Syariah', icon: '📜', unit: 'Rp' },
  { id: 'deposit', label: 'Deposito', icon: '🏦', unit: 'Rp' },
  { id: 'business', label: 'Usaha/Bisnis', icon: '🏢', unit: 'Rp' },
  { id: 'receivable', label: 'Piutang', icon: '📋', unit: 'Rp' },
  { id: 'other', label: 'Lainnya', icon: '📦', unit: 'Rp' },
];
```

**UI: Tabel input aset (sebelum tombol Hitung)**
```
┌─────────────────────────────────────────────────┐
│ 📦 Rincian Harta Peninggalan                     │
│                                                   │
│ Tipe          │ Deskripsi      │ Nilai (Rp)       │
│ 💰 Tabungan   │ BSI Syariah    │ 500.000.000      │
│ 🥇 Emas       │ 50 gram LM     │ 85.000.000       │
│ 🏠 Properti   │ Rumah Ciputat  │ 1.200.000.000    │
│ 📈 Saham      │ JII Portfolio  │ 200.000.000      │
│                               [+ Tambah Aset]    │
│──────────────────────────────────────────────────│
│ Total Aset Bruto:              Rp 1.985.000.000  │
│ − Hutang:                      Rp    50.000.000  │
│ − Wasiat (maks ⅓):            Rp   100.000.000  │
│ − Ziswaf (optional):          Rp    50.000.000  │
│ ═ Harta Warisan Bersih:       Rp 1.785.000.000  │
└─────────────────────────────────────────────────┘
```

**Output: Distribusi per ahli waris per aset**
```
┌─────────────────────────────────────────────────┐
│ Anak Laki-laki 1 (33.33%):    Rp 595.000.000   │
│   ├ 💰 Tabungan: Rp 166.650.000                │
│   ├ 🥇 Emas: 16.67 gram (≈Rp 28.339.000)      │
│   ├ 🏠 Properti: Rp 400.000.000 (bagian)       │
│   └ 📈 Saham: Rp 66.660.000                    │
└─────────────────────────────────────────────────┘
```

Data model: aset disimpan di state lokal (bukan DB) — hanya untuk kalkulasi session.

### 2B. Integrasi Ziswaf (Zakat, Infak, Sedekah, Wakaf)

Tambah section sebelum hitung faraidh:
- **Pelunasan Hutang** (sudah ada, keep)
- **Wasiat** (sudah ada, maks ⅓, keep)
- **Wakaf Keluarga** (baru): porsi yang di-wakaf-kan sebelum pembagian. Input Rp, di-deduct dari total.
- **Zakat Maal**: optional, hitung 2.5% dari harta di atas nisab (85 gram emas). Kalau user centang, auto-calculate.

**Urutan deduction (sesuai fiqih):**
```
Total Harta Bruto
  − Biaya Jenazah (tajhiz)
  − Pelunasan Hutang
  − Wasiat (maks ⅓ dari sisa)
  − Wakaf Keluarga (optional)
  = Harta Warisan Bersih → masuk algoritma faraidh
```

---

## AREA 3: Agentic AI

### 3A. AI Data Quality Agent

Background check yang jalan saat user buka workspace atau setelah import. Bukan real-time agent — ini **on-demand analysis** via `callAI()`.

**Trigger:** Tombol "🔍 AI Cek Data" di workspace header atau di Insights tab.

**Validasi yang dilakukan (client-side logic, tanpa AI):**
```javascript
function validateFamilyData(pp, marriages) {
  const issues = [];
  
  pp.forEach(p => {
    // 1. Parent-child age gap < 12 tahun (biologis tidak mungkin)
    if (p.parentId && p.birth_date) {
      const parent = pp.find(x => x.id === p.parentId);
      if (parent?.birth_date) {
        const gap = new Date(p.birth_date).getFullYear() - new Date(parent.birth_date).getFullYear();
        if (gap < 12) issues.push({ type: 'age_gap', severity: 'critical', person: p, parent, gap,
          msg: `${p.name} lahir ${gap} tahun setelah ${parent.name} — jarak terlalu dekat` });
        if (gap > 70) issues.push({ type: 'age_gap', severity: 'warning', person: p, parent, gap,
          msg: `${p.name} lahir ${gap} tahun setelah ${parent.name} — jarak sangat jauh` });
      }
    }
    
    // 2. Deceased before birth of children
    if (p.death_date) {
      const children = pp.filter(c => c.parentId === p.id && c.birth_date);
      children.forEach(c => {
        if (new Date(c.birth_date) > new Date(p.death_date)) {
          const diff = Math.floor((new Date(c.birth_date) - new Date(p.death_date)) / 86400000);
          if (diff > 280) // > 9 bulan setelah wafat
            issues.push({ type: 'posthumous', severity: 'warning', person: p, child: c,
              msg: `${c.name} lahir ${diff} hari setelah ${p.name} wafat` });
        }
      });
    }
    
    // 3. Duplicate NIK
    if (p.nik && p.nik.length === 16) {
      const dups = pp.filter(x => x.id !== p.id && x.nik === p.nik);
      if (dups.length) issues.push({ type: 'dup_nik', severity: 'critical', person: p, duplicates: dups,
        msg: `NIK ${p.name} sama dengan ${dups.map(d => d.name).join(', ')}` });
    }
    
    // 4. Birth date in future
    if (p.birth_date && new Date(p.birth_date) > new Date())
      issues.push({ type: 'future_birth', severity: 'warning', person: p,
        msg: `${p.name} tanggal lahir di masa depan` });
    
    // 5. Death before birth
    if (p.birth_date && p.death_date && new Date(p.death_date) < new Date(p.birth_date))
      issues.push({ type: 'death_before_birth', severity: 'critical', person: p,
        msg: `${p.name} wafat sebelum lahir` });
    
    // 6. Orphan (no parent, no spouse, no children) — mungkin data incomplete
    if (!p.parentId && !p.spouseId && !pp.some(c => c.parentId === p.id))
      issues.push({ type: 'orphan', severity: 'info', person: p,
        msg: `${p.name} tidak terhubung ke siapapun` });
    
    // 7. Missing key data
    if (!p.birth_date) issues.push({ type: 'missing_data', severity: 'info', person: p, field: 'birth_date',
      msg: `${p.name} belum ada tanggal lahir` });
    if (!p.gender || (p.gender !== 'male' && p.gender !== 'female'))
      issues.push({ type: 'missing_data', severity: 'warning', person: p, field: 'gender',
        msg: `${p.name} gender tidak valid` });
  });
  
  return issues.sort((a, b) => {
    const sev = { critical: 0, warning: 1, info: 2 };
    return (sev[a.severity] || 2) - (sev[b.severity] || 2);
  });
}
```

**UI: Data Quality Report**
```
┌── 🔍 Laporan Kualitas Data ──────────────┐
│                                            │
│ 🔴 2 Critical  🟡 4 Warning  🔵 8 Info   │
│                                            │
│ 🔴 NIK Sopian sama dengan Sakiran         │
│ 🔴 Ani lahir 8 tahun setelah ibunya       │
│ 🟡 Budi wafat sebelum anak ketiga lahir   │
│ 🟡 Siti gender tidak valid                │
│ 🔵 Ahmad belum ada tanggal lahir          │
│ 🔵 Fatimah tidak terhubung ke siapapun    │
│                                            │
│ [✨ AI Analysis] — analisis lebih dalam    │
└────────────────────────────────────────────┘
```

**"✨ AI Analysis" (opsional, pakai callAI):**
Kirim daftar issues + context ke Groq/Gemini → AI memberikan rekomendasi fix yang lebih natural/kontekstual.

### 3B. Interactive Genealogical Chatbot

**Tombol "💬 Tanya AI" floating** di workspace (mirip chat widget).

Chatbot yang bisa menjawab pertanyaan tentang data keluarga. **Bukan general-purpose chatbot** — hanya tentang data di silsilah ini.

**Architecture: Function Calling / Tool Use pattern**

```javascript
async function chatWithFamily(question, pp, marriages, fam) {
  // Pre-process: buat context summary dari data keluarga
  const familySummary = {
    name: fam.name,
    totalMembers: pp.length,
    generations: FE.stats(pp).generations,
    members: pp.map(p => ({
      name: p.name,
      gender: p.gender,
      birthDate: p.birth_date,
      deathDate: p.death_date,
      birthPlace: p.birth_place,
      location: p.location_address,
      parentName: pp.find(x => x.id === p.parentId)?.name || null,
      spouseName: pp.find(x => x.id === p.spouseId)?.name || null,
      childrenNames: pp.filter(c => c.parentId === p.id).map(c => c.name),
      nikProvince: p.nik ? NIK.parse(p.nik)?.provinsi : null,
      agama: p.agama
    }))
  };

  const systemPrompt = `Kamu adalah asisten silsilah keluarga "${fam.name}" di platform NASAB. Jawab pertanyaan user berdasarkan DATA KELUARGA berikut. HANYA jawab dari data yang ada — jangan mengarang. Jawab dalam Bahasa Indonesia, singkat dan informatif.

DATA KELUARGA:
${JSON.stringify(familySummary, null, 1)}`;

  return callAI(question, systemPrompt);
}
```

**Contoh pertanyaan user:**
- "Siapa saja yang lahir di Kalimantan?"
- "Berapa cucu Syachroel?"
- "Siapa yang merantau ke luar provinsi?"
- "Ada berapa perempuan di generasi ketiga?"
- "Jelaskan hubungan Sopian dengan Aulia Rahman"

**UI:**
```
┌── 💬 Tanya AI ─────────────────────────┐
│                                          │
│ 🤖 Hai! Tanya apa saja tentang          │
│    keluarga [Syachroel].                 │
│                                          │
│ 👤 Siapa yang merantau ke luar Kaltim?  │
│                                          │
│ 🤖 Berdasarkan data, M Sopian Hadianto  │
│    berasal dari Samarinda (Kaltim) tapi │
│    sekarang tinggal di Ciputat (Banten).│
│    Ia satu-satunya dari 6 bersaudara    │
│    yang merantau ke luar provinsi.       │
│                                          │
│ [Ketik pertanyaan...]         [Kirim]    │
└──────────────────────────────────────────┘
```

- Floating button "💬" di kanan bawah workspace
- Expand jadi chat panel 320px wide
- Chat history per session (state, bukan DB)
- Max 3-5 exchanges per session (untuk manage token)
- Pakai `callAI()` (Groq default — cepat & gratis)

---

## AREA 4: Arsitektur Backend & DX

### 4A. Migrasi ke Hono (OPSIONAL — pertimbangkan matang)

**Pro:**
- Middleware modular (CORS, auth, audit, encrypt → reusable)
- Type-safe routing (no regex hell)
- Built for Cloudflare Workers
- Community & ecosystem

**Kontra:**
- Breaking change besar — semua endpoint harus di-refactor
- Testing overhead
- Current single-file works fine untuk 14 endpoints

**Rekomendasi: JANGAN migrasi sekarang.** Tunggu sampai endpoint > 30 atau mulai ada bug karena regex routing. Untuk sekarang, **modularisasi saja:**

```javascript
// Di api/src/index.js, pisahkan ke helper functions:
// handleAuth(path, method, request, DB, env) — semua /api/auth/*
// handleFamily(path, method, request, DB, env) — semua /api/families/*
// handleAdmin(path, method, request, DB, env) — semua /api/admin/*
// handlePublic(path, method, request, DB, env) — /api/health, /api/biography/*

// Main router:
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return handleCORS(request);
    const { pathname } = new URL(request.url);
    
    if (pathname.startsWith('/api/auth/')) return handleAuth(pathname, request, env);
    if (pathname.startsWith('/api/admin/')) return handleAdmin(pathname, request, env);
    if (pathname.startsWith('/api/families/')) return handleFamily(pathname, request, env);
    if (pathname.startsWith('/api/biography/')) return handlePublic(pathname, request, env);
    if (pathname === '/api/health') return handlePublic(pathname, request, env);
    return err('Endpoint tidak ditemukan', 404);
  }
};
```

Ini tetap single-file tapi JAUH lebih readable. Hono bisa nanti di v9.0.

### 4B. Web Worker untuk Canvas Layout (Frontend)

Untuk tree 100+ orang di mobile, `autoLayout()` bisa blocking main thread.

```javascript
// frontend/public/layout-worker.js
self.onmessage = function(e) {
  const { pp, marriages, CW, CH, GX, GY, MAX_COLS } = e.data;
  
  // Copy autoLayout logic here (pure function, no DOM dependency)
  const positions = autoLayout(pp, marriages, CW, CH, GX, GY, MAX_COLS);
  
  self.postMessage({ positions });
};

// Di CanvasView component:
const layoutWorkerRef = useRef(null);

useEffect(() => {
  layoutWorkerRef.current = new Worker('/layout-worker.js');
  layoutWorkerRef.current.onmessage = (e) => {
    setPos(e.data.positions);
  };
  return () => layoutWorkerRef.current?.terminate();
}, []);

// Trigger layout:
function requestLayout(pp) {
  if (layoutWorkerRef.current) {
    layoutWorkerRef.current.postMessage({ pp, marriages, CW, CH, GX, GY, MAX_COLS });
  } else {
    // Fallback: main thread (kalau Worker tidak support)
    setPos(autoLayout(pp));
  }
}
```

**Benefit:** UI tetap responsive selama layout calculation. Especially important di mobile dengan tree besar.

---

## REQUIREMENTS

1. Update `api/src/index.js`:
   - PBKDF2 password hashing (backward-compatible)
   - audit_logs table + helper + log di setiap mutasi
   - Admin audit endpoint
   - Modularisasi handler functions (tetap single file)
2. Update `frontend/nasab.jsx`:
   - Faraidh: asset input table + Ziswaf deduction
   - Data Quality checker (client-side validations)
   - AI Chatbot (floating 💬 widget + callAI)
   - Audit Log viewer di Admin Panel
   - Web Worker untuk autoLayout (bonus)
3. Update `schema.sql`: tambah `audit_logs` table
4. Run migration: `npx wrangler d1 execute nasab-db --remote --file=../schema.sql`
5. JANGAN break existing features
6. Bump version → v8.0, bump sw.js CACHE
7. Deploy:
   ```bash
   cd api && npx wrangler deploy
   cd ../frontend && npm run build && npx wrangler pages deploy dist --project-name=nasab --branch=main --commit-dirty=true
   ```

## PRIORITAS IMPLEMENTASI
1. 🔴 PBKDF2 + backward-compat login (security critical)
2. 🔴 Audit Trail (governance requirement)
3. 🟡 Data Quality Checker (client-side, no API needed)
4. 🟡 Faraidh Asset Distribution + Ziswaf
5. 🟡 AI Chatbot
6. 🟢 API Modularisasi (DX improvement)
7. 🟢 Web Worker layout (performance, bonus)
