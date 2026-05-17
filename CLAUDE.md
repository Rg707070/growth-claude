@AGENTS.md

# GROWTH App — Claude Code Instructions

## What this project is

A mobile-first, gamified habit tracker for a yeshiva student (Rotem). Tracks 8 life domains (family, friends, torah, secular, sports, trading, finance, music) with XP + levels drawn from *Mesillat Yesharim*. Bilingual: Hebrew (RTL, default) + English.

**Stack:** Next.js 16, TypeScript 5 (strict), Supabase (auth + Postgres + RLS), Tailwind CSS v4, shadcn/ui, Lucide icons, Anthropic SDK.
**Deployed:** Vercel ← GitHub (`Rg707070/growth-claude`, branch `main`).

---

## Commands

```bash
npm run dev        # dev server → http://localhost:3000 (or 3001 if busy)
npm run build      # production build — also catches TS errors
npx tsc --noEmit   # fast type-check only
npm run lint       # ESLint
git push           # triggers Vercel auto-deploy
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

### XP updates — always use the RPC
```ts
await supabase.rpc('update_profile_xp', { uid: user.id, xp_delta: 10 })
```
Never write to `profiles.xp` directly — race conditions.

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

The 8 slugs: `family`, `friends`, `torah`, `secular`, `sports`, `trading`, `finance`, `music`.

Domain-specific extras in `domain-detail-client.tsx`:
- `torah` → `MesillatQuote` + `SefariaWidget`
- `trading` → `PortfolioTracker` + `TradingViewWidget`

---

## Database

Schema is in `supabase-schema.sql`. Tables: `profiles`, `habits`, `habit_logs`, `journal_entries`, `night_checkins`, `user_schedule`. All have RLS — users see only their own rows.

`user_schedule` table exists but is currently unused — schedule is hardcoded in `src/lib/schedule.ts`.

---

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL       — Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  — "Publishable key" in newer Supabase dashboards (same thing)
ANTHROPIC_API_KEY              — server-only, for /api/insights Claude Haiku call
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
