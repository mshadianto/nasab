import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════════
// NASAB — Jaga Nasabmu
// Modern Family Tree SaaS Platform for Indonesia
// Tech-forward • Multi-Tenant • RBAC • Geotagging • AI-ready Architecture
// ═══════════════════════════════════════════════════════════════════════

const APP = { name: "NASAB", tagline: "Jaga Nasabmu", domain: "nasab.id", version: __APP_VERSION__, build: __APP_BUILD__, developer: { name: "M Sopian Hadianto", role: "GRC Expert & AI-Powered Builder", org: "Labbaik AI" } };
const SK = "nasab-v5";
const CW = 150, CH = 80, GX = 24, GY = 100, CG = 8;
const VW = { CANVAS:"canvas",MAP:"map",LIST:"list",STATS:"stats",TIMELINE:"timeline",INSIGHTS:"insights" };
const RL = { OWNER:"owner",EDITOR:"editor",VIEWER:"viewer" };
const GL = [{l:"Kakek/Nenek",i:"👴"},{l:"Ayah/Ibu",i:"👨‍👩‍👧‍👦"},{l:"Anak",i:"🧒"},{l:"Cucu",i:"👶"},{l:"Cicit",i:"🌱"},{l:"Canggah",i:"🌿"}];
const GC = ["#14b8a6","#6366f1","#f59e0b","#ec4899","#8b5cf6","#f97316"];

// ─── NIK INTELLIGENCE ─────────────────────────────────────────
const PROV={11:{n:"Aceh",lt:5.55,ln:95.32},12:{n:"Sumatera Utara",lt:3.59,ln:98.67},13:{n:"Sumatera Barat",lt:-0.95,ln:100.35},14:{n:"Riau",lt:0.51,ln:101.45},15:{n:"Jambi",lt:-1.61,ln:103.61},16:{n:"Sumatera Selatan",lt:-2.99,ln:104.76},17:{n:"Bengkulu",lt:-3.79,ln:102.26},18:{n:"Lampung",lt:-5.45,ln:105.26},19:{n:"Bangka Belitung",lt:-2.13,ln:106.14},21:{n:"Kepulauan Riau",lt:1.07,ln:104.03},31:{n:"DKI Jakarta",lt:-6.21,ln:106.85},32:{n:"Jawa Barat",lt:-6.92,ln:107.61},33:{n:"Jawa Tengah",lt:-7.15,ln:110.42},34:{n:"DI Yogyakarta",lt:-7.80,ln:110.36},35:{n:"Jawa Timur",lt:-7.54,ln:112.24},36:{n:"Banten",lt:-6.12,ln:106.15},51:{n:"Bali",lt:-8.41,ln:115.19},52:{n:"NTB",lt:-8.65,ln:116.32},53:{n:"NTT",lt:-10.18,ln:123.61},61:{n:"Kalimantan Barat",lt:-0.02,ln:109.34},62:{n:"Kalimantan Tengah",lt:-1.68,ln:113.38},63:{n:"Kalimantan Selatan",lt:-3.32,ln:114.59},64:{n:"Kalimantan Timur",lt:-1.24,ln:116.85},65:{n:"Kalimantan Utara",lt:3.07,ln:116.04},71:{n:"Sulawesi Utara",lt:1.49,ln:124.84},72:{n:"Sulawesi Tengah",lt:-1.43,ln:121.45},73:{n:"Sulawesi Selatan",lt:-5.14,ln:119.42},74:{n:"Sulawesi Tenggara",lt:-3.97,ln:122.51},75:{n:"Gorontalo",lt:0.54,ln:123.06},76:{n:"Sulawesi Barat",lt:-2.84,ln:119.23},81:{n:"Maluku",lt:-3.70,ln:128.17},82:{n:"Maluku Utara",lt:1.57,ln:127.81},91:{n:"Papua",lt:-2.54,ln:140.72},92:{n:"Papua Barat",lt:-1.34,ln:133.17}};
const NIK={
  valid(n){return typeof n==="string"&&/^\d{16}$/.test(n)},
  parse(n){if(!this.valid(n))return null;const pc=parseInt(n.slice(0,2));let dd=parseInt(n.slice(6,8));const mm=parseInt(n.slice(8,10));const yy=parseInt(n.slice(10,12));const g=dd>40?"female":"male";if(dd>40)dd-=40;const cy=new Date().getFullYear()%100;const yr=yy>cy?1900+yy:2000+yy;const prov=PROV[pc]||null;return{gender:g,birthDate:`${yr}-${String(mm).padStart(2,"0")}-${String(dd).padStart(2,"0")}`,prov,provCode:pc,provName:prov?prov.n:"Tidak dikenal"}},
  mask(n){if(!n||n.length<10)return n||"";return n.slice(0,6)+"******"+n.slice(-4)},
  format(n){if(!n)return"";return n.replace(/(\d{6})(\d{6})(\d{4})/,"$1.$2.$3")}
};

// ─── FARAIDH CALCULATOR ──────────────────────────────────────
const AGAMA_LIST=["islam","kristen","katolik","hindu","buddha","konghucu","lainnya"];
const FARAIDH={
  // Core faraidh calculation (only Muslim heirs)
  _calc(h,total){
    const hasChild=h.sons>0||h.daughters>0,hasSon=h.sons>0;
    const hasFather=h.father>0,hasBro=h.brothers>0;
    const shares=[];
    if(h.husband){const f=hasChild?[1,4]:[1,2];shares.push({heir:"Suami",count:1,frac:f,type:"fardh"})}
    if(h.wife>0){const f=hasChild?[1,8]:[1,4];shares.push({heir:"Istri",count:h.wife,frac:f,type:"fardh"})}
    if(h.mother){const f=(hasChild||(h.brothers+h.sisters)>=2)?[1,6]:[1,3];shares.push({heir:"Ibu",count:1,frac:f,type:"fardh"})}
    if(hasFather&&hasChild){shares.push({heir:"Ayah",count:1,frac:[1,6],type:"fardh"})}
    if(!hasFather&&h.grandfather&&hasChild){shares.push({heir:"Kakek",count:1,frac:[1,6],type:"fardh"})}
    if(h.grandmother){shares.push({heir:"Nenek",count:1,frac:[1,6],type:"fardh"})}
    if(h.daughters>0&&!hasSon){const f=h.daughters===1?[1,2]:[2,3];shares.push({heir:"Anak Perempuan",count:h.daughters,frac:f,type:"fardh"})}
    if(h.sisters>0&&!hasChild&&!hasFather&&!hasBro){const f=h.sisters===1?[1,2]:[2,3];shares.push({heir:"Saudara Perempuan",count:h.sisters,frac:f,type:"fardh"})}
    let sumF=shares.reduce((s,x)=>s+(x.frac[0]/x.frac[1]),0);
    const remainder=1-sumF;
    if(hasSon){const parts=h.sons*2+h.daughters;const pp=remainder/parts;shares.push({heir:"Anak Laki-laki",count:h.sons,perShare:pp*2,type:"asabah"});if(h.daughters>0)shares.push({heir:"Anak Perempuan (asabah)",count:h.daughters,perShare:pp,type:"asabah"})}
    else if(hasFather&&!hasChild){shares.push({heir:"Ayah",count:1,perShare:Math.max(0,remainder),type:"asabah"})}
    else if(hasFather&&h.daughters>0&&!hasSon&&remainder>0){const fi=shares.findIndex(s=>s.heir==="Ayah");if(fi>=0)shares[fi].extra=remainder;else shares.push({heir:"Ayah",count:1,perShare:remainder,type:"asabah"})}
    else if(!hasFather&&h.grandfather&&!hasChild){shares.push({heir:"Kakek",count:1,perShare:Math.max(0,remainder),type:"asabah"})}
    else if(hasBro&&!hasChild&&!hasFather){const parts=h.brothers*2+h.sisters;const pp=remainder/parts;shares.push({heir:"Saudara Laki-laki",count:h.brothers,perShare:pp*2,type:"asabah"});if(h.sisters>0){const si=shares.findIndex(s=>s.heir==="Saudara Perempuan"&&s.type==="fardh");if(si>=0){sumF-=shares[si].frac[0]/shares[si].frac[1];shares.splice(si,1)}shares.push({heir:"Saudara Perempuan (asabah)",count:h.sisters,perShare:pp,type:"asabah"})}}
    const needAwl=sumF>1.001;
    return shares.map(r=>{let share;if(r.frac){share=r.frac[0]/r.frac[1];if(needAwl)share=share/sumF}else share=(r.perShare||0)*r.count;if(r.extra)share+=r.extra;return{heir:r.heir,count:r.count,share,perPerson:share/r.count,amount:total*share,amountPer:total*share/r.count,type:r.type,frac:r.frac?`${r.frac[0]}/${r.frac[1]}`:"-",awl:needAwl}})},
  // Full calculation with religion filter + wasiat wajibah
  calc(h,total,{blocked=[],wasiatWajibah=false}={}){
    // (A) Faraidh murni — only Muslim heirs
    const faraidh=this._calc(h,total);
    if(!wasiatWajibah||blocked.length===0)return{faraidh,wasiat:null,blocked};
    // (B) Wasiat wajibah — max 1/3 of estate for non-Muslim heirs
    // Calculate what blocked heirs WOULD have gotten if Muslim
    const fullH={...h};blocked.forEach(b=>{fullH[b.key]=(fullH[b.key]||0)+b.count});
    const hypothetical=this._calc(fullH,total);
    // Find shares of blocked heirs in hypothetical
    let wasiatTotal=0;const wasiatShares=[];
    blocked.forEach(b=>{const match=hypothetical.filter(r=>r.heir.startsWith(b.label));match.forEach(r=>{const amt=r.amountPer*b.count;wasiatTotal+=amt;wasiatShares.push({heir:`${b.label} (Wasiat Wajibah)`,count:b.count,amount:amt,amountPer:r.amountPer,names:b.names,type:"wasiat"})})});
    // Cap at 1/3
    const maxWasiat=total/3;
    if(wasiatTotal>maxWasiat){const ratio=maxWasiat/wasiatTotal;wasiatShares.forEach(w=>{w.amount*=ratio;w.amountPer*=ratio});wasiatTotal=maxWasiat}
    // Recalculate faraidh on remaining estate
    const remaining=total-wasiatTotal;
    const faraidhAdj=this._calc(h,remaining);
    return{faraidh,wasiat:{shares:wasiatShares,total:wasiatTotal,capped:wasiatTotal>=maxWasiat-1,faraidhAdj},blocked}},
  // Auto-detect heirs with religion awareness
  detectHeirs(pp,personId){
    const p=pp.find(x=>x.id===personId);if(!p)return{heirs:{},blocked:[],warnings:[]};
    const pAgama=p.agama||"islam";
    const sp=p.spouseId?pp.find(x=>x.id===p.spouseId):null;
    const ch=pp.filter(x=>x.parentId===personId);
    const pa=p.parentId?pp.find(x=>x.id===p.parentId):null;
    const sib=p.parentId?pp.filter(x=>x.parentId===p.parentId&&x.id!==personId):[];
    const isM=x=>(x.agama||"islam")===pAgama&&pAgama==="islam";
    const blocked=[];const warnings=[];
    const checkBlock=(person,key,label)=>{if(!person)return false;if(!isM(person)){blocked.push({key,label,count:1,names:[person.name],agama:person.agama||"islam"});warnings.push(`${person.name} (${person.agama||"?"}) — beda agama, tidak berhak waris faraidh`);return true}return false};
    const h={husband:0,wife:0,sons:0,daughters:0,father:0,mother:0,grandfather:0,grandmother:0,brothers:0,sisters:0};
    if(sp){if(sp.gender==="male"){if(!checkBlock(sp,"husband","Suami"))h.husband=1}else{if(!checkBlock(sp,"wife","Istri"))h.wife=1}}
    const mSons=ch.filter(c=>c.gender==="male"&&isM(c));const mDau=ch.filter(c=>c.gender==="female"&&isM(c));
    const bSons=ch.filter(c=>c.gender==="male"&&!isM(c));const bDau=ch.filter(c=>c.gender==="female"&&!isM(c));
    h.sons=mSons.length;h.daughters=mDau.length;
    if(bSons.length)blocked.push({key:"sons",label:"Anak Laki-laki",count:bSons.length,names:bSons.map(c=>c.name),agama:bSons[0].agama});
    if(bDau.length)blocked.push({key:"daughters",label:"Anak Perempuan",count:bDau.length,names:bDau.map(c=>c.name),agama:bDau[0].agama});
    bSons.concat(bDau).forEach(c=>warnings.push(`${c.name} (${c.agama||"?"}) — beda agama, tidak berhak waris faraidh`));
    if(pa){if(pa.gender==="male"){if(!checkBlock(pa,"father","Ayah"))h.father=1}else{if(!checkBlock(pa,"mother","Ibu"))h.mother=1}}
    const mBro=sib.filter(s=>s.gender==="male"&&isM(s));const mSis=sib.filter(s=>s.gender==="female"&&isM(s));
    const bBro=sib.filter(s=>s.gender==="male"&&!isM(s));const bSis=sib.filter(s=>s.gender==="female"&&!isM(s));
    h.brothers=mBro.length;h.sisters=mSis.length;
    if(bBro.length)blocked.push({key:"brothers",label:"Saudara Laki-laki",count:bBro.length,names:bBro.map(s=>s.name),agama:bBro[0].agama});
    if(bSis.length)blocked.push({key:"sisters",label:"Saudara Perempuan",count:bSis.length,names:bSis.map(s=>s.name),agama:bSis[0].agama});
    bBro.concat(bSis).forEach(s=>warnings.push(`${s.name} (${s.agama||"?"}) — beda agama, tidak berhak waris faraidh`));
    if(pAgama!=="islam")warnings.unshift("Almarhum bukan Muslim — hukum faraidh tidak berlaku");
    return{heirs:h,blocked,warnings}
  }
};

// ─── API LAYER ────────────────────────────────────────────────
const API_URL='https://nasab-api.sopian-hadianto.workers.dev';
const TK='nasab-token';
const mFromAPI=m=>({id:m.id,name:m.name,gender:m.gender,birthDate:m.birth_date||'',deathDate:m.death_date||'',birthPlace:m.birth_place||'',notes:m.notes||'',parentId:m.parent_id||null,spouseId:m.spouse_id||null,location:m.location_lat?{lat:m.location_lat,lng:m.location_lng,address:m.location_address||''}:null,photo:m.photo||'',nik:m.nik||'',agama:m.agama||'islam',createdAt:m.created_at});
const mToAPI=m=>({name:m.name,gender:m.gender,birth_date:m.birthDate||'',death_date:m.deathDate||'',birth_place:m.birthPlace||'',notes:m.notes||'',parent_id:m.parentId||null,spouse_id:m.spouseId||null,location_lat:m.location?.lat||null,location_lng:m.location?.lng||null,location_address:m.location?.address||'',nik:m.nik||'',agama:m.agama||'islam'});
const API={
  token:localStorage.getItem(TK),
  async _f(path,opts={}){const h={'Content-Type':'application/json'};if(this.token)h['Authorization']=`Bearer ${this.token}`;const r=await fetch(`${API_URL}${path}`,{...opts,headers:h});const d=await r.json();if(!r.ok)throw new Error(d.error||'Request failed');return d},
  async register({name,email,password}){const d=await this._f('/api/auth/register',{method:'POST',body:JSON.stringify({name,email,password})});this.token=d.token;localStorage.setItem(TK,d.token);return d.user},
  async login({email,password}){const d=await this._f('/api/auth/login',{method:'POST',body:JSON.stringify({email,password})});this.token=d.token;localStorage.setItem(TK,d.token);return d.user},
  async resetPassword({email,name,new_password}){return this._f('/api/auth/reset-password',{method:'POST',body:JSON.stringify({email,name,new_password})})},
  async me(){return(await this._f('/api/auth/me')).user},
  async getFamilies(){const d=await this._f('/api/families');return d.families.map(f=>({...f,myRole:f.my_role}))},
  async createFamily({name,description}){return(await this._f('/api/families',{method:'POST',body:JSON.stringify({name,description})})).family},
  async getFamily(fid){const d=await this._f(`/api/families/${fid}`);return{...d.family,members:d.members.map(mFromAPI),positions:d.positions||{},stories:(d.stories||[]).map(s=>({id:s.id,text:s.text_content,personId:s.person_id,personName:s.person_name||'',author:s.author_name||'',date:s.created_at})),collaborators:(d.collaborators||[]).map(c=>({userId:c.user_id,name:c.name,role:c.role})),invites:d.invites||[],myRole:d.my_role}},
  async addMember(fid,m){return this._f(`/api/families/${fid}/members`,{method:'POST',body:JSON.stringify(mToAPI(m))})},
  async updateMember(fid,mid,m){return this._f(`/api/families/${fid}/members/${mid}`,{method:'PUT',body:JSON.stringify(mToAPI(m))})},
  async deleteMember(fid,mid){return this._f(`/api/families/${fid}/members/${mid}`,{method:'DELETE'})},
  async savePositions(fid,positions){return this._f(`/api/families/${fid}/positions`,{method:'PUT',body:JSON.stringify({positions})})},
  async addStory(fid,s){return this._f(`/api/families/${fid}/stories`,{method:'POST',body:JSON.stringify({text:s.text,person_id:s.personId,person_name:s.personName})})},
  async deleteStory(fid,sid){return this._f(`/api/families/${fid}/stories/${sid}`,{method:'DELETE'})},
  async invite(fid,email,role){return this._f(`/api/families/${fid}/invite`,{method:'POST',body:JSON.stringify({email,role})})},
  async adminStats(){return this._f('/api/admin/stats')},
  async adminUsers(){return(await this._f('/api/admin/users')).users},
  async adminFamilies(){return(await this._f('/api/admin/families')).families},
  async setUserRole(uid,role){return this._f(`/api/admin/users/${uid}/role`,{method:'PUT',body:JSON.stringify({role})})},
  async deleteUser(uid){return this._f(`/api/admin/users/${uid}`,{method:'DELETE'})},
  clearSession(){this.token=null;localStorage.removeItem(TK)},
  hasSession(){return!!this.token}
};

