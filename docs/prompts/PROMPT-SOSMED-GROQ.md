# NASAB v7.2 — Sosmed Keluarga + Groq AI

Tambah fitur sosial keluarga (Events, Undangan Digital, Family Feed) dan ganti/tambah Groq API sebagai opsi AI (selain Claude API yang sudah ada). Kerjakan semua, deploy.

---

## KONTEKS
- Version: 7.1.0, live di nasab.biz.id
- Semua issue Sachlani (canvas overlap, spouse descendants, delete all, POV tree) sudah solved
- AI biography sudah pakai Claude API via `anthropic-dangerous-direct-browser-access` + user API key di localStorage `nasab-claude-key`
- Sekarang tambah Groq API sebagai opsi AI (gratis, cepat, user punya key)
- Groq API endpoint: `https://api.groq.com/openai/v1/chat/completions`
- Groq model: `llama-3.3-70b-versatile` (atau `llama-3.1-70b-versatile`)
- Groq API compatible dengan OpenAI format

---

## FITUR 1: Groq API Integration

### 1A. Dual AI Provider
User bisa pilih AI provider: **Claude** (existing) atau **Groq** (baru).

Settings/localStorage:
```javascript
// Existing:
localStorage.getItem('nasab-claude-key')  // Claude API key

// Baru:
localStorage.getItem('nasab-groq-key')    // Groq API key  
localStorage.getItem('nasab-ai-provider') // 'claude' | 'groq' (default: 'groq' karena gratis)
```

### 1B. AI Settings Panel
Di workspace header atau settings, tambah section "⚙️ AI Settings":
- Radio: Provider [Claude | Groq]
- Input: API Key (masked, save to localStorage)
- Test button: "Test Koneksi" → call provider → show ✅/❌
- Info text: "Groq: gratis & cepat (Llama 3). Claude: lebih detail."

### 1C. Groq API Call Pattern
```javascript
async function callGroq(prompt, systemPrompt = '') {
  const key = localStorage.getItem('nasab-groq-key');
  if (!key) throw new Error('Groq API key belum diset');
  
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.7
    })
  });
  
  const data = await r.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices[0].message.content;
}
```

### 1D. Abstraksi AI Call
```javascript
async function callAI(prompt, systemPrompt = '') {
  const provider = localStorage.getItem('nasab-ai-provider') || 'groq';
  
  if (provider === 'groq') {
    return callGroq(prompt, systemPrompt);
  } else {
    return callClaude(prompt); // existing Claude API call
  }
}
```

### 1E. Apply ke Semua Fitur AI
- **Kisah Keluarga AI biography**: ganti direct Claude call → `callAI()`
- **KK OCR**: untuk OCR foto KK, **tetap pakai Claude API** (karena Groq tidak support vision/image). Tampilkan note: "OCR foto memerlukan Claude API key"
- **Fitur baru** (feed AI, event suggestions): pakai `callAI()`

---

## FITUR 2: Acara Keluarga (Events)

### Schema D1
```sql
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT DEFAULT 'lainnya',
  description TEXT DEFAULT '',
  event_date TEXT NOT NULL,
  event_time TEXT DEFAULT '',
  location_name TEXT DEFAULT '',
  location_lat REAL,
  location_lng REAL,
  location_address TEXT DEFAULT '',
  related_member_id TEXT,
  created_by TEXT,
  is_public INTEGER DEFAULT 0,
  slug TEXT UNIQUE,
  cover_template TEXT DEFAULT 'classic',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS event_rsvps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL,
  user_id TEXT,
  guest_name TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  message TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_events_family ON events(family_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_rsvps_event ON event_rsvps(event_id);
```

### Event Types
```javascript
const EVENT_TYPES = [
  { id: 'nikah', label: 'Pernikahan', icon: '💍' },
  { id: 'aqiqah', label: 'Aqiqah', icon: '🐑' },
  { id: 'khitan', label: 'Khitanan', icon: '🎉' },
  { id: 'syukuran', label: 'Syukuran', icon: '🤲' },
  { id: 'reuni', label: 'Reuni Keluarga', icon: '👨‍👩‍👧‍👦' },
  { id: 'tahlilan', label: 'Tahlilan', icon: '📿' },
  { id: 'arisan', label: 'Arisan', icon: '💰' },
  { id: 'milad', label: 'Ulang Tahun', icon: '🎂' },
  { id: 'wisuda', label: 'Wisuda', icon: '🎓' },
  { id: 'lainnya', label: 'Lainnya', icon: '📅' }
];
```

