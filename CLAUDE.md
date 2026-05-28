@AGENTS.md

# GROWTH App — Claude Code Instructions

## What this project is

A mobile-first habit + life-management app for a yeshiva student (Rotem). Tracks 7 life domains (family, friends, torah, secular, sports, finance, music) with per-domain habits, streaks, journaling, a hardcoded weekly schedule, Torah learning sessions, and a books module. Bilingual: Hebrew (RTL, default) + English.

**Stack:** Next.js 16.2.6 (App Router), React 19.2.4, TypeScript 5 (strict), Supabase (auth + Postgres + RLS), Tailwind CSS v4 (no config file — `@theme inline` in `globals.css`), shadcn/ui, Lucide icons, `@google/generative-ai` (Gemini 2.0 Flash) for one server route, `@tiptap/*` for the rich-text writing surfaces, `@dnd-kit/*` for drag-to-reorder in the bottom nav.
**Deployed:** Vercel ← GitHub (`Rg707070/growth-claude`, branch `main`).

> **No XP / no levels.** An earlier XP + *Mesillat Yesharim* leveling system was removed in PR #38 (commit `301fd78`). The `profiles.xp` column, `habits.xp_reward` column, and `update_profile_xp` RPC no longer exist. The app's reward surface is now: per-habit streak, per-domain completion %, weekly bar chart, 14-day heat-map. Do not reintroduce XP without an explicit instruction.

---

## Commands

```bash
npm run dev        # dev server → http://localhost:3000 (or 3001 if busy)
npm run build      # production build — also catches TS errors
npx tsc --noEmit   # fast type-check only
npm run lint       # ESLint (flat config in eslint.config.mjs)
git push           # triggers Vercel auto-deploy
```

Always run `npx tsc --noEmit` before committing. Zero-error policy.

---

## Architecture rules — read before writing any code

### Next.js 16 — read AGENTS.md first
This is Next.js 16, not what you remember from training. Read the relevant guide under `node_modules/next/dist/docs/` before writing routing, caching, or server-component code.

### Server vs. Client components
- `page.tsx` files are **server components** — use `createClient` from `@/lib/supabase/server`.
- `*-client.tsx` companions are `'use client'` — use `createClient` from `@/lib/supabase/client`.
- Never cross-import server/client Supabase clients.
- Data fetch in `page.tsx`, pass as props to client. No loading spinners needed.

### After any Supabase write
Always call `router.refresh()` to re-run the server component and get fresh data. There is no global state library (no react-query, swr, zustand). Family-module writes additionally hit the realtime subscription in `src/lib/family/realtime.ts`, which also calls `router.refresh()` on cross-device events.

### Auth pattern in dashboard
`(dashboard)/layout.tsx` checks auth and redirects to `/login`. Individual dashboard pages do NOT re-check auth.

### RPCs that DO exist
Defined in `supabase-schema.sql`:
- `advance_family_habit_streak(habit_id uuid, uid uuid) returns int` — increments family habit streak if within the frequency window, resets if outside.
- `advance_task_rotation(task_id uuid, uid uuid, max_members int default 2) returns int` — rotates a family task's `assigned_to` slot.
- `handle_new_user()` — trigger on `auth.users` insert, creates a `profiles` row.
- `touch_updated_at()` — generic updated-at trigger.

There is no XP RPC. If you need atomic counters, add a new RPC — do not do read-modify-write from the client.

---

## Module structure — the "Books pattern"

PR #45 + commit `7c4a6b4` aligned Habits, Schedule, and Torah on the structure first built for the Reading (Books) module. Use it for any new top-level module.

Canonical example: `src/app/(dashboard)/reading/reading-client.tsx`. The pattern:

```tsx
<div className="flex-1 min-h-0 overflow-y-auto pb-24 md:pb-6">
  <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-2xl ..." />   {/* icon box, tinted with domain/module color */}
      <div>
        <h1 className="font-bold text-lg">{title}</h1>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
    {/* tabs / list / content */}
  </div>
</div>
```

Bottom-nav clearance (`pb-24 md:pb-6`) is required on mobile — the floating pill nav overlaps content otherwise.

---

## Color system — critical

Tailwind v4 cannot interpolate runtime oklch or hex values into class names. For any **dynamic or domain-specific color**, use inline `style={{}}`:

```tsx
// ✅ correct
style={{ background: `${domain.color}22`, color: domain.color }}

// ❌ wrong — Tailwind can't resolve this at build time
className={`bg-[${domain.color}]`}
```

### Theme (light-first; dark is a peer, not a default)
Theme tokens live in `src/app/globals.css` under `@theme inline` and `:root` / `.dark`. Toggled by `src/lib/theme.tsx` via a `dark` / `light` class on `<html>`, persisted to `localStorage`.

Brand gradient: `#0B2447 → #1E5F74 → #0E9F6E → #65A30D` (deep → teal → emerald → lime). Exposed as `--brand-gradient` and `--brand-gradient-soft`.

### Per-domain palette (`src/lib/domains.ts`)
Each `DOMAINS` entry has `slug`, `nameHe`, `nameEn`, `icon` (emoji), `color` (hex), `gradient` (Tailwind class string), `glowColor` (rgba). Never hardcode domain colors elsewhere.

| slug | color |
|---|---|
| `family` | `#4F46E5` indigo |
| `friends` | `#0EA5E9` sky |
| `torah` | `#0F766E` teal |
| `secular` | `#059669` emerald |
| `sports` | `#65A30D` lime |
| `finance` | `#0891B2` cyan |
| `music` | `#7C3AED` violet |

### Radius scale
`--radius: 0.875rem`; multipliers `sm` (0.6×) → `4xl` (2.6×). Defined in `@theme inline`.

---

## RTL / Language rules

- Default language is Hebrew; `dir="rtl"` is set on `<html>` from the root layout.
- Use `const { t, isRTL } = useLang()` from `src/lib/lang.tsx` everywhere user-facing.
- To flip layout direction: use `dir="rtl"` on the flex container. **Never** reverse arrays — reversing + `flex-row-reverse` double-reverses.
- No hardcoded Hebrew strings in components — use `t('key')`. Exception: `src/lib/schedule.ts` is intentionally all Hebrew (personal schedule).
- Light/dark overrides in `globals.css` are class-based (`html.light` / `.dark`), not media-query.

---

## Code style

- Functional components only, React hooks for state.
- Named exports for components — except pages (Next.js requires default).
- TypeScript strict mode — explicit types on exported functions/props. No `any`.
- No comments unless the WHY is non-obvious. Never narrate what the code does.
- Use `@/` path aliases, not relative `../../` imports.
- shadcn/ui primitives in `src/components/ui/` (`button`, `badge`, `card`, `input`, `label`, `progress`, `separator`, `tabs`) — use them before writing custom primitives.
- TipTap is the rich-text editor (used in writing-tab and Torah summaries). Don't reinvent.

---

## Routes (current ground truth)

```
src/app/
├── (auth)/login | signup
├── (dashboard)/
│   ├── dashboard/                 — home: today's habits, schedule, weekly chart
│   ├── domains/                   — 7-domain browser
│   ├── domain/[slug]/             — generic per-domain page (habits + journal + integration widget)
│   ├── domain/family/             — special family module (tasks / habits / adventures tabs)
│   ├── journal/                   — writing-tab + album-tab + insights-tab (tiptap + photos)
│   ├── reading/                   — books module (canonical pattern source)
│   ├── schedule/                  — weekly schedule view
│   └── settings/
├── share/album/[token]/           — public photo-album slideshow (token, no auth)
└── api/torah/scan/                — POST: Gemini 2.0 Flash OCR → Sefaria reference
```

`/api/torah/scan` is the **only** API route. There are no `/api/insights`, `/api/chat`, or `/api/daily-plan` routes — earlier docs implied them but they were never built.

---

## Database

