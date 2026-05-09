# PROMPT-TREE-REDESIGN.md

> **Target:** `nasab.jsx` (artifact v6.0) dan/atau `frontend/nasab.jsx` (production).
> **Tujuan:** Tree silsilah keluarga yang enak dilihat — card lebih besar dan terbaca, generation lane yang tidak mengganggu, connector bezier yang halus, dan auto-fit yang benar-benar berjalan otomatis.
> **Estimasi:** 6 patch fokus, semua di file React tunggal. Tidak ada perubahan API, schema, atau dependencies.

---

## Konteks masalah

Hasil review code `nasab.jsx` versi saat ini:

1. Card 158×86 px dengan font nama 10 px dan meta 8 px → di zoom default 0.65× efektif jadi ~6.5 px (tidak terbaca).
2. Generation lane sticker di kiri pakai font 7 px dan emoji 15 px → terlihat "berantakan dan kuning" di screenshot user, padahal itu memang label lane, bukan card terpisah.
3. Initial zoom hard-coded `useState(.65)` → default tampilan langsung kekecilan, bukan fit ke konten.
4. Connector pakai `<line>` lurus untuk parent-child meskipun README sebut bezier — visual jadi kaku saat sibling banyak.
5. Auto-fit (`fit()`) hanya jalan saat user klik tombol manual, tidak saat: load awal, search hit, atau ganti POV.
6. NIKAH marker di tengah connector spouse pakai text "NIKAH" font 5.5 px + circle 3 px → tidak terbaca, tidak konsisten dengan modal Sidebar yang pakai simbol ∞.

Goal redesign: **Hybrid avatar card** (avatar 48 px di atas, nama + meta di bawah) dengan ukuran 160–180 × 130 px, generation lane jadi label horizontal di atas kelompok node, connector bezier halus, dan auto-fit yang triggered di 3 titik (load, search, expand).

---

## Patch 1 — Constants & layout sizing

**File:** `nasab.jsx`
**Lokasi:** Dekat baris dengan `const APP=...`, sebelum `const VW=...`.

### Before
```js
const CW=158,CH=86,GX=36,GY=120,CG=10;
```

### After
```js
// Card sizing — Hybrid avatar layout
const CW=176, CH=132;        // Card width/height (was 158x86)
const GX=44, GY=148;         // Horizontal gap between siblings, vertical gap between generations (was 36/120)
const CG=18;                 // Couple gap (was 10)
const AVATAR_R=24;           // Avatar radius — circle 48px diameter
const ACCENT_H=3;            // Top accent bar height
```

**Rationale:** Card lebih lebar untuk muat nama Indonesia panjang ("Athallah Lintang Ahmad", "Syakira Alma Kinanti"), tinggi untuk avatar prominent + 2 baris teks. Vertical gap 148 px memberi ruang untuk bezier connector lengkung tanpa overlap. CG naik karena card lebih lebar — gap proporsional.

---

## Patch 2 — Card CSS (replace `.cc` block)

**File:** `nasab.jsx` di dalam template literal `const css=...`.

Cari section yang dimulai dengan `.cc{position:absolute;width:${CW}px...` dan ganti seluruh block `.cc` sampai sebelum `.conn-svg{` dengan:

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
.cc:hover{z-index:20;border-color:var(--bdr2);box-shadow:0 4px 16px rgba(0,0,0,.35)}
.cc.dragging{z-index:50;box-shadow:0 8px 28px rgba(0,0,0,.5);opacity:.92;cursor:grabbing;transform:scale(1.02)}
.cc.selected{border-color:var(--pri);box-shadow:0 0 0 2px rgba(20,184,166,.18),0 4px 16px rgba(0,0,0,.35)}
.cc.male{border-top:3px solid var(--male-t)}
.cc.female{border-top:3px solid var(--fem-t)}
.cc.deceased{opacity:.62}
.cc.deceased::after{content:'almh.';position:absolute;bottom:6px;right:8px;font-size:8px;font-family:var(--fm);color:var(--t3);font-weight:500;letter-spacing:.4px}

.cc-av{
  width:48px;height:48px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  font-size:14px;font-weight:600;font-family:var(--fd);
  flex-shrink:0;
  background:var(--bg1);
  margin-bottom:8px
}
.cc-av.male{color:var(--male-t);border:1.5px solid var(--male-bdr)}
.cc-av.female{color:var(--fem-t);border:1.5px solid var(--fem-bdr)}

