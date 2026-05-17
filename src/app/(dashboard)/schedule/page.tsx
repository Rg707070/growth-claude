import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WEEKLY_SCHEDULE } from '@/lib/schedule'
import { SchedulePageClient } from './schedule-client'

// Returns the actual calendar date for a given day-of-week in the current week
function getWeekDate(dayOfWeek: number): string {
  const today = new Date()
  const diff  = dayOfWeek - today.getDay()
  const d     = new Date(today)
  d.setDate(today.getDate() + diff)
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

  // Build date strings for each day of current week (for one-time items)
  const weekDates = [0, 1, 2, 3, 4, 5, 6].map(getWeekDate)

  const [{ data: reflections }, { data: scheduleRows }, { data: checkRows }] = await Promise.all([
    supabase
      .from('schedule_reflections')
      .select('date, notes')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(60),
    supabase
      .from('user_schedule')
      .select('id, day_of_week, time, label, type, specific_date')
      .eq('user_id', user.id)
      .or(`specific_date.is.null,specific_date.in.(${weekDates.join(',')})`)
      .order('time'),
    supabase
      .from('activity_checks')
      .select('time, note')
      .eq('user_id', user.id)
      .eq('date', todayDate),
  ])

  // Group by day: recurring (specific_date=null) keyed by day_of_week,
  // one-time items keyed by their day_of_week derived from specific_date
  const userItems: Record<number, { id: string; time: string; label: string; type: string; specificDate: string | null }[]> = {}

  for (const row of scheduleRows ?? []) {
    let d: number
    if (row.specific_date) {
      // Map specific_date back to day-of-week for display
      d = new Date(row.specific_date + 'T12:00:00').getDay()
    } else {
      d = row.day_of_week as number
    }
    if (!userItems[d]) userItems[d] = []
    userItems[d].push({
      id:           row.id,
      time:         row.time,
      label:        row.label,
      type:         row.type,
      specificDate: row.specific_date ?? null,
    })
  }

  return (
    <SchedulePageClient
      userId={user.id}
      reflections={reflections ?? []}
      userItems={userItems}
      allItems={scheduleRows ?? []}
      todayChecks={(checkRows ?? []).map((r) => ({ time: r.time, note: r.note }))}
    />
  )
}
