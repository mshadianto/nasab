# PROMPT-TREE-POLISH-v2.md

> **Target:** `nasab.jsx` (versi setelah PROMPT-TREE-REDESIGN.md di-deploy — current v8.1.0).
> **Tujuan:** 4 polish fix untuk membawa tree dari "fungsional dan rapi" ke "production-grade dan enak ditelusur".
> **Estimasi:** 4 patch fokus, semua perubahan di `nasab.jsx` saja. Tidak ada perubahan API, schema, atau dependencies.
> **Konteks:** v1 redesign sudah berhasil — hybrid avatar, generation lane horizontal, auto-fit, ∞ marker, dan +N keturunan badge sudah jalan. Polish ini fokus ke 4 hal yang tersisa berdasarkan review visual canvas Trah Djojo Moeljono (38 anggota, 3 generasi).

---

## Konteks masalah

Hasil review visual canvas v8.1.0:

1. **Connector lines terlalu pucat** — opacity `.7` dengan stroke `var(--bdr2)` di atas background terang nyaris hilang. Trace lineage dari kakek ke cucu (Karyo Redjo → Soeradi → Hardjo Sukarno → Soepardjo P.H.) butuh effort visual.
2. **Card terlalu lega vertikal** — `CH=132` dengan `padding-top:14` membuat whitespace antara avatar dan nama berlebih. Density bisa dinaikkan tanpa kehilangan keterbacaan.
3. **Floating search bar "Cari anggota..." di tengah canvas** — menutupi area tree berharga, redundant dengan search di header kanan atas.
4. **Gen 3 visual flat** — 17+ couple berderet seperti barisan tanpa pembeda branch. Trah dari Soeradi vs Pawiro vs Diryo tidak ada visual cue, harus trace manual via connector untuk tahu siapa dari branch mana.

---

## Patch 1 — Connector visibility boost

**File:** `nasab.jsx`, di dalam `function CanvasView`, cari blok `<svg className="conn-svg" ...>`.

### Strategy
Naikkan opacity dari `.7` ke `.9` dan ganti stroke dari `var(--bdr2)` ke `var(--t3)` (text-tertiary — sedikit lebih kontras dari border color tapi masih subtle). Untuk segmen `cd` (child-down bezier), naikkan strokeWidth dari `1.5` ke `1.75` karena dia paling sering dilihat saat trace lineage.

### Before
```jsx
if(c.t==="pd"){
  return(
    <path key={i}
      d={`M ${c.x1} ${c.y1} L ${c.x2} ${c.y2}`}
      fill="none" stroke="var(--bdr2)" strokeWidth="1.5" opacity=".7"/>
  )
}
if(c.t==="br"){
  return(
    <line key={i} x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
      stroke="var(--bdr2)" strokeWidth="1.5" opacity=".7"/>
  )
}
if(c.t==="cd"){
  const dy=c.y2-c.y1;
  return(
    <path key={i}
      d={`M ${c.x1} ${c.y1} C ${c.x1} ${c.y1+dy*0.5}, ${c.x2} ${c.y1+dy*0.5}, ${c.x2} ${c.y2}`}
      fill="none" stroke="var(--bdr2)" strokeWidth="1.5" opacity=".7"/>
  )
}
```

### After
```jsx
if(c.t==="pd"){
  return(
    <path key={i}
      d={`M ${c.x1} ${c.y1} L ${c.x2} ${c.y2}`}
      fill="none" stroke="var(--t3)" strokeWidth="1.5" opacity=".9"/>
  )
}
if(c.t==="br"){
  return(
    <line key={i} x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
      stroke="var(--t3)" strokeWidth="1.5" opacity=".9"/>
  )
}
if(c.t==="cd"){
  const dy=c.y2-c.y1;
  return(
    <path key={i}
      d={`M ${c.x1} ${c.y1} C ${c.x1} ${c.y1+dy*0.5}, ${c.x2} ${c.y1+dy*0.5}, ${c.x2} ${c.y2}`}
      fill="none" stroke="var(--t3)" strokeWidth="1.75" opacity=".9"/>
  )
}
```

