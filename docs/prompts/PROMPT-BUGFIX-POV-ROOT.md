# NASAB — Bugfix: POV Root Auto-Detection

## BUG REPORT

Keluarga "Sutan Sjamsuddin Tasik" punya 31 anggota tapi Canvas hanya tampilkan 4. Penyebab: POV mode auto-detect root memilih Syahrial (menantu, 6 anak langsung) instead of Sjamsuddin Tasik (kakek, 1 anak langsung tapi 30 keturunan total).

## ROOT CAUSE

`getPOVMembers()` auto-detect root person pakai "most direct children among roots" → Syahrial (6 children) > Sjamsuddin (1 child) → Syahrial jadi root → Sjamsuddin bukan blood relative Syahrial → hanya 4 orang tampil.

Struktur:
```
Sjamsuddin + Dalima (kakek-nenek) ← HARUSNYA root
  └── Jusmawati (anak, parent_id = Sjamsuddin)
        ∞ Syahrial (suami, parent_id = NULL) ← SALAH dipilih sebagai root
              └── 6 anak → 13 cucu
```

## FIX

### 1. Ubah auto-detect root logic

Sekarang: "root with most **direct children**" → salah karena patriarch sering punya sedikit anak langsung tapi banyak keturunan total.

Fix: "root with most **total descendants** (recursive)" — ini benar karena patriarch/matriarch selalu punya keturunan terbanyak.

```javascript
// BEFORE (salah):
const autoRoot = roots.reduce((best, r) => 
  FE.ch(pp, r.id).length > FE.ch(pp, best.id).length ? r : best
);

// AFTER (benar):
const autoRoot = roots.reduce((best, r) => {
  // descAll includes spouse's children → Sjamsuddin gets credit for
  // Jusmawati's children (via Syahrial) = 6 + 13 = much more than Syahrial alone
  const rDesc = FE.descAll(pp, r.id, marriages);
  const bDesc = FE.descAll(pp, best.id, marriages);
  return rDesc > bDesc ? r : best;
});
```

### 2. Tiebreaker: prefer orang yang namanya di family name

Kalau descAll sama, prefer orang yang namanya ada di `fam.name`:
```javascript
// Tiebreaker
if (rDesc === bDesc) {
  const rInName = fam.name.toLowerCase().includes(r.name.toLowerCase().split(' ')[0]);
  const bInName = fam.name.toLowerCase().includes(best.name.toLowerCase().split(' ')[0]);
  if (rInName && !bInName) return r;
}
```

### 3. Juga fix: POV harus auto-expand kalau hanya sedikit yang visible

Kalau POV mode tampilkan < 30% total members, auto-expand satu level atau tampilkan warning:
```
"Menampilkan 4 dari 31 anggota. Klik 🔗 pada pasangan untuk lihat cabang lain, atau pilih [Tampilkan Semua]."
```

### 4. POV blood relative check harus trace melalui spouse

Current `isBloodRelative()` kemungkinan TIDAK trace melalui spouse's parent chain. Fix:
- Sjamsuddin → Jusmawati (child, blood) ✅
- Jusmawati → Syahrial (spouse) → Syahrial's children → harus juga dianggap keturunan Sjamsuddin
- Ini harusnya sudah work via `descAll()` tapi double-check di `getPOVMembers()`

### 5. Expand collapsed branches by default kalau tree kecil

31 orang bukan "large tree" — auto-collapse gen≥2 terlalu agresif. Naikkan threshold:
```javascript
// Sebelum: auto-collapse if pp.length > 20
// Sesudah: auto-collapse if pp.length > 50
// Atau: auto-collapse if visible members in POV > 30
```

## TEST

Dengan fix ini, buka Keluarga "Sutan Sjamsuddin Tasik":
- [ ] Root auto-detect = Sjamsuddin Tasik (bukan Syahrial)
- [ ] POV tampilkan: Sjamsuddin + Dalima + Jusmawati + Syahrial (branch 🔗) + 6 anak + cucu = jauh lebih dari 4
- [ ] Atau jika Syahrial tetap branch, minimal Sjamsuddin side fully expanded
- [ ] "4/31 anggota" → menjadi "31/31 anggota" atau "20+/31 anggota"

## DEPLOY

```bash
cd frontend && npm run build && npx wrangler pages deploy dist --project-name=nasab --branch=main --commit-dirty=true
```
Bump sw.js CACHE.