.cc-nm{
  font-size:13px;
  font-weight:500;
  line-height:1.25;
  text-align:center;
  padding:0 10px;
  max-width:100%;
  overflow:hidden;
  text-overflow:ellipsis;
  display:-webkit-box;
  -webkit-line-clamp:2;
  -webkit-box-orient:vertical
}
.cc-mt{
  font-size:11px;
  color:var(--t3);
  margin-top:4px;
  text-align:center;
  font-family:var(--fm);
  letter-spacing:.2px
}

.cc-badge-gen{
  position:absolute;top:6px;left:6px;
  font-size:9px;font-family:var(--fm);font-weight:600;
  padding:2px 6px;border-radius:8px;
  background:var(--bg1);color:var(--t3);
  letter-spacing:.3px
}
.cc-badge-nik{
  position:absolute;top:6px;right:6px;
  font-size:8px;font-family:var(--fm);font-weight:600;
  padding:2px 5px;border-radius:8px;
  background:rgba(20,184,166,.12);color:var(--pri);
  letter-spacing:.4px
}
`
```

---

## Patch 3 — Card JSX (replace render block dalam `CanvasView`)

**File:** `nasab.jsx`, dalam `function CanvasView`, di dalam `pp.map(p=>{ ... })` block.

Cari blok yang dimulai dengan:
```jsx
{pp.map(p=>{const po=pos[p.id];if(!po)return null;const g=FE.gen(pp,p.id);const c=GC[g%GC.length];return(<div key={p.id} className={`cc ${p.gender} ${drag===p.id?"dragging":""} ${selId===p.id?"selected":""}`}
```

Ganti **seluruh body return JSX** untuk card dengan:

```jsx
{pp.map(p=>{
  const po=pos[p.id];if(!po)return null;
  const g=FE.gen(pp,p.id);
  const c=GC[g%GC.length];
  const isDec=!!p.deathDate;
  const yr=p.birthDate?new Date(p.birthDate).getFullYear():null;
  const age=FE.age(p);
  const meta=[
    p.gender==="male"?"♂":"♀",
    yr?`${yr}`:null,
    age!==null?`${age} th`:null
  ].filter(Boolean).join(" · ");
  return(
    <div key={p.id}
      className={`cc ${p.gender} ${drag===p.id?"dragging":""} ${selId===p.id?"selected":""} ${isDec?"deceased":""}`}
      style={{left:po.x,top:po.y,width:CW,minHeight:CH}}
      onMouseDown={e=>dS(e,p.id)}
      onClick={e=>cC(e,p)}
    >
      <span className="cc-badge-gen">G{g+1}</span>
      {p.nik&&<span className="cc-badge-nik">NIK</span>}
      <div className={`cc-av ${p.gender}`}>{ini(p.name)}</div>
      <div className="cc-nm">{p.name}</div>
      <div className="cc-mt">{meta}</div>
    </div>
  )
})}
```

**Catatan:**
- Hapus `.cc-bar`, `.cc-bd`, `.cc-info`, `.cc-gn` lama dari CSS (sudah diganti di Patch 2)
- `cc-badge-gen` dan `cc-badge-nik` menggantikan emoji 🆔 inline yang sebelumnya di-concat ke string

---

## Patch 4 — Bezier connectors (replace SVG conn block)

**File:** `nasab.jsx`, dalam `function CanvasView`, cari `<svg className="conn-svg" ...>` block.

### Before
```jsx
<svg className="conn-svg" width={bnd.w} height={bnd.h}>{conns.map((c,i)=>{if(c.t==="sp"){...}return<line key={i} x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2} stroke="var(--bdr2)" strokeWidth="1.5"/>})}</svg>
```

