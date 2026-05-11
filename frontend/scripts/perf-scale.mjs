// Scaling test — how does the speedup grow with tree size?
// Same FE_OLD / FE_NEW / autoLayout pair as perf-bench.mjs.

const CW = 150, CH = 80, GX = 24, GY = 100, CG = 4, MAX_COLS = 4;

// Generate synthetic balanced tree: branching factor b, depth d
function gen(branching, depth) {
  const pp = []; let id = 0;
  const root = { id: `p${id++}`, name: "root", gender: "male", parentId: null, spouseId: null };
  pp.push(root);
  function expand(parent, level) {
    if (level >= depth) return;
    for (let i = 0; i < branching; i++) {
      const c = { id: `p${id++}`, name: `n${id}`, gender: i % 2 ? "female" : "male", parentId: parent.id, spouseId: null };
      pp.push(c);
      expand(c, level + 1);
    }
  }
  expand(root, 0);
  return pp;
}

// === OLD ===
const FE_OLD = {
  ch: (pp,pid) => pp.filter(p => p.parentId === pid),
  chAll: (pp,pid,m) => { const d = pp.filter(p => p.parentId === pid); return d.length ? d : []; },
  spouses: (pp,p,m=[]) => p.spouseId ? [pp.find(x => x.id === p.spouseId)].filter(Boolean) : [],
  sib: (pp,p) => p.parentId ? pp.filter(x => x.parentId === p.parentId && x.id !== p.id) : [],
  roots: (pp,m=[]) => pp.filter(p => !p.parentId && !pp.some(x => x.spouseId === p.id && x.parentId)),
  gen: (pp,pid,g=0) => { const p = pp.find(x => x.id === pid); return (!p || !p.parentId) ? g : FE_OLD.gen(pp, p.parentId, g+1); },
  desc: (pp,pid) => { const c = FE_OLD.ch(pp,pid); return c.reduce((s,x) => s + 1 + FE_OLD.desc(pp,x.id), 0); },
  descAll: (pp,pid,m) => { const c = FE_OLD.chAll(pp,pid,m); return c.reduce((s,x) => s + 1 + FE_OLD.descAll(pp,x.id,m), 0); },
};
function autoLayout_OLD(pp, marriages=[], collapsed=new Set()) {
  const roots = FE_OLD.roots(pp, marriages); const pos = {}; const HGAP = GX + 8;
  function isVis(pid) { let cur = pp.find(x => x.id === pid); while (cur && cur.parentId) { if (collapsed.has(cur.parentId)) return false; cur = pp.find(x => x.id === cur.parentId); } return true; }
  function unitW(pid) { const p = pp.find(x => x.id === pid); if (!p) return CW; return CW + FE_OLD.spouses(pp,p,marriages).length * (CW + CG); }
  const wC = {}, hC = {};
  function stW(pid) { if (wC[pid] != null) return wC[pid]; const ch = (collapsed.has(pid) ? [] : FE_OLD.ch(pp,pid)).filter(c => isVis(c.id)); const uw = unitW(pid); if (!ch.length) return (wC[pid] = uw); const rows = []; for (let i = 0; i < ch.length; i += MAX_COLS) rows.push(ch.slice(i, i + MAX_COLS)); let maxRW = 0; rows.forEach(row => { maxRW = Math.max(maxRW, row.reduce((s,c,i) => s + (i ? HGAP : 0) + stW(c.id), 0)); }); return (wC[pid] = Math.max(uw, maxRW)); }
  function stH(pid) { if (hC[pid] != null) return hC[pid]; const ch = (collapsed.has(pid) ? [] : FE_OLD.ch(pp,pid)).filter(c => isVis(c.id)); if (!ch.length) return (hC[pid] = 1); const rows = []; for (let i = 0; i < ch.length; i += MAX_COLS) rows.push(ch.slice(i, i + MAX_COLS)); let h = 0; rows.forEach(row => { h += Math.max(...row.map(c => stH(c.id))); }); return (hC[pid] = 1 + h); }
  function place(pid, x, d) { const p = pp.find(z => z.id === pid); if (!p || pos[pid]) return; const ch = (collapsed.has(pid) ? [] : FE_OLD.ch(pp,pid)).filter(c => isVis(c.id)); const uw = unitW(pid); const sw = stW(pid); const y = d * (CH + GY); pos[pid] = { x: x + (sw - uw) / 2, y }; const sps = FE_OLD.spouses(pp,p,marriages); let sx = pos[pid].x + CW + CG; sps.forEach(s => { if (!pos[s.id]) { pos[s.id] = { x: sx, y }; sx += CW + CG; } }); if (!ch.length) return; const rows = []; for (let i = 0; i < ch.length; i += MAX_COLS) rows.push(ch.slice(i, i + MAX_COLS)); let yOff = 0; rows.forEach(row => { const rowW = row.reduce((s,c,i) => s + (i ? HGAP : 0) + stW(c.id), 0); let cx = x + (sw - rowW) / 2; row.forEach(c => { place(c.id, cx, d + 1 + yOff); cx += stW(c.id) + HGAP; }); yOff += Math.max(...row.map(c => stH(c.id))); }); }
  let gx = 0; roots.forEach(root => { place(root.id, gx, 0); gx += stW(root.id) + GX * 4; });
  let mx = Infinity, my = Infinity; Object.values(pos).forEach(p => { mx = Math.min(mx, p.x); my = Math.min(my, p.y); }); Object.values(pos).forEach(p => { p.x -= mx - 100; p.y -= my - 80; });
  return pos;
}

