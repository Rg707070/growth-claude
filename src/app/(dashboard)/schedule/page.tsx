import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WEEKLY_SCHEDULE } from '@/lib/schedule'
import { SchedulePageClient } from './schedule-client'

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
    const { error: seedError } = await supabase.from('user_schedule').insert(seedRows)
    if (seedError) console.error('schedule seed failed', seedError)
  }

  const weekDates = [0, 1, 2, 3, 4, 5, 6].map(getWeekDate)

  const [
    { data: scheduleRows },
    { data: checkRows },
    scheduledHabitsRes,
    allHabitsRes,
    weekHabitLogsRes,
    weekActivityChecksRes,
  ] = await Promise.all([
    supabase
      .from('user_schedule')
      .select('id, day_of_week, time, label, type, color, specific_date')
      .eq('user_id', user.id)
      .or(`specific_date.is.null,specific_date.in.(${weekDates.join(',')})`)
      .order('time'),
    supabase
      .from('activity_checks')
      .select('time, note')
      .eq('user_id', user.id)
      .eq('date', todayDate),
    supabase
      .from('habits')
      .select('id, name, domain_slug, schedule_time')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .not('schedule_time', 'is', null),
    supabase
      .from('habits')
      .select('id, name, domain_slug, frequency, schedule_time')
      .eq('user_id', user.id)
      .eq('is_active', true),
    supabase
      .from('habit_logs')
      .select('habit_id, completed_at')
      .eq('user_id', user.id)
      .in('completed_at', weekDates),
    supabase
      .from('activity_checks')
      .select('date, time')
      .eq('user_id', user.id)
      .in('date', weekDates),
  ])

  const userItems: Record<number, { id: string; time: string; label: string; type: string; color?: string | null; specificDate: string | null }[]> = {}
  for (const row of scheduleRows ?? []) {
    const d = row.specific_date
      ? new Date(row.specific_date + 'T12:00:00').getDay()
      : (row.day_of_week as number)
    if (!userItems[d]) userItems[d] = []
    userItems[d].push({ id: row.id, time: row.time, label: row.label, type: row.type, color: (row.color as string | null) ?? null, specificDate: row.specific_date ?? null })
  }

  const scheduledHabits = (scheduledHabitsRes.data ?? []) as { id: string; name: string; domain_slug: string; schedule_time: string }[]
  const todayCompletedHabitIds: string[] = (weekHabitLogsRes.data ?? [])
    .filter((r: { habit_id: string; completed_at: string }) => r.completed_at === todayDate)
    .map((r: { habit_id: string }) => r.habit_id)

  type HabitForCalendar = { id: string; name: string; domain_slug: string; frequency: 'daily' | 'weekly'; schedule_time: string | null }
  type HabitLogEntry    = { habit_id: string; completed_at: string }
  type ActivityCheckEntry = { date: string; time: string }

  const allHabits         = (allHabitsRes.data ?? []) as HabitForCalendar[]
  const weekHabitLogs     = (weekHabitLogsRes.data ?? []) as HabitLogEntry[]
  const weekActivityChecks = (weekActivityChecksRes.data ?? []) as ActivityCheckEntry[]

  return (
    <SchedulePageClient
      userId={user.id}
      userItems={userItems}
      allItems={scheduleRows ?? []}
      todayChecks={(checkRows ?? []).map((r: { time: string; note: string | null }) => ({ time: r.time, note: r.note }))}
      scheduledHabits={scheduledHabits}
      todayCompletedHabitIds={todayCompletedHabitIds}
      allHabits={allHabits}
      weekHabitLogs={weekHabitLogs}
      weekActivityChecks={weekActivityChecks}
    />
  )
}
