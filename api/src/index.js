// ═══════════════════════════════════════════════════════════════
// NASAB API v7.1 — Cloudflare Worker + D1
// ═══════════════════════════════════════════════════════════════

// ─── CORS (restricted) ──────────────────────────────────────
const ALLOWED_ORIGINS = ['https://nasab.biz.id','https://nasab-bua.pages.dev','http://localhost:5173'];
function corsH(request) {
  const o = request.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.some(a => o.startsWith(a.replace(/\/$/, ''))) ? o : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Vary': 'Origin'
  };
}

let _cors = null;// cached per request
function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ..._cors } });
}
function err(msg, status = 400) { return json({ error: msg }, status); }
function uid() { return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`; }

// ─── Anti-spam / pattern detection ──────────────────────────
const SUSPICIOUS_PATTERNS = [
  /^(NAME|DESC|TEST|DEMO|FAMILY|USER|ADMIN)_[A-Z0-9]{4,20}$/i,
  /^[a-z]{10,}$/,
  /^[A-Z]{10,}$/,
  /(.)\1{5,}/,
  /^(test|demo|spam|bot|null|undefined|admin)\d*$/i,
  /^[a-z0-9]{16,}$/i
];
function isSuspiciousInput(text, opts = {}) {
  if (!text || typeof text !== 'string') return false;
  const t = text.trim();
  if (t.length < (opts.minLength || 2)) return true;
  if (t.length > (opts.maxLength || 200)) return true;
  return SUSPICIOUS_PATTERNS.some(p => p.test(t));
}
function validateFamilyName(name) {
  if (!name || typeof name !== 'string') return 'Nama keluarga wajib diisi';
  const t = name.trim();
  if (t.length < 2) return 'Nama keluarga minimal 2 karakter';
  if (t.length > 100) return 'Nama keluarga maksimal 100 karakter';
  if (isSuspiciousInput(t, { minLength: 2, maxLength: 100 })) return 'Nama keluarga tidak valid. Gunakan nama yang masuk akal.';
  return null;
}
function validateDescription(desc) {
  if (!desc) return null;
  if (typeof desc !== 'string') return 'Deskripsi tidak valid';
  const t = desc.trim();
  if (t.length > 500) return 'Deskripsi maksimal 500 karakter';
  if (t.length > 0 && isSuspiciousInput(t, { minLength: 1, maxLength: 500 })) return 'Deskripsi mengandung pola yang tidak valid';
  return null;
}
function validateUserName(name) {
  if (!name || typeof name !== 'string') return 'Nama wajib diisi';
  const t = name.trim();
  if (t.length < 2) return 'Nama minimal 2 karakter';
  if (t.length > 80) return 'Nama maksimal 80 karakter';
  if (isSuspiciousInput(t, { minLength: 2, maxLength: 80 })) return 'Nama tidak valid. Gunakan nama asli.';
  return null;
}
async function rateLimit(binding, key) {
  if (!binding || typeof binding.limit !== 'function') return true;
  try { const { success } = await binding.limit({ key }); return success; }
  catch { return true; }
}
function clientIp(request) { return request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown'; }

// ─── NIK Encryption (AES-GCM) ──────────────────────────────
async function getEncKey(env) {
  const raw = new TextEncoder().encode((env.NIK_ENCRYPTION_KEY || 'nasab-nik-default-key-32chars!!').slice(0, 32));
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}
async function encNIK(nik, env) {
  if (!nik || nik.length < 10) return nik || '';
  const key = await getEncKey(env);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(nik));
  const buf = new Uint8Array(12 + ct.byteLength);
  buf.set(iv); buf.set(new Uint8Array(ct), 12);
  return 'ENC:' + btoa(String.fromCharCode(...buf));
}
async function decNIK(enc, env) {
  if (!enc || !enc.startsWith('ENC:')) return enc || '';
  try {
    const key = await getEncKey(env);
    const buf = Uint8Array.from(atob(enc.slice(4)), c => c.charCodeAt(0));
    const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: buf.slice(0, 12) }, key, buf.slice(12));
    return new TextDecoder().decode(dec);
  } catch { return ''; }
}
function maskNIKStr(nik) { return nik && nik.length >= 16 ? nik.slice(0, 4) + '••••••••' + nik.slice(12) : ''; }

// ─── Auth ───────────────────────────────────────────────────
async function hashPw(pw) {
  const enc = new TextEncoder().encode(pw + 'nasab-salt-2026');
  const hash = await crypto.subtle.digest('SHA-256', enc);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}
async function hashPwPBKDF2(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const km = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, km, 256);
  return `PBKDF2:${btoa(String.fromCharCode(...salt))}:${btoa(String.fromCharCode(...new Uint8Array(bits)))}`;
}
async function verifyPwPBKDF2(password, stored) {
  if (!stored.startsWith('PBKDF2:')) return false;
  const [, sB, hB] = stored.split(':');
  const salt = Uint8Array.from(atob(sB), c => c.charCodeAt(0));
  const km = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, km, 256);
  return btoa(String.fromCharCode(...new Uint8Array(bits))) === hB;
}
async function _signToken(payload, secret) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(payload) + secret));
  return btoa(String.fromCharCode(...new Uint8Array(hash))).slice(0, 16);
}
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
async function makeToken(userId, env) {
  const payload = { uid: userId, exp: Date.now() + 30 * 24 * 3600000 };
  const secret = env.TOKEN_SECRET || 'nasab-secret';
  const sig = await _signToken(payload, secret);
  return btoa(JSON.stringify(payload)) + '.' + sig;
}
async function verifyToken(token, env) {
  try {
    const [payloadB64, providedSig] = token.split('.');
    if (!payloadB64 || !providedSig) return null;
    const payload = JSON.parse(atob(payloadB64));
    if (!payload || !payload.uid || !payload.exp) return null;
    if (payload.exp < Date.now()) return null;
    // Dual-key: try current TOKEN_SECRET first, fall back to legacy literal
    // for tokens issued before TOKEN_SECRET was set as a Worker secret.
    // Remove the 'nasab-secret' fallback after 30-day grace period.
    const secrets = [];
    if (env?.TOKEN_SECRET) secrets.push(env.TOKEN_SECRET);
    secrets.push('nasab-secret');
    for (const secret of secrets) {
      const expected = await _signToken(payload, secret);
      if (timingSafeEqual(providedSig, expected)) return payload.uid;
    }
    return null;
  } catch { return null; }
}
async function getAuthUser(request, DB, env) {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const userId = await verifyToken(auth.slice(7), env);
  if (!userId) return null;
  return DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
}
function isAdmin(user) { return user && (user.role === 'admin' || user.role === 'super_admin'); }
function isSuperAdmin(user) { return user && user.role === 'super_admin'; }

// ─── Audit Trail ────────────────────────────────────────────
const AUDIT_SEV = {'member.deleted':'critical','member.bulk_deleted':'critical','member.nik_changed':'critical','family.role_changed':'critical','admin.role_changed':'critical','admin.user_deleted':'critical','auth.password_reset':'critical','member.created':'warning','member.updated':'warning','family.created':'warning','marriage.created':'warning','auth.login':'info','auth.register':'info','gedcom.imported':'info','event.created':'info','event.deleted':'info','post.created':'info'};
async function audit(DB, request, o) {
  try { const id = 'al_' + uid();
  await DB.prepare('INSERT INTO audit_logs (id,actor_id,actor_name,actor_ip,actor_ua,action,resource_type,resource_id,family_id,details,severity) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    .bind(id, o.actorId||'', o.actorName||'', request.headers.get('CF-Connecting-IP')||'', (request.headers.get('User-Agent')||'').slice(0,200), o.action, o.resourceType, o.resourceId||'', o.familyId||'', o.details||'', AUDIT_SEV[o.action]||'info').run();
  } catch(e) { /* audit must not break main flow */ }
}

// ─── ROUTER ──────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    _cors = corsH(request);
    if (request.method === 'OPTIONS') return new Response(null, { headers: _cors });

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const DB = env.DB;

    try {
      // ── AUTH ──
      if (path === '/api/auth/register' && method === 'POST') {
        if (!await rateLimit(env.REGISTER_LIMIT, clientIp(request))) return err('Terlalu banyak percobaan registrasi. Coba lagi dalam 1 menit.', 429);
        const body = await request.json();
        const name = (body.name || '').trim(), email = (body.email || '').trim(), password = (body.password || '').trim();
        if (!name || !email || !password) return err('Semua field wajib diisi');
        const nameErr = validateUserName(name);
        if (nameErr) return err(nameErr);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err('Email tidak valid');
        if (password.length < 6) return err('Password minimal 6 karakter');
        const existing = await DB.prepare('SELECT id FROM users WHERE email = ?').bind(email.toLowerCase()).first();
        if (existing) return err('Email sudah terdaftar');
        const id = 'u_' + uid();
        const pwHash = await hashPwPBKDF2(password);
        await DB.prepare('INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)').bind(id, name, email.toLowerCase(), pwHash).run();
        const token = await makeToken(id, env);
        audit(DB, request, {action:'auth.register', resourceType:'user', resourceId:id, actorId:id, actorName:name, details:`Registered ${email}`});
        return json({ token, user: { id, name, email: email.toLowerCase(), role: 'user' } });
      }

      if (path === '/api/auth/login' && method === 'POST') {
        if (!await rateLimit(env.LOGIN_LIMIT, clientIp(request))) return err('Terlalu banyak percobaan login. Coba lagi dalam 1 menit.', 429);
        const body = await request.json();
        const email = (body.email || '').trim(), password = (body.password || '').trim();
        if (!email || !password) return err('Email dan password wajib');
        const user = await DB.prepare('SELECT * FROM users WHERE email = ?').bind(email.toLowerCase()).first();
        if (!user) return err('Email atau password salah', 401);
        let valid = false;
        if (user.password_hash.startsWith('PBKDF2:')) {
          valid = await verifyPwPBKDF2(password, user.password_hash);
        } else {
          const legacyHash = await hashPw(password);
          valid = user.password_hash === legacyHash;
          if (valid) {
            const newHash = await hashPwPBKDF2(password);
            await DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(newHash, user.id).run();
          }
        }
        if (!valid) return err('Email atau password salah', 401);
        const token = await makeToken(user.id, env);
        audit(DB, request, {action:'auth.login', resourceType:'user', resourceId:user.id, actorId:user.id, actorName:user.name});
        return json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
      }

      if (path === '/api/auth/me' && method === 'GET') {
        const user = await getAuthUser(request, DB, env);
        if (!user) return err('Unauthorized', 401);
        return json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
      }

      // ── FORGOT PASSWORD ──
      if (path === '/api/auth/reset-password' && method === 'POST') {
        const body = await request.json();
        const email = (body.email || '').trim(), name = (body.name || '').trim(), new_password = (body.new_password || '').trim();
        if (!email || !name || !new_password) return err('Semua field wajib diisi');
        if (new_password.length < 6) return err('Password minimal 6 karakter');
        const user = await DB.prepare('SELECT * FROM users WHERE email = ?').bind(email.toLowerCase()).first();
        if (!user) return err('Email tidak ditemukan');
        if (user.name.toLowerCase().trim() !== name.toLowerCase().trim()) return err('Nama tidak cocok dengan akun');
        const pwHash = await hashPwPBKDF2(new_password);
        await DB.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").bind(pwHash, user.id).run();
        audit(DB, request, {action:'auth.password_reset', resourceType:'user', actorId:'system', details:`Reset for ${email}`});
        return json({ message: 'Password berhasil direset. Silakan login.' });
      }

      // ── FAMILIES ──
      if (path === '/api/families' && method === 'GET') {
        const user = await getAuthUser(request, DB, env);
        if (!user) return err('Unauthorized', 401);
        const rows = isAdmin(user)
          ? await DB.prepare(`SELECT f.*, COALESCE(fc2.role, 'admin_view') as my_role, COUNT(DISTINCT m.id) as member_count, COUNT(DISTINCT CASE WHEN m.location_lat IS NOT NULL THEN m.id END) as geo_count, COUNT(DISTINCT fc.id) as collab_count FROM families f LEFT JOIN family_collaborators fc2 ON f.id = fc2.family_id AND fc2.user_id = ? LEFT JOIN members m ON f.id = m.family_id LEFT JOIN family_collaborators fc ON f.id = fc.family_id GROUP BY f.id ORDER BY f.updated_at DESC`).bind(user.id).all()
          : await DB.prepare(`SELECT f.*, fc2.role as my_role, COUNT(DISTINCT m.id) as member_count, COUNT(DISTINCT CASE WHEN m.location_lat IS NOT NULL THEN m.id END) as geo_count, COUNT(DISTINCT fc.id) as collab_count FROM families f JOIN family_collaborators fc2 ON f.id = fc2.family_id AND fc2.user_id = ? LEFT JOIN members m ON f.id = m.family_id LEFT JOIN family_collaborators fc ON f.id = fc.family_id WHERE fc2.user_id = ? GROUP BY f.id ORDER BY f.updated_at DESC`).bind(user.id, user.id).all();
        return json({ families: rows.results });
      }

      if (path === '/api/families' && method === 'POST') {
        const user = await getAuthUser(request, DB, env);
        if (!user) return err('Unauthorized', 401);
        if (!await rateLimit(env.FAMILY_CREATE_LIMIT, `user:${user.id}`)) return err('Anda membuat keluarga terlalu cepat. Coba lagi dalam 1 menit.', 429);
        const { name, description } = await request.json();
        const nameErr = validateFamilyName(name);
        if (nameErr) return err(nameErr);
        const descErr = validateDescription(description);
        if (descErr) return err(descErr);
        const id = 'f_' + uid();
        await DB.prepare('INSERT INTO families (id, name, description, owner_id) VALUES (?, ?, ?, ?)').bind(id, name.trim(), (description || '').trim(), user.id).run();
        await DB.prepare('INSERT INTO family_collaborators (family_id, user_id, role) VALUES (?, ?, ?)').bind(id, user.id, 'owner').run();
        audit(DB, request, {action:'family.created', resourceType:'family', resourceId:id, familyId:id, actorId:user.id, actorName:user.name, details:name});
        return json({ family: { id, name, description } }, 201);
      }

      // ── FAMILY DETAIL ──
      const famMatch = path.match(/^\/api\/families\/([^/]+)$/);
      if (famMatch && method === 'GET') {
        const user = await getAuthUser(request, DB, env);
        if (!user) return err('Unauthorized', 401);
        const fid = famMatch[1];
        const [collab, family, membersR, collabsR, storiesR, posR, invitesR, marriagesR] = await Promise.all([
          DB.prepare('SELECT * FROM family_collaborators WHERE family_id = ? AND user_id = ?').bind(fid, user.id).first(),
          DB.prepare('SELECT * FROM families WHERE id = ?').bind(fid).first(),
          DB.prepare('SELECT * FROM members WHERE family_id = ? ORDER BY created_at').bind(fid).all(),
          DB.prepare('SELECT fc.*, u.name, u.email FROM family_collaborators fc JOIN users u ON fc.user_id = u.id WHERE fc.family_id = ?').bind(fid).all(),
          DB.prepare('SELECT * FROM stories WHERE family_id = ? ORDER BY created_at DESC').bind(fid).all(),
          DB.prepare('SELECT * FROM canvas_positions WHERE family_id = ?').bind(fid).all(),
          DB.prepare('SELECT * FROM invites WHERE family_id = ?').bind(fid).all(),
          DB.prepare('SELECT * FROM marriages WHERE family_id = ? ORDER BY marriage_order').bind(fid).all()
        ]);
        if (!collab && !isAdmin(user)) return err('Akses ditolak', 403);
        if (!family) return err('Tidak ditemukan', 404);
        const posMap = {};
        posR.results.forEach(p => { posMap[p.member_id] = { x: p.x, y: p.y }; });
        const my_role = collab ? collab.role : (isSuperAdmin(user) ? 'owner' : 'viewer');
        // Decrypt NIK per member based on role
        const members = [];
        for (const m of membersR.results) {
          const nik = m.nik ? await decNIK(m.nik, env) : '';
          const noKk = m.no_kk ? await decNIK(m.no_kk, env) : '';
          if (my_role === 'owner' || isSuperAdmin(user)) { m.nik = nik; m.no_kk = noKk; }
          else if (my_role === 'editor') { m.nik = maskNIKStr(nik); m.no_kk = maskNIKStr(noKk); }
          else { m.nik = ''; m.no_kk = ''; }
          members.push(m);
        }
        return json({ family, members, collaborators: collabsR.results, stories: storiesR.results, positions: posMap, invites: invitesR.results, marriages: marriagesR.results, my_role });
      }

      // ── MEMBERS CRUD ──
      const memPath = path.match(/^\/api\/families\/([^/]+)\/members$/);
      if (memPath && method === 'POST') {
        const user = await getAuthUser(request, DB, env);
        if (!user) return err('Unauthorized', 401);
        const fid = memPath[1];
        const collab = await DB.prepare('SELECT role FROM family_collaborators WHERE family_id = ? AND user_id = ?').bind(fid, user.id).first();
        if (!isSuperAdmin(user) && (!collab || collab.role === 'viewer')) return err('Tidak punya izin', 403);
        const m = await request.json();
        const id = 'p_' + uid();
        const encNik = await encNIK(m.nik || '', env);
        const encKk = await encNIK(m.no_kk || '', env);
        await DB.prepare(`INSERT INTO members (id, family_id, name, gender, birth_date, death_date, birth_place, notes, parent_id, spouse_id, location_lat, location_lng, location_address, nik, agama, no_kk)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, fid, m.name, m.gender || 'male', m.birth_date || '', m.death_date || '', m.birth_place || '', m.notes || '', m.parent_id || null, m.spouse_id || null, m.location_lat || null, m.location_lng || null, m.location_address || '', encNik, m.agama || 'islam', encKk).run();
        // Link spouse bidirectional
        if (m.spouse_id) {
          await DB.prepare('UPDATE members SET spouse_id = ? WHERE id = ? AND family_id = ?').bind(id, m.spouse_id, fid).run();
        }
        audit(DB, request, {action:'member.created', resourceType:'member', resourceId:id, familyId:fid, actorId:user.id, actorName:user.name, details:m.name});
        return json({ id, message: 'Anggota ditambahkan' }, 201);
      }

      // ── DELETE ALL MEMBERS ──
      const delAllPath = path.match(/^\/api\/families\/([^/]+)\/members\/all$/);
      if (delAllPath && method === 'DELETE') {
        const user = await getAuthUser(request, DB, env);
        if (!user) return err('Unauthorized', 401);
        const fid = delAllPath[1];
        const collab = await DB.prepare('SELECT role FROM family_collaborators WHERE family_id = ? AND user_id = ?').bind(fid, user.id).first();
        if (!isSuperAdmin(user) && (!collab || collab.role !== 'owner')) return err('Hanya owner yang bisa hapus semua', 403);
        const count = await DB.prepare('SELECT COUNT(*) as c FROM members WHERE family_id = ?').bind(fid).first();
        await DB.prepare('DELETE FROM canvas_positions WHERE family_id = ?').bind(fid).run();
        await DB.prepare('DELETE FROM marriages WHERE family_id = ?').bind(fid).run();
        await DB.prepare('DELETE FROM members WHERE family_id = ?').bind(fid).run();
        audit(DB, request, {action:'member.bulk_deleted', resourceType:'family', resourceId:fid, familyId:fid, actorId:user.id, actorName:user.name, details:`Deleted ${count.c} members`});
        return json({ message: `${count.c} anggota dihapus`, deleted: count.c });
      }

      const memDetail = path.match(/^\/api\/families\/([^/]+)\/members\/([^/]+)$/);
      if (memDetail && method === 'PUT') {
        const user = await getAuthUser(request, DB, env);
        if (!user) return err('Unauthorized', 401);
        const [, fid, mid] = memDetail;
        const collab = await DB.prepare('SELECT role FROM family_collaborators WHERE family_id = ? AND user_id = ?').bind(fid, user.id).first();
        if (!isSuperAdmin(user) && (!collab || collab.role === 'viewer')) return err('Tidak punya izin', 403);
        const m = await request.json();
        const encNikU = await encNIK(m.nik || '', env);
        const encKkU = await encNIK(m.no_kk || '', env);
        await DB.prepare(`UPDATE members SET name=?, gender=?, birth_date=?, death_date=?, birth_place=?, notes=?, parent_id=?, spouse_id=?, location_lat=?, location_lng=?, location_address=?, nik=?, agama=?, no_kk=?, updated_at=datetime('now') WHERE id=? AND family_id=?`)
          .bind(m.name, m.gender, m.birth_date || '', m.death_date || '', m.birth_place || '', m.notes || '', m.parent_id || null, m.spouse_id || null, m.location_lat || null, m.location_lng || null, m.location_address || '', encNikU, m.agama || 'islam', encKkU, mid, fid).run();
        return json({ message: 'Diperbarui' });
      }

      if (memDetail && method === 'DELETE') {
        const user = await getAuthUser(request, DB, env);
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
        audit(DB, request, {action:'member.deleted', resourceType:'member', resourceId:mid, familyId:fid, actorId:user.id, actorName:user.name});
        return json({ message: 'Dihapus' });
      }

      // ── MARRIAGES ──
      const marPath = path.match(/^\/api\/families\/([^/]+)\/marriages$/);
      if (marPath && method === 'POST') {
        const user = await getAuthUser(request, DB, env);
        if (!user) return err('Unauthorized', 401);
        const fid = marPath[1];
        const collab = await DB.prepare('SELECT role FROM family_collaborators WHERE family_id = ? AND user_id = ?').bind(fid, user.id).first();
        if (!isSuperAdmin(user) && (!collab || collab.role === 'viewer')) return err('Tidak punya izin', 403);
        const m = await request.json();
        if (!m.husband_id || !m.wife_id) return err('Husband dan wife wajib');
        const id = 'm_' + uid();
        const order = m.marriage_order || 1;
        await DB.prepare('INSERT INTO marriages (id, family_id, husband_id, wife_id, marriage_order, marriage_date, divorce_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(id, fid, m.husband_id, m.wife_id, order, m.marriage_date || '', m.divorce_date || '', m.notes || '').run();
        // Auto-link spouse_id on both members if not already set
        const husband = await DB.prepare('SELECT spouse_id FROM members WHERE id = ? AND family_id = ?').bind(m.husband_id, fid).first();
        const wife = await DB.prepare('SELECT spouse_id FROM members WHERE id = ? AND family_id = ?').bind(m.wife_id, fid).first();
        if (husband && !husband.spouse_id) await DB.prepare('UPDATE members SET spouse_id = ? WHERE id = ? AND family_id = ?').bind(m.wife_id, m.husband_id, fid).run();
        if (wife && !wife.spouse_id) await DB.prepare('UPDATE members SET spouse_id = ? WHERE id = ? AND family_id = ?').bind(m.husband_id, m.wife_id, fid).run();
        return json({ id, message: 'Pernikahan ditambahkan' }, 201);
      }

      const marDel = path.match(/^\/api\/families\/([^/]+)\/marriages\/([^/]+)$/);
      if (marDel && method === 'DELETE') {
        const user = await getAuthUser(request, DB, env);
        if (!user) return err('Unauthorized', 401);
        const [, fid, mid] = marDel;
        await DB.prepare('DELETE FROM marriages WHERE id = ? AND family_id = ?').bind(mid, fid).run();
        return json({ message: 'Pernikahan dihapus' });
      }

      // ── POSITIONS ──
      const posPath = path.match(/^\/api\/families\/([^/]+)\/positions$/);
      if (posPath && method === 'PUT') {
        const user = await getAuthUser(request, DB, env);
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
        const user = await getAuthUser(request, DB, env);
        if (!user) return err('Unauthorized', 401);
        const fid = storyPath[1];
        const collab = await DB.prepare('SELECT role FROM family_collaborators WHERE family_id = ? AND user_id = ?').bind(fid, user.id).first();
        if (!isSuperAdmin(user) && !collab) return err('Tidak punya izin', 403);
        const s = await request.json();
        const id = 's_' + uid();
        await DB.prepare('INSERT INTO stories (id, family_id, person_id, person_name, text_content, author_name, author_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .bind(id, fid, s.person_id || null, s.person_name || '', s.text, user.name, user.id).run();
        return json({ id }, 201);
      }

      const storyDel = path.match(/^\/api\/families\/([^/]+)\/stories\/([^/]+)$/);
      if (storyDel && method === 'DELETE') {
        const user = await getAuthUser(request, DB, env);
        if (!user) return err('Unauthorized', 401);
        const [, fid, sid] = storyDel;
        await DB.prepare('DELETE FROM stories WHERE id = ? AND family_id = ?').bind(sid, fid).run();
        return json({ message: 'Cerita dihapus' });
      }

      // ── INVITES ──
      const invPath = path.match(/^\/api\/families\/([^/]+)\/invite$/);
      if (invPath && method === 'POST') {
        const user = await getAuthUser(request, DB, env);
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
        const user = await getAuthUser(request, DB, env);
        if (!user || !isAdmin(user)) return err('Admin access required', 403);
        const tu = await DB.prepare('SELECT COUNT(*) as c FROM users').first();
        const tf = await DB.prepare('SELECT COUNT(*) as c FROM families').first();
        const tm = await DB.prepare('SELECT COUNT(*) as c FROM members').first();
        const ts = await DB.prepare('SELECT COUNT(*) as c FROM stories').first();
        return json({ stats: { totalUsers: tu.c, totalFamilies: tf.c, totalMembers: tm.c, totalStories: ts.c } });
      }

      if (path === '/api/admin/users' && method === 'GET') {
        const user = await getAuthUser(request, DB, env);
        if (!user || !isAdmin(user)) return err('Admin access required', 403);
        const users = (await DB.prepare('SELECT u.id, u.name, u.email, u.role, u.created_at, COUNT(DISTINCT fc.family_id) as familyCount FROM users u LEFT JOIN family_collaborators fc ON u.id = fc.user_id GROUP BY u.id ORDER BY u.created_at DESC').all()).results;
        return json({ users });
      }

      const adminUserRole = path.match(/^\/api\/admin\/users\/([^/]+)\/role$/);
      if (adminUserRole && method === 'PUT') {
        const user = await getAuthUser(request, DB, env);
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
        audit(DB, request, {action:'admin.role_changed', resourceType:'user', resourceId:targetId, actorId:user.id, actorName:user.name, details:`Role → ${role}`});
        return json({ message: `Role diubah ke ${role}` });
      }

      const adminUserDel = path.match(/^\/api\/admin\/users\/([^/]+)$/);
      if (adminUserDel && method === 'DELETE') {
        const user = await getAuthUser(request, DB, env);
        if (!user || !isSuperAdmin(user)) return err('Super Admin access required', 403);
        const targetId = adminUserDel[1];
        if (targetId === user.id) return err('Tidak bisa menghapus diri sendiri');
        await DB.prepare('DELETE FROM family_collaborators WHERE user_id = ?').bind(targetId).run();
        await DB.prepare('DELETE FROM users WHERE id = ?').bind(targetId).run();
        audit(DB, request, {action:'admin.user_deleted', resourceType:'user', resourceId:targetId, actorId:user.id, actorName:user.name});
        return json({ message: 'User dihapus' });
      }

      if (path === '/api/admin/families' && method === 'GET') {
        const user = await getAuthUser(request, DB, env);
        if (!user || !isAdmin(user)) return err('Admin access required', 403);
        const families = (await DB.prepare('SELECT f.*, u.name as owner_name, COUNT(DISTINCT m.id) as memberCount, COUNT(DISTINCT fc.id) as collabCount FROM families f JOIN users u ON f.owner_id = u.id LEFT JOIN members m ON f.id = m.family_id LEFT JOIN family_collaborators fc ON f.id = fc.family_id GROUP BY f.id ORDER BY f.updated_at DESC').all()).results;
        return json({ families });
      }

      // ── BIOGRAPHIES ──
      const bioPath = path.match(/^\/api\/families\/([^/]+)\/biography$/);
      if (bioPath && method === 'POST') {
        const user = await getAuthUser(request, DB, env);
        if (!user) return err('Unauthorized', 401);
        const fid = bioPath[1];
        const { content, is_public } = await request.json();
        if (!content) return err('Content wajib');
        const id = 'b_' + uid();
        const slug = fid.slice(2, 10) + '_' + Math.random().toString(36).slice(2, 8);
        // Upsert: delete old, insert new
        await DB.prepare('DELETE FROM biographies WHERE family_id = ?').bind(fid).run();
        await DB.prepare('INSERT INTO biographies (id, family_id, slug, content, is_public) VALUES (?, ?, ?, ?, ?)').bind(id, fid, slug, content, is_public ? 1 : 0).run();
        return json({ id, slug, message: 'Biografi disimpan' }, 201);
      }

      const bioSlug = path.match(/^\/api\/biography\/([^/]+)$/);
      if (bioSlug && method === 'GET') {
        const slug = bioSlug[1];
        const bio = await DB.prepare('SELECT b.*, f.name as family_name FROM biographies b JOIN families f ON b.family_id = f.id WHERE b.slug = ? AND b.is_public = 1').bind(slug).first();
        if (!bio) return err('Tidak ditemukan', 404);
        return json({ biography: bio });
      }

      // ── MIGRATE NIK (temporary, run once) ──
      if (path === '/api/admin/migrate-nik' && method === 'POST') {
        const user = await getAuthUser(request, DB, env);
        if (!user || !isSuperAdmin(user)) return err('Super Admin required', 403);
        const rows = (await DB.prepare("SELECT id, family_id, nik, no_kk FROM members WHERE (nik != '' AND nik NOT LIKE 'ENC:%') OR (no_kk != '' AND no_kk NOT LIKE 'ENC:%')").all()).results;
        let migrated = 0;
        for (const r of rows) {
          const encNik2 = r.nik && !r.nik.startsWith('ENC:') ? await encNIK(r.nik, env) : r.nik;
          const encKk2 = r.no_kk && !r.no_kk.startsWith('ENC:') ? await encNIK(r.no_kk, env) : r.no_kk;
          await DB.prepare('UPDATE members SET nik=?, no_kk=? WHERE id=?').bind(encNik2, encKk2, r.id).run();
          migrated++;
        }
        return json({ message: `Migrated ${migrated} NIK/KK records`, migrated });
      }

      // ── EVENTS ──
      const evtPath = path.match(/^\/api\/families\/([^/]+)\/events$/);
      if (evtPath && method === 'POST') {
        const user = await getAuthUser(request, DB, env);
        if (!user) return err('Unauthorized', 401);
        const fid = evtPath[1];
        const collab = await DB.prepare('SELECT role FROM family_collaborators WHERE family_id = ? AND user_id = ?').bind(fid, user.id).first();
        if (!isSuperAdmin(user) && !collab) return err('Tidak punya izin', 403);
        const e = await request.json();
        if (!e.title) return err('Judul event wajib');
        const id = 'e_' + uid();
        const slug = fid.slice(2, 8) + '_' + Math.random().toString(36).slice(2, 8);
        await DB.prepare(`INSERT INTO events (id, family_id, title, type, description, event_date, event_time, location_name, location_lat, location_lng, location_address, related_member_id, created_by, is_public, slug, cover_template) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(id, fid, e.title, e.type || '', e.description || '', e.event_date || '', e.event_time || '', e.location_name || '', e.location_lat || null, e.location_lng || null, e.location_address || '', e.related_member_id || null, user.id, e.is_public ? 1 : 0, slug, e.cover_template || '').run();
        return json({ id, slug, message: 'Event dibuat' }, 201);
      }

      if (evtPath && method === 'GET') {
        const user = await getAuthUser(request, DB, env);
        if (!user) return err('Unauthorized', 401);
        const fid = evtPath[1];
        const collab = await DB.prepare('SELECT role FROM family_collaborators WHERE family_id = ? AND user_id = ?').bind(fid, user.id).first();
        if (!isSuperAdmin(user) && !collab) return err('Akses ditolak', 403);
        const events = (await DB.prepare('SELECT * FROM events WHERE family_id = ? ORDER BY event_date DESC').bind(fid).all()).results;
        return json({ events });
      }

      const evtDetail = path.match(/^\/api\/families\/([^/]+)\/events\/([^/]+)$/);
      if (evtDetail && method === 'PUT') {
        const user = await getAuthUser(request, DB, env);
        if (!user) return err('Unauthorized', 401);
        const [, fid, eid] = evtDetail;
        const collab = await DB.prepare('SELECT role FROM family_collaborators WHERE family_id = ? AND user_id = ?').bind(fid, user.id).first();
        if (!isSuperAdmin(user) && (!collab || collab.role === 'viewer')) return err('Tidak punya izin', 403);
        const e = await request.json();
        await DB.prepare(`UPDATE events SET title=?, type=?, description=?, event_date=?, event_time=?, location_name=?, location_lat=?, location_lng=?, location_address=?, related_member_id=?, is_public=?, cover_template=? WHERE id=? AND family_id=?`)
          .bind(e.title, e.type || '', e.description || '', e.event_date || '', e.event_time || '', e.location_name || '', e.location_lat || null, e.location_lng || null, e.location_address || '', e.related_member_id || null, e.is_public ? 1 : 0, e.cover_template || '', eid, fid).run();
        return json({ message: 'Event diperbarui' });
      }

      if (evtDetail && method === 'DELETE') {
        const user = await getAuthUser(request, DB, env);
        if (!user) return err('Unauthorized', 401);
        const [, fid, eid] = evtDetail;
        const collab = await DB.prepare('SELECT role FROM family_collaborators WHERE family_id = ? AND user_id = ?').bind(fid, user.id).first();
        if (!isSuperAdmin(user) && (!collab || collab.role === 'viewer')) return err('Tidak punya izin', 403);
        await DB.prepare('DELETE FROM event_rsvps WHERE event_id = ?').bind(eid).run();
        await DB.prepare('DELETE FROM events WHERE id = ? AND family_id = ?').bind(eid, fid).run();
        return json({ message: 'Event dihapus' });
      }

      // ── EVENT RSVP ──
      const rsvpPath = path.match(/^\/api\/events\/([^/]+)\/rsvp$/);
      if (rsvpPath && method === 'POST') {
        const eid = rsvpPath[1];
        const user = await getAuthUser(request, DB, env);
        const evt = await DB.prepare('SELECT * FROM events WHERE id = ?').bind(eid).first();
        if (!evt) return err('Event tidak ditemukan', 404);
        if (!user && !evt.is_public) return err('Unauthorized', 401);
        const b = await request.json();
        if (!b.status) return err('Status RSVP wajib');
        if (user) {
          const existing = await DB.prepare('SELECT id FROM event_rsvps WHERE event_id = ? AND user_id = ?').bind(eid, user.id).first();
          if (existing) {
            await DB.prepare('UPDATE event_rsvps SET status=?, message=?, guest_name=? WHERE id=?').bind(b.status, b.message || '', user.name, existing.id).run();
          } else {
            await DB.prepare('INSERT INTO event_rsvps (event_id, user_id, guest_name, status, message) VALUES (?, ?, ?, ?, ?)').bind(eid, user.id, user.name, b.status, b.message || '').run();
          }
        } else {
          if (!b.guest_name) return err('Nama tamu wajib untuk RSVP publik');
          const existing = await DB.prepare('SELECT id FROM event_rsvps WHERE event_id = ? AND guest_name = ? AND user_id IS NULL').bind(eid, b.guest_name).first();
          if (existing) {
            await DB.prepare('UPDATE event_rsvps SET status=?, message=? WHERE id=?').bind(b.status, b.message || '', existing.id).run();
          } else {
            await DB.prepare('INSERT INTO event_rsvps (event_id, guest_name, status, message) VALUES (?, ?, ?, ?)').bind(eid, b.guest_name, b.status, b.message || '').run();
          }
        }
        return json({ message: 'RSVP disimpan' });
      }

      // ── PUBLIC EVENT ──
      const pubEvt = path.match(/^\/api\/events\/public\/([^/]+)$/);
      if (pubEvt && method === 'GET') {
        const slug = pubEvt[1];
        const evt = await DB.prepare('SELECT e.*, f.name as family_name FROM events e JOIN families f ON e.family_id = f.id WHERE e.slug = ? AND e.is_public = 1').bind(slug).first();
        if (!evt) return err('Event tidak ditemukan', 404);
        const rsvps = (await DB.prepare('SELECT guest_name, status, message, created_at FROM event_rsvps WHERE event_id = ? ORDER BY created_at DESC').bind(evt.id).all()).results;
        return json({ event: evt, rsvps });
      }

      // ── FEED ──
      const feedPath = path.match(/^\/api\/families\/([^/]+)\/feed$/);
      if (feedPath && method === 'GET') {
        const user = await getAuthUser(request, DB, env);
        if (!user) return err('Unauthorized', 401);
        const fid = feedPath[1];
        const collab = await DB.prepare('SELECT role FROM family_collaborators WHERE family_id = ? AND user_id = ?').bind(fid, user.id).first();
        if (!isSuperAdmin(user) && !collab) return err('Akses ditolak', 403);
        const posts = (await DB.prepare('SELECT p.*, (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as like_count, (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id AND user_id = ?) as liked_by_me FROM posts p WHERE p.family_id = ? ORDER BY p.created_at DESC LIMIT 50').bind(user.id, fid).all()).results;
        const postIds = posts.map(p => p.id);
        let comments = [];
        if (postIds.length > 0) {
          const placeholders = postIds.map(() => '?').join(',');
          comments = (await DB.prepare(`SELECT * FROM post_comments WHERE post_id IN (${placeholders}) ORDER BY created_at ASC`).bind(...postIds).all()).results;
        }
        // Attach comments to posts
        const commentMap = {};
        comments.forEach(c => { (commentMap[c.post_id] = commentMap[c.post_id] || []).push(c); });
        posts.forEach(p => { p.comments = commentMap[p.id] || []; p.liked_by_me = !!p.liked_by_me; });
        return json({ posts });
      }

      // ── POSTS ──
      const postPath = path.match(/^\/api\/families\/([^/]+)\/posts$/);
      if (postPath && method === 'POST') {
        const user = await getAuthUser(request, DB, env);
        if (!user) return err('Unauthorized', 401);
        const fid = postPath[1];
        const collab = await DB.prepare('SELECT role FROM family_collaborators WHERE family_id = ? AND user_id = ?').bind(fid, user.id).first();
        if (!isSuperAdmin(user) && !collab) return err('Tidak punya izin', 403);
        const b = await request.json();
        if (!b.content) return err('Konten wajib');
        const id = 'pt_' + uid();
        await DB.prepare('INSERT INTO posts (id, family_id, author_id, author_name, content, post_type, related_member_id, related_event_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(id, fid, user.id, user.name, b.content, b.post_type || 'text', b.related_member_id || null, b.related_event_id || null).run();
        return json({ id, message: 'Post dibuat' }, 201);
      }

      const postDel = path.match(/^\/api\/families\/([^/]+)\/posts\/([^/]+)$/);
      if (postDel && method === 'DELETE') {
        const user = await getAuthUser(request, DB, env);
        if (!user) return err('Unauthorized', 401);
        const [, fid, pid] = postDel;
        const post = await DB.prepare('SELECT * FROM posts WHERE id = ? AND family_id = ?').bind(pid, fid).first();
        if (!post) return err('Post tidak ditemukan', 404);
        const collab = await DB.prepare('SELECT role FROM family_collaborators WHERE family_id = ? AND user_id = ?').bind(fid, user.id).first();
        if (post.author_id !== user.id && (!collab || collab.role !== 'owner') && !isSuperAdmin(user)) return err('Tidak punya izin', 403);
        await DB.prepare('DELETE FROM post_likes WHERE post_id = ?').bind(pid).run();
        await DB.prepare('DELETE FROM post_comments WHERE post_id = ?').bind(pid).run();
        await DB.prepare('DELETE FROM posts WHERE id = ? AND family_id = ?').bind(pid, fid).run();
        return json({ message: 'Post dihapus' });
      }

      // ── POST LIKES ──
      const likePath = path.match(/^\/api\/posts\/([^/]+)\/like$/);
      if (likePath && method === 'POST') {
        const user = await getAuthUser(request, DB, env);
        if (!user) return err('Unauthorized', 401);
        const pid = likePath[1];
        const existing = await DB.prepare('SELECT post_id FROM post_likes WHERE post_id = ? AND user_id = ?').bind(pid, user.id).first();
        if (existing) {
          await DB.prepare('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?').bind(pid, user.id).run();
          return json({ liked: false, message: 'Like dihapus' });
        } else {
          await DB.prepare('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)').bind(pid, user.id).run();
          return json({ liked: true, message: 'Liked' });
        }
      }

      // ── POST COMMENTS ──
      const cmtPath = path.match(/^\/api\/posts\/([^/]+)\/comments$/);
      if (cmtPath && method === 'POST') {
        const user = await getAuthUser(request, DB, env);
        if (!user) return err('Unauthorized', 401);
        const pid = cmtPath[1];
        const b = await request.json();
        if (!b.content) return err('Komentar wajib');
        const id = 'cm_' + uid();
        await DB.prepare('INSERT INTO post_comments (id, post_id, author_id, author_name, content) VALUES (?, ?, ?, ?, ?)').bind(id, pid, user.id, user.name, b.content).run();
        return json({ id, message: 'Komentar ditambahkan' }, 201);
      }

      // ── DELETE COMMENT ──
      const cmtDel = path.match(/^\/api\/comments\/([^/]+)$/);
      if (cmtDel && method === 'DELETE') {
        const user = await getAuthUser(request, DB, env);
        if (!user) return err('Unauthorized', 401);
        const cid = cmtDel[1];
        const cmt = await DB.prepare('SELECT * FROM post_comments WHERE id = ?').bind(cid).first();
        if (!cmt) return err('Komentar tidak ditemukan', 404);
        if (cmt.author_id !== user.id && !isSuperAdmin(user)) return err('Tidak punya izin', 403);
        await DB.prepare('DELETE FROM post_comments WHERE id = ?').bind(cid).run();
        return json({ message: 'Komentar dihapus' });
      }

      // ── ADMIN AUDIT ──
      if (path === '/api/admin/audit' && method === 'GET') {
        const user = await getAuthUser(request, DB, env);
        if (!user || !isAdmin(user)) return err('Admin required', 403);
        const fid = url.searchParams.get('family_id') || '';
        const action = url.searchParams.get('action') || '';
        const severity = url.searchParams.get('severity') || '';
        const from = url.searchParams.get('from') || '';
        const to = url.searchParams.get('to') || '';
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 500);
        let q = 'SELECT * FROM audit_logs WHERE 1=1';
        const binds = [];
        if (fid) { q += ' AND family_id = ?'; binds.push(fid); }
        if (action) { q += ' AND action = ?'; binds.push(action); }
        if (severity) { q += ' AND severity = ?'; binds.push(severity); }
        if (from) { q += ' AND timestamp >= ?'; binds.push(from); }
        if (to) { q += ' AND timestamp <= ?'; binds.push(to); }
        q += ' ORDER BY timestamp DESC LIMIT ?';
        binds.push(limit);
        const stmt = DB.prepare(q);
        const r = binds.length ? await stmt.bind(...binds).all() : await stmt.all();
        return json({ logs: r.results });
      }

      // ── HEALTH ──
      if (path === '/api/health') {
        return json({ status: 'ok', app: 'NASAB API', version: '5.0.0', developer: 'M Sopian Hadianto', org: 'Labbaik AI', timestamp: new Date().toISOString() });
      }

      // ── PUBLIC STATS (no auth — aggregate counts only) ──
      if (path === '/api/public/stats' && method === 'GET') {
        const [u, f, m] = await Promise.all([
          DB.prepare('SELECT COUNT(*) as c FROM users').first(),
          DB.prepare('SELECT COUNT(*) as c FROM families').first(),
          DB.prepare('SELECT COUNT(*) as c FROM members').first(),
        ]);
        return json({ users: u?.c || 0, families: f?.c || 0, members: m?.c || 0 });
      }

      // ── 404 ──
      return err('Endpoint tidak ditemukan', 404);

    } catch (e) {
      return json({ error: e.message || 'Internal Server Error' }, 500);
    }
  },
};
