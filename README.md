# NASAB — Jaga Nasabmu
## Modern Family Tree SaaS Platform for Indonesia

**Live:** https://nasab.biz.id | **Version:** 8.1.0

### Architecture

```
┌──────────────────────────────────────────────────┐
│                  NASAB v8.1.0                    │
├──────────────┬───────────────────────────────────┤
│   Frontend   │        Backend API                │
│  React 19    │   Cloudflare Workers              │
│  Vite + PWA  │   (api/src/index.js)              │
│              │        │                          │
│  Two modes:  │   ┌────┴────┐                     │
│  • nasab.    │   │  D1 DB  │  ← nasab-db         │
│    biz.id    │   └─────────┘                     │
│  • Claude    │   15 tables + indexes              │
│    artifact  │                                   │
│              │   Auth: JWT-like tokens            │
│  Dark/Light  │   RBAC: owner > editor > viewer   │
│  theme       │   Platform: super_admin > admin   │
│              │   NIK: AES-GCM encrypted at rest  │
│              │   CORS: restricted origins         │
└──────────────┴───────────────────────────────────┘
```

### Project Structure

```
nasab/
├── api/
│   ├── src/index.js        # Cloudflare Worker (full REST API)
│   └── wrangler.jsonc      # Wrangler config with D1 binding
├── frontend/
│   ├── nasab.jsx           # React SPA (production, API-connected)
│   ├── index.html          # Entry point + PWA meta tags
│   ├── vite.config.js      # Vite config (dynamic version inject)
│   ├── package.json        # React 19 + Vite 6
│   ├── src/main.jsx        # App mount
│   └── public/
│       ├── manifest.json   # PWA manifest
│       ├── sw.js           # Service worker (caching strategies)
│       └── icons/icon.svg  # App icon
├── nasab.jsx               # React SPA (Claude artifact, offline)
├── schema.sql              # D1 database schema + migrations
├── deploy.sh               # One-command deploy script
├── MANUAL.md               # User manual (18 chapters)
├── CLAUDE.md               # Claude Code instructions
└── README.md
```

### Quick Start

```bash
# Deploy API
cd api && npx wrangler deploy

# Build & deploy frontend
cd frontend && npm run build
npx wrangler pages deploy ./dist --project-name=nasab

# Or full deploy
bash deploy.sh
```

Frontend: `https://nasab.biz.id`
API: `https://nasab-api.sopian-hadianto.workers.dev`

### API Reference

#### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user (trimmed inputs) |
| POST | `/api/auth/login` | No | Login, returns token (trimmed inputs) |
| POST | `/api/auth/reset-password` | No | Reset password (verify by name) |
| GET | `/api/auth/me` | Yes | Get current user |

#### Families

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/families` | Yes | List user's families (single JOIN, no N+1) |
| POST | `/api/families` | Yes | Create new family |
| GET | `/api/families/:id` | Yes | Get family detail + members + marriages (parallelized) |

#### Members

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/families/:id/members` | Yes | Add member (nik, agama, no_kk) |
| PUT | `/api/families/:id/members/:mid` | Yes | Update member |
| DELETE | `/api/families/:id/members/:mid` | Yes | Delete member (blocked if has children) |
| DELETE | `/api/families/:id/members/all` | Yes | Delete ALL members + marriages + positions (owner only) |

#### Marriages (Polygamy)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/families/:id/marriages` | Yes | Add marriage (husband, wife, order) |
| DELETE | `/api/families/:id/marriages/:mid` | Yes | Delete marriage |

#### Canvas, Stories & Collaboration

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| PUT | `/api/families/:id/positions` | Yes | Save canvas positions |
| POST | `/api/families/:id/stories` | Yes | Add story |
| DELETE | `/api/families/:id/stories/:sid` | Yes | Delete story |
| POST | `/api/families/:id/invite` | Yes | Invite collaborator (owner only) |

#### Biographies

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/families/:id/biography` | Yes | Save/upsert biography (returns slug) |
| GET | `/api/biography/:slug` | No | Public biography page |

#### Events

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/families/:id/events` | Yes | Create event (editor+) |
| GET | `/api/families/:id/events` | Yes | List events for family |
| PUT | `/api/families/:id/events/:eid` | Yes | Update event (editor+) |
| DELETE | `/api/families/:id/events/:eid` | Yes | Delete event + RSVPs (editor+) |
| POST | `/api/events/:eid/rsvp` | Optional | RSVP (auth or guest name) |
| GET | `/api/events/public/:slug` | No | Public invitation page |

