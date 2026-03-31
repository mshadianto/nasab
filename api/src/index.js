// ═══════════════════════════════════════════════════════════════
// NASAB API — Cloudflare Worker + D1
// nasab-api.mshadianto.workers.dev
// ═══════════════════════════════════════════════════════════════

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...CORS } });
}
function err(msg, status = 400) { return json({ error: msg }, status); }
function uid() { return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`; }

// Simple password hashing (for production: use bcrypt via wasm)
async function hashPw(pw) {
  const enc = new TextEncoder().encode(pw + 'nasab-salt-2026');
  const hash = await crypto.subtle.digest('SHA-256', enc);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

// Simple JWT-like token (for production: use proper JWT)
async function makeToken(userId) {
  const payload = { uid: userId, exp: Date.now() + 30 * 24 * 3600000 }; // 30 days
  const enc = new TextEncoder().encode(JSON.stringify(payload));
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(payload) + 'nasab-secret'));
  const sig = btoa(String.fromCharCode(...new Uint8Array(hash))).slice(0, 16);
  return btoa(JSON.stringify(payload)) + '.' + sig;
}
async function verifyToken(token) {
  try {
    const [payloadB64] = token.split('.');
    const payload = JSON.parse(atob(payloadB64));
    if (payload.exp < Date.now()) return null;
    return payload.uid;
  } catch { return null; }
}

async function getAuthUser(request, DB) {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const userId = await verifyToken(auth.slice(7));
  if (!userId) return null;
  const user = await DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
  return user;
}
function isAdmin(user) { return user && (user.role === 'admin' || user.role === 'super_admin'); }
function isSuperAdmin(user) { return user && user.role === 'super_admin'; }

// ─── ROUTER ──────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const DB = env.DB;

    try {
      // ── AUTH ──
      if (path === '/api/auth/register' && method === 'POST') {
        const { name, email, password } = await request.json();
        if (!name || !email || !password) return err('Semua field wajib diisi');
        const existing = await DB.prepare('SELECT id FROM users WHERE email = ?').bind(email.toLowerCase()).first();
        if (existing) return err('Email sudah terdaftar');
        const id = 'u_' + uid();
        const pwHash = await hashPw(password);
        await DB.prepare('INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)').bind(id, name, email.toLowerCase(), pwHash).run();
        const token = await makeToken(id);
        return json({ token, user: { id, name, email: email.toLowerCase(), role: 'user' } });
      }

      if (path === '/api/auth/login' && method === 'POST') {
        const { email, password } = await request.json();
        if (!email || !password) return err('Email dan password wajib');
        const user = await DB.prepare('SELECT * FROM users WHERE email = ?').bind(email.toLowerCase()).first();
        if (!user) return err('Email atau password salah', 401);
        const pwHash = await hashPw(password);
        if (user.password_hash !== pwHash) return err('Email atau password salah', 401);
        const token = await makeToken(user.id);
        return json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
      }

      if (path === '/api/auth/me' && method === 'GET') {
        const user = await getAuthUser(request, DB);
        if (!user) return err('Unauthorized', 401);
        return json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
      }

      // ── FORGOT PASSWORD ──
      if (path === '/api/auth/reset-password' && method === 'POST') {
        const { email, name, new_password } = await request.json();
        if (!email || !name || !new_password) return err('Semua field wajib diisi');
        if (new_password.length < 6) return err('Password minimal 6 karakter');
        const user = await DB.prepare('SELECT * FROM users WHERE email = ?').bind(email.toLowerCase()).first();
        if (!user) return err('Email tidak ditemukan');
        if (user.name.toLowerCase().trim() !== name.toLowerCase().trim()) return err('Nama tidak cocok dengan akun');
        const pwHash = await hashPw(new_password);
        await DB.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").bind(pwHash, user.id).run();
        return json({ message: 'Password berhasil direset. Silakan login.' });
      }

      // ── FAMILIES ──
      if (path === '/api/families' && method === 'GET') {
        const user = await getAuthUser(request, DB);
        if (!user) return err('Unauthorized', 401);
        const rows = isAdmin(user)
          ? await DB.prepare(`SELECT f.*, COALESCE(fc.role, 'admin_view') as my_role FROM families f LEFT JOIN family_collaborators fc ON f.id = fc.family_id AND fc.user_id = ? ORDER BY f.updated_at DESC`).bind(user.id).all()
          : await DB.prepare(`SELECT f.*, fc.role as my_role FROM families f JOIN family_collaborators fc ON f.id = fc.family_id WHERE fc.user_id = ? ORDER BY f.updated_at DESC`).bind(user.id).all();
        // Enrich with member count
        const families = [];
        for (const f of rows.results) {
          const mc = await DB.prepare('SELECT COUNT(*) as c FROM members WHERE family_id = ?').bind(f.id).first();
          const gc = await DB.prepare('SELECT COUNT(*) as c FROM members WHERE family_id = ? AND location_lat IS NOT NULL').bind(f.id).first();
          const cc = await DB.prepare('SELECT COUNT(*) as c FROM family_collaborators WHERE family_id = ?').bind(f.id).first();
          families.push({ ...f, member_count: mc.c, geo_count: gc.c, collab_count: cc.c });
        }
        return json({ families });
      }

      if (path === '/api/families' && method === 'POST') {
        const user = await getAuthUser(request, DB);
        if (!user) return err('Unauthorized', 401);
        const { name, description } = await request.json();
        if (!name) return err('Nama keluarga wajib');
        const id = 'f_' + uid();
        await DB.prepare('INSERT INTO families (id, name, description, owner_id) VALUES (?, ?, ?, ?)').bind(id, name, description || '', user.id).run();
        await DB.prepare('INSERT INTO family_collaborators (family_id, user_id, role) VALUES (?, ?, ?)').bind(id, user.id, 'owner').run();
        return json({ family: { id, name, description } }, 201);
      }

      // ── FAMILY DETAIL ──
      const famMatch = path.match(/^\/api\/families\/([^/]+)$/);
      if (famMatch && method === 'GET') {
        const user = await getAuthUser(request, DB);
        if (!user) return err('Unauthorized', 401);
        const fid = famMatch[1];
        const collab = await DB.prepare('SELECT * FROM family_collaborators WHERE family_id = ? AND user_id = ?').bind(fid, user.id).first();
        if (!collab && !isAdmin(user)) return err('Akses ditolak', 403);
        const family = await DB.prepare('SELECT * FROM families WHERE id = ?').bind(fid).first();
        if (!family) return err('Tidak ditemukan', 404);
        const members = (await DB.prepare('SELECT * FROM members WHERE family_id = ? ORDER BY created_at').bind(fid).all()).results;
        const collaborators = (await DB.prepare('SELECT fc.*, u.name, u.email FROM family_collaborators fc JOIN users u ON fc.user_id = u.id WHERE fc.family_id = ?').bind(fid).all()).results;
        const stories = (await DB.prepare('SELECT * FROM stories WHERE family_id = ? ORDER BY created_at DESC').bind(fid).all()).results;
        const positions = (await DB.prepare('SELECT * FROM canvas_positions WHERE family_id = ?').bind(fid).all()).results;
        const invites = (await DB.prepare('SELECT * FROM invites WHERE family_id = ?').bind(fid).all()).results;
        const posMap = {};
        positions.forEach(p => { posMap[p.member_id] = { x: p.x, y: p.y }; });
        const my_role = collab ? collab.role : (isSuperAdmin(user) ? 'owner' : 'viewer');
        return json({ family, members, collaborators, stories, positions: posMap, invites, my_role });
      }

      // ── MEMBERS CRUD ──
      const memPath = path.match(/^\/api\/families\/([^/]+)\/members$/);
      if (memPath && method === 'POST') {
        const user = await getAuthUser(request, DB);
        if (!user) return err('Unauthorized', 401);
        const fid = memPath[1];
        const collab = await DB.prepare('SELECT role FROM family_collaborators WHERE family_id = ? AND user_id = ?').bind(fid, user.id).first();
        if (!isSuperAdmin(user) && (!collab || collab.role === 'viewer')) return err('Tidak punya izin', 403);
        const m = await request.json();
        const id = 'p_' + uid();
        await DB.prepare(`INSERT INTO members (id, family_id, name, gender, birth_date, death_date, birth_place, notes, parent_id, spouse_id, location_lat, location_lng, location_address, nik)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, fid, m.name, m.gender || 'male', m.birth_date || '', m.death_date || '', m.birth_place || '', m.notes || '', m.parent_id || null, m.spouse_id || null, m.location_lat || null, m.location_lng || null, m.location_address || '', m.nik || '').run();
        // Link spouse bidirectional
        if (m.spouse_id) {
          await DB.prepare('UPDATE members SET spouse_id = ? WHERE id = ? AND family_id = ?').bind(id, m.spouse_id, fid).run();
        }
        return json({ id, message: 'Anggota ditambahkan' }, 201);
      }

      const memDetail = path.match(/^\/api\/families\/([^/]+)\/members\/([^/]+)$/);
      if (memDetail && method === 'PUT') {
        const user = await getAuthUser(request, DB);
        if (!user) return err('Unauthorized', 401);
        const [, fid, mid] = memDetail;
        const collab = await DB.prepare('SELECT role FROM family_collaborators WHERE family_id = ? AND user_id = ?').bind(fid, user.id).first();
        if (!isSuperAdmin(user) && (!collab || collab.role === 'viewer')) return err('Tidak punya izin', 403);
        const m = await request.json();
        await DB.prepare(`UPDATE members SET name=?, gender=?, birth_date=?, death_date=?, birth_place=?, notes=?, parent_id=?, spouse_id=?, location_lat=?, location_lng=?, location_address=?, nik=?, updated_at=datetime('now') WHERE id=? AND family_id=?`)
          .bind(m.name, m.gender, m.birth_date || '', m.death_date || '', m.birth_place || '', m.notes || '', m.parent_id || null, m.spouse_id || null, m.location_lat || null, m.location_lng || null, m.location_address || '', m.nik || '', mid, fid).run();
        return json({ message: 'Diperbarui' });
      }

      if (memDetail && method === 'DELETE') {
        const user = await getAuthUser(request, DB);
        if (!user) return err('Unauthorized', 401);
        const [, fid, mid] = memDetail;
        const collab = await DB.prepare('SELECT role FROM family_collaborators WHERE family_id = ? AND user_id = ?').bind(fid, user.id).first();
        if (!isSuperAdmin(user) && (!collab || collab.role === 'viewer')) return err('Tidak punya izin', 403);
        // Check children
        const children = await DB.prepare('SELECT COUNT(*) as c FROM members WHERE parent_id = ? AND family_id = ?').bind(mid, fid).first();
        if (children.c > 0) return err('Tidak bisa hapus — masih punya anak');
        // Unlink spouse
        await DB.prepare('UPDATE members SET spouse_id = NULL WHERE spouse_id = ? AND family_id = ?').bind(mid, fid).run();
        await DB.prepare('DELETE FROM members WHERE id = ? AND family_id = ?').bind(mid, fid).run();
        await DB.prepare('DELETE FROM canvas_positions WHERE member_id = ? AND family_id = ?').bind(mid, fid).run();
        return json({ message: 'Dihapus' });
      }

      // ── POSITIONS ──
      const posPath = path.match(/^\/api\/families\/([^/]+)\/positions$/);
      if (posPath && method === 'PUT') {
        const user = await getAuthUser(request, DB);
        if (!user) return err('Unauthorized', 401);
        const fid = posPath[1];
        const { positions } = await request.json();
        // Upsert all positions
        await DB.prepare('DELETE FROM canvas_positions WHERE family_id = ?').bind(fid).run();
        const entries = Object.entries(positions);
        for (const [mid, pos] of entries) {
          await DB.prepare('INSERT INTO canvas_positions (family_id, member_id, x, y) VALUES (?, ?, ?, ?)').bind(fid, mid, pos.x, pos.y).run();
        }
        return json({ message: 'Posisi disimpan', count: entries.length });
      }

      // ── STORIES ──
      const storyPath = path.match(/^\/api\/families\/([^/]+)\/stories$/);
      if (storyPath && method === 'POST') {
        const user = await getAuthUser(request, DB);
        if (!user) return err('Unauthorized', 401);
        const fid = storyPath[1];
        const collab = await DB.prepare('SELECT role FROM family_collaborators WHERE family_id = ? AND user_id = ?').bind(fid, user.id).first();
        if (!isSuperAdmin(user) && (!collab || collab.role === 'viewer')) return err('Tidak punya izin', 403);
        const s = await request.json();
        const id = 's_' + uid();
        await DB.prepare('INSERT INTO stories (id, family_id, person_id, person_name, text_content, author_name, author_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .bind(id, fid, s.person_id || null, s.person_name || '', s.text, user.name, user.id).run();
        return json({ id }, 201);
      }

      const storyDel = path.match(/^\/api\/families\/([^/]+)\/stories\/([^/]+)$/);
      if (storyDel && method === 'DELETE') {
        const user = await getAuthUser(request, DB);
        if (!user) return err('Unauthorized', 401);
        const [, fid, sid] = storyDel;
        await DB.prepare('DELETE FROM stories WHERE id = ? AND family_id = ?').bind(sid, fid).run();
        return json({ message: 'Cerita dihapus' });
      }

      // ── INVITES ──
      const invPath = path.match(/^\/api\/families\/([^/]+)\/invite$/);
      if (invPath && method === 'POST') {
        const user = await getAuthUser(request, DB);
        if (!user) return err('Unauthorized', 401);
        const fid = invPath[1];
        const collab = await DB.prepare('SELECT role FROM family_collaborators WHERE family_id = ? AND user_id = ?').bind(fid, user.id).first();
        if (!collab || collab.role !== 'owner') return err('Hanya owner bisa invite', 403);
        const { email, role } = await request.json();
        // Check if user exists
        const invitee = await DB.prepare('SELECT * FROM users WHERE email = ?').bind(email.toLowerCase()).first();
        if (invitee) {
          const already = await DB.prepare('SELECT * FROM family_collaborators WHERE family_id = ? AND user_id = ?').bind(fid, invitee.id).first();
          if (already) return err('User sudah bergabung');
          await DB.prepare('INSERT INTO family_collaborators (family_id, user_id, role) VALUES (?, ?, ?)').bind(fid, invitee.id, role || 'editor').run();
          return json({ message: `${invitee.name} bergabung sebagai ${role}` });
        } else {
          await DB.prepare('INSERT INTO invites (family_id, email, role, invited_by) VALUES (?, ?, ?, ?)').bind(fid, email.toLowerCase(), role || 'editor', user.name).run();
          return json({ message: `Undangan dikirim ke ${email}` });
        }
      }

      // ── ADMIN ──
      if (path === '/api/admin/stats' && method === 'GET') {
        const user = await getAuthUser(request, DB);
        if (!user || !isAdmin(user)) return err('Admin access required', 403);
        const tu = await DB.prepare('SELECT COUNT(*) as c FROM users').first();
        const tf = await DB.prepare('SELECT COUNT(*) as c FROM families').first();
        const tm = await DB.prepare('SELECT COUNT(*) as c FROM members').first();
        const ts = await DB.prepare('SELECT COUNT(*) as c FROM stories').first();
        return json({ stats: { totalUsers: tu.c, totalFamilies: tf.c, totalMembers: tm.c, totalStories: ts.c } });
      }

      if (path === '/api/admin/users' && method === 'GET') {
        const user = await getAuthUser(request, DB);
        if (!user || !isAdmin(user)) return err('Admin access required', 403);
        const users = (await DB.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC').all()).results;
        const enriched = [];
        for (const u of users) {
          const fc = await DB.prepare('SELECT COUNT(*) as c FROM family_collaborators WHERE user_id = ?').bind(u.id).first();
          enriched.push({ ...u, familyCount: fc.c });
        }
        return json({ users: enriched });
      }

      const adminUserRole = path.match(/^\/api\/admin\/users\/([^/]+)\/role$/);
      if (adminUserRole && method === 'PUT') {
        const user = await getAuthUser(request, DB);
        if (!user || !isAdmin(user)) return err('Admin access required', 403);
        const targetId = adminUserRole[1];
        const { role } = await request.json();
        if (!['user', 'admin', 'super_admin'].includes(role)) return err('Invalid role');
        if (targetId === user.id) return err('Tidak bisa mengubah role sendiri');
        if ((role === 'super_admin' || role === 'admin') && !isSuperAdmin(user)) return err('Hanya Super Admin yang bisa mempromosikan', 403);
        const target = await DB.prepare('SELECT role FROM users WHERE id = ?').bind(targetId).first();
        if (!target) return err('User tidak ditemukan', 404);
        if (user.role === 'admin' && (target.role === 'admin' || target.role === 'super_admin')) return err('Tidak punya izin', 403);
        await DB.prepare("UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ?").bind(role, targetId).run();
        return json({ message: `Role diubah ke ${role}` });
      }

      const adminUserDel = path.match(/^\/api\/admin\/users\/([^/]+)$/);
      if (adminUserDel && method === 'DELETE') {
        const user = await getAuthUser(request, DB);
        if (!user || !isSuperAdmin(user)) return err('Super Admin access required', 403);
        const targetId = adminUserDel[1];
        if (targetId === user.id) return err('Tidak bisa menghapus diri sendiri');
        await DB.prepare('DELETE FROM family_collaborators WHERE user_id = ?').bind(targetId).run();
        await DB.prepare('DELETE FROM users WHERE id = ?').bind(targetId).run();
        return json({ message: 'User dihapus' });
      }

      if (path === '/api/admin/families' && method === 'GET') {
        const user = await getAuthUser(request, DB);
        if (!user || !isAdmin(user)) return err('Admin access required', 403);
        const families = (await DB.prepare('SELECT f.*, u.name as owner_name FROM families f JOIN users u ON f.owner_id = u.id ORDER BY f.updated_at DESC').all()).results;
        const enriched = [];
        for (const f of families) {
          const mc = await DB.prepare('SELECT COUNT(*) as c FROM members WHERE family_id = ?').bind(f.id).first();
          const cc = await DB.prepare('SELECT COUNT(*) as c FROM family_collaborators WHERE family_id = ?').bind(f.id).first();
          enriched.push({ ...f, memberCount: mc.c, collabCount: cc.c });
        }
        return json({ families: enriched });
      }

      // ── HEALTH ──
      if (path === '/api/health') {
        return json({ status: 'ok', app: 'NASAB API', version: '5.0', timestamp: new Date().toISOString() });
      }

      // ── 404 ──
      return err('Endpoint tidak ditemukan', 404);

    } catch (e) {
      return json({ error: e.message || 'Internal Server Error' }, 500);
    }
  },
};
