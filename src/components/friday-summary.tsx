'use client'

import { useLang } from '@/lib/lang'

interface FridaySummaryProps {
  habitsCompleted: number
}

const MOTIVATIONAL_HE = [
  'שבת שלום! הגעת לסוף שבוע מרהיב 🌟',
  'כל צעד קטן מוביל לצמיחה גדולה 💪',
  'אתה בונה את עצמך יום אחר יום ❤️',
  'ה׳ ישמח בעבודתך! שבת שלום 🕯️',
]
const MOTIVATIONAL_EN = [
  'Shabbat Shalom! What an incredible week! 🌟',
  'Every small step leads to great growth 💪',
  'You\'re building yourself day by day ❤️',
  'A blessed Shabbat to you! 🕯️',
]

export function FridaySummary({ habitsCompleted }: FridaySummaryProps) {
  const { isRTL } = useLang()
  const isFriday = new Date().getDay() === 5
  if (!isFriday) return null

  const quotes = isRTL ? MOTIVATIONAL_HE : MOTIVATIONAL_EN
  const quote = quotes[Math.floor(Date.now() / 86400000) % quotes.length]

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-500/15 to-orange-600/5 border border-yellow-500/25 shadow-[0_0_20px_rgba(251,211,77,0.12)]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🕯️</span>
        <span className="text-yellow-300 text-sm font-bold">
          {isRTL ? 'כניסת שבת' : 'Shabbat Summary'}
        </span>
      </div>
      <div className="mb-3 text-center">
        <p className="text-2xl font-bold text-white">{habitsCompleted}</p>
        <p className="text-[10px] text-white/40 mt-0.5">{isRTL ? 'הרגלים השבוע' : 'habits this week'}</p>
      </div>
      <p className="text-sm text-yellow-200/80 text-center font-medium">{quote}</p>
    </div>
  )
}