// ─── FAMILY ENGINE ───────────────────────────────────────────
const FE={
  ch:(pp,pid)=>pp.filter(p=>p.parentId===pid),
  sp:(pp,p)=>p.spouseId?pp.find(x=>x.id===p.spouseId)||null:null,
  pa:(pp,p)=>p.parentId?pp.find(x=>x.id===p.parentId)||null:null,
  sib:(pp,p)=>p.parentId?pp.filter(x=>x.parentId===p.parentId&&x.id!==p.id):[],
  roots:(pp)=>pp.filter(p=>!p.parentId&&!pp.some(x=>x.spouseId===p.id&&x.parentId)),
  gen:(pp,pid,g=0)=>{const p=pp.find(x=>x.id===pid);return(!p||!p.parentId)?g:FE.gen(pp,p.parentId,g+1)},
  desc:(pp,pid)=>{const c=FE.ch(pp,pid);return c.reduce((s,x)=>s+1+FE.desc(pp,x.id),0)},
  age:(p)=>{if(!p.birthDate)return null;const b=new Date(p.birthDate),e=p.deathDate?new Date(p.deathDate):new Date();let a=e.getFullYear()-b.getFullYear();if(e.getMonth()<b.getMonth()||(e.getMonth()===b.getMonth()&&e.getDate()<b.getDate()))a--;return a},
  stats:(pp)=>{const t=pp.length,m=pp.filter(p=>p.gender==="male").length,f=t-m,lv=pp.filter(p=>!p.deathDate).length;const mg=Math.max(0,...pp.map(p=>FE.gen(pp,p.id)));const pr=pp.filter(p=>FE.ch(pp,p.id).length>0);const ac=pr.length?(pr.reduce((s,p)=>s+FE.ch(pp,p.id).length,0)/pr.length).toFixed(1):0;const geo=pp.filter(p=>p.location?.lat).length;return{total:t,males:m,females:f,living:lv,deceased:t-lv,generations:mg+1,avgChildren:ac,geotagged:geo}},
  search:(pp,q)=>{const s=q.toLowerCase().trim();return!s?pp:pp.filter(p=>p.name.toLowerCase().includes(s)||(p.birthPlace||"").toLowerCase().includes(s)||(p.notes||"").toLowerCase().includes(s))},
  findRel(pp,fid,tid){
    if(fid===tid)return{path:[],label:"Diri sendiri"};
    const adj={};pp.forEach(p=>{adj[p.id]=[]});
    pp.forEach(p=>{if(p.parentId&&adj[p.parentId]){adj[p.id].push({id:p.parentId,rel:"parent"});adj[p.parentId].push({id:p.id,rel:"child"})}if(p.spouseId&&adj[p.spouseId])adj[p.id].push({id:p.spouseId,rel:"spouse"})});
    const vis=new Set([fid]),q=[{id:fid,path:[]}];
    while(q.length){const{id,path}=q.shift();for(const e of(adj[id]||[])){if(vis.has(e.id))continue;vis.add(e.id);const np=[...path,{id:e.id,rel:e.rel}];if(e.id===tid)return{path:np,label:FE._dr(np)};q.push({id:e.id,path:np})}}
    return{path:[],label:"Tidak ditemukan hubungan"}},
  _dr(path){const r=path.map(s=>s.rel).join("-");const M={"parent":"Orang Tua","child":"Anak","spouse":"Pasangan","parent-parent":"Kakek/Nenek","child-child":"Cucu","parent-child":"Saudara Kandung","parent-spouse":"Mertua","spouse-parent":"Mertua","spouse-child":"Anak Tiri","child-spouse":"Menantu","parent-parent-child":"Paman/Bibi","parent-child-child":"Keponakan","parent-parent-child-child":"Sepupu","parent-parent-parent":"Buyut","child-child-child":"Cicit"};if(M[r])return M[r];let u=0,d=0;path.forEach(s=>{if(s.rel==="parent")u++;else if(s.rel==="child")d++});if(u>0&&d===0)return`${u} generasi ke atas`;if(d>0&&u===0)return`${d} generasi ke bawah`;if(u&&d)return`Saudara (${Math.max(u,d)-1}× diangkat)`;return`${path.length} langkah`},
  bdays(pp,days=90){const now=new Date();return pp.filter(p=>p.birthDate&&!p.deathDate).map(p=>{const bd=new Date(p.birthDate);const nx=new Date(now.getFullYear(),bd.getMonth(),bd.getDate());if(nx<now)nx.setFullYear(nx.getFullYear()+1);const diff=Math.floor((nx-now)/864e5);return{person:p,next:nx,days:diff,age:nx.getFullYear()-bd.getFullYear()}}).filter(b=>b.days<=days).sort((a,b)=>a.days-b.days)},
  filter(pp,f){let r=[...pp];if(f.gender&&f.gender!=="all")r=r.filter(p=>p.gender===f.gender);if(f.generation!==undefined&&f.generation!=="all")r=r.filter(p=>FE.gen(pp,p.id)===parseInt(f.generation));if(f.status==="living")r=r.filter(p=>!p.deathDate);if(f.status==="deceased")r=r.filter(p=>p.deathDate);if(f.location)r=r.filter(p=>(p.location?.address||"").toLowerCase().includes(f.location.toLowerCase()));if(f.nik==="has")r=r.filter(p=>p.nik&&p.nik.length>0);if(f.nik==="none")r=r.filter(p=>!p.nik||p.nik.length===0);return r},
};

// ─── LAYOUT / CONNECTORS ─────────────────────────────────────
function autoLayout(pp){const roots=pp.filter(p=>!p.parentId&&!pp.some(x=>x.spouseId===p.id&&x.parentId));const pos={};
  function lay(pid,d){const p=pp.find(x=>x.id===pid);if(!p||pos[pid])return{x:0,w:0};const sp=FE.sp(pp,p);const ch=FE.ch(pp,pid);const cw=sp?CW*2+CG:CW;if(!ch.length){const y=d*(CH+GY);pos[pid]={x:0,y};if(sp&&!pos[sp.id])pos[sp.id]={x:CW+CG,y};return{x:0,w:cw}}const cls=[];let cur=0;ch.forEach(c=>{const cl=lay(c.id,d+1);cls.push({...cl,offset:cur});cur+=cl.w+GX});const tcw=cur-GX;const cx=(cls[0].offset+cls[cls.length-1].offset+cls[cls.length-1].w)/2-cw/2;const px=Math.max(0,cx);const y=d*(CH+GY);pos[pid]={x:px,y};if(sp&&!pos[sp.id])pos[sp.id]={x:px+CW+CG,y};const cbx=px+cw/2-tcw/2;ch.forEach((c,i)=>shift(c.id,cbx+cls[i].offset));return{x:Math.min(px,cbx),w:Math.max(px+cw,cbx+tcw)-Math.min(px,cbx)}}
  function shift(pid,dx){if(!pos[pid])return;pos[pid].x+=dx;const sp=FE.sp(pp,pp.find(x=>x.id===pid));if(sp&&pos[sp.id])pos[sp.id].x+=dx;FE.ch(pp,pid).forEach(c=>shift(c.id,dx))}
  let gc=0;roots.forEach(root=>{const r=lay(root.id,0);const sh=gc;const sa=pid=>{if(pos[pid])pos[pid].x+=sh;const sp=FE.sp(pp,pp.find(x=>x.id===pid));if(sp&&pos[sp.id])pos[sp.id].x+=sh;FE.ch(pp,pid).forEach(c=>sa(c.id))};sa(root.id);gc+=r.w+GX*3});
  let mx=Infinity,my=Infinity;Object.values(pos).forEach(p=>{mx=Math.min(mx,p.x);my=Math.min(my,p.y)});Object.values(pos).forEach(p=>{p.x-=mx-100;p.y-=my-80});return pos}
function getConns(pp,pos){const L=[];pp.forEach(p=>{const ps=pos[p.id];if(!ps)return;const sp=FE.sp(pp,p);if(sp&&pos[sp.id]&&p.id<sp.id)L.push({t:"sp",x1:ps.x+CW,y1:ps.y+CH/2,x2:pos[sp.id].x,y2:ps.y+CH/2});const ch=FE.ch(pp,p.id);if(ch.length){const cw=sp&&pos[sp.id]?(pos[sp.id].x+CW-ps.x):CW;const pcx=ps.x+cw/2,pb=ps.y+CH;const ct=ch.map(c=>{const cp=pos[c.id];if(!cp)return null;const cs=FE.sp(pp,c);const ccw=cs&&pos[cs.id]?(pos[cs.id].x+CW-cp.x):CW;return{cx:cp.x+ccw/2,y:cp.y}}).filter(Boolean);if(ct.length){const my=pb+GY/2;L.push({t:"pd",x1:pcx,y1:pb,x2:pcx,y2:my});if(ct.length>1)L.push({t:"br",x1:Math.min(...ct.map(c=>c.cx)),y1:my,x2:Math.max(...ct.map(c=>c.cx)),y2:my});ct.forEach(c=>L.push({t:"cd",x1:c.cx,y1:my,x2:c.cx,y2:c.y}))}}});return L}

// ─── SEED DATA ───────────────────────────────────────────────
const SEED=(()=>{const I={a:"p_s1",b:"p_s2",c:"p_s3",d:"p_s4",e:"p_s5",f:"p_s6",g:"p_s7",h:"p_s8",i:"p_s9",j:"p_s10",k:"p_s11",l:"p_s12",m:"p_s13",n:"p_s14",o:"p_s15",p:"p_s16",q:"p_s17",r:"p_s18",s:"p_s19",t:"p_s20",u:"p_s21",v:"p_s22",w:"p_s23",x:"p_s24",y:"p_s25",z:"p_s26",aa:"p_s27"};const P=(id,nm,gn,pid,sid,nt="",loc=null)=>({id,name:nm,gender:gn,birthDate:"",deathDate:"",birthPlace:loc?loc.address:"",photo:"",notes:nt,parentId:pid,spouseId:sid,location:loc,createdAt:"2024-01-01"});const S={lat:-0.4948,lng:117.1436,address:"Samarinda, Kaltim"},C={lat:-6.354,lng:106.743,address:"Ciputat, Tangsel"};return[P(I.a,"HM Syachroel AP","male",null,I.b,"Kepala Keluarga",S),P(I.b,"Hj. Djahora","female",null,I.a,"Ibu Keluarga",S),P(I.c,"Isnawati","female",I.a,I.d,"Anak ke-1",S),P(I.d,"Abdul Kadir Saro","male",null,I.c,"Suami Isnawati",S),P(I.e,"M Fakhruddin","male",I.a,I.f,"Anak ke-2",S),P(I.f,"Ertika Sari","female",null,I.e,"Istri Fakhruddin",S),P(I.g,"Budiana","female",I.a,I.h,"Anak ke-3",S),P(I.h,"Fadlan","male",null,I.g,"Suami Budiana",S),P(I.i,"M Sopian Hadianto","male",I.a,I.j,"Anak ke-4 • GRC Expert & AI Builder",C),P(I.j,"Susilowati","female",null,I.i,"Istri Sopian",C),P(I.k,"M. Firmansyah","male",I.a,I.l,"Anak ke-5",S),P(I.l,"Rissa","female",null,I.k,"Istri Firmansyah",S),P(I.m,"M Reza Fahlevi","male",I.a,I.n,"Anak ke-6",S),P(I.n,"Amy","female",null,I.m,"Istri Reza",S),P(I.o,"Aulia Rahman","male",I.c,null,"Cucu",S),P(I.p,"Abdul Haris","male",I.c,null,"Cucu",S),P(I.q,"Annisa Salsabila","female",I.e,null,"Cucu",S),P(I.r,"M Rayhan","male",I.e,null,"Cucu",S),P(I.s,"Syifa","female",I.e,null,"Cucu",S),P(I.t,"Khalisa NF Shasie","female",I.i,null,"Cucu",C),P(I.u,"Athallah Lintang Ahmad","male",I.i,null,"Cucu",C),P(I.v,"Syakira Alma Kinanti","female",I.i,null,"Cucu",C),P(I.w,"Kaylila Syafira","female",I.k,null,"Cucu",S),P(I.x,"Al Gazel","male",I.k,null,"Cucu",S),P(I.y,"Al Syameera","female",I.k,null,"Cucu",S),P(I.z,"Caca","female",I.m,null,"Cucu",S),P(I.aa,"Fia","female",I.m,null,"Cucu",S)]})();

