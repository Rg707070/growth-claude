'use client'

import { useLang } from '@/lib/lang'
import { formatMoney, formatPct } from '@/lib/trading-utils'
import type { AccountStats } from '@/types/trading'

interface Props {
  stats: AccountStats
  onEditCapital: () => void
}

export function AccountStatsBar({ stats, onEditCapital }: Props) {
  const { isRTL } = useLang()
  const dailyColor =
    stats.dailyPnl > 0 ? '#22c55e' : stats.dailyPnl < 0 ? '#ef4444' : '#94a3b8'
  const totalColor =
    stats.totalPnl > 0 ? '#22c55e' : stats.totalPnl < 0 ? '#ef4444' : '#94a3b8'

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <button
        onClick={onEditCapital}
        className="text-right px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] transition-colors"
      >
        <p className="text-white/40 text-[10px] uppercase tracking-wider">
          {isRTL ? 'הון' : 'Equity'}
        </p>
        <p className="font-mono text-white text-base font-semibold mt-0.5 tabular-nums">
          {formatMoney(stats.equity, 0)}
        </p>
      </button>

      <div className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/10">
        <p className="text-white/40 text-[10px] uppercase tracking-wider">
          {isRTL ? 'יומי' : 'Daily'}
        </p>
        <p
          className="font-mono text-base font-semibold mt-0.5 tabular-nums"
          style={{ color: dailyColor }}
        >
          {formatMoney(stats.dailyPnl, 0)}{' '}
          <span className="text-xs opacity-70">
            {formatPct(stats.dailyPnlPct, 1)}
          </span>
        </p>
      </div>

      <div className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/10">
        <p className="text-white/40 text-[10px] uppercase tracking-wider">
          {isRTL ? 'אחוז הצלחה' : 'Win Rate'}
        </p>
        <p className="font-mono text-white text-base font-semibold mt-0.5 tabular-nums">
          {stats.winRate.toFixed(0)}%{' '}
          <span className="text-xs text-white/40 font-normal">
            ({stats.closedTradesCount})
          </span>
        </p>
      </div>

      <div className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/10">
        <p className="text-white/40 text-[10px] uppercase tracking-wider">
          {isRTL ? 'מקדם רווח' : 'Profit Factor'}
        </p>
        <p
          className="font-mono text-base font-semibold mt-0.5 tabular-nums"
          style={{ color: totalColor }}
        >
          {Number.isFinite(stats.profitFactor)
            ? stats.profitFactor.toFixed(2)
            : '∞'}
        </p>
      </div>
    </div>
  )
}
