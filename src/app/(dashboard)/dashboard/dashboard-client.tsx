'use client'

import { useLang } from '@/lib/lang'
import { LangToggle } from '@/components/lang-toggle'
import { XPBar } from '@/components/xp-bar'
import { DomainCard } from '@/components/domain-card'
import { HabitRow } from '@/components/habit-row'
import type { Profile, Habit, DomainProgress } from '@/types'

interface DashboardClientProps {
  profile: Profile
  habits: Habit[]
  completedIds: string[]
  domainProgress: DomainProgress[]
  totalXpToday: number
}

function getGreeting(nameHe: string, nameEn: string, name: string | null, isRTL: boolean) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? (isRTL ? nameHe : nameEn)
    : hour < 17 ? (isRTL ? 'צהריים טובים' : 'Good afternoon')
    : hour < 21 ? (isRTL ? 'ערב טוב' : 'Good evening')
    : (isRTL ? 'לילה טוב' : 'Good night')
  const displayName = name?.split(' ')[0] ?? ''
  return `${greeting}${displayName ? `, ${displayName}` : ''} 👋`
}

export function DashboardClient({
  profile,
  habits,
  completedIds,
  domainProgress,
  totalXpToday,
}: DashboardClientProps) {
  const { t, isRTL } = useLang()
  const completedSet = new Set(completedIds)
  const activeDomainsProgress = domainProgress.filter((d) => d.totalHabits > 0)
  const todayHabits = habits.filter((h) => h.frequency === 'daily')

  const greeting = getGreeting('בוקר טוב', 'Good morning', profile.full_name, isRTL)

  return (
    <div className="px-4 pt-12 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/50 text-sm mb-1">
            {new Date().toLocaleDateString(isRTL ? 'he-IL' : 'en-US', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
          <h1 className="text-xl font-bold text-white">{greeting}</h1>
        </div>
        <LangToggle />
      </div>

      {/* XP Bar */}
      <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
        <XPBar xp={profile.xp} />
        {totalXpToday > 0 && (
          <p className="text-xs text-emerald-400 mt-2">
            +{totalXpToday} {t('xp')} {isRTL ? 'היום' : 'today'}
          </p>
        )}
      </div>

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
  )
}
