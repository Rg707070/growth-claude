-- ============================================================================
-- GROWTH — Database hardening (security + performance)
-- Applied to the live Supabase project; recorded here as the source of truth.
-- Safe to re-run: all statements are idempotent or describe end-state.
-- ============================================================================

-- 1. Onboarding flag (used by the onboarding wizard) ------------------------
alter table public.profiles
  add column if not exists onboarding_complete boolean not null default false;

-- 2. Pin function search_path (resolves function_search_path_mutable) --------
alter function public.handle_new_user() set search_path = public;
alter function public.touch_updated_at() set search_path = public;
alter function public.advance_family_habit_streak(uuid, uuid) set search_path = public;
alter function public.advance_task_rotation(uuid, uuid, integer) set search_path = public;
alter function public.compute_and_update_streak(uuid) set search_path = public;
alter function public.rls_auto_enable() set search_path = public;

-- 3. Lock down function EXECUTE (resolves anon_security_definer_function_executable)
--    Internal / trigger functions: remove the default PUBLIC execute grant.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;
revoke execute on function public.compute_and_update_streak(uuid) from public, anon, authenticated;
--    Real RPCs (called by the app): signed-in users only, never anonymous.
revoke execute on function public.advance_family_habit_streak(uuid, uuid) from public, anon;
revoke execute on function public.advance_task_rotation(uuid, uuid, integer) from public, anon;
grant  execute on function public.advance_family_habit_streak(uuid, uuid) to authenticated;
grant  execute on function public.advance_task_rotation(uuid, uuid, integer) to authenticated;

-- 4. Optimize RLS (resolves auth_rls_initplan) ------------------------------
--    Every "user_id = auth.uid()" / "id = auth.uid()" policy was rewritten to
--    "(select auth.uid())" so the auth function is evaluated once per query
--    instead of once per row. Applied via a DO loop over pg_policies; the
--    torah_lessons read policy was rewritten to "(select auth.role())".
--    (See the loop in the chat history; end-state is the wrapped form.)

-- 5. Index foreign keys (resolves unindexed_foreign_keys) -------------------
create index if not exists idx_family_events_user_id      on public.family_events(user_id);
create index if not exists idx_family_habits_user_id      on public.family_habits(user_id);
create index if not exists idx_family_tasks_assigned_to   on public.family_tasks(assigned_to);
create index if not exists idx_family_tasks_user_id       on public.family_tasks(user_id);
create index if not exists idx_habit_logs_user_id         on public.habit_logs(user_id);
create index if not exists idx_habits_user_id             on public.habits(user_id);
create index if not exists idx_journal_documents_user_id  on public.journal_documents(user_id);
create index if not exists idx_learning_notes_session_id  on public.learning_notes(session_id);
create index if not exists idx_learning_notes_user_id     on public.learning_notes(user_id);
create index if not exists idx_learning_sessions_user_id  on public.learning_sessions(user_id);
create index if not exists idx_learning_summaries_user_id on public.learning_summaries(user_id);
create index if not exists idx_photo_entries_user_id      on public.photo_entries(user_id);
create index if not exists idx_reading_books_user_id      on public.reading_books(user_id);
create index if not exists idx_routine_breakers_user_id   on public.routine_breakers(user_id);
create index if not exists idx_saved_lessons_lesson_id    on public.saved_lessons(lesson_id);
create index if not exists idx_torah_daily_tracks_user_id on public.torah_daily_tracks(user_id);
create index if not exists idx_user_schedule_user_id      on public.user_schedule(user_id);

-- ============================================================================
-- NOT applied (need a product decision — documented for follow-up):
--
-- * multiple_permissive_policies on album_shares & photo_entries:
--   both have a "Public can view ..." SELECT policy (qual = true) alongside the
--   owner "manage own" ALL policy. Consolidating means changing the public
--   photo/album-share read model, so it was left for a deliberate decision.
--   NOTE: "Public can view photo entries" (qual = true) lets anon read ALL
--   photo_entries — review whether the public album-share feature needs this
--   broad, or can be scoped to rows referenced by a valid album_shares token.
--
-- * Leaked Password Protection (auth_leaked_password_protection):
--   enable in Supabase Dashboard → Authentication → Policies (checks
--   HaveIBeenPwned). This is an Auth setting, not a SQL migration.
-- ============================================================================
