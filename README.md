# GROWTH — Personal Growth & Habit Tracker

A mobile-first, bilingual personal growth app built for a yeshiva student. Tracks habits and provides deep domain workspaces across 7 life domains. Fully bilingual: Hebrew (RTL default) and English.

---

## What it does

- **Habit tracking** across 7 domains — Family, Friends, Torah, Secular Study, Sports, Finance, Music
- **Streak tracking** — daily activity streak with milestone badges
- **Domain workspaces** — each domain has its own dedicated tools beyond basic habits
- **Torah workspace** — full learning studio: session timer, notes, study summaries, lesson feed, AI text scanning
- **Family coordination** — shared tasks with rotation, family habits with streak tracking, events, adventure ledger
- **Journal** — domain daily reflections, free-form rich-text documents (TipTap), photo albums with public share links
- **Editable schedule** — full weekly timetable with daily activity check-offs and schedule reflections
- **Night check-in** — evening modal with habit completion snapshot, shown at 19:00 (14:00 Fri / 21:00 Sat)
- **Friends ecosystem** — contact management, interaction logs, reminders
- **Finance ecosystem** — transaction tracking, wishlist management
- **Sports ecosystem** — workout logs, food restrictions, challenges
- **Music ecosystem** — practice logs, song tracking
- **Secular study ecosystem** — book progress tracking, project management
- **AI Torah text scanning** — Gemini identifies Sefaria references from a photo of a Torah text
- **Light / Dark mode** — Ocean Dark (default) and Light Ocean themes
- **PWA-ready** — installable on iOS and Android

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.6 (App Router) |
| Language | TypeScript 5 (strict) |
| Database & Auth | Supabase (PostgreSQL + Row Level Security) |
| Styling | Tailwind CSS v4 + oklch color system |
| UI Components | shadcn/ui (button, badge, card, input, tabs, etc.) |
| Icons | Lucide React |
| Rich Text Editor | TipTap v3 |
| Drag & Drop | dnd-kit (sortable) |
| AI | Google Generative AI (Gemini 2.0 Flash Lite) |
| Animations | CSS keyframes + `canvas-confetti` |
| Hebrew Calendar | Custom `src/lib/family/hebrew-calendar.ts` |
| Font | Geist + Heebo (Hebrew) |
| Deployment | Vercel |

---

## Architecture

```
src/
├── app/
│   ├── (auth)/                       # Public: login, signup
│   ├── (dashboard)/                  # Protected routes (auth checked in layout)
│   │   ├── layout.tsx                # Sidebar + BottomNav + FAB + NightCheckIn
│   │   ├── dashboard/page.tsx        # Main dashboard: domains, habits, streaks, heatmap
│   │   ├── domain/[slug]/page.tsx    # Dynamic domain page (friends, finance, sports, music, secular)
│   │   ├── domain/family/page.tsx    # Family coordination hub
│   │   ├── domain/torah/page.tsx     # Torah learning workspace
│   │   ├── domains/page.tsx          # All 7 domains grid
│   │   ├── journal/page.tsx          # Journal: domain entries + rich text docs + photo album
│   │   ├── reading/page.tsx          # Book progress tracking
│   │   ├── schedule/page.tsx         # Editable weekly schedule
│   │   └── settings/page.tsx         # Theme + language + logout
│   ├── share/album/[token]/page.tsx  # Public photo album slideshow
│   └── api/torah/scan/route.ts       # AI: Gemini identifies Torah text from photo
│
├── components/
│   ├── *-client.tsx                  # Client wrappers for each page
│   ├── hebrew/torah-*.tsx            # Torah workspace tab components
│   ├── ui/                           # shadcn primitives
│   └── integrations/                 # Sefaria widget, quick-links, connect-placeholder
│
├── lib/
│   ├── domains.ts                    # DOMAINS array — single source of truth
│   ├── schedule.ts                   # Hardcoded base schedule (Hebrew, yeshiva timetable)
│   ├── lang.tsx                      # Bilingual context + 200+ translations
│   ├── theme.tsx                     # Dark/light theme provider
│   ├── domain-ecosystem-config.ts    # Category configs for domain tasks/goals
│   ├── family/
│   │   ├── streak-engine.ts          # Family habit streak logic
│   │   └── hebrew-calendar.ts        # Hebrew date utilities
│   └── supabase/
│       ├── client.ts                 # Browser Supabase client
│       └── server.ts                 # SSR Supabase client (cookie-based)
│
└── types/
    ├── index.ts                      # Core types: Habit, Domain, DomainProgress, etc.
    ├── family.ts, finance.ts, friends.ts, music.ts, secular.ts, sports.ts
    └── ecosystem.ts                  # Task/Goal types
```

---

## The 7 Domains

