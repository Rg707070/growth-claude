-- Domain Ecosystem Schema
-- Run this in your Supabase SQL editor to enable the domain ecosystem features
-- for all non-family, non-torah domains (friends, secular, sports, finance, music)

-- ── domain_tasks ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS domain_tasks (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  domain_slug text        NOT NULL,
  title       text        NOT NULL,
  category    text        NOT NULL DEFAULT 'other',
  urgency     text        NOT NULL DEFAULT 'normal',   -- low | normal | high | critical
  status      text        NOT NULL DEFAULT 'pending',  -- pending | done
  due_date    date,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE domain_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_domain_tasks" ON domain_tasks;
CREATE POLICY "users_own_domain_tasks"
  ON domain_tasks FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS domain_tasks_user_domain
  ON domain_tasks (user_id, domain_slug);

-- ── domain_goals ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS domain_goals (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  domain_slug text        NOT NULL,
  title       text        NOT NULL,
  type        text        NOT NULL DEFAULT 'other',
  status      text        NOT NULL DEFAULT 'active',   -- active | done | backlog
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE domain_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_domain_goals" ON domain_goals;
CREATE POLICY "users_own_domain_goals"
  ON domain_goals FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS domain_goals_user_domain
  ON domain_goals (user_id, domain_slug);
