'use client'

import { Check } from 'lucide-react'
import { useLang } from '@/lib/lang'
import { FILTER_KEYS, filterScore } from '@/lib/trading-utils'
import type { FilterChecks, FilterCheckKey } from '@/types/trading'

interface Props {
  checks: FilterChecks
  onChange: (checks: FilterChecks) => void
}

export function IronFilter({ checks, onChange }: Props) {
  const { isRTL } = useLang()
  const score = filterScore(checks)

  const labels: Record<FilterCheckKey, { he: string; en: string; hint: { he: string; en: string } }> = {
    volume: {
      he: 'ווליום חזק',
      en: 'Strong Volume',
      hint: { he: 'ווליום גבוה מהממוצע ביום הפריצה', en: 'Volume above average on breakout day' },
    },
    trend: {
      he: 'מגמה עולה',
      en: 'Uptrend',
      hint: { he: 'שיאים ושפלים עולים בטווח הקצר', en: 'Higher highs + higher lows recently' },
    },
    resistance_break: {
      he: 'פריצת התנגדות',
      en: 'Resistance Break',
      hint: { he: 'המחיר חצה רמת התנגדות ברורה', en: 'Price broke clear resistance level' },
    },
    ma_150: {
      he: 'מעל ממוצע 150',
      en: 'Above MA 150',
      hint: { he: 'המחיר מעל הממוצע הנע 150', en: 'Price above 150-day moving average' },
    },
    confirmation_candle: {
      he: 'נר אישור',
      en: 'Confirmation Candle',
      hint: { he: 'נר ירוק חזק בסגירה גבוהה', en: 'Strong green candle closing high' },
    },
    consolidation: {
      he: 'קונסולידציה צמודה',
      en: 'Tight Consolidation',
      hint: { he: 'תנודה צרה לפני הפריצה', en: 'Narrow range before breakout' },
    },
  }

  const toggle = (key: FilterCheckKey) => {
    onChange({ ...checks, [key]: !checks[key] })
  }

  const scoreColor =
    score === 6 ? '#22c55e' : score >= 4 ? '#06b6d4' : score >= 2 ? '#f59e0b' : '#64748b'

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-sm">
            {isRTL ? 'Iron Filter — צ׳ק־ליסט כניסה' : 'Iron Filter — Entry Checklist'}
          </h3>
          <p className="text-white/40 text-xs mt-0.5">
            {isRTL ? 'אינדיקטור איכות, לא חוסם' : 'Quality indicator, not a blocker'}
          </p>
        </div>
        <div
          className="flex items-baseline gap-1 px-3 py-1.5 rounded-xl font-mono"
          style={{
            background: `${scoreColor}1a`,
            color: scoreColor,
            border: `1px solid ${scoreColor}44`,
          }}
        >
          <span className="text-2xl font-bold">{score}</span>
          <span className="text-sm opacity-60">/6</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {FILTER_KEYS.map((key) => {
          const active = !!checks[key]
          const label = labels[key]
          return (
            <button
              key={key}
              onClick={() => toggle(key)}
              className="flex items-start gap-2.5 p-3 rounded-xl border text-right transition-colors"
              style={{
                background: active ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                borderColor: active ? 'rgba(6, 182, 212, 0.4)' : 'rgba(255, 255, 255, 0.08)',
              }}
            >
              <div
                className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-colors"
                style={{
                  background: active ? '#06b6d4' : 'rgba(255, 255, 255, 0.05)',
                  border: active ? 'none' : '1px solid rgba(255, 255, 255, 0.15)',
                }}
              >
                {active && <Check size={14} className="text-slate-900" strokeWidth={3} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium leading-tight">
                  {isRTL ? label.he : label.en}
                </p>
                <p className="text-white/40 text-xs mt-0.5 leading-snug">
                  {isRTL ? label.hint.he : label.hint.en}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
