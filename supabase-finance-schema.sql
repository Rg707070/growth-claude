-- Finance Domain Schema
-- Run this in your Supabase SQL editor

-- ── finance_transactions ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS finance_transactions (
  id         uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid     NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  amount     integer  NOT NULL,                        -- in shekels ₪
  type       text     NOT NULL DEFAULT 'expense',      -- income | expense
  category   text     NOT NULL DEFAULT 'other',
  note       text,
  date       date     NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_finance_transactions" ON finance_transactions;
CREATE POLICY "users_own_finance_transactions"
  ON finance_transactions FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS finance_tx_user_date
  ON finance_transactions (user_id, date DESC);

-- ── finance_wishlist ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS finance_wishlist (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid    NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title           text    NOT NULL,
  estimated_price integer,                             -- in shekels ₪, nullable
  status          text    NOT NULL DEFAULT 'want',     -- want | bought
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE finance_wishlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_finance_wishlist" ON finance_wishlist;
CREATE POLICY "users_own_finance_wishlist"
  ON finance_wishlist FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
