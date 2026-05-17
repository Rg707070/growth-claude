'use client'

import { useLang } from '@/lib/lang'
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
  weeklyActivity: { date: string; count: number }[]
  achievementData: AchievementData
  weekSummary: WeekSummary
}

export function ProgressClient({
  profile,
  heatMapDays,
  weeklyActivity,
  achievementData,
  weekSummary,
}: ProgressClientProps) {
  const { t, isRTL } = useLang()
  const unlockedIds = getUnlockedIds(achievementData)

  return (
    <div className="px-4 pt-12 pb-32 space-y-6">
      <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{t('myProgress')}</h1>

      {/* Sunday summary */}
      <WeeklySummary
        habitsCompleted={weekSummary.habitsCompleted}
        bestDomain={weekSummary.bestDomain}
        streak={weekSummary.streak}
        completionPct={weekSummary.completionPct}
      />

      {/* Friday summary */}
      <FridaySummary
        streak={weekSummary.streak}
        habitsCompleted={weekSummary.habitsCompleted}
      />

      {/* Weekly Activity Chart */}
      <WeeklyChart days={weeklyActivity} />

      {/* Heat Map */}
      <HeatMap days={heatMapDays} />

      {/* Achievements */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🏅</span>
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL ? 'הישגים' : 'Achievements'}
          </h2>
          <span className="text-xs ml-auto" style={{ color: 'var(--primary)' }}>
            {unlockedIds.length}/{ACHIEVEMENTS.length}
          </span>
        </div>
        <AchievementsDisplay unlockedIds={unlockedIds} />
      </div>

      {/* AI Insights */}
      <AIInsights
        weekXP={0}
        streak={weekSummary.streak}
        topDomain={weekSummary.bestDomain}
        completionPct={weekSummary.completionPct}
        habitCount={weekSummary.habitCount}
      />
    </div>
  )
}