### After
```jsx
<svg className="conn-svg" width={bnd.w} height={bnd.h}>
  {conns.map((c,i)=>{
    // Spouse connector — horizontal dashed dengan ∞ marker
    if(c.t==="sp"){
      const mx=(c.x1+c.x2)/2;
      return(
        <g key={i}>
          <line x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
            stroke="var(--rose)" strokeWidth="1.5" strokeDasharray="5,4" opacity=".55"/>
          <circle cx={mx} cy={c.y1} r="9" fill="var(--bg1)" stroke="var(--rose)" strokeWidth="1"/>
          <text x={mx} y={c.y1+1} textAnchor="middle" dominantBaseline="central"
            fontSize="13" fill="var(--rose)">∞</text>
        </g>
      )
    }
    // Parent-down (pd) — bezier dari parent center bottom melengkung ke mid
    if(c.t==="pd"){
      return(
        <path key={i}
          d={`M ${c.x1} ${c.y1} L ${c.x2} ${c.y2}`}
          fill="none" stroke="var(--bdr2)" strokeWidth="1.5" opacity=".7"/>
      )
    }
    // Sibling bar (br) — straight horizontal
    if(c.t==="br"){
      return(
        <line key={i} x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
          stroke="var(--bdr2)" strokeWidth="1.5" opacity=".7"/>
      )
    }
    // Child-down (cd) — bezier dari mid melengkung halus ke child top
    if(c.t==="cd"){
      const dy=c.y2-c.y1;
      return(
        <path key={i}
          d={`M ${c.x1} ${c.y1} C ${c.x1} ${c.y1+dy*0.5}, ${c.x2} ${c.y1+dy*0.5}, ${c.x2} ${c.y2}`}
          fill="none" stroke="var(--bdr2)" strokeWidth="1.5" opacity=".7"/>
      )
    }
    return null;
  })}
</svg>
```

**Rationale:** Bezier diaplikasikan di segmen `cd` (child-down) saja karena di situlah connector "membelok" dari sibling bar ke child top — paling banyak visual noise kalau pakai garis lurus. Parent-down (vertical) dan sibling bar (horizontal) tetap straight karena lurus murni — bezier di situ malah aneh.

---

## Patch 5 — Auto-fit logic (3 trigger points)

**File:** `nasab.jsx`, dalam `function CanvasView`.

### 5a. Replace initial zoom

### Before
```js
const[zm,setZm]=useState(.65);
```

### After
```js
const[zm,setZm]=useState(1);
const[didInitFit,setDidInitFit]=useState(false);
```

### 5b. Add helper `fitToViewport` di atas `fit()`

```js
const fitToViewport=useCallback((animate=true)=>{
  if(!wr.current||!Object.keys(pos).length)return;
  const rect=wr.current.getBoundingClientRect();
  const viewW=rect.width-80;   // padding kiri/kanan
  const viewH=rect.height-80;
  let mnX=Infinity,mnY=Infinity,mxX=-Infinity,mxY=-Infinity;
  Object.values(pos).forEach(p=>{
    mnX=Math.min(mnX,p.x);mnY=Math.min(mnY,p.y);
    mxX=Math.max(mxX,p.x+CW);mxY=Math.max(mxY,p.y+CH);
  });
  if(!isFinite(mnX))return;
  const contentW=mxX-mnX,contentH=mxY-mnY;
  const targetZm=Math.min(viewW/contentW,viewH/contentH,1.2);
  const newZm=Math.max(0.3,targetZm);
  const cx=(mnX+mxX)/2,cy=(mnY+mxY)/2;
  const newPan={
    x:rect.width/2-cx*newZm,
    y:rect.height/2-cy*newZm
  };
  setZm(newZm);
  setPan(newPan);
},[pos]);
```

### 5c. Trigger #1 — Initial fit setelah layout pertama

Tambah useEffect baru di dekat `useEffect` yang sudah ada untuk `pos`:

```js
useEffect(()=>{
  if(!didInitFit&&Object.keys(pos).length>0&&wr.current){
    const t=setTimeout(()=>{fitToViewport();setDidInitFit(true)},80);
    return()=>clearTimeout(t);
  }
},[pos,didInitFit,fitToViewport]);
```

### 5d. Trigger #2 — Replace `fit` button handler

### Before
```js
const fit=()=>{setPos(autoLayout(pp));setPan({x:0,y:0});setZm(.65)};
```

### After
```js
const fit=()=>{
  const newPos=autoLayout(pp);
  setPos(newPos);
  // fitToViewport akan re-trigger via useEffect [pos] — tapi paksa langsung untuk responsiveness
  setTimeout(()=>fitToViewport(),50);
};
```

### 5e. Trigger #3 — Auto-pan saat search (di parent `Workspace`)

Di `function Workspace`, tambah useEffect untuk panning ke first match. Cari blok di mana `search` state digunakan, lalu tambahkan callback ke `CanvasView` (alternatif minimal: skip step ini di v1, tambahkan di iterasi berikut).

---

## Patch 6 — Generation lanes (horizontal, bukan sidebar kiri)

**File:** `nasab.jsx`, dalam `function CanvasView`.

