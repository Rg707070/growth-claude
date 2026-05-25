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


-- ─── 4. Habits schedule_time — לוז מסונכרן ────────────────────
-- Allows a habit to be pinned to a specific time in the daily schedule
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS schedule_time time DEFAULT NULL;
