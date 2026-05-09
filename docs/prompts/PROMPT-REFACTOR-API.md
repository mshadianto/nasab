# NASAB API — Single-File Modular Refactor (Route Table Pattern)

Refactor `api/src/index.js` dari monolithic if/else ke Route Table Dispatcher pattern. Tetap single-file, ZERO perubahan business logic.

## CURRENT STATE (dari code review)

File saat ini: ~400 lines, 40+ routes, monolithic if/else chain. Sudah include:
- Auth: register, login, me, reset-password
- Families: list, create, detail (with parallel D1 queries + NIK decrypt)
- Members: create (encrypt NIK), update (encrypt NIK), delete (child check), bulk delete all
- Marriages: create, delete
- Canvas positions: save
- Stories: create, delete
- Invites: create
- Events: create, list, detail update, delete
- RSVP: create/update (auth + guest)
- Public event: get by slug
- Feed: get (with likes + comments aggregation)
- Posts: create, delete
- Likes: toggle
- Comments: create, delete
- Biography: save (upsert), public get by slug
- Admin: stats, users list, user role change, user delete, families list, migrate-nik
- Health check

## CRITICAL CONSTRAINTS

1. ❌ JANGAN ubah business logic, D1 queries, JWT auth, NIK encryption
2. ❌ JANGAN ubah request/response JSON contracts
3. ❌ JANGAN tambah dependency (no Hono, no itty-router)
4. ✅ Maintain routing order: `DELETE /members/all` SEBELUM `/:mid` regex
5. ✅ `_cors` global harus di-set sebelum routing (existing pattern)
6. ✅ `env` harus accessible di semua handlers (untuk D1, NIK key, token secret)

## STEP 1: Extract Middleware HOFs

```javascript
// ─── Middleware HOFs ─────────────────────────────────
function withAuth(handler) {
  return async (request, env, match) => {
    const user = await getAuthUser(request, env.DB);
    if (!user) return err('Unauthorized', 401);
    return handler(request, env, match, user);
  };
}

function withAdmin(handler) {
  return async (request, env, match) => {
    const user = await getAuthUser(request, env.DB);
    if (!user || !isAdmin(user)) return err('Admin access required', 403);
    return handler(request, env, match, user);
  };
}

function withSuperAdmin(handler) {
  return async (request, env, match) => {
    const user = await getAuthUser(request, env.DB);
    if (!user || !isSuperAdmin(user)) return err('Super Admin required', 403);
    return handler(request, env, match, user);
  };
}

// Family-level RBAC: minRole = 'viewer' | 'editor' | 'owner'
function withFamily(minRole, handler) {
  return async (request, env, match, user) => {
    const fid = match[1]; // first capture group = family ID
    const DB = env.DB;
    const collab = await DB.prepare(
      'SELECT role FROM family_collaborators WHERE family_id = ? AND user_id = ?'
    ).bind(fid, user.id).first();
    
    const roles = { viewer: 0, editor: 1, owner: 2 };
    const userLevel = collab ? roles[collab.role] || 0 : -1;
    const requiredLevel = roles[minRole] || 0;
    
    if (!isSuperAdmin(user) && userLevel < requiredLevel) {
      return err('Tidak punya izin', 403);
    }
    
    return handler(request, env, match, user, collab);
  };
}
```

## STEP 2: Group Handlers into Domain Objects

Extract SETIAP if/else block ke named function dalam domain object. Business logic EXACT SAMA — hanya pindah posisi.

