import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CalendarClient } from './calendar-client'
import type { Habit, HabitLog } from '@/types'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const threeMonthsAgo = new Date(now)
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const startDate = threeMonthsAgo.toISOString().split('T')[0]

  const [habitsRes, logsRes] = await Promise.all([
    supabase.from('habits').select('id, name, domain_slug, is_active').eq('user_id', user.id),
    supabase
      .from('habit_logs')
      .select('habit_id, completed_at')
      .eq('user_id', user.id)
      .gte('completed_at', startDate),
  ])

  const habits = (habitsRes.data as Pick<Habit, 'id' | 'name' | 'domain_slug' | 'is_active'>[]) ?? []
  const logs = (logsRes.data as Pick<HabitLog, 'habit_id' | 'completed_at'>[]) ?? []

  return <CalendarClient habits={habits} logs={logs} />
}
