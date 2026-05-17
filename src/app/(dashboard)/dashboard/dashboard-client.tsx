'use client'

import { useEffect, useRef } from 'react'
import { useLang } from '@/lib/lang'
import { LangToggle } from '@/components/lang-toggle'
import { XPBar } from '@/components/xp-bar'
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

interface DayXP {
  date: string
  xp: number
}

interface DashboardClientProps {
  profile: Profile
  habits: Habit[]
  completedIds: string[]
  domainProgress: DomainProgress[]
  totalXpToday: number
  weeklyXP: DayXP[]
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
  totalXpToday,
  weeklyXP,
}: DashboardClientProps) {
  const { t, isRTL } = useLang()
  const completedSet = new Set(completedIds)
  const activeDomainsProgress = domainProgress.filter((d) => d.totalHabits > 0)
  const todayHabits = habits.filter((h) => h.frequency === 'daily')
  const confettiFired = useRef(false)

  const totalToday = todayHabits.length
  const completedToday = todayHabits.filter((h) => completedSet.has(h.id)).length
  const challengeProgress = completedToday

  const greeting = getGreeting('בוקר טוב', 'Good morning', profile.full_name, isRTL)

  useEffect(() => {
    if (totalToday > 0 && completedToday === totalToday && !confettiFired.current) {
      confettiFired.current = true
      triggerConfetti()
    }
  }, [completedToday, totalToday])

  return (
    <TimeBackground>
      <div className="px-4 pt-12 pb-32 space-y-6">
        {/* Header hero card */}
        <div
          className="rounded-3xl p-5 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, oklch(0.16 0.07 145), oklch(0.11 0.05 143))',
            border: '1px solid oklch(0.72 0.20 145 / 18%)',
            boxShadow: '0 0 40px oklch(0.72 0.20 145 / 12%), 0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          {/* Glow blob */}
          <div
            className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl pointer-events-none"
            style={{ background: 'oklch(0.72 0.20 145 / 18%)' }}
          />

          <div className="flex items-start justify-between mb-4 relative">
            <div>
              <p className="text-white/45 text-xs font-medium mb-1">
                {new Date().toLocaleDateString(isRTL ? 'he-IL' : 'en-US', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
              <h1 className="text-xl font-black text-white leading-tight">{greeting}</h1>
            </div>
            <LangToggle />
          </div>

          <XPBar xp={profile.xp} />

          <div className="flex items-center justify-between mt-3">
            {totalXpToday > 0 && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'oklch(0.55 0.18 155 / 20%)', color: 'oklch(0.70 0.16 155)' }}
              >
                +{totalXpToday} {t('xp')} {isRTL ? 'היום' : 'today'}
              </span>
            )}
            {profile.current_streak > 0 && (
              <StreakBadge streak={profile.current_streak} />
            )}
          </div>
        </div>

        {/* Weekly XP chart */}
        <WeeklyChart days={weeklyXP} />

        {/* Weekly Challenge */}
        <WeeklyChallenge currentProgress={challengeProgress} />

        {/* Domains Grid */}
        <div>
          <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">
            {t('allDomains')}
          </h2>
          {activeDomainsProgress.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {activeDomainsProgress.map((dp) => (
                <DomainCard key={dp.domain.slug} data={dp} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {domainProgress.map((dp) => (
                <DomainCard key={dp.domain.slug} data={dp} />
              ))}
            </div>
          )}
        </div>

        {/* Today's Schedule */}
        <ScheduleToday />

        {/* Daily AI Plan */}
        <DailyPlan
          habits={habits}
          completedIds={completedIds}
          streak={profile.current_streak}
        />

        {/* Today's Habits */}
        <div>
          <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">
            {t('todayHabits')}
          </h2>
          {todayHabits.length === 0 ? (
            <div className="text-center py-8 text-white/30 text-sm">
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

      {/* Wave at bottom */}
      <WaveAnimation />
    </TimeBackground>
  )
}
