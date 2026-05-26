-- ============================================================
-- GROWTH App — Migrations
-- Run this in the Supabase SQL Editor (once)
-- ============================================================

-- ─── 1. Streak computation RPC ───────────────────────────────
-- Called after every habit toggle to recompute current_streak + longest_streak
CREATE OR REPLACE FUNCTION public.compute_and_update_streak(uid uuid)
RETURNS void AS $$
DECLARE
  streak_count int := 0;
  check_date   date := CURRENT_DATE;
  has_log      bool;
  cur_longest  int;
BEGIN
  -- Walk backwards day by day until a day with no habit_logs
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM public.habit_logs
      WHERE user_id = uid AND completed_at = check_date
    ) INTO has_log;

    EXIT WHEN NOT has_log;

    streak_count := streak_count + 1;
    check_date   := check_date - 1;
  END LOOP;

  -- Update current_streak; update longest_streak only if new record
  SELECT longest_streak INTO cur_longest
  FROM public.profiles WHERE id = uid;

  UPDATE public.profiles
  SET
    current_streak = streak_count,
    longest_streak = GREATEST(COALESCE(cur_longest, 0), streak_count),
    last_activity_date = CURRENT_DATE
  WHERE id = uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.compute_and_update_streak(uuid) TO authenticated;


-- ─── 2. Portfolio positions table ────────────────────────────
CREATE TABLE IF NOT EXISTS public.portfolio_positions (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  ticker     text NOT NULL,
  buy_price  numeric NOT NULL DEFAULT 0,
  last_price numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.portfolio_positions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own positions
DROP POLICY IF EXISTS "Users manage own positions" ON public.portfolio_positions;
CREATE POLICY "Users manage own positions"
  ON public.portfolio_positions
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for fast per-user queries
CREATE INDEX IF NOT EXISTS portfolio_positions_user_idx
  ON public.portfolio_positions (user_id, sort_order);


-- ─── 3. Watchlist multiple lists support ─────────────────────
ALTER TABLE public.watchlist ADD COLUMN IF NOT EXISTS list_name text NOT NULL DEFAULT 'ברירת מחדל';

-- Allow same ticker in different lists
ALTER TABLE public.watchlist DROP CONSTRAINT IF EXISTS watchlist_user_id_ticker_exchange_key;
CREATE UNIQUE INDEX IF NOT EXISTS watchlist_user_ticker_exchange_list_key
  ON public.watchlist (user_id, ticker, exchange, list_name);


-- ─── 4. Journal documents (Tiptap rich-text docs) ────────────
CREATE TABLE IF NOT EXISTS public.journal_documents (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title      text NOT NULL DEFAULT 'ללא כותרת',
  content    jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.journal_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own journal docs" ON public.journal_documents;
CREATE POLICY "Users manage own journal docs"
  ON public.journal_documents FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS journal_documents_user_idx
  ON public.journal_documents (user_id, updated_at DESC);


-- ─── 5. Photo entries (weekly album) ─────────────────────────
-- Requires a Supabase Storage bucket named "journal-photos" (public or signed URLs)
CREATE TABLE IF NOT EXISTS public.photo_entries (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  storage_path text NOT NULL,
  caption      text NOT NULL DEFAULT '',
  week_start   date NOT NULL,
  taken_at     date NOT NULL,
  created_at   timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.photo_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own photos" ON public.photo_entries;
CREATE POLICY "Users manage own photos"
  ON public.photo_entries FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS photo_entries_user_week_idx
  ON public.photo_entries (user_id, week_start DESC);


-- ─── 6. Album shares (public share tokens) ───────────────────
CREATE TABLE IF NOT EXISTS public.album_shares (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  week_start   date NOT NULL,
  share_token  uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at   timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id, week_start)
);

ALTER TABLE public.album_shares ENABLE ROW LEVEL SECURITY;

-- Owner can manage their shares; anyone can read by token (for public share page)
DROP POLICY IF EXISTS "Users manage own album shares" ON public.album_shares;
CREATE POLICY "Users manage own album shares"
  ON public.album_shares FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public read album shares by token" ON public.album_shares;
CREATE POLICY "Public read album shares by token"
  ON public.album_shares FOR SELECT
  USING (true);
