'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'
import { formatMoney, formatPct, tradePnl } from '@/lib/trading-utils'
import type { Trade } from '@/types/trading'

interface Props {
  trades: Trade[]
  onPickSymbol: (sym: string) => void
}

export function JournalTab({ trades, onPickSymbol }: Props) {
  const { isRTL } = useLang()
  const [expanded, setExpanded] = useState<string | null>(null)

  if (trades.length === 0) {
    return (
      <div className="text-center py-16 text-white/30">
        <p className="text-sm">
          {isRTL ? 'אין עסקאות עדיין' : 'No trades yet'}
        </p>
        <p className="text-xs mt-1">
          {isRTL ? 'פתח עסקה ראשונה מטאב Dashboard' : 'Open your first trade from Dashboard tab'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {trades.map((trade) => (
        <TradeRow
          key={trade.id}
          trade={trade}
          expanded={expanded === trade.id}
          onToggle={() => setExpanded(expanded === trade.id ? null : trade.id)}
          onPickSymbol={onPickSymbol}
        />
      ))}
    </div>
  )
}

function TradeRow({
  trade,
  expanded,
  onToggle,
  onPickSymbol,
}: {
  trade: Trade
  expanded: boolean
  onToggle: () => void
  onPickSymbol: (sym: string) => void
}) {
  const router = useRouter()
  const { isRTL } = useLang()
  const [closing, setClosing] = useState(false)
  const [exitPrice, setExitPrice] = useState('')
  const [deleting, setDeleting] = useState(false)

  const pnl = tradePnl(trade)
  const pnlColor =
    pnl == null
      ? '#94a3b8'
      : pnl.amount > 0
        ? '#22c55e'
        : pnl.amount < 0
          ? '#ef4444'
          : '#94a3b8'

  const closeTrade = async () => {
    const exit = parseFloat(exitPrice)
    if (!exit || exit <= 0 || closing) return
    setClosing(true)
    const supabase = createClient()
    const diff =
      trade.direction === 'long' ? exit - trade.entry_price : trade.entry_price - exit
    const amount = diff * trade.shares
    const cost = trade.entry_price * trade.shares
    const pct = cost > 0 ? (amount / cost) * 100 : 0
    await supabase
      .from('trades')
      .update({
        status: 'closed',
        exit_price: exit,
        pnl_amount: amount,
        pnl_pct: pct,
        closed_at: new Date().toISOString(),
      })
      .eq('id', trade.id)
    router.refresh()
  }

  const deleteTrade = async () => {
    if (deleting) return
    if (!confirm(isRTL ? 'למחוק עסקה?' : 'Delete trade?')) return
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('trades').delete().eq('id', trade.id)
    router.refresh()
  }

  return (
    <div
      className="rounded-2xl border bg-white/[0.02] overflow-hidden"
      style={{
        borderColor:
          trade.status === 'open'
            ? 'rgba(6, 182, 212, 0.25)'
            : 'rgba(255,255,255,0.08)',
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 hover:bg-white/[0.03] transition-colors text-right"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background:
              trade.direction === 'long' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
            color: trade.direction === 'long' ? '#22c55e' : '#ef4444',
          }}
        >
          {trade.direction === 'long' ? (
            <TrendingUp size={18} />
          ) : (
            <TrendingDown size={18} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-white font-semibold text-sm">
              {trade.ticker}
            </span>
            <span className="text-white/30 text-[10px] font-mono">{trade.exchange}</span>
            {trade.status === 'open' && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-cyan-500/20 text-cyan-300">
                {isRTL ? 'פתוח' : 'OPEN'}
              </span>
            )}
            <span className="text-white/30 text-[10px]">
              {trade.filter_score}/6
            </span>
          </div>
          <p className="text-white/40 text-[10px] mt-0.5">
            {trade.shares} × ${trade.entry_price.toFixed(2)}
            {trade.exit_price && ` → $${trade.exit_price.toFixed(2)}`}
          </p>
        </div>

        <div className="text-right flex-shrink-0">
          {pnl ? (
            <>
              <p className="font-mono text-sm font-semibold" style={{ color: pnlColor }}>
                {formatMoney(pnl.amount, 0)}
              </p>
              <p className="font-mono text-[10px]" style={{ color: pnlColor }}>
                {formatPct(pnl.pct, 1)}
              </p>
            </>
          ) : (
            <p className="text-white/30 text-xs font-mono">
              {isRTL ? 'פתוח' : 'open'}
            </p>
          )}
        </div>

        {expanded ? (
          <ChevronUp size={14} className="text-white/30 flex-shrink-0" />
        ) : (
          <ChevronDown size={14} className="text-white/30 flex-shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-white/5 space-y-3">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <Cell label={isRTL ? 'כניסה' : 'Entry'} value={`$${trade.entry_price.toFixed(2)}`} />
            <Cell
              label={isRTL ? 'סטופ' : 'Stop'}
              value={`$${trade.stop_price.toFixed(2)}`}
              color="#ef4444"
            />
            <Cell
              label={isRTL ? 'יעד' : 'Target'}
              value={trade.target_price ? `$${trade.target_price.toFixed(2)}` : '—'}
              color="#22c55e"
            />
            <Cell
              label="R:R"
              value={trade.rr_planned ? `1:${trade.rr_planned.toFixed(2)}` : '—'}
            />
            <Cell
              label={isRTL ? 'סיכון' : 'Risk'}
              value={formatMoney(trade.risk_amount, 0)}
            />
            <Cell label={isRTL ? 'מניות' : 'Shares'} value={trade.shares.toLocaleString()} />
          </div>

          {trade.reason && (
            <div className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5">
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">
                {isRTL ? 'סיבה לכניסה' : 'Entry Reason'}
              </p>
              <p className="text-white/80 text-xs leading-relaxed">{trade.reason}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => onPickSymbol(`${trade.exchange}:${trade.ticker}`)}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white/70 hover:bg-white/10 transition-colors"
            >
              {isRTL ? 'הצג בגרף' : 'View Chart'}
            </button>
            <button
              onClick={deleteTrade}
              disabled={deleting}
              className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {trade.status === 'open' && (
            <div className="flex gap-2 pt-2 border-t border-white/5">
              <input
                type="number"
                step="0.01"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                placeholder={isRTL ? 'מחיר יציאה' : 'Exit price'}
                className="flex-1 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-cyan-400/40"
              />
              <button
                onClick={closeTrade}
                disabled={!exitPrice || closing}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isRTL ? 'סגור' : 'Close'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Cell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="px-2 py-1.5 rounded-lg bg-white/[0.03]">
      <p className="text-white/40 text-[9px] uppercase tracking-wider">{label}</p>
      <p
        className="font-mono text-xs font-semibold mt-0.5"
        style={{ color: color ?? '#ffffff' }}
      >
        {value}
      </p>
    </div>
  )
}
