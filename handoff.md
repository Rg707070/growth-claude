# GROWTH App — AI Agent Handoff Document

This document is written for a fresh AI agent picking up this project. Read it fully before touching any code.

---

## The User

**Rotem** — a yeshiva student, communicates primarily in Hebrew. Built this entire app collaboratively with Claude Code. Prefers clear, direct guidance. No need for deep explanations — just exact instructions to execute.

**Remote working directory:** `/home/user/growth-claude` (cloud session via claude.ai/code)
**Git repo:** `https://github.com/Rg707070/growth-claude` (branch: `main`)

---

## What the App Is

GROWTH is a personal optimization app — a bilingual habit tracker with deep domain workspaces:
- 7 life domains: family, friends, torah, secular, sports, finance, music
- Habit tracking with streaks per domain and overall
- Domain-specific deep features (Torah learning studio, Family coordination, Friends CRM, Finance tracker, etc.)
- Full journal: daily domain reflections + rich-text documents + weekly photo albums
- Editable weekly schedule with daily activity check-offs
- Evening night check-in with habit completion snapshot
- AI-powered Torah text recognition (Google Gemini 2.0 Flash Lite)
- Bilingual: Hebrew (RTL, default) + English

**Live:** Vercel auto-deploys from `main` branch on every push.

---

## Tech Stack (exact versions matter)

- **Next.js 16.2.6** — App Router, not Pages Router. Server components by default.
- **React 19.2.4**
- **TypeScript 5** (strict mode — zero-error policy)
- **Tailwind CSS v4** — new API, no `tailwind.config.js`, all tokens in `globals.css` via `@theme inline`
- **Supabase** (`@supabase/ssr` + `@supabase/supabase-js`) — SSR auth with cookie-based sessions
- **shadcn/ui** — components in `src/components/ui/`
- **TipTap v3.23.6** — rich text editor (used in journal documents)
- **dnd-kit** — drag-and-drop (sortable schedule items)
- **Google Generative AI** (`@google/generative-ai`) — Gemini 2.0 Flash Lite, used only in `/api/torah/scan`
- **Lucide React** — icon library
- **canvas-confetti** — celebration effect when all habits complete
- **date-fns 4.1.0** — date utilities

---

## Critical Patterns — Follow These Exactly

### 1. Server vs. Client components

Data is always fetched on the server. There are no client-side loading spinners for initial data.

```
src/app/(dashboard)/[feature]/
  page.tsx           ← async SERVER component: fetches data, passes as props
  *-client.tsx       ← 'use client': receives props, handles all interactivity
  actions.ts         ← 'use server': mutation functions
  loading.tsx        ← skeleton shown while page.tsx resolves (YES, these exist)
```

```ts
// page.tsx — server
import { createClient } from '@/lib/supabase/server'
export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase.from('habits').select('*')
  return <HabitsClient habits={data ?? []} />
}
```

**Never** use `@/lib/supabase/client` in a server component.
**Never** use `@/lib/supabase/server` in a client component.

### 2. Server Actions pattern

Mutations go in `actions.ts` files co-located with their page:

```ts
// src/app/(dashboard)/domain/[slug]/ecosystem-actions.ts
'use server'
import { createClient } from '@/lib/supabase/server'

export async function addDomainTask(slug: string, title: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  await supabase.from('domain_tasks').insert({ user_id: user.id, domain_slug: slug, title })
}
```

### 3. After any Supabase write

Always call `router.refresh()` (from `useRouter`) to re-run the server component and get fresh data. There is no global state management.

### 4. Tailwind CSS v4 — no arbitrary oklch in class names

```tsx
// ✅ correct — dynamic/domain colors via style prop
style={{ background: `${domain.color}22`, color: domain.color }}
style={{ boxShadow: `0 0 24px ${domain.glowColor}` }}

// ❌ wrong — Tailwind v4 can't interpolate these at build time
className={`bg-[${domain.color}]`}
className={`text-[oklch(${l} ${c} ${h})]`}
```

Static oklch values defined as CSS vars in `globals.css` are fine: `bg-background`, `text-primary`, `border-border`, etc.

### 5. RTL / language

