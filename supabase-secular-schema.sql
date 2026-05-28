-- Secular Domain Schema
-- Run this in your Supabase SQL editor

-- ── secular_books ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS secular_books (
  id         uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid     NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title      text     NOT NULL,
  author     text,
  status     text     NOT NULL DEFAULT 'want',  -- want | reading | done
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE secular_books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_secular_books" ON secular_books;
CREATE POLICY "users_own_secular_books"
  ON secular_books FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS secular_books_user
  ON secular_books (user_id, created_at DESC);

-- ── secular_projects ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS secular_projects (
  id          uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid     NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title       text     NOT NULL,
  description text,
  status      text     NOT NULL DEFAULT 'active',  -- active | done
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE secular_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_secular_projects" ON secular_projects;
CREATE POLICY "users_own_secular_projects"
  ON secular_projects FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS secular_projects_user
  ON secular_projects (user_id, created_at DESC);
