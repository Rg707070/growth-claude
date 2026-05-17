'use client'

import { useMemo } from 'react'
import { useLang } from '@/lib/lang'
import { calcPosition, formatMoney } from '@/lib/trading-utils'
import type { TradeDirection } from '@/types/trading'

interface Props {
  direction: TradeDirection
  entry: number
  stop: number
  target: number
  riskPct: number
  equity: number
  onChange: (patch: {
    direction?: TradeDirection
    entry?: number
    stop?: number
    target?: number
    riskPct?: number
  }) => void
}

export function PositionEngine({
  direction,
  entry,
  stop,
  target,
  riskPct,
  equity,
  onChange,
}: Props) {
  const { isRTL } = useLang()

  const result = useMemo(
    () =>
      calcPosition({
        direction,
        entry,
        stop,
        target: target || null,
        riskPct,
        equity,
      }),
    [direction, entry, stop, target, riskPct, equity]
  )

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-4">
      <div>
        <h3 className="text-white font-semibold text-sm">
          {isRTL ? 'מחשבון פוזיציה' : 'Position Engine'}
        </h3>
        <p className="text-white/40 text-xs mt-0.5">
          {isRTL ? 'גודל מדויק על בסיס סיכון' : 'Exact sizing based on risk'}
        </p>
      </div>

      {/* Direction toggle */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onChange({ direction: 'long' })}
          className="py-2 rounded-xl text-sm font-semibold transition-colors"
          style={{
            background: direction === 'long' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.04)',
            color: direction === 'long' ? '#22c55e' : 'rgba(255,255,255,0.5)',
            border:
              direction === 'long'
                ? '1px solid rgba(34, 197, 94, 0.4)'
                : '1px solid rgba(255,255,255,0.08)',
          }}
        >
          LONG ↑
        </button>
        <button
          onClick={() => onChange({ direction: 'short' })}
          className="py-2 rounded-xl text-sm font-semibold transition-colors"
          style={{
            background: direction === 'short' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.04)',
            color: direction === 'short' ? '#ef4444' : 'rgba(255,255,255,0.5)',
            border:
              direction === 'short'
                ? '1px solid rgba(239, 68, 68, 0.4)'
                : '1px solid rgba(255,255,255,0.08)',
          }}
        >
          SHORT ↓
        </button>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label={isRTL ? 'כניסה' : 'Entry'}
          value={entry}
          onChange={(v) => onChange({ entry: v })}
          step={0.01}
        />
        <NumberField
          label={isRTL ? 'סטופ' : 'Stop'}
          value={stop}
          onChange={(v) => onChange({ stop: v })}
          step={0.01}
          accent="#ef4444"
        />
        <NumberField
          label={isRTL ? 'יעד' : 'Target'}
          value={target}
          onChange={(v) => onChange({ target: v })}
          step={0.01}
          accent="#22c55e"
        />
        <NumberField
          label={isRTL ? 'סיכון %' : 'Risk %'}
          value={riskPct}
          onChange={(v) => onChange({ riskPct: v })}
          step={0.1}
          accent="#06b6d4"
          suffix="%"
        />
      </div>

      {/* Results */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
        <Stat label={isRTL ? 'מניות' : 'Shares'} value={result ? result.shares.toLocaleString() : '—'} />
        <Stat
          label={isRTL ? 'יחס R:R' : 'R:R'}
          value={result?.rrRatio ? `1:${result.rrRatio.toFixed(2)}` : '—'}
          accent={result?.rrRatio && result.rrRatio >= 2 ? '#22c55e' : undefined}
        />
        <Stat
          label={isRTL ? 'סיכון $' : 'Risk $'}
          value={result ? formatMoney(result.riskAmount, 0) : '—'}
          accent="#ef4444"
        />
        <Stat
          label={isRTL ? 'גודל פוזיציה' : 'Position'}
          value={result ? formatMoney(result.positionValue, 0) : '—'}
        />
        <div className="col-span-2 flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5">
          <span className="text-white/50 text-xs">
            {isRTL ? 'נקודת איזון' : 'Break Even'}
          </span>
          <span className="text-white font-mono text-sm font-semibold">
            ${entry > 0 ? entry.toFixed(2) : '—'}
          </span>
        </div>
      </div>
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
  step = 0.01,
  accent,
  suffix,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  step?: number
  accent?: string
  suffix?: string
}) {
  return (
    <label className="block">
      <span className="text-white/50 text-xs font-medium block mb-1">{label}</span>
      <div className="relative">
        <input
          type="number"
          step={step}
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border text-white font-mono text-sm focus:outline-none focus:ring-1 focus:border-cyan-400/40 focus:ring-cyan-400/30 transition"
          style={{
            borderColor: accent ? `${accent}33` : 'rgba(255,255,255,0.08)',
          }}
        />
        {suffix && (
          <span className="absolute end-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">
            {suffix}
          </span>
        )}
      </div>
    </label>
  )
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: string
}) {
  return (
    <div className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5">
      <p className="text-white/40 text-[10px] uppercase tracking-wider">{label}</p>
      <p
        className="font-mono text-sm font-semibold mt-0.5"
        style={{ color: accent ?? '#ffffff' }}
      >
        {value}
      </p>
    </div>
  )
}
