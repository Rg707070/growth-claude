# GROWTH — Personal Optimization App

A mobile-first, gamified personal growth tracker built for a yeshiva student. Tracks habits across 8 life domains, rewards progress with XP and levels drawn from *Mesillat Yesharim* (Path of the Just), and renders a personalized daily schedule. Fully bilingual: Hebrew (RTL default) and English.

---

## What it does

- **Habit tracking** across 8 domains (Family, Friends, Torah, Secular Study, Sports, Trading, Finance, Music)
- **XP & leveling system** based on the 9 levels of *Mesillat Yesharim* — from Watchfulness (זהירות) to Holiness (קדושה)
- **Streak tracking** with animated flame badges that grow at milestones
- **Achievement system** — 8 unlockable badges (first habit, 7-day streak, 30-day streak, etc.)
- **Weekly XP chart** — 7-bar visualization of XP earned each day
- **84-day heat map** showing completion percentage per day
- **AI insights** — Claude Haiku generates personalized Hebrew coaching tips from weekly stats
- **Pomodoro timer** per domain (25/5 min focus sessions)
- **Daily journal** — one-line entry per domain per day, last 5 entries shown
- **Night check-in** modal — mood / productivity / gratitude, shown after 9 PM
- **Portfolio tracker** — for the Trading domain, manual buy/current price table with P&L
- **Personal schedule** — full weekly timetable sourced from the user's yeshiva schedule
- **Mesillat Yesharim quotes** — one daily quote cycling through 30 classic passages
- **Sefaria widget** — embedded Torah source viewer in the Torah domain
- **TradingView widget** — embedded chart in the Trading domain
- **FAB (Floating Action Button)** — quick-add any habit from anywhere
- **Light / Dark mode** — Ocean Dark (default) and Light Ocean themes
- **PWA-ready** — installable on iOS and Android

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict) |
| Database & Auth | Supabase (PostgreSQL + Row Level Security) |
| Styling | Tailwind CSS v4 + oklch color system |
| UI Components | shadcn/ui (button, badge, card, input, etc.) |
| Icons | Lucide React |
| AI | Anthropic Claude Haiku (via `@anthropic-ai/sdk`) |
| Animations | CSS keyframes + `canvas-confetti` |
| Deployment | Vercel |
| Font | Geist (Google Fonts) |

---

## Architecture

