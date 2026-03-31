# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NASAB ("Jaga Nasabmu") is a family tree SaaS platform for Indonesia. It has two independent parts: a Cloudflare Worker API with D1 database, and a React SPA frontend built with Vite.

## Architecture

**Backend** (`api/src/index.js`): Single-file Cloudflare Worker (~330 lines). Manual routing via `url.pathname` string matching and regex — no framework. D1 database bound as `env.DB`. Auth uses a custom JWT-like token scheme (base64 payload + SHA-256 signature). Two levels of access control:
- **Platform roles** on `users` table: `super_admin > admin > user`. Checked via `isAdmin()` / `isSuperAdmin()` helpers.
- **Family RBAC** via `family_collaborators` table: `owner > editor > viewer`. Super admins bypass family-level checks.
All error messages are in Indonesian (Bahasa).

**Frontend** — two variants of the same SPA, **not identical**:
- `frontend/nasab.jsx` — **Production build** with API layer. Connects to `https://nasab-api.sopian-hadianto.workers.dev`. Hosted at `https://nasab.biz.id`. Uses `localStorage` for token storage. Built with Vite + React 19 (`frontend/package.json`).
- `nasab.jsx` (root) — **Claude artifact version**. Uses `window.storage` API (Claude artifact sandbox) instead of a real backend. Self-contained, no API calls.

Key internal modules (shared by both variants):
- `FE` (Family Engine) — tree traversal, relationship finder (BFS), stats, search. Heavily minified variable names (e.g., `ch`=children, `sp`=spouse, `pa`=parent, `sib`=siblings)
- Canvas constants: `CW=158, CH=86` (card size), `GX=36, GY=120` (grid spacing)
- Views: canvas, map, list, stats, timeline, insights

**Database** (`schema.sql`): 7 tables in Cloudflare D1 — users, families, family_collaborators, members, stories, invites, canvas_positions. 6 indexes. Members link via `parent_id` and `spouse_id` (bidirectional spouse linking).

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

### Database operations
```bash
# Run schema migrations (from api/ directory)
npx wrangler d1 execute nasab-db --file=../schema.sql

# Query database directly
npx wrangler d1 execute nasab-db --command="SELECT * FROM users"
```

## Key Design Decisions

- The Worker API has no dependencies — pure Web API standards (Request/Response, crypto.subtle, TextEncoder)
- Password hashing uses SHA-256 with a hardcoded salt (`nasab-salt-2026`), not bcrypt
- Token secret is hardcoded (`nasab-secret`); tokens expire after 30 days
- CORS is fully open (`Access-Control-Allow-Origin: *`)
- ID generation uses timestamp+random: `Date.now().toString(36)_random` with prefixes (`u_`, `f_`, `p_`, `s_`)
- Member deletion is blocked if the member has children (referential integrity enforced in application code)
- Spouse relationships are bidirectional — adding a spouse updates both records
- Admin endpoints (`/api/admin/*`) require platform-level admin/super_admin role, not family RBAC
- Wrangler config is in `wrangler.jsonc` (JSON with comments)
