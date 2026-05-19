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

interface ScheduleActivity {
  time: string
  label: string
  type: string
  checked: boolean
}

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
  weekXP: number
  achievementData: AchievementData
  weekSummary: WeekSummary
  todaySchedule: ScheduleActivity[]
  weeklyScheduleChecks: { date: string; count: number }[]
}

const TYPE_COLOR: Record<string, string> = {
  torah:  '#bef264',
  shiur:  '#5eead4',
  prayer: '#6ee7b7',
  sports: '#86efac',
  break:  'rgba(255,255,255,0.25)',
  other:  'rgba(255,255,255,0.25)',
}

function TodaySchedule({ items, isRTL }: { items: ScheduleActivity[]; isRTL: boolean }) {
  if (items.length === 0) return null
  const done = items.filter((i) => i.checked).length
  const pct = Math.round((done / items.length) * 100)

  return (
    <div
      className="p-4 rounded-2xl"
      style={{ background: 'var(--card)', border: '1px solid var(--c-border)', boxShadow: '0 1px 3px var(--c-shadow)' }}
    >
      <div className="flex items-center gap-2 mb-3" dir={isRTL ? 'rtl' : 'ltr'}>
        <span className="text-lg leading-none">📋</span>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
          {isRTL ? 'לוז היום' : "Today's Schedule"}
        </span>
        <span className="text-xs font-mono mr-auto" style={{ color: 'var(--primary)' }}>
          {done}/{items.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full mb-4" style={{ background: 'var(--c-surface-2)' }}>
        <div
          className="h-1 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: 'var(--primary)' }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        {items.map((item) => (
          <div key={item.time} className="flex items-center gap-2.5" dir="rtl">
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: item.checked ? 'rgba(52,211,153,0.6)' : (TYPE_COLOR[item.type] ?? TYPE_COLOR.other), opacity: item.checked ? 0.5 : 1 }}
            />
            <span
              className="text-[11px] font-mono tabular-nums flex-shrink-0"
              style={{ color: 'var(--muted-foreground)', opacity: item.checked ? 0.4 : 0.6 }}
            >
              {item.time}
            </span>
            <span
              className="text-[13px] flex-1 truncate"
              style={{
                color: item.checked ? 'var(--muted-foreground)' : 'var(--foreground)',
                textDecoration: item.checked ? 'line-through' : 'none',
                opacity: item.checked ? 0.45 : 1,
              }}
            >
              {item.label}
            </span>
            {item.checked && (
              <span className="text-[10px] flex-shrink-0" style={{ color: '#34d399' }}>✓</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function ProgressClient({
  profile,
  heatMapDays,
  weeklyActivity,
  weekXP,
  achievementData,
  weekSummary,
  todaySchedule,
  weeklyScheduleChecks,
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

      {/* Today's schedule progress */}
      <TodaySchedule items={todaySchedule} isRTL={isRTL} />

      {/* Weekly Activity Chart */}
      <WeeklyChart days={weeklyActivity} scheduleChecks={weeklyScheduleChecks} />

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
        weekXP={weekXP}
        streak={weekSummary.streak}
        topDomain={weekSummary.bestDomain}
        completionPct={weekSummary.completionPct}
        habitCount={weekSummary.habitCount}
      />
    </div>
  )
}