Schema is in `supabase-schema.sql` (single source of truth — `supabase-family-schema.sql`, `supabase-migrations.sql`, `supabase-schema-trading.sql` were merged in PR #27).

| Table | Purpose |
|---|---|
| `profiles` | id, full_name, current_streak, longest_streak, last_activity_date |
| `habits` | per-user habits keyed by `domain_slug`, frequency, is_active |
| `habit_logs` | one row per habit per day (unique on habit_id, completed_at) |
| `journal_entries` | one-line per-domain per-day reflection |
| `journal_documents` | free-form long-form writing (TipTap content) |
| `photo_entries` | week-grouped photos in Supabase Storage |
| `album_shares` | per-week public share tokens (readable by anyone with token) |
| `night_checkins` | nightly mood / productive / gratitude emojis |
| `user_schedule` | editable weekly schedule (table exists, currently UNUSED — see below) |
| `schedule_reflections` | per-day notes for the schedule view |
| `activity_checks` | per-schedule-item ✓ per day |
| `learning_sessions` | torah study sessions (text, category, duration) |
| `learning_notes` | notes attached to a learning_session |
| `learning_summaries` | folder-organized written summaries with tags + favorites |
| `torah_lessons` | admin-seeded global lessons (auth users can read) |
| `saved_lessons` | per-user save of a global lesson |
| `torah_daily_tracks` | daily learning checklist |
| `reading_books` | reading tracker: pages or chapters, target date, notes |
| `family_tasks` | shared/rotated family to-dos |
| `family_habits` | shared family streaks |
| `routine_breakers` | family "adventures" — day trips, restaurants, travel, etc. |

All tables have RLS keyed to `auth.uid()`. Exceptions: `torah_lessons` is readable by any authenticated user; `album_shares` rows are readable by anyone (the token is the access credential).

`user_schedule` exists but is unused — the schedule is hardcoded in `src/lib/schedule.ts` because it's Rotem's personal yeshiva timetable.

---

## The family module (special-case)

`/domain/family` is the only domain with its own route. Three tabs (`type Tab = 'tasks' | 'habits' | 'adventures'` in `family-client.tsx`):

- **tasks** → `family_tasks` (category, urgency, status, assigned_to, optional rotation via `advance_task_rotation`).
- **habits** → `family_habits` (frequency window, `accountability_type` of `shared_streak | individual`, streak advanced via `advance_family_habit_streak`).
- **adventures** → `routine_breakers` (type, cost_tier, status, target_date, media_links jsonb).

Realtime: `src/lib/family/realtime.ts` subscribes to all three tables and triggers `router.refresh()` on remote changes.

> **Naming note:** earlier docs called the second tab "rituals." In code it is `habits`. Use `habits`.

---

## Bottom nav (PR #40)

`src/components/bottom-nav.tsx` is a **floating pill** using `@dnd-kit/sortable` for drag-to-reorder. Order persists to `localStorage` under `growth-nav-order`. Five nav items: Home, Domains, Schedule, Journal, Reading, plus a center add button. The `fab.tsx` file is a vestigial near-empty placeholder — do not use it; the add affordance now lives inside the nav.

Mobile content needs `pb-24` clearance for this pill; desktop uses `md:pb-6`.

---

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL       — Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  — "Publishable key" in newer Supabase dashboards (same value)
GOOGLE_AI_API_KEY              — server-only, used only by /api/torah/scan (Gemini 2.0 Flash)
```

Never commit `.env.local`. No `SUPABASE_SERVICE_ROLE_KEY` needed — all ops go through anon key + RLS. There is no `ANTHROPIC_API_KEY` in this project anymore — the Claude/Anthropic integration was replaced by Gemini.

---

## Git workflow

```bash
git add <specific files>           # never `git add -A` blindly
git commit -m "verb: short description"
git push                           # auto-deploys to Vercel
```

Commit message format: imperative, e.g. `"Add X"`, `"Fix Y"`, `"Update Z"`, `"Refactor Z"`. Recent history (`git log --oneline`) is the style guide.

When working on a feature branch, stay on it — don't push to `main` without permission.

---

## Known stale references in older docs

If you read `README.md` or `handoff.md`, ignore the following — they describe a previous version of the app and have been corrected:
- XP, levels, Mesillat Yesharim leveling, achievements, weekly XP chart, AI insights, confetti, `xp-bar.tsx`, `streak-badge.tsx`, `achievements-display.tsx`, `mesillat-quote.tsx`, `weekly-challenge.tsx`, `ai-insights.tsx` — all removed.
- Anthropic SDK / `ANTHROPIC_API_KEY` — replaced by Google Gemini.
- 8 domains — there are 7.
- A `/progress` route — does not exist.
- A `family-rituals` tab — the tab is `habits`.

The current README and handoff have been rewritten to match the live code.
