@AGENTS.md

# GROWTH App — Claude Code Instructions

## What this project is

A mobile-first, bilingual personal growth tracker for a yeshiva student (Rotem). Tracks habits and deep domain workspaces across 7 life domains: family, friends, torah, secular, sports, finance, music. Bilingual: Hebrew (RTL, default) + English.

**Stack:** Next.js 16.2.6, TypeScript 5 (strict), React 19.2.4, Supabase (auth + Postgres + RLS), Tailwind CSS v4, shadcn/ui, Lucide icons, TipTap editor, dnd-kit, Google Generative AI (Gemini 2.0 Flash Lite).
**Deployed:** Vercel ← GitHub (`Rg707070/growth-claude`, branch `main`).

---

## Commands

```bash
npm run dev        # dev server → http://localhost:3000 (or 3001 if busy)
npm run build      # production build — also catches TS errors
npx tsc --noEmit   # fast type-check only
npm run lint       # ESLint
git push           # triggers Vercel auto-deploys
```

Always run `npx tsc --noEmit` before committing. Zero-error policy.

---

## Architecture rules — read before writing any code

### Server vs. Client components
- `page.tsx` files are **server components** — use `createClient` from `@/lib/supabase/server`.
- `*-client.tsx` companions are `'use client'` — use `createClient` from `@/lib/supabase/client`.
- Never cross-import server/client Supabase clients.
- Data fetch in `page.tsx`, pass as props to client. No loading spinners needed.

### After any Supabase write
Always call `router.refresh()` to re-run the server component and get fresh data. There is no global state.

### Auth pattern in dashboard
The `(dashboard)/layout.tsx` checks auth and redirects to `/login`. Individual dashboard pages do NOT re-check auth.

---

## Color system — critical

Tailwind v4 cannot interpolate runtime oklch values. For any **dynamic or domain-specific color**, use inline `style={{}}`, never a Tailwind class:

```tsx
// ✅ correct
style={{ background: `${domain.color}22`, color: domain.color }}

// ❌ wrong — Tailwind can't resolve this at build time
className={`bg-[${domain.color}]`}
```

Ocean Dark theme token reference:
- Background: `oklch(0.08 0.035 240)`
- Cards: `oklch(0.12 0.04 238)`
- Primary / cyan: `oklch(0.75 0.17 205)`
- Borders: `oklch(0.75 0.12 210 / 14%)`
- Glow: primary at 20–40% opacity

Each domain in `src/lib/domains.ts` carries: `color` (hex, for inline styles), `gradient` (Tailwind class), `glowColor` (rgba, for box-shadow).

---

## RTL / Language rules

- Default language is Hebrew; `dir="rtl"` is set on `<html>`.
- Use `const { t, isRTL } = useLang()` everywhere.
- To flip layout direction: use `dir="rtl"` on the flex container. **Never** reverse arrays — reversing + flex-row-reverse double-reverses.
- No hardcoded Hebrew strings in components — use `t('key')`. Exception: `src/lib/schedule.ts` is intentionally all Hebrew.
- Light mode overrides are in `globals.css` as `html.light .text-white/x` etc. Theme is class-based (`html.dark` / `html.light`), not media-query.

---

## Code style

- Functional components only, React hooks for state.
- No `default export` on components — named exports only (except pages, which Next.js requires default).
- TypeScript strict mode — explicit types on all exported functions/props.
- No comments unless the WHY is non-obvious. Never write what the code does in comments.
- No `any` types.
- Use `@/` path aliases, not relative `../../` imports.
- shadcn/ui primitives live in `src/components/ui/` — use them before writing custom primitives.

---

## Domain data — single source of truth

`src/lib/domains.ts` → `DOMAINS` array. Never hardcode domain names, colors, or slugs anywhere else.

The 7 slugs: `family`, `friends`, `torah`, `secular`, `sports`, `finance`, `music`.

Domain routing:
- `family` → dedicated page at `/domain/family` (tasks, habits, family events, routine breakers)
- `torah` → full workspace at `/domain/torah` (sessions, notes, summaries, lesson feed, daily tracks)
- All other domains → `/domain/[slug]` with their own client component and DB-backed ecosystem

Domain-specific client components in `src/components/`:
- `family-page-client.tsx` — Family coordination hub
- `torah-workspace-client.tsx` — Full Torah learning workspace (5 tabs)
- `finance-client.tsx`, `friends-client.tsx`, `sports-client.tsx`, `music-client.tsx`, `secular-client.tsx` — Domain pages with habits + domain-specific features

---

## Database

Schema is in `supabase-schema.sql`. All tables have RLS — users see only their own rows.

**Core tables:** `profiles`, `habits`, `habit_logs`, `journal_entries`, `night_checkins`

**Journal / media:** `journal_documents` (TipTap rich text), `photo_entries`, `album_shares`

**Schedule:** `user_schedule` (editable weekly timetable), `activity_checks` (per-item daily check-offs), `schedule_reflections`

**Torah workspace:** `learning_sessions`, `learning_notes`, `learning_summaries`, `torah_daily_tracks`, `torah_lessons` (admin-seeded), `saved_lessons`

**Family domain:** `family_tasks`, `family_habits`, `family_events`, `routine_breakers`

**Domain ecosystem (generic):** `domain_tasks`, `domain_goals`

**Domain-specific:** `friend_contacts`, `friend_interactions`, `friend_reminders`, `finance_transactions`, `finance_wishlist`, `secular_books`, `secular_projects`, `reading_books`, `sport_workout_logs`, `sport_food_restrictions`, `sport_challenges`, `music_practice_logs`, `music_songs`

**Key RPCs:**
- `advance_family_habit_streak(habit_id, uid)` — increments/resets family habit streak based on frequency window
- `advance_task_rotation(task_id, uid, max_members)` — rotates recurring family task assignment

---

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL       — Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  — "Publishable key" in newer Supabase dashboards (same thing)
GOOGLE_AI_API_KEY              — server-only, for /api/torah/scan Gemini calls
```

Never commit `.env.local`. No `SUPABASE_SERVICE_ROLE_KEY` needed — all ops go through anon key + RLS.

---

## Git workflow

```bash
git add <specific files>   # never git add -A blindly
git commit -m "verb: short description"
git push                   # auto-deploys to Vercel
```

Commit message format: `"Add X"`, `"Fix Y"`, `"Update Z"` — imperative, lowercase after colon.

---

## Full documentation

- `README.md` — public project overview, architecture diagram, design system
- `handoff.md` — detailed AI agent handoff with all patterns, gotchas, complete feature list
