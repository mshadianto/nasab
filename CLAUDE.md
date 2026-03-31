# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NASAB ("Jaga Nasabmu") is a family tree SaaS platform for Indonesia. It has two independent parts: a Cloudflare Worker API with D1 database, and a React SPA frontend built with Vite. Live at https://nasab.biz.id.

## Architecture

**Backend** (`api/src/index.js`): Single-file Cloudflare Worker. Manual routing via `url.pathname` string matching and regex — no framework. D1 database bound as `env.DB`. Auth uses a custom JWT-like token scheme (base64 payload + SHA-256 signature). Two levels of access control:
- **Platform roles** on `users` table: `super_admin > admin > user`. Checked via `isAdmin()` / `isSuperAdmin()` helpers.
- **Family RBAC** via `family_collaborators` table: `owner > editor > viewer`. Super admins bypass family-level checks.
All error messages are in Indonesian (Bahasa). All DB queries for family detail are parallelized with `Promise.all()`. Families list uses single JOIN query (no N+1).

**Frontend** — two variants of the same SPA, **not identical**:
- `frontend/nasab.jsx` — **Production build** with API layer. Connects to `https://nasab-api.sopian-hadianto.workers.dev`. Hosted at `https://nasab.biz.id`. Uses `localStorage` for token storage. Built with Vite + React 19 (`frontend/package.json`). Version injected at build time via Vite `define`.
- `nasab.jsx` (root) — **Claude artifact version**. Uses `window.storage` API (Claude artifact sandbox) instead of a real backend. Self-contained, no API calls.

Key internal modules (shared by both variants):
- `FE` (Family Engine) — tree traversal, multi-spouse support via `FE.spouses(pp,p,marriages)`, relationship finder (BFS), stats, search. Variables: `ch`=children, `sp`=spouse(primary), `pa`=parent, `sib`=siblings, `mrs`=marriages
- `NIK` — parse/validate/mask Indonesian national ID (16 digit), auto-fill gender/birthDate/province/geotag from 34 provinces
- `FARAIDH` — Islamic inheritance calculator with fardh/asabah/awl, religion-based heir blocking, wasiat wajibah (max 1/3)
- `GEDCOM` — bidirectional GEDCOM 5.5.1 converter (toGedcom/fromGedcom)
- Canvas: `CW=150, CH=80` (card size), `GX=24, GY=100` (grid spacing). Glassmorphism cards, curved bezier SVG connectors, smart labels, pinch-to-zoom, zoom-to-cursor, double-tap zoom, comfort view centered on root
- Views: canvas, map, list, stats, timeline, insights
- Theme: dark/light via `data-theme` attribute + CSS variables, persisted in localStorage
- PWA: manifest.json, service worker (sw.js) with cache versioning (bump `CACHE` in sw.js on deploy)

**Database** (`schema.sql`): 8 tables in Cloudflare D1 — users, families, family_collaborators, members (nik, agama columns), stories, invites, canvas_positions, **marriages** (husband_id, wife_id, marriage_order for polygamy). 9 indexes. Members link via `parent_id` and `spouse_id` (backward-compatible). Multiple spouses tracked via `marriages` table.

## Commands

### Deploy API
```bash
cd api && npx wrangler deploy
```

### Full deploy (login + deploy + health check)
```bash
bash deploy.sh
```

### Local API development
```bash
cd api && npx wrangler dev
```

### Frontend development
```bash
cd frontend && npm run dev    # Vite dev server
cd frontend && npm run build  # Production build to frontend/dist/
```

### Deploy frontend to Cloudflare Pages
```bash
cd frontend && npm run build && npx wrangler pages deploy dist --project-name=nasab --branch=main --commit-dirty=true
```

### Database operations
```bash
# Run schema migrations (from api/ directory)
npx wrangler d1 execute nasab-db --remote --file=../schema.sql

# Query database directly
npx wrangler d1 execute nasab-db --remote --command="SELECT * FROM users"
```

## Key Design Decisions

- The Worker API has no dependencies — pure Web API standards (Request/Response, crypto.subtle, TextEncoder)
- Password hashing uses SHA-256 with a hardcoded salt (`nasab-salt-2026`), not bcrypt
- Token secret is hardcoded (`nasab-secret`); tokens expire after 30 days
- CORS is fully open (`Access-Control-Allow-Origin: *`)
- ID generation uses timestamp+random: `Date.now().toString(36)_random` with prefixes (`u_`, `f_`, `p_`, `s_`, `m_`)
- Member deletion is blocked if the member has children (referential integrity enforced in application code)
- Spouse relationships: `spouse_id` for primary/backward-compat, `marriages` table for polygamy (multiple wives)
- Admin endpoints (`/api/admin/*`) require platform-level admin/super_admin role, not family RBAC
- Fonts and Leaflet CSS loaded via `<link rel="preload">` (non-blocking), not CSS `@import`
- Service worker cache version must be bumped (in `frontend/public/sw.js`) on each deploy to invalidate stale assets
- Wrangler config is in `wrangler.jsonc` (JSON with comments)
- Dashboard prefetches full family data on hover for instant workspace open
