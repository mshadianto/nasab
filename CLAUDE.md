# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NASAB ("Jaga Nasabmu") is a family tree SaaS platform for Indonesia. It has two independent parts: a Cloudflare Worker API with D1 database, and a React SPA frontend built with Vite. Live at https://nasab.biz.id. Version 8.1.0.

## Architecture

**Backend** (`api/src/index.js`): Single-file Cloudflare Worker. Manual routing via `url.pathname` string matching and regex — no framework. D1 database bound as `env.DB`. Auth uses a custom JWT-like token scheme (base64 payload + SHA-256 signature). All auth inputs (email, password, name) are `.trim()`'d before processing. Two levels of access control:
- **Platform roles** on `users` table: `super_admin > admin > user`. Checked via `isAdmin()` / `isSuperAdmin()` helpers.
- **Family RBAC** via `family_collaborators` table: `owner > editor > viewer`. Super admins bypass family-level checks. Editor+ required for member CRUD, import, marriages. All collaborators (including viewer) can create stories, posts, events, comments, likes.
All error messages are in Indonesian (Bahasa). All DB queries for family detail are parallelized with `Promise.all()`. Families list uses single JOIN query (no N+1).

**Security features**:
- **CORS**: Restricted to allowed origins (`nasab.biz.id`, `nasab-bua.pages.dev`, `localhost:5173`) with `Vary: Origin` header — no longer wildcard `*`.
- **NIK encryption**: AES-GCM at rest via `encNIK()`/`decNIK()`. Encryption key from `env.NIK_ENCRYPTION_KEY` (falls back to default). Encrypted values prefixed `ENC:`. Role-based decryption on read: owner/super_admin see full NIK, editors see masked (`****`), viewers see nothing.
- **Token secret**: Configurable via `env.TOKEN_SECRET` (falls back to `nasab-secret`).
- **PBKDF2 password hashing**: `hashPwPBKDF2()` uses PBKDF2-SHA256 with random 16-byte salt, 100k iterations. Format: `PBKDF2:base64(salt):base64(hash)`. Login is backward-compatible — legacy SHA-256 hashes auto-upgrade to PBKDF2 on successful login. Register and reset always use PBKDF2.
- **Immutable audit trail**: `audit_logs` table with `audit()` helper. Logs critical mutations (member delete, NIK change, role change, password reset), warnings (member create/update, family create), and info (login, register). Actor IP from `CF-Connecting-IP`, UA truncated to 200 chars. `AUDIT_SEV` map defines severity per action. Admin endpoint `GET /api/admin/audit` with filters (family_id, action, severity, from, to, limit).

**Frontend** — two variants of the same SPA, **not identical**:
- `frontend/nasab.jsx` — **Production build** with API layer. Connects to `https://nasab-api.sopian-hadianto.workers.dev`. Hosted at `https://nasab.biz.id`. Uses `localStorage` for token storage. Built with Vite + React 19 (`frontend/package.json`). Version injected at build time via Vite `define`.
- `nasab.jsx` (root) — **Claude artifact version**. Uses `window.storage` API (Claude artifact sandbox) instead of a real backend. Self-contained, no API calls.

