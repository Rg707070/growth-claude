# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Warning (AGENTS.md):** This is Next.js 16 with breaking changes from earlier versions. APIs, conventions, and file structure may differ from training data. Check `node_modules/next/dist/docs/` before writing Next.js code.

---

## What this project is

GROWTH is a mobile-first, gamified habit tracker for a yeshiva student (Rotem). It tracks 7 life domains (family, friends, torah, secular, sports, finance, music) with XP + levels drawn from *Mesillat Yesharim*. Bilingual: Hebrew (RTL, default) + English.

**Stack:** Next.js 16.2.6 (App Router), React 19, TypeScript 5 (strict), Supabase (`@supabase/ssr`), Tailwind CSS v4, shadcn/ui, Lucide icons v1.16, Google Generative AI (Gemini).  
**Deployed:** Vercel ← GitHub (`Rg707070/growth-claude`, branch `main`).

---

## Commands

```bash
npm run dev        # dev server → http://localhost:3000
npm run build      # production build (also catches TS errors)
npx tsc --noEmit   # fast type-check — run before every commit
npm run lint       # ESLint
git push           # triggers Vercel auto-deploy
```

Zero TypeScript error policy — `npx tsc --noEmit` must pass before committing.

---

## Architecture

### Route groups and page structure

```
src/app/
  (auth)/login|signup/        — public auth pages
  (dashboard)/layout.tsx      — auth check + shell (Sidebar, BottomNav, FAB, NightCheckIn)
  (dashboard)/dashboard/      — main dashboard
  (dashboard)/domain/[slug]/  — dynamic domain pages (each slug gets its own client)
  (dashboard)/domain/family/  — dedicated family page (tasks, rituals, adventures)
  (dashboard)/journal/        — journal with album, insights, writing tabs
  (dashboard)/schedule/       — weekly timetable
  (dashboard)/settings/       — theme + lang + logout
  share/album/[token]/        — public album slideshow (unauthenticated)
  api/torah/scan/             — Gemini vision: identify Jewish text from photo
```

### Server vs. client component pattern

Every data-fetching page follows this split — no exceptions:

```
page.tsx          ← async server component, uses createClient from @/lib/supabase/server
  └── *-client.tsx  ← 'use client', receives data as props, handles all interactivity
```

Never cross-import Supabase clients. Never call `createClient()` from `@/lib/supabase/server` inside a client component or vice versa.

There are no `loading.tsx` files — data is always fetched server-side and passed as props.

### Auth flow

- `middleware.ts` refreshes the Supabase session on every request and redirects unauthenticated users to `/login`.
- `(dashboard)/layout.tsx` re-checks auth and redirects to `/login` if the session is gone. Individual dashboard pages do **not** re-check auth.

### Domain pages architecture

`/domain/[slug]/page.tsx` uses a series of `if (slug === '...')` branches. Each domain fetches its own set of DB tables and renders a specialized client:

| Slug | Client | Domain-specific tables |
|---|---|---|
| `torah` | `TorahWorkspaceClient` | `learning_sessions`, `learning_summaries`, `torah_daily_tracks` |
| `finance` | `FinanceClient` | `finance_transactions`, `finance_wishlist` |
| `friends` | `FriendsClient` | `friend_contacts`, `friend_interactions` |
| `sports` | `SportsClient` | `sport_workout_logs`, `sport_food_restrictions`, `sport_challenges` |
| `secular` | `SecularClient` | `secular_books`, `secular_projects` |
| `music` | `MusicClient` | `music_practice_logs`, `music_songs` |
| others | `DomainEcosystemClient` | `domain_tasks`, `domain_goals` |

`family` has its own dedicated route at `/domain/family/` with `family-client.tsx`.

### Data mutation pattern

After any Supabase write, always call `router.refresh()` to re-run the server component and get fresh data. There is no global state management.

### XP updates — always use the RPC

```ts
await supabase.rpc('update_profile_xp', { uid: user.id, xp_delta: 10 })
```

Never write to `profiles.xp` directly — this RPC is atomic and prevents race conditions.

---

## Tailwind CSS v4 — critical differences

No `tailwind.config.js`. All design tokens are defined in `src/app/globals.css` under `@theme inline`. The CSS custom properties in `:root` (light) and `.dark, html.dark` (dark) hold all values.

