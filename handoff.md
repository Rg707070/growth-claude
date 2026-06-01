# GROWTH App — AI Agent Handoff Document

This document is written for a fresh AI agent picking up this project. Read it fully before touching any code.

---

## The User

**Rotem** — a yeshiva student, communicates primarily in Hebrew. Built this entire app collaboratively with Claude Code. Prefers clear, direct guidance. Does not need deep technical explanations — just exact instructions to execute.

**Remote working directory:** `/home/user/growth-claude` (cloud session via claude.ai/code)
**Git repo:** `https://github.com/Rg707070/growth-claude` (branch: `main`)

---

## What the App Is

GROWTH is a personal optimization app — a bilingual habit tracker with deep domain workspaces:
- 7 life domains (family, friends, torah, secular, sports, finance, music)
- Habit tracking with streak tracking per domain and overall
- Domain-specific deep features (Torah learning studio, Family coordination, Friends CRM, Finance tracker, etc.)
- Full journal: domain daily reflections + free-form rich-text documents + weekly photo albums
- Editable weekly schedule with daily activity check-offs
- Evening night check-in with habit completion snapshot
- AI-powered Torah text recognition (Google Gemini)
- Bilingual: Hebrew (RTL, default) + English

**Live URL:** Vercel deploy from `main` branch (auto-deploys on push)

---

## Tech Stack (exact versions matter)

- **Next.js 16.2.6** — App Router, not Pages Router. Server components by default.
- **React 19.2.4**
- **TypeScript 5** (strict mode — zero-error policy)
- **Tailwind CSS v4** — new API, no `tailwind.config.js`, configuration is in `globals.css` via `@theme inline`
- **Supabase** (`@supabase/ssr` + `@supabase/supabase-js`) — SSR auth with cookie-based sessions
- **shadcn/ui** — components in `src/components/ui/`
- **TipTap v3.23.6** — rich text editor (used in journal documents)
- **dnd-kit** — drag-and-drop (sortable lists)
- **Google Generative AI** (`@google/generative-ai`) — Gemini 2.0 Flash Lite, used only in `/api/torah/scan`
- **Lucide React** — icon library
- **canvas-confetti** — celebration effect when all habits complete
- **date-fns 4.1.0** — date utilities

---

## Critical Patterns — Follow These Exactly

### 1. Server vs. Client components

Pages that fetch Supabase data are **server components** (no `'use client'` at top). They pass data down to a `*-client.tsx` companion which is a client component. This avoids loading states and flickers.

```
page.tsx           ← async server component, uses createClient from @/lib/supabase/server
  └── *-client.tsx ← 'use client', receives props, handles all interactivity
```

Never call `createClient()` from `@/lib/supabase/client` inside a server component. Never call `createClient()` from `@/lib/supabase/server` inside a client component.

### 2. Supabase auth pattern

The dashboard layout (`src/app/(dashboard)/layout.tsx`) checks auth and redirects to `/login` if not authenticated. Individual dashboard pages do NOT re-check auth — they trust the layout.

```ts
// Server component pattern
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')
```

### 3. Tailwind CSS v4 — no arbitrary oklch in class names

Tailwind v4 cannot interpolate runtime oklch values. **Never** write `className="bg-[oklch(...)]"` with dynamic values — it won't work. Use `style={{ background: '...' }}` for any color that is dynamic or domain-specific.

Static oklch values defined in `globals.css` as CSS variables can be referenced via `bg-primary`, `text-foreground`, etc.

### 4. RTL / language

The app is RTL by default (Hebrew). The `useLang()` hook returns `{ t, lang, toggleLang, isRTL }`.
- Use `isRTL` to conditionally flip layouts: `className={isRTL ? 'flex-row-reverse' : 'flex-row'}`
- For tab/day ordering, use `dir="rtl"` on the container instead of reversing arrays — reversing arrays twice breaks things.
- Never hardcode Hebrew strings in components — use `t('key')` from `src/lib/lang.tsx`.
- Exception: `src/lib/schedule.ts` is fully Hebrew and hardcoded — that's intentional.

