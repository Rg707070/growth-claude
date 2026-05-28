# GROWTH App — AI Agent Handoff Document

This document is for a fresh AI agent picking up the project. Read it fully before touching any code. Also read `CLAUDE.md` (project conventions) and `AGENTS.md` (Next.js 16 / Tailwind v4 warning).

---

## The User

**Rotem** — yeshiva student, beginner coder. Learns by doing. Communicates primarily in Hebrew. Prefers exact instructions to paste/run rather than long explanations. Built the app collaboratively with Claude Code over many sessions.

---

## What the App Is (current reality)

GROWTH is a personal optimization app — a habit tracker plus dedicated workspaces for Torah learning, reading, journaling, and family management. Mobile-first; bilingual (Hebrew RTL default + English); deployed on Vercel.

**Currently in the app:**
- 7 life domains (family, friends, torah, secular, sports, finance, music) with per-domain habits
- Streak tracking + per-domain completion % + 14-day heat map + weekly bar chart
- Hardcoded weekly schedule with per-item check-offs and daily reflection notes
- Family workspace: tasks (with rotation), habits (with frequency-aware streaks), adventures
- Torah workspace: daily tracks, learning sessions with timer, notes, TipTap summaries with folders/tags/favorites, Sefaria reader, image → Sefaria reference scan
- Reading (Books) module: page/chapter tracking, target date, inline notes, read/want-to-read tabs
- Journal: long-form TipTap writing, weekly photo album with public share tokens, insights tab
- Night check-in modal after 9 PM (mood / productive / gratitude)
- Light/Dark mode (light-first); HE/EN toggle
- Floating-pill bottom nav with drag-to-reorder

**Removed / not in the app (despite older docs claiming so):**
- ❌ XP system, level system, *Mesillat Yesharim* leveling — removed PR #38
- ❌ Achievement badges, weekly XP chart, confetti, 84-day heat map (replaced by 14-day)
- ❌ AI insights endpoint, AI chat endpoint, daily-plan endpoint — never built (or removed)
- ❌ Anthropic SDK / Claude integration — replaced by Google Gemini (Gemini 2.0 Flash via `@google/generative-ai`)
- ❌ `/progress` route — does not exist
- ❌ `xp-bar.tsx`, `streak-badge.tsx`, `achievements-display.tsx`, `mesillat-quote.tsx`, `weekly-challenge.tsx`, `ai-insights.tsx`, `confetti.tsx` — none of these files exist anymore

Do not reintroduce removed features without an explicit instruction from Rotem.

---

## Tech Stack (exact versions matter)

- **Next.js 16.2.6** — App Router only. Server components by default. **Has breaking changes vs. earlier versions — read `node_modules/next/dist/docs/` before writing routing/caching code.**
- **React 19.2.4**
- **TypeScript 5** (strict mode — zero-error policy)
- **Tailwind CSS v4** — new API; **no `tailwind.config.js`**; design tokens in `@theme inline` inside `src/app/globals.css`
- **Supabase** (`@supabase/ssr` + `@supabase/supabase-js`) — SSR auth with cookie-based sessions
- **shadcn/ui** — in `src/components/ui/`
- **Lucide React v1.16** — icons
- **TipTap 3** — rich text (writing tab, Torah summaries)
- **`@dnd-kit/core` + `/sortable`** — bottom-nav drag-to-reorder
- **`@google/generative-ai`** — used only in `/api/torah/scan/route.ts` (server-side, Gemini 2.0 Flash)
- **`canvas-confetti`** — installed but not currently used (was for old XP system)

---

## Critical Patterns — Follow These Exactly

### 1. Server vs. client components

Pages that fetch Supabase data are **server components** (no `'use client'` at top). They pass data down to a `*-client.tsx` companion which is a client component. This avoids loading states and flickers.

```
page.tsx           ← async function, uses createClient from @/lib/supabase/server
  └── *-client.tsx ← 'use client', receives props, handles all interactivity
```

Never call `createClient()` from `@/lib/supabase/client` inside a server component. Never call `createClient()` from `@/lib/supabase/server` inside a client component.

### 2. Supabase auth pattern

