// Perf microbenchmark — old vs new FE/autoLayout/POV
// Reproduces Pak Sopian's family canvas load path on Node so we get
// real numbers without a browser. Built tree = SEED (27) + 11 synthetic
// grandchildren/great-grandchildren to match the live 38-member tree.

// ─── Constants from nasab.jsx ─────────────────
const CW = 150, CH = 80, GX = 24, GY = 100, CG = 4;
const MAX_COLS = 4;

// ─── SEED (M Sopian Hadianto family, copied verbatim) ────
const I = {a:"p_s1",b:"p_s2",c:"p_s3",d:"p_s4",e:"p_s5",f:"p_s6",g:"p_s7",h:"p_s8",i:"p_s9",j:"p_s10",k:"p_s11",l:"p_s12",m:"p_s13",n:"p_s14",o:"p_s15",p:"p_s16",q:"p_s17",r:"p_s18",s:"p_s19",t:"p_s20",u:"p_s21",v:"p_s22",w:"p_s23",x:"p_s24",y:"p_s25",z:"p_s26",aa:"p_s27"};
const P = (id,nm,gn,pid,sid) => ({id,name:nm,gender:gn,parentId:pid,spouseId:sid});
const SEED = [
  P(I.a,"HM Syachroel AP","male",null,I.b), P(I.b,"Hj. Djahora","female",null,I.a),
  P(I.c,"Isnawati","female",I.a,I.d), P(I.d,"Abdul Kadir Saro","male",null,I.c),
  P(I.e,"M Fakhruddin","male",I.a,I.f), P(I.f,"Ertika Sari","female",null,I.e),
  P(I.g,"Budiana","female",I.a,I.h), P(I.h,"Fadlan","male",null,I.g),
  P(I.i,"M Sopian Hadianto","male",I.a,I.j), P(I.j,"Susilowati","female",null,I.i),
  P(I.k,"M. Firmansyah","male",I.a,I.l), P(I.l,"Rissa","female",null,I.k),
  P(I.m,"M Reza Fahlevi","male",I.a,I.n), P(I.n,"Amy","female",null,I.m),
  P(I.o,"Aulia Rahman","male",I.c,null), P(I.p,"Abdul Haris","male",I.c,null),
  P(I.q,"Annisa Salsabila","female",I.e,null), P(I.r,"M Rayhan","male",I.e,null), P(I.s,"Syifa","female",I.e,null),
  P(I.t,"Khalisa NF Shasie","female",I.i,null), P(I.u,"Athallah Lintang Ahmad","male",I.i,null), P(I.v,"Syakira Alma Kinanti","female",I.i,null),
  P(I.w,"Kaylila Syafira","female",I.k,null), P(I.x,"Al Gazel","male",I.k,null), P(I.y,"Al Syameera","female",I.k,null),
  P(I.z,"Caca","female",I.m,null), P(I.aa,"Fia","female",I.m,null),
];

// 11 synthetic gen-4 (cucu-cucu pasangan, gen-5 cicit) to reach 38
const EXTRA = [
  // 4 menantu (spouses of grandchildren)
  P("p_x1","Menantu Khalisa","male",null,I.t), P("p_x2","Menantu Athallah","female",null,I.u),
  P("p_x3","Menantu Aulia","female",null,I.o), P("p_x4","Menantu Annisa","male",null,I.q),
  // 5 cicit (great-grandchildren)
  P("p_x5","Cicit 1","male",I.t,null), P("p_x6","Cicit 2","female",I.t,null),
  P("p_x7","Cicit 3","male",I.u,null), P("p_x8","Cicit 4","female",I.o,null),
  P("p_x9","Cicit 5","male",I.q,null),
  // 2 more cucu
  P("p_x10","Cucu Tambahan 1","male",I.g,null), P("p_x11","Cucu Tambahan 2","female",I.g,null),
];
const PP = [...SEED, ...EXTRA]; // 38 members
const MARRIAGES = []; // SEED uses spouseId only

console.log(`Tree: ${PP.length} members\n`);

