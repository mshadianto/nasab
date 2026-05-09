<div align="center">

```
  ███╗   ██╗ █████╗ ███████╗ █████╗ ██████╗
  ████╗  ██║██╔══██╗██╔════╝██╔══██╗██╔══██╗
  ██╔██╗ ██║███████║███████╗███████║██████╔╝
  ██║╚██╗██║██╔══██║╚════██║██╔══██║██╔══██╗
  ██║ ╚████║██║  ██║███████║██║  ██║██████╔╝
  ╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═════╝
```

### Jaga Nasabmu — Modern Family Tree SaaS for Indonesia

**Bangun, kelola, dan wariskan silsilah keluarga dengan teknologi yang berakar pada nilai Indonesia.**

[![Version](https://img.shields.io/badge/version-8.1.0-blue?style=for-the-badge)](https://nasab.biz.id)
[![Live Demo](https://img.shields.io/badge/%F0%9F%8C%8F_LIVE-nasab.biz.id-00C853?style=for-the-badge)](https://nasab.biz.id)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)

[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers_+_D1-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

[**Live Demo**](https://nasab.biz.id) · [**Documentation**](MANUAL.md) · [**Report Issue**](https://github.com/mshadianto/nasab/issues)

</div>

---

## Mengapa NASAB?

> *"Kenalilah nasab-nasab kalian, niscaya kalian dapat menyambung silaturahim."*  
> — HR. Tirmidzi

Indonesia memiliki tradisi silsilah keluarga yang dalam — dari Trah, Bani, hingga Marga. Tapi catatan keluarga sering tersimpan di selembar kertas tua di rumah eyang, hilang bersama waktu.

**NASAB hadir untuk menjaga itu.** Sebuah platform SaaS modern yang menggabungkan teknologi terkini dengan kebutuhan unik keluarga Indonesia: NIK Intelligence, Kalkulator Faraidh, Import Kartu Keluarga, dan AI yang menulis biografi keluarga dalam Bahasa Indonesia.

Dibangun dengan arsitektur **edge-first** di Cloudflare — instant globally, scalable infinitely, biaya nyaris nol untuk skala kecil-menengah.

---

## ✨ Sorotan Fitur

<table>
<tr>
<td width="50%" valign="top">

### 🌳 Pohon Silsilah Cerdas
- Drag-drop canvas dengan glassmorphism
- Bezier connectors + smart labels
- POV navigation (MyHeritage-style)
- Pan, zoom, pinch, double-tap zoom
- Auto-layout 73+ anggota tanpa overlap
- Expand/collapse + minimap frosted-glass

</td>
<td width="50%" valign="top">

### 🇮🇩 Indonesian-First
- **NIK Intelligence** — auto-fill 34 provinsi dari NIK
- **Import Kartu Keluarga** — manual + OCR Claude Vision
- **Kalkulator Faraidh** — KHI Pasal 209, wasiat wajibah
- **Bahasa Indonesia** — semua pesan error & UI
- Geotagging dengan dark/light Leaflet map

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🔐 Privacy & Security
- **NIK AES-GCM** terenkripsi at rest (D1)
- **PBKDF2-SHA256** password (100k iter, auto-upgrade)
- **RBAC** — Owner > Editor > Viewer
- **CORS restricted** — origin whitelist
- **Audit trail immutable** dengan severity levels
- Token signature **HMAC-verified** + dual-key migration

</td>
<td width="50%" valign="top">

### 🤖 AI-Powered
- **Triple provider** — Groq, Gemini, Claude
- **Kisah Keluarga** — auto biografi (3 gaya: naratif/formal/puitis)
- **AI Chatbot** — tanya tentang silsilah keluarga
- **Data Quality Checker** — 8 validasi + AI analysis
- **OCR Kartu Keluarga** via Claude Vision
- API key per-provider, never sent to backend

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 👨‍👩‍👧‍👦 Kolaborasi & Sosial
- **Multi-tenant** — workspace per keluarga
- **Family Feed** — post, like, komen, milestone
- **Acara Keluarga** — 10 tipe (nikah/aqiqah/khitan/dll)
- **Undangan Digital** — 4 template + RSVP tanpa login
- **Public Bio Share** — link `/kisah/:slug`
- Email invite + role assignment

</td>
<td width="50%" valign="top">

### 📱 Mobile & Offline
- **PWA** installable — Add to Home Screen
- **Service Worker** — caching strategies
- **Bottom nav bar** untuk mobile (≤768px)
- **Responsive** sampai 320px (iPhone SE 1st gen)
- **Pinch-to-zoom** + double-tap canvas
- Dark / Light theme dengan persistence

</td>
</tr>
</table>

<details>
<summary><b>📋 Lihat 50+ fitur lengkap</b></summary>

| # | Fitur | Highlight |
|---|---|---|
| 1 | Drag & Drop Canvas | Glassmorphism cards, posisi tersimpan ke D1 |
| 2 | Smart SVG Connectors | Bezier curves, ∞ marker, gender-colored |
| 3 | Generation Lanes | Kakek → Ayah → Anak → Cucu → Cicit → Canggah |
| 4 | Pan/Zoom/Pinch | Zoom-to-cursor, pinch, double-tap zoom |
| 5 | Minimap | Frosted glass overview |
| 6 | Geotagging + Leaflet | Dark/light map, geocoding, 34 provinsi |
| 7 | Kalkulator Faraidh | Hukum waris Islam + wasiat wajibah |
| 8 | NIK Intelligence | Auto-fill gender, tanggal lahir, provinsi |
| 9 | Relationship Finder | BFS pathfinding antar anggota |
| 10 | Birthday Tracker | 90 hari ke depan |
| 11 | Family Stories | Journal/legacy per anggota |
| 12 | Analytics | Distribusi generasi + lokasi + fakta |
| 13 | Auth + Multi-tenant | Register/Login/Lupa Password |
| 14 | RBAC + Invite | Owner/Editor/Viewer + email invite |
| 15 | Advanced Filters | Gender × Gen × Status × Lokasi × NIK |
| 16 | Import/Export JSON | Backup & restore + progress bar |
| 17 | Import/Export GEDCOM | 2-phase import, duplikat auto-skip |
| 18 | NIK Validation + Mask | Privacy — masked display, role-based |
| 19 | Agama + Penghalang Waris | 7 agama, auto-detect beda agama |
| 20 | Poligami | Tabel marriages, NIKAH #1/#2/#3 |
| 21 | Dark / Light Theme | Toggle dengan localStorage |
| 22 | PWA | Installable, offline, service worker |
| 23 | Import Kartu Keluarga | Manual + OCR Claude Vision |
| 24 | Pola Migrasi | NIK provinsi vs domisili |
| 25 | Filter Provinsi Asal | Dari NIK provinsi |
| 26 | Expand / Collapse | Auto-collapse gen ≥2, badge +N |
| 27 | Bulk Delete | Multi-select dengan skip anak |
| 28 | Canvas Search + Focus | Auto-pan/zoom, highlight pulse |
| 29 | NIK Encryption | AES-GCM, role-based decrypt |
| 30 | CORS Restricted | Origin whitelist, Vary: Origin |
| 31 | Kisah Keluarga (Bio) | Auto + AI + PDF + share link |
| 32 | Hapus Semua | Konfirmasi ketik "HAPUS", owner only |
| 33 | Smart Canvas Layout | Bottom-up subtree, top-down position |
| 34 | Spouse Descendant Count | Istri tampilkan keturunan suami |
| 35 | POV Tree Navigation | MyHeritage-style, branch indicator |
| 36 | Triple AI Provider | Groq + Gemini + Claude |
| 37 | Acara Keluarga | 10 tipe acara Indonesia |
| 38 | Undangan Digital | 4 template + RSVP |
| 39 | Family Feed | Post + like + komen + auto-feed |
| 40 | AI Suggest | Generate posting hangat |
| 41 | AI Settings Panel | Provider radio + key per-provider |
| 42 | PBKDF2 Password | 100k iterations, auto-upgrade legacy |
| 43 | Audit Trail | Immutable, severity, IP + UA |
| 44 | Data Quality Checker | 8 validasi + AI analysis |
| 45 | Faraidh Asset Distribution | 9 tipe aset, deduction chain |
| 46 | AI Chatbot | Floating widget, context-aware |
| 47 | Admin Audit Viewer | Filter severity/action/family |
| 48 | Onboarding Wizard | 3-step batch-create |
| 49 | Canvas Card Actions | + button, popup menu, smart disable |
| 50 | Bottom Nav Bar | Mobile fixed bottom, 5 tab |
| 51 | Milestone Notification | Popup di 5+ dan 15+ member |
| 52 | Empty State | Tombol Tambah/Import KK/GEDCOM |
| 53 | Admin Family Health | Badge Kosong/Stale, filter |
| 54 | Landing Page Live Stats | Real aggregate counts dari API |

</details>

---

## 🏛️ Arsitektur

```
                          ┌─────────────────────────┐
                          │      nasab.biz.id       │
                          │   (Cloudflare Pages)    │
                          └──────────┬──────────────┘
                                     │ HTTPS
                                     ▼
   ┌─────────────────────────────────────────────────────────┐
   │                    React 19 SPA                          │
   │  ┌─────────────┐ ┌────────────┐ ┌──────────────────┐   │
   │  │  Canvas     │ │   Map      │ │  Kisah Keluarga  │   │
   │  │  (drag/     │ │  (Leaflet) │ │  (AI biographies)│   │
   │  │  zoom/POV)  │ │            │ │                  │   │
   │  └─────────────┘ └────────────┘ └──────────────────┘   │
   │  ┌─────────────┐ ┌────────────┐ ┌──────────────────┐   │
   │  │  Faraidh    │ │   Feed     │ │   Onboarding     │   │
   │  │  (waris)    │ │   (sosial) │ │   Wizard         │   │
   │  └─────────────┘ └────────────┘ └──────────────────┘   │
   │           │                                              │
   │           ▼ fetch + Bearer token                         │
   └───────────┼──────────────────────────────────────────────┘
               │
               ▼
   ┌──────────────────────────────────────────────────────────┐
   │  Cloudflare Worker — nasab-api.workers.dev               │
   │  ┌─────────────────────────────────────────────────────┐ │
   │  │  Pure Web API standards, zero dependencies           │ │
   │  │  • Auth: PBKDF2-SHA256 + HMAC token verify          │ │
   │  │  • RBAC: platform + family roles                    │ │
   │  │  • CORS: restricted origins                          │ │
   │  │  • Rate limit: register/login/family create         │ │
   │  │  • NIK: AES-GCM at rest                             │ │
   │  │  • Audit: immutable trail dengan severity           │ │
   │  └─────────────────────────────────────────────────────┘ │
   │           │                                                │
   │           ▼                                                │
   │  ┌─────────────────────┐                                  │
   │  │   D1 Database       │  15 tables, full ON DELETE       │
   │  │   nasab-db          │  CASCADE, indexed queries         │
   │  │                     │                                   │
   │  │   users, families,  │                                   │
   │  │   members, marriages│                                   │
   │  │   stories, events,  │                                   │
   │  │   posts, biographies│                                   │
   │  │   audit_logs, ...   │                                   │
   │  └─────────────────────┘                                  │
   └───────────────────────────────────────────────────────────┘
                                     ▲
                                     │ AI calls (key from user, never via backend)
   ┌─────────────────────────────────┴──────────────────────────┐
   │                                                              │
   │   🤖 Groq (Llama 3.1 70B)                                  │
   │   ✨ Gemini (1.5 Flash)                                     │
   │   🎨 Claude (Sonnet 4.5)                                    │
   │                                                              │
   └──────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology | Why |
|---|---|---|
| 🌐 **Edge** | Cloudflare Workers + Pages | Global CDN, zero cold-start, free tier |
| 💾 **Database** | Cloudflare D1 (SQLite) | Edge-replicated, 15 tables, ON DELETE CASCADE |
| ⚛️ **Frontend** | React 19 + Vite 6 | Modern, fast, single-file SPA |
| 🎨 **Styling** | Tailwind v4 + CSS-in-JS | Utility for landing, scoped for app |
| 🗺️ **Maps** | Leaflet + OpenStreetMap | Free, dark/light theme |
| 📱 **PWA** | Service Worker + Manifest | Installable, offline-capable |
| 🔐 **Auth** | Web Crypto API | PBKDF2-SHA256, AES-GCM, HMAC |
| 🤖 **AI** | Groq · Gemini · Claude | User-provided keys, client-side calls |
| 📤 **Export** | GEDCOM 5.5.1 + html2pdf | Standard genealogy format + PDF |

</div>

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 20
- Cloudflare account (free tier OK)
- `wrangler` CLI: `npm i -g wrangler`

### 1️⃣ Clone & Install

```bash
git clone https://github.com/mshadianto/nasab.git
cd nasab/frontend && npm install
```

### 2️⃣ Setup D1 Database

```bash
cd ../api
npx wrangler d1 create nasab-db
# Update database_id di wrangler.jsonc dengan ID yang dikembalikan
npx wrangler d1 execute nasab-db --remote --file=../schema.sql
```

### 3️⃣ Set Secrets

```bash
npx wrangler secret put TOKEN_SECRET           # openssl rand -hex 32
npx wrangler secret put NIK_ENCRYPTION_KEY     # openssl rand -hex 16
```

### 4️⃣ Deploy

```bash
# Backend API
npx wrangler deploy

# Frontend (dari root)
cd ../frontend && npm run build
npx wrangler pages deploy dist --project-name=nasab --branch=main

# Atau pakai deploy script:
bash deploy.sh
```

🎉 **Live di** `https://your-project.pages.dev`

---

## 📡 API Reference

API base: `https://nasab-api.<your-subdomain>.workers.dev`

<details>
<summary><b>🔐 Auth</b></summary>

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | – | Register (rate-limited, pattern-validated) |
| `POST` | `/api/auth/login` | – | Login, returns Bearer token (rate-limited) |
| `POST` | `/api/auth/reset-password` | – | Reset by name verification |
| `GET` | `/api/auth/me` | ✅ | Current user info |

</details>

<details>
<summary><b>👨‍👩‍👧‍👦 Families & Members</b></summary>

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/families` | ✅ | List user's families (single JOIN, no N+1) |
| `POST` | `/api/families` | ✅ | Create family (rate-limited, pattern-validated) |
| `GET` | `/api/families/:id` | ✅ | Detail + members + marriages (parallel) |
| `POST` | `/api/families/:id/members` | ✅ | Add member |
| `PUT` | `/api/families/:id/members/:mid` | ✅ | Update member |
| `DELETE` | `/api/families/:id/members/:mid` | ✅ | Delete (blocked if has children) |
| `DELETE` | `/api/families/:id/members/all` | Owner | Delete all + marriages + positions |
| `POST` | `/api/families/:id/marriages` | ✅ | Add marriage (polygamy support) |
| `DELETE` | `/api/families/:id/marriages/:mid` | ✅ | Delete marriage |

</details>

<details>
<summary><b>📖 Biographies & Stories</b></summary>

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/families/:id/biography` | ✅ | Save/upsert (returns slug) |
| `GET` | `/api/biography/:slug` | – | **Public** biography page |
| `POST` | `/api/families/:id/stories` | ✅ | Add story |
| `DELETE` | `/api/families/:id/stories/:sid` | ✅ | Delete story |

</details>

<details>
<summary><b>📅 Events & RSVP</b></summary>

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/families/:id/events` | Editor+ | Create event |
| `GET` | `/api/families/:id/events` | ✅ | List events |
| `PUT` | `/api/families/:id/events/:eid` | Editor+ | Update event |
| `DELETE` | `/api/families/:id/events/:eid` | Editor+ | Delete event + RSVPs |
| `POST` | `/api/events/:eid/rsvp` | – | RSVP (auth or guest) |
| `GET` | `/api/events/public/:slug` | – | **Public** invitation page |

</details>

<details>
<summary><b>💬 Feed, Posts & Comments</b></summary>

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/families/:id/feed` | ✅ | Feed dengan posts + comments + likes |
| `POST` | `/api/families/:id/posts` | ✅ | Create post |
| `DELETE` | `/api/families/:id/posts/:pid` | Author | Delete post |
| `POST` | `/api/posts/:pid/like` | ✅ | Toggle like |
| `POST` | `/api/posts/:pid/comments` | ✅ | Add comment |
| `DELETE` | `/api/comments/:cid` | Author | Delete comment |

</details>

<details>
<summary><b>🛡️ Admin & Public</b></summary>

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/stats` | Admin | Platform statistics |
| `GET` | `/api/admin/users` | Admin | List all users |
| `PUT` | `/api/admin/users/:id/role` | Admin | Change role |
| `DELETE` | `/api/admin/users/:id` | Super | Delete user |
| `GET` | `/api/admin/families` | Admin | List all families |
| `POST` | `/api/admin/migrate-nik` | Super | One-time NIK encryption |
| `GET` | `/api/admin/audit` | Admin | Audit logs (filterable) |
| `GET` | `/api/public/stats` | – | **Public** aggregate counts |
| `GET` | `/api/health` | – | Health check |

</details>

---

## 💾 Database Schema

**Database:** `nasab-db` · **15 tables** · Full `ON DELETE CASCADE`

```
users ─┐
       ├── families ─┬── family_collaborators
       │             ├── members (nik AES-GCM, agama, no_kk)
       │             ├── marriages (husband, wife, order)
       │             ├── canvas_positions
       │             ├── stories
       │             ├── invites
       │             ├── biographies (public via slug)
       │             ├── events ─── event_rsvps
       │             └── posts ──┬── post_comments
       │                         └── post_likes
       └── audit_logs (immutable trail)
```

Lihat [`schema.sql`](schema.sql) untuk DDL lengkap dengan indexes.

---

## 📁 Project Structure

```
nasab/
├── 📂 api/                      # Cloudflare Worker
│   ├── src/index.js             # Single-file REST API (~700 lines)
│   ├── wrangler.jsonc           # D1 + rate-limit bindings
│   └── test-token-dualkey.mjs   # Auth signature unit tests
│
├── 📂 frontend/                 # React SPA
│   ├── nasab.jsx                # Production build (API-connected)
│   ├── index.html               # Entry + PWA meta
│   ├── vite.config.js           # Vite + Tailwind v4 plugin
│   ├── package.json             # React 19 + Vite 6
│   └── src/
│       ├── LandingPage.jsx      # Public landing
│       ├── main.jsx             # App mount
│       ├── index.css            # Tailwind base
│       └── public/
│           ├── manifest.json
│           ├── sw.js            # Service worker
│           └── icons/icon.svg
│
├── 📂 docs/prompts/             # Work-order docs (15 files)
├── 📂 backup/                   # DB backups (gitignored)
│
├── 📜 nasab.jsx                 # Claude artifact variant (offline)
├── 📜 schema.sql                # D1 schema + migrations
├── 📜 deploy.sh                 # One-command deploy
├── 📜 MANUAL.md                 # User manual (18 chapters)
├── 📜 CLAUDE.md                 # Claude Code instructions
└── 📜 README.md                 # ← You are here
```

---

## 🗺️ Roadmap

### ✅ Shipped (v8.1.0)
- Hybrid avatar canvas + bezier connectors + auto-fit
- POV navigation MyHeritage-style
- Triple AI provider abstraction
- NIK encryption + dual-key auth migration
- Onboarding wizard + milestone notifications
- Bottom nav mobile + responsive 320px

### 🚧 In Progress
- Foto profile member (schema ready, UI pending)
- Hash-to-color avatar untuk disambiguation
- Branch highlight on hover

### 🔮 Planned
- Cloudflare Turnstile di register form
- Email verification gate
- WhatsApp share + invite
- Multi-language (English, Arabic)
- Family timeline visualization
- Audio recording untuk family stories

---

## 🤝 Contributing

NASAB dikembangkan untuk komunitas Indonesia. Kontribusi diterima untuk:
- 🐛 Bug fixes
- 🌍 Localization (Indonesian variants, regional languages)
- 🎨 UI improvements & accessibility
- 📖 Documentation
- 🧪 Test coverage

```bash
# Fork → clone → branch
git checkout -b feat/nama-fitur
# Develop, test, commit
git commit -m "feat: deskripsi"
# Push → buka Pull Request
```

---

## 📜 License

MIT License — Lihat [`LICENSE`](LICENSE) untuk detail.

---

<div align="center">

### 🌟 Built With Love For Indonesia

**[M Sopian Hadianto](https://github.com/mshadianto)** · GRC Expert & AI-Powered Builder  
Powered by **Labbaik AI**

> *"Kenalilah nasab kalian, niscaya kalian dapat menyambung silaturahim."*

[⬆️ Back to top](#)

</div>
