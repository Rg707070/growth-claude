'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/lib/lang'
import { useHabitReminders } from '@/hooks/use-notifications'
import { LangToggle } from '@/components/lang-toggle'
import { HabitRow } from '@/components/habit-row'
import { EmptyHabits } from '@/components/empty-habits'
import { ScheduleToday } from '@/components/schedule-today'
import { TimeBackground } from '@/components/time-background'
import { WaveAnimation } from '@/components/wave-animation'
import { WeeklyChart } from '@/components/weekly-chart'
import { ProgressRing } from '@/components/progress-ring'
import type { Profile, Habit, DomainProgress, DomainStats } from '@/types'

interface DashboardClientProps {
  profile: Profile
  habits: Habit[]
  completedIds: string[]
  domainProgress: DomainProgress[]
  weeklyActivity: { date: string; count: number }[]
  domainStats: DomainStats[]
  overallStreak: number
  hasCustomDomains: boolean
}

function getGreeting(name: string | null, isRTL: boolean) {
  const hour = new Date().getHours()
  const greeting =
    hour < 12
      ? isRTL ? 'בוקר טוב' : 'Good morning'
      : hour < 17
      ? isRTL ? 'צהריים טובים' : 'Good afternoon'
      : hour < 21
      ? isRTL ? 'ערב טוב' : 'Good evening'
      : isRTL ? 'לילה טוב' : 'Good night'
  const displayName = name?.split(' ')[0] ?? ''
  return `${greeting}${displayName ? `, ${displayName}` : ''}`
}