#### Feed & Posts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/families/:id/feed` | Yes | Feed with posts, comments, likes |
| POST | `/api/families/:id/posts` | Yes | Create post (editor+) |
| DELETE | `/api/families/:id/posts/:pid` | Yes | Delete post (author/owner) |
| POST | `/api/posts/:pid/like` | Yes | Toggle like |
| POST | `/api/posts/:pid/comments` | Yes | Add comment |
| DELETE | `/api/comments/:cid` | Yes | Delete comment (author) |

#### Admin + Utility

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/stats` | Admin | Platform statistics |
| GET | `/api/admin/users` | Admin | List all users |
| PUT | `/api/admin/users/:id/role` | Admin | Change user role |
| DELETE | `/api/admin/users/:id` | Super | Delete user |
| GET | `/api/admin/families` | Admin | List all families |
| POST | `/api/admin/migrate-nik` | Super | Encrypt plaintext NIK/no_kk (one-time) |
| GET | `/api/admin/audit` | Admin | Audit logs (filter: family_id, action, severity, from, to) |
| GET | `/api/public/stats` | No | Aggregate counts (users, families, members) — used by landing page |
| GET | `/api/health` | No | Health check |

### D1 Database

**Name:** `nasab-db` | **ID:** `745e2555-b659-4eb7-bc60-5a705eb6a15a`

Tables: users, families, family_collaborators, members (nik, agama, no_kk — encrypted), stories, invites, canvas_positions, marriages, biographies, events, event_rsvps, posts, post_comments, post_likes, audit_logs

### 53 Verified Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | Drag & Drop Canvas | Glassmorphism cards, posisi tersimpan |
| 2 | Smart Connectors SVG | Curved bezier, NIKAH badge, label "6 Anak"/"3 Cucu", gender-colored |
| 3 | Generation Lanes | Kakek → Ayah → Anak → Cucu → Cicit → Canggah |
| 4 | Pan + Zoom + Pinch | Zoom-to-cursor, pinch-to-zoom, double-tap zoom |
| 5 | Minimap | Frosted glass overview kiri bawah |
| 6 | Geotagging + Leaflet | Dark/light map, geocoding OpenStreetMap, 34 provinsi |
| 7 | Kalkulator Faraidh | Hukum waris Islam + wasiat wajibah (KHI Pasal 209) |
| 8 | NIK Intelligence | Auto-fill gender, tanggal lahir, provinsi, geotag dari NIK |
| 9 | Relationship Finder | BFS pathfinding antar anggota |
| 10 | Birthday Tracker | 90 hari ke depan |
| 11 | Family Stories | Journal/legacy per anggota |
| 12 | Analytics | Distribusi generasi + lokasi + fakta |
| 13 | Auth + Multi-tenant | Register/Login/Lupa Password, workspace per keluarga |
| 14 | Share + RBAC | Owner/Editor/Viewer, invite via email. Viewer bisa input cerita, posting, acara, komentar. Editor+ untuk CRUD member & import |
| 15 | Advanced Filters | Gender × Gen × Status × Lokasi × NIK × Provinsi Asal |
| 16 | Import/Export JSON | Backup & restore + file picker + progress bar |
| 17 | Import/Export GEDCOM | 2-phase import (individu → relasi), duplikat auto-skip |
| 18 | NIK Validation + Masking | Privacy — masked display, klik toggle |
| 19 | Agama + Penghalang Waris | 7 agama, auto-detect beda agama di Faraidh |
| 20 | Poligami | Tabel marriages, multi-spouse layout, NIKAH #1/#2/#3 |
| 21 | Dark / Light Theme | Toggle tema dengan localStorage persistence |
| 22 | PWA | Installable, offline-capable, service worker caching |
| 23 | Import Kartu Keluarga | Input manual + OCR foto via Claude Vision API |
| 24 | Pola Migrasi | NIK provinsi vs domisili → analisis merantau di Insights |
| 25 | Filter Provinsi Asal | FilterBar dropdown dari NIK provinsi |
| 26 | Expand / Collapse | Toggle sub-tree, auto-collapse gen ≥2, badge +N keturunan |
| 27 | Bulk Delete | Multi-select di list view, hapus massal dengan skip anak |
| 28 | Canvas Search + Focus | Floating search, auto-pan/zoom ke node, highlight pulse |
| 29 | NIK Encryption | AES-GCM at rest, role-based decrypt (owner=full, editor=masked, viewer=hidden) |
| 30 | CORS Restricted | Origin whitelist (nasab.biz.id, localhost:5173), Vary: Origin |
| 31 | Kisah Keluarga (Bio) | Auto-generate biografi, AI writing (3 gaya), PDF export, public share link |
| 32 | Hapus Semua | Delete all members dengan konfirmasi ketik "HAPUS", owner only |
| 33 | Smart Canvas Layout | Bottom-up subtree width/height, top-down absolute positioning, handles 73+ members tanpa overlap |
| 34 | Spouse Descendant Count | Istri menampilkan keturunan suami via chAll/descAll |
| 35 | POV Tree Navigation | MyHeritage-style: hanya tampilkan blood relatives, pasangan jadi branch card 🔗, klik untuk switch POV, breadcrumb navigasi, dropdown pilih root, toggle POV/Full. Auto-root picks node with most total descendants (recursive `descAll`) with family-name tiebreaker — correctly picks patriarch/matriarch even when they have few direct children. Descendants traced via `bloodDescendants()` which includes children co-parented through a spouse (parent_id points to non-blood spouse) |
| 36 | Triple AI Provider | Groq (gratis, Llama 3), Gemini (gratis, Google), Claude (detail). callAI() abstraction, key per-provider di localStorage |
| 37 | Acara Keluarga | 10 tipe acara Indonesia (nikah, aqiqah, khitan, dll). CRUD, horizontal scroll cards, countdown |
| 38 | Undangan Digital | Public page #/undangan/:slug, 4 template CSS (classic/islamic/modern/festive), RSVP tanpa login, share WhatsApp |
| 39 | Family Feed | Posting (teks/pengumuman/milestone/kenangan), like, komentar inline, auto-feed birthday & event reminders |
| 40 | AI Suggest | Generate posting hangat dari data keluarga via Groq/Gemini/Claude |
| 41 | AI Settings | Panel pilih provider + input API key, settings tersimpan di localStorage |
| 42 | PBKDF2 Password | PBKDF2-SHA256, random salt, 100k iterations, auto-upgrade legacy hash on login |
| 43 | Audit Trail | Immutable audit_logs, severity levels (critical/warning/info), IP + UA tracking, admin viewer |
| 44 | Data Quality Checker | 8 validasi (age gap, NIK duplikat, posthumous birth, dll), AI analysis opsional |
| 45 | Faraidh Asset Distribution | 9 tipe aset, tabel input, deduction chain (hutang→wasiat→wakaf→zakat), breakdown per-ahli waris per-aset |
| 46 | AI Chatbot | Floating 💬 widget, tanya tentang data keluarga, context-aware dengan data member |
| 47 | Admin Audit Viewer | Tabel audit log dengan filter severity/action/family, severity badges |
| 48 | Onboarding Wizard | 3-step wizard saat family baru (nama+gender → pasangan → orang tua), batch-create members + marriages via API |
| 49 | Canvas Card Actions | Tombol + di setiap card canvas (editor+), popup menu: Orang Tua / Pasangan / Anak / Saudara, smart disable |
| 50 | Bottom Nav Bar | Fixed bottom navigation untuk mobile (≤768px), 5 tab: Pohon/Daftar/Peta/Kisah/Feed, glass effect + safe-area |
| 51 | Milestone Notification | Popup satu kali saat 5+ member (ajak buat Kisah AI) dan 15+ member (Faraidh + GEDCOM export) |
| 52 | Empty State | Tampilan helpful saat family kosong di Canvas/List view — tombol Tambah, Import KK, Import GEDCOM |
| 53 | Admin Family Health | Badge Kosong/Stale di admin families, filter dropdown, summary stats, tombol Bersihkan (disabled) |
| 54 | Landing Page Live Stats | Hero + stats section fetch real aggregate counts (users/families/members) from `/api/public/stats` on mount. Loading placeholder `…`, no hardcoded numbers. Bulletproof `.nasab-wrap` container (explicit `max-width`, `margin:auto`, `padding` with `!important`) overrides app-shell `*{padding:0}` reset that was misaligning content. Footer shows `Develop by: MS Hadianto · v{__APP_VERSION__} · © {year} Labbaik AI` (year dynamic) |

### Built By
Develop by: MS Hadianto · Labbaik AI
