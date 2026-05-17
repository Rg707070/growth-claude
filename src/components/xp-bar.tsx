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

  const levelEmojis = ['', '👁️', '⚡', '✨', '🌿', '💧', '❤️', '🕊️', '🌟', '👑']
  const emoji = levelEmojis[level.level] ?? '✨'

  return (
    <div className="space-y-2">
      {/* Level header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
            style={{ background: 'oklch(0.72 0.20 145 / 18%)', border: '1px solid oklch(0.72 0.20 145 / 25%)' }}
          >
            {emoji}
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">
              {isRTL ? level.nameHe : level.nameEn}
            </p>
            <p className="text-white/40 text-[10px]">
              {t('level')} {level.level}
            </p>
          </div>
        </div>
        <div className="text-end">
          <p className="text-white font-bold text-sm">{xp.toLocaleString()}</p>
          <p className="text-white/40 text-[10px]">{t('xp')}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-2.5 rounded-full overflow-hidden" style={{ background: 'oklch(0.72 0.20 145 / 12%)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, oklch(0.62 0.17 145), oklch(0.72 0.20 145))',
            boxShadow: '0 0 8px oklch(0.72 0.20 145 / 60%)',
          }}
        />
      </div>

      {xpToNext !== null && (
        <p className="text-[10px] text-white/35">
          {xpToNext} {t('xp')} {t('nextLevel')}
        </p>
      )}
    </div>
  )
}