```javascript
const AuthAPI = {
  register: async (req, env, match) => { /* exact existing logic */ },
  login: async (req, env, match) => { /* exact existing logic */ },
  me: async (req, env, match, user) => { /* exact existing logic */ },
  resetPassword: async (req, env, match) => { /* exact existing logic */ },
};

const FamilyAPI = {
  list: async (req, env, match, user) => { /* exact existing logic */ },
  create: async (req, env, match, user) => { /* exact existing logic */ },
  detail: async (req, env, match, user) => { /* exact existing logic with NIK decrypt */ },
};

const MemberAPI = {
  create: async (req, env, match, user) => { /* exact existing logic with NIK encrypt */ },
  update: async (req, env, match, user) => { /* exact existing logic with NIK encrypt */ },
  delete: async (req, env, match, user) => { /* exact existing logic with child check */ },
  deleteAll: async (req, env, match, user) => { /* exact existing logic */ },
};

const MarriageAPI = {
  create: async (req, env, match, user) => { /* exact existing logic */ },
  delete: async (req, env, match, user) => { /* exact existing logic */ },
};

const CanvasAPI = {
  savePositions: async (req, env, match, user) => { /* exact existing logic */ },
};

const StoryAPI = {
  create: async (req, env, match, user) => { /* exact existing logic */ },
  delete: async (req, env, match, user) => { /* exact existing logic */ },
};

const InviteAPI = {
  create: async (req, env, match, user) => { /* exact existing logic - owner only */ },
};

const EventAPI = {
  create: async (req, env, match, user) => { /* exact existing logic */ },
  list: async (req, env, match, user) => { /* exact existing logic */ },
  update: async (req, env, match, user) => { /* exact existing logic */ },
  delete: async (req, env, match, user) => { /* exact existing logic */ },
};

const RsvpAPI = {
  upsert: async (req, env, match) => { /* exact existing logic - auth optional */ },
};

const PublicAPI = {
  event: async (req, env, match) => { /* exact existing logic - no auth */ },
  biography: async (req, env, match) => { /* exact existing logic - no auth */ },
  health: async (req, env, match) => { /* exact existing logic */ },
};

const FeedAPI = {
  get: async (req, env, match, user) => { /* exact existing logic with aggregation */ },
};

const PostAPI = {
  create: async (req, env, match, user) => { /* exact existing logic */ },
  delete: async (req, env, match, user) => { /* exact existing logic */ },
};

const LikeAPI = {
  toggle: async (req, env, match, user) => { /* exact existing logic */ },
};

const CommentAPI = {
  create: async (req, env, match, user) => { /* exact existing logic */ },
  delete: async (req, env, match, user) => { /* exact existing logic */ },
};

const BiographyAPI = {
  save: async (req, env, match, user) => { /* exact existing logic */ },
};

const AdminAPI = {
  stats: async (req, env, match, user) => { /* exact existing logic */ },
  usersList: async (req, env, match, user) => { /* exact existing logic */ },
  userRole: async (req, env, match, user) => { /* exact existing logic */ },
  userDelete: async (req, env, match, user) => { /* exact existing logic */ },
  familiesList: async (req, env, match, user) => { /* exact existing logic */ },
  migrateNik: async (req, env, match, user) => { /* exact existing logic */ },
};
```

## STEP 3: Route Table

⚠️ ORDERING MATTERS — more specific routes BEFORE generic ones.

