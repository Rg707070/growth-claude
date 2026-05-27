# GROWTH App — AI Agent Handoff Document

This document is written for a fresh AI agent picking up this project. Read it fully before touching any code.

---

## The User

**Rotem** — a yeshiva student, ~1.5 weeks of coding experience. Learns by doing. Communicates primarily in Hebrew. Prefers to be given exact instructions to paste/run rather than explanations. Does not need to understand every detail — just needs clear, step-by-step guidance. Built this entire app collaboratively with Claude Code over several sessions.

**Working directory:** `C:\Users\Yarden\OneDrive\Documents\רותם החמוד\growth-claude`

---

## What the App Is

GROWTH is a personal optimization app — a gamified habit tracker with:
- 7 life domains (family, friends, torah, secular, sports, finance, music)
- XP + leveling system drawn from *Mesillat Yesharim* (9 levels)
- Streak tracking, achievements, weekly charts, 84-day heat map
- AI coaching via Claude Haiku
- Personalized yeshiva schedule display
- Bilingual: Hebrew (RTL, default) + English

**Live URL:** Deployed on Vercel (check Vercel dashboard for the URL — project is `Rg707070/growth-claude` on GitHub).

---

## Tech Stack (exact versions matter)

- **Next.js 16.2.6** — App Router, not Pages Router. Server components by default.
- **React 19.2.4**
- **TypeScript 5** (strict mode — zero-error policy)
- **Tailwind CSS v4** — new API, no `tailwind.config.js`, configuration is in `globals.css` via `@theme inline`
- **Supabase** (`@supabase/ssr` + `@supabase/supabase-js`) — SSR auth with cookie-based sessions
- **shadcn/ui** — components in `src/components/ui/`
- **Lucide React v1.16** — icon library
- **`@anthropic-ai/sdk`** — used only in `/api/insights/route.ts` (server-side)
- **`canvas-confetti`** — celebration effect when all habits complete

---

## Critical Patterns — Follow These Exactly

### 1. Server vs. Client components

Pages that fetch Supabase data are **server components** (no `'use client'` at top). They pass data down to a `*-client.tsx` companion which is a client component. This avoids loading states and flickers.

```
page.tsx      ← 'async function', uses createClient from @/lib/supabase/server
  └── *-client.tsx  ← 'use client', receives props, handles all interactivity
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

Tailwind v4 cannot interpolate runtime oklch values. **Never** write `className="bg-[oklch(0.75 0.17 205)]"` with dynamic values — it won't work. Instead, use `style={{ background: 'oklch(0.75 0.17 205)' }}` for any color that is dynamic or domain-specific.

Static oklch values that Tailwind v4 knows about (defined in `globals.css` as CSS variables) can be referenced via `bg-primary`, `text-foreground`, etc.

### 4. RTL / language

The app is RTL by default (Hebrew). The `useLang()` hook returns `{ t, lang, toggleLang, isRTL }`.
- Use `isRTL` to conditionally flip layouts: `className={isRTL ? 'flex-row-reverse' : 'flex-row'}`
- For tab/day ordering, use `dir="rtl"` on the container instead of reversing arrays — reversing arrays twice breaks things.
- Never hardcode Hebrew strings outside of `src/lib/lang.tsx` (use the `t()` function).
- Exception: the schedule is fully Hebrew and hardcoded in `src/lib/schedule.ts` — that's intentional.

### 5. Domain colors

Each domain in `src/lib/domains.ts` has:
```ts
{
  color: '#38BDF8',           // hex — used in inline style props
  gradient: 'from-sky-400/25 to-sky-600/5',  // Tailwind — used in className
  glowColor: 'rgba(56,189,248,0.22)',         // rgba — used in box-shadow
}
```
Use `domain.color` for inline styles, `domain.gradient` for className, `domain.glowColor` for box-shadow glows.

### 6. XP updates

Always use the Supabase RPC — never update the `xp` column directly:
```ts
await supabase.rpc('update_profile_xp', { uid: user.id, xp_delta: 10 })
```
This is atomic and prevents race conditions.

### 7. Theme (dark/light)

- `ThemeProvider` in `src/lib/theme.tsx` manages theme state.
- It toggles the `dark` / `light` class on `<html>`.
- `globals.css` has `.dark { ... }` and `html.light { ... }` blocks.
- The light mode overrides Tailwind utility classes like `.text-white/60` via `!important` rules.
- Never hardcode `dark:` prefix classes — the app uses class-based theming, not the `prefers-color-scheme` media query.

---

## File Reference — Key Files

| File | What it does |
|---|---|
| `src/app/layout.tsx` | Root layout: wraps everything in ThemeProvider + LangProvider, sets PWA metadata |
| `src/app/(dashboard)/layout.tsx` | Dashboard shell: auth check, BottomNav, FAB, NightCheckIn |
| `src/app/globals.css` | All CSS: oklch theme variables, light mode overrides, keyframe animations |
| `src/lib/domains.ts` | Single source of truth for all 8 domains |
| `src/lib/mesillat.ts` | XP level logic — `getLevelFromXp()`, `getXpProgress()` |
| `src/lib/lang.tsx` | All translations + `useLang()` hook |
| `src/lib/theme.tsx` | Dark/light theme + `useTheme()` hook |
| `src/lib/schedule.ts` | Hardcoded weekly schedule for Rotem's yeshiva timetable |
| `src/types/index.ts` | All TypeScript interfaces |
| `supabase-schema.sql` | Full DB schema — run in Supabase SQL Editor to set up |
| `src/app/api/insights/route.ts` | Server route: calls Claude Haiku with weekly stats, returns Hebrew coaching |

---

## Database Tables

```sql
profiles        -- id (uuid, FK auth.users), full_name, xp, current_streak, longest_streak, last_activity_date
habits          -- id, user_id, domain_slug, name, description, frequency ('daily'|'weekly'), xp_reward, is_active
habit_logs      -- id, user_id, habit_id, completed_at (date), UNIQUE(habit_id, completed_at)
journal_entries -- id, user_id, domain_slug, date, text, UNIQUE(user_id, domain_slug, date)
night_checkins  -- id, user_id, date, mood, productive, gratitude, UNIQUE(user_id, date)
user_schedule   -- id, user_id, day_of_week (0-6), time, label, type, sort_order
```

All tables have RLS enabled — users only see their own rows.

---

## The 7 Domains

```ts
['family', 'friends', 'torah', 'secular', 'sports', 'finance', 'music']
```

Domain pages at `/domain/[slug]` are dynamic. The `domain-detail-client.tsx` renders domain-specific extras:
- `torah` slug: shows `SefariaWidget`
- `sports` / `music` slugs: show `ConnectPlaceholder`

`family` has its own dedicated route at `/domain/family` with tasks, rituals, and adventures.

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL      — from Supabase project settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY — the "Publishable key" in newer Supabase dashboards
ANTHROPIC_API_KEY             — server-only, for /api/insights
```