The app is RTL by default (Hebrew). `useLang()` → `{ t, lang, toggleLang, isRTL }`.
- Use `isRTL` to conditionally flip layouts.
- For tab/day ordering: put `dir="rtl"` on the container instead of reversing arrays. Reversing + `flex-row-reverse` double-reverses.
- **Never hardcode Hebrew strings** in components — use `t('key')` from `src/lib/lang.tsx`.
- Exception: `src/lib/schedule.ts` is fully Hebrew and hardcoded (intentional).

**Adding a new translation key:**
1. Open `src/lib/lang.tsx` → find the `translations` object.
2. Add your key under both `he:` and `en:`.
3. Use `t('your_key')` in the component.

### 6. Domain colors

Each domain in `src/lib/domains.ts`:
```ts
{
  color: '#4F46E5',                             // hex → inline style prop
  gradient: 'from-indigo-400/25 to-indigo-600/5', // Tailwind → className
  glowColor: 'rgba(79,70,229,0.22)',             // rgba → box-shadow style
}
```

### 7. Theme

- Class-based: `html.dark` / `html.light` (not media query).
- `ThemeProvider` in `src/lib/theme.tsx` toggles the class.
- `globals.css` has `.dark { ... }` and `html.light { ... }` overrides.
- **Never** use `dark:` Tailwind prefix — it won't work with class-based theming.

---

## File Reference — Key Files

| File | Purpose |
|---|---|
| `src/app/layout.tsx` | Root: ThemeProvider + LangProvider, PWA meta, fonts |
| `src/app/(dashboard)/layout.tsx` | Shell: auth check, Sidebar, BottomNav, FAB, NightCheckIn |
| `src/app/globals.css` | All CSS: oklch tokens, light mode overrides, animations |
| `src/lib/domains.ts` | DOMAINS array — single source of truth for 7 domains |
| `src/lib/lang.tsx` | All translations (200+ keys) + `useLang()` hook |
| `src/lib/theme.tsx` | Dark/light theme + `useTheme()` hook |
| `src/lib/schedule.ts` | Hardcoded yeshiva timetable + `getTodaySchedule()` / `getCurrentAndNextItems()` |
| `src/lib/domain-ecosystem-config.ts` | Category/type configs for domain tasks and goals |
| `src/lib/family/streak-engine.ts` | Family habit streak logic (frequency-based windows) |
| `src/lib/family/hebrew-calendar.ts` | Hebrew date utilities |
| `src/lib/family/realtime.ts` | Supabase realtime subscriptions for family |
| `src/lib/supabase/client.ts` | Browser Supabase client (for `'use client'`) |
| `src/lib/supabase/server.ts` | SSR Supabase client (for server components) |
| `src/lib/book-links.ts` | Sefaria & book reference utilities |
| `src/types/index.ts` | Core interfaces: Habit, Domain, DomainProgress, Profile |
| `src/types/family.ts` | FamilyTask, FamilyHabit, FamilyEvent, RoutineBreaker |
| `src/types/ecosystem.ts` | DomainTask, DomainGoal |
| `supabase-schema.sql` | Full DB schema — apply via Supabase SQL Editor or MCP |

---

## Routes Map

**Public:**
- `/` — redirect to `/dashboard` or `/login`
- `/login` — email/password login
- `/signup` — user registration
- `/share/album/[token]` — public photo album slideshow (no auth)

**Protected (dashboard):**
- `/dashboard` — domain progress cards, habits, streaks, heatmap, schedule widget
- `/domains` — grid of all 7 domains
- `/domain/[slug]` — friends / finance / sports / music / secular
- `/domain/family` — dedicated family coordination hub (NOT caught by [slug])
- `/domain/torah` — dedicated Torah workspace (NOT caught by [slug])
- `/journal` — 3-tab journal (reflections / rich-text documents / photo albums)
- `/reading` — book progress tracking
- `/schedule` — editable weekly timetable with check-offs
- `/calendar` — calendar view
- `/settings` — theme + language + logout

**API:**
- `POST /api/torah/scan` — base64 image → Gemini 2.0 Flash Lite → Sefaria reference

---

## Component Directory

