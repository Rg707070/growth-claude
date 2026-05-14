import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WEEKLY_SCHEDULE, DAY_NAMES_HE } from '@/lib/schedule'
import { SchedulePageClient } from './schedule-client'

export interface ScheduleRow {
  id: string
  day_of_week: number
  time: string
  label: string
  type: string
  sort_order: number
}

export default async function SchedulePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('user_schedule')
    .select('*')
    .eq('user_id', user.id)
    .order('day_of_week')
    .order('sort_order')

  let rows = (data as ScheduleRow[]) ?? []

  // First visit — seed from default schedule
  if (rows.length === 0) {
    const toInsert = Object.entries(WEEKLY_SCHEDULE).flatMap(([day, items]) =>
      items.map((item, idx) => ({
        user_id: user.id,
        day_of_week: Number(day),
        time: item.time,
        label: item.label,
        type: item.type,
        sort_order: idx,
      }))
    )
    await supabase.from('user_schedule').insert(toInsert)
    const { data: fresh } = await supabase
      .from('user_schedule')
      .select('*')
      .eq('user_id', user.id)
      .order('day_of_week')
      .order('sort_order')
    rows = (fresh as ScheduleRow[]) ?? []
  }

  // Group by day
  const byDay: Record<number, ScheduleRow[]> = {}
  for (let d = 0; d <= 6; d++) byDay[d] = []
  for (const row of rows) byDay[row.day_of_week]?.push(row)

  return <SchedulePageClient byDay={byDay} userId={user.id} dayNames={DAY_NAMES_HE} />
}
