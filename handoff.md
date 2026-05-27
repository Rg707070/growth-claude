# GROWTH App — AI Agent Handoff Document

This document is written for a fresh AI agent picking up this project. Read it fully before touching any code.

---

## The User

**Rotem** — a yeshiva student. Communicates primarily in Hebrew (voice-to-text, informal). Prefers exact instructions over explanations. Built this entire app collaboratively with Claude Code over multiple sessions.

**Working directory:** `/home/user/growth-claude` (remote cloud session) or `C:\Users\Yarden\OneDrive\Documents\רותם החמוד\growth-claude` (local Windows)

---

## What the App Is

GROWTH is a personal optimization app — a gamified habit tracker with:
- 7 life domains (family, friends, torah, secular, sports, finance, music)
- XP + leveling system drawn from *Mesillat Yesharim* (9 levels)
- Streak tracking, achievements, weekly charts, 84-day heat map
- Bilingual: Hebrew (RTL, default) + English
- PWA-ready (manifest, apple-web-app meta)

**Live URL:** `growth-claude.vercel.app` — auto-deploys from `main` branch of `Rg707070/growth-claude`.

---

## Tech Stack

- **Next.js 16** — App Router, server components by default
- **React 19** — strict mode
- **TypeScript 5** (strict — zero-error policy)
- **Tailwind CSS v4** — no `tailwind.config.js`; tokens defined in `globals.css` via `@theme inline`
- **Supabase** (`@supabase/ssr` + `@supabase/supabase-js`) — cookie-based SSR auth + Postgres + RLS
- **shadcn/ui** — component primitives in `src/components/ui/`
- **Lucide React** — icons
- **TipTap** (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-*`) — rich text editor in journal writing tab
- **`@google/generative-ai`** — Gemini 2.0 Flash Lite, used in `/api/torah/scan`
- **`canvas-confetti`** — celebration on all habits complete

---

## Critical Patterns — Follow These Exactly

### 1. Server vs. Client components

```
page.tsx        ← async server component, uses createClient from @/lib/supabase/server
  └── *-client.tsx  ← 'use client', receives props, handles all interactivity
```

Never cross-import server/client Supabase clients.

### 2. Auth pattern

`(dashboard)/layout.tsx` checks auth and redirects to `/login`. Individual dashboard pages do NOT re-check auth.

### 3. Tailwind v4 — no dynamic oklch in classnames

Tailwind v4 cannot resolve runtime oklch values. For any dynamic or domain-specific color, use inline `style={{}}`:

```tsx
// ✅
style={{ background: `${domain.color}22`, color: domain.color }}
// ❌
className={`bg-[${domain.color}]`}
```

### 4. RTL / language

Default is Hebrew (`dir="rtl"` on `<html>`). Use `const { t, isRTL } = useLang()` everywhere.
- Use `dir="rtl"` on flex containers to flip layout — **never reverse arrays** (reversal + flex-row-reverse double-reverses).
- No hardcoded Hebrew strings in components — use `t('key')` from `src/lib/lang.tsx`.

### 5. Domain colors

Each domain in `src/lib/domains.ts` has:
```ts
color: '#38BDF8'           // hex — inline style props
gradient: 'from-sky-400/25 to-sky-600/5'  // Tailwind className
glowColor: 'rgba(56,189,248,0.22)'        // box-shadow
```

### 6. XP updates — always use the RPC

```ts
await supabase.rpc('update_profile_xp', { uid: user.id, xp_delta: 10 })
```
Never write to `profiles.xp` directly — race conditions.

### 7. After any Supabase write

Always call `router.refresh()` to re-run the server component and get fresh data. There is no global state.

### 8. Theme

`ThemeProvider` in `src/lib/theme.tsx` toggles `dark`/`light` class on `<html>`. Class-based, not `prefers-color-scheme`. Default is light. Stored in `localStorage` as `growth-theme` (version-gated by `growth-theme-v = '2'`).

---

## File Reference — Key Files

| File | What it does |
|---|---|
| `src/app/layout.tsx` | Root layout: fonts, PWA meta, ThemeProvider + LangProvider |
| `src/app/(dashboard)/layout.tsx` | Dashboard shell: auth check, Sidebar, BottomNav, FAB, NightCheckIn |
| `src/app/globals.css` | All CSS: oklch tokens, dark/light modes, keyframes |
| `src/lib/domains.ts` | Single source of truth for all 7 domains |
| `src/lib/lang.tsx` | All translations + `useLang()` hook |
| `src/lib/theme.tsx` | Dark/light theme + `useTheme()` hook |
| `src/lib/schedule.ts` | Hardcoded weekly timetable (Rotem's yeshiva) |
| `src/lib/mesillat.ts` | XP level logic — `getLevelFromXp()`, `getXpProgress()` |
| `src/hooks/use-notifications.ts` | Habit reminder scheduling (Web Notifications + AudioContext alarm) |
| `src/lib/family/realtime.ts` | Supabase realtime subscription helpers for family domain |
| `src/lib/family/streak-engine.ts` | Family streak computation logic |
| `src/lib/family/routine-breaker.ts` | Family routine-breaker challenge logic |
| `src/types/index.ts` | Core TypeScript interfaces |
| `src/types/family.ts` | Family-domain-specific types |
| `supabase-schema.sql` | Full DB schema — run once in Supabase SQL Editor |
| `supabase-migrations.sql` | Incremental migrations — run after initial schema |
| `src/app/api/torah/scan/route.ts` | Gemini 2.0 Flash Lite: scans Torah content |

---

## Database Tables

```sql
-- Core (supabase-schema.sql)
profiles          -- id, full_name, xp, current_streak, longest_streak, last_activity_date
habits            -- id, user_id, domain_slug, name, frequency, xp_reward, is_active
habit_logs        -- id, user_id, habit_id, completed_at  UNIQUE(habit_id, completed_at)
journal_entries   -- id, user_id, domain_slug, date, text  UNIQUE(user_id, domain_slug, date)
night_checkins    -- id, user_id, date, mood, productive, gratitude  UNIQUE(user_id, date)
user_schedule     -- id, user_id, day_of_week, time, label, type, sort_order (currently unused)

-- Migrations (supabase-migrations.sql)
portfolio_positions  -- id, user_id, ticker, buy_price, last_price, sort_order
photo_entries        -- id, user_id, week_start, photo_url, caption, taken_at
album_shares         -- id, user_id, token (uuid), week_start, created_at
reading_books        -- id, user_id, title, total_pages, current_page, target_date, color
```

All tables have RLS — users see only their own rows. `album_shares` has an extra public-read policy by token for sharing.

---

## The 7 Domains

```ts
['family', 'friends', 'torah', 'secular', 'sports', 'finance', 'music']
```

Domain pages at `/domain/[slug]` are dynamic. `domain-detail-client.tsx` renders domain-specific extras:
- `torah` → `SefariaWidget`
- `sports` / `music` → `ConnectPlaceholder`

`family` has its own dedicated route at `/domain/family` with tasks, rituals, adventures, streak engine, routine breaker, and Supabase **realtime** subscriptions.

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL       — Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  — "Publishable key" in newer Supabase dashboards
GOOGLE_AI_API_KEY              — server-only, for /api/torah/scan (Gemini 2.0 Flash Lite)
```

No `ANTHROPIC_API_KEY` and no `SUPABASE_SERVICE_ROLE_KEY` needed.

---

## Mobile Navigation (Bottom Nav)

The bottom nav (`src/components/bottom-nav.tsx`) on mobile is a **7-slot layout**: 3 items | centered FAB | 3 items.

In RTL (Hebrew) visual order (right → left):
```
בית | תחומים | ספרים | [+ FAB] | התקדמות | לוח | הגדרות
```

- The **FAB** (green gradient `+` button) opens a slide-up sheet to add a habit to any domain.
- Active item gets a cyan color + a gradient bar on top.
- The sheet logic lives inside `BottomNav` — `fab.tsx` is no longer used on mobile.

On desktop (`md+`): `Sidebar` handles nav + add-habit modal. `FAB` renders nothing.

---

## Design System

**Light mode is the default.** Dark mode is a toggle stored in localStorage.

Brand gradient: `linear-gradient(135deg, #0B2447 → #1E5F74 → #0E9F6E → #A3E635)`

Key CSS variables (defined in `globals.css`):
```
--brand-gradient      — the 4-stop linear gradient
--c-nav               — nav bar background (blurred)
--c-surface / -2      — card surfaces
--c-primary-glow      — active item background
--primary             — cyan in dark, navy in light
--muted-foreground    — inactive icon/text color
```

**CSS Animations in globals.css:**
- `.animate-wave-slow` / `.animate-wave-fast` — wave horizontal loop
- `.animate-flame` — streak flame pulse
- `.animate-fab-ring` — FAB glow ring (unused on mobile since FAB is now in nav)

---

## Journal Page (`/journal`)

Three tabs: **Writing** | **הארות (Insights)** | **Album**

- **Writing tab** — TipTap rich text editor, documents saved per-user in Supabase storage (or local). Uses `@tiptap/react` + `@tiptap/starter-kit`.
- **Insights tab** — Shows AI-generated reflections based on journal entries.
- **Album tab** — Weekly photo journal. Photos stored in `photo_entries` table. Albums can be shared via a public token (`album_shares` table → `/share/album/[token]`).

---

## Reading Planner (`/reading`)

New page added. Lets Rotem:
- Add books with total pages, current page, and target finish date
- Calculates pages/day needed to finish on time
- Shows a monthly calendar with daily page targets colour-coded per book
- Tracks progress with `+ Read` log button

Data in `reading_books` table (via `supabase-migrations.sql`).

---

## Habit Row Interactions

- **Tap** — toggles the habit (complete / incomplete)
- **Long-press** — opens edit mode (rename, set reminder, delete)
- **Reminder bell** — sets a Web Notification or AudioContext alarm for a specific time of day, stored in localStorage as `growth-habit-reminders`

---

## Torah Domain Extras

- **SefariaWidget** in domain detail
- **Torah Workspace** (`/domain/torah`) with tabs: Feed, Home, Learn, Summaries, Profile
- **Torah Scan API** (`/api/torah/scan`) — sends a passage to Gemini 2.0 Flash Lite for analysis

---

## Mesillat Yesharim XP Levels

```
Level 1  זהירות   Watchfulness    0–100 XP
Level 2  זריזות   Alacrity        100–250 XP
Level 3  נקיות    Cleanliness     250–500 XP
Level 4  פרישות   Separation      500–800 XP
Level 5  טהרה    Purity          800–1200 XP
Level 6  חסידות   Piety           1200–1700 XP
Level 7  ענווה    Humility        1700–2300 XP
Level 8  יראת חטא Fear of Sin     2300–3000 XP
Level 9  קדושה    Holiness        3000+ XP
```

---

## Schedule

Hardcoded in `src/lib/schedule.ts` (not from DB). `WEEKLY_SCHEDULE` maps day numbers (0=Sunday) to `{ time, label, type }[]`. Types: `'torah' | 'prayer' | 'shiur' | 'sports' | 'break' | 'other'`.

Renders as a horizontal-scroll table; today's column highlighted. The `user_schedule` DB table exists but is unused.

---

## Achievements

8 achievements in `src/lib/achievements.ts`:
- `first_habit` — ≥ 1 habit
- `streak_7` — current streak ≥ 7
- `streak_30` — current streak ≥ 30
- `xp_100` — single-day XP ≥ 100
- `xp_500` — total XP ≥ 500
- `all_domains` — habits in all 7 domains
- `torah_streak_3` — torah domain streak ≥ 3
- `habits_10` — ≥ 10 habits total

---

## localStorage Keys

| Key | Component | Value |
|---|---|---|
| `growth-theme` | `theme.tsx` | `'dark'` \| `'light'` |
| `growth-theme-v` | `theme.tsx` | `'2'` (version gate) |
| `growth-lang` | `lang.tsx` | `'he'` \| `'en'` |
| `growth-checkin-{date}` | `night-checkin.tsx` | `'1'` (shown guard) |
| `growth-habit-reminders` | `use-notifications.ts` | `{ [habitId]: { time, type } }` |

---

## Known Quirks / Watch Out For

1. **7 domains, not 8** — Achievements and docs that say "8 domains" are wrong. It's 7.
2. **Tailwind v4** — No `tailwind.config.js`. Read `AGENTS.md` before writing any class.
3. **RTL array order** — In RTL flex, index 0 appears on the RIGHT. Never reverse arrays.
4. **`router.refresh()` after writes** — Required after every Supabase mutation. No global state.
5. **`user_schedule` table is unused** — Schedule is hardcoded in `src/lib/schedule.ts`.
6. **Supabase "Publishable key"** — Same as "anon key" in older dashboards.
7. **No loading states** — Data always fetched server-side in `page.tsx`. No `loading.tsx`.
8. **Bottom nav FAB** — The habit-add sheet is now inside `BottomNav`, not `fab.tsx`. `FAB` renders nothing on mobile.
9. **Theme version gate** — `ThemeProvider` resets theme to `light` if `growth-theme-v !== '2'`. This is intentional (migration from old dark default).
10. **Gemini only** — `GOOGLE_AI_API_KEY` is the only AI key. There is no Anthropic/Claude API in use.

---

## Git & Deployment

- Repo: `github.com/Rg707070/growth-claude` (branch: `main`)
- Vercel: auto-deploys on push to `main`
- Feature branches: `claude/<name>` pattern, merged via PR

```bash
git add <specific files>
git commit -m "verb: short description"
git push   # → Vercel auto-deploys
```

---

## What Has Been Built

**Core**
- [x] Supabase auth (email/password)
- [x] Profile with XP, streak, longest streak
- [x] Habits: create, toggle (tap), long-press edit, delete, rename
- [x] Habit reminders (Web Notification + AudioContext alarm, time-based)
- [x] Atomic XP via `update_profile_xp` RPC

**Dashboard**
- [x] Hero card: greeting, XP bar, streak badge
- [x] Time-based background gradient
- [x] Domain cards grid (2 columns) with progress rings
- [x] Today's habit list
- [x] Today's schedule widget
- [x] Weekly XP chart
- [x] Confetti on all-habits complete

**Domain Detail** (`/domain/[slug]`)
- [x] Habit list with add/delete
- [x] Pomodoro timer (editable duration, SVG ring)
- [x] One-line daily journal per domain
- [x] Domain-specific extras (Sefaria / Connect placeholders)

**Family Domain** (`/domain/family`)
- [x] Tasks, rituals, adventures
- [x] Streak engine + routine-breaker challenges
- [x] Supabase realtime subscriptions

**Torah Domain** (`/domain/torah`)
- [x] Torah workspace with Feed / Home / Learn / Summaries / Profile tabs
- [x] Torah scan via Gemini 2.0 Flash Lite (`/api/torah/scan`)
- [x] Sefaria reader integration

**Journal** (`/journal`)
- [x] Writing tab — TipTap rich text editor
- [x] Insights tab — AI-generated reflections
- [x] Album tab — weekly photo journal
- [x] Album sharing via public token (`/share/album/[token]`)

**Reading Planner** (`/reading`)
- [x] Add books with total/current pages + target date
- [x] Daily pages-needed calculator
- [x] Monthly reading calendar (per-book colour coding)
- [x] Log reading progress

**Progress** (`/progress`)
- [x] 84-day heat map
- [x] Weekly XP chart
- [x] Achievement badges (8)
- [x] Mesillat Yesharim levels
- [x] Weekly summary (Sundays) + Shabbat summary (Fridays)
- [x] Streak tracking with failure detection

**Schedule** (`/schedule`)
- [x] Full weekly timetable, today highlighted, colour-coded by type

**Settings** (`/settings`)
- [x] Dark / light toggle (persisted)
- [x] Language toggle He/En (persisted)
- [x] Logout

**Navigation**
- [x] Mobile bottom nav: 3 items | center FAB | 3 items (7 slots)
- [x] Desktop sidebar with Add Habit modal
- [x] Night check-in modal (after 9 PM)
- [x] PWA manifest + apple-web-app meta

---

## Possible Next Features

- Editable schedule via DB (`user_schedule` table is ready)
- Push notifications (server-side, not just browser-based)
- Weekly email summary
- Spotify / Google Calendar integrations (placeholders in `connect-placeholder.tsx`)
- Finance domain: portfolio positions table already exists (`portfolio_positions`)
- Friends / leaderboard
- Profile photo
