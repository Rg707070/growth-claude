'use client'

import { useState } from 'react'
import { useLang } from '@/lib/lang'

interface Position {
  ticker: string
  buy: string
  current: string
}

const DEFAULT_POSITIONS: Position[] = [
  { ticker: 'LUNR',  buy: '', current: '' },
  { ticker: 'AFRM',  buy: '', current: '' },
  { ticker: 'CVNA',  buy: '', current: '' },
  { ticker: 'GME',   buy: '', current: '' },
  { ticker: 'OKLO',  buy: '', current: '' },
  { ticker: 'DELL',  buy: '', current: '' },
  { ticker: 'OPEN',  buy: '', current: '' },
  { ticker: 'NNE',   buy: '', current: '' },
  { ticker: 'AAPL',  buy: '', current: '' },
  { ticker: 'ASTS',  buy: '', current: '' },
  { ticker: 'JNJ',   buy: '', current: '' },
]

function calcPnl(buy: string, current: string): { pnl: number; pct: number } | null {
  const b = parseFloat(buy)
  const c = parseFloat(current)
  if (!b || !c || isNaN(b) || isNaN(c)) return null
  const pnl = c - b
  const pct = (pnl / b) * 100
  return { pnl, pct }
}

export function PortfolioTracker() {
  const { isRTL } = useLang()
  const [positions, setPositions] = useState<Position[]>(DEFAULT_POSITIONS)

  const update = (i: number, field: 'buy' | 'current', val: string) => {
    setPositions((prev) => prev.map((p, idx) => idx === i ? { ...p, [field]: val } : p))
  }

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-600/5 border border-violet-500/20">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📈</span>
        <span className="text-violet-300 text-xs font-semibold uppercase tracking-wide">
          {isRTL ? 'תיק השקעות' : 'Portfolio'}
        </span>
      </div>

      {/* Header */}
      <div className="grid grid-cols-4 gap-1 mb-2 px-1">
        {[
          isRTL ? 'מניה' : 'Ticker',
          isRTL ? 'קנייה' : 'Buy $',
          isRTL ? 'נוכחי' : 'Now $',
          isRTL ? 'P&L' : 'P&L',
        ].map((h) => (
          <span key={h} className="text-[9px] text-white/30 font-semibold uppercase">{h}</span>
        ))}
      </div>

      <div className="space-y-1.5">
        {positions.map((pos, i) => {
          const result = calcPnl(pos.buy, pos.current)
          return (
            <div key={pos.ticker} className="grid grid-cols-4 gap-1 items-center">
              <span className="text-xs font-bold text-white/70 font-mono">{pos.ticker}</span>
              <input
                value={pos.buy}
                onChange={(e) => update(i, 'buy', e.target.value)}
                placeholder="0.00"
                className="bg-white/8 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-violet-400/50 w-full"
              />
              <input
                value={pos.current}
                onChange={(e) => update(i, 'current', e.target.value)}
                placeholder="0.00"
                className="bg-white/8 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-violet-400/50 w-full"
              />
              <span
                className={`text-xs font-mono font-semibold text-center ${
                  !result ? 'text-white/20'
                  : result.pct >= 0 ? 'text-emerald-400'
                  : 'text-red-400'
                }`}
              >
                {result
                  ? `${result.pct >= 0 ? '+' : ''}${result.pct.toFixed(1)}%`
                  : '—'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
