import { useState, useEffect, useRef } from "react";
import {
  Camera, Scale, BookOpen, Shield, Lock, ChevronRight,
  TreePine, Users, Heart, Sparkles, ArrowRight, Menu, X,
  Eye, FileText, Globe, Fingerprint, Smartphone, Zap,
  MapPin, Bot, Share2, Search, ChevronDown
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   NASAB — Jaga Nasabmu
   Landing Page v2.0 — synced with NASAB v8.1.0 (53 features)
   
   Design: "Botanical Heritage"
   Cormorant Garamond (display) + DM Sans (body)
   Emerald depth on warm cream canvas
   ═══════════════════════════════════════════════════════════════ */

function useInView(opts = {}) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const ob = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); ob.disconnect(); } },
      { threshold: 0.12, ...opts }
    );
    ob.observe(ref.current);
    return () => ob.disconnect();
  }, []);
  return [ref, vis];
}

function Counter({ end, suffix = "", dur = 2000 }) {
  const [val, setVal] = useState(0);
  const [ref, vis] = useInView();
  useEffect(() => {
    if (!vis) return;
    let cur = 0;
    const step = end / (dur / 16);
    const id = setInterval(() => {
      cur += step;
      if (cur >= end) { setVal(end); clearInterval(id); }
      else setVal(Math.floor(cur));
    }, 16);
    return () => clearInterval(id);
  }, [vis, end, dur]);
  return <span ref={ref}>{val.toLocaleString("id-ID")}{suffix}</span>;
}

function Glass({ children, className = "", hover = true, ...props }) {
  return (
    <div className={`relative rounded-2xl border border-white/30 bg-white/40 backdrop-blur-xl shadow-lg ${hover ? "transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-900/8 hover:-translate-y-1 hover:border-emerald-200/50" : ""} ${className}`} {...props}>
      {children}
    </div>
  );
}