Key internal modules:
- `FE` (Family Engine) — tree traversal, multi-spouse support via `FE.spouses(pp,p,marriages)`, relationship finder (BFS), stats, search, filter (incl. provNik filter). Variables: `ch`=children, `sp`=spouse(primary), `pa`=parent, `sib`=siblings, `mrs`=marriages. Two child/descendant APIs: `ch(pp,pid)`/`desc(pp,pid)` return direct children only (used by layout/connectors), `chAll(pp,pid,marriages)`/`descAll(pp,pid,marriages)` include spouse's children (used by Sidebar, Insights for display)
- `NIK` — parse/validate/mask Indonesian national ID (16 digit), auto-fill gender/birthDate/province/geotag from 34 provinces in `PROV` map
- `FARAIDH` — Islamic inheritance calculator with fardh/asabah/awl, religion-based heir blocking, wasiat wajibah (max 1/3, KHI Pasal 209). `detectHeirs()` checks `agama` field, returns `{heirs, blocked, warnings}`. Asset distribution with `ATYP` types (9 asset categories), deduction chain (bruto - hutang - wasiat - wakaf - zakat = netto), per-heir per-asset breakdown. Ziswaf integration: wakaf input, optional zakat maal (2.5% above nisab)
- `validateFamilyData(pp,marriages)` — Data quality checker with 8 validation rules: parent-child age gap, posthumous birth, duplicate NIK, future birth, death-before-birth, orphan detection, missing data, invalid gender. Returns sorted by severity (critical/warning/info). DataQualityModal with AI analysis via `callAI()`
- `GEDCOM` — GEDCOM 5.5.1 converter. `toGedcom(pp)` exports, `fromGedcom(text)` parses to `{indis, families, stats}`, `importToAPI(parsed, famId, existingPP, onProgress)` does 2-phase sequential import (Phase 1: create individuals, Phase 2: apply FAM relationships via server IDs). Includes duplicate detection (name+birthDate match)
- `KKModal` — Import Kartu Keluarga. Manual input (No KK + alamat + tabel anggota + hubungan mapping) or OCR via Claude Vision API (user provides API key in localStorage `nasab-claude-key`)
- Canvas: `CW=150, CH=80` (card size), `GX=24, GY=100` (grid spacing), `MAX_COLS=4` (wrap siblings into rows). Glassmorphism cards, curved bezier SVG connectors, smart labels, pinch-to-zoom, zoom-to-cursor, double-tap zoom, comfort view centered on root. Expand/collapse via `collapsed` Set state (auto-collapse gen ≥2 for large trees). Canvas search overlay with auto-pan/zoom/highlight. `autoLayout()` uses bottom-up subtree width (`stW`) and height (`stH`) calculation with caching, top-down absolute positioning via `place()` — no shift/collision pass needed, correct by construction. Handles 73+ members without overlap
- **POV Tree Navigation** (MyHeritage-style): Canvas defaults to POV mode — shows only blood relatives of the root person + their spouses. Non-blood spouses appear with `🔗 Cabang →` branch indicator. Click to switch POV to that person's family. `getPOVMembers(pp,rootId,marriages)` returns `{visible,branches}`. `isBloodRelative(pp,personId,rootId,marriages)` checks ancestry chain + `bloodDescendants()` which traces direct children AND children co-parented via a spouse (parent_id points to spouse, not this person) — necessary because Indonesian family trees often store only one parent_id per child. Auto-root (`autoRoot` useMemo in Workspace) picks the root with the most total descendants via `FE.descAll(pp,r.id,mrs)` — NOT direct `ch` count, because patriarchs often have 1 child but many grandchildren. Tiebreaker: prefer root whose first name appears in `fam.name`. State: `povRootId`, `povHistory` (breadcrumb stack), `povMode` toggle. POV bar shows breadcrumb + `X/Y anggota` count + root selector dropdown + "Tampilkan Semua" escape hatch + POV/Full toggle. POV only affects Canvas — List/Map/Stats/Timeline show all members
- ListView: multi-select bulk delete mode (skip members with children), "Hapus Semua" button (owner only) with typed confirmation modal ("HAPUS") — calls `DELETE /api/families/:fid/members/all` which clears members + marriages + canvas_positions
- `generateBio()` — Auto-generates family biography sections (asal-usul, generasi kedua, persebaran, milestones, stories, penutup) from tree data
- InsightsView (renamed to "Kisah Keluarga"): biography generator (auto + AI via `callAI()`), PDF export (html2pdf.js loaded on demand), shareable public link via `/api/biography/:slug`, relationship finder, birthday tracker, distribution, migration tracker (NIK province vs domicile). AI biography supports 3 styles: naratif, formal, puitis
- **AI Abstraction**: `callAI(prompt,systemPrompt)` dispatches to Groq/Claude/Gemini based on `nasab-ai-provider` localStorage. `AI_PROVIDERS` object maps provider IDs to key names and labels. `callGroq()` uses OpenAI-compatible endpoint, `callClaude()` uses Anthropic messages API, `callGemini()` uses Google generativeLanguage API. API keys stored in localStorage per-provider (`nasab-groq-key`, `nasab-claude-key`, `nasab-gemini-key`) — keys only sent to their respective provider, never to NASAB backend
- **KeluargaView** (tab "Keluarga"): Events section (horizontal scroll cards, CRUD modal, 10 event types in `EVT` array), Family Feed (compose box + AI suggest, posts with likes/comments, auto-generated birthday/event reminders), AI Settings panel (provider radio + key input). Data lazy-loaded on tab mount. Post types: text, announcement, milestone, memory. Auto-feed merges with user posts sorted by date
- **InvitationPage**: Public page at `#/undangan/:slug`. 4 CSS-only templates (classic/islamic/modern/festive) with themed colors. RSVP form (guest name + hadir/tidak/mungkin + message). Share via clipboard/WhatsApp. No auth required
- **ChatPanel**: Floating AI chatbot widget (`💬` FAB button, bottom-right). Injects family data summary as system prompt, answers genealogical questions via `callAI()`. Session-based chat history (not persisted). Max 50 members in context to manage token usage
- **OnboardingWizard**: 3-step wizard shown once when a new family opens with 0 members. Step 1: user name + gender. Step 2: optional spouse. Step 3: optional parents (father + mother). Batch-creates members via API with marriages and parent links. State: `showWizard`, triggered via `wizardChecked` ref on first load. "Lewati wizard" to skip
- **CanvasCardActions**: `+` button (24px gold circle) on top-right of each canvas card, visible on hover for editor+ users. Click opens a dropdown menu with 4 contextual options: Orang Tua (disabled if member already has parent), Pasangan, Anak, Saudara (disabled if no parent). "Parent" quick-add creates parent then updates child's `parentId`. State: `cardMenuId` in CanvasView
- **BottomNavBar**: Fixed bottom navigation for mobile (`<=768px`). 5 tabs: Pohon (canvas), Daftar (list), Peta (map), Kisah (insights), Feed (keluarga). Detected via `matchMedia` listener, `isMobile` state. On mobile: top `.nav` tabs hidden via CSS, content gets `ws-body-bnav` class for bottom padding. Glass effect with safe-area padding
- **MilestoneModal**: One-time popup triggered at member thresholds per family. At 5+ members: "Buat Kisah dengan AI" → navigates to Insights view. At 15+ members: "Kalkulator Faraidh" + "Ekspor GEDCOM". Tracked via `localStorage` keys `nasab-ms5-{fid}` / `nasab-ms15-{fid}`. State: `milestone` object
- **Empty State**: Helpful empty state in Canvas view when `pp.length===0` — centered card with action buttons (Tambah Anggota → opens PersonForm, Import KK → opens KKModal, Import GEDCOM → opens IEModal). ListView also has empty state. Callbacks passed from Workspace: `onAddMember`, `onImportKK`, `onImportGEDCOM`
- **Admin Family Health**: In AdminPanel families tab — badges on member count column: red "Kosong" (0 members), orange "Stale" (0 members + created >7 days ago). Filter dropdown (Semua/Aktif/Kosong/Stale) with `famFilter` state. Summary stats line. Disabled "Bersihkan Family Kosong" button (super_admin only, awaiting API endpoint)
- **LandingPage** (`frontend/src/LandingPage.jsx`): Public landing shown when logged-out user hits root. Tailwind v4 via `@tailwindcss/vite`. Fetches real aggregate counts from `GET /api/public/stats` on mount and renders them in hero text, floating illustration badge, and stats section (no hardcoded numbers — fallback `…` while loading). Every section's inner wrapper uses the `.nasab-wrap` class defined in LandingPage's own `<style>` block with `!important` on every property (`max-width:1152px`, `margin:auto`, `padding:0 24px`, `width:100%`, `box-sizing:border-box`) — this is required to beat the app-shell's `*{margin:0;padding:0;box-sizing:border-box}` reset declared in nasab.jsx's injected CSS. Without `!important`, cascade order made the reset win and content collapsed to the left edge. Responsive grids use CSS Grid `auto-fill`/`auto-fit` with `minmax()` (classes `.nasab-grid-3`, `.nasab-grid-4`) instead of Tailwind breakpoint classes, so columns scale 1→2→3→4 smoothly without manual breakpoints. Body toggles `landing-scroll` class on mount (via `useEffect`) to override `body,#root{overflow:hidden}` from the app-shell — rules in `frontend/src/index.css`. Footer reads `Develop by: MS Hadianto · v{__APP_VERSION__} · © {new Date().getFullYear()} Labbaik AI` (version from Vite `define`, year dynamic)
- Views: canvas, map, list, stats, timeline, kisah (insights), keluarga
- Theme: dark/light via `data-theme` attribute + CSS variables, persisted in localStorage
- PWA: manifest.json, service worker (sw.js) with cache versioning (bump `CACHE` in sw.js on deploy)

