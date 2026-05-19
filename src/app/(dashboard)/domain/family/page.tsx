import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDomainBySlug } from '@/lib/domains'
import { FamilyClient } from './family-client'
import type { FamilyTask, FamilyHabit, RoutineBreaker } from '@/types/family'

export default async function FamilyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const domain = getDomainBySlug('family')!

  const [tasksRes, habitsRes, breakersRes] = await Promise.all([
    supabase
      .from('family_tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('family_habits')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true }),
    supabase
      .from('routine_breakers')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const tasks = (tasksRes.data as FamilyTask[]) ?? []
  const habits = (habitsRes.data as FamilyHabit[]) ?? []
  const breakers = (breakersRes.data as RoutineBreaker[]) ?? []
  const schemaReady = !tasksRes.error && !habitsRes.error && !breakersRes.error

  return (
    <FamilyClient
      domain={domain}
      userId={user.id}
      tasks={tasks}
      habits={habits}
      breakers={breakers}
      schemaReady={schemaReady}
    />
  )
}
