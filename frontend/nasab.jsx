import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import LandingPage from "./src/LandingPage.jsx";

// ═══════════════════════════════════════════════════════════════════════
// NASAB — Jaga Nasabmu
// Modern Family Tree SaaS Platform for Indonesia
// Tech-forward • Multi-Tenant • RBAC • Geotagging • AI-ready Architecture
// ═══════════════════════════════════════════════════════════════════════

const APP = { name: "NASAB", tagline: "Jaga Nasabmu", domain: "nasab.id", version: __APP_VERSION__, build: __APP_BUILD__, developer: { name: "M Sopian Hadianto", role: "GRC Expert & AI-Powered Builder", org: "Labbaik AI" } };
const SK = "nasab-v5";
// Card sizing — Hybrid avatar layout
const CW = 176, CH = 120;   // Card width/height
const GX = 44, GY = 148;    // Horizontal/vertical gap
const CG = 18;              // Couple gap
const AVATAR_R = 24;        // Avatar radius (48px diameter)
const ACCENT_H = 3;         // Top accent bar height
const VW = { CANVAS:"canvas",MAP:"map",LIST:"list",STATS:"stats",TIMELINE:"timeline",INSIGHTS:"insights",KELUARGA:"keluarga" };
const RL = { OWNER:"owner",EDITOR:"editor",VIEWER:"viewer" };
const GL = [{l:"Kakek/Nenek",i:"👴"},{l:"Ayah/Ibu",i:"👨‍👩‍👧‍👦"},{l:"Anak",i:"🧒"},{l:"Cucu",i:"👶"},{l:"Cicit",i:"🌱"},{l:"Canggah",i:"🌿"}];
const GC = ["#14b8a6","#6366f1","#f59e0b","#ec4899","#8b5cf6","#f97316"];
const EVT=[{id:'nikah',l:'Pernikahan',i:'💍'},{id:'aqiqah',l:'Aqiqah',i:'🐑'},{id:'khitan',l:'Khitanan',i:'🎉'},{id:'syukuran',l:'Syukuran',i:'🤲'},{id:'reuni',l:'Reuni Keluarga',i:'👨‍👩‍👧‍👦'},{id:'tahlilan',l:'Tahlilan',i:'📿'},{id:'arisan',l:'Arisan',i:'💰'},{id:'milad',l:'Ulang Tahun',i:'🎂'},{id:'wisuda',l:'Wisuda',i:'🎓'},{id:'lainnya',l:'Lainnya',i:'📅'}];
const ATYP=[{id:'cash',l:'Tabungan',i:'💰',u:'Rp'},{id:'gold',l:'Emas',i:'🥇',u:'gram'},{id:'property',l:'Properti',i:'🏠',u:'Rp'},{id:'vehicle',l:'Kendaraan',i:'🚗',u:'Rp'},{id:'stock',l:'Saham Syariah',i:'📈',u:'Rp'},{id:'deposit',l:'Deposito',i:'🏦',u:'Rp'},{id:'business',l:'Usaha',i:'🏢',u:'Rp'},{id:'receivable',l:'Piutang',i:'📋',u:'Rp'},{id:'other',l:'Lainnya',i:'📦',u:'Rp'}];

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
const mFromAPI=m=>({id:m.id,name:m.name,gender:m.gender,birthDate:m.birth_date||'',deathDate:m.death_date||'',birthPlace:m.birth_place||'',notes:m.notes||'',parentId:m.parent_id||null,spouseId:m.spouse_id||null,location:m.location_lat?{lat:m.location_lat,lng:m.location_lng,address:m.location_address||''}:null,photo:m.photo||'',nik:m.nik||'',agama:m.agama||'islam',noKk:m.no_kk||'',createdAt:m.created_at});
const mToAPI=m=>({name:m.name,gender:m.gender,birth_date:m.birthDate||'',death_date:m.deathDate||'',birth_place:m.birthPlace||'',notes:m.notes||'',parent_id:m.parentId||null,spouse_id:m.spouseId||null,location_lat:m.location?.lat||null,location_lng:m.location?.lng||null,location_address:m.location?.address||'',nik:m.nik||'',agama:m.agama||'islam',no_kk:m.noKk||''});
const API={
  token:localStorage.getItem(TK),
  async _f(path,opts={}){const h={'Content-Type':'application/json'};if(this.token)h['Authorization']=`Bearer ${this.token}`;const r=await fetch(`${API_URL}${path}`,{...opts,headers:h});const d=await r.json();if(!r.ok)throw new Error(d.error||'Request failed');return d},
  async register({name,email,password}){const d=await this._f('/api/auth/register',{method:'POST',body:JSON.stringify({name,email,password})});this.token=d.token;localStorage.setItem(TK,d.token);return d.user},
  async login({email,password}){const d=await this._f('/api/auth/login',{method:'POST',body:JSON.stringify({email,password})});this.token=d.token;localStorage.setItem(TK,d.token);return d.user},
  async resetPassword({email,name,new_password}){return this._f('/api/auth/reset-password',{method:'POST',body:JSON.stringify({email,name,new_password})})},
  async me(){return(await this._f('/api/auth/me')).user},
  async getFamilies(){const d=await this._f('/api/families');return d.families.map(f=>({...f,myRole:f.my_role}))},
  async createFamily({name,description}){return(await this._f('/api/families',{method:'POST',body:JSON.stringify({name,description})})).family},
  async getFamily(fid){const d=await this._f(`/api/families/${fid}`);return{...d.family,members:d.members.map(mFromAPI),positions:d.positions||{},stories:(d.stories||[]).map(s=>({id:s.id,text:s.text_content,personId:s.person_id,personName:s.person_name||'',author:s.author_name||'',date:s.created_at})),collaborators:(d.collaborators||[]).map(c=>({userId:c.user_id,name:c.name,role:c.role})),invites:d.invites||[],marriages:(d.marriages||[]).map(m=>({id:m.id,husbandId:m.husband_id,wifeId:m.wife_id,order:m.marriage_order||1,date:m.marriage_date||'',divorceDate:m.divorce_date||'',notes:m.notes||''})),myRole:d.my_role}},
  async addMember(fid,m){return this._f(`/api/families/${fid}/members`,{method:'POST',body:JSON.stringify(mToAPI(m))})},
  async updateMember(fid,mid,m){return this._f(`/api/families/${fid}/members/${mid}`,{method:'PUT',body:JSON.stringify(mToAPI(m))})},
  async deleteMember(fid,mid){return this._f(`/api/families/${fid}/members/${mid}`,{method:'DELETE'})},
  async deleteAllMembers(fid){return this._f(`/api/families/${fid}/members/all`,{method:'DELETE'})},
  async savePositions(fid,positions){return this._f(`/api/families/${fid}/positions`,{method:'PUT',body:JSON.stringify({positions})})},
  async addStory(fid,s){return this._f(`/api/families/${fid}/stories`,{method:'POST',body:JSON.stringify({text:s.text,person_id:s.personId,person_name:s.personName})})},
  async deleteStory(fid,sid){return this._f(`/api/families/${fid}/stories/${sid}`,{method:'DELETE'})},
  async addMarriage(fid,m){return this._f(`/api/families/${fid}/marriages`,{method:'POST',body:JSON.stringify(m)})},
  async deleteMarriage(fid,mid){return this._f(`/api/families/${fid}/marriages/${mid}`,{method:'DELETE'})},
  async invite(fid,email,role){return this._f(`/api/families/${fid}/invite`,{method:'POST',body:JSON.stringify({email,role})})},
  async adminStats(){return this._f('/api/admin/stats')},
  async adminUsers(){return(await this._f('/api/admin/users')).users},
  async adminFamilies(){return(await this._f('/api/admin/families')).families},
  async setUserRole(uid,role){return this._f(`/api/admin/users/${uid}/role`,{method:'PUT',body:JSON.stringify({role})})},
  async deleteUser(uid){return this._f(`/api/admin/users/${uid}`,{method:'DELETE'})},
  async adminAudit(params={}){const q=new URLSearchParams(params).toString();return(await this._f(`/api/admin/audit?${q}`)).logs},
  // Events
  async getEvents(fid){return(await this._f(`/api/families/${fid}/events`)).events},
  async createEvent(fid,e){return this._f(`/api/families/${fid}/events`,{method:'POST',body:JSON.stringify(e)})},
  async updateEvent(fid,eid,e){return this._f(`/api/families/${fid}/events/${eid}`,{method:'PUT',body:JSON.stringify(e)})},
  async deleteEvent(fid,eid){return this._f(`/api/families/${fid}/events/${eid}`,{method:'DELETE'})},
  async rsvp(eid,data){return this._f(`/api/events/${eid}/rsvp`,{method:'POST',body:JSON.stringify(data)})},
  async getPublicEvent(slug){return this._f(`/api/events/public/${slug}`)},
  // Feed
  async getFeed(fid){return(await this._f(`/api/families/${fid}/feed`)).posts},
  async createPost(fid,p){return this._f(`/api/families/${fid}/posts`,{method:'POST',body:JSON.stringify(p)})},
  async deletePost(fid,pid){return this._f(`/api/families/${fid}/posts/${pid}`,{method:'DELETE'})},
  async toggleLike(pid){return this._f(`/api/posts/${pid}/like`,{method:'POST'})},
  async addComment(pid,content){return this._f(`/api/posts/${pid}/comments`,{method:'POST',body:JSON.stringify({content})})},
  async deleteComment(cid){return this._f(`/api/comments/${cid}`,{method:'DELETE'})},
  clearSession(){this.token=null;localStorage.removeItem(TK)},
  hasSession(){return!!this.token}
};

