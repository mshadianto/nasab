<p align="center">
  <img src="https://img.shields.io/badge/version-7.0.0-blue?style=for-the-badge" alt="Version 7.0.0"/>
  <img src="https://img.shields.io/badge/platform-Cloudflare-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Cloudflare"/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19"/>
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/PWA-ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA"/>
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="MIT License"/>
</p>

<h1 align="center">
  <br/>
  <sub><sup>&#127795;</sup></sub> NASAB
  <br/>
  <sub><em>Jaga Nasabmu</em></sub>
</h1>

<p align="center">
  <strong>Platform Silsilah Keluarga Modern untuk Indonesia</strong><br/>
  Bangun, kelola, dan bagikan pohon keluarga dengan fitur lengkap — dari NIK Intelligence hingga Kalkulator Waris Islam.
</p>

<p align="center">
  <a href="https://nasab.biz.id"><img src="https://img.shields.io/badge/%F0%9F%8C%90_LIVE_DEMO-nasab.biz.id-00C853?style=for-the-badge" alt="Live Demo"/></a>
</p>

---

## Highlights

```
  28 Fitur   ·   8 Tabel D1   ·   Zero Dependencies (API)   ·   PWA Offline-Ready
```

<table>
<tr>
<td width="50%">

### Frontend
- **React 19** + **Vite 6** SPA
- Canvas drag-drop dengan kartu glassmorphism
- SVG connectors curved bezier + smart labels
- Pan, zoom, pinch-to-zoom, double-tap
- Minimap frosted glass
- Dark / Light theme
- PWA installable + offline

</td>
<td width="50%">

### Backend
- **Cloudflare Workers** — zero cold start
- **D1 Database** — edge SQL
- Custom JWT-like auth (SHA-256)
- Platform RBAC: `super_admin > admin > user`
- Family RBAC: `owner > editor > viewer`
- Semua response dalam **Bahasa Indonesia**
- No framework, no dependencies

</td>
</tr>
</table>

---

## Arsitektur

```
                          ┌─────────────────────────┐
                          │      nasab.biz.id        │
                          │   React 19 + Vite PWA    │
                          └────────────┬────────────┘
                                       │ HTTPS
                                       ▼
                          ┌─────────────────────────┐
                          │   Cloudflare Workers     │
                          │   api/src/index.js       │
                          │   (zero dependencies)    │
                          └────────────┬────────────┘
                                       │
                          ┌────────────▼────────────┐
                          │    Cloudflare D1         │
                          │    8 tables · 9 indexes  │
                          └─────────────────────────┘
```

---

## 28 Fitur Terverifikasi

| # | Fitur | Deskripsi |
|:-:|-------|-----------|
| 1 | **Drag & Drop Canvas** | Kartu glassmorphism, posisi tersimpan per keluarga |
| 2 | **Smart SVG Connectors** | Curved bezier, badge NIKAH, label anak/cucu, warna gender |
| 3 | **Generation Lanes** | Kakek → Ayah → Anak → Cucu → Cicit → Canggah |
| 4 | **Pan + Zoom + Pinch** | Zoom-to-cursor, pinch-to-zoom, double-tap zoom |
| 5 | **Minimap** | Overview frosted glass di kiri bawah |
| 6 | **Geotagging + Leaflet** | Peta dark/light, geocoding OSM, 34 provinsi |
| 7 | **Kalkulator Faraidh** | Waris Islam — fardh, asabah, awl, wasiat wajibah (KHI Pasal 209) |
| 8 | **NIK Intelligence** | Auto-fill gender, tanggal lahir, provinsi, geotag dari 16 digit NIK |
| 9 | **Relationship Finder** | BFS pathfinding antar anggota keluarga |
| 10 | **Birthday Tracker** | Reminder 90 hari ke depan |
| 11 | **Family Stories** | Jurnal & legacy per anggota |
| 12 | **Analytics** | Distribusi generasi, lokasi, fakta menarik |
| 13 | **Auth + Multi-tenant** | Register/Login/Reset Password, workspace per keluarga |
| 14 | **Share + RBAC** | Owner/Editor/Viewer, invite via email |
| 15 | **Advanced Filters** | Gender × Generasi × Status × Lokasi × NIK × Provinsi |
| 16 | **Import/Export JSON** | Backup & restore lengkap dengan progress bar |
| 17 | **Import/Export GEDCOM** | GEDCOM 5.5.1, 2-phase import, duplikat auto-skip |
| 18 | **NIK Masking** | Privacy — masked display, klik untuk toggle |
| 19 | **Agama + Penghalang Waris** | 7 agama, auto-detect beda agama di Faraidh |
| 20 | **Poligami** | Tabel marriages, multi-spouse layout, badge NIKAH #1/#2/#3 |
| 21 | **Dark / Light Theme** | Toggle tema dengan localStorage persistence |
| 22 | **PWA** | Installable, offline-capable, service worker caching |
| 23 | **Import Kartu Keluarga** | Input manual + OCR foto via Claude Vision API |
| 24 | **Pola Migrasi** | Analisis merantau — NIK provinsi vs domisili |
| 25 | **Filter Provinsi Asal** | Dropdown provinsi dari NIK |
| 26 | **Expand / Collapse** | Toggle sub-tree, auto-collapse gen ≥2, badge +N keturunan |
| 27 | **Bulk Delete** | Multi-select di list view, hapus massal (skip yg punya anak) |
| 28 | **Canvas Search** | Floating search, auto-pan/zoom ke node, highlight pulse |

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`npm i -g wrangler`)

