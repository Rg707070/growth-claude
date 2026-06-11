@AGENTS.md

# GROWTH App — Claude Code Instructions

## What this project is

A mobile-first, bilingual personal growth tracker for a yeshiva student (Rotem). Tracks habits and deep domain workspaces across 7 life domains: family, friends, torah, secular, sports, finance, music. Bilingual: Hebrew (RTL, default) + English.

**Stack:** Next.js 16.2.6, TypeScript 5 (strict), React 19.2.4, Supabase (auth + Postgres + RLS), Tailwind CSS v4, shadcn/ui, Lucide icons, TipTap editor, dnd-kit, Google Generative AI (Gemini 2.0 Flash Lite).
**Deployed:** Vercel ← GitHub (`Rg707070/growth-claude`, branch `main`).
**Dev server:** `http://localhost:3000` (port 3001 if busy).

---

## Commands

```bash
npm run dev        # dev server → http://localhost:3000
npm run build      # production build — catches TS errors
npx tsc --noEmit   # fast type-check only (run before every commit)
npm run lint       # ESLint
git push           # triggers Vercel auto-deploys
```

**Zero-error policy:** Always run `npx tsc --noEmit` before committing.

---

## Custom Slash Commands

| Command | What it does |
|---|---|
| `/tc` | Type-check the project, report errors without fixing |
| `/deploy "message"` | TC → commit staged → push to Vercel |
| `/new-component Name` | Scaffold a client component with correct patterns |
| `/new-page path` | Scaffold a server page + client companion |
| `/add-translation key` | Add a new i18n key to `src/lib/lang.tsx` in both languages |
| `/db query` | Run a SQL query against the live Supabase DB |

---

## Architecture rules — read before writing any code

### Server vs. Client components

```
src/app/(dashboard)/[page]/
  page.tsx           ← async SERVER component — fetches data, passes as props
  [page]-client.tsx  ← 'use client' — handles all interactivity
  actions.ts         ← server actions (mutations via 'use server')
  loading.tsx        ← skeleton shown while page.tsx streams
```

- `page.tsx` → import `createClient` from `@/lib/supabase/server`
- `*-client.tsx` → import `createClient` from `@/lib/supabase/client`
- **Never** cross-import server/client Supabase clients.

### Server Actions pattern

Mutations live in `actions.ts` files co-located with pages:

```ts
// src/app/(dashboard)/domain/[slug]/ecosystem-actions.ts
'use server'
import { createClient } from '@/lib/supabase/server'

export async function addTask(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  // ... mutation
}
```

Client calls it: `import { addTask } from './ecosystem-actions'`

### After any Supabase write

Always call `router.refresh()` — re-runs the server component to get fresh data. There is no global state.

### Auth pattern in dashboard

`(dashboard)/layout.tsx` checks auth and redirects to `/login`. Individual dashboard pages do NOT re-check auth — they trust the layout.

---

## Color system — critical

Tailwind v4 cannot interpolate runtime oklch values. For any **dynamic or domain-specific color**, use `style={{}}`, never a Tailwind class:

```tsx
// ✅ correct
style={{ background: `${domain.color}22`, color: domain.color }}
style={{ boxShadow: `0 0 24px ${domain.glowColor}` }}

// ❌ wrong — Tailwind can't resolve this at build time
className={`bg-[${domain.color}]`}
```

**Ocean Dark theme tokens** (from `globals.css`):
- Background: `oklch(0.08 0.035 240)` — deep navy
- Cards: `oklch(0.12 0.04 238)` — dark blue-gray
- Primary / cyan: `oklch(0.75 0.17 205)` — interactive elements
- Borders: `oklch(0.75 0.12 210 / 14%)`
- Muted text: `oklch(0.55 0.05 230)`

