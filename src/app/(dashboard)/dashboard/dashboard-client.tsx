'use client'

import { useEffect, useRef } from 'react'
import { useLang } from '@/lib/lang'
import { LangToggle } from '@/components/lang-toggle'
import { DomainCard } from '@/components/domain-card'
import { HabitRow } from '@/components/habit-row'
import { ScheduleToday } from '@/components/schedule-today'
import { TimeBackground } from '@/components/time-background'
import { WaveAnimation } from '@/components/wave-animation'
import { StreakBadge } from '@/components/streak-badge'
import { WeeklyChallenge } from '@/components/weekly-challenge'
import { WeeklyChart } from '@/components/weekly-chart'
import { triggerConfetti } from '@/components/confetti'
import { DailyPlan } from '@/components/daily-plan'
import type { Profile, Habit, DomainProgress } from '@/types'

interface DashboardClientProps {
  profile: Profile
  habits: Habit[]
  completedIds: string[]
  domainProgress: DomainProgress[]
  weeklyActivity: { date: string; count: number }[]
  weekXP: number
  challengeProgress: number
}

function getGreeting(nameHe: string, nameEn: string, name: string | null, isRTL: boolean) {
  const hour = new Date().getHours()
  const greeting =
    hour < 12
      ? isRTL ? nameHe : nameEn
      : hour < 17
      ? isRTL ? 'צהריים טובים' : 'Good afternoon'
      : hour < 21
      ? isRTL ? 'ערב טוב' : 'Good evening'
      : isRTL ? 'לילה טוב' : 'Good night'
  const displayName = name?.split(' ')[0] ?? ''
  return `${greeting}${displayName ? `, ${displayName}` : ''} 👋`
}

export function DashboardClient({
  profile,
  habits,
  completedIds,
  domainProgress,
  weeklyActivity,
  challengeProgress,
}: DashboardClientProps) {
  const { t, isRTL } = useLang()
  const completedSet = new Set(completedIds)
  const activeDomainsProgress = domainProgress.filter((d) => d.totalHabits > 0)
  const todayHabits = habits.filter((h) => h.frequency === 'daily')
  const confettiFired = useRef(false)

  const totalToday = todayHabits.length
  const completedToday = todayHabits.filter((h) => completedSet.has(h.id)).length

  const greeting = getGreeting('בוקר טוב', 'Good morning', profile.full_name, isRTL)

  useEffect(() => {
    if (totalToday > 0 && completedToday === totalToday && !confettiFired.current) {
      confettiFired.current = true
      triggerConfetti()
    }
  }, [completedToday, totalToday])

  const domainsToShow = activeDomainsProgress.length > 0 ? activeDomainsProgress : domainProgress

  return (
    <TimeBackground>
      <div className="px-4 pt-12 pb-32 space-y-6 md:px-0 md:pt-8 md:pb-12 md:space-y-8">
        {/* Header hero card */}
        <div
          className="rounded-2xl p-5 md:p-7 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, var(--c-hero-start), var(--c-hero-end))',
            border: '1px solid var(--c-hero-border)',
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/60 text-xs font-medium mb-1">
                {new Date().toLocaleDateString(isRTL ? 'he-IL' : 'en-US', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
              <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">{greeting}</h1>
            </div>
            <LangToggle />
          </div>

          <div className="flex items-center justify-end mt-1">
            {profile.current_streak > 0 && (
              <StreakBadge streak={profile.current_streak} />
            )}
          </div>
        </div>

        {/* Mobile: single column flow */}
        <div className="md:hidden space-y-6">
          <WeeklyChart days={weeklyActivity} />
          <WeeklyChallenge challengeProgress={challengeProgress} />

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted-foreground)' }}>
              {t('allDomains')}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {domainsToShow.map((dp) => (
                <DomainCard key={dp.domain.slug} data={dp} />
              ))}
            </div>
          </div>

          <ScheduleToday />

          <DailyPlan
            habits={habits}
            completedIds={completedIds}
            streak={profile.current_streak}
          />

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted-foreground)' }}>
              {t('todayHabits')}
            </h2>
            {todayHabits.length === 0 ? (
              <div className="text-center py-8 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {t('noHabitsYet')}
              </div>
            ) : (
              <div className="space-y-2">
                {todayHabits.map((habit) => (
                  <HabitRow
                    key={habit.id}
                    habit={habit}
                    isCompleted={completedSet.has(habit.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop: 3-column dashboard grid */}
        <div className="hidden md:grid md:grid-cols-3 md:gap-6">
          {/* Main column (2/3) */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted-foreground)' }}>
                {t('allDomains')}
              </h2>
              <div className="grid grid-cols-4 gap-3">
                {domainsToShow.map((dp) => (
                  <DomainCard key={dp.domain.slug} data={dp} />
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted-foreground)' }}>
                {t('todayHabits')}
              </h2>
              {todayHabits.length === 0 ? (
                <div className="text-center py-8 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  {t('noHabitsYet')}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {todayHabits.map((habit) => (
                    <HabitRow
                      key={habit.id}
                      habit={habit}
                      isCompleted={completedSet.has(habit.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Side column (1/3) */}
          <div className="md:col-span-1 space-y-6">
            <WeeklyChart days={weeklyActivity} />
            <WeeklyChallenge challengeProgress={challengeProgress} />
            <ScheduleToday />
            <DailyPlan
              habits={habits}
              completedIds={completedIds}
              streak={profile.current_streak}
            />
          </div>
        </div>
      </div>

      {/* Wave at bottom — mobile only */}
      <div className="md:hidden">
        <WaveAnimation />
      </div>
    </TimeBackground>
  )
}
