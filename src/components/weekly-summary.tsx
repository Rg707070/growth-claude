'use client'

import { useLang } from '@/lib/lang'

interface WeeklySummaryProps {
  totalXP: number
  bestDomain: string
  streak: number
  completionPct: number
}

export function WeeklySummary({ totalXP, bestDomain, streak, completionPct }: WeeklySummaryProps) {
  const { isRTL } = useLang()
  const isSunday = new Date().getDay() === 0
  if (!isSunday) return null

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-600/5 border border-emerald-500/25 shadow-[0_0_20px_rgba(52,211,153,0.12)]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🏆</span>
        <span className="text-emerald-300 text-sm font-bold">
          {isRTL ? 'סיכום השבוע' : 'Weekly Summary'}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-2xl font-bold text-white">{totalXP}</p>
          <p className="text-[10px] text-white/40 mt-0.5">XP {isRTL ? 'סה"כ' : 'total'}</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-white">{streak}</p>
          <p className="text-[10px] text-white/40 mt-0.5">{isRTL ? 'ימים ברצף' : 'day streak'}</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-white">{completionPct}%</p>
          <p className="text-[10px] text-white/40 mt-0.5">{isRTL ? 'השלמה' : 'completion'}</p>
        </div>
      </div>
      {bestDomain && (
        <p className="text-xs text-emerald-300/70 mt-3 text-center">
          {isRTL ? `התחום הטוב ביותר: ${bestDomain} 🌟` : `Best domain: ${bestDomain} 🌟`}
        </p>
      )}
      <p className="text-xs text-white/30 text-center mt-2">
        {isRTL ? 'המשך ככה, אתה עושה עבודה מדהימה! 💙' : 'Keep it up, you\'re doing amazing! 💙'}
      </p>
    </div>
  )
}