**Domain colors** live in `src/lib/domains.ts`:
```ts
{
  color: '#4F46E5',                              // hex → inline style
  gradient: 'from-indigo-400/25 to-indigo-600/5', // Tailwind → className
  glowColor: 'rgba(79,70,229,0.22)',              // rgba → box-shadow
}
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

---

## RTL / Language rules

- Default language is Hebrew; `dir="rtl"` is set on `<html>` globally.
- Use `const { t, isRTL } = useLang()` in every component with text.
- Flip layout: add `dir={isRTL ? 'rtl' : 'ltr'}` to flex containers. **Never** reverse arrays — reversing + flex-row-reverse double-reverses.
- All user-facing strings must use `t('key')` — no hardcoded Hebrew or English in components.
- Exception: `src/lib/schedule.ts` is intentionally all Hebrew (personal timetable).

### Adding a new translation key

1. Open `src/lib/lang.tsx`.
2. Add the key to the `translations` object under both `he` and `en`.
3. Use it as `t('your_new_key')` in the component.

Or run: `/add-translation your_new_key`

---

## Code style

- Functional components only; React hooks for state.
- Named exports only on components — no `default export` (except `page.tsx`, which Next.js requires).
- TypeScript strict mode — explicit types on all exported functions and props. No `any`.
- Use `@/` path aliases, not relative imports.
- shadcn/ui primitives in `src/components/ui/` — use them before writing custom primitives.
- No comments unless the WHY is non-obvious. Never describe what the code does.

---

## Domain data — single source of truth

`src/lib/domains.ts` → `DOMAINS` array. **Never** hardcode domain names, colors, slugs, or icons elsewhere.

The 7 slugs: `family` · `friends` · `torah` · `secular` · `sports` · `finance` · `music`

| Slug | Hebrew | Color | Route |
|---|---|---|---|
| `family` | משפחה | Indigo #4F46E5 | `/domain/family` (dedicated) |
| `friends` | חברים | Sky #0EA5E9 | `/domain/[slug]` |
| `torah` | לימודי קודש | Teal #0F766E | `/domain/torah` (dedicated) |
| `secular` | לימודי חול | Emerald #059669 | `/domain/[slug]` |
| `sports` | ספורט | Lime #65A30D | `/domain/[slug]` |
| `finance` | כספים | Cyan #0891B2 | `/domain/[slug]` |
| `music` | מוזיקה | Violet #7C3AED | `/domain/[slug]` |

**Dedicated routes** (NOT caught by `[slug]`):
- `family` → `src/app/(dashboard)/family/` → `family-client.tsx`
- `torah` → `src/app/(dashboard)/domain/torah/` → `src/components/torah/torah-workspace-client.tsx`

---

## Key files map

| File | Purpose |
|---|---|
| `src/app/layout.tsx` | Root: ThemeProvider + LangProvider, PWA meta, fonts |
| `src/app/(dashboard)/layout.tsx` | Shell: auth check, Sidebar, BottomNav, FAB, NightCheckIn |
| `src/app/globals.css` | All CSS: oklch tokens, light mode overrides, keyframe animations |
| `src/lib/domains.ts` | DOMAINS array — single source of truth |
| `src/lib/lang.tsx` | All translations (200+ keys) + `useLang()` hook |
| `src/lib/theme.tsx` | Dark/light theme + `useTheme()` hook |
| `src/lib/schedule.ts` | Hardcoded yeshiva timetable + helper functions |
| `src/lib/domain-ecosystem-config.ts` | Category/type configs for domain tasks and goals |
| `src/lib/family/streak-engine.ts` | Family habit streak logic |
| `src/lib/family/hebrew-calendar.ts` | Hebrew date utilities |
| `src/lib/supabase/client.ts` | Browser Supabase client |
| `src/lib/supabase/server.ts` | SSR Supabase client (cookie-based) |
| `src/types/index.ts` | Core interfaces: Habit, Domain, DomainProgress, Profile |
| `supabase-schema.sql` | Full DB schema — run in Supabase SQL Editor |

---

## Database

Schema is in `supabase-schema.sql`. All tables have RLS — users see only their own rows.

**Core:** `profiles`, `habits`, `habit_logs`, `journal_entries`, `night_checkins`

**Journal/media:** `journal_documents` (TipTap), `photo_entries`, `album_shares`

**Schedule:** `user_schedule`, `activity_checks`, `schedule_reflections`

**Torah workspace:** `learning_sessions`, `learning_notes`, `learning_summaries`, `torah_daily_tracks`, `torah_lessons` (admin-seeded), `saved_lessons`

**Family domain:** `family_tasks`, `family_habits`, `family_events`, `routine_breakers`

**Domain ecosystem (generic):** `domain_tasks`, `domain_goals`

**Domain-specific:** `friend_contacts`, `friend_interactions`, `friend_reminders`, `finance_transactions`, `finance_wishlist`, `secular_books`, `secular_projects`, `reading_books`, `sport_workout_logs`, `sport_food_restrictions`, `sport_challenges`, `music_practice_logs`, `music_songs`

**Key RPCs:**
- `advance_family_habit_streak(habit_id, uid)` — increments/resets streak per frequency window
- `advance_task_rotation(task_id, uid, max_members)` — rotates recurring family task assignment

To query the live DB: use the Supabase MCP tools (prefixed `mcp__b01db5d4__*`) or run `/db your SQL`.

---

## MCP tools available in this session

| Server | Prefix | Use for |
|---|---|---|
| Supabase | `mcp__b01db5d4__*` | Query DB, apply migrations, get logs, generate TS types |
| Vercel | `mcp__6060940f__*` | Check deployments, get build logs, runtime errors |
| GitHub | `mcp__github__*` | PRs, issues, commits, file contents |

These are more reliable than `curl` for Supabase/Vercel operations.

---

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL       — Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  — "Publishable key" in newer Supabase dashboards
GOOGLE_AI_API_KEY              — server-only, for /api/torah/scan Gemini calls
```

