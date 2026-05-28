# GROWTH — Personal Optimization App

A mobile-first habit + life-management app built for a yeshiva student. Tracks habits across 7 life domains, shows a personalized weekly schedule, and bundles dedicated workspaces for Torah learning, reading (books), journaling, and family management. Fully bilingual: Hebrew (RTL default) and English.

---

## What it does

- **Habit tracking** across 7 domains (Family, Friends, Torah, Secular Study, Sports, Finance, Music) — daily/weekly frequency, streaks, completion %
- **Per-domain pages** with habit list, journaling, and integration widgets (Sefaria for Torah; Garmin/Spotify placeholders for Sports/Music)
- **Family workspace** — three tabs:
  - **Tasks** with urgency, category, optional rotation between members
  - **Habits** with shared or individual streaks
  - **Adventures** — day trips, restaurants, travel, with cost tier + media links
- **Torah workspace** — daily learning tracks, learning sessions with timer, notes, rich-text summaries (TipTap), a Sefaria reader, an OCR scan endpoint (image → Sefaria reference via Gemini)
- **Reading (Books) module** — track books by page or chapter, target completion date, inline notes, read / want-to-read tabs
- **Schedule** — full weekly timetable rendered from a hardcoded source (Rotem's yeshiva schedule), with per-day reflections and per-item check-offs
- **Journal** — three modes: long-form writing (TipTap), weekly photo album with public share links, insights
- **Night check-in** modal — mood / productivity / gratitude (after 9 PM, gated by localStorage)
- **Bottom nav** — floating pill, drag-to-reorder (via `@dnd-kit`), 5 destinations + center add button
- **Light / Dark mode** — light-first theme; both are first-class
- **PWA-ready** — installable on iOS and Android

> **Note:** an earlier XP + *Mesillat Yesharim* leveling system was removed in PR #38. There are currently no XP, no levels, no achievements, no confetti, no AI insights endpoint. The motivational surface is streaks + completion %.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.6 (App Router) |
| Runtime | React 19.2.4 |
| Language | TypeScript 5 (strict) |
| Database & Auth | Supabase (PostgreSQL + Row Level Security, `@supabase/ssr` for cookie-based SSR auth) |
| Styling | Tailwind CSS v4 + oklch color system (no `tailwind.config.*` — `@theme inline` in `globals.css`) |
| UI Components | shadcn/ui (button, badge, card, input, label, progress, separator, tabs) |
| Icons | Lucide React (v1.16) |
| Rich text | TipTap 3 (writing tab, Torah summaries) |
| Drag & drop | `@dnd-kit/core` + `/sortable` (bottom-nav reorder) |
| AI | Google Generative AI (Gemini 2.0 Flash) — server-side only, used by `/api/torah/scan` |
| Deployment | Vercel |
| Fonts | Geist + Heebo (Hebrew) |

---

## Architecture

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                          # auth gate + nav shell
│   │   ├── dashboard/
│   │   │   ├── page.tsx                        # server: profile, habits, today's logs, 14-day window
│   │   │   └── dashboard-client.tsx
│   │   ├── domains/page.tsx                    # all-7-domains browser
│   │   ├── domain/[slug]/
│   │   │   ├── page.tsx                        # server: habits + today's logs for one domain
│   │   │   └── domain-detail-client.tsx
│   │   ├── domain/family/
│   │   │   ├── page.tsx                        # server: family_tasks + family_habits + routine_breakers
│   │   │   ├── family-client.tsx               # tabs: tasks | habits | adventures
│   │   │   └── actions.ts                      # RPC wrappers
│   │   ├── journal/
│   │   │   ├── page.tsx
│   │   │   ├── journal-client.tsx              # tabs: writing | album | insights
│   │   │   ├── writing-tab.tsx                 # TipTap editor on journal_documents
│   │   │   ├── album-tab.tsx                   # week-grouped photos in Supabase Storage
│   │   │   └── insights-tab.tsx
│   │   ├── reading/
│   │   │   ├── page.tsx
│   │   │   └── reading-client.tsx              # canonical "Books pattern" — see CLAUDE.md
│   │   ├── schedule/
│   │   │   ├── page.tsx
│   │   │   └── schedule-client.tsx             # weekly grid + per-item check + day reflection
│   │   └── settings/page.tsx
│   ├── share/album/[token]/
│   │   ├── page.tsx                            # public, no-auth photo slideshow
│   │   └── slideshow-client.tsx
│   ├── api/
│   │   └── torah/scan/route.ts                 # POST: image → Sefaria reference (Gemini)
│   ├── layout.tsx                              # ThemeProvider + LangProvider + PWA metadata
│   ├── page.tsx                                # root redirect
│   └── globals.css                             # @theme inline + light/dark tokens + brand gradient
│
├── components/
│   ├── ui/                                     # shadcn primitives
│   ├── bottom-nav.tsx                          # floating pill, drag-to-reorder
│   ├── sidebar.tsx                             # desktop nav
│   ├── dashboard-main.tsx
│   ├── domain-card.tsx
│   ├── habit-row.tsx                           # checkbox + reminder picker + edit + delete
│   ├── progress-ring.tsx
│   ├── weekly-chart.tsx
│   ├── weekly-summary.tsx
│   ├── friday-summary.tsx
│   ├── heat-map.tsx                            # 14-day grid
│   ├── domain-journal.tsx
│   ├── pomodoro-timer.tsx
│   ├── night-checkin.tsx
│   ├── schedule-today.tsx
│   ├── lang-toggle.tsx
│   ├── time-background.tsx                     # time-of-day gradient
│   ├── wave-animation.tsx
│   ├── growth-logo.tsx
│   ├── fab.tsx                                 # vestigial near-empty placeholder
│   ├── integrations/
│   │   ├── sefaria-widget.tsx
│   │   ├── connect-placeholder.tsx             # Garmin / Spotify CTA
│   │   └── quick-links.tsx
│   └── torah/
│       ├── torah-workspace-client.tsx          # 5 tabs: home | learn | feed | summaries | profile
│       ├── torah-home-tab.tsx
│       ├── torah-learn-tab.tsx
│       ├── torah-feed-tab.tsx
│       ├── torah-summaries-tab.tsx
│       ├── torah-summary-panel.tsx
│       ├── torah-profile-tab.tsx
│       ├── torah-daily-schedule.tsx
│       └── sefaria-reader.tsx
│
├── lib/
│   ├── domains.ts                              # DOMAINS array (single source of truth)
│   ├── domain-integrations.ts                  # domain → widget map
│   ├── schedule.ts                             # hardcoded weekly schedule (Hebrew)
│   ├── lang.tsx                                # LangProvider + useLang()
│   ├── theme.tsx                               # class-based dark/light + persistence
│   ├── utils.ts                                # shadcn cn()
│   ├── family/
│   │   └── realtime.ts                         # Supabase realtime for family_* tables
│   └── supabase/
│       ├── client.ts
│       └── server.ts
│
├── hooks/
│   └── use-notifications.ts                    # browser notifications for habit reminders
│
├── types/
│   └── index.ts
│
└── middleware.ts                               # Supabase session refresh
```

---

## Database Schema (Supabase)

All tables have Row Level Security. Users only see their own rows. Exceptions: `torah_lessons` (any authenticated user can read); `album_shares` (anyone with the token can read).

Full DDL lives in `supabase-schema.sql` — a single consolidated file as of PR #27.

**Core tables**

| Table | Purpose |
|---|---|
| `profiles` | id, full_name, current_streak, longest_streak, last_activity_date |
| `habits` | per-user habits keyed by domain_slug, frequency, is_active |
| `habit_logs` | one row per habit per day (unique on habit_id + completed_at) |
| `journal_entries` | one-line per domain per day |
| `journal_documents` | long-form TipTap content |
| `photo_entries` / `album_shares` | weekly photo album + public share tokens |
| `night_checkins` | mood / productive / gratitude per night |
| `user_schedule` | editable schedule — table exists but currently unused |
| `schedule_reflections` / `activity_checks` | per-day notes and per-schedule-item ✓ |
| `learning_sessions` / `learning_notes` / `learning_summaries` | Torah workspace |
| `torah_lessons` / `saved_lessons` / `torah_daily_tracks` | Torah workspace |
| `reading_books` | books tracker |
| `family_tasks` / `family_habits` / `routine_breakers` | family workspace |

**RPC functions**

- `advance_family_habit_streak(habit_id, uid)` — frequency-aware streak advance / reset
- `advance_task_rotation(task_id, uid, max_members default 2)` — round-robin assignment
- `handle_new_user()` — trigger that seeds a `profiles` row on signup
- `touch_updated_at()` — generic updated-at trigger

---

## Design System

The app uses the **oklch color space** throughout and is **light-first** (dark mode is a peer, not the default).

### Brand gradient
`#0B2447 → #1E5F74 → #0E9F6E → #65A30D` (deep navy → teal → emerald → lime). Exposed in CSS as `--brand-gradient` and `--brand-gradient-soft`.

### Theme tokens
Defined in `src/app/globals.css` under `@theme inline` and `:root` / `.dark`. Toggled by `src/lib/theme.tsx` via a `dark` / `light` class on `<html>`, persisted to `localStorage`.

### Domain colors (`src/lib/domains.ts`)
Each domain has `color` (hex, for inline styles), `gradient` (Tailwind class string), `glowColor` (rgba, for box-shadow).

| Slug | Hebrew | English | Color |
|---|---|---|---|
| `family` | משפחה | Family | `#4F46E5` indigo |
| `friends` | חברים | Friends | `#0EA5E9` sky |
| `torah` | לימודי קודש | Torah Study | `#0F766E` teal |
| `secular` | לימודי חול | Secular Study | `#059669` emerald |
| `sports` | ספורט | Sports | `#65A30D` lime |
| `finance` | כספים | Finance | `#0891B2` cyan |
| `music` | מוזיקה | Music | `#7C3AED` violet |

### Radius scale
Base `--radius: 0.875rem`; multipliers in `@theme inline` for `sm` (0.6×), `md` (0.8×), `lg` (1×), `xl` (1.4×), `2xl` (1.8×), `3xl` (2.2×), `4xl` (2.6×).

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key
GOOGLE_AI_API_KEY=...
```

- In newer Supabase dashboards the "anon key" is labelled "Publishable key" — same value.
- `GOOGLE_AI_API_KEY` is server-only — used by `/api/torah/scan` to call Gemini 2.0 Flash.
- `SUPABASE_SERVICE_ROLE_KEY` is NOT needed (all DB writes go through anon key + RLS).

---

## Running Locally

```bash
npm install
npm run dev        # → http://localhost:3000
npx tsc --noEmit   # type check (run before every commit)
npm run lint
npm run build
```

---

## Deployment

Deployed on **Vercel**, connected to GitHub repo `Rg707070/growth-claude`. Every push to `main` triggers an auto-deploy. Environment variables must be set in Vercel project settings.

---

## Key Design Principles

1. **Mobile-first, no horizontal overflow** — touch targets ≥ 44px; bottom-nav pill clearance (`pb-24`) on mobile content
2. **RTL by default** — Hebrew is the primary language; `dir="rtl"` on `<html>`, all layouts respect `isRTL`
3. **Server + Client split** — pages fetch data server-side (no loading spinners), client components handle interaction
4. **Inline styles for dynamic colors** — Tailwind v4 cannot interpolate runtime values, so domain colors use `style={{}}` props
5. **`router.refresh()` after writes** — no global state library; server components re-run on demand
6. **Books pattern for new modules** — see `reading-client.tsx` and `CLAUDE.md`

---

## For AI agents / contributors

Read `CLAUDE.md` and `AGENTS.md` before writing code. They contain the up-to-date file-level conventions, the list of stale claims to ignore in older docs, and the exact Next.js 16 / Tailwind v4 / TypeScript strict rules this repo enforces.