`src/app/(dashboard)/layout.tsx` checks auth and redirects to `/login` if unauthenticated. Individual dashboard pages do NOT re-check auth — they trust the layout. `middleware.ts` refreshes the Supabase session on every request.

### 3. Tailwind CSS v4 — no arbitrary oklch/hex in class names

Tailwind v4 cannot interpolate runtime values. **Never** write `className="bg-[${domain.color}]"` — it won't resolve. Use `style={{ background: domain.color }}` for dynamic or domain-specific colors. Tokens defined in `globals.css` can still be referenced via `bg-primary`, `text-foreground`, etc.

### 4. RTL / language

App is RTL by default (Hebrew). `useLang()` from `src/lib/lang.tsx` returns `{ t, lang, toggleLang, isRTL }`.
- For layout direction flips, set `dir="rtl"` on the container — do NOT reverse arrays.
- All user-facing strings live in `src/lib/lang.tsx`. Exception: `src/lib/schedule.ts` is intentionally all Hebrew.
- Never hardcode `dark:` Tailwind prefixes — theming is class-based via `html.dark` / `html.light`, not media-query.

### 5. Domain colors

Each domain in `src/lib/domains.ts`:
```ts
{
  color: '#4F46E5',                            // hex — inline style props
  gradient: 'from-indigo-600/20 to-indigo-700/5', // Tailwind className
  glowColor: 'rgba(79,70,229,0.20)',           // rgba — box-shadow
}
```

### 6. Writes → `router.refresh()`

After any Supabase write (toggle habit, add habit, etc.), call `router.refresh()` to re-run the server component. There is no global state library (no react-query, swr, zustand, jotai). For the family module, `src/lib/family/realtime.ts` additionally pushes `router.refresh()` on cross-device events.

### 7. RPCs that exist

In `supabase-schema.sql`:
- `advance_family_habit_streak(habit_id uuid, uid uuid) returns int`
- `advance_task_rotation(task_id uuid, uid uuid, max_members int default 2) returns int`
- `handle_new_user()` (trigger on `auth.users` insert)
- `touch_updated_at()` (generic updated-at trigger)

There is no XP RPC. If you need atomic counters, write a new RPC instead of doing read-modify-write from the client.

### 8. Theme (dark / light)

- `ThemeProvider` in `src/lib/theme.tsx` manages state.
- Toggles `dark` / `light` class on `<html>`.
- `globals.css` has `:root { ... }` (light, primary) and `.dark { ... }` blocks.
- Persisted to `localStorage` under `growth-theme`.

### 9. Module pattern — Books

PR #45 / commit `7c4a6b4` aligned Habits, Schedule, and Torah on the structure first built for the Reading (Books) module. Use that pattern (canonical example: `src/app/(dashboard)/reading/reading-client.tsx`) for any new top-level module — see `CLAUDE.md` for the exact JSX skeleton.

---

## File Reference — Key Files

