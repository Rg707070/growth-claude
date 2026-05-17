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
            style={{ background: 'var(--c-primary-glow)', border: '1px solid var(--primary)' }}
          >
            {emoji}
          </div>
          <div>
            <p className="font-bold text-sm leading-tight" style={{ color: 'var(--foreground)' }}>
              {isRTL ? level.nameHe : level.nameEn}
            </p>
            <p className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
              {t('level')} {level.level}
            </p>
          </div>
        </div>
        <div className="text-end">
          <p className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>{xp.toLocaleString()}</p>
          <p className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>{t('xp')}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--c-primary-glow)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, var(--c-hero-end), var(--primary))',
            boxShadow: '0 0 8px var(--c-primary-glow)',
          }}
        />
      </div>

      {xpToNext !== null && (
        <p className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
          {xpToNext} {t('xp')} {t('nextLevel')}
        </p>
      )}
    </div>
  )
}
