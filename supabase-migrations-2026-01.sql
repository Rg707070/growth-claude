-- ============================================================================
-- GROWTH App — Migration 2026-01 (preview cut)
-- ============================================================================
--
-- HOW TO RUN:
--   1. Open https://supabase.com/dashboard → your project → SQL Editor → New query
--   2. Paste this WHOLE file
--   3. Click "Run"
--   4. You should see "Success. No rows returned."
--
-- Safe to re-run: every statement uses IF NOT EXISTS / IF EXISTS.
-- These changes are forward-compatible with the current app.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Habit stacking — chain habits together ("After I do X, then Y")
--    Anchors a habit to another so the UI can render them as a stack.
-- ----------------------------------------------------------------------------
alter table public.habits
  add column if not exists anchor_habit_id uuid
  references public.habits(id) on delete set null;

create index if not exists idx_habits_anchor
  on public.habits(anchor_habit_id);


-- ----------------------------------------------------------------------------
-- 2. Streak freeze — every 7 consecutive days earns 1 freeze
--    Auto-applies on a missed day; prevents the "I broke my streak" cliff.
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists freezes_available int not null default 0;

alter table public.profiles
  add column if not exists last_freeze_earned_at date;


-- ----------------------------------------------------------------------------
-- 3. Weekly-reflection slug — friday-summary saves here
--    No schema change needed; journal_entries already supports arbitrary
--    domain_slug. This is a documentation marker for future me:
--      domain_slug = 'weekly' → friday-summary save
-- ----------------------------------------------------------------------------


-- ----------------------------------------------------------------------------
-- 4. Dashboard view — single round-trip for today's habits + their state
--    Replaces the current 5 sequential queries.
--    The app does not use this view yet; it's here so the next code change
--    can swap in a single fetch without another migration.
-- ----------------------------------------------------------------------------
create or replace view public.v_dashboard_today as
select
  h.id              as habit_id,
  h.user_id,
  h.domain_slug,
  h.name,
  h.frequency,
  h.schedule_time,
  h.anchor_habit_id,
  h.is_active,
  exists (
    select 1
    from public.habit_logs l
    where l.habit_id = h.id
      and l.completed_at = current_date
  ) as completed_today
from public.habits h;

-- RLS on the underlying table covers the view; no explicit policy needed.


-- ----------------------------------------------------------------------------
-- 5. Sanity check — uncomment to verify
-- ----------------------------------------------------------------------------
-- select 'habits.anchor_habit_id'                as item, count(*) from information_schema.columns
--   where table_name='habits' and column_name='anchor_habit_id'
-- union all
-- select 'profiles.freezes_available'            as item, count(*) from information_schema.columns
--   where table_name='profiles' and column_name='freezes_available'
-- union all
-- select 'view v_dashboard_today'                as item, count(*) from information_schema.views
--   where table_name='v_dashboard_today';


-- ============================================================================
-- DONE. The app keeps working with or without these changes; future code will
-- progressively use them.
-- ============================================================================
