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
  const habitXpMap = Object.fromEntries(habits.map((h) => [h.id, h.xp_reward]))
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

  // Weekly XP (last 7 days)
  const xpByDay: Record<string, number> = {}
  for (const log of weekLogs) {
    xpByDay[log.completed_at] = (xpByDay[log.completed_at] ?? 0) + (habitXpMap[log.habit_id] ?? 10)
  }
  const weeklyXP = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const date = d.toISOString().split('T')[0]
    return { date, xp: xpByDay[date] ?? 0 }
  })

  // Achievements data
  const domainSlugsWithHabits = [...new Set(habits.map((h) => h.domain_slug))]
  const torahHabits = habits.filter((h) => h.domain_slug === 'torah').map((h) => h.id)
  // torah streak: consecutive days all torah habits completed — simplified: check recent days
  let torahStreak = 0
  for (let i = 0; i < 30; i++) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const date = d.toISOString().split('T')[0]
    const done = logsByDay[date]
    const allTorah = torahHabits.every((id) => done?.has(id))
    if (allTorah && torahHabits.length > 0) torahStreak++
    else break
  }

  const maxXpInDay = Math.max(...Object.values(xpByDay), 0)
  const weekXPTotal = weekLogs.reduce((s, l) => s + (habitXpMap[l.habit_id] ?? 10), 0)

  // Best domain this week
  const domainXP: Record<string, number> = {}
  for (const log of weekLogs) {
    const h = habits.find((h) => h.id === log.habit_id)
    if (h) domainXP[h.domain_slug] = (domainXP[h.domain_slug] ?? 0) + h.xp_reward
  }
  const topDomainSlug = Object.entries(domainXP).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
  const topDomain = DOMAINS.find((d) => d.slug === topDomainSlug)?.nameHe ?? ''

  // Completion pct this week
  const uniqueDaysWithLogs = new Set(weekLogs.map((l) => l.completed_at)).size
  const completionPct = Math.round((uniqueDaysWithLogs / 7) * 100)

  // Habits completed this week count
  const habitsCompletedThisWeek = weekLogs.length

  return (
    <ProgressClient
      profile={profile}
      heatMapDays={heatMapDays}
      weeklyXP={weeklyXP}
      achievementData={{
        xp: profile.xp,
        streak: profile.current_streak,
        habitCount: habits.length,
        domainSlugsWithHabits,
        torahStreak,
        maxXpInDay,
      }}
      weekSummary={{
        totalXP: weekXPTotal,
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