```javascript
const ROUTES = [
  // ─── Auth (no auth required) ──────────────────
  ['POST', /^\/api\/auth\/register$/, AuthAPI.register],
  ['POST', /^\/api\/auth\/login$/, AuthAPI.login],
  ['GET',  /^\/api\/auth\/me$/, withAuth(AuthAPI.me)],
  ['POST', /^\/api\/auth\/reset-password$/, AuthAPI.resetPassword],

  // ─── Public (no auth) ─────────────────────────
  ['GET',  /^\/api\/events\/public\/([^/]+)$/, PublicAPI.event],
  ['GET',  /^\/api\/biography\/([^/]+)$/, PublicAPI.biography],
  ['GET',  /^\/api\/health$/, PublicAPI.health],

  // ─── RSVP (auth optional) ─────────────────────
  ['POST', /^\/api\/events\/([^/]+)\/rsvp$/, RsvpAPI.upsert],

  // ─── Families ─────────────────────────────────
  ['GET',  /^\/api\/families$/, withAuth(FamilyAPI.list)],
  ['POST', /^\/api\/families$/, withAuth(FamilyAPI.create)],
  ['GET',  /^\/api\/families\/([^/]+)$/, withAuth(FamilyAPI.detail)],

  // ─── Members (⚠️ /all BEFORE /:mid) ──────────
  ['DELETE', /^\/api\/families\/([^/]+)\/members\/all$/, withAuth((r,e,m,u) => withFamily('owner', MemberAPI.deleteAll)(r,e,m,u))],
  ['POST',   /^\/api\/families\/([^/]+)\/members$/, withAuth((r,e,m,u) => withFamily('editor', MemberAPI.create)(r,e,m,u))],
  ['PUT',    /^\/api\/families\/([^/]+)\/members\/([^/]+)$/, withAuth((r,e,m,u) => withFamily('editor', MemberAPI.update)(r,e,m,u))],
  ['DELETE', /^\/api\/families\/([^/]+)\/members\/([^/]+)$/, withAuth((r,e,m,u) => withFamily('editor', MemberAPI.delete)(r,e,m,u))],

  // ─── Marriages ────────────────────────────────
  ['POST',   /^\/api\/families\/([^/]+)\/marriages$/, withAuth((r,e,m,u) => withFamily('editor', MarriageAPI.create)(r,e,m,u))],
  ['DELETE', /^\/api\/families\/([^/]+)\/marriages\/([^/]+)$/, withAuth((r,e,m,u) => withFamily('editor', MarriageAPI.delete)(r,e,m,u))],

  // ─── Canvas ───────────────────────────────────
  ['PUT', /^\/api\/families\/([^/]+)\/positions$/, withAuth(CanvasAPI.savePositions)],

  // ─── Stories ──────────────────────────────────
  ['POST',   /^\/api\/families\/([^/]+)\/stories$/, withAuth((r,e,m,u) => withFamily('editor', StoryAPI.create)(r,e,m,u))],
  ['DELETE', /^\/api\/families\/([^/]+)\/stories\/([^/]+)$/, withAuth(StoryAPI.delete)],

  // ─── Invite ───────────────────────────────────
  ['POST', /^\/api\/families\/([^/]+)\/invite$/, withAuth((r,e,m,u) => withFamily('owner', InviteAPI.create)(r,e,m,u))],

  // ─── Events ───────────────────────────────────
  ['GET',    /^\/api\/families\/([^/]+)\/events$/, withAuth(EventAPI.list)],
  ['POST',   /^\/api\/families\/([^/]+)\/events$/, withAuth((r,e,m,u) => withFamily('editor', EventAPI.create)(r,e,m,u))],
  ['PUT',    /^\/api\/families\/([^/]+)\/events\/([^/]+)$/, withAuth((r,e,m,u) => withFamily('editor', EventAPI.update)(r,e,m,u))],
  ['DELETE', /^\/api\/families\/([^/]+)\/events\/([^/]+)$/, withAuth((r,e,m,u) => withFamily('editor', EventAPI.delete)(r,e,m,u))],

  // ─── Feed & Posts ─────────────────────────────
  ['GET',  /^\/api\/families\/([^/]+)\/feed$/, withAuth(FeedAPI.get)],
  ['POST', /^\/api\/families\/([^/]+)\/posts$/, withAuth((r,e,m,u) => withFamily('editor', PostAPI.create)(r,e,m,u))],
  ['DELETE', /^\/api\/families\/([^/]+)\/posts\/([^/]+)$/, withAuth(PostAPI.delete)],

  // ─── Likes & Comments ─────────────────────────
  ['POST',   /^\/api\/posts\/([^/]+)\/like$/, withAuth(LikeAPI.toggle)],
  ['POST',   /^\/api\/posts\/([^/]+)\/comments$/, withAuth(CommentAPI.create)],
  ['DELETE', /^\/api\/comments\/([^/]+)$/, withAuth(CommentAPI.delete)],

  // ─── Biography ────────────────────────────────
  ['POST', /^\/api\/families\/([^/]+)\/biography$/, withAuth(BiographyAPI.save)],

  // ─── Admin ────────────────────────────────────
  ['GET',    /^\/api\/admin\/stats$/, withAdmin(AdminAPI.stats)],
  ['GET',    /^\/api\/admin\/users$/, withAdmin(AdminAPI.usersList)],
  ['PUT',    /^\/api\/admin\/users\/([^/]+)\/role$/, withAdmin(AdminAPI.userRole)],
  ['DELETE', /^\/api\/admin\/users\/([^/]+)$/, withSuperAdmin(AdminAPI.userDelete)],
  ['GET',    /^\/api\/admin\/families$/, withAdmin(AdminAPI.familiesList)],
  ['POST',   /^\/api\/admin\/migrate-nik$/, withSuperAdmin(AdminAPI.migrateNik)],
];
```

## STEP 4: Rewrite Main Fetch Entry Point

```javascript
export default {
  async fetch(request, env) {
    _cors = corsH(request);
    if (request.method === 'OPTIONS') return new Response(null, { headers: _cors });

    const { pathname } = new URL(request.url);
    const method = request.method;

    try {
      for (const [routeMethod, pattern, handler] of ROUTES) {
        if (method !== routeMethod) continue;
        const match = pathname.match(pattern);
        if (match) return await handler(request, env, match);
      }
      return err('Endpoint tidak ditemukan', 404);
    } catch (e) {
      return json({ error: e.message || 'Internal Server Error' }, 500);
    }
  }
};
```

## VERIFICATION CHECKLIST

Setelah refactor, pastikan:
- [ ] `npx wrangler dev` → test semua endpoint via curl/frontend
- [ ] Auth: register, login, me, reset-password
- [ ] Families: list (admin vs user), create, detail (NIK decrypt per role)
- [ ] Members: create (NIK encrypt), update, delete (child check), delete all
- [ ] Marriages: create, delete
- [ ] Events: CRUD + RSVP (auth + guest)
- [ ] Feed: get (with likes aggregation), posts CRUD, like toggle, comments CRUD
- [ ] Biography: save, public get
- [ ] Admin: all 6 endpoints
- [ ] Public: health, event by slug, biography by slug
- [ ] CORS headers present on every response
- [ ] Error responses masih in Indonesian

## DEPLOY

```bash
cd api && npx wrangler deploy
```

Frontend TIDAK perlu redeploy — hanya backend refactor, JSON contract sama persis.