**Database** (`schema.sql`): 15 tables in Cloudflare D1 — users, families, family_collaborators, members (nik, agama, no_kk columns), stories, invites, canvas_positions, **marriages** (husband_id, wife_id, marriage_order for polygamy), **biographies** (slug, content, is_public), **events** (family_id, title, type, event_date, slug, cover_template, is_public), **event_rsvps** (event_id, user_id/guest_name, status, message), **posts** (family_id, author_id, content, post_type), **post_comments** (post_id, author_id, content), **post_likes** (post_id, user_id — composite PK), **audit_logs** (actor_id, action, resource_type, severity, actor_ip). Members link via `parent_id` and `spouse_id` (backward-compatible). Multiple spouses tracked via `marriages` table. NIK and no_kk columns store AES-GCM encrypted values (prefixed `ENC:`).

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
- Password hashing uses PBKDF2-SHA256 with random salt (100k iterations). Legacy SHA-256 hashes auto-upgrade on login. All auth inputs trimmed to prevent copy-paste whitespace issues
- Token secret configurable via `env.TOKEN_SECRET` (default `nasab-secret`); tokens expire after 30 days
- CORS restricted to allowed origins list (not wildcard) with `Vary: Origin`
- NIK/no_kk encrypted at rest with AES-GCM (`env.NIK_ENCRYPTION_KEY`). Decrypted per-request based on RBAC role. One-time migration endpoint at `POST /api/admin/migrate-nik` (super_admin only)
- ID generation uses timestamp+random: `Date.now().toString(36)_random` with prefixes (`u_`, `f_`, `p_`, `s_`, `m_`, `e_` events, `pt_` posts, `cm_` comments, `b_` biographies, `al_` audit logs)
- Member deletion is blocked if the member has children (referential integrity enforced in application code). Bulk "delete all" (`DELETE /api/families/:fid/members/all`) bypasses this check — owner only, placed before `memDetail` regex in router to avoid `/members/all` matching as a member ID
- Spouse relationships: `spouse_id` for primary/backward-compat, `marriages` table for polygamy (multiple wives)
- GEDCOM import is 2-phase: create individuals first (server assigns IDs), then apply FAM relationships. Client-side IDs are never sent to API for relationships
- Import includes duplicate detection (name+birthDate match against existing members)
- Admin endpoints (`/api/admin/*`) require platform-level admin/super_admin role, not family RBAC
- Biography API: `POST /api/families/:id/biography` (upsert, returns slug), `GET /api/biography/:slug` (public, no auth). Content stored as JSON sections. html2pdf.js loaded dynamically for PDF export
- Fonts and Leaflet CSS loaded via `<link rel="preload">` (non-blocking), not CSS `@import`
- Service worker cache version must be bumped (in `frontend/public/sw.js`) on each deploy to invalidate stale assets
- Wrangler config is in `wrangler.jsonc` (JSON with comments)
- Dashboard prefetches full family data on hover for instant workspace open
- Canvas auto-collapses deep branches for trees with >50 members (adaptive threshold: `pp.length>200?2:pp.length>80?3:4`) — threshold raised from 20 to 50 after POV fix, since 30-member trees don't need aggressive collapse when POV already filters visible set
- Canvas POV mode is default ON — auto-detects root person using `FE.descAll` (total descendants recursive, incl. co-parented children) with family-name tiebreaker. Picking by direct-child count was wrong — patriarchs often have one child (who married in) but dozens of grandchildren, so a son-in-law with 6 direct children would beat the actual family head. User can switch root via dropdown, navigate branches via click, breadcrumb for back navigation. "Tampilkan Semua" button disables POV when filtered view is too narrow. "Full" toggle disables POV to show entire tree
- Public stats endpoint `GET /api/public/stats` — no auth, returns `{users,families,members}` aggregate counts via three parallel `COUNT(*)` queries. Consumed by the landing page. Deliberately kept before the 404 fallback in the router
- Password field has show/hide toggle (👁/🙈) on all auth forms
- AI calls via `callAI()` abstraction — 3 providers: Groq (default, free, `nasab-groq-key`), Gemini (free, `nasab-gemini-key`), Claude (detailed, `nasab-claude-key`). Provider selection in `nasab-ai-provider` localStorage. Keys stored client-side only, sent directly to provider APIs, never to NASAB backend. KK OCR still requires Claude key (vision)
- Events API: CRUD at `/api/families/:fid/events`, RSVP at `/api/events/:eid/rsvp` (auth optional for public events), public invitation at `/api/events/public/:slug`. Event types: nikah, aqiqah, khitan, syukuran, reuni, tahlilan, arisan, milad, wisuda, lainnya
- Feed API: posts at `/api/families/:fid/posts`, likes at `/api/posts/:pid/like` (toggle), comments at `/api/posts/:pid/comments`. Feed endpoint returns posts with embedded comments + like_count + liked_by_me
- Public routes via hash: `#/undangan/:slug` → InvitationPage (4 CSS templates: classic/islamic/modern/festive)
- OnboardingWizard auto-shows once per family when workspace loads with 0 members. Batch-creates self + spouse (with marriage) + parents (with parent link + marriage). Uses `wizardChecked` ref to prevent re-triggering
- CanvasCardActions `+` button uses `cc-add` CSS class with `opacity:0` → visible on `.cc:hover`. Menu state `cardMenuId` in CanvasView. "Parent" quick-add uses `_quickType`/`_refPersonId` fields on the person object to trigger post-save parent linking in `handleSave`
- BottomNavBar uses `isMobile` state with `matchMedia('(max-width:768px)')` listener. Top nav hidden via `@media(max-width:768px){.ws-hdr .nav{display:none!important}}`. Content area gets `ws-body-bnav` class for bottom padding (72px)
- Milestone popups are one-time per family, tracked in localStorage. Priority: 15+ check runs before 5+ check to avoid showing both. Only triggers when `showWizard` is false
- Admin family health uses IIFE `(()=>{...})()` pattern in JSX for the families tab to support local variables (filter computation, summary stats). Badge color: red for empty (<7 days), orange for stale (>7 days). "Bersihkan" button is permanently disabled pending a bulk-delete API endpoint
- Service worker cache version in `frontend/public/sw.js` — bump on every deploy
