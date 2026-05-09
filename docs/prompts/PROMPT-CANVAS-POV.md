# NASAB — Canvas POV Tree (MyHeritage-style Branch Navigation)

Feedback dari user (Pak Sachlani, PMOCP):

> "Saran terkait Canvas. Saya bandingkan dengan MyHeritage. Pertama harus ditentukan Family Tree utama dari POV yang login. Family Tree lain dibuat cabang (tidak ditampilkan dalam canvas yang sama) supaya tidak complicated gambarnya. Contoh: Istri adalah anggota family tree utama. Sehingga family tree suami dibuat cabang. Jika di-klik baru muncul family tree pihak suami."

Ini perbaikan besar untuk Canvas UX. Implementasi berikut.

---

## KONSEP

### Sebelum (Current)
Semua anggota ditampilkan di canvas yang sama → 73+ orang = tumpang tindih, chaos.

### Sesudah (POV Tree)
1. Canvas punya **"root person"** — default: Kepala Keluarga (orang tanpa parentId yang punya anak terbanyak), atau user bisa pilih
2. Hanya tampilkan **blood relatives** dari root person:
   - Ke atas: parent, grandparent root person
   - Ke bawah: children, grandchildren root person
   - Pasangan root person ditampilkan di samping (tapi family tree pihak pasangan TIDAK di-expand)
3. Orang dari **family tree lain** (mertua, pihak pasangan anak, besan) ditampilkan sebagai **"branch card"** — card khusus dengan indicator "Klik untuk lihat cabang keluarga"
4. Klik branch card → Canvas re-render dengan POV baru (root = orang itu)
5. **Breadcrumb** di atas canvas: `Kel. Syachroel > Apri S > Kel. Hadiani` — klik untuk navigate back

### Visual (ASCII)
```
Sebelum: Semua 73 orang flat di canvas → chaos

Sesudah (POV: Syachroel):
                    ┌──────────┐
                    │ Syachroel │ ← root
                    │  + Djahora│
                    └─────┬─────┘
          ┌───────┬───────┼───────┬──────┐
     ┌────┴──┐┌───┴──┐┌──┴───┐┌──┴──┐┌──┴──┐
     │Isnawat││Fakhru││Budian││Sopian││Firma│
     │+Kadir ││+Erti ││+Fadl ││+Susi ││+Riss│
     │🔗     ││🔗    ││🔗    ││🔗    ││🔗   │ ← "🔗" = branch card pasangan
     └───┬───┘└──┬───┘└──┬───┘└──┬───┘└──┬──┘
       2 anak  3 anak  ...     3 anak  3 anak

Klik "🔗" pada Kadir → Canvas switch POV ke Kel. Kadir:
                    ┌──────────┐
     Breadcrumb:    │ Kadir    │ ← new root
     Kel.Syachroel  │  +Isnawat│ ← Isnawati jadi branch card balik
     > Kel.Kadir    └─────┬────┘
                     ┌────┴────┐
                   Aulia    Abdul Haris
```

---

## IMPLEMENTASI

### 1. State Management

```javascript
// Di Workspace component, tambah state:
const [rootPersonId, setRootPersonId] = useState(null); // null = auto-detect
const [povHistory, setPovHistory] = useState([]); // breadcrumb stack

// Auto-detect root person (orang tanpa parent yang punya keturunan terbanyak)
const autoRoot = useMemo(() => {
  const roots = pp.filter(p => !p.parentId && !pp.some(x => x.spouseId === p.id && x.parentId));
  if (!roots.length) return pp[0]?.id || null;
  return roots.reduce((best, r) => 
    FE.desc(pp, r.id) > FE.desc(pp, best.id) ? r : best
  ).id;
}, [pp]);

const effectiveRoot = rootPersonId || autoRoot;
```

### 2. POV Filter — Tentukan siapa yang ditampilkan di canvas

```javascript
function getPOVMembers(pp, rootId, marriages) {
  const root = pp.find(p => p.id === rootId);
  if (!root) return { visible: pp, branches: [] };
  
  const visible = new Set();
  const branches = []; // orang yang jadi "branch card" (click to expand)
  
  // Include root
  visible.add(rootId);
  
  // Include ancestors (ke atas)
  function addAncestors(pid) {
    const p = pp.find(x => x.id === pid);
    if (!p) return;
    if (p.parentId) {
      visible.add(p.parentId);
      addAncestors(p.parentId);
      // Parent's spouse
      const parentSpouse = FE.sp(pp, pp.find(x => x.id === p.parentId));
      if (parentSpouse) visible.add(parentSpouse.id);
    }
  }
  addAncestors(rootId);
  
  // Include descendants (ke bawah) — recursively
  function addDescendants(pid) {
    FE.ch(pp, pid).forEach(child => {
      visible.add(child.id);
      // Child's spouse → show as branch card (tidak expand family tree-nya)
      const childSpouse = FE.sp(pp, child);
      if (childSpouse) {
        visible.add(childSpouse.id); // tampilkan orangnya
        // Tapi tandai sebagai branch (family tree pihak sana bisa di-expand)
        if (!isBloodRelative(childSpouse.id, rootId)) {
          branches.push({
            personId: childSpouse.id,
            label: `Lihat keluarga ${childSpouse.name}`,
          });
        }
      }
      addDescendants(child.id);
    });
    // Also via marriages table
    if (marriages) {
      marriages.filter(m => m.husband_id === pid || m.wife_id === pid).forEach(m => {
        const spouseId = m.husband_id === pid ? m.wife_id : m.husband_id;
        if (!visible.has(spouseId)) {
          visible.add(spouseId);
          if (!isBloodRelative(spouseId, rootId)) {
            branches.push({ personId: spouseId, label: `Lihat keluarga ${pp.find(p => p.id === spouseId)?.name}` });
          }
        }
      });
    }
  }
  addDescendants(rootId);
  
  // Root's spouse(s)
  const rootSpouse = FE.sp(pp, root);
  if (rootSpouse) {
    visible.add(rootSpouse.id);
    branches.push({ personId: rootSpouse.id, label: `Lihat keluarga ${rootSpouse.name}` });
  }
  
  // Root's siblings
  FE.sib(pp, root).forEach(s => {
    visible.add(s.id);
    addDescendants(s.id);
  });
  
  return {
    visible: pp.filter(p => visible.has(p.id)),
    branches
  };
}

// Helper: cek apakah seseorang blood relative dari root
function isBloodRelative(personId, rootId) {
  // Trace up from person to see if they share ancestor with root
  // Simple: check if person's ancestry includes root's ancestry
  // For now: person is blood relative if they share parentId chain with root
  // ... implement BFS/DFS upward
}
```