// ─── AI ABSTRACTION ─────────────────────────────────────────
// All AI calls go through Worker proxy at /api/ai/proxy. The user's
// provider API key is stored encrypted in D1 (server-side) and never
// crosses the wire after the initial PUT — eliminates the XSS-to-key
// exfiltration risk that the old localStorage approach had.
const AI_PROVIDERS={groq:{l:'Groq',k:'nasab-groq-key',d:'Gratis & cepat (Llama 3)'},claude:{l:'Claude',k:'nasab-claude-key',d:'Lebih detail (Anthropic)'},gemini:{l:'Gemini',k:'nasab-gemini-key',d:'Gratis (Google AI)'}};
async function callAIRaw(provider,payload){
  if(!API.token)throw new Error('Belum login — masuk dulu untuk pakai AI');
  const r=await fetch(`${API_URL}/api/ai/proxy`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${API.token}`},body:JSON.stringify({provider,payload})});
  const d=await r.json();
  if(!r.ok)throw new Error(d.error||`AI proxy error (${r.status})`);
  return d;
}
async function callAI(prompt,systemPrompt=''){
  const prov=localStorage.getItem('nasab-ai-provider')||'groq';
  let payload;
  if(prov==='groq'){
    payload={model:'llama-3.3-70b-versatile',messages:[...(systemPrompt?[{role:'system',content:systemPrompt}]:[]),{role:'user',content:prompt}],max_tokens:2000,temperature:0.7};
    const d=await callAIRaw('groq',payload);return d.choices?.[0]?.message?.content||'Gagal generate';
  }
  if(prov==='claude'){
    payload={model:'claude-sonnet-4-20250514',max_tokens:2000,messages:[{role:'user',content:(systemPrompt?systemPrompt+'\n\n':'')+prompt}]};
    const d=await callAIRaw('claude',payload);return d.content?.[0]?.text||'Gagal generate';
  }
  payload={model:'gemini-2.0-flash',contents:[{parts:[{text:(systemPrompt?systemPrompt+'\n\n':'')+prompt}]}],generationConfig:{maxOutputTokens:2000,temperature:0.7}};
  const d=await callAIRaw('gemini',payload);return d.candidates?.[0]?.content?.parts?.[0]?.text||'Gagal generate';
}

// ─── FAMILY ENGINE ───────────────────────────────────────────
const FE={
  ch:(pp,pid)=>pp.filter(p=>p.parentId===pid),
  // chAll: includes spouse's children (for display/counting, NOT layout)
  chAll:(pp,pid,marriages)=>{const direct=pp.filter(p=>p.parentId===pid);if(direct.length)return direct;
    const person=pp.find(p=>p.id===pid);if(!person)return[];
    if(person.spouseId){const sc=pp.filter(p=>p.parentId===person.spouseId);if(sc.length)return sc}
    if(marriages){const ms=marriages.filter(m=>m.husbandId===pid||m.wifeId===pid);for(const mr of ms){const pid2=mr.husbandId===pid?mr.wifeId:mr.husbandId;const mc=pp.filter(p=>p.parentId===pid2);if(mc.length)return mc}}
    return[]},
  sp:(pp,p)=>p.spouseId?pp.find(x=>x.id===p.spouseId)||null:null,
  // All spouses via marriages table (polygamy). Falls back to spouseId if no marriages.
  spouses:(pp,p,marriages=[])=>{const ms=marriages.filter(m=>m.husbandId===p.id||m.wifeId===p.id);if(ms.length){const sids=[...new Set(ms.map(m=>m.husbandId===p.id?m.wifeId:m.husbandId))];return sids.map(sid=>pp.find(x=>x.id===sid)).filter(Boolean)}return p.spouseId?[pp.find(x=>x.id===p.spouseId)].filter(Boolean):[]},
  pa:(pp,p)=>p.parentId?pp.find(x=>x.id===p.parentId)||null:null,
  sib:(pp,p)=>p.parentId?pp.filter(x=>x.parentId===p.parentId&&x.id!==p.id):[],
  roots:(pp,marriages=[])=>pp.filter(p=>!p.parentId&&!pp.some(x=>x.spouseId===p.id&&x.parentId)&&!marriages.some(m=>m.wifeId===p.id&&pp.find(h=>h.id===m.husbandId)?.parentId)),
  gen:(pp,pid,g=0)=>{const p=pp.find(x=>x.id===pid);return(!p||!p.parentId)?g:FE.gen(pp,p.parentId,g+1)},
  desc:(pp,pid)=>{const c=FE.ch(pp,pid);return c.reduce((s,x)=>s+1+FE.desc(pp,x.id),0)},
  descAll:(pp,pid,marriages)=>{const c=FE.chAll(pp,pid,marriages);return c.reduce((s,x)=>s+1+FE.descAll(pp,x.id,marriages),0)},
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
  filter(pp,f){let r=[...pp];if(f.gender&&f.gender!=="all")r=r.filter(p=>p.gender===f.gender);if(f.generation!==undefined&&f.generation!=="all")r=r.filter(p=>FE.gen(pp,p.id)===parseInt(f.generation));if(f.status==="living")r=r.filter(p=>!p.deathDate);if(f.status==="deceased")r=r.filter(p=>p.deathDate);if(f.location)r=r.filter(p=>(p.location?.address||"").toLowerCase().includes(f.location.toLowerCase()));if(f.nik==="has")r=r.filter(p=>p.nik&&p.nik.length>0);if(f.nik==="none")r=r.filter(p=>!p.nik||p.nik.length===0);if(f.provNik&&f.provNik!=="all")r=r.filter(p=>p.nik&&p.nik.length>=2&&parseInt(p.nik.slice(0,2))===parseInt(f.provNik));return r},
};

// ─── DATA QUALITY CHECKER ───────────────────────────────────
function validateFamilyData(pp,marriages){
  const issues=[];
  pp.forEach(p=>{
    if(p.parentId&&p.birthDate){const par=pp.find(x=>x.id===p.parentId);if(par?.birthDate){const gap=new Date(p.birthDate).getFullYear()-new Date(par.birthDate).getFullYear();
      if(gap<12)issues.push({sev:'critical',msg:`${p.name} lahir ${gap} tahun setelah ${par.name} — terlalu dekat`,person:p});
      if(gap>70)issues.push({sev:'warning',msg:`${p.name} lahir ${gap} tahun setelah ${par.name} — sangat jauh`,person:p})}}
    if(p.deathDate){pp.filter(c=>c.parentId===p.id&&c.birthDate).forEach(c=>{const diff=Math.floor((new Date(c.birthDate)-new Date(p.deathDate))/864e5);
      if(diff>280)issues.push({sev:'warning',msg:`${c.name} lahir ${diff} hari setelah ${p.name} wafat`,person:c})})}
    if(p.nik&&p.nik.length===16){const dups=pp.filter(x=>x.id!==p.id&&x.nik===p.nik);
      if(dups.length)issues.push({sev:'critical',msg:`NIK ${p.name} sama dengan ${dups.map(d=>d.name).join(', ')}`,person:p})}
    if(p.birthDate&&new Date(p.birthDate)>new Date())issues.push({sev:'warning',msg:`${p.name} tanggal lahir di masa depan`,person:p});
    if(p.birthDate&&p.deathDate&&new Date(p.deathDate)<new Date(p.birthDate))issues.push({sev:'critical',msg:`${p.name} wafat sebelum lahir`,person:p});
    if(!p.parentId&&!p.spouseId&&!pp.some(c=>c.parentId===p.id)&&!marriages.some(m=>m.husbandId===p.id||m.wifeId===p.id))issues.push({sev:'info',msg:`${p.name} tidak terhubung ke siapapun`,person:p});
    if(!p.birthDate)issues.push({sev:'info',msg:`${p.name} belum ada tanggal lahir`,person:p});
    if(!p.gender||(p.gender!=='male'&&p.gender!=='female'))issues.push({sev:'warning',msg:`${p.name} gender tidak valid`,person:p});
  });
  return issues.sort((a,b)=>({critical:0,warning:1,info:2}[a.sev]||2)-({critical:0,warning:1,info:2}[b.sev]||2));
}

// ─── POV TREE (MyHeritage-style branch navigation) ──────────
// Descendants of root, including children co-parented via a spouse (parent_id points to spouse)
function bloodDescendants(pp,rootId,marriages=[]){
  const desc=new Set();const q=[rootId];
  while(q.length){const id=q.shift();if(desc.has(id))continue;desc.add(id);
    FE.ch(pp,id).forEach(c=>q.push(c.id));
    // Children via co-parent (spouse): their parent_id may point to spouse, not this person
    marriages.filter(m=>m.husbandId===id||m.wifeId===id).forEach(m=>{
      const sid=m.husbandId===id?m.wifeId:m.husbandId;
      FE.ch(pp,sid).forEach(c=>q.push(c.id))});
    const p=pp.find(x=>x.id===id);if(p?.spouseId)FE.ch(pp,p.spouseId).forEach(c=>q.push(c.id));
  }
  desc.delete(rootId);return desc;
}
function isBloodRelative(pp,personId,rootId,marriages=[]){
  if(personId===rootId)return true;
  // Root's ancestor chain
  const rootAnc=new Set();let cur=rootId;
  while(cur){rootAnc.add(cur);const p=pp.find(x=>x.id===cur);cur=p?.parentId||null}
  // Person or any of their ancestors in root's ancestry → blood relative
  cur=personId;while(cur){if(rootAnc.has(cur))return true;const p=pp.find(x=>x.id===cur);cur=p?.parentId||null}
  // Person is descendant of root (including co-parented via spouse)
  return bloodDescendants(pp,rootId,marriages).has(personId);
}
function getPOVMembers(pp,rootId,marriages=[]){
  const root=pp.find(p=>p.id===rootId);
  if(!root)return{visible:pp,branches:[]};
  const vis=new Set([rootId]);const branches=[];
  const addBranch=(sid)=>{if(!isBloodRelative(pp,sid,rootId,marriages)&&!branches.some(b=>b.personId===sid)){
    const sp=pp.find(x=>x.id===sid);if(sp)branches.push({personId:sid,name:sp.name})}};
  // Ancestors upward (include each ancestor's spouses)
  const addAnc=pid=>{const p=pp.find(x=>x.id===pid);if(!p)return;if(p.parentId){vis.add(p.parentId);
    const par=pp.find(x=>x.id===p.parentId);if(par)FE.spouses(pp,par,marriages).forEach(s=>vis.add(s.id));
    addAnc(p.parentId)}};
  addAnc(rootId);
  // Descendants downward — traverse direct children AND children co-parented via spouses
  const seen=new Set();
  const addDesc=pid=>{if(seen.has(pid))return;seen.add(pid);
    const person=pp.find(x=>x.id===pid);
    const kids=new Map();
    FE.ch(pp,pid).forEach(c=>kids.set(c.id,c));
    marriages.filter(m=>m.husbandId===pid||m.wifeId===pid).forEach(m=>{
      const sid=m.husbandId===pid?m.wifeId:m.husbandId;vis.add(sid);addBranch(sid);
      FE.ch(pp,sid).forEach(c=>kids.set(c.id,c))});
    if(person?.spouseId){vis.add(person.spouseId);addBranch(person.spouseId);
      FE.ch(pp,person.spouseId).forEach(c=>kids.set(c.id,c))}
    kids.forEach(child=>{vis.add(child.id);
      FE.spouses(pp,child,marriages).forEach(s=>{vis.add(s.id);addBranch(s.id)});
      addDesc(child.id)});
  };
  addDesc(rootId);
  // Root's spouses (redundant with addDesc but kept for the branch-label path)
  FE.spouses(pp,root,marriages).forEach(s=>{vis.add(s.id);addBranch(s.id)});
  // Root's siblings + their descendants
  FE.sib(pp,root).forEach(s=>{vis.add(s.id);addDesc(s.id)});
  return{visible:pp.filter(p=>vis.has(p.id)),branches};
}

// ─── LAYOUT / CONNECTORS ─────────────────────────────────────
const MAX_COLS=4; // wrap siblings after this many
function autoLayout(pp,marriages=[],collapsed=new Set()){const roots=FE.roots(pp,marriages);const pos={};const HGAP=GX+8;
  function isVis(pid){let cur=pp.find(x=>x.id===pid);while(cur&&cur.parentId){if(collapsed.has(cur.parentId))return false;cur=pp.find(x=>x.id===cur.parentId)}return true}
  // Width of person card + spouse cards
  function unitW(pid){const p=pp.find(x=>x.id===pid);if(!p)return CW;return CW+FE.spouses(pp,p,marriages).length*(CW+CG)}
  // Cached subtree width (horizontal) and height (generation rows)
  const wC={},hC={};
  function stW(pid){if(wC[pid]!=null)return wC[pid];const ch=(collapsed.has(pid)?[]:FE.ch(pp,pid)).filter(c=>isVis(c.id));const uw=unitW(pid);
    if(!ch.length)return(wC[pid]=uw);const rows=[];for(let i=0;i<ch.length;i+=MAX_COLS)rows.push(ch.slice(i,i+MAX_COLS));
    let maxRW=0;rows.forEach(row=>{maxRW=Math.max(maxRW,row.reduce((s,c,i)=>s+(i?HGAP:0)+stW(c.id),0))});return(wC[pid]=Math.max(uw,maxRW))}
  function stH(pid){if(hC[pid]!=null)return hC[pid];const ch=(collapsed.has(pid)?[]:FE.ch(pp,pid)).filter(c=>isVis(c.id));
    if(!ch.length)return(hC[pid]=1);const rows=[];for(let i=0;i<ch.length;i+=MAX_COLS)rows.push(ch.slice(i,i+MAX_COLS));
    let h=0;rows.forEach(row=>{h+=Math.max(...row.map(c=>stH(c.id)))});return(hC[pid]=1+h)}
  // Top-down absolute positioning — no shift() needed
  function place(pid,x,d){const p=pp.find(z=>z.id===pid);if(!p||pos[pid])return;
    const ch=(collapsed.has(pid)?[]:FE.ch(pp,pid)).filter(c=>isVis(c.id));const uw=unitW(pid);const sw=stW(pid);const y=d*(CH+GY);
    // Center person+spouses within subtree width
    pos[pid]={x:x+(sw-uw)/2,y};const sps=FE.spouses(pp,p,marriages);let sx=pos[pid].x+CW+CG;
    sps.forEach(s=>{if(!pos[s.id]){pos[s.id]={x:sx,y};sx+=CW+CG}});
    if(!ch.length)return;
    const rows=[];for(let i=0;i<ch.length;i+=MAX_COLS)rows.push(ch.slice(i,i+MAX_COLS));
    // Place each row — yOff tracks cumulative generation offset so wrapped rows don't overlap grandchildren
    let yOff=0;rows.forEach(row=>{const rowW=row.reduce((s,c,i)=>s+(i?HGAP:0)+stW(c.id),0);let cx=x+(sw-rowW)/2;
      row.forEach(c=>{place(c.id,cx,d+1+yOff);cx+=stW(c.id)+HGAP});
      yOff+=Math.max(...row.map(c=>stH(c.id)))})}
  // Place each root tree side by side
  let gx=0;roots.forEach(root=>{place(root.id,gx,0);gx+=stW(root.id)+GX*4});
  // Normalize to origin
  let mx=Infinity,my=Infinity;Object.values(pos).forEach(p=>{mx=Math.min(mx,p.x);my=Math.min(my,p.y)});Object.values(pos).forEach(p=>{p.x-=mx-100;p.y-=my-80});return pos}
const REL_LABELS=["Anak","Cucu","Cicit","Canggah","Wareng"];
function getConns(pp,pos,marriages=[]){const L=[];const drawnSp=new Set();
  // Draw spouse connectors from marriages + fallback to spouseId
  pp.forEach(p=>{const ps=pos[p.id];if(!ps)return;
    const sps=FE.spouses(pp,p,marriages);
    sps.forEach(sp=>{if(!pos[sp.id])return;const k=[p.id,sp.id].sort().join("_");if(drawnSp.has(k))return;drawnSp.add(k);
      L.push({t:"sp",x1:Math.min(ps.x,pos[sp.id].x)+CW,y1:ps.y+CH/2,x2:Math.max(ps.x,pos[sp.id].x),y2:pos[sp.id].y+CH/2})});
    // Parent→child connectors
    const ch=FE.ch(pp,p.id);if(ch.length){const pg=FE.gen(pp,p.id);
      const allSps=sps.filter(s=>pos[s.id]);const rightmost=allSps.length?Math.max(ps.x,...allSps.map(s=>pos[s.id].x))+CW:ps.x+CW;
      const cw=rightmost-ps.x;const pcx=ps.x+cw/2,pb=ps.y+CH;
      const ct=ch.map(c=>{const cp=pos[c.id];if(!cp)return null;const csps=FE.spouses(pp,c,marriages).filter(s=>pos[s.id]);const cr=csps.length?Math.max(cp.x,...csps.map(s=>pos[s.id].x))+CW:cp.x+CW;return{cx:(cp.x+cr)/2,y:cp.y,name:c.name,gender:c.gender}}).filter(Boolean);
      if(ct.length){const my=pb+GY/2;const rl=REL_LABELS[pg]||`Gen ${pg+2}`;const cnt=ct.length;
        L.push({t:"pd",x1:pcx,y1:pb,x2:pcx,y2:my,label:`${cnt} ${rl}`,count:cnt});
        if(ct.length>1)L.push({t:"br",x1:Math.min(...ct.map(c=>c.cx)),y1:my,x2:Math.max(...ct.map(c=>c.cx)),y2:my});
        ct.forEach(c=>L.push({t:"cd",x1:c.cx,y1:my,x2:c.cx,y2:c.y,name:c.name,gender:c.gender}))}}});return L}

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
.cvs{width:100%;height:100%;position:relative;overflow:hidden;background:var(--bg0);cursor:grab;touch-action:none;background-image:radial-gradient(circle at 1px 1px,var(--bdr) .5px,transparent 0);background-size:32px 32px}.cvs.grabbing{cursor:grabbing}
.cvs-inner{position:absolute;top:0;left:0;transform-origin:0 0}
/* Cards - glassmorphism */
.cc{position:absolute;width:${CW}px;min-height:${CH}px;background:var(--bg2);border:1px solid var(--bdr);border-radius:12px;cursor:grab;user-select:none;transition:transform .15s,box-shadow .2s,border-color .2s;overflow:visible;z-index:10;display:flex;flex-direction:column;align-items:center;padding-top:10px;backdrop-filter:blur(8px)}
.cc:hover{z-index:20;border-color:var(--bdr2);box-shadow:0 4px 16px rgba(0,0,0,.35);transform:translateY(-1px)}
.cc.dragging{z-index:50;box-shadow:0 8px 28px rgba(0,0,0,.5);opacity:.92;cursor:grabbing;transform:scale(1.02)}
.cc.selected{border-color:var(--pri);box-shadow:0 0 0 2px rgba(20,184,166,.18),0 4px 16px rgba(0,0,0,.35)}
.cc.male{border-top:${ACCENT_H}px solid var(--male-t)}.cc.female{border-top:${ACCENT_H}px solid var(--fem-t)}
.cc.deceased{opacity:.62}.cc.deceased::after{content:'almh.';position:absolute;bottom:6px;right:8px;font-size:8px;font-family:var(--f-mono);color:var(--t3);font-weight:500;letter-spacing:.4px;pointer-events:none}
.cc.b0{background:var(--bg2)}
.cc.b1{background:linear-gradient(rgba(20,184,166,.05),rgba(20,184,166,.05)),var(--bg2)}
.cc.b2{background:linear-gradient(rgba(99,102,241,.05),rgba(99,102,241,.05)),var(--bg2)}
.cc.b3{background:linear-gradient(rgba(245,158,11,.05),rgba(245,158,11,.05)),var(--bg2)}
.cc.b4{background:linear-gradient(rgba(236,72,153,.05),rgba(236,72,153,.05)),var(--bg2)}
.cc.b5{background:linear-gradient(rgba(139,92,246,.05),rgba(139,92,246,.05)),var(--bg2)}
.cc.b6{background:linear-gradient(rgba(249,115,22,.05),rgba(249,115,22,.05)),var(--bg2)}
.cc.b7{background:linear-gradient(rgba(14,165,233,.05),rgba(14,165,233,.05)),var(--bg2)}
.cc-av{width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;font-family:var(--f-display);flex-shrink:0;background:var(--bg1);margin-bottom:6px;position:relative}
.cc-av.male{color:var(--male-t);border:1.5px solid var(--male-bdr)}
.cc-av.female{color:var(--fem-t);border:1.5px solid var(--fem-bdr)}
.cc-status{position:absolute;bottom:-1px;right:-1px;width:10px;height:10px;border-radius:50%;border:2px solid var(--bg2)}
.cc-nm{font-size:13px;font-weight:500;line-height:1.25;text-align:center;padding:0 10px;max-width:100%;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.cc-mt{font-size:11px;color:var(--t3);margin-top:4px;text-align:center;font-family:var(--f-mono);letter-spacing:.2px}
.cc-badge-gen{position:absolute;top:6px;left:6px;font-size:9px;font-family:var(--f-mono);font-weight:600;padding:2px 6px;border-radius:8px;background:var(--bg1);color:var(--t3);letter-spacing:.3px;z-index:2}
.cc-badge-nik{position:absolute;top:6px;right:6px;font-size:8px;font-family:var(--f-mono);font-weight:600;padding:2px 5px;border-radius:8px;background:rgba(20,184,166,.12);color:var(--pri);letter-spacing:.4px;z-index:2}
/* Expand/collapse toggle */
.cc-toggle{position:absolute;bottom:-12px;left:50%;transform:translateX(-50%);width:24px;height:16px;border-radius:0 0 8px 8px;border:1px solid var(--bdr);border-top:none;background:var(--bg1);display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:15;font-size:8px;font-weight:700;font-family:var(--f-mono);color:var(--pri);transition:all .15s;pointer-events:auto}
.cc-toggle:hover{background:var(--pri);color:#000;transform:translateX(-50%) scale(1.1)}
.cc-branch{position:absolute;bottom:-20px;left:50%;transform:translateX(-50%);font-size:7px;color:var(--pri);background:var(--bg2);border:1px dashed var(--pri);border-radius:8px;padding:2px 8px;cursor:pointer;white-space:nowrap;opacity:.7;transition:all .2s;z-index:15;pointer-events:auto}
.cc-branch:hover{opacity:1;background:rgba(20,184,166,.12);border-style:solid}
/* POV bar */
.pov-bar{position:absolute;top:0;left:0;right:0;z-index:60;display:flex;align-items:center;justify-content:space-between;padding:4px 12px;background:var(--bg1);border-bottom:1px solid var(--bdr);font-size:10px;gap:8px;backdrop-filter:blur(8px);min-height:28px}
.pov-left{display:flex;align-items:center;gap:2px;overflow:hidden;flex:1;min-width:0}
.pov-right{display:flex;align-items:center;gap:6px;flex-shrink:0}
.pov-crumb{background:none;border:none;color:var(--pri);cursor:pointer;font-size:10px;font-family:var(--f-body);padding:2px 4px;border-radius:3px}
.pov-crumb:hover{background:var(--bg3);text-decoration:underline}
.pov-sep{color:var(--t3);margin:0 1px}
.pov-current{font-weight:600;color:var(--t1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pov-count{color:var(--t3);font-family:var(--f-mono);font-size:9px;margin-left:6px;white-space:nowrap}
.pov-show-all{background:none;border:1px solid var(--bdr);border-radius:4px;color:var(--pri);cursor:pointer;font-size:9px;padding:2px 8px;font-family:var(--f-body)}
.pov-show-all:hover{background:var(--bg3)}
.pov-sel{padding:2px 6px;background:var(--bg2);border:1px solid var(--bdr);border-radius:4px;color:var(--t1);font-size:9px;font-family:var(--f-body);max-width:120px}
.pov-toggle{padding:2px 8px;border-radius:4px;border:1px solid var(--bdr);background:var(--bg2);color:var(--t2);cursor:pointer;font-size:9px;font-weight:600;font-family:var(--f-mono)}
.pov-toggle.on{background:var(--pri);color:#000;border-color:var(--pri)}
/* Search overlay on canvas */
.cvs-search{position:absolute;top:40px;left:50%;transform:translateX(-50%);z-index:70;width:280px;max-width:calc(100vw - 120px)}
.cvs-search-input{width:100%;padding:8px 12px 8px 32px;background:var(--bg1);border:1px solid var(--bdr);border-radius:20px;color:var(--t1);font-size:12px;font-family:var(--f-body);outline:none;backdrop-filter:blur(8px);box-shadow:0 4px 16px rgba(0,0,0,.3);transition:border .2s}
.cvs-search-input:focus{border-color:var(--pri);box-shadow:0 4px 16px rgba(0,0,0,.3),0 0 0 2px rgba(20,184,166,.15)}
.cvs-search-icon{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--t3);pointer-events:none}
.cvs-search-results{margin-top:4px;background:var(--bg1);border:1px solid var(--bdr);border-radius:10px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,.4);max-height:200px;overflow-y:auto}
.cvs-search-item{display:flex;align-items:center;gap:8px;padding:8px 12px;font-size:11px;cursor:pointer;transition:background .1s;border-bottom:1px solid var(--bdr)}
.cvs-search-item:last-child{border-bottom:none}
.cvs-search-item:hover,.cvs-search-item.active{background:var(--bg3)}
.cvs-search-item .s-av{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;font-family:var(--f-display);flex-shrink:0}
/* Highlight ring animation */
@keyframes highlightPulse{0%{box-shadow:0 0 0 0 rgba(20,184,166,.5)}50%{box-shadow:0 0 0 12px rgba(20,184,166,0)}100%{box-shadow:0 0 0 0 rgba(20,184,166,0)}}
.cc.highlighted{border-color:var(--pri)!important;animation:highlightPulse 1.5s ease-out 3}
.conn-svg{position:absolute;top:0;left:0;pointer-events:none;z-index:5}
@keyframes flowDash{from{stroke-dashoffset:20}to{stroke-dashoffset:0}}
.zm{position:absolute;bottom:14px;right:14px;display:flex;flex-direction:column;gap:3px;z-index:60;backdrop-filter:blur(8px)}
.zm button{width:32px;height:32px;border-radius:8px;border:1px solid var(--bdr);background:var(--bg2);color:var(--t1);font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:var(--f-body);transition:all .15s}.zm button:hover{background:var(--bg3);transform:translateY(-1px);box-shadow:0 2px 8px rgba(0,0,0,.3)}
.mm{position:absolute;bottom:14px;left:14px;width:150px;height:80px;background:var(--bg1);border:1px solid var(--bdr);border-radius:var(--rs);overflow:hidden;z-index:60;opacity:.6;transition:all .2s;backdrop-filter:blur(4px)}.mm:hover{opacity:1;box-shadow:0 4px 16px rgba(0,0,0,.3)}

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
/* PWA Install Banner */
.pwa-banner{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:10px;background:var(--bg1);border:1px solid var(--pri);border-radius:12px;padding:10px 14px;z-index:400;box-shadow:0 8px 32px rgba(0,0,0,.4);animation:mUp .3s ease;max-width:calc(100vw - 32px)}
.pwa-icon{font-size:24px;flex-shrink:0}
.pwa-text{flex:1;min-width:0}.pwa-text b{display:block;font-size:13px;font-weight:600}.pwa-text span{font-size:10px;color:var(--t3)}
@media(max-width:480px){.pwa-banner{bottom:8px;padding:8px 10px;gap:8px}.pwa-text b{font-size:12px}}
/* Theme toggle */
.theme-btn{width:32px;height:32px;border-radius:var(--rs);border:1px solid var(--bdr);background:var(--bg2);color:var(--t2);font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0;padding:0}
.theme-btn:hover{background:var(--bg3);border-color:var(--bdr2);transform:translateY(-1px)}
[data-theme="light"] .auth-hero{background:linear-gradient(160deg,#eef2f7 0%,#e4eaf2 50%,#dce4ef 100%)}
[data-theme="light"] .auth-hero::before{background:radial-gradient(circle,rgba(13,148,136,.06) 0%,transparent 70%)}
[data-theme="light"] .auth-hero::after{background:radial-gradient(circle,rgba(79,70,229,.04) 0%,transparent 70%)}
[data-theme="light"] .cvs{background-image:radial-gradient(circle at 1px 1px,var(--bdr) .5px,transparent 0)}
[data-theme="light"] .cc{box-shadow:0 2px 8px rgba(0,0,0,.08);backdrop-filter:none;background:var(--bg1)}
[data-theme="light"] .cc:hover{box-shadow:0 8px 24px rgba(0,0,0,.12);transform:translateY(-3px)}
[data-theme="light"] .cc.male::before{background:radial-gradient(ellipse at 30% 0%,rgba(3,105,161,.06),transparent 70%)}
[data-theme="light"] .cc.female::before{background:radial-gradient(ellipse at 30% 0%,rgba(190,24,93,.06),transparent 70%)}
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
  .auth-form-side{padding:18px 14px}
  .auth-form h2{font-size:18px}
  .ws-brand span:not(h1){display:none}
  .ws-brand h1{font-size:12px}
  .ws-hdr{padding:5px 6px;gap:4px}
  .navt{padding:3px 5px;font-size:8px}
  .btn-sm{padding:3px 5px;font-size:9px}
  .sbox{min-width:60px;padding:3px 5px}
  .sbox input{font-size:9px}
  .ws-actions{gap:2px}
  .sg{grid-template-columns:1fr}
  .admin-stats{grid-template-columns:1fr}
  .dash-grid{grid-template-columns:1fr;gap:12px}
  .dash-hdr{padding:6px 10px;gap:4px}
  .dash-hdr h1{font-size:14px}
  .dash-user{font-size:10px;gap:3px}
  .dash-user b{max-width:64px}
  .dash-av{width:24px;height:24px;font-size:9px}
  .dash-body{padding:10px}
  .fam-card{padding:12px}
  .fam-card h3{font-size:13px}
  .fam-card p{font-size:10px}
  .fam-card-stats{font-size:9px;gap:6px;flex-wrap:wrap}
  .li{gap:6px;padding:6px 7px}
  .li-av{width:26px;height:26px;font-size:9px;border-radius:5px}
  .li-info h4{font-size:10px}
  .li-info p{font-size:8px}
  .li-badge{font-size:6px;padding:1px 3px}
  .modal-ov{padding:6px}
  .m-h{padding:10px 12px}
  .m-h h2{font-size:14px}
  .m-b{padding:10px 12px}
  .m-f{padding:8px 12px;flex-wrap:wrap}
  .cc-menu{min-width:108px}
  .cc-menu-item{font-size:10px;padding:5px 8px}
  .evt-card{min-width:118px;padding:9px}
  .map-leg{min-width:100px;padding:6px 8px;font-size:9px}
  .map-leg-i{font-size:8px}
  .zm button{width:22px;height:22px;font-size:11px}
  .mm{width:70px;height:38px;bottom:6px;left:6px}
  .pov-bar{overflow-x:auto;-webkit-overflow-scrolling:touch}
  .pov-bar::-webkit-scrollbar{display:none}
  .fbar{padding:4px 6px;gap:3px}
  .fbar select{font-size:8px}
  .fbar label{font-size:7px}
  .ftag{font-size:7px;padding:1px 5px}
  .tl{padding:10px 10px 10px 28px}
  .tl::before{left:10px}
  .tl-dot{left:-20px;width:5px;height:5px}
  .wr{padding:10px}
  .wr-form{grid-template-columns:1fr;gap:8px}
  .wr-sr{flex-wrap:wrap}
  .wr-sr-amt{min-width:60px;font-size:9px}
  .wr-sr-pct{min-width:36px;font-size:11px}
  .wr-sr-info{flex:1 1 100%;order:-1}
  .collab-i{padding:5px 7px;font-size:9px}
  .collab-av{width:20px;height:20px;font-size:7px}
  .geo-w{padding:5px 7px}
  .ms-card{padding:22px 18px}
  .wiz{max-width:100%;margin:0}
  .wiz-step{padding:16px;min-height:200px}
  .bnav-item{font-size:8px;padding:5px 0}
  .bnav-icon{font-size:16px}
  .chat-panel{width:calc(100vw - 24px);right:12px;bottom:74px}
}
/* ── RESPONSIVE: Tiny phones (≤320px, iPhone SE 1st gen / old Android) ── */
@media(max-width:320px){
  .auth-brand h1{font-size:22px}
  .auth-brand p{font-size:11px}
  .auth-form-side{padding:14px 12px}
  .auth-form h2{font-size:16px}
  .auth-form .sub{font-size:10px;margin-bottom:12px}
  .fi,.fsel,.fta{font-size:11px;padding:6px 8px}
  .btn-block{padding:8px;font-size:11px}
  .ws-tag{display:none}
  .ws-brand h1{font-size:11px}
  .ws-hdr{padding:4px 5px;gap:3px}
  .ws-actions{gap:2px}
  .btn-sm{padding:2px 4px;font-size:8px}
  .sbox{min-width:0;flex:1 1 50px;padding:3px 5px}
  .sbox input{font-size:8px}
  .dash-hdr{padding:5px 8px}
  .dash-hdr h1{font-size:13px}
  .dash-user b{max-width:50px;font-size:9px}
  .dash-av{width:22px;height:22px;font-size:8px}
  .dash-body{padding:8px}
  .fam-card{padding:10px}
  .fam-card h3{font-size:12px}
  .fam-card p{font-size:9px;margin-bottom:6px}
  .fam-card-stats{font-size:8px;gap:4px}
  .li{gap:5px;padding:5px 6px}
  .li-av{width:24px;height:24px;font-size:8px}
  .li-info h4{font-size:9.5px}
  .li-info p{font-size:7.5px}
  .li-badge{font-size:6px;padding:1px 2px}
  .modal{border-radius:10px 10px 0 0}
  .m-h h2{font-size:13px}
  .m-b{padding:8px 10px}
  .ms-card{padding:18px 14px;border-radius:14px}
  .ms-emoji{font-size:36px}
  .ms-title{font-size:16px}
  .ms-desc{font-size:11px}
  .cc-menu{min-width:96px}
  .evt-card{min-width:108px;padding:7px}
  .map-leg{min-width:84px;font-size:8px;padding:5px 7px}
  .map-leg-i{font-size:7px}
  .zm{bottom:6px;right:6px}
  .zm button{width:20px;height:20px;font-size:10px}
  .mm{width:60px;height:32px}
  .bnav{padding:3px 0 max(6px,env(safe-area-inset-bottom));border-radius:14px 14px 0 0}
  .bnav-item{font-size:7.5px;padding:4px 0;gap:1px}
  .bnav-icon{font-size:14px}
  .chat-panel{width:calc(100vw - 16px);right:8px;bottom:70px;height:380px}
  .pwa-banner{padding:6px 8px;gap:6px}
  .pwa-text b{font-size:11px}
  .pwa-text small{font-size:9px}
  .toast{font-size:9px;padding:5px 10px;left:8px;right:8px;transform:none;max-width:none}
  .wr-rh{padding:8px 10px}
  .wr-rh h3{font-size:12px}
  .wr-ig{padding:8px}
  .far-table th,.far-table td{padding:4px 2px;font-size:8.5px}
  .admin-table th,.admin-table td{padding:4px 3px;font-size:8.5px}
}
/* ── MILESTONE MODAL ── */
.ms-ov{position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:210;padding:16px}
.ms-card{background:var(--bg1);border:1px solid var(--bdr);border-radius:16px;width:100%;max-width:400px;padding:28px 24px;text-align:center;box-shadow:0 24px 64px rgba(0,0,0,.5);animation:msPop .3s ease}
@keyframes msPop{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
.ms-emoji{font-size:48px;margin-bottom:12px}
.ms-title{font-family:var(--f-display);font-size:20px;margin-bottom:6px}
.ms-desc{font-size:13px;color:var(--t3);line-height:1.6;margin-bottom:20px}
.ms-btns{display:flex;flex-direction:column;gap:8px}
.ms-btn-p{padding:10px 16px;border-radius:10px;border:none;background:linear-gradient(135deg,var(--pri),var(--acc));color:#000;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--f-body);transition:all .2s}
.ms-btn-p:hover{opacity:.9;transform:translateY(-1px)}
.ms-btn-s{padding:8px 14px;border-radius:8px;border:1px solid var(--bdr);background:transparent;color:var(--t2);font-size:12px;cursor:pointer;font-family:var(--f-body);transition:all .2s}
.ms-btn-s:hover{background:var(--bg2);border-color:var(--bdr2)}
/* ── ONBOARDING WIZARD ── */
.wiz-ov{position:fixed;inset:0;background:rgba(0,0,0,.8);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:250;padding:16px}
.wiz{background:var(--bg1);border:1px solid var(--bdr);border-radius:16px;width:100%;max-width:440px;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,.5);animation:mUp .25s ease}
.wiz-prog{display:flex;gap:4px;padding:16px 20px 0}
.wiz-dot{flex:1;height:4px;border-radius:4px;background:var(--bdr);transition:background .3s}
.wiz-dot.on{background:var(--pri)}
.wiz-dot.done{background:var(--pri);opacity:.5}
.wiz-step{padding:20px;min-height:240px;position:relative;overflow:hidden}
.wiz-title{font-family:var(--f-display);font-size:20px;margin-bottom:4px}
.wiz-sub{font-size:12px;color:var(--t3);margin-bottom:20px}
.wiz-opt{display:flex;gap:8px;margin-bottom:14px}
.wiz-opt-btn{flex:1;padding:12px;border-radius:10px;border:2px solid var(--bdr);background:var(--bg2);color:var(--t1);font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;font-family:var(--f-body);text-align:center}
.wiz-opt-btn:hover{border-color:var(--bdr2);background:var(--bg3)}
.wiz-opt-btn.on{border-color:var(--pri);background:rgba(20,184,166,.08);color:var(--pri)}
.wiz-ftr{padding:12px 20px;border-top:1px solid var(--bdr);display:flex;justify-content:space-between;align-items:center}
.wiz-skip{font-size:11px;color:var(--t3);background:none;border:none;cursor:pointer;font-family:var(--f-body);padding:4px 8px}
.wiz-skip:hover{color:var(--t2);text-decoration:underline}
/* ── CANVAS CARD ACTIONS (+ button) ── */
.cc-add{position:absolute;top:4px;right:20px;width:24px;height:24px;border-radius:50%;background:var(--pri);color:#000;border:none;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:16;opacity:0;transition:all .2s;box-shadow:0 2px 8px rgba(20,184,166,.3);line-height:1;padding:0}
.cc:hover .cc-add,.cc-add:focus{opacity:1}
.cc-add:hover{transform:scale(1.15);box-shadow:0 3px 12px rgba(20,184,166,.5)}
.cc-menu{position:absolute;top:0;right:28px;z-index:100;display:flex;flex-direction:column;gap:4px;background:var(--bg1);border:1px solid var(--bdr);border-radius:10px;padding:6px;box-shadow:0 8px 32px rgba(0,0,0,.4);animation:mUp .15s ease;min-width:130px}
.cc-menu-item{display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:6px;border:none;background:transparent;color:var(--t1);cursor:pointer;font-size:11px;font-family:var(--f-body);transition:all .15s;white-space:nowrap}
.cc-menu-item:hover{background:var(--bg3)}
.cc-menu-item:disabled{opacity:.35;cursor:not-allowed}
.cc-menu-item:disabled:hover{background:transparent}
.cc-menu-icon{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;border:1.5px solid var(--bdr)}
/* ── BOTTOM NAV BAR (Mobile) ── */
.bnav{position:fixed;bottom:0;left:0;right:0;z-index:95;display:flex;align-items:stretch;justify-content:space-around;background:var(--bg1);border-top:1px solid var(--bdr);border-radius:20px 20px 0 0;box-shadow:0 -4px 24px rgba(0,0,0,.3);backdrop-filter:blur(12px);padding:4px 0 max(8px,env(safe-area-inset-bottom));transition:transform .25s ease}
.bnav-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:6px 0;cursor:pointer;border:none;background:transparent;color:var(--t3);font-size:9px;font-family:var(--f-body);font-weight:500;position:relative;transition:color .15s}
.bnav-item.on{color:var(--pri);font-weight:700}
.bnav-item.on::before{content:'';position:absolute;top:0;left:25%;right:25%;height:2.5px;background:var(--pri);border-radius:0 0 4px 4px}
.bnav-icon{font-size:18px;line-height:1;transition:transform .2s}
.bnav-item.on .bnav-icon{transform:translateY(-1px) scale(1.1)}
/* Hide top nav on mobile when bnav active */
@media(max-width:768px){.ws-hdr .nav{display:none!important}.ws-body-bnav{padding-bottom:72px!important}}
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
/* Event cards */
.evt-card{min-width:140px;background:var(--bg2);border:1px solid var(--bdr);border-radius:10px;padding:12px;cursor:pointer;transition:all .2s;flex-shrink:0;text-align:center}
.evt-card:hover{border-color:var(--pri);transform:translateY(-2px)}
/* Feed */
.feed-post{background:var(--bg2);border:1px solid var(--bdr);border-radius:10px;padding:14px;margin-bottom:10px}
.feed-post.auto{border-style:dashed;opacity:.7;background:transparent}
/* Chat widget */
.chat-fab{position:fixed;bottom:20px;right:20px;width:48px;height:48px;border-radius:50%;background:var(--pri);color:#000;border:none;font-size:20px;cursor:pointer;box-shadow:0 4px 16px rgba(20,184,166,.4);z-index:90;transition:transform .2s}
.chat-fab:hover{transform:scale(1.1)}
.chat-panel{position:fixed;bottom:80px;right:20px;width:340px;max-width:calc(100vw - 40px);height:420px;max-height:60vh;background:var(--bg1);border:1px solid var(--bdr);border-radius:12px;z-index:90;display:flex;flex-direction:column;box-shadow:0 8px 32px rgba(0,0,0,.3)}
.chat-hdr{padding:10px 14px;border-bottom:1px solid var(--bdr);display:flex;justify-content:space-between;align-items:center;font-size:12px}
.chat-body{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}
.chat-msg{display:flex}.chat-msg.user{justify-content:flex-end}.chat-msg.ai{justify-content:flex-start}
.chat-bubble{max-width:85%;padding:8px 12px;border-radius:12px;font-size:11px;line-height:1.6;white-space:pre-wrap}
.chat-msg.user .chat-bubble{background:var(--pri);color:#000;border-bottom-right-radius:4px}
.chat-msg.ai .chat-bubble{background:var(--bg2);color:var(--t1);border-bottom-left-radius:4px}
.chat-input{padding:8px;border-top:1px solid var(--bdr);display:flex;gap:6px}
.chat-input input{flex:1;padding:8px 12px;background:var(--bg2);border:1px solid var(--bdr);border-radius:8px;color:var(--t1);font-size:11px;outline:none;font-family:var(--f-body)}
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
const ini=n=>{const w=(n||"").trim().split(/\s+/).filter(Boolean);if(w.length===0)return"?";if(w.length===1)return w[0].slice(0,2).toUpperCase();return(w[0][0]+w[1][0]).toUpperCase()};
function DevFooter(){return(<div className="dev-footer"><span className="dev-name">{APP.developer.name}</span> — {APP.developer.role} · <span className="dev-org">{APP.developer.org}</span><div className="dev-ver">{APP.name} v{APP.version} · Build {APP.build}</div></div>)}

// ═══════════════════════════════════════════════════════════════
// AUTH — Landing Page + Login/Register
// ═══════════════════════════════════════════════════════════════
function AuthScreen({onLogin}){
  const [mode,setMode]=useState("login");const [name,setName]=useState("");const [email,setEmail]=useState("");const [pw,setPw]=useState("");const [err,setErr]=useState("");const [msg,setMsg]=useState("");const [busy,setBusy]=useState(false);const[showPw,setShowPw]=useState(false);
  const go=async()=>{setErr("");setMsg("");setBusy(true);const ep=email.trim(),np=name.trim(),pp=pw.trim();try{if(mode==="forgot"){if(!ep||!np||!pp){setErr("Semua field wajib diisi");setBusy(false);return}const r=await API.resetPassword({email:ep,name:np,new_password:pp});setMsg(r.message);setMode("login");setPw("");setBusy(false);return}if(mode==="register"){if(!np||!ep||!pp){setErr("Semua field wajib diisi");setBusy(false);return}onLogin(await API.register({name:np,email:ep,password:pp}))}else{if(!ep||!pp){setErr("Email dan password wajib");setBusy(false);return}onLogin(await API.login({email:ep,password:pp}))}}catch(e){setErr(e.message)}setBusy(false)};
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
          {mode==="register"&&<div style={{background:"var(--glass)",border:"1px solid var(--bd)",padding:"8px 10px",borderRadius:8,fontSize:11,color:"var(--t2)",marginBottom:4,lineHeight:1.5}}>ℹ️ Data <b>NIK</b> dan <b>Kartu Keluarga (KK)</b> bersifat <b>opsional</b> — bisa dilengkapi nanti saat menambah anggota keluarga.</div>}
          {err&&<div style={{background:"#3f1219",border:"1px solid #5f1d2d",color:"#fca5a5",padding:"7px 10px",borderRadius:6,fontSize:11,marginBottom:12}}>{err}</div>}
          {msg&&<div style={{background:"#132f1e",border:"1px solid #1d5f2d",color:"#86efac",padding:"7px 10px",borderRadius:6,fontSize:11,marginBottom:12}}>{msg}</div>}
          {(mode==="register"||mode==="forgot")&&<div className="fg"><label className="fl">Nama</label><input className="fi" value={name} onChange={e=>setName(e.target.value)} placeholder={mode==="forgot"?"Nama sesuai akun terdaftar":"Nama lengkap"}/></div>}
          <div className="fg"><label className="fl">Email</label><input className="fi" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nama@email.com" onKeyDown={e=>e.key==="Enter"&&go()}/></div>
          <div className="fg"><label className="fl">{mode==="forgot"?"Password Baru":"Password"}</label><div style={{position:"relative"}}><input className="fi" type={showPw?"text":"password"} value={pw} onChange={e=>setPw(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&go()} style={{paddingRight:36}}/><button type="button" onClick={()=>setShowPw(!showPw)} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--t3)",fontSize:14,padding:2}} title={showPw?"Sembunyikan":"Tampilkan"}>{showPw?"🙈":"👁"}</button></div></div>
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
  const[tab,setTab]=useState("stats");const[stats,setStats]=useState(null);const[users,setUsers]=useState([]);const[families,setFamilies]=useState([]);const[auditLogs,setAuditLogs]=useState([]);const[loading,setLoading]=useState(true);
  const[famFilter,setFamFilter]=useState("all");
  const load=async()=>{setLoading(true);try{if(tab==="stats"){const d=await API.adminStats();setStats(d.stats)}else if(tab==="users"){setUsers(await API.adminUsers())}else if(tab==="audit"){try{setAuditLogs(await API.adminAudit({limit:100}))}catch{setAuditLogs([])}}else{setFamilies(await API.adminFamilies())}}catch{}setLoading(false)};
  useEffect(()=>{load()},[tab]);
  const changeRole=async(uid,role)=>{try{await API.setUserRole(uid,role);load()}catch(e){alert(e.message)}};
  const delUser=async uid=>{if(!confirm("Hapus user ini?"))return;try{await API.deleteUser(uid);load()}catch(e){alert(e.message)}};
  const isSA=user.role==="super_admin";
  const sevBadge=sev=>{const c={info:"var(--acc)",warning:"var(--warn)",error:"var(--rose)",critical:"#ef4444"};return{background:(c[sev]||c.info)+"22",color:c[sev]||c.info,padding:"2px 6px",borderRadius:4,fontSize:9,fontWeight:600,fontFamily:"var(--f-mono)"}};
  return(<div className="dash"><header className="dash-hdr"><h1>NAS<em>AB</em></h1><div className="dash-user"><span className="admin-badge">{user.role==="super_admin"?"SUPER ADMIN":"ADMIN"}</span><b>{user.name}</b><ThemeBtn/><button className="btn btn-sm btn-ghost" onClick={onBack}><Ic.Back/> Dashboard</button></div></header>
    <div className="admin-panel"><div className="admin-tabs">{[{id:"stats",l:"Statistik"},{id:"users",l:"Users"},{id:"families",l:"Families"},{id:"audit",l:"Audit Log"}].map(t=><button key={t.id} className={`admin-tab ${tab===t.id?"on":""}`} onClick={()=>setTab(t.id)}>{t.l}</button>)}</div>
    {loading?<div style={{textAlign:"center",padding:40,color:"var(--t3)"}}>Loading...</div>:
    tab==="stats"&&stats?<div className="admin-stats">{[{l:"Total Users",v:stats.totalUsers,c:"var(--acc)"},{l:"Total Families",v:stats.totalFamilies,c:"var(--pri)"},{l:"Total Members",v:stats.totalMembers,c:"var(--warn)"},{l:"Total Stories",v:stats.totalStories,c:"var(--orange)"}].map((s,i)=><div key={i} className="admin-stat"><h4>{s.l}</h4><div className="admin-val" style={{color:s.c}}>{s.v}</div></div>)}</div>:
    tab==="users"?<table className="admin-table"><thead><tr><th>Nama</th><th>Email</th><th>Role</th><th>Families</th><th>Joined</th>{isSA&&<th>Aksi</th>}</tr></thead><tbody>{users.map(u=><tr key={u.id}><td style={{fontWeight:600}}>{u.name}</td><td style={{color:"var(--t3)"}}>{u.email}</td><td>{u.id===user.id?<span className={`role-badge role-${u.role}`}>{u.role}</span>:<select className="fsel" value={u.role} onChange={e=>changeRole(u.id,e.target.value)} style={{fontSize:11,padding:"2px 6px"}}><option value="user">user</option>{isSA&&<option value="admin">admin</option>}{isSA&&<option value="super_admin">super_admin</option>}</select>}</td><td>{u.familyCount}</td><td style={{fontSize:10,color:"var(--t3)"}}>{u.created_at?new Date(u.created_at).toLocaleDateString("id-ID"):"-"}</td>{isSA&&<td>{u.id!==user.id&&<button className="btn btn-d btn-sm" onClick={()=>delUser(u.id)} style={{fontSize:9,padding:"2px 8px"}}>Hapus</button>}</td>}</tr>)}</tbody></table>:
    tab==="families"?(()=>{const isStale=f=>f.memberCount===0&&f.created_at&&(Date.now()-new Date(f.created_at).getTime())>7*864e5;
      const cActive=families.filter(f=>f.memberCount>0).length;const cEmpty=families.filter(f=>f.memberCount===0).length;const cStale=families.filter(isStale).length;
      const filtered=famFilter==="active"?families.filter(f=>f.memberCount>0):famFilter==="empty"?families.filter(f=>f.memberCount===0):famFilter==="stale"?families.filter(isStale):families;
      return<div>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:12,flexWrap:"wrap"}}>
          <select className="fsel" value={famFilter} onChange={e=>setFamFilter(e.target.value)} style={{fontSize:11,padding:"4px 8px",width:"auto"}}><option value="all">Semua</option><option value="active">Aktif (&gt;0)</option><option value="empty">Kosong (0)</option><option value="stale">Stale (&gt;7 hari)</option></select>
          {isSA&&<button className="btn btn-d btn-sm" disabled title="Perlu endpoint API baru" style={{opacity:.5,fontSize:10}}>🗑 Bersihkan Family Kosong</button>}
        </div>
        <div style={{fontSize:11,color:"var(--t3)",marginBottom:10,fontFamily:"var(--f-mono)"}}>{families.length} total · <span style={{color:"var(--pri)"}}>{cActive} aktif</span> · <span style={{color:"var(--warn)"}}>{cEmpty} kosong</span> · <span style={{color:"var(--rose)"}}>{cStale} stale</span></div>
        <table className="admin-table"><thead><tr><th>Nama</th><th>Owner</th><th>Members</th><th>Collaborators</th><th>Created</th><th>Aksi</th></tr></thead><tbody>{filtered.map(f=><tr key={f.id}><td style={{fontWeight:600}}>{f.name}</td><td>{f.owner_name}</td><td>{f.memberCount}{f.memberCount===0&&<span style={{marginLeft:6,padding:"1px 6px",borderRadius:4,fontSize:8,fontWeight:700,fontFamily:"var(--f-mono)",background:isStale(f)?"var(--warn)22":"#ef444422",color:isStale(f)?"var(--warn)":"#ef4444"}}>{isStale(f)?"Stale":"Kosong"}</span>}</td><td>{f.collabCount}</td><td style={{fontSize:10,color:"var(--t3)"}}>{f.created_at?new Date(f.created_at).toLocaleDateString("id-ID"):"-"}</td><td><button className="btn btn-sm" onClick={async()=>{try{const full=await API.getFamily(f.id);onSelectFamily(full)}catch(e){alert(e.message)}}} style={{fontSize:9,padding:"2px 8px"}}>Buka</button></td></tr>)}</tbody></table></div>})():
    tab==="audit"?<div>{auditLogs.length?<table className="admin-table"><thead><tr><th>Waktu</th><th>User</th><th>Aksi</th><th>Entity</th><th>Severity</th><th>Detail</th></tr></thead><tbody>{auditLogs.map((l,i)=><tr key={i}><td style={{fontSize:9,fontFamily:"var(--f-mono)",color:"var(--t3)",whiteSpace:"nowrap"}}>{l.created_at?new Date(l.created_at).toLocaleString("id-ID"):"-"}</td><td style={{fontSize:10}}>{l.user_name||l.user_id||"-"}</td><td style={{fontSize:10,fontWeight:600}}>{l.action}</td><td style={{fontSize:9,color:"var(--t3)"}}>{l.entity_type} {l.entity_id?`#${l.entity_id.slice(0,8)}`:""}</td><td><span style={sevBadge(l.severity||"info")}>{l.severity||"info"}</span></td><td style={{fontSize:9,color:"var(--t3)",maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.details||"-"}</td></tr>)}</tbody></table>:<div style={{textAlign:"center",padding:40,color:"var(--t3)",fontSize:12}}>Belum ada audit log</div>}</div>:null}
    </div></div>);
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════
function Dashboard({user,onSelectFamily,onLogout,onCreateFamily,onAdmin}){
  const [fams,setFams]=useState([]);const [show,setShow]=useState(false);const [nn,setNn]=useState("");const [nd,setNd]=useState("");const[opening,setOpening]=useState(null);
  const prefetch=useRef({});
  // Debounce prefetch — admins see ALL families; un-debounced hover fires
  // 19+ parallel detail fetches and freezes the main thread. Only prefetch
  // after sustained hover (250ms) signals genuine intent.
  const hoverTimer=useRef(null);
  useEffect(()=>{(async()=>{try{setFams(await API.getFamilies())}catch{}})()},[user]);
  const create=async()=>{if(!nn.trim())return;try{const f=await API.createFamily({name:nn,description:nd});const full=await API.getFamily(f.id);onCreateFamily(user,full);setShow(false);setNn("");setNd("")}catch(e){alert(e.message)}};
  const openFam=async f=>{setOpening(f.id);try{const full=prefetch.current[f.id]?await prefetch.current[f.id]:await API.getFamily(f.id);onSelectFamily(full)}catch{onSelectFamily(f)}finally{setOpening(null)}};
  const hoverFam=f=>{if(prefetch.current[f.id])return;if(hoverTimer.current)clearTimeout(hoverTimer.current);hoverTimer.current=setTimeout(()=>{prefetch.current[f.id]=API.getFamily(f.id)},250)};
  const cancelHover=()=>{if(hoverTimer.current){clearTimeout(hoverTimer.current);hoverTimer.current=null}};
  const rc={[RL.OWNER]:{bg:"var(--pri)",c:"#000"},[RL.EDITOR]:{bg:"var(--acc)",c:"#fff"},[RL.VIEWER]:{bg:"var(--bg3)",c:"var(--t2)"}};
  return(<div className="dash">
    <header className="dash-hdr"><h1>NAS<em>AB</em></h1><div className="dash-user">{(user.role==="admin"||user.role==="super_admin")&&<button className="btn btn-sm" onClick={onAdmin} style={{background:"var(--acc)",color:"#fff",fontSize:10,padding:"4px 10px"}}>Admin Panel</button>}<span style={{color:"var(--t3)",fontSize:11}}>Halo,</span><b>{user.name}</b><div className="dash-av">{ini(user.name)}</div><ThemeBtn/><button className="btn btn-sm btn-ghost" onClick={onLogout}>Keluar</button></div></header>
    <div className="dash-body"><div style={{maxWidth:960,margin:"0 auto"}}>
      <div style={{marginBottom:20}}><h2 style={{fontFamily:"var(--f-display)",fontSize:22}}>Silsilah Saya</h2><p style={{fontSize:12,color:"var(--t3)",marginTop:2}}>Kelola pohon keluarga, undang anggota untuk berkolaborasi</p></div>
      <div className="dash-grid">
        {fams.map(f=>{const r=rc[f.myRole]||rc.viewer;return(<div key={f.id} className="fam-card" onClick={()=>openFam(f)} onMouseEnter={()=>hoverFam(f)} onMouseLeave={cancelHover}>{opening===f.id&&<div style={{position:"absolute",inset:0,background:"rgba(7,9,14,.7)",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"var(--r)",zIndex:5,fontSize:11,color:"var(--pri)"}}>Memuat...</div>}<div className="fam-card-bar"/><span className="fam-card-role" style={{background:r.bg,color:r.c}}>{f.myRole}</span><h3>{f.name}</h3><p>{f.description||"Silsilah keluarga"}</p><div className="fam-card-stats"><span>👥 {f.member_count||f.members?.length||0}</span><span>📍 {f.geo_count||(f.members||[]).filter(m=>m.location?.lat).length||0}</span></div></div>)})}
        <div className="fam-card fam-new" onClick={()=>setShow(true)}><span style={{fontSize:24,color:"var(--pri)"}}>+</span><span style={{fontSize:12,fontWeight:600}}>Buat Silsilah Baru</span></div>
      </div>
    </div><DevFooter/></div>
    {show&&<div className="modal-ov" onClick={()=>setShow(false)}><div className="modal" onClick={e=>e.stopPropagation()}><div className="m-hdr"><h2>Silsilah Baru</h2><button className="btn btn-icon btn-ghost" onClick={()=>setShow(false)}><Ic.X/></button></div><div className="m-body"><div className="fg"><label className="fl">Nama Keluarga *</label><input className="fi" value={nn} onChange={e=>setNn(e.target.value)} placeholder="Keluarga Besar ..." autoFocus/></div><div className="fg"><label className="fl">Deskripsi</label><textarea className="fta" value={nd} onChange={e=>setNd(e.target.value)} placeholder="Deskripsi..."/></div></div><div className="m-ftr"><button className="btn" onClick={()=>setShow(false)}>Batal</button><button className="btn btn-p" onClick={create} disabled={!nn.trim()}>Buat</button></div></div></div>}
  </div>);
}

// ═══════════════════════════════════════════════════════════════
// ONBOARDING WIZARD
// ═══════════════════════════════════════════════════════════════
function OnboardingWizard({fam,onDone,onSkip}){
  const[step,setStep]=useState(0);const[busy,setBusy]=useState(false);
  const[name,setName]=useState("");const[gender,setGender]=useState("male");
  const[married,setMarried]=useState(null);const[spName,setSpName]=useState("");
  const[addParents,setAddParents]=useState(null);const[fatherName,setFatherName]=useState("");const[motherName,setMotherName]=useState("");
  const spGender=gender==="male"?"female":"male";
  const submit=async()=>{if(!name.trim()||busy)return;setBusy(true);let count=0;
    try{
      // 1. Create self
      const self=await API.addMember(fam.id,{name:name.trim(),gender,birth_date:"",death_date:"",birth_place:"",notes:"",parent_id:null,spouse_id:null,nik:"",agama:"islam"});
      const selfId=self?.member?.id;count++;
      // 2. Create spouse if married
      let spId=null;
      if(married&&spName.trim()){const sp=await API.addMember(fam.id,{name:spName.trim(),gender:spGender,birth_date:"",death_date:"",birth_place:"",notes:"",parent_id:null,spouse_id:selfId||null,nik:"",agama:"islam"});
        spId=sp?.member?.id;count++;
        // Create marriage
        if(selfId&&spId){const hId=gender==="male"?selfId:spId;const wId=gender==="male"?spId:selfId;
          try{await API.addMarriage(fam.id,{husband_id:hId,wife_id:wId,marriage_order:1})}catch{}}
        // Link spouse_id on self
        if(spId)try{await API.updateMember(fam.id,selfId,{name:name.trim(),gender,birth_date:"",death_date:"",birth_place:"",notes:"",parent_id:null,spouse_id:spId,nik:"",agama:"islam"})}catch{}}
      // 3. Create parents if requested
      if(addParents&&(fatherName.trim()||motherName.trim())){
        let fatherId=null,motherId=null;
        if(fatherName.trim()){const f=await API.addMember(fam.id,{name:fatherName.trim(),gender:"male",birth_date:"",death_date:"",birth_place:"",notes:"",parent_id:null,spouse_id:null,nik:"",agama:"islam"});
          fatherId=f?.member?.id;count++}
        if(motherName.trim()){const m=await API.addMember(fam.id,{name:motherName.trim(),gender:"female",birth_date:"",death_date:"",birth_place:"",notes:"",parent_id:null,spouse_id:fatherId||null,nik:"",agama:"islam"});
          motherId=m?.member?.id;count++;
          // Link father-mother spouse
          if(fatherId)try{await API.updateMember(fam.id,fatherId,{name:fatherName.trim(),gender:"male",birth_date:"",death_date:"",birth_place:"",notes:"",parent_id:null,spouse_id:motherId,nik:"",agama:"islam"})}catch{}
          // Marriage
          if(fatherId&&motherId)try{await API.addMarriage(fam.id,{husband_id:fatherId,wife_id:motherId,marriage_order:1})}catch{}}
        // Set self's parent_id to father (or mother if no father)
        const parentId=fatherId||motherId;
        if(parentId&&selfId)try{await API.updateMember(fam.id,selfId,{name:name.trim(),gender,birth_date:"",death_date:"",birth_place:"",notes:"",parent_id:parentId,spouse_id:spId||null,nik:"",agama:"islam"})}catch{}}
      onDone(count);
    }catch(e){onDone(count,e.message)}finally{setBusy(false)}};
  return(<div className="wiz-ov"><div className="wiz">
    <div className="wiz-prog">{[0,1,2].map(i=><div key={i} className={`wiz-dot${i===step?" on":i<step?" done":""}`}/>)}</div>
    <div className="wiz-step">
      {step===0&&<><div className="wiz-title">Mulai dari Kamu</div><div className="wiz-sub">Siapa yang akan jadi titik awal pohon keluarga?</div>
        <div className="fg"><label className="fl">Nama Lengkap *</label><input className="fi" value={name} onChange={e=>setName(e.target.value)} placeholder="Nama lengkap kamu" autoFocus/></div>
        <div className="fg"><label className="fl">Jenis Kelamin</label><div className="gtog"><button className={`gbtn ${gender==="male"?"am":""}`} onClick={()=>setGender("male")}>♂ Laki-laki</button><button className={`gbtn ${gender==="female"?"af":""}`} onClick={()=>setGender("female")}>♀ Perempuan</button></div></div></>}
      {step===1&&<><div className="wiz-title">Pasangan Hidup</div><div className="wiz-sub">Apakah kamu sudah menikah?</div>
        <div className="wiz-opt"><button className={`wiz-opt-btn${married===true?" on":""}`} onClick={()=>setMarried(true)}>💍 Sudah Menikah</button><button className={`wiz-opt-btn${married===false?" on":""}`} onClick={()=>setMarried(false)}>Lewati</button></div>
        {married&&<div className="fg"><label className="fl">Nama Pasangan</label><input className="fi" value={spName} onChange={e=>setSpName(e.target.value)} placeholder={`Nama ${spGender==="male"?"suami":"istri"}`} autoFocus/></div>}</>}
      {step===2&&<><div className="wiz-title">Orang Tua</div><div className="wiz-sub">Tambahkan nama orang tua (bisa dilengkapi nanti)</div>
        <div className="wiz-opt"><button className={`wiz-opt-btn${addParents===true?" on":""}`} onClick={()=>setAddParents(true)}>👨‍👩‍👧 Tambah Ortu</button><button className={`wiz-opt-btn${addParents===false?" on":""}`} onClick={()=>setAddParents(false)}>Nanti Saja</button></div>
        {addParents&&<><div className="fg"><label className="fl">Nama Ayah</label><input className="fi" value={fatherName} onChange={e=>setFatherName(e.target.value)} placeholder="Nama ayah" autoFocus/></div>
        <div className="fg"><label className="fl">Nama Ibu</label><input className="fi" value={motherName} onChange={e=>setMotherName(e.target.value)} placeholder="Nama ibu"/></div></>}
        {addParents===false&&<div style={{textAlign:"center",padding:"16px 0",color:"var(--t3)",fontSize:12}}>Bisa ditambahkan nanti dari Canvas 🌳</div>}</>}
    </div>
    <div className="wiz-ftr">
      <button className="wiz-skip" onClick={onSkip}>Lewati wizard</button>
      <div style={{display:"flex",gap:6}}>
        {step>0&&<button className="btn btn-sm" onClick={()=>setStep(s=>s-1)}>← Kembali</button>}
        {step<2&&<button className="btn btn-p btn-sm" onClick={()=>setStep(s=>s+1)} disabled={step===0&&!name.trim()}>Lanjut →</button>}
        {step===2&&<button className="btn btn-p btn-sm" onClick={submit} disabled={!name.trim()||busy}>{busy?"Menyimpan...":"🌳 Mulai Pohon Keluarga"}</button>}
      </div>
    </div>
  </div></div>);
}

// ═══════════════════════════════════════════════════════════════
// WORKSPACE — All views
// ═══════════════════════════════════════════════════════════════
function Workspace({family:initFam,user,onBack}){
  const [fam,setFam]=useState(initFam);const pp=fam.members||[];const mrs=fam.marriages||[];const [pos,setPos]=useState(fam.positions||{});const[loading,setLoading]=useState(!initFam.members);
  const [vw,setVw]=useState(VW.CANVAS);const [search,setSearch]=useState("");const [sel,setSel]=useState(null);
  const [showForm,setShowForm]=useState(false);const [editP,setEditP]=useState(null);const [showShare,setShowShare]=useState(false);
  const [showIE,setShowIE]=useState(false);const [showFar,setShowFar]=useState(false);const [showMar,setShowMar]=useState(false);const [showKK,setShowKK]=useState(false);const [toast,setToast]=useState(null);const [filters,setFilters]=useState({});
  const[showDQ,setShowDQ]=useState(false);const[showChat,setShowChat]=useState(false);
  // Onboarding wizard — show when family has 0 members on first load
  const[showWizard,setShowWizard]=useState(false);const wizardChecked=useRef(false);
  // Milestone modal
  const[milestone,setMilestone]=useState(null);
  const myRole=(fam.collaborators||[]).find(c=>c.userId===user.id)?.role||RL.VIEWER;const canEdit=myRole===RL.OWNER||myRole===RL.EDITOR;
  // Mobile detection for BottomNavBar
  const[isMobile,setIsMobile]=useState(()=>window.innerWidth<=768);
  useEffect(()=>{const mq=window.matchMedia('(max-width:768px)');const h=e=>setIsMobile(e.matches);mq.addEventListener('change',h);return()=>mq.removeEventListener('change',h)},[]);
  // POV tree navigation
  const[povRootId,setPovRootId]=useState(null);const[povHistory,setPovHistory]=useState([]);const[povMode,setPovMode]=useState(true);
  const autoRoot=useMemo(()=>{const roots=FE.roots(pp,mrs);if(!roots.length)return pp[0]?.id||null;
    // Pick root with most total descendants (recursive, includes co-parented children).
    // Direct-children count misleads when a patriarch has 1 child but many grandchildren.
    const famLower=(fam?.name||"").toLowerCase();const firstName=p=>(p.name||"").toLowerCase().split(/\s+/)[0]||"";
    return roots.reduce((best,r)=>{
      const rD=FE.descAll(pp,r.id,mrs),bD=FE.descAll(pp,best.id,mrs);
      if(rD!==bD)return rD>bD?r:best;
      // Tiebreaker: prefer person whose first name appears in family name
      const rIn=firstName(r)&&famLower.includes(firstName(r));const bIn=firstName(best)&&famLower.includes(firstName(best));
      if(rIn&&!bIn)return r;if(bIn&&!rIn)return best;
      return best;
    }).id},[pp,mrs,fam?.name]);
  const effectiveRoot=povRootId||autoRoot;
  const povData=useMemo(()=>povMode&&effectiveRoot?getPOVMembers(pp,effectiveRoot,mrs):{visible:pp,branches:[]},[pp,effectiveRoot,mrs,povMode]);
  const povPP=povData.visible;const povBranches=povData.branches;
  const switchPov=(newRootId)=>{const cur=pp.find(p=>p.id===effectiveRoot);setPovHistory(prev=>[...prev,{rootId:effectiveRoot,label:cur?.name||"Root"}]);setPovRootId(newRootId)};
  const povBack=(idx)=>{const h=povHistory[idx];setPovRootId(h.rootId);setPovHistory(prev=>prev.slice(0,idx))};
  const flash=m=>{setToast(m);setTimeout(()=>setToast(null),3000)};
  const reloadFam=async()=>{try{const d=await API.getFamily(fam.id);setFam(d);setPos(d.positions||{})}catch{}};
  useEffect(()=>{if(!initFam.members){(async()=>{try{const d=await API.getFamily(initFam.id);setFam(d);setPos(d.positions||{})}catch{}finally{setLoading(false)}})()}},[initFam.id]);
  // Show wizard once after loading if 0 members
  useEffect(()=>{if(!loading&&!wizardChecked.current){wizardChecked.current=true;if(pp.length===0)setShowWizard(true)}},[loading,pp.length]);
  // Milestone triggers — one-time per family
  useEffect(()=>{if(!fam?.id||!pp.length||showWizard)return;const fid=fam.id;
    if(pp.length>=15&&!localStorage.getItem(`nasab-ms15-${fid}`)){setMilestone({type:'advanced',count:pp.length,familyName:fam.name});localStorage.setItem(`nasab-ms15-${fid}`,'1')}
    else if(pp.length>=5&&!localStorage.getItem(`nasab-ms5-${fid}`)){setMilestone({type:'story',count:pp.length,familyName:fam.name});localStorage.setItem(`nasab-ms5-${fid}`,'1')}
  },[pp.length,fam?.id,showWizard]);
  const handleSave=async(person,lsid,ltid)=>{if(!canEdit)return;try{if(lsid&&ltid){const sp=pp.find(x=>x.id===lsid);if(sp)await API.updateMember(fam.id,lsid,{...sp,spouseId:ltid});await reloadFam();return}if(!person)return;const ex=pp.find(x=>x.id===person.id);if(ex){await API.updateMember(fam.id,person.id,person);flash(`${person.name} diperbarui`)}else{const res=await API.addMember(fam.id,person);const newId=res?.member?.id||person.id;// Handle "parent" quick add — set child's parentId to the new parent
      if(person._quickType==='parent'&&person._refPersonId){const child=pp.find(x=>x.id===person._refPersonId);if(child)await API.updateMember(fam.id,child.id,{...child,parentId:newId})}flash(`${person.name} ditambahkan`)}await reloadFam()}catch(e){flash(e.message)}};
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
        {[{id:VW.CANVAS,l:"Canvas"},{id:VW.MAP,l:"Peta"},{id:VW.LIST,l:"Daftar"},{id:VW.STATS,l:"Stats"},{id:VW.TIMELINE,l:"Timeline"},{id:VW.INSIGHTS,l:"Kisah"},{id:VW.KELUARGA,l:"Keluarga"}].map(t=>(
          <button key={t.id} className={`navt ${vw===t.id?"on":""}`} onClick={()=>setVw(t.id)}>{t.l}</button>
        ))}
      </nav>
      <div className="ws-actions">
        <div className="sbox"><Ic.Search/><input placeholder="Cari..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <button className="btn btn-sm" onClick={()=>setShowShare(true)}><Ic.Share/></button>
        <ThemeBtn/>
        {canEdit&&<button className="btn btn-sm" onClick={()=>setShowMar(true)} title="Kelola Pernikahan" style={{fontSize:11}}>💍</button>}
        <button className="btn btn-sm" onClick={()=>setShowDQ(true)} title="Cek Kualitas Data" style={{fontSize:11}}>🔍</button>
        <button className="btn btn-sm" onClick={()=>setShowFar(true)} title="Kalkulator Faraidh" style={{fontSize:11}}>⚖️</button>
        <button className="btn btn-sm" onClick={()=>setShowIE(true)}><Ic.DL/></button>
        {!pp.length&&<button className="btn btn-sm" onClick={loadDemo}>Demo</button>}
        {canEdit&&<button className="btn btn-sm" onClick={()=>setShowKK(true)} title="Import Kartu Keluarga" style={{fontSize:11}}>📋</button>}
        {canEdit&&<button className="btn btn-p btn-sm" onClick={()=>{setEditP(null);setShowForm(true)}}><Ic.Plus/> Tambah</button>}
      </div>
    </header>
    <div style={{flex:1,position:"relative",overflow:"hidden"}} className={isMobile?"ws-body-bnav":""}>
      {vw===VW.CANVAS&&<CanvasView pp={povMode?povPP:viewPP} allPP={pp} marriages={mrs} onSel={setSel} selId={sel?.id} onPos={updPos} savedPos={pos} povMode={povMode} setPovMode={setPovMode} povBranches={povBranches} effectiveRoot={effectiveRoot} povHistory={povHistory} switchPov={switchPov} povBack={povBack} setPovRootId={setPovRootId} setPovHistory={setPovHistory} canEdit={canEdit} onQuickAdd={async(type,person)=>{if(type==='parent'){setEditP({parentId:null,spouseId:null,gender:'male',_quickType:'parent',_refPersonId:person.id});setShowForm(true)}else{setEditP({parentId:type==='child'?person.id:type==='sibling'?person.parentId:null,spouseId:type==='spouse'?person.id:null,gender:type==='spouse'?(person.gender==='male'?'female':'male'):'',_quickType:type,_refPersonId:person.id});setShowForm(true)}}} onAddMember={canEdit?()=>{setEditP(null);setShowForm(true)}:null} onImportKK={canEdit?()=>setShowKK(true):null} onImportGEDCOM={canEdit?()=>setShowIE(true):null}/>}
      {vw===VW.MAP&&<MapView pp={viewPP} onSel={setSel}/>}
      {vw===VW.LIST&&<div style={{height:"100%",overflow:"auto"}}><div style={{maxWidth:800,margin:"0 auto",padding:"16px 16px 0"}}><FilterBar pp={pp} filters={filters} setFilters={setFilters}/></div><ListView pp={Object.keys(filters).length?FE.filter(viewPP,filters):viewPP} allPP={pp} onSel={setSel} canEdit={canEdit} fam={fam} onDone={reloadFam} flash={flash} myRole={myRole}/></div>}
      {vw===VW.STATS&&<div style={{height:"100%",overflow:"auto"}}><StatsView pp={viewPP}/></div>}
      {vw===VW.TIMELINE&&<div style={{height:"100%",overflow:"auto"}}><TimelineView pp={viewPP} onSel={setSel}/></div>}
      {vw===VW.INSIGHTS&&<InsightsView pp={pp} fam={fam} canEdit={canEdit} onSaveFam={reloadFam} flash={flash} marriages={mrs}/>}
      {vw===VW.KELUARGA&&<KeluargaView pp={pp} fam={fam} user={user} canEdit={canEdit} flash={flash} marriages={mrs}/>}
      {sel&&<Sidebar p={sel} pp={pp} marriages={mrs} canEdit={canEdit} onClose={()=>setSel(null)} onEdit={p=>{setSel(null);setEditP(p);setShowForm(true)}} onDel={handleDel} onSel={setSel}/>}
    </div>
    {showForm&&canEdit&&<PersonForm person={editP} pp={pp} onSave={handleSave} onClose={()=>{setShowForm(false);setEditP(null)}}/>}
    {showShare&&<ShareModal fam={fam} user={user} onClose={()=>setShowShare(false)} onUpd={reloadFam} flash={flash}/>}
    {showIE&&<IEModal pp={pp} fam={fam} onDone={reloadFam} onClose={()=>setShowIE(false)} flash={flash}/>}
    {showFar&&<FaraidhCalc pp={pp} onClose={()=>setShowFar(false)}/>}
    {showMar&&<MarriageModal pp={pp} marriages={mrs} fam={fam} onClose={()=>setShowMar(false)} onSave={reloadFam} flash={flash}/>}
    {showKK&&<KKModal fam={fam} onClose={()=>setShowKK(false)} onDone={reloadFam} flash={flash}/>}
    {showDQ&&<DataQualityModal pp={pp} marriages={mrs} onClose={()=>setShowDQ(false)} flash={flash}/>}
    {/* AI Chat */}
    <button className="chat-fab" onClick={()=>setShowChat(!showChat)} title="Tanya AI">💬</button>
    {showChat&&<ChatPanel pp={pp} fam={fam} marriages={mrs} onClose={()=>setShowChat(false)} flash={flash}/>}
    {/* Milestone Modal */}
    {milestone&&<div className="ms-ov" onClick={()=>setMilestone(null)}><div className="ms-card" onClick={e=>e.stopPropagation()}>
      <div className="ms-emoji">{milestone.type==='story'?'✨':'🌳'}</div>
      <div className="ms-title">{milestone.type==='story'?'Pohon keluarga mulai terbentuk!':'Pohon keluarga semakin besar!'}</div>
      <div className="ms-desc">{milestone.type==='story'
        ?`Keluarga ${milestone.familyName} sudah punya ${milestone.count} anggota. Biarkan AI NASAB merangkum asal-usul keluarga ini menjadi cerita yang indah.`
        :`Sudah ${milestone.count} anggota! Coba fitur lanjutan:`}</div>
      <div className="ms-btns">
        {milestone.type==='story'&&<><button className="ms-btn-p" onClick={()=>{setMilestone(null);setVw(VW.INSIGHTS)}}>📖 Buat Kisah dengan AI</button><button className="ms-btn-s" onClick={()=>setMilestone(null)}>Nanti Saja</button></>}
        {milestone.type==='advanced'&&<><button className="ms-btn-p" onClick={()=>{setMilestone(null);setShowFar(true)}}>⚖️ Kalkulator Faraidh</button><button className="ms-btn-s" onClick={()=>{setMilestone(null);setShowIE(true)}}>📄 Ekspor GEDCOM</button><button className="ms-btn-s" onClick={()=>setMilestone(null)}>Tutup</button></>}
      </div>
    </div></div>}
    {/* Onboarding Wizard */}
    {showWizard&&<OnboardingWizard fam={fam} onDone={async(count,err)=>{setShowWizard(false);await reloadFam();flash(err||`✨ ${count} anggota berhasil ditambahkan!`)}} onSkip={()=>setShowWizard(false)}/>}
    {/* Bottom Nav Bar — mobile only */}
    {isMobile&&<div className="bnav">{[{id:VW.CANVAS,l:"Pohon",i:"🌳"},{id:VW.LIST,l:"Daftar",i:"📋"},{id:VW.MAP,l:"Peta",i:"🗺️"},{id:VW.INSIGHTS,l:"Kisah",i:"📖"},{id:VW.KELUARGA,l:"Feed",i:"💬"}].map(t=><button key={t.id} className={`bnav-item${vw===t.id?" on":""}`} onClick={()=>setVw(t.id)}><span className="bnav-icon">{t.i}</span>{t.l}</button>)}</div>}
    {toast&&<div className="toast">{toast}</div>}
  </div>);
}

