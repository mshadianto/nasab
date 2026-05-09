# PROMPT-LANDING-RESPONSIVE.md

> **Target:** Landing page publik di `nasab.biz.id` (URL root, sebelum login).
> **Tujuan:** Tambahkan media query yang missing supaya landing page rapi di viewport 320 px–768 px. Saat ini desktop view oke, tapi mobile narrow (≤ 480 px) belum di-handle dengan benar.
> **Konteks penting:** Landing page ini **bukan** file `index.html` di root repo (yang itu adalah React SaaS app artifact dengan dark theme). Landing page ini adalah marketing page terpisah dengan green/sage theme, headline "Jaga Nasab, Wariskan Kisah Keluarga", versi v8.1.

---

## Step 0 — Investigation: temukan source landing page

Sebelum menulis patch, identifikasi dulu **di mana file source landing page-nya**. Kandidat lokasi yang paling mungkin:

```bash
# Search di folder frontend
find frontend -name "*.html" -o -name "*.jsx" -o -name "*.tsx" | head -20
find frontend -type f \( -name "Landing*" -o -name "Hero*" -o -name "Home*" -o -name "Marketing*" \)

# Search berdasarkan content khas landing
grep -rl "Jaga Nasab" frontend/ 2>/dev/null
grep -rl "Wariskan Kisah" frontend/ 2>/dev/null
grep -rl "PLATFORM SILSILAH" frontend/ 2>/dev/null
grep -rl "168 keluarga" frontend/ 2>/dev/null

# Check Cloudflare Pages deployment config
cat wrangler.jsonc 2>/dev/null
cat frontend/wrangler.jsonc 2>/dev/null
cat deploy.sh
```

Setelah file source ditemukan, **report path-nya** sebelum lanjut ke patch. Kalau tidak ditemukan di repo, kemungkinan file-nya di-deploy manual ke Cloudflare Pages — minta user share file-nya.

---

## Step 1 — Audit breakpoint yang sudah ada

Setelah source ditemukan, scan semua `@media` query di file CSS landing dan dokumentasikan apa saja yang sudah ter-define:

```bash
grep -n "@media" <landing-file-path>
```

Output yang diharapkan: list breakpoint yang sudah ada (kemungkinan cuma `768px`, atau bahkan tidak ada sama sekali untuk landing).

---

## Konteks masalah yang terlihat di screenshot

Landing page punya struktur khas marketing page yang **hanya di-design untuk desktop wide (1280px+)**:

1. **Hero section split 2-column** — kiri: badge + H1 "Jaga Nasab, Wariskan Kisah Keluarga" (huge serif font) + subtitle + 2 CTA + social proof. Kanan: tree illustration. Pada viewport ≤ 768 px, ini perlu stack vertikal.
2. **CTA bersebelahan** — "Mulai Pohon Keluarga Anda" + "Jelajahi 53 Fitur" pada viewport ≤ 480 px akan cramped, perlu stack vertikal full-width.
3. **Floating badge "53 Fitur · v8.10"** — di sudut kanan bawah ilustrasi, kelihatan ke-clip / overflow di viewport tertentu. Perlu repositioning atau hide pada narrow.
4. **Feature card grid 3-kolom** — "Ekstrak KK Otomatis", "Kalkulator Faraidh", "Biografi AI" — pada viewport ≤ 768 px perlu jadi 1-kolom.
5. **Hero H1 64px+** — pada viewport 320 px akan overflow horizontal atau wrap awkward. Perlu turun bertahap: 64 → 48 → 36 → 28 px.
6. **Header nav inline** — "Fitur · Cara Kerja · Keamanan · Statistik · Login/Daftar" — pada viewport ≤ 640 px perlu collapse jadi hamburger menu.
7. **Container max-width** — kemungkinan tidak di-cap, sehingga di monitor ultra-wide (1920+) content stretching tidak rapi. Cap di 1280 px atau 1320 px.

---

## Patch 1 — Breakpoint structure (4 tier)

Tambahkan empat tier media query (dari widest ke narrowest) di file CSS landing. Letakkan di akhir file CSS supaya override base styles desktop.

### Struktur yang harus ada

```css
/* ─── Tablet & narrow desktop ─── */
@media (max-width: 1024px) {
  /* Hero: turunkan padding container, scale H1 turun */
}

/* ─── Tablet portrait & large mobile ─── */
@media (max-width: 768px) {
  /* Hero: stack vertikal (kiri-kanan jadi atas-bawah) */
  /* Feature grid: 2-kolom atau 1-kolom */
  /* Nav: collapse ke hamburger */
}

/* ─── Standard mobile ─── */
@media (max-width: 480px) {
  /* CTA stack full-width */
  /* H1 turun lagi */
  /* Padding section dirapatkan */
}

/* ─── Narrow mobile (iPhone SE / iPhone 5) ─── */
@media (max-width: 320px) {
  /* Font scaling minimum */
  /* Container padding minimum */
  /* Hide elemen non-essential (floating badge) */
}
```