**Rationale:** `var(--t3)` adalah `#4d5a70` di dark mode dan setara medium-gray di light mode — visible tapi tidak dominant. Bezier child-down dapat 1.75 px supaya terbaca jelas saat sibling banyak (Gen 3 punya 13+ children dari satu couple). Spouse line `c.t==="sp"` tetap dengan `var(--rose)` opacity `.55` — itu sudah punya visual identity sendiri lewat warna pink.

---

## Patch 2 — Card density tighter

**File:** `nasab.jsx`, dua tempat — constants dan CSS.

### 2a. Constants

### Before
```js
const CW=176, CH=132;
```

### After
```js
const CW=176, CH=120;        // CH dari 132 ke 120 — buang whitespace berlebih
```

### 2b. CSS `.cc` block

Cari `.cc{` di dalam `const css=`, ganti `padding-top` dan `.cc-nm` margin:

### Before
```css
.cc{
  position:absolute;
  width:${CW}px;
  min-height:${CH}px;
  background:var(--bg2);
  border:1px solid var(--bdr);
  border-radius:12px;
  cursor:grab;
  user-select:none;
  transition:transform .15s, box-shadow .2s, border-color .2s;
  overflow:visible;
  z-index:10;
  display:flex;
  flex-direction:column;
  align-items:center;
  padding-top:14px
}
```

### After
```css
.cc{
  position:absolute;
  width:${CW}px;
  min-height:${CH}px;
  background:var(--bg2);
  border:1px solid var(--bdr);
  border-radius:12px;
  cursor:grab;
  user-select:none;
  transition:transform .15s, box-shadow .2s, border-color .2s;
  overflow:visible;
  z-index:10;
  display:flex;
  flex-direction:column;
  align-items:center;
  padding-top:10px
}
```

Lalu cari `.cc-av{` dan ganti `margin-bottom`:

### Before
```css
.cc-av{
  width:48px;height:48px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  font-size:14px;font-weight:600;font-family:var(--fd);
  flex-shrink:0;
  background:var(--bg1);
  margin-bottom:8px
}
```

### After
```css
.cc-av{
  width:46px;height:46px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  font-size:14px;font-weight:600;font-family:var(--fd);
  flex-shrink:0;
  background:var(--bg1);
  margin-bottom:6px
}
```

**Rationale:**
- `CH=120` (turun 12 px) + `padding-top:10` (turun 4 px) + `.cc-av margin-bottom:6` (turun 2 px) = card 12 px lebih pendek total tanpa kehilangan ruang untuk nama 2 baris.
- Avatar 46 px (turun 2 px) — masih prominent, ratio dengan card lebih seimbang.
- Density naik ~10% — di Gen 3 yang punya 17+ couple, ini berarti 1 row lebih di viewport pada zoom yang sama.

**Catatan:** `GY` (vertical gap antar generasi) tidak diubah — 148 px masih tepat untuk menampung bezier connector dengan ruang lega.

---

## Patch 3 — Hapus floating canvas search

**File:** `nasab.jsx`, dalam `function CanvasView`.

Ada element search floating "Cari anggota..." yang muncul di tengah-atas canvas. Header sudah punya search box lewat `.sbox` di `function Workspace`, jadi yang di canvas redundant dan menutup viewport.

### Strategy
Cari element dengan placeholder "Cari anggota..." di dalam `CanvasView` return JSX. Biasanya berbentuk:

```jsx
<input ... placeholder="Cari anggota..." ... />
```

atau wrapped di div dengan position absolute. **Hapus seluruh blok element ini** dari render `CanvasView`. Search di header `Workspace` (`.sbox` dengan `<Ic.Search/>`) tetap dipertahankan.

