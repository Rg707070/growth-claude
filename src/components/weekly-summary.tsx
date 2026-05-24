'use client'

import { useLang } from '@/lib/lang'

interface WeeklySummaryProps {
  habitsCompleted: number
  bestDomain: string
  completionPct: number
}

export function WeeklySummary({ habitsCompleted, bestDomain, completionPct }: WeeklySummaryProps) {
  const { isRTL } = useLang()
  const isSunday = new Date().getDay() === 0
  if (!isSunday) return null

  return (
    <div
      className="p-4 rounded-2xl relative overflow-hidden"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--c-border)',
        boxShadow: '0 1px 3px var(--c-shadow), 0 8px 24px var(--c-shadow)',
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{ background: 'var(--brand-gradient-soft-bg)' }}
      />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl leading-none">🏆</span>
          <span className="text-sm font-bold brand-gradient-text">
            {isRTL ? 'סיכום השבוע' : 'Weekly Summary'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>{habitsCompleted}</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              {isRTL ? 'הרגלים' : 'habits done'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>{completionPct}%</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              {isRTL ? 'השלמה' : 'completion'}
            </p>
          </div>
        </div>
        {bestDomain && (
          <p className="text-xs mt-3 text-center" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL ? `התחום הטוב ביותר: ${bestDomain} 🌟` : `Best domain: ${bestDomain} 🌟`}
          </p>
        )}
        <p className="text-xs text-center mt-1.5" style={{ color: 'var(--muted-foreground)' }}>
          {isRTL ? 'המשך ככה, אתה עושה עבודה מדהימה! 💙' : 'Keep it up, you\'re doing amazing! 💙'}
        </p>
      </div>
    </div>
  )
}