### Layout & Navigation
| File | Purpose |
|---|---|
| `sidebar.tsx` | Desktop left nav (domain links, profile, language toggle) |
| `bottom-nav.tsx` | Mobile tab bar |
| `fab.tsx` | Floating Action Button — quick-add habit |
| `night-checkin.tsx` | Evening modal (19:00 / 14:00 Fri / 21:00 Sat): mood, productive, gratitude, habit strip |
| `desktop-topbar.tsx` | Desktop header |

### Dashboard
| File | Purpose |
|---|---|
| `dashboard-client.tsx` | Domain cards, habits, streak, heatmap, confetti |
| `domain-card.tsx` | Progress ring + domain stats card |
| `habit-row.tsx` | Single habit: checkbox, streak, domain color bar |
| `domain-habits-tab.tsx` | List of habits for a domain |
| `progress-ring.tsx` | SVG circular progress indicator |
| `heat-map.tsx` | Weekly activity heatmap (7 days × completion %) |
| `weekly-chart.tsx` | Activity bar visualization |
| `schedule-today.tsx` | Dashboard widget: current + next 3 schedule items |
| `time-background.tsx` | Body gradient that shifts by time of day |

### Torah Workspace (`src/components/torah/`)
| File | Purpose |
|---|---|
| `torah-workspace-client.tsx` | 5-tab container |
| `torah-home-tab.tsx` | Daily summary, today's minutes, daily tracks |
| `torah-learn-tab.tsx` | Session timer, notes/questions panel |
| `torah-feed-tab.tsx` | Admin-seeded lesson feed, save lessons |
| `torah-summaries-tab.tsx` | Saved summaries: folders, tags, search, favorites |
| `torah-profile-tab.tsx` | Total hours, sessions count, summaries count |
| `sefaria-reader.tsx` | Embedded Sefaria text viewer |
| `torah-daily-schedule.tsx` | Personal daily learning items |

### Shared / Utilities
| File | Purpose |
|---|---|
| `add-habit-sheet.tsx` | Bottom sheet to add a habit (with domain picker) |
| `domain-journal.tsx` | Daily domain reflection card |
| `pomodoro-timer.tsx` | Session timer (Pomodoro-style) |
| `friday-summary.tsx` / `weekly-summary.tsx` | Weekly wrap-up cards |
| `growth-logo.tsx` | Logo component |
| `lang-toggle.tsx` | Language toggle button |
| `empty-habits.tsx` | Empty state for habits |
| `error-view.tsx` | Error display component |
| `wave-animation.tsx` | Animated wave SVG |
| `sw-init.tsx` | Service Worker initialization |
| `onboarding/onboarding-flow.tsx` | New user onboarding flow |

### Integrations
| File | Purpose |
|---|---|
| `integrations/sefaria-widget.tsx` | Embedded Sefaria text viewer |
| `integrations/quick-links.tsx` | Domain shortcut links |
| `integrations/connect-placeholder.tsx` | Future: Spotify, Google Calendar placeholders |

### shadcn/ui primitives (`src/components/ui/`)
`badge`, `button`, `card`, `input`, `label`, `progress`, `separator`, `skeleton`, `tabs`, `toast`, `page-skeleton`

---

## Database Tables

### Core
```sql
profiles        -- id (uuid, FK auth.users), full_name, current_streak, longest_streak, last_activity_date
habits          -- id, user_id, domain_slug, name, description, frequency ('daily'|'weekly'), is_active
habit_logs      -- id, user_id, habit_id, completed_at (date), UNIQUE(habit_id, completed_at)
journal_entries -- id, user_id, domain_slug, date, text, UNIQUE(user_id, domain_slug, date)
night_checkins  -- id, user_id, date, mood, productive, gratitude, UNIQUE(user_id, date)
```

### Journal & Media
```sql
journal_documents -- id, user_id, title, content (TipTap JSON), created_at, updated_at
photo_entries     -- id, user_id, storage_path, caption, week_start, taken_at
album_shares      -- id, user_id, week_start, share_token (unique) — public read RLS
```

### Schedule
```sql
user_schedule         -- id, user_id, day_of_week (0-6), time, label, type, color, sort_order, specific_date
activity_checks       -- id, user_id, date, time, note, UNIQUE(user_id, date, time)
schedule_reflections  -- id, user_id, date, notes, UNIQUE(user_id, date)
```

