-- ============================================================
-- NASAB D1 Migration: Security Hardening v1
-- File:   api/migration_2026-05-12_security_hardening.sql
-- Target: nasab-db (745e2555-b659-4eb7-bc60-5a705eb6a15a)
-- Date:   2026-05-12
-- Trigger: QA report from Nabil A. Pangestu → source audit
-- Scope:  PROMPT-SECURITY-HARDENING-v1.md Group B
-- ============================================================
-- Additive ONLY — every CREATE uses IF NOT EXISTS, the backfill
-- INSERT is guarded by NOT EXISTS. Safe to re-run.
--
-- REQUIRED BEFORE Worker code deploy (commits 4e52dad → cbd9a76).
-- The Worker references `sessions` and `password_resets` tables;
-- deploying code first would 500 on every authed request.
--
-- Apply order:
--   cd api/
--   npx wrangler d1 execute nasab-db --local  --file=migration_2026-05-12_security_hardening.sql   # dry-run
--   npx wrangler d1 execute nasab-db --remote --file=migration_2026-05-12_security_hardening.sql   # production
-- ============================================================

-- 1. Token-based password reset (replaces vulnerable name-matching flow)
CREATE TABLE IF NOT EXISTS password_resets (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  token_hash  TEXT NOT NULL UNIQUE,           -- SHA-256 of token, not plaintext
  expires_at  INTEGER NOT NULL,                -- unix timestamp (seconds)
  used        INTEGER NOT NULL DEFAULT 0,
  used_at     TEXT,
  created_at  TEXT DEFAULT (datetime('now')),
  created_ip  TEXT DEFAULT '',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_password_resets_user
  ON password_resets(user_id);

-- Partial index: only "active" (unused) rows. Speeds up the lookup
-- by token_hash (which already has UNIQUE auto-index) AND the future
-- cleanup query `WHERE used = 0 AND expires_at < now`.
CREATE INDEX IF NOT EXISTS idx_password_resets_active
  ON password_resets(expires_at)
  WHERE used = 0;


-- 2. Session table — makes JWT revocable, expiry 30d → 24h
CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,                -- sess_<32hex>, embedded in JWT as `sid`
  user_id     TEXT NOT NULL,
  expires_at  INTEGER NOT NULL,                -- unix timestamp
  created_at  TEXT DEFAULT (datetime('now')),
  created_ip  TEXT DEFAULT '',
  user_agent  TEXT DEFAULT '',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user
  ON sessions(user_id);  -- used by reset-password DELETE WHERE user_id = ?

CREATE INDEX IF NOT EXISTS idx_sessions_expires
  ON sessions(expires_at);  -- used by future cleanup cron


-- 3. Audit log composite indexes for admin tooling.
-- audit_logs already has single-col indexes idx_audit_ts, idx_audit_actor,
-- idx_audit_family, idx_audit_action (pre-existing). The composites below
-- let the SQLite planner satisfy WHERE+ORDER BY in ONE index scan for the
-- common admin queries: "recent events of severity=critical", "recent
-- actions of type=auth.password_reset", "family-X history".
CREATE INDEX IF NOT EXISTS idx_audit_severity_ts
  ON audit_logs(severity, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_audit_action_ts
  ON audit_logs(action, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_audit_family_ts
  ON audit_logs(family_id, timestamp DESC);


-- 4. Backfill: family_collaborators rows for legacy owners (Task #7).
--
-- A4c MED-04 (positions PUT) now enforces editor+ via family_collaborators
-- with a single-path check (matches 9 sibling handlers). Any legacy `families`
-- row whose `owner_id` has no matching row in `family_collaborators` would
-- 403 the actual owner on their own family. This INSERT fixes all such rows
-- at migration time, avoiding per-request dual-path code in the Worker.
--
-- Idempotent: the NOT EXISTS subquery guarantees we only insert where the
-- composite UNIQUE(family_id, user_id) isn't already satisfied. Safe to
-- re-run after partial application.
INSERT INTO family_collaborators (family_id, user_id, role)
SELECT f.id, f.owner_id, 'owner'
FROM families f
WHERE NOT EXISTS (
  SELECT 1 FROM family_collaborators fc
  WHERE fc.family_id = f.id AND fc.user_id = f.owner_id
);


-- 5. Cleanup utility queries (MANUAL — NOT run by this migration).
-- Reference for a future cron worker / admin endpoint:
--   DELETE FROM password_resets WHERE expires_at < strftime('%s','now') - 86400;
--   DELETE FROM sessions        WHERE expires_at < strftime('%s','now');