### 3. Branch Card di Canvas

```javascript
// Di CanvasView, render branch indicator pada card pasangan yang bukan blood relative:
{branches.some(b => b.personId === p.id) && (
  <div 
    className="cc-branch-btn"
    onClick={(e) => {
      e.stopPropagation();
      // Push current POV to history
      setPovHistory(prev => [...prev, { rootId: effectiveRoot, label: fam.name }]);
      // Switch POV
      setRootPersonId(p.id);
    }}
    title={`Klik untuk lihat keluarga ${p.name}`}
  >
    🔗 Lihat cabang keluarga →
  </div>
)}
```

### 4. Breadcrumb Navigation

```javascript
// Di atas canvas (di dalam ws-h atau sebagai overlay):
{povHistory.length > 0 && (
  <div className="pov-breadcrumb">
    {povHistory.map((h, i) => (
      <span key={i}>
        <button 
          className="pov-crumb" 
          onClick={() => {
            setRootPersonId(h.rootId);
            setPovHistory(prev => prev.slice(0, i));
          }}
        >
          {h.label}
        </button>
        <span className="pov-sep">›</span>
      </span>
    ))}
    <span className="pov-current">{pp.find(p => p.id === effectiveRoot)?.name || 'Root'}</span>
  </div>
)}
```

### 5. POV Selector

```javascript
// Dropdown atau button di canvas toolbar (dekat zoom controls):
<div className="pov-select">
  <label>POV:</label>
  <select 
    value={effectiveRoot} 
    onChange={e => {
      setPovHistory([]);
      setRootPersonId(e.target.value);
    }}
  >
    {pp.filter(p => FE.ch(pp, p.id).length > 0 || !p.parentId).map(p => (
      <option key={p.id} value={p.id}>{p.name}</option>
    ))}
  </select>
</div>
```

### 6. CSS

```css
.cc-branch-btn {
  position: absolute;
  bottom: -18px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 7px;
  color: var(--pri);
  background: var(--bg2);
  border: 1px dashed var(--pri);
  border-radius: 8px;
  padding: 2px 8px;
  cursor: pointer;
  white-space: nowrap;
  opacity: 0.7;
  transition: all 0.2s;
  z-index: 15;
}
.cc-branch-btn:hover {
  opacity: 1;
  background: rgba(20, 184, 166, 0.1);
}

.pov-breadcrumb {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 12px;
  background: var(--bg2);
  border-bottom: 1px solid var(--bdr);
  font-size: 10px;
  flex-shrink: 0;
}
.pov-crumb {
  background: none;
  border: none;
  color: var(--pri);
  cursor: pointer;
  font-size: 10px;
  font-family: var(--fb);
  padding: 2px 4px;
  border-radius: 3px;
}
.pov-crumb:hover {
  background: var(--bg3);
  text-decoration: underline;
}
.pov-sep {
  color: var(--t3);
  margin: 0 1px;
}
.pov-current {
  font-weight: 600;
  color: var(--t1);
}

.pov-select {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 9px;
  color: var(--t3);
}
.pov-select select {
  padding: 2px 6px;
  background: var(--bg2);
  border: 1px solid var(--bdr);
  border-radius: 4px;
  color: var(--t1);
  font-size: 9px;
  font-family: var(--fb);
}
```

### 7. Integration Points

- **autoLayout()**: hanya layout `visible` members (bukan semua `pp`) → otomatis less crowded
- **getConns()**: hanya draw connectors antara `visible` members
- **Minimap**: hanya tampilkan `visible` members
- **Sidebar**: tetap bisa lihat semua info (termasuk yang hidden di canvas)
- **Other views** (List, Map, Stats): tetap tampilkan SEMUA members — POV hanya affect Canvas
- **Comfort view**: center pada root person, bukan center of all cards

---

## REQUIREMENTS

1. Update `frontend/nasab.jsx`
2. POV only affects Canvas view — List/Map/Stats/Timeline tetap show semua
3. Default root: auto-detect (orang tanpa parent dengan keturunan terbanyak)
4. User bisa ganti root via dropdown
5. Branch cards → klik → switch POV → breadcrumb untuk navigate back
6. JANGAN break existing features (drag, zoom, connectors, collapse, search)
7. Bump version, sw.js CACHE
8. Deploy

## BONUS (jika sempat)
- Animasi transisi saat switch POV (fade out → recalculate → fade in)
- "Home" button di breadcrumb untuk kembali ke root awal
- Jumlah hidden members indicator: "Menampilkan 23 dari 73 anggota • [Tampilkan Semua]"
- Toggle "POV Mode" vs "Full Tree Mode" untuk user yang memang mau lihat semuanya