### Torah Workspace
```sql
learning_sessions   -- id, user_id, text_title, text_category, started_at, ended_at, duration_seconds
learning_notes      -- id, user_id, session_id (nullable), content, type ('note'|'question'|'highlight'), text_reference
learning_summaries  -- id, user_id, title, content, source, category, tags[], folder, is_favorite
torah_daily_tracks  -- id, user_id, name, content, last_done (date), sort_order
torah_lessons       -- id, title, speaker, duration_minutes, category, description (admin-seeded, all auth users read)
saved_lessons       -- id, user_id, lesson_id, UNIQUE(user_id, lesson_id)
```

### Family Domain
```sql
family_tasks      -- id, user_id, family_id, title, category, status, urgency, due_date, assigned_to, is_recurring, rotation_index
family_habits     -- id, user_id, family_id, name, frequency, accountability_type, current_streak, last_completed_at
family_events     -- id, user_id, family_id, title, category, event_date, is_recurring, recurrence, notes, status
routine_breakers  -- id, user_id, family_id, title, type, cost_tier, status, media_links (JSONB), target_date, notes
```

### Domain Ecosystem (generic)
```sql
domain_tasks  -- id, user_id, domain_slug, title, category, urgency, status, due_date
domain_goals  -- id, user_id, domain_slug, title, type, status ('active'|'done'|'backlog'), notes
```

### Domain-Specific
```sql
friend_contacts, friend_interactions, friend_reminders
finance_transactions, finance_wishlist
secular_books, secular_projects, reading_books
sport_workout_logs, sport_food_restrictions, sport_challenges
music_practice_logs, music_songs
```

### RLS Summary
- All tables: `user_id = auth.uid()` — users see only their own data.
- `torah_lessons`: authenticated users can read (admin-seeded public content).
- `album_shares`: anonymous read for public share tokens.

### DB Functions / RPCs
- `advance_family_habit_streak(habit_id, uid)` — increments streak within frequency window, resets if lapsed
- `advance_task_rotation(task_id, uid, max_members)` — rotates recurring family task assignment
- `touch_updated_at()` — trigger for `updated_at` timestamps

---

## The 7 Domains

| Slug | Hebrew | English | Color | Route |
|---|---|---|---|---|
| `family` | משפחה | Family | Indigo #4F46E5 | `/domain/family` (dedicated) |
| `friends` | חברים | Friends | Sky #0EA5E9 | `/domain/[slug]` |
| `torah` | לימודי קודש | Torah Study | Teal #0F766E | `/domain/torah` (dedicated) |
| `secular` | לימודי חול | Secular Study | Emerald #059669 | `/domain/[slug]` |
| `sports` | ספורט | Sports | Lime #65A30D | `/domain/[slug]` |
| `finance` | כספים | Finance | Cyan #0891B2 | `/domain/[slug]` |
| `music` | מוזיקה | Music | Violet #7C3AED | `/domain/[slug]` |

---

## Torah Workspace — 5 Tabs

Located in `src/components/torah/`:

1. **Home tab** (`torah-home-tab.tsx`) — daily session summary, today's learning minutes, daily tracks
2. **Learn tab** (`torah-learn-tab.tsx`) — start session, Pomodoro-style timer, notes/questions panel
3. **Feed tab** (`torah-feed-tab.tsx`) — admin-seeded lesson feed, save lessons
4. **Summaries tab** (`torah-summaries-tab.tsx`) — saved summaries with folder/tag filtering, search, favorites
5. **Profile tab** (`torah-profile-tab.tsx`) — total hours, sessions count, summaries count

Supporting: `sefaria-reader.tsx`, `torah-daily-schedule.tsx`, `pomodoro-timer.tsx`

---

## Schedule System

**Base schedule** — hardcoded in `src/lib/schedule.ts`. Personal to Rotem's yeshiva timetable (Hebrew labels, Sunday–Saturday). Item types: `'torah' | 'prayer' | 'shiur' | 'sports' | 'break' | 'other'`.

**User schedule** (`user_schedule` table) — seeded from hardcoded data on first visit. User can edit `time`, `label`, `type`, `color`, `sort_order`. Changes are saved to DB.

**Activity checks** (`activity_checks` table) — user marks schedule items as done per day. Unique per `(user_id, date, time)`.

**Schedule reflections** (`schedule_reflections` table) — daily notes.