### Acceptance untuk patch ini
- Setelah perubahan, di tengah-atas canvas tidak ada lagi search bar floating.
- Search di header kanan atas tetap berfungsi seperti biasa — ketik nama, tree filter berjalan via `FE.search(pp, search)`.
- Tidak ada console error / undefined reference dari handler search yang dihapus.

**Rationale:** Single source of truth untuk search. Floating search di canvas adalah duplikasi UI yang menutup ~80 px tinggi viewport — di mobile viewport pendek ini mahal. Header search lebih natural karena selalu visible regardless of pan position.

---

## Patch 4 — Branch tint per root ancestor

**File:** `nasab.jsx`, dua tempat — helper logic dan render.

### 4a. Helper function dan memoization

Tambahkan di dalam `function CanvasView`, sebelum return JSX (dekat `const conns=useMemo(...)`):

```js
// Resolve root ancestor untuk setiap member (walk up parentId chain)
const rootMap=useMemo(()=>{
  const m={};
  pp.forEach(p=>{
    let cur=p;
    const seen=new Set();
    while(cur&&cur.parentId&&!seen.has(cur.id)){
      seen.add(cur.id);
      const next=pp.find(x=>x.id===cur.parentId);
      if(!next)break;
      cur=next;
    }
    m[p.id]=cur?.id||p.id;
  });
  return m;
},[pp]);

// Assign branch index per unique root (deterministic order via sort)
const branchIdx=useMemo(()=>{
  const idx={};
  const uniqueRoots=[...new Set(Object.values(rootMap))].sort();
  uniqueRoots.forEach((rid,i)=>{idx[rid]=i});
  return idx;
},[rootMap]);
```

### 4b. CSS branch tint classes

Tambahkan di dalam `const css=`, di dekat block `.cc.male{...}`:

```css
.cc.b0{background:var(--bg2)}
.cc.b1{background:linear-gradient(rgba(20,184,166,.05),rgba(20,184,166,.05)),var(--bg2)}
.cc.b2{background:linear-gradient(rgba(99,102,241,.05),rgba(99,102,241,.05)),var(--bg2)}
.cc.b3{background:linear-gradient(rgba(245,158,11,.05),rgba(245,158,11,.05)),var(--bg2)}
.cc.b4{background:linear-gradient(rgba(236,72,153,.05),rgba(236,72,153,.05)),var(--bg2)}
.cc.b5{background:linear-gradient(rgba(139,92,246,.05),rgba(139,92,246,.05)),var(--bg2)}
.cc.b6{background:linear-gradient(rgba(249,115,22,.05),rgba(249,115,22,.05)),var(--bg2)}
.cc.b7{background:linear-gradient(rgba(14,165,233,.05),rgba(14,165,233,.05)),var(--bg2)}
```

### 4c. Apply class di card render

Cari `<div key={p.id} className={`cc ${p.gender} ...`}` di render `pp.map(...)` block, tambahkan branch class:

### Before
```jsx
<div key={p.id}
  className={`cc ${p.gender} ${drag===p.id?"dragging":""} ${selId===p.id?"selected":""} ${isDec?"deceased":""}`}
  style={{left:po.x,top:po.y,width:CW,minHeight:CH}}
  onMouseDown={e=>dS(e,p.id)}
  onClick={e=>cC(e,p)}
>
```

### After
```jsx
<div key={p.id}
  className={`cc ${p.gender} b${branchIdx[rootMap[p.id]]%8} ${drag===p.id?"dragging":""} ${selId===p.id?"selected":""} ${isDec?"deceased":""}`}
  style={{left:po.x,top:po.y,width:CW,minHeight:CH}}
  onMouseDown={e=>dS(e,p.id)}
  onClick={e=>cC(e,p)}
>
```

