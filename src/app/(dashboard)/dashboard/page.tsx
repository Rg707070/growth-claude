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

  // Build habit-count-per-day for last 7 days
  const countByDay: Record<string, number> = {}
  for (const log of weekLogs) {
    countByDay[log.completed_at] = (countByDay[log.completed_at] ?? 0) + 1
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
    return {
      domain,
      totalHabits: domainHabits.length,
      completedToday,
      streak: 0,
    }
  })

  // Weekly XP — sum xp_reward for each completed habit this week
  const habitXpMap = new Map(habits.map((h) => [h.id, h.xp_reward]))
  const weekXP = weekLogs.reduce((sum, log) => sum + (habitXpMap.get(log.habit_id) ?? 0), 0)

  // Weekly challenge progress — computed per challenge type
  const CHALLENGE_TARGETS = [5, 7, 7, 8, 5]
  const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
  const challengeIndex = weekNum % CHALLENGE_TARGETS.length

  // Build per-day habit sets for this week
  const logsByDay: Record<string, Set<string>> = {}
  for (const log of weekLogs) {
    if (!logsByDay[log.completed_at]) logsByDay[log.completed_at] = new Set()
    logsByDay[log.completed_at].add(log.habit_id)
  }

  let challengeProgress = 0
  if (challengeIndex === 0) {
    // Days with ≥3 habits completed
    challengeProgress = Object.values(logsByDay).filter((s) => s.size >= 3).length
  } else if (challengeIndex === 1) {
    // Days where ALL sports habits were completed
    const sportsIds = habits.filter((h) => h.domain_slug === 'sports').map((h) => h.id)
    if (sportsIds.length === 0) {
      challengeProgress = 0
    } else {
      challengeProgress = Object.values(logsByDay).filter((s) =>
        sportsIds.every((id) => s.has(id))
      ).length
    }
  } else if (challengeIndex === 2) {
    // Days with at least one torah habit
    const torahIds = new Set(habits.filter((h) => h.domain_slug === 'torah').map((h) => h.id))
    challengeProgress = Object.values(logsByDay).filter((s) =>
      [...s].some((id) => torahIds.has(id))
    ).length
  } else if (challengeIndex === 3) {
    // Number of domains with at least 1 habit
    challengeProgress = new Set(habits.map((h) => h.domain_slug)).size
  } else {
    // Current streak (capped at target)
    challengeProgress = Math.min(profile.current_streak, CHALLENGE_TARGETS[4])
  }

  return (
    <DashboardClient
      profile={profile}
      habits={habits}
      completedIds={[...completedIds]}
      domainProgress={domainProgress}
      weeklyActivity={weeklyActivity}
      weekXP={weekXP}
      challengeProgress={challengeProgress}
    />
  )
}
