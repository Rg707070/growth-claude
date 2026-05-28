-- ============================================================
-- GROWTH App — All Domain Tables (combined migration)
-- Paste this entire file into the Supabase SQL editor and run.
-- Every statement uses CREATE TABLE IF NOT EXISTS and
-- DROP POLICY IF EXISTS, so it is safe to run multiple times.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- DOMAIN ECOSYSTEM  (shared tasks + goals for all domains)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS domain_tasks (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  domain_slug text        NOT NULL,
  title       text        NOT NULL,
  category    text        NOT NULL DEFAULT 'other',
  urgency     text        NOT NULL DEFAULT 'normal',
  status      text        NOT NULL DEFAULT 'pending',
  due_date    date,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE domain_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_own_domain_tasks" ON domain_tasks;
CREATE POLICY "users_own_domain_tasks" ON domain_tasks FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS domain_tasks_user_domain
  ON domain_tasks (user_id, domain_slug);

CREATE TABLE IF NOT EXISTS domain_goals (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  domain_slug text        NOT NULL,
  title       text        NOT NULL,
  type        text        NOT NULL DEFAULT 'other',
  status      text        NOT NULL DEFAULT 'active',
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE domain_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_own_domain_goals" ON domain_goals;
CREATE POLICY "users_own_domain_goals" ON domain_goals FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS domain_goals_user_domain
  ON domain_goals (user_id, domain_slug);


-- ────────────────────────────────────────────────────────────
-- FINANCE
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS finance_transactions (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  amount     integer     NOT NULL,
  type       text        NOT NULL DEFAULT 'expense',
  category   text        NOT NULL DEFAULT 'other',
  note       text,
  date       date        NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_own_finance_transactions" ON finance_transactions;
CREATE POLICY "users_own_finance_transactions" ON finance_transactions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS finance_tx_user_date
  ON finance_transactions (user_id, date DESC);

CREATE TABLE IF NOT EXISTS finance_wishlist (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title           text        NOT NULL,
  estimated_price integer,
  status          text        NOT NULL DEFAULT 'want',
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE finance_wishlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_own_finance_wishlist" ON finance_wishlist;
CREATE POLICY "users_own_finance_wishlist" ON finance_wishlist FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS finance_wishlist_user
  ON finance_wishlist (user_id, created_at DESC);


-- ────────────────────────────────────────────────────────────
-- FRIENDS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS friend_contacts (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE friend_contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_own_friend_contacts" ON friend_contacts;
CREATE POLICY "users_own_friend_contacts" ON friend_contacts FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS friend_contacts_user
  ON friend_contacts (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS friend_interactions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  contact_id  uuid        NOT NULL REFERENCES friend_contacts ON DELETE CASCADE,
  date        date        NOT NULL DEFAULT CURRENT_DATE,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE friend_interactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_own_friend_interactions" ON friend_interactions;
CREATE POLICY "users_own_friend_interactions" ON friend_interactions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS friend_interactions_user_date
  ON friend_interactions (user_id, date DESC);
CREATE INDEX IF NOT EXISTS friend_interactions_contact
  ON friend_interactions (contact_id, date DESC);


-- ────────────────────────────────────────────────────────────
-- SPORTS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sport_workout_logs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date       date        NOT NULL DEFAULT CURRENT_DATE,
  notes      text        NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE sport_workout_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_own_sport_workout_logs" ON sport_workout_logs;
CREATE POLICY "users_own_sport_workout_logs" ON sport_workout_logs FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS sport_workout_logs_user_date
  ON sport_workout_logs (user_id, date DESC);

CREATE TABLE IF NOT EXISTS sport_food_restrictions (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  food_item  text        NOT NULL,
  reason     text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE sport_food_restrictions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_own_sport_food_restrictions" ON sport_food_restrictions;
CREATE POLICY "users_own_sport_food_restrictions" ON sport_food_restrictions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS sport_food_restrictions_user
  ON sport_food_restrictions (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS sport_challenges (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title      text        NOT NULL,
  status     text        NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE sport_challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_own_sport_challenges" ON sport_challenges;
CREATE POLICY "users_own_sport_challenges" ON sport_challenges FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS sport_challenges_user
  ON sport_challenges (user_id, created_at DESC);


-- ────────────────────────────────────────────────────────────
-- SECULAR
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS secular_books (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title      text        NOT NULL,
  author     text,
  status     text        NOT NULL DEFAULT 'want',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE secular_books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_own_secular_books" ON secular_books;
CREATE POLICY "users_own_secular_books" ON secular_books FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS secular_books_user
  ON secular_books (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS secular_projects (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title       text        NOT NULL,
  description text,
  status      text        NOT NULL DEFAULT 'active',
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE secular_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_own_secular_projects" ON secular_projects;
CREATE POLICY "users_own_secular_projects" ON secular_projects FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS secular_projects_user
  ON secular_projects (user_id, created_at DESC);


-- ────────────────────────────────────────────────────────────
-- MUSIC
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS music_practice_logs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date       date        NOT NULL DEFAULT CURRENT_DATE,
  notes      text        NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE music_practice_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_own_music_practice_logs" ON music_practice_logs;
CREATE POLICY "users_own_music_practice_logs" ON music_practice_logs FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS music_practice_logs_user_date
  ON music_practice_logs (user_id, date DESC);

CREATE TABLE IF NOT EXISTS music_songs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title      text        NOT NULL,
  artist     text,
  status     text        NOT NULL DEFAULT 'learning',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE music_songs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_own_music_songs" ON music_songs;
CREATE POLICY "users_own_music_songs" ON music_songs FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS music_songs_user
  ON music_songs (user_id, created_at DESC);
