-- Family Ecosystem Schema
-- Run in Supabase SQL editor AFTER the main supabase-schema.sql

-- ============================================================
-- FAMILY TASKS (shared household task management)
-- ============================================================
create table if not exists public.family_tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  family_id uuid not null,
  title text not null,
  category text not null default 'household'
    check (category in ('household', 'financial', 'shopping', 'childcare', 'social', 'other')),
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'done')),
  urgency text not null default 'normal'
    check (urgency in ('low', 'normal', 'high', 'critical')),
  due_date date,
  assigned_to uuid references auth.users on delete set null,
  is_recurring boolean default false not null,
  rotation_index integer default 0 not null,
  created_at timestamp with time zone default timezone('utc', now()) not null,
  updated_at timestamp with time zone default timezone('utc', now()) not null
);

alter table public.family_tasks enable row level security;

create policy "Users manage own family tasks"
  on public.family_tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-update updated_at on any row change
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

create trigger family_tasks_updated_at
  before update on public.family_tasks
  for each row execute function public.touch_updated_at();

-- ============================================================
-- FAMILY HABITS (shared rituals + streak tracking)
-- ============================================================
create table if not exists public.family_habits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  family_id uuid not null,
  name text not null,
  frequency text not null default 'daily'
    check (frequency in ('daily', 'weekly', 'monthly')),
  accountability_type text not null default 'shared_streak'
    check (accountability_type in ('shared_streak', 'individual')),
  current_streak integer default 0 not null,
  last_completed_at timestamp with time zone,
  context_anchor text,
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc', now()) not null
);

alter table public.family_habits enable row level security;

create policy "Users manage own family habits"
  on public.family_habits for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- ROUTINE BREAKERS (adventure ledger / bucket list)
-- ============================================================
create table if not exists public.routine_breakers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  family_id uuid not null,
  title text not null,
  type text not null default 'day_trip'
    check (type in ('day_trip', 'restaurant', 'long_term_travel', 'relocation', 'activity', 'other')),
  cost_tier text not null default 'moderate'
    check (cost_tier in ('budget', 'moderate', 'luxury')),
  status text not null default 'backlog'
    check (status in ('backlog', 'planned', 'archived')),
  media_links jsonb default '[]' not null,
  target_date date,
  notes text,
  created_at timestamp with time zone default timezone('utc', now()) not null
);

alter table public.routine_breakers enable row level security;

create policy "Users manage own routine breakers"
  on public.routine_breakers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- RPC: Advance or reset a family habit streak
-- Called server-side after a habit completion is recorded.
-- Returns the new streak value.
-- ============================================================
create or replace function public.advance_family_habit_streak(
  habit_id uuid,
  uid uuid
)
returns integer as $$
declare
  rec public.family_habits%rowtype;
  window_start timestamp with time zone;
  new_streak integer;
begin
  select * into rec
  from public.family_habits
  where id = habit_id and user_id = uid;

  if not found then
    raise exception 'habit not found';
  end if;

  -- Determine valid window: must have been completed within 1 cycle
  window_start := case rec.frequency
    when 'daily'   then now() - interval '1 day'
    when 'weekly'  then now() - interval '7 days'
    when 'monthly' then now() - interval '31 days'
    else now() - interval '1 day'
  end;

  if rec.last_completed_at is not null and rec.last_completed_at >= window_start then
    new_streak := rec.current_streak + 1;
  else
    new_streak := 1;
  end if;

  update public.family_habits
  set current_streak = new_streak,
      last_completed_at = now()
  where id = habit_id;

  return new_streak;
end;
$$ language plpgsql security definer;

-- ============================================================
-- RPC: Advance rotation index for a recurring task
-- Increments rotation_index, wrapping at max_members.
-- ============================================================
create or replace function public.advance_task_rotation(
  task_id uuid,
  uid uuid,
  max_members integer default 2
)
returns integer as $$
declare
  new_index integer;
begin
  update public.family_tasks
  set rotation_index = (rotation_index + 1) % max_members,
      status = 'pending',
      updated_at = timezone('utc', now())
  where id = task_id and user_id = uid
  returning rotation_index into new_index;

  return new_index;
end;
$$ language plpgsql security definer;