```
src/
├── app/
│   ├── (auth)/                  # Login + Signup pages (unauthenticated)
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/             # All authenticated pages share a layout
│   │   ├── layout.tsx           # Wraps all pages — adds BottomNav + FAB + NightCheckIn
│   │   ├── dashboard/           # Home tab
│   │   │   ├── page.tsx         # Server: fetches profile, habits, logs, weekly XP
│   │   │   └── dashboard-client.tsx  # Client: renders hero header, domain grid, habit list
│   │   ├── domain/[slug]/       # Per-domain detail page
│   │   │   ├── page.tsx         # Server: fetches habits + logs for this domain
│   │   │   └── domain-detail-client.tsx  # Client: habit list + pomodoro + journal + widgets
│   │   ├── domains/page.tsx     # Domain browser (all 8 domains)
│   │   ├── progress/            # Progress / stats tab
│   │   │   ├── page.tsx         # Server: fetches 84-day data + achievement data
│   │   │   └── progress-client.tsx  # Client: heatmap + chart + achievements + AI insights
│   │   ├── schedule/            # Weekly schedule tab
│   │   │   ├── page.tsx         # Static: no DB, renders from WEEKLY_SCHEDULE
│   │   │   └── schedule-client.tsx  # Horizontal-scroll table, today's column highlighted
│   │   └── settings/page.tsx    # Theme toggle + language toggle + logout
│   ├── api/
│   │   └── insights/route.ts    # POST → calls Claude Haiku, returns Hebrew coaching bullet points
│   ├── layout.tsx               # Root: ThemeProvider + LangProvider, PWA metadata
│   ├── page.tsx                 # Root redirect → /dashboard (or /login if unauth)
│   └── globals.css              # Ocean theme variables, light mode overrides, animations
│
├── components/
│   ├── ui/                      # shadcn primitives (button, badge, card, input, etc.)
│   ├── bottom-nav.tsx           # 5-tab nav: Home, Domains, Schedule, Progress, Settings
│   ├── domain-card.tsx          # Card in 2-col grid on dashboard — icon, progress bar, stats
│   ├── habit-row.tsx            # Habit row with checkbox, swipe-to-toggle, XP badge, domain color bar
│   ├── xp-bar.tsx               # Level emoji + name + glowing cyan progress bar
│   ├── streak-badge.tsx         # Animated flame + streak count
│   ├── progress-ring.tsx        # SVG circular progress ring used in domain cards
│   ├── fab.tsx                  # Floating + button → slide-up sheet to quick-add habits
│   ├── wave-animation.tsx       # Animated ocean waves at dashboard bottom
│   ├── time-background.tsx      # Sets time-of-day CSS class on body (dawn/morning/noon/sunset/night)
│   ├── weekly-chart.tsx         # 7-bar XP chart (cyan = today, blue = other days)
│   ├── heat-map.tsx             # 84-day completion grid, colored by % complete
│   ├── achievements-display.tsx # Grid of locked/unlocked achievement badges
│   ├── weekly-challenge.tsx     # Weekly challenge with progress bar
│   ├── weekly-summary.tsx       # Sunday: recap of last week's stats
│   ├── friday-summary.tsx       # Friday: Shabbat countdown + week summary
│   ├── ai-insights.tsx          # Lazy AI coaching card, calls /api/insights
│   ├── mesillat-quote.tsx       # Daily rotating Mesillat Yesharim quote
│   ├── domain-journal.tsx       # One-line daily journal per domain, last 5 entries
│   ├── pomodoro-timer.tsx       # 25/5 min timer with SVG ring, shown in domain pages
│   ├── portfolio-tracker.tsx    # Trading domain: stock table with P&L (LUNR, AFRM, etc.)
│   ├── night-checkin.tsx        # Post-9pm modal: mood/productive/gratitude, gated by localStorage
│   ├── schedule-today.tsx       # Dashboard widget: today's schedule preview
│   ├── lang-toggle.tsx          # He/En toggle button (header)
│   ├── confetti.tsx             # Ocean-colored confetti burst on habit completion
│   └── integrations/
│       ├── sefaria-widget.tsx   # Embedded Sefaria for Torah domain
│       ├── tradingview-widget.tsx  # Embedded TradingView for Trading domain
│       ├── connect-placeholder.tsx # Placeholder for future integrations
│       └── quick-links.tsx      # Domain-specific shortcut links
│
├── lib/
│   ├── domains.ts               # DOMAINS array: 8 life domains with color/icon/gradient/glowColor
│   ├── mesillat.ts              # 9 XP level definitions + getLevelFromXp() + getXpProgress()
│   ├── mesillat-quotes.ts       # Array of 30 Mesillat Yesharim quotes in Hebrew
│   ├── achievements.ts          # 8 achievement definitions + getUnlockedIds()
│   ├── schedule.ts              # WEEKLY_SCHEDULE: full 7-day timetable (hardcoded)
│   ├── lang.tsx                 # LangProvider + useLang() — Hebrew/English translations
│   ├── theme.tsx                # ThemeProvider + useTheme() — dark/light, persisted to localStorage
│   ├── domain-integrations.ts   # Maps domain slugs to their specific widget components
│   ├── utils.ts                 # shadcn cn() utility
│   └── supabase/
│       ├── client.ts            # Supabase browser client (createBrowserClient)
│       └── server.ts            # Supabase server client (createServerClient with cookies)
│
└── types/
    └── index.ts                 # Domain, Habit, HabitLog, Profile, MesillatLevel, DomainProgress
```