**Rationale:**
- `linear-gradient(color, color)` dengan warna sama = overlay solid di atas `var(--bg2)`. Hasilnya tint subtle alpha 0.05 — cukup kentara untuk membedakan branch saat scan visual, tidak mengganggu keterbacaan teks.
- Maksimal 8 branch — di luar 8 wraparound (modulo). Untuk Trah Djojo Moeljono (3 root: Karyo Redjo → Soeradi/Pawiro/Diryo), masing-masing branch dapat warna distinct.
- Deterministic order via sort — branch yang sama selalu dapat warna yang sama across re-render (bukan random per session).
- Tetap kompatibel dengan `.cc.deceased` opacity dan `.cc.selected` border accent — class `b{n}` hanya touch `background`, properti lain tetap dari class lain.

---

## Bonus polish (opsional) — Initials lebih informatif

**Konteks:** Di Gen 3 ada banyak nama berinisial sama (`Soeparni`, `Suyatno`, `Suyatni`, `Suyadi`, `Sugino`, `Sanem` semuanya muncul sebagai `S`). `ini()` function saat ini ambil huruf pertama dari setiap kata, untuk single-word name jadi 1 huruf saja.

### Strategy
Kalau nama 1 kata → ambil 2 huruf pertama. Kalau nama ≥ 2 kata → tetap initials biasa (max 2 huruf).

### Before
```js
const ini=n=>n.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
```

### After
```js
const ini=n=>{
  const w=(n||"").trim().split(/\s+/).filter(Boolean);
  if(w.length===0)return"?";
  if(w.length===1)return w[0].slice(0,2).toUpperCase();
  return(w[0][0]+w[1][0]).toUpperCase();
};
```

**Hasil:** Soeparni → `SO`, Suyatno → `SU`, Suyadi → `SU`, Sugino → `SU`, Sanem → `SA` — masih ada collision (SU, SU, SU) tapi kurang dari sebelumnya. Untuk full disambiguation perlu hash-to-color avatar atau foto, di luar scope polish.

---

## Acceptance criteria

Setelah 4 patch (+ bonus opsional) diterapkan dan deploy:

1. Buka `nasab.biz.id`, login, buka Trah Djojo Moeljono.
2. **Patch 1 — Connector visible:** Trace dari Karyo Redjo (Gen 1) ke Soepardjo P.H. (Gen 3) bisa diikuti dengan mata, garis tidak hilang di background.
3. **Patch 2 — Density:** Card terlihat lebih kompak. Avatar 46 px (turun 2 px), card 120 px (turun 12 px). Nama tetap 2 baris jika panjang, tidak terpotong.
4. **Patch 3 — No floating search:** Tidak ada search bar di tengah canvas. Search di header kanan atas tetap berfungsi.
5. **Patch 4 — Branch tint:** 3 branch turunan Karyo Redjo (Soeradi, Pawiro, Diryo) dapat 3 warna tint berbeda yang subtle. Trah dari Soeradi (Hardjo Sukarno, Supardi, dst) semua punya tint warna sama. Saat klik salah satu cucu, telusur visual ke kakek-nya jadi lebih cepat.
6. **Bonus — Initials:** Avatar Soeparni jadi `SO` bukan `S`. Suyadi jadi `SU` bukan `S`. Disambiguation di Gen 3 lebih baik.

## Test data

`Trah Djojo Moeljono` (38 anggota, 3 generasi, 3 root branches) — paling representatif untuk verifikasi Patch 4 karena punya multiple branches dari single common ancestor. Untuk Patch 1 dan 2, semua silsilah dengan ≥10 anggota cukup.

## Out of scope (untuk iterasi berikut)

- Foto profile member (schema sudah punya `photo` field — perlu UI upload + storage strategy)
- Hash-to-color avatar untuk full disambiguation initials yang collision (Suyatno vs Suyadi vs Sugino semua `SU`)
- Branch highlight on hover (saat hover card, semua card di branch yang sama border accent — visual reinforcement untuk Patch 4)
- Animated transitions saat zoom/pan via `fitToViewport` (CSS transition di `transform` cukup untuk MVP)
- Polygon group untuk poligami (multi-spouse layout dengan visual grouping — relevan kalau Patch 20 marriages table sudah aktif)
