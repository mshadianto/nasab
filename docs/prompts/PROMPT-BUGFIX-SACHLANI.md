# NASAB — Bugfix dari Feedback User (Pak Sachlani)

Tiga issue spesifik dari user real. Fix semua, deploy.

## Feedback Verbatim

> "Notifikasi import sudah bekerja dan sangat membantu. Hasil terupload semua. Hubungan orang tua, pasangan, sibling dan anak sudah benar. Namun Family Tree di Canvas masih tidak akurat dan berantakan (tumpang tindih). Saran untuk istri seharusnya jumlah keturunan tidak 0, tapi disamakan dengan suaminya. Mohon ditambah fitur multiple delete (atau delete all)."

---

## BUG 1: Canvas Layout Tumpang Tindih (CRITICAL)

### Problem
Setelah GEDCOM import 73+ orang, tree di Canvas berantakan — cards saling tumpang tindih, tidak terbaca.

### Root Cause
`autoLayout()` function tidak handle tree besar dengan baik. Kemungkinan:
1. Horizontal spacing terlalu sempit untuk banyak sibling/sepupu
2. Subtree collision — dua cabang keluarga menempati area yang sama
3. `MAX_COLS=4` (wrap siblings) mungkin menyebabkan overlap vertikal
4. Multi-spouse layout tidak memperhitungkan space ekstra

### Fix: Improve autoLayout()

Prinsip layout tree yang benar:
```
1. Bottom-up width calculation:
   - Leaf node width = CW (card width)
   - Parent width = sum of children widths + gaps
   - Spouse menambah width (CW + gap per spouse)
   
2. Top-down positioning:
   - Root centered di atas
   - Children distributed evenly di bawah parent
   - Setiap subtree punya "bounding box" yang tidak boleh overlap

3. Collision detection:
   - Setelah layout, scan semua cards
   - Kalau ada overlap (jarak < CW+gap horizontal ATAU CH+gap vertikal), shift ke kanan
```

Key fixes yang dibutuhkan:
- **Increase horizontal gap** antara subtree: sekarang `GX=24`, untuk tree besar mungkin perlu adaptive gap berdasarkan depth
- **Bounding box per subtree**: setiap subtree reservasi horizontal space, subtree sebelah tidak boleh masuk
- **Post-layout collision pass**: setelah semua diposisikan, loop dan detect overlap, shift yang overlap
- **Multi-spouse spacing**: kalau seseorang punya 2+ istri (dari marriages table), allocate extra horizontal space

### Minimum viable fix:
```javascript
// Setelah autoLayout() selesai, tambah collision resolution:
function resolveOverlaps(pos) {
  const entries = Object.entries(pos);
  // Sort by Y (row) then X
  entries.sort((a, b) => a[1].y - b[1].y || a[1].x - b[1].x);
  
  // Group by approximate Y (same generation)
  const rows = {};
  entries.forEach(([id, p]) => {
    const rowKey = Math.round(p.y / (CH + GY));
    if (!rows[rowKey]) rows[rowKey] = [];
    rows[rowKey].push({ id, ...p });
  });
  
  // Per row, ensure minimum horizontal distance
  const MIN_GAP = CW + 20; // card width + minimum gap
  Object.values(rows).forEach(row => {
    row.sort((a, b) => a.x - b.x);
    for (let i = 1; i < row.length; i++) {
      const prev = row[i - 1];
      const curr = row[i];
      if (curr.x - prev.x < MIN_GAP) {
        const shift = MIN_GAP - (curr.x - prev.x);
        // Shift this and all subsequent nodes right
        for (let j = i; j < row.length; j++) {
          row[j].x += shift;
          pos[row[j].id].x += shift;
        }
      }
    }
  });
  
  return pos;
}

// Call after autoLayout:
// const pos = resolveOverlaps(autoLayout(pp));
```

### Testing
- Import GEDCOM dengan 50+ orang, 4+ generasi
- Verify: TIDAK ada card yang overlap
- Verify: tree readable — parent di atas, children di bawah, connectors visible
- Verify: zoom out menampilkan seluruh tree tanpa overlap

---

## BUG 2: Istri Jumlah Keturunan = 0

### Problem
Di sidebar/detail, istri menampilkan "Keturunan: 0" padahal suaminya punya anak. User bilang: "istri seharusnya jumlah keturunan disamakan dengan suaminya."