Set in `.env.local` for local dev and in Vercel project settings for production.

---

## Design System Quick Reference

**Ocean Dark (default)**
```
Background:  oklch(0.08 0.035 240)   — deep navy
Cards:       oklch(0.12 0.04 238)    — dark blue-gray
Primary:     oklch(0.75 0.17 205)    — ocean cyan
Borders:     oklch(0.75 0.12 210 / 14%)
Muted text:  oklch(0.55 0.05 230)
```

**CSS Animations defined in globals.css**
- `.animate-wave-slow` / `.animate-wave-fast` — horizontal translateX loop for waves
- `.animate-flame` — scale + brightness pulse for streak flames
- `.animate-fab-ring` — pulsing glow ring for FAB button
- `.animate-swipe-done` — translateX bump for swipe gesture feedback

**Time-of-day background classes** (set by `TimeBackground` component on body)
- `.bg-dawn`, `.bg-morning`, `.bg-noon`, `.bg-sunset`, `.bg-night`

---

## Mesillat Yesharim XP Levels

```
Level 1  זהירות  Watchfulness   0–100 XP      emoji: 👁️
Level 2  זריזות  Alacrity       100–250 XP    emoji: ⚡
Level 3  נקיות   Cleanliness    250–500 XP    emoji: ✨
Level 4  פרישות  Separation     500–800 XP    emoji: 🌿
Level 5  טהרה   Purity         800–1200 XP   emoji: 💧
Level 6  חסידות  Piety          1200–1700 XP  emoji: ❤️
Level 7  ענווה   Humility       1700–2300 XP  emoji: 🕊️
Level 8  יראת חטא Fear of Sin  2300–3000 XP  emoji: 🌟
Level 9  קדושה   Holiness       3000+ XP      emoji: 👑
```

---

## Schedule Data Structure

The schedule is **hardcoded** in `src/lib/schedule.ts` (not from DB) because it's personal to Rotem. The `WEEKLY_SCHEDULE` object maps day numbers (0=Sunday, 6=Saturday) to arrays of `{ time, label, type }`. Days 5–6 (Friday/Saturday) have reduced content.

Schedule item types: `'torah' | 'prayer' | 'shiur' | 'sports' | 'break' | 'other'`

The schedule page renders as a **horizontal-scroll table** with sticky time column on the right (RTL), today's column highlighted cyan.

---

## Achievements

8 achievements defined in `src/lib/achievements.ts`, checked against `AchievementData`:
- `first_habit` — has at least 1 habit
- `streak_7` — current_streak ≥ 7
- `streak_30` — current_streak ≥ 30
- `xp_100` — max XP in a single day ≥ 100
- `xp_500` — total XP ≥ 500
- `all_domains` — has habits in all 8 domains
- `torah_streak_3` — torah domain streak ≥ 3
- `habits_10` — total habit count ≥ 10

