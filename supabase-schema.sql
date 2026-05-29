-- GROWTH App — Supabase Schema
-- Single source of truth. Run in Supabase SQL editor.

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  current_streak integer default 0 not null,
  longest_streak integer default 0 not null,
  last_activity_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- HABITS
-- ============================================================
create table if not exists public.habits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  domain_slug text not null,
  name text not null,
  description text,
  frequency text default 'daily' not null check (frequency in ('daily', 'weekly')),
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================
-- HABIT LOGS
-- ============================================================
create table if not exists public.habit_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  habit_id uuid references public.habits on delete cascade not null,
  completed_at date default current_date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(habit_id, completed_at)
);

-- ============================================================
-- RLS
-- ============================================================
alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can view own habits"
  on public.habits for select using (auth.uid() = user_id);
create policy "Users can create habits"
  on public.habits for insert with check (auth.uid() = user_id);
create policy "Users can update own habits"
  on public.habits for update using (auth.uid() = user_id);
create policy "Users can delete own habits"
  on public.habits for delete using (auth.uid() = user_id);

create policy "Users can view own logs"
  on public.habit_logs for select using (auth.uid() = user_id);
create policy "Users can create logs"
  on public.habit_logs for insert with check (auth.uid() = user_id);
create policy "Users can delete own logs"
  on public.habit_logs for delete using (auth.uid() = user_id);

-- ============================================================
-- JOURNAL ENTRIES (domain reflections)
-- ============================================================
create table if not exists public.journal_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  domain_slug text not null,
  date date default current_date not null,
  text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, domain_slug, date)
);

alter table public.journal_entries enable row level security;
create policy "Users can view own journal"
  on public.journal_entries for select using (auth.uid() = user_id);
create policy "Users can create journal entries"
  on public.journal_entries for insert with check (auth.uid() = user_id);
create policy "Users can update own journal"
  on public.journal_entries for update using (auth.uid() = user_id);
create policy "Users can delete own journal"
  on public.journal_entries for delete using (auth.uid() = user_id);

-- ============================================================
-- JOURNAL DOCUMENTS (free-form writing)
-- ============================================================
create table if not exists public.journal_documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  content text not null default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.journal_documents enable row level security;
create policy "Users manage own journal documents"
  on public.journal_documents for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- PHOTO ENTRIES (weekly album)
-- ============================================================
create table if not exists public.photo_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  storage_path text not null,
  caption text not null default '',
  week_start date not null,
  taken_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.photo_entries enable row level security;
create policy "Users manage own photos"
  on public.photo_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- ALBUM SHARES (share tokens for weekly albums)
-- ============================================================
create table if not exists public.album_shares (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  week_start date not null,
  share_token text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, week_start)
);

alter table public.album_shares enable row level security;
create policy "Users manage own album shares"
  on public.album_shares for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "Anyone can read share tokens"
  on public.album_shares for select
  using (true);

-- ============================================================
-- NIGHT CHECK-INS
-- ============================================================
create table if not exists public.night_checkins (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date default current_date not null,
  mood text,
  productive text,
  gratitude text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, date)
);

alter table public.night_checkins enable row level security;
create policy "Users can view own checkins"
  on public.night_checkins for select using (auth.uid() = user_id);
create policy "Users can create checkins"
  on public.night_checkins for insert with check (auth.uid() = user_id);
create policy "Users can update own checkins"
  on public.night_checkins for update using (auth.uid() = user_id);

-- ============================================================
-- USER SCHEDULE (editable weekly timetable)
-- ============================================================
create table if not exists public.user_schedule (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  day_of_week integer not null check (day_of_week between 0 and 6),
  time text not null,
  label text not null,
  type text not null default 'other',
  sort_order integer not null default 0,
  specific_date date,
  color text,
  recurrence text not null default 'weekly',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Migration for existing databases:
-- ALTER TABLE public.user_schedule ADD COLUMN IF NOT EXISTS recurrence text NOT NULL DEFAULT 'weekly';

alter table public.user_schedule enable row level security;
create policy "Users can view own schedule"
  on public.user_schedule for select using (auth.uid() = user_id);
create policy "Users can create schedule items"
  on public.user_schedule for insert with check (auth.uid() = user_id);
create policy "Users can update own schedule"
  on public.user_schedule for update using (auth.uid() = user_id);
create policy "Users can delete own schedule"
  on public.user_schedule for delete using (auth.uid() = user_id);

-- ============================================================
-- SCHEDULE REFLECTIONS
-- ============================================================
create table if not exists public.schedule_reflections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  notes text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, date)
);

