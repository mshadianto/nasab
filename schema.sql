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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_members_family ON members(family_id);
CREATE INDEX IF NOT EXISTS idx_members_parent ON members(parent_id);
CREATE INDEX IF NOT EXISTS idx_stories_family ON stories(family_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_family ON family_collaborators(family_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_user ON family_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
