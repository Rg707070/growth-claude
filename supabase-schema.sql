-- GROWTH App - Supabase Schema
-- Run this in your Supabase SQL editor

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  xp integer default 0 not null,
  current_streak integer default 0 not null,
  longest_streak integer default 0 not null,
  last_activity_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Auto-create profile when a user signs up
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
  xp_reward integer default 10 not null,
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================
-- HABIT LOGS (daily completions)
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
-- XP UPDATE FUNCTION (atomic — no race conditions)
-- ============================================================
create or replace function public.update_profile_xp(uid uuid, xp_delta integer)
returns void as $$
begin
  update public.profiles
  set xp = greatest(0, xp + xp_delta)
  where id = uid;
end;
$$ language plpgsql security definer;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Each user can only see and modify their own data
-- ============================================================
alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;

-- Profiles
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Habits
create policy "Users can view own habits"
  on public.habits for select using (auth.uid() = user_id);
create policy "Users can create habits"
  on public.habits for insert with check (auth.uid() = user_id);
create policy "Users can update own habits"
  on public.habits for update using (auth.uid() = user_id);
create policy "Users can delete own habits"
  on public.habits for delete using (auth.uid() = user_id);

-- Habit logs
create policy "Users can view own logs"
  on public.habit_logs for select using (auth.uid() = user_id);
create policy "Users can create logs"
  on public.habit_logs for insert with check (auth.uid() = user_id);
create policy "Users can delete own logs"
  on public.habit_logs for delete using (auth.uid() = user_id);

-- ============================================================
-- JOURNAL ENTRIES
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
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.user_schedule enable row level security;
create policy "Users can view own schedule"
  on public.user_schedule for select using (auth.uid() = user_id);
create policy "Users can create schedule items"
  on public.user_schedule for insert with check (auth.uid() = user_id);
create policy "Users can update own schedule"
  on public.user_schedule for update using (auth.uid() = user_id);
create policy "Users can delete own schedule"
  on public.user_schedule for delete using (auth.uid() = user_id);

-- Add specific_date for one-time overrides (NULL = recurring weekly)
alter table public.user_schedule add column if not exists specific_date date;

-- ============================================================
-- SCHEDULE REFLECTIONS (what actually happened vs the plan)
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
-- ACTIVITY CHECKS (per-item ✓ + note per day)
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
