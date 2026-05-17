import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SchedulePageClient } from './schedule-client'

export default async function SchedulePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const todayDate = new Date().toISOString().split('T')[0]

  const [{ data: reflections }, { data: scheduleRows }, { data: checkRows }] = await Promise.all([
    supabase
      .from('schedule_reflections')
      .select('date, notes')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(60),
    supabase
      .from('user_schedule')
      .select('day_of_week, time, label, type')
      .eq('user_id', user.id)
      .order('time'),
    supabase
      .from('activity_checks')
      .select('time, note')
      .eq('user_id', user.id)
      .eq('date', todayDate),
  ])

  const userItems: Record<number, { time: string; label: string; type: string }[]> = {}
  for (const row of scheduleRows ?? []) {
    const d = row.day_of_week as number
    if (!userItems[d]) userItems[d] = []
    userItems[d].push({ time: row.time, label: row.label, type: row.type })
  }

  return (
    <SchedulePageClient
      userId={user.id}
      reflections={reflections ?? []}
      userItems={userItems}
      todayChecks={(checkRows ?? []).map((r) => ({ time: r.time, note: r.note }))}
    />
  )
}