| Slug | Hebrew | English | Color |
|---|---|---|---|
| `family` | משפחה | Family | Indigo #4F46E5 |
| `friends` | חברים | Friends | Sky #0EA5E9 |
| `torah` | לימודי קודש | Torah Study | Teal #0F766E |
| `secular` | לימודי חול | Secular Study | Emerald #059669 |
| `sports` | ספורט | Sports | Lime #65A30D |
| `finance` | כספים | Finance | Cyan #0891B2 |
| `music` | מוזיקה | Music | Violet #7C3AED |

---

## Database Schema (Supabase)

All tables use Row Level Security — users only access their own data.

**Core**

| Table | Purpose |
|---|---|
| `profiles` | full_name, current_streak, longest_streak, last_activity_date |
| `habits` | habits per domain (daily/weekly, is_active) |
| `habit_logs` | completion log — unique per habit per day |
| `journal_entries` | one daily reflection per domain per day |
| `night_checkins` | evening check-in: mood, productive, gratitude |

**Journal & Media**

| Table | Purpose |
|---|---|
| `journal_documents` | free-form rich text documents (TipTap) |
| `photo_entries` | weekly album photos (Supabase Storage) |
| `album_shares` | public share tokens for album slideshows |

**Schedule**

| Table | Purpose |
|---|---|
| `user_schedule` | editable weekly timetable (seeded from hardcoded data) |
| `activity_checks` | per-item daily check-offs |
| `schedule_reflections` | daily schedule review notes |

**Torah Workspace**

| Table | Purpose |
|---|---|
| `learning_sessions` | study sessions with timer |
| `learning_notes` | session notes, questions, highlights |
| `learning_summaries` | saved summaries with folders, tags, favorites |
| `torah_daily_tracks` | personal daily learning items (e.g. Daf Yomi) |
| `torah_lessons` | admin-seeded lesson feed |
| `saved_lessons` | user-saved lessons from feed |

**Family Domain**

| Table | Purpose |
|---|---|
| `family_tasks` | tasks by category, urgency, assignee, recurring rotation |
| `family_habits` | shared habits with frequency-based streak tracking |
| `family_events` | calendar events (birthday, holiday, trip, etc.) |
| `routine_breakers` | adventure/trip ledger (day trip, restaurant, travel) |

**Domain Ecosystem**

| Table | Purpose |
|---|---|
| `domain_tasks` | tasks scoped to any domain |
| `domain_goals` | goals scoped to any domain |
| `friend_contacts`, `friend_interactions`, `friend_reminders` | Friends domain |
| `finance_transactions`, `finance_wishlist` | Finance domain |
| `secular_books`, `secular_projects`, `reading_books` | Secular domain |
| `sport_workout_logs`, `sport_food_restrictions`, `sport_challenges` | Sports domain |
| `music_practice_logs`, `music_songs` | Music domain |

---

## Design System

The app uses the **oklch color space** for perceptually uniform colors.

### Ocean Dark Theme (default)
- Background: `oklch(0.08 0.035 240)` — deep navy
- Primary / cyan: `oklch(0.75 0.17 205)` — ocean cyan
- Cards: `oklch(0.12 0.04 238)` with `border: oklch(0.75 0.12 210 / 14%)`
- Glow shadows: oklch primaries at 20–40% opacity

### Light Ocean Theme
- Background: `oklch(0.94 0.018 210)` — pale ocean blue
- Overrides applied via `html.light` class selectors in `globals.css`

### Domain Colors
Each domain carries: `color` (hex for inline styles), `gradient` (Tailwind class), `glowColor` (rgba for box-shadow). Never hardcode these — always read from `DOMAINS` in `src/lib/domains.ts`.

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GOOGLE_AI_API_KEY=your-gemini-key
```

> `NEXT_PUBLIC_SUPABASE_ANON_KEY` is the "Publishable key" in newer Supabase dashboards.
> `GOOGLE_AI_API_KEY` is server-only — used only in `/api/torah/scan`.

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

Deployed on **Vercel**, connected to GitHub repo `Rg707070/growth-claude`. Every push to `main` triggers an automatic redeploy. Set all environment variables in Vercel project settings.

---

## Key Design Principles

1. **Mobile-first** — designed for an iPhone; all touch targets ≥ 44px; bottom nav for mobile, sidebar for desktop
2. **RTL by default** — Hebrew is the primary language; `dir="rtl"` on `<html>`, all layouts respect `isRTL`
3. **Server + Client split** — pages fetch data server-side (no loading spinners), client components handle interaction
4. **Inline styles for dynamic colors** — Tailwind v4 cannot interpolate runtime values, so domain colors use `style={{}}` props
5. **No global state** — `router.refresh()` after every Supabase write to re-run server components
6. **RLS all the way** — all data access enforced by Supabase Row Level Security; `SUPABASE_SERVICE_ROLE_KEY` not used