**Runtime colors cannot be interpolated into Tailwind class names:**

```tsx
// ✅ correct — inline style for domain/dynamic colors
style={{ background: `${domain.color}22`, color: domain.color }}

// ❌ wrong — Tailwind can't resolve runtime values at build time
className={`bg-[${domain.color}]`}
```

Static design token classes (`bg-primary`, `text-foreground`, etc.) work normally because they map to CSS variables defined in `globals.css`.

---

## Color system

**Default theme is light** (`:root` in `globals.css`; `html` starts with `className="light"`). Dark mode applies `.dark` and `html.dark`.

Each domain in `src/lib/domains.ts` carries three color fields used differently:

```ts
domain.color      // hex string — for inline style={{ color, background }}
domain.gradient   // Tailwind class string — for className bg gradient
domain.glowColor  // rgba string — for inline style box-shadow
```

`src/lib/domains.ts` is the single source of truth for all domain data. Never hardcode domain names, slugs, or colors elsewhere.

---

## RTL / Language

- `<html>` has `lang="he" dir="rtl"` by default.
- Use `const { t, isRTL } = useLang()` in every component that needs translated text or layout direction.
- To flip a flex container for RTL: set `dir="rtl"` on the container element. **Never** reverse arrays — `array.reverse()` + `flex-row-reverse` double-reverses.
- All translations live in `src/lib/lang.tsx`. No hardcoded Hebrew strings in components (exception: `src/lib/schedule.ts` is intentionally all-Hebrew).
- Theme is class-based (`html.dark` / `html.light`), not `prefers-color-scheme`. Never use `dark:` Tailwind prefix classes.

---

## Code style

- Named exports for all components except Next.js pages (which require `default export`).
- No `any` types. TypeScript strict mode throughout.
- `@/` path aliases — no relative `../../` imports.
- shadcn/ui primitives in `src/components/ui/` — use before writing custom primitives.
- State that persists in localStorage (not Supabase): `growth-theme`, `growth-lang`, `growth-checkin-{date}`.

---

## Database tables

Core: `profiles`, `habits`, `habit_logs`, `journal_entries`, `night_checkins`, `user_schedule`.  
All tables have RLS — users only see their own rows.

`user_schedule` exists but is unused — the schedule page uses the hardcoded `WEEKLY_SCHEDULE` from `src/lib/schedule.ts`.

For domain-specific tables, see the Domain pages architecture table above. Each domain's SQL schema is in the `supabase-*.sql` files at the repo root.

---

## AI / API routes

All AI calls use Google Generative AI (Gemini), not Anthropic. Server-only; uses `GOOGLE_AI_API_KEY`.

- `/api/torah/scan` — Gemini vision identifies Jewish text from a photo, returns a Sefaria reference.

---

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL       — Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  — "Publishable key" in newer Supabase dashboards (same value as anon key)
GOOGLE_AI_API_KEY              — server-only, for Gemini API calls
```

No `SUPABASE_SERVICE_ROLE_KEY` needed — all ops go through the anon key with RLS.

---

## Key files quick reference

| File | Purpose |
|---|---|
| `src/lib/domains.ts` | Single source of truth: all 7 domains with slug, names, color, gradient, glowColor |
| `src/lib/lang.tsx` | All translations + `useLang()` hook (returns `t`, `lang`, `isRTL`, `toggleLang`) |
| `src/lib/theme.tsx` | Dark/light theme + `useTheme()` hook; toggles class on `<html>` |
| `src/lib/schedule.ts` | Hardcoded weekly yeshiva timetable (Hebrew, intentional) |
| `src/types/index.ts` | Core TypeScript interfaces (`Profile`, `Habit`, `HabitLog`, `Domain`, etc.) |
| `src/types/ecosystem.ts` | `DomainTask`, `DomainGoal` types |
| `src/types/{finance,friends,sports,secular,music}.ts` | Domain-specific types |
| `src/app/globals.css` | All CSS: oklch theme tokens, dark mode overrides, keyframe animations |
| `supabase-schema.sql` | Core DB schema |
| `handoff.md` | Full historical context, feature list, gotchas |