**Rationale:** 4 tier ini cover ~99% device aktual berdasarkan distribusi viewport global 2025 (iPhone SE = 320, standard mobile = 375–414, tablet portrait = 768, narrow desktop = 1024). Tier 320 yang paling penting karena itu yang dimaksud user dengan "320 max-width".

---

## Patch 2 — Hero section responsive

Hero yang sekarang split kiri-kanan (text + illustration) perlu stack di mobile.

### Selector pattern yang harus ditangani

Cari kelas atau structure yang merepresentasikan hero. Kandidat selector (sesuaikan dengan codebase aktual):
- `.hero`, `.hero-section`, `.hero-grid`, `.hero-wrapper`
- `.landing-hero`, `[class*="Hero"]`

### CSS yang dibutuhkan

```css
/* Base (desktop) — pertahankan yang sudah ada, kemungkinan grid 2-kolom */
.hero { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; max-width: 1280px; margin: 0 auto; padding: 6rem 2rem; }

/* Tablet & below — stack */
@media (max-width: 1024px) {
  .hero { grid-template-columns: 1fr; gap: 3rem; padding: 4rem 1.5rem; text-align: center; }
  .hero-illustration { order: -1; max-width: 480px; margin: 0 auto; }  /* taruh ilustrasi di atas, atau hapus order kalau mau di bawah */
}

/* Mobile narrow */
@media (max-width: 480px) {
  .hero { padding: 2.5rem 1rem; gap: 2rem; }
  .hero-illustration { max-width: 280px; }
}

@media (max-width: 320px) {
  .hero { padding: 2rem 0.75rem; }
  .hero-illustration { display: none; }  /* drastic: hide illustration di iPhone SE */
}
```

**Catatan:** Pertimbangkan `.hero-illustration { display: none }` di 320 px untuk mengembalikan vertical real estate ke konten utama. Ilustrasi cantik tapi non-essential.

---

## Patch 3 — H1 typography scaling

Hero H1 "Jaga Nasab, Wariskan Kisah Keluarga" kelihatan ~60–72 px di desktop. Pada mobile harus turun bertahap supaya tidak overflow atau wrap awkward.

### Skala yang direkomendasikan

```css
/* Base (desktop wide) */
.hero h1 { font-size: clamp(2.5rem, 5vw, 4.5rem); line-height: 1.1; letter-spacing: -0.02em; }

/* Atau tier-based kalau tidak mau pakai clamp */
.hero h1 { font-size: 4rem; line-height: 1.1; }  /* 64px */

@media (max-width: 1024px) { .hero h1 { font-size: 3rem; } }   /* 48px */
@media (max-width: 768px)  { .hero h1 { font-size: 2.5rem; } } /* 40px */
@media (max-width: 480px)  { .hero h1 { font-size: 2rem; } }   /* 32px */
@media (max-width: 320px)  { .hero h1 { font-size: 1.625rem; } } /* 26px */
```

**Rekomendasi gue: pakai `clamp()`** kalau browser support tidak masalah (semua browser modern support, IE11 tidak — abaikan). Lebih halus transitionnya tanpa breakpoint discrete.

---

## Patch 4 — CTA buttons stacking

"Mulai Pohon Keluarga Anda" + "Jelajahi 53 Fitur" — desktop side-by-side, mobile stack.

```css
/* Base */
.hero-cta-group { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; }
.hero-cta-primary, .hero-cta-secondary { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.875rem 1.5rem; }

/* Mobile narrow */
@media (max-width: 480px) {
  .hero-cta-group { flex-direction: column; align-items: stretch; gap: 0.75rem; width: 100%; }
  .hero-cta-primary, .hero-cta-secondary { width: 100%; justify-content: center; padding: 0.875rem 1rem; }
}
```

**Rationale:** Full-width CTA di mobile = thumb-friendly, lebih mudah di-tap, dan visually konsisten dengan pattern app yang sudah familiar.

---

## Patch 5 — Floating "53 Fitur · v8.10" badge

Badge yang kelihatan ke-clip di pojok kanan bawah ilustrasi. Kemungkinan `position: absolute` dengan koordinat yang overflow di narrow viewport.

### Strategi

Pilihan A — **Reposition di mobile:** badge tetap visible tapi pindah ke flow document.

```css
.feature-badge { position: absolute; bottom: 1rem; right: 1rem; }

@media (max-width: 768px) {
  .feature-badge { position: static; margin: 1rem auto 0; display: inline-flex; }
}
```

