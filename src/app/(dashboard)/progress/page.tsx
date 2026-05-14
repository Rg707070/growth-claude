'use client'

import { useLang } from '@/lib/lang'
import { MESILLAT_LEVELS } from '@/lib/mesillat'

export default function ProgressPage() {
  const { t, isRTL } = useLang()

  return (
    <div className="px-4 pt-12 space-y-6">
      <h1 className="text-xl font-bold text-white">{t('myProgress')}</h1>

      {/* Mesillat Yesharim levels */}
      <div>
        <p className="text-white/50 text-sm mb-3">
          {isRTL ? 'מסילת ישרים — מדרגות' : 'Mesillat Yesharim — Levels'}
        </p>
        <div className="space-y-2">
          {MESILLAT_LEVELS.map((level) => (
            <div
              key={level.level}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
            >
              <div className="w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center flex-shrink-0">
                <span className="text-yellow-400 text-xs font-bold">{level.level}</span>
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">
                  {isRTL ? level.nameHe : level.nameEn}
                </p>
                <p className="text-white/40 text-xs">
                  {level.minXp}
                  {level.maxXp === Infinity ? '+' : `–${level.maxXp}`} XP
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
