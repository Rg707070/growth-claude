import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProgressClient } from './progress-client'
import { DOMAINS } from '@/lib/domains'
import type { Profile, Habit, HabitLog } from '@/types'

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 84 days = 12 weeks
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 83)
  const weekStart = startDate.toISOString().split('T')[0]

  const [profileRes, habitsRes, logsRes, weekLogsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('habits').select('*').eq('user_id', user.id).eq('is_active', true),
    supabase.from('habit_logs').select('completed_at, habit_id').eq('user_id', user.id).gte('completed_at', weekStart),
    supabase
      .from('habit_logs')
      .select('completed_at, habit_id')
      .eq('user_id', user.id)
      .gte('completed_at', new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]),
  ])

  const profile = (profileRes.data as Profile) ?? {
    id: user.id, full_name: null, xp: 0, current_streak: 0, longest_streak: 0, last_activity_date: null, created_at: new Date().toISOString(),
  }
  const habits = (habitsRes.data as Habit[]) ?? []
  const allLogs = (logsRes.data as { completed_at: string; habit_id: string }[]) ?? []
  const weekLogs = (weekLogsRes.data as { completed_at: string; habit_id: string }[]) ?? []

  // Build heat map: 84 days
  const logsByDay: Record<string, Set<string>> = {}
  for (const log of allLogs) {
    if (!logsByDay[log.completed_at]) logsByDay[log.completed_at] = new Set()
    logsByDay[log.completed_at].add(log.habit_id)
  }
  const totalHabits = habits.length || 1
  const heatMapDays = Array.from({ length: 84 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (83 - i))
    const date = d.toISOString().split('T')[0]
    const done = logsByDay[date]?.size ?? 0
    return { date, pct: Math.round((done / totalHabits) * 100) }
  })

  // Weekly activity (last 7 days)
  const countByDay: Record<string, number> = {}
  for (const log of weekLogs) {
    countByDay[log.completed_at] = (countByDay[log.completed_at] ?? 0) + 1
  }
  const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const date = d.toISOString().split('T')[0]
    return { date, count: countByDay[date] ?? 0 }
  })

  // Achievements data
  const domainSlugsWithHabits = [...new Set(habits.map((h) => h.domain_slug))]
  const torahHabits = habits.filter((h) => h.domain_slug === 'torah').map((h) => h.id)
  let torahStreak = 0
  for (let i = 0; i < 30; i++) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const date = d.toISOString().split('T')[0]
    const done = logsByDay[date]
    const allTorah = torahHabits.every((id) => done?.has(id))
    if (allTorah && torahHabits.length > 0) torahStreak++
    else break
  }

  // Best domain this week by count
  const domainCount: Record<string, number> = {}
  for (const log of weekLogs) {
    const h = habits.find((h) => h.id === log.habit_id)
    if (h) domainCount[h.domain_slug] = (domainCount[h.domain_slug] ?? 0) + 1
  }
  const topDomainSlug = Object.entries(domainCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
  const topDomain = DOMAINS.find((d) => d.slug === topDomainSlug)?.nameHe ?? ''

  const uniqueDaysWithLogs = new Set(weekLogs.map((l) => l.completed_at)).size
  const completionPct = Math.round((uniqueDaysWithLogs / 7) * 100)
  const habitsCompletedThisWeek = weekLogs.length

  return (
    <ProgressClient
      profile={profile}
      heatMapDays={heatMapDays}
      weeklyActivity={weeklyActivity}
      achievementData={{
        streak: profile.current_streak,
        habitCount: habits.length,
        domainSlugsWithHabits,
        torahStreak,
      }}
      weekSummary={{
        bestDomain: topDomain,
        streak: profile.current_streak,
        completionPct,
        habitCount: habits.length,
        topDomainSlug,
        habitsCompleted: habitsCompletedThisWeek,
      }}
    />
  )
}
