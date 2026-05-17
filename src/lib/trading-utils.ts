import type {
  Trade,
  TradingAccount,
  AccountStats,
  TradeDirection,
  FilterChecks,
  FilterCheckKey,
} from '@/types/trading'

export const FILTER_KEYS: FilterCheckKey[] = [
  'volume',
  'trend',
  'resistance_break',
  'ma_150',
  'confirmation_candle',
  'consolidation',
]

export function filterScore(checks: FilterChecks): number {
  return FILTER_KEYS.reduce((sum, k) => sum + (checks[k] ? 1 : 0), 0)
}

export interface PositionCalc {
  shares: number
  riskAmount: number
  riskPerShare: number
  rewardPerShare: number | null
  rrRatio: number | null
  positionValue: number
  positionPct: number
  breakEven: number
}

export function calcPosition({
  direction,
  entry,
  stop,
  target,
  riskPct,
  equity,
}: {
  direction: TradeDirection
  entry: number
  stop: number
  target: number | null
  riskPct: number
  equity: number
}): PositionCalc | null {
  if (!entry || !stop || entry <= 0 || stop <= 0 || equity <= 0 || riskPct <= 0) {
    return null
  }
  const riskPerShare =
    direction === 'long' ? entry - stop : stop - entry
  if (riskPerShare <= 0) return null

  const riskAmount = equity * (riskPct / 100)
  const shares = Math.floor(riskAmount / riskPerShare)
  if (shares <= 0) return null

  let rewardPerShare: number | null = null
  let rrRatio: number | null = null
  if (target && target > 0) {
    rewardPerShare =
      direction === 'long' ? target - entry : entry - target
    rrRatio = rewardPerShare > 0 ? rewardPerShare / riskPerShare : null
  }

  const positionValue = shares * entry
  const positionPct = (positionValue / equity) * 100

  return {
    shares,
    riskAmount: shares * riskPerShare,
    riskPerShare,
    rewardPerShare,
    rrRatio,
    positionValue,
    positionPct,
    breakEven: entry,
  }
}

export function tradePnl(trade: Trade): { amount: number; pct: number } | null {
  if (trade.status !== 'closed' || trade.exit_price == null) return null
  const diff =
    trade.direction === 'long'
      ? trade.exit_price - trade.entry_price
      : trade.entry_price - trade.exit_price
  const amount = diff * trade.shares
  const cost = trade.entry_price * trade.shares
  const pct = cost > 0 ? (amount / cost) * 100 : 0
  return { amount, pct }
}

function isSameLocalDay(iso: string, ref: Date): boolean {
  const d = new Date(iso)
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  )
}

export function computeAccountStats(
  account: TradingAccount | null,
  trades: Trade[]
): AccountStats {
  const startingCapital = account?.starting_capital ?? 0
  const closed = trades.filter((t) => t.status === 'closed')
  const open = trades.filter((t) => t.status === 'open')

  const pnls = closed.map((t) => Number(t.pnl_amount ?? 0))
  const totalPnl = pnls.reduce((a, b) => a + b, 0)
  const equity = startingCapital + totalPnl
  const totalPnlPct = startingCapital > 0 ? (totalPnl / startingCapital) * 100 : 0

  const today = new Date()
  const dailyPnl = closed
    .filter((t) => t.closed_at && isSameLocalDay(t.closed_at, today))
    .reduce((a, t) => a + Number(t.pnl_amount ?? 0), 0)
  const dailyPnlPct = equity > 0 ? (dailyPnl / equity) * 100 : 0

  const wins = pnls.filter((p) => p > 0)
  const losses = pnls.filter((p) => p < 0)
  const winRate = pnls.length > 0 ? (wins.length / pnls.length) * 100 : 0

  const grossProfit = wins.reduce((a, b) => a + b, 0)
  const grossLoss = Math.abs(losses.reduce((a, b) => a + b, 0))
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0

  return {
    equity,
    startingCapital,
    totalPnl,
    totalPnlPct,
    dailyPnl,
    dailyPnlPct,
    winRate,
    profitFactor,
    closedTradesCount: closed.length,
    openTradesCount: open.length,
    bestTrade: pnls.length > 0 ? Math.max(...pnls) : 0,
    worstTrade: pnls.length > 0 ? Math.min(...pnls) : 0,
  }
}

export function formatMoney(n: number, decimals = 0): string {
  const sign = n < 0 ? '-' : ''
  const abs = Math.abs(n)
  return `${sign}$${abs.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

export function formatPct(n: number, decimals = 2): string {
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(decimals)}%`
}