alter table public.schedule_reflections enable row level security;
create policy "Users manage own reflections"
  on public.schedule_reflections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- ACTIVITY CHECKS (per-item ✓ per day)
-- ============================================================
create table if not exists public.activity_checks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  time text not null,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, date, time)
);

alter table public.activity_checks enable row level security;
create policy "Users manage own activity checks"
  on public.activity_checks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- TORAH WORKSPACE — LEARNING SESSIONS
-- ============================================================
create table if not exists public.learning_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  text_title text not null,
  text_category text default 'other' not null,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  ended_at timestamp with time zone,
  duration_seconds integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.learning_sessions enable row level security;
create policy "Users manage own learning sessions"
  on public.learning_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- TORAH WORKSPACE — LEARNING NOTES
-- ============================================================
create table if not exists public.learning_notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  session_id uuid references public.learning_sessions on delete set null,
  content text not null,
  type text default 'note' not null,
  text_reference text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.learning_notes enable row level security;
create policy "Users manage own learning notes"
  on public.learning_notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- TORAH WORKSPACE — LEARNING SUMMARIES
-- ============================================================
create table if not exists public.learning_summaries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  content text not null,
  source text,
  category text default 'other' not null,
  tags text[] default '{}' not null,
  folder text default 'כללי' not null,
  is_favorite boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.learning_summaries enable row level security;
create policy "Users manage own learning summaries"
  on public.learning_summaries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- TORAH LESSONS (admin-seeded content feed)
-- ============================================================
create table if not exists public.torah_lessons (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  speaker text not null,
  duration_minutes integer not null,
  category text not null,
  description text,
  category_color text default '#0f766e',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.torah_lessons enable row level security;
create policy "Authenticated users can read lessons"
  on public.torah_lessons for select
  using (auth.role() = 'authenticated');

-- ============================================================
-- SAVED LESSONS (per-user)
-- ============================================================
create table if not exists public.saved_lessons (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  lesson_id uuid references public.torah_lessons on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, lesson_id)
);

alter table public.saved_lessons enable row level security;
create policy "Users manage own saved lessons"
  on public.saved_lessons for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- TORAH DAILY TRACKS (personal daily learning schedule)
-- ============================================================
create table if not exists public.torah_daily_tracks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  content text not null default '',
  last_done date,
  sort_order integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.torah_daily_tracks enable row level security;
create policy "Users manage own torah daily tracks"
  on public.torah_daily_tracks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- FAMILY TASKS
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

-- ============================================================
-- FAMILY HABITS
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
-- ROUTINE BREAKERS (adventure ledger)
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
-- HELPER FUNCTIONS
-- ============================================================

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
-- RPCs
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

-- ============================================================
-- READING BOOKS
-- ============================================================
create table if not exists public.reading_books (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  total_pages integer check (total_pages is null or total_pages > 0),
  current_page integer default 0 not null check (current_page >= 0),
  total_chapters integer check (total_chapters is null or total_chapters > 0),
  current_chapter integer default 0 not null check (current_chapter >= 0),
  target_date date,
  color text default '#06b6d4' not null,
  notes text default '' not null,
  completed boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.reading_books enable row level security;

create policy "Users manage own reading books"
  on public.reading_books for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Migration for existing deployments:
-- alter table public.reading_books
--   alter column total_pages drop not null,
--   alter column target_date drop not null,
--   add column if not exists total_chapters integer check (total_chapters is null or total_chapters > 0),
--   add column if not exists current_chapter integer default 0 not null check (current_chapter >= 0),
--   add column if not exists notes text default '' not null,
--   add column if not exists completed boolean default false not null;