### API Endpoints
```
POST   /api/families/:fid/events          — Create event (editor+)
GET    /api/families/:fid/events          — List events for family
GET    /api/families/:fid/events/:eid     — Event detail + RSVPs  
PUT    /api/families/:fid/events/:eid     — Update event
DELETE /api/families/:fid/events/:eid     — Delete event
POST   /api/events/:eid/rsvp              — RSVP (auth OR guest name)
GET    /api/events/public/:slug           — Public event + invitation (NO auth)
```

### Frontend
- Tab baru **"🏠 Keluarga"** di nav (setelah Kisah, sebelum Waris)
- Section "📅 Acara": horizontal scroll cards, + Acara button → modal form
- Form: Judul, Tipe (dropdown), Tanggal, Waktu, Lokasi (GeoInput), Deskripsi, Link ke member
- Card: icon + judul + tanggal + RSVP count
- Click card → detail + RSVP list + share buttons
- RSVP: Hadir ✅ / Tidak ❌ / Mungkin ❓ — klik langsung (logged-in) atau form nama (guest)
- Fetch events saat masuk tab Keluarga (lazy, tidak di family detail load)

---

## FITUR 3: Undangan Digital

### Dari event → "📨 Buat Undangan"
- 4 template CSS-only (no images):
  - `classic`: Elegan, gold borders, Instrument Serif
  - `islamic`: Bismillah header, CSS geometric pattern, green+gold
  - `modern`: Clean teal, DM Sans, whitespace
  - `festive`: Gradient, rounded, playful

### Public Invitation Page
```
URL: nasab.biz.id/#/undangan/[slug]
```

Layout:
```
┌────────────────────────────────┐
│     بسم الله الرحمن الرحيم      │ ← islamic only
│                                │
│    💍 PERNIKAHAN               │
│    Ahmad & Fatimah             │
│                                │
│    📅 Sabtu, 8 Juni 2026      │
│    🕐 10:00 WIB               │
│    📍 Gedung, Samarinda       │
│                                │
│    ┌─── RSVP ───────────┐     │
│    │ Nama: [________]    │     │
│    │ ○ Hadir ○ Tidak     │     │
│    │ Pesan: [________]   │     │
│    │       [Kirim]       │     │
│    └─────────────────────┘     │
│                                │
│    Keluarga Besar Syachroel    │
│    via NASAB · nasab.biz.id   │
└────────────────────────────────┘
```

### Share
- Copy link button
- QR Code: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${url}`
- WhatsApp: `https://wa.me/?text=Undangan%20${title}%20${url}`
- Download as image (html2canvas, atau reuse html2pdf logic)

### Frontend Routing
```javascript
// Di App component root:
// Detect hash routes for public pages
const hash = window.location.hash;
if (hash.startsWith('#/undangan/')) return <InvitationPage slug={hash.split('/')[2]} />;
if (hash.startsWith('#/kisah/')) return <BiographyPage slug={hash.split('/')[2]} />;
// else normal app flow
```

---

## FITUR 4: Family Feed

### Schema D1
```sql
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  author_name TEXT DEFAULT '',
  content TEXT NOT NULL,
  post_type TEXT DEFAULT 'text',
  related_member_id TEXT,
  related_event_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS post_comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  author_name TEXT DEFAULT '',
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS post_likes (
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_posts_family ON posts(family_id);
CREATE INDEX IF NOT EXISTS idx_comments_post ON post_comments(post_id);
```

### API Endpoints
```
GET    /api/families/:fid/feed            — Feed (posts sorted by date, paginated)
POST   /api/families/:fid/posts           — Create post (editor+)
DELETE /api/families/:fid/posts/:pid      — Delete post (author or owner)
POST   /api/posts/:pid/like               — Toggle like
POST   /api/posts/:pid/comments           — Add comment
DELETE /api/comments/:cid                 — Delete comment (author)
```

### Post Types
```javascript
{ text: '💬', announcement: '📢', milestone: '🏆', memory: '📸' }
```