### Root Cause
`FE.desc(pp, personId)` menghitung descendants via `FE.ch(pp, personId)` — yang hanya mengembalikan anak yang `parentId === personId`. Karena children biasanya di-link ke ayah (parentId = suami), istri tidak punya direct children.

### Fix di FE.desc() dan FE.ch():

```javascript
// Option A: ch() juga return anak pasangan
ch: (pp, pid, marriages) => {
  const direct = pp.filter(p => p.parentId === pid);
  if (direct.length > 0) return direct;
  
  // Kalau tidak punya anak langsung, cek apakah pasangan punya anak
  const person = pp.find(p => p.id === pid);
  if (!person) return [];
  
  // Cek via spouseId
  if (person.spouseId) {
    const spouseChildren = pp.filter(p => p.parentId === person.spouseId);
    if (spouseChildren.length > 0) return spouseChildren;
  }
  
  // Cek via marriages table
  if (marriages) {
    const myMarriages = marriages.filter(m => m.husband_id === pid || m.wife_id === pid);
    for (const mar of myMarriages) {
      const partnerId = mar.husband_id === pid ? mar.wife_id : mar.husband_id;
      const partnerChildren = pp.filter(p => p.parentId === partnerId);
      if (partnerChildren.length > 0) return partnerChildren;
    }
  }
  
  return [];
},

// desc() sudah memanggil ch(), jadi otomatis fix
```

**ATAU** lebih simpel — di Sidebar display saja:

```javascript
// Di Sidebar, hitung descendants inclusive spouse:
const myDesc = FE.desc(pp, p.id);
const spouseDesc = p.spouseId ? FE.desc(pp, p.spouseId) : 0;
const totalDesc = Math.max(myDesc, spouseDesc);

// Tampilkan:
<div className="sb-row">
  <span className="sb-row-l">Keturunan</span>
  <span className="sb-row-v">{totalDesc}</span>
</div>
```

Pilih approach yang lebih clean dan konsisten. Pastikan ini juga berlaku di:
- Sidebar detail
- Stats view
- Insights/Fakta
- Anywhere "keturunan" atau "descendants" ditampilkan

---

## FITUR: Delete All / Multiple Delete (Enhancement)

### Dari CLAUDE.md, bulk delete sudah ada:
> "ListView: multi-select bulk delete mode (skip members with children)"

### Tapi user masih minta, berarti:
1. Fiturnya kurang discoverable (user tidak tahu caranya), ATAU
2. Fiturnya belum cukup — user mau "delete ALL" untuk reset/re-import

### Enhancement yang dibutuhkan:

**A. "Delete All" button**
- Di workspace header atau di List view
- Button: "🗑️ Hapus Semua" (hanya tampil untuk Owner)
- Confirmation modal yang serius:
  ```
  ⚠️ Hapus Semua Anggota?
  
  Ini akan menghapus SEMUA [73] anggota keluarga dari silsilah "[nama]".
  Data yang dihapus TIDAK bisa dikembalikan.
  Canvas positions juga akan di-reset.
  
  Ketik "HAPUS" untuk konfirmasi: [_______]
  
  [Batal] [Hapus Semua]
  ```
- Require user ketik "HAPUS" untuk prevent accidental deletion
- API: `DELETE /api/families/:fid/members/all` (owner only)
  ```javascript
  // Di API:
  await DB.prepare("DELETE FROM canvas_positions WHERE family_id = ?").bind(fid).run();
  await DB.prepare("DELETE FROM marriages WHERE family_id = ?").bind(fid).run();
  await DB.prepare("DELETE FROM members WHERE family_id = ?").bind(fid).run();
  ```

**B. Make bulk select more discoverable**
- Di List view header, tambah teks hint: "Tip: klik ☐ untuk multi-select dan hapus beberapa anggota sekaligus"
- Atau: floating action button "☐ Pilih" yang lebih visible

**C. Bulk delete di Canvas view juga** (bonus)
- Mode select: klik card → toggle selected (border highlight)
- Floating bar: "X dipilih [Hapus] [Batal]"

---

## DEPLOY

```bash
cd api && npx wrangler deploy
cd ../frontend && npm run build && npx wrangler pages deploy dist --project-name=nasab --branch=main --commit-dirty=true
```
Bump sw.js CACHE. Verify https://nasab.biz.id.

## PRIORITAS
1. 🔴 Canvas overlap fix — ini yang paling visible dan annoying
2. 🟡 Istri keturunan count — quick fix
3. 🟡 Delete All — user explicitly minta
