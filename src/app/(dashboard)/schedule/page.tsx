import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WEEKLY_SCHEDULE } from '@/lib/schedule'
import { DOMAINS } from '@/lib/domains'
import { SchedulePageClient } from './schedule-client'
import type { Habit } from '@/types'

function getWeekDate(dayOfWeek: number): string {
  const today = new Date()
  const d     = new Date(today)
  d.setDate(today.getDate() + (dayOfWeek - today.getDay()))
  return d.toISOString().split('T')[0]
}

export default async function SchedulePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const todayDate = new Date().toISOString().split('T')[0]

  // Seed user_schedule from hardcoded data on first use
  const { count } = await supabase
    .from('user_schedule')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('specific_date', null)

  if (count === 0) {
    const seedRows = Object.entries(WEEKLY_SCHEDULE).flatMap(([day, items]) =>
      items.map((item, i) => ({
        user_id:       user.id,
        day_of_week:   parseInt(day),
        time:          item.time,
        label:         item.label,
        type:          item.type,
        sort_order:    i,
        specific_date: null,
      }))
    )
    await supabase.from('user_schedule').insert(seedRows)
  }

  const weekDates = [0, 1, 2, 3, 4, 5, 6].map(getWeekDate)

  const heatMapStartDate = new Date()
  heatMapStartDate.setDate(heatMapStartDate.getDate() - 364)
  const heatMapStart = heatMapStartDate.toISOString().split('T')[0]
  const weekStart    = new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0]

  const [
    { data: reflections },
    { data: scheduleRows },
    { data: checkRows },
    profileRes,
    habitsRes,
    logsRes,
    weekLogsRes,
    activityChecksRes,
    scheduledHabitsRes,
    todayHabitLogsRes,
  ] = await Promise.all([
    supabase.from('schedule_reflections').select('date, notes').eq('user_id', user.id).order('date', { ascending: false }).limit(60),
    supabase.from('user_schedule').select('id, day_of_week, time, label, type, color, specific_date').eq('user_id', user.id).or(`specific_date.is.null,specific_date.in.(${weekDates.join(',')})`).order('time'),
    supabase.from('activity_checks').select('time, note').eq('user_id', user.id).eq('date', todayDate),
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    supabase.from('habits').select('id, domain_slug, frequency, is_active').eq('user_id', user.id).eq('is_active', true),
    supabase.from('habit_logs').select('completed_at, habit_id').eq('user_id', user.id).gte('completed_at', heatMapStart),
    supabase.from('habit_logs').select('completed_at, habit_id').eq('user_id', user.id).gte('completed_at', weekStart),
    supabase.from('activity_checks').select('date, time').eq('user_id', user.id).gte('date', weekStart),
    supabase.from('habits').select('id, name, domain_slug, schedule_time').eq('user_id', user.id).eq('is_active', true).not('schedule_time', 'is', null),
    supabase.from('habit_logs').select('habit_id').eq('user_id', user.id).eq('completed_at', todayDate),
  ])

  // Group schedule items by day
  const userItems: Record<number, { id: string; time: string; label: string; type: string; color?: string | null; specificDate: string | null }[]> = {}
  for (const row of scheduleRows ?? []) {
    const d = row.specific_date
      ? new Date(row.specific_date + 'T12:00:00').getDay()
      : (row.day_of_week as number)
    if (!userItems[d]) userItems[d] = []
    userItems[d].push({ id: row.id, time: row.time, label: row.label, type: row.type, color: (row.color as string | null) ?? null, specificDate: row.specific_date ?? null })
  }

  const habits  = (habitsRes.data  as Pick<Habit, 'id' | 'domain_slug' | 'frequency' | 'is_active'>[]) ?? []
  const allLogs = (logsRes.data    as { completed_at: string; habit_id: string }[]) ?? []
  const weekLogs = (weekLogsRes.data as { completed_at: string; habit_id: string }[]) ?? []

  // Heat map: 84 days
  const logsByDay: Record<string, Set<string>> = {}
  for (const log of allLogs) {
    if (!logsByDay[log.completed_at]) logsByDay[log.completed_at] = new Set()
    logsByDay[log.completed_at].add(log.habit_id)
  }
  const totalHabits = habits.length || 1
  const heatMapDays = Array.from({ length: 365 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (364 - i))
    const date = d.toISOString().split('T')[0]
    return { date, pct: Math.round(((logsByDay[date]?.size ?? 0) / totalHabits) * 100) }
  })

  // Weekly activity
  const countByDay: Record<string, number> = {}
  for (const log of weekLogs) countByDay[log.completed_at] = (countByDay[log.completed_at] ?? 0) + 1
  const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const date = d.toISOString().split('T')[0]
    return { date, count: countByDay[date] ?? 0 }
  })

  // Best domain this week
  const domainCount: Record<string, number> = {}
  for (const log of weekLogs) {
    const h = habits.find((hab) => hab.id === log.habit_id)
    if (h) domainCount[h.domain_slug] = (domainCount[h.domain_slug] ?? 0) + 1
  }
  const topDomainSlug = Object.entries(domainCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
  const topDomain     = DOMAINS.find((d) => d.slug === topDomainSlug)?.nameHe ?? ''

  const uniqueDays    = new Set(weekLogs.map((l) => l.completed_at)).size
  const completionPct = Math.round((uniqueDays / 7) * 100)

  // Weekly schedule checks
  const rawActivityChecks = (activityChecksRes.data ?? []) as { date: string; time: string }[]
  const activityChecksByDay: Record<string, number> = {}
  for (const c of rawActivityChecks) activityChecksByDay[c.date] = (activityChecksByDay[c.date] ?? 0) + 1
  const weeklyScheduleChecks = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const date = d.toISOString().split('T')[0]
    return { date, count: activityChecksByDay[date] ?? 0 }
  })

  const scheduledHabits = (scheduledHabitsRes.data ?? []) as { id: string; name: string; domain_slug: string; schedule_time: string }[]
  const todayCompletedHabitIds: string[] = (todayHabitLogsRes.data ?? []).map((r: { habit_id: string }) => r.habit_id)

  return (
    <SchedulePageClient
      userId={user.id}
      reflections={reflections ?? []}
      userItems={userItems}
      allItems={scheduleRows ?? []}
      todayChecks={(checkRows ?? []).map((r: { time: string; note: string | null }) => ({ time: r.time, note: r.note }))}
      heatMapDays={heatMapDays}
      weeklyActivity={weeklyActivity}
      weekSummary={{
        bestDomain: topDomain,
        completionPct,
        habitCount: habits.length,
        topDomainSlug,
        habitsCompleted: weekLogs.length,
      }}
      weeklyScheduleChecks={weeklyScheduleChecks}
      scheduledHabits={scheduledHabits}
      todayCompletedHabitIds={todayCompletedHabitIds}
    />
  )
}
