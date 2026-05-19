'use client'

import { useLang } from '@/lib/lang'
import { ACHIEVEMENTS } from '@/lib/achievements'

interface AchievementsDisplayProps {
  unlockedIds: string[]
}

export function AchievementsDisplay({ unlockedIds }: AchievementsDisplayProps) {
  const { isRTL } = useLang()
  const unlockedSet = new Set(unlockedIds)

  return (
    <div className="grid grid-cols-4 gap-2">
      {ACHIEVEMENTS.map((a) => {
        const unlocked = unlockedSet.has(a.id)
        return (
          <div
            key={a.id}
            title={isRTL ? a.descHe : a.descHe}
            className="flex flex-col items-center gap-1 p-2.5 rounded-2xl transition-all"
            style={
              unlocked
                ? {
                    background: 'var(--brand-gradient-soft-bg)',
                    border: '1px solid color-mix(in oklab, var(--primary) 32%, transparent)',
                    boxShadow: '0 0 14px color-mix(in oklab, var(--primary) 18%, transparent)',
                  }
                : {
                    background: 'var(--c-surface-2)',
                    border: '1px solid var(--c-border)',
                    opacity: 0.45,
                  }
            }
          >
            <span className={`text-2xl ${unlocked ? '' : 'grayscale'}`}>{a.icon}</span>
            <span
              className="text-[9px] text-center leading-tight font-medium"
              style={{ color: unlocked ? 'var(--foreground)' : 'var(--muted-foreground)' }}
            >
              {isRTL ? a.nameHe : a.nameEn}
            </span>
            {unlocked && (
              <span className="text-[10px] font-bold brand-gradient-text">✓</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
