'use client'

import { useRouter } from 'next/navigation'
import { useLang } from '@/lib/lang'
import { LangToggle } from '@/components/lang-toggle'
import { DomainCard } from '@/components/domain-card'
import { HabitRow } from '@/components/habit-row'
import { ScheduleToday } from '@/components/schedule-today'
import { TimeBackground } from '@/components/time-background'
import { WaveAnimation } from '@/components/wave-animation'
import { WeeklyChart } from '@/components/weekly-chart'
import type { Profile, Habit, DomainProgress } from '@/types'

interface DashboardClientProps {
  profile: Profile
  habits: Habit[]
  completedIds: string[]
  domainProgress: DomainProgress[]
  weeklyActivity: { date: string; count: number }[]
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
}: DashboardClientProps) {
  const { t, isRTL } = useLang()
  const router = useRouter()
  const completedSet = new Set(completedIds)
  const activeDomainsProgress = domainProgress.filter((d) => d.totalHabits > 0)
  const todayHabits = habits.filter((h) => h.frequency === 'daily')

  const totalToday = todayHabits.length
  const completedToday = todayHabits.filter((h) => completedSet.has(h.id)).length

  const greeting = getGreeting('בוקר טוב', 'Good morning', profile.full_name, isRTL)

  const domainsToShow = activeDomainsProgress.length > 0 ? activeDomainsProgress : domainProgress

  return (
    <TimeBackground>
      <div className="px-4 pt-12 pb-32 space-y-6 md:px-0 md:pt-8 md:pb-12 md:space-y-8">
        {/* Header hero card */}
        <div
          className="rounded-3xl p-5 md:p-7 relative overflow-hidden animate-fade-up"
          style={{
            background: 'linear-gradient(135deg, var(--c-hero-start) 0%, var(--c-hero-mid) 45%, var(--c-hero-end) 100%)',
            border: '1px solid var(--c-hero-border)',
            boxShadow: '0 10px 40px var(--c-hero-shadow)',
          }}
        >
          {/* Glow blobs */}
          <div
            aria-hidden
            className="absolute -top-20 -end-20 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none"
            style={{ background: '#A3E635' }}
          />
          <div
            aria-hidden
            className="absolute -bottom-24 -start-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ background: '#0EA5E9' }}
          />

          <div className="relative flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
                {new Date().toLocaleDateString(isRTL ? 'he-IL' : 'en-US', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
              <h1 className="text-xl md:text-2xl font-bold leading-tight" style={{ color: '#FFFFFF' }}>{greeting}</h1>
            </div>
            <LangToggle />
          </div>

          {/* Stats row */}
          <div className="relative flex items-center gap-4 mt-4">
            <div className="flex-1">
              <div className="flex items-center justify-between text-[11px] mb-1.5" style={{ color: 'rgba(255,255,255,0.75)' }}>
                <span className="font-semibold uppercase tracking-wider">{isRTL ? 'התקדמות יומית' : 'Today'}</span>
                <span className="tabular-nums font-bold">{completedToday}/{totalToday}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.18)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: totalToday > 0 ? `${(completedToday / totalToday) * 100}%` : '0%',
                    background: 'linear-gradient(90deg, #A3E635, #0EA5E9)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: single column flow */}
        <div className="md:hidden space-y-6">
          <WeeklyChart days={weeklyActivity} />

          {/* Journal shortcut */}
          <button
            onClick={() => router.push('/journal')}
            className="w-full flex items-center gap-3 p-4 rounded-2xl text-start transition-colors hover:brightness-110 active:scale-[0.98]"
            style={{ background: 'var(--c-card)', border: '1px solid var(--c-card-border)' }}
          >
            <span className="text-2xl">✍️</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                {isRTL ? 'יומן' : 'Journal'}
              </p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {isRTL ? 'כתיבה · הארות · אלבום' : 'Writing · Insights · Album'}
              </p>
            </div>
            <span className="ms-auto" style={{ color: 'var(--muted-foreground)' }}>›</span>
          </button>

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
            <ScheduleToday />
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
