import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DOMAINS } from '@/lib/domains'
import { DashboardClient } from './dashboard-client'
import type { Profile, Habit, HabitLog, DomainProgress } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]

  // Build last 7 days date range
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  const weekStart = sevenDaysAgo.toISOString().split('T')[0]

  const [profileRes, habitsRes, logsRes, weekLogsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('habits').select('*').eq('user_id', user.id).eq('is_active', true),
    supabase.from('habit_logs').select('*').eq('user_id', user.id).eq('completed_at', today),
    supabase
      .from('habit_logs')
      .select('completed_at, habit_id')
      .eq('user_id', user.id)
      .gte('completed_at', weekStart),
  ])

  const profile = (profileRes.data as Profile) ?? {
    id: user.id,
    full_name: user.user_metadata?.full_name ?? null,
    xp: 0,
    current_streak: 0,
    longest_streak: 0,
    last_activity_date: null,
    created_at: new Date().toISOString(),
  }

  const habits = (habitsRes.data as Habit[]) ?? []
  const todayLogs = (logsRes.data as HabitLog[]) ?? []
  const weekLogs = (weekLogsRes.data as { completed_at: string; habit_id: string }[]) ?? []
  const completedIds = new Set(todayLogs.map((l) => l.habit_id))

  // Build xp-per-day for last 7 days
  const habitXpMap = Object.fromEntries(habits.map((h) => [h.id, h.xp_reward]))
  const xpByDay: Record<string, number> = {}
  for (const log of weekLogs) {
    xpByDay[log.completed_at] = (xpByDay[log.completed_at] ?? 0) + (habitXpMap[log.habit_id] ?? 10)
  }
  const weeklyXP = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toISOString().split('T')[0]
    return { date: dateStr, xp: xpByDay[dateStr] ?? 0 }
  })

  const domainProgress: DomainProgress[] = DOMAINS.map((domain) => {
    const domainHabits = habits.filter((h) => h.domain_slug === domain.slug)
    const completedToday = domainHabits.filter((h) => completedIds.has(h.id)).length
    const xpToday = domainHabits
      .filter((h) => completedIds.has(h.id))
      .reduce((sum, h) => sum + h.xp_reward, 0)
    return {
      domain,
      totalHabits: domainHabits.length,
      completedToday,
      streak: 0,
      xpToday,
    }
  })

  const totalXp = habits
    .filter((h) => completedIds.has(h.id))
    .reduce((sum, h) => sum + h.xp_reward, 0)

  return (
    <DashboardClient
      profile={profile}
      habits={habits}
      completedIds={[...completedIds]}
      domainProgress={domainProgress}
      totalXpToday={totalXp}
      weeklyXP={weeklyXP}
    />
  )
}
