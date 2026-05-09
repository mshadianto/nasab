# NASAB — Bugfix: Landing Page Stats + Layout + POV Root

Tiga masalah yang perlu diperbaiki. Kerjakan semua, deploy.

---

## BUG 1: Statistik Landing Page Tidak Real (CRITICAL)

### Problem
Landing page (halaman sebelum login) menampilkan statistik yang hardcoded/dummy — bukan data real dari database. Padahal data real sudah ada:
- 122 users
- 164 families
- 748 members
- 116 marriages

### Fix
Landing page harus fetch statistik real dari API public endpoint.

**Opsi A (Recommended): Buat public stats endpoint**
```javascript
// Di api/src/index.js, tambah endpoint tanpa auth:
// GET /api/public/stats
// Response: { users: 122, families: 164, members: 748 }
// Hanya return aggregate counts — TIDAK return data sensitif
```

```javascript
if (path === '/api/public/stats' && method === 'GET') {
  const [u, f, m] = await Promise.all([
    DB.prepare('SELECT COUNT(*) as c FROM users').first(),
    DB.prepare('SELECT COUNT(*) as c FROM families').first(),
    DB.prepare('SELECT COUNT(*) as c FROM members').first(),
  ]);
  return json({ users: u.c, families: f.c, members: m.c });
}
```

**Di frontend landing page:**
```javascript
// Fetch real stats saat landing page mount
const [stats, setStats] = useState({ users: 0, families: 0, members: 0 });
useEffect(() => {
  fetch(API_URL + '/api/public/stats')
    .then(r => r.json())
    .then(d => setStats(d))
    .catch(() => {}); // silent fail, show 0
}, []);

// Display:
// "122 keluarga Indonesia sudah bergabung" (bukan "100+")
// atau format: "120+" (round down to nearest 10)
```

**Opsi B (Simpler, no API change):** Pakai data dari `/api/health` yang sudah ada — tapi endpoint ini tidak return stats. Opsi A lebih proper.

---

## BUG 2: Landing Page Layout Berhimpit / Overlap

### Problem
Dari screenshot: teks dan konten saling berhimpit, spacing kurang, layout tidak responsive.

### Specific Issues to Fix:

1. **Hero section**: teks "Jaga Nasab, Wariskan Kisah Keluarga" dan ilustrasi terlalu dekat / overlap di layar tertentu
2. **Stats badges**: "100+ keluarga Indonesia sudah bergabung" terlalu dekat dengan CTA button
3. **Feature cards**: "Ekstrak KK Otomatis", "Kalkulator Faraidh", "Biografi AI" — konten cards berhimpit, kurang padding/gap
4. **Typography**: heading besar ("Jaga Nasab...") mungkin perlu responsive font-size

### Fix Approach:

```css
/* Hero section */
.landing-hero {
  padding: 60px 24px 40px;        /* increase vertical padding */
  gap: 40px;                       /* increase gap between text and illustration */
  min-height: 80vh;                /* ensure full viewport */
}

/* Feature grid */
.landing-features-grid {
  gap: 24px;                       /* increase gap between cards */
  padding: 40px 24px;             /* increase section padding */
}

.landing-feature-card {
  padding: 24px;                   /* increase internal padding */
}

/* Stats section */
.landing-stats {
  margin-top: 24px;               /* space from CTA */
  gap: 16px;
}

/* Responsive */
@media (max-width: 768px) {
  .landing-hero h1 {
    font-size: 28px;              /* smaller on mobile */
    line-height: 1.2;
  }
  .landing-hero {
    padding: 32px 16px;
    flex-direction: column;        /* stack vertically */
    text-align: center;
  }
  .landing-features-grid {
    grid-template-columns: 1fr;    /* single column on mobile */
    gap: 16px;
  }
}
```

### General Principles:
- **Minimum 24px gap** antara major sections
- **Minimum 16px padding** di dalam cards
- **Max-width 1200px** untuk content container, centered
- **Feature cards**: consistent height, no overflow
- **Hero illustration**: responsive, max-width 400px, don't overlap text
- Test di: 1920px, 1366px, 768px, 375px viewports

---

## BUG 3: POV Root Auto-Detection Salah (dari investigasi sebelumnya)

### Problem
Keluarga "Sutan Sjamsuddin Tasik" — 31 anggota tapi Canvas hanya tampilkan 4, karena POV auto-detect memilih Syahrial (menantu, 6 anak langsung) sebagai root, bukan Sjamsuddin Tasik (kakek, 1 anak langsung tapi 30 keturunan total).

### Root Cause
Auto-detect pakai "most direct children" → salah. Harus pakai "most total descendants (recursive)".

### Fix
```javascript
// BEFORE:
const autoRoot = roots.reduce((best, r) => 
  FE.ch(pp, r.id).length > FE.ch(pp, best.id).length ? r : best
);

// AFTER:
const autoRoot = roots.reduce((best, r) => {
  const rDesc = FE.descAll ? FE.descAll(pp, r.id, marriages) : FE.desc(pp, r.id);
  const bDesc = FE.descAll ? FE.descAll(pp, best.id, marriages) : FE.desc(pp, best.id);
  if (rDesc !== bDesc) return rDesc > bDesc ? r : best;
  // Tiebreaker: prefer person whose name appears in family name
  const rInName = fam.name.toLowerCase().includes(r.name.toLowerCase().split(' ')[0]);
  const bInName = fam.name.toLowerCase().includes(best.name.toLowerCase().split(' ')[0]);
  if (rInName && !bInName) return r;
  return best;
});
```

### Also fix auto-collapse threshold:
```javascript
// Sebelum: auto-collapse if pp.length > 20 (terlalu agresif)
// Sesudah: auto-collapse if visible POV members > 40
```

---

## DEPLOY

```bash
# API (new public stats endpoint)
cd api && npx wrangler deploy

# Frontend (layout fix + POV fix)
cd frontend && npm run build && npx wrangler pages deploy dist --project-name=nasab --branch=main --commit-dirty=true
```

Bump sw.js CACHE version.

## TEST
1. Buka https://nasab.biz.id (tanpa login) — statistik harus menampilkan angka real (~122 keluarga, ~748 anggota)
2. Layout landing page: tidak ada overlap, spacing proper di desktop dan mobile
3. Login → buka Keluarga "Sutan Sjamsuddin Tasik" → Canvas harus tampilkan >4 anggota, root = Sjamsuddin
