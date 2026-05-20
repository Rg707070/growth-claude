export type TradeDirection = 'long' | 'short'
export type TradeStatus = 'open' | 'closed' | 'cancelled'

export interface TradingAccount {
  user_id: string
  starting_capital: number
  current_capital: number
  default_risk_pct: number
  daily_loss_limit_pct: number
  updated_at: string
}

export type FilterCheckKey =
  | 'volume'
  | 'trend'
  | 'resistance_break'
  | 'ma_150'
  | 'confirmation_candle'
  | 'consolidation'

export type FilterChecks = Partial<Record<FilterCheckKey, boolean>>

export interface Trade {
  id: string
  user_id: string
  ticker: string
  exchange: string
  direction: TradeDirection
  status: TradeStatus
  entry_price: number
  stop_price: number
  target_price: number | null
  exit_price: number | null
  shares: number
  risk_amount: number
  rr_planned: number | null
  pnl_amount: number | null
  pnl_pct: number | null
  filter_score: number
  filter_checks: FilterChecks
  reason: string | null
  notes: string | null
  opened_at: string
  closed_at: string | null
}

export interface WatchlistItem {
  id: string
  user_id: string
  ticker: string
  exchange: string
  note: string | null
  list_name: string
  sort_order: number
  added_at: string
}

export interface AccountStats {
  equity: number
  startingCapital: number
  totalPnl: number
  totalPnlPct: number
  dailyPnl: number
  dailyPnlPct: number
  winRate: number
  profitFactor: number
  closedTradesCount: number
  openTradesCount: number
  bestTrade: number
  worstTrade: number
}