### Auto-Generated Feed Items (client-side, not stored in DB)
```javascript
function getAutoFeed(members, events) {
  const auto = [];
  // Birthday reminders (7 hari ke depan)
  members.filter(m => m.birth_date && !m.death_date).forEach(m => {
    const bd = new Date(m.birth_date);
    const now = new Date();
    const next = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
    if (next < now) next.setFullYear(next.getFullYear() + 1);
    const days = Math.floor((next - now) / 86400000);
    if (days >= 0 && days <= 7) {
      auto.push({ id: `auto_bday_${m.id}`, post_type: 'auto_birthday',
        content: days === 0 ? `🎂 Hari ini ulang tahun ${m.name}!` : `🎂 ${days} hari lagi ulang tahun ${m.name}`,
        created_at: new Date().toISOString(), author_name: 'NASAB', isAuto: true });
    }
  });
  // Upcoming events (14 hari)
  (events || []).filter(e => {
    const d = Math.floor((new Date(e.event_date) - new Date()) / 86400000);
    return d >= 0 && d <= 14;
  }).forEach(e => {
    const d = Math.floor((new Date(e.event_date) - new Date()) / 86400000);
    auto.push({ id: `auto_evt_${e.id}`, post_type: 'auto_event',
      content: d === 0 ? `📅 Hari ini: ${e.title}!` : `📅 ${d} hari lagi: ${e.title}`,
      created_at: new Date().toISOString(), author_name: 'NASAB', isAuto: true });
  });
  return auto;
}
```

### Frontend Feed Section (di tab 🏠 Keluarga)
- Compose box: textarea + tipe dropdown + posting button
- Feed cards: avatar + nama + waktu + content + likes + comments
- Like: toggle ❤️, optimistic update
- Comments: expandable, inline reply
- Auto-posts: different style (dashed border, muted, no like/comment)
- Infinite scroll atau "Muat lebih" button
- Merge user posts + auto feed → sort by date

### AI-Powered Feature (pakai Groq/Claude via callAI):
- "✨ AI Suggest" button di compose box → generate post suggestion based on recent family events/birthdays
- Prompt: "Berdasarkan data keluarga berikut, buat posting singkat 1-2 kalimat yang hangat: [data]"

---

## TAB LAYOUT

```
Nav: Canvas | Peta | Daftar | Stats | Timeline | 📖Kisah | 🏠Keluarga | ⚖️Waris
```

Tab "🏠 Keluarga" layout:
```
┌─────────────────────────────────────┐
│ 📅 Acara Mendatang     [+ Acara]   │
│ ┌─────┐ ┌─────┐ ┌─────┐           │
│ │Nikah│ │Reuni│ │Milad│ → scroll   │
│ └─────┘ └─────┘ └─────┘           │
│                                     │
│ 📢 Feed Keluarga                    │
│ ┌─────────────────────────────┐    │
│ │ [Tulis untuk keluarga...]   │    │
│ │              [✨AI] [Kirim] │    │
│ └─────────────────────────────┘    │
│ ┌─ Post ─────────────────────┐     │
│ │ 👤 Sopian · 2jam           │     │
│ │ "Athallah lulus SD!"       │     │
│ │ ❤️ 3  💬 2      [❤️] [💬] │     │
│ └────────────────────────────┘     │
│ ┌─ Auto ─────────────────────┐     │
│ │ 🎂 Khalisa ultah besok!    │     │
│ └────────────────────────────┘     │
└─────────────────────────────────────┘
```

---

## REQUIREMENTS

1. Update `frontend/nasab.jsx` + `api/src/index.js` + `schema.sql`
2. Run schema migration: `npx wrangler d1 execute nasab-db --remote --file=../schema.sql`
3. Tambah nav tab "🏠 Keluarga"
4. Public routes: `#/undangan/:slug` (reuse pattern dari `#/kisah/:slug` yang sudah ada)
5. Groq API calls langsung dari browser (sama pattern seperti Claude API yang sudah ada)
6. **JANGAN break** existing: Canvas POV, GEDCOM, Faraidh, Kisah, Filters, PWA, Admin, dll
7. Lazy load: events + feed data hanya di-fetch saat masuk tab Keluarga
8. Bump version → v7.2, bump sw.js CACHE
9. Deploy:
   ```bash
   cd api && npx wrangler deploy
   cd ../frontend && npm run build && npx wrangler pages deploy dist --project-name=nasab --branch=main --commit-dirty=true
   ```

## PRIVACY
- Feed posts hanya visible oleh family collaborators
- Public invitation: hanya info event + RSVP, tanpa data family
- Guest RSVP: nama saja, no email required
- NIK NEVER muncul di posts/events/invitations
