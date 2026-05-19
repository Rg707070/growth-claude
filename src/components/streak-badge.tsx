'use client'

import { useLang } from '@/lib/lang'

interface StreakBadgeProps {
  streak: number
  size?: 'sm' | 'md' | 'lg'
}

export function StreakBadge({ streak, size = 'md' }: StreakBadgeProps) {
  const { isRTL } = useLang()
  if (streak === 0) return null

  const intensity = streak >= 30 ? 3 : streak >= 14 ? 2 : streak >= 7 ? 1 : 0
  const flames = intensity >= 3 ? '🔥🔥🔥' : intensity >= 2 ? '🔥🔥' : '🔥'

  const sizes = {
    sm: { px: 'px-2 py-0.5', text: 'text-xs', flame: 'text-sm' },
    md: { px: 'px-3 py-1.5', text: 'text-sm', flame: 'text-base' },
    lg: { px: 'px-4 py-2', text: 'text-base', flame: 'text-xl' },
  }[size]

  const glowShadow =
    intensity >= 3
      ? '0 0 24px var(--c-streak-glow), 0 0 8px var(--c-streak-glow)'
      : intensity >= 2
        ? '0 0 16px var(--c-streak-glow)'
        : intensity >= 1
          ? '0 0 8px var(--c-streak-glow)'
          : 'none'

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold transition-all ${sizes.px} ${sizes.text}`}
      style={{
        background: 'var(--c-streak-bg)',
        color: 'var(--c-streak-fg)',
        border: '1px solid var(--c-streak-fg)',
        borderColor: 'color-mix(in oklab, var(--c-streak-fg) 30%, transparent)',
        boxShadow: glowShadow,
      }}
    >
      <span className={`${sizes.flame} animate-flame leading-none`}>{flames}</span>
      <span className="font-bold tabular-nums">{streak}</span>
      <span className="opacity-70 text-[0.85em]">{isRTL ? 'ימים' : 'days'}</span>
    </div>
  )
}
