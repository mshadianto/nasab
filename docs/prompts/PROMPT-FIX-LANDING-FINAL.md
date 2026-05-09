# NASAB — Fix Landing Page Layout (Paripurna)

Landing page nasab.biz.id masih punya masalah layout yang SAMA setelah fix sebelumnya. Fix ini harus TUNTAS.

## MASALAH YANG TERLIHAT (dari screenshot)

1. **Konten mulai dari edge kiri layar (x=0)** — tidak ada padding-left. Teks "Jaga Nasab, Wariskan..." dan feature cards mulai dari pixel 0.
2. **Sisi kanan ada blank space** — konten tidak centered, melainkan left-aligned tanpa padding kanan yang seimbang.
3. **Stats "100+" masih hardcoded** — padahal GET /api/public/stats sudah ada dan return data real (122 users, 164 families, 748 members).
4. **Feature cards saling rapat** — "Ekstrak KK Otomatis", "Kalkulator Faraidh", "Biografi AI" kurang gap.

## ROOT CAUSE

Masalah utama: **semua section wrapper TIDAK punya padding horizontal yang konsisten**. Tailwind `max-w-6xl` tanpa `mx-auto` dan `px-6` menyebabkan konten nempel ke kiri.

## FIX — DEFINITIVE

### Prinsip: Setiap major section harus wrapped dalam container yang identik:

```jsx
// SEMUA section di landing page HARUS pakai wrapper ini:
<div style={{
  maxWidth: '1152px',     // ~max-w-6xl
  margin: '0 auto',       // centered
  padding: '0 24px',      // 24px padding kiri DAN kanan — ini yang KURANG
  width: '100%',
  boxSizing: 'border-box'
}}>
  {/* section content */}
</div>
```

### Atau jika pakai Tailwind classes:
```
className="max-w-6xl mx-auto px-6 w-full"
```

**SETIAP section** di landing page harus punya wrapper ini:
- Hero section (Jaga Nasab, Wariskan...)
- Fitur Unggulan (Ekstrak KK, Faraidh, Biografi AI)
- Cara Kerja (4 langkah)
- 53 Fitur grid
- Keamanan section (NIK & Data Pribadi)
- Statistik section
- CTA/Footer section
- Navbar

### Spesifik per section:

**Hero:**
```jsx
<section style={{ padding: '80px 0 60px' }}>
  <div style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px', display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap' }}>
    <div style={{ flex: '1 1 400px' }}>{/* text */}</div>
    <div style={{ flex: '1 1 300px', maxWidth: 450, margin: '0 auto' }}>{/* illustration */}</div>
  </div>
</section>
```

**Feature cards (3-column):**
```jsx
<div style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px' }}>
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
    {/* cards with padding: 24px each */}
  </div>
</div>
```

**53 Fitur grid (4-column):**
```jsx
<div style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px' }}>
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
    {/* mini cards */}
  </div>
</div>
```

**Stats (angka real dari API):**
```jsx
// HARUS fetch dari /api/public/stats — endpoint sudah ada
const [stats, setStats] = useState(null);
useEffect(() => {
  fetch(API_URL + '/api/public/stats')
    .then(r => r.json())
    .then(setStats)
    .catch(() => {});
}, []);

// Display:
<span style={{ fontWeight: 700 }}>{stats?.families || '...'}</span> keluarga Indonesia sudah bergabung
// JANGAN hardcode "100+". Tampilkan angka real: 164
```

### Mobile responsive:
```css
@media (max-width: 768px) {
  /* Hero: stack vertically */
  /* Feature grid: 1 column */
  /* 53 Fitur: 2 columns then 1 */
  /* All text: smaller font-size */
  /* Padding: 0 16px instead of 0 24px */
}
```

## CHECKLIST SEBELUM DEPLOY

Buka di browser, resize ke beberapa width:
- [ ] 1920px: konten centered, tidak ada blank space kiri/kanan yang asimetris
- [ ] 1366px: sama, konten centered
- [ ] 768px: cards single/double column, text readable
- [ ] 375px: full mobile, everything stacked, no horizontal scroll

Untuk SETIAP section:
- [ ] Ada padding-left >= 24px
- [ ] Ada padding-right >= 24px
- [ ] Konten centered (margin: 0 auto)
- [ ] Max-width konsisten (1152px / max-w-6xl)
- [ ] Tidak ada text/card yang terpotong di edge

Stats:
- [ ] Tampilkan angka real dari API (164 keluarga, bukan "100+")
- [ ] Loading state: "..." saat fetch

## DEPLOY
```bash
cd frontend && npm run build && npx wrangler pages deploy dist --project-name=nasab --branch=main --commit-dirty=true
```
Bump sw.js CACHE.
