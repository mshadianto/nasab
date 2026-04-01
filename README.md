# NASAB — Jaga Nasabmu
## Modern Family Tree SaaS Platform for Indonesia

**Live:** https://nasab.biz.id | **Version:** 7.0.0

### Architecture

```
┌──────────────────────────────────────────────────┐
│                  NASAB v7.0.0                    │
├──────────────┬───────────────────────────────────┤
│   Frontend   │        Backend API                │
│  React 19    │   Cloudflare Workers              │
│  Vite + PWA  │   (api/src/index.js)              │
│              │        │                          │
│  Two modes:  │   ┌────┴────┐                     │
│  • nasab.    │   │  D1 DB  │  ← nasab-db         │
│    biz.id    │   └─────────┘                     │
│  • Claude    │   8 tables + 9 indexes            │
│    artifact  │                                   │
│              │   Auth: JWT-like tokens            │
│  Dark/Light  │   RBAC: owner > editor > viewer   │
│  theme       │   Platform: super_admin > admin   │
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

#### Admin + Utility

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/stats` | Admin | Platform statistics |
| GET | `/api/admin/users` | Admin | List all users |
| PUT | `/api/admin/users/:id/role` | Admin | Change user role |
| DELETE | `/api/admin/users/:id` | Super | Delete user |
| GET | `/api/admin/families` | Admin | List all families |
| GET | `/api/health` | No | Health check |

### D1 Database

**Name:** `nasab-db` | **ID:** `745e2555-b659-4eb7-bc60-5a705eb6a15a`

Tables: users, families, family_collaborators, members (nik, agama, no_kk), stories, invites, canvas_positions, marriages

### 28 Verified Features

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
| 14 | Share + RBAC | Owner/Editor/Viewer, invite via email |
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

### Built By
M Sopian Hadianto — GRC Expert & AI-Powered Builder
Labbaik AI