| File | What it does |
|---|---|
| `src/app/layout.tsx` | Root layout: ThemeProvider + LangProvider, PWA metadata |
| `src/app/(dashboard)/layout.tsx` | Dashboard shell: auth check, bottom-nav, night check-in |
| `src/app/globals.css` | All CSS: `@theme inline` tokens, light/dark blocks, brand gradient |
| `src/lib/domains.ts` | Single source of truth for the 7 domains |
| `src/lib/schedule.ts` | Hardcoded weekly schedule (Hebrew) |
| `src/lib/lang.tsx` | LangProvider + `useLang()` |
| `src/lib/theme.tsx` | ThemeProvider + `useTheme()` |
| `src/lib/family/realtime.ts` | Supabase realtime subscription for family_* tables |
| `src/lib/supabase/server.ts` | Server-side Supabase client (cookies) |
| `src/lib/supabase/client.ts` | Browser Supabase client |
| `middleware.ts` | Supabase session refresh on every request |
| `src/types/index.ts` | All TypeScript interfaces |
| `supabase-schema.sql` | Full DB schema (consolidated source of truth — PR #27) |
| `src/app/api/torah/scan/route.ts` | POST: image (base64 + mime) → Sefaria reference via Gemini |
| `src/components/bottom-nav.tsx` | Floating pill nav with drag-to-reorder |
| `src/components/habit-row.tsx` | Habit row: checkbox, reminders, edit, delete |

---

## Database Tables (high level — full DDL in `supabase-schema.sql`)

Core: `profiles`, `habits`, `habit_logs`, `journal_entries`, `journal_documents`, `photo_entries`, `album_shares`, `night_checkins`, `user_schedule` (unused), `schedule_reflections`, `activity_checks`.

Torah workspace: `learning_sessions`, `learning_notes`, `learning_summaries`, `torah_lessons`, `saved_lessons`, `torah_daily_tracks`.

Reading: `reading_books`.

Family workspace: `family_tasks`, `family_habits`, `routine_breakers`.

All RLS-scoped to `auth.uid()`. Exceptions: `torah_lessons` is readable by any authenticated user; `album_shares` rows are public-by-token.

---

## The 7 Domains

```ts
['family', 'friends', 'torah', 'secular', 'sports', 'finance', 'music']
```

Domain pages at `/domain/[slug]` are dynamic and render `domain-detail-client.tsx`. Domain-specific extras come from `src/lib/domain-integrations.ts`:
- `torah` → `SefariaWidget`
- `sports`, `music` → `ConnectPlaceholder` (Garmin / Spotify CTA)

`family` has its own dedicated route at `/domain/family` with three tabs: **tasks**, **habits**, **adventures** (`type Tab = 'tasks' | 'habits' | 'adventures'` in `family-client.tsx`). The middle tab is `habits` — older docs called it "rituals," that name was never in code.

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL       — Supabase project settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY  — "Publishable key" in newer Supabase dashboards
GOOGLE_AI_API_KEY              — server-only, used by /api/torah/scan
```

Set in `.env.local` for local dev and in Vercel project settings for production. There is no `ANTHROPIC_API_KEY` and no `SUPABASE_SERVICE_ROLE_KEY` in this project.

---

## Design System Quick Reference

**Brand gradient (light-first)**
```
#0B2447 → #1E5F74 → #0E9F6E → #65A30D
deep navy → teal → emerald → lime
```
Available as `--brand-gradient` and `--brand-gradient-soft`.

**Light theme (primary, `:root`)**
```
--background: oklch(0.985 0.005 230);  /* near-white with cool tint */
--foreground: oklch(0.18 0.04 245);
--primary:    oklch(0.45 0.10 220);
--card:       oklch(1 0 0);
```
Dark theme (`.dark`) defined in same file. Toggle is class-based via `src/lib/theme.tsx`.

**Radius scale** — base `--radius: 0.875rem`, multipliers `sm`(0.6) `md`(0.8) `lg`(1) `xl`(1.4) `2xl`(1.8) `3xl`(2.2) `4xl`(2.6).

---

## Components That Use localStorage (not Supabase)

- `night-checkin.tsx` — `growth-checkin-{date}` to prevent showing twice per day
- `theme.tsx` — `growth-theme` (`dark` | `light`)
- `lang.tsx` — `growth-lang` (`he` | `en`)
- `bottom-nav.tsx` — `growth-nav-order` (user's drag-reordered nav order)

---

## Known Quirks / Watch Out For

1. **`user_schedule` table exists but is unused** — the schedule view uses the hardcoded `WEEKLY_SCHEDULE` from `src/lib/schedule.ts`. Table remains for future editable-schedule work.

2. **Supabase "Publishable key"** — newer dashboards renamed "anon key" to "Publishable key". Same value. Env var name stays `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

3. **No `SUPABASE_SERVICE_ROLE_KEY` needed** — no admin/service role access. All operations go through the anon key with RLS.

4. **RTL ordering** — never reverse arrays. Use `dir="rtl"` on the container. Reversing + `flex-row-reverse` double-reverses.

5. **`router.refresh()` after mutations** — only data refresh pattern in the app. No global state.

6. **Tailwind v4 breaking changes** — no `tailwind.config.js`. The `@theme inline` block in `globals.css` defines all design tokens.

7. **`AGENTS.md`** — project root has it (included via `CLAUDE.md`). Warns about Next.js 16 breaking changes. Heed it before writing Next.js code.

8. **No `loading.tsx` files** — data is always fetched server-side in `page.tsx`. No loading states needed.

9. **Bottom-nav clearance** — mobile content needs `pb-24` so the floating pill doesn't overlap. Desktop uses `md:pb-6`.

10. **`fab.tsx` is vestigial** — near-empty placeholder. The add-habit affordance now lives inside `bottom-nav.tsx`.

11. **Schema consolidation** — `supabase-family-schema.sql`, `supabase-migrations.sql`, `supabase-schema-trading.sql` were merged into `supabase-schema.sql` in PR #27. Don't read the deleted files; they're gone.

12. **`canvas-confetti` is installed but unused** — leftover from the removed XP completion celebration.

---

## Git & Deployment

- Repo: `https://github.com/Rg707070/growth-claude` (default branch: `main`)
- Git user: `granot12312@gmail.com`
- Vercel: connected to GitHub, auto-deploys on push to `main`
- Local dev server runs on port 3000 (or 3001 if taken)

```bash
# Standard workflow
git add <specific files>            # never `git add -A` blindly
git commit -m "verb: description"   # e.g. "Add reading calendar"
git push                            # → Vercel auto-deploy (when on main)
```

When working on a feature branch (e.g. `claude/...`), stay on it — don't push to `main` without permission.

---

## What Has Been Built (current feature list)

**Core**
- [x] Supabase auth (email/password login + signup)
- [x] Profile with streak + longest streak
- [x] Habits (create, toggle, delete, edit) per domain
- [x] Habit logs (one per habit per day)
- [x] 14-day per-domain streak computation (server-side)

**Dashboard**
- [x] Hero greeting + today's habit list
- [x] Per-domain progress cards
- [x] Today's schedule preview
- [x] Weekly chart of completions
- [x] Time-based background gradient
- [x] Animated wave at bottom

**Domain Detail**
- [x] Habit list with add / edit / delete
- [x] Pomodoro timer (25/5)
- [x] One-line daily journal
- [x] Domain-specific extras (Sefaria for torah, placeholders for sports / music)

**Family workspace** (`/domain/family`)
- [x] Tasks with category, urgency, status, optional rotation
- [x] Habits with frequency-aware streaks (daily/weekly/monthly windows)
- [x] Adventures (routine_breakers) with type, cost_tier, target_date, media_links
- [x] Realtime sync across devices

**Torah workspace**
- [x] Daily learning tracks (checklist)
- [x] Learning sessions with timer + notes
- [x] TipTap rich-text summaries with folders, tags, favorites
- [x] Saved global lessons (admin-seeded)
- [x] Sefaria reader
- [x] Image → Sefaria reference scan (Gemini 2.0 Flash)

**Reading (Books)**
- [x] Books by page or chapter with target date
- [x] Inline notes
- [x] Read / want-to-read tabs
- [x] Monthly calendar with reading schedule calculator

**Journal**
- [x] Long-form writing (TipTap) — `journal_documents`
- [x] Weekly photo album with public share token + slideshow
- [x] Insights tab

**Schedule**
- [x] Full weekly timetable (hardcoded for Rotem's yeshiva schedule)
- [x] Per-item check-offs (`activity_checks`)
- [x] Per-day reflection notes (`schedule_reflections`)

**Settings**
- [x] Dark / Light mode toggle (persisted)
- [x] HE / EN toggle (persisted)
- [x] Logout

**Global**
- [x] Floating-pill bottom nav with drag-to-reorder + center add button
- [x] Night check-in modal after 9 PM (gated by localStorage)
- [x] PWA manifest
- [x] Bilingual HE / EN with RTL support
- [x] Light + Dark themes (light-first)

---

## Possible Next Features (not yet built)

- Editable schedule via DB (the `user_schedule` table is ready)
- Push notifications for habit reminders (currently in-browser only via `use-notifications.ts`)
- Weekly email summary
- Profile photo
- Social / sharing features beyond album share
- Real Garmin / Spotify deep-link integrations (placeholders exist in `connect-placeholder.tsx`)
- Export data to CSV
- AI features (chat, daily plan, insights) — older docs referenced these but they were never built; the only AI surface today is the Sefaria OCR scan

---

## When in doubt

Read the current code, not these docs. If anything in `handoff.md`, `README.md`, or `CLAUDE.md` conflicts with the live code, the live code wins — and `CLAUDE.md` is the file to update first.