// === NEW ===
const _pIdx = new WeakMap();
function _idx(pp) { let i = _pIdx.get(pp); if (i) return i; const byId = new Map(), byParent = new Map(); for (const p of pp) { byId.set(p.id, p); if (p.parentId) { let a = byParent.get(p.parentId); if (!a) { a = []; byParent.set(p.parentId, a); } a.push(p); } } i = { byId, byParent, gen: new Map(), desc: new Map(), descAll: new WeakMap() }; _pIdx.set(pp, i); return i; }
const EMPTY = [];
const FE_NEW = {
  ch: (pp,pid) => _idx(pp).byParent.get(pid) || EMPTY,
  chAll: (pp,pid,m) => { const i = _idx(pp); const d = i.byParent.get(pid); return d && d.length ? d : EMPTY; },
  spouses: (pp,p,m=[]) => { const i = _idx(pp); return p.spouseId ? [i.byId.get(p.spouseId)].filter(Boolean) : EMPTY; },
  sib: (pp,p) => { if (!p.parentId) return EMPTY; const sibs = _idx(pp).byParent.get(p.parentId); return sibs ? sibs.filter(x => x.id !== p.id) : EMPTY; },
  roots: (pp,m=[]) => { const i = _idx(pp); return pp.filter(p => !p.parentId && !pp.some(x => x.spouseId === p.id && x.parentId)); },
  gen: (pp,pid) => { const i = _idx(pp); const c = i.gen; if (c.has(pid)) return c.get(pid); let cur = i.byId.get(pid), d = 0; while (cur && cur.parentId) { d++; cur = i.byId.get(cur.parentId); } c.set(pid, d); return d; },
  desc: (pp,pid) => { const i = _idx(pp); const c = i.desc; if (c.has(pid)) return c.get(pid); const ch = i.byParent.get(pid) || EMPTY; let r = 0; for (const x of ch) r += 1 + FE_NEW.desc(pp, x.id); c.set(pid, r); return r; },
  descAll: (pp,pid,m) => { const i = _idx(pp); const key = m || i; let mp = i.descAll.get(key); if (!mp) { mp = new Map(); i.descAll.set(key, mp); } if (mp.has(pid)) return mp.get(pid); mp.set(pid, 0); const ch = FE_NEW.chAll(pp,pid,m); let r = 0; for (const x of ch) r += 1 + FE_NEW.descAll(pp, x.id, m); mp.set(pid, r); return r; },
};
function autoLayout_NEW(pp, marriages=[], collapsed=new Set()) {
  const ix = _idx(pp); const roots = FE_NEW.roots(pp, marriages); const pos = {}; const HGAP = GX + 8;
  const visC = new Map();
  function isVis(pid) { if (visC.has(pid)) return visC.get(pid); let cur = ix.byId.get(pid), v = true; while (cur && cur.parentId) { if (collapsed.has(cur.parentId)) { v = false; break; } cur = ix.byId.get(cur.parentId); } visC.set(pid, v); return v; }
  const vChC = new Map();
  function vCh(pid) { if (vChC.has(pid)) return vChC.get(pid); const ch = collapsed.has(pid) ? EMPTY : (ix.byParent.get(pid) || EMPTY); const r = ch.length ? ch.filter(c => isVis(c.id)) : EMPTY; vChC.set(pid, r); return r; }
  function unitW(pid) { const p = ix.byId.get(pid); if (!p) return CW; return CW + FE_NEW.spouses(pp,p,marriages).length * (CW + CG); }
  const wC = {}, hC = {};
  function stW(pid) { if (wC[pid] != null) return wC[pid]; const ch = vCh(pid); const uw = unitW(pid); if (!ch.length) return (wC[pid] = uw); let maxRW = 0; for (let i = 0; i < ch.length; i += MAX_COLS) { let rw = 0; const end = Math.min(i + MAX_COLS, ch.length); for (let j = i; j < end; j++) { if (j > i) rw += HGAP; rw += stW(ch[j].id); } if (rw > maxRW) maxRW = rw; } return (wC[pid] = Math.max(uw, maxRW)); }
  function stH(pid) { if (hC[pid] != null) return hC[pid]; const ch = vCh(pid); if (!ch.length) return (hC[pid] = 1); let h = 0; for (let i = 0; i < ch.length; i += MAX_COLS) { const end = Math.min(i + MAX_COLS, ch.length); let rh = 0; for (let j = i; j < end; j++) { const v = stH(ch[j].id); if (v > rh) rh = v; } h += rh; } return (hC[pid] = 1 + h); }
  function place(pid, x, d) { const p = ix.byId.get(pid); if (!p || pos[pid]) return; const ch = vCh(pid); const uw = unitW(pid); const sw = stW(pid); const y = d * (CH + GY); pos[pid] = { x: x + (sw - uw) / 2, y }; const sps = FE_NEW.spouses(pp,p,marriages); let sx = pos[pid].x + CW + CG; for (const s of sps) { if (!pos[s.id]) { pos[s.id] = { x: sx, y }; sx += CW + CG; } } if (!ch.length) return; let yOff = 0; for (let i = 0; i < ch.length; i += MAX_COLS) { const end = Math.min(i + MAX_COLS, ch.length); let rowW = 0; for (let j = i; j < end; j++) { if (j > i) rowW += HGAP; rowW += stW(ch[j].id); } let cx = x + (sw - rowW) / 2, maxH = 0; for (let j = i; j < end; j++) { const c = ch[j]; place(c.id, cx, d + 1 + yOff); cx += stW(c.id) + HGAP; const v = stH(c.id); if (v > maxH) maxH = v; } yOff += maxH; } }
  let gx = 0; for (const root of roots) { place(root.id, gx, 0); gx += stW(root.id) + GX * 4; }
  let mx = Infinity, my = Infinity; for (const p of Object.values(pos)) { if (p.x < mx) mx = p.x; if (p.y < my) my = p.y; } for (const p of Object.values(pos)) { p.x -= mx - 100; p.y -= my - 80; }
  return pos;
}

