import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDomainBySlug } from '@/lib/domains'
import { FamilyClient } from './family-client'
import type { FamilyTask, FamilyEvent } from '@/types/family'

export default async function FamilyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const domain = getDomainBySlug('family')!

  const [tasksRes, eventsRes] = await Promise.all([
    supabase
      .from('family_tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('family_events')
      .select('*')
      .eq('user_id', user.id)
      .order('event_date', { ascending: true }),
  ])

  const tasks = (tasksRes.data as FamilyTask[]) ?? []
  const events = (eventsRes.data as FamilyEvent[]) ?? []
  const schemaReady = !tasksRes.error && !eventsRes.error

  return (
    <FamilyClient
      domain={domain}
      userId={user.id}
      tasks={tasks}
      events={events}
      schemaReady={schemaReady}
    />
  )
}