---

## Database Schema (Supabase)

All tables have Row Level Security — users only access their own data.

| Table | Purpose |
|---|---|
| `profiles` | XP, streak, full_name — extends `auth.users` |
| `habits` | User's habits with domain_slug, frequency, xp_reward |
| `habit_logs` | One row per habit per day when completed (unique constraint) |
| `journal_entries` | One-line per domain per day |
| `night_checkins` | Mood/productive/gratitude per night |
| `user_schedule` | Editable weekly schedule (currently unused — schedule is hardcoded) |

**Key Supabase RPC:** `update_profile_xp(uid, xp_delta)` — atomic XP update to prevent race conditions.

---

## Design System

The entire app uses the **oklch color space** for perceptually uniform colors.

### Ocean Dark Theme (default)
- Background: `oklch(0.08 0.035 240)` — deep navy
- Primary / cyan: `oklch(0.75 0.17 205)` — ocean cyan
- Cards: `oklch(0.12 0.04 238)` with `border: oklch(0.75 0.12 210 / 14%)`
- Glow shadows use oklch primaries at 20–40% opacity

### Light Ocean Theme
- Background: `oklch(0.94 0.018 210)` — pale ocean blue
- Overrides applied via `html.light .text-white/x`, `html.light .bg-white/x` classes in `globals.css`

### Domain Colors
Each domain has: `color` (hex for dynamic inline styles), `gradient` (Tailwind), `glowColor` (rgba for box-shadow).

### Mesillat Yesharim Levels (XP thresholds)

| Level | Hebrew | English | XP Range |
|---|---|---|---|
| 1 | זהירות | Watchfulness | 0–100 |
| 2 | זריזות | Alacrity | 100–250 |
| 3 | נקיות | Cleanliness | 250–500 |
| 4 | פרישות | Separation | 500–800 |
| 5 | טהרה | Purity | 800–1,200 |
| 6 | חסידות | Piety | 1,200–1,700 |
| 7 | ענווה | Humility | 1,700–2,300 |
| 8 | יראת חטא | Fear of Sin | 2,300–3,000 |
| 9 | קדושה | Holiness | 3,000+ |

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=sk-ant-...
```

> In newer Supabase dashboards the "anon key" is labelled "Publishable key" — same value.
> `ANTHROPIC_API_KEY` is server-only (used only in `/api/insights`).

---

## Running Locally

```bash
npm install
npm run dev        # → http://localhost:3000
npx tsc --noEmit   # type check
npm run build      # production build
```

---

## Deployment

Deployed on **Vercel**, connected to GitHub repo `Rg707070/growth-claude`. Every push to `main` triggers an automatic redeploy. Environment variables must be set in Vercel project settings.

---

## The 8 Life Domains

| Slug | Hebrew | English | Color |
|---|---|---|---|
| `family` | משפחה | Family | Sky blue |
| `friends` | חברים | Friends | Emerald |
| `torah` | לימודי קודש | Torah Study | Amber |
| `secular` | לימודי חול | Secular Study | Orange |
| `sports` | ספורט | Sports | Red |
| `trading` | מסחר | Trading | Violet |
| `finance` | כספים | Finance | Cyan |
| `music` | מוזיקה | Music | Pink |

---

## Key Design Principles

1. **Mobile-first, no horizontal overflow** — designed for an iPhone; all touch targets ≥ 44px
2. **RTL by default** — Hebrew is the primary language; `dir="rtl"` on `<html>`, all layouts respect `isRTL`
3. **Server + Client split** — pages fetch data server-side (no loading spinners), client components handle interaction
4. **Inline styles for dynamic colors** — Tailwind cannot interpolate runtime oklch values, so domain colors use `style={{}}` props
5. **No mocks, no guesses** — all data from Supabase with RLS; atomic XP updates via stored procedure
6. **Alive, not static** — time-based backgrounds, wave animations, confetti on full completion, pulsing flame badge
