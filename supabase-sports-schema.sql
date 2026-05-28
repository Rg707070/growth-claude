-- Sports Domain Schema
-- Run this in your Supabase SQL editor

-- ── sport_workout_logs ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sport_workout_logs (
  id         uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid     NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date       date     NOT NULL DEFAULT CURRENT_DATE,
  notes      text     NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sport_workout_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_sport_workout_logs" ON sport_workout_logs;
CREATE POLICY "users_own_sport_workout_logs"
  ON sport_workout_logs FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS sport_workout_logs_user_date
  ON sport_workout_logs (user_id, date DESC);

-- ── sport_food_restrictions ───────────────────────────────────
CREATE TABLE IF NOT EXISTS sport_food_restrictions (
  id         uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid     NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  food_item  text     NOT NULL,
  reason     text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sport_food_restrictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_sport_food_restrictions" ON sport_food_restrictions;
CREATE POLICY "users_own_sport_food_restrictions"
  ON sport_food_restrictions FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS sport_food_restrictions_user
  ON sport_food_restrictions (user_id, created_at DESC);

-- ── sport_challenges ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sport_challenges (
  id         uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid     NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title      text     NOT NULL,
  status     text     NOT NULL DEFAULT 'active',   -- active | done
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sport_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_sport_challenges" ON sport_challenges;
CREATE POLICY "users_own_sport_challenges"
  ON sport_challenges FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS sport_challenges_user
  ON sport_challenges (user_id, created_at DESC);