// ─── CANVAS ──────────────────────────────────────────────────
function CanvasView({pp,allPP,marriages=[],onSel,selId,onPos,savedPos,povMode,setPovMode,povBranches=[],effectiveRoot,povHistory=[],switchPov,povBack,setPovRootId,setPovHistory,canEdit,onQuickAdd,onAddMember,onImportKK,onImportGEDCOM}){
  const wr=useRef(null);const[pos,setPos]=useState({});const[pan,setPan]=useState({x:0,y:0});const[zm,setZm]=useState(.5);
  const[drag,setDrag]=useState(null);const[panning,setPanning]=useState(false);const[didD,setDidD]=useState(false);
  const ps=useRef({});const ds=useRef({});const fitted=useRef(false);const pinch=useRef(null);
  // Expand/collapse state — adaptive threshold based on tree size
  const[collapsed,setCollapsed]=useState(()=>{
    const s=new Set();if(pp.length<=50)return s;
    // For POV mode (filtered), use lighter collapse; for full tree, more aggressive
    const threshold=pp.length>200?2:pp.length>80?3:4;
    pp.forEach(p=>{const g=FE.gen(pp,p.id);if(g>=threshold&&FE.ch(pp,p.id).length>0)s.add(p.id)});return s});
  const toggleCollapse=useCallback((pid)=>{setCollapsed(prev=>{const n=new Set(prev);if(n.has(pid))n.delete(pid);else n.add(pid);return n})},[]);
  // Recalculate collapse when member set changes (POV toggle, data reload)
  const prevPPLen=useRef(pp.length);
  useEffect(()=>{if(pp.length!==prevPPLen.current){prevPPLen.current=pp.length;
    const s=new Set();if(pp.length>50){const threshold=pp.length>200?2:pp.length>80?3:4;
      pp.forEach(p=>{const g=FE.gen(pp,p.id);if(g>=threshold&&FE.ch(pp,p.id).length>0)s.add(p.id)})}
    setCollapsed(s)}},[pp.length]);
  // Search & focus state
  const[csq,setCsq]=useState("");const[csResults,setCsResults]=useState([]);const[csIdx,setCsIdx]=useState(-1);const[highlightId,setHighlightId]=useState(null);
  const csRef=useRef(null);
  // Card action menu state
  const[cardMenuId,setCardMenuId]=useState(null);
  useEffect(()=>{if(!cardMenuId)return;const h=e=>{if(!e.target.closest('.cc-menu')&&!e.target.closest('.cc-add'))setCardMenuId(null)};window.addEventListener('mousedown',h);window.addEventListener('touchstart',h);return()=>{window.removeEventListener('mousedown',h);window.removeEventListener('touchstart',h)}},[cardMenuId]);
  useEffect(()=>{if(!csq.trim()){setCsResults([]);setCsIdx(-1);return}const q=csq.toLowerCase();setCsResults(pp.filter(p=>p.name.toLowerCase().includes(q)).slice(0,8));setCsIdx(-1)},[csq,pp]);
  const focusNode=useCallback((person)=>{
    const el=wr.current;if(!el)return;
    // Uncollapse ancestors so node is visible
    setCollapsed(prev=>{const n=new Set(prev);let cur=pp.find(x=>x.id===person.id);while(cur&&cur.parentId){n.delete(cur.parentId);cur=pp.find(x=>x.id===cur.parentId)}return n});
    // Wait for layout recalc then pan to node
    setTimeout(()=>{const pt=pos[person.id];if(!pt)return;const vw=el.clientWidth,vh=el.clientHeight;const nz=Math.max(zm,0.6);const tcx=pt.x+CW/2,tcy=pt.y+CH/2;setZm(nz);setPan({x:vw/2-tcx*nz,y:vh/2-tcy*nz});setHighlightId(person.id);setCsq("");setCsResults([]);setTimeout(()=>setHighlightId(null),5000)},100)},[pos,zm,pp]);
  const csKeyDown=e=>{if(e.key==="ArrowDown"){e.preventDefault();setCsIdx(i=>Math.min(i+1,csResults.length-1))}else if(e.key==="ArrowUp"){e.preventDefault();setCsIdx(i=>Math.max(i-1,0))}else if(e.key==="Enter"&&csIdx>=0&&csResults[csIdx]){focusNode(csResults[csIdx])}else if(e.key==="Escape"){setCsq("");setCsResults([])}};
  // Fit all cards into viewport
  const fitAll=useCallback((p)=>{
    const el=wr.current;if(!el||!Object.keys(p).length)return;
    const vw=el.clientWidth,vh=el.clientHeight;if(!vw||!vh)return;
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    Object.values(p).forEach(pt=>{minX=Math.min(minX,pt.x);minY=Math.min(minY,pt.y);maxX=Math.max(maxX,pt.x+CW);maxY=Math.max(maxY,pt.y+CH)});
    if(minX===Infinity)return;
    const pad=40;const tw=maxX-minX+pad*2,th=maxY-minY+pad*2;
    const z=Math.max(0.3,Math.min(1.2,Math.min(vw/tw,vh/th)));
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
    if(!collapsed.size&&savedPos&&Object.keys(savedPos).length>=pp.length){p=savedPos}else{p=autoLayout(pp,marriages,collapsed);onPos(p)}
    setPos(p);
    fitted.current=false;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{fitAll(p);fitted.current=true}));
  },[pp,collapsed]);
  useEffect(()=>{if(fitted.current&&Object.keys(pos).length>0)onPos(pos)},[pos]);
  const conns=useMemo(()=>getConns(pp,pos,marriages),[pp,pos,marriages]);
  const rootMap=useMemo(()=>{const m={};pp.forEach(p=>{let cur=p;const seen=new Set();while(cur&&cur.parentId&&!seen.has(cur.id)){seen.add(cur.id);const next=pp.find(x=>x.id===cur.parentId);if(!next)break;cur=next}m[p.id]=cur?.id||p.id});return m},[pp]);
  const branchIdx=useMemo(()=>{const idx={};const uniqueRoots=[...new Set(Object.values(rootMap))].sort();uniqueRoots.forEach((rid,i)=>{idx[rid]=i});return idx},[rootMap]);
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
  const fit=()=>{const a=autoLayout(pp,marriages,collapsed);setPos(a);onPos(a);requestAnimationFrame(()=>fitAll(a))};
  const expandAll=()=>setCollapsed(new Set());
  const collapseAll=()=>{const s=new Set();pp.forEach(p=>{if(FE.ch(pp,p.id).length)s.add(p.id)});setCollapsed(s)};
  if(!pp.length)return<div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}><div style={{textAlign:"center",maxWidth:400,padding:32,background:"var(--bg2)",border:"2px dashed var(--pri)",borderRadius:16,opacity:.95,animation:"mUp .3s ease"}}>
    <div style={{fontSize:48,marginBottom:12}}>🌱</div>
    <h3 style={{fontFamily:"var(--f-display)",fontSize:20,marginBottom:6}}>Pohon keluarga ini masih kosong</h3>
    <p style={{fontSize:12,color:"var(--t3)",marginBottom:20,lineHeight:1.6}}>Mulai dengan menambah diri kamu sebagai anggota pertama, atau import data yang sudah ada.</p>
    <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
      {onAddMember&&<button className="btn btn-p" onClick={onAddMember}>👤 Tambah Anggota</button>}
      {onImportKK&&<button className="btn" onClick={onImportKK}>📷 Import KK</button>}
      {onImportGEDCOM&&<button className="btn" onClick={onImportGEDCOM}>📄 Import GEDCOM</button>}
    </div></div></div>;
  const rootPerson=allPP?.find(p=>p.id===effectiveRoot);
  return(<div ref={wr} className={`cvs ${panning?"grabbing":""}`} onMouseDown={onPS} onTouchStart={onPS}>
    {/* POV bar */}
    <div className="pov-bar">
      <div className="pov-left">
        {povHistory.length>0&&povHistory.map((h,i)=><span key={i}><button className="pov-crumb" onClick={()=>povBack(i)}>{h.label}</button><span className="pov-sep">›</span></span>)}
        {povMode&&rootPerson&&<span className="pov-current">{rootPerson.name}</span>}
        {povMode&&allPP&&allPP.length!==pp.length&&<span className="pov-count">{pp.length}/{allPP.length} anggota</span>}
      </div>
      <div className="pov-right">
        {povMode&&allPP&&allPP.length!==pp.length&&<button className="pov-show-all" onClick={()=>setPovMode(false)}>Tampilkan Semua</button>}
        {povMode&&<select className="pov-sel" value={effectiveRoot||""} onChange={e=>{setPovHistory([]);setPovRootId(e.target.value)}}>{(allPP||pp).filter(p=>FE.ch(allPP||pp,p.id).length>0||!p.parentId).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>}
        <button className={`pov-toggle ${povMode?"on":""}`} onClick={()=>{setPovMode(!povMode);setPovHistory([]);setPovRootId(null)}} title={povMode?"Mode POV aktif":"Mode full tree"}>{povMode?"POV":"Full"}</button>
      </div>
    </div>
    <div className="cvs-inner" style={{transform:`translate(${pan.x}px,${pan.y}px) scale(${zm})`,width:bnd.w,height:bnd.h}}>
      {Object.entries(gls).map(([g,lane])=>{const gi=parseInt(g);const gl=GL[gi]||{l:`Gen ${gi+1}`};const c=GC[gi%GC.length];const minX=Math.min(...pp.filter(p=>FE.gen(pp,p.id)===gi).map(p=>pos[p.id]?.x??Infinity));return(<div key={g} className="gen-lane" style={{position:"absolute",left:Math.max(20,minX-160),top:lane.mi+CH/2-14,pointerEvents:"none",zIndex:1}}><div style={{background:`${c}15`,border:`1px solid ${c}40`,color:c,padding:"4px 12px",borderRadius:14,fontSize:11,fontWeight:600,fontFamily:"var(--f-mono)",letterSpacing:".4px",whiteSpace:"nowrap"}}>Gen {gi+1} · {gl.l}</div></div>)})}
      <svg className="conn-svg" width={bnd.w} height={bnd.h}>
        {conns.map((c,i)=>{
        if(c.t==="sp"){const mx=(c.x1+c.x2)/2;return(<g key={i}>
          <line x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2} stroke="var(--rose)" strokeWidth="1.5" strokeDasharray="5,4" opacity=".55"/>
          <circle cx={mx} cy={c.y1} r="9" fill="var(--bg1)" stroke="var(--rose)" strokeWidth="1"/>
          <text x={mx} y={c.y1+1} textAnchor="middle" dominantBaseline="central" fontSize="13" fill="var(--rose)">∞</text>
        </g>)}
        if(c.t==="pd"){return<path key={i} d={`M ${c.x1} ${c.y1} L ${c.x2} ${c.y2}`} fill="none" stroke="var(--t3)" strokeWidth="1.5" opacity=".9"/>}
        if(c.t==="br"){return<line key={i} x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2} stroke="var(--t3)" strokeWidth="1.5" opacity=".9"/>}
        if(c.t==="cd"){const dy=c.y2-c.y1;return<path key={i} d={`M ${c.x1} ${c.y1} C ${c.x1} ${c.y1+dy*0.5}, ${c.x2} ${c.y1+dy*0.5}, ${c.x2} ${c.y2}`} fill="none" stroke="var(--t3)" strokeWidth="1.75" opacity=".9"/>}
        return null})}</svg>
      {pp.map(p=>{const po=pos[p.id];if(!po)return null;const g=FE.gen(pp,p.id);const c=GC[g%GC.length];const gl=GL[g]||{l:`Gen ${g+1}`};const bd=p.birthDate?new Date(p.birthDate).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"}):"";const alive=!p.deathDate;const chCount=FE.ch(pp,p.id).length;const isCol=collapsed.has(p.id);const descCount=isCol?FE.desc(pp,p.id):0;const isBranch=povMode&&povBranches.some(b=>b.personId===p.id);const isDec=!!p.deathDate;const yr=p.birthDate?new Date(p.birthDate).getFullYear():null;const age=FE.age(p);const meta=[p.gender==="male"?"♂":"♀",yr?`${yr}`:null,age!==null?`${age} th`:null].filter(Boolean).join(" · ");return(<div key={p.id} className={`cc ${p.gender} b${branchIdx[rootMap[p.id]]%8} ${drag===p.id?"dragging":""} ${selId===p.id?"selected":""} ${highlightId===p.id?"highlighted":""} ${isDec?"deceased":""}`} style={{left:po.x,top:po.y,width:CW,minHeight:CH}} onMouseDown={e=>dS(e,p.id)} onTouchStart={e=>dS(e,p.id)} onClick={e=>handleCardClick(e,p)}><span className="cc-badge-gen">G{g+1}</span>{p.nik&&<span className="cc-badge-nik">NIK</span>}<div className={`cc-av ${p.gender}`}>{ini(p.name)}<div className="cc-status" style={{background:alive?"#22c55e":"var(--t3)"}}/></div><div className="cc-nm">{p.name}</div><div className="cc-mt">{meta}</div>{chCount>0&&<div className="cc-toggle" onClick={e=>{e.stopPropagation();toggleCollapse(p.id)}} title={isCol?`Tampilkan ${descCount} keturunan`:"Sembunyikan"}>{isCol?`+${descCount}`:"\u2212"}</div>}{isBranch&&<div className="cc-branch" onClick={e=>{e.stopPropagation();switchPov(p.id)}} title={`Lihat keluarga ${p.name}`}>🔗 Cabang →</div>}{canEdit&&<button className="cc-add" onClick={e=>{e.stopPropagation();setCardMenuId(cardMenuId===p.id?null:p.id)}} title="Tambah anggota">+</button>}{cardMenuId===p.id&&<div className="cc-menu" onClick={e=>e.stopPropagation()}>{(()=>{const hasParent=!!p.parentId;const parentCount=p.parentId?1+(pp.find(x=>x.id===p.parentId)?.spouseId?1:0):0;const canAddParent=parentCount<2&&!hasParent;return[{k:'parent',i:'👆',l:'Orang Tua',dis:!canAddParent},{k:'spouse',i:'💍',l:'Pasangan',dis:false},{k:'child',i:'👶',l:'Anak',dis:false},{k:'sibling',i:'👥',l:'Saudara',dis:!p.parentId}].map(o=><button key={o.k} className="cc-menu-item" disabled={o.dis} onClick={()=>{setCardMenuId(null);onQuickAdd(o.k,p)}}><span className="cc-menu-icon" style={{borderColor:o.dis?'var(--bdr)':'var(--pri)'}}>{o.i}</span>{o.l}</button>)})()}</div>}</div>)})}
    </div>
    {/* Zoom + collapse controls */}
    <div className="zm"><button onClick={()=>setZm(z=>Math.min(2.5,z+.12))}>+</button><button onClick={()=>setZm(z=>Math.max(.1,z-.12))}>−</button><button onClick={fit} title="Fit semua"><Ic.Fit/></button><button onClick={()=>comfortView(pos)} title="Zoom nyaman" style={{fontSize:10}}>🏠</button><button onClick={expandAll} title="Buka semua" style={{fontSize:9}}>⬇</button><button onClick={collapseAll} title="Tutup semua" style={{fontSize:9}}>⬆</button><div style={{fontSize:8,textAlign:"center",color:"var(--t3)",fontFamily:"var(--f-mono)"}}>{Math.round(zm*100)}%</div></div>
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
  const save=()=>{if(!f.name.trim())return;const d={...f,parentId:f.parentId||null,spouseId:f.spouseId||null};if(ie)onSave({...p,...d});else onSave({id:`p_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,...d,photo:"",createdAt:new Date().toISOString()});if(f.spouseId)onSave(null,f.spouseId,ie?p.id:null);onClose()};return(<div className="modal-ov" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()}><div className="m-hdr"><h2>{ie?"Edit":"Tambah"}</h2><button className="btn btn-icon btn-ghost" onClick={onClose}><Ic.X/></button></div><div className="m-body"><div className="fg"><label className="fl">🆔 NIK</label><div className="nik-w"><input className="fi" value={f.nik} onChange={e=>set("nik",e.target.value.replace(/\D/g,"").slice(0,16))} placeholder="16 digit NIK" maxLength={16} style={{flex:1,fontFamily:"var(--f-mono)"}}/>{NIK.valid(f.nik)&&<span className="nik-fill" onClick={nikFill}>Auto-fill ✨</span>}</div>{f.nik&&!NIK.valid(f.nik)&&f.nik.length>0&&<div className="nik-info" style={{color:"var(--rose)"}}>NIK harus 16 digit angka ({f.nik.length}/16)</div>}{nikInfo&&<div className="nik-info">Terdeteksi: <b>{nikInfo.gender==="male"?"♂ Laki-laki":"♀ Perempuan"}</b> · Lahir <b>{nikInfo.birthDate}</b> · <b>{nikInfo.provName}</b></div>}</div><div className="fg"><label className="fl">Nama *</label><input className="fi" value={f.name} onChange={e=>set("name",e.target.value)} autoFocus/></div><div className="fr"><div className="fg"><label className="fl">Gender</label><div className="gtog"><button className={`gbtn ${f.gender==="male"?"am":""}`} onClick={()=>set("gender","male")}>♂ L</button><button className={`gbtn ${f.gender==="female"?"af":""}`} onClick={()=>set("gender","female")}>♀ P</button></div></div><div className="fg"><label className="fl">Agama</label><select className="fsel" value={f.agama} onChange={e=>set("agama",e.target.value)}>{AGAMA_LIST.map(a=><option key={a} value={a}>{a.charAt(0).toUpperCase()+a.slice(1)}</option>)}</select></div></div><div className="fr"><div className="fg"><label className="fl">Lahir</label><input className="fi" type="date" value={f.birthDate} onChange={e=>set("birthDate",e.target.value)}/></div><div className="fg"><label className="fl">Wafat</label><input className="fi" type="date" value={f.deathDate} onChange={e=>set("deathDate",e.target.value)}/></div></div><div className="fg"><label className="fl">Tempat Lahir</label><input className="fi" value={f.birthPlace} onChange={e=>set("birthPlace",e.target.value)}/></div><div className="fr"><div className="fg"><label className="fl">Orang Tua</label><select className="fsel" value={f.parentId} onChange={e=>set("parentId",e.target.value)}><option value="">— Root —</option>{pp.filter(x=>!ie||x.id!==p?.id).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></div><div className="fg"><label className="fl">Pasangan</label><select className="fsel" value={f.spouseId} onChange={e=>set("spouseId",e.target.value)}><option value="">—</option>{pp.filter(x=>!ie||x.id!==p?.id).map(x=><option key={x.id} value={x.id}>{x.name}{x.spouseId?" (sudah ada pasangan)":""}</option>)}</select></div></div><div className="fg"><label className="fl">Catatan</label><textarea className="fta" value={f.notes} onChange={e=>set("notes",e.target.value)}/></div><div className="fg"><label className="fl">📍 Lokasi</label><GeoInput value={f.location} onChange={v=>set("location",v)}/></div></div><div className="m-ftr"><button className="btn" onClick={onClose}>Batal</button><button className="btn btn-p" onClick={save} disabled={!f.name.trim()}>{ie?"Simpan":"Tambah"}</button></div></div></div>)}
function ShareModal({fam,user,onClose,onUpd,flash}){const[em,setEm]=useState("");const[rl,setRl]=useState(RL.EDITOR);const inv=async()=>{if(!em.trim())return;try{const res=await API.invite(fam.id,em,rl);flash(res.message);onUpd()}catch(e){flash(e.message)}setEm("")};const rc={[RL.OWNER]:{bg:"var(--pri)",c:"#000"},[RL.EDITOR]:{bg:"var(--acc)",c:"#fff"},[RL.VIEWER]:{bg:"var(--bg3)",c:"var(--t2)"}};
  return(<div className="modal-ov" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:420}}><div className="m-hdr"><h2>Kolaborasi</h2><button className="btn btn-icon btn-ghost" onClick={onClose}><Ic.X/></button></div><div style={{padding:14}}>
    <div style={{fontSize:10,color:"var(--t3)",marginBottom:6}}>Undang via email</div>
    <div style={{display:"flex",gap:5,marginBottom:14}}><input className="fi" style={{flex:1,padding:"5px 8px",fontSize:11}} value={em} onChange={e=>setEm(e.target.value)} placeholder="email@..." onKeyDown={e=>e.key==="Enter"&&inv()}/><select className="fsel" style={{width:80,padding:"5px",fontSize:10}} value={rl} onChange={e=>setRl(e.target.value)}><option value={RL.EDITOR}>Editor</option><option value={RL.VIEWER}>Viewer</option></select><button className="btn btn-p btn-sm" onClick={inv}>Undang</button></div>
    <div style={{fontSize:10,color:"var(--t3)",marginBottom:6}}>Tim ({(fam.collaborators||[]).length})</div>
    {(fam.collaborators||[]).map((c,i)=>{const r=rc[c.role]||rc.viewer;return<div key={i} className="collab-i"><div className="collab-av">{ini(c.name)}</div><div className="collab-info">{c.name}{c.userId===user.id&&<span>(Anda)</span>}</div><span className="collab-role" style={{background:r.bg,color:r.c}}>{c.role}</span></div>})}
    <div style={{marginTop:12,padding:"8px 10px",background:"var(--bg2)",borderRadius:6,fontSize:9,color:"var(--t3)",lineHeight:1.5,fontFamily:"var(--f-mono)"}}>OWNER = full access · EDITOR = tambah/edit · VIEWER = lihat saja</div>
  </div></div></div>)}
function FilterBar({pp,filters:f,setFilters:sF}){const gs=useMemo(()=>[...new Set(pp.map(p=>FE.gen(pp,p.id)))].sort(),[pp]);const ls=useMemo(()=>[...new Set(pp.filter(p=>p.location?.address).map(p=>p.location.address.split(",")[0].trim()))].sort(),[pp]);const provs=useMemo(()=>{const s=new Set();pp.forEach(p=>{if(p.nik&&p.nik.length>=2){const pc=parseInt(p.nik.slice(0,2));if(PROV[pc])s.add(pc)}});return[...s].sort((a,b)=>a-b)},[pp]);const active=Object.values(f).some(v=>v&&v!=="all");return(<div className="fbar"><label>Gender<select value={f.gender||"all"} onChange={e=>sF(x=>({...x,gender:e.target.value}))}><option value="all">Semua</option><option value="male">♂</option><option value="female">♀</option></select></label><label>Generasi<select value={f.generation??"all"} onChange={e=>sF(x=>({...x,generation:e.target.value}))}><option value="all">Semua</option>{gs.map(g=><option key={g} value={g}>{(GL[g]||{l:`Gen ${g+1}`}).l}</option>)}</select></label><label>Status<select value={f.status||"all"} onChange={e=>sF(x=>({...x,status:e.target.value}))}><option value="all">Semua</option><option value="living">Hidup</option><option value="deceased">Almarhum</option></select></label><label>Lokasi<select value={f.location||""} onChange={e=>sF(x=>({...x,location:e.target.value}))}><option value="">Semua</option>{ls.map(l=><option key={l} value={l}>{l}</option>)}</select></label><label>Prov. Asal<select value={f.provNik||"all"} onChange={e=>sF(x=>({...x,provNik:e.target.value}))}><option value="all">Semua</option>{provs.map(pc=><option key={pc} value={pc}>{PROV[pc].n}</option>)}</select></label><label>NIK<select value={f.nik||"all"} onChange={e=>sF(x=>({...x,nik:e.target.value}))}><option value="all">Semua</option><option value="has">Ada NIK</option><option value="none">Tanpa NIK</option></select></label>{active&&<span className="ftag" onClick={()=>sF({})}>✕ Reset</span>}</div>)}
// ─── BIOGRAPHY ENGINE ────────────────────────────────────────
function generateBio(pp,fam,marriages=[]){
  const sections=[];const roots=FE.roots(pp,marriages);const root=roots[0];
  // Section 1: Asal-Usul
  if(root){const sps=FE.spouses(pp,root,marriages);const ch=FE.ch(pp,root.id);const loc=root.location?.address||"";
    let t=`Keluarga besar ini berawal dari ${root.name}`;if(sps.length)t+=` bersama ${sps.map(s=>s.name).join(" dan ")}`;if(loc)t+=`, berdomisili di ${loc.split(",")[0]}`;t+=`. Dari pernikahan ini, lahir ${ch.length} orang anak: ${ch.map(c=>c.name).join(", ")}.`;
    sections.push({icon:"🌳",title:"Asal-Usul",text:t})}
  // Section 2: Generasi Kedua
  if(root){const ch=FE.ch(pp,root.id);if(ch.length){let t="";ch.forEach((c,i)=>{const sp=FE.spouses(pp,c,marriages);const gc=FE.ch(pp,c.id);const loc=c.location?.address?.split(",")[0]||"";
    t+=`${c.name}`;if(sp.length)t+=` menikah dengan ${sp.map(s=>s.name).join(", ")}`;if(gc.length)t+=` dan dikaruniai ${gc.length} anak`;if(loc)t+=` (${loc})`;t+=". ";if(c.notes)t+=c.notes+". "});
    sections.push({icon:"👨‍👩‍👧‍👦",title:"Generasi Kedua",text:t})}}
  // Section 3: Persebaran
  const locs={};pp.filter(p=>p.location?.address).forEach(p=>{const c=p.location.address.split(",")[0].trim();locs[c]=(locs[c]||0)+1});
  const topLocs=Object.entries(locs).sort((a,b)=>b[1]-a[1]).slice(0,5);
  if(topLocs.length){const migr=pp.filter(p=>p.nik&&p.location?.address).filter(p=>{const pc=parseInt(p.nik.slice(0,2));const prov=PROV[pc];return prov&&!p.location.address.toLowerCase().includes(prov.n.toLowerCase().split(" ")[0])}).length;
    let t=`Anggota keluarga tersebar di ${topLocs.length} wilayah: ${topLocs.map(([c,n])=>`${c} (${n} orang)`).join(", ")}.`;if(migr)t+=` ${migr} anggota merantau dari provinsi asal mereka.`;
    sections.push({icon:"🗺️",title:"Persebaran",text:t})}
  // Section 4: Milestones
  const s=FE.stats(pp);const bds=FE.bdays(pp,90);
  let t4=`Hingga saat ini, keluarga terdiri dari ${s.total} anggota dalam ${s.generations} generasi. ${s.males} laki-laki dan ${s.females} perempuan. ${s.living} masih hidup, ${s.deceased} telah berpulang.`;
  if(bds.length)t4+=` Ulang tahun terdekat: ${bds[0].person.name} (${bds[0].days} hari lagi, ke-${bds[0].age}).`;
  sections.push({icon:"📊",title:"Catatan Penting",text:t4});
  // Section 5: Stories
  if(fam.stories?.length){const st=fam.stories.slice(0,3).map(s=>`"${s.text}" — ${s.author}`).join("\n\n");
    sections.push({icon:"📖",title:"Cerita Keluarga",text:st})}
  // Section 6: Penutup
  sections.push({icon:"🤲",title:"Penutup",text:`"Pelajarilah nasab kalian agar kalian bisa menyambung tali silaturahmi." (HR. Tirmidzi)\n\nDibuat dengan NASAB — Jaga Nasabmu.`});
  return sections;
}
const loadHtml2Pdf=()=>{if(window.html2pdf)return Promise.resolve(window.html2pdf);return new Promise(r=>{const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";s.onload=()=>r(window.html2pdf);document.head.appendChild(s)})};

function InsightsView({pp,fam,canEdit,onSaveFam,flash,marriages=[]}){const[fid,setFid]=useState("");const[tid,setTid]=useState("");const[rr,setRr]=useState(null);const[st,setSt]=useState("");const[sp,setSp]=useState("");const stories=fam.stories||[];const findR=()=>{if(fid&&tid)setRr(FE.findRel(pp,fid,tid))};const bds=useMemo(()=>FE.bdays(pp,90),[pp]);const gd=useMemo(()=>{const d={};pp.forEach(p=>{const g=FE.gen(pp,p.id);d[g]=(d[g]||0)+1});return Object.entries(d).sort((a,b)=>a[0]-b[0]).map(([g,c])=>({gen:parseInt(g),count:c,label:(GL[parseInt(g)]||{l:`Gen ${parseInt(g)+1}`}).l,color:GC[parseInt(g)%GC.length]}))},[pp]);const ld=useMemo(()=>{const d={};pp.filter(p=>p.location?.address).forEach(p=>{const c=p.location.address.split(",")[0].trim();d[c]=(d[c]||0)+1});return Object.entries(d).sort((a,b)=>b[1]-a[1]).slice(0,6)},[pp]);
  // Migration tracker
  const migrasi=useMemo(()=>{return pp.filter(p=>p.nik&&p.nik.length>=2&&p.location?.address).map(p=>{const pc=parseInt(p.nik.slice(0,2));const prov=PROV[pc];if(!prov)return null;const dom=p.location.address.split(",")[0].trim();const asal=prov.n;const merantau=!p.location.address.toLowerCase().includes(asal.toLowerCase().split(" ")[0]);return{name:p.name,asal,domisili:dom,merantau}}).filter(Boolean)},[pp]);
  const addS=async()=>{if(!st.trim())return;try{await API.addStory(fam.id,{text:st,personId:sp||null,personName:sp?(pp.find(p=>p.id===sp)?.name||""):""});onSaveFam();setSt("");flash("Cerita disimpan!")}catch(e){flash(e.message)}};
  const[bioSections,setBioSections]=useState(null);const[aiBio,setAiBio]=useState("");const[aiBusy,setAiBusy]=useState(false);const[bioStyle,setBioStyle]=useState("naratif");const[shareSlug,setShareSlug]=useState("");const[shareUrl,setShareUrl]=useState("");
  const genBio=()=>setBioSections(generateBio(pp,fam,marriages));
  const genAI=async()=>{setAiBusy(true);
    try{const summary={family:fam.name,total:pp.length,generations:FE.stats(pp).generations,root:pp.find(p=>!p.parentId)?.name,members:pp.slice(0,20).map(p=>({name:p.name,gender:p.gender,notes:p.notes}))};
      const styleMap={naratif:"gaya naratif hangat",formal:"gaya formal akademis",puitis:"gaya puitis sastrawi"};
      const prompt=`Tulis biografi keluarga Indonesia berdasarkan data ini dalam Bahasa Indonesia, 500 kata, ${styleMap[bioStyle]||styleMap.naratif}:\n${JSON.stringify(summary)}`;
      const text=await callAI(prompt);setAiBio(text)}catch(e){flash("AI error: "+e.message)}setAiBusy(false)};
  const exportPdf=async()=>{try{const h2p=await loadHtml2Pdf();const el=document.getElementById("bio-content");if(!el)return;
      h2p().from(el).set({margin:10,filename:`Kisah Keluarga ${fam.name}.pdf`,html2canvas:{scale:2},jsPDF:{unit:"mm",format:"a4"}}).save();flash("PDF diunduh")}catch(e){flash("PDF error: "+e.message)}};
  const shareBio=async()=>{if(!bioSections)return;try{const content=JSON.stringify(bioSections);
      const r=await API._f(`/api/families/${fam.id}/biography`,{method:"POST",body:JSON.stringify({content,is_public:true})});
      const url=`${window.location.origin}/kisah/${r.slug}`;setShareUrl(url);setShareSlug(r.slug);navigator.clipboard?.writeText(url);flash("Link disalin!")}catch(e){flash(e.message)}};
  return(<div className="ins"><h2 style={{fontFamily:"var(--f-display)",fontSize:20,marginBottom:14}}>Kisah Keluarga</h2>
    {/* Biography section */}
    <div style={{display:"flex",gap:4,marginBottom:14,flexWrap:"wrap"}}>
      <button className="btn btn-sm btn-p" onClick={genBio}>📝 Auto</button>
      <button className="btn btn-sm" onClick={genAI} disabled={aiBusy}>{aiBusy?"Menulis...":"✨ AI"}</button>
      <select className="fsel" style={{width:100,padding:"3px 6px",fontSize:10}} value={bioStyle} onChange={e=>setBioStyle(e.target.value)}><option value="naratif">Naratif</option><option value="formal">Formal</option><option value="puitis">Puitis</option></select>
      {bioSections&&<button className="btn btn-sm" onClick={exportPdf}>📄 PDF</button>}
      {bioSections&&<button className="btn btn-sm" onClick={shareBio}>🔗 Share</button>}
      {shareUrl&&<span style={{fontSize:9,color:"var(--pri)",alignSelf:"center",fontFamily:"var(--f-mono)"}}>{shareUrl}</span>}
    </div>
    {(bioSections||aiBio)&&<div id="bio-content" style={{maxWidth:640,margin:"0 auto 20px",padding:24,background:"var(--bg1)",border:"1px solid var(--bdr)",borderRadius:12}}>
      <h2 style={{fontFamily:"var(--f-display)",fontSize:22,textAlign:"center",marginBottom:4}}>Kisah Keluarga {fam.name}</h2>
      <div style={{textAlign:"center",fontSize:10,color:"var(--t3)",marginBottom:20}}>{new Date().toLocaleDateString("id-ID",{year:"numeric",month:"long",day:"numeric"})}</div>
      {aiBio?<div style={{fontFamily:"var(--f-body)",fontSize:14,lineHeight:1.8,color:"var(--t1)",whiteSpace:"pre-wrap"}}>{aiBio}</div>:
      bioSections?.map((s,i)=><div key={i} style={{marginBottom:20}}>
        <h3 style={{fontFamily:"var(--f-display)",fontSize:18,marginBottom:6,display:"flex",alignItems:"center",gap:8}}><span>{s.icon}</span>{s.title}</h3>
        <p style={{fontFamily:"var(--f-body)",fontSize:14,lineHeight:1.8,color:"var(--t2)",whiteSpace:"pre-wrap"}}>{s.text}</p>
      </div>)}
      <div style={{textAlign:"center",marginTop:24,fontSize:10,color:"var(--t3)",borderTop:"1px solid var(--bdr)",paddingTop:12}}>Dibuat dengan NASAB — nasab.biz.id</div>
    </div>}
    {/* Existing insights tools */}
    <div className="ins-g">
    <div className="ins-c"><h3><span>🔍</span>Pencari Hubungan</h3><div className="rf-sel"><select className="fsel" value={fid} onChange={e=>setFid(e.target.value)}><option value="">Orang 1...</option>{pp.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><select className="fsel" value={tid} onChange={e=>setTid(e.target.value)}><option value="">Orang 2...</option>{pp.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><button className="btn btn-p btn-sm" onClick={findR} disabled={!fid||!tid}>Cari</button></div>{rr&&<div className="rf-res"><div className="rf-res-l" style={{color:rr.path.length?"var(--pri)":"var(--t3)"}}>{rr.label}</div>{rr.path.length>0&&<div className="rf-res-p"><span className="rf-node">{pp.find(p=>p.id===fid)?.name}</span>{rr.path.map((s,i)=><span key={i} style={{display:"flex",alignItems:"center",gap:3}}><span className="rf-arrow">→</span><span className="rf-node">{pp.find(p=>p.id===s.id)?.name}</span></span>)}</div>}</div>}</div>
    <div className="ins-c"><h3><span>🎂</span>Ulang Tahun</h3>{!bds.length?<div style={{fontSize:11,color:"var(--t3)",textAlign:"center",padding:12}}>Tidak ada data</div>:bds.slice(0,6).map((b,i)=><div key={i} className="bd-i"><div className="bd-d" style={{background:b.days===0?"var(--pri)":b.days<=7?"rgba(236,72,153,.15)":"var(--bg2)",color:b.days===0?"#000":b.days<=7?"var(--rose)":"var(--t2)"}}>{b.days===0?"TODAY":b.days+"d"}</div><div className="bd-info">{b.person.name} <span>ke-{b.age}, {b.next.toLocaleDateString("id-ID",{day:"numeric",month:"short"})}</span></div></div>)}</div>
    <div className="ins-c"><h3><span>📊</span>Distribusi</h3><div className="gb">{gd.map(g=><div key={g.gen} style={{width:`${(g.count/pp.length)*100}%`,background:g.color}}/>)}</div><div className="gb-leg">{gd.map(g=><div key={g.gen} className="gb-leg-i"><div className="gb-leg-d" style={{background:g.color}}/>{g.label} ({g.count})</div>)}</div>{ld.length>0&&<div style={{marginTop:12}}>{ld.map(([city,count],i)=><div key={i} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><span style={{fontSize:10,flex:1}}>{city}</span><div style={{width:80,height:5,background:"var(--bg3)",borderRadius:3,overflow:"hidden"}}><div style={{width:`${(count/pp.length)*100}%`,height:"100%",background:"var(--pri)",borderRadius:3}}/></div><span style={{fontSize:9,color:"var(--t3)",minWidth:20,textAlign:"right",fontFamily:"var(--f-mono)"}}>{count}</span></div>)}</div>}</div>
    <div className="ins-c"><h3><span>⚡</span>Fakta</h3>{(()=>{const s=FE.stats(pp);const mc=pp.reduce((b,p)=>{const c=FE.chAll(pp,p.id,marriages).length;return c>b.c?{p,c}:b},{p:null,c:0});const md=pp.reduce((b,p)=>{const d=FE.descAll(pp,p.id,marriages);return d>b.c?{p,c:d}:b},{p:null,c:0});return<div style={{fontSize:11,lineHeight:2,color:"var(--t2)"}}>{pp.length?`${((s.males/pp.length)*100).toFixed(0)}% laki-laki`:""}<br/>{pp.length?`${((s.geotagged/pp.length)*100).toFixed(0)}% geotagged`:""}<br/>{mc.p&&<>🏆 {mc.p.name}: {mc.c} anak<br/></>}{md.p&&<>🌳 {md.p.name}: {md.c} keturunan<br/></>}{ld.length} kota</div>})()}</div>
    <div className="ins-c"><h3><span>🚀</span>Pola Migrasi</h3>{!migrasi.length?<div style={{fontSize:11,color:"var(--t3)",textAlign:"center",padding:12}}>Tambahkan NIK + lokasi untuk analisis migrasi</div>:<div>{migrasi.filter(m=>m.merantau).length>0&&<div style={{fontSize:11,color:"var(--pri)",marginBottom:8,fontWeight:600}}>{migrasi.filter(m=>m.merantau).length} dari {migrasi.length} ({(migrasi.filter(m=>m.merantau).length/migrasi.length*100).toFixed(0)}%) merantau</div>}{migrasi.slice(0,8).map((m,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:6,fontSize:10,marginBottom:4,color:m.merantau?"var(--t1)":"var(--t3)"}}><span style={{fontWeight:600,minWidth:80,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.name}</span><span style={{fontSize:8,color:"var(--t3)"}}>{m.asal}</span>{m.merantau&&<><span style={{color:"var(--pri)"}}>→</span><span style={{fontSize:8,color:"var(--pri)"}}>{m.domisili}</span></>}{!m.merantau&&<span style={{fontSize:8,color:"var(--t3)"}}>— tetap</span>}</div>)}</div>}</div>
    <div className="ins-c ins-cf"><h3><span>📖</span>Cerita Keluarga</h3><div style={{marginBottom:10}}><div style={{display:"flex",gap:5,marginBottom:5}}><select className="fsel" value={sp} onChange={e=>setSp(e.target.value)} style={{width:160,fontSize:10}}><option value="">Cerita umum</option>{pp.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><button className="btn btn-p btn-sm" onClick={addS} disabled={!st.trim()}>Simpan</button></div><textarea className="fta" value={st} onChange={e=>setSt(e.target.value)} placeholder="Tulis cerita, kenangan, pesan..." style={{minHeight:40}}/></div>{!stories.length?<div style={{fontSize:11,color:"var(--t3)",textAlign:"center",padding:16}}>Belum ada cerita</div>:stories.map(s=><div key={s.id} className="st-entry"><div className="st-date">{new Date(s.date).toLocaleDateString("id-ID",{year:"numeric",month:"short",day:"numeric"})}{s.personName&&` · ${s.personName}`}</div><div className="st-text">{s.text}</div><div className="st-author">— {s.author}</div></div>)}</div>
  </div></div>)}
function Sidebar({p,pp,marriages=[],canEdit,onClose,onEdit,onDel,onSel}){const pa=FE.pa(pp,p);const sps=FE.spouses(pp,p,marriages);const sp=sps[0]||null;const ch=FE.chAll(pp,p.id,marriages);const sib=FE.sib(pp,p);const g=FE.gen(pp,p.id);const d=FE.descAll(pp,p.id,marriages);const gl=GL[g]||{l:`Gen ${g+1}`};const age=FE.age(p);const ctx=useMemo(()=>{const c=[];if(pa)c.push(`Anak ${pa.name}`);if(sps.length===1)c.push(`∞ ${sps[0].name}`);else if(sps.length>1)c.push(`∞ ${sps.length} pasangan`);if(ch.length)c.push(`${ch.length} anak`);return c.join(" · ")},[pa,sps,ch]);
  const[showNik,setShowNik]=useState(false);
  return(<div className="sb" onClick={e=>e.stopPropagation()}><div className="sb-h"><h3>Detail</h3><button className="btn btn-icon btn-ghost" onClick={onClose}><Ic.X/></button></div><div className="sb-b"><div className={`sb-av ${p.gender}`}>{ini(p.name)}</div><div className="sb-nm">{p.name}</div><div className="sb-sub">{p.gender==="male"?"♂":"♀"} · {gl.l}{p.deathDate?" · Alm.":""} · {(p.agama||"islam").charAt(0).toUpperCase()+(p.agama||"islam").slice(1)}</div>{ctx&&<div className="sb-ctx">{ctx}</div>}<div className="sb-sec"><div className="sb-sec-t">Info</div>{p.nik&&<div className="sb-row"><span className="sb-row-l">🆔 NIK</span><span className="sb-row-v"><span className="nik-masked" onClick={()=>setShowNik(!showNik)} style={{cursor:"pointer"}} title="Klik untuk tampilkan/sembunyikan">{showNik?NIK.format(p.nik):NIK.mask(p.nik)}</span></span></div>}{p.birthDate&&<div className="sb-row"><span className="sb-row-l">Lahir</span><span className="sb-row-v">{new Date(p.birthDate).toLocaleDateString("id-ID",{year:"numeric",month:"long",day:"numeric"})}</span></div>}{age!==null&&<div className="sb-row"><span className="sb-row-l">Usia</span><span className="sb-row-v">{age} th</span></div>}{p.location?.lat&&<div className="sb-row"><span className="sb-row-l">📍</span><span className="sb-row-v">{p.location.address||`${p.location.lat.toFixed(3)},${p.location.lng.toFixed(3)}`}</span></div>}<div className="sb-row"><span className="sb-row-l">Keturunan</span><span className="sb-row-v">{d}</span></div>{p.notes&&<div className="sb-row"><span className="sb-row-l">Catatan</span><span className="sb-row-v">{p.notes}</span></div>}</div>
    <div className="sb-sec"><div className="sb-sec-t">Hubungan</div>{pa&&<div className="sb-rel" onClick={()=>{onClose();setTimeout(()=>onSel(pa),50)}}><span className="sb-rel-t">PARENT</span>{pa.name}</div>}{sps.map((s,i)=>{const mar=marriages.find(m=>(m.husbandId===p.id&&m.wifeId===s.id)||(m.husbandId===s.id&&m.wifeId===p.id));return<div key={s.id} className="sb-rel" onClick={()=>{onClose();setTimeout(()=>onSel(s),50)}}><span className="sb-rel-t" style={{color:"var(--rose)"}}>{sps.length>1?`ISTRI ${mar?.order||i+1}`:"SPOUSE"}</span>{s.name}</div>})}{sib.map(s=><div key={s.id} className="sb-rel" onClick={()=>{onClose();setTimeout(()=>onSel(s),50)}}><span className="sb-rel-t" style={{color:"var(--purple)"}}>SIBLING</span>{s.name}</div>)}{ch.map(c=><div key={c.id} className="sb-rel" onClick={()=>{onClose();setTimeout(()=>onSel(c),50)}}><span className="sb-rel-t" style={{color:"var(--pri)"}}>CHILD</span>{c.name}</div>)}</div></div>
    {canEdit&&<div className="sb-ft"><button className="btn btn-d btn-sm" onClick={()=>onDel(p.id)}><Ic.Trash/></button><button className="btn btn-p btn-sm" onClick={()=>onEdit(p)}><Ic.Edit/> Edit</button></div>}</div>)}
function ListView({pp,allPP,onSel,canEdit,fam,onDone,flash,myRole}){const people=allPP||pp;
  const[selMode,setSelMode]=useState(false);const[selected,setSelected]=useState(new Set());const[deleting,setDeleting]=useState(false);
  const[showDelAll,setShowDelAll]=useState(false);const[delAllConfirm,setDelAllConfirm]=useState("");const[delAllBusy,setDelAllBusy]=useState(false);
  const toggle=id=>{setSelected(prev=>{const n=new Set(prev);if(n.has(id))n.delete(id);else n.add(id);return n})};
  const selAll=()=>{if(selected.size===pp.length)setSelected(new Set());else setSelected(new Set(pp.map(p=>p.id)))};
  const bulkDel=async()=>{if(!selected.size||!confirm(`Hapus ${selected.size} orang? Tidak bisa dibatalkan.`))return;setDeleting(true);let ok=0,skip=0;
    for(const id of selected){const ch=FE.ch(pp,id);if(ch.length){skip++;continue}try{await API.deleteMember(fam.id,id);ok++}catch{skip++}}
    setDeleting(false);setSelected(new Set());setSelMode(false);if(onDone)onDone();flash(`${ok} dihapus${skip?`, ${skip} dilewati (punya anak)`:""}`);};
  const delAll=async()=>{if(delAllConfirm!=="HAPUS")return;setDelAllBusy(true);try{const r=await API.deleteAllMembers(fam.id);flash(r.message);setShowDelAll(false);setDelAllConfirm("");if(onDone)onDone()}catch(e){flash(e.message)}setDelAllBusy(false)};
  const sorted=[...pp].sort((a,b)=>FE.gen(people,a.id)-FE.gen(people,b.id)||a.name.localeCompare(b.name));
  if(!pp.length)return<div className="lv" style={{justifyContent:"center",alignItems:"center",height:"100%"}}><div style={{textAlign:"center",padding:32,color:"var(--t3)"}}><div style={{fontSize:40,marginBottom:8}}>📋</div><h3 style={{fontFamily:"var(--f-display)",fontSize:16,color:"var(--t2)",marginBottom:4}}>Belum ada anggota</h3><p style={{fontSize:12}}>Tambah anggota dari tab Canvas atau gunakan tombol + di header</p></div></div>;
  return(<div className="lv">
    {canEdit&&<div style={{display:"flex",gap:6,alignItems:"center",padding:"6px 0",marginBottom:4,flexWrap:"wrap"}}>
      <button className="btn btn-sm" onClick={()=>{setSelMode(!selMode);setSelected(new Set())}}>{selMode?"Batal":"Pilih"}</button>
      {selMode&&<><button className="btn btn-sm" onClick={selAll}>{selected.size===pp.length?"Batal Semua":"Pilih Semua"}</button>
      <button className="btn btn-sm btn-d" onClick={bulkDel} disabled={!selected.size||deleting}>{deleting?"Menghapus...":selected.size?`Hapus ${selected.size} Terpilih`:"Hapus"}</button>
      <span style={{fontSize:10,color:"var(--t3)"}}>{selected.size} dipilih</span></>}
      {myRole==="owner"&&pp.length>0&&<button className="btn btn-sm btn-d" onClick={()=>setShowDelAll(true)} style={{marginLeft:"auto"}}>Hapus Semua ({pp.length})</button>}
    </div>}
    {sorted.map(p=>{const g=FE.gen(people,p.id);const gl=GL[g]||{l:`Gen ${g+1}`};const c=GC[g%GC.length];return<div key={p.id} className="li" onClick={()=>selMode?toggle(p.id):onSel(p)} style={selMode&&selected.has(p.id)?{borderColor:"var(--pri)",background:"rgba(20,184,166,.06)"}:undefined}>
      {selMode&&<input type="checkbox" checked={selected.has(p.id)} onChange={()=>toggle(p.id)} style={{accentColor:"var(--pri)",flexShrink:0}} onClick={e=>e.stopPropagation()}/>}
      <div className={`li-av ${p.gender}`}>{ini(p.name)}</div><div className="li-info"><h4>{p.name}</h4><p>{p.location?.address||p.notes||"—"}</p></div><span className="li-badge" style={{background:c+"18",color:c,border:`1px solid ${c}30`}}>{gl.l}</span></div>})}
    {showDelAll&&<div className="modal-ov" onClick={()=>{setShowDelAll(false);setDelAllConfirm("")}}><div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:400}}>
      <div className="m-hdr"><h2 style={{color:"var(--rose)"}}>Hapus Semua Anggota?</h2><button className="btn btn-icon btn-ghost" onClick={()=>{setShowDelAll(false);setDelAllConfirm("")}}><Ic.X/></button></div>
      <div className="m-body">
        <p style={{fontSize:12,lineHeight:1.6,color:"var(--t2)",marginBottom:12}}>Ini akan menghapus <b style={{color:"var(--rose)"}}>{pp.length}</b> anggota keluarga dari silsilah "<b>{fam.name}</b>". Data yang dihapus <b>TIDAK</b> bisa dikembalikan. Canvas positions dan data pernikahan juga akan di-reset.</p>
        <div className="fg"><label className="fl">Ketik <b>HAPUS</b> untuk konfirmasi:</label><input className="fi" value={delAllConfirm} onChange={e=>setDelAllConfirm(e.target.value)} placeholder="HAPUS" autoFocus style={{borderColor:delAllConfirm==="HAPUS"?"var(--rose)":"var(--bdr)"}}/></div>
      </div>
      <div className="m-ftr"><button className="btn" onClick={()=>{setShowDelAll(false);setDelAllConfirm("")}}>Batal</button><button className="btn btn-d" onClick={delAll} disabled={delAllConfirm!=="HAPUS"||delAllBusy}>{delAllBusy?"Menghapus...":"Hapus Semua"}</button></div>
    </div></div>}
  </div>)}
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
  const[pid,setPid]=useState("");const[ww,setWw]=useState(false);const[tab,setTab]=useState("faraidh");
  const[assets,setAssets]=useState([{type:'cash',desc:'',value:0}]);
  const[hutang,setHutang]=useState(0);const[wasiat,setWasiat]=useState(0);const[wakaf,setWakaf]=useState(0);const[zakatOn,setZakatOn]=useState(false);
  const deceased=useMemo(()=>pp.filter(p=>p.deathDate),[pp]);
  const defaultH={husband:0,wife:0,sons:0,daughters:0,father:0,mother:0,grandfather:0,grandmother:0,brothers:0,sisters:0};
  const[h,setH]=useState(defaultH);const[blocked,setBlocked]=useState([]);const[warnings,setWarnings]=useState([]);
  const setHeir=(k,v)=>setH(x=>({...x,[k]:Math.max(0,parseInt(v)||0)}));
  const autoDetect=useCallback((id)=>{if(!id){setH(defaultH);setBlocked([]);setWarnings([]);return}const d=FARAIDH.detectHeirs(pp,id);setH(d.heirs||d);setBlocked(d.blocked||[]);setWarnings(d.warnings||[])},[pp]);
  useEffect(()=>{if(pid)autoDetect(pid)},[pid]);
  const bruto=assets.reduce((s,a)=>s+a.value,0);
  const zakatAmt=zakatOn?bruto*0.025:0;
  const total=Math.max(0,bruto-hutang-wasiat-wakaf-zakatAmt);
  const results=useMemo(()=>FARAIDH.calc(h,total,{blocked,wasiatWajibah:ww}),[h,total,blocked,ww]);
  const fmt=n=>new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",minimumFractionDigits:0}).format(Math.round(n));
  const hasBlocked=blocked.length>0;
  return(<div className="modal-ov" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:720}}><div className="m-hdr"><h2>⚖️ Kalkulator Faraidh</h2><button className="btn btn-icon btn-ghost" onClick={onClose}><Ic.X/></button></div><div className="m-body">
    <div style={{fontSize:10,color:"var(--t3)",marginBottom:12,lineHeight:1.6}}>Kalkulator waris Islam berdasarkan hukum faraidh. Pilih almarhum untuk auto-deteksi ahli waris dari silsilah (termasuk filter agama), atau isi manual.</div>
    <div className="far-sel"><label style={{fontSize:11,fontWeight:600}}>Almarhum:</label><select className="fsel" value={pid} onChange={e=>{setPid(e.target.value)}} style={{flex:1,maxWidth:250}}><option value="">— Pilih (opsional) —</option>{deceased.map(p=><option key={p.id} value={p.id}>{p.name} ({p.agama||"islam"})</option>)}</select></div>
    {warnings.length>0&&<div style={{background:"#3f121944",border:"1px solid #5f1d2d",borderRadius:6,padding:"8px 10px",marginBottom:12}}><div style={{fontSize:9,fontWeight:700,color:"var(--rose)",marginBottom:4}}>⚠️ Penghalang Waris Terdeteksi</div>{warnings.map((w,i)=><div key={i} style={{fontSize:10,color:"#fca5a5",lineHeight:1.6}}>• {w}</div>)}</div>}
    {hasBlocked&&<div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:6,marginBottom:12}}><label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:11,fontWeight:500}}><input type="checkbox" checked={ww} onChange={e=>setWw(e.target.checked)} style={{accentColor:"var(--pri)"}}/> Hitung Wasiat Wajibah</label><span style={{fontSize:9,color:"var(--t3)"}}>(maks ⅓ harta untuk ahli waris beda agama)</span></div>}
    {/* Asset input table */}
    <div style={{marginTop:12}}>
      <div style={{fontSize:11,fontWeight:600,marginBottom:6}}>📦 Rincian Harta</div>
      {assets.map((a,i)=><div key={i} style={{display:"flex",gap:4,marginBottom:4,alignItems:"center"}}>
        <select className="fsel" value={a.type} onChange={e=>{const n=[...assets];n[i].type=e.target.value;setAssets(n)}} style={{width:100,fontSize:10}}>{ATYP.map(t=><option key={t.id} value={t.id}>{t.i} {t.l}</option>)}</select>
        <input className="fi" value={a.desc} onChange={e=>{const n=[...assets];n[i].desc=e.target.value;setAssets(n)}} placeholder="Keterangan" style={{flex:1,fontSize:10,padding:"4px 6px"}}/>
        <input className="fi" type="number" value={a.value||''} onChange={e=>{const n=[...assets];n[i].value=parseFloat(e.target.value)||0;setAssets(n)}} placeholder="Nilai" style={{width:120,fontSize:10,padding:"4px 6px"}}/>
        <button className="btn btn-icon btn-ghost" onClick={()=>setAssets(assets.filter((_,j)=>j!==i))} style={{fontSize:10,padding:2}}>✕</button>
      </div>)}
      <button className="btn btn-sm" onClick={()=>setAssets([...assets,{type:'other',desc:'',value:0}])} style={{fontSize:9,marginTop:4}}>+ Tambah Aset</button>
      <div style={{marginTop:8,fontSize:11,fontFamily:"var(--f-mono)"}}>
        <div>Total Bruto: {fmt(bruto)}</div>
      </div>
    </div>
    <div className="fr" style={{marginTop:10}}>
      <div className="fg"><label className="fl">Hutang</label><input className="fi" type="number" value={hutang||''} onChange={e=>setHutang(parseFloat(e.target.value)||0)}/></div>
      <div className="fg"><label className="fl">Wasiat (maks 1/3)</label><input className="fi" type="number" value={wasiat||''} onChange={e=>setWasiat(parseFloat(e.target.value)||0)}/></div>
    </div>
    <div className="fg"><label className="fl">Wakaf Keluarga</label><input className="fi" type="number" value={wakaf||''} onChange={e=>setWakaf(parseFloat(e.target.value)||0)}/></div>
    <label style={{display:"flex",alignItems:"center",gap:6,fontSize:11,marginBottom:8}}><input type="checkbox" checked={zakatOn} onChange={e=>setZakatOn(e.target.checked)} style={{accentColor:"var(--pri)"}}/> Zakat Maal (2.5% di atas nisab 85 gram emas)</label>
    <div style={{fontSize:10,fontFamily:"var(--f-mono)",padding:"8px 10px",background:"var(--bg2)",borderRadius:6,marginBottom:12,lineHeight:1.8}}>
      Bruto: {fmt(bruto)} − Hutang: {fmt(hutang)} − Wasiat: {fmt(wasiat)} − Wakaf: {fmt(wakaf)}{zakatOn?` − Zakat: ${fmt(zakatAmt)}`:''} = <b style={{color:"var(--pri)"}}>Netto: {fmt(total)}</b>
    </div>
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
    </div>:results.faraidh&&results.faraidh.length>0?<div>
      <FaraidhResultTable results={results.faraidh} total={total} fmt={fmt} label="Pembagian Waris"/>
      {assets.filter(a=>a.value>0).length>1&&<div style={{marginTop:10}}><div style={{fontSize:10,fontWeight:600,color:"var(--t2)",marginBottom:6}}>📦 Rincian Per Aset</div>
        <div style={{overflowX:"auto"}}><table className="far-table"><thead><tr><th>Ahli Waris</th>{assets.filter(a=>a.value>0).map((a,i)=><th key={i} style={{fontSize:8}}>{ATYP.find(t=>t.id===a.type)?.i} {a.desc||ATYP.find(t=>t.id===a.type)?.l}</th>)}</tr></thead><tbody>
          {results.faraidh.map((r,i)=><tr key={i}><td style={{fontSize:10}}>{r.heir} (x{r.count})</td>{assets.filter(a=>a.value>0).map((a,j)=>{const ratio=bruto>0?a.value/bruto:0;const netAsset=ratio*total;return<td key={j} style={{fontFamily:"var(--f-mono)",fontSize:9}}>{fmt(netAsset*r.share/r.count)}/org</td>})}</tr>)}
        </tbody></table></div>
      </div>}
    </div>:<div style={{textAlign:"center",padding:20,color:"var(--t3)",fontSize:12}}>Tambahkan ahli waris untuk melihat perhitungan</div>}
    <div style={{marginTop:14,padding:"8px 10px",background:"var(--bg2)",borderRadius:6,fontSize:9,color:"var(--t3)",lineHeight:1.6,fontFamily:"var(--f-mono)"}}>⚖️ Disclaimer: Kalkulator ini menggunakan hukum faraidh dasar + wasiat wajibah (KHI Pasal 209). Untuk kasus kompleks, konsultasikan dengan ahli waris/ulama.</div>
  </div></div></div>)}
// ─── KK IMPORT MODAL ─────────────────────────────────────────
const KK_HUBUNGAN=["Kepala Keluarga","Istri","Anak","Orang Tua","Mertua","Menantu","Cucu","Famili Lain"];
const OCR_PROMPT=`Extract semua data anggota dari foto Kartu Keluarga Indonesia ini. Return HANYA JSON object tanpa markdown: {"no_kk":"...","alamat":"...","anggota":[{"nama":"...","nik":"...","hubungan":"Kepala Keluarga|Istri|Anak|Orang Tua|Mertua|Cucu","jenisKelamin":"Laki-laki|Perempuan","tempatLahir":"...","tanggalLahir":"DD-MM-YYYY","agama":"Islam|Kristen|Katolik|Hindu|Buddha|Konghucu","statusKawin":"Kawin|Belum Kawin|Cerai Hidup|Cerai Mati"}]}`;
function KKModal({fam,onClose,onDone,flash}){
  const[tab,setTab]=useState("manual");const[noKk,setNoKk]=useState("");const[alamat,setAlamat]=useState("");const[geo,setGeo]=useState(null);
  const[rows,setRows]=useState([{nama:"",nik:"",hubungan:"Kepala Keluarga",jk:"male",tglLahir:"",agama:"islam",statusKawin:"Kawin"}]);
  const[busy,setBusy]=useState(false);const[ocrBusy,setOcrBusy]=useState(false);
  const kkProv=useMemo(()=>{if(noKk.length>=2){const pc=parseInt(noKk.slice(0,2));return PROV[pc]||null}return null},[noKk]);
  const addRow=()=>setRows(r=>[...r,{nama:"",nik:"",hubungan:"Anak",jk:"male",tglLahir:"",agama:"islam",statusKawin:"Belum Kawin"}]);
  const delRow=i=>setRows(r=>r.filter((_,j)=>j!==i));
  const setR=(i,k,v)=>setRows(r=>r.map((x,j)=>j===i?{...x,[k]:v}:x));
  const nikFill=(i)=>{const r=rows[i];const d=NIK.parse(r.nik);if(d){setR(i,"jk",d.gender==="male"?"male":"female");setR(i,"tglLahir",d.birthDate)}};
  // Geocode alamat KK
  const geocodeAlamat=async()=>{if(!alamat.trim())return;try{const r=await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(alamat)}&limit=1&countrycodes=id`);const d=await r.json();if(d.length){setGeo({lat:parseFloat(d[0].lat),lng:parseFloat(d[0].lon),address:alamat});flash("Lokasi ditemukan")}else flash("Lokasi tidak ditemukan")}catch{}};
  // OCR via Claude API (via Worker proxy — uses encrypted claude_api_key
  // stored server-side, not localStorage)
  const doOcr=async(file)=>{setOcrBusy(true);
    try{const buf=await file.arrayBuffer();const b64=btoa(String.fromCharCode(...new Uint8Array(buf)));const mt=file.type||"image/jpeg";
      const payload={model:"claude-sonnet-4-20250514",max_tokens:4000,messages:[{role:"user",content:[{type:"image",source:{type:"base64",media_type:mt,data:b64}},{type:"text",text:OCR_PROMPT}]}]};
      let j;try{j=await callAIRaw('claude',payload)}catch(e){flash("OCR error: "+e.message);setOcrBusy(false);return}
      const txt=j.content?.[0]?.text||"";const m=txt.match(/\{[\s\S]*\}/);if(!m){flash("Tidak bisa parse hasil OCR");setOcrBusy(false);return}
      const data=JSON.parse(m[0]);
      if(data.no_kk)setNoKk(data.no_kk.replace(/\D/g,""));if(data.alamat)setAlamat(data.alamat);
      if(data.anggota?.length){setRows(data.anggota.map(a=>{const tl=a.tanggalLahir?(()=>{const p=a.tanggalLahir.split("-");return p.length===3?`${p[2]}-${p[1]}-${p[0]}`:a.tanggalLahir})():"";
        return{nama:a.nama||"",nik:(a.nik||"").replace(/\D/g,""),hubungan:KK_HUBUNGAN.includes(a.hubungan)?a.hubungan:"Famili Lain",jk:a.jenisKelamin==="Perempuan"?"female":"male",tglLahir:tl,agama:(a.agama||"islam").toLowerCase(),statusKawin:a.statusKawin||"Kawin"}}));flash(`${data.anggota.length} anggota terdeteksi dari foto`)}
      setTab("manual");
    }catch(e){flash("OCR gagal: "+e.message)}setOcrBusy(false)};
  // Generate silsilah from KK rows
  const generate=async()=>{if(!rows.length)return;setBusy(true);
    try{const kepala=rows.find(r=>r.hubungan==="Kepala Keluarga");const istri=rows.filter(r=>r.hubungan==="Istri");
      const loc=geo||null;const addM=async(r,parentId,spouseId)=>{const res=await API.addMember(fam.id,{name:r.nama,gender:r.jk,birthDate:r.tglLahir||"",deathDate:"",birthPlace:r.tempatLahir||"",notes:`Status: ${r.statusKawin}`,parentId,spouseId,location:loc,nik:r.nik||"",agama:r.agama||"islam",noKk:noKk||""});return res.id};
      let kepalaId=null,istriIds=[];
      // 1. Kepala Keluarga
      if(kepala)kepalaId=await addM(kepala,null,null);
      // 2. Istri → spouse of kepala + marriage
      for(const ist of istri){const id=await addM(ist,null,kepalaId);istriIds.push(id);if(kepalaId)await API.addMarriage(fam.id,{husband_id:kepalaId,wife_id:id,marriage_order:istriIds.length})}
      // 3. Anak → parent = kepala
      const anakIds={};for(const r of rows.filter(r=>r.hubungan==="Anak")){anakIds[r.nama]=await addM(r,kepalaId,null)}
      // 4. Orang Tua → parent of kepala
      for(const r of rows.filter(r=>r.hubungan==="Orang Tua")){const id=await addM(r,null,null);if(kepalaId){await API.updateMember(fam.id,kepalaId,{...kepala,parentId:id,spouseId:istriIds[0]||null,location:loc,nik:kepala.nik,agama:kepala.agama,noKk:noKk,name:kepala.nama,gender:kepala.jk,birthDate:kepala.tglLahir,deathDate:"",birthPlace:kepala.tempatLahir||"",notes:`Status: ${kepala.statusKawin}`})}}
      // 5. Mertua → parent of istri pertama
      for(const r of rows.filter(r=>r.hubungan==="Mertua")){const id=await addM(r,null,null);if(istriIds[0]){const ist=istri[0];await API.updateMember(fam.id,istriIds[0],{...ist,parentId:id,spouseId:kepalaId,location:loc,nik:ist.nik,agama:ist.agama,noKk:noKk,name:ist.nama,gender:ist.jk,birthDate:ist.tglLahir,deathDate:"",birthPlace:ist.tempatLahir||"",notes:`Status: ${ist.statusKawin}`})}}
      // 6. Menantu → spouse of anak
      for(const r of rows.filter(r=>r.hubungan==="Menantu")){await addM(r,null,null)}
      // 7. Cucu → parent = first anak
      const firstAnak=Object.values(anakIds)[0]||null;for(const r of rows.filter(r=>r.hubungan==="Cucu")){await addM(r,firstAnak,null)}
      // 8. Famili lain
      for(const r of rows.filter(r=>r.hubungan==="Famili Lain")){await addM(r,null,null)}
      flash(`${rows.length} anggota ditambahkan dari KK`);onDone();onClose();
    }catch(e){flash("Error: "+e.message)}setBusy(false)};
  return<div className="modal-ov" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:760,maxHeight:"90vh"}}><div className="m-hdr"><h2>📋 Import Kartu Keluarga</h2><button className="btn btn-icon btn-ghost" onClick={onClose}><Ic.X/></button></div><div className="m-body" style={{maxHeight:"72vh",overflowY:"auto"}}>
    <div style={{fontSize:10,color:"var(--t3)",marginBottom:10,lineHeight:1.6,padding:"6px 8px",background:"var(--bg2)",borderRadius:6}}>Data KK hanya digunakan untuk generate silsilah. Foto KK diproses client-side, tidak disimpan di server. (UU PDP)</div>
    <div style={{display:"flex",gap:4,marginBottom:12}}><button className={`btn btn-sm ${tab==="manual"?"btn-p":""}`} onClick={()=>setTab("manual")}>Input Manual</button><button className={`btn btn-sm ${tab==="ocr"?"btn-p":""}`} onClick={()=>setTab("ocr")}>Upload Foto</button></div>
    {tab==="ocr"&&<div style={{marginBottom:14}}>
      <div style={{fontSize:10,color:"var(--t3)",marginBottom:8,padding:"6px 8px",background:"var(--bg2)",borderRadius:6,lineHeight:1.5}}>📌 OCR pakai Claude Vision via Worker proxy — set Claude API key dulu di tab <b>Keluarga → Pengaturan AI</b>. Key disimpan terenkripsi di server, bukan di browser.</div>
      <div className="fg"><label className="fl">Foto KK (JPG/PNG)</label><input type="file" accept="image/*" onChange={e=>{const f=e.target.files[0];if(f)doOcr(f)}} style={{fontSize:11}}/></div>
      {ocrBusy&&<div style={{textAlign:"center",padding:20,color:"var(--pri)"}}>Memproses foto... (Claude Vision)</div>}
    </div>}
    {tab==="manual"&&<div>
      <div className="fr" style={{marginBottom:10}}>
        <div className="fg"><label className="fl">No. KK (16 digit)</label><input className="fi" value={noKk} onChange={e=>setNoKk(e.target.value.replace(/\D/g,"").slice(0,16))} placeholder="3674..." style={{fontFamily:"var(--f-mono)"}}/>{kkProv&&<div style={{fontSize:9,color:"var(--pri)",marginTop:2}}>Provinsi: {kkProv.n}</div>}</div>
        <div className="fg"><label className="fl">Alamat KK</label><div style={{display:"flex",gap:4}}><input className="fi" value={alamat} onChange={e=>setAlamat(e.target.value)} placeholder="Jl. ... RT/RW ..." style={{flex:1}}/><button className="btn btn-sm" onClick={geocodeAlamat} style={{whiteSpace:"nowrap"}}>📍</button></div>{geo&&<div style={{fontSize:9,color:"var(--pri)",marginTop:2}}>Lat: {geo.lat.toFixed(4)}, Lng: {geo.lng.toFixed(4)}</div>}</div>
      </div>
      <div style={{fontSize:10,fontWeight:600,color:"var(--t2)",marginBottom:6}}>Anggota Keluarga</div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:10,minWidth:680}}>
          <thead><tr style={{background:"var(--bg3)"}}><th style={{padding:"6px 4px",textAlign:"left",fontSize:9,color:"var(--t3)"}}>Nama</th><th style={{padding:"6px 4px"}}>NIK</th><th style={{padding:"6px 4px"}}>Hubungan</th><th style={{padding:"6px 4px"}}>JK</th><th style={{padding:"6px 4px"}}>Tgl Lahir</th><th style={{padding:"6px 4px"}}>Agama</th><th style={{padding:"6px 4px",width:30}}></th></tr></thead>
          <tbody>{rows.map((r,i)=><tr key={i} style={{borderBottom:"1px solid var(--bdr)"}}>
            <td style={{padding:"4px 3px"}}><input className="fi" value={r.nama} onChange={e=>setR(i,"nama",e.target.value)} style={{padding:"4px 6px",fontSize:10}}/></td>
            <td style={{padding:"4px 3px"}}><div style={{display:"flex",gap:2}}><input className="fi" value={r.nik} onChange={e=>setR(i,"nik",e.target.value.replace(/\D/g,"").slice(0,16))} style={{padding:"4px 6px",fontSize:9,fontFamily:"var(--f-mono)",width:120}}/>{NIK.valid(r.nik)&&<button className="nik-fill" onClick={()=>nikFill(i)} style={{fontSize:7,padding:"2px 4px"}}>Fill</button>}</div></td>
            <td style={{padding:"4px 3px"}}><select className="fsel" value={r.hubungan} onChange={e=>setR(i,"hubungan",e.target.value)} style={{padding:"3px 4px",fontSize:9}}>{KK_HUBUNGAN.map(h=><option key={h} value={h}>{h}</option>)}</select></td>
            <td style={{padding:"4px 3px"}}><select className="fsel" value={r.jk} onChange={e=>setR(i,"jk",e.target.value)} style={{padding:"3px",fontSize:9,width:50}}><option value="male">L</option><option value="female">P</option></select></td>
            <td style={{padding:"4px 3px"}}><input className="fi" type="date" value={r.tglLahir} onChange={e=>setR(i,"tglLahir",e.target.value)} style={{padding:"3px 4px",fontSize:9}}/></td>
            <td style={{padding:"4px 3px"}}><select className="fsel" value={r.agama} onChange={e=>setR(i,"agama",e.target.value)} style={{padding:"3px",fontSize:9}}>{AGAMA_LIST.map(a=><option key={a} value={a}>{a.charAt(0).toUpperCase()+a.slice(1)}</option>)}</select></td>
            <td style={{padding:"4px 3px"}}>{rows.length>1&&<button className="btn btn-sm btn-d" onClick={()=>delRow(i)} style={{padding:"2px 5px",fontSize:8}}>x</button>}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <div style={{display:"flex",gap:6,marginTop:8}}>
        <button className="btn btn-sm" onClick={addRow}>+ Tambah Baris</button>
        <button className="btn btn-p btn-sm" onClick={generate} disabled={busy||!rows.some(r=>r.nama.trim())}>{busy?"Memproses...":"Generate Silsilah"}</button>
        <span style={{fontSize:9,color:"var(--t3)",alignSelf:"center"}}>{rows.length} anggota</span>
      </div>
    </div>}
  </div></div></div>}

