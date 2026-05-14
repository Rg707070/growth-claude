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