### 5. Domain colors

Each domain in `src/lib/domains.ts` has:
```ts
{
  color: '#4F46E5',                          // hex — used in inline style props
  gradient: 'from-indigo-400/25 to-indigo-600/5', // Tailwind — used in className
  glowColor: 'rgba(79,70,229,0.22)',          // rgba — used in box-shadow
}
```
Use `domain.color` for inline styles, `domain.gradient` for className, `domain.glowColor` for box-shadow glows.

### 6. After any Supabase write

Always call `router.refresh()` to re-run the server component and get fresh data. There is no global state management.

### 7. Theme (dark/light)

- `ThemeProvider` in `src/lib/theme.tsx` manages theme state.
- It toggles the `dark` / `light` class on `<html>`.
- `globals.css` has `.dark { ... }` and `html.light { ... }` blocks.
- Never hardcode `dark:` prefix classes — the app uses class-based theming, not the `prefers-color-scheme` media query.

---

## File Reference — Key Files

| File | What it does |
|---|---|
| `src/app/layout.tsx` | Root layout: ThemeProvider + LangProvider, PWA metadata, fonts |
| `src/app/(dashboard)/layout.tsx` | Dashboard shell: auth check, Sidebar, BottomNav, FAB, NightCheckIn |
| `src/app/globals.css` | All CSS: oklch theme variables, light mode overrides, keyframe animations |
| `src/lib/domains.ts` | Single source of truth for all 7 domains (color, gradient, glow, icon, names) |
| `src/lib/lang.tsx` | All translations (200+ keys) + `useLang()` hook |
| `src/lib/theme.tsx` | Dark/light theme + `useTheme()` hook |
| `src/lib/schedule.ts` | Hardcoded base weekly schedule (Hebrew, yeshiva timetable) + helper functions |
| `src/lib/domain-ecosystem-config.ts` | Category/type configs for domain tasks and goals |
| `src/lib/family/streak-engine.ts` | Family habit streak logic (frequency-based windows) |
| `src/lib/family/hebrew-calendar.ts` | Hebrew date utilities |
| `src/types/index.ts` | Core TypeScript interfaces: Habit, Domain, DomainProgress, etc. |
| `src/types/family.ts` | Family domain types |
| `src/types/ecosystem.ts` | DomainTask, DomainGoal types |
| `supabase-schema.sql` | Full DB schema — run in Supabase SQL Editor to set up |
| `src/app/api/torah/scan/route.ts` | POST: receives base64 image, calls Gemini, returns Sefaria ref |

---

## Routes Map

**Public:**
- `/` — redirect to `/dashboard` or `/login`
- `/login` — email/password login
- `/signup` — user registration
- `/share/album/[token]` — public photo album slideshow (no auth required)

**Protected (dashboard):**
- `/dashboard` — main page: domain progress cards, habits, streaks, weekly heatmap
- `/domains` — grid of all 7 domains
- `/domain/[slug]` — domain page (friends, finance, sports, music, secular)
- `/domain/family` — dedicated family coordination page
- `/domain/torah` — dedicated Torah learning workspace
- `/journal` — tabbed journal (domain entries / rich-text documents / photo albums)
- `/reading` — book progress tracking
- `/schedule` — editable weekly timetable with check-offs
- `/settings` — theme toggle + language toggle + logout

**API:**
- `POST /api/torah/scan` — Gemini 2.0 Flash Lite identifies Torah text from base64 photo image

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
torah_lessons       -- id, title, speaker, duration_minutes, category, description (admin-seeded, all users can read)
saved_lessons       -- id, user_id, lesson_id, UNIQUE(user_id, lesson_id)
```

### Family Domain
```sql
family_tasks      -- id, user_id, family_id, title, category, status, urgency, due_date, assigned_to, is_recurring, rotation_index
family_habits     -- id, user_id, family_id, name, frequency, accountability_type, current_streak, last_completed_at, context_anchor, is_active
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
- All tables: `user_id = auth.uid()` (users see only their own data)
- `torah_lessons`: authenticated users can read (admin-seeded content)
- `album_shares`: anonymous read for public share tokens

