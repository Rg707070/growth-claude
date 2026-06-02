import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDomainBySlug } from '@/lib/domains'
import { FamilyClient } from './family-client'
import type { FamilyTask, FamilyHabit, FamilyEvent, FamilyTaskFolder } from '@/types/family'

export default async function FamilyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const domain = getDomainBySlug('family')!

  const [tasksRes, habitsRes, eventsRes, foldersRes] = await Promise.all([
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
      .from('family_events')
      .select('*')
      .eq('user_id', user.id)
      .order('event_date', { ascending: true }),
    supabase
      .from('family_task_folders')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true }),
  ])

  const tasks = (tasksRes.data as FamilyTask[]) ?? []
  const habits = (habitsRes.data as FamilyHabit[]) ?? []
  const events = (eventsRes.data as FamilyEvent[]) ?? []
  const folders = (foldersRes.data as FamilyTaskFolder[]) ?? []
  const schemaReady = !tasksRes.error && !habitsRes.error && !eventsRes.error

  return (
    <FamilyClient
      domain={domain}
      userId={user.id}
      tasks={tasks}
      habits={habits}
      events={events}
      folders={folders}
      schemaReady={schemaReady}
    />
  )
}