// ─── STYLES ──────────────────────────────────────────────────
const css=`
/* Fonts & Leaflet CSS loaded via preload in index.html */
:root,[data-theme="dark"]{
  --bg0:#07090e;--bg1:#0c1017;--bg2:#131821;--bg3:#1a2030;--bg4:#222a3a;
  --bdr:#1e2738;--bdr2:#2c3a50;
  --t1:#e4e8f0;--t2:#7d8ba0;--t3:#4d5a70;
  --pri:#14b8a6;--pri2:#0d9488;--pri3:#2dd4bf;
  --acc:#6366f1;--warn:#f59e0b;--rose:#ec4899;--purple:#8b5cf6;--orange:#f97316;
  --male-bg:#0f1a2e;--male-bdr:#1a3050;--male-t:#38bdf8;
  --fem-bg:#1e0f28;--fem-bdr:#3a1850;--fem-t:#d946ef;
  --r:8px;--rs:6px;
  --f-display:'Instrument Serif',serif;--f-body:'DM Sans',sans-serif;--f-mono:'JetBrains Mono',monospace;
}
[data-theme="light"]{
  --bg0:#f4f6f9;--bg1:#ffffff;--bg2:#f0f2f5;--bg3:#e4e7ec;--bg4:#d1d5dc;
  --bdr:#d8dce3;--bdr2:#c0c6d0;
  --t1:#1a1d23;--t2:#4a5060;--t3:#8590a0;
  --pri:#0d9488;--pri2:#0f766e;--pri3:#14b8a6;
  --acc:#4f46e5;--warn:#d97706;--rose:#db2777;--purple:#7c3aed;--orange:#ea580c;
  --male-bg:#e8f4fd;--male-bdr:#b8d8f0;--male-t:#0369a1;
  --fem-bg:#fce8f4;--fem-bdr:#f0b8d8;--fem-t:#be185d;
}
*{margin:0;padding:0;box-sizing:border-box}
body,#root{font-family:var(--f-body);background:var(--bg0);color:var(--t1);min-height:100vh;min-height:100dvh;overflow:hidden;-webkit-tap-highlight-color:transparent}
.app{height:100vh;height:100dvh;display:flex;flex-direction:column}

/* ── AUTH / LANDING ── */
.auth-wrap{height:100vh;height:100dvh;display:flex;overflow:hidden}
.auth-hero{flex:1;display:flex;flex-direction:column;justify-content:center;padding:60px;background:linear-gradient(160deg,#080c14 0%,#0a1020 50%,#0c1428 100%);position:relative;overflow:hidden}
.auth-hero::before{content:'';position:absolute;top:-120px;right:-120px;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(20,184,166,.08) 0%,transparent 70%)}
.auth-hero::after{content:'';position:absolute;bottom:-80px;left:-80px;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(99,102,241,.06) 0%,transparent 70%)}
.auth-brand{margin-bottom:40px}
.auth-brand h1{font-family:var(--f-display);font-size:52px;color:var(--t1);letter-spacing:-1px;line-height:1}
.auth-brand h1 em{font-style:italic;color:var(--pri)}
.auth-brand p{font-size:15px;color:var(--t3);margin-top:8px;letter-spacing:.5px}
.auth-features{display:flex;flex-direction:column;gap:14px;margin-top:8px}
.auth-feat{display:flex;align-items:flex-start;gap:12px;padding:12px 16px;border-radius:var(--r);border:1px solid var(--bdr);background:rgba(20,184,166,.03);transition:all .2s}
.auth-feat:hover{border-color:var(--pri);background:rgba(20,184,166,.06)}
.auth-feat-icon{width:36px;height:36px;border-radius:8px;background:var(--bg2);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;border:1px solid var(--bdr)}
.auth-feat-text h4{font-size:13px;font-weight:600;margin-bottom:2px}.auth-feat-text p{font-size:11px;color:var(--t3);line-height:1.4}
.auth-form-side{width:400px;display:flex;align-items:center;justify-content:center;padding:40px;background:var(--bg1);border-left:1px solid var(--bdr)}
.auth-form{width:100%}
.auth-form h2{font-family:var(--f-display);font-size:26px;margin-bottom:4px}
.auth-form .sub{font-size:12px;color:var(--t3);margin-bottom:24px}
.auth-trust{display:flex;gap:16px;margin-top:20px;padding-top:16px;border-top:1px solid var(--bdr)}
.auth-trust-item{font-size:10px;color:var(--t3);display:flex;align-items:center;gap:4px}
.auth-trust-item b{color:var(--t2)}

/* ── DASHBOARD ── */
.dash{height:100vh;height:100dvh;display:flex;flex-direction:column}
.dash-hdr{background:var(--bg1);border-bottom:1px solid var(--bdr);padding:14px 28px;display:flex;align-items:center;justify-content:space-between}
.dash-hdr h1{font-family:var(--f-display);font-size:22px}.dash-hdr h1 em{color:var(--pri);font-style:italic}
.dash-user{display:flex;align-items:center;gap:10px;font-size:13px}
.dash-av{width:32px;height:32px;border-radius:8px;background:var(--bg3);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;color:var(--pri);border:1px solid var(--bdr)}
.dash-body{flex:1;overflow:auto;padding:28px}
.dash-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;max-width:960px;margin:0 auto}
.fam-card{background:var(--bg2);border:1px solid var(--bdr);border-radius:var(--r);padding:20px;cursor:pointer;transition:all .25s;position:relative;overflow:hidden}
.fam-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.3);border-color:var(--bdr2)}
.fam-card-bar{height:2px;background:linear-gradient(90deg,var(--pri),var(--acc));position:absolute;top:0;left:0;right:0}
.fam-card h3{font-family:var(--f-display);font-size:17px;margin-top:4px;margin-bottom:4px}
.fam-card p{font-size:12px;color:var(--t3);margin-bottom:12px}
.fam-card-stats{display:flex;gap:12px;font-size:11px;color:var(--t2)}
.fam-card-role{position:absolute;top:10px;right:12px;font-size:9px;padding:2px 7px;border-radius:6px;font-weight:600;text-transform:uppercase;font-family:var(--f-mono)}
.fam-new{border:2px dashed var(--bdr);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--t3);min-height:140px;transition:all .25s}
.fam-new:hover{border-color:var(--pri);color:var(--pri)}

/* ── WORKSPACE ── */
.ws-hdr{background:var(--bg1);border-bottom:1px solid var(--bdr);padding:10px 18px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;z-index:100;flex-shrink:0}
.ws-brand{display:flex;align-items:center;gap:8px}
.ws-brand h1{font-family:var(--f-display);font-size:16px;font-weight:400}
.ws-brand h1 em{color:var(--pri);font-style:italic}
.ws-tag{font-size:7px;font-family:var(--f-mono);background:var(--pri);color:#000;padding:1px 5px;border-radius:4px;font-weight:600;letter-spacing:.5px}
.ws-actions{display:flex;gap:6px;align-items:center;margin-left:auto;flex-wrap:wrap}

/* ── SHARED UI ── */
.btn{display:inline-flex;align-items:center;gap:5px;padding:6px 12px;border-radius:var(--rs);border:1px solid var(--bdr);background:var(--bg2);color:var(--t1);font-size:12px;font-weight:500;cursor:pointer;transition:all .2s;font-family:var(--f-body);white-space:nowrap}
.btn:hover{background:var(--bg3);border-color:var(--bdr2);transform:translateY(-1px)}
.btn-p{background:var(--pri);border-color:var(--pri);color:#000;font-weight:600}.btn-p:hover{background:var(--pri2)}
.btn-acc{background:var(--acc);border-color:var(--acc);color:#fff}.btn-acc:hover{opacity:.9}
.btn-d{background:#3f1219;border-color:#5f1d2d;color:#fca5a5}.btn-d:hover{background:#5f1d2d}
.btn-sm{padding:4px 8px;font-size:11px}.btn-icon{padding:5px;width:28px;height:28px;justify-content:center}
.btn-ghost{background:transparent;border-color:transparent}.btn-ghost:hover{background:var(--bg2)}
.btn-block{width:100%;justify-content:center;padding:10px}
.nav{display:flex;gap:1px;background:var(--bg0);border-radius:var(--rs);padding:2px;border:1px solid var(--bdr)}
.navt{padding:6px 11px;border-radius:5px;border:none;background:transparent;color:var(--t3);font-size:11px;font-weight:500;cursor:pointer;transition:all .2s;font-family:var(--f-body)}
.navt:hover{color:var(--t2)}.navt.on{background:var(--bg2);color:var(--pri);box-shadow:0 1px 6px rgba(0,0,0,.2)}
.sbox{display:flex;align-items:center;gap:6px;background:var(--bg2);border:1px solid var(--bdr);border-radius:var(--rs);padding:5px 10px;min-width:130px}
.sbox input{background:transparent;border:none;outline:none;color:var(--t1);font-size:11px;width:100%;font-family:var(--f-body)}.sbox input::placeholder{color:var(--t3)}
.fg{margin-bottom:14px}.fl{display:block;font-size:11px;font-weight:600;color:var(--t2);margin-bottom:5px}
.fi,.fsel,.fta{width:100%;padding:8px 12px;background:var(--bg2);border:1px solid var(--bdr);border-radius:var(--rs);color:var(--t1);font-size:13px;font-family:var(--f-body);outline:none;transition:border .2s}
.fi:focus,.fsel:focus,.fta:focus{border-color:var(--pri);box-shadow:0 0 0 2px rgba(20,184,166,.1)}.fta{resize:vertical;min-height:50px}
.fr{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.gtog{display:flex;gap:6px}
.gbtn{flex:1;padding:8px;border-radius:var(--rs);border:2px solid var(--bdr);background:var(--bg2);color:var(--t3);font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:5px;font-family:var(--f-body)}
.gbtn.am{border-color:var(--male-t);background:var(--male-bg);color:var(--male-t)}.gbtn.af{border-color:var(--fem-t);background:var(--fem-bg);color:var(--fem-t)}
.modal-ov{position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:200;padding:16px}
.modal{background:var(--bg1);border:1px solid var(--bdr);border-radius:12px;width:100%;max-width:480px;max-height:85vh;overflow-y:auto;box-shadow:0 16px 48px rgba(0,0,0,.5);animation:mUp .2s ease}
@keyframes mUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.m-hdr{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--bdr)}.m-hdr h2{font-family:var(--f-display);font-size:18px}
.m-body{padding:16px 20px}.m-ftr{padding:12px 20px;display:flex;gap:6px;justify-content:flex-end;border-top:1px solid var(--bdr)}

/* ── CANVAS ── */
.cvs{width:100%;height:100%;position:relative;overflow:hidden;background:var(--bg0);cursor:grab;touch-action:none}.cvs.grabbing{cursor:grabbing}
.cvs-inner{position:absolute;top:0;left:0;transform-origin:0 0}
.gl{position:absolute;left:0;right:0;pointer-events:none;z-index:1}
.gl-strip{position:absolute;left:0;top:0;bottom:0;width:52px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;z-index:2;padding:4px 2px;background:linear-gradient(90deg,rgba(7,9,14,.9) 60%,transparent)}
.gl-emoji{font-size:16px}.gl-title{font-size:7px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;text-align:center;max-width:44px;line-height:1.2}.gl-num{font-size:6px;opacity:.4;font-family:var(--f-mono)}
.gl-bg{position:absolute;left:0;right:0;top:0;bottom:0;opacity:.02;border-top:1px dashed;border-bottom:1px dashed}
.cc{position:absolute;width:150px;min-height:80px;background:var(--bg2);border:1.5px solid var(--bdr);border-radius:var(--r);cursor:grab;user-select:none;transition:box-shadow .2s;overflow:hidden;z-index:10}
.cc:hover{z-index:20;box-shadow:0 6px 24px rgba(0,0,0,.4)}.cc.dragging{z-index:50;box-shadow:0 10px 36px rgba(0,0,0,.5);opacity:.92;cursor:grabbing}.cc.selected{border-color:var(--pri);box-shadow:0 0 20px rgba(20,184,166,.12)}
.cc.male{border-color:var(--male-bdr)}.cc.female{border-color:var(--fem-bdr)}
.cc-bar{height:2px;width:100%}.cc.male .cc-bar{background:linear-gradient(90deg,var(--male-t),transparent)}.cc.female .cc-bar{background:linear-gradient(90deg,var(--fem-t),transparent)}
.cc-body{padding:7px 9px;display:flex;align-items:center;gap:8px}
.cc-av{width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;font-family:var(--f-display);flex-shrink:0}
.cc-av.male{background:var(--male-bg);color:var(--male-t);border:1px solid var(--male-bdr)}.cc-av.female{background:var(--fem-bg);color:var(--fem-t);border:1px solid var(--fem-bdr)}
.cc-info{min-width:0;flex:1}.cc-name{font-size:11px;font-weight:600;line-height:1.2;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.cc-meta{font-size:9px;color:var(--t3);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cc-gen{position:absolute;top:5px;right:5px;width:6px;height:6px;border-radius:50%}
.conn-svg{position:absolute;top:0;left:0;pointer-events:none;z-index:5}
.zm{position:absolute;bottom:14px;right:14px;display:flex;flex-direction:column;gap:3px;z-index:60}
.zm button{width:30px;height:30px;border-radius:var(--rs);border:1px solid var(--bdr);background:var(--bg2);color:var(--t1);font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:var(--f-body)}.zm button:hover{background:var(--bg3)}
.mm{position:absolute;bottom:14px;left:14px;width:150px;height:80px;background:var(--bg1);border:1px solid var(--bdr);border-radius:var(--rs);overflow:hidden;z-index:60;opacity:.7}.mm:hover{opacity:1}

/* ── SIDEBAR ── */
.sb{position:absolute;top:0;right:0;bottom:0;width:310px;background:var(--bg1);border-left:1px solid var(--bdr);z-index:80;overflow-y:auto;animation:sIn .2s ease}
@keyframes sIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
.sb-h{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid var(--bdr)}.sb-h h3{font-family:var(--f-display);font-size:15px}
.sb-b{padding:14px 16px}
.sb-av{width:56px;height:56px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;font-size:22px;font-weight:700;font-family:var(--f-display)}
.sb-av.male{background:var(--male-bg);color:var(--male-t);border:2px solid var(--male-bdr)}.sb-av.female{background:var(--fem-bg);color:var(--fem-t);border:2px solid var(--fem-bdr)}
.sb-nm{text-align:center;font-family:var(--f-display);font-size:17px;margin-bottom:2px}
.sb-sub{text-align:center;font-size:10px;color:var(--t3);margin-bottom:6px}
.sb-ctx{text-align:center;font-size:9px;color:var(--t3);margin-bottom:14px;padding:5px 8px;background:var(--bg2);border-radius:var(--rs)}
.sb-sec{margin-bottom:14px}.sb-sec-t{font-size:9px;font-weight:700;color:var(--t3);letter-spacing:.8px;text-transform:uppercase;margin-bottom:7px;padding-bottom:4px;border-bottom:1px solid var(--bdr)}
.sb-row{display:flex;justify-content:space-between;padding:3px 0;font-size:11px}.sb-row-l{color:var(--t3)}.sb-row-v{font-weight:500;text-align:right;max-width:170px}
.sb-rel{display:flex;align-items:center;gap:7px;padding:6px 9px;background:var(--bg2);border-radius:var(--rs);cursor:pointer;transition:all .15s;font-size:11px;margin-bottom:3px}.sb-rel:hover{background:var(--bg3)}
.sb-rel-t{font-size:8px;color:var(--t3);font-weight:600;letter-spacing:.3px;text-transform:uppercase;min-width:52px;font-family:var(--f-mono)}
.sb-ft{padding:10px 16px;border-top:1px solid var(--bdr);display:flex;gap:5px;justify-content:flex-end}

/* ── MAP ── */
.map-w{width:100%;height:100%;position:relative}.map-c{width:100%;height:100%}
.map-leg{position:absolute;top:10px;right:10px;background:var(--bg1);border:1px solid var(--bdr);border-radius:var(--r);padding:10px 12px;z-index:1000;min-width:150px}
.map-leg-t{font-size:9px;font-weight:700;color:var(--t3);letter-spacing:.8px;text-transform:uppercase;margin-bottom:6px;font-family:var(--f-mono)}
.map-leg-i{display:flex;align-items:center;gap:7px;font-size:10px;margin-bottom:3px;color:var(--t2);cursor:pointer}
.map-leg-d{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.map-bar{position:absolute;bottom:10px;left:10px;right:10px;display:flex;gap:5px;z-index:1000;flex-wrap:wrap}
.map-st{background:var(--bg1);border:1px solid var(--bdr);border-radius:var(--rs);padding:4px 7px;font-size:9px;color:var(--t2);display:flex;align-items:center;gap:3px;font-family:var(--f-mono)}.map-st b{color:var(--t1)}
.map-popup{font-family:var(--f-body)}.map-popup-nm{font-family:var(--f-display);font-size:14px;margin-bottom:3px}.map-popup-mt{font-size:11px;color:#666;line-height:1.4}
.leaflet-popup-content-wrapper{border-radius:8px!important}

/* ── LIST/STATS/TIMELINE ── */
.lv{display:flex;flex-direction:column;gap:5px;max-width:800px;margin:0 auto;padding:16px}
.li{display:flex;align-items:center;gap:10px;background:var(--bg2);border:1px solid var(--bdr);border-radius:var(--r);padding:9px 12px;cursor:pointer;transition:all .2s}.li:hover{background:var(--bg3);transform:translateX(2px)}
.li-av{width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex-shrink:0;font-family:var(--f-display)}.li-av.male{background:var(--male-bg);color:var(--male-t)}.li-av.female{background:var(--fem-bg);color:var(--fem-t)}
.li-info{flex:1;min-width:0}.li-info h4{font-size:12px;font-weight:600}.li-info p{font-size:10px;color:var(--t3)}
.li-badge{font-size:8px;padding:2px 6px;border-radius:4px;font-weight:600;font-family:var(--f-mono)}
.sg{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;max-width:800px;margin:0 auto;padding:16px}
.sc{background:var(--bg2);border:1px solid var(--bdr);border-radius:var(--r);padding:14px;text-align:center;transition:all .2s}.sc:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(0,0,0,.25)}
.sc-v{font-family:var(--f-display);font-size:28px}.sc-l{font-size:9px;color:var(--t3);font-weight:500;letter-spacing:.5px;text-transform:uppercase;margin-top:2px;font-family:var(--f-mono)}
.tl{max-width:600px;margin:0 auto;padding:16px 16px 16px 44px;position:relative}.tl::before{content:'';position:absolute;left:22px;top:16px;bottom:16px;width:1.5px;background:var(--bdr)}
.tl-i{position:relative;margin-bottom:12px;padding:10px 12px;background:var(--bg2);border:1px solid var(--bdr);border-radius:var(--r);cursor:pointer;transition:all .2s}.tl-i:hover{background:var(--bg3);transform:translateX(2px)}
.tl-dot{width:8px;height:8px;border-radius:50%;position:absolute;left:-28px;top:14px;border:2px solid var(--bg0)}
.tl-yr{font-size:9px;color:var(--pri);font-weight:600;margin-bottom:1px;font-family:var(--f-mono)}.tl-tt{font-size:12px;font-weight:600}

/* ── INSIGHTS ── */
.ins{padding:16px;max-width:880px;margin:0 auto;overflow:auto;height:100%}
.ins-g{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.ins-c{background:var(--bg2);border:1px solid var(--bdr);border-radius:var(--r);padding:14px;transition:all .2s}.ins-c:hover{border-color:var(--bdr2)}
.ins-cf{grid-column:1/-1}
.ins-c h3{font-family:var(--f-display);font-size:14px;margin-bottom:10px;display:flex;align-items:center;gap:7px}.ins-c h3 span{font-size:16px}
.rf-sel{display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap}.rf-sel select{flex:1;min-width:110px}
.rf-res{background:var(--bg3);border-radius:var(--rs);padding:10px 14px;text-align:center}
.rf-res-l{font-family:var(--f-display);font-size:18px;margin-bottom:3px}
.rf-res-p{font-size:10px;color:var(--t3);display:flex;align-items:center;justify-content:center;gap:5px;flex-wrap:wrap;margin-top:6px}
.rf-node{background:var(--bg2);padding:2px 7px;border-radius:10px;font-size:9px;font-weight:600}.rf-arrow{color:var(--pri);font-weight:700}
.bd-i{display:flex;align-items:center;gap:8px;padding:7px 8px;background:var(--bg3);border-radius:var(--rs);margin-bottom:5px}
.bd-d{min-width:44px;text-align:center;font-size:9px;font-weight:700;border-radius:4px;padding:3px 5px;font-family:var(--f-mono)}
.bd-info{flex:1;font-size:11px}.bd-info span{color:var(--t3);font-size:9px}
.st-entry{background:var(--bg3);border-radius:var(--rs);padding:9px 11px;margin-bottom:6px}
.st-date{font-size:8px;color:var(--t3);font-family:var(--f-mono)}.st-text{font-size:11px;line-height:1.5;color:var(--t2);margin-top:2px}.st-author{font-size:8px;color:var(--pri);margin-top:3px}
.gb{display:flex;border-radius:20px;overflow:hidden;height:8px;margin-bottom:6px}
.gb-leg{display:flex;flex-wrap:wrap;gap:6px;font-size:9px;color:var(--t2)}.gb-leg-i{display:flex;align-items:center;gap:3px}.gb-leg-d{width:6px;height:6px;border-radius:50%}
.fbar{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px;padding:8px 12px;background:var(--bg2);border:1px solid var(--bdr);border-radius:var(--r)}
.fbar select{padding:4px 7px;background:var(--bg3);border:1px solid var(--bdr);border-radius:4px;color:var(--t1);font-size:10px;font-family:var(--f-body);outline:none}.fbar select:focus{border-color:var(--pri)}
.fbar label{font-size:9px;color:var(--t3);display:flex;flex-direction:column;gap:2px}
.ftag{display:inline-flex;align-items:center;gap:2px;padding:2px 7px;background:var(--pri);color:#000;border-radius:10px;font-size:9px;font-weight:600;cursor:pointer}
.empty{text-align:center;padding:48px 16px;color:var(--t3)}.empty h3{font-family:var(--f-display);font-size:18px;color:var(--t2);margin-bottom:4px}.empty p{font-size:12px;margin-bottom:14px}
.toast{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:var(--bg2);border:1px solid var(--pri);color:var(--pri);padding:8px 16px;border-radius:var(--r);font-size:11px;font-weight:500;box-shadow:0 6px 24px rgba(0,0,0,.4);z-index:300;animation:mUp .2s ease,fadeO .3s ease 2.5s forwards}
@keyframes fadeO{to{opacity:0}}

/* Geo */
.geo-w{background:var(--bg3);border:1px solid var(--bdr);border-radius:var(--rs);padding:8px 10px;margin-top:5px}
.geo-r{display:flex;gap:5px;align-items:center;margin-bottom:5px}.geo-r:last-child{margin-bottom:0}
.geo-l{font-size:8px;color:var(--t3);min-width:24px;font-weight:600;font-family:var(--f-mono)}
.geo-w input{flex:1;padding:4px 7px;background:var(--bg2);border:1px solid var(--bdr);border-radius:4px;color:var(--t1);font-size:10px;font-family:var(--f-body);outline:none}.geo-w input:focus{border-color:var(--pri)}
.geo-res{background:var(--bg2);border:1px solid var(--bdr);border-radius:4px;margin-top:3px;max-height:90px;overflow-y:auto}
.geo-ri{padding:4px 7px;font-size:9px;cursor:pointer;color:var(--t2);border-bottom:1px solid var(--bdr);transition:all .15s}.geo-ri:hover{background:var(--bg3);color:var(--t1)}.geo-ri:last-child{border-bottom:none}

/* Collab */
.collab-i{display:flex;align-items:center;gap:8px;padding:7px 9px;background:var(--bg2);border-radius:var(--rs);margin-bottom:5px;font-size:11px}
.collab-av{width:26px;height:26px;border-radius:6px;background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:var(--pri);border:1px solid var(--bdr)}
.collab-info{flex:1}.collab-info span{display:block;font-size:9px;color:var(--t3)}
.collab-role{font-size:8px;padding:2px 5px;border-radius:4px;font-weight:600;font-family:var(--f-mono)}

::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:var(--bg0)}::-webkit-scrollbar-thumb{background:var(--bdr);border-radius:2px}
/* Admin */
.admin-badge{background:var(--acc);color:#fff;font-size:9px;padding:3px 8px;border-radius:10px;font-weight:700;letter-spacing:.5px}
.admin-panel{padding:24px;max-width:1100px;margin:0 auto}
.admin-tabs{display:flex;gap:4px;margin-bottom:20px}
.admin-tab{padding:8px 16px;border-radius:var(--rs);font-size:12px;font-weight:600;background:transparent;border:1px solid var(--bdr);color:var(--t2);cursor:pointer;transition:all .15s}
.admin-tab.on{background:var(--acc);color:#fff;border-color:var(--acc)}
.admin-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
.admin-stat{padding:20px;border-radius:var(--r);background:var(--bg2);border:1px solid var(--bdr)}
.admin-stat h4{font-size:10px;color:var(--t3);text-transform:uppercase;letter-spacing:.5px;margin:0}
.admin-val{font-family:var(--f-display);font-size:32px;margin-top:6px}
.admin-table{width:100%;border-collapse:collapse;font-size:12px}
.admin-table th{text-align:left;padding:10px;color:var(--t3);font-size:10px;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid var(--bdr)}
.admin-table td{padding:10px;border-bottom:1px solid var(--bdr)}
.admin-table tr:hover{background:var(--bg2)}
.role-badge{padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600;display:inline-block}
.role-super_admin{background:#7c3aed22;color:#a78bfa}
.role-admin{background:#6366f122;color:#818cf8}
.role-user{background:var(--bg3);color:var(--t2)}
/* Theme toggle */
.theme-btn{width:32px;height:32px;border-radius:var(--rs);border:1px solid var(--bdr);background:var(--bg2);color:var(--t2);font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0;padding:0}
.theme-btn:hover{background:var(--bg3);border-color:var(--bdr2);transform:translateY(-1px)}
[data-theme="light"] .auth-hero{background:linear-gradient(160deg,#eef2f7 0%,#e4eaf2 50%,#dce4ef 100%)}
[data-theme="light"] .auth-hero::before{background:radial-gradient(circle,rgba(13,148,136,.06) 0%,transparent 70%)}
[data-theme="light"] .auth-hero::after{background:radial-gradient(circle,rgba(79,70,229,.04) 0%,transparent 70%)}
[data-theme="light"] .cc{box-shadow:0 1px 4px rgba(0,0,0,.08)}
[data-theme="light"] .cc:hover{box-shadow:0 4px 16px rgba(0,0,0,.12)}
[data-theme="light"] .fam-card{box-shadow:0 1px 4px rgba(0,0,0,.06)}
[data-theme="light"] .fam-card:hover{box-shadow:0 6px 20px rgba(0,0,0,.1)}
[data-theme="light"] .modal{box-shadow:0 16px 48px rgba(0,0,0,.15)}
[data-theme="light"] .toast{box-shadow:0 4px 16px rgba(0,0,0,.12)}
[data-theme="light"] .map-popup-mt{color:#555}
[data-theme="light"] .leaflet-popup-content-wrapper{background:#fff!important;color:#1a1d23!important}
/* Dev Footer */
.dev-footer{padding:16px 20px;border-top:1px solid var(--bdr);text-align:center;font-size:10px;color:var(--t3);line-height:1.8;flex-shrink:0}
.dev-footer a{color:var(--pri);text-decoration:none}.dev-footer a:hover{text-decoration:underline}
.dev-footer .dev-name{font-weight:600;color:var(--t2)}
.dev-footer .dev-org{color:var(--acc)}
.dev-footer .dev-ver{font-family:var(--f-mono);font-size:9px;color:var(--t3);margin-top:2px}
/* Faraidh */
.far-w{padding:16px;max-width:700px;margin:0 auto}
.far-sel{display:flex;gap:8px;align-items:center;margin-bottom:16px;flex-wrap:wrap}
.far-heirs{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:16px}
.far-heir{display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--bg2);border:1px solid var(--bdr);border-radius:var(--rs)}
.far-heir label{flex:1;font-size:11px;font-weight:500}
.far-heir input{width:52px;padding:3px 6px;background:var(--bg3);border:1px solid var(--bdr);border-radius:4px;color:var(--t1);font-size:12px;text-align:center;font-family:var(--f-mono)}
.far-res{margin-top:16px}
.far-table{width:100%;border-collapse:collapse;font-size:12px}
.far-table th{text-align:left;padding:8px;color:var(--t3);font-size:9px;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid var(--bdr)}
.far-table td{padding:8px;border-bottom:1px solid var(--bdr)}
.far-total{display:flex;gap:8px;align-items:center;margin-bottom:16px}
.far-total input{flex:1;max-width:200px}
.far-type{font-size:8px;padding:1px 5px;border-radius:3px;font-weight:600;font-family:var(--f-mono)}
.far-type.fardh{background:#14b8a622;color:#14b8a6}
.far-type.asabah{background:#f59e0b22;color:#f59e0b}
/* NIK */
.nik-w{display:flex;gap:5px;align-items:center;flex-wrap:wrap}
.nik-fill{font-size:9px;padding:2px 7px;border-radius:4px;background:var(--pri);color:#000;cursor:pointer;font-weight:600;white-space:nowrap}
.nik-fill:hover{opacity:.85}
.nik-info{font-size:9px;color:var(--t3);margin-top:3px;line-height:1.5}
.nik-info b{color:var(--pri)}
.nik-masked{font-family:var(--f-mono);font-size:10px;color:var(--t2);letter-spacing:.5px}
/* ── RESPONSIVE: Tablet (≤1024px) ── */
@media(max-width:1024px){
  .auth-hero{padding:40px}
  .auth-form-side{width:360px;padding:30px}
  .auth-brand h1{font-size:40px}
  .dash-body{padding:20px}
  .ins-g{grid-template-columns:1fr 1fr}
  .admin-stats{grid-template-columns:repeat(2,1fr)}
  .admin-panel{padding:16px}
  .sb{width:280px}
  .map-leg{min-width:120px;padding:8px 10px}
}
/* ── RESPONSIVE: Mobile landscape / small tablet (≤768px) ── */
@media(max-width:768px){
  .auth-wrap{flex-direction:column;overflow-y:auto}
  .auth-hero{padding:24px 20px;flex:none}
  .auth-brand{margin-bottom:20px}
  .auth-brand h1{font-size:36px}
  .auth-brand p{font-size:13px}
  .auth-features{gap:10px;margin-top:4px}
  .auth-feat{padding:10px 12px}
  .auth-feat-icon{width:30px;height:30px;font-size:14px}
  .auth-feat-text h4{font-size:12px}.auth-feat-text p{font-size:10px}
  .auth-form-side{width:100%;border-left:none;border-top:1px solid var(--bdr);padding:24px 20px}
  .auth-form h2{font-size:22px}
  .auth-trust{gap:10px;flex-wrap:wrap}
  .dash-hdr{padding:10px 16px;flex-wrap:wrap;gap:8px}
  .dash-hdr h1{font-size:18px}
  .dash-user{font-size:12px;gap:6px}
  .dash-body{padding:16px}
  .dash-grid{grid-template-columns:1fr}
  .fam-card{padding:16px}
  .fam-card h3{font-size:15px}
  .ws-hdr{padding:8px 12px;gap:8px}
  .ws-brand h1{font-size:14px}
  .ws-brand span{font-size:10px!important}
  .nav{overflow-x:auto;flex-shrink:0;-webkit-overflow-scrolling:touch;scrollbar-width:none}
  .nav::-webkit-scrollbar{display:none}
  .navt{padding:5px 8px;font-size:10px;white-space:nowrap}
  .ws-actions{gap:4px}
  .sbox{min-width:100px;padding:4px 8px}
  .sbox input{font-size:10px}
  .sb{width:100%;max-width:100%}
  .sb-nm{font-size:15px}
  .sb-row-v{max-width:140px;font-size:10px}
  .fr{grid-template-columns:1fr}
  .ins{padding:12px}
  .ins-g{grid-template-columns:1fr}
  .ins-c h3{font-size:13px}
  .sg{grid-template-columns:repeat(2,1fr);gap:8px;padding:12px}
  .sc{padding:10px}
  .sc-v{font-size:22px}
  .lv{padding:12px}
  .li{padding:8px 10px}
  .tl{padding:12px 12px 12px 36px}.tl::before{left:16px}
  .tl-dot{left:-24px}
  .modal{max-width:calc(100vw - 24px);max-height:90vh;border-radius:10px}
  .m-hdr{padding:12px 16px}.m-hdr h2{font-size:16px}
  .m-body{padding:12px 16px}
  .m-ftr{padding:10px 16px}
  .map-leg{top:auto;bottom:50px;right:8px;left:8px;display:flex;gap:8px;flex-wrap:wrap;padding:8px;min-width:0}
  .map-leg-t{width:100%}
  .map-bar{bottom:8px;left:8px;right:8px}
  .admin-stats{grid-template-columns:repeat(2,1fr);gap:8px}
  .admin-stat{padding:12px}
  .admin-val{font-size:24px}
  .admin-tabs{flex-wrap:wrap;gap:3px}
  .admin-tab{padding:6px 12px;font-size:11px}
  .admin-table{font-size:11px}
  .admin-table th,.admin-table td{padding:8px 6px}
  .far-heirs{grid-template-columns:1fr}
  .far-table{font-size:11px}
  .far-table th,.far-table td{padding:6px 4px}
  .far-total{flex-wrap:wrap}
  .fbar{gap:4px;padding:6px 10px}
  .fbar select{font-size:9px;padding:3px 5px}
  .fbar label{font-size:8px}
  .mm{width:100px;height:55px;bottom:10px;left:10px}
  .zm{bottom:10px;right:10px}
  .zm button{width:26px;height:26px;font-size:13px}
  .geo-w{padding:6px 8px}
}
/* ── RESPONSIVE: Small mobile (≤480px) ── */
@media(max-width:480px){
  .auth-hero{padding:20px 16px}
  .auth-brand h1{font-size:28px}
  .auth-brand p{font-size:12px}
  .auth-features{display:none}
  .auth-form-side{padding:20px 16px}
  .auth-form h2{font-size:20px}
  .auth-form .sub{font-size:11px;margin-bottom:16px}
  .fi,.fsel,.fta{font-size:12px;padding:7px 10px}
  .btn-block{padding:9px;font-size:12px}
  .dash-hdr{padding:8px 12px}
  .dash-hdr h1{font-size:16px}
  .dash-user{gap:4px;font-size:11px}
  .dash-user b{max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:inline-block;vertical-align:middle}
  .dash-av{width:28px;height:28px;font-size:10px}
  .dash-body{padding:12px}
  .fam-card{padding:14px}
  .fam-card h3{font-size:14px}
  .fam-card p{font-size:11px}
  .fam-card-stats{font-size:10px}
  .fam-new{min-height:100px}
  .ws-hdr{padding:6px 8px;gap:6px}
  .ws-brand{gap:4px}
  .ws-brand h1{font-size:13px}
  .ws-tag{font-size:6px;padding:1px 4px}
  .nav{padding:1px}
  .navt{padding:4px 6px;font-size:9px}
  .ws-actions{gap:3px}
  .sbox{min-width:80px;padding:3px 6px}
  .btn-sm{padding:3px 6px;font-size:10px}
  .sb{z-index:90}
  .sb-h{padding:10px 12px}
  .sb-b{padding:10px 12px}
  .sb-av{width:44px;height:44px;font-size:18px}
  .sb-nm{font-size:14px}
  .sb-sub{font-size:9px}
  .sb-row{font-size:10px}
  .sb-row-v{max-width:120px;font-size:9px}
  .sb-rel{padding:5px 7px;font-size:10px}
  .sb-ft{padding:8px 12px}
  .sg{grid-template-columns:repeat(2,1fr);gap:6px;padding:10px}
  .sc{padding:8px}
  .sc-v{font-size:18px}
  .sc-l{font-size:8px}
  .ins{padding:10px}
  .ins-c{padding:10px}
  .rf-sel{gap:4px}
  .rf-sel select{min-width:0;font-size:10px}
  .lv{padding:10px}
  .li{gap:8px;padding:7px 8px}
  .li-av{width:28px;height:28px;font-size:10px;border-radius:6px}
  .li-info h4{font-size:11px}
  .li-info p{font-size:9px}
  .li-badge{font-size:7px;padding:2px 4px}
  .tl{padding:10px 10px 10px 30px}.tl::before{left:12px}
  .tl-dot{left:-22px;width:6px;height:6px}
  .tl-i{padding:8px 10px}
  .tl-yr{font-size:8px}.tl-tt{font-size:11px}
  .modal-ov{padding:8px;align-items:flex-end}
  .modal{max-width:100%;max-height:92vh;border-radius:12px 12px 0 0}
  .modal .m-body{max-height:65vh;overflow-y:auto}
  .admin-panel{padding:10px}
  .admin-stats{grid-template-columns:1fr 1fr;gap:6px}
  .admin-stat{padding:10px}
  .admin-val{font-size:20px}
  .admin-table th,.admin-table td{padding:6px 4px;font-size:10px}
  .far-sel{flex-direction:column;align-items:stretch}
  .far-total{flex-direction:column;align-items:stretch}
  .far-total input{max-width:100%}
  .far-table th,.far-table td{padding:5px 3px;font-size:10px}
  .far-type{font-size:7px}
  .map-leg{flex-direction:row;gap:6px;font-size:9px}
  .map-leg-t{width:auto;margin-right:auto}
  .mm{width:80px;height:44px;bottom:8px;left:8px}
  .zm{bottom:8px;right:8px}
  .zm button{width:24px;height:24px;font-size:12px}
  .collab-i{padding:6px 8px;font-size:10px}
  .collab-av{width:22px;height:22px;font-size:8px}
  .fbar{padding:5px 8px;gap:3px}
  .st-entry{padding:7px 9px}
  .st-text{font-size:10px}
  .bd-i{padding:5px 6px;gap:6px}
  .bd-d{min-width:36px;font-size:8px;padding:2px 4px}
  .bd-info{font-size:10px}
}
/* ── RESPONSIVE: Very small (≤360px) ── */
@media(max-width:360px){
  .auth-brand h1{font-size:24px}
  .ws-brand span:not(h1){display:none}
  .navt{padding:3px 5px;font-size:8px}
  .btn-sm{padding:2px 5px;font-size:9px}
  .sg{grid-template-columns:1fr}
  .admin-stats{grid-template-columns:1fr}
}
/* ── Touch / safe areas ── */
@supports(padding:env(safe-area-inset-bottom)){
  .ws-hdr{padding-left:max(8px,env(safe-area-inset-left));padding-right:max(8px,env(safe-area-inset-right))}
  .dash-hdr{padding-left:max(14px,env(safe-area-inset-left));padding-right:max(14px,env(safe-area-inset-right))}
  .sb-ft{padding-bottom:max(10px,env(safe-area-inset-bottom))}
  .modal{padding-bottom:env(safe-area-inset-bottom)}
  .toast{bottom:max(16px,env(safe-area-inset-bottom))}
}
/* ── Landscape mobile ── */
@media(max-height:500px) and (orientation:landscape){
  .auth-wrap{flex-direction:row}
  .auth-hero{padding:16px 20px;overflow-y:auto}
  .auth-features{display:none}
  .auth-form-side{width:320px;padding:16px;border-left:1px solid var(--bdr);border-top:none}
  .auth-brand{margin-bottom:10px}
  .auth-brand h1{font-size:28px}
  .modal-ov{align-items:center}
  .modal{max-height:90vh;border-radius:10px}
  .sb{width:260px}
}
`;