### DB Functions / RPCs
- `advance_family_habit_streak(habit_id, uid)` — increments streak if within frequency window, resets if lapsed
- `advance_task_rotation(task_id, uid, max_members)` — rotates recurring family task assignment
- `touch_updated_at()` — trigger function for `updated_at` timestamps

---

## The 7 Domains

```ts
['family', 'friends', 'torah', 'secular', 'sports', 'finance', 'music']
```

| Slug | Hebrew | Color |
|---|---|---|
| `family` | משפחה | Indigo #4F46E5 |
| `friends` | חברים | Sky #0EA5E9 |
| `torah` | לימודי קודש | Teal #0F766E |
| `secular` | לימודי חול | Emerald #059669 |
| `sports` | ספורט | Lime #65A30D |
| `finance` | כספים | Cyan #0891B2 |
| `music` | מוזיקה | Violet #7C3AED |

Domain routing:
- `family` → `/domain/family` → `family-page-client.tsx` (tasks, habits, events, adventures)
- `torah` → `/domain/torah` → `torah-workspace-client.tsx` (5-tab workspace)
- All others → `/domain/[slug]` → respective `*-client.tsx` with habits + ecosystem

---

## Torah Workspace — 5 Tabs

`torah-workspace-client.tsx` renders tabs managed in `src/components/hebrew/`:

1. **Home tab** (`torah-home-tab.tsx`) — daily session summary, today's minutes, daily tracks
2. **Learn tab** (`torah-learn-tab.tsx`) — start session, session timer (Pomodoro-style), notes/questions panel
3. **Feed tab** (`torah-feed-tab.tsx`) — admin-seeded lesson feed, save lessons
4. **Summaries tab** (`torah-summaries-tab.tsx`) — saved summaries, folder/tag filtering, search, favorites
5. **Profile tab** (`torah-profile-tab.tsx`) — total hours, sessions count, summaries count

Additional components:
- `sefaria-reader.tsx` — embedded Sefaria text viewer
- `torah-daily-schedule.tsx` — personal daily learning items (דחיקה)
- `pomodoro-timer.tsx` — session timer UI

---

## Schedule System

**Base schedule** is hardcoded in `src/lib/schedule.ts` — personal to Rotem's yeshiva timetable (Hebrew labels, 7 days, Sunday–Saturday). Item types: `'torah' | 'prayer' | 'shiur' | 'sports' | 'break' | 'other'`.

**User schedule** (`user_schedule` table) — seeded from hardcoded data on first visit. User can edit `time`, `label`, `type`, `color`, `sort_order`. Changes are saved to DB.

**Activity checks** (`activity_checks` table) — user marks schedule items as done per day. Unique per `(user_id, date, time)`.

**Schedule reflections** (`schedule_reflections` table) — daily notes on how the day went.

Helper functions in `src/lib/schedule.ts`:
- `getTodaySchedule()` — returns today's items based on `new Date().getDay()`
- `getCurrentAndNextItems()` — returns current + upcoming 3 items based on current time

---

## Gamification & Streaks

**No XP or level system** — the app does not track XP, does not have Mesillat Yesharim levels, and does not have an achievements page. Gamification is visual: progress rings, streaks, confetti.

**Overall streak** — computed in `dashboard/page.tsx` by scanning the last 14 days of habit logs. If any habit was completed on a day, that day counts. Counts consecutive completed days backward from today.

**Domain streaks** — computed per-domain using the same logic, displayed on domain cards.

**Family habit streaks** — stored in `family_habits.current_streak`, managed by `advance_family_habit_streak()` RPC. Frequency-based window: daily (24h), weekly (7d), monthly (31d).

