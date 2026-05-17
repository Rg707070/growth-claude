-- GROWTH App — Trading Module Schema
-- Run this in Supabase SQL editor AFTER supabase-schema.sql

-- ============================================================
-- ACCOUNT STATE (one row per user — starting capital, risk %)
-- ============================================================
create table if not exists public.trading_account (
  user_id uuid references auth.users on delete cascade primary key,
  starting_capital numeric(14,2) default 0 not null,
  current_capital numeric(14,2) default 0 not null,
  default_risk_pct numeric(5,2) default 1 not null,
  daily_loss_limit_pct numeric(5,2) default 3 not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.trading_account enable row level security;
create policy "Users manage own trading account"
  on public.trading_account for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- TRADES (full trade log — entry, exit, P&L, filter, reason)
-- ============================================================
create table if not exists public.trades (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  ticker text not null,
  exchange text default 'NASDAQ' not null,
  direction text not null check (direction in ('long', 'short')),
  status text not null default 'open' check (status in ('open', 'closed', 'cancelled')),
  entry_price numeric(14,4) not null,
  stop_price numeric(14,4) not null,
  target_price numeric(14,4),
  exit_price numeric(14,4),
  shares integer not null,
  risk_amount numeric(14,2) not null,
  rr_planned numeric(6,2),
  pnl_amount numeric(14,2),
  pnl_pct numeric(6,2),
  filter_score integer default 0 not null check (filter_score between 0 and 6),
  filter_checks jsonb default '{}'::jsonb not null,
  reason text,
  notes text,
  opened_at timestamp with time zone default timezone('utc'::text, now()) not null,
  closed_at timestamp with time zone
);

create index if not exists trades_user_opened_idx on public.trades(user_id, opened_at desc);
create index if not exists trades_user_status_idx on public.trades(user_id, status);

alter table public.trades enable row level security;
create policy "Users manage own trades"
  on public.trades for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- WATCHLIST (tickers user is watching)
-- ============================================================
create table if not exists public.watchlist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  ticker text not null,
  exchange text default 'NASDAQ' not null,
  note text,
  sort_order integer default 0 not null,
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, ticker, exchange)
);

create index if not exists watchlist_user_sort_idx on public.watchlist(user_id, sort_order);

alter table public.watchlist enable row level security;
create policy "Users manage own watchlist"
  on public.watchlist for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