export function DashboardClient({
  profile,
  habits,
  completedIds,
  domainProgress,
  weeklyActivity,
  domainStats,
  overallStreak,
  hasCustomDomains,
}: DashboardClientProps) {
  const { t, isRTL } = useLang()
  const router = useRouter()
  useHabitReminders(habits)

  const completedSet = new Set(completedIds)
  const todayHabits = habits.filter((h) => h.frequency === 'daily')
  const totalToday = todayHabits.length
  const completedToday = todayHabits.filter((h) => completedSet.has(h.id)).length
  const pct = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0
  const remaining = totalToday - completedToday

  const greeting = getGreeting(profile.full_name, isRTL)

  const domainStatMap = Object.fromEntries(domainStats.map((s) => [s.slug, s]))
  const domainsToShow = domainProgress.filter((d) => d.totalHabits > 0).length > 0
    ? domainProgress.filter((d) => d.totalHabits > 0)
    : domainProgress

  const failingDomains = domainsToShow.filter(
    (d) => (domainStatMap[d.domain.slug]?.failingDays ?? 0) >= 3
  )

  const pendingHabits = todayHabits.filter((h) => !completedSet.has(h.id))
  const doneHabits = todayHabits.filter((h) => completedSet.has(h.id))

  return (
    <TimeBackground>
      <div className="px-4 pt-12 pb-32 md:px-0 md:pt-6 md:pb-12">

        {/* Desktop: two-column grid. Tablet/mobile: single-column flow */}
        <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px] lg:gap-8 xl:gap-10 lg:items-start">

          {/* ── PRIMARY COLUMN ── */}
          <div className="space-y-6">

            {/* HERO */}
            <div
              className="rounded-3xl p-5 md:p-7 relative overflow-hidden animate-fade-up"
              style={{
                background: 'linear-gradient(135deg, var(--c-hero-start) 0%, var(--c-hero-mid) 45%, var(--c-hero-end) 100%)',
                border: '1px solid var(--c-hero-border)',
                boxShadow: '0 10px 40px var(--c-hero-shadow)',
              }}
            >
              <div aria-hidden className="absolute -top-20 -end-20 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none" style={{ background: '#A3E635' }} />
              <div aria-hidden className="absolute -bottom-24 -start-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: '#0EA5E9' }} />

              {/* Top row */}
              <div className="relative flex items-start justify-between mb-5">
                <div>
                  <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    {new Date().toLocaleDateString(isRTL ? 'he-IL' : 'en-US', {
                      weekday: 'long', day: 'numeric', month: 'long',
                    })}
                  </p>
                  <h1 className="text-lg md:text-xl font-bold leading-tight mt-0.5" style={{ color: '#fff' }}>
                    {greeting} 👋
                  </h1>
                </div>
                <div className="flex items-center gap-2">
                  {overallStreak > 0 && (
                    <div
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
                    >
                      🔥 {overallStreak} {isRTL ? 'ימים' : 'days'}
                    </div>
                  )}
                  <LangToggle />
                </div>
              </div>

              {/* Ring + stats */}
              <div className="relative flex items-center justify-center gap-6 md:justify-start md:gap-10">
                <ProgressRing percentage={pct} color="#A3E635" gradientTo="#0EA5E9" size={130} strokeWidth={8}>
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-black" style={{ color: '#fff' }}>{pct}%</span>
                    <span className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>
                      {completedToday}/{totalToday}
                    </span>
                  </div>
                </ProgressRing>

                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.65)' }}>
                      {isRTL ? 'הושלמו היום' : 'Completed'}
                    </p>
                    <p className="text-3xl md:text-4xl font-black leading-none mt-0.5" style={{ color: '#fff' }}>
                      {completedToday}
                      <span className="text-base font-normal opacity-60"> /{totalToday}</span>
                    </p>
                  </div>
                  {remaining > 0 ? (
                    <div
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                      style={{ background: 'rgba(163,230,53,0.18)', color: '#A3E635', border: '1px solid rgba(163,230,53,0.3)' }}
                    >
                      {isRTL ? `↗ עוד ${remaining} לסיום` : `↗ ${remaining} left`}
                    </div>
                  ) : totalToday > 0 ? (
                    <div
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                      style={{ background: 'rgba(163,230,53,0.18)', color: '#A3E635', border: '1px solid rgba(163,230,53,0.3)' }}
                    >
                      {isRTL ? '✨ יום מושלם!' : '✨ Perfect day!'}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* NEEDS ATTENTION */}
            {failingDomains.length > 0 && (
              <div>
                <h2
                  className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5"
                  style={{ color: '#F97316' }}
                >
                  ⚠️ {isRTL ? 'טעונים תשומת לב' : 'Needs Attention'}
                </h2>
                <div className="space-y-2">
                  {failingDomains.map((dp) => {
                    const stat = domainStatMap[dp.domain.slug]
                    return (
                      <button
                        key={dp.domain.slug}
                        onClick={() => router.push(`/domain/${dp.domain.slug}`)}
                        className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-start transition-all hover:brightness-110 active:scale-[0.98]"
                        style={{
                          background: 'rgba(249,115,22,0.07)',
                          border: '1px solid rgba(249,115,22,0.25)',
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                          style={{ background: `${dp.domain.color}22` }}
                        >
                          {dp.domain.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                            {isRTL ? dp.domain.nameHe : dp.domain.nameEn}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: '#F97316' }}>
                            {isRTL
                              ? `${stat?.failingDays} ימים ללא פעילות — שקול לשנות`
                              : `${stat?.failingDays} days inactive — consider changing`}
                          </p>
                        </div>
                        <span className="text-base" style={{ color: 'rgba(249,115,22,0.5)' }}>›</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* DOMAIN GRID */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {t('allDomains')}
                </h2>
                {hasCustomDomains && (
                  <button
                    onClick={() => router.push('/domains')}
                    className="text-xs font-semibold transition-colors"
                    style={{ color: 'var(--primary)' }}
                  >
                    {isRTL ? '+ ערוך' : '+ Edit'}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {domainsToShow.map((dp) => {
                  const stat = domainStatMap[dp.domain.slug] ?? { streak: 0, failingDays: 0 }
                  const isFailing = stat.failingDays >= 3
                  const doneToday = dp.completedToday === dp.totalHabits && dp.totalHabits > 0

                  return (
                    <button
                      key={dp.domain.slug}
                      onClick={() => router.push(`/domain/${dp.domain.slug}`)}
                      className="relative flex flex-col p-3.5 rounded-2xl text-start transition-all hover:brightness-110 active:scale-[0.97] overflow-hidden"
                      style={{
                        background: 'var(--c-card)',
                        border: isFailing
                          ? '1px solid rgba(249,115,22,0.4)'
                          : doneToday
                          ? `1px solid ${dp.domain.color}44`
                          : '1px solid var(--c-card-border)',
                        boxShadow: doneToday ? `0 0 14px ${dp.domain.glowColor}` : undefined,
                      }}
                    >
                      <div
                        className="absolute top-0 start-0 end-0 h-0.5 rounded-t-2xl"
                        style={{ background: isFailing ? '#F97316' : dp.domain.color }}
                      />

                      <div className="text-2xl mb-2 mt-0.5">{dp.domain.icon}</div>
                      <p
                        className="text-[11px] font-semibold leading-tight mb-3"
                        style={{ color: 'var(--foreground)' }}
                      >
                        {isRTL ? dp.domain.nameHe : dp.domain.nameEn}
                      </p>

                      <div className="mt-auto flex items-center justify-between w-full">
                        {isFailing ? (
                          <span className="text-[10px] font-semibold" style={{ color: '#F97316' }}>
                            ⚠️ {stat.failingDays}
                          </span>
                        ) : stat.streak > 0 ? (
                          <span className="text-[10px] font-semibold" style={{ color: '#FB923C' }}>
                            🔥 {stat.streak}
                          </span>
                        ) : (
                          <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>—</span>
                        )}

                        {doneToday ? (
                          <span className="text-[11px] font-bold" style={{ color: dp.domain.color }}>✓</span>
                        ) : (
                          <span className="text-[10px] tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
                            {dp.completedToday}/{dp.totalHabits}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* TODAY'S HABITS */}
            <div className="space-y-4">
              {pendingHabits.length > 0 && (
                <div>
                  <h2
                    className="text-xs font-semibold uppercase tracking-wider mb-3"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    {isRTL ? 'לסיום היום' : 'To Complete'}
                  </h2>
                  <div className="space-y-2">
                    {pendingHabits.map((habit) => (
                      <HabitRow key={habit.id} habit={habit} isCompleted={false} />
                    ))}
                  </div>
                </div>
              )}

              {doneHabits.length > 0 && (
                <div className="opacity-55">
                  <h2
                    className="text-xs font-semibold uppercase tracking-wider mb-3"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    {isRTL ? `הושלם ✓  (${doneHabits.length})` : `Done ✓  (${doneHabits.length})`}
                  </h2>
                  <div className="space-y-2">
                    {doneHabits.map((habit) => (
                      <HabitRow key={habit.id} habit={habit} isCompleted={true} />
                    ))}
                  </div>
                </div>
              )}

              {todayHabits.length === 0 && <EmptyHabits />}
            </div>

            {/* Mobile/tablet-only: schedule + journal + chart */}
            <div className="space-y-6 lg:hidden">
              <ScheduleToday />
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
              <WeeklyChart days={weeklyActivity} />
            </div>
          </div>

          {/* ── SECONDARY COLUMN (desktop only, lg+) ── */}
          <div className="hidden lg:flex flex-col gap-6 sticky top-8">
            <WeeklyChart days={weeklyActivity} />
            <ScheduleToday />
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
          </div>

        </div>
      </div>

      <div className="md:hidden">
        <WaveAnimation />
      </div>
    </TimeBackground>
  )
}