**Confetti** — `canvas-confetti` fires when all of today's habits are completed. Gated by `useRef` in `dashboard-client.tsx` (fires once per render).

---

## Components Quick Reference

**Layout & Navigation:**
- `sidebar.tsx` — desktop left nav (links, profile, language toggle)
- `bottom-nav.tsx` — mobile tab bar
- `fab.tsx` — floating action button (quick-add habit)
- `night-checkin.tsx` — evening modal (19:00, 14:00 Fri, 21:00 Sat) with habit % strip

**Dashboard:**
- `dashboard-client.tsx` — domain progress cards, habits, streak, heatmap
- `domain-card.tsx` — progress ring + domain stats
- `weekly-chart.tsx` / `heat-map.tsx` — activity visualizations
- `progress-ring.tsx` — SVG circular progress

**Habits:**
- `habit-row.tsx` — habit with checkbox, domain color bar

**Schedule:**
- `schedule-today.tsx` — dashboard widget: current + next 3 schedule items
- `SchedulePageClient` — full schedule editor

**Journal:**
- `JournalClient` — 3-tab journal container
- `domain-journal.tsx` — daily domain reflection card
- `WritingTab` — TipTap rich text editor
- `AlbumTab` — weekly photo gallery + share token management

**Integrations:**
- `integrations/sefaria-widget.tsx` — embedded Sefaria text viewer
- `integrations/quick-links.tsx` — domain shortcut links
- `integrations/connect-placeholder.tsx` — future third-party integrations

**Utilities:**
- `time-background.tsx` — body gradient that shifts by time of day
- `wave-animation.tsx` — animated wave (SVG)
- `growth-logo.tsx` — logo component
- `lang-toggle.tsx` — language toggle button
- `friday-summary.tsx` / `weekly-summary.tsx` — weekly wrap-up cards

---

## localStorage Keys

- `growth-checkin-{date}` — prevents night check-in from showing twice in one day
- `growth-theme` — `'dark'` | `'light'`
- `growth-lang` — `'he'` | `'en'`

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL      — from Supabase project settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY — the "Publishable key" in newer Supabase dashboards
GOOGLE_AI_API_KEY             — server-only, for /api/torah/scan
```

Set in `.env.local` for local dev and in Vercel project settings for production. Never commit `.env.local`. No `SUPABASE_SERVICE_ROLE_KEY` needed.

---

## Design System Quick Reference

**Ocean Dark (default)**
```
Background:  oklch(0.08 0.035 240)      — deep navy
Cards:       oklch(0.12 0.04 238)       — dark blue-gray
Primary:     oklch(0.75 0.17 205)       — ocean cyan
Borders:     oklch(0.75 0.12 210 / 14%)
Muted text:  oklch(0.55 0.05 230)
```

**CSS Animations defined in globals.css**
- `.animate-wave-slow` / `.animate-wave-fast` — horizontal translateX loop for waves
- `.animate-flame` — scale + brightness pulse for streak badges
- `.animate-fab-ring` — pulsing glow ring for FAB
- `.animate-swipe-done` — translateX bump for swipe gesture feedback

**Time-of-day background classes** (set by `TimeBackground` on body)
- `.bg-dawn`, `.bg-morning`, `.bg-noon`, `.bg-sunset`, `.bg-night`

---

## Known Gotchas / Watch Out For

1. **`user_schedule` IS actively used** — the schedule page seeds it from hardcoded data on first visit, and user edits are saved to it. It is NOT unused.

2. **No XP system in current code** — `src/lib/mesillat.ts` and `update_profile_xp` RPC are from an earlier version. Do not reference them. `profiles` table no longer has an `xp` column.

3. **No `/progress` or `/achievements` page** — these were part of the old version. The current codebase does not have them.

4. **AI is Gemini, not Claude** — `GOOGLE_AI_API_KEY` is the AI key. There is no `ANTHROPIC_API_KEY`. The only AI feature is Torah text scanning via `/api/torah/scan`.

5. **Supabase "Publishable key"** — Newer Supabase dashboards renamed "anon key" to "Publishable key". They are the same value. The env var name stays `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

