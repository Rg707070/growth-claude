'use client'

import { useLang } from '@/lib/lang'
import { getLevelFromXp, getXpProgress } from '@/lib/mesillat'

interface XPBarProps {
  xp: number
}

export function XPBar({ xp }: XPBarProps) {
  const { t, isRTL } = useLang()
  const level = getLevelFromXp(xp)
  const progress = getXpProgress(xp)
  const xpToNext = level.maxXp === Infinity ? null : level.maxXp - xp

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 font-bold">
            {t('level')} {level.level}
          </span>
          <span className="text-white/60">
            {isRTL ? level.nameHe : level.nameEn}
          </span>
        </div>
        <span className="text-white/50 text-xs">
          {xp} {t('xp')}
        </span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>
      {xpToNext !== null && (
        <p className="text-xs text-white/40">
          {xpToNext} {t('xp')} {t('nextLevel')}
        </p>
      )}
    </div>
  )
}