### Development

```bash
# Clone
git clone https://github.com/mshadianto/nasab.git
cd nasab

# API lokal
cd api && npx wrangler dev

# Frontend lokal (terminal terpisah)
cd frontend && npm install && npm run dev
```

### Deploy

```bash
# One-command deploy (login + deploy + health check)
bash deploy.sh

# Atau manual:
cd api && npx wrangler deploy                                          # API
cd frontend && npm run build && npx wrangler pages deploy dist \
  --project-name=nasab --branch=main --commit-dirty=true               # Frontend
```

### Database

```bash
cd api

# Jalankan schema migrations
npx wrangler d1 execute nasab-db --remote --file=../schema.sql

# Query langsung
npx wrangler d1 execute nasab-db --remote --command="SELECT count(*) FROM users"
```

---

## Struktur Proyek

```
nasab/
├── api/
│   ├── src/index.js          # Cloudflare Worker — full REST API
│   └── wrangler.jsonc        # Config + D1 binding
├── frontend/
│   ├── nasab.jsx             # React SPA (production, API-connected)
│   ├── index.html            # Entry point + PWA meta
│   ├── vite.config.js        # Vite config
│   ├── package.json          # React 19 + Vite 6
│   └── public/
│       ├── manifest.json     # PWA manifest
│       ├── sw.js             # Service worker
│       └── icons/            # App icons
├── nasab.jsx                 # Claude artifact version (offline, standalone)
├── schema.sql                # D1 database schema
├── deploy.sh                 # One-command deploy script
├── MANUAL.md                 # User manual (18 bab)
└── CLAUDE.md                 # Claude Code instructions
```

---

## API Endpoints

<details>
<summary><strong>Auth</strong></summary>

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|:----:|-----------|
| POST | `/api/auth/register` | - | Registrasi user baru |
| POST | `/api/auth/login` | - | Login, return token |
| POST | `/api/auth/reset-password` | - | Reset password (verifikasi nama) |
| GET | `/api/auth/me` | Ya | Profil user saat ini |

</details>

<details>
<summary><strong>Families</strong></summary>

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|:----:|-----------|
| GET | `/api/families` | Ya | List keluarga user (single JOIN) |
| POST | `/api/families` | Ya | Buat keluarga baru |
| GET | `/api/families/:id` | Ya | Detail keluarga + members + marriages |

</details>

<details>
<summary><strong>Members</strong></summary>

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|:----:|-----------|
| POST | `/api/families/:id/members` | Ya | Tambah anggota |
| PUT | `/api/families/:id/members/:mid` | Ya | Update anggota |
| DELETE | `/api/families/:id/members/:mid` | Ya | Hapus anggota (blocked jika punya anak) |

</details>

<details>
<summary><strong>Marriages</strong></summary>

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|:----:|-----------|
| POST | `/api/families/:id/marriages` | Ya | Tambah pernikahan |
| DELETE | `/api/families/:id/marriages/:mid` | Ya | Hapus pernikahan |

</details>

<details>
<summary><strong>Canvas, Stories & Collaboration</strong></summary>

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|:----:|-----------|
| PUT | `/api/families/:id/positions` | Ya | Simpan posisi canvas |
| POST | `/api/families/:id/stories` | Ya | Tambah story |
| DELETE | `/api/families/:id/stories/:sid` | Ya | Hapus story |
| POST | `/api/families/:id/invite` | Ya | Invite kolaborator (owner only) |

</details>

<details>
<summary><strong>Admin</strong></summary>

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|:----:|-----------|
| GET | `/api/admin/stats` | Admin | Statistik platform |
| GET | `/api/admin/users` | Admin | List semua user |
| PUT | `/api/admin/users/:id/role` | Admin | Ubah role user |
| DELETE | `/api/admin/users/:id` | Super | Hapus user |
| GET | `/api/admin/families` | Admin | List semua keluarga |
| GET | `/api/health` | - | Health check |

</details>

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | React 19, Vite 6, Leaflet, Canvas API |
| Backend | Cloudflare Workers (zero dependencies) |
| Database | Cloudflare D1 (SQLite edge) |
| Auth | Custom JWT-like (SHA-256 + base64) |
| Hosting | Cloudflare Pages + Workers |
| Maps | OpenStreetMap + Leaflet |
| OCR | Claude Vision API (opsional, untuk KK) |

---

## Views

| View | Fungsi |
|------|--------|
| **Canvas** | Pohon keluarga visual dengan drag-drop |
| **Map** | Peta sebaran anggota keluarga |
| **List** | Tabel anggota + bulk operations |
| **Stats** | Statistik & distribusi |
| **Timeline** | Kronologi keluarga |
| **Insights** | Relationship finder, birthday tracker, migrasi |

---

<p align="center">
  <sub>Dibangun oleh <strong>M Sopian Hadianto</strong> — GRC Expert & AI-Powered Builder</sub><br/>
  <sub>Powered by <strong>Labbaik AI</strong></sub>
</p>