6. **No `SUPABASE_SERVICE_ROLE_KEY` needed** — All operations go through the anon key with RLS.

7. **RTL tab ordering** — Never use array reversal to achieve RTL ordering in flex containers. Use `dir="rtl"` on the parent element instead. Array reversal + flex-row-reverse double-reverses.

8. **`router.refresh()` after mutations** — After any Supabase write (toggle habit, add habit, etc.), call `router.refresh()` to re-run the server component and get fresh data. There is no global state.

9. **Tailwind v4 breaking changes** — This is NOT standard Tailwind v3. There is no `tailwind.config.js`. The `@theme inline` block in `globals.css` defines all design tokens. Read `AGENTS.md` at the project root before writing any Next.js code.

10. **No `loading.tsx` files** — Data is always fetched server-side in page.tsx. There are no loading states to implement.

11. **Family page has dedicated route** — `/domain/family` is NOT handled by `/domain/[slug]`. It has its own `page.tsx` and `family-page-client.tsx`.

12. **Torah has dedicated route** — `/domain/torah` is NOT handled by `/domain/[slug]`. It has its own page and `torah-workspace-client.tsx`.

---

## Git & Deployment

- Repo: `https://github.com/Rg707070/growth-claude` (branch: `main`)
- Vercel: connected to GitHub, auto-deploys on push to `main`
- Dev server: port 3000 (or 3001 if busy)

```bash
# Standard workflow
git add <specific files>
git commit -m "verb: short description"
git push
# → Vercel auto-deploys
```

---

## What Has Been Built (Complete Feature List)

**Core Auth & Profile**
- [x] Supabase auth (email/password login + signup)
- [x] Profile with streak tracking (current + longest)
- [x] Habits: create, toggle, delete per domain
- [x] Habit logs (unique per habit per day)

**Dashboard**
- [x] Domain progress cards (7 domains) with progress rings + completion count
- [x] Overall streak badge
- [x] Weekly activity heatmap
- [x] Time-based background gradient (dawn/morning/noon/sunset/night)
- [x] Today's schedule widget (current + next 3 items)
- [x] Confetti on completing all habits for the day
- [x] Animated wave at bottom

**Domain Workspaces**
- [x] Family: tasks (categories, urgency, recurring rotation), shared habits (streaks), events, adventure ledger (routine breakers)
- [x] Torah: 5-tab workspace — session timer, notes/questions, lesson feed, summaries (folders/tags/search/favorites), profile stats, daily tracks, Sefaria reader, AI text scanning
- [x] Friends: contact management, interaction logs, reminders
- [x] Finance: transaction tracking, wishlist
- [x] Sports: workout logs, food restrictions, challenges
- [x] Music: practice logs, song tracking
- [x] Secular: book progress tracking, projects

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
- [x] gated by localStorage to not show twice per day

**Reading**
- [x] Book progress tracking (pages, chapters, target dates, notes, completion)

**Global**
- [x] FAB (floating +) → quick-add habit to any domain
- [x] Bilingual He/En with RTL support (200+ translation keys)
- [x] Dark/Light Ocean themes (class-based, localStorage persisted)
- [x] PWA manifest (installable)
- [x] Responsive: sidebar on desktop, bottom nav on mobile
- [x] Sefaria integration widget
- [x] Hebrew calendar utilities

---

## Possible Next Features (not yet built)

- Settings page (currently minimal — just theme/language/logout)
- Push notifications for habit reminders
- Social/sharing features for habits
- Spotify / Google Calendar integrations (placeholders in `connect-placeholder.tsx`)
- Admin UI for seeding Torah lessons
- Export data to CSV
- Friends leaderboard
- Profile photo
