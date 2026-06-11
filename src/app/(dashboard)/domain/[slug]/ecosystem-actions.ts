'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  DomainTask,
  DomainTaskStatus,
  DomainTaskUrgency,
  DomainTaskFrequency,
  DomainGoal,
  DomainGoalStatus,
} from '@/types/ecosystem'

async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')
  return { supabase, user }
}

// ── Tasks ──────────────────────────────────────────────────────

export async function createDomainTask(
  slug: string,
  input: { title: string; category?: string; urgency?: DomainTaskUrgency; frequency?: DomainTaskFrequency }
): Promise<DomainTask> {
  const { supabase, user } = await getUser()
  const { data, error } = await supabase
    .from('domain_tasks')
    .insert({
      user_id: user.id,
      domain_slug: slug,
      title: input.title,
      category: input.category ?? 'other',
      urgency: input.urgency ?? 'normal',
      frequency: input.frequency ?? 'weekly',
    })
    .select()
    .single()
  if (error) throw error
  revalidatePath(`/domain/${slug}`)
  return data as DomainTask
}

export async function updateDomainTaskStatus(
  taskId: string,
  slug: string,
  status: DomainTaskStatus
): Promise<void> {
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('domain_tasks')
    .update({ status })
    .eq('id', taskId)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath(`/domain/${slug}`)
}

export async function scheduleDomainTask(
  taskId: string,
  slug: string,
  dueDate: string | null
): Promise<void> {
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('domain_tasks')
    .update({ due_date: dueDate })
    .eq('id', taskId)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath(`/domain/${slug}`)
  revalidatePath('/calendar')
  revalidatePath('/schedule')
}

export async function deleteDomainTask(taskId: string, slug: string): Promise<void> {
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('domain_tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath(`/domain/${slug}`)
}

// ── Goals ──────────────────────────────────────────────────────

export async function createDomainGoal(
  slug: string,
  input: { title: string; type?: string; status?: DomainGoalStatus }
): Promise<DomainGoal> {
  const { supabase, user } = await getUser()
  const { data, error } = await supabase
    .from('domain_goals')
    .insert({
      user_id: user.id,
      domain_slug: slug,
      title: input.title,
      type: input.type ?? 'other',
      status: input.status ?? 'active',
    })
    .select()
    .single()
  if (error) throw error
  revalidatePath(`/domain/${slug}`)
  return data as DomainGoal
}

export async function updateDomainGoalStatus(
  goalId: string,
  slug: string,
  status: DomainGoalStatus
): Promise<void> {
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('domain_goals')
    .update({ status })
    .eq('id', goalId)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath(`/domain/${slug}`)
}

export async function deleteDomainGoal(goalId: string, slug: string): Promise<void> {
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('domain_goals')
    .delete()
    .eq('id', goalId)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath(`/domain/${slug}`)
}