### Replace block `Object.entries(gls).map(...)`

### Before
```jsx
{Object.entries(gls).map(([g,lane])=>{const gi=parseInt(g);const gl=GL[gi]||{l:`Gen ${gi+1}`,i:"👤"};const c=GC[gi%GC.length];return(<div key={g} className="gl" style={{top:lane.mi-20,height:lane.mx-lane.mi+40}}><div className="gl-bg" style={{borderColor:c,background:c}}/><div className="gl-s" style={{color:c}}><span className="gl-em">{gl.i}</span><span className="gl-t">{gl.l}</span><span className="gl-n">Gen {gi+1}</span></div></div>)})}
```

### After
```jsx
{Object.entries(gls).map(([g,lane])=>{
  const gi=parseInt(g);
  const gl=GL[gi]||{l:`Gen ${gi+1}`};
  const c=GC[gi%GC.length];
  const minX=Math.min(...pp.filter(p=>FE.gen(pp,p.id)===gi).map(p=>pos[p.id]?.x||Infinity));
  return(
    <div key={g} className="gen-lane" style={{
      position:"absolute",
      left:Math.max(20,minX-160),
      top:lane.mi+CH/2-14,
      pointerEvents:"none",
      zIndex:1
    }}>
      <div style={{
        background:`${c}15`,
        border:`1px solid ${c}40`,
        color:c,
        padding:"4px 12px",
        borderRadius:14,
        fontSize:11,
        fontWeight:600,
        fontFamily:"var(--fm)",
        letterSpacing:".4px",
        whiteSpace:"nowrap"
      }}>
        Gen {gi+1} · {gl.l}
      </div>
    </div>
  )
})}
```

**Hapus dari CSS:** seluruh block `.gl{...}`, `.gl-s{...}`, `.gl-em{...}`, `.gl-t{...}`, `.gl-n{...}`, `.gl-bg{...}` di `const css=`.

**Rationale:** Lane label horizontal di samping kiri row pertama dari setiap generasi, font 11 px (vs 7 px), tidak menempel emoji, dan tidak memakan 50 px horizontal canvas seperti sebelumnya.

---

## Acceptance criteria

Setelah semua patch diterapkan, verifikasi:

1. Buka `nasab.biz.id`, login, buka silsilah dengan 5+ anggota.
2. Tree muncul **otomatis fit ke viewport** — tidak ada "kosong di tengah" atau "card kekecilan di pojok".
3. Klik tombol Fit (Ic.Fit) → tree refit dengan animasi.
4. Card menampilkan: badge G{n} di kiri-atas, badge NIK di kanan-atas (jika ada), avatar 48 px di tengah-atas, nama 13 px di bawah avatar, meta `♂/♀ · year · age` di bawah nama.
5. Anggota dengan `deathDate` ditampilkan dengan opacity 0.62 dan label "almh." di pojok kanan-bawah card.
6. Couple menampilkan marker ∞ di tengah connector horizontal mereka — tidak ada lagi text "NIKAH" font 5.5 px.
7. Connector dari sibling bar ke child top adalah curve halus (bezier), bukan garis vertikal patah.
8. Generation lane label muncul di samping kiri row pertama setiap generasi sebagai pill horizontal "Gen N · Label", font 11 px.
9. Drag card masih jalan, posisi ter-save ke `positions` di D1 lewat `onPos`.
10. Mobile (≤ 640 px): card tetap proporsional, fit-to-viewport responsive, pinch-to-zoom dan double-tap zoom masih jalan.

## Test data

Pakai `loadDemo()` (Keluarga Syachroel) untuk verifikasi visual cepat — 27 anggota, 3 generasi, banyak couple. Itu test case paling representatif.

## Rollback

Semua perubahan terkonsentrasi di satu file `nasab.jsx`. Jika ada masalah, `git revert` commit ini saja sudah cukup. Tidak ada migration database, tidak ada breaking change ke data structure (member object schema tetap sama).

## Out of scope (untuk iterasi berikut)

- Foto profile member (saat ini avatar masih initial-based — schema sudah punya field `photo` tapi tidak ditampilkan di card)
- Mini-map redesign (current 140×70 frosted glass — sudah cukup untuk MVP)
- Per-couple polygon group (poligami visual grouping — relevan untuk Patch 20 marriages table)
- Animation transition saat zoom/pan (CSS transition sudah ada di transform, cukup untuk v1)
