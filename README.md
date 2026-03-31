# NASAB — Jaga Nasabmu
## Modern Family Tree SaaS Platform for Indonesia

### Architecture

```
┌──────────────────────────────────────────────────┐
│                    NASAB v5.0                     │
├──────────────┬───────────────────────────────────┤
│   Frontend   │        Backend API                │
│  React 19    │   Cloudflare Workers              │
│  Vite SPA    │   (api/src/index.js)              │
│              │        │                          │
│  Two modes:  │   ┌────┴────┐                     │
│  • Artifact  │   │  D1 DB  │  ← nasab-db         │
│    (offline) │   └─────────┘                     │
│  • API mode  │   7 tables + 6 indexes            │
│    (online)  │                                   │
│              │   Auth: JWT-like tokens            │
│  Built with  │   RBAC: owner > editor > viewer   │
│  Vite        │   Platform: super_admin > admin   │
└──────────────┴───────────────────────────────────┘
```

### Project Structure

```
nasab/
├── api/
│   ├── src/index.js        # Cloudflare Worker (full REST API, ~345 lines)
│   └── wrangler.jsonc      # Wrangler config with D1 binding
├── frontend/
│   ├── nasab.jsx           # React SPA (API-connected, production)
│   ├── index.html          # Entry point
│   ├── vite.config.js      # Vite config
│   └── package.json        # React 19 + Vite 6
├── nasab.jsx               # React SPA (Claude artifact version, offline)
├── schema.sql              # D1 database schema
├── deploy.sh               # One-command deploy script
└── README.md
```

### Quick Start

#### Deploy API (Cloudflare Worker)

```bash
cd api/
npx wrangler login          # One-time: login to Cloudflare
npx wrangler deploy          # Deploy Worker with D1 binding
```

Or use the deploy script:
```bash
bash deploy.sh              # Login + deploy + health check
```

API: `https://nasab-api.sopian-hadianto.workers.dev`

#### Frontend Development

```bash
cd frontend/
npm install
npm run dev                  # Vite dev server
npm run build                # Build to dist/
```

#### Frontend Deployment Options

**Option A — Claude.ai Artifact**
Use the root `nasab.jsx` as a React artifact in Claude.ai. Runs offline with local storage.

**Option B — Vite SPA (production)**
The `frontend/` directory builds a standalone SPA that connects to the API.

**Option C — Cloudflare Pages**
```bash
cd frontend && npm run build
npx wrangler pages deploy ./dist
```

### API Reference

#### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login, returns token |
| POST | `/api/auth/reset-password` | No | Reset password (verify by name) |
| GET | `/api/auth/me` | Yes | Get current user |

#### Families

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/families` | Yes | List user's families |
| POST | `/api/families` | Yes | Create new family |
| GET | `/api/families/:id` | Yes | Get family detail + members |

#### Members

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/families/:id/members` | Yes | Add member |
| PUT | `/api/families/:id/members/:mid` | Yes | Update member |
| DELETE | `/api/families/:id/members/:mid` | Yes | Delete member (blocked if has children) |

#### Canvas & Stories

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| PUT | `/api/families/:id/positions` | Yes | Save canvas positions |
| POST | `/api/families/:id/stories` | Yes | Add story |
| DELETE | `/api/families/:id/stories/:sid` | Yes | Delete story |

#### Collaboration

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/families/:id/invite` | Yes | Invite collaborator (owner only) |

#### Admin (requires admin/super_admin role)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/stats` | Admin | Platform statistics |
| GET | `/api/admin/users` | Admin | List all users |
| PUT | `/api/admin/users/:id/role` | Admin | Change user role |
| DELETE | `/api/admin/users/:id` | Super | Delete user |
| GET | `/api/admin/families` | Admin | List all families |

#### Utility

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | Health check |

### D1 Database

**Name:** `nasab-db`
**Database ID:** `745e2555-b659-4eb7-bc60-5a705eb6a15a`

Tables: users, families, family_collaborators, members (+ nik column), stories, invites, canvas_positions

### Auth Flow
1. Register/Login → receive token
2. Include `Authorization: Bearer <token>` in all requests
3. Family RBAC: Owner > Editor > Viewer per family workspace
4. Platform roles: Super Admin > Admin > User (for admin endpoints)

### 17 Verified Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | Drag & Drop Canvas | Cards bisa di-drag, posisi tersimpan |
| 2 | Auto-Connectors SVG | Parent→child + spouse (NIKAH label) |
| 3 | Generation Lanes | Kakek → Ayah → Anak → Cucu → Cicit → Canggah |
| 4 | Pan + Zoom + Scroll | Mouse wheel zoom, grab to pan |
| 5 | Minimap | Overview kiri bawah |
| 6 | Geotagging + Leaflet | Dark map, geocoding OpenStreetMap |
| 7 | Kalkulator Faraidh | Full hukum waris Islam, auto-deteksi ahli waris dari silsilah |
| 8 | NIK Intelligence | Auto-fill gender, tanggal lahir, provinsi, geotag dari NIK |
| 9 | Relationship Finder | BFS pathfinding |
| 10 | Birthday Tracker | 90 hari ke depan |
| 11 | Family Stories | Journal/legacy |
| 12 | Analytics | Distribusi generasi + lokasi |
| 13 | Auth + Multi-tenant | Register/Login, workspace per keluarga |
| 14 | Share + RBAC | Owner/Editor/Viewer, invite via email |
| 15 | Advanced Filters | Gender × Gen × Status × Lokasi × NIK |
| 16 | Import/Export JSON | Backup & restore |
| 17 | NIK Validation + Masking | Privacy — masked display, klik untuk toggle |

### Built By
M Sopian Hadianto — GRC Expert & AI-Powered Builder
Labbaik AI