---

## Components That Use localStorage (not Supabase)

- `night-checkin.tsx` — stores `growth-checkin-{date}` to prevent showing twice
- `theme.tsx` — stores `growth-theme` ('dark' | 'light')
- `lang.tsx` — stores `growth-lang` ('he' | 'en')

---

## Known Quirks / Watch Out For

1. **`user_schedule` table exists but is unused** — The schedule page was switched to use the hardcoded `WEEKLY_SCHEDULE` from `src/lib/schedule.ts`. The DB table remains for future use.

2. **Supabase "Publishable key"** — Newer Supabase dashboards renamed "anon key" to "Publishable key". They are the same value. The env var name stays `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

3. **No `SUPABASE_SERVICE_ROLE_KEY` needed** — This app does not use admin/service role access. All operations go through the anon key with RLS.

4. **RTL tab ordering** — Never use array reversal to achieve RTL ordering in flex containers. Use `dir="rtl"` on the parent element instead. Array reversal + flex-row-reverse double-reverses.

5. **`router.refresh()` after mutations** — After any Supabase write (toggle habit, add habit, etc.), call `router.refresh()` to re-run the server component and get fresh data. This is the data refresh pattern — there is no global state management.

6. **Tailwind v4 breaking changes** — This is NOT standard Tailwind v3. There is no `tailwind.config.js`. The `@theme inline` block in `globals.css` defines all design tokens. Read `AGENTS.md` at the project root for a warning about this.

7. **`AGENTS.md`** — The project root has an `AGENTS.md` (included via `CLAUDE.md`) that warns: "This version has breaking changes — APIs, conventions, and file structure may all differ from your training data." Heed this before writing Next.js code.

8. **No `loading.tsx` files** — Data is always fetched server-side in page.tsx. There are no loading states to implement.

9. **Confetti fires once per session** — `confettiFired` is a `useRef` in `dashboard-client.tsx`, preventing re-firing on re-renders. It resets on page navigation.

---

## Git & Deployment

- Repo: `https://github.com/Rg707070/growth-claude` (branch: `main`)
- Git user: `granot12312@gmail.com`
- Vercel: connected to GitHub, auto-deploys on push to `main`
- Local dev server runs on port 3000 (or 3001 if 3000 is taken)

```bash
# Standard workflow
git add <files>
git commit -m "description"
git push
# → Vercel auto-deploys
```

---

## What Has Been Built (Complete Feature List)

**Core**
- [x] Supabase auth (email/password login + signup)
- [x] Profile with XP, streak, longest streak
- [x] Habits (create, toggle, delete) per domain
- [x] Habit logs with XP reward on completion
- [x] Atomic XP updates via stored procedure

**Dashboard**
- [x] Hero header card with greeting, XP bar, streak badge
- [x] Time-based background gradient (dawn/morning/noon/sunset/night)
- [x] Domain cards grid (2 columns) with progress rings + completion bar
- [x] Today's habit list with swipe-to-toggle + haptic feedback
- [x] Today's schedule widget
- [x] Weekly XP chart (7 bars)
- [x] Weekly challenge widget
- [x] Animated wave at bottom
- [x] Confetti on completing all habits

**Domain Detail**
- [x] Habit list with add/delete
- [x] Pomodoro timer (25/5 min, SVG ring)
- [x] One-line daily journal
- [x] Domain-specific extras (Sefaria for torah, Connect placeholders for sports/music)

**Progress**
- [x] 84-day completion heat map
- [x] Weekly XP chart
- [x] Achievement badges (8 total)
- [x] Mesillat Yesharim levels display
- [x] Weekly summary (Sundays only)
- [x] Friday Shabbat summary (Fridays only)
- [x] AI insights (Claude Haiku, lazy-loaded)

**Schedule**
- [x] Full weekly timetable (hardcoded from Rotem's yeshiva schedule)
- [x] Horizontal-scroll table, today highlighted
- [x] Color-coded by activity type

**Settings**
- [x] Dark / Light mode toggle (persisted)
- [x] Language toggle He/En (persisted)
- [x] Logout

**Global**
- [x] FAB (floating +) → quick-add habit to any domain
- [x] Night check-in modal (after 9 PM, gated by localStorage)
- [x] PWA manifest
- [x] Bilingual He/En with RTL support
- [x] Ocean dark + light ocean themes

---

## Possible Next Features (not yet built)

- Editable schedule via DB (the `user_schedule` table is ready)
- Push notifications for habit reminders
- Weekly email summary
- Social/sharing features
- Spotify / Google Calendar deep-link integrations (placeholders exist in `connect-placeholder.tsx`)
- Profile photo
- Friends / leaderboard
- Export data to CSV
