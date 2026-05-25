import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DOMAINS } from '@/lib/domains'
import { DashboardClient } from './dashboard-client'
import type { Habit, HabitLog, DomainProgress, DomainStats } from '@/types'

function computeDomainStats(
  completedDays: Set<string>,
  maxDays: number,
): { streak: number; failingDays: number } {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const limit = Math.min(maxDays, 14)

  let failingDays = 0
  for (let i = 0; i < limit; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (completedDays.has(d.toISOString().split('T')[0])) break
    failingDays++
  }

  const startFrom = completedDays.has(todayStr) ? 0 : 1
  let streak = 0
  for (let i = startFrom; i < limit; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (completedDays.has(d.toISOString().split('T')[0])) streak++
    else break
  }

  return { streak, failingDays }
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]

  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13)
  const twoWeeksStart = fourteenDaysAgo.toISOString().split('T')[0]

  const [profileRes, habitsRes, allHabitsRes, logsRes, allLogsRes] = await Promise.all([
    supabase.from('profiles').select('full_name, last_activity_date, created_at').eq('id', user.id).single(),
    supabase.from('habits').select('*').eq('user_id', user.id).eq('is_active', true),
    // All habits (incl. inactive) — needed to map old log entries to their domain
    supabase.from('habits').select('id, domain_slug').eq('user_id', user.id),
    supabase.from('habit_logs').select('*').eq('user_id', user.id).eq('completed_at', today),
    supabase
      .from('habit_logs')
      .select('completed_at, habit_id')
      .eq('user_id', user.id)
      .gte('completed_at', twoWeeksStart),
  ])

  const profile = (profileRes.data ?? {
    full_name: user.user_metadata?.full_name ?? null,
    last_activity_date: null,
    created_at: new Date().toISOString(),
  }) as { full_name: string | null; last_activity_date: string | null; created_at: string }

  // Cap failingDays to days since account creation so new users don't see false warnings
  const accountAgeDays = Math.max(
    1,
    Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86_400_000),
  )

  const habits = (habitsRes.data as Habit[]) ?? []
  const allHabits = (allHabitsRes.data as Pick<Habit, 'id' | 'domain_slug'>[]) ?? []
  const todayLogs = (logsRes.data as HabitLog[]) ?? []
  const allLogs = (allLogsRes.data as { completed_at: string; habit_id: string }[]) ?? []
  const completedIds = new Set(todayLogs.map((l) => l.habit_id))

  // Use ALL habits (including inactive) so historical logs still map to their domain
  const habitDomainMap: Record<string, string> = {}
  for (const h of allHabits) {
    habitDomainMap[h.id] = h.domain_slug
  }

  const domainCompletedDays: Record<string, Set<string>> = {}
  const countByDay: Record<string, number> = {}
  const allCompletedDays = new Set<string>()

  for (const log of allLogs) {
    // Truncate to date string defensively (handles both date and timestamp formats)
    const dateStr = log.completed_at.split('T')[0]
    countByDay[dateStr] = (countByDay[dateStr] ?? 0) + 1
    allCompletedDays.add(dateStr)
    const slug = habitDomainMap[log.habit_id]
    if (slug) {
      if (!domainCompletedDays[slug]) domainCompletedDays[slug] = new Set()
      domainCompletedDays[slug].add(dateStr)
    }
  }

  const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toISOString().split('T')[0]
    return { date: dateStr, count: countByDay[dateStr] ?? 0 }
  })

  const domainProgress: DomainProgress[] = DOMAINS.map((domain) => {
    const domainHabits = habits.filter((h) => h.domain_slug === domain.slug)
    const completedToday = domainHabits.filter((h) => completedIds.has(h.id)).length
    return { domain, totalHabits: domainHabits.length, completedToday }
  })

  const domainStats: DomainStats[] = DOMAINS.map((domain) => {
    const domainHabits = habits.filter((h) => h.domain_slug === domain.slug)
    if (domainHabits.length === 0) return { slug: domain.slug, streak: 0, failingDays: 0 }
    const completed = domainCompletedDays[domain.slug] ?? new Set<string>()
    return { slug: domain.slug, ...computeDomainStats(completed, accountAgeDays) }
  })

  const { streak: overallStreak } = computeDomainStats(allCompletedDays, accountAgeDays)

  return (
    <DashboardClient
      profile={{ id: user.id, ...profile }}
      habits={habits}
      completedIds={[...completedIds]}
      domainProgress={domainProgress}
      weeklyActivity={weeklyActivity}
      domainStats={domainStats}
      overallStreak={overallStreak}
    />
  )
}
