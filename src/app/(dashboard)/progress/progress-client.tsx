'use client'

import { useLang } from '@/lib/lang'
import { MESILLAT_LEVELS } from '@/lib/mesillat'
import { ACHIEVEMENTS, getUnlockedIds } from '@/lib/achievements'
import { AchievementsDisplay } from '@/components/achievements-display'
import { HeatMap } from '@/components/heat-map'
import { WeeklyChart } from '@/components/weekly-chart'
import { WeeklySummary } from '@/components/weekly-summary'
import { FridaySummary } from '@/components/friday-summary'
import { AIInsights } from '@/components/ai-insights'
import type { Profile } from '@/types'
import type { AchievementData } from '@/lib/achievements'

interface WeekSummary {
  totalXP: number
  bestDomain: string
  streak: number
  completionPct: number
  habitCount: number
  topDomainSlug: string
  habitsCompleted: number
}

interface ProgressClientProps {
  profile: Profile
  heatMapDays: { date: string; pct: number }[]
  weeklyXP: { date: string; xp: number }[]
  achievementData: AchievementData
  weekSummary: WeekSummary
}

export function ProgressClient({
  profile,
  heatMapDays,
  weeklyXP,
  achievementData,
  weekSummary,
}: ProgressClientProps) {
  const { t, isRTL } = useLang()
  const unlockedIds = getUnlockedIds(achievementData)
  const currentLevel = MESILLAT_LEVELS.find(
    (l) => profile.xp >= l.minXp && profile.xp < l.maxXp
  ) ?? MESILLAT_LEVELS[0]

  return (
    <div className="px-4 pt-12 pb-32 space-y-6">
      <h1 className="text-xl font-bold text-white">{t('myProgress')}</h1>

      {/* Sunday summary */}
      <WeeklySummary
        totalXP={weekSummary.totalXP}
        bestDomain={weekSummary.bestDomain}
        streak={weekSummary.streak}
        completionPct={weekSummary.completionPct}
      />

      {/* Friday summary */}
      <FridaySummary
        weekXP={weekSummary.totalXP}
        streak={weekSummary.streak}
        habitsCompleted={weekSummary.habitsCompleted}
      />

      {/* Weekly XP Chart */}
      <WeeklyChart days={weeklyXP} />

      {/* Heat Map */}
      <HeatMap days={heatMapDays} />

      {/* Achievements */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🏅</span>
          <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider">
            {isRTL ? 'הישגים' : 'Achievements'}
          </h2>
          <span className="text-xs text-cyan-400 ml-auto">
            {unlockedIds.length}/{ACHIEVEMENTS.length}
          </span>
        </div>
        <AchievementsDisplay unlockedIds={unlockedIds} />
      </div>

      {/* AI Insights */}
      <AIInsights
        weekXP={weekSummary.totalXP}
        streak={weekSummary.streak}
        topDomain={weekSummary.bestDomain}
        completionPct={weekSummary.completionPct}
        habitCount={weekSummary.habitCount}
      />

      {/* Mesillat levels */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">📖</span>
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">
            {isRTL ? 'מסילת ישרים — מדרגות' : 'Mesillat Yesharim — Levels'}
          </p>
        </div>
        <div className="space-y-2">
          {MESILLAT_LEVELS.map((level) => {
            const isActive = level.level === currentLevel.level
            const isPast = profile.xp >= level.maxXp
            return (
              <div
                key={level.level}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-yellow-500/15 border-yellow-500/30 shadow-[0_0_12px_rgba(251,211,77,0.15)]'
                    : isPast
                    ? 'bg-white/5 border-white/8 opacity-60'
                    : 'bg-white/3 border-white/5 opacity-40'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isActive ? 'bg-yellow-400/30' : isPast ? 'bg-white/10' : 'bg-white/5'
                  }`}
                >
                  <span className={`text-xs font-bold ${isActive ? 'text-yellow-400' : 'text-white/40'}`}>
                    {level.level}
                  </span>
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${isActive ? 'text-white' : 'text-white/60'}`}>
                    {isRTL ? level.nameHe : level.nameEn}
                  </p>
                  <p className="text-white/30 text-xs">
                    {level.minXp}{level.maxXp === Infinity ? '+' : `–${level.maxXp}`} XP
                  </p>
                </div>
                {isActive && (
                  <span className="text-yellow-400 text-xs font-bold">
                    ← {isRTL ? 'כאן' : 'here'}
                  </span>
                )}
                {isPast && <span className="text-emerald-400 text-xs">✓</span>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
