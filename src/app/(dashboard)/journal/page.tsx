import { createClient } from '@/lib/supabase/server'
import { JournalClient } from './journal-client'
import type { DomainTask, DomainGoal } from '@/types/ecosystem'
import type { FamilyTask, FamilyEvent } from '@/types/family'

export interface DocMeta {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export default async function JournalPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const [docsRes, domainTasksRes, domainGoalsRes, familyTasksRes, familyEventsRes] = await Promise.all([
    supabase
      .from('journal_documents')
      .select('id, title, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),
    supabase
      .from('domain_tasks')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'done')
      .order('created_at', { ascending: false }),
    supabase
      .from('domain_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    supabase
      .from('family_tasks')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'done')
      .order('created_at', { ascending: false }),
    supabase
      .from('family_events')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'upcoming')
      .order('event_date', { ascending: true }),
  ])

  return (
    <JournalClient
      userId={user.id}
      documents={(docsRes.data ?? []) as DocMeta[]}
      domainTasks={(domainTasksRes.data ?? []) as DomainTask[]}
      domainGoals={(domainGoalsRes.data ?? []) as DomainGoal[]}
      familyTasks={(familyTasksRes.data ?? []) as FamilyTask[]}
      familyEvents={(familyEventsRes.data ?? []) as FamilyEvent[]}
    />
  )
}