**Helper functions in `src/lib/schedule.ts`:**
- `getTodaySchedule()` — today's items based on `new Date().getDay()`
- `getCurrentAndNextItems()` — current + upcoming 3 items based on current time

---

## Gamification & Streaks

**No XP, no achievements page** — gamification is visual: progress rings, streaks, confetti.

**Overall streak** — computed in `dashboard/page.tsx` by scanning the last 14 days of habit logs. If any habit was completed on a day, that day counts.

**Domain streaks** — same logic, per-domain, on domain cards.

**Family habit streaks** — stored in `family_habits.current_streak`, managed by `advance_family_habit_streak()` RPC.

**Confetti** — `canvas-confetti` fires when all today's habits are completed. Gated by `useRef` (fires once per render).

---

## localStorage Keys

- `growth-checkin-{date}` — prevents night check-in from showing twice in one day
- `growth-theme` — `'dark'` | `'light'`
- `growth-lang` — `'he'` | `'en'`

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL      — Supabase project settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY — "Publishable key" (same as anon key in older dashboards)
GOOGLE_AI_API_KEY             — server-only, for /api/torah/scan
```

Set in `.env.local` for local dev and in Vercel project settings for production. Never commit `.env.local`. No `SUPABASE_SERVICE_ROLE_KEY` needed.

---

## Design System Quick Reference

**Ocean Dark (default):**
```
Background:  oklch(0.08 0.035 240)      — deep navy
Cards:       oklch(0.12 0.04 238)       — dark blue-gray
Primary:     oklch(0.75 0.17 205)       — ocean cyan
Borders:     oklch(0.75 0.12 210 / 14%)
Muted text:  oklch(0.55 0.05 230)
```

**Card template:**
```tsx
<div
  className="rounded-2xl p-4"
  style={{
    background: 'oklch(0.12 0.04 238)',
    border: '1px solid oklch(0.75 0.12 210 / 14%)',
  }}
>
```

**CSS Animations defined in `globals.css`:**
- `.animate-wave-slow` / `.animate-wave-fast` — horizontal loop for waves
- `.animate-flame` — scale + brightness pulse for streak badges
- `.animate-fab-ring` — pulsing glow ring for FAB
- `.animate-swipe-done` — translateX for swipe feedback

**Time-of-day body classes** (set by `TimeBackground`): `.bg-dawn`, `.bg-morning`, `.bg-noon`, `.bg-sunset`, `.bg-night`

---

## MCP Tools Available

This session has access to:

| Server | Prefix | Capabilities |
|---|---|---|
| **Supabase** | `mcp__b01db5d4__*` | `execute_sql`, `list_tables`, `apply_migration`, `get_logs`, `generate_typescript_types` |
| **Vercel** | `mcp__6060940f__*` | `list_deployments`, `get_deployment`, `get_deployment_build_logs`, `get_runtime_logs` |
| **GitHub** | `mcp__github__*` | PRs, issues, commits, file contents, branches |

Use these instead of curl/fetch for Supabase and Vercel operations.

---

## Known Gotchas

1. **`loading.tsx` files DO exist** — dashboard, domain/[slug], family, journal all have them. They show skeleton UIs.

2. **No XP system in current code** — `src/lib/mesillat.ts` and `update_profile_xp` RPC are from an older version. Don't reference them. `profiles` table has no `xp` column.

3. **No `/progress` or `/achievements` page** — old version only. These routes don't exist.

4. **AI is Gemini, not Claude** — `GOOGLE_AI_API_KEY` only. No `ANTHROPIC_API_KEY`. The only AI feature is Torah text scanning.

5. **Supabase "Publishable key"** — newer Supabase dashboards renamed "anon key" to "Publishable key". Same value.

6. **No `SUPABASE_SERVICE_ROLE_KEY` needed** — all ops go through anon key with RLS.

7. **RTL tab ordering** — never use `Array.reverse()` to achieve RTL ordering. Use `dir="rtl"` on the parent.

8. **`router.refresh()` after mutations** — mandatory after every Supabase write.

9. **Tailwind v4 breaking changes** — no `tailwind.config.js`. All tokens in `globals.css`. Read `AGENTS.md` first.

10. **Torah workspace components** — in `src/components/torah/`, NOT `src/components/hebrew/`.

11. **Family page has dedicated route** — `/domain/family` is NOT handled by `/domain/[slug]`. Its own `page.tsx` and `family-client.tsx`.

12. **Torah has dedicated route** — `/domain/torah` is NOT handled by `/domain/[slug]`. Its own page and `torah-workspace-client.tsx`.

13. **`user_schedule` IS actively used** — seeded from hardcoded schedule on first visit, user edits saved to DB.

14. **Theme is class-based** — never use `dark:` Tailwind prefix. It does nothing here. Use `html.light .class-name` in `globals.css` for light-mode overrides.

---

## Git & Deployment

- Repo: `https://github.com/Rg707070/growth-claude` (branch: `main`)
- Vercel: connected to GitHub, auto-deploys on push to `main`
- Dev server: `http://localhost:3000` (or 3001 if busy)

