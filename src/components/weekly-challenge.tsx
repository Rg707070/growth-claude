'use client'

import { useLang } from '@/lib/lang'

const CHALLENGES: { he: string; en: string; target: number }[] = [
  { he: 'סיים 3 הרגלים ביום במשך 5 ימים',   en: 'Complete 3 habits/day for 5 days',    target: 5 },
  { he: 'השלם את כל הרגלי הספורט השבוע',     en: 'Complete all Sports habits this week', target: 7 },
  { he: 'למד תורה כל יום השבוע',              en: 'Learn Torah every day this week',      target: 7 },
  { he: 'הוסף הרגל חדש בכל תחום',            en: 'Add a habit in every domain',           target: 8 },
  { he: '5 ימים ברצף ללא דילוג',              en: '5 days streak without skipping',        target: 5 },
]

// Export so the dashboard page can know which challenge index is active
export const CHALLENGE_COUNT = CHALLENGES.length

interface WeeklyChallengeProps {
  challengeProgress: number
}

export function WeeklyChallenge({ challengeProgress }: WeeklyChallengeProps) {
  const { isRTL } = useLang()
  const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
  const challenge = CHALLENGES[weekNum % CHALLENGES.length]
  const pct = Math.min(100, Math.round((challengeProgress / challenge.target) * 100))
  const done = challengeProgress >= challenge.target

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-emerald-600/5 border border-emerald-500/20 shadow-[0_0_16px_rgba(52,211,153,0.1)]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{done ? '✅' : '🎯'}</span>
        <span className="text-emerald-300 text-xs font-semibold uppercase tracking-wide">
          {isRTL ? 'אתגר השבוע' : 'Weekly Challenge'}
        </span>
        {done && (
          <span className="ms-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300">
            {isRTL ? 'הושלם!' : 'Done!'}
          </span>
        )}
      </div>
      <p className="text-white text-sm font-medium mb-3">
        {isRTL ? challenge.he : challenge.en}
      </p>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs text-emerald-300/70 font-mono flex-shrink-0">
          {challengeProgress}/{challenge.target}
        </span>
      </div>
    </div>
  )
}