// ═══════════════════════════════════════════════════════
// OLD implementation (verbatim from pre-optimization code)
// ═══════════════════════════════════════════════════════
const FE_OLD = {
  ch: (pp,pid) => pp.filter(p => p.parentId === pid),
  chAll: (pp,pid,marriages) => {
    const direct = pp.filter(p => p.parentId === pid); if (direct.length) return direct;
    const person = pp.find(p => p.id === pid); if (!person) return [];
    if (person.spouseId) { const sc = pp.filter(p => p.parentId === person.spouseId); if (sc.length) return sc; }
    if (marriages) { const ms = marriages.filter(m => m.husbandId === pid || m.wifeId === pid); for (const mr of ms) { const pid2 = mr.husbandId === pid ? mr.wifeId : mr.husbandId; const mc = pp.filter(p => p.parentId === pid2); if (mc.length) return mc; } }
    return [];
  },
  spouses: (pp,p,marriages=[]) => {
    const ms = marriages.filter(m => m.husbandId === p.id || m.wifeId === p.id);
    if (ms.length) { const sids = [...new Set(ms.map(m => m.husbandId === p.id ? m.wifeId : m.husbandId))]; return sids.map(sid => pp.find(x => x.id === sid)).filter(Boolean); }
    return p.spouseId ? [pp.find(x => x.id === p.spouseId)].filter(Boolean) : [];
  },
  sib: (pp,p) => p.parentId ? pp.filter(x => x.parentId === p.parentId && x.id !== p.id) : [],
  roots: (pp,marriages=[]) => pp.filter(p => !p.parentId && !pp.some(x => x.spouseId === p.id && x.parentId) && !marriages.some(m => m.wifeId === p.id && pp.find(h => h.id === m.husbandId)?.parentId)),
  gen: (pp,pid,g=0) => { const p = pp.find(x => x.id === pid); return (!p || !p.parentId) ? g : FE_OLD.gen(pp, p.parentId, g+1); },
  desc: (pp,pid) => { const c = FE_OLD.ch(pp,pid); return c.reduce((s,x) => s + 1 + FE_OLD.desc(pp,x.id), 0); },
  descAll: (pp,pid,marriages) => { const c = FE_OLD.chAll(pp,pid,marriages); return c.reduce((s,x) => s + 1 + FE_OLD.descAll(pp,x.id,marriages), 0); },
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

// ═══════════════════════════════════════════════════════
// NEW implementation (current, from nasab.jsx)
// ═══════════════════════════════════════════════════════
const _pIdx = new WeakMap();
function _idx(pp) {
  let i = _pIdx.get(pp); if (i) return i;
  const byId = new Map(), byParent = new Map();
  for (const p of pp) { byId.set(p.id, p); if (p.parentId) { let a = byParent.get(p.parentId); if (!a) { a = []; byParent.set(p.parentId, a); } a.push(p); } }
  i = { byId, byParent, gen: new Map(), desc: new Map(), descAll: new WeakMap() };
  _pIdx.set(pp, i); return i;
}
const EMPTY = [];
const FE_NEW = {
  ch: (pp,pid) => _idx(pp).byParent.get(pid) || EMPTY,
  chAll: (pp,pid,marriages) => { const i = _idx(pp); const direct = i.byParent.get(pid); if (direct && direct.length) return direct; const person = i.byId.get(pid); if (!person) return EMPTY; if (person.spouseId) { const sc = i.byParent.get(person.spouseId); if (sc && sc.length) return sc; } if (marriages) { for (const mr of marriages) { if (mr.husbandId !== pid && mr.wifeId !== pid) continue; const pid2 = mr.husbandId === pid ? mr.wifeId : mr.husbandId; const mc = i.byParent.get(pid2); if (mc && mc.length) return mc; } } return EMPTY; },
  spouses: (pp,p,marriages=[]) => { const i = _idx(pp); const sids = []; for (const m of marriages) { if (m.husbandId === p.id) sids.push(m.wifeId); else if (m.wifeId === p.id) sids.push(m.husbandId); } if (sids.length) { const uniq = [...new Set(sids)]; return uniq.map(sid => i.byId.get(sid)).filter(Boolean); } return p.spouseId ? [i.byId.get(p.spouseId)].filter(Boolean) : EMPTY; },
  sib: (pp,p) => { if (!p.parentId) return EMPTY; const sibs = _idx(pp).byParent.get(p.parentId); return sibs ? sibs.filter(x => x.id !== p.id) : EMPTY; },
  roots: (pp,marriages=[]) => { const i = _idx(pp); return pp.filter(p => !p.parentId && !pp.some(x => x.spouseId === p.id && x.parentId) && !marriages.some(m => m.wifeId === p.id && i.byId.get(m.husbandId)?.parentId)); },
  gen: (pp,pid) => { const i = _idx(pp); const c = i.gen; if (c.has(pid)) return c.get(pid); let cur = i.byId.get(pid), d = 0; while (cur && cur.parentId) { d++; cur = i.byId.get(cur.parentId); } c.set(pid, d); return d; },
  desc: (pp,pid) => { const i = _idx(pp); const c = i.desc; if (c.has(pid)) return c.get(pid); const ch = i.byParent.get(pid) || EMPTY; let r = 0; for (const x of ch) r += 1 + FE_NEW.desc(pp, x.id); c.set(pid, r); return r; },
  descAll: (pp,pid,marriages) => { const i = _idx(pp); const key = marriages || i; let m = i.descAll.get(key); if (!m) { m = new Map(); i.descAll.set(key, m); } if (m.has(pid)) return m.get(pid); m.set(pid, 0); const ch = FE_NEW.chAll(pp,pid,marriages); let r = 0; for (const x of ch) r += 1 + FE_NEW.descAll(pp, x.id, marriages); m.set(pid, r); return r; },
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

// ═══════════════════════════════════════════════════════
// Bench
// ═══════════════════════════════════════════════════════
function bench(name, fn, iters = 100) {
  // warmup
  for (let i = 0; i < 5; i++) fn();
  const t0 = performance.now();
  for (let i = 0; i < iters; i++) fn();
  const total = performance.now() - t0;
  return { name, total, avg: total / iters };
}

// Sanity: same result?
const oldPos = autoLayout_OLD(PP, MARRIAGES);
const newPos = autoLayout_NEW(PP, MARRIAGES);
const oldKeys = Object.keys(oldPos).sort().join(",");
const newKeys = Object.keys(newPos).sort().join(",");
if (oldKeys !== newKeys) { console.error("✗ DIFFERENT KEYS"); process.exit(1); }
let maxDiff = 0;
for (const k of Object.keys(oldPos)) {
  const dx = Math.abs(oldPos[k].x - newPos[k].x);
  const dy = Math.abs(oldPos[k].y - newPos[k].y);
  if (dx > maxDiff) maxDiff = dx; if (dy > maxDiff) maxDiff = dy;
}
console.log(`Layout correctness: ${maxDiff < 0.01 ? "✓ IDENTICAL" : `✗ max diff ${maxDiff.toFixed(2)}px`}`);
console.log(`Positioned: ${Object.keys(newPos).length}/${PP.length}\n`);

// Each iter clones pp so the WeakMap cache invalidates — realistic for
// React re-renders that produce new arrays each time
const benches = [
  ["autoLayout (cold, new pp each iter)",
    () => autoLayout_OLD([...PP], MARRIAGES),
    () => autoLayout_NEW([...PP], MARRIAGES)],
  ["autoLayout (warm, same pp ref)",
    (() => { const p = [...PP]; return () => autoLayout_OLD(p, MARRIAGES); })(),
    (() => { const p = [...PP]; return () => autoLayout_NEW(p, MARRIAGES); })()],
  ["FE.gen × 38 + FE.ch × 38 (cold)",
    () => { const p = [...PP]; for (const x of p) { FE_OLD.gen(p, x.id); FE_OLD.ch(p, x.id); } },
    () => { const p = [...PP]; for (const x of p) { FE_NEW.gen(p, x.id); FE_NEW.ch(p, x.id); } }],
  ["FE.gen × 38 + FE.ch × 38 (warm)",
    (() => { const p = [...PP]; return () => { for (const x of p) { FE_OLD.gen(p, x.id); FE_OLD.ch(p, x.id); } }; })(),
    (() => { const p = [...PP]; return () => { for (const x of p) { FE_NEW.gen(p, x.id); FE_NEW.ch(p, x.id); } }; })()],
  ["descAll × 2 roots (autoRoot path, cold)",
    () => { const p = [...PP]; FE_OLD.descAll(p, "p_s1", MARRIAGES); FE_OLD.descAll(p, "p_s2", MARRIAGES); },
    () => { const p = [...PP]; FE_NEW.descAll(p, "p_s1", MARRIAGES); FE_NEW.descAll(p, "p_s2", MARRIAGES); }],
];

console.log("Op".padEnd(45) + "OLD (ms/op)".padStart(15) + "NEW (ms/op)".padStart(15) + "Speedup".padStart(12));
console.log("─".repeat(87));
for (const [name, oldFn, newFn] of benches) {
  const o = bench("old", oldFn, 200);
  const n = bench("new", newFn, 200);
  const speedup = o.avg / n.avg;
  console.log(
    name.padEnd(45) +
    o.avg.toFixed(4).padStart(15) +
    n.avg.toFixed(4).padStart(15) +
    `${speedup.toFixed(1)}x`.padStart(12)
  );
}