Pilihan B — **Hide di mobile narrow:** kalau badge tidak essential.

```css
@media (max-width: 480px) {
  .feature-badge { display: none; }
}
```

**Rekomendasi gue: Pilihan A.** Badge "53 Fitur" itu social proof yang valuable, jangan dibuang — pindah ke flow document supaya tetap visible.

---

## Patch 6 — Feature card grid

3-kolom grid "Ekstrak KK Otomatis · Kalkulator Faraidh · Biografi AI" perlu collapse di mobile.

```css
.feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; max-width: 1200px; margin: 0 auto; padding: 0 2rem; }

@media (max-width: 1024px) {
  .feature-grid { grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
}

@media (max-width: 640px) {
  .feature-grid { grid-template-columns: 1fr; gap: 1rem; padding: 0 1rem; }
}
```

**Catatan:** `auto-fit minmax(280px, 1fr)` adalah alternatif yang lebih elegant — collapse otomatis tanpa breakpoint:

```css
.feature-grid { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
```

---

## Patch 7 — Header navigation collapse

Inline nav "Fitur · Cara Kerja · Keamanan · Statistik · Login/Daftar" perlu jadi hamburger pada viewport sempit.

### Implementasi minimal (kalau belum ada hamburger logic)

```css
.nav-links { display: flex; gap: 2rem; align-items: center; }
.nav-toggle { display: none; }

@media (max-width: 768px) {
  .nav-links { display: none; flex-direction: column; position: absolute; top: 100%; left: 0; right: 0; background: var(--bg-primary); padding: 1rem; gap: 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
  .nav-links.is-open { display: flex; }
  .nav-toggle { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: transparent; border: 1px solid var(--border); border-radius: 8px; cursor: pointer; }
}
```

**Catatan:** Toggle button needs JS handler. Kalau landing page pakai React/Vue, tambahkan state `isOpen` + onClick handler. Kalau pakai vanilla HTML, tambahkan `<script>` minimal:

```html
<button class="nav-toggle" onclick="document.querySelector('.nav-links').classList.toggle('is-open')">☰</button>
```

---

## Patch 8 — Container max-width cap

Pada monitor ultra-wide (1920+), content stretching kelihatan tidak rapi. Cap di 1280 px atau 1320 px.

```css
.container, .section-content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem;
}

@media (max-width: 768px) {
  .container, .section-content { padding: 0 1.5rem; }
}

@media (max-width: 480px) {
  .container, .section-content { padding: 0 1rem; }
}
```

---

## Acceptance criteria

Setelah semua patch diterapkan, test di Chrome DevTools dengan device toolbar:

1. **iPhone SE (320 × 568):** H1 tidak overflow horizontal, CTA stack vertikal full-width, hero illustration hidden atau dipindah, container padding 1 rem.
2. **iPhone 12 Pro (390 × 844):** H1 ~32 px, CTA stack vertikal, illustration di atas atau bawah hero text (tidak lagi sebelah kanan).
3. **iPad Mini (768 × 1024):** Hero stack vertikal, feature grid 2-kolom atau 1-kolom, nav jadi hamburger.
4. **iPad Pro (1024 × 1366):** Hero masih split 2-kolom (atau sudah stack — pilihan), feature grid 2-kolom.
5. **Desktop 1280+:** Sama dengan sebelum patch (tidak ada regresi).
6. **Ultra-wide 1920+:** Container ter-cap di 1280–1320 px, tidak stretching ke edge layar.
7. **Tidak ada horizontal scrollbar** pada viewport mana pun ≥ 320 px.
8. **Floating badge "53 Fitur"** terlihat di semua viewport (atau di-hide secara intentional di ≤ 480 px) — tidak ke-clip atau overflow.

## Test command

```bash
# Quick check di terminal — pastikan media query ter-include di build output
grep -c "@media" <landing-file-or-build-output>

# Expect: minimum 4 occurrence (untuk 4 tier breakpoint yang kita add)
```

## Out of scope

- Performance optimization (bundle size, image lazy-loading)
- Dark mode toggle (kalau belum ada)
- Animation tuning (saat ini mungkin sudah ada)
- A11y improvements (focus indicators, ARIA labels) — perlu audit terpisah
- SEO meta tags optimization

## Catatan untuk Sopian

Karena gue belum lihat source landing page langsung, patch di atas pakai **selector pattern generic**. Claude Code harus adapt selector aktual di codebase (mungkin BEM, mungkin Tailwind utility, mungkin CSS modules). Logic responsive-nya yang penting — bukan nama class persis.

Kalau setelah deploy ada element yang masih bermasalah di viewport tertentu, share screenshot dengan device width info-nya. Iterasi cepat dari situ.