// ─── ICONS ───────────────────────────────────────────────────
const Ic={
  Male:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10" cy="14" r="5"/><path d="M19 5l-5.4 5.4M19 5h-5M19 5v5"/></svg>,
  Female:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="10" r="5"/><path d="M12 15v7M9 19h6"/></svg>,
  Plus:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>,
  X:()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  Search:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
  Edit:()=><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Trash:()=><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  DL:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>,
  Fit:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>,
  Share:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>,
  Back:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
};
const ini=n=>n.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
function DevFooter(){return(<div className="dev-footer"><span className="dev-name">{APP.developer.name}</span> — {APP.developer.role} · <span className="dev-org">{APP.developer.org}</span><div className="dev-ver">{APP.name} v{APP.version} · Build {APP.build}</div></div>)}

// ═══════════════════════════════════════════════════════════════
// AUTH — Landing Page + Login/Register
// ═══════════════════════════════════════════════════════════════
function AuthScreen({onLogin}){
  const [mode,setMode]=useState("login");const [name,setName]=useState("");const [email,setEmail]=useState("");const [pw,setPw]=useState("");const [err,setErr]=useState("");const [msg,setMsg]=useState("");const [busy,setBusy]=useState(false);
  const go=async()=>{setErr("");setMsg("");setBusy(true);try{if(mode==="forgot"){if(!email.trim()||!name.trim()||!pw.trim()){setErr("Semua field wajib diisi");setBusy(false);return}const r=await API.resetPassword({email,name,new_password:pw});setMsg(r.message);setMode("login");setPw("");setBusy(false);return}if(mode==="register"){if(!name.trim()||!email.trim()||!pw.trim()){setErr("Semua field wajib diisi");setBusy(false);return}onLogin(await API.register({name,email,password:pw}))}else{onLogin(await API.login({email,password:pw}))}}catch(e){setErr(e.message)}setBusy(false)};
  return(
    <div className="auth-wrap">
      <div className="auth-hero">
        <div className="auth-brand">
          <h1>NAS<em>AB</em></h1>
          <p>Jaga Nasabmu — Platform Silsilah Keluarga Modern</p>
        </div>
        <div className="auth-features">
          {[{icon:"🌳",h:"Drag & Drop Canvas",p:"Atur pohon keluarga dengan canvas interaktif, auto-connectors cerdas"},
            {icon:"🗺️",h:"Geotagging",p:"Petakan lokasi keluarga di seluruh Indonesia dengan peta interaktif"},
            {icon:"🔍",h:"Relationship Finder",p:"Temukan hubungan antar anggota keluarga secara otomatis dengan AI pathfinding"},
            {icon:"👥",h:"Multi-Tenant Collaboration",p:"Undang keluarga untuk berkolaborasi dengan RBAC (Owner, Editor, Viewer)"},
            {icon:"📖",h:"Family Stories",p:"Abadikan cerita & warisan keluarga untuk generasi berikutnya"},
          ].map((f,i)=>(
            <div key={i} className="auth-feat" style={{animationDelay:`${i*0.1}s`}}>
              <div className="auth-feat-icon">{f.icon}</div>
              <div className="auth-feat-text"><h4>{f.h}</h4><p>{f.p}</p></div>
            </div>
          ))}
        </div>
      </div>
      <div className="auth-form-side">
        <div className="auth-form">
          <h2>{mode==="login"?"Masuk":mode==="register"?"Daftar":"Reset Password"}</h2>
          <div className="sub">{mode==="login"?"Masuk ke akun NASAB Anda":mode==="register"?"Buat akun gratis — tanpa batas":"Masukkan email, nama terdaftar, dan password baru"}</div>
          {err&&<div style={{background:"#3f1219",border:"1px solid #5f1d2d",color:"#fca5a5",padding:"7px 10px",borderRadius:6,fontSize:11,marginBottom:12}}>{err}</div>}
          {msg&&<div style={{background:"#132f1e",border:"1px solid #1d5f2d",color:"#86efac",padding:"7px 10px",borderRadius:6,fontSize:11,marginBottom:12}}>{msg}</div>}
          {(mode==="register"||mode==="forgot")&&<div className="fg"><label className="fl">Nama</label><input className="fi" value={name} onChange={e=>setName(e.target.value)} placeholder={mode==="forgot"?"Nama sesuai akun terdaftar":"Nama lengkap"}/></div>}
          <div className="fg"><label className="fl">Email</label><input className="fi" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nama@email.com" onKeyDown={e=>e.key==="Enter"&&go()}/></div>
          <div className="fg"><label className="fl">{mode==="forgot"?"Password Baru":"Password"}</label><input className="fi" type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&go()}/></div>
          <button className="btn btn-p btn-block" onClick={go} disabled={busy} style={{marginTop:6}}>{busy?"Memproses...":(mode==="login"?"Masuk →":mode==="register"?"Buat Akun →":"Reset Password →")}</button>
          {mode==="login"&&<div style={{textAlign:"center",marginTop:8,fontSize:11}}><span style={{color:"var(--pri)",cursor:"pointer"}} onClick={()=>{setMode("forgot");setErr("");setMsg("")}}>Lupa Password?</span></div>}
          <div style={{textAlign:"center",marginTop:12,fontSize:11,color:"var(--t3)"}}>
            {mode==="login"?<>Belum punya akun? <span style={{color:"var(--pri)",cursor:"pointer",fontWeight:600}} onClick={()=>{setMode("register");setErr("");setMsg("")}}>Daftar Gratis</span></>
            :<>Sudah punya akun? <span style={{color:"var(--pri)",cursor:"pointer",fontWeight:600}} onClick={()=>{setMode("login");setErr("");setMsg("")}}>Masuk</span></>}
          </div>
          <div className="auth-trust">
            <div className="auth-trust-item">🔒 <b>Enkripsi</b></div>
            <div className="auth-trust-item">☁️ <b>Cloud Sync</b></div>
            <div className="auth-trust-item">🇮🇩 <b>Indonesia-first</b></div>
            <ThemeBtn/>
          </div>
          <DevFooter/>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ADMIN PANEL
// ═══════════════════════════════════════════════════════════════
function AdminPanel({user,onBack,onSelectFamily}){
  const[tab,setTab]=useState("stats");const[stats,setStats]=useState(null);const[users,setUsers]=useState([]);const[families,setFamilies]=useState([]);const[loading,setLoading]=useState(true);
  const load=async()=>{setLoading(true);try{if(tab==="stats"){const d=await API.adminStats();setStats(d.stats)}else if(tab==="users"){setUsers(await API.adminUsers())}else{setFamilies(await API.adminFamilies())}}catch{}setLoading(false)};
  useEffect(()=>{load()},[tab]);
  const changeRole=async(uid,role)=>{try{await API.setUserRole(uid,role);load()}catch(e){alert(e.message)}};
  const delUser=async uid=>{if(!confirm("Hapus user ini?"))return;try{await API.deleteUser(uid);load()}catch(e){alert(e.message)}};
  const isSA=user.role==="super_admin";
  return(<div className="dash"><header className="dash-hdr"><h1>NAS<em>AB</em></h1><div className="dash-user"><span className="admin-badge">{user.role==="super_admin"?"SUPER ADMIN":"ADMIN"}</span><b>{user.name}</b><ThemeBtn/><button className="btn btn-sm btn-ghost" onClick={onBack}><Ic.Back/> Dashboard</button></div></header>
    <div className="admin-panel"><div className="admin-tabs">{[{id:"stats",l:"Statistik"},{id:"users",l:"Users"},{id:"families",l:"Families"}].map(t=><button key={t.id} className={`admin-tab ${tab===t.id?"on":""}`} onClick={()=>setTab(t.id)}>{t.l}</button>)}</div>
    {loading?<div style={{textAlign:"center",padding:40,color:"var(--t3)"}}>Loading...</div>:
    tab==="stats"&&stats?<div className="admin-stats">{[{l:"Total Users",v:stats.totalUsers,c:"var(--acc)"},{l:"Total Families",v:stats.totalFamilies,c:"var(--pri)"},{l:"Total Members",v:stats.totalMembers,c:"var(--warn)"},{l:"Total Stories",v:stats.totalStories,c:"var(--orange)"}].map((s,i)=><div key={i} className="admin-stat"><h4>{s.l}</h4><div className="admin-val" style={{color:s.c}}>{s.v}</div></div>)}</div>:
    tab==="users"?<table className="admin-table"><thead><tr><th>Nama</th><th>Email</th><th>Role</th><th>Families</th><th>Joined</th>{isSA&&<th>Aksi</th>}</tr></thead><tbody>{users.map(u=><tr key={u.id}><td style={{fontWeight:600}}>{u.name}</td><td style={{color:"var(--t3)"}}>{u.email}</td><td>{u.id===user.id?<span className={`role-badge role-${u.role}`}>{u.role}</span>:<select className="fsel" value={u.role} onChange={e=>changeRole(u.id,e.target.value)} style={{fontSize:11,padding:"2px 6px"}}><option value="user">user</option>{isSA&&<option value="admin">admin</option>}{isSA&&<option value="super_admin">super_admin</option>}</select>}</td><td>{u.familyCount}</td><td style={{fontSize:10,color:"var(--t3)"}}>{u.created_at?new Date(u.created_at).toLocaleDateString("id-ID"):"-"}</td>{isSA&&<td>{u.id!==user.id&&<button className="btn btn-d btn-sm" onClick={()=>delUser(u.id)} style={{fontSize:9,padding:"2px 8px"}}>Hapus</button>}</td>}</tr>)}</tbody></table>:
    tab==="families"?<table className="admin-table"><thead><tr><th>Nama</th><th>Owner</th><th>Members</th><th>Collaborators</th><th>Created</th><th>Aksi</th></tr></thead><tbody>{families.map(f=><tr key={f.id}><td style={{fontWeight:600}}>{f.name}</td><td>{f.owner_name}</td><td>{f.memberCount}</td><td>{f.collabCount}</td><td style={{fontSize:10,color:"var(--t3)"}}>{f.created_at?new Date(f.created_at).toLocaleDateString("id-ID"):"-"}</td><td><button className="btn btn-sm" onClick={async()=>{try{const full=await API.getFamily(f.id);onSelectFamily(full)}catch(e){alert(e.message)}}} style={{fontSize:9,padding:"2px 8px"}}>Buka</button></td></tr>)}</tbody></table>:null}
    </div></div>);
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════
function Dashboard({user,onSelectFamily,onLogout,onCreateFamily,onAdmin}){
  const [fams,setFams]=useState([]);const [show,setShow]=useState(false);const [nn,setNn]=useState("");const [nd,setNd]=useState("");const[opening,setOpening]=useState(null);
  const prefetch=useRef({});
  useEffect(()=>{(async()=>{try{setFams(await API.getFamilies())}catch{}})()},[user]);
  const create=async()=>{if(!nn.trim())return;try{const f=await API.createFamily({name:nn,description:nd});const full=await API.getFamily(f.id);onCreateFamily(user,full);setShow(false);setNn("");setNd("")}catch(e){alert(e.message)}};
  const openFam=async f=>{setOpening(f.id);try{const full=prefetch.current[f.id]?await prefetch.current[f.id]:await API.getFamily(f.id);onSelectFamily(full)}catch{onSelectFamily(f)}finally{setOpening(null)}};
  const hoverFam=f=>{if(!prefetch.current[f.id])prefetch.current[f.id]=API.getFamily(f.id)};
  const rc={[RL.OWNER]:{bg:"var(--pri)",c:"#000"},[RL.EDITOR]:{bg:"var(--acc)",c:"#fff"},[RL.VIEWER]:{bg:"var(--bg3)",c:"var(--t2)"}};
  return(<div className="dash">
    <header className="dash-hdr"><h1>NAS<em>AB</em></h1><div className="dash-user">{(user.role==="admin"||user.role==="super_admin")&&<button className="btn btn-sm" onClick={onAdmin} style={{background:"var(--acc)",color:"#fff",fontSize:10,padding:"4px 10px"}}>Admin Panel</button>}<span style={{color:"var(--t3)",fontSize:11}}>Halo,</span><b>{user.name}</b><div className="dash-av">{ini(user.name)}</div><ThemeBtn/><button className="btn btn-sm btn-ghost" onClick={onLogout}>Keluar</button></div></header>
    <div className="dash-body"><div style={{maxWidth:960,margin:"0 auto"}}>
      <div style={{marginBottom:20}}><h2 style={{fontFamily:"var(--f-display)",fontSize:22}}>Silsilah Saya</h2><p style={{fontSize:12,color:"var(--t3)",marginTop:2}}>Kelola pohon keluarga, undang anggota untuk berkolaborasi</p></div>
      <div className="dash-grid">
        {fams.map(f=>{const r=rc[f.myRole]||rc.viewer;return(<div key={f.id} className="fam-card" onClick={()=>openFam(f)} onMouseEnter={()=>hoverFam(f)} onTouchStart={()=>hoverFam(f)}>{opening===f.id&&<div style={{position:"absolute",inset:0,background:"rgba(7,9,14,.7)",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"var(--r)",zIndex:5,fontSize:11,color:"var(--pri)"}}>Memuat...</div>}<div className="fam-card-bar"/><span className="fam-card-role" style={{background:r.bg,color:r.c}}>{f.myRole}</span><h3>{f.name}</h3><p>{f.description||"Silsilah keluarga"}</p><div className="fam-card-stats"><span>👥 {f.member_count||f.members?.length||0}</span><span>📍 {f.geo_count||(f.members||[]).filter(m=>m.location?.lat).length||0}</span></div></div>)})}
        <div className="fam-card fam-new" onClick={()=>setShow(true)}><span style={{fontSize:24,color:"var(--pri)"}}>+</span><span style={{fontSize:12,fontWeight:600}}>Buat Silsilah Baru</span></div>
      </div>
    </div><DevFooter/></div>
    {show&&<div className="modal-ov" onClick={()=>setShow(false)}><div className="modal" onClick={e=>e.stopPropagation()}><div className="m-hdr"><h2>Silsilah Baru</h2><button className="btn btn-icon btn-ghost" onClick={()=>setShow(false)}><Ic.X/></button></div><div className="m-body"><div className="fg"><label className="fl">Nama Keluarga *</label><input className="fi" value={nn} onChange={e=>setNn(e.target.value)} placeholder="Keluarga Besar ..." autoFocus/></div><div className="fg"><label className="fl">Deskripsi</label><textarea className="fta" value={nd} onChange={e=>setNd(e.target.value)} placeholder="Deskripsi..."/></div></div><div className="m-ftr"><button className="btn" onClick={()=>setShow(false)}>Batal</button><button className="btn btn-p" onClick={create} disabled={!nn.trim()}>Buat</button></div></div></div>}
  </div>);
}

// ═══════════════════════════════════════════════════════════════
// WORKSPACE — All views
// ═══════════════════════════════════════════════════════════════
function Workspace({family:initFam,user,onBack}){
  const [fam,setFam]=useState(initFam);const pp=fam.members||[];const [pos,setPos]=useState(fam.positions||{});const[loading,setLoading]=useState(!initFam.members);
  const [vw,setVw]=useState(VW.CANVAS);const [search,setSearch]=useState("");const [sel,setSel]=useState(null);
  const [showForm,setShowForm]=useState(false);const [editP,setEditP]=useState(null);const [showShare,setShowShare]=useState(false);
  const [showIE,setShowIE]=useState(false);const [showFar,setShowFar]=useState(false);const [toast,setToast]=useState(null);const [filters,setFilters]=useState({});
  const myRole=(fam.collaborators||[]).find(c=>c.userId===user.id)?.role||RL.VIEWER;const canEdit=myRole===RL.OWNER||myRole===RL.EDITOR;
  const flash=m=>{setToast(m);setTimeout(()=>setToast(null),3000)};
  const reloadFam=async()=>{try{const d=await API.getFamily(fam.id);setFam(d);setPos(d.positions||{})}catch{}};
  useEffect(()=>{if(!initFam.members){(async()=>{try{const d=await API.getFamily(initFam.id);setFam(d);setPos(d.positions||{})}catch{}finally{setLoading(false)}})()}},[initFam.id]);
  const handleSave=async(person,lsid,ltid)=>{if(!canEdit)return;try{if(lsid&&ltid){const sp=pp.find(x=>x.id===lsid);if(sp)await API.updateMember(fam.id,lsid,{...sp,spouseId:ltid});await reloadFam();return}if(!person)return;const ex=pp.find(x=>x.id===person.id);if(ex){await API.updateMember(fam.id,person.id,person);flash(`${person.name} diperbarui`)}else{await API.addMember(fam.id,person);flash(`${person.name} ditambahkan`)}await reloadFam()}catch(e){flash(e.message)}};
  const handleDel=async id=>{if(!canEdit)return;const p=pp.find(x=>x.id===id);if(FE.ch(pp,id).length){alert(`Tidak bisa hapus — ${p.name} masih punya anak.`);return}if(confirm(`Hapus ${p.name}?`)){try{await API.deleteMember(fam.id,id);setSel(null);flash(`${p.name} dihapus`);await reloadFam()}catch(e){flash(e.message)}}};
  const loadDemo=()=>{flash("Demo tidak tersedia dalam mode online")};
  const updPos=useCallback(async p=>{setPos(p);try{await API.savePositions(fam.id,p)}catch{}},[fam]);
  const filtered=useMemo(()=>FE.search(pp,search),[pp,search]);const viewPP=search?filtered:pp;
  if(loading)return<div className="app"><div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--t3)",fontFamily:"var(--f-display)",fontSize:18}}>Memuat silsilah...</div></div>;
  return(<div className="app">
    <header className="ws-hdr">
      <button className="btn btn-sm btn-ghost" onClick={onBack}><Ic.Back/></button>
      <div className="ws-brand"><h1>NAS<em>AB</em></h1><span style={{color:"var(--t3)",fontSize:12,marginLeft:4}}>/</span><span style={{fontSize:12,fontWeight:600,marginLeft:4}}>{fam.name}</span></div>
      <span className="ws-tag">v{APP.version}</span>
      <nav className="nav">
        {[{id:VW.CANVAS,l:"Canvas"},{id:VW.MAP,l:"Peta"},{id:VW.LIST,l:"Daftar"},{id:VW.STATS,l:"Stats"},{id:VW.TIMELINE,l:"Timeline"},{id:VW.INSIGHTS,l:"Insights"}].map(t=>(
          <button key={t.id} className={`navt ${vw===t.id?"on":""}`} onClick={()=>setVw(t.id)}>{t.l}</button>
        ))}
      </nav>
      <div className="ws-actions">
        <div className="sbox"><Ic.Search/><input placeholder="Cari..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <button className="btn btn-sm" onClick={()=>setShowShare(true)}><Ic.Share/></button>
        <ThemeBtn/>
        <button className="btn btn-sm" onClick={()=>setShowFar(true)} title="Kalkulator Faraidh" style={{fontSize:11}}>⚖️</button>
        <button className="btn btn-sm" onClick={()=>setShowIE(true)}><Ic.DL/></button>
        {!pp.length&&<button className="btn btn-sm" onClick={loadDemo}>Demo</button>}
        {canEdit&&<button className="btn btn-p btn-sm" onClick={()=>{setEditP(null);setShowForm(true)}}><Ic.Plus/> Tambah</button>}
      </div>
    </header>
    <div style={{flex:1,position:"relative",overflow:"hidden"}}>
      {vw===VW.CANVAS&&<CanvasView pp={viewPP} onSel={setSel} selId={sel?.id} onPos={updPos} savedPos={pos}/>}
      {vw===VW.MAP&&<MapView pp={viewPP} onSel={setSel}/>}
      {vw===VW.LIST&&<div style={{height:"100%",overflow:"auto"}}><div style={{maxWidth:800,margin:"0 auto",padding:"16px 16px 0"}}><FilterBar pp={pp} filters={filters} setFilters={setFilters}/></div><ListView pp={Object.keys(filters).length?FE.filter(viewPP,filters):viewPP} allPP={pp} onSel={setSel}/></div>}
      {vw===VW.STATS&&<div style={{height:"100%",overflow:"auto"}}><StatsView pp={viewPP}/></div>}
      {vw===VW.TIMELINE&&<div style={{height:"100%",overflow:"auto"}}><TimelineView pp={viewPP} onSel={setSel}/></div>}
      {vw===VW.INSIGHTS&&<InsightsView pp={pp} fam={fam} canEdit={canEdit} onSaveFam={reloadFam} flash={flash}/>}
      {sel&&<Sidebar p={sel} pp={pp} canEdit={canEdit} onClose={()=>setSel(null)} onEdit={p=>{setSel(null);setEditP(p);setShowForm(true)}} onDel={handleDel} onSel={setSel}/>}
    </div>
    {showForm&&canEdit&&<PersonForm person={editP} pp={pp} onSave={handleSave} onClose={()=>{setShowForm(false);setEditP(null)}}/>}
    {showShare&&<ShareModal fam={fam} user={user} onClose={()=>setShowShare(false)} onUpd={reloadFam} flash={flash}/>}
    {showIE&&<IEModal pp={pp} onImport={async d=>{try{for(const m of d){await API.addMember(fam.id,m)}await reloadFam();flash("Data diimport")}catch(e){flash(e.message)}}} onClose={()=>setShowIE(false)}/>}
    {showFar&&<FaraidhCalc pp={pp} onClose={()=>setShowFar(false)}/>}
    {toast&&<div className="toast">{toast}</div>}
  </div>);
}

// ─── CANVAS ──────────────────────────────────────────────────
function CanvasView({pp,onSel,selId,onPos,savedPos}){
  const wr=useRef(null);const[pos,setPos]=useState({});const[pan,setPan]=useState({x:0,y:0});const[zm,setZm]=useState(.5);
  const[drag,setDrag]=useState(null);const[panning,setPanning]=useState(false);const[didD,setDidD]=useState(false);
  const ps=useRef({});const ds=useRef({});const fitted=useRef(false);const pinch=useRef(null);
  // Fit all cards into viewport
  const fitAll=useCallback((p)=>{
    const el=wr.current;if(!el||!Object.keys(p).length)return;
    const vw=el.clientWidth,vh=el.clientHeight;if(!vw||!vh)return;
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    Object.values(p).forEach(pt=>{minX=Math.min(minX,pt.x);minY=Math.min(minY,pt.y);maxX=Math.max(maxX,pt.x+CW);maxY=Math.max(maxY,pt.y+CH)});
    if(minX===Infinity)return;
    const pad=40;const tw=maxX-minX+pad*2,th=maxY-minY+pad*2;
    const z=Math.max(0.1,Math.min(1,Math.min(vw/tw,vh/th)));
    const tcx=(minX+maxX)/2,tcy=(minY+maxY)/2;
    setZm(z);setPan({x:vw/2-tcx*z,y:vh/2-tcy*z});
  },[]);
  // Comfortable view: zoom to readable level, centered on root
  const comfortView=useCallback((p)=>{
    const el=wr.current;if(!el||!Object.keys(p).length)return;
    const vw=el.clientWidth,vh=el.clientHeight;if(!vw||!vh)return;
    // Find root (first member with no parent)
    const root=pp.find(m=>!m.parentId&&p[m.id]);
    let fcx,fcy;
    if(root&&p[root.id]){const sp=root.spouseId?pp.find(x=>x.id===root.spouseId):null;const rx=p[root.id].x,ry=p[root.id].y;const sx=sp&&p[sp.id]?p[sp.id].x+CW:rx+CW;fcx=(rx+sx)/2;fcy=ry+CH/2}
    else{let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;Object.values(p).forEach(pt=>{minX=Math.min(minX,pt.x);minY=Math.min(minY,pt.y);maxX=Math.max(maxX,pt.x+CW);maxY=Math.max(maxY,pt.y+CH)});fcx=(minX+maxX)/2;fcy=(minY+maxY)/2}
    // Comfortable zoom: readable cards, slightly smaller on mobile
    const z=vw<600?0.38:vw<1024?0.45:0.55;
    setZm(z);setPan({x:vw/2-fcx*z,y:vh*0.3-fcy*z});
  },[pp]);
  useEffect(()=>{
    let p;
    if(savedPos&&Object.keys(savedPos).length>=pp.length){p=savedPos}else{p=autoLayout(pp);onPos(p)}
    setPos(p);
    fitted.current=false;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{comfortView(p);fitted.current=true}));
  },[pp]);
  useEffect(()=>{if(fitted.current&&Object.keys(pos).length>0)onPos(pos)},[pos]);
  const conns=useMemo(()=>getConns(pp,pos),[pp,pos]);
  const bnd=useMemo(()=>{let mx=0,my=0;Object.values(pos).forEach(p=>{mx=Math.max(mx,p.x+CW+200);my=Math.max(my,p.y+CH+200)});return{w:Math.max(mx,2000),h:Math.max(my,1200)}},[pos]);
  const gls=useMemo(()=>{const l={};pp.forEach(p=>{const g=FE.gen(pp,p.id);const po=pos[p.id];if(!po)return;if(!l[g])l[g]={mi:po.y,mx:po.y+CH};l[g].mi=Math.min(l[g].mi,po.y);l[g].mx=Math.max(l[g].mx,po.y+CH)});return l},[pp,pos]);
  const cx=e=>e.touches?e.touches[0].clientX:e.clientX;const cy=e=>e.touches?e.touches[0].clientY:e.clientY;
  const onPS=e=>{if(e.target.closest('.cc')||e.target.closest('.zm')||e.target.closest('.mm'))return;
    // Pinch-to-zoom start
    if(e.touches&&e.touches.length===2){const t=e.touches;const d=Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);pinch.current={d,z:zm,mx:(t[0].clientX+t[1].clientX)/2,my:(t[0].clientY+t[1].clientY)/2};return}
    setPanning(true);ps.current={x:cx(e),y:cy(e),px:pan.x,py:pan.y}};
  useEffect(()=>{const mv=e=>{
    // Pinch-to-zoom move
    if(e.touches&&e.touches.length===2&&pinch.current){e.preventDefault();const t=e.touches;const d=Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);const scale=d/pinch.current.d;const nz=Math.max(0.1,Math.min(2.5,pinch.current.z*scale));const mx=pinch.current.mx,my=pinch.current.my;setZm(nz);setPan(prev=>({x:mx-(mx-prev.x)*(nz/zm),y:my-(my-prev.y)*(nz/zm)}));return}
    if(panning){e.preventDefault();setPan({x:ps.current.px+(cx(e)-ps.current.x),y:ps.current.py+(cy(e)-ps.current.y)})}if(drag){e.preventDefault();const dx=(cx(e)-ds.current.x)/zm,dy=(cy(e)-ds.current.y)/zm;if(Math.abs(dx)>3||Math.abs(dy)>3)setDidD(true);setPos(prev=>({...prev,[drag]:{x:ds.current.ox+dx,y:ds.current.oy+dy}}))}};const up=()=>{setPanning(false);setDrag(null);pinch.current=null};window.addEventListener("mousemove",mv);window.addEventListener("mouseup",up);window.addEventListener("touchmove",mv,{passive:false});window.addEventListener("touchend",up);return()=>{window.removeEventListener("mousemove",mv);window.removeEventListener("mouseup",up);window.removeEventListener("touchmove",mv);window.removeEventListener("touchend",up)}});
  useEffect(()=>{const el=wr.current;const wh=e=>{e.preventDefault();const rect=el.getBoundingClientRect();const mx=e.clientX-rect.left,my=e.clientY-rect.top;const dz=e.deltaY>0?-0.06:0.06;setZm(z=>{const nz=Math.max(0.1,Math.min(2.5,z+dz));setPan(p=>({x:mx-(mx-p.x)*(nz/z),y:my-(my-p.y)*(nz/z)}));return nz})};if(el)el.addEventListener("wheel",wh,{passive:false});return()=>el&&el.removeEventListener("wheel",wh)},[]);
  const dS=(e,pid)=>{e.stopPropagation();setDrag(pid);setDidD(false);ds.current={x:cx(e),y:cy(e),ox:pos[pid].x,oy:pos[pid].y}};
  const cC=(e,p)=>{e.stopPropagation();if(!didD)onSel(p)};
  // Double-click/tap: zoom to card
  const lastTap=useRef(0);
  const dblZoom=useCallback((e,p)=>{const el=wr.current;if(!el)return;const vw=el.clientWidth,vh=el.clientHeight;const pt=pos[p.id];if(!pt)return;const nz=zm<0.5?0.7:zm<0.8?1:0.45;const tcx=pt.x+CW/2,tcy=pt.y+CH/2;setZm(nz);setPan({x:vw/2-tcx*nz,y:vh/2-tcy*nz})},[pos,zm]);
  const handleCardClick=(e,p)=>{e.stopPropagation();if(didD)return;const now=Date.now();if(now-lastTap.current<350){dblZoom(e,p);lastTap.current=0}else{lastTap.current=now;onSel(p)}};
  const fit=()=>{const a=autoLayout(pp);setPos(a);onPos(a);requestAnimationFrame(()=>fitAll(a))};
  if(!pp.length)return<div className="empty"><h3>Mulai dari sini</h3><p>Tambahkan anggota pertama atau muat data demo</p></div>;
  return(<div ref={wr} className={`cvs ${panning?"grabbing":""}`} onMouseDown={onPS} onTouchStart={onPS}>
    <div className="cvs-inner" style={{transform:`translate(${pan.x}px,${pan.y}px) scale(${zm})`,width:bnd.w,height:bnd.h}}>
      {Object.entries(gls).map(([g,lane])=>{const gi=parseInt(g);const gl=GL[gi]||{l:`Gen ${gi+1}`,i:"👤"};const c=GC[gi%GC.length];return(<div key={g} className="gl" style={{top:lane.mi-22,height:lane.mx-lane.mi+44}}><div className="gl-bg" style={{borderColor:c,background:c}}/><div className="gl-strip" style={{color:c}}><span className="gl-emoji">{gl.i}</span><span className="gl-title">{gl.l}</span><span className="gl-num">Gen {gi+1}</span></div></div>)})}
      <svg className="conn-svg" width={bnd.w} height={bnd.h}>{conns.map((c,i)=>{if(c.t==="sp"){const mx=(c.x1+c.x2)/2;return<g key={i}><line x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2} stroke="var(--rose)" strokeWidth="1.5" strokeDasharray="5,4" opacity=".45"/><circle cx={mx} cy={c.y1} r="3.5" fill="var(--rose)" opacity=".5"/><text x={mx} y={c.y1-7} textAnchor="middle" fontSize="6" fill="var(--rose)" fontWeight="600" fontFamily="var(--f-mono)" opacity=".6">NIKAH</text></g>}return<line key={i} x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2} stroke="var(--bdr2)" strokeWidth="1.5"/>})}</svg>
      {pp.map(p=>{const po=pos[p.id];if(!po)return null;const g=FE.gen(pp,p.id);const c=GC[g%GC.length];const bd=p.birthDate?new Date(p.birthDate).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"}):"";return(<div key={p.id} className={`cc ${p.gender} ${drag===p.id?"dragging":""} ${selId===p.id?"selected":""}`} style={{left:po.x,top:po.y}} onMouseDown={e=>dS(e,p.id)} onTouchStart={e=>dS(e,p.id)} onClick={e=>handleCardClick(e,p)}><div className="cc-bar"/><div className="cc-body"><div className={`cc-av ${p.gender}`}>{ini(p.name)}</div><div className="cc-info"><div className="cc-name">{p.name}</div><div className="cc-meta">{p.gender==="male"?"♂":"♀"}{bd?` · ${bd}`:""}{p.deathDate?" · Alm.":""}</div>{p.location?.address&&<div className="cc-meta">📍 {p.location.address.split(",")[0]}</div>}</div></div><div className="cc-gen" style={{background:c}}/></div>)})}
    </div>
    <div className="zm"><button onClick={()=>setZm(z=>Math.min(2.5,z+.12))}>+</button><button onClick={()=>setZm(z=>Math.max(.1,z-.12))}>−</button><button onClick={fit} title="Fit semua"><Ic.Fit/></button><button onClick={()=>comfortView(pos)} title="Zoom nyaman" style={{fontSize:10}}>🏠</button><div style={{fontSize:8,textAlign:"center",color:"var(--t3)",fontFamily:"var(--f-mono)"}}>{Math.round(zm*100)}%</div></div>
    <div className="mm"><svg width="150" height="80" viewBox={`0 0 ${bnd.w} ${bnd.h}`}>{pp.map(p=>{const po=pos[p.id];return po?<rect key={p.id} x={po.x} y={po.y} width={CW} height={CH} rx="3" fill={p.gender==="male"?"var(--male-t)":"var(--fem-t)"} opacity=".35"/>:null})}</svg></div>
  </div>);
}

// ─── MAP ─────────────────────────────────────────────────────
const LL={p:null};function loadL(){if(window.L)return Promise.resolve(window.L);if(LL.p)return LL.p;LL.p=new Promise(r=>{const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";s.onload=()=>r(window.L);document.head.appendChild(s)});return LL.p}
function MapView({pp,onSel}){const mr=useRef(null);const mi=useRef(null);const mk=useRef([]);const[rdy,setRdy]=useState(false);const[flt,setFlt]=useState("all");const geo=useMemo(()=>pp.filter(p=>p.location?.lat),[pp]);
  useEffect(()=>{loadL().then(L=>{if(!mr.current||mi.current)return;const m=L.map(mr.current,{zoomControl:false}).setView([-2.5,112],5);L.control.zoom({position:"topleft"}).addTo(m);L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",{maxZoom:19}).addTo(m);mi.current=m;setRdy(true)});return()=>{if(mi.current){mi.current.remove();mi.current=null}}},[]);
  useEffect(()=>{if(!rdy||!mi.current||!window.L)return;const L=window.L,m=mi.current;mk.current.forEach(x=>m.removeLayer(x));mk.current=[];const fl=flt==="all"?geo:geo.filter(p=>FE.gen(pp,p.id)===parseInt(flt.replace("g-","")));const bn=[];
    fl.forEach(p=>{const g=FE.gen(pp,p.id);const c=GC[g%GC.length];const gl=GL[g]||{l:`Gen ${g+1}`};const ic=L.divIcon({className:"",html:`<div style="width:26px;height:26px;border-radius:6px;background:${c};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#000;font-family:'DM Sans';box-shadow:0 2px 8px ${c}66;cursor:pointer">${ini(p.name)}</div>`,iconSize:[26,26],iconAnchor:[13,13]});const marker=L.marker([p.location.lat,p.location.lng],{icon:ic}).addTo(m);marker.bindPopup(`<div class="map-popup"><div class="map-popup-nm">${p.name}</div><div class="map-popup-mt">${p.gender==="male"?"♂":"♀"} · ${p.location.address||"—"}</div></div>`,{maxWidth:220});marker.on("click",()=>onSel(p));mk.current.push(marker);bn.push([p.location.lat,p.location.lng])});
    if(bn.length>1)m.fitBounds(bn,{padding:[40,40],maxZoom:14});else if(bn.length===1)m.setView(bn[0],13);
  },[rdy,geo,flt,pp]);const uG=useMemo(()=>[...new Set(geo.map(p=>FE.gen(pp,p.id)))].sort(),[geo,pp]);
  return(<div className="map-w"><div ref={mr} className="map-c"/><div className="map-leg"><div className="map-leg-t">LOKASI KELUARGA</div><div className="map-leg-i" style={{fontWeight:flt==="all"?700:400}} onClick={()=>setFlt("all")}><div className="map-leg-d" style={{background:"var(--t2)"}}/>Semua ({geo.length})</div>{uG.map(g=>{const gl=GL[g]||{l:`Gen ${g+1}`};const c=GC[g%GC.length];const a=flt===`g-${g}`;return<div key={g} className="map-leg-i" style={{fontWeight:a?700:400}} onClick={()=>setFlt(a?"all":`g-${g}`)}><div className="map-leg-d" style={{background:c}}/>{gl.l} ({geo.filter(p=>FE.gen(pp,p.id)===g).length})</div>})}</div><div className="map-bar"><div className="map-st">📍 <b>{geo.length}</b>/{pp.length}</div></div>{!geo.length&&<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:1e3,textAlign:"center",background:"var(--bg1)",border:"1px solid var(--bdr)",borderRadius:"var(--r)",padding:"20px 28px"}}><div style={{fontSize:28}}>🗺️</div><div style={{fontSize:13,fontWeight:600,marginTop:4}}>Belum ada lokasi</div></div>}</div>);
}

// ─── COMPONENTS ──────────────────────────────────────────────
function GeoInput({value:v,onChange:oc}){const[q,setQ]=useState("");const[res,setRes]=useState([]);const[busy,setBusy]=useState(false);const doS=async()=>{if(!q.trim())return;setBusy(true);try{const r=await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&countrycodes=id`);const d=await r.json();setRes(d.map(x=>({lat:parseFloat(x.lat),lng:parseFloat(x.lon),address:x.display_name.split(",").slice(0,3).join(",").trim()})))}catch{}setBusy(false)};return(<div className="geo-w"><div className="geo-r"><input placeholder="Cari lokasi..." value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doS()}/><button className="btn btn-sm" onClick={doS} style={{padding:"2px 5px",fontSize:9}}>{busy?"…":"🔍"}</button></div>{res.length>0&&<div className="geo-res">{res.map((r,i)=><div key={i} className="geo-ri" onClick={()=>{oc(r);setRes([]);setQ("")}}>📍 {r.address}</div>)}</div>}<div className="geo-r"><span className="geo-l">Lat</span><input type="number" step="any" value={v?.lat||""} onChange={e=>oc({lat:parseFloat(e.target.value)||0,lng:v?.lng||0,address:v?.address||""})}/><span className="geo-l">Lng</span><input type="number" step="any" value={v?.lng||""} onChange={e=>oc({lat:v?.lat||0,lng:parseFloat(e.target.value)||0,address:v?.address||""})}/></div><div className="geo-r"><span className="geo-l">Alamat</span><input value={v?.address||""} onChange={e=>oc({lat:v?.lat||0,lng:v?.lng||0,address:e.target.value})}/></div>{v?.lat&&<div style={{display:"flex",gap:3,marginTop:3}}><button className="btn btn-sm btn-d" onClick={()=>oc(null)} style={{fontSize:8,padding:"1px 5px"}}>✕</button><span style={{fontSize:8,color:"var(--pri)"}}>✓ Saved</span></div>}</div>)}
function PersonForm({person:p,pp,onSave,onClose}){const ie=!!p?.id;const[f,sF]=useState({name:p?.name||"",gender:p?.gender||"male",birthDate:p?.birthDate||"",deathDate:p?.deathDate||"",birthPlace:p?.birthPlace||"",notes:p?.notes||"",parentId:p?.parentId||"",spouseId:p?.spouseId||"",location:p?.location||null,nik:p?.nik||"",agama:p?.agama||"islam"});const set=(k,v)=>sF(x=>({...x,[k]:v}));
  const nikFill=()=>{const d=NIK.parse(f.nik);if(!d)return;const upd={gender:d.gender,birthDate:d.birthDate};if(d.prov){upd.birthPlace=d.provName;if(!f.location)upd.location={lat:d.prov.lt,lng:d.prov.ln,address:d.provName}}sF(x=>({...x,...upd}))};
  const nikInfo=useMemo(()=>NIK.parse(f.nik),[f.nik]);
  const save=()=>{if(!f.name.trim())return;const d={...f,parentId:f.parentId||null,spouseId:f.spouseId||null};if(ie)onSave({...p,...d});else onSave({id:`p_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,...d,photo:"",createdAt:new Date().toISOString()});if(f.spouseId)onSave(null,f.spouseId,ie?p.id:null);onClose()};return(<div className="modal-ov" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()}><div className="m-hdr"><h2>{ie?"Edit":"Tambah"}</h2><button className="btn btn-icon btn-ghost" onClick={onClose}><Ic.X/></button></div><div className="m-body"><div className="fg"><label className="fl">🆔 NIK</label><div className="nik-w"><input className="fi" value={f.nik} onChange={e=>set("nik",e.target.value.replace(/\D/g,"").slice(0,16))} placeholder="16 digit NIK" maxLength={16} style={{flex:1,fontFamily:"var(--f-mono)"}}/>{NIK.valid(f.nik)&&<span className="nik-fill" onClick={nikFill}>Auto-fill ✨</span>}</div>{f.nik&&!NIK.valid(f.nik)&&f.nik.length>0&&<div className="nik-info" style={{color:"var(--rose)"}}>NIK harus 16 digit angka ({f.nik.length}/16)</div>}{nikInfo&&<div className="nik-info">Terdeteksi: <b>{nikInfo.gender==="male"?"♂ Laki-laki":"♀ Perempuan"}</b> · Lahir <b>{nikInfo.birthDate}</b> · <b>{nikInfo.provName}</b></div>}</div><div className="fg"><label className="fl">Nama *</label><input className="fi" value={f.name} onChange={e=>set("name",e.target.value)} autoFocus/></div><div className="fr"><div className="fg"><label className="fl">Gender</label><div className="gtog"><button className={`gbtn ${f.gender==="male"?"am":""}`} onClick={()=>set("gender","male")}>♂ L</button><button className={`gbtn ${f.gender==="female"?"af":""}`} onClick={()=>set("gender","female")}>♀ P</button></div></div><div className="fg"><label className="fl">Agama</label><select className="fsel" value={f.agama} onChange={e=>set("agama",e.target.value)}>{AGAMA_LIST.map(a=><option key={a} value={a}>{a.charAt(0).toUpperCase()+a.slice(1)}</option>)}</select></div></div><div className="fr"><div className="fg"><label className="fl">Lahir</label><input className="fi" type="date" value={f.birthDate} onChange={e=>set("birthDate",e.target.value)}/></div><div className="fg"><label className="fl">Wafat</label><input className="fi" type="date" value={f.deathDate} onChange={e=>set("deathDate",e.target.value)}/></div></div><div className="fg"><label className="fl">Tempat Lahir</label><input className="fi" value={f.birthPlace} onChange={e=>set("birthPlace",e.target.value)}/></div><div className="fr"><div className="fg"><label className="fl">Orang Tua</label><select className="fsel" value={f.parentId} onChange={e=>set("parentId",e.target.value)}><option value="">— Root —</option>{pp.filter(x=>!ie||x.id!==p?.id).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></div><div className="fg"><label className="fl">Pasangan</label><select className="fsel" value={f.spouseId} onChange={e=>set("spouseId",e.target.value)}><option value="">—</option>{pp.filter(x=>(!ie||x.id!==p?.id)&&!x.spouseId).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></div></div><div className="fg"><label className="fl">Catatan</label><textarea className="fta" value={f.notes} onChange={e=>set("notes",e.target.value)}/></div><div className="fg"><label className="fl">📍 Lokasi</label><GeoInput value={f.location} onChange={v=>set("location",v)}/></div></div><div className="m-ftr"><button className="btn" onClick={onClose}>Batal</button><button className="btn btn-p" onClick={save} disabled={!f.name.trim()}>{ie?"Simpan":"Tambah"}</button></div></div></div>)}
function ShareModal({fam,user,onClose,onUpd,flash}){const[em,setEm]=useState("");const[rl,setRl]=useState(RL.EDITOR);const inv=async()=>{if(!em.trim())return;try{const res=await API.invite(fam.id,em,rl);flash(res.message);onUpd()}catch(e){flash(e.message)}setEm("")};const rc={[RL.OWNER]:{bg:"var(--pri)",c:"#000"},[RL.EDITOR]:{bg:"var(--acc)",c:"#fff"},[RL.VIEWER]:{bg:"var(--bg3)",c:"var(--t2)"}};
  return(<div className="modal-ov" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:420}}><div className="m-hdr"><h2>Kolaborasi</h2><button className="btn btn-icon btn-ghost" onClick={onClose}><Ic.X/></button></div><div style={{padding:14}}>
    <div style={{fontSize:10,color:"var(--t3)",marginBottom:6}}>Undang via email</div>
    <div style={{display:"flex",gap:5,marginBottom:14}}><input className="fi" style={{flex:1,padding:"5px 8px",fontSize:11}} value={em} onChange={e=>setEm(e.target.value)} placeholder="email@..." onKeyDown={e=>e.key==="Enter"&&inv()}/><select className="fsel" style={{width:80,padding:"5px",fontSize:10}} value={rl} onChange={e=>setRl(e.target.value)}><option value={RL.EDITOR}>Editor</option><option value={RL.VIEWER}>Viewer</option></select><button className="btn btn-p btn-sm" onClick={inv}>Undang</button></div>
    <div style={{fontSize:10,color:"var(--t3)",marginBottom:6}}>Tim ({(fam.collaborators||[]).length})</div>
    {(fam.collaborators||[]).map((c,i)=>{const r=rc[c.role]||rc.viewer;return<div key={i} className="collab-i"><div className="collab-av">{ini(c.name)}</div><div className="collab-info">{c.name}{c.userId===user.id&&<span>(Anda)</span>}</div><span className="collab-role" style={{background:r.bg,color:r.c}}>{c.role}</span></div>})}
    <div style={{marginTop:12,padding:"8px 10px",background:"var(--bg2)",borderRadius:6,fontSize:9,color:"var(--t3)",lineHeight:1.5,fontFamily:"var(--f-mono)"}}>OWNER = full access · EDITOR = tambah/edit · VIEWER = lihat saja</div>
  </div></div></div>)}
function FilterBar({pp,filters:f,setFilters:sF}){const gs=useMemo(()=>[...new Set(pp.map(p=>FE.gen(pp,p.id)))].sort(),[pp]);const ls=useMemo(()=>[...new Set(pp.filter(p=>p.location?.address).map(p=>p.location.address.split(",")[0].trim()))].sort(),[pp]);const active=Object.values(f).some(v=>v&&v!=="all");return(<div className="fbar"><label>Gender<select value={f.gender||"all"} onChange={e=>sF(x=>({...x,gender:e.target.value}))}><option value="all">Semua</option><option value="male">♂</option><option value="female">♀</option></select></label><label>Generasi<select value={f.generation??"all"} onChange={e=>sF(x=>({...x,generation:e.target.value}))}><option value="all">Semua</option>{gs.map(g=><option key={g} value={g}>{(GL[g]||{l:`Gen ${g+1}`}).l}</option>)}</select></label><label>Status<select value={f.status||"all"} onChange={e=>sF(x=>({...x,status:e.target.value}))}><option value="all">Semua</option><option value="living">Hidup</option><option value="deceased">Almarhum</option></select></label><label>Lokasi<select value={f.location||""} onChange={e=>sF(x=>({...x,location:e.target.value}))}><option value="">Semua</option>{ls.map(l=><option key={l} value={l}>{l}</option>)}</select></label><label>NIK<select value={f.nik||"all"} onChange={e=>sF(x=>({...x,nik:e.target.value}))}><option value="all">Semua</option><option value="has">Ada NIK</option><option value="none">Tanpa NIK</option></select></label>{active&&<span className="ftag" onClick={()=>sF({})}>✕ Reset</span>}</div>)}
function InsightsView({pp,fam,canEdit,onSaveFam,flash}){const[fid,setFid]=useState("");const[tid,setTid]=useState("");const[rr,setRr]=useState(null);const[st,setSt]=useState("");const[sp,setSp]=useState("");const stories=fam.stories||[];const findR=()=>{if(fid&&tid)setRr(FE.findRel(pp,fid,tid))};const bds=useMemo(()=>FE.bdays(pp,90),[pp]);const gd=useMemo(()=>{const d={};pp.forEach(p=>{const g=FE.gen(pp,p.id);d[g]=(d[g]||0)+1});return Object.entries(d).sort((a,b)=>a[0]-b[0]).map(([g,c])=>({gen:parseInt(g),count:c,label:(GL[parseInt(g)]||{l:`Gen ${parseInt(g)+1}`}).l,color:GC[parseInt(g)%GC.length]}))},[pp]);const ld=useMemo(()=>{const d={};pp.filter(p=>p.location?.address).forEach(p=>{const c=p.location.address.split(",")[0].trim();d[c]=(d[c]||0)+1});return Object.entries(d).sort((a,b)=>b[1]-a[1]).slice(0,6)},[pp]);const addS=async()=>{if(!st.trim())return;try{await API.addStory(fam.id,{text:st,personId:sp||null,personName:sp?(pp.find(p=>p.id===sp)?.name||""):""});onSaveFam();setSt("");flash("Cerita disimpan!")}catch(e){flash(e.message)}};
  return(<div className="ins"><h2 style={{fontFamily:"var(--f-display)",fontSize:20,marginBottom:14}}>Insights</h2><div className="ins-g">
    <div className="ins-c"><h3><span>🔍</span>Pencari Hubungan</h3><div className="rf-sel"><select className="fsel" value={fid} onChange={e=>setFid(e.target.value)}><option value="">Orang 1...</option>{pp.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><select className="fsel" value={tid} onChange={e=>setTid(e.target.value)}><option value="">Orang 2...</option>{pp.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><button className="btn btn-p btn-sm" onClick={findR} disabled={!fid||!tid}>Cari</button></div>{rr&&<div className="rf-res"><div className="rf-res-l" style={{color:rr.path.length?"var(--pri)":"var(--t3)"}}>{rr.label}</div>{rr.path.length>0&&<div className="rf-res-p"><span className="rf-node">{pp.find(p=>p.id===fid)?.name}</span>{rr.path.map((s,i)=><span key={i} style={{display:"flex",alignItems:"center",gap:3}}><span className="rf-arrow">→</span><span className="rf-node">{pp.find(p=>p.id===s.id)?.name}</span></span>)}</div>}</div>}</div>
    <div className="ins-c"><h3><span>🎂</span>Ulang Tahun</h3>{!bds.length?<div style={{fontSize:11,color:"var(--t3)",textAlign:"center",padding:12}}>Tidak ada data</div>:bds.slice(0,6).map((b,i)=><div key={i} className="bd-i"><div className="bd-d" style={{background:b.days===0?"var(--pri)":b.days<=7?"rgba(236,72,153,.15)":"var(--bg2)",color:b.days===0?"#000":b.days<=7?"var(--rose)":"var(--t2)"}}>{b.days===0?"TODAY":b.days+"d"}</div><div className="bd-info">{b.person.name} <span>ke-{b.age}, {b.next.toLocaleDateString("id-ID",{day:"numeric",month:"short"})}</span></div></div>)}</div>
    <div className="ins-c"><h3><span>📊</span>Distribusi</h3><div className="gb">{gd.map(g=><div key={g.gen} style={{width:`${(g.count/pp.length)*100}%`,background:g.color}}/>)}</div><div className="gb-leg">{gd.map(g=><div key={g.gen} className="gb-leg-i"><div className="gb-leg-d" style={{background:g.color}}/>{g.label} ({g.count})</div>)}</div>{ld.length>0&&<div style={{marginTop:12}}>{ld.map(([city,count],i)=><div key={i} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><span style={{fontSize:10,flex:1}}>{city}</span><div style={{width:80,height:5,background:"var(--bg3)",borderRadius:3,overflow:"hidden"}}><div style={{width:`${(count/pp.length)*100}%`,height:"100%",background:"var(--pri)",borderRadius:3}}/></div><span style={{fontSize:9,color:"var(--t3)",minWidth:20,textAlign:"right",fontFamily:"var(--f-mono)"}}>{count}</span></div>)}</div>}</div>
    <div className="ins-c"><h3><span>⚡</span>Fakta</h3>{(()=>{const s=FE.stats(pp);const mc=pp.reduce((b,p)=>{const c=FE.ch(pp,p.id).length;return c>b.c?{p,c}:b},{p:null,c:0});const md=pp.reduce((b,p)=>{const d=FE.desc(pp,p.id);return d>b.c?{p,c:d}:b},{p:null,c:0});return<div style={{fontSize:11,lineHeight:2,color:"var(--t2)"}}>{pp.length?`${((s.males/pp.length)*100).toFixed(0)}% laki-laki`:""}<br/>{pp.length?`${((s.geotagged/pp.length)*100).toFixed(0)}% geotagged`:""}<br/>{mc.p&&<>🏆 {mc.p.name}: {mc.c} anak<br/></>}{md.p&&<>🌳 {md.p.name}: {md.c} keturunan<br/></>}{ld.length} kota</div>})()}</div>
    <div className="ins-c ins-cf"><h3><span>📖</span>Cerita Keluarga</h3>{canEdit&&<div style={{marginBottom:10}}><div style={{display:"flex",gap:5,marginBottom:5}}><select className="fsel" value={sp} onChange={e=>setSp(e.target.value)} style={{width:160,fontSize:10}}><option value="">Cerita umum</option>{pp.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><button className="btn btn-p btn-sm" onClick={addS} disabled={!st.trim()}>Simpan</button></div><textarea className="fta" value={st} onChange={e=>setSt(e.target.value)} placeholder="Tulis cerita, kenangan, pesan..." style={{minHeight:40}}/></div>}{!stories.length?<div style={{fontSize:11,color:"var(--t3)",textAlign:"center",padding:16}}>Belum ada cerita</div>:stories.map(s=><div key={s.id} className="st-entry"><div className="st-date">{new Date(s.date).toLocaleDateString("id-ID",{year:"numeric",month:"short",day:"numeric"})}{s.personName&&` · ${s.personName}`}</div><div className="st-text">{s.text}</div><div className="st-author">— {s.author}</div></div>)}</div>
  </div></div>)}
function Sidebar({p,pp,canEdit,onClose,onEdit,onDel,onSel}){const pa=FE.pa(pp,p);const sp=FE.sp(pp,p);const ch=FE.ch(pp,p.id);const sib=FE.sib(pp,p);const g=FE.gen(pp,p.id);const d=FE.desc(pp,p.id);const gl=GL[g]||{l:`Gen ${g+1}`};const age=FE.age(p);const ctx=useMemo(()=>{const c=[];if(pa)c.push(`Anak ${pa.name}`);if(sp)c.push(`∞ ${sp.name}`);if(ch.length)c.push(`${ch.length} anak`);return c.join(" · ")},[pa,sp,ch]);
  const[showNik,setShowNik]=useState(false);
  return(<div className="sb" onClick={e=>e.stopPropagation()}><div className="sb-h"><h3>Detail</h3><button className="btn btn-icon btn-ghost" onClick={onClose}><Ic.X/></button></div><div className="sb-b"><div className={`sb-av ${p.gender}`}>{ini(p.name)}</div><div className="sb-nm">{p.name}</div><div className="sb-sub">{p.gender==="male"?"♂":"♀"} · {gl.l}{p.deathDate?" · Alm.":""} · {(p.agama||"islam").charAt(0).toUpperCase()+(p.agama||"islam").slice(1)}</div>{ctx&&<div className="sb-ctx">{ctx}</div>}<div className="sb-sec"><div className="sb-sec-t">Info</div>{p.nik&&<div className="sb-row"><span className="sb-row-l">🆔 NIK</span><span className="sb-row-v"><span className="nik-masked" onClick={()=>setShowNik(!showNik)} style={{cursor:"pointer"}} title="Klik untuk tampilkan/sembunyikan">{showNik?NIK.format(p.nik):NIK.mask(p.nik)}</span></span></div>}{p.birthDate&&<div className="sb-row"><span className="sb-row-l">Lahir</span><span className="sb-row-v">{new Date(p.birthDate).toLocaleDateString("id-ID",{year:"numeric",month:"long",day:"numeric"})}</span></div>}{age!==null&&<div className="sb-row"><span className="sb-row-l">Usia</span><span className="sb-row-v">{age} th</span></div>}{p.location?.lat&&<div className="sb-row"><span className="sb-row-l">📍</span><span className="sb-row-v">{p.location.address||`${p.location.lat.toFixed(3)},${p.location.lng.toFixed(3)}`}</span></div>}<div className="sb-row"><span className="sb-row-l">Keturunan</span><span className="sb-row-v">{d}</span></div>{p.notes&&<div className="sb-row"><span className="sb-row-l">Catatan</span><span className="sb-row-v">{p.notes}</span></div>}</div>
    <div className="sb-sec"><div className="sb-sec-t">Hubungan</div>{pa&&<div className="sb-rel" onClick={()=>{onClose();setTimeout(()=>onSel(pa),50)}}><span className="sb-rel-t">PARENT</span>{pa.name}</div>}{sp&&<div className="sb-rel" onClick={()=>{onClose();setTimeout(()=>onSel(sp),50)}}><span className="sb-rel-t" style={{color:"var(--rose)"}}>SPOUSE</span>{sp.name}</div>}{sib.map(s=><div key={s.id} className="sb-rel" onClick={()=>{onClose();setTimeout(()=>onSel(s),50)}}><span className="sb-rel-t" style={{color:"var(--purple)"}}>SIBLING</span>{s.name}</div>)}{ch.map(c=><div key={c.id} className="sb-rel" onClick={()=>{onClose();setTimeout(()=>onSel(c),50)}}><span className="sb-rel-t" style={{color:"var(--pri)"}}>CHILD</span>{c.name}</div>)}</div></div>
    {canEdit&&<div className="sb-ft"><button className="btn btn-d btn-sm" onClick={()=>onDel(p.id)}><Ic.Trash/></button><button className="btn btn-p btn-sm" onClick={()=>onEdit(p)}><Ic.Edit/> Edit</button></div>}</div>)}
function ListView({pp,allPP,onSel}){const people=allPP||pp;return(<div className="lv">{[...pp].sort((a,b)=>FE.gen(people,a.id)-FE.gen(people,b.id)||a.name.localeCompare(b.name)).map(p=>{const g=FE.gen(people,p.id);const gl=GL[g]||{l:`Gen ${g+1}`};const c=GC[g%GC.length];return<div key={p.id} className="li" onClick={()=>onSel(p)}><div className={`li-av ${p.gender}`}>{ini(p.name)}</div><div className="li-info"><h4>{p.name}</h4><p>{p.location?.address||p.notes||"—"}</p></div><span className="li-badge" style={{background:c+"18",color:c,border:`1px solid ${c}30`}}>{gl.l}</span></div>})}</div>)}
function StatsView({pp}){const s=useMemo(()=>FE.stats(pp),[pp]);return<div className="sg">{[{l:"Total",v:s.total,c:"var(--pri)"},{l:"Laki-laki",v:s.males,c:"var(--male-t)"},{l:"Perempuan",v:s.females,c:"var(--fem-t)"},{l:"Hidup",v:s.living,c:"var(--pri)"},{l:"Almarhum",v:s.deceased,c:"var(--t3)"},{l:"Generasi",v:s.generations,c:"var(--warn)"},{l:"Geotagged",v:s.geotagged,c:"var(--orange)"},{l:"Avg Anak",v:s.avgChildren,c:"var(--purple)"}].map((c,i)=><div key={i} className="sc"><div className="sc-v" style={{color:c.c}}>{c.v}</div><div className="sc-l">{c.l}</div></div>)}</div>}
function TimelineView({pp,onSel}){const ev=useMemo(()=>{const e=[];pp.forEach(p=>{if(p.birthDate)e.push({d:p.birthDate,t:"b",p,l:`Lahir: ${p.name}`});if(p.deathDate)e.push({d:p.deathDate,t:"d",p,l:`Wafat: ${p.name}`})});return e.sort((a,b)=>a.d.localeCompare(b.d))},[pp]);if(!ev.length)return<div className="empty"><h3>Belum ada peristiwa</h3></div>;return<div className="tl">{ev.map((e,i)=><div key={i} className="tl-i" onClick={()=>onSel(e.p)}><div className="tl-dot" style={{background:e.t==="b"?"var(--pri)":"var(--t3)"}}/><div className="tl-yr">{new Date(e.d).toLocaleDateString("id-ID",{year:"numeric",month:"long",day:"numeric"})}</div><div className="tl-tt">{e.l}</div></div>)}</div>}
function FaraidhResultTable({results,total,fmt,label}){
  const totalDist=results.reduce((s,r)=>s+r.amount,0);
  return(<div className="far-res"><div style={{fontSize:10,fontWeight:600,color:"var(--t2)",marginBottom:6}}>{label} {results[0]?.awl&&<span style={{color:"var(--rose)",fontSize:9}}>(Awl — proporsional)</span>}</div>
    <table className="far-table"><thead><tr><th>Ahli Waris</th><th>Jml</th><th>Bagian</th><th>Hak</th><th>Per Orang</th></tr></thead><tbody>
      {results.map((r,i)=><tr key={i}><td>{r.heir} <span className={`far-type ${r.type}`}>{r.type}</span>{r.names&&<div style={{fontSize:8,color:"var(--t3)",marginTop:1}}>{r.names.join(", ")}</div>}</td><td style={{fontFamily:"var(--f-mono)"}}>{r.count}</td><td style={{fontFamily:"var(--f-mono)"}}>{r.frac||"-"} {r.share!=null?`(${(r.share*100).toFixed(1)}%)`:""}</td><td style={{fontFamily:"var(--f-mono)",fontWeight:600}}>{fmt(r.amount)}</td><td style={{fontFamily:"var(--f-mono)",color:"var(--t3)"}}>{r.count>1?fmt(r.amountPer):"-"}</td></tr>)}
      <tr style={{fontWeight:700,borderTop:"2px solid var(--bdr)"}}><td colSpan={3}>Total</td><td style={{fontFamily:"var(--f-mono)",color:Math.abs(totalDist-total)<1?"var(--pri)":"var(--rose)"}}>{fmt(totalDist)}</td><td style={{fontFamily:"var(--f-mono)",color:"var(--t3)"}}>{(totalDist/total*100).toFixed(1)}%</td></tr>
    </tbody></table>
    {totalDist<total-1&&<div style={{fontSize:10,color:"var(--t3)",marginTop:4}}>Sisa: {fmt(total-totalDist)} — baitul mal</div>}
  </div>)}
function FaraidhCalc({pp,onClose}){
  const[pid,setPid]=useState("");const[total,setTotal]=useState(1000000000);const[ww,setWw]=useState(false);const[tab,setTab]=useState("faraidh");
  const deceased=useMemo(()=>pp.filter(p=>p.deathDate),[pp]);
  const defaultH={husband:0,wife:0,sons:0,daughters:0,father:0,mother:0,grandfather:0,grandmother:0,brothers:0,sisters:0};
  const[h,setH]=useState(defaultH);const[blocked,setBlocked]=useState([]);const[warnings,setWarnings]=useState([]);
  const setHeir=(k,v)=>setH(x=>({...x,[k]:Math.max(0,parseInt(v)||0)}));
  const autoDetect=useCallback((id)=>{if(!id){setH(defaultH);setBlocked([]);setWarnings([]);return}const d=FARAIDH.detectHeirs(pp,id);setH(d.heirs||d);setBlocked(d.blocked||[]);setWarnings(d.warnings||[])},[pp]);
  useEffect(()=>{if(pid)autoDetect(pid)},[pid]);
  const results=useMemo(()=>FARAIDH.calc(h,total,{blocked,wasiatWajibah:ww}),[h,total,blocked,ww]);
  const fmt=n=>new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",minimumFractionDigits:0}).format(Math.round(n));
  const hasBlocked=blocked.length>0;
  return(<div className="modal-ov" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:720}}><div className="m-hdr"><h2>⚖️ Kalkulator Faraidh</h2><button className="btn btn-icon btn-ghost" onClick={onClose}><Ic.X/></button></div><div className="m-body">
    <div style={{fontSize:10,color:"var(--t3)",marginBottom:12,lineHeight:1.6}}>Kalkulator waris Islam berdasarkan hukum faraidh. Pilih almarhum untuk auto-deteksi ahli waris dari silsilah (termasuk filter agama), atau isi manual.</div>
    <div className="far-sel"><label style={{fontSize:11,fontWeight:600}}>Almarhum:</label><select className="fsel" value={pid} onChange={e=>{setPid(e.target.value)}} style={{flex:1,maxWidth:250}}><option value="">— Pilih (opsional) —</option>{deceased.map(p=><option key={p.id} value={p.id}>{p.name} ({p.agama||"islam"})</option>)}</select></div>
    {warnings.length>0&&<div style={{background:"#3f121944",border:"1px solid #5f1d2d",borderRadius:6,padding:"8px 10px",marginBottom:12}}><div style={{fontSize:9,fontWeight:700,color:"var(--rose)",marginBottom:4}}>⚠️ Penghalang Waris Terdeteksi</div>{warnings.map((w,i)=><div key={i} style={{fontSize:10,color:"#fca5a5",lineHeight:1.6}}>• {w}</div>)}</div>}
    {hasBlocked&&<div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:6,marginBottom:12}}><label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:11,fontWeight:500}}><input type="checkbox" checked={ww} onChange={e=>setWw(e.target.checked)} style={{accentColor:"var(--pri)"}}/> Hitung Wasiat Wajibah</label><span style={{fontSize:9,color:"var(--t3)"}}>(maks ⅓ harta untuk ahli waris beda agama)</span></div>}
    <div className="far-total"><label style={{fontSize:11,fontWeight:600}}>Harta Waris:</label><input className="fi" type="number" value={total} onChange={e=>setTotal(Math.max(0,parseInt(e.target.value)||0))} style={{fontFamily:"var(--f-mono)"}}/><span style={{fontSize:10,color:"var(--t3)"}}>{fmt(total)}</span></div>
    <div style={{fontSize:10,fontWeight:600,color:"var(--t2)",marginBottom:6}}>Ahli Waris Muslim</div>
    <div className="far-heirs">
      {[{k:"husband",l:"Suami",mx:1},{k:"wife",l:"Istri",mx:4},{k:"sons",l:"Anak Laki-laki",mx:20},{k:"daughters",l:"Anak Perempuan",mx:20},{k:"father",l:"Ayah",mx:1},{k:"mother",l:"Ibu",mx:1},{k:"grandfather",l:"Kakek",mx:1},{k:"grandmother",l:"Nenek",mx:1},{k:"brothers",l:"Saudara Laki-laki",mx:10},{k:"sisters",l:"Saudara Perempuan",mx:10}].map(({k,l,mx})=>
        <div key={k} className="far-heir"><label>{l}</label><input type="number" min={0} max={mx} value={h[k]} onChange={e=>setHeir(k,e.target.value)}/></div>
      )}
    </div>
    {hasBlocked&&<div style={{marginBottom:12}}><div style={{fontSize:10,fontWeight:600,color:"var(--rose)",marginBottom:6}}>Terhalang (Beda Agama)</div><div style={{display:"flex",flexWrap:"wrap",gap:4}}>{blocked.map((b,i)=><span key={i} style={{fontSize:10,padding:"3px 8px",background:"#3f121944",border:"1px solid #5f1d2d",borderRadius:4,color:"#fca5a5"}}>{b.label} ×{b.count} <span style={{fontSize:8,opacity:.7}}>({b.names.join(", ")} — {b.agama})</span></span>)}</div></div>}
    {ww&&results.wasiat?<div>
      <div style={{display:"flex",gap:4,marginBottom:10}}>{[{id:"faraidh",l:"Faraidh Murni"},{id:"wasiat",l:"Dengan Wasiat Wajibah"}].map(t=><button key={t.id} className={`btn btn-sm ${tab===t.id?"btn-p":""}`} onClick={()=>setTab(t.id)}>{t.l}</button>)}</div>
      {tab==="faraidh"&&results.faraidh.length>0&&<FaraidhResultTable results={results.faraidh} total={total} fmt={fmt} label="(A) Faraidh Murni — hanya ahli waris Muslim"/>}
      {tab==="wasiat"&&<div>
        <div style={{background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:6,padding:"8px 10px",marginBottom:10}}>
          <div style={{fontSize:10,fontWeight:600,color:"var(--acc)",marginBottom:4}}>Wasiat Wajibah — {fmt(results.wasiat.total)} {results.wasiat.capped&&<span style={{color:"var(--rose)",fontSize:9}}>(dipotong maks ⅓)</span>}</div>
          <table className="far-table"><thead><tr><th>Penerima</th><th>Jml</th><th>Hak</th><th>Per Orang</th></tr></thead><tbody>
            {results.wasiat.shares.map((w,i)=><tr key={i}><td>{w.heir}{w.names&&<div style={{fontSize:8,color:"var(--t3)"}}>({w.names.join(", ")})</div>}</td><td style={{fontFamily:"var(--f-mono)"}}>{w.count}</td><td style={{fontFamily:"var(--f-mono)",fontWeight:600}}>{fmt(w.amount)}</td><td style={{fontFamily:"var(--f-mono)",color:"var(--t3)"}}>{w.count>1?fmt(w.amountPer):"-"}</td></tr>)}
          </tbody></table>
        </div>
        <div style={{fontSize:10,color:"var(--t3)",marginBottom:6}}>Sisa harta setelah wasiat: {fmt(total-results.wasiat.total)}</div>
        {results.wasiat.faraidhAdj.length>0&&<FaraidhResultTable results={results.wasiat.faraidhAdj} total={total-results.wasiat.total} fmt={fmt} label="(B) Faraidh setelah Wasiat Wajibah"/>}
      </div>}
    </div>:results.faraidh&&results.faraidh.length>0?<FaraidhResultTable results={results.faraidh} total={total} fmt={fmt} label="Pembagian Waris"/>:<div style={{textAlign:"center",padding:20,color:"var(--t3)",fontSize:12}}>Tambahkan ahli waris untuk melihat perhitungan</div>}
    <div style={{marginTop:14,padding:"8px 10px",background:"var(--bg2)",borderRadius:6,fontSize:9,color:"var(--t3)",lineHeight:1.6,fontFamily:"var(--f-mono)"}}>⚖️ Disclaimer: Kalkulator ini menggunakan hukum faraidh dasar + wasiat wajibah (KHI Pasal 209). Untuk kasus kompleks (wasiat, hutang, dll), konsultasikan dengan ahli waris/ulama.</div>
  </div></div></div>)}
function IEModal({pp,onImport,onClose}){const[j,setJ]=useState("");const[t,setT]=useState("e");return<div className="modal-ov" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()}><div className="m-hdr"><h2>Data</h2><button className="btn btn-icon btn-ghost" onClick={onClose}><Ic.X/></button></div><div className="m-body"><div style={{display:"flex",gap:5,marginBottom:10}}><button className={`btn btn-sm ${t==="e"?"btn-p":""}`} onClick={()=>setT("e")}>Export</button><button className={`btn btn-sm ${t==="i"?"btn-p":""}`} onClick={()=>setT("i")}>Import</button></div>{t==="e"?<textarea className="fta" style={{minHeight:160,fontFamily:"var(--f-mono)",fontSize:9}} readOnly value={JSON.stringify(pp,null,2)}/>:<><textarea className="fta" style={{minHeight:160,fontFamily:"var(--f-mono)",fontSize:9}} value={j} onChange={e=>setJ(e.target.value)} placeholder="Paste JSON..."/><button className="btn btn-p btn-sm" style={{marginTop:6}} onClick={()=>{try{const d=JSON.parse(j);if(Array.isArray(d)){onImport(d);onClose()}}catch{alert("Invalid JSON")}}}>Import</button></>}</div></div></div>}