function HeroTree({ className = "" }) {
  return (
    <svg viewBox="0 0 400 480" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M200 480 L200 270" stroke="url(#trk)" strokeWidth="5" strokeLinecap="round"/>
      <path d="M200 340 Q155 310 135 270" stroke="url(#trk)" strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M200 310 Q245 280 265 240" stroke="url(#trk)" strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M200 370 Q255 350 285 320" stroke="url(#trk)" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M200 355 Q145 335 115 305" stroke="url(#trk)" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M135 270 Q115 250 105 220" stroke="url(#trk)" strokeWidth="2" strokeLinecap="round"/>
      <path d="M265 240 Q280 215 290 195" stroke="url(#trk)" strokeWidth="2" strokeLinecap="round"/>
      {[[200,250,42],[135,255,30],[265,225,33],[285,305,26],[115,290,28],[105,205,22],[290,180,20],[170,215,24],[230,195,22],[200,185,18],[155,240,16],[245,210,15]].map(([cx,cy,r],i)=>(
        <circle key={i} cx={cx} cy={cy} r={r} fill={`url(#lf${i%3})`} opacity={0.65+i%3*0.12}>
          <animate attributeName="r" values={`${r};${r+1.5};${r}`} dur={`${3+i*0.35}s`} repeatCount="indefinite"/>
        </circle>
      ))}
      {[[200,270],[135,270],[265,240],[285,320],[115,305],[200,185],[170,215],[230,195],[105,220],[290,195]].map(([cx,cy],i)=>(
        <g key={`n${i}`}>
          <circle cx={cx} cy={cy} r="6" fill="#fff" stroke="#059669" strokeWidth="2" opacity="0.9">
            <animate attributeName="opacity" values="0.5;1;0.5" dur={`${2.2+i*0.25}s`} repeatCount="indefinite"/>
          </circle>
          {i<4&&<circle cx={cx} cy={cy} r="12" fill="none" stroke="#059669" strokeWidth="0.5" opacity="0.3">
            <animate attributeName="r" values="8;16;8" dur={`${3+i*0.5}s`} repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.3;0;0.3" dur={`${3+i*0.5}s`} repeatCount="indefinite"/>
          </circle>}
        </g>
      ))}
      <defs>
        <linearGradient id="trk" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#065f46"/><stop offset="100%" stopColor="#a7f3d0"/></linearGradient>
        <radialGradient id="lf0"><stop offset="0%" stopColor="#6ee7b7"/><stop offset="100%" stopColor="#059669"/></radialGradient>
        <radialGradient id="lf1"><stop offset="0%" stopColor="#a7f3d0"/><stop offset="100%" stopColor="#047857"/></radialGradient>
        <radialGradient id="lf2"><stop offset="0%" stopColor="#d1fae5"/><stop offset="100%" stopColor="#10b981"/></radialGradient>
      </defs>
    </svg>
  );
}

const STATS_API = "https://nasab-api.sopian-hadianto.workers.dev/api/public/stats";

export default function LandingPage({ onLogin, apiUrl }) {
  const go = (e) => { if (e && e.preventDefault) e.preventDefault(); if (typeof onLogin === "function") onLogin(); };
  const [stats, setStats] = useState({ users: 0, families: 0, members: 0, loaded: false });
  useEffect(() => {
    const url = apiUrl ? `${apiUrl}/api/public/stats` : STATS_API;
    fetch(url)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && typeof d.users === "number") setStats({ ...d, loaded: true }); })
      .catch(() => {});
  }, [apiUrl]);
  // The host app (nasab.jsx) sets `body,#root{overflow:hidden}` for its own
  // scroll containers. LandingPage is a full-page scroll design, so we
  // temporarily mark the body while this component is mounted and restore on unmount.
  useEffect(() => {
    document.body.classList.add("landing-scroll");
    return () => document.body.classList.remove("landing-scroll");
  }, []);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [heroRef, heroVis] = useInView();
  const [featRef, featVis] = useInView();
  const [secRef, secVis] = useInView();
  const [statsRef, statsVis] = useInView();
  const [howRef, howVis] = useInView();
  const [moreRef, moreVis] = useInView();

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const navSolid = scrollY > 50;

  const mainFeatures = [
    { icon: Camera, title: "Ekstrak KK Otomatis", desc: "Foto Kartu Keluarga, AI Claude Vision langsung membaca dan mengisi data anggota keluarga. Satu foto, seluruh KK terinput.", accent: "from-emerald-500 to-teal-600", bg: "bg-emerald-50" },
    { icon: Scale, title: "Kalkulator Faraidh", desc: "Hitung waris Islam sesuai Al-Qur'an — fardh, asabah, 'awl, wasiat wajibah (KHI Pasal 209). 9 kategori aset, deduction chain lengkap.", accent: "from-violet-500 to-purple-600", bg: "bg-violet-50" },
    { icon: BookOpen, title: "Biografi AI", desc: "AI merangkum asal-usul, migrasi, dan milestone keluarga menjadi narasi indah. Tiga gaya: naratif, formal, puitis. Ekspor PDF & share link publik.", accent: "from-amber-500 to-orange-600", bg: "bg-amber-50" },
  ];

  const moreFeatures = [
    { icon: TreePine, label: "Pohon Interaktif", desc: "Canvas glassmorphism, drag & drop, zoom, pinch, minimap, 73+ anggota" },
    { icon: Eye, label: "POV Navigation", desc: "Navigasi ala MyHeritage — fokus per cabang, breadcrumb, switch root" },
    { icon: Users, label: "Multi-Tenant + RBAC", desc: "Owner/Editor/Viewer, undang kolaborator, workspace per keluarga" },
    { icon: Globe, label: "Peta Sebaran", desc: "Leaflet map, geocoding 34 provinsi, analisis pola migrasi" },
    { icon: Heart, label: "Acara & Undangan", desc: "10 tipe acara, 4 template undangan digital, RSVP tanpa login" },
    { icon: Share2, label: "Family Feed", desc: "Posting, like, komentar, auto-reminder ulang tahun & acara" },
    { icon: FileText, label: "GEDCOM 5.5.1", desc: "Import/export standar internasional, duplikat auto-skip" },
    { icon: Smartphone, label: "PWA + Mobile Nav", desc: "Installable, offline-ready, bottom nav otomatis di mobile" },
    { icon: Bot, label: "AI Chatbot", desc: "Tanya data keluarga, 3 provider AI (Groq/Gemini/Claude)" },
    { icon: Search, label: "Canvas Search", desc: "Cari anggota, auto-pan & zoom ke node, highlight animasi" },
    { icon: Zap, label: "Onboarding Wizard", desc: "Wizard 3 langkah — pohon langsung terbentuk, tidak pernah kosong" },
    { icon: Fingerprint, label: "NIK Intelligence", desc: "Auto-fill gender, tanggal lahir, provinsi dari 16 digit NIK" },
  ];

  const howSteps = [
    { num: "01", title: "Daftar Gratis", desc: "Buat akun dalam 30 detik. Tidak perlu kartu kredit.", icon: "✨" },
    { num: "02", title: "Buat Keluarga", desc: "Wizard memandu: nama kamu → pasangan → orang tua. Langsung ada anggota.", icon: "🌱" },
    { num: "03", title: "Kembangkan Pohon", desc: "Tambah dari Canvas (+), import KK, atau upload GEDCOM.", icon: "🌳" },
    { num: "04", title: "Bagikan & Wariskan", desc: "Undang keluarga, buat biografi AI, kirim undangan acara.", icon: "💝" },
  ];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
        .font-display{font-family:'Cormorant Garamond',Georgia,'Times New Roman',serif}
        .font-body{font-family:'DM Sans',system-ui,sans-serif}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes scaleIn{from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes pulseRing{0%{transform:scale(1);opacity:.35}100%{transform:scale(1.7);opacity:0}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .anim-fadeUp{animation:fadeUp .8s cubic-bezier(.16,1,.3,1) both}
        .anim-fadeIn{animation:fadeIn .6s ease both}
        .anim-scaleIn{animation:scaleIn .7s cubic-bezier(.16,1,.3,1) both}
        .anim-float{animation:float 6s ease-in-out infinite}
        .shimmer-text{background:linear-gradient(110deg,#065f46 40%,#10b981 50%,#065f46 60%);background-size:200% 100%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 4s linear infinite}
        .grain{position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.015;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-size:128px 128px}
        html{scroll-behavior:smooth}
        .delay-100{animation-delay:100ms}.delay-150{animation-delay:150ms}.delay-200{animation-delay:200ms}.delay-300{animation-delay:300ms}.delay-400{animation-delay:400ms}.delay-500{animation-delay:500ms}
        /* Bulletproof section container — beats the app-shell *{padding:0} reset */
        .nasab-wrap{max-width:1152px !important;margin-left:auto !important;margin-right:auto !important;padding-left:24px !important;padding-right:24px !important;width:100% !important;box-sizing:border-box !important}
        @media(max-width:640px){.nasab-wrap{padding-left:16px !important;padding-right:16px !important}}
        .nasab-grid-4{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:20px}
        .nasab-grid-3{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:28px}
      `}</style>

      <div className="grain"/>

      {/* NAVBAR */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 font-body ${navSolid?"bg-white/80 backdrop-blur-2xl shadow-sm border-b border-stone-200/40":"bg-transparent"}`}>
        <div className="nasab-wrap h-16 sm:h-[4.5rem] flex items-center justify-between">
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shadow-md shadow-emerald-900/20 group-hover:shadow-emerald-900/30 transition-shadow">
              <TreePine className="w-5 h-5 text-white" strokeWidth={2.5}/>
            </div>
            <span className="font-display text-2xl font-bold tracking-tight"><span className="text-emerald-800">NAS</span><span className="text-emerald-500">AB</span></span>
          </a>
          <div className="hidden md:flex items-center gap-8">
            {[["Fitur","fitur"],["Cara Kerja","cara-kerja"],["Keamanan","keamanan"],["Statistik","statistik"]].map(([l,h])=>(
              <a key={h} href={`#${h}`} className="text-sm font-medium text-stone-500 hover:text-emerald-700 transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-emerald-500 after:transition-all hover:after:w-full">{l}</a>
            ))}
            <button type="button" onClick={go} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300">
              Login / Daftar <ArrowRight className="w-4 h-4"/>
            </button>
          </div>
          <button onClick={()=>setMenuOpen(!menuOpen)} className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center hover:bg-stone-100 transition-colors">
            {menuOpen?<X className="w-5 h-5"/>:<Menu className="w-5 h-5"/>}
          </button>
        </div>
        {menuOpen&&(
          <div className="md:hidden bg-white/95 backdrop-blur-2xl border-t border-stone-100 px-5 pb-5 pt-2" style={{animation:"slideDown .25s ease"}}>
            {[["Fitur","fitur"],["Cara Kerja","cara-kerja"],["Keamanan","keamanan"]].map(([l,h])=>(
              <a key={h} href={`#${h}`} onClick={()=>setMenuOpen(false)} className="block py-3 text-stone-600 font-medium hover:text-emerald-700 border-b border-stone-100">{l}</a>
            ))}
            <button type="button" onClick={(e)=>{setMenuOpen(false);go(e);}} className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold shadow-md">Login / Daftar <ArrowRight className="w-4 h-4"/></button>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section ref={heroRef} className="relative pt-28 sm:pt-36 pb-20 sm:pb-28 overflow-hidden">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-emerald-100/60 to-teal-50/40 blur-3xl"/>
          <div className="absolute top-20 -left-20 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-violet-100/25 to-fuchsia-50/15 blur-3xl"/>
          <div className="absolute bottom-0 left-1/3 w-[500px] h-[300px] rounded-full bg-gradient-to-t from-amber-50/30 to-transparent blur-2xl"/>
        </div>
        <div className="nasab-wrap grid md:grid-cols-2 gap-12 md:gap-14 lg:gap-20 items-center">
          <div className={heroVis?"anim-fadeUp":"opacity-0"}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600"/>
              <span className="text-xs font-semibold text-emerald-700 tracking-wide uppercase font-body">Platform Silsilah #1 Indonesia · v8.1</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-bold leading-[1.08] tracking-tight mb-6">
              Jaga Nasab,{" "}<span className="shimmer-text">Wariskan Kisah</span>{" "}<span className="text-stone-400">Keluarga</span>
            </h1>
            <p className="font-body text-base sm:text-lg lg:text-xl text-stone-500 leading-relaxed mb-8">
              Bangun pohon keluarga digital yang aman. Ekstrak KK dengan AI, hitung waris Faraidh, dan biarkan AI merangkum kisah keluarga — semua dalam satu platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button type="button" onClick={go} className="group inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 text-white font-semibold text-base shadow-xl shadow-emerald-900/20 hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300">
                <TreePine className="w-5 h-5"/> Mulai Pohon Keluarga Anda <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform"/>
              </button>
              <a href="#fitur" className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white/60 backdrop-blur border border-stone-200/60 text-stone-600 font-medium hover:bg-white hover:text-emerald-700 transition-all duration-300">
                Jelajahi 53 Fitur <ChevronDown className="w-4 h-4"/>
              </a>
            </div>
            <div className="mt-10 flex items-center gap-5 text-sm text-stone-400 font-body">
              <div className="flex -space-x-2">
                {["🧕","👨","👩","🧔","👵"].map((e,i)=>(
                  <div key={i} className="w-8 h-8 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-sm">{e}</div>
                ))}
              </div>
              <span><strong className="text-stone-600">{stats.loaded ? stats.families.toLocaleString("id-ID") : "…"}</strong> keluarga Indonesia sudah bergabung</span>
            </div>
          </div>
          <div className={`relative flex justify-center w-full ${heroVis?"anim-scaleIn delay-300":"opacity-0"}`}>
            <div className="relative w-64 sm:w-80 md:w-72 lg:w-96 max-w-full">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-200/25 to-teal-100/15 blur-2xl scale-110"/>
              <HeroTree className="relative z-10 anim-float w-full h-auto drop-shadow-xl"/>
              <Glass className="absolute -left-4 sm:-left-10 top-[28%] px-3 py-2 flex items-center gap-2 anim-float" style={{animationDelay:"1s"}} hover={false}>
                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center"><Users className="w-4 h-4 text-emerald-700"/></div>
                <div><div className="text-xs font-bold text-stone-700 font-body">{stats.loaded ? `${stats.members.toLocaleString("id-ID")} Anggota` : "… Anggota"}</div><div className="text-[10px] text-stone-400 font-body">terdaftar</div></div>
              </Glass>
              <Glass className="absolute -right-2 sm:-right-6 top-[65%] px-3 py-2 flex items-center gap-2 anim-float" style={{animationDelay:"2s"}} hover={false}>
                <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center"><Shield className="w-4 h-4 text-violet-700"/></div>
                <div><div className="text-xs font-bold text-stone-700 font-body">AES-GCM</div><div className="text-[10px] text-stone-400 font-body">enkripsi NIK</div></div>
              </Glass>
              <Glass className="absolute left-1/2 -translate-x-1/2 -bottom-2 px-3 py-2 flex items-center gap-2 anim-float" style={{animationDelay:"3s"}} hover={false}>
                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center"><Zap className="w-4 h-4 text-amber-700"/></div>
                <div><div className="text-xs font-bold text-stone-700 font-body">53 Fitur</div><div className="text-[10px] text-stone-400 font-body">v8.1.0</div></div>
              </Glass>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES MAIN */}
      <section id="fitur" ref={featRef} className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-stone-50 via-white to-stone-50"/>
        <div className="nasab-wrap">
          <div className={`text-center max-w-xl mx-auto mb-14 ${featVis?"anim-fadeUp":"opacity-0"}`}>
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold tracking-widest uppercase mb-4 font-body">Fitur Unggulan</span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">Teknologi untuk <span className="text-emerald-600">Tradisi</span></h2>
            <p className="font-body text-stone-400 text-base sm:text-lg">Dirancang khusus untuk kebutuhan keluarga Indonesia — dari NIK hingga hukum waris Islam.</p>
          </div>
          <div className="nasab-grid-3">
            {mainFeatures.map((f,i)=>{const Icon=f.icon;return(
              <Glass key={i} className={`p-7 sm:p-8 group ${featVis?"anim-fadeUp":"opacity-0"}`} style={{animationDelay:`${200+i*150}ms`}}>
                <div className={`w-14 h-14 rounded-2xl ${f.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500`}>
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${f.accent} flex items-center justify-center shadow-lg`}><Icon className="w-4 h-4 text-white" strokeWidth={2}/></div>
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-stone-800 mb-3">{f.title}</h3>
                <p className="font-body text-sm sm:text-[15px] text-stone-400 leading-relaxed">{f.desc}</p>
              </Glass>
            );})}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="cara-kerja" ref={howRef} className="py-20 sm:py-28 bg-white/60">
        <div className="nasab-wrap">
          <div className={`text-center max-w-xl mx-auto mb-14 ${howVis?"anim-fadeUp":"opacity-0"}`}>
            <span className="inline-block px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold tracking-widest uppercase mb-4 font-body">Cara Kerja</span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">Empat Langkah <span className="text-emerald-600">Mudah</span></h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howSteps.map((s,i)=>(
              <div key={i} className={`relative ${howVis?"anim-fadeUp":"opacity-0"}`} style={{animationDelay:`${200+i*120}ms`}}>
                {i<3&&<div className="hidden lg:block absolute top-10 left-[calc(100%+1px)] w-[calc(100%-40px)] h-px bg-gradient-to-r from-emerald-300/40 to-transparent -translate-x-4"/>}
                <div className="p-6 rounded-2xl border border-stone-100 bg-white/70 hover:bg-white hover:shadow-lg hover:shadow-emerald-900/5 hover:border-emerald-100 transition-all duration-400 h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{s.icon}</span>
                    <span className="font-body text-xs font-bold text-emerald-500 tracking-widest">{s.num}</span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-stone-800 mb-2">{s.title}</h3>
                  <p className="font-body text-sm text-stone-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MORE FEATURES */}
      <section ref={moreRef} className="py-20 sm:py-28">
        <div className="nasab-wrap">
          <div className={`text-center max-w-xl mx-auto mb-14 ${moreVis?"anim-fadeUp":"opacity-0"}`}>
            <span className="inline-block px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-bold tracking-widest uppercase mb-4 font-body">Dan masih banyak lagi</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4">53 Fitur, <span className="text-emerald-600">Satu Platform</span></h2>
          </div>
          <div className="nasab-grid-4">
            {/* auto-fill minmax(240px,1fr) → scales 1/2/3/4 cols, gap 20px */}
            {moreFeatures.map((f,i)=>{const Icon=f.icon;return(
              <div key={i} className={`group p-5 rounded-2xl border border-stone-100 bg-white/50 hover:bg-white hover:border-emerald-100 hover:shadow-md hover:shadow-emerald-900/5 transition-all duration-400 ${moreVis?"anim-fadeUp":"opacity-0"}`} style={{animationDelay:`${300+i*60}ms`}}>
                <Icon className="w-5 h-5 text-emerald-500 mb-3 group-hover:text-emerald-600 transition-colors"/>
                <h4 className="font-display text-base font-bold text-stone-700 mb-1">{f.label}</h4>
                <p className="font-body text-xs text-stone-400 leading-relaxed">{f.desc}</p>
              </div>
            );})}
          </div>
        </div>
      </section>

      {/* SECURITY */}
      <section id="keamanan" ref={secRef} className="py-20 sm:py-28">
        <div className="nasab-wrap">
          <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 ${secVis?"anim-scaleIn":"opacity-0"}`}>
          <div className="absolute inset-0 opacity-[0.04]">
            <svg width="100%" height="100%"><defs><pattern id="sg" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0L0 0 0 28" fill="none" stroke="white" strokeWidth=".5"/></pattern></defs><rect width="100%" height="100%" fill="url(#sg)"/></svg>
          </div>
          <div className="relative z-10 grid md:grid-cols-2 gap-10 p-8 sm:p-12 lg:p-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 mb-6">
                <Lock className="w-3.5 h-3.5 text-emerald-300"/><span className="text-xs font-bold text-emerald-200 tracking-wide uppercase font-body">Keamanan Data</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">NIK & Data Pribadi <span className="text-emerald-300">Terenkripsi</span></h2>
              <p className="font-body text-emerald-100/70 text-base sm:text-lg leading-relaxed mb-8">
                Setiap NIK dan Nomor KK diamankan dengan enkripsi <strong className="text-white">AES-GCM</strong> di database — standar yang sama dengan perbankan. Akses diatur berlapis berdasarkan peran.
              </p>
              <div className="space-y-4">
                {[
                  {icon:Fingerprint,label:"Enkripsi AES-GCM",desc:"NIK & No KK dienkripsi at rest di Cloudflare D1"},
                  {icon:Shield,label:"RBAC 3 Lapis",desc:"Owner = full · Editor = masked (****) · Viewer = hidden"},
                  {icon:Lock,label:"PBKDF2 Password",desc:"100.000 iterasi SHA-256, random salt, auto-upgrade legacy"},
                  {icon:Eye,label:"Audit Trail Immutable",desc:"Setiap mutasi tercatat — IP, user agent, severity level"},
                ].map((s,i)=>(
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0"><s.icon className="w-5 h-5 text-emerald-300"/></div>
                    <div><h4 className="font-body text-sm font-bold text-white">{s.label}</h4><p className="font-body text-xs text-emerald-100/50">{s.desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden md:flex justify-center">
              <div className="relative max-w-[260px]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 rounded-full border border-emerald-400/20" style={{animation:"pulseRing 3s ease-out infinite"}}/>
                  <div className="absolute w-36 h-36 rounded-full border border-emerald-400/15" style={{animation:"pulseRing 3s ease-out 1s infinite"}}/>
                </div>
                <div className="relative w-40 h-40 rounded-3xl bg-gradient-to-br from-emerald-400/20 to-teal-400/10 border border-emerald-400/20 backdrop-blur flex items-center justify-center">
                  <Shield className="w-16 h-16 text-emerald-300" strokeWidth={1.5}/>
                </div>
                <div className="absolute -top-3 -right-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur border border-white/10 text-xs font-bold text-emerald-200 font-body anim-float">PBKDF2</div>
                <div className="absolute -bottom-3 -left-3 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur border border-white/10 text-xs font-bold text-emerald-200 font-body anim-float" style={{animationDelay:"1.5s"}}>SHA-256</div>
                <div className="absolute top-1/2 -right-3 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur border border-white/10 text-xs font-bold text-emerald-200 font-body anim-float" style={{animationDelay:"2.5s"}}>CORS</div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section id="statistik" ref={statsRef} className="py-16 sm:py-24">
        <div className="nasab-wrap">
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-5 sm:gap-6 ${statsVis?"anim-fadeUp":"opacity-0"}`}>
            {[
              {val: stats.loaded ? stats.users : 100, label:"Pengguna", suffix: stats.loaded ? "" : "+", color:"text-emerald-600"},
              {val: stats.loaded ? stats.families : 140, label:"Keluarga", suffix: stats.loaded ? "" : "+", color:"text-teal-600"},
              {val: stats.loaded ? stats.members : 500, label:"Anggota", suffix: stats.loaded ? "" : "+", color:"text-violet-600"},
              {val:53, label:"Fitur", suffix:"", color:"text-amber-600"},
            ].map((s,i)=>(
              <Glass key={i} className="p-6 sm:p-8 text-center" style={{animationDelay:`${i*100}ms`}}>
                <div className={`font-display text-3xl sm:text-4xl lg:text-5xl font-bold ${s.color} mb-1`}><Counter end={s.val} suffix={s.suffix}/></div>
                <div className="font-body text-xs sm:text-sm text-stone-400 font-medium uppercase tracking-wider">{s.label}</div>
              </Glass>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28">
        <div className="nasab-wrap" style={{textAlign:"center"}}>
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 mb-6">
            <Heart className="w-3.5 h-3.5 text-emerald-600"/><span className="text-xs font-semibold text-emerald-700 tracking-wide uppercase font-body">Gratis selamanya untuk keluarga kecil</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-5">Mulai Jaga Nasab <span className="text-emerald-600">Hari Ini</span></h2>
          <p className="font-body text-stone-400 text-base sm:text-lg max-w-xl mx-auto mb-10">
            Daftar gratis, bangun pohon keluarga, dan wariskan cerita untuk generasi selanjutnya. Wizard memandu langkah pertama — pohon keluarga langsung terbentuk.
          </p>
          <button type="button" onClick={go} className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 text-white font-semibold text-lg shadow-2xl shadow-emerald-900/20 hover:shadow-3xl hover:-translate-y-1 active:translate-y-0 transition-all duration-300">
            <TreePine className="w-5 h-5"/> Daftar Gratis Sekarang <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform"/>
          </button>
        </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-stone-200/60 py-10 sm:py-14 bg-white/40">
        <div className="nasab-wrap">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center"><TreePine className="w-4 h-4 text-white" strokeWidth={2.5}/></div>
              <div><span className="font-display text-lg font-bold text-stone-700">NASAB</span><p className="font-body text-xs text-stone-400">Jaga Nasabmu — Platform Silsilah Modern Indonesia</p></div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 font-body text-sm text-stone-400">
              <a href="#" className="hover:text-emerald-600 transition-colors">Kebijakan Privasi</a>
              <a href="#" className="hover:text-emerald-600 transition-colors">Syarat & Ketentuan</a>
              <span className="hidden sm:inline text-stone-300">·</span>
              <span>&copy; {new Date().getFullYear()} Labbaik AI</span>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-stone-100 text-center">
            <p className="font-body text-xs text-stone-300">Develop by: MS Hadianto · v{__APP_VERSION__} · &copy; {new Date().getFullYear()} Labbaik AI</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