function bench(fn, iters) {
  for (let i = 0; i < 3; i++) fn();
  const t0 = performance.now();
  for (let i = 0; i < iters; i++) fn();
  return (performance.now() - t0) / iters;
}

// Cold = new pp each iter (simulates React state change)
// We also benchmark "FE.gen × N" which is the dominant per-render cost
const sizes = [
  ["38 (Pak Sopian)", 2, 5],
  ["~100", 3, 4],
  ["~250", 5, 3],
  ["~500", 2, 9],
  ["~1000", 3, 6],
];

console.log("Tree size".padEnd(20) + "autoLayout OLD".padStart(16) + "autoLayout NEW".padStart(16) + "Speedup".padStart(10) + "  | FE.gen×N OLD".padEnd(16) + "FE.gen×N NEW".padStart(14) + "Speedup".padStart(10));
console.log("─".repeat(110));
for (const [label, b, d] of sizes) {
  const tree = gen(b, d);
  const n = tree.length;
  const iters = n > 500 ? 30 : 200;
  const o = bench(() => autoLayout_OLD([...tree]), iters);
  const nn = bench(() => autoLayout_NEW([...tree]), iters);
  const oG = bench(() => { const p = [...tree]; for (const x of p) FE_OLD.gen(p, x.id); }, iters);
  const nG = bench(() => { const p = [...tree]; for (const x of p) FE_NEW.gen(p, x.id); }, iters);
  console.log(
    `${label} (n=${n})`.padEnd(20) +
    `${o.toFixed(3)} ms`.padStart(16) +
    `${nn.toFixed(3)} ms`.padStart(16) +
    `${(o/nn).toFixed(1)}x`.padStart(10) +
    "  | " +
    `${oG.toFixed(3)} ms`.padEnd(16) +
    `${nG.toFixed(3)} ms`.padStart(14) +
    `${(oG/nG).toFixed(1)}x`.padStart(10)
  );
}
