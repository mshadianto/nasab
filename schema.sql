-- ═══════════════════════════════════════════════
-- NASAB Database Schema — Cloudflare D1
-- Database: nasab-db (745e2555-b659-4eb7-bc60-5a705eb6a15a)
-- Status: DEPLOYED ✅
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS families (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  owner_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS family_collaborators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer', -- owner | editor | viewer
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(family_id, user_id)
);

CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  name TEXT NOT NULL,
  gender TEXT NOT NULL DEFAULT 'male',
  birth_date TEXT DEFAULT '',
  death_date TEXT DEFAULT '',
  birth_place TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  parent_id TEXT,
  spouse_id TEXT,
  location_lat REAL,
  location_lng REAL,
  location_address TEXT DEFAULT '',
  photo TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS stories (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  person_id TEXT,
  person_name TEXT DEFAULT '',
  text_content TEXT NOT NULL,
  author_name TEXT DEFAULT '',
  author_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS invites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor',
  invited_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS canvas_positions (
  family_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  x REAL NOT NULL DEFAULT 0,
  y REAL NOT NULL DEFAULT 0,
  PRIMARY KEY (family_id, member_id),
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

-- NIK column (migration)
ALTER TABLE members ADD COLUMN nik TEXT DEFAULT '';

-- Agama column (migration)
ALTER TABLE members ADD COLUMN agama TEXT DEFAULT 'islam';

-- No KK column (migration)
ALTER TABLE members ADD COLUMN no_kk TEXT DEFAULT '';

-- Marriages table for polygamy support
CREATE TABLE IF NOT EXISTS marriages (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  husband_id TEXT NOT NULL,
  wife_id TEXT NOT NULL,
  marriage_order INTEGER DEFAULT 1,
  marriage_date TEXT DEFAULT '',
  divorce_date TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_marriages_family ON marriages(family_id);
CREATE INDEX IF NOT EXISTS idx_marriages_husband ON marriages(husband_id);
CREATE INDEX IF NOT EXISTS idx_marriages_wife ON marriages(wife_id);

-- Biographies table
CREATE TABLE IF NOT EXISTS biographies (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  is_public INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

-- Events
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

-- Feed
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

CREATE INDEX IF NOT EXISTS idx_events_family ON events(family_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_rsvps_event ON event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_posts_family ON posts(family_id);
CREATE INDEX IF NOT EXISTS idx_comments_post ON post_comments(post_id);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT DEFAULT (datetime('now')),
  actor_id TEXT NOT NULL,
  actor_name TEXT DEFAULT '',
  actor_ip TEXT DEFAULT '',
  actor_ua TEXT DEFAULT '',
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT DEFAULT '',
  family_id TEXT DEFAULT '',
  details TEXT DEFAULT '',
  severity TEXT DEFAULT 'info'
);
CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_family ON audit_logs(family_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_members_family ON members(family_id);
CREATE INDEX IF NOT EXISTS idx_members_parent ON members(parent_id);
CREATE INDEX IF NOT EXISTS idx_stories_family ON stories(family_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_family ON family_collaborators(family_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_user ON family_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