// ─── MARRIAGE MODAL ──────────────────────────────────────────
function MarriageModal({pp,marriages,fam,onClose,onSave,flash}){
  const[hid,setHid]=useState("");const[wid,setWid]=useState("");const[ord,setOrd]=useState(1);const[mDate,setMDate]=useState("");const[busy,setBusy]=useState(false);
  const males=pp.filter(p=>p.gender==="male");const females=pp.filter(p=>p.gender==="female");
  const add=async()=>{if(!hid||!wid){flash("Pilih suami dan istri");return}setBusy(true);try{await API.addMarriage(fam.id,{husband_id:hid,wife_id:wid,marriage_order:ord,marriage_date:mDate});flash("Pernikahan ditambahkan");onSave();setHid("");setWid("");setOrd(1);setMDate("")}catch(e){flash(e.message)}setBusy(false)};
  const del=async(mid)=>{if(!confirm("Hapus pernikahan ini?"))return;try{await API.deleteMarriage(fam.id,mid);flash("Pernikahan dihapus");onSave()}catch(e){flash(e.message)}};
  return<div className="modal-ov" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:520}}><div className="m-hdr"><h2>💍 Kelola Pernikahan</h2><button className="btn btn-icon btn-ghost" onClick={onClose}><Ic.X/></button></div><div className="m-body">
    <div style={{fontSize:10,color:"var(--t3)",marginBottom:12,lineHeight:1.6}}>Dukung poligami — satu suami bisa memiliki beberapa istri. Setiap pernikahan ditampilkan sebagai konektor terpisah di canvas.</div>
    <div style={{fontSize:10,fontWeight:600,color:"var(--t2)",marginBottom:6}}>Tambah Pernikahan</div>
    <div className="fr" style={{marginBottom:8}}>
      <div className="fg"><label className="fl">Suami</label><select className="fsel" value={hid} onChange={e=>setHid(e.target.value)}><option value="">— Pilih —</option>{males.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
      <div className="fg"><label className="fl">Istri</label><select className="fsel" value={wid} onChange={e=>setWid(e.target.value)}><option value="">— Pilih —</option>{females.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
    </div>
    <div className="fr" style={{marginBottom:8}}>
      <div className="fg"><label className="fl">Pernikahan ke-</label><input className="fi" type="number" min={1} max={4} value={ord} onChange={e=>setOrd(parseInt(e.target.value)||1)}/></div>
      <div className="fg"><label className="fl">Tanggal Nikah</label><input className="fi" type="date" value={mDate} onChange={e=>setMDate(e.target.value)}/></div>
    </div>
    <button className="btn btn-p btn-sm" onClick={add} disabled={busy||!hid||!wid}>{busy?"Memproses...":"Tambah Pernikahan"}</button>
    {marriages.length>0&&<div style={{marginTop:16}}><div style={{fontSize:10,fontWeight:600,color:"var(--t2)",marginBottom:6}}>Daftar Pernikahan ({marriages.length})</div>
      {marriages.map(m=>{const h=pp.find(x=>x.id===m.husbandId);const w=pp.find(x=>x.id===m.wifeId);return<div key={m.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 9px",background:"var(--bg2)",borderRadius:"var(--rs)",marginBottom:4,fontSize:11}}>
        <span style={{color:"var(--male-t)"}}>♂ {h?.name||"?"}</span>
        <span style={{color:"var(--rose)",fontSize:9,fontWeight:700}}>∞ #{m.order}</span>
        <span style={{color:"var(--fem-t)"}}>♀ {w?.name||"?"}</span>
        {m.date&&<span style={{fontSize:8,color:"var(--t3)",fontFamily:"var(--f-mono)"}}>{m.date}</span>}
        <button className="btn btn-sm btn-d" onClick={()=>del(m.id)} style={{marginLeft:"auto",padding:"2px 6px",fontSize:9}}>Hapus</button>
      </div>})}
    </div>}
  </div></div></div>}

// ─── GEDCOM CONVERTER ────────────────────────────────────────
const GEDCOM={
  // Export members to GEDCOM 5.5.1
  toGedcom(pp){
    const lines=["0 HEAD","1 SOUR NASAB","2 VERS "+APP.version,"2 NAME NASAB - Jaga Nasabmu","1 GEDC","2 VERS 5.5.1","2 FORM LINEAGE-LINKED","1 CHAR UTF-8"];
    // Build family units: group by parent couples
    const fams=new Map();
    pp.forEach(p=>{
      if(!p.parentId)return;
      const pa=pp.find(x=>x.id===p.parentId);if(!pa)return;
      const sp=pa.spouseId?pp.find(x=>x.id===pa.spouseId):null;
      const fk=pa.id<(sp?.id||"")? `${pa.id}_${sp?.id||""}` : `${sp?.id||""}_${pa.id}`;
      if(!fams.has(fk))fams.set(fk,{husb:pa.gender==="male"?pa:sp,wife:pa.gender==="female"?pa:sp,children:[]});
      fams.get(fk).children.push(p);
    });
    // Also create FAM for couples without children
    pp.forEach(p=>{
      if(!p.spouseId)return;
      const sp=pp.find(x=>x.id===p.spouseId);if(!sp||p.id>sp.id)return;
      const fk=p.id<sp.id?`${p.id}_${sp.id}`:`${sp.id}_${p.id}`;
      if(!fams.has(fk))fams.set(fk,{husb:p.gender==="male"?p:sp,wife:p.gender==="female"?p:sp,children:[]});
    });
    // INDI records
    pp.forEach(p=>{
      lines.push(`0 @I${p.id}@ INDI`);
      const names=p.name.split(" ");const gn=names[0];const sn=names.slice(1).join(" ");
      lines.push(`1 NAME ${gn} /${sn}/`);
      lines.push(`2 GIVN ${gn}`);if(sn)lines.push(`2 SURN ${sn}`);
      lines.push(`1 SEX ${p.gender==="male"?"M":"F"}`);
      if(p.birthDate||p.birthPlace){lines.push("1 BIRT");if(p.birthDate)lines.push(`2 DATE ${GEDCOM._fmtDate(p.birthDate)}`);if(p.birthPlace)lines.push(`2 PLAC ${p.birthPlace}`)}
      if(p.deathDate){lines.push("1 DEAT");lines.push(`2 DATE ${GEDCOM._fmtDate(p.deathDate)}`)}
      if(p.notes)lines.push(`1 NOTE ${p.notes}`);
      if(p.nik)lines.push(`1 REFN ${p.nik}`);
      if(p.agama&&p.agama!=="islam")lines.push(`1 RELI ${p.agama}`);
      if(p.location?.lat)lines.push(`1 _LATI ${p.location.lat}`,`1 _LONG ${p.location.lng}`);
      // Link to FAM as spouse
      fams.forEach((f,fk)=>{if(f.husb?.id===p.id||f.wife?.id===p.id)lines.push(`1 FAMS @F${fk}@`)});
      // Link to FAM as child
      fams.forEach((f,fk)=>{if(f.children.some(c=>c.id===p.id))lines.push(`1 FAMC @F${fk}@`)});
    });
    // FAM records
    fams.forEach((f,fk)=>{
      lines.push(`0 @F${fk}@ FAM`);
      if(f.husb)lines.push(`1 HUSB @I${f.husb.id}@`);
      if(f.wife)lines.push(`1 WIFE @I${f.wife.id}@`);
      f.children.forEach(c=>lines.push(`1 CHIL @I${c.id}@`));
    });
    lines.push("0 TRLR");
    return lines.join("\n");
  },
  _fmtDate(d){if(!d)return"";const p=d.split("-");if(p.length!==3)return d;const mo=["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];return`${parseInt(p[2])} ${mo[parseInt(p[1])-1]||"JAN"} ${p[0]}`},
  _parseDate(d){if(!d)return"";const m=d.match(/(\d{1,2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+(\d{4})/i);if(!m)return"";const mo={JAN:"01",FEB:"02",MAR:"03",APR:"04",MAY:"05",JUN:"06",JUL:"07",AUG:"08",SEP:"09",OCT:"10",NOV:"11",DEC:"12"};return`${m[3]}-${mo[m[2].toUpperCase()]||"01"}-${m[1].padStart(2,"0")}`},
  // Parse GEDCOM text → {individuals, families} with GEDCOM IDs preserved
  fromGedcom(text){
    const lines=text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
    const indis={},famr={};let cur=null,ctx=null,sub=null;
    lines.forEach(l=>{
      const lm=l.match(/^(\d+)\s+(.+)/);if(!lm)return;
      const lv=parseInt(lm[1]),rest=lm[2];
      if(lv===0){
        const im=rest.match(/@([^@]+)@\s+INDI/);if(im){cur={_gid:im[1],name:"",gender:"male",birthDate:"",deathDate:"",birthPlace:"",notes:"",nik:"",agama:"islam",_lat:null,_lng:null};indis[im[1]]=cur;ctx="INDI";sub=null;return}
        const fm=rest.match(/@([^@]+)@\s+FAM/);if(fm){cur={_gid:fm[1],husb:null,wife:null,children:[]};famr[fm[1]]=cur;ctx="FAM";sub=null;return}
        ctx=null;return;
      }
      if(ctx==="INDI"&&cur){
        if(lv===1){sub=null;const tm=rest.match(/^(\S+)\s*(.*)/);if(!tm)return;const[,tag,val]=tm;
          if(tag==="NAME"){const nm=val.replace(/\//g,"").replace(/\s+/g," ").trim();cur.name=nm}
          if(tag==="SEX")cur.gender=val.trim()==="F"?"female":"male";
          if(tag==="BIRT")sub="BIRT";if(tag==="DEAT")sub="DEAT";
          if(tag==="NOTE")cur.notes=(cur.notes?cur.notes+" ":"")+val;
          if(tag==="REFN")cur.nik=val.trim();
          if(tag==="RELI")cur.agama=val.trim().toLowerCase();
          if(tag==="_LATI")cur._lat=parseFloat(val);if(tag==="_LONG")cur._lng=parseFloat(val);
        }
        if(lv===2){const tm=rest.match(/^(\S+)\s*(.*)/);if(!tm)return;const[,tag,val]=tm;
          if(sub==="BIRT"&&tag==="DATE")cur.birthDate=GEDCOM._parseDate(val);
          if(sub==="BIRT"&&tag==="PLAC")cur.birthPlace=val;
          if(sub==="DEAT"&&tag==="DATE")cur.deathDate=GEDCOM._parseDate(val);
        }
      }
      if(ctx==="FAM"&&cur){
        if(lv===1){const tm=rest.match(/^(\S+)\s*(.*)/);if(!tm)return;const[,tag,val]=tm;const id=val.replace(/@/g,"").trim();
          if(tag==="HUSB")cur.husb=id;if(tag==="WIFE")cur.wife=id;if(tag==="CHIL")cur.children.push(id);
        }
      }
    });
    return{indis:Object.values(indis),families:Object.values(famr),stats:{indiCount:Object.keys(indis).length,famCount:Object.keys(famr).length}};
  },
  // Import parsed GEDCOM to API sequentially with progress callback
  async importToAPI(parsed,famId,existingPP=[],onProgress){
    const{indis,families}=parsed;
    const gidToServerId={};// GEDCOM _gid → server-assigned ID
    let done=0,failed=0,skipped=0;const total=indis.length;
    const dupSet=new Set(existingPP.map(p=>(p.name||"").toLowerCase().trim()+"_"+(p.birthDate||"")));
    // Phase 1: Create all individuals (no relationships yet)
    for(const p of indis){
      const dupKey=(p.name||"").toLowerCase().trim()+"_"+(p.birthDate||"");
      if(dupSet.has(dupKey)){skipped++;gidToServerId[p._gid]=null;done++;if(onProgress)onProgress({done,total,phase:"Menyimpan anggota",detail:`Skip duplikat: ${p.name}`});continue}
      try{
        const res=await API.addMember(famId,{name:p.name,gender:p.gender,birthDate:p.birthDate||"",deathDate:p.deathDate||"",birthPlace:p.birthPlace||"",notes:p.notes||"",parentId:null,spouseId:null,location:p._lat?{lat:p._lat,lng:p._lng,address:p.birthPlace||""}:null,nik:p.nik||"",agama:p.agama||"islam",noKk:""});
        gidToServerId[p._gid]=res.id;done++;
        if(onProgress)onProgress({done,total,phase:"Menyimpan anggota",detail:p.name});
      }catch(e){failed++;done++;gidToServerId[p._gid]=null;if(onProgress)onProgress({done,total,phase:"Menyimpan anggota",detail:`Gagal: ${p.name}`})}
      await new Promise(r=>setTimeout(r,50));// throttle
    }
    // Phase 2: Apply relationships from FAM records
    let relDone=0;const relTotal=families.length;
    for(const f of families){
      const hid=gidToServerId[f.husb],wid=gidToServerId[f.wife];
      // Spouse link
      if(hid&&wid){
        try{await API.addMarriage(famId,{husband_id:hid,wife_id:wid,marriage_order:1})}catch{}
      }
      // Children → parentId = husb (or wife if no husb)
      const pid=hid||wid;
      if(pid){for(const cgid of f.children){const cid=gidToServerId[cgid];if(!cid)continue;
        // Fetch current member data to update parentId
        try{const fam=await API.getFamily(famId);const child=fam.members.find(m=>m.id===cid);
          if(child)await API.updateMember(famId,cid,{...child,parentId:pid})}catch{}}}
      relDone++;if(onProgress)onProgress({done:total,total,phase:"Menghubungkan keluarga",detail:`FAM ${relDone}/${relTotal}`});
      await new Promise(r=>setTimeout(r,50));
    }
    return{imported:done-failed-skipped,failed,skipped,families:families.length};
  }
};

function IEModal({pp,fam,onDone,onClose,flash}){const[j,setJ]=useState("");const[t,setT]=useState("ej");const[gedIn,setGedIn]=useState("");
  const[gedParsed,setGedParsed]=useState(null);const[importing,setImporting]=useState(false);const[progress,setProgress]=useState(null);const[result,setResult]=useState(null);
  const dlFile=(content,name,type)=>{const b=new Blob([content],{type});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=name;a.click();URL.revokeObjectURL(u)};
  const parseGed=()=>{try{const p=GEDCOM.fromGedcom(gedIn);setGedParsed(p);setResult(null)}catch(e){flash("Error parsing: "+e.message)}};
  const doGedImport=async()=>{if(!gedParsed||importing)return;setImporting(true);setResult(null);
    try{const r=await GEDCOM.importToAPI(gedParsed,fam.id,pp,p=>setProgress(p));setResult(r);onDone();flash(`${r.imported} anggota + ${r.families} keluarga diimport`)}catch(e){flash("Import gagal: "+e.message)}setImporting(false)};
  const doJsonImport=async()=>{try{const d=JSON.parse(j);if(!Array.isArray(d))return;setImporting(true);let ok=0,fail=0;
    for(let i=0;i<d.length;i++){try{await API.addMember(fam.id,d[i]);ok++}catch{fail++}setProgress({done:i+1,total:d.length,phase:"Import JSON",detail:`${ok} ok, ${fail} gagal`})}
    setImporting(false);onDone();flash(`${ok} diimport, ${fail} gagal`);onClose()}catch{flash("Invalid JSON")}};
  return<div className="modal-ov" onClick={importing?undefined:onClose}><div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:600}}><div className="m-hdr"><h2>Import / Export</h2>{!importing&&<button className="btn btn-icon btn-ghost" onClick={onClose}><Ic.X/></button>}</div><div className="m-body">
    {importing?<div style={{textAlign:"center",padding:20}}>
      <div style={{fontSize:14,fontWeight:600,color:"var(--pri)",marginBottom:10}}>{progress?.phase||"Memproses..."}</div>
      <div style={{background:"var(--bg3)",borderRadius:8,height:8,marginBottom:8,overflow:"hidden"}}><div style={{height:"100%",background:"var(--pri)",borderRadius:8,transition:"width .2s",width:`${progress?(progress.done/progress.total*100):0}%`}}/></div>
      <div style={{fontSize:11,color:"var(--t2)",fontFamily:"var(--f-mono)"}}>{progress?`${progress.done} / ${progress.total}`:""}</div>
      <div style={{fontSize:10,color:"var(--t3)",marginTop:4}}>{progress?.detail||""}</div>
    </div>:<>
    <div style={{display:"flex",gap:4,marginBottom:12,flexWrap:"wrap"}}>
      {[{id:"ej",l:"Export JSON"},{id:"eg",l:"Export GEDCOM"},{id:"ij",l:"Import JSON"},{id:"ig",l:"Import GEDCOM"}].map(x=>
        <button key={x.id} className={`btn btn-sm ${t===x.id?"btn-p":""}`} onClick={()=>{setT(x.id);setGedParsed(null);setResult(null)}}>{x.l}</button>)}
    </div>
    {t==="ej"&&<div>
      <textarea className="fta" style={{minHeight:140,fontFamily:"var(--f-mono)",fontSize:9}} readOnly value={JSON.stringify(pp,null,2)}/>
      <button className="btn btn-p btn-sm" style={{marginTop:6}} onClick={()=>dlFile(JSON.stringify(pp,null,2),`nasab-export-${Date.now()}.json`,"application/json")}>Download JSON</button>
    </div>}
    {t==="eg"&&<div>
      <textarea className="fta" style={{minHeight:140,fontFamily:"var(--f-mono)",fontSize:9}} readOnly value={GEDCOM.toGedcom(pp)}/>
      <div style={{display:"flex",gap:6,marginTop:6}}>
        <button className="btn btn-p btn-sm" onClick={()=>dlFile(GEDCOM.toGedcom(pp),`nasab-export-${Date.now()}.ged`,"text/plain")}>Download .ged</button>
        <span style={{fontSize:9,color:"var(--t3)",alignSelf:"center"}}>GEDCOM 5.5.1</span>
      </div>
    </div>}
    {t==="ij"&&<div>
      <textarea className="fta" style={{minHeight:140,fontFamily:"var(--f-mono)",fontSize:9}} value={j} onChange={e=>setJ(e.target.value)} placeholder="Paste JSON array..."/>
      <div style={{display:"flex",gap:6,marginTop:6,alignItems:"center"}}>
        <label className="btn btn-sm" style={{cursor:"pointer"}}><input type="file" accept=".json" hidden onChange={e=>{const f=e.target.files[0];if(f)f.text().then(t=>setJ(t))}}/> Pilih File</label>
        <button className="btn btn-p btn-sm" onClick={doJsonImport} disabled={!j.trim()}>Import</button>
      </div>
    </div>}
    {t==="ig"&&<div>
      <textarea className="fta" style={{minHeight:140,fontFamily:"var(--f-mono)",fontSize:9}} value={gedIn} onChange={e=>{setGedIn(e.target.value);setGedParsed(null)}} placeholder="Paste GEDCOM atau pilih file .ged ..."/>
      <div style={{display:"flex",gap:6,marginTop:6,alignItems:"center",flexWrap:"wrap"}}>
        <label className="btn btn-sm" style={{cursor:"pointer"}}><input type="file" accept=".ged,.gedcom" hidden onChange={e=>{const f=e.target.files[0];if(f)f.text().then(t=>{setGedIn(t);setGedParsed(null)})}}/> Pilih File .ged</label>
        <button className="btn btn-sm" onClick={parseGed} disabled={!gedIn.trim()}>Preview</button>
        {gedParsed&&<button className="btn btn-p btn-sm" onClick={doGedImport}>Import {gedParsed.stats.indiCount} anggota</button>}
      </div>
      {gedParsed&&<div style={{marginTop:8,padding:"8px 10px",background:"var(--bg2)",borderRadius:6,fontSize:10}}>
        <div style={{fontWeight:600,color:"var(--pri)",marginBottom:4}}>{gedParsed.stats.indiCount} individu · {gedParsed.stats.famCount} keluarga</div>
        <div style={{maxHeight:100,overflow:"auto"}}>{gedParsed.indis.map((m,i)=><div key={i} style={{color:"var(--t2)",lineHeight:1.6}}>{m.gender==="male"?"♂":"♀"} {m.name}{m.birthDate?` · ${m.birthDate}`:""}</div>)}</div>
      </div>}
      {result&&<div style={{marginTop:8,padding:"8px 10px",background:"var(--bg2)",borderRadius:6,fontSize:10,color:"var(--pri)"}}>Berhasil: {result.imported} · Keluarga: {result.families}{result.skipped>0?` · Skip duplikat: ${result.skipped}`:""}{result.failed>0?<span style={{color:"var(--rose)"}}> · Gagal: {result.failed}</span>:""}</div>}
      <div style={{marginTop:6,fontSize:9,color:"var(--t3)"}}>GEDCOM 5.5.1 — duplikat otomatis dideteksi (nama+tanggal lahir).</div>
    </div>}
    </>}
  </div></div></div>}

// ═══════════════════════════════════════════════════════════════
// KELUARGA VIEW (Events + Feed + AI)
// ═══════════════════════════════════════════════════════════════
function KeluargaView({pp,fam,user,canEdit,flash,marriages}){
  const[events,setEvents]=useState([]);const[posts,setPosts]=useState([]);
  const[showEvtForm,setShowEvtForm]=useState(false);const[editEvt,setEditEvt]=useState(null);
  const[postText,setPostText]=useState("");const[postType,setPostType]=useState("text");
  const[aiSugBusy,setAiSugBusy]=useState(false);
  // AI settings — key value never stored client-side after PUT to server.
  // `serverKeys` tracks which providers user has set on the server (names
  // only, no values). Toggle defaults open if user has no keys at all.
  const[showAiSettings,setShowAiSettings]=useState(false);
  const[aiProv,setAiProv]=useState(()=>localStorage.getItem('nasab-ai-provider')||'groq');
  const[aiKey,setAiKey]=useState('');
  const[serverKeys,setServerKeys]=useState([]);
  const[aiSaveBusy,setAiSaveBusy]=useState(false);
  useEffect(()=>{(async()=>{try{const d=await API._f('/api/user/secrets');const names=(d.secrets||[]).map(s=>s.key_name.replace('_api_key',''));setServerKeys(names);if(!names.length)setShowAiSettings(true)}catch{}})()},[]);

  const loadData=async()=>{
    try{const[e,f]=await Promise.all([API.getEvents(fam.id),API.getFeed(fam.id)]);setEvents(e||[]);setPosts(f||[])}catch{}};
  useEffect(()=>{loadData()},[fam.id]);

  // Auto feed items
  const autoFeed=useMemo(()=>{
    const auto=[];
    pp.filter(m=>m.birthDate&&!m.deathDate).forEach(m=>{
      const bd=new Date(m.birthDate),now=new Date(),nx=new Date(now.getFullYear(),bd.getMonth(),bd.getDate());
      if(nx<now)nx.setFullYear(nx.getFullYear()+1);const days=Math.floor((nx-now)/864e5);
      if(days>=0&&days<=7)auto.push({id:`auto_bd_${m.id}`,post_type:'auto_birthday',content:days===0?`🎂 Hari ini ulang tahun ${m.name}!`:`🎂 ${days} hari lagi ulang tahun ${m.name}`,created_at:new Date().toISOString(),author_name:'NASAB',isAuto:true})});
    events.filter(e=>{const d=Math.floor((new Date(e.event_date)-new Date())/864e5);return d>=0&&d<=14}).forEach(e=>{
      const d=Math.floor((new Date(e.event_date)-new Date())/864e5);const et=EVT.find(t=>t.id===e.type);
      auto.push({id:`auto_evt_${e.id}`,post_type:'auto_event',content:d===0?`${et?.i||'📅'} Hari ini: ${e.title}!`:`${et?.i||'📅'} ${d} hari lagi: ${e.title}`,created_at:new Date().toISOString(),author_name:'NASAB',isAuto:true})});
    return auto},[pp,events]);

  const allPosts=[...autoFeed,...posts].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));

  // Events
  const saveEvt=async(evt)=>{try{if(editEvt)await API.updateEvent(fam.id,editEvt.id,evt);else await API.createEvent(fam.id,evt);flash(editEvt?"Acara diperbarui":"Acara dibuat");setShowEvtForm(false);setEditEvt(null);loadData()}catch(e){flash(e.message)}};
  const delEvt=async(eid)=>{if(!confirm("Hapus acara?"))return;try{await API.deleteEvent(fam.id,eid);flash("Acara dihapus");loadData()}catch(e){flash(e.message)}};

  // Posts
  const submitPost=async()=>{if(!postText.trim())return;try{await API.createPost(fam.id,{content:postText,post_type:postType});setPostText("");flash("Diposting!");loadData()}catch(e){flash(e.message)}};
  const toggleLike=async(pid)=>{try{await API.toggleLike(pid);loadData()}catch{}};
  const delPost=async(pid)=>{try{await API.deletePost(fam.id,pid);loadData()}catch(e){flash(e.message)}};
  const addComment=async(pid,text)=>{if(!text.trim())return;try{await API.addComment(pid,text);loadData()}catch(e){flash(e.message)}};

  // AI
  const aiSuggest=async()=>{setAiSugBusy(true);try{
    const bds=FE.bdays(pp,7);const evts=events.filter(e=>Math.floor((new Date(e.event_date)-new Date())/864e5)<=14&&Math.floor((new Date(e.event_date)-new Date())/864e5)>=0);
    const prompt=`Berdasarkan data keluarga "${fam.name}": ${bds.length?`ulang tahun terdekat: ${bds.map(b=>`${b.person.name} (${b.days} hari)`).join(', ')}.`:'tidak ada ulang tahun dekat.'} ${evts.length?`acara: ${evts.map(e=>e.title).join(', ')}.`:'tidak ada acara.'} Buat posting singkat 1-2 kalimat yang hangat untuk keluarga dalam Bahasa Indonesia.`;
    const text=await callAI(prompt);setPostText(text)}catch(e){flash("AI: "+e.message)}setAiSugBusy(false)};

  const saveAiSettings=async()=>{
    localStorage.setItem('nasab-ai-provider',aiProv);
    if(aiKey.trim()){
      setAiSaveBusy(true);
      try{
        await API._f('/api/user/secrets',{method:'PUT',body:JSON.stringify({key_name:`${aiProv}_api_key`,value:aiKey.trim()})});
        // Cleanup legacy localStorage values (one-time migration)
        ['nasab-claude-key','nasab-groq-key','nasab-gemini-key'].forEach(k=>localStorage.removeItem(k));
        setServerKeys(prev=>prev.includes(aiProv)?prev:[...prev,aiProv]);
        setAiKey('');
        flash("AI key disimpan terenkripsi di server ✓");
        setShowAiSettings(false);
      }catch(e){flash("Gagal simpan key: "+e.message)}
      setAiSaveBusy(false);
    }else{
      flash("Provider dipilih: "+AI_PROVIDERS[aiProv].l);
      setShowAiSettings(false);
    }
  };

  const upcomingEvts=events.filter(e=>new Date(e.event_date)>=new Date(new Date().toDateString())).sort((a,b)=>a.event_date.localeCompare(b.event_date));

  return(<div className="kel-view" style={{height:"100%",overflow:"auto"}}>
    <div style={{maxWidth:700,margin:"0 auto",padding:16}}>
    {/* AI Settings toggle */}
    <div style={{display:"flex",justifyContent:"flex-end",marginBottom:8}}>
      <button className="btn btn-sm" onClick={()=>setShowAiSettings(!showAiSettings)} style={{fontSize:10,background:showAiSettings?"var(--pri)":"var(--bg3)",color:showAiSettings?"#000":"var(--t2)"}}>⚙️ AI Settings</button>
    </div>
    {showAiSettings&&<div style={{background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:8,padding:12,marginBottom:14,fontSize:11}}>
      <div style={{fontWeight:600,marginBottom:8}}>AI Settings <span style={{fontSize:9,color:"var(--pri)",marginLeft:6}}>🔒 Key terenkripsi di server</span></div>
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
        {Object.entries(AI_PROVIDERS).map(([id,p])=>{const has=serverKeys.includes(id);return<label key={id} style={{display:"flex",alignItems:"center",gap:3}}><input type="radio" name="aiprov" checked={aiProv===id} onChange={()=>{setAiProv(id);setAiKey('')}}/> {p.l} {has&&<span style={{fontSize:9,color:"var(--pri)"}} title="Key sudah diset di server">✓</span>} <span style={{color:"var(--t3)",fontSize:9}}>({p.d})</span></label>})}
      </div>
      <div style={{display:"flex",gap:6}}>
        <input className="fi" value={aiKey} onChange={e=>setAiKey(e.target.value)} placeholder={serverKeys.includes(aiProv)?`(sudah diset — kosongkan untuk pakai key existing)`:`Paste ${AI_PROVIDERS[aiProv]?.l||'API'} Key...`} type="password" style={{flex:1,fontSize:10}} autoComplete="off"/>
        <button className="btn btn-p btn-sm" onClick={saveAiSettings} disabled={aiSaveBusy}>{aiSaveBusy?"...":"Simpan"}</button>
      </div>
      <div style={{fontSize:9,color:"var(--t3)",marginTop:4,lineHeight:1.5}}>Key di-encrypt server-side (AES-GCM), tidak lagi di browser localStorage. OCR KK juga pakai key Claude ini. Groq: gratis (Llama 3). Gemini: gratis (Google). Claude: detail + vision.</div>
    </div>}

    {/* Events section */}
    <div style={{marginBottom:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <h3 style={{fontFamily:"var(--f-display)",fontSize:18}}>📅 Acara</h3>
        <button className="btn btn-p btn-sm" onClick={()=>{setEditEvt(null);setShowEvtForm(true)}}>+ Acara</button>
      </div>
      {!upcomingEvts.length?<div style={{fontSize:11,color:"var(--t3)",textAlign:"center",padding:16,background:"var(--bg2)",borderRadius:8}}>Belum ada acara mendatang</div>:
      <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:8}}>
        {upcomingEvts.map(e=>{const et=EVT.find(t=>t.id===e.type)||EVT[EVT.length-1];const dt=new Date(e.event_date);const days=Math.floor((dt-new Date(new Date().toDateString()))/864e5);
          return<div key={e.id} className="evt-card" onClick={()=>{setEditEvt(e);setShowEvtForm(true)}}>
            <div style={{fontSize:24}}>{et.i}</div>
            <div style={{fontWeight:600,fontSize:11}}>{e.title}</div>
            <div style={{fontSize:9,color:"var(--t3)"}}>{dt.toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"})}{e.event_time?` · ${e.event_time}`:""}</div>
            <div style={{fontSize:9,color:days===0?"var(--pri)":days<=7?"var(--rose)":"var(--t3)",fontWeight:600,marginTop:4}}>{days===0?"Hari ini!":days===1?"Besok":`${days} hari lagi`}</div>
            {e.is_public?<div style={{fontSize:8,color:"var(--pri)",marginTop:2}}>🌐 Publik</div>:null}
          </div>})}
      </div>}
    </div>

    {/* Feed section */}
    <div>
      <h3 style={{fontFamily:"var(--f-display)",fontSize:18,marginBottom:10}}>📢 Feed Keluarga</h3>
      {/* Compose box */}
      <div style={{background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:10,padding:12,marginBottom:14}}>
        <textarea className="fta" value={postText} onChange={e=>setPostText(e.target.value)} placeholder="Tulis untuk keluarga..." style={{minHeight:50,marginBottom:8}}/>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <select className="fsel" value={postType} onChange={e=>setPostType(e.target.value)} style={{width:110,fontSize:10}}>
            <option value="text">💬 Teks</option><option value="announcement">📢 Pengumuman</option><option value="milestone">🏆 Milestone</option><option value="memory">📸 Kenangan</option>
          </select>
          <button className="btn btn-sm" onClick={aiSuggest} disabled={aiSugBusy} style={{fontSize:10}}>{aiSugBusy?"...":"✨ AI"}</button>
          <div style={{flex:1}}/>
          <button className="btn btn-p btn-sm" onClick={submitPost} disabled={!postText.trim()}>Kirim</button>
        </div>
      </div>

      {/* Posts */}
      {!allPosts.length?<div style={{fontSize:11,color:"var(--t3)",textAlign:"center",padding:20}}>Belum ada posting</div>:
      allPosts.map(p=><PostCard key={p.id} post={p} user={user} onLike={toggleLike} onDel={delPost} onComment={addComment} flash={flash}/>)}
    </div>

    {/* Event form modal */}
    {showEvtForm&&<EventFormModal evt={editEvt} pp={pp} onSave={saveEvt} onDel={editEvt?()=>delEvt(editEvt.id):null} onClose={()=>{setShowEvtForm(false);setEditEvt(null)}} fam={fam}/>}
  </div></div>);
}

// Post card sub-component
function PostCard({post:p,user,onLike,onDel,onComment,flash}){
  const[showCmt,setShowCmt]=useState(false);const[cmtText,setCmtText]=useState("");
  const isAuto=p.isAuto;const isOwner=user&&p.author_id===user.id;
  const ago=(d)=>{const s=Math.floor((Date.now()-new Date(d))/1000);if(s<60)return"baru saja";if(s<3600)return`${Math.floor(s/60)}m`;if(s<86400)return`${Math.floor(s/3600)}j`;return`${Math.floor(s/86400)}h`};
  const typeIcons={text:'💬',announcement:'📢',milestone:'🏆',memory:'📸',auto_birthday:'🎂',auto_event:'📅'};
  return(<div className={`feed-post ${isAuto?"auto":""}`}>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
      <div className={`li-av ${isAuto?"":"male"}`} style={{width:28,height:28,fontSize:10,flexShrink:0}}>{isAuto?"🤖":ini(p.author_name||"?")}</div>
      <div style={{flex:1,minWidth:0}}>
        <span style={{fontWeight:600,fontSize:11}}>{p.author_name||"Anon"}</span>
        <span style={{color:"var(--t3)",fontSize:9,marginLeft:6}}>{ago(p.created_at)}</span>
      </div>
      <span style={{fontSize:12}}>{typeIcons[p.post_type]||'💬'}</span>
      {isOwner&&!isAuto&&<button className="btn btn-icon btn-ghost" onClick={()=>onDel(p.id)} style={{fontSize:10,padding:2}} title="Hapus">✕</button>}
    </div>
    <div style={{fontSize:12,lineHeight:1.6,color:"var(--t1)",whiteSpace:"pre-wrap"}}>{p.content}</div>
    {!isAuto&&<div style={{display:"flex",gap:12,marginTop:8,fontSize:10,color:"var(--t3)"}}>
      <button className="btn-ghost" style={{fontSize:10,color:p.liked_by_me?"var(--rose)":"var(--t3)",cursor:"pointer",background:"none",border:"none"}} onClick={()=>onLike(p.id)}>❤️ {p.like_count||0}</button>
      <button className="btn-ghost" style={{fontSize:10,color:"var(--t3)",cursor:"pointer",background:"none",border:"none"}} onClick={()=>setShowCmt(!showCmt)}>💬 {p.comments?.length||0}</button>
    </div>}
    {showCmt&&!isAuto&&<div style={{marginTop:8,paddingLeft:12,borderLeft:"2px solid var(--bdr)"}}>
      {(p.comments||[]).map(c=><div key={c.id} style={{fontSize:10,marginBottom:4}}><b>{c.author_name}</b> <span style={{color:"var(--t3)"}}>{ago(c.created_at)}</span><div style={{color:"var(--t2)"}}>{c.content}</div></div>)}
      <div style={{display:"flex",gap:4,marginTop:4}}><input className="fi" value={cmtText} onChange={e=>setCmtText(e.target.value)} placeholder="Komentar..." style={{flex:1,fontSize:10,padding:"4px 8px"}} onKeyDown={e=>{if(e.key==="Enter"){onComment(p.id,cmtText);setCmtText("")}}}/><button className="btn btn-p btn-sm" style={{fontSize:9}} onClick={()=>{onComment(p.id,cmtText);setCmtText("")}} disabled={!cmtText.trim()}>↵</button></div>
    </div>}
  </div>);
}

// Event form modal
function EventFormModal({evt,pp,onSave,onDel,onClose,fam}){
  const[t,setT]=useState(evt?.title||"");const[tp,setTp]=useState(evt?.type||"lainnya");
  const[dt,setDt]=useState(evt?.event_date||"");const[tm,setTm]=useState(evt?.event_time||"");
  const[desc,setDesc]=useState(evt?.description||"");const[loc,setLoc]=useState(evt?.location_name||"");
  const[addr,setAddr]=useState(evt?.location_address||"");const[pub,setPub]=useState(evt?.is_public||false);
  const[tmpl,setTmpl]=useState(evt?.cover_template||"classic");const[relM,setRelM]=useState(evt?.related_member_id||"");
  const save=()=>{if(!t.trim()||!dt)return;onSave({title:t,type:tp,description:desc,event_date:dt,event_time:tm,location_name:loc,location_address:addr,is_public:pub?1:0,cover_template:tmpl,related_member_id:relM||null})};
  return(<div className="modal-ov" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:480}}>
    <div className="m-hdr"><h2>{evt?"Edit Acara":"Acara Baru"}</h2><button className="btn btn-icon btn-ghost" onClick={onClose}><Ic.X/></button></div>
    <div className="m-body">
      <div className="fg"><label className="fl">Judul *</label><input className="fi" value={t} onChange={e=>setT(e.target.value)} placeholder="Pernikahan Ahmad & Fatimah"/></div>
      <div style={{display:"flex",gap:8}}>
        <div className="fg" style={{flex:1}}><label className="fl">Tipe</label><select className="fsel" value={tp} onChange={e=>setTp(e.target.value)} style={{width:"100%"}}>{EVT.map(t=><option key={t.id} value={t.id}>{t.i} {t.l}</option>)}</select></div>
        <div className="fg" style={{flex:1}}><label className="fl">Template</label><select className="fsel" value={tmpl} onChange={e=>setTmpl(e.target.value)} style={{width:"100%"}}><option value="classic">Classic</option><option value="islamic">Islamic</option><option value="modern">Modern</option><option value="festive">Festive</option></select></div>
      </div>
      <div style={{display:"flex",gap:8}}>
        <div className="fg" style={{flex:1}}><label className="fl">Tanggal *</label><input className="fi" type="date" value={dt} onChange={e=>setDt(e.target.value)}/></div>
        <div className="fg" style={{flex:1}}><label className="fl">Waktu</label><input className="fi" type="time" value={tm} onChange={e=>setTm(e.target.value)}/></div>
      </div>
      <div className="fg"><label className="fl">Lokasi</label><input className="fi" value={loc} onChange={e=>setLoc(e.target.value)} placeholder="Gedung Serbaguna"/></div>
      <div className="fg"><label className="fl">Alamat</label><input className="fi" value={addr} onChange={e=>setAddr(e.target.value)} placeholder="Jl. Raya No. 1"/></div>
      <div className="fg"><label className="fl">Deskripsi</label><textarea className="fta" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Detail acara..." style={{minHeight:40}}/></div>
      <div className="fg"><label className="fl">Terkait Anggota</label><select className="fsel" value={relM} onChange={e=>setRelM(e.target.value)} style={{width:"100%"}}><option value="">— Tidak ada —</option>{pp.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
      <label style={{display:"flex",alignItems:"center",gap:6,fontSize:11,cursor:"pointer"}}><input type="checkbox" checked={pub} onChange={e=>setPub(e.target.checked)} style={{accentColor:"var(--pri)"}}/> Publik (bisa diakses tanpa login untuk undangan)</label>
    </div>
    <div className="m-ftr">
      {onDel&&<button className="btn btn-d btn-sm" onClick={()=>{onDel();onClose()}}>Hapus</button>}
      <div style={{flex:1}}/>
      <button className="btn" onClick={onClose}>Batal</button>
      <button className="btn btn-p" onClick={save} disabled={!t.trim()||!dt}>Simpan</button>
    </div>
  </div></div>);
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC INVITATION PAGE
// ═══════════════════════════════════════════════════════════════
function InvitationPage({slug}){
  const[evt,setEvt]=useState(null);const[loading,setLoading]=useState(true);const[err2,setErr2]=useState("");
  const[name,setName]=useState("");const[status,setStatus]=useState("hadir");const[msg,setMsg]=useState("");const[sent,setSent]=useState(false);
  useEffect(()=>{(async()=>{try{const d=await API.getPublicEvent(slug);setEvt(d.event||d)}catch(e){setErr2(e.message)}finally{setLoading(false)}})()},[slug]);
  const doRsvp=async()=>{if(!name.trim())return;try{await API.rsvp(evt.id,{guest_name:name,status,message:msg});setSent(true)}catch(e){setErr2(e.message)}};
  const et=evt?EVT.find(t=>t.id===evt.type)||EVT[EVT.length-1]:null;
  const tmpl=evt?.cover_template||'classic';
  const tmplStyles={classic:{bg:"linear-gradient(135deg,#1a1a2e,#16213e)",bdr:"#d4af37",accent:"#d4af37",font:"'Instrument Serif',serif"},islamic:{bg:"linear-gradient(135deg,#0a3d2a,#1a5c3a)",bdr:"#c5a55a",accent:"#c5a55a",font:"'Instrument Serif',serif"},modern:{bg:"linear-gradient(135deg,var(--bg0),var(--bg1))",bdr:"var(--pri)",accent:"var(--pri)",font:"'DM Sans',sans-serif"},festive:{bg:"linear-gradient(135deg,#4a0e4e,#2d1b69)",bdr:"#ff6b9d",accent:"#ff6b9d",font:"'DM Sans',sans-serif"}};
  const ts=tmplStyles[tmpl]||tmplStyles.classic;
  if(loading)return<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--bg0)",color:"var(--t1)",fontFamily:"var(--f-body)"}}>Memuat...</div>;
  if(err2||!evt)return<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--bg0)",color:"var(--t3)",fontFamily:"var(--f-body)"}}>{err2||"Undangan tidak ditemukan"}</div>;
  const shareUrl=window.location.href;
  return(<div style={{minHeight:"100vh",background:ts.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:ts.font}}>
    <div style={{maxWidth:420,width:"100%",border:`2px solid ${ts.bdr}`,borderRadius:16,padding:"40px 32px",textAlign:"center",color:"#fff",backdropFilter:"blur(10px)",background:"rgba(0,0,0,.2)"}}>
      {tmpl==='islamic'&&<div style={{fontSize:18,marginBottom:16,opacity:.7}}>بسم الله الرحمن الرحيم</div>}
      <div style={{fontSize:40,marginBottom:8}}>{et?.i}</div>
      <div style={{fontSize:12,letterSpacing:3,textTransform:"uppercase",color:ts.accent,marginBottom:8}}>{et?.l}</div>
      <h1 style={{fontSize:24,fontWeight:700,marginBottom:20}}>{evt.title}</h1>
      <div style={{fontSize:13,lineHeight:2,marginBottom:20,opacity:.9}}>
        <div>📅 {new Date(evt.event_date).toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
        {evt.event_time&&<div>🕐 {evt.event_time} WIB</div>}
        {(evt.location_name||evt.location_address)&&<div>📍 {evt.location_name}{evt.location_address?`, ${evt.location_address}`:""}</div>}
      </div>
      {evt.description&&<div style={{fontSize:12,color:"rgba(255,255,255,.7)",marginBottom:20,lineHeight:1.6}}>{evt.description}</div>}
      {!sent?<div style={{background:"rgba(255,255,255,.1)",borderRadius:12,padding:16,marginBottom:20}}>
        <div style={{fontSize:13,fontWeight:600,marginBottom:10}}>RSVP</div>
        <input style={{width:"100%",padding:"8px 12px",background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",borderRadius:6,color:"#fff",fontSize:12,marginBottom:8}} value={name} onChange={e=>setName(e.target.value)} placeholder="Nama Anda"/>
        <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:8}}>
          {[{v:"hadir",l:"✅ Hadir"},{v:"tidak",l:"❌ Tidak"},{v:"mungkin",l:"❓ Mungkin"}].map(o=>
            <button key={o.v} style={{padding:"6px 12px",borderRadius:6,border:`1px solid ${status===o.v?ts.accent:"rgba(255,255,255,.2)"}`,background:status===o.v?"rgba(255,255,255,.15)":"transparent",color:"#fff",cursor:"pointer",fontSize:11}} onClick={()=>setStatus(o.v)}>{o.l}</button>)}
        </div>
        <textarea style={{width:"100%",padding:"8px 12px",background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",borderRadius:6,color:"#fff",fontSize:11,minHeight:40,resize:"vertical",marginBottom:8}} value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Pesan (opsional)"/>
        <button style={{width:"100%",padding:"10px",background:ts.accent,color:"#000",border:"none",borderRadius:8,fontWeight:700,cursor:"pointer",fontSize:12}} onClick={doRsvp} disabled={!name.trim()}>Kirim RSVP</button>
      </div>:<div style={{background:"rgba(255,255,255,.1)",borderRadius:12,padding:16,marginBottom:20,fontSize:13}}>✅ Terima kasih, {name}! RSVP Anda telah tercatat.</div>}
      {/* Share buttons */}
      <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:16}}>
        <button style={{padding:"6px 12px",borderRadius:6,border:"1px solid rgba(255,255,255,.2)",background:"transparent",color:"#fff",cursor:"pointer",fontSize:10}} onClick={()=>{navigator.clipboard?.writeText(shareUrl);alert("Link disalin!")}}>📋 Salin Link</button>
        <a href={`https://wa.me/?text=${encodeURIComponent(evt.title+" "+shareUrl)}`} target="_blank" rel="noopener" style={{padding:"6px 12px",borderRadius:6,border:"1px solid rgba(255,255,255,.2)",background:"transparent",color:"#fff",cursor:"pointer",fontSize:10,textDecoration:"none"}}>💬 WhatsApp</a>
      </div>
      <div style={{fontSize:9,opacity:.5,marginTop:8}}>via NASAB · nasab.biz.id</div>
    </div>
  </div>);
}

// ─── DATA QUALITY MODAL ─────────────────────────────────────
function DataQualityModal({pp,marriages,onClose,flash}){
  const issues=useMemo(()=>validateFamilyData(pp,marriages),[pp,marriages]);
  const[aiReport,setAiReport]=useState("");const[aiBusy,setAiBusy]=useState(false);
  const crit=issues.filter(i=>i.sev==='critical').length;const warn=issues.filter(i=>i.sev==='warning').length;const info=issues.filter(i=>i.sev==='info').length;
  const aiAnalyze=async()=>{setAiBusy(true);try{const prompt=`Analisis masalah data silsilah keluarga berikut dan berikan rekomendasi perbaikan dalam Bahasa Indonesia, singkat:\n${issues.slice(0,20).map(i=>`[${i.sev}] ${i.msg}`).join('\n')}`;const r=await callAI(prompt);setAiReport(r)}catch(e){flash("AI: "+e.message)}setAiBusy(false)};
  const sevC={critical:'#ef4444',warning:'#f59e0b',info:'#3b82f6'};const sevL={critical:'🔴',warning:'🟡',info:'🔵'};
  return(<div className="modal-ov" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:600,maxHeight:"80vh",overflow:"auto"}}>
    <div className="m-hdr"><h2>🔍 Kualitas Data</h2><button className="btn btn-icon btn-ghost" onClick={onClose}><Ic.X/></button></div>
    <div className="m-body">
      <div style={{display:"flex",gap:12,marginBottom:14,fontSize:12}}>
        <span style={{color:sevC.critical,fontWeight:600}}>{sevL.critical} {crit} Critical</span>
        <span style={{color:sevC.warning,fontWeight:600}}>{sevL.warning} {warn} Warning</span>
        <span style={{color:sevC.info,fontWeight:600}}>{sevL.info} {info} Info</span>
        <span style={{color:"var(--t3)",marginLeft:"auto"}}>{issues.length} total</span>
      </div>
      {!issues.length?<div style={{textAlign:"center",padding:20,color:"var(--pri)",fontSize:13}}>Data terlihat baik!</div>:
      <div style={{maxHeight:300,overflow:"auto",marginBottom:12}}>{issues.map((is,i)=><div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",padding:"6px 0",borderBottom:"1px solid var(--bdr)",fontSize:11}}>
        <span style={{flexShrink:0}}>{sevL[is.sev]}</span><span style={{color:"var(--t2)"}}>{is.msg}</span></div>)}</div>}
      <button className="btn btn-sm" onClick={aiAnalyze} disabled={aiBusy||!issues.length} style={{fontSize:10}}>{aiBusy?"Menganalisis...":"AI Analysis"}</button>
      {aiReport&&<div style={{marginTop:10,padding:12,background:"var(--bg2)",borderRadius:8,fontSize:11,lineHeight:1.7,color:"var(--t2)",whiteSpace:"pre-wrap"}}>{aiReport}</div>}
    </div>
  </div></div>);
}

// ─── AI CHAT PANEL ──────────────────────────────────────────
function ChatPanel({pp,fam,marriages,onClose,flash}){
  const[msgs,setMsgs]=useState([{role:'ai',text:`Hai! Tanya apa saja tentang keluarga ${fam.name}. Contoh: "Siapa yang merantau?" atau "Berapa cucu?"`}]);
  const[input,setInput]=useState("");const[busy,setBusy]=useState(false);const endRef=useRef(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth'})},[msgs]);
  const send=async()=>{if(!input.trim()||busy)return;const q=input;setInput("");setMsgs(m=>[...m,{role:'user',text:q}]);setBusy(true);
    try{const summary={name:fam.name,total:pp.length,generations:FE.stats(pp).generations,
      members:pp.slice(0,50).map(p=>({name:p.name,gender:p.gender,birthDate:p.birthDate,deathDate:p.deathDate,birthPlace:p.birthPlace,location:p.location?.address||'',parentName:pp.find(x=>x.id===p.parentId)?.name||null,spouseNames:FE.spouses(pp,p,marriages).map(s=>s.name),childCount:FE.ch(pp,p.id).length,agama:p.agama}))};
      const sys=`Kamu adalah asisten silsilah keluarga "${fam.name}" di NASAB. Jawab pertanyaan berdasarkan DATA ini. HANYA jawab dari data — jangan mengarang. Bahasa Indonesia, singkat.\n\nDATA:\n${JSON.stringify(summary)}`;
      const r=await callAI(q,sys);setMsgs(m=>[...m,{role:'ai',text:r}])}catch(e){setMsgs(m=>[...m,{role:'ai',text:'Error: '+e.message}])}setBusy(false)};
  return(<div className="chat-panel">
    <div className="chat-hdr"><span style={{fontWeight:600}}>Tanya AI</span><button className="btn btn-icon btn-ghost" onClick={onClose} style={{fontSize:12}}><Ic.X/></button></div>
    <div className="chat-body">{msgs.map((m,i)=><div key={i} className={`chat-msg ${m.role}`}><div className="chat-bubble">{m.text}</div></div>)}{busy&&<div className="chat-msg ai"><div className="chat-bubble" style={{opacity:.5}}>Berpikir...</div></div>}<div ref={endRef}/></div>
    <div className="chat-input"><input value={input} onChange={e=>setInput(e.target.value)} placeholder="Ketik pertanyaan..." onKeyDown={e=>{if(e.key==='Enter')send()}}/><button className="btn btn-p btn-sm" onClick={send} disabled={busy||!input.trim()}>↵</button></div>
  </div>);
}

// ═══════════════════════════════════════════════════════════════
// APP ROOT
// ═══════════════════════════════════════════════════════════════
const ThemeCtx=React.createContext({theme:"dark",toggle:()=>{}});
function useTheme(){return React.useContext(ThemeCtx)}
function ThemeBtn(){const{theme,toggle}=useTheme();return<button className="theme-btn" onClick={toggle} title={theme==="dark"?"Light mode":"Dark mode"}>{theme==="dark"?"☀️":"🌙"}</button>}
function InstallBanner(){
  const[deferredPrompt,setDP]=useState(null);const[show,setShow]=useState(false);const[dismissed,setDismissed]=useState(()=>localStorage.getItem("nasab-pwa-dismiss")==="1");
  useEffect(()=>{const h=e=>{e.preventDefault();setDP(e);if(!dismissed)setShow(true)};window.addEventListener("beforeinstallprompt",h);return()=>window.removeEventListener("beforeinstallprompt",h)},[dismissed]);
  const install=async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();const{outcome}=await deferredPrompt.userChoice;if(outcome==="accepted")setShow(false);setDP(null)};
  const dismiss=()=>{setShow(false);setDismissed(true);localStorage.setItem("nasab-pwa-dismiss","1")};
  if(!show)return null;
  return<div className="pwa-banner"><div className="pwa-icon">🌳</div><div className="pwa-text"><b>Install NASAB</b><span>Akses cepat dari home screen</span></div><button className="btn btn-p btn-sm" onClick={install}>Install</button><button className="btn btn-sm btn-ghost" onClick={dismiss} style={{padding:"4px 6px",fontSize:10}}>Nanti</button></div>
}
export default function App(){
  const hash=window.location.hash;
  if(hash.startsWith('#/undangan/')){const slug=hash.split('/')[2];return<InvitationPage slug={slug}/>}
  const[user,setUser]=useState(null);const[af,setAf]=useState(null);const[adminView,setAdminView]=useState(false);const[loading,setLoading]=useState(true);
  const[showAuth,setShowAuth]=useState(()=>{const h=window.location.hash;return h==="#/login"||h==="#/register"||h==="#/auth";});
  const[theme,setTheme]=useState(()=>localStorage.getItem("nasab-theme")||"dark");
  // Migration banner — show once if user has legacy localStorage AI keys.
  // Old keys never get exfiltrated (stay in browser only) but going forward
  // the new flow stores keys encrypted on the server.
  const[showAiMigration,setShowAiMigration]=useState(()=>{
    if(localStorage.getItem('nasab-ai-migration-dismissed'))return false;
    return!!(localStorage.getItem('nasab-claude-key')||localStorage.getItem('nasab-groq-key')||localStorage.getItem('nasab-gemini-key'));
  });
  const dismissAiMigration=()=>{
    ['nasab-claude-key','nasab-groq-key','nasab-gemini-key'].forEach(k=>localStorage.removeItem(k));
    localStorage.setItem('nasab-ai-migration-dismissed','1');
    setShowAiMigration(false);
  };
  useEffect(()=>{document.documentElement.setAttribute("data-theme",theme);localStorage.setItem("nasab-theme",theme);document.querySelector('meta[name="theme-color"]')?.setAttribute("content",theme==="dark"?"#07090e":"#f4f6f9")},[theme]);
  const toggle=useCallback(()=>setTheme(t=>t==="dark"?"light":"dark"),[]);
  useEffect(()=>{(async()=>{if(API.hasSession()){try{const u=await API.me();setUser(u)}catch{API.clearSession()}}setLoading(false)})()},[]);
  const login=async u=>{setUser(u)};
  const logout=async()=>{setUser(null);setAf(null);setAdminView(false);setShowAuth(false);API.clearSession()};
  if(loading)return<div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--bg0)",fontFamily:"var(--f-display)",fontSize:20,color:"var(--t3)"}}>Loading...</div>;
  return<ThemeCtx.Provider value={{theme,toggle}}><style>{css}</style><InstallBanner/>{user&&showAiMigration&&<div style={{position:"fixed",top:0,left:0,right:0,zIndex:9999,background:"linear-gradient(90deg,var(--warn),var(--orange))",color:"#000",padding:"10px 16px",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",gap:12,boxShadow:"0 2px 8px rgba(0,0,0,.3)",flexWrap:"wrap"}}>🔒 <b>Update keamanan:</b> AI key kamu sekarang disimpan terenkripsi di server. Set ulang via tab <b>Keluarga → AI Settings</b> di salah satu family. <button onClick={dismissAiMigration} style={{marginLeft:8,padding:"4px 10px",border:"1px solid rgba(0,0,0,.4)",borderRadius:4,background:"rgba(0,0,0,.15)",color:"#000",fontSize:11,fontWeight:600,cursor:"pointer"}}>Mengerti, hapus localStorage</button></div>}{!user?(showAuth?<AuthScreen onLogin={login}/>:<LandingPage onLogin={()=>setShowAuth(true)}/>):af?<Workspace family={af} user={user} onBack={()=>setAf(null)}/>:adminView?<AdminPanel user={user} onBack={()=>setAdminView(false)} onSelectFamily={f=>setAf(f)}/>:<Dashboard user={user} onLogout={logout} onSelectFamily={f=>setAf(f)} onCreateFamily={(u,f)=>{setUser(u);setAf(f)}} onAdmin={()=>setAdminView(true)}/>}</ThemeCtx.Provider>;
}
