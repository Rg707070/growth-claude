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
            className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
              unlocked
                ? 'bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                : 'bg-white/3 border-white/8 opacity-35'
            }`}
          >
            <span className={`text-2xl ${unlocked ? '' : 'grayscale'}`}>{a.icon}</span>
            <span className="text-[9px] text-center leading-tight text-white/70 font-medium">
              {isRTL ? a.nameHe : a.nameEn}
            </span>
            {unlocked && (
              <span className="text-[8px] text-cyan-400">✓</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
