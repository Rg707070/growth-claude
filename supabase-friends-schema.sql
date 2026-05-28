-- Friends Domain Schema
-- Run this in your Supabase SQL editor

-- ── friend_contacts ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS friend_contacts (
  id         uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid     NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name       text     NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE friend_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_friend_contacts" ON friend_contacts;
CREATE POLICY "users_own_friend_contacts"
  ON friend_contacts FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS friend_contacts_user
  ON friend_contacts (user_id, created_at DESC);

-- ── friend_interactions ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS friend_interactions (
  id          uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid     NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  contact_id  uuid     NOT NULL REFERENCES friend_contacts ON DELETE CASCADE,
  date        date     NOT NULL DEFAULT CURRENT_DATE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE friend_interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_friend_interactions" ON friend_interactions;
CREATE POLICY "users_own_friend_interactions"
  ON friend_interactions FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS friend_interactions_user_date
  ON friend_interactions (user_id, date DESC);

CREATE INDEX IF NOT EXISTS friend_interactions_contact
  ON friend_interactions (contact_id, date DESC);