Never commit `.env.local`. No `SUPABASE_SERVICE_ROLE_KEY` needed — all ops go through anon key + RLS.

---

## Critical gotchas

1. **`loading.tsx` files DO exist** — they show skeleton UIs. They live alongside `page.tsx` in dashboard, domain/[slug], family, journal, etc.

2. **No XP system** — `src/lib/mesillat.ts` and `update_profile_xp` are from an old version. Don't reference them. `profiles` table has no `xp` column.

3. **No `/progress` or `/achievements` page** — old version only.

4. **AI is Gemini, not Claude** — `GOOGLE_AI_API_KEY` only. No `ANTHROPIC_API_KEY`. Only AI feature: Torah text scan at `/api/torah/scan`.

5. **`user_schedule` IS used** — seeded from hardcoded data on first visit; user edits saved to DB.

6. **Tailwind v4 breaking changes** — no `tailwind.config.js`. Configuration is in `globals.css` via `@theme inline`. Read `AGENTS.md` before writing any Tailwind.

7. **RTL tab ordering** — use `dir="rtl"` on the flex container, never `Array.reverse()` + `flex-row-reverse` (double-reverses).

8. **`router.refresh()` after mutations** — mandatory after every Supabase write. No global state.

9. **Torah workspace components** live in `src/components/torah/`, not `src/components/hebrew/`.

10. **Theme is class-based** — `html.dark` / `html.light`. Never use `dark:` Tailwind prefix or media queries.

---

## Git workflow

```bash
git add <specific files>          # never git add -A
git commit -m "verb: description" # e.g. "Add finance export", "Fix streak reset"
git push                          # auto-deploys to Vercel
```

Or use `/deploy "your message"` to type-check + commit + push in one step.

---

## Full documentation

- `README.md` — public project overview and design system reference
- `handoff.md` — complete AI agent handoff: all patterns, gotchas, full feature list, component directory
