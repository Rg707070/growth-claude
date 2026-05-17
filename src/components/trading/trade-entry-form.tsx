'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'
import { IronFilter } from './iron-filter'
import { PositionEngine } from './position-engine'
import { calcPosition, filterScore } from '@/lib/trading-utils'
import type { FilterChecks, TradeDirection } from '@/types/trading'

interface Props {
  userId: string
  equity: number
  defaultRiskPct: number
  symbol: string
}

export function TradeEntryForm({ userId, equity, defaultRiskPct, symbol }: Props) {
  const router = useRouter()
  const { isRTL } = useLang()
  const [direction, setDirection] = useState<TradeDirection>('long')
  const [entry, setEntry] = useState(0)
  const [stop, setStop] = useState(0)
  const [target, setTarget] = useState(0)
  const [riskPct, setRiskPct] = useState(defaultRiskPct)
  const [checks, setChecks] = useState<FilterChecks>({})
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const [tickerInput, exchangeInput] = symbol.includes(':')
    ? symbol.split(':')
    : ['NASDAQ', symbol]
  const [exchange, setExchange] = useState(tickerInput || 'NASDAQ')
  const [ticker, setTicker] = useState(exchangeInput || symbol)

  const calc = calcPosition({
    direction,
    entry,
    stop,
    target: target || null,
    riskPct,
    equity,
  })

  const canSubmit =
    !!calc && calc.shares > 0 && ticker.trim().length > 0 && reason.trim().length > 0

  const submit = async () => {
    if (!canSubmit || !calc || saving) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('trades').insert({
      user_id: userId,
      ticker: ticker.trim().toUpperCase(),
      exchange,
      direction,
      status: 'open',
      entry_price: entry,
      stop_price: stop,
      target_price: target || null,
      shares: calc.shares,
      risk_amount: calc.riskAmount,
      rr_planned: calc.rrRatio,
      filter_score: filterScore(checks),
      filter_checks: checks,
      reason: reason.trim(),
    })

    if (!error) {
      setChecks({})
      setReason('')
      setTarget(0)
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      {/* Ticker bar */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <label className="block">
          <span className="text-white/50 text-xs font-medium block mb-1.5">
            {isRTL ? 'סימול' : 'Symbol'}
          </span>
          <div className="flex gap-2">
            <select
              value={exchange}
              onChange={(e) => setExchange(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-cyan-400/40"
            >
              <option value="NASDAQ">NASDAQ</option>
              <option value="NYSE">NYSE</option>
              <option value="AMEX">AMEX</option>
            </select>
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="AAPL"
              className="flex-1 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white font-mono font-semibold focus:outline-none focus:border-cyan-400/40"
            />
          </div>
        </label>
      </div>

      <PositionEngine
        direction={direction}
        entry={entry}
        stop={stop}
        target={target}
        riskPct={riskPct}
        equity={equity}
        onChange={(patch) => {
          if (patch.direction !== undefined) setDirection(patch.direction)
          if (patch.entry !== undefined) setEntry(patch.entry)
          if (patch.stop !== undefined) setStop(patch.stop)
          if (patch.target !== undefined) setTarget(patch.target)
          if (patch.riskPct !== undefined) setRiskPct(patch.riskPct)
        }}
      />

      <IronFilter checks={checks} onChange={setChecks} />

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
        <label className="block">
          <span className="text-white text-sm font-semibold">
            {isRTL ? 'סיבה לכניסה' : 'Entry Reason'}
          </span>
          <span className="text-white/40 text-xs block mt-0.5 mb-2">
            {isRTL
              ? 'מה הסטאפ? מה הטריגר? למה עכשיו?'
              : 'What is the setup? What is the trigger? Why now?'}
          </span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder={
              isRTL
                ? 'לדוגמה: פריצה מקונסולידציה של 3 שבועות מעל $185 עם ווליום פי 2 מהממוצע, RSI 62...'
                : 'e.g. Breakout from 3-week consolidation above $185 with 2x average volume, RSI 62...'
            }
            className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400/40 resize-none"
          />
        </label>
      </div>

      <button
        onClick={submit}
        disabled={!canSubmit || saving}
        className="w-full py-3 rounded-2xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: canSubmit ? '#06b6d4' : 'rgba(255,255,255,0.06)',
          color: canSubmit ? '#0f172a' : 'rgba(255,255,255,0.4)',
        }}
      >
        {saving
          ? isRTL
            ? 'שומר...'
            : 'Saving...'
          : isRTL
            ? `פתח עסקה ${direction === 'long' ? 'LONG' : 'SHORT'}`
            : `Open ${direction === 'long' ? 'LONG' : 'SHORT'} Position`}
      </button>
    </div>
  )
}