```bash
git add <specific files>   # never git add -A
git commit -m "verb: short description"
git push                   # → Vercel auto-deploys in ~60s
```

Use `/deploy "message"` to type-check + commit + push in one step.

---

## Custom Slash Commands

| Command | What it does |
|---|---|
| `/tc` | Type-check and report all errors |
| `/deploy "message"` | TC → commit staged → push |
| `/new-component Name` | Scaffold client component |
| `/new-page path` | Scaffold server page + client companion |
| `/add-translation key` | Add i18n key to lang.tsx in both languages |
| `/db query` | Execute SQL against live Supabase DB |

---

## What Has Been Built

**Core Auth & Profile**
- [x] Supabase auth (email/password login + signup)
- [x] Profile with streak tracking (current + longest)
- [x] Habits: create, toggle, delete per domain
- [x] Habit logs (unique per habit per day)

**Dashboard**
- [x] 7 domain progress cards with progress rings + completion count
- [x] Overall streak badge
- [x] Weekly activity heatmap
- [x] Time-based background gradient (dawn/morning/noon/sunset/night)
- [x] Today's schedule widget (current + next 3 items)
- [x] Confetti on completing all habits for the day
- [x] Animated wave at bottom

**Domain Workspaces**
- [x] **Family:** tasks (categories, urgency, recurring rotation), shared habits (streaks), events, adventure ledger (routine breakers)
- [x] **Torah:** 5-tab workspace — session timer, notes/questions, lesson feed, summaries (folders/tags/search/favorites), profile stats, daily tracks, Sefaria reader, AI text scanning
- [x] **Friends:** contact management, interaction logs, reminders
- [x] **Finance:** transaction tracking, wishlist
- [x] **Sports:** workout logs, food restrictions, challenges
- [x] **Music:** practice logs, song tracking
- [x] **Secular:** book progress tracking, projects

**Journal**
- [x] Domain daily reflections (one per domain per day)
- [x] Rich-text documents (TipTap v3)
- [x] Photo album (weekly, Supabase Storage) with public share tokens and slideshow

**Schedule**
- [x] Editable weekly timetable (seeded from Rotem's yeshiva schedule, saved to DB)
- [x] Daily activity check-offs per schedule item
- [x] Schedule reflections (daily notes)
- [x] Today's schedule preview widget on dashboard

**Night Check-in**
- [x] Evening modal at 19:00 (14:00 Fri / 21:00 Sat)
- [x] Mood + productive + gratitude fields
- [x] Habit completion % strip
- [x] Gated by localStorage — shows once per day

**Reading**
- [x] Book progress tracking (pages, chapters, target dates, notes, completion)

**Global**
- [x] FAB (floating +) → quick-add habit to any domain
- [x] Bilingual He/En with RTL support (200+ translation keys)
- [x] Dark/Light Ocean themes (class-based, localStorage persisted)
- [x] PWA manifest (installable)
- [x] Responsive: sidebar desktop, bottom nav mobile
- [x] Sefaria integration widget
- [x] Hebrew calendar utilities

---

## Possible Next Features (not yet built)

- Push notifications for habit reminders
- Social/sharing features for habits
- Spotify / Google Calendar integrations (placeholders in `connect-placeholder.tsx`)
- Admin UI for seeding Torah lessons
- Export data to CSV
- Friends leaderboard
- Profile photo
- Settings page improvements (currently minimal: theme/language/logout)
