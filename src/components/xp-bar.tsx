'use client'

import { useLang } from '@/lib/lang'

interface XpBarProps {
  xp: number
  levelLabel?: string
  emoji?: string
  showLabel?: boolean
}

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000]

function getLevelInfo(xp: number) {
  let currentIdx = 0
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) currentIdx = i
  }
  const currentMin = LEVEL_THRESHOLDS[currentIdx]
  const nextMin = LEVEL_THRESHOLDS[currentIdx + 1] ?? currentMin + 1000
  const range = nextMin - currentMin
  const into = Math.max(0, xp - currentMin)
  const pct = Math.min(100, Math.round((into / range) * 100))
  return { currentIdx, currentMin, nextMin, into, range, pct }
}

export function XpBar({ xp, levelLabel, emoji = '✨', showLabel = true }: XpBarProps) {
  const { isRTL } = useLang()
  const info = getLevelInfo(xp)

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5 text-xs">
          <div className="flex items-center gap-1.5 font-semibold" style={{ color: 'var(--foreground)' }}>
            <span className="leading-none">{emoji}</span>
            {levelLabel && <span>{levelLabel}</span>}
          </div>
          <span style={{ color: 'var(--muted-foreground)' }}>
            {info.into}/{info.range} XP
          </span>
        </div>
      )}
      <div
        className="relative h-2 rounded-full overflow-hidden"
        style={{ background: 'var(--c-surface-2)' }}
      >
        <div
          className="absolute inset-y-0 rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${info.pct}%`,
            background: 'var(--brand-gradient)',
            insetInlineStart: 0,
          }}
        />
        <div
          className="absolute inset-0 animate-shimmer rounded-full pointer-events-none"
          style={{ mixBlendMode: 'overlay' }}
          aria-hidden
        />
      </div>
      {!showLabel && (
        <div className="text-[10px] mt-1 font-medium" style={{ color: 'var(--muted-foreground)' }}>
          {isRTL ? `${info.into} מתוך ${info.range} XP` : `${info.into}/${info.range} XP`}
        </div>
      )}
    </div>
  )
}