// ═══════════════════════════════════════════════════════════════
// APP ROOT
// ═══════════════════════════════════════════════════════════════
const ThemeCtx=React.createContext({theme:"dark",toggle:()=>{}});
function useTheme(){return React.useContext(ThemeCtx)}
function ThemeBtn(){const{theme,toggle}=useTheme();return<button className="theme-btn" onClick={toggle} title={theme==="dark"?"Light mode":"Dark mode"}>{theme==="dark"?"☀️":"🌙"}</button>}
export default function App(){
  const[user,setUser]=useState(null);const[af,setAf]=useState(null);const[adminView,setAdminView]=useState(false);const[loading,setLoading]=useState(true);
  const[theme,setTheme]=useState(()=>localStorage.getItem("nasab-theme")||"dark");
  useEffect(()=>{document.documentElement.setAttribute("data-theme",theme);localStorage.setItem("nasab-theme",theme);document.querySelector('meta[name="theme-color"]')?.setAttribute("content",theme==="dark"?"#07090e":"#f4f6f9")},[theme]);
  const toggle=useCallback(()=>setTheme(t=>t==="dark"?"light":"dark"),[]);
  useEffect(()=>{(async()=>{if(API.hasSession()){try{const u=await API.me();setUser(u)}catch{API.clearSession()}}setLoading(false)})()},[]);
  const login=async u=>{setUser(u)};
  const logout=async()=>{setUser(null);setAf(null);setAdminView(false);API.clearSession()};
  if(loading)return<div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--bg0)",fontFamily:"var(--f-display)",fontSize:20,color:"var(--t3)"}}>Loading...</div>;
  return<ThemeCtx.Provider value={{theme,toggle}}><style>{css}</style>{!user?<AuthScreen onLogin={login}/>:af?<Workspace family={af} user={user} onBack={()=>setAf(null)}/>:adminView?<AdminPanel user={user} onBack={()=>setAdminView(false)} onSelectFamily={f=>setAf(f)}/>:<Dashboard user={user} onLogout={logout} onSelectFamily={f=>setAf(f)} onCreateFamily={(u,f)=>{setUser(u);setAf(f)}} onAdmin={()=>setAdminView(true)}/>}</ThemeCtx.Provider>;
}
