-- Music Domain Schema
-- Run this in your Supabase SQL editor

-- ── music_practice_logs ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS music_practice_logs (
  id         uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid     NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date       date     NOT NULL DEFAULT CURRENT_DATE,
  notes      text     NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE music_practice_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_music_practice_logs" ON music_practice_logs;
CREATE POLICY "users_own_music_practice_logs"
  ON music_practice_logs FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS music_practice_logs_user_date
  ON music_practice_logs (user_id, date DESC);

-- ── music_songs ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS music_songs (
  id         uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid     NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title      text     NOT NULL,
  artist     text,
  status     text     NOT NULL DEFAULT 'learning',  -- learning | know
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE music_songs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_music_songs" ON music_songs;
CREATE POLICY "users_own_music_songs"
  ON music_songs FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS music_songs_user
  ON music_songs (user_id, created_at DESC);
