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

-- All authenticated users can read lessons
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
-- SEED: TORAH LESSONS (real content)
-- ============================================================
insert into public.torah_lessons (title, speaker, duration_minutes, category, description, category_color) values
  ('מסכת ברכות — דף ב: מאימתי קורין את שמע בערבית', 'הרב עדין שטיינזלץ', 42, 'גמרא', 'שיעור יסוד על הדף הראשון של הש"ס — זמן קריאת שמע של ערבית וגדר הלילה לעניין מצוות', '#0f766e'),
  ('פרשת בראשית — בריאת העולם ותפקיד האדם', 'הרב יצחק זילברשטיין', 38, 'פרשה', 'עיון בשאלה מדוע התורה פותחת בבריאה ולא במצוות, ומה משמעות "צלם אלוהים"', '#7c3aed'),
  ('הלכות שבת — ל"ט מלאכות: מבוא ויסודות', 'הרב אביגדור נבנצל', 55, 'הלכה', 'הגדרת מלאכה, מקור הל"ט מלאכות ממשכן, וכיצד לומדים מכל אחת לחיי היומיום', '#b45309'),
  ('משנה אבות פרק א — בית יוסי בן יועזר', 'הרב חיים סבתו', 29, 'משנה', 'עיון במשנה "הוי מתאבק בעפר רגליהם" — ענוה, שימוש תלמידי חכמים ולמידה אמיתית', '#be185d'),
  ('ספר בראשית עם פירוש רש"י — פרק א', 'הרב מרדכי ברויאר', 33, 'תנ"ך', 'לימוד הפסוקים הראשונים עם עיון מעמיק בפירוש רש"י ובשאלות שהוא מעלה', '#15803d'),
  ('זהירות — פרק ראשון של מסילת ישרים', 'הרב משה שפירא', 47, 'מחשבה', 'הרמח"ל מגדיר את מידת הזהירות — מה היא, כיצד נרכשת ומה מעכב אותה', '#0369a1'),
  ('הלכות תפילה — זמני תפילת שחרית', 'הרב שלמה זלמן אויערבך', 24, 'הלכה', 'זמן תפילת שחרית, ותיקין, דיני מי שהתאחר ושאלות מעשיות נפוצות', '#b45309'),
  ('מסכת שבת — דף ב: רשויות שבת', 'הרב שמואל ברוידא', 36, 'גמרא', 'הכרת ארבע רשויות שבת, מקור הגדרותיהן ויישום בזמננו', '#0f766e'),
  ('פרשת נח — המבול, הברית והקשת', 'הרב יוסף בן-פורת', 31, 'פרשה', 'מה למד נח מהמבול, מהי ברית הקשת ומה נדרש מאיתנו כיום', '#7c3aed'),
  ('דיני ברכות — ברכות הנהנין: עקרונות', 'הרב יהושע נויבירט', 28, 'הלכה', 'כיצד נקבעת ברכה לכל מאכל, שלושת עיקרי הברכות ודיני ספק ברכות', '#b45309'),
  ('תהילים — מזמור א: אשרי האיש', 'הרב אריה לוין', 18, 'תנ"ך', 'פירוש מעמיק למזמור הפותח את ספר תהילים — מי הוא "אשרי האיש" ומה עצת הרשעים', '#15803d'),
  ('זריזות — פרק שני של מסילת ישרים', 'הרב נח ויינברג', 44, 'מחשבה', 'הרמח"ל על ההבדל בין זהירות לזריזות, ומדוע מהירות היא חלק מהעבודה', '#0369a1')
ON CONFLICT DO NOTHING;
