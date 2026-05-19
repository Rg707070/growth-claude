'use client'

import { useLang } from '@/lib/lang'

const CHALLENGES: { he: string; en: string; target: number }[] = [
  { he: 'סיים 3 הרגלים ביום במשך 5 ימים',   en: 'Complete 3 habits/day for 5 days',    target: 5 },
  { he: 'השלם את כל הרגלי הספורט השבוע',     en: 'Complete all Sports habits this week', target: 7 },
  { he: 'למד תורה כל יום השבוע',              en: 'Learn Torah every day this week',      target: 7 },
  { he: 'הוסף הרגל חדש בכל תחום',            en: 'Add a habit in every domain',           target: 8 },
  { he: '5 ימים ברצף ללא דילוג',              en: '5 days streak without skipping',        target: 5 },
]

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
    <div
      className="p-4 rounded-2xl relative overflow-hidden"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--c-border)',
        boxShadow: '0 1px 3px var(--c-shadow)',
      }}
    >
      {done && (
        <div
          aria-hidden
          className="absolute inset-0 opacity-50 pointer-events-none"
          style={{ background: 'var(--brand-gradient-soft-bg)' }}
        />
      )}
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg leading-none">{done ? '✅' : '🎯'}</span>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL ? 'אתגר השבוע' : 'Weekly Challenge'}
          </span>
          {done && (
            <span
              className="ms-auto text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
              style={{ background: 'var(--brand-gradient)' }}
            >
              {isRTL ? 'הושלם!' : 'Done!'}
            </span>
          )}
        </div>
        <p className="text-sm font-medium mb-3 leading-snug" style={{ color: 'var(--foreground)' }}>
          {isRTL ? challenge.he : challenge.en}
        </p>
        <div className="flex items-center gap-3">
          <div
            className="flex-1 h-2 rounded-full overflow-hidden"
            style={{ background: 'var(--c-surface-2)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${pct}%`, background: 'var(--brand-gradient)' }}
            />
          </div>
          <span
            className="text-xs font-mono tabular-nums flex-shrink-0"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {challengeProgress}/{challenge.target}
          </span>
        </div>
      </div>
    </div>
  )
}
