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
-- kind = 'talk' (spoke in person / phone) | 'message' (texted)
CREATE TABLE IF NOT EXISTS friend_interactions (
  id          uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid     NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  contact_id  uuid     NOT NULL REFERENCES friend_contacts ON DELETE CASCADE,
  date        date     NOT NULL DEFAULT CURRENT_DATE,
  kind        text     NOT NULL DEFAULT 'talk',
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Migration for existing installs (CREATE IF NOT EXISTS won't add new columns)
ALTER TABLE friend_interactions ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'talk';
ALTER TABLE friend_interactions ADD COLUMN IF NOT EXISTS note text;

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

-- ── friend_reminders ──────────────────────────────────────────
-- A nudge to reach out to a contact on (or after) a given date.
CREATE TABLE IF NOT EXISTS friend_reminders (
  id          uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid     NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  contact_id  uuid     NOT NULL REFERENCES friend_contacts ON DELETE CASCADE,
  remind_on   date     NOT NULL DEFAULT CURRENT_DATE,
  note        text,
  done        boolean  NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE friend_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_friend_reminders" ON friend_reminders;
CREATE POLICY "users_own_friend_reminders"
  ON friend_reminders FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS friend_reminders_contact
  ON friend_reminders (contact_id, remind_on);

CREATE INDEX IF NOT EXISTS friend_reminders_user_open
  ON friend_reminders (user_id, done, remind_on);
